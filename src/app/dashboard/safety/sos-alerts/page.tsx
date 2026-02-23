'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MapPin, Phone, Clock, CheckCircle, XCircle, RefreshCw, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Pagination } from '@/components/ui/pagination';
import { safety } from '@/lib/api';
import { SosAlert, SosAlertStatus } from '@/types/safety';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo, useEffect, startTransition } from 'react';
import type { ElementType } from 'react';
import dynamic from 'next/dynamic';

// Carregar mapa dinamicamente (apenas no cliente)
const SosMapDynamic = dynamic(
  () => import('@/components/map/sos-map').then((mod) => mod.SosMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-lg border bg-muted">
        <div className="text-center space-y-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    ),
  }
);

// Componente de Mapa
function AlertMap({ alerts }: { alerts: SosAlert[] }) {
  return <SosMapDynamic alerts={alerts} />;
}

// Dialog para resolver alerta
function ResolveAlertDialog({ alert }: { alert: SosAlert }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string>(SosAlertStatus.RESOLVED);
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);

  const resolveMutation = useMutation({
    mutationFn: () => safety.resolveSosAlert(alert.id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sos-alerts'] });
      setOpen(false);
      setNotes('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="hover:bg-secondary/10 hover:text-secondary">
          Resolver
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resolver Alerta SOS</DialogTitle>
          <DialogDescription>
            Registre a resolução do alerta de {alert.user.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SosAlertStatus.RESOLVED}>Resolvido</SelectItem>
                <SelectItem value={SosAlertStatus.FALSE_ALARM}>Falso Alarme</SelectItem>
                <SelectItem value={SosAlertStatus.CANCELLED}>Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              placeholder="Descreva como o alerta foi resolvido..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => resolveMutation.mutate()}
            disabled={resolveMutation.isPending}
            className="bg-secondary hover:bg-secondary/90"
          >
            {resolveMutation.isPending ? 'Salvando...' : 'Salvar Resolução'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Badge de status
function StatusBadge({ status }: { status: SosAlertStatus }) {
  const variants: Record<SosAlertStatus, { className: string; icon: ElementType; label: string }> = {
    [SosAlertStatus.ACTIVE]: {
      className: 'bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25',
      icon: AlertTriangle,
      label: 'Ativo',
    },
    [SosAlertStatus.RESOLVED]: {
      className: 'bg-secondary/15 text-secondary border-secondary/30 hover:bg-secondary/25',
      icon: CheckCircle,
      label: 'Resolvido',
    },
    [SosAlertStatus.FALSE_ALARM]: {
      className: 'bg-muted text-muted-foreground border-border',
      icon: XCircle,
      label: 'Falso Alarme',
    },
    [SosAlertStatus.CANCELLED]: {
      className: 'bg-muted text-muted-foreground border-border',
      icon: XCircle,
      label: 'Cancelado',
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

// Componente principal
export default function SosAlertsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: safety.getActiveSosAlerts,
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  // Filtrar alertas por busca e status
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert: SosAlert) => {
      // Filtro de busca
      const matchesSearch = !searchTerm ||
        alert.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.user.phone.includes(searchTerm) ||
        alert.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.location?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de status
      const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [alerts, searchTerm, statusFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useEffect(() => {
    startTransition(() => {
      setCurrentPage(1);
    });
  }, [searchTerm, statusFilter]);

  const activeAlerts = alerts.filter((a: SosAlert) => a.status === SosAlertStatus.ACTIVE);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg bg-linear-to-br from-destructive/5 via-destructive/5 to-transparent p-6 border border-destructive/10">
        <div className="flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-destructive/10 p-2">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Alertas SOS
              </h1>
              <p className="mt-1 text-base text-foreground/70">
                Monitoramento em tempo real de emergências
              </p>
            </div>
          </div>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="hover:bg-destructive/10 hover:text-destructive"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="border-l-4 border-l-destructive shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-4xl font-bold text-destructive">
                {activeAlerts.length}
              </div>
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  EM ANDAMENTO
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{alerts.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Taxa de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">
              {alerts.length > 0
                ? Math.round(((alerts.length - activeAlerts.length) / alerts.length) * 100)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle>Mapa de Alertas</CardTitle>
          </div>
          <CardDescription>
            Visualização geográfica dos alertas ativos em tempo real
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <AlertMap alerts={activeAlerts} />
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <Card className="shadow-md">
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
                  placeholder="Nome, telefone, descrição, localização..."
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
                  <SelectItem value={SosAlertStatus.ACTIVE}>Ativo</SelectItem>
                  <SelectItem value={SosAlertStatus.RESOLVED}>Resolvido</SelectItem>
                  <SelectItem value={SosAlertStatus.FALSE_ALARM}>Falso Alarme</SelectItem>
                  <SelectItem value={SosAlertStatus.CANCELLED}>Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Lista de Alertas</CardTitle>
          <CardDescription>
            {filteredAlerts.length} alerta(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Carregando alertas...</p>
              </div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                {alerts.length === 0 ? 'Nenhum alerta registrado' : 'Nenhum resultado encontrado'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {alerts.length === 0
                  ? 'Quando houver alertas, eles aparecerão aqui'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedAlerts.map((alert: SosAlert) => (
                <div
                  key={alert.id}
                  className={`
                    flex items-start justify-between rounded-lg border p-5 transition-all hover:shadow-md
                    ${alert.status === SosAlertStatus.ACTIVE
                      ? 'border-l-4 border-l-destructive bg-linear-to-r from-destructive/5 to-transparent'
                      : 'hover:border-primary/30'
                    }
                  `}
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <StatusBadge status={alert.status} />
                      <Badge
                        variant="outline"
                        className="bg-primary/5 text-primary border-primary/30"
                      >
                        {alert.type}
                      </Badge>
                      {alert.status === SosAlertStatus.ACTIVE && (
                        <span className="flex h-2 w-2">
                          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-destructive opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive"></span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="font-semibold text-lg text-foreground">{alert.user.name}</p>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-1.5">
                          <Phone className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <a
                          href={`tel:${alert.user.phone}`}
                          className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                        >
                          {alert.user.phone}
                        </a>
                      </div>
                    </div>

                    {alert.description && (
                      <p className="text-sm leading-relaxed text-foreground/70 bg-muted/30 p-3 rounded-lg">
                        {alert.description}
                      </p>
                    )}

                    {alert.location && (
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-secondary/10 p-1.5">
                          <MapPin className="h-3.5 w-3.5 text-secondary" />
                        </div>
                        <span className="text-sm text-foreground/60">
                          {(() => {
                            try {
                              const parsed = JSON.parse(alert.location!);
                              if (parsed.latitude && parsed.longitude) {
                                return (
                                  <a
                                    href={`https://www.google.com/maps?q=${parsed.latitude},${parsed.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-secondary underline"
                                  >
                                    {parsed.latitude.toFixed(6)}, {parsed.longitude.toFixed(6)}
                                  </a>
                                );
                              }
                            } catch {
                              // plain text location
                            }
                            return alert.location;
                          })()}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {format(new Date(alert.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    {alert.status === SosAlertStatus.ACTIVE && (
                      <>
                        <Button
                          size="sm"
                          className="bg-destructive hover:bg-destructive/90 text-white shadow-sm"
                          asChild
                        >
                          <a href={`tel:${alert.user.phone}`}>
                            <Phone className="h-4 w-4 mr-2" />
                            Ligar
                          </a>
                        </Button>
                        <ResolveAlertDialog alert={alert} />
                      </>
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
                  totalItems={filteredAlerts.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
