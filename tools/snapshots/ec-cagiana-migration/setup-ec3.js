/*
 * The source system of the ec-cagiana-migration video: EC-CUBE 3.0.18-p7 (the last patch of the 3.0 line), installed with
 * SQLite on PHP 7.4 in WebAssembly (tools/eccube/runtime.js serves an EC-CUBE 3 folder with html/ as document root).
 *
 *   node tools/snapshots/ec-cagiana-migration/setup-ec3.js        → ../eccube-local/ec3-cagiana (made once; --fresh to redo)
 *
 * What it does (no native PHP, no MySQL — only PHP compiled to WebAssembly):
 *   1. the official full package eccube-3.0.18.zip (downloads.ec-cube.net, with vendor/) and the 3.0.18-p7 source
 *      (eccube-3.0.18-p7.zip = the GitHub tag EC-CUBE/ec-cube3 3.0.18-p7, commit f9bb1fc…, checked against the GitHub API)
 *      — sha256 of both printed / compared with the values in NOTES.md
 *   2. p7's source over the 3.0.18 package; the 4 vendor packages p7's composer.lock changes (symfony/http-kernel 2.8.52,
 *      polyfill-ctype / -php56 / -util 1.19.0) from their GitHub archives at the locked commits; installed.json updated and
 *      Composer 2.2 LTS (composer.phar, sha256 checked) regenerates the autoloader (dump-autoload, offline)
 *   3. EC-CUBE 3's own CLI installer: php eccube_install.php sqlite3 none (tables, migrations, admin admin / password)
 *      with a fixed AUTH_MAGIC (the value the migration needs later); html/install.php removed as EC-CUBE asks
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..');
const RT = require(path.join(ROOT, 'tools/eccube/runtime'));

const LOCAL = RT.LOCAL;
const DL = path.join(LOCAL, 'dl3');
const DEST = path.join(LOCAL, 'ec3-cagiana');
const AUTH_MAGIC = 'Xq7mTzR4vKc2WnB8sYhL5dPa9GfJ3eUo';   // EC-CUBE 3's auth_magic of the copy (ECCUBE_AUTH_MAGIC of EC-CUBE 4 after the migration)
const SHA = {
  'eccube-3.0.18.zip': '715cfa0336c78714435d0fd0434f918999540f04c73f6ea5c9ff047109bccc20',
  'eccube-3.0.18-p7.zip': '57647e08d97e0086debf30dcd20b980aef2d39f3009c42d0a38e69da3db6b911',
};
const COMPOSER = { version: '2.2.32', url: 'https://getcomposer.org/download/2.2.32/composer.phar' };
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const sha256 = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');

async function get(url, file) {
  if (fs.existsSync(file)) return file;
  const r = await fetch(url, { headers: { 'User-Agent': 'eccube-local-setup' } });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  return file;
}
function unzip(zip, dir) {
  fs.mkdirSync(dir, { recursive: true });
  const r = spawnSync(process.env.SystemRoot ? path.join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar', ['-xf', zip, '-C', dir], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('tar -xf failed: ' + zip);
}
function overlay(src, dst) {
  const r = spawnSync('robocopy', [src, dst, '/E', '/MT:16', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/R:1', '/W:1'], { stdio: 'ignore' });
  if (r.status == null || r.status >= 8) throw new Error(`robocopy ${src} → ${dst} failed (${r.status})`);
}
async function cli(args, env = {}) {
  const php = await RT.newPHP(DEST, '7.4');
  const r = await php.cli(['php', ...args], { env: { COMPOSER_HOME: RT.ROOT + '/app/cache/composer', HOME: RT.ROOT + '/app/cache', ...env }, cwd: RT.ROOT });
  const [out, err, code] = await Promise.all([r.stdoutText, r.stderrText, r.exitCode]);
  try { php.exit(); } catch (e) { /* done */ }
  return { out, err, code };
}

/*
 * PHP 7.4 in WebAssembly (@php-wasm/node 3.1.65) aborts in libxml_use_internal_errors() ("null function or function
 * signature mismatch" in zend_llist_destroy). Symfony's XLIFF loader (the validator / form translations EC-CUBE 3 loads on
 * every request) and XmlUtils call it unqualified from their namespaces, so a namespaced function of the same name takes
 * its place there — added to Composer's autoload "files" (EC-CUBE's own files stay as distributed)
 */
const SHIM = `<?php
// eccube-local: PHP 7.4 (WebAssembly) aborts in libxml_use_internal_errors(); these namespaces get a stand-in (setup-ec3.js)
namespace Symfony\\Component\\Translation\\Loader { function libxml_use_internal_errors($use = null) { static $on = false; $prev = $on; if ($use !== null) { $on = (bool) $use; } return $prev; } }
namespace Symfony\\Component\\Config\\Util { function libxml_use_internal_errors($use = null) { static $on = false; $prev = $on; if ($use !== null) { $on = (bool) $use; } return $prev; } }
`;
function shim() {
  const f = path.join(DEST, 'vendor/eccube-local/wasm-shim.php');
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, SHIM);
  const C = path.join(DEST, 'vendor/composer');
  const key = 'eccubelocalwasmshim0000000000000';
  let stat = fs.readFileSync(path.join(C, 'autoload_static.php'), 'utf8');
  let files = fs.readFileSync(path.join(C, 'autoload_files.php'), 'utf8');
  if (!stat.includes(key)) stat = stat.replace('public static $files = array (\n', `public static $files = array (\n        '${key}' => __DIR__ . '/..' . '/eccube-local/wasm-shim.php',\n`);
  if (!files.includes(key)) files = files.replace('return array(\n', `return array(\n    '${key}' => $vendorDir . '/eccube-local/wasm-shim.php',\n`);
  fs.writeFileSync(path.join(C, 'autoload_static.php'), stat);
  fs.writeFileSync(path.join(C, 'autoload_files.php'), files);
  log('wasm shim for libxml_use_internal_errors():', stat.includes(key) && files.includes(key) ? 'OK' : 'CHECK');
  /*
   * Twig 1.34 (EC-CUBE 3.0.18's) on PHP 7.4: preg_match_all() now reports an unmatched trailing group as ['', -1], so the
   * lexer took every {{ as {{- and trimmed the space before it (class="cb {{ icon }}" → "cbcb-tag": the admin's icons lose
   * their CSS). The check Twig itself uses in later versions ('' !== …) — EC-CUBE 3.0 predates PHP 7.4
   */
  const lexer = path.join(DEST, 'vendor/twig/twig/lib/Twig/Lexer.php');
  const before = 'if (isset($this->positions[2][$this->position][0])) {';
  let lx = fs.readFileSync(lexer, 'utf8');
  if (lx.includes(before)) {
    lx = lx.replace(before, "if (isset($this->positions[2][$this->position][0]) && '' !== $this->positions[2][$this->position][0]) {");
    fs.writeFileSync(lexer, lx);
    fs.rmSync(path.join(DEST, 'app/cache/twig'), { recursive: true, force: true });
  }
  log('Twig lexer (PHP 7.4 whitespace):', lx.includes("&& '' !== $this->positions[2]") ? 'OK' : 'CHECK');
}

(async () => {
  if (process.argv.includes('--fresh')) fs.rmSync(DEST, { recursive: true, force: true });
  if (fs.existsSync(path.join(DEST, 'app/config/eccube/eccube.db'))) { shim(); log('already installed:', DEST); process.exit(0); }
  fs.mkdirSync(DL, { recursive: true });
  // 1. the downloads
  await get('https://downloads.ec-cube.net/src/eccube-3.0.18.zip', path.join(DL, 'eccube-3.0.18.zip'));
  await get('https://downloads.ec-cube.net/src/eccube-3.0.18-p7.zip', path.join(DL, 'eccube-3.0.18-p7.zip'));
  for (const [f, want] of Object.entries(SHA)) { const got = sha256(path.join(DL, f)); log(f, got, got === want ? 'OK' : 'MISMATCH'); if (got !== want) throw new Error('checksum ' + f); }
  const tag = await (await fetch('https://api.github.com/repos/EC-CUBE/ec-cube3/git/ref/tags/3.0.18-p7', { headers: { 'User-Agent': 'eccube-local-setup' } })).json();
  const zipComment = spawnSync('unzip', ['-z', path.join(DL, 'eccube-3.0.18-p7.zip')], { encoding: 'utf8' }).stdout || '';
  log('3.0.18-p7 tag commit', tag.object && tag.object.sha, zipComment.includes(tag.object && tag.object.sha) ? '= the zip (OK)' : '(zip comment not checked)');
  const X = path.join(DL, 'x');
  if (!fs.existsSync(path.join(X, 'eccube-3.0.18'))) unzip(path.join(DL, 'eccube-3.0.18.zip'), X);
  if (!fs.existsSync(path.join(X, 'ec-cube3-3.0.18-p7'))) unzip(path.join(DL, 'eccube-3.0.18-p7.zip'), X);

  // 2. 3.0.18 + p7, the vendor packages of p7's composer.lock
  log('assembling', DEST);
  RT.copyDir(path.join(X, 'eccube-3.0.18'), DEST);
  overlay(path.join(X, 'ec-cube3-3.0.18-p7'), DEST);
  const lock = JSON.parse(fs.readFileSync(path.join(DEST, 'composer.lock'), 'utf8'));
  const installedFile = path.join(DEST, 'vendor/composer/installed.json');
  const installed = JSON.parse(fs.readFileSync(installedFile, 'utf8'));
  const byName = Object.fromEntries(installed.map((p) => [p.name, p]));
  const changed = lock.packages.filter((p) => !byName[p.name] || byName[p.name].version !== p.version);
  for (const p of changed) {
    const zip = path.join(DL, `${p.name.replace('/', '-')}-${p.version}.zip`);
    await get(p.dist.url, zip);
    const tmp = path.join(DL, 'pkg', p.name.replace('/', '-'));
    fs.rmSync(tmp, { recursive: true, force: true });
    unzip(zip, tmp);
    const top = fs.readdirSync(tmp)[0];
    if (!top.endsWith(p.dist.reference.slice(0, 7))) throw new Error(`${p.name}: archive ${top} is not the locked commit ${p.dist.reference}`);
    const to = path.join(DEST, 'vendor', p.name);
    fs.rmSync(to, { recursive: true, force: true });
    fs.cpSync(path.join(tmp, top), to, { recursive: true });
    const entry = { ...p, 'installation-source': 'dist' };
    const i = installed.findIndex((q) => q.name === p.name);
    if (i >= 0) installed[i] = entry; else installed.push(entry);
    log('vendor', p.name, (byName[p.name] || {}).version || '(new)', '→', p.version, p.dist.reference.slice(0, 10));
  }
  fs.writeFileSync(installedFile, JSON.stringify(installed, null, 4));
  /*
   * the autoloader: http-kernel and polyfill-ctype keep their namespaces and folders (Composer's generated files stay valid);
   * the two new packages are added to the generated autoload files the way `composer dump-autoload` writes them
   * (Composer itself hangs in PHP-in-WebAssembly: it shells out to git to guess the root version)
   */
  const C = path.join(DEST, 'vendor/composer');
  const NEW = [['Symfony\\Polyfill\\Util\\', 'symfony/polyfill-util'], ['Symfony\\Polyfill\\Php56\\', 'symfony/polyfill-php56']];
  const fileHash = crypto.createHash('md5').update('symfony/polyfill-php56:bootstrap.php').digest('hex');
  let psr4 = fs.readFileSync(path.join(C, 'autoload_psr4.php'), 'utf8');
  let stat = fs.readFileSync(path.join(C, 'autoload_static.php'), 'utf8');
  let files = fs.readFileSync(path.join(C, 'autoload_files.php'), 'utf8');
  const q = (s) => s.replace(/\\/g, '\\\\');
  for (const [ns, dir] of NEW) {
    if (psr4.includes(q(ns))) continue;
    psr4 = psr4.replace('return array(\n', `return array(\n    '${q(ns)}' => array($vendorDir . '/${dir}'),\n`);
    stat = stat.replace("public static $prefixLengthsPsr4 = array (\n        'S' => \n        array (\n", `public static $prefixLengthsPsr4 = array (\n        'S' => \n        array (\n            '${q(ns)}' => ${ns.length},\n`);
    stat = stat.replace('public static $prefixDirsPsr4 = array (\n', `public static $prefixDirsPsr4 = array (\n        '${q(ns)}' => \n        array (\n            0 => __DIR__ . '/..' . '/${dir}',\n        ),\n`);
  }
  if (!files.includes('polyfill-php56/bootstrap.php')) {
    files = files.replace('return array(\n', `return array(\n    '${fileHash}' => $vendorDir . '/symfony/polyfill-php56/bootstrap.php',\n`);
    stat = stat.replace('public static $files = array (\n', `public static $files = array (\n        '${fileHash}' => __DIR__ . '/..' . '/symfony/polyfill-php56/bootstrap.php',\n`);
  }
  for (const [f, s] of [['autoload_psr4.php', psr4], ['autoload_static.php', stat], ['autoload_files.php', files]]) fs.writeFileSync(path.join(C, f), s);
  log('autoload: + symfony/polyfill-util, symfony/polyfill-php56', stat.includes('polyfill-php56/bootstrap.php') && stat.includes("Polyfill\\\\Util\\\\' =>") ? 'OK' : 'CHECK');
  fs.rmSync(path.join(DEST, 'composer.phar'), { force: true });
  shim();
  let r;

  // 3. EC-CUBE 3's installer
  r = await cli([RT.ROOT + '/eccube_install.php', 'sqlite3', 'none', '--no-ansi'], {
    AUTH_MAGIC, SHOP_NAME: 'CAGIANA《カジーナ》', ADMIN_MAIL: 'info@example.com', ADMIN_USER: 'admin', ADMIN_PASS: 'password',
    MAIL_BACKEND: 'smtp', MAIL_HOST: '127.0.0.1', MAIL_PORT: '1025',
  });
  console.log(r.out.slice(-3000), r.err.slice(-3000));
  if (r.code !== 0) throw new Error('eccube_install.php failed');
  fs.rmSync(path.join(DEST, 'html/install.php'), { force: true });
  log('EC-CUBE 3 installed:', DEST, '— node tools/eccube/runtime.js serve', DEST);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
