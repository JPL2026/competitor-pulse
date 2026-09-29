import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowUpRight, Clock, Play, Plus, Square, TrendingUp } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Offer, TimelineEvent, TimelineEventType } from '@/lib/data';
import { OperatorBadge, SegmentTag } from '@/components/shared';

export const TYPE_META: Record<
  TimelineEventType,
  { label: string; icon: LucideIcon; color: string; bg: string }
> = {
  offer_new: { label: 'New offer', icon: Plus, color: '#0F766E', bg: '#F0FDFA' },
  price_change: { label: 'Price change', icon: TrendingUp, color: '#B45309', bg: '#FEF3C7' },
  campaign_start: { label: 'Campaign start', icon: Play, color: '#2E7D5B', bg: '#E4F3EB' },
  campaign_end: { label: 'Campaign end', icon: Square, color: '#57534E', bg: '#F3F1ED' },
  offer_expired: { label: 'Offer expired', icon: Clock, color: '#B91C1C', bg: '#FEF2F2' },
};

/** Parse "3 → 4 JOD" style price deltas out of the event text. */
function parsePriceDelta(text: string): { from: string; to: string; pct: number } | null {
  const m = text.match(/(\d+(?:\.\d+)?)\s*→\s*(\d+(?:\.\d+)?)\s*JOD/);
  if (!m) return null;
  const from = parseFloat(m[1]);
  const to = parseFloat(m[2]);
  if (!from) return null;
  return { from: m[1], to: m[2], pct: Math.round(((to - from) / from) * 100) };
}

export function EventNode({
  event,
  offer,
  index,
  onSourceSms,
  onViewCampaign,
}: {
  event: TimelineEvent;
  offer?: Offer;
  index: number;
  onSourceSms: (smsId: string) => void;
  onViewCampaign: (campaignId: string) => void;
}) {
  const meta = TYPE_META[event.type];
  const Icon = meta.icon;
  const delta = event.type === 'price_change' ? parsePriceDelta(event.text) : null;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="relative mb-3 pl-10"
    >
      {/* Spine dot */}
      <span
        className="absolute left-0 top-3 flex h-6 w-6 items-center justify-center rounded-full border border-hairline"
        style={{ backgroundColor: meta.bg, color: meta.color }}
      >
        <Icon className="h-3 w-3" />
      </span>

      <div className="group rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <p className="text-sm text-text-primary">
          <span className="font-semibold">{meta.label}</span>
          <span className="text-text-muted"> — </span>
          {delta ? (
            <>
              {event.text.slice(0, event.text.indexOf(delta.from))}
              <span className="tnum text-text-muted line-through">{delta.from}</span>
              <span className="text-text-muted"> → </span>
              <span className="tnum font-semibold text-brand">{delta.to} JOD</span>
            </>
          ) : (
            event.text
          )}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <OperatorBadge operator={event.operator} />
          <span className="tnum text-xs text-text-muted">
            {format(new Date(event.timestamp), 'HH:mm')}
          </span>
          {offer && <SegmentTag segment={offer.segment} />}
          {delta && (
            <span
              className="tnum inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                color: delta.pct >= 0 ? '#B45309' : '#0F766E',
                backgroundColor: delta.pct >= 0 ? '#FEF3C7' : '#F0FDFA',
              }}
            >
              {delta.pct >= 0 ? '+' : ''}
              {delta.pct}% price
            </span>
          )}
        </div>

        {(offer || event.relatedId?.startsWith('cmp')) && (
          <div className="mt-2.5 border-t border-hairline pt-2">
            {offer && (
              <button
                type="button"
                onClick={() => onSourceSms(offer.sourceSmsId)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-2 transition-all group-hover:underline"
              >
                Source SMS
                <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
            {event.relatedId?.startsWith('cmp') && (
              <button
                type="button"
                onClick={() => onViewCampaign(event.relatedId!)}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand underline-offset-2 transition-all group-hover:underline"
              >
                View campaign
                <ArrowUpRight className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </motion.li>
  );
}
