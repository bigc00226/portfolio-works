/*
 * Re-captures the three プラグイン一覧 screens of the 無効化 / 有効化 steps (plugins-disabled, plugins-enabled, plugins-final)
 * into the existing js/ec-snapshot.js (capture.js `merge`), from the copy as capture-ec.js left it (DaikokuGift installed
 * from the zip and enabled). Needed once: in the full run these three were taken after the server restart had dropped the
 * admin session (capture-ec.js now logs in again there).
 *
 *   node tools/snapshots/ec-daikoku-plugin/recapture-plugin-list.js [screenshot folder]   → node tools/webp.js ec-daikoku-plugin
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const ID = 'ec-daikoku-plugin';
const SHOTS = process.argv[2] || null;
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, fresh: false, merge: true, site: 'http://localhost:8080', date: '2026-11-03', time: '10:20', shots: SHOTS });
  const { page } = cap;
  const mf = path.join(cap.instance, '.maintenance');
  const adminLogin = async () => { await cap.go('/admin/login', 'body'); if (await page.$('#login_id')) await cap.login(); };
  /** the list's ▶ / ■ icon, then (as the browser's redirect would) the list again — under WebAssembly the redirect page
      is not followed and the auto maintenance file stays in PHP's stat cache: removed, the server restarted, logged in again */
  const action = async (kind, keys) => {
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 600000 }), page.evaluate((k) => document.querySelector(`a[href*="/store/plugin/"][href$="/${k}"]`).click(), kind)]);
    await wait(1500);
    for (let k = 0; k < 30 && fs.existsSync(mf); k++) await wait(500);
    if (fs.existsSync(mf) && /^auto_maintenance/.test(fs.readFileSync(mf, 'utf8'))) fs.rmSync(mf);
    await cap.console(['cache:clear', '--no-warmup']);
    fs.rmSync(path.join(cap.instance, 'var/cache/prod'), { recursive: true, force: true });
    await adminLogin();
    await cap.go('/admin/store/plugin', '.c-contentsArea');
    if (!(await page.$('a[href$="/' + (kind === 'disable' ? 'enable' : 'disable') + '"]'))) throw new Error(kind + ': the list does not show the new state');
    for (const k of keys) await cap.capture(k);
    log(kind, await cap.php("return $em->getConnection()->fetchAllAssociative('SELECT code, version, enabled FROM dtb_plugin');"));
  };
  try {
    await action('disable', ['plugins-disabled']);
    await action('enable', ['plugins-enabled', 'plugins-final']);
    await cap.finish();
    process.exit(0);
  } catch (e) {
    console.error(e);
    await cap.abort();
    process.exit(1);
  }
})();
