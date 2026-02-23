'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useRef } from 'react';
import { Star, Search, Filter, Trash2, MessageSquare, Ship, User, Anchor, Eye, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { admin } from '@/lib/api';
import { Review, ReviewStats, ReviewsResponse, ReviewType } from '@/types/review';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

// ─── Componente de estrelas ────────────────────────────────────────────────────

export function Stars({ value, size = 'sm' }: { value: number | null | undefined; size?: 'sm' | 'md' }) {
  if (!value) return <span className="text-xs text-muted-foreground">Sem nota</span>;
  const sz = size === 'md' ? 'h-4 w-4' : 'h-3 w-3';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${sz} ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
      <span className={`ml-1 font-semibold ${size === 'md' ? 'text-sm' : 'text-xs'}`}>{value.toFixed(1)}</span>
    </div>
  );
}

// ─── Badge de tipo de review ───────────────────────────────────────────────────

export function ReviewTypeBadge({ type }: { type: ReviewType }) {
  if (type === ReviewType.PASSENGER_TO_CAPTAIN) {
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
        <User className="h-3 w-3 mr-1" />
        Passageiro → Capitão
      </Badge>
    );
  }
  return (
    <Badge className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
      <Anchor className="h-3 w-3 mr-1" />
      Capitão → Passageiro
    </Badge>
  );
}

// ─── Dialog de confirmação de exclusão ────────────────────────────────────────

function DeleteReviewDialog({ review, onSuccess }: { review: Review; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => admin.reviews.delete(review.id),
    onSuccess: () => {
      onSuccess();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title="Remover avaliação">
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover Avaliação</DialogTitle>
          <DialogDescription>
            Esta ação remove permanentemente a avaliação e recalcula as médias do capitão/barco.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Autor:</span>
            <span className="font-medium">{review.reviewer?.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Viagem:</span>
            <span className="font-medium">{review.trip?.origin} → {review.trip?.destination}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Tipo:</span>
            <ReviewTypeBadge type={review.reviewType} />
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-800">
            ⚠️ A média de avaliação do capitão/barco será recalculada automaticamente.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Removendo...' : 'Remover Avaliação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Página principal ──────────────────────────────────────────────────────────

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Debounce manual simples
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  const { data: reviewsResponse, isLoading, refetch } = useQuery({
    queryKey: ['admin-reviews', typeFilter, debouncedSearch, currentPage],
    queryFn: () => {
      const params: Record<string, unknown> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (typeFilter !== 'all') params.type = typeFilter;
      if (debouncedSearch) params.search = debouncedSearch;
      return admin.reviews.getAll(params);
    },
  });

  const { data: stats } = useQuery<ReviewStats>({
    queryKey: ['admin-reviews-stats'],
    queryFn: admin.reviews.getStats,
  });

  const response = reviewsResponse as ReviewsResponse | undefined;
  const reviews: Review[] = response?.reviews ?? (Array.isArray(reviewsResponse) ? reviewsResponse : []);
  const totalPages = response?.pages ?? 1;
  const totalItems = response?.total ?? reviews.length;

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
    queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
    refetch();
  };

  const captainAvg = stats?.averages?.captain ?? 0;
  const boatAvg = stats?.averages?.boat ?? 0;
  const passengerAvg = stats?.averages?.passenger ?? 0;
  const dist = stats?.captainRatingDistribution;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Avaliações</h1>
          <p className="text-muted-foreground">Moderação de avaliações de capitães, barcos e passageiros</p>
        </div>
        <Button onClick={() => refetch()}>Atualizar</Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Total de Avaliações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +{stats?.newToday ?? 0} hoje · +{stats?.newThisWeek ?? 0} essa semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              Média Capitões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{captainAvg.toFixed(1)}</div>
            <Stars value={captainAvg} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ship className="h-4 w-4 text-cyan-600" />
              Média Barcos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{boatAvg.toFixed(1)}</div>
            <Stars value={boatAvg} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Média Passageiros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{passengerAvg.toFixed(1)}</div>
            <Stars value={passengerAvg} />
          </CardContent>
        </Card>
      </div>

      {/* Linha secundária: contagens por tipo + distribuição */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Passageiro → Capitão</span>
              <span className="font-bold">{stats?.passengerToCapitain ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-orange-700">Capitão → Passageiro</span>
              <span className="font-bold">{stats?.captainToPassenger ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        {dist && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Distribuição de Notas (Capitães)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const count = dist[star] ?? 0;
                  const total = stats?.passengerToCapitain || 1;
                  const pct = (count / total) * 100;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-10">
                        <span className="text-xs font-medium">{star}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Autor, capitão, passageiro..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo de Avaliação</Label>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setCurrentPage(1); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value={ReviewType.PASSENGER_TO_CAPTAIN}>Passageiro → Capitão/Barco</SelectItem>
                  <SelectItem value={ReviewType.CAPTAIN_TO_PASSENGER}>Capitão → Passageiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <CardTitle>Avaliações</CardTitle>
          <CardDescription>{totalItems} avaliação(ões) encontrada(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">Nenhuma avaliação encontrada</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} onSuccess={handleSuccess} />
              ))}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={totalItems}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Card de review individual ─────────────────────────────────────────────────

function ReviewCard({ review, onSuccess }: { review: Review; onSuccess: () => void }) {
  const isPassengerReview = review.reviewType === ReviewType.PASSENGER_TO_CAPTAIN;

  return (
    <div className="rounded-lg border p-4 hover:bg-muted/30 transition-colors space-y-3">
      {/* Linha superior: autor, tipo, data, ações */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{review.reviewer?.name ?? '—'}</span>
          <ReviewTypeBadge type={review.reviewType} />
          {review.trip && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Ship className="h-3 w-3" />
              {review.trip.origin} → {review.trip.destination}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-xs text-muted-foreground">
            {format(new Date(review.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </span>
          <Button variant="ghost" size="sm" asChild title="Ver detalhes">
            <Link href={`/dashboard/reviews/${review.id}`}>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Link>
          </Button>
          <DeleteReviewDialog review={review} onSuccess={onSuccess} />
        </div>
      </div>

      {/* Avaliação de capitão */}
      {isPassengerReview && review.captainRating != null && (
        <div className="rounded-md bg-blue-50 border border-blue-100 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Anchor className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Capitão: {review.captain?.name ?? '—'}
            </span>
            <Stars value={review.captainRating} size="md" />
          </div>
          {review.captainComment && (
            <p className="text-sm text-blue-700 italic">&ldquo;{review.captainComment}&rdquo;</p>
          )}
        </div>
      )}

      {/* Avaliação de barco */}
      {isPassengerReview && review.boatRating != null && (
        <div className="rounded-md bg-cyan-50 border border-cyan-100 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <Ship className="h-4 w-4 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-800">
              Barco: {review.boat?.name ?? '—'}
            </span>
            <Stars value={review.boatRating} size="md" />
          </div>
          {review.boatComment && (
            <p className="text-sm text-cyan-700 italic">&ldquo;{review.boatComment}&rdquo;</p>
          )}
        </div>
      )}

      {/* Avaliação de passageiro */}
      {!isPassengerReview && review.passengerRating != null && (
        <div className="rounded-md bg-orange-50 border border-orange-100 p-3 space-y-1">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-800">
              Passageiro: {review.passenger?.name ?? '—'}
            </span>
            <Stars value={review.passengerRating} size="md" />
          </div>
          {review.passengerComment && (
            <p className="text-sm text-orange-700 italic">&ldquo;{review.passengerComment}&rdquo;</p>
          )}
        </div>
      )}
    </div>
  );
}
