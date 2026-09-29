import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Megaphone } from 'lucide-react';
import {
  getCampaigns,
  getMessages,
  operatorFromSender,
  type Campaign,
  type Operator,
  type SmsRaw,
} from '@/lib/data';
import { EmptyState, ExampleDataPill, OperatorBadge, StatusPill } from '@/components/shared';
import { cn } from '@/lib/utils';

const DAY = 86400_000;
const OP_COLOR: Record<Operator, string> = { zain: '#6B2D90', orange: '#FF7900', umniah: '#E4002B' };

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function recurrenceLabel(rec: string) {
  if (/fri|sat/i.test(rec)) return 'Weekly · Fri–Sat';
  if (/daily/i.test(rec)) return 'Daily';
  return 'One-off burst';
}

/** Per-day message counts for an operator over the last 21 days (heatmap strip). */
function useOperatorDaily(operator: Operator, messages: SmsRaw[]) {
  return useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 21 }, (_, i) => {
      const key = new Date(now - (20 - i) * DAY).toISOString().slice(0, 10);
      return messages.filter(
        (m) => m.received_stamp.slice(0, 10) === key && operatorFromSender(m.sender) === operator,
      ).length;
    });
  }, [operator, messages]);
}

function HeatmapStrip({ operator, messages }: { operator: Operator; messages: SmsRaw[] }) {
  const counts = useOperatorDaily(operator, messages);
  const max = Math.max(...counts, 1);
  return (
    <div className="flex items-end gap-[3px]" title="Messages per day, last 21 days">
      {counts.map((c, i) => (
        <motion.span
          key={i}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: i * 0.015 }}
          title={`${c} message${c === 1 ? '' : 's'}`}
          className="h-3.5 w-2 rounded-[2px]"
          style={{
            backgroundColor: OP_COLOR[operator],
            opacity: c === 0 ? 0.12 : 0.25 + 0.75 * (c / max),
          }}
        />
      ))}
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [messages, setMessages] = useState<SmsRaw[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [status, setStatus] = useState<'all' | 'active' | 'ended'>('all');

  useEffect(() => {
    getCampaigns().then(setCampaigns);
    getMessages().then(setMessages);
  }, []);

  const filtered = campaigns.filter(
    (c) =>
      (operators.length === 0 || operators.includes(c.operator)) &&
      (status === 'all' || c.status === status),
  );

  const toggleOp = (op: Operator) =>
    setOperators((cur) => (cur.includes(op) ? cur.filter((o) => o !== op) : [...cur, op]));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
          Campaigns <ExampleDataPill className="ml-2 align-middle" />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Recurring message pushes grouped per operator — who runs steady calendar campaigns and who
          fires one-off bursts.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['zain', 'orange', 'umniah'] as Operator[]).map((op) => (
          <button
            key={op}
            onClick={() => toggleOp(op)}
            className={cn(
              'rounded-full transition-all',
              operators.length === 0 || operators.includes(op) ? 'opacity-100' : 'opacity-40 hover:opacity-70',
            )}
          >
            <OperatorBadge operator={op} />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-hairline" />
        {(['all', 'active', 'ended'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition-colors',
              status === s
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-hairline bg-surface text-text-secondary hover:border-text-muted',
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="max-w-5xl space-y-4">
        <AnimatePresence mode="popLayout">
          {filtered.map((c, i) => (
            <motion.article
              key={c.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
              className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-5 pl-6 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
            >
              <span
                className="absolute inset-y-0 left-0 w-1"
                style={{ backgroundColor: OP_COLOR[c.operator] }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Megaphone className="h-4 w-4 text-text-muted" />
                <h3 className="font-display text-[17px] font-semibold text-text-primary">{c.name}</h3>
                <OperatorBadge operator={c.operator} />
                <StatusPill status={c.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-secondary">
                <span className="tnum">{c.messageCount} messages</span>
                <span className="tnum">
                  {fmtDate(c.firstSeen)} → {fmtDate(c.lastSeen)}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
                  <CalendarDays className="h-3 w-3" /> {recurrenceLabel(c.recurrence)}
                </span>
              </div>
              <div className="mt-4">
                <HeatmapStrip operator={c.operator} messages={messages} />
                <div className="mt-1 text-[11px] text-text-muted">Operator message activity · last 21 days</div>
              </div>
            </motion.article>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <EmptyState
            title="No campaigns for these filters"
            onReset={() => {
              setOperators([]);
              setStatus('all');
            }}
          />
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/5 p-4 text-[13px] text-text-secondary">
        <strong className="text-text-primary">Tip:</strong> recurring campaigns with fixed cadence
        (see the <Link to="/patterns" className="font-medium text-brand hover:underline">CVM Patterns</Link> page)
        are the easiest to pre-empt with a counter-offer timed the day before.
      </div>
    </div>
  );
}
