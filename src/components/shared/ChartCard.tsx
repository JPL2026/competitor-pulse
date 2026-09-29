import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ChartCard({
  title,
  legend,
  children,
  className,
}: {
  title: string;
  legend?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-text-primary">{title}</h3>
        {legend}
      </div>
      {children}
    </div>
  );
}
