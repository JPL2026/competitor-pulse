import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import type { Campaign, Operator, SmsRaw } from '@/lib/data';
import { OPERATOR_LABELS } from '@/components/shared';
import { campaignMessages } from './CampaignCard';

const OP_HEX: Record<Operator, string> = {
  zain: '#6B2D90',
  orange: '#FF7900',
  umniah: '#E4002B',
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * 4-week calendar grid: each day shows tiny operator-colored dots
 * for campaign activity — the "when do competitors push" picture.
 */
export function ActivityCalendar({
  campaigns,
  messages,
}: {
  campaigns: Campaign[];
  messages: SmsRaw[];
}) {
  // Map date -> set of operators with campaign activity that day.
  const activity = useMemo(() => {
    const map = new Map<string, Set<Operator>>();
    for (const c of campaigns) {
      for (const m of campaignMessages(c, messages)) {
        const key = m.received_stamp.slice(0, 10);
        if (!map.has(key)) map.set(key, new Set());
        map.get(key)!.add(c.operator);
      }
    }
    return map;
  }, [campaigns, messages]);

  // 4 weeks (28 days) ending today, aligned to week start (Monday).
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today.getTime() - 27 * 86400_000);
    // shift back to Monday
    const dow = (start.getDay() + 6) % 7; // 0 = Monday
    start.setTime(start.getTime() - dow * 86400_000);
    const rows: { key: string; date: Date; inRange: boolean }[][] = [];
    for (let w = 0; w < 4; w++) {
      const row: { key: string; date: Date; inRange: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start.getTime() + (w * 7 + d) * 86400_000);
        const key = date.toISOString().slice(0, 10);
        row.push({ key, date, inRange: date <= today });
      }
      rows.push(row);
    }
    return rows;
  }, []);

  const activeOps = useMemo(
    () => Array.from(new Set(campaigns.map((c) => c.operator))),
    [campaigns],
  );

  let dayIndex = 0;

  return (
    <div className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <h3 className="text-[15px] font-semibold text-text-primary">Recurrence calendar</h3>
      <p className="mt-0.5 text-xs text-text-muted">
        Campaign activity by day across the last 4 weeks
      </p>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-[10px] font-medium uppercase tracking-wide text-text-muted"
          >
            {d}
          </div>
        ))}
        {weeks.flat().map((day) => {
          const ops = activity.get(day.key);
          const i = dayIndex++;
          return (
            <div
              key={day.key}
              className="flex h-12 flex-col items-center justify-center gap-1 rounded-lg border border-hairline bg-canvas"
              title={format(day.date, 'EEEE dd MMM')}
            >
              <span className="tnum text-[11px] text-text-muted">
                {format(day.date, 'd')}
              </span>
              <span className="flex h-1.5 items-center gap-1">
                {day.inRange &&
                  ops &&
                  (['zain', 'orange', 'umniah'] as Operator[])
                    .filter((op) => ops.has(op))
                    .map((op) => (
                      <motion.span
                        key={op}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 + i * 0.01, duration: 0.2 }}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: OP_HEX[op] }}
                      />
                    ))}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-hairline pt-3">
        {activeOps.map((op) => (
          <span key={op} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: OP_HEX[op] }}
            />
            {OPERATOR_LABELS[op]} campaign activity
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-xs text-text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-hairline" />
          No campaign activity
        </span>
      </div>
    </div>
  );
}
