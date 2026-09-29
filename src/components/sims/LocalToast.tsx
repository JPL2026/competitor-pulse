import { useCallback, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

export interface ToastItem {
  id: number;
  message: string;
}

/** Minimal bottom-right toast stack (auto-dismiss 3s) — used by demo pages without a global toaster. */
export function useLocalToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3000);
  }, []);

  return { toasts, push };
}

export function LocalToastStack({ toasts }: { toasts: ToastItem[] }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-80 flex-col gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-auto flex items-start gap-2 rounded-lg border border-hairline bg-surface px-3.5 py-2.5 text-[13px] text-text-primary shadow-md"
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
            <span>{t.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
