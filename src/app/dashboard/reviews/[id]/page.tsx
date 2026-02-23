'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Trash2,
  Ship,
  User,
  Anchor,
  Calendar,
  MapPin,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { admin } from '@/lib/api';
import { Review, ReviewType } from '@/types/review';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Stars, ReviewTypeBadge } from '../page';
import Link from 'next/link';

export default function ReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const reviewId = params.id as string;

  const { data: review, isLoading } = useQuery<Review>({
    queryKey: ['admin-review', reviewId],
    queryFn: () => admin.reviews.getById(reviewId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => admin.reviews.delete(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-stats'] });
      router.push('/dashboard/reviews');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-medium text-muted-foreground">Avaliação não encontrada</p>
        <Button onClick={() => router.push('/dashboard/reviews')}>
          Voltar para Avaliações
        </Button>
      </div>
    );
  }

  const isPassengerReview = review.reviewType === ReviewType.PASSENGER_TO_CAPTAIN;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Detalhe da Avaliação</h1>
            <p className="text-sm text-muted-foreground">
              Criada em {format(new Date(review.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Remover Avaliação
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remover Avaliação</DialogTitle>
              <DialogDescription>
                Esta ação é permanente. A média do capitão/barco/passageiro será recalculada automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                ⚠️ Após a remoção, você será redirecionado para a lista de avaliações.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {}}>Cancelar</Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? 'Removendo...' : 'Confirmar Remoção'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cabeçalho da avaliação */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <ReviewTypeBadge type={review.reviewType} />
            <span className="text-sm text-muted-foreground">ID: {review.id}</span>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {/* Revisor */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avaliador</p>
              <p className="font-semibold text-base">{review.reviewer?.name ?? '—'}</p>
              {review.reviewer?.email && (
                <p className="text-sm text-muted-foreground">{review.reviewer.email}</p>
              )}
              {review.reviewer?.phone && (
                <p className="text-sm text-muted-foreground">{review.reviewer.phone}</p>
              )}
              <Button variant="link" className="p-0 h-auto text-xs" asChild>
                <Link href={`/dashboard/users/${review.reviewerId}`}>Ver perfil</Link>
              </Button>
            </div>

            {/* Viagem */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Viagem</p>
              <div className="flex items-center gap-1 font-semibold text-base">
                <MapPin className="h-4 w-4 text-primary" />
                {review.trip?.origin} → {review.trip?.destination}
              </div>
              {review.trip?.departureAt && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(review.trip.departureAt), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
              {review.trip?.status && (
                <p className="text-xs text-muted-foreground capitalize">{review.trip.status}</p>
              )}
              <Button variant="link" className="p-0 h-auto text-xs" asChild>
                <Link href={`/dashboard/trips/${review.tripId}`}>Ver viagem</Link>
              </Button>
            </div>

            {/* Data */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Data da Avaliação</p>
              <p className="font-semibold text-base">
                {format(new Date(review.createdAt), "dd/MM/yyyy", { locale: ptBR })}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(review.createdAt), "HH:mm", { locale: ptBR })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo das avaliações */}
      <div className="grid gap-4 md:grid-cols-1">

        {/* Passageiro → Capitão */}
        {isPassengerReview && (
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Anchor className="h-5 w-5 text-blue-600" />
                Avaliação do Capitão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Capitão avaliado</p>
                  <p className="font-semibold">{review.captain?.name ?? '—'}</p>
                  {review.captain?.rating != null && (
                    <p className="text-xs text-muted-foreground">
                      Média atual: {review.captain.rating.toFixed(1)} ★
                    </p>
                  )}
                  {review.captainId && (
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href={`/dashboard/users/${review.captainId}`}>Ver perfil</Link>
                    </Button>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Nota geral</p>
                  <Stars value={review.captainRating} size="md" />
                </div>
              </div>

              {/* Sub-ratings do capitão */}
              {(review.punctualityRating != null || review.communicationRating != null) && (
                <div className="grid grid-cols-2 gap-3">
                  {review.punctualityRating != null && (
                    <div className="rounded-md bg-blue-50/60 border border-blue-100 p-2.5">
                      <p className="text-xs text-blue-700 font-medium mb-1">Pontualidade</p>
                      <Stars value={review.punctualityRating} size="sm" />
                    </div>
                  )}
                  {review.communicationRating != null && (
                    <div className="rounded-md bg-blue-50/60 border border-blue-100 p-2.5">
                      <p className="text-xs text-blue-700 font-medium mb-1">Comunicação</p>
                      <Stars value={review.communicationRating} size="sm" />
                    </div>
                  )}
                </div>
              )}

              {review.captainComment && (
                <div className="rounded-md bg-blue-50 border border-blue-100 p-3">
                  <p className="text-sm text-blue-800 italic">&ldquo;{review.captainComment}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Passageiro → Barco */}
        {isPassengerReview && review.boatRating != null && (
          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Ship className="h-5 w-5 text-cyan-600" />
                Avaliação do Barco
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Barco avaliado</p>
                  <p className="font-semibold">{review.boat?.name ?? '—'}</p>
                  {review.boat?.rating != null && (
                    <p className="text-xs text-muted-foreground">
                      Média atual: {review.boat.rating.toFixed(1)} ★
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Nota geral</p>
                  <Stars value={review.boatRating} size="md" />
                </div>
              </div>

              {/* Sub-ratings do barco */}
              {(review.cleanlinessRating != null || review.comfortRating != null) && (
                <div className="grid grid-cols-2 gap-3">
                  {review.cleanlinessRating != null && (
                    <div className="rounded-md bg-cyan-50/60 border border-cyan-100 p-2.5">
                      <p className="text-xs text-cyan-700 font-medium mb-1">Limpeza</p>
                      <Stars value={review.cleanlinessRating} size="sm" />
                    </div>
                  )}
                  {review.comfortRating != null && (
                    <div className="rounded-md bg-cyan-50/60 border border-cyan-100 p-2.5">
                      <p className="text-xs text-cyan-700 font-medium mb-1">Conforto</p>
                      <Stars value={review.comfortRating} size="sm" />
                    </div>
                  )}
                </div>
              )}

              {review.boatComment && (
                <div className="rounded-md bg-cyan-50 border border-cyan-100 p-3">
                  <p className="text-sm text-cyan-800 italic">&ldquo;{review.boatComment}&rdquo;</p>
                </div>
              )}

              {review.boatPhotos && review.boatPhotos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-cyan-700 font-medium">Fotos do barco</p>
                  <div className="flex flex-wrap gap-2">
                    {review.boatPhotos.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt={`Foto ${i + 1}`} className="w-24 h-24 object-cover rounded-md border border-cyan-200 hover:opacity-80 transition-opacity" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Capitão → Passageiro */}
        {!isPassengerReview && (
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-5 w-5 text-orange-600" />
                Avaliação do Passageiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Passageiro avaliado</p>
                  <p className="font-semibold">{review.passenger?.name ?? '—'}</p>
                  {review.passenger?.email && (
                    <p className="text-sm text-muted-foreground">{review.passenger.email}</p>
                  )}
                  {review.passengerId && (
                    <Button variant="link" className="p-0 h-auto text-xs" asChild>
                      <Link href={`/dashboard/users/${review.passengerId}`}>Ver perfil</Link>
                    </Button>
                  )}
                </div>
                <div className="text-right">
                  <Stars value={review.passengerRating} size="md" />
                </div>
              </div>
              {review.passengerComment && (
                <div className="rounded-md bg-orange-50 border border-orange-100 p-3">
                  <p className="text-sm text-orange-800 italic">&ldquo;{review.passengerComment}&rdquo;</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Rodapé com link de volta */}
      <div className="flex justify-start">
        <Button variant="outline" onClick={() => router.push('/dashboard/reviews')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Avaliações
        </Button>
      </div>
    </div>
  );
}
