import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  GitCompareArrows,
  LayoutGrid,
  Table2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getMessages,
  getOffers,
  type Offer,
  type Operator,
  type Segment,
  type SmsRaw,
} from '@/lib/data';
import {
  OperatorBadge,
  StatusPill,
  ConfidenceMeter,
  SegmentTag,
  EmptyState,
  ExampleDataPill,
  MessageDrawer,
  OPERATOR_LABELS,
} from '@/components/shared';
import { OfferCard } from '@/components/offers/OfferCard';
import { CompareDrawer } from '@/components/offers/CompareDrawer';
import { cn } from '@/lib/utils';

const OPS: { id: Operator; label: string; active: string }[] = [
  { id: 'zain', label: 'Zain', active: 'bg-zain-soft text-zain border-zain/30' },
  { id: 'orange', label: 'Orange', active: 'bg-orange-soft text-orange border-orange/30' },
  { id: 'umniah', label: 'Umniah', active: 'bg-umniah-soft text-umniah border-umniah/30' },
];

const SEGMENTS: Segment[] = ['Youth', 'Student', 'Family', 'General', 'High-value'];

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'data-desc' | 'confidence-desc';
type View = 'cards' | 'table';

interface Filters {
  operators: Operator[];
  segments: Segment[];
  status: 'all' | 'active' | 'expired';
  maxPrice: number;
  minData: number;
  sort: SortKey;
}

const EMPTY: Filters = {
  operators: [],
  segments: [],
  status: 'all',
  maxPrice: 15,
  minData: 0,
  sort: 'newest',
};

type ColKey = 'operator' | 'title' | 'priceJod' | 'dataGb' | 'validityDays' | 'unit' | 'segment' | 'confidence' | 'status' | 'firstSeen';

function sortOffers(rows: Offer[], sort: SortKey): Offer[] {
  const out = [...rows];
  switch (sort) {
    case 'newest':
      return out.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
    case 'price-asc':
      return out.sort((a, b) => a.priceJod - b.priceJod);
    case 'price-desc':
      return out.sort((a, b) => b.priceJod - a.priceJod);
    case 'data-desc':
      return out.sort((a, b) => b.dataGb - a.dataGb);
    case 'confidence-desc':
      return out.sort((a, b) => b.confidence - a.confidence);
  }
}

export default function Offers() {
  const [searchParams] = useSearchParams();
  const [all, setAll] = useState<Offer[]>([]);
  const [smsById, setSmsById] = useState<Map<string, SmsRaw>>(new Map());
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY,
    operators: searchParams.get('operator')
      ? (searchParams.get('operator')!.split(',') as Operator[])
      : [],
  }));
  const [view, setView] = useState<View>('cards');
  const [compareOpen, setCompareOpen] = useState(false);
  const [sourceMsg, setSourceMsg] = useState<SmsRaw | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [colSort, setColSort] = useState<{ key: ColKey; dir: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    getOffers().then(setAll);
    getMessages().then((rows) => {
      const map = new Map<string, SmsRaw>();
      for (const m of rows) map.set(m.id, m);
      setSmsById(map);
    });
  }, []);

  const filtered = useMemo(() => {
    let rows = all;
    const f = filters;
    if (f.operators.length) rows = rows.filter((o) => f.operators.includes(o.operator));
    if (f.segments.length) rows = rows.filter((o) => f.segments.includes(o.segment));
    if (f.status !== 'all') rows = rows.filter((o) => o.status === f.status);
    rows = rows.filter((o) => o.priceJod <= f.maxPrice && o.dataGb >= f.minData);
    return sortOffers(rows, f.sort);
  }, [all, filters]);

  const tableRows = useMemo(() => {
    if (!colSort) return filtered;
    const { key, dir } = colSort;
    const mul = dir === 'asc' ? 1 : -1;
    const val = (o: Offer): string | number => {
      if (key === 'unit') return o.dataGb > 0 ? o.priceJod / o.dataGb : Infinity;
      return o[key] as string | number;
    };
    return [...filtered].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return typeof va === 'string'
        ? va.localeCompare(vb as string) * mul
        : (va - (vb as number)) * mul;
    });
  }, [filtered, colSort]);

  const stats = useMemo(() => {
    if (!filtered.length) return null;
    const avgPrice = filtered.reduce((s, o) => s + o.priceJod, 0) / filtered.length;
    const avgData = filtered.reduce((s, o) => s + o.dataGb, 0) / filtered.length;
    const cheapest = [...filtered]
      .filter((o) => o.dataGb > 0)
      .sort((a, b) => a.priceJod / a.dataGb - b.priceJod / b.dataGb)[0];
    const segCounts = new Map<Segment, number>();
    for (const o of filtered) segCounts.set(o.segment, (segCounts.get(o.segment) ?? 0) + 1);
    const topSegment = [...segCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { avgPrice, avgData, cheapest, topSegment };
  }, [filtered]);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggleOp = (op: Operator) =>
    set({
      operators: filters.operators.includes(op)
        ? filters.operators.filter((o) => o !== op)
        : [...filters.operators, op],
    });
  const toggleSegment = (s: Segment) =>
    set({
      segments: filters.segments.includes(s)
        ? filters.segments.filter((x) => x !== s)
        : [...filters.segments, s],
    });
  const reset = () => setFilters(EMPTY);
  const hasFilters =
    filters.operators.length > 0 ||
    filters.segments.length > 0 ||
    filters.status !== 'all' ||
    filters.maxPrice < 15 ||
    filters.minData > 0;

  const openSource = (offer: Offer) => {
    const msg = smsById.get(offer.sourceSmsId);
    if (msg) setSourceMsg(msg);
  };

  const cycleColSort = (key: ColKey) =>
    setColSort((cur) =>
      !cur || cur.key !== key
        ? { key, dir: 'asc' }
        : cur.dir === 'asc'
          ? { key, dir: 'desc' }
          : null,
    );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
            Offers <ExampleDataPill className="ml-2 align-middle" />
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Structured offers extracted from competitor SMS ·{' '}
            <span className="tnum">{all.length} offers</span> (example data)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-hairline bg-surface p-0.5">
            {(
              [
                ['cards', LayoutGrid, 'Cards'],
                ['table', Table2, 'Table'],
              ] as const
            ).map(([v, Icon, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  view === v ? 'bg-subtle text-text-primary' : 'text-text-muted hover:text-text-secondary',
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => setCompareOpen(true)}
          >
            <GitCompareArrows className="h-3.5 w-3.5" /> Compare operators
          </Button>
        </div>
      </div>

      {/* FilterBar */}
      <div className="space-y-2 rounded-xl border border-hairline bg-surface p-3 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-1.5">
            {OPS.map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => toggleOp(op.id)}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                  filters.operators.includes(op.id)
                    ? op.active
                    : 'border-hairline bg-surface text-text-secondary hover:bg-subtle',
                )}
              >
                {op.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {SEGMENTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSegment(s)}
                className={cn(
                  'rounded-md border px-2 py-0.5 text-xs font-medium transition-colors',
                  filters.segments.includes(s)
                    ? 'border-brand/30 bg-brand-soft text-brand'
                    : 'border-hairline bg-surface text-text-secondary hover:bg-subtle',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <Select
            value={filters.status}
            onValueChange={(v) => set({ status: v as Filters['status'] })}
          >
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Price ≤</span>
            <Slider
              value={[filters.maxPrice]}
              onValueChange={([v]) => set({ maxPrice: v })}
              min={0}
              max={15}
              step={0.5}
              className="w-28"
            />
            <span className="tnum w-14 text-xs text-text-secondary">{filters.maxPrice} JOD</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Data ≥</span>
            <Slider
              value={[filters.minData]}
              onValueChange={([v]) => set({ minData: v })}
              min={0}
              max={50}
              step={1}
              className="w-28"
            />
            <span className="tnum w-12 text-xs text-text-secondary">{filters.minData} GB</span>
          </div>
          <Select value={filters.sort} onValueChange={(v) => set({ sort: v as SortKey })}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="price-asc">Price ↑</SelectItem>
              <SelectItem value="price-desc">Price ↓</SelectItem>
              <SelectItem value="data-desc">Data ↓</SelectItem>
              <SelectItem value="confidence-desc">Confidence ↓</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-text-muted" onClick={reset}>
              Reset
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {filters.operators.map((op) => (
              <Chip key={op} label={OPERATOR_LABELS[op]} onRemove={() => toggleOp(op)} />
            ))}
            {filters.segments.map((s) => (
              <Chip key={s} label={s} onRemove={() => toggleSegment(s)} />
            ))}
            {filters.status !== 'all' && (
              <Chip
                key="status"
                label={filters.status}
                onRemove={() => set({ status: 'all' })}
              />
            )}
            {filters.maxPrice < 15 && (
              <Chip
                key="price"
                label={`≤ ${filters.maxPrice} JOD`}
                onRemove={() => set({ maxPrice: 15 })}
              />
            )}
            {filters.minData > 0 && (
              <Chip
                key="data"
                label={`≥ ${filters.minData} GB`}
                onRemove={() => set({ minData: 0 })}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Summary strip */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Avg price" value={`${stats.avgPrice.toFixed(2)} JOD`} />
          <Stat label="Avg data" value={`${stats.avgData.toFixed(1)} GB`} />
          <Stat
            label="Cheapest JOD/GB"
            value={`${(stats.cheapest.priceJod / stats.cheapest.dataGb).toFixed(2)}`}
            sub={`${OPERATOR_LABELS[stats.cheapest.operator]} · ${stats.cheapest.title}`}
          />
          <Stat
            label="Most active segment"
            value={stats.topSegment[0]}
            sub={`${stats.topSegment[1]} offers`}
          />
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState title="No offers match these filters" onReset={reset} />
      ) : view === 'cards' ? (
        <motion.div layout className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((o, i) => (
              <OfferCard
                key={o.id}
                offer={o}
                index={i}
                highlighted={hoveredId === o.id}
                onSourceClick={openSource}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableHead label="Operator" k="operator" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Title" k="title" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Price (JOD)" k="priceJod" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Data (GB)" k="dataGb" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Validity" k="validityDays" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="JOD/GB" k="unit" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Segment" k="segment" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Confidence" k="confidence" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="Status" k="status" colSort={colSort} onSort={cycleColSort} />
                <SortableHead label="First seen" k="firstSeen" colSort={colSort} onSort={cycleColSort} />
                <TableHead className="h-10 w-12 text-xs">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((o) => (
                <TableRow key={o.id} className="h-11 hover:bg-subtle">
                  <TableCell className="py-1.5">
                    <OperatorBadge operator={o.operator} />
                  </TableCell>
                  <TableCell className="max-w-52 truncate py-1.5 text-[13.5px] font-medium text-text-primary">
                    {o.title}
                  </TableCell>
                  <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                    {o.priceJod}
                  </TableCell>
                  <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                    {o.dataGb}
                  </TableCell>
                  <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                    {o.validityDays}d
                  </TableCell>
                  <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                    {o.dataGb > 0 ? (o.priceJod / o.dataGb).toFixed(2) : '—'}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <SegmentTag segment={o.segment} />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <ConfidenceMeter value={o.confidence} />
                  </TableCell>
                  <TableCell className="py-1.5">
                    <StatusPill status={o.status} />
                  </TableCell>
                  <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                    {format(new Date(o.firstSeen), 'd MMM')}
                  </TableCell>
                  <TableCell className="py-1.5">
                    <button
                      type="button"
                      onClick={() => openSource(o)}
                      className="text-brand hover:underline"
                      aria-label={`Open source SMS for ${o.title}`}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>
      )}

      <CompareDrawer
        offers={filtered}
        open={compareOpen}
        onOpenChange={setCompareOpen}
        onHoverOffer={setHoveredId}
      />
      <MessageDrawer
        message={sourceMsg}
        open={sourceMsg !== null}
        onOpenChange={(o) => {
          if (!o) setSourceMsg(null);
        }}
      />
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="tnum mt-1 font-display text-xl font-semibold tracking-tight text-text-primary">
        {value}
      </p>
      {sub && <p className="mt-0.5 truncate text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function SortableHead({
  label,
  k,
  colSort,
  onSort,
}: {
  label: string;
  k: ColKey;
  colSort: { key: ColKey; dir: 'asc' | 'desc' } | null;
  onSort: (k: ColKey) => void;
}) {
  const active = colSort?.key === k;
  return (
    <TableHead className="h-10 text-xs">
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          'inline-flex items-center gap-1 font-medium hover:text-text-primary',
          active ? 'text-text-primary' : 'text-text-muted',
        )}
      >
        {label}
        {active ? (
          colSort.dir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </TableHead>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <motion.span
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 rounded-full border border-hairline bg-canvas px-2.5 py-0.5 text-xs capitalize text-text-secondary"
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="text-text-muted hover:text-text-primary"
        aria-label={`Remove filter ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </motion.span>
  );
}
