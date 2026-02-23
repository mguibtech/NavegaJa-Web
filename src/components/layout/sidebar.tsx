'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Ship,
  MapPin,
  Package,
  Ticket,
  AlertTriangle,
  Phone,
  ClipboardCheck,
  Star,
  Bell,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { safety } from '@/lib/api';
import { SosAlertStatus } from '@/types/safety';
import { useSidebar } from './sidebar-context';
import { useState, useEffect } from 'react';

const menuItems = [
  {
    title: 'DASHBOARD',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'SEGURANÇA',
    items: [
      {
        title: 'Alertas SOS',
        href: '/dashboard/safety/sos-alerts',
        icon: AlertTriangle,
        sosbadge: true,
      },
      {
        title: 'Contatos de Emergência',
        href: '/dashboard/safety/emergency-contacts',
        icon: Phone,
      },
      {
        title: 'Checklists',
        href: '/dashboard/safety/checklists',
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: 'GESTÃO',
    items: [
      {
        title: 'Verificações',
        href: '/dashboard/verifications',
        icon: ShieldCheck,
      },
      {
        title: 'Usuários',
        href: '/dashboard/users',
        icon: Users,
      },
      {
        title: 'Viagens',
        href: '/dashboard/trips',
        icon: Ship,
      },
      {
        title: 'Reservas',
        href: '/dashboard/bookings',
        icon: MapPin,
      },
      {
        title: 'Encomendas',
        href: '/dashboard/shipments',
        icon: Package,
      },
      {
        title: 'Cupons',
        href: '/dashboard/coupons',
        icon: Ticket,
      },
      {
        title: 'Avaliações',
        href: '/dashboard/reviews',
        icon: Star,
      },
      {
        title: 'Notificações',
        href: '/dashboard/notifications',
        icon: Bell,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useSidebar();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: safety.getActiveSosAlerts,
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    enabled: mounted,
  });

  const activeSosCount = Array.isArray(sosAlerts)
    ? sosAlerts.filter((a: { status: string }) => a.status === SosAlertStatus.ACTIVE).length
    : 0;

  return (
    <aside className={cn(
      'fixed left-0 top-0 z-40 h-screen border-r border-border bg-card shadow-lg transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border bg-linear-to-r from-primary via-primary-mid to-primary-light px-3 shadow-md overflow-hidden">
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur transition-all group-hover:bg-white/20 shrink-0">
              <Ship className="h-6 w-6 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-lg font-bold text-white leading-none truncate">NavegaJá</span>
                <span className="text-xs text-white/80 font-medium">Admin</span>
              </div>
            )}
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
          {menuItems.map((section, i) => (
            <div key={i} className="mb-4">
              {/* Section label — só quando expandido */}
              {!collapsed && section.title && !section.href && (
                <h4 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {section.title}
                </h4>
              )}
              {/* Divider sutil quando recolhido */}
              {collapsed && !section.href && i > 0 && (
                <div className="my-2 mx-2 border-t border-border/50" />
              )}
              <ul className="space-y-1">
                {section.href ? (
                  <li>
                    <Link
                      href={section.href}
                      title={collapsed ? section.title : undefined}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200',
                        collapsed && 'justify-center px-2',
                        pathname === section.href
                          ? 'bg-linear-to-r from-primary/90 to-primary text-white shadow-md shadow-primary/30'
                          : 'text-foreground/80 hover:bg-primary/5 hover:text-primary hover:translate-x-0.5'
                      )}
                    >
                      {section.icon && <section.icon className="h-5 w-5 flex-shrink-0" />}
                      {!collapsed && <span className="flex-1 truncate">{section.title}</span>}
                    </Link>
                  </li>
                ) : (
                  section.items?.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.title : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-all duration-200 group',
                          collapsed && 'justify-center px-2',
                          pathname === item.href
                            ? 'bg-linear-to-r from-secondary/90 to-secondary text-white shadow-md shadow-secondary/30'
                            : 'text-foreground/70 hover:bg-secondary/5 hover:text-secondary hover:translate-x-0.5'
                        )}
                      >
                        <div className="relative shrink-0">
                          <item.icon className={cn(
                            "h-4 w-4",
                            pathname === item.href ? "text-white" : "text-foreground/60 group-hover:text-secondary"
                          )} />
                          {/* Badge SOS no ícone quando recolhido */}
                          {'sosbadge' in item && item.sosbadge && activeSosCount > 0 && collapsed && (
                            <span className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 rounded-full bg-destructive text-[9px] text-white flex items-center justify-center font-bold">
                              {activeSosCount}
                            </span>
                          )}
                        </div>
                        {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                        {!collapsed && 'sosbadge' in item && item.sosbadge && activeSosCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 min-w-5 px-1.5 text-xs font-bold animate-pulse"
                          >
                            {activeSosCount}
                          </Badge>
                        )}
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-border bg-muted/30 p-4">
            <div className="rounded-lg bg-linear-to-br from-secondary/10 to-accent/10 p-3 border border-secondary/20">
              <p className="text-[11px] font-semibold text-foreground/70 tracking-wide">
                © 2026 NavegaJá
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Transporte Fluvial Amazônico
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
