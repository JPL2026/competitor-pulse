import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check,
  ChevronRight,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  Table2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LocalToastStack, useLocalToasts } from '@/components/sims/LocalToast';
import { cn } from '@/lib/utils';

const CONFIG_KEY = 'cp-supabase-config';
const PREFS_KEY = 'cp-preferences';

const SCHEMA: { column: string; type: string; example: string }[] = [
  { column: 'id', type: 'uuid / text', example: 'sms-001' },
  { column: 'sender', type: 'text', example: 'ZainJo' },
  { column: 'body', type: 'text', example: 'Recharge 5 JD and get 10GB valid for 7 days! Dial *555#' },
  { column: 'sent_stamp', type: 'timestamptz', example: '2025-03-14 09:12:00+03' },
  { column: 'received_stamp', type: 'timestamptz', example: '2025-03-14 09:12:45+03' },
  { column: 'sim_slot', type: 'int2', example: '1' },
  { column: 'device', type: 'text', example: 'Pixel 7a' },
  { column: 'inserted_at', type: 'timestamptz', example: '2025-03-14 09:12:46+03' },
];

const DEV_SNIPPET = `import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { data } = await supabase.from('sms_raw').select('*');`;

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

const STEPS = [
  {
    icon: ExternalLink,
    title: 'Create a free Supabase project',
    body: 'Go to supabase.com → New project. Your SMS forwarding app already writes to the sms_raw table.',
    action: (
      <Button variant="outline" size="sm" className="mt-3 gap-1.5" asChild>
        <a href="https://supabase.com" target="_blank" rel="noreferrer">
          Open supabase.com <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </Button>
    ),
  },
  {
    icon: KeyRound,
    title: 'Copy your keys',
    body: 'In Supabase: Project Settings → API. Copy the Project URL and the anon public key (safe for browsers).',
    action: null,
  },
  {
    icon: Link2,
    title: 'Paste them here',
    body: 'Use the form below. Nothing is transmitted anywhere in demo mode.',
    action: null,
  },
];

export default function Settings() {
  const { toasts, push } = useLocalToasts();
  const [config, setConfig] = useState(() =>
    loadJson(CONFIG_KEY, { url: '', anonKey: '' }),
  );
  const [prefs, setPrefs] = useState(() =>
    loadJson(PREFS_KEY, { dateRange: '14', perPage: '25', language: 'all' }),
  );
  const [showKey, setShowKey] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const saveConfig = () => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
    push('Saved — a developer can finish the connection in src/lib/data/index.ts.');
  };

  const copyColumn = async (col: string) => {
    try {
      await navigator.clipboard.writeText(col);
      setCopied(col);
      window.setTimeout(() => setCopied((c) => (c === col ? null : c)), 1500);
    } catch {
      push('Copy failed — your browser blocked clipboard access.');
    }
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-text-primary">
            Settings &amp; Connect
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Connect your Supabase project when you're ready — no code needed.
          </p>
        </div>

        {/* Connection status */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex items-start gap-3 rounded-xl border border-warn/25 bg-amber-50 px-4 py-3.5"
        >
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-warn" />
          <div className="text-[13px] text-amber-900">
            <p className="font-semibold">Currently showing example data</p>
            <p className="mt-0.5">
              The dashboard is fully working with sample messages so you can explore. Follow the
              steps below to switch to your live data.
            </p>
          </div>
        </motion.div>

        {/* 3-step guide */}
        <div className="grid gap-4 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
            >
              <div className="flex items-center gap-3">
                <motion.span
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.15 + i * 0.08 }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-[13px] font-semibold text-white"
                >
                  {i + 1}
                </motion.span>
                <step.icon className="h-4 w-4 text-text-muted" />
              </div>
              <h3 className="mt-3 text-[15px] font-semibold text-text-primary">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-text-secondary">{step.body}</p>
              {step.action}
            </motion.div>
          ))}
        </div>

        {/* Connection form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.3 }}
          className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-text-primary">Connection details</h3>
            <span className="rounded-full border border-warn/40 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-warn">
              Not active yet — demo
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sb-url" className="text-xs">
                Supabase Project URL
              </Label>
              <Input
                id="sb-url"
                placeholder="https://xyzcompany.supabase.co"
                value={config.url}
                onChange={(e) => setConfig({ ...config, url: e.target.value })}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-key" className="text-xs">
                Anon public key
              </Label>
              <div className="relative">
                <Input
                  id="sb-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="eyJhbG…"
                  value={config.anonKey}
                  onChange={(e) => setConfig({ ...config, anonKey: e.target.value })}
                  className="h-9 pr-9 text-sm"
                />
                <button
                  type="button"
                  aria-label={showKey ? 'Hide key' : 'Show key'}
                  onClick={() => setShowKey((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sb-table" className="text-xs">
                Table name
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="block">
                    <Input id="sb-table" value="sms_raw" disabled className="h-9 text-sm" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>Matches your forwarding app</TooltipContent>
              </Tooltip>
            </div>
            <div className="flex items-end gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" size="sm" disabled>
                      Test connection
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Available once wired up by your developer</TooltipContent>
              </Tooltip>
              <Button
                size="sm"
                className={cn(
                  'gap-1.5 text-white transition-colors',
                  saved ? 'bg-success hover:bg-success' : 'bg-brand hover:bg-brand/90',
                )}
                onClick={saveConfig}
              >
                {saved ? <Check className="h-3.5 w-3.5" /> : null}
                {saved ? 'Saved' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Developer snippet */}
          <button
            type="button"
            onClick={() => setDevOpen((o) => !o)}
            className="mt-4 flex items-center gap-1 text-[13px] font-medium text-text-secondary hover:text-text-primary"
            aria-expanded={devOpen}
          >
            For developers
            <ChevronRight
              className={cn('h-3.5 w-3.5 transition-transform duration-200', devOpen && 'rotate-90')}
            />
          </button>
          <AnimatePresence initial={false}>
            {devOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ type: 'spring', duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 rounded-lg border border-hairline bg-subtle p-4">
                  <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    Developer-only — the connection lives in src/lib/data/index.ts
                  </p>
                  <pre className="overflow-x-auto text-xs leading-relaxed text-text-primary">
                    <code>{DEV_SNIPPET}</code>
                  </pre>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-[11px] text-text-muted">
            Keys you paste here stay in this browser (localStorage) in demo mode.
          </p>
        </motion.div>

        {/* Expected schema */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.3 }}
          className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <div className="flex items-center gap-2">
            <Table2 className="h-4 w-4 text-text-muted" />
            <h3 className="text-[15px] font-semibold text-text-primary">
              Expected table schema — <code className="text-sm">sms_raw</code>
            </h3>
          </div>
          <p className="mt-1 text-[13px] text-text-secondary">
            Check that your table matches these columns. Click a column name to copy it.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-hairline bg-subtle text-xs text-text-muted">
                  <th className="px-3 py-2 font-medium">Column</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                {SCHEMA.map((row) => (
                  <tr
                    key={row.column}
                    className="border-b border-hairline last:border-0 hover:bg-subtle"
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => copyColumn(row.column)}
                        className="group inline-flex items-center gap-1.5 font-mono text-xs font-medium text-brand hover:underline"
                      >
                        {row.column}
                        {copied === row.column ? (
                          <Check className="h-3 w-3 text-success" />
                        ) : (
                          <Copy className="h-3 w-3 text-text-muted opacity-0 transition-opacity group-hover:opacity-100" />
                        )}
                      </button>
                    </td>
                    <td className="tnum px-3 py-2 font-mono text-xs text-text-secondary">
                      {row.type}
                    </td>
                    <td className="max-w-72 truncate px-3 py-2 text-text-secondary" dir="auto">
                      {row.example}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.3 }}
          className="rounded-xl border border-hairline bg-surface p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)]"
        >
          <h3 className="text-[15px] font-semibold text-text-primary">Preferences</h3>
          <p className="mt-1 text-[13px] text-text-secondary">
            Saved to this browser and applied immediately.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Default date range</Label>
              <Select
                value={prefs.dateRange}
                onValueChange={(v) => setPrefs({ ...prefs, dateRange: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Messages per page</Label>
              <Select
                value={prefs.perPage}
                onValueChange={(v) => setPrefs({ ...prefs, perPage: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Language filter default</Label>
              <Select
                value={prefs.language}
                onValueChange={(v) => setPrefs({ ...prefs, language: v })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All languages</SelectItem>
                  <SelectItem value="ar">Arabic only</SelectItem>
                  <SelectItem value="en">English only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>
      <LocalToastStack toasts={toasts} />
    </TooltipProvider>
  );
}
