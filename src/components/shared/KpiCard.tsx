import type { ReactNode } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  delta,
  deltaUp,
  spark,
  subtitle,
  icon: Icon,
  children,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaUp?: boolean;
  spark?: { date: string; count: number }[];
  subtitle?: string;
  icon?: typeof TrendingUp;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      {/* Header: icon tile + label */}
      <div className="flex items-center gap-2.5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-soft">
            <Icon className="h-4 w-4 text-brand" />
          </span>
        )}
        <p
          className="truncate text-xs font-semibold uppercase tracking-wide text-text-muted"
          title={label}
        >
          {label}
        </p>
      </div>

      {/* Value + sparkline */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="tnum font-display text-[34px] font-semibold leading-none tracking-tight text-text-primary">
          {value}
        </div>
        {spark && (
          <div className="h-9 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={spark}>
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#0F766E"
                  strokeWidth={1.5}
                  dot={false}
                  isAnimationActive
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Footnote: trend + subtitle, one compact line each */}
      <div className="mt-3 space-y-1">
        {delta && (
          <p
            className={cn(
              'flex items-center gap-1 truncate text-xs font-medium',
              deltaUp ? 'text-success' : 'text-text-muted',
            )}
            title={delta}
          >
            {deltaUp ? (
              <TrendingUp className="h-3 w-3 shrink-0" />
            ) : (
              <TrendingDown className="h-3 w-3 shrink-0" />
            )}
            {delta}
          </p>
        )}
        {subtitle && <p className="truncate text-xs text-text-muted">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}
