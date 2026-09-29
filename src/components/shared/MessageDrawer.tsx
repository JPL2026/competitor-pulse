import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { getOffers, operatorFromSender, type Offer, type SmsRaw } from '@/lib/data';
import { OperatorBadge } from './OperatorBadge';

const AR_RE = /[؀-ۿ]/;

export function MessageDrawer({
  message,
  open,
  onOpenChange,
}: {
  message: SmsRaw | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {message && (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                Message detail
                <OperatorBadge operator={operatorFromSender(message.sender)} />
              </SheetTitle>
              <SheetDescription>
                From {message.sender} · SIM slot {message.sim_slot} · {message.device}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 space-y-5">
              <div
                dir={isArabic ? 'rtl' : 'ltr'}
                lang={isArabic ? 'ar' : 'en'}
                className="rounded-lg border border-hairline bg-subtle p-4 text-sm leading-relaxed text-text-primary"
              >
                {message.body}
              </div>
              <dl className="space-y-3 text-sm">
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
                  <dt className="text-text-muted">Message ID</dt>
                  <dd className="tnum text-text-secondary">{message.id}</dd>
                </div>
              </dl>
              {linkedOffer && (
                <div className="rounded-lg border border-hairline p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                    Linked offer
                  </p>
                  <p className="mt-1 text-sm font-semibold text-text-primary">{linkedOffer.title}</p>
                  <p className="tnum mt-0.5 text-sm text-text-secondary">
                    {linkedOffer.priceJod} JOD · {linkedOffer.dataGb}GB · {linkedOffer.validityDays}{' '}
                    days
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
