/*
 * The code this video writes into Garage's EC-CUBE 2 — the ONE source of what
 *   - VS Code shows and types (js/files.js, js/scenario.js — window.GARAGE_SRC), and
 *   - tools/snapshots/ec-garage-forms/capture-ec.js writes into the real EC-CUBE 2 (require()) before it outputs the PDFs /
 *     CSVs and captures the screens, so what the video shows is this code's real output.
 * The customisation is written for the video (garage.plus.co.jp's own code is not public). EC-CUBE 2 style: 4 spaces.
 *
 *   fpdf(stage)   data/class_extends/SC_Fpdf_Ex.php — 1: as first typed (the columns 24 mm too wide: the table runs off
 *                 the page), 2: fixed
 *   PDF_PAGE      data/class_extends/page_extends/admin/order/LC_Page_Admin_Order_Pdf_Ex.php (帳票出力の初期値)
 *   sql(stage)    the 出荷指示 CSV (CSV出力項目設定 › 高度な設定) — 1: with dtb_order.deliv_date (EC-CUBE 2.4's column,
 *                 gone since 2.11: the お届け日 is dtb_shipping.shipping_date), 2: fixed
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.GARAGE_SRC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const FPDF_PATH = 'data/class_extends/SC_Fpdf_Ex.php';
  const PDF_PAGE_PATH = 'data/class_extends/page_extends/admin/order/LC_Page_Admin_Order_Pdf_Ex.php';
  const SQL_PATH = 'docs/csv/shipping-plc.sql';
  const LOGO = 'data/Smarty/templates/admin/pdf/logo.png';

  const FPDF_HEAD = String.raw`<?php
/*
 * 納品書 PDF（受注管理 › 帳票出力）の Garage 向けカスタマイズ
 *
 * 明細の 1 列目「商品名 / 商品コード / [ 規格 ]」から品番を分けて「品番」の列にする
 * （倉庫とお客様が照合しやすいように。品番は製品番号 例：797-039）
 */
class SC_Fpdf_Ex extends SC_Fpdf
{`;
  const FPDF_CTOR = (stage) => String.raw`    public function __construct($download, $title, $tpl_pdf = 'nouhinsyo1.pdf')
    {
        parent::__construct($download, $title, $tpl_pdf);

        // 列の幅（mm）：品番の列を足す
        $this->width_cell = [${stage >= 2 ? '86.3' : '110.3'}, 24, 12, 21.7, 24.5];
        $this->label_cell = ['商品名 / [ 規格 ]', '品番', '数量', '単価', '金額(税込)'];
    }`;
  const FPDF_TABLE = String.raw`    /**
     * 明細の表：親クラスの表の 1 列目を「商品名 [ 規格 ]」と「品番」に分ける
     *
     * @param array $header 見出し
     * @param array $data   行（商品の行のあとに商品合計・送料などの行）
     * @param array $w      列の幅
     */
    public function FancyTable($header, $data, $w)
    {
        foreach ($data as $i => $row) {
            $code = $this->arrDisp['product_code'][$i] ?? null;
            if ($code === null) {
                // 商品合計・送料などの行：品番の列は空
                array_splice($data[$i], 1, 0, ['']);
                continue;
            }
            $name = str_replace(' / '.$code.' / ', '', $row[0]);
            array_splice($data[$i], 0, 1, [$name, $code]);
        }

        parent::FancyTable($header, $data, $w);
    }`;
  const fpdf = (stage) => [FPDF_HEAD, FPDF_CTOR(stage), '', FPDF_TABLE, '}', ''].join('\n');

  const PDF_PAGE = String.raw`<?php
/*
 * 受注管理 › 帳票出力：Garage の初期値（帳票タイトル・メッセージ・備考）
 */
class LC_Page_Admin_Order_Pdf_Ex extends LC_Page_Admin_Order_Pdf
{
    /**
     * PDF作成フォームのデフォルト値の生成
     *
     * @param int|null   $order_id     個別出力の注文番号
     * @param array|null $pdf_order_id 一括出力の注文番号
     *
     * @return array
     */
    public function createFromValues($order_id, $pdf_order_id)
    {
        $arrForm = parent::createFromValues($order_id, $pdf_order_id);

        $arrForm['title'] = '納品書';
        $arrForm['msg1'] = 'このたびはGarageをご利用いただき';
        $arrForm['msg2'] = 'まことにありがとうございます。';
        $arrForm['msg3'] = '下記の内容にて納品いたします。';
        $arrForm['etc1'] = 'ご不明な点は、ガラージお客様センターまでお問い合わせください。';
        $arrForm['etc2'] = 'フリーダイヤル 0120-33-1753（平日 10:00～12:00、13:00～17:00）';

        return $arrForm;
    }
}
`;

  const SQL_HEAD = '-- 出荷指示 CSV（物流倉庫 PLC 向け）：1 行 = 1 配送先の 1 商品\n-- 管理画面 › コンテンツ管理 › CSV出力項目設定 › 高度な設定（最初の SELECT は書かない）';
  const sql = (stage) => [SQL_HEAD,
    'o.order_id AS 受注番号,',
    '    s.shipping_id AS 配送先番号,',
    stage >= 2 ? '    s.shipping_date AS お届け希望日,' : '    o.deliv_date AS お届け希望日,',
    '    d.name AS 配送方法,',
    '    s.shipping_company_name AS 会社名,',
    "    s.shipping_name01 || ' ' || s.shipping_name02 AS お届け先,",
    "    s.shipping_zip01 || '-' || s.shipping_zip02 AS 郵便番号,",
    '    p.name || s.shipping_addr01 || s.shipping_addr02 AS 住所,',
    "    s.shipping_tel01 || '-' || s.shipping_tel02 || '-' || s.shipping_tel03 AS 電話番号,",
    '    i.product_code AS 品番,',
    '    i.product_name AS 商品名,',
    '    i.classcategory_name1 AS カラー,',
    '    i.quantity AS 数量',
    'FROM dtb_order o',
    '    JOIN dtb_shipping s ON s.order_id = o.order_id AND s.del_flg = 0',
    '    JOIN dtb_shipment_item i ON i.order_id = s.order_id AND i.shipping_id = s.shipping_id',
    '    JOIN dtb_deliv d ON d.deliv_id = o.deliv_id',
    '    LEFT JOIN mtb_pref p ON p.id = s.shipping_pref',
    'WHERE o.del_flg = 0 AND o.status IN (1, 6)',
    'ORDER BY o.order_id, s.shipping_id, i.product_code',
    ''].join('\n');
  /** the SQL as it goes into the admin's textarea (no comment lines, no SELECT) */
  const sqlBody = (stage) => sql(stage).split('\n').filter((l) => !l.startsWith('--')).join('\n').trim();

  return { FPDF_PATH, PDF_PAGE_PATH, SQL_PATH, LOGO, fpdf, PDF_PAGE, sql, sqlBody };
});
