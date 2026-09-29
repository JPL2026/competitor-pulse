import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronRight, Sparkles, ThumbsDown, ThumbsUp } from 'lucide-react';
import { operatorFromSender, type Insight, type SmsRaw } from '@/lib/data';
import { MessageCell, OperatorBadge } from '@/components/shared';
import { cn } from '@/lib/utils';

export type InsightCategory = 'Pricing' | 'Timing' | 'Segmentation' | 'Volume' | 'New behavior';

function confidenceLabel(v: number) {
  if (v >= 0.85) return 'High confidence';
  if (v >= 0.7) return 'Medium confidence';
  return 'Low confidence';
}

interface InsightCardProps {
  insight: Insight;
  category: InsightCategory;
  evidence: SmsRaw[];
  feedback: 'up' | 'down' | null;
  onFeedback: (id: string, value: 'up' | 'down') => void;
  onOpenMessage: (m: SmsRaw) => void;
}

export function InsightCard({
  insight,
  category,
  evidence,
  feedback,
  onFeedback,
  onOpenMessage,
}: InsightCardProps) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(insight.confidence * 100);
  const barColor =
    insight.confidence >= 0.85 ? 'bg-brand' : insight.confidence >= 0.7 ? 'bg-warn' : 'bg-danger/70';

  return (
    <div className="relative overflow-hidden rounded-xl border border-hairline bg-surface p-5 pl-6 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      {/* accent spine */}
      <span className="absolute inset-y-0 left-0 w-[3px] bg-info" />

      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-info" />
        <span className="rounded-full border border-info/30 bg-info/5 px-2.5 py-0.5 text-[11px] font-medium text-info">
          {category}
        </span>
      </div>

      <p className="mt-3 text-base font-medium leading-relaxed text-text-primary">
        {insight.body}
      </p>

      {/* Confidence */}
      <div className="mt-4 flex items-center gap-3">
        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-subtle">
          <motion.div
            className={cn('h-full rounded-full', barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
          />
        </div>
        <span className="tnum text-xs text-text-secondary">
          {confidenceLabel(insight.confidence)} · {insight.confidence.toFixed(2)}
        </span>
      </div>

      {/* Evidence accordion */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="mt-4 flex items-center gap-1 text-[13px] font-medium text-info hover:underline"
        aria-expanded={open}
      >
        Based on {evidence.length} message{evidence.length === 1 ? '' : 's'}
        <ChevronRight
          className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-90')}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="mt-2 space-y-1.5">
              {evidence.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.2 }}
                  className="flex items-center gap-3 rounded-lg border border-hairline bg-subtle/60 px-3 py-2"
                >
                  <OperatorBadge operator={operatorFromSender(m.sender)} />
                  <MessageCell message={m} onClick={onOpenMessage} className="min-w-0 flex-1" />
                  <span className="tnum shrink-0 text-xs text-text-muted">
                    {format(new Date(m.received_stamp), 'dd MMM')}
                  </span>
                </motion.li>
              ))}
              {evidence.length === 0 && (
                <li className="rounded-lg border border-dashed border-hairline px-3 py-2 text-xs text-text-muted">
                  Supporting messages aren't included in the example dataset.
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between border-t border-hairline pt-3">
        <span className="tnum text-xs text-text-muted">
          First detected {format(new Date(insight.createdAt), 'dd MMM')} · Last updated{' '}
          {format(new Date(insight.createdAt), 'dd MMM')}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Helpful"
            onClick={() => onFeedback(insight.id, 'up')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              feedback === 'up'
                ? 'bg-brand-soft text-brand'
                : 'text-text-muted hover:bg-subtle hover:text-text-secondary',
            )}
          >
            <ThumbsUp className={cn('h-3.5 w-3.5', feedback === 'up' && 'fill-current')} />
          </button>
          <button
            type="button"
            aria-label="Not helpful"
            onClick={() => onFeedback(insight.id, 'down')}
            className={cn(
              'rounded-md p-1.5 transition-colors',
              feedback === 'down'
                ? 'bg-red-50 text-danger'
                : 'text-text-muted hover:bg-subtle hover:text-text-secondary',
            )}
          >
            <ThumbsDown className={cn('h-3.5 w-3.5', feedback === 'down' && 'fill-current')} />
          </button>
        </div>
      </div>
    </div>
  );
}
