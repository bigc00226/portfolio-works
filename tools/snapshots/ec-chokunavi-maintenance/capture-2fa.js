/*
 * The 2FA bypass screens of ec-chokunavi-maintenance, taken in a fresh Chrome (no cookies: only the password, not the 2FA code)
 * and added to js/ec-snapshot.js (merge; its files in assets/ec2). Run after capture-ec.js, on the same copy of EC-CUBE:
 *
 *   node tools/snapshots/ec-chokunavi-maintenance/capture-2fa.js [screenshot folder]
 *   → node tools/webp.js ec-chokunavi-maintenance
 *
 *   4.3.1     the four files of 4.3.1 (as capture-ec.js's setup) → cache:clear → admin / password → the code screen (vuln-auth)
 *             → /two_factor_auth/set: the set-up screen with a new key opens without the code (vuln-set)
 *   4.3.1-p1  the files of the installed 4.3.1-p1 again → cache:clear → /two_factor_auth/set → back to the code screen (vuln-fixed)
 * (capture-ec.js took these in its own browser, which still had the 2FA cookie: they showed ホーム.)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const ECC = require(path.join(ROOT, 'tools/eccube/capture'));
const ID = 'ec-chokunavi-maintenance';
const SHOTS = process.argv[2] || null;
const DATA_DIR = path.resolve(ROOT, '../eccube-local/data', ID);
const BASE = path.resolve(ROOT, '../eccube-local/inst/base');
const ADM = '/mng_7f3k2q';
const PATCHED = ['src/Eccube/Common/Constant.php', 'src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php',
  'src/Eccube/EventListener/TwoFactorAuthListener.php', 'src/Eccube/Service/TwoFactorAuthService.php'];
const log = (...a) => console.log(`[${new Date().toLocaleTimeString('sv-SE')}]`, ...a);

(async () => {
  const cap = await ECC.start({ id: ID, version: 4, site: 'http://localhost:8080', date: '2026-11-17', time: '10:59', admin: ADM, merge: true, assets: 'assets/ec2', shots: SHOTS });
  const { page } = cap;
  const D = cap.data;
  const I = (rel) => path.join(cap.instance, rel);
  const url = () => page.url().replace(cap.origin, '').replace(/127\.0\.0\.1:\d+/, 'localhost:8080');
  const cacheClear = async () => { await cap.console(['cache:clear', '--no-warmup']); fs.rmSync(I('var/cache/prod'), { recursive: true, force: true }); };
  const qrToImg = () => page.evaluate(() => document.querySelectorAll('#qrcode canvas').forEach((c) => { const i = document.createElement('img'); i.src = c.toDataURL('image/png'); i.width = c.width; i.height = c.height; i.style.cssText = c.style.cssText; c.replaceWith(i); }));
  try {
    if (fs.existsSync(I('.maintenance'))) throw new Error('the copy is in maintenance mode');
    // the shop in maintenance mode as a customer sees it (this Chrome has no maintenance_token cookie): the .maintenance file as
    // SystemService::enableMaintenance('', true) writes it (メンテナンス管理's button; capture-ec.js pressed it in a browser that had the cookie)
    D.maintFile = await cap.php("$t = \\Eccube\\Util\\StringUtil::random(32); file_put_contents($data, ':' . $t); return file_get_contents($data);", '/srv/eccube/.maintenance');
    await cap.go('/products/list?category_id=9', 'body');
    await cap.capture('front-503');
    fs.rmSync(I('.maintenance'));
    // 4.3.1
    for (const f of PATCHED) fs.copyFileSync(path.join(DATA_DIR, '431', f), I(f));
    await cacheClear();
    D.vulnVersion = await cap.php('return \\Eccube\\Common\\Constant::VERSION;');
    await cap.login();
    D.vulnAuthUrl = 'http://localhost:8080' + url();
    log(D.vulnVersion, 'login →', D.vulnAuthUrl);
    if (!/two_factor_auth\/auth/.test(url())) throw new Error('expected the code screen');
    await cap.capture('vuln-auth', { inputs: [['input[id$="device_token"]', 'code']] });
    await cap.go(ADM + '/two_factor_auth/set', 'body');
    D.vulnSetUrl = 'http://localhost:8080' + url();
    log('4.3.1 /set →', D.vulnSetUrl);
    await qrToImg();
    await cap.capture('vuln-set', { inputs: [['input[id$="device_token"]', 'code']] });
    // 4.3.1-p1
    for (const f of PATCHED) fs.copyFileSync(path.join(BASE, f), I(f));
    await cacheClear();
    D.fixedVersion = await cap.php('return \\Eccube\\Common\\Constant::VERSION;');
    await cap.go(ADM + '/two_factor_auth/set', 'body');
    if (/\/login/.test(url())) { await cap.login(); await cap.go(ADM + '/two_factor_auth/set', 'body'); }
    D.fixedSetUrl = 'http://localhost:8080' + url();
    log(D.fixedVersion, '/set →', D.fixedSetUrl);
    await cap.capture('vuln-fixed', { inputs: [['input[id$="device_token"]', 'code']] });
    await cap.finish();
    process.exit(0);
  } catch (e) {
    console.error(e);
    for (const f of PATCHED) fs.copyFileSync(path.join(BASE, f), I(f));   // the copy back on 4.3.1-p1
    await cap.abort();
    process.exit(1);
  }
})();
