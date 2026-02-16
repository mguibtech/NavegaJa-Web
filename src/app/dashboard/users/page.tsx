'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users as UsersIcon, Search, UserPlus, Mail, Phone, Shield, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function UsersPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  // Dados mockados - em produção viria da API
  const stats = {
    total: 1247,
    admins: 5,
    captains: 32,
    passengers: 1210,
  };

  const users = [
    {
      id: '1',
      name: 'João da Silva',
      email: 'joao@example.com',
      phone: '+5592988888888',
      role: 'passenger',
      rating: 4.8,
      totalTrips: 15,
      createdAt: '2025-01-15',
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@navegaja.com',
      phone: '+5592999999999',
      role: 'captain',
      rating: 4.9,
      totalTrips: 150,
      createdAt: '2024-06-10',
    },
    {
      id: '3',
      name: 'Admin Principal',
      email: 'admin@navegaja.com',
      phone: '+5592988888888',
      role: 'admin',
      rating: 5.0,
      totalTrips: 0,
      createdAt: '2024-01-01',
    },
  ];

  const getRoleBadge = (role: string) => {
    const configs = {
      admin: { className: 'bg-primary/15 text-primary border-primary/30', label: 'Administrador' },
      captain: { className: 'bg-secondary/15 text-secondary border-secondary/30', label: 'Capitão' },
      passenger: { className: 'bg-muted text-muted-foreground border-border', label: 'Passageiro' },
    };
    const config = configs[role as keyof typeof configs] || configs.passenger;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg bg-linear-to-br from-primary/5 via-primary-mid/5 to-primary-light/5 p-6 border border-primary/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Usuários</h1>
              <p className="mt-1 text-base text-foreground/70">
                Gerenciamento de usuários do sistema
              </p>
            </div>
          </div>
          <Button className="bg-secondary hover:bg-secondary/90">
            <UserPlus className="h-4 w-4 mr-2" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Administradores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Capitães
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">{stats.captains}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Passageiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.passengers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Busca e Lista */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle>Lista de Usuários</CardTitle>
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar usuário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-5 rounded-lg border hover:shadow-md transition-all hover:border-primary/30"
              >
                <div className="flex items-center gap-4 flex-1">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-linear-to-br from-primary to-primary-mid text-white font-bold text-lg">
                      {user.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-foreground">{user.name}</h3>
                      {getRoleBadge(user.role)}
                    </div>

                    <div className="flex items-center gap-4 flex-wrap text-sm text-foreground/60">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{user.phone}</span>
                      </div>
                      {user.role !== 'admin' && (
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                          <span className="font-medium">{user.rating}</span>
                          <span className="text-muted-foreground">({user.totalTrips} viagens)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="hover:bg-primary/10 hover:text-primary"
                  onClick={() => router.push(`/dashboard/users/${user.id}`)}
                >
                  Ver Detalhes
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
