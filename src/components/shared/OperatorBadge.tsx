import type { Operator } from '@/lib/data';
import { cn } from '@/lib/utils';

const STYLES: Record<Operator | 'unknown', { bg: string; text: string; label: string; logo: string | null }> = {
  zain: { bg: 'bg-zain-soft', text: 'text-zain', label: 'Zain', logo: import.meta.env.BASE_URL + 'logos/zain.png' },
  orange: { bg: 'bg-orange-soft', text: 'text-orange', label: 'Orange', logo: import.meta.env.BASE_URL + 'logos/orange.png' },
  umniah: { bg: 'bg-umniah-soft', text: 'text-umniah', label: 'Umniah', logo: import.meta.env.BASE_URL + 'logos/umniah.png' },
  unknown: { bg: 'bg-subtle', text: 'text-text-muted', label: 'Unknown', logo: null },
};

export function OperatorBadge({
  operator,
  className,
}: {
  operator: Operator | 'unknown';
  className?: string;
}) {
  const s = STYLES[operator] ?? STYLES.unknown;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        s.bg,
        s.text,
        className,
      )}
    >
      {s.logo ? (
        <img src={s.logo} alt="" className="h-3.5 w-3.5 rounded-sm object-contain" />
      ) : (
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
      )}
      {s.label}
    </span>
  );
}

export const OPERATOR_LABELS: Record<Operator | 'unknown', string> = {
  zain: 'Zain',
  orange: 'Orange',
  umniah: 'Umniah',
  unknown: 'Unknown',
};
