/*
 * The theme project shown in VS Code (C:\dev\greenbase-theme — the Flow theme pulled with Shopify CLI) and the plant
 * care data of the demo.
 *
 * Taken from the live store green-base.jp: the product (パキラ S × ロムS ベージュ), its pot variations, the care texts
 * (日当たり・みずやり・原産地・花言葉・気温・注意・ペット・赤ちゃん), the markup and class names of the care section
 * (section "parts-item-detail": .p-detail__content / .l-detail__block__icon / .l-icon__… / ico-….svg), the tag scheme
 * (LIGHT_ / SIZE_ / DIFFICULITY_ / INTERIOR_ / MERIT_) and the theme (Flow 39.9.1).
 * Made for the demo: the metaobject definition (type "plant", the field keys), the Liquid of the section (the live
 * theme's source is not public), the theme-selection notes and the other theme files (short excerpts).
 */
(function () {
  'use strict';
  const S = window.SITE_SNAPSHOT;
  const F = {};

  /* ------------------------------------------------------------------ care data of パキラ (live product page) */
  const PLANT = {
    name: 'パキラ',
    hiatari: '比較的耐陰性がありますが、レースカーテン越しなど、室内の明るい場所が最適です。',
    mizuyari: '土が乾いたらたっぷり水やりをしてください。',
    gensanchi: '中南米',
    hanakotoba: ['快活', '勝利'],
    kion: '室温を8℃以上に保つことで健康的に育ちます。',
    chuui: 'エアコンの風が直接あたる場所に置かないでください。',
    pet: '毒性はありません。',
  };
  /** the metaobject definition "植物" (plant): name, key, type label, list? */
  const FIELDS = [
    ['日当たり', 'hiatari', '複数行テキスト'],
    ['みずやり', 'mizuyari', '複数行テキスト'],
    ['原産地', 'gensanchi', '1 行テキスト'],
    ['花言葉', 'hanakotoba', '1 行テキスト（リスト）', true],
    ['気温', 'kion', '複数行テキスト'],
    ['注意', 'chuui', '複数行テキスト'],
    ['ペット・赤ちゃん', 'pet', '1 行テキスト'],
  ];

  /* products of the same plant (pot variations) — from the store's product list */
  const cat = S.catalog || [];
  const PACHIRA = cat.filter((p) => /^パキラ S ×/.test(p.t)).map((p) => ({ handle: p.h, title: p.t, price: p.vs[0][1] }));
  const SETS = cat.filter((p) => / × /.test(p.t));
  const tagOf = (p, k) => (p.tags.find((t) => t.startsWith(k + '_')) || '').replace(k + '_', '');

  /* ------------------------------------------------------------------ the theme project */
  F['README.md'] = [
    '# GREEN BASE — Shopify テーマ（Flow）',
    '',
    '- `shopify theme dev --store greenbase-online --theme-editor-sync` で開発（テーマエディタの変更はローカルに同期）',
    '- 商品の育て方は **メタオブジェクト「植物」**（`plant`）に植物ごとに 1 件。商品はメタフィールド `custom.plant` で参照する',
    '- 商品ページの育て方のセクション：`sections/parts-item-detail.liquid`',
  ].join('\n');
  F['docs/theme-selection.md'] = [
    '# テーマ選定（リニューアル）',
    '',
    '## 要件',
    '- 植物の写真を大きく見せる（一覧・商品ページ）',
    '- 条件で探せる：日当たり・サイズ・育てやすさ・インテリア（タグ `LIGHT_` `SIZE_` `DIFFICULITY_` `INTERIOR_`）',
    '- 商品ページに植物ごとの「育て方」（日当たり・みずやり・原産地・花言葉・気温・注意・ペット）',
    '- 鉢違いの商品（パキラ S × ロムS ベージュ / ブラック …）を行き来できる',
    '- スマートフォンで見やすいこと（注文の 8 割以上がスマートフォン）',
    '',
    '## 候補（テーマストア）',
    '| テーマ | 写真の見せ方 | 絞り込み | 商品ページのセクション | メモ |',
    '| --- | --- | --- | --- | --- |',
    '| Dawn | ○ | ○ | ○ | 無料・軽い。世界観の演出は自作が多くなる |',
    '| Flow | ◎ | ◎ | ◎ | 大きな画像・スクロールの演出、セクションの種類が多い |',
    '| Impulse | ○ | ◎ | ○ | 商品数の多いストア向け。情報量が多め |',
    '| Prestige | ◎ | ○ | ○ | 落ち着いた高級感 |',
    '',
    '→ **Flow** を試用してカスタマイズ（育て方はメタオブジェクト＋自作セクション）',
  ].join('\n');
  F['shopify.theme.toml'] = '[environments.development]\nstore = "greenbase-online"\ntheme-editor-sync = true';
  F['.shopifyignore'] = 'docs/\nREADME.md';
  F['layout/theme.liquid'] = '<!doctype html>\n<html lang="{{ request.locale.iso_code }}">\n  <head>\n    {{ content_for_header }}\n    {{ \'theme.css\' | asset_url | stylesheet_tag }}\n  </head>\n  <body>\n    {% sections \'header-group\' %}\n    <main id="MainContent">{{ content_for_layout }}</main>\n    {% sections \'footer-group\' %}\n  </body>\n</html>';
  F['config/settings_schema.json'] = JSON.stringify([{ name: 'theme_info', theme_name: 'Flow', theme_version: '39.9.1', theme_author: 'Eight Themes' }], null, 2);
  F['assets/parts-item-detail.css'] = [
    '/* 商品ページ：植物の詳細（育て方） */',
    '.l-detail__block { margin-bottom: 40px; line-height: 2; }',
    '.l-detail__block__icon { width: 620px; }',
    '.l-detail__block__icon-col02 { display: flex; align-items: center; gap: 24px; margin: 0 0 24px; }',
    '.l-detail__block__icon-col02 dt { flex: 0 0 64px; text-align: center; font-size: 13px; }',
    '.l-detail__block__icon-col02 dt img { display: block; margin: 0 auto 4px; }',
  ].join('\n');
  const CSS_BAD = 'width: 620px;';
  const CSS_OK = 'width: 100%; max-width: 620px;';
  F['sections/main-product.liquid'] = [
    '{%- comment -%} Flow：商品情報（ギャラリー・タイトル・価格・購入ボタン）{%- endcomment -%}',
    '<section class="product-page" data-wetheme-section-type="product">',
    '  {%- render \'product-media-gallery\', product: product -%}',
    '  <div class="product-page__info">',
    '    {%- for block in section.blocks -%}',
    '      {%- case block.type -%}',
    '        {%- when \'title\' -%}<h1 class="product-page__title">{{ product.title }}</h1>',
    '        {%- when \'price\' -%}{%- render \'price\', product: product -%}',
    '        {%- when \'merit\' -%}{%- render \'merit-tags\', product: product -%}',
    '        {%- when \'buy_buttons\' -%}{%- render \'buy-buttons\', product: product -%}',
    '      {%- endcase -%}',
    '    {%- endfor -%}',
    '  </div>',
    '</section>',
  ].join('\n');
  F['snippets/merit-tags.liquid'] = [
    '{%- comment -%} MERIT_ のタグ → 赤枠のラベル（おしゃれな鉢とセット / スタッフが植え替えてから発送）{%- endcomment -%}',
    '<div class="merit__tag"><div class="merit__tag-inner">',
    '  {%- for tag in product.tags -%}',
    '    {%- if tag contains \'MERIT_\' -%}<div>{{ tag | remove: \'MERIT_\' }}</div>{%- endif -%}',
    '  {%- endfor -%}',
    '</div></div>',
  ].join('\n');
  const TEMPLATE = (withDetail) => JSON.stringify({
    sections: Object.assign({
      'product-form': { type: 'main-product', blocks: { title: { type: 'title' }, price: { type: 'price' }, merit: { type: 'merit' }, buy_buttons: { type: 'buy_buttons' } }, block_order: ['title', 'price', 'merit', 'buy_buttons'] },
      custom_liquid_MD4Prp: { type: 'custom-liquid', settings: { custom_liquid: '' } },
    }, withDetail ? { parts_item_detail_yckM9B: { type: 'parts-item-detail', settings: { plant: '{{ product.metafields.custom.plant.value }}', icon_sun: 'shopify://shop_images/sun2.svg', icon_water: 'shopify://shop_images/jyouro2.svg' } } } : {}, {
      custom_liquid_Ut7hxa: { type: 'custom-liquid', settings: { custom_liquid: '' } },
      related: { type: 'product-recommendations' },
    }),
    order: ['product-form', 'custom_liquid_MD4Prp', ...(withDetail ? ['parts_item_detail_yckM9B'] : []), 'custom_liquid_Ut7hxa', 'related'],
  }, null, 2);
  F['templates/product.json'] = TEMPLATE(false);

  /* ------------------------------------------------------------------ the section typed in the video */
  const SECTION_HEAD = [
    '{%- comment -%}',
    '  植物の詳細：育て方は「植物」メタオブジェクトから表示する',
    '  鉢違いの商品も同じ植物エントリを参照するので、入力は植物ごとに 1 回',
    '{%- endcomment -%}',
    '{%- assign plant = section.settings.plant -%}',
    '<section class="p-detail__content wrapper-spacing--h">',
    '  <div class="l-detail__block">',
    '    <p><b>ABOUT</b></p>',
    '    <p>{{ product.description | strip_html }}</p>',
    '  </div>',
    '  {%- if plant != blank -%}',
    '    <div class="l-detail__block__icon">',
    "      {{ section.settings.icon_sun | image_url: width: 153 | image_tag: class: 'c_img' }}",
    '      <dl class="l-detail__block__icon-col02 l-icon__hiatari"><dt>日当たり</dt><dd>{{ plant.hiatari }}</dd></dl>',
    "      {{ section.settings.icon_water | image_url: width: 153 | image_tag: class: 'c_img' }}",
    '      <dl class="l-detail__block__icon-col02 l-icon__mizuyari"><dt>みずやり</dt><dd>{{ plant.mizuyari }}</dd></dl>',
    "      {%- assign rows = 'gensanchi:原産地:ico-gensanchi,hanakotoba:花言葉:ico-hanakotoba,kion:気温:ico-kion,chuui:注意:ico-chui,pet:ペット・<br>赤ちゃん:ico-pet' | split: ',' -%}",
    '      {%- for row in rows -%}',
    "        {%- assign r = row | split: ':' -%}",
    '        {%- assign key = r[0] -%}',
    '        <dl class="l-detail__block__icon-col02 l-icon__{{ key }}">',
    "          <dt><img src=\"{{ r[2] | append: '.svg' | file_url }}\" alt=\"\">{{ r[1] }}</dt>",
  ];
  const DD_BAD = '          <dd>{{ plant[key] }}</dd>';
  const DD_OK = "          <dd>{%- if plant[key].list? -%}{{ plant[key].value | join: '、' }}{%- else -%}{{ plant[key] }}{%- endif -%}</dd>";
  const SECTION_TAIL = [
    '        </dl>',
    '      {%- endfor -%}',
    '    </div>',
    '  {%- endif -%}',
    '</section>',
  ];
  const SCHEMA = [
    '',
    "{{ 'parts-item-detail.css' | asset_url | stylesheet_tag }}",
    '',
    '{% schema %}',
    '{',
    '  "name": "植物の詳細",',
    '  "settings": [',
    '    { "type": "metaobject", "metaobject_type": "plant", "id": "plant", "label": "植物" },',
    '    { "type": "image_picker", "id": "icon_sun", "label": "日当たりのアイコン" },',
    '    { "type": "image_picker", "id": "icon_water", "label": "みずやりのアイコン" }',
    '  ],',
    '  "enabled_on": { "templates": ["product"] },',
    '  "presets": [{ "name": "植物の詳細" }]',
    '}',
    '{% endschema %}',
  ];
  const SECTION_TYPED = [...SECTION_HEAD, DD_BAD, ...SECTION_TAIL];
  const SECTION_FINAL = [...SECTION_HEAD, DD_OK, ...SECTION_TAIL, ...SCHEMA].join('\n');

  window.FILES = {
    files: F, PLANT, FIELDS, PACHIRA, SETS, tagOf,
    SECTION_TYPED, SCHEMA, DD_BAD, DD_OK, SECTION_FINAL, CSS_BAD, CSS_OK,
    CSS_FINAL: F['assets/parts-item-detail.css'].replace(CSS_BAD, CSS_OK),
    TEMPLATE,
  };
})();
