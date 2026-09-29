import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bell,
  Crosshair,
  HeartCrack,
  Radar,
  Repeat,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import {
  getCvmPatterns,
  getDetectionRules,
  type CvmPattern,
  type Operator,
  type PatternType,
} from '@/lib/data';
import {
  ConfidenceMeter,
  ExampleDataPill,
  OperatorBadge,
  SegmentBadge,
} from '@/components/shared';
import { cn } from '@/lib/utils';

export const PATTERN_META: Record<
  PatternType,
  { label: string; icon: typeof Bell; color: string }
> = {
  winback: { label: 'Winback', icon: HeartCrack, color: 'text-zain' },
  stimulation_spike: { label: 'Stimulation spike', icon: TrendingUp, color: 'text-warn' },
  discount_escalation: { label: 'Discount escalation', icon: Repeat, color: 'text-orange' },
  retention_save: { label: 'Retention save', icon: Bell, color: 'text-brand' },
  cross_segment_targeting: { label: 'Cross-segment targeting', icon: Crosshair, color: 'text-info' },
  churn_defense: { label: 'Churn defense', icon: ShieldAlert, color: 'text-danger' },
};

const STATUS_STYLE: Record<CvmPattern['status'], string> = {
  emerging: 'bg-amber-50 text-warn border-warn/40',
  confirmed: 'bg-success-soft text-success border-success/30',
  ended: 'bg-stone-100 text-stone-500 border-stone-300/60',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export default function Patterns() {
  const [patterns, setPatterns] = useState<CvmPattern[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [types, setTypes] = useState<PatternType[]>([]);
  const rules = getDetectionRules();

  useEffect(() => {
    getCvmPatterns({ operators, types }).then(setPatterns);
  }, [operators, types]);

  const toggleOp = (op: Operator) =>
    setOperators((cur) => (cur.includes(op) ? cur.filter((o) => o !== op) : [...cur, op]));
  const toggleType = (t: PatternType) =>
    setTypes((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

  const counts = useMemo(
    () => ({
      confirmed: patterns.filter((p) => p.status === 'confirmed').length,
      emerging: patterns.filter((p) => p.status === 'emerging').length,
    }),
    [patterns],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
          CVM Patterns <ExampleDataPill className="ml-2 align-middle" />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          Automatic detections of how competitors stimulate, retain and win back customers — each
          pattern is backed by real message evidence.{' '}
          <Link to="/strategy" className="font-medium text-brand hover:underline">
            Read the detection strategy →
          </Link>
        </p>
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap items-center gap-3 text-[13px]">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 font-medium text-text-primary">
          <Radar className="h-3.5 w-3.5 text-brand" />
          {patterns.length} patterns detected
        </span>
        <span className="text-text-secondary">
          <strong className="tnum text-success">{counts.confirmed}</strong> confirmed ·{' '}
          <strong className="tnum text-warn">{counts.emerging}</strong> emerging
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['zain', 'orange', 'umniah'] as Operator[]).map((op) => (
          <button
            key={op}
            onClick={() => toggleOp(op)}
            className={cn(
              'rounded-full transition-all',
              operators.length === 0 || operators.includes(op)
                ? 'opacity-100'
                : 'opacity-40 hover:opacity-70',
            )}
          >
            <OperatorBadge operator={op} />
          </button>
        ))}
        <span className="mx-1 h-5 w-px bg-hairline" />
        {(Object.keys(PATTERN_META) as PatternType[]).map((t) => {
          const meta = PATTERN_META[t];
          const Icon = meta.icon;
          const active = types.length === 0 || types.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-3 py-1.5 text-xs font-medium text-text-secondary transition-all hover:border-text-muted',
                !active && 'opacity-40',
              )}
            >
              <Icon className={cn('h-3.5 w-3.5', meta.color)} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Pattern cards */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {patterns.map((p, i) => {
            const meta = PATTERN_META[p.type];
            const Icon = meta.icon;
            const rule = rules.find((r) => r.type === p.type);
            return (
              <motion.article
                key={p.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.05, duration: 0.3, ease: 'easeOut' }}
                className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-subtle px-2 py-1 text-xs font-semibold text-text-primary">
                    <Icon className={cn('h-3.5 w-3.5', meta.color)} />
                    {meta.label}
                  </span>
                  <OperatorBadge operator={p.operator} />
                  <SegmentBadge segment={p.segment} />
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize',
                      STATUS_STYLE[p.status],
                    )}
                  >
                    {p.status}
                  </span>
                  <span className="ml-auto text-xs text-text-muted tnum">
                    {fmtDate(p.firstDetected)} → {fmtDate(p.lastDetected)} · {p.occurrences}×
                  </span>
                </div>

                <h3 className="mt-3 font-display text-[17px] font-semibold text-text-primary">
                  {p.title}
                </h3>
                <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-text-secondary">
                  {p.summary}
                </p>

                {p.metric && (
                  <div className="mt-3 inline-flex flex-wrap items-center gap-2 rounded-lg border border-hairline bg-subtle/60 px-3 py-2 text-xs">
                    <span className="font-medium text-text-muted">{p.metric.label}</span>
                    <span className="tnum text-text-secondary line-through">{p.metric.before}</span>
                    <ArrowRight className="h-3 w-3 text-text-muted" />
                    <span className="tnum font-semibold text-brand">{p.metric.after}</span>
                  </div>
                )}

                {/* Evidence */}
                <div className="mt-3 space-y-1.5">
                  {p.sampleBodies.map((body, j) => (
                    <div
                      key={j}
                      dir="auto"
                      className="rounded-lg border border-hairline bg-canvas px-3 py-2 text-[13px] leading-relaxed text-text-secondary"
                    >
                      {body}
                    </div>
                  ))}
                  <div className="text-[11px] text-text-muted tnum">
                    Evidence: {p.evidenceSmsIds.length} messages ({p.evidenceSmsIds.join(', ')})
                  </div>
                </div>

                <div className="mt-3 flex items-end justify-between gap-4 border-t border-hairline pt-3">
                  <div className="w-40">
                    <ConfidenceMeter value={p.confidence} />
                  </div>
                  {rule && (
                    <p className="text-right text-[11px] italic text-text-muted">
                      Signal: {rule.signal}
                    </p>
                  )}
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
        {patterns.length === 0 && (
          <div className="rounded-xl border border-dashed border-hairline bg-surface p-10 text-center text-sm text-text-muted">
            No patterns match these filters.
          </div>
        )}
      </div>

      <div className="rounded-xl border border-info/25 bg-info/5 p-4 text-[13px] text-text-secondary">
        <strong className="text-text-primary">Note:</strong> patterns marked{' '}
        <em>emerging</em> have weak evidence (1–2 occurrences) — treat them as hypotheses to watch,
        not facts. A pattern becomes <em>confirmed</em> after 3+ consistent occurrences.
      </div>
    </div>
  );
}
