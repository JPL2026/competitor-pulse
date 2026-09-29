import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Check, ExternalLink } from 'lucide-react';
import type { Offer } from '@/lib/data';
import { OperatorBadge, StatusPill, ConfidenceMeter, SegmentTag } from '@/components/shared';
import { cn } from '@/lib/utils';

export function OfferCard({
  offer,
  index,
  highlighted,
  onSourceClick,
}: {
  offer: Offer;
  index: number;
  highlighted?: boolean;
  onSourceClick: (offer: Offer) => void;
}) {
  const expired = offer.status === 'expired';
  const unit = offer.dataGb > 0 ? offer.priceJod / offer.dataGb : 0;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        delay: index * 0.05,
        duration: 0.25,
        layout: { type: 'spring', stiffness: 500, damping: 40 },
      }}
      className={cn(
        'flex flex-col rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-shadow hover:-translate-y-0.5 hover:shadow-md',
        expired && 'opacity-60',
        highlighted && 'ring-2 ring-brand',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <OperatorBadge operator={offer.operator} />
          <StatusPill status={offer.status} />
        </div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.2 + index * 0.04 }}
          style={{ transformOrigin: 'left' }}
        >
          <ConfidenceMeter value={offer.confidence} />
        </motion.div>
      </div>

      <h3 className="mt-3 text-[15px] font-semibold text-text-primary">{offer.title}</h3>
      <p className="mt-1 font-display text-lg font-semibold tracking-tight text-text-primary">
        <span className={cn(expired && 'line-through')}>{offer.priceJod} JOD</span>
        <span className="tnum ml-1.5 text-sm font-medium text-text-secondary">
          · {offer.dataGb}GB · {offer.validityDays} days
        </span>
      </p>
      <p className="tnum mt-0.5 text-xs text-text-muted">{unit.toFixed(2)} JOD/GB</p>

      <ul className="mt-3 space-y-1">
        {offer.benefits.map((b) => (
          <li key={b} className="flex items-center gap-1.5 text-[13px] text-text-secondary">
            <Check className="h-3.5 w-3.5 shrink-0 text-success" />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-3">
        <SegmentTag segment={offer.segment} />
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-hairline pt-3 text-xs text-text-muted">
        <span className="tnum">First seen {format(new Date(offer.firstSeen), 'd MMM')}</span>
        <button
          type="button"
          onClick={() => onSourceClick(offer)}
          className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
        >
          Source SMS <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}
