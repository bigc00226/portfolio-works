/*
 * Real EC-CUBE (4.3 and 2) running on this machine for the EC-CUBE videos — PHP 8.3 compiled to WebAssembly
 * (@php-wasm/node: nothing is installed on the system, no PHP / database server). SQLite is the database.
 *
 * Setup (once; outside this project, so the 100 MB of PHP builds stay out of it):
 *   ../eccube-local/runner      npm install @php-wasm/node@3.1.65 @php-wasm/universal@3.1.65
 *   ../eccube-local/inst/base   EC-CUBE 4.3.1-p1 (official zip, sha256 checked), installed by `node tools/eccube/runtime.js install4 <dir>`
 *   ../eccube-local/src2w/ec-cube2   EC-CUBE 2 (GitHub release eccube2-weekly-20261110 — the first builds with SQLite3 support)
 *   (ECCUBE_LOCAL=<folder> to use another place)
 *
 *   node tools/eccube/runtime.js instance <id> [4|2]     makes ../eccube-local/inst/<id> (a copy of the installed base) — prints its folder
 *   node tools/eccube/runtime.js serve <dir> [port]      serves it: front at /, admin at /admin/ (admin / password)
 *   node tools/eccube/runtime.js console <dir> <args…>   EC-CUBE 4's bin/console (eccube:plugin:install --code=… …)
 *   node tools/eccube/runtime.js php <dir> <file.php>    runs a PHP file (EC-CUBE's folder as working directory)
 *   node tools/eccube/runtime.js install4 <dir> | install2 <dir> <url>   fresh installs (normally done once for the bases)
 *
 * As a module (tools/eccube/capture.js uses it): instance(), serve() → { url, run(code), php(code, data), close() }, consoleRun(), runPhp().
 * Notes on running EC-CUBE this way (all handled here):
 *   - EC-CUBE 4's installer runs its steps as sub-processes (proc_open): the steps are run one by one instead
 *   - the bundled Api42 plugin makes an OAuth2 key pair with openssl_pkey_new() on the first boot, which WebAssembly's OpenSSL
 *     cannot (no openssl.cnf): the same kind of pair (RSA 4096) is made with Node's crypto before
 *   - EC-CUBE 2's pages require '../require.php' relative to themselves: each page runs in its own folder, as under Apache
 *   - one PHP request at a time (one PHP instance); a folder URL of EC-CUBE 2 is its index.php
 *   - EC-CUBE 3 (a copy you make yourself, e.g. for a 3 → 4 data migration): detected by html/index.php, served with PHP 7.4,
 *     html/ as document root and html/index.php as front controller; consoleRun() runs its app/console
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const REPO = path.resolve(__dirname, '../..');
const LOCAL = path.resolve(process.env.ECCUBE_LOCAL || path.join(REPO, '..', 'eccube-local'));
const MODULES = path.join(LOCAL, 'runner', 'node_modules');
const need = (m) => {
  try { return require(require.resolve(m, { paths: [MODULES] })); } catch (e) {
    throw new Error(`${m} がありません。${path.join(LOCAL, 'runner')} で npm install @php-wasm/node@3.1.65 @php-wasm/universal@3.1.65 を実行してください（${e.message.split('\n')[0]}）`);
  }
};
const { PHP, PHPRequestHandler, setPhpIniEntries } = need('@php-wasm/universal');
const { loadNodeRuntime, createNodeFsMountHandler } = need('@php-wasm/node');

const ROOT = '/srv/eccube';
const BASE4 = path.join(LOCAL, 'inst', 'base');
const SRC2 = path.join(LOCAL, 'src2w', 'ec-cube2');
let pid = 1;
const INI = { memory_limit: '1024M', 'date.timezone': 'Asia/Tokyo', max_execution_time: '0', display_errors: '0', log_errors: '1', error_log: ROOT + '/var/log/php-wasm.log', 'opcache.enable': '1', 'opcache.enable_cli': '1', 'session.save_path': ROOT + '/var/sessions' };

/** EC-CUBE 2 (data/class …) or 4 (src/Eccube …) */
const isV2 = (dir) => fs.existsSync(path.join(dir, 'data', 'class')) && !fs.existsSync(path.join(dir, 'src', 'Eccube'));
/** EC-CUBE 3 (html/index.php is the front controller, app/console; runs on PHP 7.4) */
const isV3 = (dir) => fs.existsSync(path.join(dir, 'src', 'Eccube')) && fs.existsSync(path.join(dir, 'html', 'index.php')) && !fs.existsSync(path.join(dir, 'index.php'));
/** the PHP a copy of EC-CUBE runs on: 7.4 for EC-CUBE 3, else 8.3 (o.php overrides) */
const phpFor = (dir, o = {}) => String(o.php || (isV3(dir) ? '7.4' : '8.3'));

async function newPHP(dir, version = phpFor(dir)) {
  // PHP's error log and sessions (for EC-CUBE 2 this var/ is outside its document root html/)
  for (const d of ['log', 'sessions']) fs.mkdirSync(path.join(dir, 'var', d), { recursive: true });
  const php = new PHP(await loadNodeRuntime(version, { extensions: ['intl'], emscriptenOptions: { processId: pid++ } }));
  php.mkdir(ROOT);
  await php.mount(ROOT, createNodeFsMountHandler(path.resolve(dir)));
  await setPhpIniEntries(php, INI);
  php.chdir(ROOT);
  return php;
}

/**
 * the copy's .env as plain variables. EC-CUBE 4's bin/console loads .env only when APP_ENV is not set, and the CLI here
 * has to set APP_ENV — so everything in .env (DATABASE_URL …) is passed along, or database commands find no tables
 */
function dotenvOf(dir) {
  const f = path.join(dir, '.env');
  if (!fs.existsSync(f)) return {};
  const out = {};
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m || line.trim().startsWith('#')) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
  return out;
}

/** EC-CUBE 4's bin/console in a fresh PHP (the CLI uses up the instance) → { code, out, err } */
async function consoleRun(dir, args, env = {}) {
  const php = await newPHP(dir);
  // EC-CUBE 4: bin/console · EC-CUBE 3: app/console
  const bin = isV3(dir) ? `${ROOT}/app/console` : `${ROOT}/bin/console`;
  const r = await php.cli(['php', bin, ...args], { env: { APP_ENV: 'prod', ...dotenvOf(dir), ...env }, cwd: ROOT });
  const [out, err, code] = await Promise.all([r.stdoutText, r.stderrText, r.exitCode]);
  try { php.exit(); } catch (e) { /* done */ }
  return { code, out, err };
}

/** a PHP file (or PHP code starting with <?php) on the CLI, EC-CUBE's folder as working directory → { code, out, err } */
async function runPhp(dir, fileOrCode, env = {}) {
  const php = await newPHP(dir);
  const code = !/^<\?php/.test(fileOrCode) && fs.existsSync(fileOrCode) ? fs.readFileSync(fileOrCode, 'utf8') : fileOrCode;
  const name = `run-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.php`;
  php.writeFile(`${ROOT}/var/${name}`, code);
  const r = await php.cli(['php', `${ROOT}/var/${name}`], { env: { APP_ENV: 'prod', ...dotenvOf(dir), ...env }, cwd: ROOT });
  const [out, err, exit] = await Promise.all([r.stdoutText, r.stderrText, r.exitCode]);
  try { fs.unlinkSync(path.join(dir, 'var', name)); } catch (e) { /* gone */ }
  try { php.exit(); } catch (e) { /* done */ }
  return { code: exit, out, err };
}

/** EC-CUBE 4: the installer's steps (src/Eccube/Command/InstallerCommand.php), one PHP run each */
async function install4(dir, o = {}) {
  const env = {
    APP_ENV: 'prod', APP_DEBUG: '0',
    DATABASE_URL: `sqlite:///${ROOT}/var/eccube.db`, DATABASE_SERVER_VERSION: '3', DATABASE_CHARSET: 'utf8',
    MAILER_DSN: 'null://null', ECCUBE_AUTH_MAGIC: o.authMagic || crypto.randomBytes(16).toString('hex'),
    ECCUBE_ADMIN_ROUTE: o.adminRoute || 'admin', ECCUBE_TEMPLATE_CODE: 'default', ECCUBE_LOCALE: 'ja', ECCUBE_TIMEZONE: 'Asia/Tokyo', ECCUBE_CURRENCY: 'JPY',
    TRUSTED_HOSTS: '^127\\.0\\.0\\.1$,^localhost$',
  };
  let dotenv = fs.readFileSync(path.join(dir, '.env.dist'), 'utf8');
  for (const [k, v] of Object.entries(env)) {
    const re = new RegExp(`^#?\\s*${k}=.*$`, 'm');
    dotenv = re.test(dotenv) ? dotenv.replace(re, () => `${k}=${v}`) : dotenv + `\n${k}=${v}`;
  }
  fs.writeFileSync(path.join(dir, '.env'), dotenv);
  const oauth = path.join(dir, 'app', 'PluginData', 'Api42', 'oauth');
  if (fs.existsSync(path.join(dir, 'app', 'Plugin', 'Api42')) && !fs.existsSync(path.join(oauth, 'private.key'))) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 4096, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } });
    fs.mkdirSync(oauth, { recursive: true });
    fs.writeFileSync(path.join(oauth, 'private.key'), privateKey);
    fs.writeFileSync(path.join(oauth, 'public.key'), publicKey);
  }
  fs.rmSync(path.join(dir, 'var', 'cache'), { recursive: true, force: true });
  for (const args of [['doctrine:database:create'], ['doctrine:schema:create'], ['eccube:fixtures:load'], ['cache:clear', '--no-warmup']]) {
    const t0 = Date.now();
    const r = await consoleRun(dir, args, env);
    console.log(`[install4] ${args.join(' ')} → ${r.code} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
    if (r.code !== 0) { console.log(r.out.slice(-2000), r.err.slice(-2000)); throw new Error('install step failed: ' + args.join(' ')); }
  }
  return env;
}

// EC-CUBE 2's eccube_install.sh: its sequence tables, and the admin password hash ("password") with the script's AUTH_MAGIC
const SEQ2 = ['dtb_best_products_best_id_seq', 'dtb_category_category_id_seq', 'dtb_class_class_id_seq', 'dtb_classcategory_classcategory_id_seq', 'dtb_csv_sql_sql_id_seq',
  'dtb_customer_customer_id_seq', 'dtb_deliv_deliv_id_seq', 'dtb_holiday_holiday_id_seq', 'dtb_kiyaku_kiyaku_id_seq', 'dtb_mail_history_send_id_seq', 'dtb_maker_maker_id_seq',
  'dtb_member_member_id_seq', 'dtb_module_update_logs_log_id_seq', 'dtb_news_news_id_seq', 'dtb_order_order_id_seq', 'dtb_order_detail_order_detail_id_seq',
  'dtb_other_deliv_other_deliv_id_seq', 'dtb_payment_payment_id_seq', 'dtb_products_class_product_class_id_seq', 'dtb_products_product_id_seq', 'dtb_review_review_id_seq',
  'dtb_send_history_send_id_seq', 'dtb_mailmaga_template_template_id_seq', 'dtb_plugin_plugin_id_seq', 'dtb_plugin_hookpoint_plugin_hookpoint_id_seq',
  'dtb_api_config_api_config_id_seq', 'dtb_api_account_api_account_id_seq', 'dtb_tax_rule_tax_rule_id_seq'];
const ADMINPASS2 = 'f6b126507a5d00dbdbb0f326fe855ddf84facd57c5603ffdf7e08fbb46bd633c';
const AUTH_MAGIC2 = 'droucliuijeanamiundpnoufrouphudrastiokec';

/**
 * EC-CUBE 2 on SQLite3: the steps of eccube_install.sh (sqlite3) in PHP — tables, initial data, sequence tables, the
 * admin member (admin / password), shop info, data/config/config.php, sample images; then html/install is removed
 * (as EC-CUBE asks after installing).  url: the shop's address (HTTP_URL — EC-CUBE 2 writes it into every link)
 */
async function install2(dir, url, o = {}) {
  url = String(url).replace(/\/?$/, '/');
  const adminDir = o.adminDir || 'admin/';
  const lines = [
    '<?php',
    `$root = '${ROOT}';`,
    "$db = $root . '/data/eccube.db';",
    '@unlink($db);',
    "$pdo = new PDO('sqlite:' . $db);",
    '$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);',
    "$pdo->exec(file_get_contents($root . '/html/install/sql/create_table_sqlite3.sql'));",
    "$pdo->exec(str_replace(chr(96), '', file_get_contents($root . '/html/install/sql/insert_data.sql')));",
    `foreach (${JSON.stringify(SEQ2)} as $s) {`,
    '  $pdo->exec("CREATE TABLE IF NOT EXISTS $s (sequence INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)");',
    '  $pdo->exec("INSERT INTO $s (sequence) VALUES (9999)");',
    '  $pdo->exec("DELETE FROM $s");',
    '}',
    `$pdo->exec("INSERT INTO dtb_member (member_id, login_id, password, name, salt, work, del_flg, authority, creator_id, rank, update_date) VALUES (2, 'admin', '${ADMINPASS2}', '管理者', '${AUTH_MAGIC2}', '1', '0', '0', '0', '1', current_timestamp)");`,
    `$pdo->exec("INSERT INTO dtb_baseinfo (id, shop_name, email01, email02, email03, email04, top_tpl, product_tpl, detail_tpl, mypage_tpl, update_date) VALUES (1, 'EC-CUBE SHOP', 'admin@example.com', 'admin@example.com', 'admin@example.com', 'admin@example.com', 'default1', 'default1', 'default1', 'default1', current_timestamp)");`,
    "echo 'tables: ', $pdo->query(\"SELECT count(*) FROM sqlite_master WHERE type='table'\")->fetchColumn(), PHP_EOL;",
  ];
  const r = await runPhp(dir, lines.join('\n') + '\n');
  if (r.code !== 0) { console.log(r.out, r.err); throw new Error('EC-CUBE 2 install failed'); }
  console.log('[install2]', r.out.trim());
  const def = (k, v) => `SC_Initial_Ex::defineIfNotDefined('${k}', ${v});`;
  const q = (v) => `'${v}'`;
  fs.writeFileSync(path.join(dir, 'data', 'config', 'config.php'), ['<?php',
    def('ECCUBE_INSTALL', q('ON')), def('HTTP_URL', q(url)), def('HTTPS_URL', q(url)), def('ROOT_URLPATH', q('/')), def('DOMAIN_NAME', q('')),
    def('DB_TYPE', q('sqlite3')), def('DB_USER', q('')), def('DB_PASSWORD', q('')), def('DB_SERVER', q('')), def('DB_NAME', q(ROOT + '/data/eccube.db')), def('DB_PORT', q('')),
    def('ADMIN_DIR', q(adminDir)), def('ADMIN_FORCE_SSL', 'FALSE'), def('ADMIN_ALLOW_HOSTS', q('a:0:{}')), def('AUTH_MAGIC', q(AUTH_MAGIC2)),
    def('PASSWORD_HASH_ALGOS', 'PASSWORD_DEFAULT'), def('MAIL_BACKEND', q('mail')), def('SMTP_HOST', q('127.0.0.1')), def('SMTP_PORT', q('1025')),
    def('SMTP_USER', q('')), def('SMTP_PASSWORD', q('')), '', ''].join('\n'));
  fs.cpSync(path.join(dir, 'html', 'install', 'save_image'), path.join(dir, 'html', 'upload', 'save_image'), { recursive: true });
  fs.rmSync(path.join(dir, 'html', 'install'), { recursive: true, force: true });
  return { url, adminDir };
}

/** a fixed port per instance (EC-CUBE 2 writes its address into its config, so it has to stay the same) */
const portFor = (id) => 8900 + (parseInt(crypto.createHash('md5').update(id).digest('hex').slice(0, 6), 16) % 90);

/** copies a folder fast (robocopy, 16 threads) */
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  const r = spawnSync('robocopy', [src, dst, '/MIR', '/MT:16', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1'], { stdio: 'ignore' });
  if (r.status == null || r.status >= 8) throw new Error(`robocopy ${src} → ${dst} failed (${r.status})`);
}

/**
 * the EC-CUBE of a video: ../eccube-local/inst/<id>, made on first use from the installed base (4) or a fresh EC-CUBE 2
 *   fresh: true  starts over from the base (throws the video's changes away)
 * → { dir, version, port }
 */
async function instance(id, o = {}) {
  const version = String(o.version || 4);
  const dir = path.join(LOCAL, 'inst', id);
  const port = o.port || portFor(id);
  if (o.fresh) fs.rmSync(dir, { recursive: true, force: true });
  if (!fs.existsSync(dir)) {
    if (version === '2') {
      if (!fs.existsSync(SRC2)) throw new Error('EC-CUBE 2 のソースがありません: ' + SRC2);
      copyDir(SRC2, dir);
      await install2(dir, `http://127.0.0.1:${port}/`, o);
    } else {
      if (!fs.existsSync(path.join(BASE4, 'var', 'eccube.db'))) throw new Error('インストール済みの EC-CUBE 4 がありません: ' + BASE4);
      copyDir(BASE4, dir);
    }
  }
  return { dir, version, port };
}

/**
 * serves an EC-CUBE folder over HTTP on 127.0.0.1:<port>: static files as they are; EC-CUBE 4 sends everything else
 * through index.php (like its .htaccess); EC-CUBE 2 runs each page in its own folder (folder URLs → index.php)
 * → { url, port, run(code) (raw PHP in the server's instance → text), php(code, data) (PHP with EC-CUBE booted → JSON value), close() }
 */
async function serve(dir, port = 0, o = {}) {
  const php = await newPHP(dir, phpFor(dir, o));
  const v2 = isV2(dir);
  const v3 = isV3(dir);
  let lock = Promise.resolve();
  const serial = (fn) => (lock = lock.then(fn, fn));
  let handler = null;
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const body = Buffer.concat(chunks);
    const headers = {};
    for (const [k, v] of Object.entries(req.headers)) headers[k] = Array.isArray(v) ? v.join(', ') : v;
    try {
      const t0 = Date.now();
      let url = req.url;
      const u = new URL(url, 'http://x');
      if (v2 && u.pathname.endsWith('/')) url = u.pathname + 'index.php' + u.search;
      const p = new URL(url, 'http://x').pathname;
      const isStatic = /\.(css|js|map|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|eot)$/i.test(p) && fs.existsSync(path.join(dir, v2 || v3 ? 'html' : '', decodeURIComponent(p)));
      const run = () => {
        if (v2) php.chdir(ROOT + '/html' + decodeURIComponent(p.replace(/\/[^/]*$/, '')));
        return handler.request({ url, method: req.method, headers, body: body.length ? new Uint8Array(body) : undefined });
      };
      const r = await (isStatic ? handler.request({ url, method: req.method, headers }) : serial(run));
      res.writeHead(r.httpStatusCode, r.headers);
      res.end(Buffer.from(r.bytes));
      if (o.log) console.log(`${req.method} ${req.url} → ${r.httpStatusCode} ${Date.now() - t0} ms`);
    } catch (e) {
      console.error('[serve]', req.url, e && e.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' }); res.end(String(e && e.stack));
    }
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}`;
  handler = new PHPRequestHandler(v2
    ? { php, documentRoot: ROOT + '/html', absoluteUrl: url }
    : v3 ? { php, documentRoot: ROOT + '/html', absoluteUrl: url, getFileNotFoundAction: () => ({ type: 'internal-redirect', uri: '/index.php' }) }
    : { php, documentRoot: ROOT, absoluteUrl: url, getFileNotFoundAction: () => ({ type: 'internal-redirect', uri: '/index.php' }) });

  /** raw PHP code (<?php …) in the server's own PHP, between requests → { text, errors, status } */
  const runRaw = (code) => serial(async () => {
    php.chdir(v2 ? ROOT + '/html' : ROOT);
    // as a request to this server (EC-CUBE 2 redirects any other host name to its own)
    const port = server.address().port;
    const r = await php.run({ code, $_SERVER: { HTTP_HOST: `127.0.0.1:${port}`, SERVER_NAME: '127.0.0.1', SERVER_PORT: String(port), SERVER_PROTOCOL: 'HTTP/1.1', REQUEST_METHOD: 'GET', REQUEST_URI: '/', SCRIPT_NAME: '/index.php', HTTPS: '' } });
    return { text: r.text, errors: r.errors, status: r.httpStatusCode };
  });
  /**
   * PHP with EC-CUBE booted; `code` is a function body whose return value comes back (JSON). $data = the 2nd argument.
   *   EC-CUBE 4: $kernel, $container, $em (Doctrine's entity manager) are there
   *   EC-CUBE 2: html/require.php is loaded (SC_Query_Ex::getSingletonInstance() …)
   */
  const phpBooted = async (code, data = null) => {
    const b64 = Buffer.from(JSON.stringify(data)).toString('base64');
    const boot = v2
      ? `chdir('${ROOT}/html'); ob_start(); require_once '${ROOT}/html/require.php'; ob_end_clean();`
      : `chdir('${ROOT}'); require '${ROOT}/vendor/autoload.php'; (Dotenv\\Dotenv::createUnsafeMutable('${ROOT}'))->load();
         $kernel = new \\Eccube\\Kernel('prod', false); $kernel->boot(); $container = $kernel->getContainer(); $em = $container->get('doctrine')->getManager();`;
    const vars = v2 ? '$data' : '$data, $kernel, $container, $em';
    const src = `<?php error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
${boot}
$data = json_decode(base64_decode('${b64}'), true);
try { $__r = (function () use (${vars}) { ${code}
})(); echo "\\n@@RESULT@@", json_encode($__r, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); }
catch (\\Throwable $e) { echo "\\n@@ERROR@@", get_class($e), ': ', $e->getMessage(), ' @ ', $e->getFile(), ':', $e->getLine(); }`;
    const r = await runRaw(src);
    const ok = r.text.split('\n@@RESULT@@');
    if (ok.length > 1) return JSON.parse(ok[ok.length - 1]);
    const er = r.text.split('\n@@ERROR@@');
    throw new Error('PHP: ' + (er.length > 1 ? er[er.length - 1] : (r.errors || r.text).slice(-1500)));
  };
  return { url, port: server.address().port, version: v2 ? '2' : '4', dir, run: runRaw, php: phpBooted, close: () => new Promise((r) => server.close(r)) };
}

module.exports = { LOCAL, ROOT, instance, serve, consoleRun, runPhp, dotenvOf, install4, install2, isV2, isV3, phpFor, portFor, copyDir, newPHP };

if (require.main === module) {
  const [cmd, a, ...rest] = process.argv.slice(2);
  (async () => {
    if (cmd === 'instance') { const r = await instance(a, { version: rest[0] || 4 }); console.log(r.dir, 'EC-CUBE', r.version, 'port', r.port); process.exit(0); }
    if (cmd === 'serve') { const s = await serve(a, +(rest[0] || 0), { log: true }); console.log('serving', s.url, '(admin: /admin/ — admin / password)'); return; }
    if (cmd === 'console') { const r = await consoleRun(a, rest); process.stdout.write(r.out); process.stderr.write(r.err); process.exit(r.code); }
    if (cmd === 'php') { const r = await runPhp(a, rest[0]); process.stdout.write(r.out); process.stderr.write(r.err); process.exit(r.code); }
    if (cmd === 'install4') { await install4(a); process.exit(0); }
    if (cmd === 'install2') { await install2(a, rest[0]); process.exit(0); }
    console.log('usage: node tools/eccube/runtime.js instance|serve|console|php|install4|install2 …'); process.exit(1);
  })().catch((e) => { console.error(e); process.exit(1); });
}
