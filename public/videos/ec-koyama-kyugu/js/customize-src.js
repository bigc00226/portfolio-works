/*
 * The customisation this video writes into the shop's EC-CUBE 4 (app/Customize, the theme's Product/detail.twig and
 * html/user_data/assets/css/customize.css): the ONE source of the code that
 *   - VS Code shows and types (js/files.js, js/scenario.js — window.KOYAMA_SRC), and
 *   - tools/snapshots/ec-koyama-kyugu/capture-ec.js writes into the local EC-CUBE 4.3.1-p1 (require()) and runs there
 *     (eccube:generate:proxies, doctrine:schema:update, cache:clear), so the screens of the video are this code's output.
 * Written for the demo: www.koyama-kyugu.com's own source code is not public.
 *
 * files(stage): app/Customize at a stage of the work —
 *   1  the Product entity extended (受注生産・納期の目安)          2  + the admin product form (FormType extension)
 *   3  + the Twig function for the 在庫・納期 badge                4  + the delivery fee rule (PurchaseFlow processor)
 *   5  + the cart page's 「あと○円で送料無料」 (EventSubscriber)
 * BADGE / CSS: what stage 3 adds to Product/detail.twig and customize.css. PSR-12 (4 spaces), as EC-CUBE's own code.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.KOYAMA_SRC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const C = 'app/Customize/';
  const F = {};

  F['Entity/ProductTrait.php'] = String.raw`<?php

namespace Customize\Entity;

use Doctrine\ORM\Mapping as ORM;
use Eccube\Annotation\EntityExtension;

/**
 * 商品：受注生産と納期の目安
 *
 * @EntityExtension("Eccube\Entity\Product")
 */
trait ProductTrait
{
    /**
     * @var bool
     *
     * @ORM\Column(name="made_to_order", type="boolean", options={"default":false})
     */
    private $made_to_order = false;

    /**
     * @var string|null
     *
     * @ORM\Column(name="lead_time", type="string", length=255, nullable=true)
     */
    private $lead_time;

    public function isMadeToOrder(): bool
    {
        return (bool) $this->made_to_order;
    }

    public function setMadeToOrder(bool $madeToOrder): self
    {
        $this->made_to_order = $madeToOrder;

        return $this;
    }

    public function getLeadTime(): ?string
    {
        return $this->lead_time;
    }

    public function setLeadTime(?string $leadTime): self
    {
        $this->lead_time = $leadTime;

        return $this;
    }
}
`;

  F['Form/Extension/Admin/ProductTypeExtension.php'] = String.raw`<?php

namespace Customize\Form\Extension\Admin;

use Eccube\Form\Type\Admin\ProductType;
use Eccube\Form\Type\ToggleSwitchType;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\TextType;
use Symfony\Component\Form\FormBuilderInterface;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * 商品登録：受注生産・納期の目安の入力欄（エンティティ拡張の自動出力）
 */
class ProductTypeExtension extends AbstractTypeExtension
{
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $builder
            ->add('made_to_order', ToggleSwitchType::class, [
                'label' => '受注生産',
                'label_on' => '受注生産',
                'label_off' => '在庫品',
                'required' => false,
                'eccube_form_options' => ['auto_render' => true],
            ])
            ->add('lead_time', TextType::class, [
                'label' => '納期の目安',
                'required' => false,
                'attr' => ['placeholder' => '例：約3～4ヶ月'],
                'constraints' => [new Assert\Length(['max' => 255])],
                'eccube_form_options' => ['auto_render' => true],
            ]);
    }

    public static function getExtendedTypes(): iterable
    {
        yield ProductType::class;
    }
}
`;

  F['Twig/Extension/StockBadgeExtension.php'] = String.raw`<?php

namespace Customize\Twig\Extension;

use Eccube\Entity\Product;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * 商品ページの在庫・納期の表示：stock_badge(Product)
 */
class StockBadgeExtension extends AbstractExtension
{
    /** 在庫がこの数以下なら「残りわずか」 */
    private const FEW = 3;

    public function getFunctions(): array
    {
        return [
            new TwigFunction('stock_badge', [$this, 'stockBadge']),
        ];
    }

    /**
     * @return array{type: string, label: string, note: ?string}
     */
    public function stockBadge(Product $Product): array
    {
        if ($Product->isMadeToOrder()) {
            $note = $Product->getLeadTime() ? '納期 '.$Product->getLeadTime() : null;

            return ['type' => 'order', 'label' => '受注生産', 'note' => $note];
        }
        if (!$Product->getStockFind()) {
            return ['type' => 'soldout', 'label' => '品切れ中', 'note' => null];
        }

        $stock = 0;
        foreach ($Product->getProductClasses() as $ProductClass) {
            if (!$ProductClass->isVisible()) {
                continue;
            }
            if ($ProductClass->isStockUnlimited()) {
                return ['type' => 'stock', 'label' => '在庫あり', 'note' => null];
            }
            $stock += $ProductClass->getStock();
        }

        if ($stock <= self::FEW) {
            return ['type' => 'few', 'label' => '残りわずか', 'note' => '在庫 '.$stock.' 点'];
        }

        return ['type' => 'stock', 'label' => '在庫あり', 'note' => null];
    }
}
`;

  F['Service/DeliveryFreeRule.php'] = String.raw`<?php

namespace Customize\Service;

/**
 * 送料無料の条件（ご購入ガイド）：
 * お買い上げ 15,000 円以上（基本設定）。矢各種・矢筒のいずれかを含む場合は 55,000 円以上。
 */
class DeliveryFreeRule
{
    public const ARROW_FREE_AMOUNT = 55000;

    /** 矢（カテゴリ 4 とその下）・ショルダー型矢筒（46） */
    public const ARROW_CATEGORY_IDS = [4, 46];

    /**
     * @param iterable<\Eccube\Entity\CartItem|\Eccube\Entity\OrderItem> $items
     */
    public function hasArrows(iterable $items): bool
    {
        foreach ($items as $Item) {
            $ProductClass = $Item->getProductClass();
            if (!$ProductClass) {
                continue;
            }
            foreach ($ProductClass->getProduct()->getProductCategories() as $ProductCategory) {
                foreach ($ProductCategory->getCategory()->getPath() as $Category) {
                    if (in_array($Category->getId(), self::ARROW_CATEGORY_IDS, true)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }
}
`;

  F['Service/PurchaseFlow/Processor/ArrowDeliveryFeeProcessor.php'] = String.raw`<?php

namespace Customize\Service\PurchaseFlow\Processor;

use Customize\Service\DeliveryFreeRule;
use Eccube\Annotation\ShoppingFlow;
use Eccube\Entity\ItemHolderInterface;
use Eccube\Entity\Order;
use Eccube\Service\PurchaseFlow\ItemHolderPreprocessor;
use Eccube\Service\PurchaseFlow\Processor\DeliveryFeePreprocessor;
use Eccube\Service\PurchaseFlow\PurchaseContext;

/**
 * 矢・矢筒を含むお届け先は 55,000 円未満なら送料をいただく
 * （標準の DeliveryFeeFreeByShippingPreprocessor が 15,000 円で無料にしたあとに判定）
 *
 * @ShoppingFlow
 */
class ArrowDeliveryFeeProcessor implements ItemHolderPreprocessor
{
    public function __construct(private DeliveryFreeRule $rule)
    {
    }

    public function process(ItemHolderInterface $itemHolder, PurchaseContext $context): void
    {
        if (!$itemHolder instanceof Order) {
            return;
        }

        foreach ($itemHolder->getShippings() as $Shipping) {
            $items = $Shipping->getProductOrderItems();
            if (!$this->rule->hasArrows($items)) {
                continue;
            }
            $total = 0;
            foreach ($items as $Item) {
                $total += $Item->getPriceIncTax() * $Item->getQuantity();
            }
            if ($total >= DeliveryFreeRule::ARROW_FREE_AMOUNT) {
                continue;
            }
            foreach ($Shipping->getOrderItems() as $Item) {
                if ($Item->getProcessorName() === DeliveryFeePreprocessor::class) {
                    $Item->setQuantity(1);
                }
            }
        }
    }
}
`;

  F['EventSubscriber/CartDeliveryFreeSubscriber.php'] = String.raw`<?php

namespace Customize\EventSubscriber;

use Customize\Service\DeliveryFreeRule;
use Eccube\Event\TemplateEvent;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

/**
 * カート画面の「あと○○円で送料無料」：矢・矢筒を含むカートは 55,000 円で計算し直す
 */
class CartDeliveryFreeSubscriber implements EventSubscriberInterface
{
    public function __construct(private DeliveryFreeRule $rule)
    {
    }

    public static function getSubscribedEvents(): array
    {
        return ['Cart/index.twig' => 'onCartIndex'];
    }

    public function onCartIndex(TemplateEvent $event): void
    {
        $least = $event->getParameter('least');
        $isDeliveryFree = $event->getParameter('is_delivery_free');

        foreach ($event->getParameter('Carts') as $Cart) {
            if (!$this->rule->hasArrows($Cart->getCartItems())) {
                continue;
            }
            $key = $Cart->getCartKey();
            $total = $Cart->getTotalPrice();
            $isDeliveryFree[$key] = $total >= DeliveryFreeRule::ARROW_FREE_AMOUNT;
            $least[$key] = max(0, DeliveryFreeRule::ARROW_FREE_AMOUNT - $total);
        }

        $event->setParameter('least', $least);
        $event->setParameter('is_delivery_free', $isDeliveryFree);
    }
}
`;

  const STAGE = {
    'Entity/ProductTrait.php': 1,
    'Form/Extension/Admin/ProductTypeExtension.php': 2,
    'Twig/Extension/StockBadgeExtension.php': 3,
    'Service/DeliveryFreeRule.php': 4,
    'Service/PurchaseFlow/Processor/ArrowDeliveryFeeProcessor.php': 4,
    'EventSubscriber/CartDeliveryFreeSubscriber.php': 5,
  };

  /** Product/detail.twig: the empty <p class="detail04"></p> of the shop's template → the badge (stage 3) */
  const DETAIL_OLD = '                            <p class="detail04"></p>';
  const BADGE = [
    '                            {% set badge = stock_badge(Product) %}',
    '                            <p class="detail04">',
    '                                <span class="stockBadge stockBadge--{{ badge.type }}">{{ badge.label }}</span>',
    '                                {% if badge.note %}<span class="stockBadge__note">{{ badge.note }}</span>{% endif %}',
    '                            </p>',
  ];
  /** customize.css (stage 3): appended */
  const CSS = [
    '',
    '/* 在庫・納期の表示（商品ページ） */',
    '.detail04 { display: flex; align-items: center; gap: 10px; margin: 14px 0 6px; }',
    '.stockBadge { display: inline-block; padding: 3px 14px; border-radius: 2px; color: #fff; font-size: 13px; font-weight: bold; line-height: 1.7; }',
    '.stockBadge--stock { background: #3f6f3a; }',
    '.stockBadge--few { background: #b8342b; }',
    '.stockBadge--order { background: #8c6a2f; }',
    '.stockBadge--soldout { background: #9a9a9a; }',
    '.stockBadge__note { color: #333; font-size: 14px; }',
  ];

  return {
    DIR: C,
    STAGE,
    DETAIL_OLD,
    BADGE,
    CSS,
    source: F,
    /** app/Customize/… files at a stage (paths from the EC-CUBE root) */
    files(stage) {
      const out = {};
      for (const [p, s] of Object.entries(STAGE)) if (s <= stage) out[C + p] = F[p];
      return out;
    },
    /** the theme's detail.twig at a stage (base: the shop's template) */
    detail(base, stage) { return stage >= 3 ? base.replace(DETAIL_OLD, BADGE.join('\n')) : base; },
    css(base, stage) { return stage >= 3 ? base.replace(/\s*$/, '\n') + CSS.join('\n') + '\n' : base; },
  };
});
