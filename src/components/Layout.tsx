import { useEffect, useState, useSyncExternalStore } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Info, Menu, Search, X } from 'lucide-react';
import Navbar from './Navbar';
import MobileNav from './MobileNav';
import Footer from './Footer';
import { DATA_SOURCE, getDataStatus, subscribeDataStatus } from '@/lib/data';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/messages': 'Messages',
  '/offers': 'Offers',
  '/campaigns': 'Campaigns',
  '/sims': 'SIM Profiles',
  '/care': 'SIM Care',
  '/segments': 'Segments',
  '/patterns': 'CVM Patterns',
  '/strategy': 'Strategy',
  '/timeline': 'Timeline',
  '/benchmark': 'ATL Benchmark',
  '/insights': 'AI Insights',
  '/settings': 'Settings & Connect',
};

const BANNER_KEY = 'cp-example-banner-dismissed';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(
    () => localStorage.getItem(BANNER_KEY) === '1',
  );
  const [howOpen, setHowOpen] = useState(false);
  const [search, setSearch] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const title = TITLES[location.pathname] ?? 'Overview';
  const dataStatus = useSyncExternalStore(subscribeDataStatus, getDataStatus);

  useEffect(() => {
    localStorage.setItem(BANNER_KEY, bannerDismissed ? '1' : '0');
  }, [bannerDismissed]);

  // Close the mobile drawer on every navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) navigate(`/messages?q=${encodeURIComponent(search.trim())}`);
  };

  return (
    <div className="min-h-[100dvh] bg-canvas">
      <Navbar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className={cn('flex min-h-[100dvh] flex-col transition-[margin] duration-200', collapsed ? 'lg:ml-16' : 'lg:ml-60')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-hairline bg-canvas/90 px-4 backdrop-blur lg:gap-4 lg:px-6">
          {/* Hamburger — mobile only (desktop keeps sidebar collapse button) */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="-ml-1 rounded-lg p-2 text-text-secondary hover:bg-subtle lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-40">
            <h1 className="font-display text-[15px] font-semibold tracking-tight text-text-primary">
              {title}
            </h1>
            <p className="text-[11px] text-text-muted">Competitor Pulse / {title}</p>
          </div>
          <form onSubmit={submitSearch} className="relative ml-auto hidden md:block">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search messages & offers…"
              className="h-8 w-64 rounded-lg border border-hairline bg-surface pl-8 pr-8 text-xs text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
            />
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-hairline bg-subtle px-1 text-[10px] text-text-muted">
              ⌘K
            </kbd>
          </form>
          <span className="hidden rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-text-secondary lg:inline">
            Last 14 days
          </span>
          {DATA_SOURCE === 'mock' && (
            <motion.span
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="rounded-full border border-warn/40 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-warn"
            >
              EXAMPLE DATA
            </motion.span>
          )}
          {DATA_SOURCE === 'live' && dataStatus === 'live' && (
            <motion.span
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-teal-600/30 bg-teal-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-teal-700"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-600" />
              </span>
              LIVE
            </motion.span>
          )}
          {DATA_SOURCE === 'live' && dataStatus === 'fallback' && (
            <span className="rounded-full border border-warn/40 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-warn">
              OFFLINE — EXAMPLE DATA
            </span>
          )}
          <button
            type="button"
            aria-label="Notifications"
            className="hidden rounded-lg p-2 text-text-muted hover:bg-subtle hover:text-text-secondary md:block"
          >
            <Bell className="h-4 w-4" />
          </button>
          <Avatar className="hidden h-8 w-8 md:flex">
            <AvatarFallback className="bg-brand text-xs font-semibold text-white">MK</AvatarFallback>
          </Avatar>
        </header>

        {/* Example-data banner */}
        <AnimatePresence>
          {!bannerDismissed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b border-warn/20 bg-amber-50"
            >
              <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-2 px-6 py-2.5 text-[13px] text-amber-900 lg:px-8">
                <Info className="h-4 w-4 shrink-0 text-warn" />
                <p className="mr-auto">
                  {DATA_SOURCE === 'live' ? (
                    dataStatus === 'fallback' ? (
                      <>
                        You're <strong>offline</strong> — Supabase is unreachable, so Messages is
                        showing <strong>example data</strong> until the connection is restored.
                      </>
                    ) : (
                      <>
                        Messages are now live from your Supabase project. Offers, Campaigns and AI
                        Insights still show example data until the AI extraction step is set up.
                      </>
                    )
                  ) : (
                    <>
                      You're viewing <strong>example data</strong> so you can explore the dashboard.
                      When you're ready, connect your Supabase project in{' '}
                      <strong>Settings &amp; Connect</strong> — no code needed.
                    </>
                  )}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 border-warn/30 bg-transparent text-xs text-amber-900 hover:bg-amber-100"
                  onClick={() => setHowOpen(true)}
                >
                  How it works
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-amber-900"
                  onClick={() => setBannerDismissed(true)}
                >
                  <X className="mr-1 h-3.5 w-3.5" /> Dismiss
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content — extra bottom padding on mobile clears the bottom nav */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 pb-24 lg:p-8 lg:pb-8">
          <Outlet />
        </main>
        <Footer />
      </div>

      {/* Mobile bottom navigation — desktop unaffected */}
      <MobileNav onOpenMenu={() => setMobileOpen(true)} />

      <Dialog open={howOpen} onOpenChange={setHowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How Competitor Pulse works</DialogTitle>
            <DialogDescription>Three steps — no coding required.</DialogDescription>
          </DialogHeader>
          <ol className="list-decimal space-y-3 pl-5 text-sm text-text-secondary">
            <li>
              <strong className="text-text-primary">Explore with example data.</strong> Every page is
              filled with realistic sample SMS, offers and campaigns so you can see how the dashboard
              works.
            </li>
            <li>
              <strong className="text-text-primary">Create a free Supabase project.</strong> In{' '}
              <strong>Settings &amp; Connect</strong> you'll find a step-by-step guide with the exact
              table to create and where to paste your project URL and key.
            </li>
            <li>
              <strong className="text-text-primary">Forward your SIMs' SMS.</strong> Point your SMS
              forwarding app at Supabase, and the dashboard switches from example data to your live
              competitor messages automatically.
            </li>
          </ol>
        </DialogContent>
      </Dialog>
    </div>
  );
}
