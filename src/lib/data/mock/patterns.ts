import type { CvmPattern, DetectionRule } from '../types';

const now = Date.now();
const d = (n: number) => new Date(now - n * 86400_000).toISOString();

/* ---------------------------------------------------------------------------
 * The detection-rule library — the documented detection strategy.
 * Each rule is plain-language on purpose: it is shown to non-technical users.
 * TODO(supabase): table `detection_rules` (static reference data)
 * ------------------------------------------------------------------------- */
export const detectionRules: DetectionRule[] = [
  {
    type: 'winback',
    name: 'Winback trigger',
    short: 'An offer lands on a SIM that has been silent for days.',
    logic: 'Fires when a dormant SIM (no recharge) receives a marketing SMS after ≥ 10 days of total silence from that operator.',
    signal: 'Reveals the operator’s churn-save timing: how long they wait before spending money to win a customer back, and how much they offer.',
  },
  {
    type: 'stimulation_spike',
    name: 'Stimulation spike',
    short: 'Message frequency suddenly jumps for a SIM or segment.',
    logic: 'Weekly message count rises ≥ 2× vs the SIM’s own 3-week baseline.',
    signal: 'A CVM stimulation push: the operator is pressure-testing usage. Spikes often precede a tariff change or a campaign launch.',
  },
  {
    type: 'discount_escalation',
    name: 'Discount escalation',
    short: 'Bonuses or discounts keep growing toward the same segment.',
    logic: 'Sequential offers to one SIM show rising value (more GB, lower price, longer validity) within 30 days.',
    signal: 'The operator is negotiating with the customer. The escalation ceiling tells you their maximum acceptable discount for that segment.',
  },
  {
    type: 'retention_save',
    name: 'Retention save',
    short: 'An offer arrives just before the current bundle expires.',
    logic: 'Fires when an SMS lands within 48 h before the validity end of the SIM’s current bundle.',
    signal: 'Shows whether CVM is event-driven (smart, usage-aware) or calendar-driven (batch blasts). Event-driven retention is harder to counter.',
  },
  {
    type: 'cross_segment_targeting',
    name: 'Cross-segment targeting',
    short: 'Same product, different terms depending on the segment.',
    logic: 'Two SIMs of different segments receive the same product with different price / data / validity within the same week.',
    signal: 'Maps the operator’s price discrimination grid — who gets the generous version and who gets the standard one.',
  },
  {
    type: 'churn_defense',
    name: 'Churn-defense / conquest',
    short: 'A multi-operator SIM gets aggressively courted after activity elsewhere.',
    logic: 'A multi-op high-value SIM receives a high-value offer within 72 h after a recharge on a competitor SIM.',
    signal: 'The strongest signal of all: the operator is reacting to competitor activity in near-real time. Reveals their conquest budget.',
  },
];

// TODO(supabase): table `cvm_patterns` (populated by the scheduled detection job)
export const cvmPatterns: CvmPattern[] = [
  {
    id: 'pat-1',
    type: 'winback',
    operator: 'zain',
    segment: 'v3_winback',
    title: 'Zain winback wave after ~14 silent days',
    summary:
      'The dormant Zain SIM received a "we miss you" recharge offer after two weeks of silence, then a richer one a week later. Classic two-step winback cadence.',
    confidence: 0.91,
    status: 'confirmed',
    firstDetected: d(15),
    lastDetected: d(1),
    occurrences: 3,
    evidenceSmsIds: ['sms-101', 'sms-114', 'sms-127'],
    sampleBodies: [
      'اشتقنا لك! عبّي 3 دنانير اليوم واحصل على 5GB هدية لمدة 5 أيام',
      'Last chance: recharge 3 JD and we double your data for a week. Zain Jo',
    ],
    metric: { label: 'Days of silence before first winback', before: '14 days', after: '7 days (2nd wave)' },
  },
  {
    id: 'pat-2',
    type: 'stimulation_spike',
    operator: 'umniah',
    segment: 'v1_active',
    title: 'Umniah tripled message pressure mid-month',
    summary:
      'Weekly messages to the active Umniah SIM jumped from ~1 to ~3.4 in the second week, all pushing short-validity bundles. Pressure eased after the recharge.',
    confidence: 0.86,
    status: 'confirmed',
    firstDetected: d(12),
    lastDetected: d(2),
    occurrences: 8,
    evidenceSmsIds: ['sms-201', 'sms-205', 'sms-209', 'sms-213'],
    sampleBodies: [
      'باقة 2GB بـ 1 دينار فقط — اليوم فقط! فعّلها الآن من تطبيق أمنية',
      'Your data is almost gone! Top up 1 JD and get 2GB for 24h. Umniah',
    ],
    metric: { label: 'Messages / week', before: '1.1', after: '3.4' },
  },
  {
    id: 'pat-3',
    type: 'discount_escalation',
    operator: 'orange',
    segment: 'v3_winback',
    title: 'Orange escalating generosity toward silent SIM',
    summary:
      'Three offers in three weeks to the dormant Orange SIM: 3GB bonus → 5GB bonus → 5GB + free calls. Each step adds value without asking for a higher recharge.',
    confidence: 0.88,
    status: 'emerging',
    firstDetected: d(20),
    lastDetected: d(3),
    occurrences: 3,
    evidenceSmsIds: ['sms-301', 'sms-310', 'sms-322'],
    sampleBodies: [
      'Recharge 2 JD, get 3GB free — welcome back to Orange!',
      'عرض خاص لك: عبّي 2 دينار واحصل على 5GB + مكالمات مجانية داخل الشبكة',
    ],
    metric: { label: 'Bonus value per 2 JD recharge', before: '3 GB', after: '5 GB + calls' },
  },
  {
    id: 'pat-4',
    type: 'retention_save',
    operator: 'zain',
    segment: 'v1_active',
    title: 'Zain pings the active SIM ~1 day before bundle expiry',
    summary:
      'Twice in a row, a "renew now and keep your bonus" SMS arrived 24–30 h before the active SIM’s bundle validity ended. Event-driven retention, not batch.',
    confidence: 0.79,
    status: 'emerging',
    firstDetected: d(9),
    lastDetected: d(1),
    occurrences: 2,
    evidenceSmsIds: ['sms-140', 'sms-152'],
    sampleBodies: [
      'Your bundle expires tomorrow! Renew now and keep your unused GB. Zain Jo',
      'جدّد باقتك قبل ما تنتهي واحتفظ بالجيجات المتبقية! زين الأردن',
    ],
    metric: { label: 'Lead time before expiry', before: '30 h', after: '24 h' },
  },
  {
    id: 'pat-5',
    type: 'cross_segment_targeting',
    operator: 'umniah',
    segment: 'payg',
    title: 'Umniah sells the same 10GB bundle at 2 different prices',
    summary:
      'Same week, same 10GB/7-day product: 2.5 JD to the multi-op high-value SIM vs 3.5 JD to the standard active SIM. Clear segment-based price discrimination.',
    confidence: 0.93,
    status: 'confirmed',
    firstDetected: d(6),
    lastDetected: d(6),
    occurrences: 2,
    evidenceSmsIds: ['sms-401', 'sms-402'],
    sampleBodies: [
      'خصم خاص لك: باقة 10GB لمدة 7 أيام بـ 2.5 دينار فقط!',
      '10GB for 7 days, only 3.5 JD. Dial *888# to activate. Umniah',
    ],
    metric: { label: 'Price for 10GB / 7 days', before: '3.5 JD (standard)', after: '2.5 JD (multi-op HV)' },
  },
  {
    id: 'pat-6',
    type: 'churn_defense',
    operator: 'zain',
    segment: 'payg',
    title: 'Zain counter-offered within 48 h of an Umniah recharge',
    summary:
      'Right after the high-value profile recharged on Umniah, the Zain SIM of the same profile received its richest conquest offer yet (15GB + calls). Suggests near-real-time reaction — or a very lucky weekly cycle.',
    confidence: 0.64,
    status: 'emerging',
    firstDetected: d(4),
    lastDetected: d(1),
    occurrences: 2,
    evidenceSmsIds: ['sms-501', 'sms-502'],
    sampleBodies: [
      'أقوى عرض لك: 15GB + مكالمات بلا حدود لمدة 10 أيام عند تعبئة 5 دنانير',
      'Exclusive for you: 15GB + unlimited calls, 10 days, only 5 JD recharge!',
    ],
    metric: { label: 'Reaction time after competitor recharge', before: '72 h (1st time)', after: '48 h (2nd time)' },
  },
  {
    id: 'pat-7',
    type: 'stimulation_spike',
    operator: 'orange',
    segment: 'v1_active',
    title: 'Orange weekend double-data drumbeat',
    summary:
      'Every Thursday afternoon, the active Orange SIM gets a weekend double-data push. Reliable calendar-driven stimulation — easy to anticipate and counter.',
    confidence: 0.95,
    status: 'confirmed',
    firstDetected: d(18),
    lastDetected: d(3),
    occurrences: 4,
    evidenceSmsIds: ['sms-601', 'sms-602', 'sms-603', 'sms-604'],
    sampleBodies: [
      'Weekend only: double data on all bundles above 3 JD 🎉 Orange Jo',
      'ويكند مضاعف! ضاعف باقتك أيام الجمعة والسبت مع أورنج',
    ],
    metric: { label: 'Cadence', before: 'Irregular', after: 'Every Thu ~15:00' },
  },
  {
    id: 'pat-8',
    type: 'winback',
    operator: 'umniah',
    segment: 'v3_winback',
    title: 'Umniah tried one soft winback, then went quiet',
    summary:
      'The dormant Umniah SIM got a single gentle nudge 3 weeks ago and nothing since. Either a long winback cycle or no winback program at all for this segment — worth watching.',
    confidence: 0.58,
    status: 'ended',
    firstDetected: d(21),
    lastDetected: d(21),
    occurrences: 1,
    evidenceSmsIds: ['sms-701'],
    sampleBodies: ['مشتاقينلك! عبّي دينار واحد وخد 1GB هدية. أمنية'],
    metric: { label: 'Winback attempts in 3 weeks', before: '1', after: '0' },
  },
];
