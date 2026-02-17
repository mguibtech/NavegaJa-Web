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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { safety } from '@/lib/api';
import { SosAlertStatus } from '@/types/safety';

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
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: safety.getActiveSosAlerts,
    refetchInterval: 10000,
  });

  const activeSosCount = sosAlerts.filter(
    (a: { status: string }) => a.status === SosAlertStatus.ACTIVE
  ).length;

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-border bg-card shadow-lg">
      <div className="flex h-full flex-col">
        {/* Logo com gradiente amazônico */}
        <div className="flex h-16 items-center border-b border-border bg-linear-to-r from-primary via-primary-mid to-primary-light px-5 shadow-md">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="rounded-lg bg-white/10 p-2 backdrop-blur transition-all group-hover:bg-white/20">
              <Ship className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-white leading-none">NavegaJá</span>
              <span className="text-xs text-white/80 font-medium">Admin</span>
            </div>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
          {menuItems.map((section, i) => (
            <div key={i} className="mb-6">
              {section.title && !section.href && (
                <h4 className="mb-3 px-3 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {section.title}
                </h4>
              )}
              <ul className="space-y-1">
                {section.href ? (
                  <li>
                    <Link
                      href={section.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        pathname === section.href
                          ? 'bg-linear-to-r from-primary/90 to-primary text-white shadow-md shadow-primary/30'
                          : 'text-foreground/80 hover:bg-primary/5 hover:text-primary hover:translate-x-0.5'
                      )}
                    >
                      {section.icon && <section.icon className="h-5 w-5 flex-shrink-0" />}
                      <span className="flex-1">{section.title}</span>
                    </Link>
                  </li>
                ) : (
                  section.items?.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
                          pathname === item.href
                            ? 'bg-linear-to-r from-secondary/90 to-secondary text-white shadow-md shadow-secondary/30'
                            : 'text-foreground/70 hover:bg-secondary/5 hover:text-secondary hover:translate-x-0.5'
                        )}
                      >
                        <item.icon className={cn(
                          "h-4 w-4 flex-shrink-0",
                          pathname === item.href ? "text-white" : "text-foreground/60 group-hover:text-secondary"
                        )} />
                        <span className="flex-1">{item.title}</span>
                        {'sosbadge' in item && item.sosbadge && activeSosCount > 0 && (
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

        {/* Footer aprimorado */}
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
      </div>
    </aside>
  );
}
