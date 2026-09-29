import type { Campaign } from '../types';

// Example dataset: 6 detected campaigns. TODO(supabase): table `campaigns`

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400_000).toISOString();

export const campaigns: Campaign[] = [
  { id: 'cmp-1', operator: 'zain', name: 'Weekend Data Boost', messageCount: 12, firstSeen: d(19), lastSeen: d(1), recurrence: 'Fri–Sat', status: 'active' },
  { id: 'cmp-2', operator: 'umniah', name: 'Ramadan Bundle Push', messageCount: 9, firstSeen: d(19), lastSeen: d(10), recurrence: 'Daily', status: 'ended' },
  { id: 'cmp-3', operator: 'orange', name: 'Student Semester Pack', messageCount: 7, firstSeen: d(13), lastSeen: d(1), recurrence: 'Weekly', status: 'active' },
  { id: 'cmp-4', operator: 'zain', name: 'Double Recharge Days', messageCount: 6, firstSeen: d(16), lastSeen: d(8), recurrence: 'One-off', status: 'ended' },
  { id: 'cmp-5', operator: 'umniah', name: 'Night Owl Data', messageCount: 8, firstSeen: d(12), lastSeen: d(1), recurrence: 'Weekly', status: 'active' },
  { id: 'cmp-6', operator: 'orange', name: 'Weekend Extra Data', messageCount: 5, firstSeen: d(9), lastSeen: d(2), recurrence: 'Fri–Sat', status: 'active' },
];
