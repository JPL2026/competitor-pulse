import { motion } from 'framer-motion';
import { BookOpen, Crosshair, Layers, Radar, SearchCheck } from 'lucide-react';
import { getDetectionRules } from '@/lib/data';
import { ExampleDataPill } from '@/components/shared';
import { PATTERN_META } from './Patterns';
import { cn } from '@/lib/utils';

const section = 'rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]';

const GLOSSARY: [string, string][] = [
  ['ATL (Above the line)', 'Publicly advertised offers — websites, shops, billboards. Everyone sees them; platforms like Tarifica track these well.'],
  ['BTL (Below the line)', 'Targeted, often exclusive offers sent directly to customers via SMS/calls. Invisible to competitors unless you hold SIMs on their network — exactly what this tool captures.'],
  ['CVM (Customer Value Management)', 'The operator’s engine that decides who gets which offer, when, based on behavior (usage, recharge rhythm, churn risk).'],
  ['Winback', 'Offers aimed at customers who went silent, to pull them back before they churn for good.'],
  ['Stimulation', 'Pressure tactics (flash bundles, expiring bonuses) designed to make an active customer consume and recharge more.'],
  ['Segment', 'A simulated customer profile played by one of your SIMs (dormant, active, multi-operator high-value).'],
];

export default function Strategy() {
  const rules = getDetectionRules();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
          Detection Strategy <ExampleDataPill className="ml-2 align-middle" />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-text-secondary">
          How Competitor Pulse turns raw competitor SMS into decisions. This page is the
          methodology reference — share it with your team.
        </p>
      </div>

      {/* Why BTL */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={section}
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <SearchCheck className="h-4 w-4 text-brand" /> Why BTL monitoring?
        </h3>
        <p className="mt-2 text-[13.5px] leading-relaxed text-text-secondary">
          In prepaid-heavy markets like Jordan, the most aggressive offers never appear publicly:
          operators push them by SMS to specific customers — winback deals for silent users, richer
          bundles for high-value ones, flash stimulation before expiry. Public-price trackers (ATL)
          miss all of it. By owning SIMs on Zain, Orange and Umniah and playing distinct customer
          profiles with them, we make the invisible visible: every BTL message lands in one
          database, gets structured, and feeds the pattern detection below.
        </p>
      </motion.section>

      {/* Segments */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        className={section}
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <Layers className="h-4 w-4 text-brand" /> Step 1 — The SIM segments (our bait profiles)
        </h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            ['V1 · Active', 'Days 1–30 of the cycle', 'Recharges and renews normally. Reveals stimulation cadence, retention timing (pre-expiry pings) and standard offer terms.'],
            ['V2 · Grace', 'Day 30 + 5 days, no recharge', 'The at-risk zone. Reveals soft-save and stimulation offers operators push right after a bundle lapses.'],
            ['V3 · Winback', 'Beyond the grace window', 'Deep inactivity. Reveals churn-save timing (how many silent days before they react) and winback budget (how generous the offer).'],
            ['PAYG', 'Pay As You Consume', 'No bundle at all. Reveals how operators court usage-based customers and try to convert them to 30-day bundles. Multi-operator SIMs carry a “multi-op” flag on top of their stage.'],
          ].map(([name, tag, desc]) => (
            <div key={name} className="rounded-lg border border-hairline bg-canvas p-4">
              <div className="font-display text-[15px] font-semibold text-text-primary">{name}</div>
              <div className="text-xs font-medium text-text-muted">{tag}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">{desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[13px] text-text-secondary">
          <strong className="text-text-primary">Discipline matters:</strong> a dormant SIM must
          actually stay dormant — no recharges, minimal usage — or the profile is contaminated and
          the detection loses meaning.
        </p>
      </motion.section>

      {/* Rules */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={section}
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <Radar className="h-4 w-4 text-brand" /> Step 2 — The six detection rules
        </h3>
        <p className="mt-1 text-[13px] text-text-secondary">
          Every incoming message is tested against these rules. A rule firing once is a signal;
          firing repeatedly becomes a confirmed pattern (see{' '}
          <span className="font-medium text-brand">CVM Patterns</span>).
        </p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          {rules.map((r, i) => {
            const meta = PATTERN_META[r.type];
            const Icon = meta.icon;
            return (
              <motion.div
                key={r.type}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + i * 0.04 }}
                className="rounded-lg border border-hairline bg-canvas p-4"
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn('h-4 w-4', meta.color)} />
                  <span className="text-[14px] font-semibold text-text-primary">{r.name}</span>
                </div>
                <p className="mt-1 text-[13px] text-text-secondary">{r.short}</p>
                <dl className="mt-2 space-y-1.5 text-[12.5px]">
                  <div>
                    <dt className="font-semibold text-text-muted">Detection logic</dt>
                    <dd className="text-text-secondary">{r.logic}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-text-muted">Strategic signal</dt>
                    <dd className="text-text-secondary">{r.signal}</dd>
                  </div>
                </dl>
              </motion.div>
            );
          })}
        </div>
      </motion.section>

      {/* How to read */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className={section}
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <Crosshair className="h-4 w-4 text-brand" /> Step 3 — From pattern to action
        </h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-[13.5px] leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Confirm before countering.</strong> Act on{' '}
            <em>confirmed</em> patterns (3+ occurrences). Emerging ones go on a watch list.
          </li>
          <li>
            <strong className="text-text-primary">Exploit predictable cadences.</strong> A
            calendar-driven stimulation (e.g. every Thursday) can be pre-empted: launch your
            counter-offer Wednesday evening.
          </li>
          <li>
            <strong className="text-text-primary">Match the segment, not the market.</strong> If a
            competitor gives multi-op high-value users 10GB at 2.5 JD, your retention offer to your
            own high-value base should beat exactly that — no need to discount for everyone.
          </li>
          <li>
            <strong className="text-text-primary">Track escalation ceilings.</strong> When a
            winback discount stops rising, you know their maximum acceptable cost — a benchmark for
            your own winback program.
          </li>
        </ol>
      </motion.section>

      {/* Glossary */}
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className={section}
      >
        <h3 className="flex items-center gap-2 text-[15px] font-semibold text-text-primary">
          <BookOpen className="h-4 w-4 text-brand" /> Glossary
        </h3>
        <dl className="mt-2 space-y-2">
          {GLOSSARY.map(([term, def]) => (
            <div key={term} className="text-[13px]">
              <dt className="inline font-semibold text-text-primary">{term} — </dt>
              <dd className="inline text-text-secondary">{def}</dd>
            </div>
          ))}
        </dl>
      </motion.section>
    </div>
  );
}
