'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Clock, Ship, Filter, Search, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { admin } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Badge de status
function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: any; className: string; icon: any; label: string }> = {
    approved: {
      variant: 'default',
      className: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      label: 'Aprovado',
    },
    pending: {
      variant: 'secondary',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: Clock,
      label: 'Pendente',
    },
    rejected: {
      variant: 'destructive',
      className: 'bg-red-100 text-red-800 border-red-300',
      icon: XCircle,
      label: 'Reprovado',
    },
  };

  const config = variants[status] || variants.pending;
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

export default function ChecklistsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Query para estatísticas
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['admin-checklist-stats'],
    queryFn: admin.safety.getChecklistStats,
    refetchInterval: 30000,
  });

  // Query para checklists
  const { data: checklistsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-checklists', statusFilter],
    queryFn: () => {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      return admin.safety.getChecklists(params);
    },
    refetchInterval: 30000,
  });

  const checklistsData = checklistsResponse?.data || [];

  // Filtrar por busca
  const filteredChecklists = useMemo(() => {
    return checklistsData.filter((checklist: any) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        checklist.boat?.name.toLowerCase().includes(search) ||
        checklist.captain?.name.toLowerCase().includes(search) ||
        checklist.trip?.route?.origin.toLowerCase().includes(search) ||
        checklist.trip?.route?.destination.toLowerCase().includes(search)
      );
    });
  }, [checklistsData, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredChecklists.length / itemsPerPage);
  const paginatedChecklists = filteredChecklists.slice(
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
          <h1 className="text-3xl font-bold tracking-tight">Checklists de Segurança</h1>
          <p className="text-muted-foreground">
            Verificações de segurança realizadas pelos capitães antes das viagens
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Checklists Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.today || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.todayChange >= 0 ? '+' : ''}{stats?.todayChange || 0} desde ontem
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-green-600">
                  {stats?.approvalRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.approved || 0} aprovados de {stats?.total || 0}
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <div className="text-sm text-muted-foreground">Carregando...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.pending || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando verificação
                </p>
              </>
            )}
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
                  placeholder="Embarcação, capitão, origem, destino..."
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
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="rejected">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Checklists */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Verificações</CardTitle>
          <CardDescription>
            {filteredChecklists.length} checklist(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredChecklists.length === 0 ? (
            <div className="text-center py-12">
              <Ship className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                {checklistsData.length === 0 ? 'Nenhum checklist registrado' : 'Nenhum resultado encontrado'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {checklistsData.length === 0
                  ? 'Quando houver checklists, eles aparecerão aqui'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedChecklists.map((checklist: any) => (
                <div
                  key={checklist.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Ship className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-medium">{checklist.boat?.name || 'Embarcação não especificada'}</p>
                        <p className="text-sm text-muted-foreground">
                          Capitão: {checklist.captain?.name || 'Não especificado'}
                        </p>
                      </div>
                      {checklist.trip && (
                        <p className="text-sm text-muted-foreground">
                          Rota: {checklist.trip.route?.origin || 'N/A'} → {checklist.trip.route?.destination || 'N/A'}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {checklist.createdAt
                            ? format(new Date(checklist.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                            : 'Data não disponível'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 ml-4">
                    <StatusBadge status={checklist.status || 'pending'} />
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
                  totalItems={filteredChecklists.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
