import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Info, Plus } from 'lucide-react';
import {
  getMessages,
  getOffers,
  getSims,
  type Offer,
  type SimProfile,
  type SmsRaw,
} from '@/lib/data';
import { Button } from '@/components/ui/button';
import { SimCard, type SimStats } from '@/components/sims/SimCard';
import { AddSimDialog } from '@/components/sims/AddSimDialog';
import { LocalToastStack, useLocalToasts } from '@/components/sims/LocalToast';

const STORAGE_KEY = 'cp-sim-profiles';

function loadStored(): SimProfile[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SimProfile[]) : null;
  } catch {
    return null;
  }
}

export default function Sims() {
  const navigate = useNavigate();
  const { toasts, push } = useLocalToasts();
  const [sims, setSims] = useState<SimProfile[] | null>(null);
  const [messages, setMessages] = useState<SmsRaw[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    const stored = loadStored();
    getSims().then((base) => {
      setSims(stored ?? base);
    });
    getMessages().then(setMessages);
    getOffers().then(setOffers);
  }, []);

  // Persist every change locally (demo mode — no backend).
  useEffect(() => {
    if (sims) localStorage.setItem(STORAGE_KEY, JSON.stringify(sims));
  }, [sims]);

  const statsBySim = useMemo(() => {
    const map = new Map<string, SimStats>();
    if (!sims) return map;
    const cutoff = Date.now() - 14 * 86400_000;
    const smsById = new Map(messages.map((m) => [m.id, m]));
    for (const sim of sims) {
      const simMsgs = messages.filter(
        (m) => m.sim_slot === sim.sim_slot && m.device === sim.device,
      );
      const recent = simMsgs.filter((m) => new Date(m.received_stamp).getTime() >= cutoff);
      const last = simMsgs.reduce<string | null>(
        (acc, m) => (acc === null || m.received_stamp > acc ? m.received_stamp : acc),
        null,
      );
      const offersExtracted = offers.filter((o) => {
        const src = smsById.get(o.sourceSmsId);
        return src ? src.sim_slot === sim.sim_slot && src.device === sim.device : false;
      }).length;
      map.set(sim.id, { messages14d: recent.length, lastMessage: last, offersExtracted });
    }
    return map;
  }, [sims, messages, offers]);

  const saveSim = (updated: SimProfile) => {
    setSims((prev) => prev!.map((s) => (s.id === updated.id ? updated : s)));
    push('Profile saved locally — will sync to Supabase once connected.');
  };

  const toggleStatus = (sim: SimProfile) => {
    const next: SimProfile = {
      ...sim,
      status: sim.status === 'active' ? 'paused' : 'active',
    };
    setSims((prev) => prev!.map((s) => (s.id === sim.id ? next : s)));
    push(
      next.status === 'paused'
        ? `${sim.label} paused — saved locally (example mode).`
        : `${sim.label} resumed — saved locally (example mode).`,
    );
  };

  const addSim = (sim: SimProfile) => {
    setSims((prev) => [...(prev ?? []), sim]);
    push('Saved locally (example mode).');
  };

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-2.5 rounded-xl border border-info/20 bg-info/5 px-4 py-3 text-[13px] text-text-secondary"
      >
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-info" />
        <p>
          These profiles describe your own SIMs. When Supabase is connected, they'll map to{' '}
          <code className="rounded bg-subtle px-1 py-0.5 text-xs">sim_slot</code> +{' '}
          <code className="rounded bg-subtle px-1 py-0.5 text-xs">device</code> in{' '}
          <code className="rounded bg-subtle px-1 py-0.5 text-xs">sms_raw</code>.
        </p>
      </motion.div>

      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
            SIM Profiles
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            The prepaid SIMs listening to competitor marketing · edits are saved locally in this
            demo
          </p>
        </div>
        <Button
          size="sm"
          className="gap-1.5 bg-brand text-white hover:bg-brand/90"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4" /> Add SIM
        </Button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 lg:gap-6">
        {(sims ?? []).map((sim, i) => (
          <motion.div
            key={sim.id}
            initial={{ opacity: 0, y: 20, scale: sim.id.startsWith('sim-local-') ? 0.95 : 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
          >
            <SimCard
              sim={sim}
              stats={
                statsBySim.get(sim.id) ?? { messages14d: 0, lastMessage: null, offersExtracted: 0 }
              }
              onSave={saveSim}
              onToggleStatus={toggleStatus}
              onViewMessages={(s) => navigate(`/messages?sim=${s.sim_slot}`)}
            />
          </motion.div>
        ))}
      </div>

      <AddSimDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addSim} />
      <LocalToastStack toasts={toasts} />
    </div>
  );
}
