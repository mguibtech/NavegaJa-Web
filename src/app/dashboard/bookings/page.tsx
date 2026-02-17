'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MapPin, Ship, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Phone, Filter, Search, QrCode, CreditCard, Package, Download, TrendingUp, TrendingDown, BarChart3, DollarSign, Award, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { bookings } from '@/lib/api';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 5;

  // Query para buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['bookings-stats'],
    queryFn: bookings.getStats,
    refetchInterval: 30000,
  });

  // Query para buscar todas as reservas
  const { data: bookingsData = [], isLoading } = useQuery({
    queryKey: ['bookings'],
    queryFn: bookings.getAll,
    refetchInterval: 30000,
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => bookings.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
  });

  // Mutation para confirmar pagamento
  const confirmPaymentMutation = useMutation({
    mutationFn: (id: string) => bookings.confirmPayment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
    },
  });

  // Query para buscar detalhes de uma reserva
  const { data: bookingDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['booking-details', selectedBookingId],
    queryFn: () => bookings.getById(selectedBookingId!),
    enabled: !!selectedBookingId,
  });

  // Mutation para cancelar reserva
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => bookings.cancel(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['bookings-stats'] });
      queryClient.invalidateQueries({ queryKey: ['booking-details'] });
      setShowCancelDialog(false);
      setCancelReason('');
      setIsDetailsDialogOpen(false);
    },
  });

  const allBookings = Array.isArray(bookingsData) ? bookingsData : [];

  // Filtrar reservas
  const filteredBookings = useMemo(() => {
    return allBookings.filter((booking: any) => {
      const matchesSearch = !searchTerm ||
        booking.passenger?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.passenger?.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const matchesPaymentStatus = paymentStatusFilter === 'all' || booking.paymentStatus === paymentStatusFilter;

      // Filtro de data
      const { start, end } = getDateRange(dateFilter);
      let matchesDate = true;
      if (start || end) {
        const bookingDate = new Date(booking.createdAt);
        if (start && bookingDate < start) matchesDate = false;
        if (end && bookingDate > end) matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesPaymentStatus && matchesDate;
    });
  }, [searchTerm, statusFilter, paymentStatusFilter, dateFilter, startDate, endDate, allBookings]);

  // Paginação
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, paymentStatusFilter, dateFilter, startDate, endDate]);

  const getStatusBadge = (status: string) => {
    const configs = {
      confirmed: {
        className: 'bg-secondary/15 text-secondary border-secondary/30',
        icon: CheckCircle,
        label: 'Confirmada',
      },
      pending: {
        className: 'bg-accent/15 text-accent border-accent/30',
        icon: AlertCircle,
        label: 'Pendente',
      },
      cancelled: {
        className: 'bg-destructive/15 text-destructive border-destructive/30',
        icon: XCircle,
        label: 'Cancelada',
      },
      checked_in: {
        className: 'bg-primary/15 text-primary border-primary/30',
        icon: CheckCircle,
        label: 'Check-in Feito',
      },
      completed: {
        className: 'bg-secondary/15 text-secondary border-secondary/30',
        icon: CheckCircle,
        label: 'Concluída',
      },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (paymentStatus: string) => {
    const configs = {
      paid: {
        className: 'bg-secondary/15 text-secondary border-secondary/30',
        label: 'Pago',
      },
      pending: {
        className: 'bg-accent/15 text-accent border-accent/30',
        label: 'Pendente',
      },
      refunded: {
        className: 'bg-muted text-muted-foreground border-border',
        label: 'Reembolsado',
      },
    };
    const config = configs[paymentStatus as keyof typeof configs] || configs.pending;
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const handleConfirmPayment = (id: string) => {
    if (confirm('Deseja confirmar o pagamento desta reserva?')) {
      confirmPaymentMutation.mutate(id);
    }
  };

  const handleViewDetails = (bookingId: string) => {
    setSelectedBookingId(bookingId);
    setIsDetailsDialogOpen(true);
  };

  const handleCancelBooking = () => {
    if (selectedBookingId && cancelReason.trim()) {
      cancelMutation.mutate({ id: selectedBookingId, reason: cancelReason });
    }
  };

  const getStatusTimeline = (status: string) => {
    const statuses = ['pending', 'confirmed', 'checked_in', 'completed'];
    const currentIndex = statuses.indexOf(status);
    return statuses.map((s, index) => ({
      status: s,
      completed: index <= currentIndex,
      current: s === status,
    }));
  };

  // Helper para calcular período
  const getDateRange = (filter: string): { start: Date | null; end: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'today':
        return { start: today, end: now };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - 7);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today);
        monthStart.setMonth(today.getMonth() - 1);
        return { start: monthStart, end: now };
      case 'custom':
        return {
          start: startDate ? new Date(startDate) : null,
          end: endDate ? new Date(endDate) : null,
        };
      default:
        return { start: null, end: null };
    }
  };

  // Analytics - Calcular métricas e tendências
  const analytics = useMemo(() => {
    if (!Array.isArray(bookingsData) || bookingsData.length === 0) {
      return {
        revenueByDay: [],
        bookingsByDay: [],
        totalRevenue: 0,
        averageTicket: 0,
        byStatus: { pending: 0, confirmed: 0, checked_in: 0, completed: 0, cancelled: 0 },
        byPaymentMethod: { pix: 0, cash: 0, credit_card: 0, debit_card: 0 },
        byPaymentStatus: { pending: 0, paid: 0, refunded: 0 },
        revenueGrowth: 0,
        bookingsGrowth: 0,
      };
    }

    // Receita total
    const totalRevenue = allBookings.reduce((sum: number, b: any) => sum + Number(b.totalPrice || 0), 0);
    const averageTicket = totalRevenue / allBookings.length;

    // Últimos 7 dias de receita
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const revenueByDay = last7Days.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayBookings = allBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= day && bookingDate < nextDay;
      });
      const revenue = dayBookings.reduce((sum: number, b: any) => sum + Number(b.totalPrice || 0), 0);
      return {
        date: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        revenue,
        count: dayBookings.length,
      };
    });

    // Distribuição por status
    const byStatus = allBookings.reduce((acc: any, b: any) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    // Distribuição por método de pagamento
    const byPaymentMethod = allBookings.reduce((acc: any, b: any) => {
      acc[b.paymentMethod] = (acc[b.paymentMethod] || 0) + 1;
      return acc;
    }, {});

    // Distribuição por status de pagamento
    const byPaymentStatus = allBookings.reduce((acc: any, b: any) => {
      acc[b.paymentStatus] = (acc[b.paymentStatus] || 0) + 1;
      return acc;
    }, {});

    // Crescimento (comparando últimos 7 dias vs 7 dias anteriores)
    const last7DaysRevenue = revenueByDay.reduce((sum, d) => sum + d.revenue, 0);
    const last7DaysCount = revenueByDay.reduce((sum, d) => sum + d.count, 0);

    const previous7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const previous7DaysData = previous7Days.map(day => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const dayBookings = allBookings.filter((b: any) => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= day && bookingDate < nextDay;
      });
      const revenue = dayBookings.reduce((sum: number, b: any) => sum + Number(b.totalPrice || 0), 0);
      return { revenue, count: dayBookings.length };
    });

    const previous7DaysRevenue = previous7DaysData.reduce((sum, d) => sum + d.revenue, 0);
    const previous7DaysCount = previous7DaysData.reduce((sum, d) => sum + d.count, 0);

    const revenueGrowth = previous7DaysRevenue > 0
      ? ((last7DaysRevenue - previous7DaysRevenue) / previous7DaysRevenue) * 100
      : 0;
    const bookingsGrowth = previous7DaysCount > 0
      ? ((last7DaysCount - previous7DaysCount) / previous7DaysCount) * 100
      : 0;

    // Top 5 Rankings
    // Top rotas por receita
    const routeStats = allBookings.reduce((acc: any, b: any) => {
      const route = `${b.trip?.fromCity || '?'} → ${b.trip?.toCity || '?'}`;
      if (!acc[route]) {
        acc[route] = { route, count: 0, revenue: 0 };
      }
      acc[route].count += 1;
      acc[route].revenue += Number(b.totalPrice || 0);
      return acc;
    }, {});
    const topRoutes = Object.values(routeStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 5);

    // Top horários (por hora do dia)
    const hourStats = allBookings.reduce((acc: any, b: any) => {
      if (b.trip?.departureTime) {
        const hour = new Date(b.trip.departureTime).getHours();
        const hourLabel = `${hour}:00`;
        if (!acc[hourLabel]) {
          acc[hourLabel] = { hour: hourLabel, count: 0 };
        }
        acc[hourLabel].count += 1;
      }
      return acc;
    }, {});
    const topHours = Object.values(hourStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    // Dias da semana mais populares
    const dayOfWeekStats = allBookings.reduce((acc: any, b: any) => {
      const dayIndex = new Date(b.createdAt).getDay();
      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = dayNames[dayIndex];
      if (!acc[dayName]) {
        acc[dayName] = { day: dayName, count: 0 };
      }
      acc[dayName].count += 1;
      return acc;
    }, {});
    const topDays = Object.values(dayOfWeekStats)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);

    return {
      revenueByDay,
      bookingsByDay: revenueByDay,
      totalRevenue,
      averageTicket,
      byStatus,
      byPaymentMethod,
      byPaymentStatus,
      revenueGrowth,
      bookingsGrowth,
      topRoutes,
      topHours,
      topDays,
    };
  }, [allBookings]);

  // Skeleton Loading Component
  const SkeletonCard = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
        <div className="h-8 bg-muted rounded w-1/2"></div>
      </CardHeader>
    </Card>
  );

  const SkeletonChart = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 bg-muted rounded w-1/4"></div>
      </CardHeader>
      <CardContent>
        <div className="h-64 bg-muted rounded"></div>
      </CardContent>
    </Card>
  );

  // Cores para gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  // Função para exportar para Excel
  const handleExportToExcel = () => {
    // Preparar dados para exportação
    const dataToExport = filteredBookings.map((booking: any) => ({
      'ID': booking.id.substring(0, 8).toUpperCase(),
      'Passageiro': booking.passenger?.name || 'Não informado',
      'Telefone': booking.passenger?.phone || 'Não informado',
      'Email': booking.passenger?.email || 'Não informado',
      'Rota': `${booking.trip?.fromCity || '?'} → ${booking.trip?.toCity || '?'}`,
      'Embarcação': booking.trip?.boat?.name || 'Não informado',
      'Partida': booking.trip?.departureTime
        ? new Date(booking.trip.departureTime).toLocaleString('pt-BR')
        : 'Não informado',
      'Assentos': booking.seats,
      'Valor Total': `R$ ${Number(booking.totalPrice).toFixed(2)}`,
      'Status': booking.status,
      'Status Pagamento': booking.paymentStatus,
      'Método Pagamento': booking.paymentMethod,
      'Criado em': new Date(booking.createdAt).toLocaleString('pt-BR'),
    }));

    // Converter para CSV (mais simples e sem dependência)
    const headers = Object.keys(dataToExport[0] || {});
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row =>
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escapar valores com vírgula ou aspas
          return typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    // Download do arquivo
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reservas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg bg-linear-to-br from-secondary/5 via-secondary/5 to-transparent p-6 border border-secondary/10">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-secondary/10 p-2">
            <MapPin className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Reservas</h1>
            <p className="mt-1 text-base text-foreground/70">
              Gerenciamento de reservas de passagens
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="border-l-4 border-l-muted shadow-md animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-10 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-4">
          <Card className="border-l-4 border-l-primary shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Total de Reservas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{stats?.total || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary/30 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Confirmadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-secondary">{stats?.byStatus?.confirmed || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-accent/30 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-accent">{stats?.byStatus?.pending || 0}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-destructive/30 hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-foreground">{stats?.byStatus?.cancelled || 0}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dashboard Analytics */}
      <Card className="shadow-lg border-primary/10">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Analytics & Insights</CardTitle>
              <CardDescription>Análise detalhada dos últimos 7 dias</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-8">
            {/* Métricas Principais */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Receita Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">
                    R$ {analytics.totalRevenue.toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.revenueGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-secondary" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs ${analytics.revenueGrowth >= 0 ? 'text-secondary' : 'text-destructive'}`}>
                      {analytics.revenueGrowth >= 0 ? '+' : ''}{analytics.revenueGrowth.toFixed(1)}% vs semana anterior
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ticket Médio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {analytics.averageTicket.toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por reserva
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Reservas (7 dias)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">
                    {analytics.bookingsByDay.reduce((sum, d) => sum + d.count, 0)}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    {analytics.bookingsGrowth >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-accent" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-destructive" />
                    )}
                    <span className={`text-xs ${analytics.bookingsGrowth >= 0 ? 'text-accent' : 'text-destructive'}`}>
                      {analytics.bookingsGrowth >= 0 ? '+' : ''}{analytics.bookingsGrowth.toFixed(1)}% vs semana anterior
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-muted/50 to-muted/20 border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {allBookings.length > 0
                      ? ((analytics.byStatus.confirmed + analytics.byStatus.checked_in + analytics.byStatus.completed) / allBookings.length * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirmadas/Total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos Interativos com Recharts */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Gráfico de Receita (Line Chart) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    Receita dos Últimos 7 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 bg-muted/30 rounded animate-pulse"></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <LineChart data={analytics.revenueByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                          formatter={(value: any) => [`R$ ${Number(value).toFixed(2)}`, 'Receita']}
                        />
                        <Line
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          dot={{ fill: '#10b981', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Gráfico de Reservas por Dia (Bar Chart) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Reservas por Dia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 bg-muted/30 rounded animate-pulse"></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={analytics.bookingsByDay}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                        <YAxis stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                          formatter={(value: any) => [`${value}`, 'Reservas']}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Grid com Distribuições */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Distribuição por Status (Pie Chart) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    Distribuição por Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 bg-muted/30 rounded animate-pulse"></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Confirmada', value: analytics.byStatus.confirmed || 0, color: '#10b981' },
                            { name: 'Pendente', value: analytics.byStatus.pending || 0, color: '#f59e0b' },
                            { name: 'Check-in', value: analytics.byStatus.checked_in || 0, color: '#3b82f6' },
                            { name: 'Concluída', value: analytics.byStatus.completed || 0, color: '#059669' },
                            { name: 'Cancelada', value: analytics.byStatus.cancelled || 0, color: '#ef4444' },
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: 'Confirmada', value: analytics.byStatus.confirmed || 0, color: '#10b981' },
                            { name: 'Pendente', value: analytics.byStatus.pending || 0, color: '#f59e0b' },
                            { name: 'Check-in', value: analytics.byStatus.checked_in || 0, color: '#3b82f6' },
                            { name: 'Concluída', value: analytics.byStatus.completed || 0, color: '#059669' },
                            { name: 'Cancelada', value: analytics.byStatus.cancelled || 0, color: '#ef4444' },
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Distribuição por Método de Pagamento (Bar Chart) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    Métodos de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="h-64 bg-muted/30 rounded animate-pulse"></div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart
                        data={[
                          { name: 'PIX', value: analytics.byPaymentMethod.pix || 0 },
                          { name: 'Dinheiro', value: analytics.byPaymentMethod.cash || 0 },
                          { name: 'Crédito', value: analytics.byPaymentMethod.credit_card || 0 },
                          { name: 'Débito', value: analytics.byPaymentMethod.debit_card || 0 },
                        ]}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" stroke="#6b7280" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" fontSize={12} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status de Pagamento */}
            <div>
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Status dos Pagamentos
              </h3>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { key: 'paid', label: 'Pagos', color: 'bg-secondary', icon: CheckCircle },
                  { key: 'pending', label: 'Pendentes', color: 'bg-accent', icon: Clock },
                  { key: 'refunded', label: 'Reembolsados', color: 'bg-muted', icon: XCircle },
                ].map(status => {
                  const count = analytics.byPaymentStatus[status.key] || 0;
                  const percentage = allBookings.length > 0 ? (count / allBookings.length) * 100 : 0;
                  const Icon = status.icon;
                  return (
                    <Card key={status.key} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <span className="text-2xl font-bold">{count}</span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{status.label}</p>
                          <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${status.color} rounded-full transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% do total</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Rankings Section */}
      <Card className="shadow-lg border-accent/10">
        <CardHeader className="border-b bg-gradient-to-r from-accent/5 to-primary/5">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            <div>
              <CardTitle>Top 5 Rankings</CardTitle>
              <CardDescription>Principais destaques e tendências</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Top Rotas */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ship className="h-4 w-4 text-secondary" />
                  Top 5 Rotas
                </CardTitle>
                <CardDescription>Por receita gerada</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-muted/30 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : analytics.topRoutes && analytics.topRoutes.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topRoutes.map((route: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/20 text-secondary font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{route.route}</p>
                          <p className="text-xs text-muted-foreground">{route.count} reservas</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-secondary">
                            R$ {Number(route.revenue).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>

            {/* Top Horários */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Top 5 Horários
                </CardTitle>
                <CardDescription>Horários mais populares</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-muted/30 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : analytics.topHours && analytics.topHours.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topHours.map((hour: any, index: number) => {
                      const maxCount = (analytics.topHours[0] as any)?.count || 1;
                      const percentage = (hour.count / maxCount) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/20 text-primary font-bold text-xs">
                                {index + 1}
                              </div>
                              <span className="font-semibold">{hour.hour}</span>
                            </div>
                            <span className="font-bold text-primary">{hour.count}</span>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>

            {/* Top Dias da Semana */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  Top 5 Dias
                </CardTitle>
                <CardDescription>Dias mais movimentados</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-12 bg-muted/30 rounded animate-pulse"></div>
                    ))}
                  </div>
                ) : analytics.topDays && analytics.topDays.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topDays.map((day: any, index: number) => {
                      const maxCount = (analytics.topDays[0] as any)?.count || 1;
                      const percentage = (day.count / maxCount) * 100;
                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-accent/20 text-accent font-bold text-xs">
                                {index + 1}
                              </div>
                              <span className="font-semibold">{day.day}</span>
                            </div>
                            <span className="font-bold text-accent">{day.count}</span>
                          </div>
                          <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem dados suficientes</p>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <CardTitle>Filtros e Busca</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportToExcel}
              disabled={filteredBookings.length === 0}
              className="hover:bg-secondary/10 hover:text-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar ({filteredBookings.length})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Nome, telefone ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status da Reserva</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmada</SelectItem>
                    <SelectItem value="checked_in">Check-in Feito</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-status">Status do Pagamento</Label>
                <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                  <SelectTrigger id="payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="paid">Pago</SelectItem>
                    <SelectItem value="refunded">Reembolsado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-filter">Período</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger id="date-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Última Semana</SelectItem>
                    <SelectItem value="month">Último Mês</SelectItem>
                    <SelectItem value="custom">Período Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro de Data Personalizado */}
            {dateFilter === 'custom' && (
              <div className="grid gap-4 md:grid-cols-2 p-4 rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Data Inicial</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Data Final</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reservas */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Reservas ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-base font-medium text-muted-foreground">
                Carregando reservas...
              </p>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                Nenhuma reserva encontrada
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedBookings.map((booking: any) => {
                const tripRoute = `${booking.trip?.fromCity || '?'} → ${booking.trip?.toCity || '?'}`;

                return (
                  <div
                    key={booking.id}
                    className="flex items-start justify-between p-5 rounded-lg border hover:shadow-md transition-all hover:border-secondary/30"
                  >
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="font-mono font-bold text-primary">
                          #{booking.id.substring(0, 8).toUpperCase()}
                        </Badge>
                        {getStatusBadge(booking.status)}
                        {getPaymentStatusBadge(booking.paymentStatus)}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" />
                            <span className="font-semibold text-foreground">
                              {booking.passenger?.name || 'Não informado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground/60">
                            <Phone className="h-3.5 w-3.5" />
                            <span>{booking.passenger?.phone || 'Não informado'}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Ship className="h-4 w-4 text-secondary" />
                            <span className="font-semibold text-foreground">{tripRoute}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground/60">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>
                              {booking.trip?.departureTime
                                ? new Date(booking.trip.departureTime).toLocaleString('pt-BR')
                                : 'Data não informada'}
                            </span>
                          </div>
                          {booking.trip?.boat?.name && (
                            <div className="flex items-center gap-2 text-sm text-foreground/60">
                              <Ship className="h-3.5 w-3.5" />
                              <span>{booking.trip.boat.name}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <Badge variant="outline" className="bg-muted">
                          {booking.seats} {booking.seats === 1 ? 'assento' : 'assentos'}
                        </Badge>
                        {booking.seatNumber && (
                          <Badge variant="outline" className="bg-muted">
                            Assento nº {booking.seatNumber}
                          </Badge>
                        )}
                        <span className="font-bold text-secondary text-lg">
                          R$ {Number(booking.totalPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-secondary/10 hover:text-secondary"
                        onClick={() => handleViewDetails(booking.id)}
                      >
                        Ver Detalhes
                      </Button>
                      {booking.paymentStatus === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="hover:bg-accent/10 hover:text-accent"
                          onClick={() => handleConfirmPayment(booking.id)}
                          disabled={confirmPaymentMutation.isPending}
                        >
                          Confirmar Pag.
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Paginação */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredBookings.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Reserva */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Reserva</DialogTitle>
            <DialogDescription>
              Informações completas da reserva, QR codes e histórico
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-3"></div>
              <p className="text-base font-medium text-muted-foreground">
                Carregando detalhes...
              </p>
            </div>
          ) : bookingDetails ? (
            <div className="space-y-6 py-4">
              {/* Cabeçalho com ID e Status */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono font-bold text-primary text-lg px-3 py-1">
                    #{bookingDetails.id.substring(0, 8).toUpperCase()}
                  </Badge>
                  {getStatusBadge(bookingDetails.status)}
                  {getPaymentStatusBadge(bookingDetails.paymentStatus)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Criado em {new Date(bookingDetails.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>

              {/* Timeline de Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status da Reserva</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    {getStatusTimeline(bookingDetails.status).map((item, index) => (
                      <div key={item.status} className="flex items-center flex-1">
                        <div className="flex flex-col items-center">
                          <div
                            className={`rounded-full p-2 ${
                              item.completed
                                ? 'bg-secondary text-white'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {item.completed ? (
                              <CheckCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          <span className="text-xs mt-1 text-center">
                            {item.status === 'pending' && 'Pendente'}
                            {item.status === 'confirmed' && 'Confirmada'}
                            {item.status === 'checked_in' && 'Check-in'}
                            {item.status === 'completed' && 'Concluída'}
                          </span>
                        </div>
                        {index < 3 && (
                          <div
                            className={`flex-1 h-0.5 mx-2 ${
                              item.completed ? 'bg-secondary' : 'bg-muted'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grid com Informações */}
              <div className="grid gap-6 md:grid-cols-2">
                {/* Informações do Passageiro */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Passageiro
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Nome</Label>
                      <p className="font-semibold">{bookingDetails.passenger?.name || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Telefone</Label>
                      <p className="font-semibold">{bookingDetails.passenger?.phone || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Email</Label>
                      <p className="font-semibold">{bookingDetails.passenger?.email || 'Não informado'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Informações da Viagem */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Ship className="h-4 w-4" />
                      Viagem
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Rota</Label>
                      <p className="font-semibold">
                        {bookingDetails.trip?.fromCity || '?'} → {bookingDetails.trip?.toCity || '?'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Embarcação</Label>
                      <p className="font-semibold">{bookingDetails.trip?.boat?.name || 'Não informado'}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Partida</Label>
                      <p className="font-semibold">
                        {bookingDetails.trip?.departureTime
                          ? new Date(bookingDetails.trip.departureTime).toLocaleString('pt-BR')
                          : 'Não informado'}
                      </p>
                    </div>
                    {bookingDetails.trip?.captain && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Capitão</Label>
                        <p className="font-semibold">{bookingDetails.trip.captain.name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Valor Total</Label>
                      <p className="font-bold text-secondary text-xl">
                        R$ {Number(bookingDetails.totalPrice).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Método</Label>
                      <p className="font-semibold">
                        {bookingDetails.paymentMethod === 'pix' && 'PIX'}
                        {bookingDetails.paymentMethod === 'cash' && 'Dinheiro'}
                        {bookingDetails.paymentMethod === 'credit_card' && 'Cartão de Crédito'}
                        {bookingDetails.paymentMethod === 'debit_card' && 'Cartão de Débito'}
                      </p>
                    </div>
                    {bookingDetails.pixPaidAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Pago em</Label>
                        <p className="font-semibold">
                          {new Date(bookingDetails.pixPaidAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações de Assentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Assentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Quantidade</Label>
                      <p className="font-semibold">
                        {bookingDetails.seats} {bookingDetails.seats === 1 ? 'assento' : 'assentos'}
                      </p>
                    </div>
                    {bookingDetails.seatNumber && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Número do Assento</Label>
                        <p className="font-semibold">Assento nº {bookingDetails.seatNumber}</p>
                      </div>
                    )}
                    {bookingDetails.checkedInAt && (
                      <div>
                        <Label className="text-xs text-muted-foreground">Check-in realizado em</Label>
                        <p className="font-semibold">
                          {new Date(bookingDetails.checkedInAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* QR Codes */}
              {(bookingDetails.pixQrCodeImage || bookingDetails.qrCodeCheckin) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Codes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* QR Code PIX */}
                      {bookingDetails.pixQrCodeImage && bookingDetails.paymentStatus === 'pending' && (
                        <div className="space-y-3">
                          <Label className="font-semibold">QR Code PIX - Pagamento</Label>
                          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
                            <img
                              src={bookingDetails.pixQrCodeImage}
                              alt="QR Code PIX"
                              className="w-48 h-48 border-2 border-border rounded"
                            />
                            {bookingDetails.pixExpiresAt && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Expira em: {new Date(bookingDetails.pixExpiresAt).toLocaleString('pt-BR')}
                              </p>
                            )}
                          </div>
                          {bookingDetails.pixQrCode && (
                            <div className="space-y-1">
                              <Label className="text-xs text-muted-foreground">Código PIX (Copia e Cola)</Label>
                              <div className="flex gap-2">
                                <Input
                                  readOnly
                                  value={bookingDetails.pixQrCode}
                                  className="font-mono text-xs"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(bookingDetails.pixQrCode);
                                    alert('Código PIX copiado!');
                                  }}
                                >
                                  Copiar
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* QR Code Check-in */}
                      {bookingDetails.qrCodeCheckin && (
                        <div className="space-y-3">
                          <Label className="font-semibold">QR Code Check-in</Label>
                          <div className="flex flex-col items-center p-4 rounded-lg bg-muted/30">
                            <img
                              src={bookingDetails.qrCodeCheckin}
                              alt="QR Code Check-in"
                              className="w-48 h-48 border-2 border-border rounded"
                            />
                            <p className="text-xs text-muted-foreground mt-2 text-center">
                              Apresente este QR code ao capitão para fazer check-in
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ações */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDetailsDialogOpen(false)}
                >
                  Fechar
                </Button>
                {bookingDetails.paymentStatus === 'pending' && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      confirmPaymentMutation.mutate(bookingDetails.id);
                    }}
                    disabled={confirmPaymentMutation.isPending}
                  >
                    Confirmar Pagamento
                  </Button>
                )}
                {bookingDetails.status !== 'cancelled' && bookingDetails.status !== 'completed' && (
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancelar Reserva
                  </Button>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Dialog de Cancelamento */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Reserva</DialogTitle>
            <DialogDescription>
              Informe o motivo do cancelamento. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Motivo do Cancelamento</Label>
              <Textarea
                id="cancel-reason"
                placeholder="Ex: Cliente solicitou cancelamento, viagem cancelada, etc."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowCancelDialog(false);
                setCancelReason('');
              }}
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleCancelBooking}
              disabled={!cancelReason.trim() || cancelMutation.isPending}
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Confirmar Cancelamento'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
