'use client';

import { Bell, LogOut, User, Menu, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from './sidebar-context';
import { clearAuthStorage, safety, admin } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SosAlertStatus } from '@/types/safety';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Notification {
  id: string;
  Icon: React.ElementType;
  label: string;
  description: string;
  href: string;
  urgent: boolean;
}

export function Header() {
  const { toggle } = useSidebar();
  const [user, setUser] = useState<Record<string, string>>({});
  // mounted garante que queries só rodam no cliente — evita hydration mismatch
  // com Radix (useQuery usa useSyncExternalStore, que tem impl. diferente no SSR)
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleLogout = () => {
    clearAuthStorage();
    window.location.href = '/login';
  };

  const { data: sosAlerts = [] } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: safety.getActiveSosAlerts,
    refetchInterval: 30_000,
    refetchOnWindowFocus: false,
    enabled: mounted,
  });

  const { data: pendingData } = useQuery({
    queryKey: ['pending-verifications'],
    queryFn: () => admin.boats.getPending(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    enabled: mounted,
  });

  const activeSos: Array<{ id: string; user?: { name?: string } }> = Array.isArray(sosAlerts)
    ? sosAlerts.filter((a: { status: string }) => a.status === SosAlertStatus.ACTIVE)
    : [];

  const pendingCaptains: Array<{ id: string; name: string }> = pendingData?.pendingCaptains ?? [];
  const pendingBoats: Array<{ id: string; name: string }> = pendingData?.pendingBoats ?? [];

  const notifications: Notification[] = [
    ...activeSos.map((sos) => ({
      id: `sos-${sos.id}`,
      Icon: AlertTriangle,
      label: 'Alerta SOS ativo',
      description: sos.user?.name ?? 'Usuário desconhecido',
      href: '/dashboard/safety/sos-alerts',
      urgent: true,
    })),
    ...pendingCaptains.map((c) => ({
      id: `captain-${c.id}`,
      Icon: ShieldCheck,
      label: 'Capitão aguardando verificação',
      description: c.name,
      href: '/dashboard/verifications',
      urgent: false,
    })),
    ...pendingBoats.map((b) => ({
      id: `boat-${b.id}`,
      Icon: ShieldCheck,
      label: 'Embarcação aguardando verificação',
      description: b.name,
      href: '/dashboard/verifications',
      urgent: false,
    })),
  ];

  const notifCount = notifications.length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className="hover:bg-primary/5 shrink-0"
            title="Recolher/expandir menu"
          >
            <Menu className="h-5 w-5 text-foreground" />
          </Button>
          <div>
            <h2 className="text-xl font-bold text-primary">Painel Administrativo</h2>
            <p className="text-xs text-muted-foreground">Sistema de Gestão NavegaJá</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-primary/5">
                <Bell className="h-5 w-5 text-foreground" />
                {notifCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {notifCount > 99 ? '99+' : notifCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 max-h-120 overflow-y-auto">
              <DropdownMenuLabel className="font-semibold">
                Notificações{notifCount > 0 && ` (${notifCount})`}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifCount === 0 ? (
                <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                  Nenhuma notificação pendente
                </div>
              ) : (
                notifications.map((n) => (
                  <DropdownMenuItem key={n.id} asChild>
                    <Link href={n.href} className="flex items-start gap-3 px-3 py-2.5 cursor-pointer">
                      <n.Icon className={cn(
                        'h-4 w-4 mt-0.5 shrink-0',
                        n.urgent ? 'text-destructive' : 'text-yellow-500'
                      )} />
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium leading-none">{n.label}</span>
                        <span className="text-xs text-muted-foreground truncate">{n.description}</span>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 gap-2 rounded-full pl-2 pr-3 hover:bg-primary/5"
              >
                <Avatar className="h-8 w-8 border-2 border-primary/20">
                  <AvatarFallback className="bg-linear-to-br from-primary to-primary-mid text-white font-semibold text-sm">
                    {user.name?.substring(0, 2).toUpperCase() || 'AD'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline-block">
                  {user.name?.split(' ')[0] || 'Admin'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end" forceMount>
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-semibold leading-none">{user.name || 'Administrador'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email || user.phone || 'admin@navegaja.com'}
                  </p>
                  <Badge variant="outline" className="w-fit mt-1 text-xs">
                    {user.role === 'admin' ? 'Administrador' : 'Capitão'}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Meu Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive cursor-pointer focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
