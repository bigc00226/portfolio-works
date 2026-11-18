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

## Status
- [x] research, shop data, images, theme (files.js), capture-ec.js (runs OK: 33 screens), apps.js, config, css, scenario.js (first draft), content/videos.ts entry, docs/videos/ec-kachaka-store.md
- [x] fixes: admin form ids are admin_template_* ; kachaka.css scoped under .ec-layoutRole (EC-CUBE style.css uses 2-class selectors); log regex (the log escapes quotes)
- [ ] live snapshot (npm run snapshot -- ec-kachaka-store) · webp · verify / check / pointer / timeline (thumbAt)
- known: the capture prints many "lockWholeFile: unlock failed" lines (php-wasm sessions) — harmless
