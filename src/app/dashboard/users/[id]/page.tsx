'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, Star, Ship, Calendar, Award, MapPin, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { admin } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  // Query para buscar dados do usuário
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
    </div>
  );
}
