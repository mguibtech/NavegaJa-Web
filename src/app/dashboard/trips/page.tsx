'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Ship, Filter, Plus, MapPin, Calendar, Users, DollarSign, Eye, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { trips, admin } from '@/lib/api';
import { Trip, TripStatus, TripType } from '@/types/trip';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Badge de status
function StatusBadge({ status }: { status: TripStatus }) {
  const variants: Record<TripStatus, { variant: any; label: string }> = {
    [TripStatus.SCHEDULED]: { variant: 'default', label: 'Agendada' },
    [TripStatus.IN_PROGRESS]: { variant: 'default', label: 'Em Andamento' },
    [TripStatus.COMPLETED]: { variant: 'secondary', label: 'Concluída' },
    [TripStatus.CANCELLED]: { variant: 'destructive', label: 'Cancelada' },
  };

  const config = variants[status] || variants[TripStatus.SCHEDULED];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}

// Badge de tipo
function TypeBadge({ type }: { type?: TripType }) {
  const labels: Record<TripType, string> = {
    [TripType.PASSENGER]: 'Passageiros',
    [TripType.CARGO]: 'Carga',
    [TripType.MIXED]: 'Misto',
  };

  if (!type) return null;

  return <Badge variant="outline">{labels[type] || 'N/A'}</Badge>;
}

// Modal de detalhes
function TripDetailsDialog({ trip }: { trip: Trip }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Detalhes da Viagem
          </DialogTitle>
          <DialogDescription>
            Informações completas da viagem #{trip.id.substring(0, 8)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Status e Tipo */}
          <div className="flex gap-2">
            <StatusBadge status={trip.status} />
            <TypeBadge type={trip.type} />
          </div>

          {/* Rota */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4" />
              Rota
            </div>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Origem:</span> {trip.origin || 'N/A'}</p>
              <p><span className="font-medium">Destino:</span> {trip.destination || 'N/A'}</p>
              {trip.route?.distance && <p><span className="font-medium">Distância:</span> {trip.route.distance} km</p>}
            </div>
          </div>

          {/* Horários */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4" />
              Horários
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <p className="font-medium">Partida Prevista:</p>
                <p>{trip.departureAt ? format(new Date(trip.departureAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">Chegada Prevista:</p>
                <p>{trip.estimatedArrivalAt ? format(new Date(trip.estimatedArrivalAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Embarcação e Capitão */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Ship className="h-4 w-4" />
                Embarcação
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nome:</span> {trip.boat?.name || 'N/A'}</p>
                <p><span className="font-medium">Capacidade:</span> {trip.boat?.capacity || 0} pessoas</p>
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Capitão
              </div>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nome:</span> {trip.captain?.name || 'N/A'}</p>
                <p><span className="font-medium">Telefone:</span> {trip.captain?.phone || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Passageiros e Preço */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" />
                Passageiros
              </div>
              <p className="text-2xl font-bold">{trip.totalSeats - trip.availableSeats}/{trip.totalSeats}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="h-4 w-4" />
                Preço
              </div>
              <p className="text-2xl font-bold">R$ {trip.price ? Number(trip.price).toFixed(2) : '0.00'}</p>
            </div>
          </div>

          {/* Observações */}
          {trip.notes && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">Observações</div>
              <p className="text-sm text-muted-foreground">{trip.notes}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function TripsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Query para buscar viagens (usando endpoint admin)
  const { data: tripsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-trips', statusFilter, typeFilter],
    queryFn: () => {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      return admin.trips.getAll(params);
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  const tripsData = tripsResponse?.data || [];

  // Mutation para cancelar viagem (usando endpoint admin)
  const cancelMutation = useMutation({
    mutationFn: (id: string) => admin.trips.updateStatus(id, 'cancelled'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-trips'] });
    },
  });

  // Filtrar por busca
  const filteredTrips = useMemo(() => {
    return tripsData.filter((trip: Trip) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        trip.origin?.toLowerCase().includes(search) ||
        trip.destination?.toLowerCase().includes(search) ||
        trip.boat?.name.toLowerCase().includes(search) ||
        trip.captain?.name.toLowerCase().includes(search)
      );
    });
  }, [tripsData, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredTrips.length / itemsPerPage);
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Viagens</h1>
          <p className="text-muted-foreground">
            Gerencie todas as viagens do sistema NavegaJá
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
            <CardTitle className="text-sm font-medium">Total de Viagens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tripsData.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agendadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {tripsData.filter((t: Trip) => t.status === TripStatus.SCHEDULED).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {tripsData.filter((t: Trip) => t.status === TripStatus.IN_PROGRESS).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tripsData.filter((t: Trip) => t.status === TripStatus.COMPLETED).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Origem, destino, barco, capitão..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={TripStatus.SCHEDULED}>Agendadas</SelectItem>
                  <SelectItem value={TripStatus.IN_PROGRESS}>Em Andamento</SelectItem>
                  <SelectItem value={TripStatus.COMPLETED}>Concluídas</SelectItem>
                  <SelectItem value={TripStatus.CANCELLED}>Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value={TripType.PASSENGER}>Passageiros</SelectItem>
                  <SelectItem value={TripType.CARGO}>Carga</SelectItem>
                  <SelectItem value={TripType.MIXED}>Misto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Viagens */}
      <Card>
        <CardHeader>
          <CardTitle>Viagens</CardTitle>
          <CardDescription>
            {filteredTrips.length} viagem(ns) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : filteredTrips.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhuma viagem encontrada
            </p>
          ) : (
            <div className="space-y-4">
              {paginatedTrips.map((trip: Trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={trip.status} />
                      <TypeBadge type={trip.type} />
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Rota</p>
                        <p className="font-medium">
                          {trip.origin} → {trip.destination}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Partida</p>
                        <p className="font-medium">
                          {trip.departureAt ? format(new Date(trip.departureAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Data não definida'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Embarcação</p>
                        <p className="font-medium">{trip.boat?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Passageiros</p>
                        <p className="font-medium">{trip.totalSeats - trip.availableSeats}/{trip.totalSeats}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <TripDetailsDialog trip={trip} />
                    {trip.status === TripStatus.SCHEDULED && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate(trip.id)}
                        disabled={cancelMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
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
                  totalItems={filteredTrips.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
