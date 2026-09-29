// Core domain types for Competitor Pulse.
// These mirror the future Supabase tables (sms_raw, sim_profiles, offers, campaigns, insights, timeline_events).

export type Operator = 'zain' | 'orange' | 'umniah';

export interface SmsRaw {
  id: string;
  sender: string; // e.g. "ZainJo", "Orange", "Umniah"
  body: string;
  sent_stamp: string; // ISO timestamp
  received_stamp: string; // ISO timestamp
  sim_slot: number; // 1 | 2 | 3
  device: string;
  inserted_at: string; // ISO timestamp (row created)
  battery_pct?: number | null; // from %battery% placeholder
  charging?: boolean | null; // from %power%
  network?: string | null; // from %network%
}

/**
 * A captured USSD session: a dialed short code (e.g. *100#) and the operator's
 * menu/response text. In many African markets USSD carries most BTL offers.
 */
export interface UssdSession {
  id: string;
  sim_slot: number;
  operator: 'zain' | 'orange' | 'umniah';
  device: string;
  code: string; // e.g. "*155#"
  menu_path: string[]; // navigation path inside the menu, e.g. ["2 Offers","1 Data"]
  response_text: string; // raw USSD response (may be Arabic/French)
  extracted_offer: string | null; // short label if a promo was detected in the response
  captured_at: string; // ISO
  source: 'auto' | 'manual'; // auto = device-side automation, manual = typed in
}

/**
 * SIM lifecycle segment — where the SIM sits in the 30-day offer cycle.
 * All market offers are 30-day bundles; the segment is a lifecycle stage, not a demographic.
 * - v1_active: inside the 30-day cycle, recharging/renewing normally
 * - v2_grace: cycle ended 5+ days ago, no recharge (at-risk, stimulation zone)
 * - v3_winback: beyond grace (deep inactivity, winback zone)
 * - payg: Pay As You Consume — no bundle, pure per-use consumption
 * Multi-operator presence is an attribute (multiOp), not a segment.
 */
export type SimSegment = 'v1_active' | 'v2_grace' | 'v3_winback' | 'payg';

export interface SimProfile {
  id: string;
  sim_slot: number;
  operator: Operator;
  label: string; // e.g. "Zain Jo"
  phone_masked: string; // e.g. "079•••1234"
  device: string;
  plan: string;
  status: 'active' | 'paused';
  notes: string;
  last_ping: string; // ISO timestamp
  segment: SimSegment;
  multiOp: boolean; // also active on competing networks
  rechargeAmountJod: number; // standard recharge for this profile
  lastRecharge: string | null; // ISO date of last recharge (null = never)
  currentBundle: string | null; // e.g. "Smart 6 Umniah" (null for payg / lapsed)
  bundleExpiresAt: string | null; // ISO date — end of the 30-day cycle
}

/* ---------------------------------------------------------------------------
 * Device health & SIM care
 * ------------------------------------------------------------------------- */

export interface DeviceHealth {
  device: string; // device id, e.g. "edge70"
  label: string;
  sims: number[]; // sim slots hosted
  batteryPct: number | null; // from %battery% placeholder
  charging: boolean | null; // from %power%
  network: string | null; // from %network% — e.g. "4G", "WiFi"
  lastSeen: string; // ISO — last message received from this device
}

export type CareTaskType = 'renew_bundle' | 'recharge' | 'keep_alive' | 'device_battery' | 'device_offline' | 'rebalance';

export interface CareTask {
  id: string;
  type: CareTaskType;
  simId?: string;
  simLabel?: string;
  operator?: Operator;
  device?: string;
  title: string; // e.g. "Recharge 3 JD on SIM 078•••9012 (Moto G)"
  detail: string;
  dueAt: string; // ISO date
  severity: 'overdue' | 'due_soon' | 'scheduled';
}

/* ---------------------------------------------------------------------------
 * CVM pattern detection
 * ------------------------------------------------------------------------- */

export type PatternType =
  | 'winback' // offer after N days of SIM silence
  | 'stimulation_spike' // sudden message-frequency increase
  | 'discount_escalation' // rising bonus/discount over time toward a segment
  | 'retention_save' // offer just before bundle/validity expiry
  | 'cross_segment_targeting' // same product, different terms per segment
  | 'churn_defense'; // conquest offer to a multi-op SIM after competitor activity

export interface DetectionRule {
  type: PatternType;
  name: string;
  short: string; // one-line plain-language definition
  logic: string; // how the rule fires
  signal: string; // what it reveals about the operator's CVM strategy
}

export type PatternStatus = 'emerging' | 'confirmed' | 'ended';

export interface CvmPattern {
  id: string;
  type: PatternType;
  operator: Operator;
  segment: SimSegment;
  title: string;
  summary: string;
  confidence: number; // 0.5–0.97
  status: PatternStatus;
  firstDetected: string; // ISO date
  lastDetected: string; // ISO date
  occurrences: number;
  evidenceSmsIds: string[];
  sampleBodies: string[]; // 1–2 example SMS bodies (may contain Arabic)
  metric?: { label: string; before: string; after: string }; // e.g. frequency 1.1/wk → 3.4/wk
}

export type Segment = 'Youth' | 'Student' | 'Family' | 'General' | 'High-value';

export interface Offer {
  id: string;
  operator: Operator;
  title: string;
  priceJod: number;
  dataGb: number;
  validityDays: number;
  benefits: string[];
  segment: Segment;
  confidence: number; // 0.55–0.98
  status: 'active' | 'expired';
  sourceSmsId: string;
  firstSeen: string; // ISO date
  lastSeen: string; // ISO date
}

export interface Campaign {
  id: string;
  operator: Operator;
  name: string;
  messageCount: number;
  firstSeen: string;
  lastSeen: string;
  recurrence: string; // e.g. "Fri–Sat", "Daily", "One-off"
  status: 'active' | 'paused' | 'ended';
}

export interface Insight {
  id: string;
  title: string;
  body: string;
  confidence: number;
  operator: Operator | 'all';
  supportingSmsIds: string[];
  createdAt: string;
}

export type TimelineEventType =
  | 'offer_new'
  | 'price_change'
  | 'campaign_start'
  | 'campaign_end'
  | 'offer_expired';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  operator: Operator;
  text: string;
  timestamp: string; // ISO
  relatedId?: string; // offer or campaign id
}

export interface MessageFilters {
  operators?: Operator[];
  simSlot?: number;
  from?: string; // ISO date
  to?: string; // ISO date
  keyword?: string;
}

export interface OfferFilters {
  operators?: Operator[];
  segment?: Segment;
  status?: 'active' | 'expired';
  keyword?: string;
}

export interface Kpis {
  messagesThisWeek: number;
  messagesPrevWeek: number;
  messagesDeltaPct: number;
  dailyCounts: { date: string; count: number }[]; // 7-point sparkline
  activeOffers: number;
  newOffers: number;
  activeCampaigns: number;
  endedCampaigns: number;
  simsOnline: number;
  simsTotal: number;
  lastPing: string;
  activePatterns: number; // emerging + confirmed CVM patterns
}
