import type { TimelineEvent } from '../types';

// Example dataset: 20 timeline events. TODO(supabase): table `timeline_events`

const d = (daysAgo: number, hour = 10) => {
  const t = new Date(Date.now() - daysAgo * 86400_000);
  t.setHours(hour, 15, 0, 0);
  return t.toISOString();
};

const events: TimelineEvent[] = [
  { id: 'ev-01', type: 'offer_new', operator: 'umniah', text: "Umniah launched 'Weekly 8GB' at 3 JOD", timestamp: d(20, 9), relatedId: 'off-14' },
  { id: 'ev-02', type: 'offer_new', operator: 'zain', text: "Zain launched 'Recharge 5 JD Get 10GB'", timestamp: d(20, 14), relatedId: 'off-02' },
  { id: 'ev-03', type: 'campaign_start', operator: 'umniah', text: "Umniah started 'Ramadan Bundle Push' (daily sends)", timestamp: d(19, 8), relatedId: 'cmp-2' },
  { id: 'ev-04', type: 'campaign_start', operator: 'zain', text: "Zain started 'Weekend Data Boost' (Fri–Sat)", timestamp: d(19, 16), relatedId: 'cmp-1' },
  { id: 'ev-05', type: 'offer_new', operator: 'zain', text: "Zain launched 'Weekend Boost 10GB' at 3 JOD", timestamp: d(19, 17), relatedId: 'off-01' },
  { id: 'ev-06', type: 'offer_new', operator: 'orange', text: "Orange launched 'Monthly 15GB + 500 mins' at 8 JOD", timestamp: d(18, 11), relatedId: 'off-08' },
  { id: 'ev-07', type: 'offer_new', operator: 'umniah', text: "Umniah launched 'Ramadan 15GB' at 5 JOD", timestamp: d(19, 12), relatedId: 'off-18' },
  { id: 'ev-08', type: 'offer_new', operator: 'orange', text: "Orange launched 'Recharge 4 JD Get 6GB'", timestamp: d(17, 10), relatedId: 'off-13' },
  { id: 'ev-09', type: 'campaign_start', operator: 'zain', text: "Zain started 'Double Recharge Days'", timestamp: d(16, 9), relatedId: 'cmp-4' },
  { id: 'ev-10', type: 'offer_new', operator: 'zain', text: "Zain launched 'Flash Deal 3GB' at 2 JOD (today only)", timestamp: d(16, 13), relatedId: 'off-07' },
  { id: 'ev-11', type: 'offer_expired', operator: 'zain', text: "Zain 'Flash Deal 3GB' expired after 1 day", timestamp: d(15, 23), relatedId: 'off-07' },
  { id: 'ev-12', type: 'offer_new', operator: 'zain', text: "Zain launched 'Student Pack 20GB' at 6 JOD/month", timestamp: d(14, 10), relatedId: 'off-03' },
  { id: 'ev-13', type: 'campaign_start', operator: 'orange', text: "Orange started 'Student Semester Pack' push", timestamp: d(13, 9), relatedId: 'cmp-3' },
  { id: 'ev-14', type: 'offer_new', operator: 'orange', text: "Orange launched 'Student Semester Pack' 30GB / 10 JOD", timestamp: d(13, 10), relatedId: 'off-09' },
  { id: 'ev-15', type: 'offer_expired', operator: 'orange', text: "Orange 'Recharge 4 JD Get 6GB' stopped appearing", timestamp: d(12, 18), relatedId: 'off-13' },
  { id: 'ev-16', type: 'campaign_start', operator: 'umniah', text: "Umniah started 'Night Owl Data' weekly push", timestamp: d(12, 21), relatedId: 'cmp-5' },
  { id: 'ev-17', type: 'campaign_end', operator: 'umniah', text: "Umniah ended 'Ramadan Bundle Push'", timestamp: d(10, 20), relatedId: 'cmp-2' },
  { id: 'ev-18', type: 'offer_expired', operator: 'umniah', text: "Umniah 'Ramadan 15GB' expired", timestamp: d(10, 20), relatedId: 'off-18' },
  { id: 'ev-19', type: 'campaign_end', operator: 'zain', text: "Zain ended 'Double Recharge Days'", timestamp: d(8, 19), relatedId: 'cmp-4' },
  { id: 'ev-20', type: 'price_change', operator: 'zain', text: "Zain raised 'Weekend Boost' price 3 → 4 JOD", timestamp: d(3, 15), relatedId: 'off-01' },
];

export const timeline: TimelineEvent[] = events.sort((a, b) =>
  b.timestamp.localeCompare(a.timestamp),
);
