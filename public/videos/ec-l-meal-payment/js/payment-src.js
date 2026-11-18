/*
 * The payment plugin this video writes for ライフミール's EC-CUBE 4 (app/Plugin/LmealPayment): the ONE source of the code that
 *   - VS Code shows and types (js/files.js, js/scenario.js — window.LMEAL_SRC), and
 *   - tools/snapshots/ec-l-meal-payment/capture-ec.js writes into the local EC-CUBE 4.3.1-p1 (require()), installs and
 *     enables there (bin/console eccube:plugin:install / enable), so every screen of the video is this code's output.
 * Written for the demo (l-meal.com's own code is not public). PSR-12 (4 spaces), as EC-CUBE's own code.
 *
 * The card payment goes through EC-CUBE's payment extension point (Eccube\Service\Payment\PaymentMethodInterface:
 * verify → apply → checkout) with a token: the card number never reaches the shop's server — the provider's token JS
 * turns it into a one-time token in the browser. The provider side (its API and token JS) is a reconstruction: in test
 * mode (LMEAL_PAYMENT_MODE=sandbox, the dev copy) CardGateway and token-sandbox.js answer for the published test cards.
 *
 * files(stage):
 *   1  the plugin: PluginManager (registers the payment), CreditCard (PaymentMethodInterface), CardGateway, the order form's
 *      token field (FormTypeExtension), the card form on the 注文手続き page (TemplateEvent snippet + token JS)
 *      → the confirm page's form does not post the token (EC-CUBE's checkout() form is built with skip_add_form)
 *   2  + the token on the confirm page (Shopping/confirm.twig snippet) — the fix
 *   3  + 冷凍庫レンタル only with クレジットカード (a PurchaseFlow validator, @ShoppingFlow)
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LMEAL_SRC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const P = 'app/Plugin/LmealPayment/';
  const F = {};

  F['composer.json'] = `{
    "name": "ec-cube/lmealpayment",
    "version": "1.0.0",
    "description": "ライフミール クレジットカード決済（トークン決済）",
    "type": "eccube-plugin",
    "require": {
        "ec-cube/plugin-installer": "^2.0"
    },
    "extra": {
        "code": "LmealPayment"
    }
}
`;

  F['PluginManager.php'] = String.raw`<?php

namespace Plugin\LmealPayment;

use Eccube\Entity\Payment;
use Eccube\Plugin\AbstractPluginManager;
use Plugin\LmealPayment\Service\Method\CreditCard;
use Psr\Container\ContainerInterface;

class PluginManager extends AbstractPluginManager
{
    /**
     * 有効化：支払方法「クレジットカード決済」を登録（2 回目以降は表示に戻す）
     */
    public function enable(array $meta, ContainerInterface $container)
    {
        $em = $container->get('doctrine')->getManager();
        $repository = $em->getRepository(Payment::class);

        $Payment = $repository->findOneBy(['method_class' => CreditCard::class]);
        if (!$Payment) {
            $Last = $repository->findOneBy([], ['sort_no' => 'DESC']);
            $Payment = new Payment();
            $Payment->setMethod('クレジットカード決済')
                ->setMethodClass(CreditCard::class)
                ->setCharge(0)
                ->setRuleMin(0)
                ->setFixed(true)
                ->setSortNo($Last ? $Last->getSortNo() + 1 : 1);
            $em->persist($Payment);
        }
        $Payment->setVisible(true);
        $em->flush();
    }

    /**
     * 無効化：支払方法を非表示に（過去の受注が参照するので削除はしない）
     */
    public function disable(array $meta, ContainerInterface $container)
    {
        $em = $container->get('doctrine')->getManager();
        $Payment = $em->getRepository(Payment::class)->findOneBy(['method_class' => CreditCard::class]);
        if ($Payment) {
            $Payment->setVisible(false);
            $em->flush();
        }
    }
}
`;

  F['Resource/config/services.yaml'] = `parameters:
    # sandbox：テストモード（代行会社に接続せず、テストカードだけを受け付ける）／ production：本番
    env(LMEAL_PAYMENT_MODE): 'sandbox'
    env(LMEAL_PAYMENT_SHOP_ID): ''
    env(LMEAL_PAYMENT_SECRET): ''
    env(LMEAL_PAYMENT_API_URL): ''
    env(LMEAL_PAYMENT_TOKEN_JS): ''
    lmeal_payment.mode: '%env(LMEAL_PAYMENT_MODE)%'
    lmeal_payment.shop_id: '%env(LMEAL_PAYMENT_SHOP_ID)%'
    lmeal_payment.secret: '%env(LMEAL_PAYMENT_SECRET)%'
    lmeal_payment.api_url: '%env(LMEAL_PAYMENT_API_URL)%'
    lmeal_payment.token_js: '%env(LMEAL_PAYMENT_TOKEN_JS)%'
`;

  F['Service/CardGateway.php'] = String.raw`<?php

namespace Plugin\LmealPayment\Service;

use Eccube\Common\EccubeConfig;

/**
 * カード決済代行会社の API（トークンで与信と売上確定）
 *
 * テストモード（sandbox）では代行会社に接続せず、テスト用トークン JS が発行したトークンに決まった応答を返す。
 */
class CardGateway
{
    public const SANDBOX = 'sandbox';

    /** テストモードで「承認されない」テストカードの下 4 桁 */
    private const DECLINED = ['0002'];

    public function __construct(private EccubeConfig $eccubeConfig)
    {
    }

    public function isSandbox(): bool
    {
        return $this->eccubeConfig['lmeal_payment.mode'] === self::SANDBOX;
    }

    /**
     * 与信と同時に売上確定（即時売上）
     *
     * @return array{status: string, transaction_id?: string, brand?: string, last4?: string, code?: string, message?: string}
     */
    public function charge(string $token, int $amount, string $orderNo): array
    {
        if ($token === '') {
            return ['status' => 'error', 'code' => 'token_missing', 'message' => 'カード情報（トークン）がありません。'];
        }
        if ($this->isSandbox()) {
            return $this->sandbox($token, $amount, $orderNo);
        }

        return $this->request('/charges', [
            'shop_id' => $this->eccubeConfig['lmeal_payment.shop_id'],
            'token' => $token,
            'amount' => $amount,
            'currency' => 'JPY',
            'order_id' => $orderNo,
            'capture' => true,
        ]);
    }

    private function sandbox(string $token, int $amount, string $orderNo): array
    {
        // tok_test_<ブランド>_<下4桁>_<乱数>（Resource/assets/js/token-sandbox.js が発行）
        if (!preg_match('/^tok_test_([a-z]+)_(\d{4})_[0-9a-f]{16}$/', $token, $m)) {
            return ['status' => 'error', 'code' => 'invalid_token', 'message' => 'カード情報（トークン）が正しくありません。'];
        }
        if (in_array($m[2], self::DECLINED, true)) {
            return ['status' => 'declined', 'code' => 'card_declined', 'message' => 'カード会社でお取引が承認されませんでした。'];
        }

        return [
            'status' => 'captured',
            'transaction_id' => 'tr_test_'.substr(hash('sha256', $token.$orderNo), 0, 20),
            'brand' => strtoupper($m[1]),
            'last4' => $m[2],
            'amount' => $amount,
        ];
    }

    private function request(string $path, array $body): array
    {
        $ch = curl_init(rtrim($this->eccubeConfig['lmeal_payment.api_url'], '/').$path);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer '.$this->eccubeConfig['lmeal_payment.secret']],
            CURLOPT_POSTFIELDS => json_encode($body),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 30,
        ]);
        $response = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if ($response === false || $status >= 500) {
            return ['status' => 'error', 'code' => 'gateway_unavailable', 'message' => '決済サーバーに接続できませんでした。'];
        }

        return json_decode($response, true) ?: ['status' => 'error', 'code' => 'invalid_response', 'message' => '決済サーバーの応答が正しくありません。'];
    }
}
`;

  // the payment method: typed in the video from verify() on (the head is pasted)
  F['Service/Method/CreditCard.php'] = String.raw`<?php

namespace Plugin\LmealPayment\Service\Method;

use Eccube\Entity\Master\OrderStatus;
use Eccube\Entity\Order;
use Eccube\Repository\Master\OrderStatusRepository;
use Eccube\Service\Payment\PaymentMethodInterface;
use Eccube\Service\Payment\PaymentResult;
use Eccube\Service\PurchaseFlow\PurchaseContext;
use Eccube\Service\PurchaseFlow\PurchaseFlow;
use Plugin\LmealPayment\Service\CardGateway;
use Symfony\Component\Form\FormInterface;

/**
 * クレジットカード決済（トークン決済）
 *
 * verify()   注文確認へ進むとき：カード情報（トークン）があるか
 * apply()    注文する（前処理）：対応状況を「決済処理中」に、在庫・ポイントを確保
 * checkout() 決済：代行会社で与信・売上確定 → 「入金済み」
 */
class CreditCard implements PaymentMethodInterface
{
    /** @var Order */
    private $Order;

    /** @var FormInterface */
    private $form;

    public function __construct(
        private CardGateway $gateway,
        private PurchaseFlow $shoppingPurchaseFlow,
        private OrderStatusRepository $orderStatusRepository
    ) {
    }

    public function verify()
    {
        $result = new PaymentResult();
        if (!$this->form->get('lmeal_card_token')->getData()) {
            return $result->setSuccess(false)->setErrors(['カード情報を入力してください。']);
        }

        return $result->setSuccess(true);
    }

    public function apply()
    {
        $this->Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::PENDING));
        $this->shoppingPurchaseFlow->prepare($this->Order, new PurchaseContext());

        return false;
    }

    public function checkout()
    {
        $token = (string) $this->form->get('lmeal_card_token')->getData();
        $res = $this->gateway->charge($token, (int) $this->Order->getPaymentTotal(), $this->Order->getOrderNo());

        $result = new PaymentResult();
        if ($res['status'] !== 'captured') {
            log_info('[カード決済] 決済エラー', [$this->Order->getOrderNo(), $res['code'], $res['message']]);
            $this->shoppingPurchaseFlow->rollback($this->Order, new PurchaseContext());

            return $result->setSuccess(false)->setErrors([$res['message']]);
        }

        $this->shoppingPurchaseFlow->commit($this->Order, new PurchaseContext());
        $this->Order->setOrderStatus($this->orderStatusRepository->find(OrderStatus::PAID));
        $this->Order->setPaymentDate(new \DateTime());
        $this->Order->setNote(trim(sprintf("カード決済 %s（%s ****%s）\n%s", $res['transaction_id'], $res['brand'], $res['last4'], $this->Order->getNote())));
        $this->Order->appendCompleteMessage(sprintf('<p>クレジットカード（%s ****%s）でのお支払いが完了しました。</p>', $res['brand'], $res['last4']));
        $this->Order->appendCompleteMailMessage(sprintf("クレジットカード（%s ****%s）でのお支払いが完了しました。\n", $res['brand'], $res['last4']));
        log_info('[カード決済] 売上確定', [$this->Order->getOrderNo(), $res['transaction_id']]);

        return $result->setSuccess(true);
    }

    public function setFormType(FormInterface $form)
    {
        $this->form = $form;

        return $this;
    }

    public function setOrder(Order $Order)
    {
        $this->Order = $Order;

        return $this;
    }
}
`;

  F['Form/Extension/OrderTypeExtension.php'] = String.raw`<?php

namespace Plugin\LmealPayment\Form\Extension;

use Eccube\Form\Type\Shopping\OrderType;
use Symfony\Component\Form\AbstractTypeExtension;
use Symfony\Component\Form\Extension\Core\Type\HiddenType;
use Symfony\Component\Form\FormBuilderInterface;

/**
 * 注文手続きのフォームに、カードのトークン（カード番号そのものはショップに送らない）
 */
class OrderTypeExtension extends AbstractTypeExtension
{
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $builder->add('lmeal_card_token', HiddenType::class, [
            'mapped' => false,
            'required' => false,
        ]);
    }

    public static function getExtendedTypes(): iterable
    {
        yield OrderType::class;
    }
}
`;

  const EVENT = (stage) => String.raw`<?php

namespace Plugin\LmealPayment;

use Eccube\Common\EccubeConfig;
use Eccube\Event\TemplateEvent;
use Plugin\LmealPayment\Service\Method\CreditCard;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class LmealPaymentEvent implements EventSubscriberInterface
{
    public function __construct(private EccubeConfig $eccubeConfig)
    {
    }

    public static function getSubscribedEvents()
    {
        return [
            'Shopping/index.twig' => 'onShoppingIndex',${stage >= 2 ? `
            'Shopping/confirm.twig' => 'onShoppingConfirm',` : ''}
        ];
    }

    /**
     * 注文手続き：お支払方法がクレジットカード決済のときカード情報の入力欄
     */
    public function onShoppingIndex(TemplateEvent $event)
    {
        if (!$this->isCard($event)) {
            return;
        }
        $event->setParameter('lmeal_sandbox', $this->eccubeConfig['lmeal_payment.mode'] === 'sandbox');
        $event->setParameter('lmeal_token_js', $this->eccubeConfig['lmeal_payment.token_js']);
        $event->addSnippet('@LmealPayment/default/Shopping/card_form.twig');
    }
${stage >= 2 ? `
    /**
     * 注文確認：トークンを「注文する」のフォームで送り直す（checkout() のフォームには確認画面の値しか来ない）
     */
    public function onShoppingConfirm(TemplateEvent $event)
    {
        if ($this->isCard($event)) {
            $event->addSnippet('@LmealPayment/default/Shopping/card_confirm.twig');
        }
    }
` : ''}
    private function isCard(TemplateEvent $event): bool
    {
        $Order = $event->getParameter('Order');

        return $Order && $Order->getPayment() && $Order->getPayment()->getMethodClass() === CreditCard::class;
    }
}
`;

  F['Resource/template/default/Shopping/card_form.twig'] = `{#
注文手続き：カード情報の入力欄（「お支払方法」の下に移して表示）
カード番号・有効期限・セキュリティコードの欄には name を付けない：ショップのサーバーには送らず、
代行会社のトークン JS がカード番号をトークンに替え、トークンだけを lmeal_card_token で送る
#}
<div id="lmeal-card" class="ec-orderPayment lmeal-card">
    <div class="ec-rectHeading">
        <h2>クレジットカード情報</h2>
    </div>
    <p class="lmeal-card__brands">VISA / Mastercard / JCB / American Express / Diners Club</p>
    {% if lmeal_sandbox %}
        <p class="lmeal-card__test">テストモード：実際の請求は発生しません</p>
    {% endif %}
    <div class="ec-borderedDefs">
        <dl>
            <dt><label class="ec-label" for="lmeal-card-number">カード番号</label></dt>
            <dd><div class="ec-input"><input type="text" id="lmeal-card-number" inputmode="numeric" autocomplete="cc-number" placeholder="1234 5678 9012 3456"></div></dd>
        </dl>
        <dl>
            <dt><label class="ec-label" for="lmeal-card-exp">有効期限</label></dt>
            <dd><div class="ec-input"><input type="text" id="lmeal-card-exp" autocomplete="cc-exp" placeholder="MM/YY"></div></dd>
        </dl>
        <dl>
            <dt><label class="ec-label" for="lmeal-card-cvc">セキュリティコード</label></dt>
            <dd><div class="ec-input"><input type="text" id="lmeal-card-cvc" inputmode="numeric" autocomplete="cc-csc" placeholder="123"></div></dd>
        </dl>
        <dl>
            <dt><label class="ec-label" for="lmeal-card-name">カード名義</label></dt>
            <dd><div class="ec-input"><input type="text" id="lmeal-card-name" autocomplete="cc-name" placeholder="TARO YAMADA"></div></dd>
        </dl>
    </div>
    <p class="ec-errorMessage" id="lmeal-card-error"></p>
    {{ form_widget(form.lmeal_card_token, { attr: { form: 'shopping-form' } }) }}
</div>
<script src="{{ lmeal_sandbox ? asset('LmealPayment/assets/js/token-sandbox.js', 'plugin') : lmeal_token_js }}"></script>
<script>
    $(function () {
        $('#lmeal-card').insertAfter($('#shopping-form .ec-orderPayment').first());
        var $token = $('#shopping_order_lmeal_card_token');
        $('#shopping-form').on('submit', function (e) {
            // お支払方法・お届け先の変更（redirect_to）はそのまま送る
            if ($token.val() || this.action.indexOf('/shopping/confirm') < 0) {
                return true;
            }
            e.preventDefault();
            var form = this;
            LmealToken.create({
                number: $('#lmeal-card-number').val(),
                exp: $('#lmeal-card-exp').val(),
                cvc: $('#lmeal-card-cvc').val(),
                name: $('#lmeal-card-name').val()
            }).then(function (res) {
                $token.val(res.token);
                form.submit();
            }).catch(function (err) {
                loadingOverlay('hide');
                $('#lmeal-card-error').text(err.message);
            });
        });
    });
</script>
`;

  F['Resource/template/default/Shopping/card_confirm.twig'] = `{# 注文確認：トークンを「注文する」のフォーム（#shopping-form）で送る #}
{{ form_widget(form.lmeal_card_token, { attr: { form: 'shopping-form' } }) }}
`;

  F['Resource/assets/js/token-sandbox.js'] = `/*
 * テストモード用のトークン JS（代行会社のトークン JS と同じ呼び方）
 * 公開されているテスト用のカード番号だけを受け付け、tok_test_<ブランド>_<下4桁>_<乱数> を返す。
 * カード番号はブラウザの外に出さない。
 */
window.LmealToken = (function () {
    var TEST_CARDS = {
        '4111111111111111': 'visa',
        '4000000000000002': 'visa',
        '5555555555554444': 'mastercard',
        '3530111333300000': 'jcb',
        '378282246310005': 'amex',
        '30569309025904': 'diners'
    };

    function fail(message) {
        return Promise.reject(new Error(message));
    }

    function create(card) {
        var number = String(card.number || '').replace(/[\\s-]/g, '');
        var exp = String(card.exp || '').match(/^(\\d{2})\\s*\\/\\s*(\\d{2})$/);
        if (!TEST_CARDS[number]) {
            return fail('テストモードでは、テスト用のカード番号のみご利用いただけます。');
        }
        if (!exp || +exp[1] < 1 || +exp[1] > 12 || new Date(2000 + +exp[2], +exp[1], 1) <= new Date()) {
            return fail('有効期限を正しく入力してください。');
        }
        if (!/^\\d{3,4}$/.test(String(card.cvc || ''))) {
            return fail('セキュリティコードを正しく入力してください。');
        }
        var rand = new Uint8Array(8);
        crypto.getRandomValues(rand);
        var hex = Array.prototype.map.call(rand, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');

        return Promise.resolve({ token: 'tok_test_' + TEST_CARDS[number] + '_' + number.slice(-4) + '_' + hex });
    }

    return { create: create };
})();
`;

  F['Service/PurchaseFlow/FreezerRentalPaymentValidator.php'] = String.raw`<?php

namespace Plugin\LmealPayment\Service\PurchaseFlow;

use Eccube\Annotation\ShoppingFlow;
use Eccube\Entity\ItemHolderInterface;
use Eccube\Entity\Order;
use Eccube\Service\PurchaseFlow\ItemHolderValidator;
use Eccube\Service\PurchaseFlow\PurchaseContext;
use Plugin\LmealPayment\Service\Method\CreditCard;

/**
 * 冷凍庫レンタル（商品コード LM-FREEZER）のお申込みは、クレジットカード決済のみ
 *
 * @ShoppingFlow
 */
class FreezerRentalPaymentValidator extends ItemHolderValidator
{
    public const PRODUCT_CODE = 'LM-FREEZER';

    protected function validate(ItemHolderInterface $itemHolder, PurchaseContext $context)
    {
        if (!$itemHolder instanceof Order || !$itemHolder->getPayment()) {
            return;
        }
        if ($itemHolder->getPayment()->getMethodClass() === CreditCard::class) {
            return;
        }
        foreach ($itemHolder->getProductOrderItems() as $item) {
            if ($item->getProductClass()->getCode() === self::PRODUCT_CODE) {
                $this->throwInvalidItemException('冷凍庫レンタルをお申込みの場合は、クレジットカード決済のみご利用いただけます。', null, true);
            }
        }
    }
}
`;

  // which stage each file comes in
  const STAGE = {
    'composer.json': 1, 'PluginManager.php': 1, 'Resource/config/services.yaml': 1, 'Service/CardGateway.php': 1,
    'Service/Method/CreditCard.php': 1, 'Form/Extension/OrderTypeExtension.php': 1, 'Resource/template/default/Shopping/card_form.twig': 1,
    'Resource/assets/js/token-sandbox.js': 1, 'Resource/template/default/Shopping/card_confirm.twig': 2,
    'Service/PurchaseFlow/FreezerRentalPaymentValidator.php': 3,
  };

  return {
    PLUGIN: P,
    CODE: 'LmealPayment',
    source: F,
    event: EVENT,
    /** the plugin's files at a stage (paths from the EC-CUBE root) */
    files(stage) {
      const out = {};
      for (const [p, s] of Object.entries(STAGE)) if (s <= stage) out[P + p] = F[p];
      out[P + 'LmealPaymentEvent.php'] = EVENT(stage);
      return out;
    },
    // published test card numbers (the card brands' / providers' public test numbers — never a real card)
    TEST_CARD: { number: '4111 1111 1111 1111', exp: '12/30', cvc: '123', name: 'HANAKO TEST' },
  };
});
