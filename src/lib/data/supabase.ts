// Supabase REST (PostgREST) client for Competitor Pulse — plain fetch, no SDK.
// TODO(auth): the anon key below is embedded for the MVP. RLS on `sms_raw` currently
// allows anon SELECT/INSERT. Once per-device auth is added, replace this key with a
// per-user/per-device session token (supabase-js auth or signed JWT) and tighten RLS.

export const SUPABASE_URL = 'https://idxnflkmvdsaaysnajvp.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkeG5mbGttdmRzYWF5c25hanZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDk5NTUsImV4cCI6MjEwNjE4NTk1NX0.Boq9sorbkhALZ4_E8iJUTxGhRKjmJIDTLV_26qT7QLE';

const SMS_RAW_ENDPOINT = `${SUPABASE_URL}/rest/v1/sms_raw`;

/** Raw row shape as stored in public.sms_raw (stamps are epoch-ms strings). */
export interface SmsRawRow {
  id: number;
  sender: string;
  body: string;
  sent_stamp: string; // epoch ms as string
  received_stamp: string; // epoch ms as string
  sim_slot: string; // e.g. "1"
  device: string;
  inserted_at: string; // timestamptz ISO
  dedup_key: string;
  battery_pct?: number | null; // %battery% — added in v2 (nullable)
  charging?: boolean | null; // %power%
  network?: string | null; // %network%
}

/** Row shape for public.atl_offers (daily eShop scraper output). */
export interface AtlOfferRow {
  id: string; // stable key: operator + slug
  operator: 'zain' | 'orange' | 'umniah';
  name: string;
  kind: 'prepaid' | 'postpaid' | 'voucher';
  monthly_price_jod: number | null;
  price_incl_tax?: number | null;
  price_excl_tax?: number | null;
  price_note: string | null;
  data_gb: number | null;
  validity_days: number | null;
  calls: string | null;
  extras: string[];
  promo_label: string | null;
  promo_detail: string | null;
  promo_price_jod: number | null;
  promo_ends_note: string | null;
  source_url: string;
  scraped_at: string;
}

/** Row shape for public.atl_offer_events (scraper change detection). */
export interface AtlEventRow {
  id: number;
  offer_id: string;
  operator: string;
  offer_name: string;
  event_type: 'new_offer' | 'offer_removed' | 'price_change' | 'data_change' | 'promo_added' | 'promo_removed';
  old_value: string | null;
  new_value: string | null;
  detected_at: string;
}

const ATL_HEADERS = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
};

/** Fetch current ATL offer snapshot from public.atl_offers. Throws on error. */
export async function fetchAtlOffers(): Promise<AtlOfferRow[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/atl_offers?select=*&order=operator,name`, {
    headers: ATL_HEADERS,
  });
  if (!res.ok) throw new Error(`atl_offers fetch failed: ${res.status}`);
  return (await res.json()) as AtlOfferRow[];
}

/** Fetch recent change events from public.atl_offer_events. Throws on error. */
export async function fetchAtlEvents(limit = 30): Promise<AtlEventRow[]> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/atl_offer_events?select=*&order=detected_at.desc&limit=${limit}`,
    { headers: ATL_HEADERS },
  );
  if (!res.ok) throw new Error(`atl_offer_events fetch failed: ${res.status}`);
  return (await res.json()) as AtlEventRow[];
}

/** Fetch the latest rows from public.sms_raw. Throws on network/HTTP errors. */
export async function fetchSmsRaw(limit = 500): Promise<SmsRawRow[]> {
  const url = `${SMS_RAW_ENDPOINT}?select=*&order=received_stamp.desc&limit=${limit}`;
  const res = await fetch(url, {
    headers: {
      // TODO(auth): replace anon key with per-device credentials once auth lands.
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  if (!res.ok) {
    throw new Error(`Supabase sms_raw fetch failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SmsRawRow[];
}
