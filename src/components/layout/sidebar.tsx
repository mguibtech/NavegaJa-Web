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

const menuItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Segurança',
    items: [
      {
        title: 'Alertas SOS',
        href: '/dashboard/safety/sos-alerts',
        icon: AlertTriangle,
        badge: 'live',
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
    title: 'Gestão',
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

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card">
      <div className="flex h-full flex-col gap-2">
        {/* Logo */}
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Ship className="h-6 w-6 text-primary" />
            <span className="text-xl">NavegaJá Admin</span>
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {menuItems.map((section, i) => (
            <div key={i} className="mb-6">
              {section.title && (
                <h4 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.title}
                </h4>
              )}
              <ul className="space-y-1">
                {section.href ? (
                  <li>
                    <Link
                      href={section.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                        pathname === section.href
                          ? 'bg-accent text-accent-foreground'
                          : 'text-muted-foreground'
                      )}
                    >
                      {section.icon && <section.icon className="h-4 w-4" />}
                      <span className="flex-1">{section.title}</span>
                    </Link>
                  </li>
                ) : (
                  section.items?.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
                          pathname === item.href
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="flex-1">{item.title}</span>
                        {item.badge === 'live' && (
                          <span className="flex h-2 w-2">
                            <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                          </span>
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
        <div className="border-t p-4">
          <p className="text-xs text-muted-foreground">
            © 2026 NavegaJá
          </p>
        </div>
      </div>
    </aside>
  );
}
