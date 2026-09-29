import { useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { CalendarDays, MessageSquare, Pencil, Tag } from 'lucide-react';
import type { Operator, SimProfile } from '@/lib/data';
import { OPERATOR_LABELS, OperatorBadge, StatusPill } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SimStats {
  messages14d: number;
  lastMessage: string | null; // ISO
  offersExtracted: number;
}

interface SimCardProps {
  sim: SimProfile;
  stats: SimStats;
  onSave: (sim: SimProfile) => void;
  onToggleStatus: (sim: SimProfile) => void;
  onViewMessages: (sim: SimProfile) => void;
}

const GLYPH_BG: Record<Operator, string> = {
  zain: 'bg-zain-soft text-zain',
  orange: 'bg-orange-soft text-orange',
  umniah: 'bg-umniah-soft text-umniah',
};

const GLYPH_LETTER: Record<Operator, string> = {
  zain: 'Z',
  orange: 'O',
  umniah: 'U',
};

export function SimCard({ sim, stats, onSave, onToggleStatus, onViewMessages }: SimCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SimProfile>(sim);

  const startEdit = () => {
    setDraft(sim);
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = () => {
    onSave({ ...draft, notes: draft.notes.trim() });
    setEditing(false);
  };

  return (
    <motion.div
      layout="position"
      animate={{ opacity: sim.status === 'paused' ? 0.7 : 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]',
        !editing && 'transition-shadow hover:shadow-md',
      )}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
            GLYPH_BG[sim.operator],
          )}
        >
          {GLYPH_LETTER[sim.operator]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-text-primary">{sim.label}</p>
            <OperatorBadge operator={sim.operator} />
          </div>
          <p className="mt-0.5 text-xs text-text-muted">
            Slot {sim.sim_slot} · {sim.device}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusPill status={sim.status} className="transition-colors duration-200" />
          <Switch
            checked={sim.status === 'active'}
            onCheckedChange={() => onToggleStatus(sim)}
            aria-label={`Toggle ${sim.label} status`}
          />
        </div>
      </div>

      <motion.div
        layout="position"
        initial={false}
        transition={{ type: 'spring', duration: 0.25 }}
        className="mt-4"
      >
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor={`phone-${sim.id}`} className="text-xs">
                  Phone number
                </Label>
                <Input
                  id={`phone-${sim.id}`}
                  value={draft.phone_masked}
                  onChange={(e) => setDraft({ ...draft, phone_masked: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`plan-${sim.id}`} className="text-xs">
                  Plan name
                </Label>
                <Input
                  id={`plan-${sim.id}`}
                  value={draft.plan}
                  onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={draft.operator}
                  onValueChange={(v) => setDraft({ ...draft, operator: v as Operator })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(OPERATOR_LABELS) as Operator[]).map((op) => (
                      <SelectItem key={op} value={op}>
                        {OPERATOR_LABELS[op]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">SIM slot</Label>
                <Select
                  value={String(draft.sim_slot)}
                  onValueChange={(v) => setDraft({ ...draft, sim_slot: Number(v) })}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        Slot {n}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor={`device-${sim.id}`} className="text-xs">
                  Device
                </Label>
                <Input
                  id={`device-${sim.id}`}
                  value={draft.device}
                  onChange={(e) => setDraft({ ...draft, device: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor={`notes-${sim.id}`} className="text-xs">
                  Notes
                </Label>
                <Textarea
                  id={`notes-${sim.id}`}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                  rows={3}
                  className="text-sm"
                />
              </div>
              <div className="col-span-2 flex items-center justify-between rounded-lg border border-hairline bg-subtle px-3 py-2">
                <span className="text-xs font-medium text-text-secondary">Listening active</span>
                <Switch
                  checked={draft.status === 'active'}
                  onCheckedChange={(on) =>
                    setDraft({ ...draft, status: on ? 'active' : 'paused' })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={cancel}>
                Cancel
              </Button>
              <Button size="sm" className="bg-brand text-white hover:bg-brand/90" onClick={save}>
                Save
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Number</dt>
                <dd className="tnum text-text-primary">{sim.phone_masked}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Plan</dt>
                <dd className="text-text-primary">{sim.plan}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Last ping</dt>
                <dd className="tnum text-text-primary">
                  {formatDistanceToNow(new Date(sim.last_ping), { addSuffix: true })}
                </dd>
              </div>
            </dl>
            {sim.notes && (
              <p className="mt-3 line-clamp-2 rounded-lg bg-subtle px-3 py-2 text-[13px] text-text-secondary">
                {sim.notes}
              </p>
            )}

            {/* Stats row */}
            <div className="mt-4 grid grid-cols-3 divide-x divide-hairline rounded-lg border border-hairline">
              <div className="px-3 py-2.5">
                <p className="flex items-center gap-1 text-[11px] text-text-muted">
                  <MessageSquare className="h-3 w-3" /> Msgs (14d)
                </p>
                <p className="tnum mt-0.5 font-display text-lg font-semibold text-text-primary">
                  {stats.messages14d}
                </p>
              </div>
              <div className="px-3 py-2.5">
                <p className="flex items-center gap-1 text-[11px] text-text-muted">
                  <CalendarDays className="h-3 w-3" /> Last msg
                </p>
                <p className="mt-0.5 truncate text-[13px] font-medium text-text-primary">
                  {stats.lastMessage
                    ? formatDistanceToNow(new Date(stats.lastMessage), { addSuffix: true })
                    : '—'}
                </p>
              </div>
              <div className="px-3 py-2.5">
                <p className="flex items-center gap-1 text-[11px] text-text-muted">
                  <Tag className="h-3 w-3" /> Offers
                </p>
                <p className="tnum mt-0.5 font-display text-lg font-semibold text-text-primary">
                  {stats.offersExtracted}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={startEdit}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </Button>
              <button
                type="button"
                onClick={() => onViewMessages(sim)}
                className="text-[13px] font-medium text-brand hover:underline"
              >
                View messages →
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
