import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { HeartPulse, LayoutDashboard, Mail, Menu, Smartphone } from 'lucide-react';
import { getUrgentCareCount } from '@/lib/data';
import { cn } from '@/lib/utils';

/**
 * Mobile-only bottom navigation (hidden on lg+). Desktop keeps the sidebar.
 * The "Menu" tab opens the full sidebar drawer via onOpenMenu.
 */
export default function MobileNav({ onOpenMenu }: { onOpenMenu: () => void }) {
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

  const items = [
    { to: '/', label: 'Home', icon: LayoutDashboard },
    { to: '/messages', label: 'Messages', icon: Mail },
    { to: '/sims', label: 'SIMs', icon: Smartphone },
    { to: '/care', label: 'Care', icon: HeartPulse, badge: urgentCare },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t border-hairline bg-canvas/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium',
              isActive ? 'text-brand' : 'text-text-muted',
            )
          }
        >
          <span className="relative">
            <item.icon className="h-5 w-5" />
            {item.badge != null && item.badge > 0 && (
              <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
                {item.badge}
              </span>
            )}
          </span>
          {item.label}
        </NavLink>
      ))}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-text-muted"
      >
        <Menu className="h-5 w-5" />
        Menu
      </button>
    </nav>
  );
}
