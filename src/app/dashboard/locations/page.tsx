'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locations } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MapPin, Check, X, Search, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type LocationStatus = 'pending' | 'confirmed' | 'rejected';
type LocationSource = 'user_suggestion' | 'user_home' | 'admin';

interface CommunityLocation {
  id: string;
  name: string;
  normalizedName: string;
  lat: string;
  lng: string;
  municipio: string | null;
  state: string;
  status: LocationStatus;
  confirmedCount: number;
  source: LocationSource;
  suggestedBy?: { id: string; name: string; phone: string } | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const SOURCE_LABELS: Record<LocationSource, string> = {
  user_suggestion: 'Sugestão de usuário',
  user_home: 'Localização de perfil',
  admin: 'Administrador',
};

const statusCount = (list: CommunityLocation[], s: LocationStatus) =>
  list.filter((l) => l.status === s).length;

function MapThumbnail({ lat, lng, name }: { lat: string; lng: string; name: string }) {
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  const delta = 0.08;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${numLng - delta},${numLat - delta},${numLng + delta},${numLat + delta}&layer=mapnik&marker=${numLat},${numLng}`;
  return (
    <iframe
      title={`Mapa de ${name}`}
      src={src}
      className="w-full h-36 rounded border border-border pointer-events-none"
      loading="lazy"
    />
  );
}

function LocationCard({
  loc,
  onApprove,
  onReject,
  approving,
}: {
  loc: CommunityLocation;
  onApprove?: (id: string) => void;
  onReject?: (loc: CommunityLocation) => void;
  approving?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground">{loc.name}</span>
              {loc.municipio && (
                <span className="text-sm text-muted-foreground">• {loc.municipio}</span>
              )}
              <Badge variant="outline" className="text-xs">
                {SOURCE_LABELS[loc.source]}
              </Badge>
              {loc.confirmedCount > 1 && (
                <Badge className="text-xs bg-secondary/20 text-secondary border-secondary/30">
                  {loc.confirmedCount} confirmações
                </Badge>
              )}
            </div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>
                {parseFloat(loc.lat).toFixed(4)}, {parseFloat(loc.lng).toFixed(4)}
              </span>
              <span>{loc.state}</span>
              {loc.suggestedBy && <span>Por: {loc.suggestedBy.name}</span>}
              <span>
                {format(new Date(loc.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            {loc.rejectionReason && (
              <p className="mt-1 text-xs text-destructive">
                Motivo de rejeição: {loc.rejectionReason}
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setExpanded((e) => !e)}
            >
              {expanded ? 'Ocultar mapa' : 'Ver mapa'}
            </Button>
            {onApprove && (
              <Button
                size="sm"
                className="h-7 bg-secondary hover:bg-secondary/90 text-white text-xs"
                onClick={() => onApprove(loc.id)}
                disabled={approving}
              >
                <Check className="h-3 w-3 mr-1" />
                Aprovar
              </Button>
            )}
            {onReject && (
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => onReject(loc)}
              >
                <X className="h-3 w-3 mr-1" />
                Rejeitar
              </Button>
            )}
          </div>
        </div>

        {expanded && (
          <div className="mt-3">
            <MapThumbnail lat={loc.lat} lng={loc.lng} name={loc.name} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocationList({
  items,
  search,
  status,
  onApprove,
  onReject,
  approvingId,
  emptyLabel,
}: {
  items: CommunityLocation[];
  search: string;
  status: LocationStatus;
  onApprove?: (id: string) => void;
  onReject?: (loc: CommunityLocation) => void;
  approvingId?: string | null;
  emptyLabel: string;
}) {
  const filtered = items
    .filter((l) => l.status === status)
    .filter((l) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.municipio?.toLowerCase().includes(q) ||
        l.suggestedBy?.name.toLowerCase().includes(q)
      );
    });

  if (filtered.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <MapPin className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filtered.map((loc) => (
        <LocationCard
          key={loc.id}
          loc={loc}
          onApprove={onApprove}
          onReject={onReject}
          approving={approvingId === loc.id}
        />
      ))}
    </div>
  );
}

export default function LocationsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<LocationStatus>('pending');
  const [rejectTarget, setRejectTarget] = useState<CommunityLocation | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const { data: allLocations = [], isLoading } = useQuery<CommunityLocation[]>({
    queryKey: ['admin-locations'],
    queryFn: () => locations.getAll(),
    refetchInterval: 60_000,
  });

  const pendingCount = statusCount(allLocations, 'pending');
  const confirmedCount = statusCount(allLocations, 'confirmed');
  const rejectedCount = statusCount(allLocations, 'rejected');

  const approveMutation = useMutation({
    mutationFn: (id: string) => locations.approve(id),
    onMutate: (id) => setApprovingId(id),
    onSettled: () => {
      setApprovingId(null);
      qc.invalidateQueries({ queryKey: ['admin-locations'] });
      qc.invalidateQueries({ queryKey: ['pending-locations-count'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      locations.reject(id, reason),
    onSuccess: () => {
      setRejectTarget(null);
      setRejectReason('');
      qc.invalidateQueries({ queryKey: ['admin-locations'] });
      qc.invalidateQueries({ queryKey: ['pending-locations-count'] });
    },
  });

  const handleApprove = (id: string) => approveMutation.mutate(id);

  const handleRejectConfirm = () => {
    if (!rejectTarget || !rejectReason.trim()) return;
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Localidades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Modere sugestões de comunidades ribeirinhas enviadas pelos utilizadores.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-secondary" />
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-secondary">{confirmedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Rejeitadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-destructive">{rejectedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, município ou usuário..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-border mb-4">
          {(['pending', 'confirmed', 'rejected'] as LocationStatus[]).map((tab) => {
            const count = tab === 'pending' ? pendingCount : tab === 'confirmed' ? confirmedCount : rejectedCount;
            const labels = { pending: 'Pendentes', confirmed: 'Confirmadas', rejected: 'Rejeitadas' };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {labels[tab]}
                {count > 0 && (
                  <span className={cn(
                    'rounded-full h-5 min-w-5 px-1.5 text-xs flex items-center justify-center font-bold text-white',
                    tab === 'pending' ? 'bg-destructive' : tab === 'confirmed' ? 'bg-secondary' : 'bg-muted-foreground'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeTab === 'pending' && (
          isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <LocationList
              items={allLocations}
              search={search}
              status="pending"
              onApprove={handleApprove}
              onReject={setRejectTarget}
              approvingId={approvingId}
              emptyLabel="Nenhuma sugestão pendente."
            />
          )
        )}
        {activeTab === 'confirmed' && (
          <LocationList
            items={allLocations}
            search={search}
            status="confirmed"
            emptyLabel="Nenhuma localidade confirmada ainda."
          />
        )}
        {activeTab === 'rejected' && (
          <LocationList
            items={allLocations}
            search={search}
            status="rejected"
            emptyLabel="Nenhuma localidade rejeitada."
          />
        )}
      </div>

      {/* Dialog de rejeição */}
      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar localidade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Localidade: <span className="font-semibold text-foreground">{rejectTarget?.name}</span>
            </p>
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo da rejeição *</Label>
              <Textarea
                id="reject-reason"
                placeholder="Ex: Coordenadas incorretas, local duplicado..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectMutation.isPending}
              onClick={handleRejectConfirm}
            >
              {rejectMutation.isPending ? 'Rejeitando...' : 'Rejeitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
