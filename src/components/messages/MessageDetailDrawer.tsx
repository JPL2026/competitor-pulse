import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { getOffers, operatorFromSender, type Offer, type SmsRaw } from '@/lib/data';
import { OperatorBadge, ConfidenceMeter } from '@/components/shared';

const AR_RE = /[؀-ۿ]/;

function pipelineDelay(m: SmsRaw): string {
  const ms = new Date(m.received_stamp).getTime() - new Date(m.sent_stamp).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 1) return 'received <1m after send';
  if (mins < 60) return `received ${mins}m after send`;
  const h = Math.floor(mins / 60);
  return `received ${h}h ${mins % 60}m after send`;
}

export function MessageDetailDrawer({
  messages,
  index,
  open,
  onOpenChange,
  onNavigate,
}: {
  messages: SmsRaw[];
  index: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate: (index: number) => void;
}) {
  const message = index >= 0 && index < messages.length ? messages[index] : null;
  const [linkedOffer, setLinkedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (message) {
      getOffers().then((all) => {
        if (!cancelled) setLinkedOffer(all.find((o) => o.sourceSmsId === message.id) ?? null);
      });
    } else {
      setLinkedOffer(null);
    }
    return () => {
      cancelled = true;
    };
  }, [message]);

  const isArabic = message ? AR_RE.test(message.body) : false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-[480px]">
        {message && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <OperatorBadge operator={operatorFromSender(message.sender)} />
                <span className="text-sm font-semibold">{message.sender}</span>
              </SheetTitle>
              <SheetDescription>
                SIM {message.sim_slot} · {message.device}
              </SheetDescription>
            </SheetHeader>

            <motion.div
              key={message.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15, delay: 0.15 }}
              className="mt-6 flex-1 space-y-5"
            >
              <div
                dir="auto"
                lang={isArabic ? 'ar' : 'en'}
                className="rounded-lg bg-subtle p-4 text-sm text-text-primary"
                style={isArabic ? { lineHeight: 1.9 } : { lineHeight: 1.6 }}
              >
                {message.body}
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-text-muted">SIM slot</dt>
                  <dd className="tnum text-text-primary">SIM {message.sim_slot}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Device</dt>
                  <dd className="text-text-primary">{message.device}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Sent</dt>
                  <dd className="tnum text-text-primary">
                    {format(new Date(message.sent_stamp), 'dd MMM yyyy, HH:mm')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Received</dt>
                  <dd className="tnum text-text-primary">
                    {format(new Date(message.received_stamp), 'dd MMM yyyy, HH:mm')}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-text-muted">Inserted at</dt>
                  <dd className="tnum text-text-primary">
                    {format(new Date(message.inserted_at), 'dd MMM yyyy, HH:mm')}
                  </dd>
                </div>
                <p className="rounded-md bg-brand-soft px-3 py-2 text-xs text-brand">
                  Pipeline delay: {pipelineDelay(message)}
                </p>
              </dl>

              {linkedOffer && (
                <div className="rounded-lg border border-hairline p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Extracted offer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">
                    {linkedOffer.title}
                  </p>
                  <div className="tnum mt-2 flex flex-wrap gap-1.5 text-xs">
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-text-secondary">
                      {linkedOffer.priceJod} JOD
                    </span>
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-text-secondary">
                      {linkedOffer.dataGb}GB
                    </span>
                    <span className="rounded-md bg-subtle px-2 py-0.5 text-text-secondary">
                      {linkedOffer.validityDays} days
                    </span>
                  </div>
                  <ConfidenceMeter value={linkedOffer.confidence} className="mt-3" />
                  <Button asChild variant="outline" size="sm" className="mt-3 h-8 text-xs">
                    <Link to={`/offers?operator=${linkedOffer.operator}`}>View in Offers →</Link>
                  </Button>
                </div>
              )}
            </motion.div>

            <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={index <= 0}
                onClick={() => onNavigate(index - 1)}
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </Button>
              <span className="tnum text-xs text-text-muted">
                {index + 1} of {messages.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 text-xs"
                disabled={index >= messages.length - 1}
                onClick={() => onNavigate(index + 1)}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
