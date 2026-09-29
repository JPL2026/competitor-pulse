// ATL scraper core v2 — B2C mobile only, per-operator eShop parsers.
// kind values: 'prepaid' | 'postpaid' | 'visitors' | 'egypt'

const SUPABASE_URL = 'https://idxnflkmvdsaaysnajvp.supabase.co';
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeG5mbGttdmRzYWF5c25hanZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDk5NTUsImV4cCI6MjEwNjE4NTk1NX0.Boq9sorbkhALZ4_E8iJUTxGhRKjmJIDTLV_26qT7QLE';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const gbFrom = (t) => {
  if (!t) return null;
  const m = String(t).match(/(\d+(?:\.\d+)?)\s*(GB|جيجا)/i);
  return m ? parseFloat(m[1]) : null;
};

async function getHtml(url, timeoutMs = 25000) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

// ─── ORANGE (eshop.orange.jo — nopCommerce AJAX probe + detail pages) ────
const ORANGE_SKIP = /watch|huawei|xiaomi|iphone|samsung|air fryer|tablet|router|accessories|earbuds|tv\b|\bADSL\b|fiber|fibre|fixed|home internet| GB Internet\b|business|FWA|5G Home|Daman|satellite|camera|memory card/i;

// B2C mobile families we keep, mapped to line type
function orangeLineType(name) {
  if (/\bpro\b/i.test(name)) return null; // Maak Pro = not B2C mass-market
  if (/visitor/i.test(name)) return 'visitors';
  if (/humat|watan/i.test(name)) return 'egypt';
  if (/prepaid/i.test(name)) return 'prepaid';
  if (/^ma'?ak\s/i.test(name) && !/pro/i.test(name)) return 'postpaid'; // classic Ma'ak only
  return null; // everything else (Maak Pro, devices…) is excluded
}

async function scrapeOrange() {
  const found = [];
  const probe = async (id) => {
    try {
      const res = await fetch('https://eshop.orange.jo/CustomProduct/GetHomePageProductBySubCat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'X-Requested-With': 'XMLHttpRequest',
          'User-Agent': UA,
        },
        body: `subCategoryId=${id}&productTagId=0&isDrawer=false`,
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return;
      const d = await res.json();
      const prods = d?.model?.Products;
      if (!Array.isArray(prods)) return;
      for (const p of prods) {
        const name = p?.Name;
        const price = p?.ProductPrice?.PriceValue;
        if (!name || !price || price <= 0 || price > 60) continue;
        if (ORANGE_SKIP.test(name)) continue;
        if (!orangeLineType(name)) continue;
        found.push(p);
      }
    } catch { /* skip */ }
  };
  const ids = Array.from({ length: 1400 }, (_, i) => i + 1);
  for (let i = 0; i < ids.length; i += 60) {
    await Promise.all(ids.slice(i, i + 60).map(probe));
  }
  const unique = [...new Map(found.map((p) => [p.Id ?? p.Name, p])).values()];

  const enrich = async (p) => {
    const name = p.Name;
    const price = p.ProductPrice.PriceValue; // displayed incl. tax on PDP
    const oldPrice = p?.ProductPrice?.OldPriceValue || 0;
    const seName = p?.SeName;
    const features = [];
    let dataGb = gbFrom(JSON.stringify(p?.ProductAttributes ?? ''));
    let priceExcl = null;
    if (seName) {
      try {
        const dres = await fetch(`https://eshop.orange.jo/en/mobile/${seName}`, {
          headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(12000),
        });
        if (dres.ok) {
          const dhtml = await dres.text();
          const gm = dhtml.match(/enjoy\s+(\d+(?:\.\d+)?)\s*GB\s+internet/i)
            || dhtml.match(/content="[^"]*?(\d+(?:\.\d+)?)\s*GB\s+Internet/i)
            || dhtml.match(/(\d+(?:\.\d+)?)\s*GB\s+internet/i);
          if (gm) dataGb = parseFloat(gm[1]);
          const xm = dhtml.match(/(\d+(?:\.\d+)?)\s*JD\s*(?:excl\.?|without|before)\s*tax/i)
            || dhtml.match(/tax\s*exclusive[^0-9]{0,20}(\d+(?:\.\d+)?)/i);
          if (xm) priceExcl = parseFloat(xm[1]);
          for (const fm of dhtml.matchAll(/<li[^>]*>([^<]{6,80})<\/li>/g)) {
            const t = fm[1].trim();
            if (/GB|G|min|SMS|call|carry|roam|unlimited/i.test(t) && features.length < 8) features.push(t);
          }
        }
      } catch { /* optional */ }
    }
    const promo = oldPrice > price
      ? { label: `-${Math.round((1 - price / oldPrice) * 100)}%`, detail: `Was JD ${oldPrice} — now JD ${price}`, promoPrice: price }
      : null;
    return {
      id: `orange-${p.Id ?? slug(name)}`,
      operator: 'orange',
      name: name.trim(),
      kind: orangeLineType(name),
      monthly_price_jod: price,
      price_incl_tax: price,
      price_excl_tax: priceExcl,
      price_note: 'incl. tax',
      data_gb: dataGb,
      validity_days: 30,
      calls: /unlimited/i.test(features.join(' ')) ? 'Unlimited local calls & SMS' : null,
      extras: features.slice(0, 8),
      promo_label: promo?.label ?? null,
      promo_detail: promo?.detail ?? null,
      promo_price_jod: promo?.promoPrice ?? null,
      promo_ends_note: null,
      source_url: seName ? `https://eshop.orange.jo/en/mobile/${seName}` : 'https://eshop.orange.jo/en/mobile',
      scraped_at: new Date().toISOString(),
    };
  };
  const offers = [];
  for (let i = 0; i < unique.length; i += 10) {
    offers.push(...(await Promise.all(unique.slice(i, i + 10).map(enrich))));
  }
  return offers;
}

// ─── UMNIAH (eshop.umniah.com — Magento Hyvä, embedded product JSON) ─────
const UMNIAH_PAGES = [
  { url: 'https://eshop.umniah.com/en/plans/mobile-line/prepaid.html', kind: 'prepaid' },
  { url: 'https://eshop.umniah.com/en/plans/mobile-line/postpaid.html', kind: 'postpaid' },
  { url: 'https://eshop.umniah.com/en/plans/mobile-line/for_visitors.html', kind: 'visitors' },
  { url: 'https://eshop.umniah.com/en/plans/mobile-line/prepaid/egypt-line.html', kind: 'egypt' },
];

async function scrapeUmniahPage({ url, kind }) {
  const html = await getHtml(url);
  const offers = [];
  const seen = new Set();
  // embedded product JSON blobs
  const re = /\{"id":"(\d+)","name":"([^"]+)","currency":"JOD","unit_price":([\d.]+),"unit_sale_price":([\d.]+),"url":"([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    const [, pid, name, priceStr, saleStr, purl] = m;
    if (seen.has(pid)) continue;
    seen.add(pid);
    const price = parseFloat(priceStr);
    const sale = parseFloat(saleStr);
    if (!price || price > 60) continue;
    // per-product card section → features from attribute icon alt texts
    const chunkStart = html.indexOf(`/product/${pid}/`);
    const chunk = chunkStart >= 0 ? html.slice(chunkStart, chunkStart + 8000) : '';
    const features = [];
    for (const am of chunk.matchAll(/alt="([^"]{3,80})"/g)) {
      const t = am[1].trim();
      if (!/logo|icon|placeholder|umniah$/i.test(t) && !features.includes(t)) features.push(t);
    }
    const dataGb = gbFrom(chunk.match(/(\d+(?:\.\d+)?)\s*GB\s*Data\s*bundle/i)?.[0]) ?? gbFrom(name);
    const hasPromo = sale > 0 && sale < price;
    offers.push({
      id: `umniah-${pid}`,
      operator: 'umniah',
      name: name.trim(),
      kind,
      monthly_price_jod: hasPromo ? sale : price,
      price_incl_tax: hasPromo ? sale : price,
      price_excl_tax: null,
      price_note: null,
      data_gb: dataGb,
      validity_days: 30,
      calls: features.find((f) => /min|call/i.test(f)) ?? null,
      extras: features.slice(0, 8),
      promo_label: hasPromo ? `-${Math.round((1 - sale / price) * 100)}%` : null,
      promo_detail: hasPromo ? `Was JOD ${price} — now JOD ${sale}` : null,
      promo_price_jod: hasPromo ? sale : null,
      promo_ends_note: null,
      source_url: purl.replace(/\\\//g, '/'),
      scraped_at: new Date().toISOString(),
    });
  }
  return offers;
}

async function scrapeUmniah() {
  const all = [];
  for (const page of UMNIAH_PAGES) {
    try {
      all.push(...(await scrapeUmniahPage(page)));
    } catch { /* page unreachable — skip */ }
  }
  return all;
}

// ─── ZAIN — curated B2C line-up (jo.zain.com, Sep 2026) ──────────────────
// eshop.jo.zain.com is an eKYC wizard SPA with no reachable product feed.
// Line-up maintained from jo.zain.com published pages (prices excl. tax).
const ZAIN_SEED = [
  // [name, priceExcl, GB, promoLabel, promoDetail, kind]
  ['Zain Basic / El Kul', 1, 1, null, null, 'prepaid'],
  ['Shahamah 6 special', 6.5, 12, null, null, 'prepaid'],
  ['Shahameh 1+', 7, 20, 'Bonus data', '+50% GB for first 3 subscriptions', 'prepaid'],
  ['Jeelna line 7', 7.5, 18, null, null, 'prepaid'],
  ['Shahamah 7', 8, 25, null, null, 'prepaid'],
  ['Zain 7', 8.5, 15, null, null, 'prepaid'],
  ['Zain 8+', 8.5, 15, 'Bonus data', '+50% GB for first 3 subscriptions', 'prepaid'],
  ['Jeelna Line', 9.5, 30, null, null, 'prepaid'],
  ['Mish Tabe3e Max 10', 9.5, 30, null, null, 'prepaid'],
  ['Zain 9', 10.5, 25, 'Bonus data', '+50% GB for first 3 subscriptions', 'prepaid'],
  ['Zain 10+', 10.5, 25, 'Bonus data', '+50% GB for first 3 subscriptions', 'prepaid'],
  ['Zain 11', 11.5, 30, null, null, 'prepaid'],
  ['Turbo mix', 11.5, 40, null, null, 'prepaid'],
  ['Zain 12+', 12.5, 35, 'Bonus data', '+50% GB for first 3 subscriptions', 'prepaid'],
  ['Zain 13 5G', 13.5, 40, 'Bonus data', '+50% GB for first 3 subscriptions', 'prepaid'],
  ['Nitro Mix', 15.5, 28, null, null, 'prepaid'],
];
function zainSeed() {
  const now = new Date().toISOString();
  return ZAIN_SEED.map(([name, price, gb, promoLabel, promoDetail, kind]) => ({
    id: 'zain-' + slug(name),
    operator: 'zain',
    name,
    kind,
    monthly_price_jod: price,
    price_incl_tax: null,
    price_excl_tax: price,
    price_note: 'excl. tax',
    data_gb: gb,
    validity_days: 30,
    calls: 'Local minutes bundle',
    extras: ['Data stacking', 'Meeza app'],
    promo_label: promoLabel,
    promo_detail: promoDetail,
    promo_price_jod: null,
    promo_ends_note: promoLabel ? 'first 3 subscriptions' : null,
    source_url: 'https://www.jo.zain.com/english/Pages/Prepaid-LegacyPlans.aspx',
    scraped_at: now,
  }));
}

// ─── Supabase helpers ────────────────────────────────────────────────────
async function sbGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers: SB_HEADERS });
  if (!res.ok) throw new Error(`supabase GET ${path}: ${res.status}`);
  return res.json();
}
async function sbUpsert(table, rows) {
  if (!rows.length) return;
  let res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...SB_HEADERS, Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify(rows),
  });
  if (!res.ok && res.status === 400) {
    // v2 columns not created yet — retry without them
    const stripped = rows.map(({ price_incl_tax, price_excl_tax, ...r }) => r);
    res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: { ...SB_HEADERS, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(stripped),
    });
  }
  if (!res.ok) throw new Error(`supabase upsert ${table}: ${res.status} ${await res.text()}`);
}
async function sbInsert(table, rows) {
  if (!rows.length) return;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: SB_HEADERS,
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`supabase insert ${table}: ${res.status}`);
}

// ─── Diff & events ───────────────────────────────────────────────────────
function diffOffers(prev, next) {
  const events = [];
  const prevMap = new Map(prev.map((o) => [o.id, o]));
  const nextMap = new Map(next.map((o) => [o.id, o]));
  const now = new Date().toISOString();
  for (const o of next) {
    const p = prevMap.get(o.id);
    const base = { offer_id: o.id, operator: o.operator, offer_name: o.name, detected_at: now };
    if (!p) {
      events.push({ ...base, event_type: 'new_offer', old_value: null, new_value: `JD ${o.monthly_price_jod ?? '?'} / ${o.data_gb ?? '?'}GB` });
      continue;
    }
    if (p.monthly_price_jod !== o.monthly_price_jod)
      events.push({ ...base, event_type: 'price_change', old_value: `JD ${p.monthly_price_jod}`, new_value: `JD ${o.monthly_price_jod}` });
    if (p.data_gb !== o.data_gb)
      events.push({ ...base, event_type: 'data_change', old_value: `${p.data_gb ?? '?'}GB`, new_value: `${o.data_gb ?? '?'}GB` });
    if (!p.promo_label && o.promo_label)
      events.push({ ...base, event_type: 'promo_added', old_value: null, new_value: o.promo_label });
    if (p.promo_label && !o.promo_label)
      events.push({ ...base, event_type: 'promo_removed', old_value: p.promo_label, new_value: null });
  }
  for (const p of prev) {
    if (!nextMap.has(p.id))
      events.push({ offer_id: p.id, operator: p.operator, offer_name: p.name, event_type: 'offer_removed', old_value: `JD ${p.monthly_price_jod ?? '?'}`, new_value: null, detected_at: now });
  }
  return events;
}

// ─── Main ────────────────────────────────────────────────────────────────
export async function runScrape() {
  const report = { orange: 0, umniah: 0, zain: 0, events: 0, zainBlocked: true, errors: [] };

  const prev = await sbGet('atl_offers?select=*');

  const results = await Promise.allSettled([scrapeOrange(), scrapeUmniah()]);
  const orange = results[0].status === 'fulfilled' ? results[0].value : [];
  const umniah = results[1].status === 'fulfilled' ? results[1].value : [];
  results.forEach((r, i) => {
    if (r.status === 'rejected') report.errors.push(`${['orange', 'umniah'][i]}: ${r.reason?.message}`);
  });

  report.orange = orange.length;
  report.umniah = umniah.length;

  // Zain: curated line-up (eshop is an eKYC SPA — no scrapable feed)
  const zainFinal = zainSeed();
  report.zain = zainFinal.length;

  // For operators that returned nothing (site down), keep previous rows
  const prevByOp = (op) => prev.filter((o) => o.operator === op);
  const next = [
    ...(orange.length ? orange : prevByOp('orange')),
    ...(umniah.length ? umniah : prevByOp('umniah')),
    ...zainFinal,
  ];
  if (!next.length) throw new Error('all scrapers returned 0 offers — aborting');
  // dedupe by id (same product can appear on several category pages/probes)
  const deduped = [...new Map(next.map((o) => [o.id, o])).values()];

  const events = diffOffers(prev, deduped);
  await sbUpsert('atl_offers', deduped);
  const keepIds = new Set(deduped.map((o) => o.id));
  const scrapedOps = new Set(['zain', ...(orange.length ? ['orange'] : []), ...(umniah.length ? ['umniah'] : [])]);
  const stale = prev.filter((o) => scrapedOps.has(o.operator) && !keepIds.has(o.id));
  for (const s of stale) {
    await fetch(`${SUPABASE_URL}/rest/v1/atl_offers?id=eq.${encodeURIComponent(s.id)}`, {
      method: 'DELETE',
      headers: SB_HEADERS,
    });
  }
  await sbInsert('atl_offer_events', events);
  report.events = events.length;
  report.eventList = events.slice(0, 10).map((e) => `${e.event_type}: ${e.offer_name}`);
  return report;
}
