/*
 * The shop's look as an EC-CUBE 4 theme ("cagiana", Twig 3) rebuilt from cagiana.jp's public HTML — the EC-CUBE 3 theme's
 * Twig source is not public. Public pages only.
 *
 *   node tools/snapshots/ec-cagiana-migration/build-theme.js   → theme/app/template/cagiana/*.twig + theme/html/template/cagiana/
 *
 *   html/template/cagiana/   the live stylesheets, scripts and pictures at the same paths (/html/template/cagiana/css/style.css …)
 *   default_frame.twig       <head> (the same 4 stylesheets), the live header (svg icons, logo, menu, search, account) and
 *                            footer as they are, {% block main %} between them; EC-CUBE 4's csrf meta and title
 *   Product/detail.twig      the live markup (#item_photo_area slides + thumbnails, maker, item_name, item_code, price02_default,
 *                            item_comment, the bag button) filled by EC-CUBE 4 (Product, AddCartType form); the live slick script
 *   Product/list.twig        the live list markup (.p_list li#result_list_box--{id}) over EC-CUBE 4's pagination
 */
const fs = require('fs');
const path = require('path');
const LIVE = 'https://cagiana.jp';
const UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36' };
const OUT = path.join(__dirname, 'theme');
const TPL = path.join(OUT, 'app/template/cagiana');
const get = async (p) => { const r = await fetch(LIVE + p, { headers: UA }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.text(); };
const saved = new Set();
async function save(urlPath) {
  const p = urlPath.split('?')[0].split('#')[0];
  if (!p.startsWith('/html/template/cagiana/') || saved.has(p)) return;
  saved.add(p);
  const f = path.join(OUT, p);
  if (fs.existsSync(f)) return;
  const r = await fetch(LIVE + p, { headers: UA });
  if (!r.ok) { console.log('missing', p, r.status); return; }
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
}
const between = (h, a, b, from = 0) => { const i = h.indexOf(a, from); const j = h.indexOf(b, i); return i < 0 || j < 0 ? '' : h.slice(i, j + b.length); };
const rel = (h) => h.replace(/https:\/\/cagiana\.jp(?=\/)/g, '').replace(/https:\/\/cagiana\.jp"/g, '/"');
const twigSafe = (h) => h.replace(/\{\{|\{%|\{#/g, (m) => `{{ '${m}' }}`);

(async () => {
  fs.mkdirSync(TPL, { recursive: true });
  const detail = await get('/products/detail/103');
  const list = await get('/products/list');
  // assets: the stylesheets (+ what they use), scripts, header / footer pictures
  const head = detail.slice(0, detail.indexOf('</head>'));
  for (const m of head.matchAll(/href="(\/html\/template\/cagiana\/[^"]+)"/g)) await save(m[1]);
  for (const m of detail.matchAll(/src="(\/html\/template\/cagiana\/[^"]+)"/g)) await save(m[1]);
  for (const css of [...saved].filter((p) => p.endsWith('.css'))) {
    const text = fs.readFileSync(path.join(OUT, css), 'utf8');
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      if (/^(data:|https?:|#)/.test(m[1])) continue;
      await save(path.posix.normalize(path.posix.join(path.posix.dirname(css), m[1])));
    }
  }
  // the frame: body start → before #contents (svg sprite, header); the footer
  const bodyOpen = detail.indexOf('<body');
  const top = detail.slice(detail.indexOf('>', bodyOpen) + 1, detail.indexOf('<div id="contents"'));
  const footer = between(detail, '<footer id="footer">', '</footer>');
  for (const m of (top + footer).matchAll(/src="(\/html\/template\/cagiana\/[^"]+)"/g)) await save(m[1]);
  // the menu's banner pictures (in the shop's upload folder, not product pictures)
  for (const m of (top + footer).matchAll(/src="(?:https:\/\/cagiana\.jp)?(\/html\/upload\/save_image\/[^"]+)"/g)) {
    const f = path.join(OUT, m[1]);
    if (fs.existsSync(f)) continue;
    const r = await fetch(LIVE + m[1], { headers: UA });
    if (r.ok) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(await r.arrayBuffer())); }
  }
  const scripts = [...head.matchAll(/<script src="(\/html\/template\/cagiana\/[^"]+)"/g)].map((m) => m[1].split('?')[0]).filter((s) => !/jquery-1\.11\.3|eccube\.js/.test(s));
  const frame = `{#
CAGIANA《カジーナ》のテーマ（EC-CUBE 4）— EC-CUBE 3 のテーマ（/html/template/cagiana）の見た目を、公開中のページの HTML から Twig 3 に作り直したもの
#}
<!doctype html>
<html lang="ja">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\\\Common\\\\Constant::TOKEN_NAME')) }}">
    <title>{% if subtitle is defined and subtitle is not empty %}{{ subtitle }}｜{% elseif title is defined and title is not empty %}{{ title }}｜{% endif %}{{ BaseInfo.shop_name }}</title>
    <link rel="icon" href="{{ asset('img/cagiana_favicon.ico') }}">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.7.2/css/all.css">
    <link rel="stylesheet" href="{{ asset('css/style.css') }}">
    <link rel="stylesheet" href="{{ asset('css/slick.css') }}">
    <link rel="stylesheet" href="{{ asset('css/default.css') }}">
    <link rel="stylesheet" href="{{ asset('css/custom.css') }}">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>
    {% block stylesheet %}{% endblock %}
</head>
<body id="page_{{ app.request.get('_route') }}" class="{{ body_class|default('other_page') }}">
${twigSafe(rel(top)).trim()}

    <div id="contents" class="theme_main_only">
        {% block main %}{% endblock %}
    </div>

${twigSafe(rel(footer))}
${scripts.map((s) => `<script src="{{ asset('${s.replace('/html/template/cagiana/', '')}') }}"></script>`).join('\n')}
{% block javascript %}{% endblock %}
</body>
</html>
`;
  fs.writeFileSync(path.join(TPL, 'default_frame.twig'), frame);
  // the product page: the live slick script (the inline script that starts the slides)
  const slick = [...detail.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).find((s) => s.includes('.slick(')) || '';
  const detailTwig = `{#
商品詳細（公開中のページのマークアップ。EC-CUBE 3 の Product/detail.twig → EC-CUBE 4 の変数・AddCartType のフォーム）
#}
{% extends 'default_frame.twig' %}
{% set body_class = 'product_page' %}

{% block javascript %}
<script>
${slick.trim()}
</script>
{% endblock %}

{% block main %}
    {% set Child = Product.ProductCategories|filter(pc => pc.Category.hierarchy > 1)|first %}
    {% set Category = Child ? Child.Category : (Product.ProductCategories|length ? (Product.ProductCategories|first).Category : null) %}
    <div id="contents_top">
        <div class="breadcrumb">
            <ul vocab="https://schema.org/" typeof="BreadcrumbList" class="breadcrumb">
                <li property="itemListElement" typeof="ListItem"><a href="{{ url('homepage') }}" property="item" typeof="WebPage" title="home"><img src="{{ asset('img/noun_home.svg') }}" alt="CAGIANAオーダーメイド靴"><span style="display:none;" property="name">ホーム</span><meta property="position" content="1"></a></li>
                <li property="itemListElement" typeof="ListItem"><a href="{{ url('product_list') }}" typeof="WebPage" title="商品一覧ページ"><span property="name">商品一覧ページ</span></a><meta property="position" content="2" /></li>
                {% if Category %}<li property="itemListElement" typeof="ListItem"><a href="{{ url('product_list', {'category_id': Category.id}) }}" typeof="WebPage" title="{{ Category.name }}"><span property="name">{{ Category.name }}</span></a><meta property="position" content="3" /></li>{% endif %}
                <li property="itemListElement" typeof="ListItem"><span property="name">{{ Product.name }}</span><meta property="position" content="{{ Category ? 4 : 3 }}" /></li>
            </ul>
        </div>
    </div>
    <div id="item_detail">
        <div id="detail_wrap" class="row">
            <div id="item_photo_area" class="col-sm-6">
                <div id="detail_image_box__slides" class="slides">
                    {% for ProductImage in Product.ProductImage %}
                    <div id="detail_image_box__item--{{ loop.index }}"><img src="{{ asset(ProductImage, 'save_image') }}" /></div>
                    {% else %}
                    <div><img src="{{ asset(''|no_image_product, 'save_image') }}" /></div>
                    {% endfor %}
                </div>
                <ul id="thumbnail-list" class="row">
                    {% for ProductImage in Product.ProductImage %}
                    <li class="thumbnail-item col-xs-3"><img src="{{ asset(ProductImage, 'save_image') }}" alt="{{ Product.name }}"></li>
                    {% endfor %}
                </ul>
            </div>
            <section id="item_detail_area" class="col-sm-6">
                <div class="ctgr_favt_box"></div>
                {% if Product.search_word %}<div class="plugin_maker_code"><p class="item_code">{{ Product.search_word }}</p></div>{% endif %}
                <h1 id="detail_description_box__name" class="item_name">{{ Product.name }}</h1>
                <p id="detail_description_box__item_range_code" class="item_code"><span id="item_code_default">{{ Product.code_min }}{% if Product.code_min != Product.code_max %} ～ {{ Product.code_max }}{% endif %}</span></p>
                <div id="detail_description_box__body" class="item_detail">
                    <p id="detail_description_box__normal_price" class="normal_price"> <span class="price02_default">¥ {{ Product.getPrice02IncTaxMin|number_format }}{% if Product.hasProductClass and Product.getPrice02IncTaxMin != Product.getPrice02IncTaxMax %} ～ ¥ {{ Product.getPrice02IncTaxMax|number_format }}{% endif %}</span> <span class="small">（税込）</span></p>
                    <div class="cart__position"></div>
                    <p id="detail_not_stock_box__description_detail" class="item_comment">{{ Product.description_detail|raw|nl2br }}</p>
                    <form action="{{ url('product_add_cart', {id: Product.id}) }}" method="post" id="form1" name="form1">
                        <div id="detail_cart_box" class="cart_area">
                            {% if form.classcategory_id1 is defined %}
                            <ul id="detail_cart_box__cart_class_category_id" class="classcategory_list"><li>{{ form_widget(form.classcategory_id1, {'attr': {'class': 'form-control'}}) }}</li></ul>
                            {% endif %}
                            <dl style="display: none;" id="detail_cart_box__cart_quantity" class="quantity"><dt>数量</dt><dd>{{ form_widget(form.quantity, {'attr': {'class': 'form-control'}}) }}</dd></dl>
                            <div id="detail_cart_box__button_area" class="btn_area">
                                <ul id="detail_cart_box__insert_button" class="row">
                                    <li class="col-xs-12 col-sm-8 cart03"><button type="submit" id="add-cart_02" class="btn btn-primary btn-block prevention-btn prevention-mask"><img src="{{ asset('img/noun_ShoppingBag_w.png') }}" alt="ショッピングバッグに追加">ショッピングバッグに追加</button></li>
                                </ul>
                            </div>
                        </div>
                        {{ form_rest(form) }}
                    </form>
                </div>
            </section>
        </div>
    </div>
{% endblock %}
`;
  fs.mkdirSync(path.join(TPL, 'Product'), { recursive: true });
  fs.writeFileSync(path.join(TPL, 'Product/detail.twig'), detailTwig);
  // the list page: the live markup around the items (all products)
  const c0 = list.indexOf('<div id="contents"');
  const ul = list.indexOf('<ul class="row no-padding">', c0);
  const before = list.slice(list.indexOf('>', c0) + 1, ul);
  const afterUl = list.indexOf('</ul>', list.lastIndexOf('result_list_box--'));
  const pag = list.indexOf('<div id="pagination_wrap"', afterUl);
  const after = list.slice(afterUl + 5, pag > 0 ? pag : afterUl + 5);
  for (const m of (before + after).matchAll(/src="(\/html\/template\/cagiana\/[^"]+)"/g)) await save(m[1]);
  const listTwig = `{#
商品一覧（公開中のページのマークアップ：.p_list の li#result_list_box--{id}）
#}
{% extends 'default_frame.twig' %}
{% set body_class = 'product_page' %}

{% block main %}
${twigSafe(rel(before)).replace(/<ul class="row no-padding">\s*$/, '')}<ul class="row no-padding">
        {% for Product in pagination %}
                <li id="result_list_box--{{ Product.id }}" class="col-sm-3 col-xs-6">
                    <a href="{{ url('product_detail', {'id': Product.id}) }}">
                        <img src="{{ asset(Product.main_list_image|no_image_product, 'save_image') }}" alt="{{ Product.name }}">
                        <p class="p_name">{{ Product.name }}</p>
                        <p class="p_price">¥ {{ Product.getPrice02IncTaxMin|number_format }}</p>
                    </a>
                </li>
        {% endfor %}
        </ul>
${twigSafe(rel(after))}
{% endblock %}
`;
  fs.writeFileSync(path.join(TPL, 'Product/list.twig'), listTwig);
  console.log('theme:', saved.size, 'files;', ['default_frame.twig', 'Product/detail.twig', 'Product/list.twig'].map((f) => `${f} ${fs.statSync(path.join(TPL, f)).size} B`).join(', '));
})().catch((e) => { console.error(e); process.exit(1); });
