import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Radio, Smartphone, Tag, Terminal, Wand2 } from 'lucide-react';
import { getUssdSessions, type Operator, type UssdSession } from '@/lib/data';
import { ExampleDataPill, OperatorBadge } from '@/components/shared';
import { cn } from '@/lib/utils';

const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

export default function Ussd() {
  const [sessions, setSessions] = useState<UssdSession[]>([]);
  const [operator, setOperator] = useState<'all' | Operator>('all');
  const [onlyOffers, setOnlyOffers] = useState(false);

  useEffect(() => {
    getUssdSessions().then(setSessions);
  }, []);

  const filtered = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (operator === 'all' || s.operator === operator) &&
          (!onlyOffers || s.extracted_offer != null),
      ),
    [sessions, operator, onlyOffers],
  );

  const offerCount = sessions.filter((s) => s.extracted_offer != null).length;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">Ussd Intelligence
            USSD Intelligence
          </h2>
          <ExampleDataPill />
        </div>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          In many markets — especially in Africa — most BTL pressure happens inside USSD menus
          (*144#, *100#…), never by SMS. This page tracks automated USSD probes per SIM and the
          offers hidden in the responses.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 lg:max-w-xl">
        {[
          { label: 'Sessions captured', value: sessions.length, icon: Terminal },
          { label: 'Offers found in menus', value: offerCount, icon: Tag },
          {
            label: 'Operators probed',
            value: new Set(sessions.map((s) => s.operator)).size,
            icon: Radio,
          },
        ].map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
          >
            <k.icon className="h-4 w-4 text-brand" />
            <div className="tnum mt-2 font-display text-2xl font-semibold text-text-primary">
              {k.value}
            </div>
            <div className="text-xs text-text-muted">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'zain', 'orange', 'umniah'] as const).map((op) => (
          <button
            key={op}
            onClick={() => setOperator(op)}
            className={cn(
              'rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors',
              operator === op
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-hairline bg-surface text-text-secondary hover:text-text-primary',
            )}
          >
            {op}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-hairline" />
        <button
          onClick={() => setOnlyOffers((v) => !v)}
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
            onlyOffers
              ? 'border-brand bg-brand-soft text-brand'
              : 'border-hairline bg-surface text-text-secondary hover:text-text-primary',
          )}
        >
          <Tag className="h-3 w-3" /> Only sessions with offers
        </button>
      </div>

      {/* Sessions */}
      <div className="space-y-3">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            {...fadeUp}
            transition={{ delay: i * 0.04, duration: 0.25 }}
            className="rounded-xl border border-hairline bg-surface p-4 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md bg-subtle px-2 py-0.5 font-mono text-[13px] font-semibold text-text-primary">
                {s.code}
              </code>
              <OperatorBadge operator={s.operator} />
              <span className="text-xs text-text-muted">
                SIM {s.sim_slot} · {s.device} ·{' '}
                {formatDistanceToNow(new Date(s.captured_at), { addSuffix: true })}
              </span>
              <span
                className={cn(
                  'ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                  s.source === 'auto' ? 'bg-brand-soft text-brand' : 'bg-subtle text-text-secondary',
                )}
              >
                {s.source === 'auto' ? 'auto-probe' : 'manual'}
              </span>
            </div>

            {s.menu_path.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1 text-xs text-text-muted">
                {s.menu_path.map((step, j) => (
                  <span key={j} className="flex items-center gap-1">
                    {j > 0 && <span className="text-text-muted">›</span>}
                    <span className="rounded bg-subtle px-1.5 py-0.5">{step}</span>
                  </span>
                ))}
              </div>
            )}

            <p
              dir="auto"
              className="mt-2 rounded-lg border border-hairline bg-canvas p-3 font-mono text-[12.5px] leading-relaxed text-text-secondary"
            >
              {s.response_text}
            </p>

            {s.extracted_offer && (
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand/25 bg-brand-soft px-3 py-2 text-[12.5px] font-medium text-brand">
                <Wand2 className="h-3.5 w-3.5 shrink-0" />
                {s.extracted_offer}
              </div>
            )}
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-hairline bg-surface p-10 text-center text-sm text-text-muted">
            No USSD sessions match these filters.
          </div>
        )}
      </div>

      {/* How capture works */}
      <div className="rounded-xl border border-info/25 bg-info/5 p-4 text-[13px] leading-relaxed text-text-secondary">
        <div className="flex items-center gap-2 font-semibold text-text-primary">
          <Smartphone className="h-4 w-4 text-info" /> How USSD capture works
        </div>
        <p className="mt-2">
          A small companion app on each Android test phone dials a schedule of short codes per SIM
          slot (Android's <code className="rounded bg-subtle px-1 font-mono text-xs">sendUssdRequest</code>{' '}
          API), walks the menu tree, and POSTs every response to a{' '}
          <code className="rounded bg-subtle px-1 font-mono text-xs">ussd_logs</code> table in
          Supabase — same pipeline as SMS. Probing V2/V3 SIMs reveals offers that only appear
          <em> inside the menu</em> for at-risk customers and never arrive by SMS.
        </p>
        <p className="mt-2">
          Table to create (SQL Editor):
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg border border-hairline bg-surface p-3 font-mono text-xs text-text-primary">{`create table public.ussd_logs (
  id uuid primary key default gen_random_uuid(),
  sim_slot int,
  operator text,
  device text,
  code text,
  menu_path text[],
  response_text text,
  extracted_offer text,
  source text default 'auto',
  captured_at timestamptz default now()
);
alter table public.ussd_logs enable row level security;
create policy "ussd insert" on public.ussd_logs for insert to anon with check (true);
create policy "ussd read" on public.ussd_logs for select to anon using (true);`}</pre>
      </div>
    </div>
  );
}
