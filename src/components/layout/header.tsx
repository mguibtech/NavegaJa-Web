'use client';

import { Bell, LogOut, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useRouter } from 'next/navigation';

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Limpar cookie
    document.cookie = 'token=; path=/; max-age=0';
    window.location.href = '/login';
  };

  const user = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {};

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/95 backdrop-blur supports-backdrop-filter:bg-card/80 px-6 shadow-sm">
      <div className="flex flex-1 items-center justify-between">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-primary">Painel Administrativo</h2>
          <p className="text-xs text-muted-foreground">Sistema de Gestão NavegaJá</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Notificações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-primary/5"
              >
                <Bell className="h-5 w-5 text-foreground" />
                <Badge
                  variant="destructive"
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">
                Notificações Recentes
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="p-2 text-sm text-muted-foreground">
                Nenhuma notificação nova
              </div>
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
