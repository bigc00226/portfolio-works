# ec-kachaka-store — working notes (for resuming)

Video: kachaka Online Store (store.kachaka.life) — EC-CUBE 4 design renewal (Twig). recorded 2026-09-10.

## Files
- public/videos/ec-kachaka-store/: index.html, js/config.js (steps, snapshot of the live store), js/files.js (the theme:
  every Twig / CSS file and the stages THEME.* — the capture script loads this same file), js/apps.js (KS helpers: EC
  screen in a tab, device mode for SP captures, drag in レイアウト管理, explorer tree), js/scenario.js, css/video.css,
  assets/eccube-admin.ico + favicon.ico (EC-CUBE's own favicons), js/ec-snapshot.js + assets/ec (generated)
- tools/snapshots/ec-kachaka-store/capture-ec.js — the real EC-CUBE captures (fresh copy every run)
- tools/snapshots/ec-kachaka-store/shop-data.json — the shop data from the public pages (built by a scratch script
  from store.kachaka.life detail pages; the list comments are in capture-ec.js LIST_TEXT)
- tools/snapshots/ec-kachaka-store/theme/html/assets — Poppins (latin 400/500/600, OFL), logo.svg, logo-white.svg,
  icons (the store's public files)
- ../eccube-local/data/ec-kachaka-store/save_image — the public product images at ≤ 1000 px (durable copy; the
  capture copies them into the EC-CUBE copy)

## Re-run
    node tools/snapshots/ec-kachaka-store/capture-ec.js --shots=<scratch>/shots   (10–20 min; Chrome + one EC-CUBE)
    node tools/webp.js ec-kachaka-store
    npm run snapshot -- ec-kachaka-store        (the live store: home, detail/1, list; PC + SP)
    npm run verify -- ec-kachaka-store --shots=… --out=…
    npm run check -- ec-kachaka-store ; npm run pointer -- ec-kachaka-store ; npm run timeline -- ec-kachaka-store

## Status (2026-11-18, done)
- [x] capture (33 real EC-CUBE screens), webp, live snapshot (home / detail/1 / list, PC + SP), scenario, docs, content/videos.ts (thumbAt 321)
- [x] checks: verify ✓ 7:44 · check 0 stretches · pointer 0 problems · timeline (thumbnail at 321 s = the renewed dev top)
- fixes found on the way: admin form ids are admin_template_* ; kachaka.css scoped under .ec-layoutRole (EC-CUBE's style.css
  uses two-class selectors); the log escapes quotes (regex); Twig 3.8 drops the key of a hash entry whose int key equals
  the previous int key + 1 ({13:…, 7:…, 8:…} compiled to [13=>…, 7=>…, …] so 8 became 14) — the headings hash is in
  ascending key order now
- known: the capture prints many "lockWholeFile: unlock failed" lines (php-wasm sessions) — harmless; a 404 for
  html/template/admin/img/moc.png (EC-CUBE admin CSS) and "not an image" for some html/bundle files in webp — harmless
- ideas not done: the top's monthly-instalment price text for カチャカ (the real store shows ¥4,980/月…; no product field
  for it in EC-CUBE), the Accessory picker of the real detail page
