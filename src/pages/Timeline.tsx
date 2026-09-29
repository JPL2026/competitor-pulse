import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import {
  getMessages,
  getOffers,
  getTimeline,
  type Offer,
  type Operator,
  type SmsRaw,
  type TimelineEvent,
  type TimelineEventType,
} from '@/lib/data';
import { EmptyState, ExampleDataPill, MessageDrawer } from '@/components/shared';
import { EventNode, TYPE_META } from '@/components/timeline/EventNode';
import { cn } from '@/lib/utils';

const OPS: { id: Operator; label: string; active: string }[] = [
  { id: 'zain', label: 'Zain', active: 'bg-zain-soft text-zain border-zain/30' },
  { id: 'orange', label: 'Orange', active: 'bg-orange-soft text-orange border-orange/30' },
  { id: 'umniah', label: 'Umniah', active: 'bg-umniah-soft text-umniah border-umniah/30' },
];

const EVENT_TYPES = Object.keys(TYPE_META) as TimelineEventType[];

export default function Timeline() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [messages, setMessages] = useState<SmsRaw[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [types, setTypes] = useState<TimelineEventType[]>([]);
  const [drawerMsg, setDrawerMsg] = useState<SmsRaw | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [flashDay, setFlashDay] = useState<string | null>(null);
  const dayRefs = useRef<Map<string, HTMLElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTimeline(), getOffers(), getMessages()]).then(([t, o, m]) => {
      if (!cancelled) {
        setEvents(t);
        setOffers(o);
        setMessages(m);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          (operators.length === 0 || operators.includes(e.operator)) &&
          (types.length === 0 || types.includes(e.type)),
      ),
    [events, operators, types],
  );

  // Summary strip counts (for the selected filters).
  const summary = useMemo(() => {
    const counts = new Map<TimelineEventType, number>();
    for (const e of filtered) counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
    return EVENT_TYPES.map((t) => ({ type: t, count: counts.get(t) ?? 0 })).filter(
      (s) => s.count > 0,
    );
  }, [filtered]);

  // Daily event counts for the mini area chart (last 21 days).
  const chartData = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 21 }, (_, i) => {
      const key = new Date(now - (20 - i) * 86400_000).toISOString().slice(0, 10);
      return {
        date: key,
        label: format(new Date(key + 'T00:00:00'), 'dd MMM'),
        count: filtered.filter((e) => e.timestamp.slice(0, 10) === key).length,
      };
    });
  }, [filtered]);

  // Group events by day (desc).
  const dayGroups = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>();
    for (const e of filtered) {
      const key = e.timestamp.slice(0, 10);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [filtered]);

  const toggleOp = (op: Operator) =>
    setOperators((prev) =>
      prev.includes(op) ? prev.filter((o) => o !== op) : [...prev, op],
    );
  const toggleType = (t: TimelineEventType) =>
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const scrollToDay = (day: string) => {
    const el = dayRefs.current.get(day);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setFlashDay(day);
    window.setTimeout(() => setFlashDay((cur) => (cur === day ? null : cur)), 900);
  };

  const openSourceSms = (smsId: string) => {
    const msg = messages.find((m) => m.id === smsId);
    if (msg) {
      setDrawerMsg(msg);
      setDrawerOpen(true);
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
            Timeline <ExampleDataPill className="ml-2 align-middle" />
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            What changed, and when · last 21 days (example data)
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {OPS.map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => toggleOp(op.id)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                operators.includes(op.id)
                  ? op.active
                  : 'border-hairline bg-surface text-text-secondary hover:bg-subtle',
              )}
            >
              {op.label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-hairline" />
          {EVENT_TYPES.map((t) => {
            const meta = TYPE_META[t];
            const active = types.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'border-transparent'
                    : 'border-hairline bg-surface text-text-secondary hover:bg-subtle',
                )}
                style={active ? { color: meta.color, backgroundColor: meta.bg } : undefined}
              >
                {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary strip */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-secondary">
        {summary.length > 0 ? (
          summary.map((s, i) => (
            <span key={s.type} className="inline-flex items-center gap-2">
              {i > 0 && <span className="text-text-muted">·</span>}
              <span
                className="tnum inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: TYPE_META[s.type].color }}
                />
                {s.count} {TYPE_META[s.type].label.toLowerCase()}
                {s.count === 1 ? '' : 's'}
              </span>
            </span>
          ))
        ) : (
          <span className="text-text-muted">No events for the selected filters.</span>
        )}
      </div>

      {/* Mini area chart — visual index */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
      >
        <p className="mb-1 text-xs text-text-muted">
          Daily event counts — click a day to jump to it
        </p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 4, right: 4, bottom: 0, left: 4 }}
              onClick={(state) => {
                const day = (state as { activePayload?: { payload?: { date?: string } }[] })
                  ?.activePayload?.[0]?.payload?.date;
                if (day) scrollToDay(day);
              }}
              className="cursor-pointer"
            >
              <XAxis dataKey="label" hide />
              <Tooltip
                cursor={{ stroke: '#E7E3DC' }}
                contentStyle={{
                  borderRadius: 10,
                  border: '1px solid #E7E3DC',
                  background: '#FFFFFF',
                  fontSize: 12,
                }}
                formatter={(v) => [`${v} events`, '']}
                labelFormatter={(_, payload) =>
                  (payload?.[0]?.payload as { date?: string } | undefined)?.date ?? ''
                }
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#0F766E"
                strokeWidth={1.5}
                fill="#0F766E"
                fillOpacity={0.1}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Vertical timeline */}
      <div className="mx-auto mt-6 max-w-3xl">
        {dayGroups.length === 0 && (
          <EmptyState
            title="No events for these filters"
            onReset={() => {
              setOperators([]);
              setTypes([]);
            }}
          />
        )}
        {dayGroups.map(([day, dayEvents], gi) => (
          <section
            key={day}
            ref={(el) => {
              if (el) dayRefs.current.set(day, el);
              else dayRefs.current.delete(day);
            }}
            className="relative scroll-mt-16"
          >
            {/* Sticky day header */}
            <header
              className={cn(
                'sticky top-14 z-10 -mx-2 flex items-center gap-2 px-2 py-2 transition-colors duration-700',
                flashDay === day ? 'bg-brand-soft' : 'bg-canvas',
              )}
            >
              <h3 className="text-[13px] font-semibold text-text-primary">
                {format(new Date(day + 'T00:00:00'), 'EEEE d MMMM')}
              </h3>
              <span className="tnum rounded-full border border-hairline bg-surface px-2 py-0.5 text-[11px] text-text-muted">
                {dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}
              </span>
            </header>

            <div className="relative">
              {/* Spine segment (draws downward) */}
              <motion.span
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, delay: gi * 0.1, ease: 'easeOut' }}
                style={{ transformOrigin: 'top' }}
                className="absolute bottom-2 left-[11px] top-0 w-0.5 bg-hairline"
                aria-hidden
              />
              <ul className="relative">
                <AnimatePresence mode="popLayout">
                  {dayEvents.map((e, i) => (
                    <EventNode
                      key={e.id}
                      event={e}
                      offer={offers.find((o) => o.id === e.relatedId)}
                      index={i}
                      onSourceSms={openSourceSms}
                      onViewCampaign={() => navigate('/campaigns')}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </section>
        ))}
      </div>

      <MessageDrawer
        message={drawerMsg}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
