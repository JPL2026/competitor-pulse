import { cn } from '@/lib/utils';

/** Small amber pill marking pages that still show example (mock) data. */
export function ExampleDataPill({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-warn/40 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-warn',
        className,
      )}
    >
      Example data
    </span>
  );
}
