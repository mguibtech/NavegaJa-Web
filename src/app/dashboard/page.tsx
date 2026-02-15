'use client';

import { useQuery } from '@tanstack/react-query';
import { Ship, Users, Package, AlertTriangle, MapPin, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { stats } from '@/lib/api';

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: stats.getDashboardStats,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const statsCards = [
    {
      title: 'Viagens Ativas',
      value: data?.trips || 0,
      description: 'Viagens em andamento',
      icon: Ship,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Reservas',
      value: data?.bookings || 0,
      description: 'Total de reservas',
      icon: MapPin,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Encomendas',
      value: data?.shipments || 0,
      description: 'Encomendas em trânsito',
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Alertas SOS',
      value: data?.sosAlerts || 0,
      description: 'Alertas ativos',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema NavegaJá
        </p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alertas SOS Ativos */}
      {data?.sosAlerts > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Atenção: Alertas SOS Ativos
            </CardTitle>
            <CardDescription>
              Existem {data.sosAlerts} alertas de emergência que precisam de atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/dashboard/safety/sos-alerts"
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Ver alertas ativos
              <TrendingUp className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}

      {/* Atividades Recentes - Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>
            Últimas atividades no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma atividade recente para exibir
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
