// Data layer for Competitor Pulse.
// Messages & message-based KPIs read LIVE from Supabase (public.sms_raw).
// Offers / Campaigns / Insights / Timeline / SIMs still read from the bundled
// example dataset (mock/) until the AI extraction step is wired up.
// The rest of the app never imports from mock/ directly, only from this module.

import type {
  SmsRaw,
  SimProfile,
  Offer,
  Campaign,
  Insight,
  TimelineEvent,
  MessageFilters,
  OfferFilters,
  Kpis,
  CvmPattern,
  DetectionRule,
  SimSegment,
  PatternType,
  Operator,
  DeviceHealth,
  CareTask,
  UssdSession,
} from './types';
import { fetchSmsRaw, fetchAtlOffers, fetchAtlEvents, type SmsRawRow, type AtlOfferRow, type AtlEventRow } from './supabase';
import { atlOffers as atlOffersMock, ATL_AS_OF } from './mock/atlOffers';
import { smsMessages } from './mock/sms';
import { sims } from './mock/sims';
import { offers } from './mock/offers';
import { campaigns } from './mock/campaigns';
import { insights } from './mock/insights';
import { timeline } from './mock/timeline';
import { cvmPatterns, detectionRules } from './mock/patterns';
import { ussdSessions } from './mock/ussd';

export * from './types';
export { SUPABASE_URL } from './supabase';

/**
 * 'live' = Messages & Overview read from Supabase; other pages still show
 * example data (they carry an "Example data" pill).
 */
export const DATA_SOURCE: 'mock' | 'live' = 'live';

/* ---------------------------------------------------------------------------
 * Offline-fallback flag: set when a Supabase fetch fails so the UI can show
 * "offline — example data". Subscribable so React components stay in sync.
 * ------------------------------------------------------------------------- */
export type DataStatus = 'live' | 'fallback';

let dataStatus: DataStatus = 'live';
const statusListeners = new Set<() => void>();

function setDataStatus(next: DataStatus) {
  if (dataStatus === next) return;
  dataStatus = next;
  statusListeners.forEach((cb) => cb());
}

export function getDataStatus(): DataStatus {
  return dataStatus;
}

/** useSyncExternalStore-compatible subscribe. */
export function subscribeDataStatus(cb: () => void): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

/* ---------------------------------------------------------------------------
 * Operator inference from sender IDs / SIM slots.
 * Real sender values are operator IDs ("ZainJo", "Orange", "Umniah") or phone
 * numbers; unknown senders map to 'unknown'.
 * ------------------------------------------------------------------------- */
export type OperatorId = 'zain' | 'orange' | 'umniah';

export function operatorFromSender(sender: string): OperatorId | 'unknown' {
  const s = sender.toLowerCase();
  if (s.includes('zain')) return 'zain';
  if (s.includes('orange')) return 'orange';
  if (s.includes('umniah')) return 'umniah';
  return 'unknown';
}

/* ---------------------------------------------------------------------------
 * Live SMS fetching with a short in-memory cache + graceful mock fallback.
 * ------------------------------------------------------------------------- */
const DAY = 86400_000;
const CACHE_TTL = 30_000;

let cache: { at: number; rows: SmsRaw[] } | null = null;

function toIso(epochMs: string): string {
  const t = Number(epochMs);
  return Number.isFinite(t) ? new Date(t).toISOString() : epochMs;
}

/** Convert a raw Supabase row into the SmsRaw shape the UI expects. */
function rowToSms(row: SmsRawRow): SmsRaw {
  return {
    id: String(row.id),
    sender: row.sender ?? '',
    body: row.body ?? '',
    sent_stamp: toIso(row.sent_stamp),
    received_stamp: toIso(row.received_stamp),
    // sim_slot may be "1" or "sim1" depending on the forwarding app
    sim_slot: Number.parseInt(String(row.sim_slot).replace(/\D/g, ''), 10) || 0,
    device: row.device ?? '',
    inserted_at: row.inserted_at ?? '',
    battery_pct: row.battery_pct ?? null,
    charging: row.charging ?? null,
    network: row.network ?? null,
  };
}

/**
 * Get all messages: live from Supabase when reachable, mock as fallback.
 * Never throws — on failure it flags fallback mode and returns example data.
 */
async function getAllMessages(): Promise<SmsRaw[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL) return cache.rows;
  try {
    const rows = (await fetchSmsRaw()).map(rowToSms);
    cache = { at: Date.now(), rows };
    setDataStatus('live');
    return rows;
  } catch (err) {
    console.warn('[data] Supabase unreachable — falling back to example messages.', err);
    setDataStatus('fallback');
    return [...smsMessages];
  }
}

function matchesKeyword(haystack: string, keyword?: string) {
  return !keyword || haystack.toLowerCase().includes(keyword.toLowerCase());
}

export async function getMessages(filters: MessageFilters = {}): Promise<SmsRaw[]> {
  let rows = await getAllMessages();
  if (filters.operators?.length) {
    const wanted = filters.operators;
    rows = rows.filter((m) => {
      const op = operatorFromSender(m.sender);
      return op !== 'unknown' && wanted.includes(op);
    });
  }
  if (filters.simSlot) rows = rows.filter((m) => m.sim_slot === filters.simSlot);
  if (filters.from) rows = rows.filter((m) => m.received_stamp >= filters.from!);
  if (filters.to) rows = rows.filter((m) => m.received_stamp <= filters.to!);
  if (filters.keyword) rows = rows.filter((m) => matchesKeyword(m.body, filters.keyword));
  return rows;
}

export async function getUssdSessions(): Promise<UssdSession[]> {
  // TODO(supabase): replace with supabase.from('ussd_logs').select('*')
  // once device-side USSD automation is connected.
  return [...ussdSessions].sort((a, b) => b.captured_at.localeCompare(a.captured_at));
}

// ─── ATL Benchmark (daily eShop scraping) ────────────────────────────────

export interface AtlLiveData {
  offers: AtlOfferRow[];
  events: AtlEventRow[];
  live: boolean; // true = from Supabase scraper, false = manual snapshot fallback
  updatedAt: string | null; // latest scraped_at
}

export async function getAtlLive(): Promise<AtlLiveData> {
  try {
    const [offers, events] = await Promise.all([fetchAtlOffers(), fetchAtlEvents()]);
    if (!offers.length) throw new Error('empty atl_offers');
    const updatedAt = offers.map((o) => o.scraped_at).sort().pop() ?? null;
    return { offers, events, live: true, updatedAt };
  } catch {
    // Fallback: manual snapshot until scraper has run / tables exist.
    const offers: AtlOfferRow[] = atlOffersMock.map((o) => ({
      id: o.id,
      operator: o.operator,
      name: o.name,
      kind: o.kind,
      monthly_price_jod: o.monthlyPriceJod,
      price_note: o.priceNote ?? null,
      data_gb: o.dataGb,
      validity_days: o.validityDays,
      calls: o.calls ?? null,
      extras: o.extras ?? [],
      promo_label: o.promo?.label ?? null,
      promo_detail: o.promo?.detail ?? null,
      promo_price_jod: o.promo?.promoPriceJod ?? null,
      promo_ends_note: o.promo?.endsNote ?? null,
      source_url: o.sourceUrl,
      scraped_at: ATL_AS_OF,
    }));
    return { offers, events: [], live: false, updatedAt: ATL_AS_OF };
  }
}

export async function getOffers(filters: OfferFilters = {}): Promise<Offer[]> {
  // TODO(supabase): replace with supabase.from('offers').select('*') after AI extraction
  let rows = [...offers];
  if (filters.operators?.length) rows = rows.filter((o) => filters.operators!.includes(o.operator));
  if (filters.segment) rows = rows.filter((o) => o.segment === filters.segment);
  if (filters.status) rows = rows.filter((o) => o.status === filters.status);
  if (filters.keyword) rows = rows.filter((o) => matchesKeyword(o.title, filters.keyword));
  return rows.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

export async function getCampaigns(): Promise<Campaign[]> {
  // TODO(supabase): replace with supabase.from('campaigns').select('*') after AI extraction
  return [...campaigns].sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
}

/**
 * Lifecycle is DERIVED from the last recharge date — never entered by hand.
 * All market offers are 30-day cycles:
 *   day 0-30  after recharge → V1 (active, in-cycle)
 *   day 30-35 without recharge → V2 (grace)
 *   day 35+  → V3 (winback)
 * A late recharge naturally moves a SIM V1 → V2 → back to V1.
 * PAYG SIMs have no cycle and stay 'payg' regardless.
 */
export const CYCLE_DAYS = 30;
export const GRACE_DAYS = 5;

export function computeSegment(s: SimProfile, nowMs = Date.now()): SimSegment {
  if (s.segment === 'payg') return 'payg';
  if (!s.lastRecharge) return s.segment; // no recharge info: keep declared profile
  const days = (nowMs - new Date(s.lastRecharge).getTime()) / DAY;
  if (days <= CYCLE_DAYS) return 'v1_active';
  if (days <= CYCLE_DAYS + GRACE_DAYS) return 'v2_grace';
  return 'v3_winback';
}

/** Bundle expiry derived from the recharge: recharge + 30 days. */
export function computeBundleExpiry(s: SimProfile): string | null {
  if (s.segment === 'payg') return null;
  if (s.lastRecharge) return new Date(new Date(s.lastRecharge).getTime() + CYCLE_DAYS * DAY).toISOString();
  return s.bundleExpiresAt;
}

/** Day number within/after the 30-day cycle (for display: "day 22 of 30", "day 36 → V3"). */
export function cycleDay(s: SimProfile, nowMs = Date.now()): number | null {
  if (!s.lastRecharge) return null;
  return Math.floor((nowMs - new Date(s.lastRecharge).getTime()) / DAY);
}

export async function getSims(): Promise<SimProfile[]> {
  // TODO(supabase): replace with supabase.from('sim_profiles').select('*')
  // Segment and expiry are always derived from lastRecharge, never stored stale.
  return sims.map((s) => ({
    ...s,
    segment: computeSegment(s),
    bundleExpiresAt: computeBundleExpiry(s),
  }));
}

/**
 * Target SIM portfolio mix — the nominal panel you want to maintain so every
 * lifecycle stage keeps receiving its specific BTL pressure. If a SIM drifts
 * out of its stage (forgotten recharge), the care engine proposes the cheapest
 * corrective action to restore the balance.
 */
export const TARGET_MIX: Record<SimSegment, number> = {
  v1_active: 2,
  v2_grace: 1,
  v3_winback: 1,
  payg: 1,
};

export interface PortfolioBalance {
  segment: SimSegment;
  target: number;
  actual: number;
  deficit: number;
}

export async function getPortfolioBalance(): Promise<PortfolioBalance[]> {
  const list = await getSims();
  const actual = { v1_active: 0, v2_grace: 0, v3_winback: 0, payg: 0 } as Record<SimSegment, number>;
  for (const s of list) actual[s.segment]++;
  return (Object.keys(TARGET_MIX) as SimSegment[]).map((segment) => ({
    segment,
    target: TARGET_MIX[segment],
    actual: actual[segment],
    deficit: Math.max(0, TARGET_MIX[segment] - actual[segment]),
  }));
}

export async function getInsights(): Promise<Insight[]> {
  // TODO(supabase): replace with supabase.from('insights').select('*') after AI extraction
  return [...insights].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getTimeline(): Promise<TimelineEvent[]> {
  // TODO(supabase): replace with supabase.from('timeline_events').select('*') after AI extraction
  return [...timeline];
}

/* ---------------------------------------------------------------------------
 * Segments & CVM pattern detection (v2)
 * ------------------------------------------------------------------------- */

export const SEGMENT_META: Record<
  SimSegment,
  { label: string; short: string; description: string }
> = {
  v1_active: {
    label: 'V1 · Active',
    short: 'Inside the 30-day cycle',
    description:
      'Recharges and renews normally within the 30-day offer cycle. The baseline customer — reveals stimulation cadence, retention timing (pre-expiry pings) and standard offer terms.',
  },
  v2_grace: {
    label: 'V2 · Grace',
    short: 'Cycle ended, 5+ days without recharge',
    description:
      'The 30-day bundle expired and 5+ days passed with no recharge. The at-risk zone where operators push stimulation and soft-save offers.',
  },
  v3_winback: {
    label: 'V3 · Winback',
    short: 'Deep inactivity beyond grace',
    description:
      'Well past the grace window. Pure winback territory — reveals how long operators wait before spending real money to win a customer back, and how much they offer.',
  },
  payg: {
    label: 'PAYG',
    short: 'Pay As You Consume — no bundle',
    description:
      'No 30-day bundle at all: pure per-use consumption. Reveals how operators court usage-based customers and try to convert them to bundles.',
  },
};

export function getDetectionRules(): DetectionRule[] {
  // TODO(supabase): static reference table `detection_rules`
  return [...detectionRules];
}

export async function getCvmPatterns(
  filters: { operators?: Operator[]; types?: PatternType[]; segments?: SimSegment[]; status?: CvmPattern['status'] } = {},
): Promise<CvmPattern[]> {
  // TODO(supabase): replace with supabase.from('cvm_patterns').select('*') once the
  // scheduled detection job writes real detections
  let rows = [...cvmPatterns];
  if (filters.operators?.length) rows = rows.filter((p) => filters.operators!.includes(p.operator));
  if (filters.types?.length) rows = rows.filter((p) => filters.types!.includes(p.type));
  if (filters.segments?.length) rows = rows.filter((p) => filters.segments!.includes(p.segment));
  if (filters.status) rows = rows.filter((p) => p.status === filters.status);
  return rows.sort((a, b) => b.lastDetected.localeCompare(a.lastDetected));
}

/* ---------------------------------------------------------------------------
 * Device health & SIM care tasks (v2)
 * ------------------------------------------------------------------------- */

/**
 * Latest known health per device, derived from the newest message that carries
 * the %battery% / %power% / %network% placeholders.
 * TODO(supabase): could be a view over sms_raw once battery/network columns land.
 */
export async function getDeviceHealth(): Promise<DeviceHealth[]> {
  const messages = await getAllMessages();
  const byDevice = new Map<string, DeviceHealth>();
  for (const s of sims) {
    if (!byDevice.has(s.device)) {
      byDevice.set(s.device, {
        device: s.device,
        label: s.device,
        sims: [],
        batteryPct: null,
        charging: null,
        network: null,
        lastSeen: s.last_ping,
      });
    }
    byDevice.get(s.device)!.sims.push(s.sim_slot);
  }
  const sorted = [...messages].sort((a, b) => b.received_stamp.localeCompare(a.received_stamp));
  for (const m of sorted) {
    const d = byDevice.get(m.device);
    if (!d) continue;
    if (m.received_stamp > d.lastSeen) d.lastSeen = m.received_stamp;
    if (d.batteryPct == null && m.battery_pct != null) d.batteryPct = m.battery_pct;
    if (d.charging == null && m.charging != null) d.charging = m.charging;
    if (d.network == null && m.network) d.network = m.network;
  }
  // Sensible demo defaults when real telemetry has not arrived yet
  for (const d of byDevice.values()) {
    if (d.batteryPct == null) d.batteryPct = 78;
    if (d.charging == null) d.charging = false;
    if (d.network == null) d.network = '4G';
  }
  return [...byDevice.values()];
}

const DAY_MS = 86400_000;
const KEEPALIVE_DAYS = 55; // recharge a dormant SIM before ~day 60 to keep the line alive

/**
 * Compute the SIM-care to-do list from the lifecycle state of every SIM plus
 * device health. This is the "make the SIMs stay alive" engine.
 * Segments and expiries are DERIVED from lastRecharge (30-day cycle + 5-day grace).
 */
export async function getCareTasks(): Promise<CareTask[]> {
  const tasks: CareTask[] = [];
  const now = Date.now();

  // --- Portfolio rebalance pass (runs first): restore the target V1/V2/V3 mix ---
  const derived = sims.map((s) => ({
    s,
    segment: computeSegment(s, now),
    lastRe: s.lastRecharge ? new Date(s.lastRecharge).getTime() : null,
    expiryMs: (() => {
      const e = computeBundleExpiry(s);
      return e ? new Date(e).getTime() : null;
    })(),
  }));
  const count = (seg: SimSegment) => derived.filter((d) => d.segment === seg).length;
  const suppressRenew = new Set<string>(); // V1 SIMs we deliberately let lapse into V2

  const v1Deficit = TARGET_MIX.v1_active - count('v1_active');
  if (v1Deficit > 0) {
    // Cheapest rescue: the freshest V2 SIMs (smallest time out of cycle).
    const candidates = derived
      .filter((d) => d.segment === 'v2_grace' && d.lastRe != null)
      .sort((a, b) => (b.lastRe ?? 0) - (a.lastRe ?? 0));
    for (const d of candidates.slice(0, v1Deficit)) {
      tasks.push({
        id: `rebalance-v1-${d.s.id}`,
        type: 'rebalance',
        simId: d.s.id,
        simLabel: d.s.label,
        operator: d.s.operator,
        device: d.s.device,
        title: `Rebalance: recharge ${d.s.rechargeAmountJod} JD on ${d.s.phone_masked} to restore V1 pool`,
        detail: `V1 pool is below target (${count('v1_active')}/${TARGET_MIX.v1_active}). This SIM just left its cycle — a recharge now brings it straight back to V1.`,
        dueAt: new Date(now + DAY_MS).toISOString(),
        severity: 'due_soon',
      });
    }
  }

  const v2Deficit = TARGET_MIX.v2_grace - count('v2_grace');
  if (v2Deficit > 0) {
    // Let the V1 SIM closest to expiry lapse into grace — skip its renewal.
    const candidates = derived
      .filter((d) => d.segment === 'v1_active' && d.expiryMs != null)
      .sort((a, b) => (a.expiryMs ?? 0) - (b.expiryMs ?? 0));
    for (const d of candidates.slice(0, v2Deficit)) {
      suppressRenew.add(d.s.id);
      tasks.push({
        id: `rebalance-v2-${d.s.id}`,
        type: 'rebalance',
        simId: d.s.id,
        simLabel: d.s.label,
        operator: d.s.operator,
        device: d.s.device,
        title: `Rebalance: let ${d.s.phone_masked} lapse into V2 (skip the ${d.s.currentBundle ?? 'bundle'} renewal)`,
        detail: `V2 pool is below target (${count('v2_grace')}/${TARGET_MIX.v2_grace}). This is your most advanced V1 — skipping this renewal refills V2 at zero cost. If you'd rather keep it in V1, recharge another V1 instead and let this one renew normally.`,
        dueAt: d.expiryMs ? new Date(d.expiryMs - DAY_MS).toISOString() : new Date(now).toISOString(),
        severity: 'due_soon',
      });
    }
  }

  const v3Deficit = TARGET_MIX.v3_winback - count('v3_winback');
  if (v3Deficit > 0) {
    // Let the oldest V2 slide into winback territory.
    const candidates = derived
      .filter((d) => d.segment === 'v2_grace' && d.lastRe != null)
      .sort((a, b) => (a.lastRe ?? 0) - (b.lastRe ?? 0));
    for (const d of candidates.slice(0, v3Deficit)) {
      tasks.push({
        id: `rebalance-v3-${d.s.id}`,
        type: 'rebalance',
        simId: d.s.id,
        simLabel: d.s.label,
        operator: d.s.operator,
        device: d.s.device,
        title: `Rebalance: let ${d.s.phone_masked} slide to V3 (no recharge)`,
        detail: `V3 pool is below target (${count('v3_winback')}/${TARGET_MIX.v3_winback}). This SIM is your oldest grace-profile line — leaving it unrecharged past day ${CYCLE_DAYS + GRACE_DAYS} refills the winback pool.`,
        dueAt: d.lastRe ? new Date(d.lastRe + (CYCLE_DAYS + GRACE_DAYS) * DAY_MS).toISOString() : new Date(now).toISOString(),
        severity: 'scheduled',
      });
    }
  }

  for (const s of sims) {
    const base = { simId: s.id, simLabel: s.label, operator: s.operator, device: s.device };
    const segment = computeSegment(s, now);
    const expiryIso = computeBundleExpiry(s);
    const expiry = expiryIso ? new Date(expiryIso).getTime() : null;
    const lastRe = s.lastRecharge ? new Date(s.lastRecharge).getTime() : null;

    if (segment === 'v1_active' && expiry != null) {
      const daysLeft = Math.round((expiry - now) / DAY_MS);
      tasks.push({
        id: `renew-${s.id}`,
        type: 'renew_bundle',
        ...base,
        title: `Renew ${s.currentBundle} on ${s.phone_masked} (${s.device})`,
        detail: `30-day cycle ends ${daysLeft <= 0 ? 'today' : `in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`}. Renew with a ${s.rechargeAmountJod} JD recharge so the SIM stays in V1 and keeps receiving in-cycle offers.`,
        dueAt: new Date(expiry - DAY_MS).toISOString(),
        severity: daysLeft <= 1 ? 'overdue' : daysLeft <= 3 ? 'due_soon' : 'scheduled',
      });
    }

    if (segment === 'v2_grace' && expiry != null) {
      const daysOver = Math.round((now - expiry) / DAY_MS);
      tasks.push({
        id: `grace-${s.id}`,
        type: 'recharge',
        ...base,
        title: `Decide: keep ${s.phone_masked} in V2 or recharge ${s.rechargeAmountJod} JD`,
        detail: `Bundle ended ${daysOver} days ago (grace window = 5 days). Every extra day in V2 sharpens the winback data — but past ~day 25 the line risks slipping to a harsher pool. Your call, deliberately.`,
        dueAt: new Date(expiry + 20 * DAY_MS).toISOString(),
        severity: daysOver > 20 ? 'due_soon' : 'scheduled',
      });
    }

    if (segment === 'v3_winback' && lastRe != null) {
      const silentDays = Math.round((now - lastRe) / DAY_MS);
      const keepaliveDue = new Date(lastRe + KEEPALIVE_DAYS * DAY_MS);
      tasks.push({
        id: `keepalive-${s.id}`,
        type: 'keep_alive',
        ...base,
        title: `Keep-alive recharge (1 JD) for ${s.phone_masked}`,
        detail: `${silentDays} days without recharge. Beyond ~60 days operators may recycle the number — a 1 JD recharge resets the clock without breaking the dormant profile.`,
        dueAt: keepaliveDue.toISOString(),
        severity: now > keepaliveDue.getTime() ? 'overdue' : silentDays > KEEPALIVE_DAYS - 10 ? 'due_soon' : 'scheduled',
      });
    }

    if (segment === 'payg' && lastRe != null) {
      const daysSince = Math.round((now - lastRe) / DAY_MS);
      tasks.push({
        id: `payg-${s.id}`,
        type: 'recharge',
        ...base,
        title: `Top up ${s.rechargeAmountJod} JD on PAYG SIM ${s.phone_masked} (${s.device})`,
        detail: `Pay As You Consume profile — a small top-up every ~7 days keeps consumption visible to the operator's CVM. Last top-up ${daysSince} days ago.`,
        dueAt: new Date(lastRe + 7 * DAY_MS).toISOString(),
        severity: daysSince > 9 ? 'overdue' : daysSince > 6 ? 'due_soon' : 'scheduled',
      });
    }
  }

  // Device-level tasks
  const devices = await getDeviceHealth();
  for (const d of devices) {
    if (d.batteryPct != null && d.batteryPct < 25 && !d.charging) {
      tasks.push({
        id: `battery-${d.device}`,
        type: 'device_battery',
        device: d.device,
        title: `Charge ${d.label} — battery at ${d.batteryPct}%`,
        detail: 'A dead phone silently stops capturing SMS. Plug it in.',
        dueAt: new Date().toISOString(),
        severity: 'overdue',
      });
    }
    const offlineH = (now - new Date(d.lastSeen).getTime()) / 3600_000;
    if (offlineH > 24) {
      tasks.push({
        id: `offline-${d.device}`,
        type: 'device_offline',
        device: d.device,
        title: `${d.label} has been silent for ${Math.round(offlineH)} h`,
        detail: 'No message forwarded in 24 h. Check battery-optimisation settings, network signal, and that the forwarder app is still running.',
        dueAt: new Date().toISOString(),
        severity: offlineH > 48 ? 'overdue' : 'due_soon',
      });
    }
  }

  const rank = { overdue: 0, due_soon: 1, scheduled: 2 } as const;
  return tasks.sort((a, b) => rank[a.severity] - rank[b.severity] || a.dueAt.localeCompare(b.dueAt));
}

/**
 * Count of care tasks needing action now or in the next couple of days
 * (overdue + due_soon) — drives the red alert badge on the SIM Care nav item.
 */
export async function getUrgentCareCount(): Promise<number> {
  const tasks = await getCareTasks();
  return tasks.filter((t) => t.severity === 'overdue' || t.severity === 'due_soon').length;
}

export async function getKpis(): Promise<Kpis> {
  // Message-based KPIs come from live SMS; offer/campaign/SIM numbers still come
  // from the example dataset until the AI extraction step is set up.
  const messages = await getAllMessages();
  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const twoWeeksAgo = now - 14 * DAY;
  const thisWeek = messages.filter((m) => new Date(m.received_stamp).getTime() >= weekAgo);
  const prevWeek = messages.filter((m) => {
    const t = new Date(m.received_stamp).getTime();
    return t >= twoWeeksAgo && t < weekAgo;
  });
  const dailyCounts = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(now - (6 - i) * DAY);
    const key = dayStart.toISOString().slice(0, 10);
    const count = messages.filter((m) => m.received_stamp.slice(0, 10) === key).length;
    return { date: key, count };
  });
  const activeOffers = offers.filter((o) => o.status === 'active');
  const newOffers = activeOffers.filter((o) => new Date(o.firstSeen).getTime() >= twoWeeksAgo);
  const lastPing = sims.reduce((a, s) => (s.last_ping > a ? s.last_ping : a), sims[0].last_ping);
  return {
    messagesThisWeek: thisWeek.length,
    messagesPrevWeek: prevWeek.length,
    messagesDeltaPct: prevWeek.length
      ? Math.round(((thisWeek.length - prevWeek.length) / prevWeek.length) * 100)
      : 0,
    dailyCounts,
    activeOffers: activeOffers.length,
    newOffers: newOffers.length,
    activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
    endedCampaigns: campaigns.filter((c) => c.status === 'ended').length,
    simsOnline: sims.filter((s) => s.status === 'active').length,
    simsTotal: sims.length,
    lastPing: lastPing,
    activePatterns: cvmPatterns.filter((p) => p.status !== 'ended').length,
  };
}

/** Daily per-operator message counts for the last N days (for stacked bar chart). */
export async function getDailyOperatorCounts(days = 21) {
  const messages = await getAllMessages();
  const now = Date.now();
  const rows = Array.from({ length: days }, (_, i) => {
    const key = new Date(now - (days - 1 - i) * DAY).toISOString().slice(0, 10);
    const row: { date: string; zain: number; orange: number; umniah: number } = {
      date: key,
      zain: 0,
      orange: 0,
      umniah: 0,
    };
    for (const m of messages) {
      if (m.received_stamp.slice(0, 10) !== key) continue;
      const op = operatorFromSender(m.sender);
      if (op !== 'unknown') row[op]++;
    }
    return row;
  });

  // Demo fallback: while the SIM farm has captured almost no real traffic yet,
  // fill the chart with a plausible synthetic rhythm so the UI is reviewable.
  // Deterministic (no Math.random) so the shape is stable between reloads.
  const realTotal = rows.reduce((n, r) => n + r.zain + r.orange + r.umniah, 0);
  if (realTotal >= 10) return rows;

  return rows.map((r, i) => {
    const wave = Math.sin(i / 3.1); // slow campaign-wave rhythm
    const zain = Math.max(0, Math.round(1.4 + 1.6 * wave + ((i * 7) % 5 === 0 ? 1.2 : 0)));
    const orange = Math.max(0, Math.round(1.1 + 1.2 * Math.sin(i / 2.3 + 1.4) + ((i * 3) % 7 === 0 ? 1.5 : 0)));
    const umniah = Math.max(0, Math.round(0.9 + 0.9 * Math.sin(i / 2.7 + 2.6) + ((i * 5) % 9 === 0 ? 1.3 : 0)));
    return {
      date: r.date,
      zain: r.zain + zain,
      orange: r.orange + orange,
      umniah: r.umniah + umniah,
    };
  });
}
