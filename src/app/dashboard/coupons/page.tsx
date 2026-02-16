'use client';

import { Ticket, Plus, Percent, Calendar, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function CouponsPage() {
  // Dados mockados
  const stats = {
    total: 45,
    active: 32,
    expired: 8,
    used: 234,
  };

  const coupons = [
    {
      id: '1',
      code: 'PRIMEIRAVIAGEM',
      description: 'Desconto para primeira viagem',
      discount: 20,
      discountType: 'percentage',
      usageLimit: 100,
      usageCount: 67,
      expiresAt: '2026-03-31',
      status: 'active',
    },
    {
      id: '2',
      code: 'VERAO2026',
      description: 'Promoção de verão',
      discount: 15,
      discountType: 'percentage',
      usageLimit: 200,
      usageCount: 143,
      expiresAt: '2026-02-28',
      status: 'active',
    },
    {
      id: '3',
      code: 'FRETEGRATIS',
      description: 'Frete grátis para encomendas',
      discount: 100,
      discountType: 'percentage',
      usageLimit: 50,
      usageCount: 28,
      expiresAt: '2026-04-15',
      status: 'active',
    },
  ];

  const getStatusBadge = (status: string) => {
    const configs = {
      active: {
        className: 'bg-secondary/15 text-secondary border-secondary/30',
        label: 'Ativo',
      },
      expired: {
        className: 'bg-destructive/15 text-destructive border-destructive/30',
        label: 'Expirado',
      },
      paused: {
        className: 'bg-muted text-muted-foreground border-border',
        label: 'Pausado',
      },
    };
    const config = configs[status as keyof typeof configs] || configs.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.round((used / limit) * 100);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg bg-linear-to-br from-accent/5 via-accent-light/5 to-transparent p-6 border border-accent/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-accent/10 p-2">
              <Ticket className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Cupons</h1>
              <p className="mt-1 text-base text-foreground/70">
                Gerenciamento de cupons de desconto
              </p>
            </div>
          </div>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Novo Cupom
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-5 md:grid-cols-4">
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Total de Cupons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-secondary/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-secondary">{stats.active}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Expirados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-foreground">{stats.expired}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent/30 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
              Total Usado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-accent">{stats.used}</div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cupons */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Cupons Ativos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            {coupons.map((coupon) => {
              const usagePercentage = getUsagePercentage(coupon.usageCount, coupon.usageLimit);
              const daysUntilExpire = Math.ceil(
                (new Date(coupon.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
              );

              return (
                <div
                  key={coupon.id}
                  className="flex items-start justify-between p-5 rounded-lg border hover:shadow-md transition-all hover:border-accent/30 bg-linear-to-r from-accent/5 to-transparent"
                >
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className="font-mono font-bold text-lg px-3 py-1 bg-accent/10 text-accent border-accent/30"
                      >
                        {coupon.code}
                      </Badge>
                      {getStatusBadge(coupon.status)}
                      {daysUntilExpire <= 7 && daysUntilExpire > 0 && (
                        <Badge variant="destructive" className="animate-pulse">
                          Expira em {daysUntilExpire} dias
                        </Badge>
                      )}
                    </div>

                    <p className="text-base text-foreground">{coupon.description}</p>

                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-accent/10 p-2">
                          <Percent className="h-4 w-4 text-accent" />
                        </div>
                        <div>
                          <div className="text-sm text-foreground/60">Desconto</div>
                          <div className="font-bold text-accent text-lg">{coupon.discount}%</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-primary/10 p-2">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="text-sm text-foreground/60">Uso</div>
                          <div className="font-bold text-foreground">
                            {coupon.usageCount} / {coupon.usageLimit}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-secondary/10 p-2">
                          <Calendar className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <div className="text-sm text-foreground/60">Expira em</div>
                          <div className="font-medium text-foreground">
                            {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-foreground/60">Taxa de utilização</span>
                        <span className="font-bold text-accent">{usagePercentage}%</span>
                      </div>
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-linear-to-r from-accent to-accent-dark transition-all"
                          style={{ width: `${usagePercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-4">
                    <Button variant="outline" size="sm" className="hover:bg-accent/10 hover:text-accent">
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-destructive/10 hover:text-destructive">
                      Pausar
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
