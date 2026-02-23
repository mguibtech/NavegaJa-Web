'use client';

import { useState } from 'react';
import type { ElementType } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Package, Search, MapPin, Calendar, User, Truck, CheckCircle2, Ship, Weight, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { shipments } from '@/lib/api';
import { Shipment, ShipmentStatus } from '@/types/shipment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Badge de status
function StatusBadge({ status }: { status: ShipmentStatus }) {
  const variants: Record<ShipmentStatus, { className: string; icon: ElementType; label: string; description: string }> = {
    [ShipmentStatus.PENDING]: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Package,
      label: 'Pendente',
      description: 'Aguardando processamento',
    },
    [ShipmentStatus.IN_TRANSIT]: {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Truck,
      label: 'Em Trânsito',
      description: 'Encomenda a caminho do destino',
    },
    [ShipmentStatus.DELIVERED]: {
      className: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle2,
      label: 'Entregue',
      description: 'Encomenda entregue com sucesso',
    },
    [ShipmentStatus.CANCELLED]: {
      className: 'bg-red-100 text-red-800 border-red-300',
      icon: Package,
      label: 'Cancelada',
      description: 'Encomenda cancelada',
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-full p-3 ${config.className.replace('text-', 'bg-').replace('-800', '-200')}`}>
        <Icon className={`h-6 w-6 ${config.className.split(' ')[1]}`} />
      </div>
      <div>
        <Badge className={`${config.className} text-sm px-3 py-1`}>
          {config.label}
        </Badge>
        <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
      </div>
    </div>
  );
}

export default function TrackPage() {
  const [trackingCode, setTrackingCode] = useState('');

  const trackMutation = useMutation({
    mutationFn: (code: string) => shipments.getByTrackingCode(code),
  });

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingCode.trim()) {
      trackMutation.mutate(trackingCode.trim());
    }
  };

  const shipment = trackMutation.data as Shipment | undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-mid to-primary-light p-4">
      <div className="container mx-auto max-w-4xl py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-white p-4 mb-4 shadow-lg">
            <Ship className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Rastreamento NavegaJá</h1>
          <p className="text-white/90 text-lg">
            Acompanhe sua encomenda em tempo real
          </p>
        </div>

        {/* Formulário de Busca */}
        <Card className="shadow-2xl mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rastrear Encomenda
            </CardTitle>
            <CardDescription>
              Digite o código de rastreamento para consultar o status da sua encomenda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracking-code">Código de Rastreamento</Label>
                <div className="flex gap-2">
                  <Input
                    id="tracking-code"
                    placeholder="Ex: ENC-2026-001"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                    className="font-mono text-lg"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={trackMutation.isPending}
                    className="px-8"
                  >
                    {trackMutation.isPending ? 'Buscando...' : 'Rastrear'}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Erro */}
        {trackMutation.isError && (
          <Card className="shadow-lg border-red-200 bg-red-50 mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <Package className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">Encomenda não encontrada</p>
                  <p className="text-sm text-red-700">
                    Verifique se o código de rastreamento está correto e tente novamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resultado */}
        {shipment && (
          <div className="space-y-6">
            {/* Status */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle>Status da Encomenda</CardTitle>
                <CardDescription className="font-mono font-semibold text-base text-foreground">
                  {shipment.trackingCode}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <StatusBadge status={shipment.status} />
              </CardContent>
            </Card>

            {/* Detalhes da Rota */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Rota
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">Origem</p>
                    <p className="text-lg font-semibold">{shipment.origin}</p>
                  </div>
                  <div className="px-4">
                    <div className="h-0.5 w-12 bg-gradient-to-r from-primary to-secondary"></div>
                    <div className="flex justify-center mt-1">
                      <Ship className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm text-muted-foreground mb-1">Destino</p>
                    <p className="text-lg font-semibold">{shipment.destination}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Encomenda */}
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Package className="h-4 w-4" />
                    Informações da Encomenda
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Descrição</p>
                    <p className="font-medium">{shipment.description}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Peso</p>
                      <p className="font-medium flex items-center gap-1">
                        <Weight className="h-4 w-4" />
                        {shipment.weight} kg
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Valor</p>
                      <p className="font-medium flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        R$ {shipment.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="h-4 w-4" />
                    Datas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Data de Envio</p>
                    <p className="font-medium">
                      {format(new Date(shipment.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {shipment.estimatedDelivery && (
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de Entrega</p>
                      <p className="font-medium">
                        {format(new Date(shipment.estimatedDelivery), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                  {shipment.deliveredAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Entrega</p>
                      <p className="font-medium text-green-600">
                        {format(new Date(shipment.deliveredAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Viagem Associada */}
            {shipment.trip && (
              <Card className="shadow-lg">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Viagem Associada
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Embarcação</p>
                      <p className="font-semibold text-lg">{shipment.trip.boat.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data de Partida</p>
                      <p className="font-semibold text-lg">
                        {format(new Date(shipment.trip.scheduledDeparture), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Destinatário */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Destinatário
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome</p>
                    <p className="font-semibold">{shipment.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço de Entrega</p>
                    <p className="font-medium">{shipment.recipientAddress}</p>
                    <p className="text-sm text-muted-foreground mt-1">{shipment.destination}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-white/80">
          <p className="text-sm">
            NavegaJá - Conectando a Amazônia através dos rios
          </p>
        </div>
      </div>
    </div>
  );
}
