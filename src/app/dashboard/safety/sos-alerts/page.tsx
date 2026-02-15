'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, MapPin, Phone, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { safety } from '@/lib/api';
import { SosAlert, SosAlertStatus } from '@/types/safety';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useEffect } from 'react';

// Componente de Mapa (simplificado - requer leaflet)
function AlertMap({ alerts }: { alerts: SosAlert[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border bg-muted">
        <p className="text-muted-foreground">Carregando mapa...</p>
      </div>
    );
  }

  return (
    <div className="relative h-96 rounded-lg border bg-muted">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Mapa com {alerts.length} alertas
          </p>
          <p className="text-xs text-muted-foreground">
            (Integração Leaflet será adicionada)
          </p>
        </div>
      </div>
    </div>
  );
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
        <Button size="sm" variant="outline">
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
  const variants: Record<SosAlertStatus, { variant: any; icon: any }> = {
    [SosAlertStatus.ACTIVE]: { variant: 'destructive', icon: AlertTriangle },
    [SosAlertStatus.RESOLVED]: { variant: 'default', icon: CheckCircle },
    [SosAlertStatus.FALSE_ALARM]: { variant: 'secondary', icon: XCircle },
    [SosAlertStatus.CANCELLED]: { variant: 'outline', icon: XCircle },
  };

  const config = variants[status];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {status === SosAlertStatus.ACTIVE && 'Ativo'}
      {status === SosAlertStatus.RESOLVED && 'Resolvido'}
      {status === SosAlertStatus.FALSE_ALARM && 'Falso Alarme'}
      {status === SosAlertStatus.CANCELLED && 'Cancelado'}
    </Badge>
  );
}

// Componente principal
export default function SosAlertsPage() {
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: ['sos-alerts'],
    queryFn: safety.getActiveSosAlerts,
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });

  const activeAlerts = alerts.filter((a: SosAlert) => a.status === SosAlertStatus.ACTIVE);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas SOS</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real de emergências
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Alertas Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {activeAlerts.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Total de Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taxa de Resolução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.length > 0
                ? Math.round(
                    ((alerts.length - activeAlerts.length) / alerts.length) * 100
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mapa */}
      <Card>
        <CardHeader>
          <CardTitle>Mapa de Alertas</CardTitle>
          <CardDescription>
            Visualização geográfica dos alertas ativos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertMap alerts={activeAlerts} />
        </CardContent>
      </Card>

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alertas</CardTitle>
          <CardDescription>
            Todos os alertas SOS registrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground">Carregando...</p>
          ) : alerts.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Nenhum alerta registrado
            </p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert: SosAlert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between rounded-lg border p-4"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={alert.status} />
                      <Badge variant="outline">{alert.type}</Badge>
                      {alert.status === SosAlertStatus.ACTIVE && (
                        <span className="flex h-2 w-2">
                          <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500"></span>
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{alert.user.name}</p>
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {alert.user.phone}
                      </p>
                    </div>
                    {alert.description && (
                      <p className="text-sm text-muted-foreground">
                        {alert.description}
                      </p>
                    )}
                    {alert.location && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {alert.location}
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date(alert.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {alert.status === SosAlertStatus.ACTIVE && (
                      <>
                        <Button size="sm" variant="destructive" asChild>
                          <a href={`tel:${alert.user.phone}`}>Ligar</a>
                        </Button>
                        <ResolveAlertDialog alert={alert} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
