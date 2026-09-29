import type { UssdSession } from '../types';

const now = Date.now();
const hAgo = (n: number) => new Date(now - n * 3600_000).toISOString();

// Example USSD captures — realistic shape for the Jordanian market. Codes and
// offers are illustrative until device-side USSD automation is connected.
export const ussdSessions: UssdSession[] = [
  {
    id: 'ussd-1',
    sim_slot: 2,
    operator: 'zain',
    device: 'Pixel 7a',
    code: '*100#',
    menu_path: ['2 — Offers', '1 — Data bundles'],
    response_text:
      'Zain Special: 10GB + 100 mins, 7 days, only 2 JD. Reply 1 to activate. Balance 0.412 JD.',
    extracted_offer: '10GB + 100 mins / 7d / 2 JD (short-cycle stim)',
    captured_at: hAgo(6),
    source: 'auto',
  },
  {
    id: 'ussd-2',
    sim_slot: 3,
    operator: 'orange',
    device: 'Moto G54',
    code: '*155#',
    menu_path: ['3 — For you', '2 — Winback'],
    response_text:
      'We miss you! Come back with 50% off for 3 months on any monthly plan. Press 1 to confirm.',
    extracted_offer: '50% off × 3 months (winback)',
    captured_at: hAgo(9),
    source: 'auto',
  },
  {
    id: 'ussd-3',
    sim_slot: 1,
    operator: 'zain',
    device: 'Pixel 7a',
    code: '*100#',
    menu_path: ['1 — Balance'],
    response_text: 'Balance: 0.412 JD. Main bundle: Yalla 5 — 3.2GB left, expires in 12 days.',
    extracted_offer: null,
    captured_at: hAgo(6),
    source: 'auto',
  },
  {
    id: 'ussd-4',
    sim_slot: 5,
    operator: 'umniah',
    device: 'Moto G54',
    code: '*133#',
    menu_path: ['2 — Offers'],
    response_text:
      'عرض خاص: ضعف الرصيد عند الشحن بـ 5 JD أو أكثر. صالح لمدة 48 ساعة. اضغط 1 للتفعيل',
    extracted_offer: 'Double balance on 5+ JD recharge (48h)',
    captured_at: hAgo(14),
    source: 'auto',
  },
  {
    id: 'ussd-5',
    sim_slot: 4,
    operator: 'orange',
    device: 'Moto G54',
    code: '*155#',
    menu_path: ['3 — For you', '1 — Today'],
    response_text: 'Daily deal: 1GB for 0.5 JD, valid until midnight. Press 1 to buy.',
    extracted_offer: '1GB / 0.5 JD (flash day deal)',
    captured_at: hAgo(22),
    source: 'auto',
  },
  {
    id: 'ussd-6',
    sim_slot: 6,
    operator: 'umniah',
    device: 'motorola-edge-70',
    code: '*133#',
    menu_path: ['1 — Balance'],
    response_text: 'رصيدك: 1.870 JD. لا يوجد باقة فعالة.',
    extracted_offer: null,
    captured_at: hAgo(30),
    source: 'auto',
  },
  {
    id: 'ussd-7',
    sim_slot: 2,
    operator: 'zain',
    device: 'Pixel 7a',
    code: '*100#',
    menu_path: ['2 — Offers', '3 — Social'],
    response_text:
      'Social Pass: unlimited WhatsApp + Facebook, 30 days, 1.5 JD. Reply 2 to subscribe.',
    extracted_offer: 'Social Pass 30d / 1.5 JD',
    captured_at: hAgo(31),
    source: 'auto',
  },
  {
    id: 'ussd-8',
    sim_slot: 3,
    operator: 'orange',
    device: 'Moto G54',
    code: '*155#',
    menu_path: ['1 — Balance'],
    response_text: 'Credit: 0.000 JD. Recharge now and get 100% bonus credit. Press 9 for offers.',
    extracted_offer: '100% recharge bonus (winback lure)',
    captured_at: hAgo(48),
    source: 'auto',
  },
];
