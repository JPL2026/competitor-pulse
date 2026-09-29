import type { Insight } from '../types';

// Example dataset: 6 AI insights. TODO(supabase): table `insights`

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString();

export const insights: Insight[] = [
  {
    id: 'ins-1',
    title: 'Zain doubled down on weekend data bonuses',
    body: 'Zain increased weekend data bonus messaging by ~40% over the last two weekends, mostly pushing the 10GB Weekend Boost bundle to general-segment prepaid lines.',
    confidence: 0.87,
    operator: 'zain',
    supportingSmsIds: ['sms-012', 'sms-030', 'sms-041'],
    createdAt: d(1),
  },
  {
    id: 'ins-2',
    title: 'Orange is targeting students ahead of the semester',
    body: 'Orange ran 7 messages promoting the Student Semester Pack (30GB / 10 JD / 3 months) in the last two weeks — the heaviest single-offer push across all three operators.',
    confidence: 0.91,
    operator: 'orange',
    supportingSmsIds: ['sms-014', 'sms-026'],
    createdAt: d(2),
  },
  {
    id: 'ins-3',
    title: 'Umniah leads on price per GB',
    body: 'Umniah\'s Big Data 60GB at 15 JD (0.25 JD/GB) undercuts Zain\'s VIP 100GB (0.25 JD/GB equivalent) while targeting a broader audience with weekly night-data bundles.',
    confidence: 0.78,
    operator: 'umniah',
    supportingSmsIds: ['sms-040', 'sms-017'],
    createdAt: d(3),
  },
  {
    id: 'ins-4',
    title: 'Night-data bundles are a shared battleground',
    body: 'All three operators pushed night-time data bundles in the last 14 days (Zain Night Owl 5GB, Orange Midnight 10GB, Umniah Night Owl 20GB) — Umniah offers the most GB per JD.',
    confidence: 0.83,
    operator: 'all',
    supportingSmsIds: ['sms-030', 'sms-044', 'sms-017'],
    createdAt: d(4),
  },
  {
    id: 'ins-5',
    title: 'Recharge-bonus mechanics are accelerating',
    body: 'Recharge-linked bonuses ("recharge X, get Y") appeared in 9 of 68 messages — up from roughly 1 in 10 in the prior period across Zain and Umniah.',
    confidence: 0.71,
    operator: 'all',
    supportingSmsIds: ['sms-004', 'sms-052'],
    createdAt: d(5),
  },
  {
    id: 'ins-6',
    title: 'Arabic-first messaging dominates Umniah sends',
    body: 'About 60% of Umniah marketing SMS in the sample are Arabic-first, versus ~40% for Zain and Orange — suggesting a stronger local-language positioning.',
    confidence: 0.66,
    operator: 'umniah',
    supportingSmsIds: ['sms-003', 'sms-055'],
    createdAt: d(6),
  },
];
