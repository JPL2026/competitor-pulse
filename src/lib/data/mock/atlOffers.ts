// ATL Benchmark — manually researched snapshot of operator websites / eShops (Jordan, mobile prepaid & postpaid).
// As-of: 2026-09. Prices in JOD. These are published ATL offers, to be refreshed by automated scraping later.

export type AtlOperator = 'zain' | 'orange' | 'umniah';

export interface AtlOffer {
  id: string;
  operator: AtlOperator;
  name: string;
  kind: 'prepaid' | 'postpaid' | 'voucher';
  monthlyPriceJod: number | null; // headline monthly price
  priceNote?: string; // e.g. "excl. tax", "incl. tax"
  dataGb: number | null; // null = unlimited / N/A
  validityDays: number | null;
  calls?: string;
  extras?: string[]; // 5G, carryover, apps, subscriptions...
  promo?: {
    label: string; // short badge
    detail: string;
    promoPriceJod?: number; // effective price during promo
    endsNote?: string; // e.g. "first 3 months"
  };
  sourceUrl: string;
}

export const ATL_AS_OF = 'September 2026';

export const atlOffers: AtlOffer[] = [
  // ─── ORANGE (orange.jo — Ma'ak lineup) ───────────────────────────────
  {
    id: 'atl-or-maak11',
    operator: 'orange',
    name: "Ma'ak 11",
    kind: 'postpaid',
    monthlyPriceJod: 8.5,
    priceNote: 'excl. tax',
    dataGb: 50,
    validityDays: 30,
    calls: 'Unlimited local calls',
    extras: ['5G', 'Data carryover', 'TOD Mobile included'],
    sourceUrl: 'https://www.orange.jo',
  },
  {
    id: 'atl-or-maak13',
    operator: 'orange',
    name: "Ma'ak 13",
    kind: 'postpaid',
    monthlyPriceJod: 13,
    priceNote: 'excl. tax',
    dataGb: 60,
    validityDays: 30,
    calls: 'Unlimited local calls',
    extras: ['5G', 'Data carryover', 'Careem Plus 6 months'],
    promo: {
      label: '-39%',
      detail: 'Homepage promo — discounted monthly fee for new subscriptions',
      promoPriceJod: 21.25 / 2, // illustrative effective promo price
      endsNote: 'limited period',
    },
    sourceUrl: 'https://www.orange.jo',
  },
  {
    id: 'atl-or-maak30',
    operator: 'orange',
    name: "Ma'ak 30",
    kind: 'postpaid',
    monthlyPriceJod: 30,
    priceNote: 'excl. tax',
    dataGb: 112.5,
    validityDays: 30,
    calls: 'Unlimited local calls',
    extras: ['5G', 'Data carryover', 'TOD Mobile included'],
    sourceUrl: 'https://www.orange.jo',
  },
  {
    id: 'atl-or-maak70',
    operator: 'orange',
    name: "Ma'ak 70",
    kind: 'postpaid',
    monthlyPriceJod: 70,
    priceNote: 'JD 85.96 incl. tax',
    dataGb: 187.5,
    validityDays: 30,
    calls: 'Unlimited local calls',
    extras: ['5G', 'Data carryover', 'TOD Mobile included', 'Premium extras'],
    sourceUrl: 'https://www.orange.jo',
  },
  // ─── ZAIN (zain.jo — prepaid tiers) ──────────────────────────────────
  {
    id: 'atl-zain-7',
    operator: 'zain',
    name: 'Zain 7',
    kind: 'prepaid',
    monthlyPriceJod: 7,
    priceNote: 'incl. tax',
    dataGb: 14,
    validityDays: 30,
    calls: 'Local minutes bundle',
    extras: ['Data stacking', 'Meeza app management'],
    sourceUrl: 'https://www.zain.jo',
  },
  {
    id: 'atl-zain-10plus',
    operator: 'zain',
    name: 'Zain 10+ 5G',
    kind: 'prepaid',
    monthlyPriceJod: 10,
    priceNote: 'incl. tax',
    dataGb: 30,
    validityDays: 30,
    calls: 'Local minutes bundle',
    extras: ['5G', 'Data stacking'],
    promo: {
      label: 'Bonus data',
      detail: '+50–100% bonus data on first 3 subscriptions for new lines',
      endsNote: 'first 3 recharges',
    },
    sourceUrl: 'https://www.zain.jo',
  },
  {
    id: 'atl-zain-turbo',
    operator: 'zain',
    name: 'Turbo 40GB',
    kind: 'prepaid',
    monthlyPriceJod: 11.5,
    priceNote: 'incl. tax',
    dataGb: 40,
    validityDays: 30,
    calls: 'Data-centric bundle',
    extras: ['5G', 'Data stacking'],
    sourceUrl: 'https://www.zain.jo',
  },
  {
    id: 'atl-zain-mix',
    operator: 'zain',
    name: 'Mix voucher 4.25+4.25',
    kind: 'voucher',
    monthlyPriceJod: 8.5,
    priceNote: 'recharge voucher',
    dataGb: 10,
    validityDays: 28,
    calls: 'Split credit + data voucher',
    extras: ['Flexible recharge'],
    sourceUrl: 'https://www.zain.jo',
  },
  // ─── UMNIAH (umniah.com — prepaid & LIVE) ────────────────────────────
  {
    id: 'atl-um-golden7',
    operator: 'umniah',
    name: 'Golden Line 7GB',
    kind: 'prepaid',
    monthlyPriceJod: 5,
    priceNote: 'incl. tax',
    dataGb: 7,
    validityDays: 30,
    calls: 'Local minutes bundle',
    extras: ['eShop activation'],
    sourceUrl: 'https://www.umniah.com',
  },
  {
    id: 'atl-um-golden14',
    operator: 'umniah',
    name: 'Golden Line 14GB',
    kind: 'prepaid',
    monthlyPriceJod: 7,
    priceNote: 'incl. tax',
    dataGb: 14,
    validityDays: 30,
    calls: 'Local minutes bundle',
    extras: ['eShop activation'],
    promo: {
      label: '-50% first month',
      detail: 'eShop promo: 50% off the first month for online subscriptions',
      promoPriceJod: 3.5,
      endsNote: 'first month',
    },
    sourceUrl: 'https://www.umniah.com',
  },
  {
    id: 'atl-um-golden21',
    operator: 'umniah',
    name: 'Golden Line 21GB',
    kind: 'prepaid',
    monthlyPriceJod: 9,
    priceNote: 'incl. tax',
    dataGb: 21,
    validityDays: 30,
    calls: 'Local minutes bundle',
    extras: ['eShop activation'],
    sourceUrl: 'https://www.umniah.com',
  },
  {
    id: 'atl-um-tabi3i',
    operator: 'umniah',
    name: 'Khaleek Tabi3i Extra',
    kind: 'prepaid',
    monthlyPriceJod: 6,
    priceNote: 'incl. tax',
    dataGb: 10,
    validityDays: 30,
    calls: 'Youth-oriented bundle',
    extras: ['Social media bundles'],
    sourceUrl: 'https://www.umniah.com',
  },
];

export interface AtlSummary {
  operator: AtlOperator;
  offerCount: number;
  minPrice: number;
  bestJdPerGb: number;
  promoCount: number;
}

export function jdPerGb(o: AtlOffer): number | null {
  if (!o.monthlyPriceJod || !o.dataGb) return null;
  return o.monthlyPriceJod / o.dataGb;
}

export function getAtlSummary(): AtlSummary[] {
  const ops: AtlOperator[] = ['zain', 'orange', 'umniah'];
  return ops.map((operator) => {
    const list = atlOffers.filter((o) => o.operator === operator);
    const prices = list.map((o) => o.monthlyPriceJod).filter((v): v is number => v != null);
    const ratios = list.map(jdPerGb).filter((v): v is number => v != null);
    return {
      operator,
      offerCount: list.length,
      minPrice: prices.length ? Math.min(...prices) : 0,
      bestJdPerGb: ratios.length ? Math.min(...ratios) : 0,
      promoCount: list.filter((o) => o.promo).length,
    };
  });
}
