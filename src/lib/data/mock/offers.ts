import type { Offer } from '../types';

// Example dataset: 18 structured offers derived from the mock SMS messages.
// TODO(supabase): table `offers`

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString();

export const offers: Offer[] = [
  { id: 'off-01', operator: 'zain', title: 'Weekend Boost 10GB', priceJod: 4, dataGb: 10, validityDays: 7, benefits: ['Double data Fri–Sat', 'Dial *555#'], segment: 'General', confidence: 0.94, status: 'active', sourceSmsId: 'sms-012', firstSeen: d(19), lastSeen: d(1) },
  { id: 'off-02', operator: 'zain', title: 'Recharge 5 JD Get 10GB', priceJod: 5, dataGb: 10, validityDays: 7, benefits: ['Bonus data on recharge', 'Dial *555#'], segment: 'General', confidence: 0.96, status: 'active', sourceSmsId: 'sms-004', firstSeen: d(20), lastSeen: d(0) },
  { id: 'off-03', operator: 'zain', title: 'Student Pack 20GB', priceJod: 6, dataGb: 20, validityDays: 30, benefits: ['Unlimited social', 'Dial *700#'], segment: 'Student', confidence: 0.91, status: 'active', sourceSmsId: 'sms-021', firstSeen: d(14), lastSeen: d(2) },
  { id: 'off-04', operator: 'zain', title: 'Night Owl 5GB', priceJod: 1.5, dataGb: 5, validityDays: 1, benefits: ['Night data 12am–6am', 'Dial *909#'], segment: 'Youth', confidence: 0.88, status: 'active', sourceSmsId: 'sms-030', firstSeen: d(11), lastSeen: d(3) },
  { id: 'off-05', operator: 'zain', title: 'Family Bundle 50GB', priceJod: 20, dataGb: 50, validityDays: 30, benefits: ['4 shared lines', 'Dial *888#'], segment: 'Family', confidence: 0.9, status: 'active', sourceSmsId: 'sms-035', firstSeen: d(9), lastSeen: d(1) },
  { id: 'off-06', operator: 'zain', title: 'VIP 100GB + 1000 mins', priceJod: 25, dataGb: 100, validityDays: 30, benefits: ['VIP support', 'Unlimited Zain calls'], segment: 'High-value', confidence: 0.83, status: 'active', sourceSmsId: 'sms-041', firstSeen: d(7), lastSeen: d(4) },
  { id: 'off-07', operator: 'zain', title: 'Flash Deal 3GB', priceJod: 2, dataGb: 3, validityDays: 1, benefits: ['Today only', 'Dial *111#'], segment: 'General', confidence: 0.72, status: 'expired', sourceSmsId: 'sms-048', firstSeen: d(16), lastSeen: d(15) },
  { id: 'off-08', operator: 'orange', title: 'Monthly 15GB + 500 mins', priceJod: 8, dataGb: 15, validityDays: 30, benefits: ['500 minutes', 'Dial *155#'], segment: 'General', confidence: 0.95, status: 'active', sourceSmsId: 'sms-006', firstSeen: d(18), lastSeen: d(0) },
  { id: 'off-09', operator: 'orange', title: 'Student Semester Pack', priceJod: 10, dataGb: 30, validityDays: 90, benefits: ['Unlimited calls', '3-month validity'], segment: 'Student', confidence: 0.93, status: 'active', sourceSmsId: 'sms-014', firstSeen: d(13), lastSeen: d(1) },
  { id: 'off-10', operator: 'orange', title: 'Youth Line 12GB', priceJod: 5, dataGb: 12, validityDays: 30, benefits: ['Free TikTok', 'Dial *131#'], segment: 'Youth', confidence: 0.87, status: 'active', sourceSmsId: 'sms-026', firstSeen: d(10), lastSeen: d(2) },
  { id: 'off-11', operator: 'orange', title: 'Family Net 80GB', priceJod: 28, dataGb: 80, validityDays: 30, benefits: ['Home + mobile bundle'], segment: 'Family', confidence: 0.86, status: 'active', sourceSmsId: 'sms-037', firstSeen: d(8), lastSeen: d(3) },
  { id: 'off-12', operator: 'orange', title: 'Midnight Bundle 10GB', priceJod: 2, dataGb: 10, validityDays: 1, benefits: ['12am–8am', 'Dial *144#'], segment: 'Youth', confidence: 0.8, status: 'active', sourceSmsId: 'sms-044', firstSeen: d(6), lastSeen: d(2) },
  { id: 'off-13', operator: 'orange', title: 'Recharge 4 JD Get 6GB', priceJod: 4, dataGb: 6, validityDays: 5, benefits: ['Bonus on recharge'], segment: 'General', confidence: 0.68, status: 'expired', sourceSmsId: 'sms-052', firstSeen: d(17), lastSeen: d(12) },
  { id: 'off-14', operator: 'umniah', title: 'Weekly 8GB', priceJod: 3, dataGb: 8, validityDays: 7, benefits: ['Dial *606#'], segment: 'General', confidence: 0.97, status: 'active', sourceSmsId: 'sms-003', firstSeen: d(20), lastSeen: d(0) },
  { id: 'off-15', operator: 'umniah', title: 'Night Owl 20GB', priceJod: 3, dataGb: 20, validityDays: 30, benefits: ['Night data', 'Dial *616#'], segment: 'Youth', confidence: 0.92, status: 'active', sourceSmsId: 'sms-017', firstSeen: d(12), lastSeen: d(1) },
  { id: 'off-16', operator: 'umniah', title: 'Shabab 25GB + Gaming', priceJod: 7, dataGb: 25, validityDays: 30, benefits: ['Free gaming data'], segment: 'Youth', confidence: 0.89, status: 'active', sourceSmsId: 'sms-024', firstSeen: d(11), lastSeen: d(2) },
  { id: 'off-17', operator: 'umniah', title: 'Big Data 60GB', priceJod: 15, dataGb: 60, validityDays: 30, benefits: ['Best value per GB'], segment: 'High-value', confidence: 0.84, status: 'active', sourceSmsId: 'sms-040', firstSeen: d(5), lastSeen: d(1) },
  { id: 'off-18', operator: 'umniah', title: 'Ramadan 15GB', priceJod: 5, dataGb: 15, validityDays: 30, benefits: ['Seasonal bundle'], segment: 'General', confidence: 0.62, status: 'expired', sourceSmsId: 'sms-055', firstSeen: d(19), lastSeen: d(10) },
];
