import { cn } from '@/lib/utils';
import type { SimSegment } from '@/lib/data';
import { SEGMENT_META } from '@/lib/data';

const STYLES: Record<SimSegment, string> = {
  v1_active: 'bg-brand-soft text-brand border-brand/30',
  v2_grace: 'bg-amber-50 text-warn border-warn/40',
  v3_winback: 'bg-zain-soft text-zain border-zain/30',
  payg: 'bg-slate-100 text-info border-info/30',
};

export function SegmentBadge({ segment, className }: { segment: SimSegment; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
        STYLES[segment],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {SEGMENT_META[segment].label}
    </span>
  );
}
