'use client';

import { useState } from 'react';
import { Search, Package, MapPin, Calendar, Phone, User, Clock, Ship, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShipmentMap } from '@/components/shipment-map';

interface ShipmentTracking {
  shipment: {
    trackingCode: string;
    status: string;
    description: string;
    weight: number;
    recipientName: string;
    recipientPhone: string;
    recipientAddress?: string;
    totalPrice: number;
    trip?: {
      origin: string;
      destination: string;
      departureAt: string;
      estimatedArrivalAt: string;
      status: string;
      currentLat?: number;
      currentLng?: number;
      captain: {
        name: string;
        phone: string;
      };
    };
  };
  timeline: Array<{
    status: string;
    description: string;
    timestamp: string;
  }>;
}

export default function RastreamentoPage() {
  const [trackingCode, setTrackingCode] = useState('');
  const [tracking, setTracking] = useState<ShipmentTracking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async () => {
    const code = trackingCode.trim().toUpperCase();

    if (!code) {
      setError('Digite um código de rastreamento válido');
      return;
    }

    setLoading(true);
    setError('');
    setTracking(null);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const response = await fetch(`${API_URL}/shipments/track/${code}`);

      if (!response.ok) {
        throw new Error('Encomenda não encontrada. Verifique o código e tente novamente.');
      }

      const data = await response.json();
      setTracking(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao rastrear encomenda');
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any; bgColor: string }> = {
      pending: { label: 'Aguardando Coleta', color: 'text-yellow-700', icon: Clock, bgColor: 'bg-yellow-100 border-yellow-300' },
      paid: { label: 'Pago', color: 'text-green-700', icon: CheckCircle, bgColor: 'bg-green-100 border-green-300' },
      collected: { label: 'Coletado', color: 'text-blue-700', icon: Package, bgColor: 'bg-blue-100 border-blue-300' },
      in_transit: { label: 'Em Trânsito', color: 'text-purple-700', icon: Ship, bgColor: 'bg-purple-100 border-purple-300' },
      arrived: { label: 'Chegou ao Destino', color: 'text-indigo-700', icon: MapPin, bgColor: 'bg-indigo-100 border-indigo-300' },
      out_for_delivery: { label: 'Saiu para Entrega', color: 'text-orange-700', icon: Ship, bgColor: 'bg-orange-100 border-orange-300' },
      delivered: { label: 'Entregue', color: 'text-green-700', icon: CheckCircle, bgColor: 'bg-green-100 border-green-300' },
      cancelled: { label: 'Cancelado', color: 'text-red-700', icon: AlertCircle, bgColor: 'bg-red-100 border-red-300' },
    };
    return configs[status] || configs.pending;
  };

  const statusConfig = tracking ? getStatusConfig(tracking.shipment.status) : null;
  const StatusIcon = statusConfig?.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Ship className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">NavegaJá Rastreamento</h1>
              <p className="text-sm text-gray-600">Acompanhe sua encomenda em tempo real</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Search Box */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Rastrear Encomenda
            </CardTitle>
            <CardDescription className="text-blue-100">
              Digite o código de rastreamento fornecido no momento do envio
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ex: NVJAM05678"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
                className="text-lg font-mono"
                disabled={loading}
              />
              <Button
                onClick={handleTrack}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rastreando...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Rastrear
                  </>
                )}
              </Button>
            </div>

            {/* Códigos de exemplo */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-medium mb-2">💡 Códigos de teste disponíveis:</p>
              <div className="flex flex-wrap gap-2">
                {['NVJAM05678', 'NVJAM01234', 'NVJAM09012'].map((code) => (
                  <button
                    key={code}
                    onClick={() => setTrackingCode(code)}
                    className="px-3 py-1 bg-white border border-blue-300 rounded text-sm font-mono text-blue-700 hover:bg-blue-100 transition-colors"
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">Erro ao rastrear</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tracking Result */}
        {tracking && (
          <div className="mt-6 space-y-6">
            {/* Status Atual */}
            <Card className={`shadow-lg border-2 ${statusConfig?.bgColor}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {StatusIcon && <StatusIcon className={`h-8 w-8 ${statusConfig?.color}`} />}
                    <div>
                      <p className="text-sm text-gray-600">Status Atual</p>
                      <p className={`text-2xl font-bold ${statusConfig?.color}`}>
                        {statusConfig?.label}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Código de Rastreamento</p>
                    <p className="text-xl font-mono font-bold text-gray-900">
                      {tracking.shipment.trackingCode}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Encomenda */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  Informações da Encomenda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Descrição</p>
                    <p className="font-medium">{tracking.shipment.description}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Peso</p>
                    <p className="font-medium">{tracking.shipment.weight} kg</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <User className="h-4 w-4" /> Destinatário
                    </p>
                    <p className="font-medium">{tracking.shipment.recipientName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Phone className="h-4 w-4" /> Telefone
                    </p>
                    <p className="font-medium">{tracking.shipment.recipientPhone}</p>
                  </div>
                  {tracking.shipment.recipientAddress && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> Endereço
                      </p>
                      <p className="font-medium">{tracking.shipment.recipientAddress}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valor</p>
                    <p className="font-medium text-green-600">
                      R$ {Number(tracking.shipment.totalPrice || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Informações da Viagem */}
            {tracking.shipment.trip && (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ship className="h-5 w-5 text-purple-600" />
                    Informações da Viagem
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Rota */}
                    <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-600">Origem</p>
                          <p className="font-medium">{tracking.shipment.trip.origin}</p>
                        </div>
                      </div>
                      <div className="text-2xl text-gray-400">→</div>
                      <div className="flex items-center gap-3">
                        <MapPin className="h-5 w-5 text-green-600" />
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Destino</p>
                          <p className="font-medium">{tracking.shipment.trip.destination}</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" /> Partida
                        </p>
                        <p className="font-medium">
                          {format(new Date(tracking.shipment.trip.departureAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" /> Previsão de Chegada
                        </p>
                        <p className="font-medium">
                          {format(new Date(tracking.shipment.trip.estimatedArrivalAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <User className="h-4 w-4" /> Capitão
                        </p>
                        <p className="font-medium">{tracking.shipment.trip.captain.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <Phone className="h-4 w-4" /> Telefone do Capitão
                        </p>
                        <p className="font-medium">{tracking.shipment.trip.captain.phone}</p>
                      </div>
                    </div>

                    {/* Localização Atual */}
                    {tracking.shipment.trip.currentLat && tracking.shipment.trip.currentLng && (
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const url = `https://www.google.com/maps?q=${tracking.shipment.trip!.currentLat},${tracking.shipment.trip!.currentLng}`;
                            window.open(url, '_blank');
                          }}
                        >
                          <MapPin className="mr-2 h-4 w-4" />
                          Ver Localização Atual no Mapa
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Mapa de Localização */}
            {tracking.shipment.trip?.currentLat && tracking.shipment.trip?.currentLng && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Localização em Tempo Real
                    </CardTitle>
                    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Ao Vivo</span>
                    </div>
                  </div>
                  <CardDescription className="text-green-100">
                    Acompanhe a posição atual da embarcação
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-hidden">
                  <ShipmentMap
                    latitude={Number(tracking.shipment.trip.currentLat)}
                    longitude={Number(tracking.shipment.trip.currentLng)}
                    shipmentCode={tracking.shipment.trackingCode}
                  />
                  <div className="p-4 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">Coordenadas GPS</p>
                      <p className="text-blue-700 font-mono">
                        {Number(tracking.shipment.trip.currentLat).toFixed(6)}, {Number(tracking.shipment.trip.currentLng).toFixed(6)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `https://www.google.com/maps?q=${tracking.shipment.trip!.currentLat},${tracking.shipment.trip!.currentLng}`;
                        window.open(url, '_blank');
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Abrir no Google Maps
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Histórico de Rastreamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tracking.timeline.map((event, index) => {
                    const eventConfig = getStatusConfig(event.status);
                    const EventIcon = eventConfig.icon;
                    const isLatest = index === tracking.timeline.length - 1;

                    return (
                      <div key={index} className="flex gap-4">
                        {/* Timeline indicator */}
                        <div className="flex flex-col items-center">
                          <div className={`rounded-full p-2 ${isLatest ? eventConfig.bgColor : 'bg-gray-100'}`}>
                            <EventIcon className={`h-5 w-5 ${isLatest ? eventConfig.color : 'text-gray-400'}`} />
                          </div>
                          {index < tracking.timeline.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-200 mt-2" />
                          )}
                        </div>

                        {/* Event content */}
                        <div className={`flex-1 pb-4 ${isLatest ? 'pt-1' : ''}`}>
                          <p className={`font-medium ${isLatest ? eventConfig.color : 'text-gray-900'}`}>
                            {eventConfig.label}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dúvidas */}
            <Card className="shadow-lg border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Dúvidas sobre sua encomenda?</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Entre em contato com o capitão responsável pela viagem ou com nosso suporte.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
