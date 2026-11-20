/*
 * The platform of a video (the filter of the 特別 tab, and the grouping of the admin dashboard), from its tool line —
 * the first match wins (so "makeshop → Shopify", a move to Shopify, counts as Shopify).
 */
export const PLATFORMS = [
  { key: 'shopify', label: 'Shopify', color: '#34d399', test: /Shopify/ },
  { key: 'wordpress', label: 'WordPress', color: '#5b8cff', test: /WordPress|WooCommerce/ },
  { key: 'eccube', label: 'EC-CUBE', color: '#f5a524', test: /EC-CUBE/ },
  { key: 'makeshop', label: 'makeshop', color: '#e879f9', test: /makeshop/i },
  { key: 'studio', label: 'STUDIO', color: '#94a3b8', test: /STUDIO/ },
  { key: 'wix', label: 'Wix', color: '#38bdf8', test: /\bWix\b/ },
  { key: 'other', label: 'その他', color: '#a78bfa', test: /./ },
];

export const platformOf = (tool: string) => (PLATFORMS.find((p) => p.test.test(tool)) || PLATFORMS[PLATFORMS.length - 1]).key;
