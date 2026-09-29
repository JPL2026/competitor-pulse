import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarClock, Layers, RefreshCw, Smartphone } from 'lucide-react';
import {
  getSims,
  getMessages,
  getOffers,
  SEGMENT_META,
  type Operator,
  type SimProfile,
  type SimSegment,
  type SmsRaw,
  type Offer,
} from '@/lib/data';
import { OperatorBadge, SegmentBadge, ExampleDataPill } from '@/components/shared';
import { cn } from '@/lib/utils';

const SEGMENT_ORDER: SimSegment[] = ['v1_active', 'v2_grace', 'v3_winback', 'payg'];

const SEGMENT_ACCENT: Record<SimSegment, string> = {
  v1_active: 'bg-brand',
  v2_grace: 'bg-warn',
  v3_winback: 'bg-zain',
  payg: 'bg-info',
};

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function cycleInfo(s: SimProfile): string {
  if (s.segment === 'payg') return 'no bundle';
  if (!s.bundleExpiresAt) return '—';
  const days = Math.round((new Date(s.bundleExpiresAt).getTime() - Date.now()) / 86400_000);
  if (days > 0) return `expires in ${days}d`;
  return `expired ${-days}d ago`;
}

export default function Segments() {
  const [sims, setSims] = useState<SimProfile[]>([]);
  const [messages, setMessages] = useState<SmsRaw[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);

  useEffect(() => {
    getSims().then(setSims);
    getMessages().then(setMessages);
    getOffers().then(setOffers);
  }, []);

  const perSegment = useMemo(
    () =>
      SEGMENT_ORDER.map((seg) => {
        const segSims = sims.filter((s) => s.segment === seg);
        const slots = new Set(segSims.map((s) => s.sim_slot));
        const msgs = messages.filter((m) => slots.has(m.sim_slot));
        const ops = new Set(segSims.map((s) => s.operator));
        const offs = offers.filter((o) => ops.has(o.operator));
        return { seg, sims: segSims, msgCount: msgs.length, offerCount: offs.length };
      }),
    [sims, messages, offers],
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
          SIM Segments <ExampleDataPill className="ml-2 align-middle" />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          All market offers run on a 30-day cycle. Each SIM sits at a lifecycle stage — by comparing
          what operators send to each stage, you see exactly how their CVM treats customers who pay,
          hesitate, or go silent.
        </p>
      </div>

      {/* Lifecycle funnel */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-text-secondary">
        <span className="rounded-full bg-brand-soft px-3 py-1 text-brand">V1 · Active (days 1–30)</span>
        <span className="text-text-muted">→</span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-warn">V2 · Grace (day 30+5)</span>
        <span className="text-text-muted">→</span>
        <span className="rounded-full bg-zain-soft px-3 py-1 text-zain">V3 · Winback (beyond)</span>
        <span className="mx-1 h-4 w-px bg-hairline" />
        <span className="rounded-full bg-slate-100 px-3 py-1 text-info">PAYG · no bundle</span>
      </div>

      {/* Segment cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {perSegment.map(({ seg, sims: segSims, msgCount, offerCount }, i) => (
          <motion.div
            key={seg}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
            className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
          >
            <div className={cn('mb-3 h-1 w-10 rounded-full', SEGMENT_ACCENT[seg])} />
            <div className="flex items-center justify-between">
              <h3 className="font-display text-[16px] font-semibold text-text-primary">
                {SEGMENT_META[seg].label}
              </h3>
              <SegmentBadge segment={seg} />
            </div>
            <p className="mt-1 text-xs font-medium text-text-muted">{SEGMENT_META[seg].short}</p>
            <p className="mt-2 text-[12.5px] leading-relaxed text-text-secondary">
              {SEGMENT_META[seg].description}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-center">
              <div>
                <div className="font-display text-lg font-semibold text-text-primary tnum">
                  {segSims.length}
                </div>
                <div className="text-[11px] text-text-muted">SIMs</div>
              </div>
              <div>
                <div className="font-display text-lg font-semibold text-text-primary tnum">
                  {msgCount}
                </div>
                <div className="text-[11px] text-text-muted">Messages</div>
              </div>
              <div>
                <div className="font-display text-lg font-semibold text-text-primary tnum">
                  {offerCount}
                </div>
                <div className="text-[11px] text-text-muted">Offers</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* SIM roster */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <Layers className="h-4 w-4 text-brand" /> SIM roster
        </h3>
        <div className="overflow-x-auto rounded-xl border border-hairline bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.04)]">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead>
              <tr className="border-b border-hairline bg-subtle/60 text-left text-xs font-medium text-text-muted">
                <th className="px-4 py-2.5">SIM</th>
                <th className="px-4 py-2.5">Operator</th>
                <th className="px-4 py-2.5">Stage</th>
                <th className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <RefreshCw className="h-3.5 w-3.5" /> Bundle / cycle
                  </span>
                </th>
                <th className="px-4 py-2.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" /> Last recharge
                  </span>
                </th>
                <th className="px-4 py-2.5">Notes</th>
              </tr>
            </thead>
            <tbody>
              {sims.map((s: SimProfile, i) => (
                <motion.tr
                  key={s.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 + i * 0.04 }}
                  className="border-b border-hairline last:border-0 hover:bg-subtle"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 font-medium text-text-primary">
                      <Smartphone className="h-3.5 w-3.5 text-text-muted" />
                      {s.label}
                      {s.multiOp && (
                        <span className="rounded-full bg-info/10 px-1.5 py-0.5 text-[10px] font-semibold text-info">
                          multi-op
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-text-muted tnum">{s.phone_masked} · {s.device}</div>
                  </td>
                  <td className="px-4 py-3">
                    <OperatorBadge operator={s.operator as Operator} />
                  </td>
                  <td className="px-4 py-3">
                    <SegmentBadge segment={s.segment} />
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    <div className="font-medium">{s.currentBundle ?? '—'}</div>
                    <div className="text-xs text-text-muted tnum">{cycleInfo(s)}</div>
                  </td>
                  <td className="px-4 py-3 tnum text-text-secondary">{fmtDate(s.lastRecharge)}</td>
                  <td className="max-w-64 px-4 py-3 text-xs text-text-muted">{s.notes}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-info/25 bg-info/5 p-4 text-[13px] text-text-secondary">
        <strong className="text-text-primary">How to use this:</strong> an offer landing on a V3
        SIM but not on V1 is winback targeting. An offer arriving 24–48 h before a V1 bundle expires
        is event-driven retention. The{' '}
        <Link to="/patterns" className="font-medium text-brand hover:underline">
          CVM Patterns
        </Link>{' '}
        page automates these detections, and{' '}
        <Link to="/care" className="font-medium text-brand hover:underline">
          SIM Care
        </Link>{' '}
        tells you when each SIM needs a recharge to stay in its stage.
      </div>
    </div>
  );
}
