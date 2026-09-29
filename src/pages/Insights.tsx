import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CalendarClock,
  Info,
  RefreshCw,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { getInsights, getMessages, type Insight, type SmsRaw } from '@/lib/data';
import { ExampleDataPill, MessageDrawer } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { InsightCard, type InsightCategory } from '@/components/insights/InsightCard';
import { LocalToastStack, useLocalToasts } from '@/components/sims/LocalToast';
import { cn } from '@/lib/utils';

const CATEGORY_BY_ID: Record<string, InsightCategory> = {
  'ins-1': 'Timing',
  'ins-2': 'Segmentation',
  'ins-3': 'Pricing',
  'ins-4': 'New behavior',
  'ins-5': 'Volume',
  'ins-6': 'Segmentation',
};

const CATEGORIES: ('All' | InsightCategory)[] = [
  'All',
  'Pricing',
  'Timing',
  'Segmentation',
  'Volume',
  'New behavior',
];

const FEEDBACK_KEY = 'cp-insight-feedback';

function loadFeedback(): Record<string, 'up' | 'down'> {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) ?? '{}');
  } catch {
    return {};
  }
}

export default function Insights() {
  const { toasts, push } = useLocalToasts();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [messages, setMessages] = useState<SmsRaw[]>([]);
  const [category, setCategory] = useState<'All' | InsightCategory>('All');
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>(loadFeedback);
  const [drawerMsg, setDrawerMsg] = useState<SmsRaw | null>(null);
  const [shuffleKey, setShuffleKey] = useState(0);

  useEffect(() => {
    getInsights().then(setInsights);
    getMessages().then(setMessages);
  }, []);

  const smsById = useMemo(() => new Map(messages.map((m) => [m.id, m])), [messages]);

  const visible = useMemo(
    () =>
      category === 'All'
        ? insights
        : insights.filter((i) => CATEGORY_BY_ID[i.id] === category),
    [insights, category],
  );

  const onFeedback = (id: string, value: 'up' | 'down') => {
    setFeedback((prev) => {
      const next = { ...prev };
      if (next[id] === value) delete next[id];
      else next[id] = value;
      localStorage.setItem(FEEDBACK_KEY, JSON.stringify(next));
      return next;
    });
    push('Thanks — feedback will tune the model once connected.');
  };

  const regenerate = () => {
    setInsights((prev) => [...prev].sort(() => Math.random() - 0.5));
    setShuffleKey((k) => k + 1);
    push('Insights regenerate automatically once the AI step is connected.');
  };

  return (
    <div className="space-y-5">
      {/* Permanent disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-2.5 rounded-xl border border-info/25 bg-info/5 px-4 py-3 text-[13px] text-text-secondary"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p>
          <strong className="text-text-primary">
            These are AI-generated inferences from example data — hypotheses to investigate, not
            confirmed facts.
          </strong>{' '}
          Each insight links to the messages it was inferred from.
        </p>
      </motion.div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
            AI Insights <ExampleDataPill className="ml-2 align-middle" />
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Patterns detected across {messages.length || 68} messages · generated from example data
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={regenerate}>
          <RefreshCw className="h-3.5 w-3.5" /> Regenerate
        </Button>
      </div>

      {/* Category filter chips */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              category === c
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-hairline bg-surface text-text-secondary hover:bg-subtle',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="flex items-start gap-6">
        {/* Insight cards */}
        <div className="w-full max-w-4xl flex-1 space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map((ins, i) => (
              <motion.div
                key={`${ins.id}-${shuffleKey}`}
                layout="position"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8, transition: { duration: 0.15 } }}
                transition={{ delay: i * 0.09, duration: 0.3 }}
              >
                <InsightCard
                  insight={ins}
                  category={CATEGORY_BY_ID[ins.id] ?? 'New behavior'}
                  evidence={ins.supportingSmsIds
                    .map((id) => smsById.get(id))
                    .filter((m): m is SmsRaw => Boolean(m))}
                  feedback={feedback[ins.id] ?? null}
                  onFeedback={onFeedback}
                  onOpenMessage={setDrawerMsg}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          {visible.length === 0 && (
            <div className="rounded-xl border border-dashed border-hairline bg-surface p-10 text-center text-sm text-text-muted">
              No insights in this category yet.
            </div>
          )}
        </div>

        {/* Pattern summary sidebar */}
        <motion.aside
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="sticky top-20 hidden w-[300px] shrink-0 rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] xl:block"
        >
          <h3 className="text-[15px] font-semibold text-text-primary">
            Observed patterns this period
          </h3>
          <ul className="mt-4 space-y-4">
            {[
              { icon: CalendarClock, label: 'Busiest send day', value: 'Friday' },
              { icon: Users, label: 'Most targeted segment', value: 'Youth' },
              { icon: Zap, label: 'Most aggressive operator', value: 'Zain · 34 msgs' },
              { icon: TrendingUp, label: 'Avg promo validity', value: '9 days' },
            ].map((row) => (
              <li key={row.label} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-info/10 text-info">
                  <row.icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{row.label}</p>
                  <p className="truncate text-[13px] font-medium text-text-primary">{row.value}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-hairline pt-3 text-[11px] leading-relaxed text-text-muted">
            Derived from the example dataset — treat as illustrative, not measured fact.
          </p>
        </motion.aside>
      </div>

      <MessageDrawer
        message={drawerMsg}
        open={drawerMsg !== null}
        onOpenChange={(o) => !o && setDrawerMsg(null)}
      />
      <LocalToastStack toasts={toasts} />
    </div>
  );
}
