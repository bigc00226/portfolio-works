/*
 * The BtoB customization this video writes into 呉竹 BtoBオンライン注文サイト's EC-CUBE 4.3 (app/Customize, the overridden
 * templates in app/template/default, customize.css, the translation YAML): the ONE source of the code that
 *   - VS Code shows and types (js/files.js, js/scenario.js — window.B2B_SRC), and
 *   - tools/snapshots/ec-kuretake-btob/capture-ec.js writes into the local EC-CUBE 4.3.1-p1 stage by stage (require()),
 *     so every screen of the video is what EC-CUBE does with this code.
 * Written for the demo (order.kuretake.co.jp's own code is not public). PSR-12 (4 spaces), as EC-CUBE's own code.
 * The templates are EC-CUBE 4.3.1-p1's own (js/eccube-core.js, copied byte for byte) with the lines this video types.
 *
 * files(stage, core):
 *   1  取引先情報: CustomerTrait (取引先コード・業界・掛率・掛け払い), ProductTrait (発注単位), the admin forms (auto_render)
 *   2  + 会員登録の承認制: 会社名 required on 新規会員登録, no self-activation (entry_activate → 404), the 本登録完了 mail when
 *      the admin turns 仮会員 into 本会員, Entry/complete.twig and the 仮登録 mail without the activation URL
 *   3  + 卸価格: WholesalePriceSubscriber (Doctrine postLoad: 販売価格 = 定価 × 掛率 for the signed-in 取引先) — first without
 *      telling Doctrine, so a flush writes the 卸価格 into the product master; cart / ご注文手続き only when signed in;
 *      Product/detail.twig · list.twig (卸価格・発注単位・ログインして注文), customize.css, 通常価格 → 定価 (messages.ja.yaml)
 *   4  + the fix: the 卸価格 is recorded as the loaded value (UnitOfWork::setOriginalEntityProperty) — never flushed
 *   5  + 発注単位: OrderUnitValidator (@CartFlow) rounds the quantity up to the case unit and says so
 *   6  + 掛け払い: OrderTypeExtension — the payment 掛け払い（請求書払い） only for 取引先 approved for it
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.B2B_SRC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C = 'app/Customize/';
  const T = 'app/template/default/';
  const CSS = 'html/user_data/assets/css/customize.css';
  const F = {};

  /* ------------------------------------------------------------------ 1 取引先情報 */
  F[C + 'Entity/CustomerTrait.php'] = String.raw`<?php

namespace Customize\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Annotation\EntityExtension;

/**
 * 取引先情報（会員の拡張）：取引先コード・業界・掛率・掛け払い
 *
 * @EntityExtension("Eccube\Entity\Customer")
 */
trait CustomerTrait
{
    /**
     * @var string|null
     *
     * @ORM\Column(name="customer_code", type="string", length=20, nullable=true)
     */
    private $customer_code;

    /**
     * @var string|null
     *
     * @ORM\Column(name="business_type", type="string", length=50, nullable=true)
     */
    private $business_type;

    /**
     * 掛率（%）：卸価格 = 定価 × 掛率
     *
     * @var int|null
     *
     * @ORM\Column(name="wholesale_rate", type="smallint", nullable=true, options={"unsigned":true})
     */
    private $wholesale_rate;

    /**
     * 掛け払い（請求書払い）：与信審査が済んだ取引先だけ
     *
     * @var bool
     *
     * @ORM\Column(name="invoice_payment", type="boolean", options={"default":false})
     */
    private $invoice_payment = false;

    public function getCustomerCode(): ?string
    {
        return $this->customer_code;
    }

    public function setCustomerCode(?string $customerCode): self
    {
        $this->customer_code = $customerCode;

        return $this;
    }

    public function getBusinessType(): ?string
    {
        return $this->business_type;
    }

    public function setBusinessType(?string $businessType): self
    {
        $this->business_type = $businessType;

        return $this;
    }

    public function getWholesaleRate(): ?int
    {
        return $this->wholesale_rate;
    }

    public function setWholesaleRate(?int $wholesaleRate): self
    {
        $this->wholesale_rate = $wholesaleRate;

        return $this;
    }

    public function isInvoicePayment(): bool
    {
        return (bool) $this->invoice_payment;
    }

    public function setInvoicePayment(bool $invoicePayment): self
    {
        $this->invoice_payment = $invoicePayment;

        return $this;
    }
}
`;

  F[C + 'Entity/ProductTrait.php'] = String.raw`<?php

namespace Customize\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Annotation\EntityExtension;

/**
 * 発注単位（ケース入数）：この数の倍数でだけ注文できる
 *
 * @EntityExtension("Eccube\Entity\Product")
 */
trait ProductTrait
{
    /**
     * @var int|null
     *
     * @ORM\Column(name="order_unit", type="smallint", nullable=true, options={"unsigned":true})
     */
    private $order_unit;

    public function getOrderUnit(): ?int
    {
        return $this->order_unit;
    }

    public function setOrderUnit(?int $orderUnit): self
    {
        $this->order_unit = $orderUnit;

        return $this;
    }
}
`;

  F[C + 'Form/Extension/Admin/CustomerTypeExtension.php'] = String.raw`<?php

namespace Customize\Form\Extension\Admin;

use Eccube\Form\Type\Admin\CustomerType;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\ChoiceType;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * 会員管理 › 会員登録：取引先情報の入力欄（エンティティ拡張の自動出力）
 */
class CustomerTypeExtension extends AbstractTypeExtension
{
    /** 業界（本番の新規会員登録フォームと同じ選択肢） */
    public const BUSINESS_TYPES = ['文具店', '書道専門店', '雑貨店・書店', 'GMS・スーパー', '量販店・百貨店', '文具卸・雑貨卸', '神社・仏閣', '工業・化学', '農業・漁業・畜産業', '学校・教室', '医療・介護', '該当なし'];

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder
            ->add('customer_code', TextType::class, [
                'label' => '取引先コード',
                'required' => false,
                'constraints' => [new Assert\Length(['max' => 20])],
                'eccube_form_options' => ['auto_render' => true],
            ])
            ->add('business_type', ChoiceType::class, [
                'label' => '業界',
                'required' => false,
                'choices' => array_combine(self::BUSINESS_TYPES, self::BUSINESS_TYPES),
                'placeholder' => '選択してください',
                'eccube_form_options' => ['auto_render' => true],
            ])
            ->add('wholesale_rate', IntegerType::class, [
                'label' => '掛率（%）',
                'required' => false,
                'constraints' => [new Assert\Range(['min' => 1, 'max' => 100])],
                'eccube_form_options' => ['auto_render' => true],
            ])
            ->add('invoice_payment', ChoiceType::class, [
                'label' => '掛け払い',
                'choices' => ['利用不可' => false, '利用可（与信審査済み）' => true],
                'expanded' => true,
                'eccube_form_options' => ['auto_render' => true],
            ]);
    }

    public static function getExtendedTypes(): iterable
    {
        yield CustomerType::class;
    }
}
`;

  F[C + 'Form/Extension/Admin/ProductTypeExtension.php'] = String.raw`<?php

namespace Customize\Form\Extension\Admin;

use Eccube\Form\Type\Admin\ProductType;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\IntegerType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * 商品管理 › 商品登録：発注単位（ケース入数）
 */
class ProductTypeExtension extends AbstractTypeExtension
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('order_unit', IntegerType::class, [
            'label' => '発注単位（個）',
            'required' => false,
            'constraints' => [new Assert\Range(['min' => 1, 'max' => 1000])],
            'eccube_form_options' => ['auto_render' => true],
        ]);
    }

    public static function getExtendedTypes(): iterable
    {
        yield ProductType::class;
    }
}
`;

  /* ------------------------------------------------------------------ 2 会員登録の承認制 */
  F[C + 'Form/Extension/EntryTypeExtension.php'] = String.raw`<?php

namespace Customize\Form\Extension;

use Eccube\Common\EccubeConfig;
use Eccube\Form\Type\Front\EntryType;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * 新規会員登録：取引先専用のサイトなので会社名を必須に
 */
class EntryTypeExtension extends AbstractTypeExtension
{
    private EccubeConfig $eccubeConfig;

    public function __construct(EccubeConfig $eccubeConfig)
    {
        $this->eccubeConfig = $eccubeConfig;
    }

    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('company_name', TextType::class, [
            'required' => true,
            'constraints' => [
                new Assert\NotBlank(),
                new Assert\Length(['max' => $this->eccubeConfig['eccube_stext_len']]),
            ],
        ]);
    }

    public static function getExtendedTypes(): iterable
    {
        yield EntryType::class;
    }
}
`;

  F[C + 'EventSubscriber/CustomerApprovalSubscriber.php'] = String.raw`<?php

namespace Customize\EventSubscriber;

use Eccube\Entity\Master\CustomerStatus;
use Eccube\Event\EccubeEvents;
use Eccube\Event\EventArgs;
use Eccube\Service\MailService;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\RequestEvent;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\KernelEvents;

/**
 * 会員登録の承認制：仮会員は自分で本登録できない。管理画面で「本会員」にしたときに本登録完了メールを送る
 */
class CustomerApprovalSubscriber implements EventSubscriberInterface
{
    private MailService $mailService;

    /** 会員登録の画面を開いたときのステータス */
    private ?int $statusBefore = null;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::REQUEST => 'onKernelRequest',
            EccubeEvents::ADMIN_CUSTOMER_EDIT_INDEX_INITIALIZE => 'onCustomerEditInitialize',
            EccubeEvents::ADMIN_CUSTOMER_EDIT_INDEX_COMPLETE => 'onCustomerEditComplete',
        ];
    }

    /**
     * 本登録の URL（entry_activate）は使わない：本登録は取引の確認のあと管理画面で
     */
    public function onKernelRequest(RequestEvent $event): void
    {
        if ($event->getRequest()->attributes->get('_route') === 'entry_activate') {
            throw new NotFoundHttpException();
        }
    }

    public function onCustomerEditInitialize(EventArgs $event): void
    {
        $Status = $event->getArgument('Customer')->getStatus();
        $this->statusBefore = $Status ? $Status->getId() : null;
    }

    public function onCustomerEditComplete(EventArgs $event): void
    {
        $Customer = $event->getArgument('Customer');
        if ($this->statusBefore === CustomerStatus::PROVISIONAL && $Customer->getStatus()->getId() === CustomerStatus::REGULAR) {
            $this->mailService->sendCustomerCompleteMail($Customer);
            log_info('取引先を承認：本登録完了メールを送信', [$Customer->getId(), $Customer->getCompanyName()]);
        }
    }
}
`;

  /* ------------------------------------------------------------------ 3 / 4 卸価格・ログインして注文 */
  const WHOLESALE_FIX = [
    '',
    '        // 画面のための値：読み込んだ時点の値として UnitOfWork に記録し、flush でデータベースへ書き戻さない',
    "        $args->getObjectManager()->getUnitOfWork()->setOriginalEntityProperty(spl_object_id($ProductClass), 'price02', $price);",
  ];
  const wholesale = (fixed) => String.raw`<?php

namespace Customize\Doctrine\EventSubscriber;

use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Event\LifecycleEventArgs;
use Doctrine\ORM\Events;
use Eccube\Entity\Customer;
use Eccube\Entity\ProductClass;
use Eccube\Service\TaxRuleService;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;

/**
 * 取引先の卸価格：ログイン中の取引先には、販売価格を「定価（通常価格）× 掛率」にする
 * （商品一覧・詳細・カート・ご注文手続きの価格がこの値になる。管理画面は元の価格のまま）
 */
class WholesalePriceSubscriber implements EventSubscriber
{
    private TokenStorageInterface $tokenStorage;

    private TaxRuleService $taxRuleService;

    public function __construct(TokenStorageInterface $tokenStorage, TaxRuleService $taxRuleService)
    {
        $this->tokenStorage = $tokenStorage;
        $this->taxRuleService = $taxRuleService;
    }

    public function getSubscribedEvents(): array
    {
        return [Events::postLoad];
    }

    public function postLoad(LifecycleEventArgs $args): void
    {
        $ProductClass = $args->getObject();
        if (!$ProductClass instanceof ProductClass || $ProductClass->getPrice01() === null) {
            return;
        }
        $token = $this->tokenStorage->getToken();
        $Customer = $token ? $token->getUser() : null;
        if (!$Customer instanceof Customer || !$Customer->getWholesaleRate()) {
            return;
        }

        $price = (string) floor($ProductClass->getPrice01() * $Customer->getWholesaleRate() / 100);
        $ProductClass->setPrice02($price);
        $ProductClass->setPrice02IncTax($this->taxRuleService->getPriceIncTax($price, $ProductClass->getProduct(), $ProductClass));
` + (fixed ? WHOLESALE_FIX.join('\n') + '\n' : '') + `    }
}
`;

  F[C + 'EventSubscriber/MemberOnlyOrderSubscriber.php'] = String.raw`<?php

namespace Customize\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\Routing\Generator\UrlGeneratorInterface;
use Symfony\Component\Security\Core\Authorization\AuthorizationCheckerInterface;

/**
 * 取引先専用：カート・ご注文手続きはログインした取引先だけ（ゲスト購入なし）。未ログインはログイン画面へ
 */
class MemberOnlyOrderSubscriber implements EventSubscriberInterface
{
    private AuthorizationCheckerInterface $authorizationChecker;

    private UrlGeneratorInterface $urlGenerator;

    public function __construct(AuthorizationCheckerInterface $authorizationChecker, UrlGeneratorInterface $urlGenerator)
    {
        $this->authorizationChecker = $authorizationChecker;
        $this->urlGenerator = $urlGenerator;
    }

    public static function getSubscribedEvents(): array
    {
        return [KernelEvents::CONTROLLER => 'onKernelController'];
    }

    public function onKernelController(ControllerEvent $event): void
    {
        $route = (string) $event->getRequest()->attributes->get('_route');
        if (!preg_match('/^(cart|product_add_cart|shopping)/', $route) || $this->authorizationChecker->isGranted('ROLE_USER')) {
            return;
        }
        $url = $this->urlGenerator->generate('mypage_login');
        $event->setController(fn () => new RedirectResponse($url));
    }
}
`;

  F['app/Customize/Resource/locale/messages.ja.yaml'] = `# 取引先専用サイトの表記（EC-CUBE の「通常価格」は呉竹の定価）
通常価格: 定価
`;

  F[CSS] = `/* カスタマイズ用CSS */

/* 商品詳細：卸価格・発注単位（取引先） */
.ec-productRole .ec-productRole__b2b { margin: 4px 0 18px; padding: 12px 16px; background: #f6f3ec; border-left: 4px solid #8c1d24; }
.ec-productRole .ec-productRole__wholesale { margin: 0 0 4px; font-size: 20px; font-weight: bold; color: #8c1d24; }
.ec-productRole .ec-productRole__wholesale span { margin-left: 6px; font-size: 12px; font-weight: normal; color: #525263; }
.ec-productRole .ec-productRole__orderUnit { margin: 0; font-size: 14px; }
.ec-productRole .ec-productRole__loginNote { margin-top: 10px; font-size: 13px; color: #525263; }

/* 商品一覧：品番・発注単位 */
.ec-shelfGrid .ec-shelfGrid__code { margin-top: 4px; font-size: 12px; color: #525263; }
`;

  /* the template lines this video types (into EC-CUBE 4.3.1-p1's own templates, copied to app/template/default) */
  const DETAIL_B2B = [
    '                    {# 卸価格・発注単位（取引先） #}',
    '                    <div class="ec-productRole__b2b">',
    "                        {% if is_granted('ROLE_USER') and app.user.wholesaleRate %}",
    '                            <p class="ec-productRole__wholesale">卸価格（掛率 {{ app.user.wholesaleRate }}%）：{{ Product.getPrice02Min|price }}<span>税抜</span></p>',
    '                        {% endif %}',
    '                        <p class="ec-productRole__orderUnit">発注単位：{{ Product.orderUnit ?: 1 }}個</p>',
    '                    </div>',
  ];
  const DETAIL_IF = ["                    {% if is_granted('ROLE_USER') %}"];
  const DETAIL_ELSE = [
    '                    {% else %}',
    '                        <div class="ec-productRole__btn">',
    "                            <a href=\"{{ url('mypage_login') }}\" class=\"ec-blockBtn--action\">ログインして注文する</a>",
    '                        </div>',
    '                        <p class="ec-productRole__loginNote">卸価格の表示とご注文は、お取引先様のアカウントでログインしてからご利用いただけます。</p>',
    '                    {% endif %}',
  ];
  const LIST_CODE = ['                                <p class="ec-shelfGrid__code">品番：{{ Product.code_min }}　発注単位：{{ Product.orderUnit ?: 1 }}個</p>'];
  const LIST_IF = ["                            {% if is_granted('ROLE_USER') %}"];
  const LIST_ENDIF = ['                            {% endif %}'];

  /** inserts lines before / after the n-th line that equals `anchor` (trimmed) */
  const insert = (text, anchor, lines, where = 'before', nth = 0) => {
    const a = text.split('\n');
    const idx = a.map((l, i) => (l.trim() === anchor ? i : -1)).filter((i) => i >= 0)[nth];
    if (idx == null) throw new Error('no anchor: ' + anchor);
    a.splice(where === 'before' ? idx : idx + 1, 0, ...lines);
    return a.join('\n');
  };
  const replaceOnce = (text, from, to) => { if (!text.includes(from)) throw new Error('not found: ' + from.slice(0, 60)); return text.replace(from, to); };
  /** the line index of the first line equal to `anchor` (trimmed) after the first line equal to `from` */
  const lineAfter = (text, from, anchor) => {
    const a = text.split('\n');
    const i = a.findIndex((l) => l.trim() === from);
    const j = i < 0 ? -1 : a.findIndex((l, k) => k > i && l.trim() === anchor);
    if (j < 0) throw new Error(`no ${anchor} after ${from}`);
    return j;
  };
  const insertAt = (text, idx, lines) => { const a = text.split('\n'); a.splice(idx, 0, ...lines); return a.join('\n'); };
  const CART_FORM = "<form action=\"{{ url('product_add_cart', {id:Product.id}) }}\" method=\"post\" id=\"form1\" name=\"form1\">";
  const ITEM = '<li class="ec-shelfGrid__item">';

  /** the overridden templates: EC-CUBE's own (core) with this video's lines */
  function templates(core) {
    const D = core['src/Eccube/Resource/template/default/Product/detail.twig'];
    let detail = insert(D, '{# 商品コード #}', DETAIL_B2B);
    detail = insertAt(detail, lineAfter(detail, CART_FORM, '</form>') + 1, DETAIL_ELSE);
    detail = insert(detail, CART_FORM, DETAIL_IF);
    const L = core['src/Eccube/Resource/template/default/Product/list.twig'];
    let list = insertAt(L, lineAfter(L, ITEM, '</a>'), LIST_CODE);
    // the {% endif %} of stock_find is the line before </li>
    list = insertAt(list, lineAfter(list, ITEM, '</li>'), LIST_ENDIF);
    list = insert(list, '{% if Product.stock_find %}', LIST_IF);
    const complete = replaceOnce(core['src/Eccube/Resource/template/default/Entry/complete.twig'],
      `{{ '現在、仮会員の状態です。ただいま、ご入力いただいたメールアドレス宛に、ご本人様確認用のメールをお送りいたしました。
メール本文内のURLをクリックすると、本会員登録が完了となります。
'|trans|nl2br }}`,
      `{{ '仮登録を受け付けました。弊社にてお取引内容を確認し、本登録の手続きが完了しましたら「本登録完了」のメールをお送りいたします。
本登録の完了後、ログインして卸価格の確認・ご注文ができるようになります。
'|trans|nl2br }}`);
    const mail = replaceOnce(core['src/Eccube/Resource/template/default/Mail/entry_confirm.twig'],
      `現在は仮登録の状態です。
　　　~~~~~~
本会員登録を完了するには下記URLにアクセスしてください。

{{ activateUrl }}

上記URLにて本会員登録が完了いたしましたら改めてご登録内容ご確認
メールをお送り致します。`,
      `現在は仮登録の状態です。
　　　~~~~~~
弊社にてお取引内容を確認し、本登録の手続きが完了しましたら
改めて本登録完了のメールをお送りいたします。
（本登録の完了まで、ログイン・ご注文はできません）`);
    const mailHtml = replaceOnce(core['src/Eccube/Resource/template/default/Mail/entry_confirm.html.twig'],
      `本会員登録を完了するには下記URLにアクセスしてください。<br><br/>
                            <a href="{{ activateUrl }}">{{ activateUrl }}</a>
                            <br/>
                            <br/>
                            上記URLにて本会員登録が完了いたしましたら改めてご登録内容ご確認メールをお送り致します。`,
      `弊社にてお取引内容を確認し、本登録の手続きが完了しましたら<br/>
                            改めて本登録完了のメールをお送りいたします。<br/>
                            （本登録の完了まで、ログイン・ご注文はできません）`);
    return {
      [T + 'Product/detail.twig']: detail, [T + 'Product/list.twig']: list,
      [T + 'Entry/complete.twig']: complete, [T + 'Mail/entry_confirm.twig']: mail, [T + 'Mail/entry_confirm.html.twig']: mailHtml,
    };
  }

  /* ------------------------------------------------------------------ 5 発注単位 */
  F[C + 'Service/PurchaseFlow/Processor/OrderUnitValidator.php'] = String.raw`<?php

namespace Customize\Service\PurchaseFlow\Processor;

use Eccube\Annotation\CartFlow;
use Eccube\Entity\ItemInterface;
use Eccube\Service\PurchaseFlow\InvalidItemException;
use Eccube\Service\PurchaseFlow\ItemValidator;
use Eccube\Service\PurchaseFlow\PurchaseContext;

/**
 * 発注単位：数量は商品の発注単位（ケース入数）の倍数だけ。倍数でなければ切り上げてお知らせする
 *
 * @CartFlow
 */
class OrderUnitValidator extends ItemValidator
{
    protected function validate(ItemInterface $item, PurchaseContext $context)
    {
        if (!$item->isProduct()) {
            return;
        }
        $Product = $item->getProductClass()->getProduct();
        $unit = (int) $Product->getOrderUnit();
        if ($unit > 1 && $item->getQuantity() % $unit !== 0) {
            $quantity = (int) ceil($item->getQuantity() / $unit) * $unit;
            throw new InvalidItemException(sprintf('「%s」は %d 個単位でのご注文です。数量を %d 個にしました。', $Product->getName(), $unit, $quantity), [], true);
        }
    }

    protected function handle(ItemInterface $item, PurchaseContext $context)
    {
        $unit = (int) $item->getProductClass()->getProduct()->getOrderUnit();
        $item->setQuantity((int) ceil($item->getQuantity() / $unit) * $unit);
    }
}
`;

  /* ------------------------------------------------------------------ 6 掛け払い */
  F[C + 'Form/Extension/OrderTypeExtension.php'] = String.raw`<?php

namespace Customize\Form\Extension;

use Eccube\Entity\Customer;
use Eccube\Entity\Payment;
use Eccube\Form\Type\Shopping\OrderType;
use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Form\FormEvent;
use Symfony\Component\Form\FormEvents;

/**
 * ご注文手続き：支払方法「掛け払い」は、掛け払いを承認した取引先にだけ出す
 */
class OrderTypeExtension extends AbstractTypeExtension
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        // OrderType が支払方法の選択肢を作ったあと（優先度 -10）で絞り込む
        $builder->addEventListener(FormEvents::POST_SET_DATA, [$this, 'filterPayments'], -10);
        $builder->addEventListener(FormEvents::PRE_SUBMIT, [$this, 'filterPayments'], -10);
    }

    public function filterPayments(FormEvent $event): void
    {
        $form = $event->getForm();
        $Order = $form->getData();
        if (!$Order || !$form->has('Payment')) {
            return;
        }
        $Customer = $Order->getCustomer();
        if ($Customer instanceof Customer && $Customer->isInvoicePayment()) {
            return;
        }

        $options = $form->get('Payment')->getConfig()->getOptions();
        $choices = array_values(array_filter($options['choices'], fn (Payment $Payment) => !str_starts_with($Payment->getMethod(), '掛け払い')));
        $form->add('Payment', EntityType::class, [
            'class' => Payment::class,
            'choice_label' => 'method',
            'expanded' => true,
            'multiple' => false,
            'placeholder' => false,
            'constraints' => $options['constraints'],
            'choices' => $choices,
            'data' => in_array($options['data'], $choices, true) ? $options['data'] : null,
            'invalid_message' => $options['invalid_message'],
        ]);
    }

    public static function getExtendedTypes(): iterable
    {
        yield OrderType::class;
    }
}
`;

  const STAGE = {
    1: [C + 'Entity/CustomerTrait.php', C + 'Entity/ProductTrait.php', C + 'Form/Extension/Admin/CustomerTypeExtension.php', C + 'Form/Extension/Admin/ProductTypeExtension.php'],
    2: [C + 'Form/Extension/EntryTypeExtension.php', C + 'EventSubscriber/CustomerApprovalSubscriber.php', 'tpl:entry'],
    3: [C + 'Doctrine/EventSubscriber/WholesalePriceSubscriber.php', C + 'EventSubscriber/MemberOnlyOrderSubscriber.php', 'app/Customize/Resource/locale/messages.ja.yaml', CSS, 'tpl:product'],
    4: [],
    5: [C + 'Service/PurchaseFlow/Processor/OrderUnitValidator.php'],
    6: [C + 'Form/Extension/OrderTypeExtension.php'],
  };

  /** every file of the customization at `stage` (core: EC-CUBE's own files, for the templates) */
  function files(stage, core) {
    const out = {};
    const tpl = core ? templates(core) : {};
    for (let s = 1; s <= stage; s++) {
      for (const p of STAGE[s]) {
        if (p === 'tpl:entry') for (const k of ['Entry/complete.twig', 'Mail/entry_confirm.twig', 'Mail/entry_confirm.html.twig']) { if (tpl[T + k]) out[T + k] = tpl[T + k]; }
        else if (p === 'tpl:product') for (const k of ['Product/detail.twig', 'Product/list.twig']) { if (tpl[T + k]) out[T + k] = tpl[T + k]; }
        else if (p === C + 'Doctrine/EventSubscriber/WholesalePriceSubscriber.php') out[p] = wholesale(false);
        else out[p] = F[p];
      }
    }
    if (stage >= 4) out[C + 'Doctrine/EventSubscriber/WholesalePriceSubscriber.php'] = wholesale(true);
    return out;
  }

  /* the test accounts of the dev copy (invented; example.com addresses) */
  const ACCOUNTS = {
    applicant: { company: '有限会社さくら書道用品（テスト）', kana01: 'テスト', kana02: 'イチロウ', name01: 'テスト', name02: '一郎', email: 'sakura.test@example.com', pass: 'kuretake-test-2026', zip: '6308001', pref: 29, addr01: '奈良市法華寺町', addr02: '1-2 テストビル 1F', tel: '0742000000',
      code: 'T-20481', business: '書道専門店', rate: 60 },
    existing: { company: '株式会社みなと文具（テスト）', name01: 'テスト', name02: '花子', kana01: 'テスト', kana02: 'ハナコ', email: 'minato.test@example.com', pass: 'kuretake-test-2026', zip: '5300001', pref: 27, addr01: '大阪市北区梅田', addr02: '3-3 テストビル 2F', tel: '0600000000',
      code: 'T-10235', business: '文具店', rate: 65 },
  };

  return { C, T, CSS, F, files, templates, wholesale, WHOLESALE_FIX, DETAIL_B2B, DETAIL_IF, DETAIL_ELSE, LIST_CODE, LIST_IF, LIST_ENDIF, STAGE, ACCOUNTS };
});
