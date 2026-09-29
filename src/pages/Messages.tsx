import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
} from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  getMessages,
  getOffers,
  getSims,
  operatorFromSender,
  type Offer,
  type Operator,
  type SimProfile,
  type SmsRaw,
} from '@/lib/data';
import { OperatorBadge, EmptyState } from '@/components/shared';
import { MessageDetailDrawer } from '@/components/messages/MessageDetailDrawer';
import { cn } from '@/lib/utils';

const AR_RE = /[؀-ۿ]/;
const PAGE_SIZE = 20;

const OPS: { id: Operator; label: string; active: string }[] = [
  { id: 'zain', label: 'Zain', active: 'bg-zain-soft text-zain border-zain/30' },
  { id: 'orange', label: 'Orange', active: 'bg-orange-soft text-orange border-orange/30' },
  { id: 'umniah', label: 'Umniah', active: 'bg-umniah-soft text-success border-umniah/30' },
];

type Lang = 'all' | 'ar' | 'en';

interface Filters {
  operators: Operator[];
  simSlot?: number;
  range?: DateRange;
  keyword: string;
  lang: Lang;
}

const EMPTY: Filters = { operators: [], keyword: '', lang: 'all' };

function isArabic(m: SmsRaw) {
  return AR_RE.test(m.body);
}

function applyFilters(rows: SmsRaw[], f: Filters, skipOps = false): SmsRaw[] {
  let out = rows;
  if (!skipOps && f.operators.length)
    out = out.filter((m) => {
      const op = operatorFromSender(m.sender);
      return op !== 'unknown' && f.operators.includes(op);
    });
  if (f.simSlot) out = out.filter((m) => m.sim_slot === f.simSlot);
  if (f.range?.from) {
    const from = startOfDay(f.range.from).getTime();
    const to = endOfDay(f.range.to ?? f.range.from).getTime();
    out = out.filter((m) => {
      const t = new Date(m.received_stamp).getTime();
      return t >= from && t <= to;
    });
  }
  if (f.keyword) {
    const k = f.keyword.toLowerCase();
    out = out.filter(
      (m) => m.body.toLowerCase().includes(k) || m.sender.toLowerCase().includes(k),
    );
  }
  if (f.lang !== 'all') out = out.filter((m) => (f.lang === 'ar' ? isArabic(m) : !isArabic(m)));
  return out;
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  for (;;) {
    const idx = lower.indexOf(q, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    parts.push(text.slice(i, idx));
    parts.push(
      <mark key={k++} className="rounded-sm bg-yellow-100 px-0">
        {text.slice(idx, idx + q.length)}
      </mark>,
    );
    i = idx + q.length;
  }
  return <>{parts}</>;
}

function exportCsv(rows: SmsRaw[], offerBySms: Map<string, Offer>) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = ['id', 'sender', 'body', 'sent_stamp', 'received_stamp', 'sim_slot', 'device', 'inserted_at', 'offer'];
  const lines = rows.map((m) =>
    [
      m.id,
      m.sender,
      esc(m.body),
      m.sent_stamp,
      m.received_stamp,
      String(m.sim_slot),
      m.device,
      m.inserted_at,
      esc(offerBySms.get(m.id)?.title ?? ''),
    ].join(','),
  );
  const blob = new Blob(['﻿' + [header.join(','), ...lines].join('\n')], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'competitor-pulse-messages.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Messages() {
  const [searchParams] = useSearchParams();
  const [all, setAll] = useState<SmsRaw[]>([]);
  const [sims, setSims] = useState<SimProfile[]>([]);
  const [offerBySms, setOfferBySms] = useState<Map<string, Offer>>(new Map());
  const [filters, setFilters] = useState<Filters>(() => ({
    ...EMPTY,
    keyword: searchParams.get('q') ?? '',
    operators: searchParams.get('operator')
      ? (searchParams.get('operator')!.split(',') as Operator[])
      : [],
    simSlot: searchParams.get('sim') ? Number(searchParams.get('sim')) : undefined,
  }));
  const [page, setPage] = useState(1);
  const [drawerIndex, setDrawerIndex] = useState(-1);
  const [exported, setExported] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getMessages().then((rows) =>
      setAll([...rows].sort((a, b) => b.received_stamp.localeCompare(a.received_stamp))),
    );
    getSims().then(setSims);
    getOffers().then((offers) => {
      const map = new Map<string, Offer>();
      for (const o of offers) map.set(o.sourceSmsId, o);
      setOfferBySms(map);
    });
  }, []);

  const filtered = useMemo(() => applyFilters(all, filters), [all, filters]);
  const opCounts = useMemo(() => {
    const base = applyFilters(all, filters, true);
    const counts: Record<Operator, number> = { zain: 0, orange: 0, umniah: 0 };
    for (const m of base) {
      const op = operatorFromSender(m.sender);
      if (op !== 'unknown') counts[op]++;
    }
    return counts;
  }, [all, filters]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const set = (patch: Partial<Filters>) => setFilters((f) => ({ ...f, ...patch }));
  const toggleOp = (op: Operator) =>
    set({
      operators: filters.operators.includes(op)
        ? filters.operators.filter((o) => o !== op)
        : [...filters.operators, op],
    });
  const reset = () => setFilters(EMPTY);
  const hasFilters =
    filters.operators.length > 0 ||
    filters.simSlot != null ||
    filters.keyword !== '' ||
    filters.lang !== 'all' ||
    !!filters.range?.from;

  const simLabel = (slot: number) => {
    const s = sims.find((x) => x.sim_slot === slot);
    return s ? `SIM ${slot} · ${s.device}` : `SIM ${slot}`;
  };

  // Keyboard: '/' focuses search; ←/→ navigate when drawer open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
      if (e.key === '/' && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (drawerIndex >= 0 && !typing) {
        if (e.key === 'ArrowLeft' && drawerIndex > 0) setDrawerIndex(drawerIndex - 1);
        if (e.key === 'ArrowRight' && drawerIndex < filtered.length - 1)
          setDrawerIndex(drawerIndex + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerIndex, filtered.length]);

  const onExport = () => {
    exportCsv(filtered, offerBySms);
    setExported(true);
    window.setTimeout(() => setExported(false), 1200);
  };

  const setPreset = (days: number) => {
    const now = new Date();
    set({ range: { from: days === 0 ? now : subDays(now, days), to: now } });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
            Messages
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Raw marketing SMS received by your SIMs ·{' '}
            <span className="tnum">{all.length} messages</span> (example data)
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExport}>
          {exported ? (
            <>
              <Check className="h-3.5 w-3.5 text-success" /> Exported ✓
            </>
          ) : (
            <>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </>
          )}
        </Button>
      </div>

      {/* FilterBar */}
      <div className="sticky top-14 z-20 -mx-2 space-y-2 bg-canvas/95 px-2 py-2 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
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
              {op.label} <span className="tnum ml-1 opacity-70">{opCounts[op.id]}</span>
            </button>
          ))}
          <Select
            value={filters.simSlot ? String(filters.simSlot) : 'all'}
            onValueChange={(v) => set({ simSlot: v === 'all' ? undefined : Number(v) })}
          >
            <SelectTrigger className="h-8 w-[150px] text-xs">
              <SelectValue placeholder="All SIMs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SIMs</SelectItem>
              <SelectItem value="1">SIM 1 · Zain</SelectItem>
              <SelectItem value="2">SIM 2 · Orange</SelectItem>
              <SelectItem value="3">SIM 3 · Umniah</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
                <CalendarIcon className="h-3.5 w-3.5" />
                {filters.range?.from
                  ? `${format(filters.range.from, 'dd MMM')} – ${
                      filters.range.to ? format(filters.range.to, 'dd MMM') : '…'
                    }`
                  : 'Date range'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="flex gap-1 border-b border-hairline p-2">
                {[
                  ['Today', 0],
                  ['7d', 7],
                  ['14d', 14],
                  ['30d', 30],
                ].map(([label, d]) => (
                  <Button
                    key={label as string}
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setPreset(d as number)}
                  >
                    {label}
                  </Button>
                ))}
              </div>
              <Calendar
                mode="range"
                selected={filters.range}
                onSelect={(r) => set({ range: r })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <Input
              ref={searchRef}
              value={filters.keyword}
              onChange={(e) => set({ keyword: e.target.value })}
              placeholder="Search body or sender…  ( / )"
              className="h-8 w-56 pl-8 text-xs"
            />
          </div>
          <Select value={filters.lang} onValueChange={(v) => set({ lang: v as Lang })}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All languages</SelectItem>
              <SelectItem value="ar">Arabic</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs text-text-muted" onClick={reset}>
              Reset
            </Button>
          )}
        </div>

        {/* Active filter chips */}
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {filters.operators.map((op) => (
              <Chip key={op} label={op} onRemove={() => toggleOp(op)} />
            ))}
            {filters.simSlot != null && (
              <Chip
                key="sim"
                label={`SIM ${filters.simSlot}`}
                onRemove={() => set({ simSlot: undefined })}
              />
            )}
            {filters.range?.from && (
              <Chip
                key="range"
                label={`${format(filters.range.from, 'dd MMM')} – ${
                  filters.range.to ? format(filters.range.to, 'dd MMM') : '…'
                }`}
                onRemove={() => set({ range: undefined })}
              />
            )}
            {filters.keyword && (
              <Chip
                key="kw"
                label={`“${filters.keyword}”`}
                onRemove={() => set({ keyword: '' })}
              />
            )}
            {filters.lang !== 'all' && (
              <Chip
                key="lang"
                label={filters.lang === 'ar' ? 'Arabic' : 'English'}
                onRemove={() => set({ lang: 'all' })}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState title="No messages match these filters" onReset={reset} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <Table>
            <TableHeader className="sticky top-0 bg-surface">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-10 w-36 text-xs">Sender</TableHead>
                <TableHead className="h-10 text-xs">Message</TableHead>
                <TableHead className="h-10 w-36 text-xs">SIM</TableHead>
                <TableHead className="h-10 w-32 text-xs">Sent</TableHead>
                <TableHead className="h-10 w-28 text-xs">Received</TableHead>
                <TableHead className="h-10 w-44 text-xs">Offer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence initial={true}>
                {pageRows.map((m, i) => {
                  const op = operatorFromSender(m.sender);
                  const offer = offerBySms.get(m.id);
                  const ar = isArabic(m);
                  return (
                    <motion.tr
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: page === 1 ? i * 0.025 : 0,
                        duration: 0.2,
                        layout: { type: 'spring', stiffness: 500, damping: 40 },
                      }}
                      onClick={() => setDrawerIndex(filtered.indexOf(m))}
                      className="h-11 cursor-pointer border-b border-hairline hover:bg-subtle"
                    >
                      <TableCell className="py-1.5">
                        <div className="flex flex-col gap-0.5">
                          <OperatorBadge operator={op} />
                          <span className="text-[11px] text-text-muted">{m.sender}</span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-md py-1.5">
                        <div className="flex items-start gap-1.5">
                          {ar && (
                            <span className="mt-0.5 shrink-0 rounded border border-hairline bg-subtle px-1 text-[10px] font-semibold text-text-muted">
                              AR
                            </span>
                          )}
                          <span
                            dir="auto"
                            lang={ar ? 'ar' : 'en'}
                            className="line-clamp-2 text-[13.5px] text-text-primary"
                          >
                            <Highlight text={m.body} query={filters.keyword} />
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-1.5 text-xs text-text-secondary">
                        {simLabel(m.sim_slot)}
                      </TableCell>
                      <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                        {format(new Date(m.sent_stamp), 'dd MMM, HH:mm')}
                      </TableCell>
                      <TableCell className="tnum py-1.5 text-xs text-text-secondary">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              {formatDistanceToNow(new Date(m.received_stamp), {
                                addSuffix: true,
                              })}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {format(new Date(m.received_stamp), 'dd MMM yyyy, HH:mm')}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="py-1.5">
                        {offer ? (
                          <span className="inline-block max-w-40 truncate rounded-md bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                            {offer.title}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">—</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t border-hairline px-4 py-2.5">
            <span className="tnum text-xs text-text-muted">
              Showing {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="tnum text-xs text-text-secondary">
                {page} / {pageCount}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={page >= pageCount}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <MessageDetailDrawer
        messages={filtered}
        index={drawerIndex}
        open={drawerIndex >= 0}
        onOpenChange={(o) => {
          if (!o) setDrawerIndex(-1);
        }}
        onNavigate={setDrawerIndex}
      />
    </div>
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
      className="inline-flex items-center gap-1 rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-xs capitalize text-text-secondary"
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
