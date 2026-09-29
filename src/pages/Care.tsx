import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  AlarmClock,
  BatteryCharging,
  BatteryFull,
  BatteryLow,
  BatteryMedium,
  CheckCircle2,
  HeartPulse,
  RefreshCw,
  Signal,
  Scale,
  Smartphone,
  TriangleAlert,
  Wifi,
} from 'lucide-react';
import {
  getCareTasks,
  getDeviceHealth,
  getPortfolioBalance,
  SEGMENT_META,
  type CareTask,
  type DeviceHealth,
  type PortfolioBalance,
} from '@/lib/data';
import { OperatorBadge } from '@/components/shared';
import { cn } from '@/lib/utils';

const SEVERITY_STYLE: Record<CareTask['severity'], { chip: string; label: string }> = {
  overdue: { chip: 'bg-red-50 text-danger border-danger/40', label: 'Overdue' },
  due_soon: { chip: 'bg-amber-50 text-warn border-warn/40', label: 'Due soon' },
  scheduled: { chip: 'bg-subtle text-text-secondary border-hairline', label: 'Scheduled' },
};

const TASK_ICON: Record<CareTask['type'], typeof RefreshCw> = {
  renew_bundle: RefreshCw,
  recharge: BatteryCharging,
  keep_alive: HeartPulse,
  device_battery: BatteryLow,
  device_offline: Signal,
  rebalance: Scale,
};

function BatteryIcon({ pct, charging }: { pct: number | null; charging: boolean | null }) {
  if (charging) return <BatteryCharging className="h-4 w-4 text-success" />;
  if (pct == null) return <BatteryMedium className="h-4 w-4 text-text-muted" />;
  if (pct < 25) return <BatteryLow className="h-4 w-4 text-danger" />;
  if (pct < 60) return <BatteryMedium className="h-4 w-4 text-warn" />;
  return <BatteryFull className="h-4 w-4 text-success" />;
}

function fmtDue(iso: string) {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400_000);
  if (days < 0) return `${-days}d overdue`;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === 2) return 'day after tomorrow';
  return `in ${days}d`;
}

/** True when the action must happen within the next 48h (today / tomorrow / day after). */
function isImminent(iso: string) {
  return new Date(iso).getTime() - Date.now() <= 2 * 86400_000;
}

export default function Care() {
  const [tasks, setTasks] = useState<CareTask[]>([]);
  const [devices, setDevices] = useState<DeviceHealth[]>([]);
  const [balance, setBalance] = useState<PortfolioBalance[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCareTasks().then(setTasks);
    getDeviceHealth().then(setDevices);
    getPortfolioBalance().then(setBalance);
  }, []);

  const toggleDone = (id: string) =>
    setDone((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openTasks = tasks.filter((t) => !done.has(t.id));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
          SIM Care & Devices
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          The operational side of the system: keep phones alive, keep SIMs in their intended
          lifecycle stage. A dead phone or a recycled number silently kills your intelligence flow.
        </p>
      </div>

      {/* Device health */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <Smartphone className="h-4 w-4 text-brand" /> Device health
        </h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {devices.map((d, i) => (
            <motion.div
              key={d.device}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
              className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
            >
              <div className="flex items-center justify-between">
                <div className="font-display text-[15px] font-semibold text-text-primary">
                  {d.label}
                </div>
                <span className="text-[11px] text-text-muted tnum">
                  SIM{d.sims.length > 1 ? 's' : ''} {d.sims.join(' + ')}
                </span>
              </div>
              <div className="mt-3 space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <BatteryIcon pct={d.batteryPct} charging={d.charging} /> Battery
                  </span>
                  <span className="tnum font-medium text-text-primary">
                    {d.batteryPct != null ? `${d.batteryPct}%${d.charging ? ' ⚡' : ''}` : '—'}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-subtle">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      (d.batteryPct ?? 100) < 25 ? 'bg-danger' : (d.batteryPct ?? 100) < 60 ? 'bg-warn' : 'bg-success',
                    )}
                    style={{ width: `${d.batteryPct ?? 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <Wifi className="h-4 w-4 text-text-muted" /> Network
                  </span>
                  <span className="tnum font-medium text-text-primary">{d.network ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-text-secondary">
                    <Signal className="h-4 w-4 text-text-muted" /> Last signal
                  </span>
                  <span className="tnum text-xs text-text-muted">
                    {formatDistanceToNow(new Date(d.lastSeen), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Battery & network arrive automatically with each SMS once the forwarder template includes
          the %battery% / %power% / %network% placeholders (see Settings & Connect).
        </p>
      </div>

      {/* Portfolio balance vs target mix */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <Scale className="h-4 w-4 text-brand" /> Portfolio balance
          <span className="text-xs font-normal text-text-muted">target V1/V2/V3/PAYG mix vs actual</span>
        </h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {balance.map((b) => {
            const ok = b.deficit === 0;
            return (
              <div
                key={b.segment}
                className={cn(
                  'rounded-xl border bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]',
                  ok ? 'border-hairline' : 'border-danger/40',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    {SEGMENT_META[b.segment].label}
                  </span>
                  {!ok && <TriangleAlert className="h-3.5 w-3.5 text-danger" />}
                </div>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      'tnum font-display text-2xl font-semibold',
                      ok ? 'text-text-primary' : 'text-danger',
                    )}
                  >
                    {b.actual}
                  </span>
                  <span className="text-xs text-text-muted">/ {b.target} target</span>
                </div>
                <div className="mt-2 flex h-1.5 gap-0.5">
                  {Array.from({ length: Math.max(b.target, b.actual) }).map((_, i) => (
                    <span
                      key={i}
                      className={cn(
                        'h-full flex-1 rounded-full',
                        i < b.actual ? (ok ? 'bg-success' : 'bg-warn') : 'bg-subtle',
                      )}
                    />
                  ))}
                </div>
                {!ok && (
                  <p className="mt-2 text-[11px] leading-snug text-text-secondary">
                    Missing {b.deficit} — see rebalance task below
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Care tasks */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <AlarmClock className="h-4 w-4 text-brand" /> Care tasks
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand tnum">
            {openTasks.length} open
          </span>
        </h3>
        <div className="space-y-3">
          {tasks.map((t, i) => {
            const Icon = TASK_ICON[t.type];
            const sev = SEVERITY_STYLE[t.severity];
            const isDone = done.has(t.id);
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className={cn(
                  'flex items-start gap-4 rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]',
                  isDone && 'opacity-50',
                )}
              >
                <button
                  onClick={() => toggleDone(t.id)}
                  className="mt-0.5 shrink-0 text-text-muted hover:text-success"
                  title={isDone ? 'Reopen' : 'Mark done'}
                >
                  <CheckCircle2 className={cn('h-5 w-5', isDone && 'text-success')} />
                </button>
                <span className="mt-0.5 rounded-md bg-subtle p-1.5">
                  <Icon className="h-4 w-4 text-text-secondary" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'font-medium text-text-primary',
                        isDone && 'line-through',
                      )}
                    >
                      {t.title}
                    </span>
                    {t.operator && <OperatorBadge operator={t.operator} />}
                  </div>
                  <p className="mt-1 text-[13px] leading-relaxed text-text-secondary">{t.detail}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-0.5 text-[11px] font-semibold',
                      sev.chip,
                    )}
                  >
                    {sev.label}
                  </span>
                  {isImminent(t.dueAt) && !isDone && (
                    <span className="flex items-center gap-1 rounded-full bg-danger px-2.5 py-0.5 text-[11px] font-bold text-white">
                      <TriangleAlert className="h-3 w-3" />
                      ACT NOW
                    </span>
                  )}
                  <span className="tnum text-xs text-text-muted">{fmtDue(t.dueAt)}</span>
                </div>
              </motion.div>
            );
          })}
          {tasks.length === 0 && (
            <div className="rounded-xl border border-dashed border-hairline bg-surface p-10 text-center text-sm text-text-muted">
              All SIMs and devices are healthy. Nothing to do 🎉
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-info/25 bg-info/5 p-4 text-[13px] text-text-secondary">
        <strong className="text-text-primary">Why this matters:</strong> a V2 SIM that gets recharged
        by accident stops being V2 — your winback detection breaks. A V1 SIM that misses its renewal
        silently slides to V2. These tasks keep every profile in its intended stage, so the patterns
        you detect stay clean and comparable over time.
      </div>
    </div>
  );
}
