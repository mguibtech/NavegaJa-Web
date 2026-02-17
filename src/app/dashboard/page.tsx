'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Ship, Users, Package, AlertTriangle, TrendingUp, TrendingDown, Clock, DollarSign, Calendar, Star, Award, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { admin } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function DashboardPage() {
  // Query para estatísticas gerais
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-overview'],
    queryFn: admin.dashboard.getOverview,
    refetchInterval: 30000,
  });

  // Query para atividades recentes
  const { data: activities = [], isLoading: isLoadingActivities } = useQuery({
    queryKey: ['admin-dashboard-activity'],
    queryFn: admin.dashboard.getActivity,
    refetchInterval: 30000,
  });

  // Calcular analytics
  const analytics = useMemo(() => {
    if (!data) return null;

    // Agrupar activities reais dos últimos 7 dias por data e tipo
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(date.getDate() + 1);

      const dayActivities = (activities as any[]).filter((a) => {
        if (!a.createdAt) return false;
        const d = new Date(a.createdAt);
        return d >= date && d < nextDay;
      });

      return {
        day: format(date, 'dd/MM', { locale: ptBR }),
        viagens: dayActivities.filter((a) => a.type === 'trip').length,
        usuarios: dayActivities.filter((a) => a.type === 'user').length,
        bookings: dayActivities.filter((a) => a.type === 'booking').length,
      };
    });

    // Distribuição de status de viagens
    const tripStatus = [
      { name: 'Em Andamento', value: data.trips?.inProgress || 0, color: '#3b82f6' },
      { name: 'Agendadas', value: data.trips?.scheduled || 0, color: '#10b981' },
      { name: 'Concluídas', value: data.trips?.completed || 0, color: '#6366f1' },
      { name: 'Canceladas', value: data.trips?.cancelled || 0, color: '#ef4444' },
    ];

    // Distribuição de usuários
    const userDistribution = [
      { name: 'Passageiros', value: data.users?.passengers || 0, color: '#6366f1' },
      { name: 'Capitães', value: data.users?.captains || 0, color: '#3b82f6' },
      { name: 'Admins', value: data.users?.admins || 0, color: '#8b5cf6' },
    ];

    return {
      last7Days,
      tripStatus: tripStatus.filter(s => s.value > 0),
      userDistribution: userDistribution.filter(u => u.value > 0),
    };
  }, [data]);

  const statsCards = [
    {
      title: 'Viagens Ativas',
      value: data?.trips?.inProgress || 0,
      description: `${data?.trips?.total || 0} no total`,
      icon: Ship,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: data?.trips?.growth || 0,
    },
    {
      title: 'Usuários Ativos',
      value: data?.users?.activeUsers || 0,
      description: `${data?.users?.newToday || 0} novos hoje`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: data?.users?.growth || 0,
    },
    {
      title: 'Encomendas',
      value: data?.shipments?.inTransit || 0,
      description: `${data?.shipments?.pending || 0} pendentes`,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: data?.shipments?.growth || 0,
    },
    {
      title: 'Alertas SOS',
      value: data?.sosAlerts?.active || 0,
      description: `${data?.sosAlerts?.totalThisWeek || 0} esta semana`,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      trend: data?.sosAlerts?.growth || 0,
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema NavegaJá</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted animate-pulse rounded w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-16 mb-2" />
                <div className="h-3 bg-muted animate-pulse rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema NavegaJá</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Último 7 dias
          </Button>
        </div>
      </div>

      {/* Alerta SOS se houver */}
      {(data?.sosAlerts?.active || 0) > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Atenção: {data?.sosAlerts?.active} Alertas SOS Ativos
            </CardTitle>
            <CardDescription>
              Existem alertas de emergência que precisam de atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm" asChild>
              <a href="/dashboard/safety/sos-alerts">
                Ver Alertas Ativos
              </a>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Cards de Estatísticas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => {
          const isPositive = stat.trend > 0;
          const isNegative = stat.trend < 0;
          const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Activity;

          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                  {stat.trend !== 0 && (
                    <div className={`flex items-center gap-1 text-xs font-medium ${
                      isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{Math.abs(stat.trend)}%</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Métricas Financeiras */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              Receita Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {((data?.revenue?.total || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Média: R$ {((data?.revenue?.average || 0) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} por reserva
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Avaliação Média
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {(data?.rating?.average || 0).toFixed(1)} ★
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Baseado em {data?.rating?.count || 0} avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Taxa de Ocupação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(data?.occupancy?.rate || 0)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data?.occupancy?.bookedSeats || 0} de {data?.occupancy?.totalSeats || 0} assentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Gráfico de Atividade */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade dos Últimos 7 Dias</CardTitle>
              <CardDescription>Viagens, usuários e reservas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.last7Days}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="viagens" stroke="#3b82f6" strokeWidth={2} name="Viagens" />
                  <Line type="monotone" dataKey="usuarios" stroke="#10b981" strokeWidth={2} name="Usuários" />
                  <Line type="monotone" dataKey="bookings" stroke="#8b5cf6" strokeWidth={2} name="Reservas" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gráfico de Status de Viagens */}
          <Card>
            <CardHeader>
              <CardTitle>Status das Viagens</CardTitle>
              <CardDescription>Distribuição por status</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.tripStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.tripStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Distribuição de Usuários */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Usuários</CardTitle>
              <CardDescription>Por tipo de perfil</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.userDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" name="Quantidade">
                    {analytics.userDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
              <CardDescription>Acesso rápido às principais funções</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button variant="outline" className="justify-start" asChild>
                <a href="/dashboard/trips">
                  <Ship className="mr-2 h-4 w-4" />
                  Gerenciar Viagens
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/dashboard/bookings">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver Reservas
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/dashboard/users">
                  <Users className="mr-2 h-4 w-4" />
                  Gerenciar Usuários
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/dashboard/boats">
                  <Ship className="mr-2 h-4 w-4" />
                  Cadastrar Barco
                </a>
              </Button>
              <Button variant="outline" className="justify-start" asChild>
                <a href="/dashboard/coupons">
                  <Award className="mr-2 h-4 w-4" />
                  Criar Cupom
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Rankings */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-600" />
              Top 5 Rotas Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topRoutes?.slice(0, 5).map((route: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {idx + 1}
                    </Badge>
                    <span className="text-sm font-medium">{route.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{route.count} viagens</span>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              Top 5 Capitães
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topCaptains?.slice(0, 5).map((captain: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {idx + 1}
                    </Badge>
                    <span className="text-sm font-medium">{captain.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 text-yellow-600 fill-yellow-600" />
                    <span className="text-sm text-muted-foreground">{captain.rating}</span>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Top 5 Passageiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data?.topPassengers?.slice(0, 5).map((passenger: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="w-6 h-6 flex items-center justify-center p-0">
                      {idx + 1}
                    </Badge>
                    <span className="text-sm font-medium">{passenger.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{passenger.trips} viagens</span>
                </div>
              )) || (
                <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Atividades Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
          <CardDescription>Últimas atividades no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma atividade recente para exibir
            </p>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 10).map((activity: any, index: number) => {
                const getActivityIcon = () => {
                  if (activity.type === 'coupon') return Award;
                  if (activity.type === 'user') return Users;
                  if (activity.type === 'sos') return AlertTriangle;
                  if (activity.type === 'trip') return Ship;
                  return Activity;
                };

                const getActivityColor = () => {
                  if (activity.type === 'coupon') return 'bg-purple-100 text-purple-600';
                  if (activity.type === 'user') return 'bg-blue-100 text-blue-600';
                  if (activity.type === 'sos') return 'bg-red-100 text-red-600';
                  if (activity.type === 'trip') return 'bg-green-100 text-green-600';
                  return 'bg-gray-100 text-gray-600';
                };

                const ActivityIcon = getActivityIcon();

                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`rounded-full p-2 ${getActivityColor()}`}>
                      <ActivityIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{activity.user?.name || 'Sistema'}</span>
                        <span>•</span>
                        <span>
                          {activity.createdAt
                            ? format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'Data não disponível'}
                        </span>
                      </div>
                    </div>
                    {activity.status && (
                      <Badge variant={activity.status === 'success' ? 'default' : 'secondary'}>
                        {activity.status}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
