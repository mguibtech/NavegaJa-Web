'use client';

import { useEffect, useState, type ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Anchor,
  Coins,
  Crown,
  Gift,
  Map,
  Medal,
  Package,
  Ship,
  Star,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { admin, gamification } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SessionUser {
  name?: string;
  role?: string;
}

interface LeaderboardEntry {
  position: number;
  id: string;
  name: string;
  avatarUrl?: string;
  totalPoints: number;
  level: string;
}

interface GamificationOverview {
  totalNavegaCoinsDistributed: number;
  totalKmTraveled: number;
  totalEligibleUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

interface AdminGamificationData {
  overview: GamificationOverview;
  levelDistribution: Record<string, number>;
  leaderboard: LeaderboardEntry[];
}

interface NextLevel {
  level: string | number;
  pointsNeeded: number;
  discount: number;
}

interface PersonalGamificationStats {
  totalPoints: number;
  level: string | number;
  discount: number;
  referralCode: string | null;
  nextLevel: NextLevel | null;
}

interface PointTransaction {
  id: string;
  userId: string;
  action: string;
  points: number;
  description: string;
  referenceId: string | null;
  createdAt: string;
}

interface HistoryResponse {
  data: PointTransaction[];
  total: number;
  page: number;
  lastPage: number;
}

const LEVEL_CONFIG: Record<string, { icon: ElementType; color: string; bg: string; badge: string }> = {
  Marinheiro: { icon: Anchor, color: 'text-blue-600', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' },
  Navegador: { icon: Star, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' },
  'Capitão': { icon: Medal, color: 'text-purple-600', bg: 'bg-purple-50', badge: 'bg-purple-100 text-purple-800' },
  Almirante: { icon: Crown, color: 'text-yellow-600', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-800' },
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#eab308'];

const HISTORY_ACTION_CONFIG: Record<string, { label: string; icon: ElementType; badge: string }> = {
  boat_owner_trip_completed: {
    label: 'Viagem concluída',
    icon: Ship,
    badge: 'bg-blue-100 text-blue-800',
  },
  boat_owner_passenger_completed: {
    label: 'Passageiro transportado',
    icon: Users,
    badge: 'bg-emerald-100 text-emerald-800',
  },
  boat_owner_shipment_delivered: {
    label: 'Encomenda entregue',
    icon: Package,
    badge: 'bg-amber-100 text-amber-800',
  },
  referral_bonus: {
    label: 'Bônus por indicação',
    icon: Gift,
    badge: 'bg-fuchsia-100 text-fuchsia-800',
  },
  signup_bonus: {
    label: 'Bônus de cadastro',
    icon: Trophy,
    badge: 'bg-sky-100 text-sky-800',
  },
};

function LevelBadge({ level }: { level: string }) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.Marinheiro;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.badge}`}>
      <cfg.icon className="h-3 w-3" />
      {level}
    </span>
  );
}

function PositionBadge({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-lg">🥇</span>;
  if (pos === 2) return <span className="text-lg">🥈</span>;
  if (pos === 3) return <span className="text-lg">🥉</span>;
  return <span className="w-7 text-center text-sm font-bold text-muted-foreground">{pos}º</span>;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted ${className}`} />;
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-6">
      <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
        {message}
      </div>
    </div>
  );
}

function humanizeAction(action: string) {
  return action
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getHistoryActionPresentation(action: string) {
  return HISTORY_ACTION_CONFIG[action] ?? {
    label: humanizeAction(action),
    icon: Coins,
    badge: 'bg-slate-100 text-slate-800',
  };
}

function formatPoints(points: number) {
  return `${points > 0 ? '+' : ''}${points.toLocaleString('pt-BR')}`;
}

function formatDiscount(discount: number) {
  return `${discount}%`;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function AdminGamificationView({
  data,
  isLoading,
}: {
  data?: AdminGamificationData;
  isLoading: boolean;
}) {
  const overview = data?.overview;
  const levelDistribution = data?.levelDistribution ?? {};
  const leaderboard = data?.leaderboard ?? [];
  const pieData = Object.entries(levelDistribution).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Gamificação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          NavegaCoins, níveis e ranking de passageiros e capitães
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">NavegaCoins Distribuídos</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-32" /> : (
              <p className="text-2xl font-bold">{(overview?.totalNavegaCoinsDistributed ?? 0).toLocaleString('pt-BR')}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">total acumulado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Km Navegados</CardTitle>
            <Map className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-32" /> : (
              <p className="text-2xl font-bold">{(overview?.totalKmTraveled ?? 0).toLocaleString('pt-BR')}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">km totais pelas rotas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Elegíveis</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-32" /> : (
              <p className="text-2xl font-bold">{overview?.totalEligibleUsers ?? 0}</p>
            )}
            {!isLoading && (
              <p className="mt-1 text-xs text-muted-foreground">
                +{overview?.newUsersToday ?? 0} hoje · +{overview?.newUsersThisWeek ?? 0} esta semana
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Distribuição por Nível</CardTitle>
            <CardDescription>Todos os usuários com pontos registrados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
              </div>
            ) : (
              <>
                {pieData.length > 0 && (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={false}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Usuários']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}

                <div className="mt-4 space-y-2">
                  {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => {
                    const count = levelDistribution[level] ?? 0;
                    const total = Object.values(levelDistribution).reduce((acc, current) => acc + current, 0) || 1;
                    const pct = Math.round((count / total) * 100);

                    return (
                      <div key={level}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className={`flex items-center gap-1 font-medium ${cfg.color}`}>
                            <cfg.icon className="h-3 w-3" />
                            {level}
                          </span>
                          <span className="font-semibold">
                            {count} <span className="font-normal text-muted-foreground">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted">
                          <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Top 10 - Leaderboard
            </CardTitle>
            <CardDescription>Usuários com mais NavegaCoins acumulados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhum usuário com pontos registrados ainda.
              </div>
            ) : (
              <div className="space-y-1">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex w-8 justify-center shrink-0">
                      <PositionBadge pos={entry.position} />
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {entry.name?.charAt(0)?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.name}</p>
                      <LevelBadge level={entry.level} />
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold">{entry.totalPoints.toLocaleString('pt-BR')}</p>
                      <p className="text-[10px] text-muted-foreground">NavegaCoins</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">Como funcionam os níveis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(LEVEL_CONFIG).map(([level, cfg]) => (
              <div key={level} className={`rounded-lg border p-3 ${cfg.bg}`}>
                <div className={`mb-1 flex items-center gap-2 font-semibold ${cfg.color}`}>
                  <cfg.icon className="h-4 w-4" />
                  {level}
                </div>
                <Badge variant="outline" className="text-xs">
                  {level === 'Marinheiro' && 'Nível inicial'}
                  {level === 'Navegador' && 'Viajante frequente'}
                  {level === 'Capitão' && 'Explorador experiente'}
                  {level === 'Almirante' && 'Elite NavegaJá'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PersonalGamificationView({
  user,
  stats,
  history,
  isLoading,
}: {
  user: SessionUser;
  stats?: PersonalGamificationStats;
  history?: HistoryResponse;
  isLoading: boolean;
}) {
  const transactions = history?.data ?? [];
  const firstName = user.name?.split(' ')[0] ?? 'Capitão';

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="h-6 w-6 text-yellow-500" />
          Minha gamificação
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resumo de pontos, nível, desconto e histórico recente de {firstName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de pontos</CardTitle>
            <Coins className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-28" /> : (
              <p className="text-2xl font-bold">{(stats?.totalPoints ?? 0).toLocaleString('pt-BR')}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">NavegaCoins acumulados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nível atual</CardTitle>
            <Medal className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-24" /> : (
              <p className="text-2xl font-bold">{String(stats?.level ?? '-')}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Faixa atual de benefícios</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desconto atual</CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-20" /> : (
              <p className="text-2xl font-bold">{formatDiscount(stats?.discount ?? 0)}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Aplicado conforme seu nível</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Código de indicação</CardTitle>
            <Gift className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-7 w-28" /> : (
              <p className="font-mono text-xl font-bold">{stats?.referralCode || '-'}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">Use para convidar novos usuários</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Próximo nível</CardTitle>
            <CardDescription>Evolução para o próximo benefício</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ) : stats?.nextLevel ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Próximo nível</span>
                  <Badge variant="secondary">{String(stats.nextLevel.level)}</Badge>
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.nextLevel.pointsNeeded.toLocaleString('pt-BR')}</p>
                  <p className="text-xs text-muted-foreground">pontos restantes para avançar</p>
                </div>
                <div>
                  <p className="text-sm font-semibold">Desconto ao subir</p>
                  <p className="text-muted-foreground">{formatDiscount(stats.nextLevel.discount)}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-lg font-semibold">Nível máximo atingido</p>
                <p className="text-sm text-muted-foreground">
                  Não há um próximo nível disponível no momento.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Histórico recente</CardTitle>
            <CardDescription>
              {isLoading ? 'Carregando movimentações...' : `${history?.total ?? 0} movimentações registradas`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Nenhuma movimentação encontrada no histórico.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((item) => {
                  const presentation = getHistoryActionPresentation(item.action);
                  return (
                    <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <presentation.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{presentation.label}</p>
                          <Badge className={presentation.badge}>{formatPoints(item.points)}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.description || 'Movimentação registrada pela gamificação.'}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span>{formatDateTime(item.createdAt)}</span>
                          {item.referenceId && <span>Ref: {item.referenceId}</span>}
                          <span>Ação: {item.action}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GamificationPage() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');

    if (!storedUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionUser({});
      return;
    }

    try {
      setSessionUser(JSON.parse(storedUser));
    } catch {
      setSessionUser({});
    }
  }, []);

  const hasSessionContext = sessionUser !== null;
  const isAdmin = sessionUser?.role === 'admin';

  const adminQuery = useQuery<AdminGamificationData>({
    queryKey: ['admin-gamification'],
    queryFn: admin.gamification.getOverview,
    staleTime: 60_000,
    enabled: hasSessionContext && isAdmin,
  });

  const statsQuery = useQuery<PersonalGamificationStats>({
    queryKey: ['my-gamification-stats'],
    queryFn: gamification.getStats,
    staleTime: 60_000,
    enabled: hasSessionContext && !isAdmin,
  });

  const historyQuery = useQuery<HistoryResponse>({
    queryKey: ['my-gamification-history', 1, 20],
    queryFn: () => gamification.getHistory(1, 20),
    staleTime: 60_000,
    enabled: hasSessionContext && !isAdmin,
  });

  if (!hasSessionContext) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (isAdmin) {
    if (adminQuery.isError) {
      return <ErrorState message="Erro ao carregar dados de gamificação do admin. Verifique se o backend está ativo." />;
    }

    return <AdminGamificationView data={adminQuery.data} isLoading={adminQuery.isLoading} />;
  }

  if (statsQuery.isError || historyQuery.isError) {
    return <ErrorState message="Erro ao carregar sua gamificação. Verifique se os endpoints /gamification estão disponíveis." />;
  }

  return (
    <PersonalGamificationView
      user={sessionUser}
      stats={statsQuery.data}
      history={historyQuery.data}
      isLoading={statsQuery.isLoading || historyQuery.isLoading}
    />
  );
}
