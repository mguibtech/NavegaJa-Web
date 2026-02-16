'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Mail, Phone, Star, Ship, Calendar, Award, MapPin, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Dados mockados - em produção viria da API
  const user = {
    id: userId,
    name: 'João da Silva',
    email: 'joao@example.com',
    phone: '+5592988888888',
    cpf: '123.456.789-00',
    role: 'passenger',
    rating: 4.8,
    totalTrips: 15,
    totalPoints: 450,
    level: 'Navegador Experiente',
    referralCode: 'JOAO2026',
    createdAt: '2025-01-15T10:00:00Z',
    avatarUrl: null,
  };

  const recentTrips = [
    {
      id: '1',
      route: 'Manaus → Parintins',
      date: '2026-02-10',
      status: 'completed',
      rating: 5,
    },
    {
      id: '2',
      route: 'Parintins → Manaus',
      date: '2026-02-05',
      status: 'completed',
      rating: 4,
    },
  ];

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
                  {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="md:col-span-2 grid gap-4 md:grid-cols-2">
          <Card className="border-l-4 border-l-accent shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                <Star className="h-4 w-4 text-accent" />
                Avaliação Média
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold text-accent">{user.rating}</span>
                <span className="text-2xl text-muted-foreground">/5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.floor(user.rating)
                        ? 'fill-accent text-accent'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                <Ship className="h-4 w-4 text-secondary" />
                Total de Viagens
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-secondary">{user.totalTrips}</div>
              <p className="text-sm text-muted-foreground mt-2">Viagens realizadas</p>
            </CardContent>
          </Card>

          {user.role === 'passenger' && (
            <>
              <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                    <Award className="h-4 w-4 text-primary" />
                    Pontos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-5xl font-bold text-primary">{user.totalPoints}</div>
                  <p className="text-sm text-muted-foreground mt-2">{user.level}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-accent/30 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-foreground/70">
                    Código de Indicação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge
                    variant="outline"
                    className="text-xl font-bold px-4 py-2 bg-accent/10 text-accent border-accent/30"
                  >
                    {user.referralCode}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2">Compartilhe e ganhe pontos!</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Viagens Recentes */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-secondary" />
            Viagens Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {recentTrips.map((trip) => (
              <div
                key={trip.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-all hover:border-secondary/30"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-secondary/10 p-3">
                    <Ship className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{trip.route}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(trip.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= trip.rating ? 'fill-accent text-accent' : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  <Badge className="bg-secondary/15 text-secondary border-secondary/30">
                    Concluída
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
