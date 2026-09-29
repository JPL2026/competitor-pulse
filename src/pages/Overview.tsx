import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Mail, Megaphone, Play, Plus, Radar, Smartphone, Sparkles, Square, Tag, TrendingDown, XCircle } from 'lucide-react';
import {
  getCampaigns,
  getDailyOperatorCounts,
  getInsights,
  getKpis,
  getMessages,
  getOffers,
  getSims,
  getTimeline,
  operatorFromSender,
  type Campaign,
  type Insight,
  type Kpis,
  type Offer,
  type Operator,
  type SimProfile,
  type SmsRaw,
  type TimelineEvent,
} from '@/lib/data';
import {
  ChartCard,
  ConfidenceMeter,
  KpiCard,
  MessageDrawer,
  OPERATOR_LABELS,
  OperatorBadge,
} from '@/components/shared';

const OP_COLORS: Record<Operator, string> = {
  zain: '#6B2D90',
  orange: '#FF7900',
  umniah: '#E4002B',
};

const EVENT_ICONS: Record<TimelineEvent['type'], typeof Plus> = {
  offer_new: Plus,
  price_change: TrendingDown,
  campaign_start: Play,
  campaign_end: Square,
  offer_expired: XCircle,
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export default function Overview() {
  const navigate = useNavigate();
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [daily, setDaily] = useState<Awaited<ReturnType<typeof getDailyOperatorCounts>>>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sims, setSims] = useState<SimProfile[]>([]);
  const [messages, setMessages] = useState<SmsRaw[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightIdx, setInsightIdx] = useState(0);
  const [drawerMsg, setDrawerMsg] = useState<SmsRaw | null>(null);

  useEffect(() => {
    getKpis().then(setKpis);
    getDailyOperatorCounts(21).then(setDaily);
    getOffers().then(setOffers);
    getCampaigns().then(setCampaigns);
    getSims().then(setSims);
    getMessages().then((m) => setMessages(m.slice(0, 6)));
    getTimeline().then((t) => setEvents(t.slice(0, 6)));
    getInsights().then(setInsights);
  }, []);

  const donut = useMemo(() => {
    const active = offers.filter((o) => o.status === 'active');
    return (['zain', 'orange', 'umniah'] as Operator[]).map((op) => ({
      name: OPERATOR_LABELS[op],
      operator: op,
      value: active.filter((o) => o.operator === op).length,
    }));
  }, [offers]);

  const opStats = useMemo(() => {
    const twoWeeksAgo = Date.now() - 14 * 86400_000;
    return (['zain', 'orange', 'umniah'] as Operator[]).map((op) => {

      const opOffers = offers.filter((o) => o.operator === op && o.status === 'active');
      return {
        operator: op,
        messages14d: daily.reduce(
          (acc, d, i) => acc + (i >= daily.length - 14 ? d[op] : 0),
          0,
        ),
        activeOffers: opOffers.length,
        activeCampaigns: campaigns.filter((c) => c.operator === op && c.status === 'active').length,
        latestOffer: opOffers[0],
        spark: daily.slice(-14).map((d) => ({ date: d.date, count: d[op] })),
        sim: sims.find((s) => s.operator === op),
        recent: messages.filter((m) => operatorFromSender(m.sender) === op && new Date(m.received_stamp).getTime() >= twoWeeksAgo).length,
      };
    });
  }, [offers, campaigns, daily, sims, messages]);

  const insight = insights[insightIdx % Math.max(insights.length, 1)];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
          Overview
        </h2>
        <p className="mt-1 text-sm text-text-secondary">
          Competitive SMS activity across Zain, Orange and Umniah · Last 14 days
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-6">
        {[
          <Link key="k0" to="/patterns" className="block h-full">
            <KpiCard
              icon={Radar}
              label="CVM patterns"
              value={kpis?.activePatterns ?? '—'}
              delta="live detection"
              deltaUp
            />
          </Link>,
          <KpiCard
            key="k1"
            icon={Mail}
            label="Messages this week"
            value={kpis?.messagesThisWeek ?? '—'}
            delta={kpis ? `${kpis.messagesDeltaPct >= 0 ? '+' : ''}${kpis.messagesDeltaPct}% vs prev. week` : undefined}
            deltaUp={(kpis?.messagesDeltaPct ?? 0) >= 0}
            spark={kpis?.dailyCounts}
          />,
          <KpiCard
            key="k2"
            icon={Tag}
            label="Active offers"
            value={kpis?.activeOffers ?? '—'}
            delta={kpis ? `+${kpis.newOffers} new` : undefined}
            deltaUp
          />,
          <KpiCard
            key="k3"
            icon={Megaphone}
            label="Active campaigns"
            value={kpis?.activeCampaigns ?? '—'}
            delta={kpis ? `${kpis.endedCampaigns} ended` : undefined}
            deltaUp={false}
          />,
          <KpiCard
            key="k4"
            icon={Smartphone}
            label="SIMs online"
            value={kpis ? `${kpis.simsOnline}/${kpis.simsTotal}` : '—'}
            subtitle={
              kpis
                ? `Last ping ${formatDistanceToNow(new Date(kpis.lastPing), { addSuffix: true })}`
                : undefined
            }
          >
            <div className="mt-1.5 flex gap-1">
              {sims.map((s) => (
                <span
                  key={s.id}
                  className={`h-2 w-2 rounded-full ${s.status === 'active' ? 'bg-success' : 'bg-warn'}`}
                />
              ))}
            </div>
          </KpiCard>,
        ].map((card, i) => (
          <motion.div
            key={i}
            {...fadeUp}
            transition={{ delay: i * 0.06, duration: 0.3, ease: 'easeOut' }}
          >
            {card}
          </motion.div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
        <motion.div {...fadeUp} transition={{ delay: 0.2, duration: 0.3 }} className="lg:col-span-3">
          <ChartCard
            title="Messages per day"
            legend={
              <div className="flex gap-3 text-xs text-text-secondary">
                {(['zain', 'orange', 'umniah'] as Operator[]).map((op) => (
                  <span key={op} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-sm" style={{ background: OP_COLORS[op] }} />
                    {OPERATOR_LABELS[op]}
                  </span>
                ))}
              </div>
            }
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={daily} barCategoryGap="30%">
                  <CartesianGrid stroke="#EFEDE8" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) => d.slice(8)}
                    tick={{ fontSize: 11, fill: '#A8A29E' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#A8A29E' }}
                    axisLine={false}
                    tickLine={false}
                    width={24}
                  />
                  <Tooltip
                    cursor={{ fill: '#F3F1ED' }}
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid #E7E3DC',
                      background: '#FFFFFF',
                      fontSize: 12,
                    }}
                  />
                  {(['zain', 'orange', 'umniah'] as Operator[]).map((op, i) => (
                    <Bar
                      key={op}
                      dataKey={op}
                      stackId="a"
                      fill={OP_COLORS[op]}
                      radius={i === 2 ? [3, 3, 0, 0] : 0}
                      isAnimationActive
                      animationDuration={800}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.28, duration: 0.3 }} className="lg:col-span-2">
          <ChartCard title="Offers by operator">
            <div className="flex h-64 items-center">
              <div className="relative h-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donut}
                      dataKey="value"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                      isAnimationActive
                      animationDuration={800}
                      onClick={(entry) => {
                        const op = (entry as unknown as { operator?: Operator }).operator;
                        if (op) navigate(`/offers?operator=${op}`);
                      }}
                      className="cursor-pointer"
                    >
                      {donut.map((d) => (
                        <Cell key={d.operator} fill={OP_COLORS[d.operator]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: '1px solid #E7E3DC',
                        background: '#FFFFFF',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="tnum font-display text-2xl font-semibold text-text-primary">
                    {offers.filter((o) => o.status === 'active').length}
                  </span>
                  <span className="text-xs text-text-muted">offers</span>
                </div>
              </div>
              <div className="space-y-2 pr-2">
                {donut.map((d) => (
                  <div key={d.operator} className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: OP_COLORS[d.operator] }} />
                    {d.name}
                    <span className="tnum ml-auto font-medium text-text-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </motion.div>
      </div>

      {/* Operator cards */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {opStats.map((s, i) => (
          <motion.div
            key={s.operator}
            {...fadeUp}
            transition={{ delay: 0.35 + i * 0.08, duration: 0.3 }}
          >
            <div
              onClick={() => navigate(`/offers?operator=${s.operator}`)}
              className="cursor-pointer rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-lg"
                  style={{ background: `${OP_COLORS[s.operator]}1A` }}
                >
                  <img
                    src={`${import.meta.env.BASE_URL}logos/${s.operator}.png`}
                    alt={OPERATOR_LABELS[s.operator]}
                    className="h-7 w-7 rounded object-contain"
                  />
                </span>
                <div className="mr-auto">
                  <p className="text-sm font-semibold text-text-primary">
                    {OPERATOR_LABELS[s.operator]} Jordan
                  </p>
                  <OperatorBadge operator={s.operator} className="mt-0.5" />
                </div>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <span className="h-2 w-2 rounded-full bg-success" /> active
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { label: 'Messages (14d)', value: s.messages14d },
                  { label: 'Active offers', value: s.activeOffers },
                  { label: 'Campaigns', value: s.activeCampaigns },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-subtle px-2 py-2.5">
                    <div className="tnum font-display text-lg font-semibold text-text-primary">
                      {stat.value}
                    </div>
                    <div className="text-[11px] text-text-muted">{stat.label}</div>
                  </div>
                ))}
              </div>
              {s.latestOffer && (
                <div className="mt-4 rounded-lg border border-hairline p-3">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Latest offer
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-text-primary">{s.latestOffer.title}</p>
                  <p className="tnum text-xs text-text-secondary">
                    {s.latestOffer.priceJod} JOD · {s.latestOffer.dataGb}GB ·{' '}
                    {s.latestOffer.validityDays} days
                  </p>
                </div>
              )}
              <div className="mt-3 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={s.spark}>
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={OP_COLORS[s.operator]}
                      strokeWidth={1.5}
                      dot={false}
                      isAnimationActive
                      animationDuration={800}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <Link
                to={`/offers?operator=${s.operator}`}
                onClick={(e) => e.stopPropagation()}
                className="mt-2 inline-block text-[13px] font-medium text-brand hover:underline"
              >
                View offers →
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent activity */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <motion.div {...fadeUp} transition={{ delay: 0.5, duration: 0.3 }}>
          <ChartCard title="Latest messages">
            <ul className="divide-y divide-hairline">
              {messages.map((m, i) => (
                <motion.li
                  key={m.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55 + i * 0.04, duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setDrawerMsg(m)}
                    className="flex w-full items-center gap-3 py-2.5 text-left hover:bg-subtle/60"
                  >
                    <OperatorBadge
                      operator={m.sender === 'ZainJo' ? 'zain' : m.sender === 'Orange' ? 'orange' : 'umniah'}
                    />
                    <span dir="auto" className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
                      {m.body}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatDistanceToNow(new Date(m.received_stamp), { addSuffix: true })}
                    </span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </ChartCard>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.55, duration: 0.3 }}>
          <ChartCard
            title="Latest changes"
            legend={
              <Link to="/timeline" className="text-xs font-medium text-brand hover:underline">
                View full timeline →
              </Link>
            }
          >
            <ul className="divide-y divide-hairline">
              {events.map((ev, i) => {
                const Icon = EVENT_ICONS[ev.type];
                return (
                  <motion.li
                    key={ev.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + i * 0.04, duration: 0.25 }}
                    className="flex items-center gap-3 py-2.5"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-subtle text-text-secondary">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13px] text-text-primary">
                      {ev.text}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">
                      {formatDistanceToNow(new Date(ev.timestamp), { addSuffix: true })}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </ChartCard>
        </motion.div>
      </div>

      {/* AI highlight strip */}
      {insight && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="rounded-xl border border-hairline border-l-4 border-l-info bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/10 text-info">
              <Sparkles className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-info">
                AI Insight of the day
              </p>
              <motion.p
                key={insight.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-0.5 text-sm text-text-primary"
              >
                {insight.body}
              </motion.p>
            </div>
            <ConfidenceMeter value={insight.confidence} />
            <button
              type="button"
              onClick={() => setInsightIdx((i) => i + 1)}
              className="text-xs text-text-muted hover:text-text-secondary"
            >
              Next →
            </button>
            <Link to="/insights" className="text-[13px] font-medium text-brand hover:underline">
              See all insights →
            </Link>
          </div>
        </motion.div>
      )}

      <MessageDrawer
        message={drawerMsg}
        open={drawerMsg != null}
        onOpenChange={(o) => !o && setDrawerMsg(null)}
      />
    </div>
  );
}
