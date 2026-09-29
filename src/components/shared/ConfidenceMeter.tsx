import { cn } from '@/lib/utils';

export function ConfidenceMeter({ value, className }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? 'bg-brand' : value >= 0.7 ? 'bg-warn' : 'bg-danger/70';
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1 w-16 overflow-hidden rounded-full bg-subtle">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="tnum text-xs text-text-muted">{pct}%</span>
    </div>
  );
}
