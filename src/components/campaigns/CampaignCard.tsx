import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ArrowRight, MessagesSquare, Repeat } from 'lucide-react';
import type { Campaign, Offer, Operator, SmsRaw } from '@/lib/data';
import { OperatorBadge } from '@/components/shared';
import { cn } from '@/lib/utils';

const OP_HEX: Record<Operator, string> = {
  zain: '#6B2D90',
  orange: '#FF7900',
  umniah: '#E4002B',
};

const SENDER_BY_OP: Record<Operator, string> = {
  zain: 'ZainJo',
  orange: 'Orange',
  umniah: 'Umniah',
};

/** Keywords used to attribute raw SMS to a detected campaign (mock heuristic). */
export const CAMPAIGN_KEYWORDS: Record<string, string[]> = {
  'cmp-1': ['weekend', 'نهاية الأسبوع'],
  'cmp-2': ['ramadan', 'رمضان'],
  'cmp-3': ['student', 'طلاب', 'فصل'],
  'cmp-4': ['double', 'مضاعف'],
  'cmp-5': ['night', 'سهر'],
  'cmp-6': ['weekend', 'نهاية الأسبوع'],
};

export function campaignMessages(campaign: Campaign, messages: SmsRaw[]): SmsRaw[] {
  const kws = CAMPAIGN_KEYWORDS[campaign.id] ?? [campaign.name.toLowerCase()];
  const sender = SENDER_BY_OP[campaign.operator];
  return messages
    .filter(
      (m) =>
        m.sender === sender &&
        kws.some((k) => m.body.toLowerCase().includes(k.toLowerCase())),
    )
    .sort((a, b) => b.received_stamp.localeCompare(a.received_stamp));
}

function recurrenceLabel(recurrence: string): string {
  const r = recurrence.toLowerCase();
  if (r === 'daily') return 'Daily';
  if (r === 'one-off') return 'One-off burst';
  if (r.includes('fri')) return 'Weekly · Fri–Sat';
  return 'Weekly';
}

/** Mini 21-day heatmap strip: one square per day, intensity = messages that day. */
function ActivityStrip({
  campaign,
  messages,
}: {
  campaign: Campaign;
  messages: SmsRaw[];
}) {
  const navigate = useNavigate();
  const color = OP_HEX[campaign.operator];
  const kw = (CAMPAIGN_KEYWORDS[campaign.id] ?? [campaign.name])[0];

  const days = useMemo(() => {
    const now = Date.now();
    return Array.from({ length: 21 }, (_, i) => {
      const key = new Date(now - (20 - i) * 86400_000).toISOString().slice(0, 10);
      const count = messages.filter((m) => m.received_stamp.slice(0, 10) === key).length;
      return { key, count };
    });
  }, [messages]);

  const max = Math.max(1, ...days.map((d) => d.count));

  return (
    <div>
      <div className="flex gap-1">
        {days.map((d, i) => (
          <motion.button
            key={d.key}
            type="button"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15 + i * 0.015, duration: 0.2 }}
            title={`${format(new Date(d.key + 'T00:00:00'), 'EEE dd MMM')} — ${d.count} message${d.count === 1 ? '' : 's'}`}
            onClick={() =>
              navigate(
                `/messages?q=${encodeURIComponent(kw)}&from=${d.key}&to=${d.key}`,
              )
            }
            className="h-5 flex-1 rounded-[4px] border border-hairline transition-transform hover:scale-110"
            style={{
              backgroundColor:
                d.count === 0 ? '#F3F1ED' : color,
              opacity: d.count === 0 ? 1 : 0.25 + 0.75 * (d.count / max),
            }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-text-muted">
        <span>{format(new Date(days[0].key + 'T00:00:00'), 'dd MMM')}</span>
        <span>21-day activity</span>
        <span>{format(new Date(days[20].key + 'T00:00:00'), 'dd MMM')}</span>
      </div>
    </div>
  );
}

export function CampaignCard({
  campaign,
  messages,
  linkedOffers,
  index,
}: {
  campaign: Campaign;
  messages: SmsRaw[];
  linkedOffers: Offer[];
  index: number;
}) {
  const navigate = useNavigate();
  const color = OP_HEX[campaign.operator];
  const kw = (CAMPAIGN_KEYWORDS[campaign.id] ?? [campaign.name])[0];
  const samples = messages.slice(0, 2);
  const isActive = campaign.status === 'active';

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-xl border border-hairline bg-surface pl-5 pr-5 py-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-shadow hover:shadow-md"
    >
      {/* Left color spine */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
        aria-hidden
      />

      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="font-display text-[17px] font-semibold tracking-tight text-text-primary">
          {campaign.name}
        </h3>
        <OperatorBadge operator={campaign.operator} />
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
            isActive ? 'bg-umniah-soft text-umniah' : 'bg-stone-200 text-text-secondary',
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            {isActive && (
              <motion.span
                className="absolute inline-flex h-full w-full rounded-full bg-success"
                animate={{ scale: [1, 1.3], opacity: [1, 0.4] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <span
              className={cn(
                'relative inline-flex h-1.5 w-1.5 rounded-full',
                isActive ? 'bg-success' : 'bg-text-secondary',
              )}
            />
          </span>
          {campaign.status}
        </span>
      </div>

      {/* Meta row */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <MessagesSquare className="h-3.5 w-3.5 text-text-muted" />
          <span className="tnum">{campaign.messageCount} messages</span>
        </span>
        <span className="tnum text-text-muted">
          {format(new Date(campaign.firstSeen), 'dd MMM')} →{' '}
          {format(new Date(campaign.lastSeen), 'dd MMM')}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-subtle px-2.5 py-0.5 text-xs font-medium text-text-secondary">
          <Repeat className="h-3 w-3 text-text-muted" />
          {recurrenceLabel(campaign.recurrence)}
        </span>
      </div>

      {/* Activity strip */}
      <div className="mt-4">
        <ActivityStrip campaign={campaign} messages={messages} />
      </div>

      {/* Sample messages */}
      {samples.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {samples.map((m) => (
            <p
              key={m.id}
              dir="auto"
              className="truncate rounded-lg bg-subtle px-3 py-1.5 text-[13px] text-text-secondary"
            >
              {m.body}
            </p>
          ))}
          <button
            type="button"
            onClick={() => navigate(`/messages?q=${encodeURIComponent(kw)}`)}
            className="group inline-flex items-center gap-1 pt-0.5 text-[13px] font-medium text-brand hover:underline"
          >
            View all {campaign.messageCount} messages
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Linked offers */}
      {linkedOffers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-hairline pt-3">
          <span className="text-xs text-text-muted">Linked offers:</span>
          {linkedOffers.map((o) => (
            <span
              key={o.id}
              className="tnum inline-flex items-center rounded-full border border-hairline bg-surface px-2.5 py-0.5 text-xs text-text-secondary"
            >
              {o.title} · {o.priceJod} JOD
            </span>
          ))}
        </div>
      )}
    </motion.article>
  );
}
