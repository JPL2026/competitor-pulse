import { Button } from '@/components/ui/button';

export function EmptyState({
  title = 'No results for these filters',
  onReset,
}: {
  title?: string;
  onReset?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <img src="/empty-inbox.svg" alt="" className="h-32 w-44 opacity-80" />
      <p className="text-sm font-medium text-text-secondary">{title}</p>
      {onReset && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-brand">
          Reset filters
        </Button>
      )}
    </div>
  );
}
