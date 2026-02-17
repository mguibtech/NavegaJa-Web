'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Package, Filter, Search, MapPin, Calendar, User, DollarSign, Eye, X, Truck, CheckCircle2, Weight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { shipments, admin } from '@/lib/api';
import { Shipment, ShipmentStatus } from '@/types/shipment';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShipmentMap } from '@/components/shipment-map';

// Badge de status
function StatusBadge({ status }: { status: ShipmentStatus }) {
  const variants: Record<ShipmentStatus, { className: string; icon: any; label: string }> = {
    [ShipmentStatus.PENDING]: {
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: Package,
      label: 'Pendente',
    },
    [ShipmentStatus.IN_TRANSIT]: {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: Truck,
      label: 'Em Trânsito',
    },
    [ShipmentStatus.DELIVERED]: {
      className: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle2,
      label: 'Entregue',
    },
    [ShipmentStatus.CANCELLED]: {
      className: 'bg-red-100 text-red-800 border-red-300',
      icon: X,
      label: 'Cancelada',
    },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Modal de detalhes
function ShipmentDetailsDialog({ shipment }: { shipment: Shipment }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Detalhes da Encomenda
          </DialogTitle>
          <DialogDescription>
            Código de rastreamento: <span className="font-mono font-semibold">{shipment.trackingCode}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Status */}
          <div>
            <StatusBadge status={shipment.status} />
          </div>

          {/* Remetente e Destinatário */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                Remetente
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nome:</span> {shipment.senderName}</p>
                <p><span className="font-medium">Telefone:</span> {shipment.senderPhone}</p>
                <p><span className="font-medium">Origem:</span> {shipment.origin}</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4" />
                Destinatário
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nome:</span> {shipment.recipientName}</p>
                <p><span className="font-medium">Telefone:</span> {shipment.recipientPhone}</p>
                <p><span className="font-medium">Destino:</span> {shipment.destination}</p>
                <p><span className="font-medium">Endereço:</span> {shipment.recipientAddress}</p>
              </div>
            </div>
          </div>

          {/* Detalhes da Encomenda */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-semibold">Detalhes</div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Descrição:</p>
                <p>{shipment.description}</p>
              </div>
              <div>
                <p className="font-medium">Peso:</p>
                <p>{shipment.weight} kg</p>
              </div>
              <div>
                <p className="font-medium">Preço:</p>
                <p>R$ {Number(shipment.price || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Viagem */}
          {shipment.trip && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4" />
                Viagem Associada
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Embarcação:</span> {shipment.trip.boat?.name || 'N/A'}</p>
                <p><span className="font-medium">Partida:</span> {shipment.trip.scheduledDeparture ? format(new Date(shipment.trip.scheduledDeparture), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>

              </div>
            </div>
          )}

          {/* Mapa de Localização */}
          {shipment.trip?.currentLat && shipment.trip?.currentLng && (
            <div className="rounded-lg border p-4 bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-900">
                <MapPin className="h-4 w-4" />
                Localização em Tempo Real
              </div>
              <ShipmentMap
                latitude={Number(shipment.trip.currentLat)}
                longitude={Number(shipment.trip.currentLng)}
                shipmentCode={shipment.trackingCode}
              />
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span className="font-mono">
                  📍 {Number(shipment.trip.currentLat).toFixed(6)}, {Number(shipment.trip.currentLng).toFixed(6)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const url = `https://www.google.com/maps?q=${shipment.trip!.currentLat},${shipment.trip!.currentLng}`;
                    window.open(url, '_blank');
                  }}
                >
                  Abrir no Google Maps →
                </Button>
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4" />
              Datas
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Criada em:</p>
                <p>{format(new Date(shipment.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
              </div>
              {shipment.estimatedDelivery && (
                <div>
                  <p className="font-medium">Previsão de Entrega:</p>
                  <p>{format(new Date(shipment.estimatedDelivery), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              )}
              {shipment.deliveredAt && (
                <div>
                  <p className="font-medium">Entregue em:</p>
                  <p>{format(new Date(shipment.deliveredAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {shipment.notes && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">Observações</div>
              <p className="text-sm text-muted-foreground">{shipment.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ShipmentsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Query para buscar encomendas
  const { data: shipmentsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-shipments', statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      try {
        return await admin.shipments.getAll(params);
      } catch (err: any) {
        console.error('Erro ao buscar encomendas:', err);
        console.error('Status:', err.response?.status);
        console.error('Data:', err.response?.data);
        throw err;
      }
    },
    refetchInterval: 30000,
    retry: false,
  });

  // Debug: ver resposta do backend
  console.log('🔍 Resposta do backend:', shipmentsResponse);
  console.log('🔍 Tipo:', typeof shipmentsResponse, 'Array?', Array.isArray(shipmentsResponse));
  console.log('🔍 shipmentsResponse?.data:', shipmentsResponse?.data);

  // Backend pode retornar array direto ou objeto com data
  const shipmentsData = Array.isArray(shipmentsResponse)
    ? shipmentsResponse
    : (shipmentsResponse?.data || []);

  console.log('🔍 shipmentsData final:', shipmentsData, 'length:', shipmentsData.length);

  // Filtrar por busca
  const filteredShipments = useMemo(() => {
    return shipmentsData.filter((shipment: Shipment) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        shipment.trackingCode.toLowerCase().includes(search) ||
        shipment.senderName.toLowerCase().includes(search) ||
        shipment.recipientName.toLowerCase().includes(search) ||
        shipment.origin.toLowerCase().includes(search) ||
        shipment.destination.toLowerCase().includes(search) ||
        shipment.description.toLowerCase().includes(search)
      );
    });
  }, [shipmentsData, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredShipments.length / itemsPerPage);
  const paginatedShipments = filteredShipments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Encomendas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as encomendas do sistema NavegaJá
          </p>
        </div>
        <Button onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total de Encomendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shipmentsData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {shipmentsData.filter((s: Shipment) => s.status === ShipmentStatus.PENDING).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Trânsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {shipmentsData.filter((s: Shipment) => s.status === ShipmentStatus.IN_TRANSIT).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {shipmentsData.filter((s: Shipment) => s.status === ShipmentStatus.DELIVERED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros e Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código, remetente, destinatário, origem, destino..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value={ShipmentStatus.PENDING}>Pendente</SelectItem>
                  <SelectItem value={ShipmentStatus.IN_TRANSIT}>Em Trânsito</SelectItem>
                  <SelectItem value={ShipmentStatus.DELIVERED}>Entregue</SelectItem>
                  <SelectItem value={ShipmentStatus.CANCELLED}>Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Encomendas */}
      <Card>
        <CardHeader>
          <CardTitle>Encomendas</CardTitle>
          <CardDescription>
            {filteredShipments.length} encomenda(s) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                {shipmentsData.length === 0 ? 'Nenhuma encomenda registrada' : 'Nenhum resultado encontrado'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {shipmentsData.length === 0
                  ? 'Quando houver encomendas, elas aparecerão aqui'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedShipments.map((shipment: Shipment) => (
                <div
                  key={shipment.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={shipment.status} />
                      <Badge variant="outline" className="font-mono text-xs">
                        {shipment.trackingCode}
                      </Badge>
                    </div>
                    <div className="grid gap-2 md:grid-cols-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Rota</p>
                        <p className="font-medium">
                          {shipment.origin} → {shipment.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Remetente</p>
                        <p className="font-medium">{shipment.senderName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Destinatário</p>
                        <p className="font-medium">{shipment.recipientName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Weight className="h-3.5 w-3.5" />
                        <span>{shipment.weight} kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>R$ {Number(shipment.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {/* Botão de rastreamento no mapa */}
                    {shipment.trip?.currentLat && shipment.trip?.currentLng && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `https://www.google.com/maps?q=${shipment.trip!.currentLat},${shipment.trip!.currentLng}`;
                          window.open(url, '_blank');
                        }}
                        title="Ver localização no mapa"
                      >
                        <MapPin className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/dashboard/shipments/${shipment.id}`)}
                      title="Ver detalhes completos"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredShipments.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
