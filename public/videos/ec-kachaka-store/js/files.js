/*
 * The project the video works in (C:\dev\kachaka-store): EC-CUBE 4.3.1-p1 (Docker, http://localhost:8080) and the new
 * theme "kachaka" — app/template/kachaka (Twig) + html/template/kachaka/assets (CSS, fonts, logo / icons).
 * The markup and class names follow EC-CUBE's own templates (ec-headerNaviRole, ec-itemNav, ec-productRole …) and the
 * look reproduces the public store.kachaka.life; the Twig / CSS are written for the video (the shop's real templates are
 * not public). The very same files are written into the local EC-CUBE the screens are captured from, step by step
 * (tools/snapshots/ec-kachaka-store/capture-ec.js loads this file): what the video types is what EC-CUBE rendered.
 */
(function () {
  'use strict';
  const T = 'app/template/kachaka/';
  const A = 'html/template/kachaka/assets/';
  const files = {};

  files['.env'] = `APP_ENV=prod
APP_DEBUG=0
DATABASE_URL=sqlite:///var/eccube.db
DATABASE_SERVER_VERSION=3
DATABASE_CHARSET=utf8
MAILER_DSN=null://null
ECCUBE_AUTH_MAGIC=x7Rk2pQe9LmVt4Zs
ECCUBE_ADMIN_ROUTE=admin
ECCUBE_TEMPLATE_CODE=default
ECCUBE_LOCALE=ja
ECCUBE_TIMEZONE=Asia/Tokyo
ECCUBE_CURRENCY=JPY
TRUSTED_HOSTS=^127\\.0\\.0\\.1$,^localhost$
`;

  files['README.md'] = `# kachaka Online Store デザインリニューアル

EC-CUBE 4.3.1-p1（Docker：http://localhost:8080 、管理画面は /admin）

## 方針
- 標準テーマ（default）から、ブランドサイトに合わせた新テーマ「kachaka」へ
- テンプレートは default を上書きするファイルだけを app/template/kachaka に置く
- 色：ネイビー #1c2742 / クリーム #fffaf3 / ベージュ #dfccbb / コーラル #ff5e5e
- 欧文は Poppins（assets/fonts に同梱）、和文は Noto Sans JP
- PC は左にカテゴリ、トップはカテゴリごとに商品を並べる
- スマートフォン（〜767px）はハンバーガーメニュー、商品は 2 列

## 作業
1. テンプレート「kachaka」を登録（オーナーズストア > テンプレート）
2. default_frame.twig・ヘッダー・フッター（Block/*.twig）と kachaka.css
3. ブロック「お知らせバー」、レイアウト（左カラムにカテゴリ）
4. トップ（index.twig）・商品一覧・商品詳細
5. スマートフォン表示の確認
6. 本番へ反映（git → deploy、本番の管理画面でテンプレート・ブロック・レイアウト）

## メモ
- APP_ENV=prod では Twig のキャッシュが残る：テンプレートを直したら
  \`bin/console cache:clear --no-warmup\`（またはコンテンツ管理 > キャッシュ管理）
`;

  files['docker-compose.yml'] = `services:
  ec-cube:
    image: \${ECCUBE_IMAGE:-ec-cube}
    ports:
      - 8080:80
      - 4430:443
    volumes:
      - ".:/var/www/html:cached"
      - "var:/var/www/html/var"
    environment:
      APP_ENV: "prod"
      APP_DEBUG: 0
      DATABASE_URL: "sqlite:///var/eccube.db"
      ECCUBE_ADMIN_ROUTE: "admin"

volumes:
  var:
    driver: local
`;

  /* ------------------------------------------------------------------ default_frame.twig (EC-CUBE's own, + 1 line) */
  const FRAME = `<!doctype html>
{#
This file is part of EC-CUBE

Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved.

http://www.ec-cube.co.jp/

For the full copyright and license information, please view the LICENSE
file that was distributed with this source code.
#}
<html lang="{{ eccube_config.locale }}">
<head prefix="og: https://ogp.me/ns# fb: https://ogp.me/ns/fb# product: https://ogp.me/ns/product#">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="eccube-csrf-token" content="{{ csrf_token(constant('Eccube\\\\Common\\\\Constant::TOKEN_NAME')) }}">
    <title>{{ BaseInfo.shop_name }}{% if subtitle is defined and subtitle is not empty %} / {{ subtitle }}{% elseif title is defined and title is not empty %} / {{ title }}{% endif %}</title>
    {% if Page.meta_tags is not empty %}
        {{ include(template_from_string(Page.meta_tags), sandboxed = true) }}
        {% if Page.description is not empty %}
            <meta name="description" content="{{ Page.description }}">
        {% endif %}
    {% else %}
        {{ include('meta.twig') }}
    {% endif %}
    {% if Page.author is not empty %}
        <meta name="author" content="{{ Page.author }}">
    {% endif %}
    {% if Page.keyword is not empty %}
        <meta name="keywords" content="{{ Page.keyword }}">
    {% endif %}
    {% if Page.meta_robots is not empty %}
        <meta name="robots" content="{{ Page.meta_robots }}">
    {% endif %}
    <link rel="icon" href="{{ asset('assets/img/common/favicon.ico', 'user_data') }}">
    <link rel="stylesheet" href="https://use.fontawesome.com/releases/v6.5.2/css/all.css" integrity="sha384-PPIZEGYM1v8zp5Py7UjFb79S58UeqCL9pYVnVPURKEqvioPROaVAJKKLzvH2rDnI" crossorigin="anonymous">
    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">
    <script src="{{ asset('front.bundle.js', 'bundle') }}"></script>
    {% block stylesheet %}{% endblock %}
    <script>
        $(function() {
            $.ajaxSetup({
                'headers': {
                    'ECCUBE-CSRF-TOKEN': $('meta[name="eccube-csrf-token"]').attr('content')
                }
            });
        });
    </script>
    {# Layout: HEAD #}
    {% if Layout.Head %}
        {{ include('block.twig', {'Blocks': Layout.Head}) }}
    {% endif %}
    {# プラグイン用styleseetやmetatagなど #}
    {% if plugin_assets is defined %}{{ include('@admin/snippet.twig', { snippets: plugin_assets }) }}{% endif %}
    <link rel="stylesheet" href="{{ asset('assets/css/customize.css', 'user_data') }}">
</head>
<body id="page_{{ app.request.get('_route') }}" class="{{ body_class|default('other_page') }}">
{# Layout: BODY_AFTER #}
{% if Layout.BodyAfter %}
    {{ include('block.twig', {'Blocks': Layout.BodyAfter}) }}
{% endif %}


{%  if isMaintenance is defined and isMaintenance and isDebugMode %}
    <dev class="ec-twoModeAlert">
        <div class="ec-maintenanceAlert">
            <div>
                <div class="ec-maintenanceAlert__icon"><img src="{{ asset('assets/icon/exclamation-white.svg') }}"/></div>
                {{ 'メンテナンスモードが有効になっています。'|trans }}
            </div>
        </div>
        <div class="ec-debugModeAlert bg-danger">
            <div>
                <div class="ec-debugModeAlert__icon"><img src="{{ asset('assets/icon/exclamation-white.svg') }}"/></div>
                {{ 'デバッグモードが有効になっています。'|trans }}
            </div>
        </div>
    </dev>
{%  else %}
    {% if isMaintenance %}
        <div class="ec-maintenanceAlert">
            <div>
                <div class="ec-maintenanceAlert__icon"><img src="{{ asset('assets/icon/exclamation-white.svg') }}"/></div>
                {{ 'メンテナンスモードが有効になっています。'|trans }}
            </div>
        </div>
    {% endif %}
    {% if isDebugMode %}
        <div class="ec-debugModeAlert bg-danger">
            <div>
                <div class="ec-debugModeAlert__icon"><img src="{{ asset('assets/icon/exclamation-white.svg') }}"/></div>
                {{ 'デバッグモードが有効になっています。'|trans }}
            </div>
        </div>
    {% endif %}
{% endif %}

<div class="ec-layoutRole">
    {# Layout: HEADER #}
    {% if Layout.Header %}
        <header class="ec-layoutRole__header">
            {{ include('block.twig', {'Blocks': Layout.Header}) }}
        </header>
    {% endif %}

    {# Layout: CONTENTS_TOP #}
    {% if Layout.ContentsTop %}
        <div class="ec-layoutRole__contentTop">
            {{ include('block.twig', {'Blocks': Layout.ContentsTop}) }}
        </div>
    {% endif %}

    <div class="ec-layoutRole__contents">
        {# Layout: SIDE_LEFT #}
        {% if Layout.SideLeft %}
            <aside class="ec-layoutRole__left">
                {{ include('block.twig', {'Blocks': Layout.SideLeft}) }}
            </aside>
        {% endif %}

        {% set layoutRoleMain = 'ec-layoutRole__main' %}
        {% if Layout.ColumnNum == 2 %}
            {% set layoutRoleMain = 'ec-layoutRole__mainWithColumn' %}
        {% elseif Layout.ColumnNum == 3 %}
            {% set layoutRoleMain = 'ec-layoutRole__mainBetweenColumn' %}
        {% endif %}

        <main class="{{ layoutRoleMain }}">
            {# Layout: MAIN_TOP #}
            {% if Layout.MainTop %}
                <div class="ec-layoutRole__mainTop">
                    {{ include('block.twig', {'Blocks': Layout.MainTop}) }}
                </div>
            {% endif %}

            {# MAIN AREA #}
            {% block main %}{% endblock %}

            {# Layout: MAIN_Bottom #}
            {% if Layout.MainBottom %}
                <div class="ec-layoutRole__mainBottom">
                    {{ include('block.twig', {'Blocks': Layout.MainBottom}) }}
                </div>
            {% endif %}
        </main>

        {# Layout: SIDE_RIGHT #}
        {% if Layout.SideRight %}
            <aside class="ec-layoutRole__right">
                {{ include('block.twig', {'Blocks': Layout.SideRight}) }}
            </aside>
        {% endif %}
    </div>

    {# Layout: CONTENTS_BOTTOM #}
    {% if Layout.ContentsBottom %}
        <div class="ec-layoutRole__contentBottom">
            {{ include('block.twig', {'Blocks': Layout.ContentsBottom}) }}
        </div>
    {% endif %}

    {# Layout: CONTENTS_FOOTER #}
    {% if Layout.Footer %}
        <footer class="ec-layoutRole__footer">
            {{ include('block.twig', {'Blocks': Layout.Footer}) }}
        </footer>
    {% endif %}
</div><!-- ec-layoutRole -->

<div class="ec-overlayRole"></div>
<div class="ec-drawerRoleClose"><i class="fas fa-times"></i></div>
<div class="ec-drawerRole">
    {# Layout: DRAWER #}
    {% if Layout.Drawer %}
        {{ include('block.twig', {'Blocks': Layout.Drawer}) }}
    {% endif %}
</div>
<div class="ec-blockTopBtn pagetop">{{'ページトップへ'|trans}}</div>
{% include('@common/lang.twig') %}
<script src="{{ asset('assets/js/function.js') }}"></script>
<script src="{{ asset('assets/js/eccube.js') }}"></script>
{% block javascript %}{% endblock %}
{# Layout: CLOSE_BODY_BEFORE #}
{% if Layout.CloseBodyBefore %}
    {{ include('block.twig', {'Blocks': Layout.CloseBodyBefore}) }}
{% endif %}
{# プラグイン用Snippet #}
{% if plugin_snippets is defined %}
    {{ include('snippet.twig', { snippets: plugin_snippets }) }}
{% endif %}
    <script src="{{ asset('assets/js/customize.js', 'user_data') }}"></script>
</body>
</html>
`;
  const FRAME_AFTER = `    <link rel="stylesheet" href="{{ asset('assets/css/style.css') }}">`;
  const FRAME_LINK = `    <link rel="stylesheet" href="{{ asset('assets/css/kachaka.css') }}">`;
  const frameWithLink = () => FRAME.replace(FRAME_AFTER + '\n', FRAME_AFTER + '\n' + FRAME_LINK + '\n');

  /* ------------------------------------------------------------------ Block/header.twig */
  const HEADER_HEAD = `{#
kachaka Online Store — ヘッダー（ロゴ・ナビ・カート）
default の Block/header.twig を置き換え（商品検索はなし）
#}
{% set totalQuantity = get_carts_total_quantity() %}
<div class="ec-headerNaviRole">
    <div class="ec-headerNaviRole__inner">
        <div class="ec-headerRole__navSP">
            {{ include('Block/nav_sp.twig') }}
        </div>
        <h1 class="ec-headerTitle">
            <a href="{{ url('homepage') }}">
                <img src="{{ asset('assets/img/common/logo.svg') }}" alt="{{ BaseInfo.shop_name }}">
            </a>
        </h1>
        <nav class="ec-headerNav">
            {% if is_granted('ROLE_USER') %}
                <a class="ec-headerNav__item" href="{{ url('mypage') }}">マイページ</a>
            {% else %}
                <a class="ec-headerNav__item" href="{{ url('mypage_login') }}">ログイン</a>
            {% endif %}
            <a class="ec-headerNav__item" href="https://kachaka.zendesk.com/hc/ja/categories/6113617927567" target="_blank">お買い物ガイド</a>
            <a class="ec-headerNav__item" href="https://kachaka.life/" target="_blank" rel="noopener">ブランドサイト</a>`;
  const HEADER_ADD = [
    `            <a class="ec-headerNav__item" href="https://kachaka.zendesk.com/hc/ja" target="_blank">お問い合わせ</a>`,
  ];
  const HEADER_TAIL = `        </nav>
        <a class="ec-headerCart" href="{{ url('cart') }}">
            <img src="{{ asset('assets/icon/header-cart.svg') }}" alt="カート">
            {% if totalQuantity > 0 %}
                <span class="ec-headerCart__badge">{{ totalQuantity|number_format }}</span>
            {% endif %}
        </a>
    </div>
</div>
`;
  const HEADER_V1 = HEADER_HEAD + '\n' + HEADER_TAIL;
  const HEADER_V2 = HEADER_HEAD + '\n' + HEADER_ADD.join('\n') + '\n' + HEADER_TAIL;
  /** the line the new item goes after */
  const HEADER_ANCHOR = HEADER_HEAD.split('\n').pop();

  files['app/template/kachaka/Block/nav_sp.twig'] = null; // (placeholder: not in the theme — default's nav_sp is used)

  /* ------------------------------------------------------------------ Block/footer.twig */
  const SNS = [['twitter', 'https://twitter.com/kachaka_jp'], ['instagram', 'https://www.instagram.com/kachaka_jp/'], ['line', 'https://line.me/R/ti/p/@517tfxcx'], ['note', 'https://note.kachaka.life/'], ['youtube', 'https://www.youtube.com/channel/UCVxw9HcaY63oywJ3IqpbY9w']];
  const FOOTER = `{#
kachaka Online Store — フッター
#}
{% set guide = 'https://kachaka.zendesk.com/hc/ja' %}
<div class="ec-footerRole">
    <div class="ec-footerRole__inner">
        <div class="ec-footerRole__left">
            <a class="ec-footerLogo" href="{{ url('homepage') }}">
                <img src="{{ asset('assets/img/common/logo-white.svg') }}" alt="kachaka">
            </a>
            <ul class="ec-footerNavi">
                <li><a href="{{ guide }}/categories/6113617927567" target="_blank">お買い物ガイド</a></li>
                <li><a href="{{ guide }}/articles/6113624838415" target="_blank">配送・送料について</a></li>
                <li><a href="{{ guide }}/articles/6113677497871" target="_blank">お支払い方法について</a></li>
                <li><a href="{{ guide }}/articles/6113720545807" target="_blank">注文キャンセルについて</a></li>
            </ul>
            <ul class="ec-footerNavi">
                <li><a href="{{ url('help_about') }}">当サイトについて</a></li>
                <li><a href="{{ guide }}/articles/6238384353807" target="_blank">プライバシーポリシー</a></li>
                <li><a href="{{ url('help_tradelaw') }}">特定商取引法に基づく表記</a></li>
                <li><a href="{{ guide }}" target="_blank">サポート</a></li>
            </ul>
        </div>
        <div class="ec-footerRole__right">
            <ul class="ec-footerSns">
                {% for sns in [${SNS.map(([k, u]) => `['${k}', '${u}']`).join(', ')}] %}
                    <li class="ec-footerSns__item">
                        <a href="{{ sns[1] }}" target="_blank" rel="noopener"><img src="{{ asset('assets/icon/footer-' ~ sns[0] ~ '-32px.svg') }}" alt="{{ sns[0] }}"></a>
                    </li>
                {% endfor %}
            </ul>
            <p class="ec-footerCopyright">&copy;{{ 'now'|date('Y') }} Preferred Robotics</p>
        </div>
    </div>
</div>
`;

  /* ------------------------------------------------------------------ Block/category_nav_pc.twig (the left column) */
  const CATNAV_HEAD = `{#
kachaka Online Store — カテゴリ（PC の左カラム）。トップのカテゴリの見出しへ
#}
{% set Categories = repository('Eccube\\\\Entity\\\\Category').getList() %}
<div class="ec-categoryNaviRole">`;
  const CATNAV_TYPE = [
    `    <h4 class="ec-categoryNaviRole__title">Categories</h4>`,
    `    <ul class="ec-itemNav__nav">`,
    `        {% for Category in Categories %}`,
    `            <li><a href="{{ url('homepage') }}#category_id_{{ Category.id }}">{{ Category.name }}</a></li>`,
    `        {% endfor %}`,
    `    </ul>`,
    `</div>`,
  ];
  const CATNAV = CATNAV_HEAD + '\n' + CATNAV_TYPE.join('\n') + '\n';

  /* ------------------------------------------------------------------ Block/header_news.twig (made in the admin) */
  const HEADER_NEWS = `{# お知らせバー：最新のお知らせを 1 件（ないときは帯だけ） #}
{% set NewsList = repository('Eccube\\\\Entity\\\\News').getList() %}
<div class="ec-headerNewsRole">
    {% if NewsList is not empty %}
        {% set News = NewsList|first %}
        <a class="ec-headerNewsRole__news" href="{{ News.url ?: url('homepage') }}">{{ News.title }}</a>
    {% endif %}
</div>`;

  /* ------------------------------------------------------------------ index.twig */
  const INDEX_HEAD = `{#
kachaka Online Store — トップページ：カテゴリごとに商品を並べる
#}
{% extends 'default_frame.twig' %}

{% set body_class = 'front_page' %}

{% block main %}
    {# カテゴリの見出し（英語） #}
    {% set headings = {7: 'Kachaka Furniture', 8: 'Kachaka Accessory', 12: 'Kachaka Subscription', 13: 'Kachaka'} %}
    <div class="ec-newItemRole">
        {% for Category in repository('Eccube\\\\Entity\\\\Category').getList() %}
            {% set Products = Category.ProductCategories|map(pc => pc.Product)|filter(p => p.Status.id == 1)|sort((a, b) => b.create_date <=> a.create_date) %}
            <section class="ec-newItemRole__category" id="category_id_{{ Category.id }}">
                <h2 class="ec-secHeading">{{ headings[Category.id] ?? Category.name }}</h2>
                <ul class="ec-item">`;
  /** typed in the video (the inner loop): the first time without its {% endfor %} */
  const INDEX_LOOP = [
    `                    {% for Product in Products %}`,
    `                        <li class="ec-item__listItem">`,
    `                            <a href="{{ url('product_detail', {'id': Product.id}) }}">`,
    `                                <img src="{{ asset(Product.main_list_image|no_image_product, 'save_image') }}" alt="{{ Product.name }}">`,
    `                                <p class="ec-item__listItemTitle">{{ Product.name }}</p>`,
    `                                <p class="ec-item__listItemPrice">&yen;{{ Product.getPrice02IncTaxMin|number_format }}(税込)</p>`,
    `                                {% if not Product.stock_find %}`,
    `                                    <p class="ec-soldout">SOLD OUT</p>`,
    `                                {% endif %}`,
    `                            </a>`,
    `                        </li>`,
  ];
  const INDEX_ENDFOR = `                    {% endfor %}`;
  const INDEX_TAIL = [
    `                </ul>`,
    `            </section>`,
    `        {% endfor %}`,
    `    </div>`,
    `{% endblock %}`,
  ];
  const INDEX_BAD = [INDEX_HEAD, ...INDEX_LOOP, ...INDEX_TAIL, ''].join('\n');
  const INDEX = [INDEX_HEAD, ...INDEX_LOOP, INDEX_ENDFOR, ...INDEX_TAIL, ''].join('\n');

  /* ------------------------------------------------------------------ Product/list.twig */
  const LIST = `{#
kachaka Online Store — 商品一覧（default の Product/list.twig をもとに、4 列・カートボタンなし）
#}
{% extends 'default_frame.twig' %}

{% set body_class = 'product_page' %}

{% block main %}
    <div class="ec-searchnavRole">
        <form name="form1" id="form1" method="get" action="?">
            {% for item in search_form %}
                <input type="hidden" id="{{ item.vars.id }}" name="{{ item.vars.full_name }}"{% if item.vars.value is not empty %} value="{{ item.vars.value }}"{% endif %}>
            {% endfor %}
        </form>
        <ol class="ec-topicpath">
            <li class="ec-topicpath__item"><a href="{{ url('product_list') }}">全て</a></li>
            {% if Category is not null %}
                {% for Path in Category.path %}
                    <li class="ec-topicpath__item"><a href="{{ url('product_list') }}?category_id={{ Path.id }}">{{ Path.name }}</a></li>
                {% endfor %}
            {% endif %}
        </ol>
        <div class="ec-searchnavRole__infos">
            <p class="ec-searchnavRole__counter"><b>{{ pagination.totalItemCount }}件</b>の商品が見つかりました</p>
            <div class="ec-select">
                {{ form_widget(search_form.disp_number, {'id': '', 'attr': {'class': 'disp-number'}}) }}
                {{ form_widget(search_form.orderby, {'id': '', 'attr': {'class': 'order-by'}}) }}
            </div>
        </div>
    </div>
    <ul class="ec-shelfGrid">
        {% for Product in pagination %}
            <li class="ec-shelfGrid__item">
                <a href="{{ url('product_detail', {'id': Product.id}) }}">
                    <img src="{{ asset(Product.main_list_image|no_image_product, 'save_image') }}" alt="{{ Product.name }}">
                    <p class="ec-shelfGrid__name">{{ Product.name }}</p>
                    {% if Product.description_list %}
                        <p class="ec-shelfGrid__text">{{ Product.description_list|raw|nl2br }}</p>
                    {% endif %}
                    <p class="ec-shelfGrid__price">&yen;{{ Product.getPrice02IncTaxMin|number_format }}</p>
                </a>
            </li>
        {% endfor %}
    </ul>
    <div class="ec-pagerRole">
        {% include "pager.twig" with {'pages': pagination.paginationData} %}
    </div>
{% endblock %}
`;

  /* ------------------------------------------------------------------ Product/detail.twig */
  const DETAIL = `{#
kachaka Online Store — 商品詳細（画像・型番・説明、下に本体価格とカート）
#}
{% extends 'default_frame.twig' %}

{% set body_class = 'product_page' %}

{% block main %}
    {% set MainImage = Product.ProductImage|first %}
    <div class="ec-productRole">
        <div class="ec-productRole__inner">
            <div class="ec-productRole__images">
                <div class="ec-productRole__mainImage">
                    <img src="{{ asset(MainImage ?: ''|no_image_product, 'save_image') }}" alt="{{ Product.name }}">
                </div>
                <ul class="ec-productRole__thumbs">
                    {% for ProductImage in Product.ProductImage %}
                        <li{% if loop.first %} class="is-current"{% endif %}><img src="{{ asset(ProductImage, 'save_image') }}" alt=""></li>
                    {% endfor %}
                </ul>
            </div>
            <div class="ec-productRole__profile">
                <h2 class="ec-headingTitle">{{ Product.name }}</h2>
                <p class="ec-productRole__price">&yen;{{ Product.getPrice02IncTaxMin|number_format }}(税込)</p>
                {% if Product.code_min is not empty %}
                    <p class="ec-productRole__code">型番：{{ Product.code_min }}{% if Product.code_min != Product.code_max %} ～ {{ Product.code_max }}{% endif %}</p>
                {% endif %}
                <div class="ec-productRole__description">{{ Product.description_detail|raw|nl2br }}</div>
            </div>
        </div>
        <form class="ec-productRole__cart" action="{{ url('product_add_cart', {id: Product.id}) }}" method="post" id="form1" name="form1">
            <dl class="ec-productRole__total">
                <dt>本体価格</dt>
                <dd>&yen;{{ Product.getPrice02IncTaxMin|number_format }}<small>(税込)</small></dd>
                <dt class="ec-productRole__totalItem">{{ Product.name }}</dt>
                <dd class="ec-productRole__totalItem">&yen;{{ Product.getPrice02IncTaxMin|number_format }}(税込)</dd>
            </dl>
            <div class="ec-productRole__actions">
                {% if Product.stock_find %}
                    {% if form.classcategory_id1 is defined %}
                        <div class="ec-select">{{ form_widget(form.classcategory_id1) }}</div>
                    {% endif %}
                    <div class="ec-numberInput"><span>数量</span>{{ form_widget(form.quantity) }}</div>
                    <button type="submit" class="ec-blockBtn--action add-cart">カートに入れる</button>
                {% else %}
                    <button type="button" class="ec-blockBtn--action" disabled>SOLD OUT</button>
                {% endif %}
            </div>
            {{ form_rest(form) }}
        </form>
    </div>
{% endblock %}
`;

  /* ------------------------------------------------------------------ assets/css/kachaka.css */
  const CSS = `@charset "UTF-8";
/*
 * kachaka Online Store — テーマ kachaka
 * EC-CUBE 標準の assets/css/style.css の後に読み込み（default_frame.twig）
 */
@font-face { font-family: "Poppins"; font-weight: 400; font-display: swap; src: url("../fonts/poppins-400.woff2") format("woff2"); }
@font-face { font-family: "Poppins"; font-weight: 500; font-display: swap; src: url("../fonts/poppins-500.woff2") format("woff2"); }
@font-face { font-family: "Poppins"; font-weight: 600; font-display: swap; src: url("../fonts/poppins-600.woff2") format("woff2"); }

:root {
  --kc-navy: #1c2742;
  --kc-cream: #fffaf3;
  --kc-beige: #dfccbb;
  --kc-sand: #f4e8db;
  --kc-coral: #ff5e5e;
  --kc-slate: #8792b5;
  --kc-en: "Poppins", sans-serif;
  --kc-font: "Poppins", "Noto Sans JP", "Hiragino Sans", "Yu Gothic", YuGothic, Meiryo, sans-serif;
  --kc-width: 1520px;
}

/* ---------------------------------------------------------------- 全体 */
body { background: var(--kc-cream); color: var(--kc-navy); font-family: var(--kc-font); letter-spacing: .06em; }
a, a:hover, a:focus { color: var(--kc-navy); text-decoration: none; }
a:hover { opacity: .7; }
.ec-layoutRole { background: var(--kc-cream); }
.ec-layoutRole .ec-layoutRole__contents { max-width: var(--kc-width); padding: 0; }
.ec-layoutRole .ec-layoutRole__left { width: 230px; flex: none; margin-right: 90px; padding-top: 60px; }
.ec-layoutRole .ec-layoutRole__mainWithColumn { width: auto; flex: 1; min-width: 0; }

/* ---------------------------------------------------------------- お知らせバー */
.ec-layoutRole .ec-headerNewsRole { height: 40px; background: var(--kc-navy); display: flex; align-items: center; justify-content: center; }
.ec-layoutRole .ec-headerNewsRole__news { color: #fff; font-size: 13px; }
.ec-layoutRole .ec-headerNewsRole__news:hover { color: #fff; }

/* ---------------------------------------------------------------- ヘッダー */
.ec-layoutRole .ec-layoutRole__header { background: var(--kc-cream); border-bottom: 1px solid #ece2d6; }
.ec-layoutRole .ec-headerNaviRole { max-width: none; padding: 0; display: block; }
.ec-layoutRole .ec-headerNaviRole__inner { max-width: var(--kc-width); height: 116px; margin: 0 auto; display: flex; align-items: center; }
.ec-layoutRole .ec-headerRole__navSP { display: none; }
.ec-layoutRole .ec-headerTitle { margin: 0; line-height: 1; }
.ec-layoutRole .ec-headerTitle img { display: block; width: 410px; height: auto; }
.ec-layoutRole .ec-headerNav { margin-left: auto; display: flex; gap: 25px; }
.ec-layoutRole .ec-headerNav__item { font-size: 15px; letter-spacing: .08em; }
.ec-layoutRole .ec-headerCart { position: relative; margin-left: 28px; width: 54px; height: 54px; border-radius: 50%; background: var(--kc-slate); display: flex; align-items: center; justify-content: center; }
.ec-layoutRole .ec-headerCart img { width: 24px; height: 24px; }
.ec-layoutRole .ec-headerCart__badge { position: absolute; top: -4px; right: -4px; min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px; background: var(--kc-coral); color: #fff; font: 600 12px/22px var(--kc-en); text-align: center; letter-spacing: 0; }

/* ---------------------------------------------------------------- 左カラム：カテゴリ */
.ec-layoutRole .ec-categoryNaviRole { width: auto; max-width: none; padding: 0; margin: 0; }
.ec-layoutRole .ec-categoryNaviRole__title { margin: 0 0 22px; font: 600 24px/1.2 var(--kc-en); letter-spacing: .05em; }
.ec-layoutRole .ec-categoryNaviRole .ec-itemNav__nav { display: block; width: auto; margin: 0; padding: 0; border-top: 1px solid var(--kc-beige); }
.ec-layoutRole .ec-categoryNaviRole .ec-itemNav__nav li { float: none; width: auto; border-bottom: 1px solid var(--kc-beige); }
.ec-layoutRole .ec-categoryNaviRole .ec-itemNav__nav li a { display: flex; align-items: center; justify-content: space-between; padding: 17px 6px; border: 0; background: none; color: var(--kc-navy); font-size: 15px; font-weight: 400; letter-spacing: .03em; white-space: nowrap; text-align: left; }
.ec-layoutRole .ec-categoryNaviRole .ec-itemNav__nav li a::after { content: ""; width: 9px; height: 9px; margin-right: 6px; border-top: 1.5px solid currentColor; border-right: 1.5px solid currentColor; transform: rotate(45deg); }

/* ---------------------------------------------------------------- トップ：カテゴリごとの商品 */
.ec-layoutRole .ec-newItemRole { display: grid; grid-template-columns: 1fr 1fr; column-gap: 40px; padding: 108px 0 40px; }
.ec-layoutRole .ec-newItemRole__category { margin-bottom: 88px; }
.ec-layoutRole .ec-secHeading { margin: 0 0 46px; font: 600 42px/1.2 var(--kc-en); letter-spacing: .04em; color: var(--kc-navy); }
.ec-layoutRole .ec-item { display: grid; grid-template-columns: repeat(2, 260px); gap: 40px; margin: 0; padding: 0; list-style: none; }
.ec-layoutRole .ec-item__listItem img { display: block; width: 260px; height: 260px; object-fit: cover; border-radius: 18px; background: #f3f3f2; }
.ec-layoutRole .ec-item__listItemTitle { margin: 22px 0 12px; font-size: 15px; font-weight: 700; letter-spacing: .1em; }
.ec-layoutRole .ec-item__listItemPrice { margin: 0; font-size: 15px; font-weight: 500; letter-spacing: .08em; }
.ec-layoutRole .ec-soldout { margin: 14px 0 0; color: var(--kc-coral); font: 600 17px var(--kc-en); letter-spacing: .08em; }

/* ---------------------------------------------------------------- 商品一覧 */
.ec-layoutRole .ec-searchnavRole { max-width: none; padding: 60px 0 0; }
.ec-layoutRole .ec-topicpath { margin: 0; padding: 0 0 14px; border-bottom: 1px solid #ddd5cc; list-style: none; font-size: 14px; }
.ec-layoutRole .ec-topicpath__item a { color: #576585; }
.ec-layoutRole .ec-searchnavRole__infos { display: flex; justify-content: space-between; align-items: center; padding: 18px 0 0; border: 0; }
.ec-layoutRole .ec-searchnavRole__counter { margin: 0; font-size: 14px; }
.ec-layoutRole .ec-searchnavRole .ec-select { margin: 0; }
.ec-layoutRole .ec-searchnavRole .ec-select select { height: 34px; font-size: 13px; color: #999; background-color: #fff; border: 1px solid #ccc; border-radius: 3px; }
.ec-layoutRole .ec-shelfGrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 50px 33px; margin: 50px 0 100px; padding: 0; list-style: none; }
.ec-layoutRole .ec-shelfGrid .ec-shelfGrid__item { width: auto; padding: 0; margin: 0; }
.ec-layoutRole .ec-shelfGrid__item img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; }
.ec-layoutRole .ec-shelfGrid__name { margin: 28px 0 6px; font-size: 15px; }
.ec-layoutRole .ec-shelfGrid__text { margin: 0 0 4px; font-size: 15px; line-height: 1.5; }
.ec-layoutRole .ec-shelfGrid__price { margin: 0; font: 400 16px var(--kc-en); letter-spacing: .08em; }
.ec-layoutRole .ec-pagerRole { display: none; }

/* ---------------------------------------------------------------- 商品詳細 */
.ec-layoutRole .ec-productRole { max-width: none; padding: 60px 0 110px; }
.ec-layoutRole .ec-productRole__inner { display: flex; gap: 50px; align-items: flex-start; }
.ec-layoutRole .ec-productRole__images { width: 530px; flex: none; }
.ec-layoutRole .ec-productRole__mainImage img { display: block; width: 530px; height: 530px; object-fit: cover; border-radius: 16px; }
.ec-layoutRole .ec-productRole__thumbs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 26px 0 0; padding: 0; list-style: none; }
.ec-layoutRole .ec-productRole__thumbs img { display: block; width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; }
.ec-layoutRole .ec-productRole__profile { flex: 1; min-width: 0; }
.ec-layoutRole .ec-productRole .ec-headingTitle { margin: 0; color: var(--kc-navy); padding: 4px 0 28px; border-bottom: 1px solid #e8ddd1; font-size: 32px; font-weight: 700; letter-spacing: .06em; }
.ec-layoutRole .ec-productRole__price { margin: 0; color: var(--kc-navy); padding: 22px 0; border-bottom: 1px solid #e8ddd1; font-size: 29px; font-weight: 700; }
.ec-layoutRole .ec-productRole__code { margin: 10px 0 0; padding: 0; border: 0; font-size: 12px; }
.ec-layoutRole .ec-productRole__description { margin-top: 64px; font-size: 13px; line-height: 2.1; }
.ec-layoutRole .ec-productRole__cart { display: flex; justify-content: center; gap: 90px; margin-top: 90px; }
.ec-layoutRole .ec-productRole__total { display: grid; grid-template-columns: 1fr auto; row-gap: 10px; width: 615px; margin: 0; padding-bottom: 18px; border-bottom: 1px solid #ddd5cc; font-size: 15px; }
.ec-layoutRole .ec-productRole__total dt { font-weight: 700; }
.ec-layoutRole .ec-productRole__total dd { margin: 0; text-align: right; font: 600 22px var(--kc-en); }
.ec-layoutRole .ec-productRole__total dd small { font-size: 14px; }
.ec-layoutRole .ec-productRole__total .ec-productRole__totalItem { font: 400 15px var(--kc-font); }
.ec-layoutRole .ec-productRole__actions { width: 300px; }
.ec-layoutRole .ec-productRole__actions .ec-numberInput span { display: block; margin-bottom: 6px; font-size: 13px; }
.ec-layoutRole .ec-productRole__actions .ec-numberInput input { width: 64px; height: 40px; text-align: center; border: 1px solid #ccc; border-radius: 3px; background: #fff; }
.ec-layoutRole .ec-productRole__actions .ec-select { margin-bottom: 14px; }
.ec-layoutRole .ec-blockBtn--action { display: block; width: 300px; height: 56px; margin-top: 30px; border: 0; border-radius: 28px; background: var(--kc-coral); color: #fff; font-size: 15px; font-weight: 700; letter-spacing: .1em; }
.ec-layoutRole .ec-blockBtn--action:hover, .ec-layoutRole .ec-blockBtn--action:focus { background: #f54b4b; color: #fff; }
.ec-layoutRole .ec-blockBtn--action:disabled { background: #ccc; }

/* ---------------------------------------------------------------- フッター */
.ec-layoutRole .ec-footerRole { margin: 0; padding: 100px 0 90px; border-top: 0; background: var(--kc-navy); color: #fff; }
.ec-layoutRole .ec-footerRole__inner { max-width: 1530px; margin: 0 auto; display: flex; justify-content: space-between; align-items: flex-end; }
.ec-layoutRole .ec-footerRole__left { display: flex; align-items: center; gap: 86px; }
.ec-layoutRole .ec-footerLogo img { display: block; width: 180px; }
.ec-layoutRole .ec-footerNavi { display: grid; gap: 22px; margin: 0; padding: 0; list-style: none; }
.ec-layoutRole .ec-footerNavi a, .ec-layoutRole .ec-footerNavi a:hover { color: #fff; font-size: 14px; font-weight: 700; letter-spacing: .08em; }
.ec-layoutRole .ec-footerRole__right { padding-bottom: 6px; }
.ec-layoutRole .ec-footerSns { display: flex; justify-content: flex-end; gap: 32px; margin: 0 0 22px; padding: 0; list-style: none; }
.ec-layoutRole .ec-footerSns img { display: block; width: 32px; height: 32px; }
.ec-layoutRole .ec-footerCopyright { margin: 0; text-align: right; font: 500 13px var(--kc-en); letter-spacing: .08em; }
.ec-layoutRole .ec-blockTopBtn { display: none !important; }

/* ================================================================ スマートフォン（〜767px） */
@media only screen and (max-width: 767px) {
  .ec-layoutRole .ec-layoutRole__contents { padding: 0 20px; }
  .ec-layoutRole .ec-layoutRole__left { display: none; }
  .ec-layoutRole .ec-headerNewsRole { height: 47px; }
  .ec-layoutRole .ec-newItemRole { display: block; padding: 50px 0 10px; }
  .ec-layoutRole .ec-newItemRole__category { margin-bottom: 60px; }
  .ec-layoutRole .ec-secHeading { margin-bottom: 40px; font-size: 27px; }
  .ec-layoutRole .ec-item { grid-template-columns: 1fr 1fr; gap: 26px 14px; }
  .ec-layoutRole .ec-item__listItem img { width: 100%; height: auto; aspect-ratio: 1; border-radius: 14px; }
  .ec-layoutRole .ec-item__listItemTitle { margin: 16px 0 8px; font-size: 15px; }
  .ec-layoutRole .ec-shelfGrid { grid-template-columns: 1fr 1fr; gap: 30px 14px; }
  .ec-layoutRole .ec-productRole { padding-top: 30px; }
  .ec-layoutRole .ec-productRole__inner { display: block; }
  .ec-layoutRole .ec-productRole__images, .ec-layoutRole .ec-productRole__mainImage img { width: 100%; height: auto; }
  .ec-layoutRole .ec-productRole .ec-headingTitle { margin-top: 30px; font-size: 22px; }
  .ec-layoutRole .ec-productRole__price { font-size: 22px; }
  .ec-layoutRole .ec-productRole__description { margin-top: 30px; }
  .ec-layoutRole .ec-productRole__cart { display: block; margin-top: 40px; }
  .ec-layoutRole .ec-productRole__total, .ec-layoutRole .ec-productRole__actions, .ec-layoutRole .ec-blockBtn--action { width: 100%; }
  .ec-layoutRole .ec-footerRole { padding: 50px 28px 40px; }
  .ec-layoutRole .ec-footerRole__inner, .ec-layoutRole .ec-footerRole__left { display: block; }
  .ec-layoutRole .ec-footerLogo img { width: 98px; margin-bottom: 40px; }
  .ec-layoutRole .ec-footerNavi { margin-bottom: 26px; }
  .ec-layoutRole .ec-footerSns { justify-content: flex-start; gap: 30px; margin-top: 40px; }
  .ec-layoutRole .ec-footerSns img { width: 24px; height: 24px; }
  .ec-layoutRole .ec-footerCopyright { text-align: left; }
`;
  /** typed in the video: the header on a smartphone (menu button · logo · cart in one row) */
  const CSS_SP_HEADER = [
    `  /* スマートフォンのヘッダー */`,
    `  .ec-layoutRole .ec-headerNaviRole__inner { height: 64px; padding: 0 12px 0 16px; }`,
    `  .ec-layoutRole .ec-headerRole__navSP { display: block; }`,
    `  .ec-layoutRole .ec-headerNavSP { position: static; width: 24px; height: 24px; padding: 0; background: none; }`,
    `  .ec-layoutRole .ec-headerTitle { margin-left: 22px; }`,
    `  .ec-layoutRole .ec-headerTitle img { width: 236px; }`,
    `  .ec-layoutRole .ec-headerNav { display: none; }`,
    `  .ec-layoutRole .ec-headerCart { width: 46px; height: 46px; margin-left: auto; }`,
  ];
  const CSS_END = `}
`;
  const CSS_BEFORE = CSS + CSS_END;
  const CSS_FINAL = CSS + CSS_SP_HEADER.join('\n') + '\n' + CSS_END;
  const NAV_SP = `{#
kachaka Online Store — スマートフォンのメニューボタン（押すと drawer が開く：EC-CUBE の function.js）
#}
<div class="ec-headerNavSP">
    <img src="{{ asset('assets/icon/hamburger.svg') }}" alt="メニュー">
</div>
`;
  delete files['app/template/kachaka/Block/nav_sp.twig'];

  /* the theme on disk at each step of the video (for the capture script; paths from the EC-CUBE root) */
  const THEME = {
    frame: { [T + 'default_frame.twig']: frameWithLink() },
    css: { [A + 'css/kachaka.css']: CSS_BEFORE },
    header1: { [T + 'Block/header.twig']: HEADER_V1, [T + 'Block/nav_sp.twig']: NAV_SP, [T + 'Block/footer.twig']: FOOTER },
    header2: { [T + 'Block/header.twig']: HEADER_V2 },
    catnav: { [T + 'Block/category_nav_pc.twig']: CATNAV },
    indexBad: { [T + 'index.twig']: INDEX_BAD },
    index: { [T + 'index.twig']: INDEX },
    product: { [T + 'Product/list.twig']: LIST, [T + 'Product/detail.twig']: DETAIL },
    sp: { [A + 'css/kachaka.css']: CSS_FINAL },
  };

  /* the explorer: the EC-CUBE root; the theme folders appear when the template is installed */
  const treeBase = [
    ['app', 'dir', 1], ['app/Customize', 'dir', 0], ['app/DoctrineMigrations', 'dir', 0], ['app/Plugin', 'dir', 0], ['app/PluginData', 'dir', 0], ['app/config', 'dir', 0], ['app/proxy', 'dir', 0],
    ['app/template', 'dir', 1], ['app/template/admin', 'dir', 0], ['app/template/default', 'dir', 0], ['app/template/user_data', 'dir', 0],
    ['bin', 'dir', 0], ['codeception', 'dir', 0],
    ['html', 'dir', 1], ['html/bundle', 'dir', 0], ['html/plugin', 'dir', 0], ['html/template', 'dir', 1], ['html/template/admin', 'dir', 0], ['html/template/default', 'dir', 0], ['html/template/install', 'dir', 0], ['html/upload', 'dir', 0], ['html/user_data', 'dir', 0],
    ['src', 'dir', 0], ['var', 'dir', 0], ['vendor', 'dir', 0],
    ['.env'], ['.gitignore'], ['composer.json'], ['docker-compose.yml'], ['index.php'], ['package.json'], ['README.md'],
  ];
  const themeDirs = [
    ['app/template/kachaka', 'dir', 1], ['app/template/kachaka/Block', 'dir', 1], ['app/template/kachaka/Product', 'dir', 1],
    ['html/template/kachaka', 'dir', 1], ['html/template/kachaka/assets', 'dir', 1], ['html/template/kachaka/assets/css', 'dir', 1], ['html/template/kachaka/assets/fonts', 'dir', 0],
    ['html/template/kachaka/assets/icon', 'dir', 0], ['html/template/kachaka/assets/img', 'dir', 0], ['html/template/kachaka/assets/js', 'dir', 0],
    ['html/template/kachaka/assets/css/style.css'],
  ];
  files['.gitignore'] = '/var/\n/vendor/\n/node_modules/\n/html/upload/\n/theme/\n*.zip\n.env\n';
  files['html/template/kachaka/assets/css/style.css'] = '/* EC-CUBE 4.3 標準テーマの CSS（default からコピー） */\n';

  window.FILES = {
    files, T, A, treeBase, themeDirs, THEME, SNS,
    FRAME, FRAME_AFTER, FRAME_LINK, frameWithLink,
    HEADER_V1, HEADER_V2, HEADER_ADD, HEADER_ANCHOR, NAV_SP, FOOTER, CATNAV_HEAD, CATNAV_TYPE, CATNAV, HEADER_NEWS,
    INDEX_HEAD, INDEX_LOOP, INDEX_ENDFOR, INDEX_TAIL, INDEX_BAD, INDEX, LIST, DETAIL,
    CSS_BEFORE, CSS_SP_HEADER, CSS_FINAL,
  };
})();
