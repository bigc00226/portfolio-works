/*
 * The shop's front theme in the video's local EC-CUBE (the developer's copy of www.koyama-kyugu.com): the live site's
 * Twig source is not public, so the theme is rebuilt from the public HTML of a live product page —
 *   - its stylesheets, icons and images (same paths as on the live site: /html/template/default/assets/project/…,
 *     /html/user_data/assets/…) are saved in theme/html/… and copied into the local EC-CUBE (the live style.css replaces 4.3's);
 *   - default_frame.twig: the live page's head (stylesheets), header, the side bar (category menu, search, contact) and
 *     footer as the live HTML has them, around EC-CUBE's {% block main %} (cart / checkout pages are EC-CUBE 4.3's own);
 *   - Product/detail.twig: the live product page's markup (.detailWrap …) filled from EC-CUBE's Product
 *     (送料 size = the product's tags), with EC-CUBE 4.3's own add-to-cart form and script.
 *
 *   node tools/snapshots/ec-koyama-kyugu/build-theme.js   → theme/app/template/default/*.twig (+ assets into the copy)
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const puppeteer = require(path.join(ROOT, 'node_modules/puppeteer-core'));
const RT = require(path.join(ROOT, 'tools/eccube/runtime'));
const LIVE = 'https://www.koyama-kyugu.com';
const INST = path.join(RT.LOCAL, 'inst', 'ec-koyama-kyugu');
const OUT = path.join(__dirname, 'theme');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36';
const get = async (u) => { const r = await fetch(u, { headers: { 'user-agent': UA } }); if (!r.ok) throw new Error(u + ' ' + r.status); return Buffer.from(await r.arrayBuffer()); };

(async () => {
  const raw = (await get(LIVE + '/products/detail/355')).toString('utf8');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
  const page = await browser.newPage();
  const parts = await page.evaluate((html) => {
    const d = new DOMParser().parseFromString(html, 'text/html');
    d.querySelectorAll('script, noscript').forEach((s) => s.remove());
    const o = (sel) => { const e = d.querySelector(sel); return e ? e.outerHTML : ''; };
    return {
      links: [...d.head.querySelectorAll('link[rel=stylesheet], link[rel~=icon], link[rel=apple-touch-icon]')].map((l) => l.outerHTML),
      header: o('.ec-layoutRole__header'),
      headerBox: o('#contents > .headerBox'),
      sidebar: o('.contentsWrap > aside#sidebar'),   // (the header has another aside#sidebar.sp: the phone menu)
      footer: o('.ec-layoutRole__footer'),
      notes: o('.detailBor'),
      guide: o('.guideArea'),
      modal: o('.ec-modal'),
    };
  }, raw);
  await browser.close();

  // root-relative links (the local copy answers the same paths); Twig's own syntax never appears in the live HTML
  const rel = (h) => h.split(LIVE + '/').join('/').split(LIVE).join('/').replace(/\{([{%#])/g, "{{ '{$1' }}");
  for (const k of Object.keys(parts)) parts[k] = Array.isArray(parts[k]) ? parts[k].map(rel) : rel(parts[k]);

  // the cart count and the member links in the header (both in the header and the headerBox of the live HTML)
  const cartCount = "{% set cartQty = 0 %}{% for Cart in get_all_carts() %}{% set cartQty = cartQty + Cart.TotalQuantity %}{% endfor %}";
  const member = (h) => h
    .replace(/<li><a href="\/entry">会員登録<\/a><\/li>/g, "{% if is_granted('ROLE_USER') %}<li><a href=\"{{ url('mypage') }}\">マイページ</a></li>{% else %}<li><a href=\"{{ url('entry') }}\">会員登録</a></li>{% endif %}")
    .replace(/<li><a href="\/mypage\/login">ログイン<\/a><\/li>/g, "{% if is_granted('ROLE_USER') %}<li><a href=\"{{ url('logout') }}\">ログアウト</a></li>{% else %}<li><a href=\"{{ url('mypage_login') }}\">ログイン</a></li>{% endif %}")
    .replace(/(<a href="\/cart">カート<\/a>\s*)<span>0<\/span>/g, '$1<span>{{ cartQty }}</span>');

  // the stylesheets and pictures the theme uses: into the local copy, same paths
  const files = new Set();
  const all = Object.values(parts).flat().join('\n');
  for (const m of all.matchAll(/(?:src|href|data-img)="(\/html\/[^"?#]+)/g)) files.add(m[1]);
  for (const m of all.matchAll(/srcset="([^"]+)"/g)) m[1].split(',').forEach((s) => { const u = s.trim().split(/\s+/)[0]; if (u.startsWith('/html/')) files.add(u); });
  ['/html/template/default/assets/project/img/detail/serch.png', '/html/template/default/assets/project/img/common/gray.png'].forEach((f) => files.add(f));
  const css = [...files].filter((f) => f.endsWith('.css'));
  for (const f of css) {
    const text = (await get(LIVE + f)).toString('utf8');
    for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
      if (/^(data:|https?:|#)/.test(m[1])) continue;
      const u = new URL(m[1], LIVE + f).pathname;
      if (u.startsWith('/html/')) files.add(u);
    }
  }
  let ok = 0;
  for (const f of files) {
    try {
      const buf = await get(LIVE + f);
      const dest = path.join(OUT, f.replace(/^\//, ''));
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      ok++;
    } catch (e) { console.log('skip', f, e.message); }
  }
  console.log('assets', ok, '/', files.size);

  const head = parts.links.filter((l) => !/favicon|apple-touch/.test(l) || true).join('\n    ');
  const frame = `{#
小山弓具 オンラインショップのテーマ（公開中のページの HTML から作った開発環境用のテーマ）
#}
<!doctype html>
<html lang="{{ eccube_config.locale }}">
<head prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb# product: https://ogp.me/ns/product#">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\\\Common\\\\Constant::TOKEN_NAME')) }}">
    <title>{{ BaseInfo.shop_name }}{% if subtitle is defined and subtitle is not empty %} / {{ subtitle }}{% elseif title is defined and title is not empty %} / {{ title }}{% endif %}</title>
    {{ include('meta.twig') }}
    ${head}
    <script src="{{ asset('front.bundle.js', 'bundle') }}"></script>
    {% block stylesheet %}{% endblock %}
    <script>
        $(function() {
            $.ajaxSetup({ 'headers': { 'ECCUBE-CSRF-TOKEN': $('meta[name="eccube-csrf-token"]').attr('content') } });
        });
    </script>
    {% if plugin_assets is defined %}{{ include('@admin/snippet.twig', { snippets: plugin_assets }) }}{% endif %}
</head>
<body id="page_{{ app.request.get('_route') }}" class="{{ body_class|default('other_page') }}">
${cartCount}
<div id="wrapper" class="NotoSansJp">

<div class="ec-layoutRole">
${member(parts.header)}
    <div class="ec-layoutRole__contents">
        <div class="ec-layoutRole__main">
            <article>
                <div id="contents">
${member(parts.headerBox)}
                    <div class="contentsWrap clearfix">
${parts.sidebar}
                        <div id="main">
                            <div class="inner">
                                {% block main %}{% endblock %}
                            </div>
                        </div>
                    </div>
                </div>
            </article>
        </div>
    </div>
${parts.footer}
</div><!-- ec-layoutRole -->
<div class="ec-overlayRole"></div>
<div class="ec-drawerRoleClose"><i class="fas fa-times"></i></div>
</div><!-- #wrapper -->
{% include('@common/lang.twig') %}
<script src="{{ asset('assets/js/function.js') }}"></script>
<script src="{{ asset('assets/js/eccube.js') }}"></script>
<script src="https://cdn.jsdelivr.net/jquery.slick/1.6.0/slick.min.js"></script>
<script src="/html/template/default/assets/project/js/jquery.matchHeight-min.js"></script>
<script src="/html/template/default/assets/project/js/jquery.biggerlink.min.js"></script>
{% block javascript %}{% endblock %}
{% if plugin_snippets is defined %}
    {{ include('snippet.twig', { snippets: plugin_snippets }) }}
{% endif %}
</body>
</html>
`;

  const detail = `{#
商品詳細（公開中の商品ページと同じマークアップ）
#}
{% extends 'default_frame.twig' %}

{% set body_class = 'product_page' %}

{% block javascript %}
    <script>
        eccube.classCategories = {{ class_categories_as_json(Product)|raw }};
        function fnSetClassCategories(form, classcat_id2_selected) {
            var $form = $(form);
            var product_id = $form.find('input[name=product_id]').val();
            var $sele1 = $form.find('select[name=classcategory_id1]');
            var $sele2 = $form.find('select[name=classcategory_id2]');
            eccube.setClassCategories($form, product_id, $sele1, $sele2, classcat_id2_selected);
        }
        {% if form.classcategory_id2 is defined %}
        fnSetClassCategories($('#form1'), {{ form.classcategory_id2.vars.value|json_encode|raw }});
        {% elseif form.classcategory_id1 is defined %}
        eccube.checkStock($('#form1'), {{ Product.id }}, {{ form.classcategory_id1.vars.value|json_encode|raw }}, null);
        {% endif %}
        $(function() {
            $('.SliderFor').slick({ arrows: false, fade: true, asNavFor: '.SliderNav' });
            $('.SliderNav').slick({ slidesToShow: 4, asNavFor: '.SliderFor', focusOnSelect: true, arrows: false });
        });
    </script>
{% endblock %}

{% block main %}
    {% set Category = (Product.ProductCategories|first).Category ?? null %}
    <div id="breadcrumb">
        <ul>
            <li><a href="{{ url('homepage') }}">トップページ</a></li>
            {% if Category %}{% for C in Category.path %}
            <li><a href="{{ url('product_list') }}?category_id={{ C.id }}">{{ C.name }}</a></li>
            {% endfor %}{% endif %}
            <li>{{ Product.name }}</li>
        </ul>
    </div><!-- /.breadcrumb -->
    <div class="productPower">
        <div class="recomArea">
            <div class="detailWrap">
                <div class="detailBox clearfix">
                    <div class="detailLeft">
                        <div class="detailItem">
                            <div class="SliderFor">
                                {% for ProductImage in Product.ProductImage %}
                                <p class="SliderItem">
                                    <span class="SliderItem_img">
                                        <a rel="image" href="{{ asset(ProductImage, 'save_image') }}" class="SliderBtn fancybox">
                                            <img src="/html/template/default/assets/project/img/detail/serch.png" alt="">
                                        </a>
                                        <img src="{{ asset(ProductImage, 'save_image') }}">
                                    </span>
                                </p>
                                {% endfor %}
                            </div>
                            <div class="SliderNav">
                                {% for ProductImage in Product.ProductImage %}
                                <div class="silderItem">
                                    <img src="{{ asset(ProductImage, 'save_image') }}">
                                </div>
                                {% endfor %}
                            </div>
                        </div><!-- /.detailItem -->
                    </div>
                    <div class="detailRight">
                        <div class="detailMari">
                            <p class="detail01 NotoSerifJp">{{ Product.name }}</p>
                            <p class="detail02">
                                <span class="col01">通販価格</span>
                                <span class="col02">
                                    <span class="price02-default">
                                        {{ Product.getPrice02IncTaxMin|number_format }}{% if Product.getPrice02IncTaxMin != Product.getPrice02IncTaxMax %}～{% endif %}
                                    </span>
                                    <em>円</em>
                                </span>（税込）
                            </p>
                            <div class="detail03">
                                <p class="col01">
                                    {% for Tag in Product.Tags %}
                                    <span class="active">{{ Tag }}</span>
                                    {% endfor %}
                                </p>
                                {% if Product.Tags|filter(t => t.name starts with '送料')|length > 0 %}
                                <p class="col02"><a href="#anchor03">料金表を見る</a></p>
                                {% endif %}
                            </div>
                            <p class="detail04">{{ Product.free_area|raw }}</p>
                            <form action="{{ url('product_add_cart', {id:Product.id}) }}" method="post" id="form1" name="form1">
                                {% if Product.stock_find %}
                                {% if form.classcategory_id1 is defined %}
                                <div class="detailOline">
                                    <dl>
                                        <dt>{{ form_label(form.classcategory_id1, Product.ClassName1) }}</dt>
                                        <dd>
                                            <h3><span>{{ form_widget(form.classcategory_id1, { attr: { class: 'form-control' } }) }}</span></h3>
                                            {% if form.classcategory_id2 is defined %}
                                            <h3><span>{{ form_widget(form.classcategory_id2, { attr: { class: 'form-control' } }) }}</span></h3>
                                            {% endif %}
                                            {% if Product.description_list %}<p>{{ Product.description_list|nl2br }}</p>{% endif %}
                                        </dd>
                                    </dl>
                                </div>
                                {% endif %}
                                <div class="detailFind">
                                    <dl>
                                        <dt>数量</dt>
                                        <dd>
                                            <div class="detailMart">
                                                <h3>
                                                    <span>
                                                        <select id="quantity" name="quantity" class="form-control">
                                                            {% for q in 1..10 %}<option value="{{ q }}"{{ q == 1 ? ' selected="selected"' }}>{{ q }}</option>{% endfor %}
                                                        </select>
                                                    </span>
                                                </h3>
                                                <div class="btn_product_detail">
                                                    <p class="detailBtn"><input type="submit" class="add-cart" value="カートに入れる"></p>
                                                    <p class="detailLikeBtn"><button type="button" id="favorite" class="addHeart"></button></p>
                                                </div>
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                                {% else %}
                                <div class="detailFind">
                                    <input type="button" class="ec-blockBtn--action" value="ただいま品切れ中です。" disabled="disabled">
                                </div>
                                {% endif %}
                                {{ form_widget(form.product_id) }}
                                {{ form_widget(form.ProductClass) }}
                                {{ form_widget(form._token) }}
                            </form>
                            <form id="form_favorite" action="{{ url('product_add_favorite', {id:Product.id}) }}" method="post"></form>
                            ${parts.modal}
                        </div>
                    </div>
                </div>
                <div class="detailAsus">
                    {{ Product.description_detail|raw }}
                </div>
                ${parts.notes}
            </div>
        </div>
    </div>
    ${parts.guide}
{% endblock %}
`;
  const write = (p, t) => { const f = path.join(OUT, p); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, t); };
  write('app/template/default/default_frame.twig', frame);
  write('app/template/default/Product/detail.twig', detail);
  console.log('theme written', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
