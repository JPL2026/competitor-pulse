import type { Segment } from '@/lib/data';
import { cn } from '@/lib/utils';

export function SegmentTag({ segment, className }: { segment: Segment; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border border-hairline px-2 py-0.5 text-xs font-medium text-text-secondary',
        className,
      )}
    >
      {segment}
    </span>
  );
}
