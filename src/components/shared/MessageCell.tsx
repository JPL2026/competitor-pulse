import type { SmsRaw } from '@/lib/data';
import { cn } from '@/lib/utils';

/** Truncated SMS body cell; dir="auto" handles Arabic. Click opens MessageDrawer (handled by parent). */
export function MessageCell({
  message,
  onClick,
  className,
}: {
  message: SmsRaw;
  onClick?: (m: SmsRaw) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(message)}
      className={cn(
        'block max-w-full truncate text-left text-sm text-text-primary hover:text-brand',
        className,
      )}
    >
      <span dir="auto">{message.body}</span>
    </button>
  );
}
