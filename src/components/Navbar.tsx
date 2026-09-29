import { useEffect, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getUrgentCareCount } from '@/lib/data';
import {
  Activity,
  LayoutDashboard,
  Mail,
  Tag,
  Megaphone,
  Smartphone,
  Clock,
  Sparkles,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
  Radar,
  BookOpen,
  HeartPulse,
  GitCompareArrows,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard },
  { to: '/messages', label: 'Messages', icon: Mail },
  { to: '/offers', label: 'Offers', icon: Tag },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/sims', label: 'SIM Profiles', icon: Smartphone },
  { to: '/care', label: 'SIM Care', icon: HeartPulse },
  { to: '/segments', label: 'Segments', icon: Layers },
  { to: '/patterns', label: 'CVM Patterns', icon: Radar },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  { to: '/insights', label: 'AI Insights', icon: Sparkles },
  { to: '/benchmark', label: 'ATL Benchmark', icon: GitCompareArrows },
  { to: '/strategy', label: 'Strategy', icon: BookOpen },
];

export default function Navbar({
  collapsed,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}) {
  const [urgentCare, setUrgentCare] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      getUrgentCareCount()
        .then((n) => alive && setUrgentCare(n))
        .catch(() => {});
    refresh();
    const t = setInterval(refresh, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  // In the mobile drawer, always show the expanded sidebar (labels visible).
  const showFull = !collapsed || mobileOpen;

  return (
    <>
      {/* Mobile backdrop — desktop unaffected */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-hairline bg-subtle transition-[transform,width] duration-200 lg:z-40',
        // Mobile: off-canvas drawer (always full width). Desktop: original behavior.
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:translate-x-0',
        collapsed && 'lg:w-16',
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-hairline px-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <Activity className="h-4.5 w-4.5" />
        </span>
        {showFull && (
          <span className="font-display text-[15px] font-semibold tracking-tight text-text-primary">
            Competitor Pulse
          </span>
        )}
        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close menu"
            className="ml-auto rounded-md p-1.5 text-text-muted hover:bg-surface lg:hidden"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3" onClick={onCloseMobile}>
        {NAV.map((item, i) => (
          <motion.div
            key={item.to}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
          >
            <NavItem item={item} collapsed={!showFull} badge={item.to === '/care' ? urgentCare : 0} />
          </motion.div>
        ))}
        <div className="my-3 border-t border-hairline" />
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: NAV.length * 0.03, duration: 0.25 }}
        >
          <NavItem item={{ to: '/settings', label: 'Settings & Connect', icon: Settings }} collapsed={!showFull} />
        </motion.div>
      </nav>

      <div className="border-t border-hairline p-3">
        {showFull && (
          <div className="mb-2 rounded-lg border border-hairline bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-text-primary">
              <span className="h-2 w-2 rounded-full bg-success" />
              Example data · 68 messages
            </div>
            <Link to="/settings" className="mt-1 block text-xs text-brand hover:underline">
              Connect Supabase →
            </Link>
          </div>
        )}
        <button
          type="button"
          onClick={onToggle}
          className="hidden w-full items-center justify-center gap-2 rounded-md px-2 py-1.5 text-xs text-text-muted hover:bg-surface hover:text-text-secondary lg:flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && 'Collapse'}
        </button>
      </div>
    </aside>
    </>
  );
}

function NavItem({
  item,
  collapsed,
  badge = 0,
}: {
  item: { to: string; label: string; icon: typeof LayoutDashboard };
  collapsed: boolean;
  badge?: number;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors',
          isActive ? 'text-brand' : 'text-text-secondary hover:bg-surface hover:text-text-primary',
          collapsed && 'justify-center px-0',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="nav-active"
              className="absolute inset-0 rounded-lg bg-surface shadow-[0_1px_2px_rgba(28,25,23,0.06)]"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          {isActive && (
            <motion.span
              layoutId="nav-active-bar"
              className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <Icon className={cn('relative z-10 h-4 w-4 shrink-0', isActive && 'text-brand')} />
          {!collapsed && <span className="relative z-10">{item.label}</span>}
          {badge > 0 && !collapsed && (
            <span className="relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[10.5px] font-bold text-white">
              {badge}
            </span>
          )}
          {badge > 0 && collapsed && (
            <span className="absolute right-1.5 top-1.5 z-10 h-2 w-2 rounded-full bg-danger ring-2 ring-subtle" />
          )}
        </>
      )}
    </NavLink>
  );
}
