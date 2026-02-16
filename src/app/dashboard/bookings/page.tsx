'use client';

import { MapPin, Ship, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function BookingsPage() {
  // Dados mockados
  const stats = {
    total: 543,
    confirmed: 412,
    pending: 89,
    cancelled: 42,
  };

  const bookings = [
    {
      id: '1',
      bookingCode: 'NVJ-001234',
      passenger: { name: 'João Silva', phone: '+5592988888888' },
      trip: {
        route: 'Manaus → Parintins',
        departure: '2026-02-20T08:00:00',
        boat: 'Barco Expresso I',
      },
      seats: 2,
      totalPrice: 150.00,
      status: 'confirmed',
      createdAt: '2026-02-15T10:30:00',
    },
    {
      id: '2',
      bookingCode: 'NVJ-001235',
      passenger: { name: 'Maria Santos', phone: '+5592999999999' },
      trip: {
        route: 'Parintins → Manaus',
        departure: '2026-02-22T14:00:00',
        boat: 'Barco Rápido II',
      },
      seats: 1,
      totalPrice: 75.00,
      status: 'pending',
      createdAt: '2026-02-16T09:15:00',
    },
  ];

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
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Total de Reservas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Reservas */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Reservas Recentes</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-start justify-between p-5 rounded-lg border hover:shadow-md transition-all hover:border-secondary/30"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="font-mono font-bold text-primary">
                      {booking.bookingCode}
                    </Badge>
                    {getStatusBadge(booking.status)}
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{booking.passenger.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{booking.passenger.phone}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Ship className="h-4 w-4 text-secondary" />
                        <span className="font-semibold text-foreground">{booking.trip.route}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-foreground/60">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(booking.trip.departure).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="bg-muted">
                      {booking.seats} {booking.seats === 1 ? 'assento' : 'assentos'}
                    </Badge>
                    <span className="font-bold text-secondary text-lg">
                      R$ {booking.totalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="hover:bg-secondary/10 hover:text-secondary">
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
