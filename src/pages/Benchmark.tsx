import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowUp,
  BadgePercent,
  Bell,
  ExternalLink,
  Globe,
  Info,
  Minus,
  Plus,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import { getAtlLive, type AtlLiveData } from '@/lib/data';
import type { AtlOfferRow, AtlEventRow } from '@/lib/data/supabase';
import { cn } from '@/lib/utils';

type AtlOperator = 'zain' | 'orange' | 'umniah';
const OPS: AtlOperator[] = ['zain', 'orange', 'umniah'];

const OP_META: Record<AtlOperator, { label: string; chip: string; text: string }> = {
  zain: { label: 'Zain', chip: 'bg-zain-soft text-zain border-zain/30', text: 'text-zain' },
  orange: { label: 'Orange', chip: 'bg-orange-soft text-orange border-orange/30', text: 'text-orange' },
  umniah: { label: 'Umniah', chip: 'bg-umniah-soft text-umniah border-umniah/30', text: 'text-umniah' },
};

type LineType = 'prepaid' | 'postpaid' | 'visitors' | 'egypt';
const LINE_TABS: { id: LineType; label: string }[] = [
  { id: 'prepaid', label: 'Prepaid' },
  { id: 'postpaid', label: 'Postpaid' },
  { id: 'visitors', label: 'Visitors' },
  { id: 'egypt', label: 'Egypt lines' },
];

// Canonical price ladder (JOD / month) — same 8 price points for all operators,
// starting from the cheapest. Each offer is mapped to its nearest price point.
const PRICE_POINTS = [1, 3, 5, 7, 9, 11, 13, 15] as const;

function pricePoint(price: number): number {
  for (const p of PRICE_POINTS) {
    if (price < p + 1.5) return p; // 15 catches everything >= 13.5
  }
  return 15;
}

function pointLabel(p: number): string {
  return p === 15 ? 'JD 15+' : `JD ${p}`;
}

function fmtJd(v: number | null | undefined): string {
  if (v == null) return '—';
  return `JD ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)}`;
}

function jdPerGb(o: AtlOfferRow): number | null {
  if (!o.monthly_price_jod || !o.data_gb) return null;
  return o.monthly_price_jod / o.data_gb;
}

const EVENT_META: Record<AtlEventRow['event_type'], { label: string; icon: typeof Plus; cls: string }> = {
  new_offer: { label: 'New offer', icon: Plus, cls: 'bg-teal-50 text-teal-700' },
  offer_removed: { label: 'Offer removed', icon: Minus, cls: 'bg-slate-100 text-slate-600' },
  price_change: { label: 'Price change', icon: ArrowUp, cls: 'bg-amber-50 text-amber-700' },
  data_change: { label: 'Data volume change', icon: ArrowDown, cls: 'bg-amber-50 text-amber-700' },
  promo_added: { label: 'Promo launched', icon: BadgePercent, cls: 'bg-red-50 text-red-600' },
  promo_removed: { label: 'Promo ended', icon: BadgePercent, cls: 'bg-slate-100 text-slate-600' },
};

/** Rich offer card — promo highlighted, prices excl/incl tax, features chips. */
function OfferCard({ o, isBest }: { o: AtlOfferRow; isBest: boolean }) {
  const ratio = jdPerGb(o);
  const inclTax = o.price_incl_tax ?? o.monthly_price_jod;
  const exclTax = o.price_excl_tax;
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border px-3 py-2.5',
        isBest ? 'border-teal-600 bg-teal-50/50 ring-1 ring-teal-600/30' : 'border-slate-200 bg-white',
        o.promo_label && !isBest && 'border-red-200',
      )}
    >
      {/* promo ribbon */}
      {o.promo_label && (
        <div className="absolute right-0 top-0 rounded-bl-lg bg-red-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {o.promo_label}
        </div>
      )}
      <div className="flex items-start justify-between gap-2 pr-10">
        <span className="text-[13px] font-semibold leading-tight text-slate-800">
          {isBest && <Trophy className="mr-1 inline h-3 w-3 text-teal-700" />}
          {o.name}
        </span>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-base font-bold text-slate-900">{fmtJd(inclTax)}</span>
        {o.promo_price_jod != null && o.promo_label && (
          <span className="text-[11px] text-slate-400 line-through">
            {o.promo_detail?.match(/Was (JD [\d.]+)/)?.[1]}
          </span>
        )}
        <span className="text-[10px] text-slate-400">{o.price_note ?? 'incl. tax'}</span>
      </div>
      {exclTax != null && (
        <div className="text-[10px] text-slate-400">excl. tax {fmtJd(exclTax)}</div>
      )}
      <div className="mt-1 flex items-center justify-between text-[11px]">
        <span className="font-semibold text-slate-700">{o.data_gb != null ? `${o.data_gb} GB` : '—'}</span>
        <span className={cn('font-semibold', OP_META[o.operator].text)}>
          {ratio != null ? `${ratio.toFixed(2)} JD/GB` : ''}
        </span>
      </div>
      {o.extras && o.extras.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {o.extras.slice(0, 4).map((f) => (
            <span key={f} className="max-w-full truncate rounded bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200" title={f}>
              {f}
            </span>
          ))}
        </div>
      )}
      {o.promo_detail && !o.promo_price_jod && (
        <div className="mt-1 text-[10px] font-medium text-red-600">{o.promo_detail}</div>
      )}
      <a
        href={o.source_url}
        target="_blank"
        rel="noreferrer"
        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-teal-700 hover:underline"
      >
        <Globe className="h-2.5 w-2.5" /> eShop <ExternalLink className="h-2.5 w-2.5" />
      </a>
    </div>
  );
}

export default function Benchmark() {
  const [tab, setTab] = useState<LineType>('prepaid');
  const [data, setData] = useState<AtlLiveData | null>(null);
  const [scraping, setScraping] = useState(false);
  const [scrapeMsg, setScrapeMsg] = useState<string | null>(null);

  const reload = () => getAtlLive().then(setData).catch(() => setData(null));

  useEffect(() => {
    reload();
  }, []);

  async function refreshNow() {
    setScraping(true);
    setScrapeMsg('Scraping eShops… ~30–60s');
    try {
      // Cloudflare Pages Function first, Netlify function as fallback
      let res = await fetch('/scrape-atl', { method: 'POST' }).catch(() => null);
      if (!res || res.status === 404) {
        res = await fetch('/.netlify/functions/scrape-atl-scheduled', { method: 'POST' });
      }
      const report = await res.json();
      if (!res.ok) throw new Error(report?.error ?? 'scrape failed');
      await reload();
      setScrapeMsg(
        `Done — Orange ${report.orange}, Umniah ${report.umniah}, Zain ${report.zain}${report.zainBlocked ? ' (eShop is a wizard — curated line-up)' : ''}, ${report.events} change(s)`,
      );
    } catch {
      setScrapeMsg('Refresh failed — try again in a moment');
    } finally {
      setScraping(false);
      setTimeout(() => setScrapeMsg(null), 12000);
    }
  }

  const all = useMemo(() => data?.offers ?? [], [data]);
  const events = data?.events ?? [];
  const promos = all.filter((o) => o.promo_label);

  // price-point ladder within the active line-type tab
  const ladder = useMemo(() => {
    const scoped = all.filter((o) => (o.kind as LineType) === tab || (tab === 'prepaid' && o.kind === 'voucher'));
    return PRICE_POINTS.map((point) => {
      const inPoint = scoped.filter(
        (o) => o.monthly_price_jod != null && pricePoint(o.monthly_price_jod) === point,
      );
      const byOp = OPS.map((op) =>
        inPoint
          .filter((o) => o.operator === op)
          .sort((a, c) => (jdPerGb(a) ?? 999) - (jdPerGb(c) ?? 999)),
      );
      const best = inPoint
        .map((o) => ({ id: o.id, r: jdPerGb(o) }))
        .filter((x): x is { id: string; r: number } => x.r != null)
        .sort((a, c) => a.r - c.r)[0]?.id;
      return { point, byOp, best, count: inPoint.length };
    }).filter((row) => row.count > 0);
  }, [all, tab]);

  const tabCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of LINE_TABS) c[t.id] = all.filter((o) => o.kind === t.id || (t.id === 'prepaid' && o.kind === 'voucher')).length;
    return c;
  }, [all]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 lg:text-2xl">ATL Benchmark — B2C Mobile</h1>
          <p className="mt-1 text-sm text-slate-500">
            Consumer mobile offers by line type &amp; price point · scraped daily at 12:00 from operator eShops.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshNow}
            disabled={scraping}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors',
              scraping ? 'cursor-wait bg-teal-700/60' : 'bg-teal-700 hover:bg-teal-800',
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', scraping && 'animate-spin')} />
            {scraping ? 'Scraping…' : 'Refresh now'}
          </button>
          {data?.live ? (
            <div className="hidden items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs text-teal-800 sm:flex">
              <span className="h-2 w-2 rounded-full bg-success" />
              Live — {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : ''}
            </div>
          ) : (
            <div className="hidden items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:flex">
              <Info className="h-3.5 w-3.5 shrink-0" /> Manual snapshot
            </div>
          )}
        </div>
      </div>
      {scrapeMsg && <div className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600">{scrapeMsg}</div>}

      {/* Recent changes */}
      {events.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Bell className="h-4 w-4 text-teal-700" /> Recent changes detected by the scraper
          </h2>
          <div className="space-y-1.5">
            {events.slice(0, 6).map((e) => {
              const m = EVENT_META[e.event_type] ?? EVENT_META.new_offer;
              const Icon = m.icon;
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                  <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', m.cls)}>
                    <Icon className="h-3 w-3" /> {m.label}
                  </span>
                  <span className="truncate text-sm font-medium text-slate-800">{e.offer_name}</span>
                  <span className="hidden text-xs capitalize text-slate-400 sm:inline">{e.operator}</span>
                  {(e.old_value || e.new_value) && (
                    <span className="ml-auto shrink-0 text-xs text-slate-500">
                      {e.old_value && <span className="line-through">{e.old_value}</span>}
                      {e.old_value && e.new_value && ' → '}
                      {e.new_value && <b className="text-slate-800">{e.new_value}</b>}
                    </span>
                  )}
                  <span className="shrink-0 text-[11px] text-slate-400">{new Date(e.detected_at).toLocaleDateString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Live promotions — highlighted */}
      {promos.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <BadgePercent className="h-4 w-4 text-red-600" /> Live promotions
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {promos.map((o) => {
              const meta = OP_META[o.operator];
              return (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-xl border border-red-200 bg-gradient-to-br from-red-50/60 to-white p-4"
                >
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                    {o.promo_label}
                  </div>
                  <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium', meta.chip)}>
                    <img src={`${import.meta.env.BASE_URL}logos/${o.operator}.png`} alt="" className="h-3.5 w-3.5 rounded object-contain" />
                    {meta.label}
                  </span>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{o.name}</div>
                  <div className="mt-0.5 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-red-700">{fmtJd(o.monthly_price_jod)}</span>
                    {o.promo_detail?.match(/Was (?:JOD|JD) ([\d.]+)/) && (
                      <span className="text-xs text-slate-400 line-through">
                        JD {o.promo_detail.match(/Was (?:JOD|JD) ([\d.]+)/)?.[1]}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{o.promo_detail}</p>
                  {o.promo_ends_note && <div className="mt-2 text-[11px] text-slate-400">{o.promo_ends_note}</div>}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Line-type tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-px">
        {LINE_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-teal-700 bg-teal-50/50 text-teal-800'
                : 'border-transparent text-slate-500 hover:text-slate-700',
            )}
          >
            {t.label}
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              {tabCounts[t.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Price-point ladder for the active tab */}
      <div className="space-y-4">
        <div className="hidden lg:grid lg:grid-cols-[110px_repeat(3,1fr)] lg:gap-3">
          <div />
          {OPS.map((op) => (
            <div key={op} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <img src={`${import.meta.env.BASE_URL}logos/${op}.png`} alt={OP_META[op].label} className="h-5 w-5 rounded object-contain" />
              <span className="text-sm font-semibold text-slate-900">{OP_META[op].label}</span>
            </div>
          ))}
        </div>

        {ladder.map((row) => (
          <div key={row.point} className="grid grid-cols-1 gap-3 lg:grid-cols-[110px_repeat(3,1fr)]">
            <div className="flex items-center lg:items-start lg:pt-2">
              <div>
                <div className="text-[13px] font-bold text-slate-900">{pointLabel(row.point)}</div>
                <div className="text-[11px] text-slate-400">{row.count} offer(s)</div>
              </div>
            </div>
            {OPS.map((op, i) => (
              <div key={op} className="space-y-1.5">
                <div className="flex items-center gap-1.5 lg:hidden">
                  <img src={`${import.meta.env.BASE_URL}logos/${op}.png`} alt="" className="h-4 w-4 rounded object-contain" />
                  <span className={cn('text-xs font-semibold', OP_META[op].text)}>{OP_META[op].label}</span>
                </div>
                {row.byOp[i].length ? (
                  row.byOp[i].map((o) => <OfferCard key={o.id} o={o} isBest={o.id === row.best} />)
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-center text-[11px] text-slate-300">
                    no offer at this price
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {ladder.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
            No offers in this line type yet — the next scrape will populate it.
          </div>
        )}
      </div>

      {/* Methodology */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Globe className="h-4 w-4 text-teal-700" /> How to read this benchmark
        </h3>
        <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-500">
          <li>• <b>B2C mobile only</b>, split by line type: Prepaid / Postpaid / Visitors / Egypt lines.</li>
          <li>• Same <b>8 price points</b> for the 3 operators (JD 1 → 15+), cheapest first; each offer maps to its nearest price point, sorted by <b>JD/GB</b> — the trophy marks the band's best value.</li>
          <li>• Prices shown <b>incl. tax</b> as displayed on the eShop, with <b>excl. tax</b> underneath when published (Zain publishes excl. tax).</li>
          <li>• <b>Promos</b> are highlighted in red with the strikethrough reference price; features/add-ons (5G, carryover, minutes…) appear as chips on each card.</li>
          <li>• The scraper runs <b>daily at 12:00</b> (+ Refresh now button) on eshop.orange.jo, eshop.umniah.com and jo.zain.com, and logs every change in the feed above.</li>
          <li>• Zain's eShop is an eKYC wizard with no public feed — its line-up is maintained from jo.zain.com published pages and refreshed manually when it changes.</li>
        </ul>
      </div>
    </div>
  );
}
