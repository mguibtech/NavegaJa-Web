'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Package, MapPin, Calendar, User, Phone, DollarSign, Weight, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { admin } from '@/lib/api';
import { Shipment, ShipmentStatus } from '@/types/shipment';

interface ShipmentDetail extends Shipment {
  sender?: { name: string; phone: string };
  totalPrice?: number;
  _weight?: number;
  trip?: Shipment['trip'] & {
    route?: { originName: string; destinationName: string };
    captain?: { name: string };
    departureAt?: string;
  };
}
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShipmentMap } from '@/components/shipment-map';

// Badge de status
function StatusBadge({ status }: { status: ShipmentStatus }) {
  const variants: Record<ShipmentStatus, { className: string; label: string }> = {
    [ShipmentStatus.PENDING]: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      label: 'Pendente',
    },
    [ShipmentStatus.IN_TRANSIT]: {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      label: 'Em Trânsito',
    },
    [ShipmentStatus.DELIVERED]: {
      className: 'bg-green-100 text-green-800 border-green-300',
      label: 'Entregue',
    },
    [ShipmentStatus.CANCELLED]: {
      className: 'bg-red-100 text-red-800 border-red-300',
      label: 'Cancelada',
    },
  };

  const config = variants[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}

export default function ShipmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const shipmentId = params.id as string;

  const { data: shipment, isLoading } = useQuery({
    queryKey: ['shipment', shipmentId],
    queryFn: async () => {
      // Buscar todas e filtrar por ID (backend não tem endpoint por ID)
      const response = await admin.shipments.getAll({ limit: 100 });
      const list = Array.isArray(response) ? response : (response?.data || []);
      return (list as ShipmentDetail[]).find((s) => s.id === shipmentId) || null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Carregando detalhes da encomenda...</p>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-600">Encomenda não encontrada</p>
        <Button onClick={() => router.back()} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Detalhes da Encomenda</h1>
            <p className="text-muted-foreground">
              Código: <span className="font-mono font-semibold">{shipment.trackingCode}</span>
            </p>
          </div>
        </div>
        <StatusBadge status={shipment.status} />
      </div>

      {/* Cards de informação em linha horizontal */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Remetente */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-blue-600">
              <User className="h-4 w-4" />
              Remetente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="font-medium">{(shipment as ShipmentDetail).sender?.name || (shipment as ShipmentDetail).senderName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{(shipment as ShipmentDetail).sender?.phone || (shipment as ShipmentDetail).senderPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Origem</p>
              <p className="font-medium">{(shipment as ShipmentDetail).trip?.route?.originName || (shipment as ShipmentDetail).origin || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Destinatário */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-green-600">
              <MapPin className="h-4 w-4" />
              Destinatário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="font-medium">{shipment.recipientName || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="font-medium">{shipment.recipientPhone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Destino</p>
              <p className="font-medium">{(shipment as ShipmentDetail).trip?.route?.destinationName || (shipment as ShipmentDetail).destination || 'N/A'}</p>
            </div>
            {shipment.recipientAddress && (
              <div>
                <p className="text-xs text-muted-foreground">Endereço</p>
                <p className="font-medium">{shipment.recipientAddress}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detalhes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-purple-600">
              <Package className="h-4 w-4" />
              Detalhes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Descrição</p>
              <p className="font-medium">{shipment.description}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Peso</p>
              <p className="font-medium flex items-center gap-1">
                <Weight className="h-3 w-3" />
                {(shipment as ShipmentDetail)._weight || shipment.weight || '–'} kg
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor</p>
              <p className="font-medium text-green-600 flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                R$ {Number((shipment as ShipmentDetail).totalPrice || shipment.price || 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Viagem */}
        {(shipment as ShipmentDetail).trip ? (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                <Truck className="h-4 w-4" />
                Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Embarcação</p>
                <p className="font-medium">{(shipment as ShipmentDetail).trip!.boat?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Capitão</p>
                <p className="font-medium">{(shipment as ShipmentDetail).trip!.captain?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Partida</p>
                <p className="font-medium">
                  {((shipment as ShipmentDetail).trip!.departureAt || (shipment as ShipmentDetail).trip!.scheduledDeparture)
                    ? format(new Date((shipment as ShipmentDetail).trip!.departureAt || (shipment as ShipmentDetail).trip!.scheduledDeparture), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                    : 'N/A'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex items-center justify-center">
            <CardContent className="text-center py-6 text-sm text-muted-foreground">
              Sem viagem vinculada
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mapa em largura total */}
      {(shipment as ShipmentDetail).trip?.currentLat && (shipment as ShipmentDetail).trip?.currentLng ? (
        <Card>
          <CardHeader className="bg-linear-to-r from-green-600 to-blue-600 text-white rounded-t-lg">
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
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <ShipmentMap
              latitude={Number((shipment as ShipmentDetail).trip!.currentLat)}
              longitude={Number((shipment as ShipmentDetail).trip!.currentLng)}
              shipmentCode={shipment.trackingCode}
            />
            <div className="p-4 bg-blue-50 border-t border-blue-200 flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium text-blue-900">Coordenadas GPS</p>
                <p className="text-blue-700 font-mono text-xs mt-0.5">
                  {Number((shipment as ShipmentDetail).trip!.currentLat).toFixed(6)}, {Number((shipment as ShipmentDetail).trip!.currentLng).toFixed(6)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const url = `https://www.google.com/maps?q=${(shipment as ShipmentDetail).trip!.currentLat},${(shipment as ShipmentDetail).trip!.currentLng}`;
                  window.open(url, '_blank');
                }}
              >
                <MapPin className="mr-2 h-4 w-4" />
                Abrir no Google Maps
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="flex items-center justify-center min-h-40">
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-base font-medium text-gray-600">Localização GPS não disponível</p>
            <p className="text-sm text-gray-500 mt-1">
              A embarcação ainda não iniciou a viagem ou não possui rastreamento GPS ativo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
