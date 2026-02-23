'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Star, Ship, Calendar, MapPin, Shield, Anchor, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { admin } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { Stars } from '@/app/dashboard/reviews/page';
import { Review } from '@/types/review';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => admin.users.getById(userId),
  });

  const getRoleBadge = (role: string) => {
    const configs = {
      admin: { className: 'bg-primary/15 text-primary border-primary/30', label: 'Administrador', icon: Shield },
      captain: { className: 'bg-secondary/15 text-secondary border-secondary/30', label: 'Capitão', icon: Ship },
      passenger: { className: 'bg-muted text-muted-foreground border-border', label: 'Passageiro', icon: MapPin },
    };
    const config = configs[role as keyof typeof configs] || configs.passenger;
    const Icon = config.icon;
    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-lg font-medium">Usuário não encontrado</p>
        <Button onClick={() => router.back()} className="mt-4">
          Voltar
        </Button>
      </div>
    );
  }

  const isCaptain = user.role === 'captain';
  const isPassenger = user.role === 'passenger';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          className="hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Detalhes do Usuário</h1>
          <p className="text-base text-foreground/70">Informações completas e histórico</p>
        </div>
      </div>

      {/* Informações Principais */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card de Perfil */}
        <Card className="md:col-span-1 border-l-4 border-l-primary shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarFallback className="bg-linear-to-br from-primary to-primary-mid text-white font-bold text-3xl">
                  {user.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <div className="flex justify-center mt-2">
              {getRoleBadge(user.role)}
            </div>
            {/* Rating do capitão no perfil */}
            {isCaptain && user.rating != null && (
              <div className="flex justify-center mt-2">
                <Stars value={user.rating} size="md" />
              </div>
            )}
            {/* Rating do passageiro no perfil */}
            {isPassenger && user.passengerRating != null && (
              <div className="flex justify-center mt-2">
                <Stars value={user.passengerRating} size="md" />
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Mail className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium truncate">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Phone className="h-4 w-4 text-secondary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Telefone</p>
                <p className="text-sm font-medium">{user.phone}</p>
              </div>
            </div>

            {user.cpf && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Shield className="h-4 w-4 text-accent" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">CPF</p>
                  <p className="text-sm font-medium">{user.cpf}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Calendar className="h-4 w-4 text-foreground/60" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Membro desde</p>
                <p className="text-sm font-medium">
                  {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          {/* Status */}
          <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                <Shield className="h-4 w-4 text-accent" />
                Status da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                <Badge
                  className={
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800 border-green-300'
                      : user.status === 'suspended'
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : 'bg-gray-100 text-gray-800 border-gray-300'
                  }
                >
                  {user.status === 'active' ? 'Ativo' : user.status === 'suspended' ? 'Suspenso' : 'Inativo'}
                </Badge>
                {user.isActive === false && (
                  <Badge className="bg-red-100 text-red-800 border-red-300">Bloqueado</Badge>
                )}
              </div>
              <div className="mt-3 space-y-1 text-sm">
                {user.emailVerified && (
                  <p className="text-green-600 flex items-center gap-1">
                    <span>✓</span> Email verificado
                  </p>
                )}
                {user.phoneVerified && (
                  <p className="text-green-600 flex items-center gap-1">
                    <span>✓</span> Telefone verificado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas de capitão */}
          {isCaptain && (
            <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                  <Anchor className="h-4 w-4 text-secondary" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.totalTrips != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Viagens realizadas</span>
                    <span className="font-semibold">{user.totalTrips}</span>
                  </div>
                )}
                {user.reviewCount != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Avaliações recebidas</span>
                    <span className="font-semibold">{user.reviewCount}</span>
                  </div>
                )}
                {user.rating != null && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Nota média</span>
                    <Stars value={user.rating} size="sm" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Estatísticas de passageiro */}
          {isPassenger && (
            <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                  <User className="h-4 w-4 text-secondary" />
                  Avaliações como Passageiro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {user.passengerReviewCount != null && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total de avaliações</span>
                    <span className="font-semibold">{user.passengerReviewCount}</span>
                  </div>
                )}
                {user.passengerRating != null && (
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-muted-foreground">Nota média</span>
                    <Stars value={user.passengerRating} size="sm" />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Último Login */}
          {user.lastLogin && (
            <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-secondary" />
                  Último Acesso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-secondary">
                  {format(new Date(user.lastLogin), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(new Date(user.lastLogin), "HH:mm", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Data de Nascimento */}
          {user.birthDate && (
            <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Data de Nascimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-bold text-primary">
                  {format(new Date(user.birthDate), "dd/MM/yyyy", { locale: ptBR })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365))} anos
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Endereço */}
      {user.address && (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-2">
              {user.address.street && (
                <div>
                  <p className="text-sm text-muted-foreground">Rua</p>
                  <p className="font-medium">{user.address.street}</p>
                </div>
              )}
              {user.address.city && (
                <div>
                  <p className="text-sm text-muted-foreground">Cidade</p>
                  <p className="font-medium">{user.address.city}</p>
                </div>
              )}
              {user.address.state && (
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="font-medium">{user.address.state}</p>
                </div>
              )}
              {user.address.zipCode && (
                <div>
                  <p className="text-sm text-muted-foreground">CEP</p>
                  <p className="font-medium">{user.address.zipCode}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição de ratings — Capitão */}
      {isCaptain && user.ratingStats && (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Distribuição de Notas Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = user.ratingStats.distribution[star] ?? 0;
                const total = user.ratingStats.total || 1;
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

      {/* Distribuição de ratings — Passageiro */}
      {isPassenger && user.passengerRatingStats && (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Distribuição de Notas como Passageiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2">
              {([5, 4, 3, 2, 1] as const).map((star) => {
                const count = user.passengerRatingStats.distribution[star] ?? 0;
                const total = user.passengerRatingStats.total || 1;
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

      {/* Reviews recentes — Capitão */}
      {isCaptain && user.recentReviews && user.recentReviews.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-secondary" />
              Avaliações Recentes Recebidas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {user.recentReviews.map((rev: Review) => (
                <div key={rev.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{rev.reviewer?.name ?? '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {rev.trip?.origin} → {rev.trip?.destination}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Stars value={rev.captainRating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rev.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                        <Link href={`/dashboard/reviews/${rev.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                  {rev.captainComment && (
                    <p className="text-sm text-muted-foreground italic">&ldquo;{rev.captainComment}&rdquo;</p>
                  )}
                  {rev.boatRating != null && (
                    <div className="flex items-center gap-2 text-xs text-cyan-700">
                      <Ship className="h-3 w-3" />
                      <span>Barco: </span>
                      <Stars value={rev.boatRating} size="sm" />
                      {rev.boatComment && <span className="italic">&ldquo;{rev.boatComment}&rdquo;</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews recentes — Passageiro */}
      {isPassenger && user.recentPassengerReviews && user.recentPassengerReviews.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="border-b bg-muted/30">
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-orange-600" />
              Avaliações Recebidas como Passageiro
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {user.recentPassengerReviews.map((rev: Review) => (
                <div key={rev.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{rev.reviewer?.name ?? '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {rev.trip?.origin} → {rev.trip?.destination}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Stars value={rev.passengerRating} size="sm" />
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rev.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs" asChild>
                        <Link href={`/dashboard/reviews/${rev.id}`}>Ver</Link>
                      </Button>
                    </div>
                  </div>
                  {rev.passengerComment && (
                    <p className="text-sm text-muted-foreground italic">&ldquo;{rev.passengerComment}&rdquo;</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
