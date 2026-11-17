/*
 * The files of the B2B project shown in VS Code (C:\dev\kanademono-b2b): a Shopify app (Remix) with the App Proxy
 * routes for the 法人会員登録 form and the カンタン見積もり, plus the theme files of the business page.
 *
 * Built for the demo. The services, their conditions (卸売取引 最大15%オフ, 請求書払い 月末締め翌月払い, 組み立て配送
 * 25万円以上, カンタン見積もり, ワンタイムパスワードのログイン) and the product data (titles, vendors, prices, the
 * "…【B2B】" / "【B2B】割引表記なし" tags) are the live store's own (kanademono.design). The code, the company,
 * quotes, draft orders and e-mails are made up.
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT || { products: [] };
  const F = {};
  const P = Object.fromEntries((S.products || []).map((p) => [p.handle, p]));
  const price = (h, fb) => { const p = P[h]; return p ? Math.round(+p.variants[0].price) : fb; };
  const title = (h, fb) => (P[h] ? P[h].title.replace(/\s+/g, ' ').trim() : fb);
  const noDisc = (h) => !!(P[h] && P[h].tags.some((t) => /割引表記なし/.test(t)));

  /* ------------------------------------------------------------------ the styling set quoted in the video */
  const QUOTE = [
    { h: 'dsk-k72-lft2', qty: 4, name: title('dsk-k72-lft2', 'THE TABLE / サテンウォルナット × スマート電動昇降脚'), price: price('dsk-k72-lft2', 149000), fixed: noDisc('dsk-k72-lft2') },
    { h: 'och-125', qty: 4, name: title('och-125', '【最新モデル】Ergohuman Pro2 5D High エルゴヒューマン オフィスチェア ハイタイプ'), price: price('och-125', 151000), fixed: noDisc('och-125') },
    { h: 'try-k0087', qty: 4, name: title('try-k0087', 'アイアン ケーブル配線トレー'), price: price('try-k0087', 5500), fixed: noDisc('try-k0087') },
    { h: 'ltb-111', qty: 1, name: title('ltb-111', 'マーブル調セラミック ラウンド ローテーブル'), price: price('ltb-111', 82500), fixed: noDisc('ltb-111') },
  ].map((it) => ({ ...it, b2b: it.fixed ? it.price : Math.round(it.price * 0.85) }));
  const sum = (k) => QUOTE.reduce((a, it) => a + it[k] * it.qty, 0);
  const TOTAL_RETAIL = sum('price'), TOTAL_B2B = sum('b2b');
  const STYLING = '電動昇降デスクで集中する 4 人のプロジェクトルーム';
  const COMPANY = '株式会社テストラボ';

  /* ------------------------------------------------------------------ docs */
  const REQ_HEAD = [
    '# KANADEMONO for BUSINESS — 法人向け機能',
    '',
    '## /pages/business の法人会員限定サービス（現行）',
    '- 組み立て配送：1 回のご注文が合計 25 万円以上（有償・事前にお問い合わせ）',
    '- 卸売取引：対象の法人様は最大 15% オフ',
    '- 請求書払い：月末締め、翌月払い（所定の審査あり）',
    '- カンタン見積もり：法人会員限定のスタイリングページから 1 分以内に見積もり',
    '- 法人様会員登録フォーム → 1〜2 営業日で登録完了メール → ワンタイムパスワードでログイン',
    '',
  ];
  const REQ_TYPED = [
    '## Shopify での実現方法',
    '- 法人会員登録：申請フォームから顧客と会社（B2B）を作成し、承認後にログイン',
    '- 卸売取引：会社ロケーションにカタログを割り当て（価格リスト15%オフ）',
    '- 請求書払い：会社ロケーションの支払い条件（30日以内）',
    '- カンタン見積もり：draftOrderCreate で下書き注文を作り、見積書PDFを返す',
    '- 担当者への通知：Flow で申請内容を社内メールに送る',
  ];
  F['docs/requirements.md'] = [...REQ_HEAD, '<!-- TODO -->'].join('\n');
  const REQ_FINAL = [...REQ_HEAD, ...REQ_TYPED].join('\n');

  /* ------------------------------------------------------------------ app */
  F['package.json'] = JSON.stringify({
    name: 'kanademono-b2b', private: true, type: 'module',
    scripts: { dev: 'shopify app dev', deploy: 'shopify app deploy', 'theme:dev': 'shopify theme dev --path theme --store kanademono' },
    dependencies: { '@remix-run/node': '^2.15.0', '@remix-run/react': '^2.15.0', '@shopify/shopify-app-remix': '^3.7.0', pdfkit: '^0.15.0' },
  }, null, 2);
  F['shopify.app.toml'] = [
    'client_id = "{{ client_id }}"',
    'name = "KANADEMONO B2B"',
    'application_url = "https://b2b.kanademono.design"',
    'embedded = true',
    '',
    '[access_scopes]',
    'scopes = "write_companies,write_customers,write_draft_orders,read_products,write_metaobjects"',
    '',
    '[app_proxy]',
    'url = "https://b2b.kanademono.design/apps/b2b"',
    'subpath = "b2b"',
    'prefix = "apps"',
  ].join('\n');
  F['.env'] = 'SHOPIFY_API_KEY=••••••••••••••••\nSHOPIFY_API_SECRET=••••••••••••••••\nSCOPES=write_companies,write_customers,write_draft_orders,read_products';
  F['app/shopify.server.js'] = [
    "import { shopifyApp, ApiVersion } from '@shopify/shopify-app-remix/server';",
    '',
    'const shopify = shopifyApp({',
    '  apiKey: process.env.SHOPIFY_API_KEY,',
    '  apiSecretKey: process.env.SHOPIFY_API_SECRET,',
    '  apiVersion: ApiVersion.October26,',
    "  scopes: process.env.SCOPES?.split(','),",
    '  appUrl: process.env.SHOPIFY_APP_URL,',
    '});',
    'export default shopify;',
    'export const authenticate = shopify.authenticate;',
  ].join('\n');

  const REG_HEAD = [
    '// App Proxy: /apps/b2b/register — 法人様会員登録フォームの申請を受け付けて、会社（B2B）と連絡先を作る',
    "import { json } from '@remix-run/node';",
    "import { authenticate } from '../shopify.server';",
    '',
    'export async function action({ request }) {',
    '  const { admin } = await authenticate.public.appProxy(request);',
    '  const form = Object.fromEntries(await request.formData());',
    '',
  ];
  const REG_VALID = "  if (!form.company?.trim()) return json({ ok: false, errors: { company: '会社名を入力してください' } }, { status: 422 });";
  const REG_TYPED = [
    '  const res = await admin.graphql(`#graphql',
    '    mutation register($input: CompanyCreateInput!) {',
    '      companyCreate(input: $input) { company { id name } userErrors { field message } }',
    '    }`, {',
    '    variables: {',
    '      input: {',
    '        company: { name: form.company, note: `業種：${form.industry} / 時期：${form.timing}` },',
    '        companyContact: { email: form.email, lastName: form.name, title: form.department, phone: form.phone },',
    "        companyLocation: { name: '本社', billingSameAsShipping: true },",
    '      },',
    '    },',
    '  });',
  ];
  const REG_TAIL = [
    '',
    '  const { userErrors } = (await res.json()).data.companyCreate;',
    '  if (userErrors.length) return json({ ok: false, errors: userErrors }, { status: 422 });',
    "  return json({ ok: true, message: '申請を受け付けました。1〜2営業日以内に登録完了メールをお送りします。' });",
    '}',
  ];
  F['app/routes/apps.b2b.register.js'] = [...REG_HEAD, '  // TODO: 会社（B2B）を作成', ...REG_TAIL].join('\n');
  const REG_FINAL = [...REG_HEAD.slice(0, -1), REG_VALID, '', ...REG_TYPED, ...REG_TAIL].join('\n');

  const QUOTE_HEAD = [
    '// App Proxy: /apps/b2b/quote — スタイリングの商品から下書き注文を作り、見積書（PDF）を返す',
    "import { authenticate } from '../shopify.server';",
    "import { findCompany } from '../lib/company.server';",
    "import { renderQuotePdf } from '../lib/quote-pdf.server';",
    '',
    'export async function action({ request }) {',
    '  const { admin } = await authenticate.public.appProxy(request);',
    "  const customerId = new URL(request.url).searchParams.get('logged_in_customer_id');",
    '  const { lines, styling } = await request.json();',
    '  const { companyId, companyLocationId, companyContactId } = await findCompany(admin, customerId);',
    '',
  ];
  const QUOTE_TYPED = [
    '  const res = await admin.graphql(`#graphql',
    '    mutation quote($input: DraftOrderInput!) {',
    '      draftOrderCreate(input: $input) {',
    '        draftOrder { id name totalPriceSet { shopMoney { amount } } }',
    '        userErrors { field message }',
    '      }',
    '    }`, {',
    '    variables: {',
    '      input: {',
    '        lineItems: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),',
    "        tags: ['カンタン見積もり'],",
    '        note: `スタイリング「${styling}」から作成`,',
    '      },',
    '    },',
    '  });',
  ];
  const QUOTE_FIX = '        purchasingEntity: { purchasingCompany: { companyId, companyLocationId, companyContactId } },';
  const QUOTE_TAIL = [
    '',
    '  const draft = (await res.json()).data.draftOrderCreate.draftOrder;',
    "  return new Response(await renderQuotePdf(admin, draft.id), { headers: { 'Content-Type': 'application/pdf' } });",
    '}',
  ];
  F['app/routes/apps.b2b.quote.js'] = [...QUOTE_HEAD, '  // TODO: 下書き注文を作成', ...QUOTE_TAIL].join('\n');
  const QUOTE_BAD = [...QUOTE_HEAD, ...QUOTE_TYPED, ...QUOTE_TAIL].join('\n');
  const qt = QUOTE_TYPED.slice();
  qt.splice(QUOTE_TYPED.indexOf('      input: {') + 1, 0, QUOTE_FIX);
  const QUOTE_FINAL = [...QUOTE_HEAD, ...qt, ...QUOTE_TAIL].join('\n');

  F['app/lib/company.server.js'] = [
    '// ログイン中の顧客（法人会員）の会社・ロケーション・連絡先の ID',
    'export async function findCompany(admin, customerId) {',
    '  const res = await admin.graphql(`#graphql',
    '    query ($id: ID!) { customer(id: $id) { companyContactProfiles { id company { id locations(first: 1) { nodes { id } } } } } }`,',
    '    { variables: { id: `gid://shopify/Customer/${customerId}` } });',
    '  const p = (await res.json()).data.customer.companyContactProfiles[0];',
    '  return { companyId: p.company.id, companyLocationId: p.company.locations.nodes[0].id, companyContactId: p.id };',
    '}',
  ].join('\n');
  F['app/lib/quote-pdf.server.js'] = [
    '// 下書き注文 → 見積書 PDF（宛名・明細・法人価格・有効期限 30 日）',
    "import PDFDocument from 'pdfkit';",
    '',
    'export async function renderQuotePdf(admin, draftOrderId) {',
    '  const draft = await fetchDraft(admin, draftOrderId);',
    "  const doc = new PDFDocument({ size: 'A4', margin: 48 });",
    "  doc.font('fonts/NotoSansJP-Regular.ttf').fontSize(20).text('御見積書', { align: 'center' });",
    '  // …（明細・小計・消費税・合計・振込先・有効期限）',
    '  return toBuffer(doc);',
    '}',
  ].join('\n');

  /* ------------------------------------------------------------------ theme */
  const FORM_HEAD = [
    '{%- comment -%} 法人様会員登録フォーム：App Proxy（/apps/b2b/register）に送信する {%- endcomment -%}',
    '<section class="b2b-register page-width">',
    '  <h2 class="section-header__title">{{ section.settings.title }}</h2>',
    '  <form class="b2b-form" action="/apps/b2b/register" method="post" data-b2b-register>',
  ];
  const FORM_FIELD = (req) => [
    '    <label class="b2b-field">',
    '      <span>会社名<em>必須</em></span>',
    `      <input type="text" name="company" autocomplete="organization"${req ? ' required' : ''}>`,
    '    </label>',
  ];
  const FORM_TAIL = [
    '    <label class="b2b-field"><span>部署名</span><input type="text" name="department"></label>',
    '    <label class="b2b-field"><span>ご担当者名<em>必須</em></span><input type="text" name="name" required></label>',
    '    <label class="b2b-field"><span>メールアドレス<em>必須</em></span><input type="email" name="email" required></label>',
    '    <label class="b2b-field"><span>電話番号</span><input type="tel" name="phone"></label>',
    '    <label class="b2b-field"><span>業種</span><select name="industry">{%- for o in section.settings.industries | split: \',\' -%}<option>{{ o }}</option>{%- endfor -%}</select></label>',
    '    <label class="b2b-field"><span>導入予定時期</span><select name="timing"><option>1か月以内</option><option>3か月以内</option><option>未定</option></select></label>',
    '    <p class="b2b-form__error" hidden></p>',
    '    <button type="submit" class="btn">申請する</button>',
    '  </form>',
    '</section>',
    '',
    '{% schema %}',
    '{ "name": "法人様会員登録フォーム", "settings": [',
    '  { "type": "text", "id": "title", "label": "見出し", "default": "法人様会員登録フォーム" },',
    '  { "type": "text", "id": "industries", "label": "業種（カンマ区切り）", "default": "IT・通信,広告・デザイン,建築・設計,飲食・小売,その他" }',
    '] }',
    '{% endschema %}',
  ];
  F['theme/sections/b2b-register.liquid'] = [...FORM_HEAD, ...FORM_TAIL].join('\n');
  const FORM_BAD = [...FORM_HEAD, ...FORM_FIELD(false), ...FORM_TAIL].join('\n');
  const FORM_FINAL = [...FORM_HEAD, ...FORM_FIELD(true), ...FORM_TAIL].join('\n');

  const PRICE_HEAD = [
    '{%- comment -%} 法人会員（B2B）のとき：カタログの法人価格と、卸売の割引表示 {%- endcomment -%}',
    '{%- if customer.b2b? -%}',
    '  {%- assign v = product.selected_or_first_available_variant -%}',
    '  <div class="b2b-price">',
    '    <span class="b2b-price__label">法人価格</span>',
    '    <span class="b2b-price__value">{{ v.price | money }}<small>（税込）</small></span>',
  ];
  const PRICE_OFF = '    <span class="b2b-price__off">卸売 15%OFF</span>';
  const PRICE_TAIL = [
    '    <a class="btn btn--secondary" href="#" data-b2b-quote data-variant="{{ v.id }}">この商品で見積書を作成</a>',
    '  </div>',
    '{%- endif -%}',
  ];
  F['theme/snippets/b2b-price.liquid'] = [...PRICE_HEAD, PRICE_OFF, ...PRICE_TAIL].join('\n');
  const PRICE_UNLESS = "    {%- unless product.tags contains '【B2B】割引表記なし' -%}";
  const PRICE_END = '    {%- endunless -%}';
  const PRICE_FINAL = [...PRICE_HEAD, PRICE_UNLESS, PRICE_OFF, PRICE_END, ...PRICE_TAIL].join('\n');
  F['theme/templates/page.business.json'] = JSON.stringify({
    sections: { hero: { type: 'business-hero' }, about: { type: 'business-about' }, service: { type: 'business-service' }, coordinate: { type: 'business-coordinate' }, case: { type: 'business-case' }, register: { type: 'b2b-register' }, contact: { type: 'business-contact' } },
    order: ['hero', 'about', 'service', 'coordinate', 'case', 'register', 'contact'],
  }, null, 2);
  F['theme/sections/main-product.liquid'] = [
    '<div class="product-single__meta">',
    '  <h1 class="product-single__title">{{ product.title }}</h1>',
    '  {%- render \'product-price\', product: product -%}',
    '  {%- render \'b2b-price\', product: product -%}',
    '  {%- render \'product-form\', product: product -%}',
    '</div>',
  ].join('\n');
  F['theme/config/settings_schema.json'] = JSON.stringify([{ name: 'theme_info', theme_name: 'Impulse', theme_version: '2.4.0', theme_author: 'Archetype Themes' }], null, 2);

  /* ------------------------------------------------------------------ notification e-mail (Flow → staff) */
  const MAIL_HEAD = [
    '{%- comment -%} Shopify Flow「会社が作成されたとき」→ 担当者へのメール {%- endcomment -%}',
    '件名：【法人会員登録】{{ company.name }} 様から申請がありました',
    '',
  ];
  const MAIL_BODY = (n) => [
    `会社名：{{ ${n}.name }}`,
    'ご担当者：{{ company.mainContact.customer.displayName }}（{{ company.mainContact.title }}）',
    'メール：{{ company.mainContact.customer.email }}',
    '業種・時期：{{ company.note }}',
    '',
    '承認：管理画面 › 顧客管理 › 会社 › {{ company.name }}',
  ];
  F['flow/company-created.liquid'] = [...MAIL_HEAD, ...MAIL_BODY('company')].join('\n');

  F['scripts/test-quote.mjs'] = [
    '// テスト用の法人会員として App Proxy の /apps/b2b/quote を呼び、見積書 PDF を tmp/ に保存する',
    "import fs from 'node:fs';",
    "import { signedProxyUrl } from './lib/proxy.mjs';",
    '',
    "const styling = process.argv[2] ?? 'test';",
    "const lines = JSON.parse(fs.readFileSync('scripts/fixtures/styling-project-room.json', 'utf8'));",
    "const url = signedProxyUrl('/apps/b2b/quote', { logged_in_customer_id: process.env.TEST_CUSTOMER_ID });",
    "const res = await fetch(url, { method: 'POST', body: JSON.stringify({ lines, styling }) });",
    "const no = res.headers.get('x-draft-order');",
    'fs.writeFileSync(`tmp/quote-${no}.pdf`, Buffer.from(await res.arrayBuffer()));',
    "console.log(`✔ 下書き注文 ${no}・合計 ${res.headers.get('x-total')} → tmp/quote-${no}.pdf`);",
  ].join('\n');
  F['scripts/fixtures/styling-project-room.json'] = JSON.stringify(QUOTE.map((it) => ({ handle: it.h, variantId: `gid://shopify/ProductVariant/${4e13 + it.h.length * 1000003}`, quantity: it.qty })), null, 2);

  const QJS = [
    '// 「この商品で見積書を作成」：App Proxy に送って、返ってきた PDF を新しいタブで開く',
    "document.addEventListener('click', async (e) => {",
    "  const a = e.target.closest('[data-b2b-quote]');",
    '  if (!a) return;',
    '  e.preventDefault();',
    '  const lines = [{ variantId: a.dataset.variant, quantity: 1 }];',
    "  const res = await fetch('/apps/b2b/quote', { method: 'POST', body: JSON.stringify({ lines, styling: document.title }) });",
    '  window.open(URL.createObjectURL(await res.blob()));',
    '});',
  ];

  F['README.md'] = [
    '# kanademono-b2b',
    '',
    'KANADEMONO for BUSINESS の法人向け機能（Shopify アプリ ＋ テーマ）',
    '',
    '- `shopify app dev` … App Proxy（/apps/b2b/register・/apps/b2b/quote）',
    '- `npm run theme:dev` … テーマ（法人様会員登録フォーム・法人価格の表示）',
  ].join('\n');

  window.FILES = {
    files: F, P, QUOTE, TOTAL_RETAIL, TOTAL_B2B, STYLING, COMPANY,
    REQ_TYPED, REQ_FINAL, REG_VALID, REG_TYPED, REG_FINAL, FORM_FIELD, FORM_BAD, FORM_FINAL,
    QUOTE_TYPED, QUOTE_FIX, QUOTE_BAD, QUOTE_FINAL, PRICE_UNLESS, PRICE_END, PRICE_OFF, PRICE_FINAL,
    QJS,
    MAIL_SUBJECT: MAIL_HEAD[1].replace('件名：', ''), MAIL_LINES: MAIL_BODY('company'),
  };
})();
