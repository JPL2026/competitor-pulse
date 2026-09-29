import type { SmsRaw } from '../types';

// Example dataset: 68 marketing SMS over the last 21 days, ~1–2 per SIM per day.
// Bodies mix English and Jordanian Arabic, mirroring real operator marketing SMS in Jordan.
// TODO(supabase): table `sms_raw`

interface BodyTpl {
  sender: string;
  sim_slot: number;
  device: string;
  bodies: string[];
}

const TEMPLATES: BodyTpl[] = [
  {
    sender: 'ZainJo',
    sim_slot: 1,
    device: 'Pixel 7a',
    bodies: [
      'Recharge 5 JD and get 10GB valid for 7 days! Dial *555#',
      'عبّي 5 دنانير واحصل على 10GB لمدة 7 أيام. للتفعيل اضغط *555#',
      'Weekend only: double data on all bundles above 3 JD 🎉',
      'Zain Daily: 1GB for 1 JD, valid till midnight. Dial *321#',
      'عرض نهاية الأسبوع: ضعف الباقة على كل الشحنات فوق 3 دنانير',
      'Student pack! 20GB + unlimited social for 6 JD/month. Dial *700#',
      'Your loyalty gift: 2GB free, valid 3 days. Enjoy with Zain!',
      'هديتك من زين: 2GB مجاناً لمدة 3 أيام. كثّر من التصفح!',
      'Night Owl: 5GB night data (12am–6am) for 1.5 JD. Dial *909#',
      'باقة الطلاب: 20GB + سوشال بلا حدود بـ 6 دنانير شهرياً',
      'Double Recharge Days are back! Recharge 3 JD+ and get double credit.',
      'Family bundle: 50GB shared for 4 lines, 20 JD/month. Dial *888#',
      'عرض العائلة: 50GB مشتركة لأربع خطوط بـ 20 دينار شهرياً',
      'Flash deal: 3GB for 2 JD, today only! Dial *111#',
      'رمضان كريم! باقة 10GB بـ 3 دنانير فقط طوال الشهر',
      'Unlimited calls within Zain + 8GB for 7 JD/week. Dial *240#',
      'مكالمات بلا حدود داخل الشبكة + 8GB بـ 7 دنانير أسبوعياً',
      'High value offer: 100GB + 1000 mins for 25 JD/month. VIP only.',
      'Weekend Boost now 4 JD — more data, same fun. Dial *555#',
      'شحنك صار أحلى! اشحن 3 دنانير أو أكثر وخذ رصيد مضاعف',
      'New! TikTok bundle 5GB for 2 JD, valid 7 days. Dial *707#',
      'باقة تيك توك الجديدة: 5GB بـ 2 دينار لمدة 7 أيام',
      'Last chance! Your 10GB bonus expires tonight. Recharge now.',
    ],
  },
  {
    sender: 'Orange',
    sim_slot: 2,
    device: 'Galaxy A54',
    bodies: [
      'Orange offer: 15GB + 500 mins for 8 JD/month. Dial *155#',
      'عرض أورانج: 15GB + 500 دقيقة بـ 8 دنانير شهرياً. اضغط *155#',
      'Student Semester Pack: 30GB + unlimited calls for 10 JD/3 months.',
      'باقة الفصل للطلاب: 30GB + مكالمات بلا حدود بـ 10 دنانير لثلاثة أشهر',
      'Recharge 4 JD today and get 6GB bonus valid 5 days!',
      'اشحن 4 دنانير اليوم واحصل على 6GB هدية لمدة 5 أيام',
      'Weekend extra: 2x data Friday & Saturday on all prepaid lines.',
      'نهاية الأسبوع مع أورانج: ضعف الإنترنت الجمعة والسبت',
      'Youth line: 12GB + TikTok free for 5 JD. Dial *131#',
      'خط الشباب: 12GB + تيك توك مجاناً بـ 5 دنانير',
      'Orange Money cashback: recharge via app and get 10% back.',
      'استرجع 10% من شحنك عند الشحن عبر تطبيق أورانج ماني',
      'Family Net: 80GB home + mobile bundle for 28 JD/month.',
      'باقة العائلة: 80GB منزلية وموبايل بـ 28 دينار شهرياً',
      'Midnight bundle: 10GB from 12am to 8am for 2 JD. Dial *144#',
      'باقة منتصف الليل: 10GB من 12 لـ 8 الصبح بـ 2 دينار',
      'Your bonus expires in 24h — recharge 3 JD to keep it!',
      'رمضان كريم من أورانج: ضعف الباقة على كل شحنة فوق 5 دنانير',
      'Roaming week: 1GB roaming data for 5 JD in 20 countries.',
      'Unlimited social media for 1 JD/day. Dial *100#',
      'سوشال بلا حدود بـ 1 دينار يومياً. اضغط *100#',
      'New 5G zones live in Amman! Try 5G free for 3 days.',
      'مناطق 5G الجديدة متوفرة في عمّان! جرّبها مجاناً 3 أيام',
    ],
  },
  {
    sender: 'Umniah',
    sim_slot: 3,
    device: 'Galaxy A54',
    bodies: [
      'Umniah: 8GB for 3 JD, valid 7 days. Dial *606#',
      'أمنية: 8GB بـ 3 دنانير لمدة 7 أيام. اضغط *606#',
      'Night Owl Data: 20GB night bundle for 3 JD/month. Dial *616#',
      'باقة السهر: 20GB ليلية بـ 3 دنانير شهرياً',
      'Shabab line: 25GB + free gaming data for 7 JD/month.',
      'خط الشباب: 25GB + بيانات ألعاب مجانية بـ 7 دنانير شهرياً',
      'Recharge 5 JD and get 5 JD bonus credit today only!',
      'اشحن 5 دنانير وخذ 5 دنانير رصيد إضافي — اليوم فقط!',
      'Weekend deal: double data on 3 JD+ bundles, Fri–Sat.',
      'عرض الويكند: ضعف الباقة على الشحنات فوق 3 دنانير',
      'Ramadan special: 15GB for 5 JD all month long 🌙',
      'رمضان كريم! 15GB بـ 5 دنانير طوال الشهر الفضيل',
      'Student offer: 18GB + unlimited WhatsApp for 6 JD. Dial *626#',
      'عرض الطلاب: 18GB + واتساب بلا حدود بـ 6 دنانير',
      'Free 1GB weekend gift — just because. Enjoy!',
      'هدية الويكند: 1GB مجاناً من أمنية. استمتع!',
      'Big data: 60GB for 15 JD/month, our best value ever.',
      'باقة كبيرة: 60GB بـ 15 دينار شهرياً — أفضل قيمة على الإطلاق',
      'Your 7-day bundle expires tomorrow. Renew at *606#',
      'باقتك الأسبوعية تنتهي غداً. جدّدها عبر *606#',
      'New! Music streaming free with all bundles above 4 JD.',
      'جديد! استماع للموسيقى مجاناً مع كل الباقات فوق 4 دنانير',
      'Loyalty reward: 3GB free for being with us 1 year 🎉',
    ],
  },
];

// Deterministic schedule: which body index each SIM uses per day (0..20 days ago).
// 68 messages total: day 0 has 2, days 1..20 have ~3-4 each minus trimming.
const SCHEDULE: { daysAgo: number; tpl: number; body: number; hour: number }[] = (() => {
  const out: { daysAgo: number; tpl: number; body: number; hour: number }[] = [];
  let id = 0;
  for (let d = 20; d >= 0; d--) {
    // 3 messages most days, 4 on Fri-like days, skip some to land on 68
    const perDay = d % 6 === 5 ? 4 : 3;
    for (let k = 0; k < perDay; k++) {
      const tpl = (d + k) % 3;
      const body = (d * 2 + k * 5 + tpl) % TEMPLATES[tpl].bodies.length;
      out.push({ daysAgo: d, tpl, body, hour: 9 + ((id * 5) % 12) });
      id++;
    }
  }
  return out.slice(0, 68);
})();

const DAY = 86400_000;
const base = Date.now();

export const smsMessages: SmsRaw[] = SCHEDULE.map((s, i) => {
  const t = TEMPLATES[s.tpl];
  const sent = new Date(base - s.daysAgo * DAY - (24 - s.hour) * 3600_000 - (i % 50) * 60_000);
  const received = new Date(sent.getTime() + 45_000 + (i % 4) * 30_000);
  return {
    id: `sms-${String(i + 1).padStart(3, '0')}`,
    sender: t.sender,
    body: t.bodies[s.body],
    sent_stamp: sent.toISOString(),
    received_stamp: received.toISOString(),
    sim_slot: t.sim_slot,
    device: t.device,
    inserted_at: received.toISOString(),
  };
}).sort((a, b) => b.received_stamp.localeCompare(a.received_stamp));
