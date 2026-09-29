import { useState } from 'react';
import type { Operator, SimProfile } from '@/lib/data';
import { OPERATOR_LABELS } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AddSimDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (sim: SimProfile) => void;
}

const EMPTY = {
  label: '',
  phone_masked: '',
  plan: '',
  operator: 'zain' as Operator,
  sim_slot: 1,
  device: '',
  notes: '',
  status: 'active' as 'active' | 'paused',
};

export function AddSimDialog({ open, onOpenChange, onAdd }: AddSimDialogProps) {
  const [draft, setDraft] = useState(EMPTY);

  const submit = () => {
    const sim: SimProfile = {
      id: `sim-local-${Date.now()}`,
      label: draft.label.trim() || `${OPERATOR_LABELS[draft.operator]} SIM`,
      phone_masked: draft.phone_masked.trim() || '07••••••••',
      plan: draft.plan.trim() || 'Prepaid',
      operator: draft.operator,
      sim_slot: draft.sim_slot,
      device: draft.device.trim() || 'Unknown device',
      notes: draft.notes.trim(),
      status: draft.status,
      last_ping: new Date().toISOString(),
      segment: 'v1_active',
      multiOp: false,
      rechargeAmountJod: 3,
      lastRecharge: null,
      currentBundle: null,
      bundleExpiresAt: null,
    };
    onAdd(sim);
    setDraft(EMPTY);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add SIM</DialogTitle>
          <DialogDescription>
            Adds a profile to this browser only — it will sync to Supabase once connected.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="add-label" className="text-xs">
              Label
            </Label>
            <Input
              id="add-label"
              placeholder="e.g. Zain Jo"
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-phone" className="text-xs">
              Phone number
            </Label>
            <Input
              id="add-phone"
              placeholder="079•••1234"
              value={draft.phone_masked}
              onChange={(e) => setDraft({ ...draft, phone_masked: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="add-plan" className="text-xs">
              Plan name
            </Label>
            <Input
              id="add-plan"
              placeholder="e.g. Zain Prepaid Max"
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
            <Label htmlFor="add-device" className="text-xs">
              Device
            </Label>
            <Input
              id="add-device"
              placeholder="e.g. Pixel 7a"
              value={draft.device}
              onChange={(e) => setDraft({ ...draft, device: e.target.value })}
              className="h-8 text-sm"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label htmlFor="add-notes" className="text-xs">
              Notes
            </Label>
            <Textarea
              id="add-notes"
              placeholder="Segment registration, recharge reminders…"
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
              onCheckedChange={(on) => setDraft({ ...draft, status: on ? 'active' : 'paused' })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" className="bg-brand text-white hover:bg-brand/90" onClick={submit}>
            Add SIM
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
