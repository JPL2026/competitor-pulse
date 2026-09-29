import { cn } from '@/lib/utils';

type Status = 'active' | 'paused' | 'ended' | 'expired';

const STYLES: Record<Status, string> = {
  active: 'bg-umniah-soft text-umniah',
  paused: 'bg-amber-100 text-warn',
  ended: 'bg-stone-200 text-text-secondary',
  expired: 'bg-red-50 text-danger',
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
        STYLES[status],
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
