import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Search, X } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Operator } from '@/lib/data';
import { cn } from '@/lib/utils';

export interface FilterBarValue {
  operators: Operator[];
  simSlot?: number;
  range?: DateRange;
  keyword: string;
}

const OPS: { id: Operator; label: string; active: string }[] = [
  { id: 'zain', label: 'Zain', active: 'bg-zain-soft text-zain border-zain/30' },
  { id: 'orange', label: 'Orange', active: 'bg-orange-soft text-orange border-orange/30' },
  { id: 'umniah', label: 'Umniah', active: 'bg-umniah-soft text-umniah border-umniah/30' },
];

export function FilterBar({
  value,
  onChange,
  className,
}: {
  value: FilterBarValue;
  onChange: (v: FilterBarValue) => void;
  className?: string;
}) {
  const [calOpen, setCalOpen] = useState(false);
  const toggleOp = (op: Operator) =>
    onChange({
      ...value,
      operators: value.operators.includes(op)
        ? value.operators.filter((o) => o !== op)
        : [...value.operators, op],
    });
  const reset = () => onChange({ operators: [], keyword: '' });
  const hasFilters =
    value.operators.length > 0 || value.simSlot != null || value.keyword || value.range?.from;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex flex-wrap items-center gap-2">
        {OPS.map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => toggleOp(op.id)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
              value.operators.includes(op.id)
                ? op.active
                : 'border-hairline bg-surface text-text-secondary hover:bg-subtle',
            )}
          >
            {op.label}
          </button>
        ))}
        <Select
          value={value.simSlot ? String(value.simSlot) : 'all'}
          onValueChange={(v) =>
            onChange({ ...value, simSlot: v === 'all' ? undefined : Number(v) })
          }
        >
          <SelectTrigger className="h-8 w-[130px] text-xs">
            <SelectValue placeholder="All SIMs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All SIMs</SelectItem>
            <SelectItem value="1">SIM 1 · Zain</SelectItem>
            <SelectItem value="2">SIM 2 · Orange</SelectItem>
            <SelectItem value="3">SIM 3 · Umniah</SelectItem>
          </SelectContent>
        </Select>
        <Popover open={calOpen} onOpenChange={setCalOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
              <CalendarIcon className="h-3.5 w-3.5" />
              {value.range?.from
                ? `${format(value.range.from, 'dd MMM')} – ${
                    value.range.to ? format(value.range.to, 'dd MMM') : '…'
                  }`
                : 'Date range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={value.range}
              onSelect={(r) => onChange({ ...value, range: r })}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
          <Input
            value={value.keyword}
            onChange={(e) => onChange({ ...value, keyword: e.target.value })}
            placeholder="Search messages…"
            className="h-8 w-48 pl-8 text-xs"
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-text-muted" onClick={reset}>
            Reset
          </Button>
        )}
      </div>
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {value.operators.map((op) => (
            <Chip key={op} label={op} onRemove={() => toggleOp(op)} />
          ))}
          {value.simSlot != null && (
            <Chip
              label={`SIM ${value.simSlot}`}
              onRemove={() => onChange({ ...value, simSlot: undefined })}
            />
          )}
          {value.range?.from && (
            <Chip
              label={`${format(value.range.from, 'dd MMM')} – ${
                value.range.to ? format(value.range.to, 'dd MMM') : '…'
              }`}
              onRemove={() => onChange({ ...value, range: undefined })}
            />
          )}
          {value.keyword && (
            <Chip label={`“${value.keyword}”`} onRemove={() => onChange({ ...value, keyword: '' })} />
          )}
        </div>
      )}
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-subtle px-2.5 py-1 text-xs capitalize text-text-secondary">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label} filter`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
