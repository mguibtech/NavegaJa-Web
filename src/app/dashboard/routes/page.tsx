'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { routes } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, MapPin, Navigation, Clock, Eye } from 'lucide-react';

interface Route {
  id: string;
  originName: string;
  originLat: number;
  originLng: number;
  destinationName: string;
  destinationLat: number;
  destinationLng: number;
  distanceKm?: number;
  durationMin?: number;
  createdAt: string;
  trips?: any[];
}

export default function RoutesPage() {
  const [originSearch, setOriginSearch] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  // Query
  const { data: routesData = [], isLoading } = useQuery({
    queryKey: ['routes'],
    queryFn: routes.getAll,
  });

  // Filtros locais
  const filteredRoutes = useMemo(() => {
    let filtered = Array.isArray(routesData) ? routesData : [];

    if (originSearch) {
      filtered = filtered.filter((route: Route) =>
        route.originName.toLowerCase().includes(originSearch.toLowerCase())
      );
    }

    if (destSearch) {
      filtered = filtered.filter((route: Route) =>
        route.destinationName.toLowerCase().includes(destSearch.toLowerCase())
      );
    }

    return filtered;
  }, [routesData, originSearch, destSearch]);

  // Stats
  const stats = useMemo(() => {
    const allRoutes = Array.isArray(routesData) ? routesData : [];

    const totalDistance = allRoutes.reduce((sum: number, r: Route) => sum + (r.distanceKm || 0), 0);
    const avgDistance = allRoutes.length > 0 ? totalDistance / allRoutes.length : 0;

    const routesWithDuration = allRoutes.filter((r: Route) => r.durationMin);
    const totalDuration = routesWithDuration.reduce((sum: number, r: Route) => sum + (r.durationMin || 0), 0);
    const avgDuration = routesWithDuration.length > 0 ? totalDuration / routesWithDuration.length : 0;

    // Top origens e destinos
    const originCounts: { [key: string]: number } = {};
    const destCounts: { [key: string]: number } = {};

    allRoutes.forEach((route: Route) => {
      originCounts[route.originName] = (originCounts[route.originName] || 0) + 1;
      destCounts[route.destinationName] = (destCounts[route.destinationName] || 0) + 1;
    });

    const topOrigins = Object.entries(originCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topDestinations = Object.entries(destCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      total: allRoutes.length,
      avgDistance: avgDistance.toFixed(1),
      avgDuration: Math.round(avgDuration),
      topOrigins,
      topDestinations,
    };
  }, [routesData]);

  const handleViewDetails = (route: Route) => {
    setSelectedRoute(route);
    setIsDetailsModalOpen(true);
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}min`;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Rotas</h1>
          <p className="text-muted-foreground">Visualize as rotas cadastradas no sistema</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Rotas</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Distância Média</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.avgDistance} km</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Duração Média</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.avgDuration} min</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Top Locations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Origens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topOrigins.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma origem encontrada</p>
              ) : (
                stats.topOrigins.map((origin, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{origin.name}</span>
                    </div>
                    <Badge variant="secondary">{origin.count} rotas</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Destinos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.topDestinations.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum destino encontrado</p>
              ) : (
                stats.topDestinations.map((dest, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{dest.name}</span>
                    </div>
                    <Badge variant="secondary">{dest.count} rotas</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Rotas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Origem</Label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite a origem..."
                  value={originSearch}
                  onChange={(e) => setOriginSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Destino</Label>
              <div className="relative">
                <Navigation className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Digite o destino..."
                  value={destSearch}
                  onChange={(e) => setDestSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </div>
          {(originSearch || destSearch) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setOriginSearch(''); setDestSearch(''); }}
              >
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Rotas ({filteredRoutes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Origem</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Distância</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoutes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Nenhuma rota encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRoutes.map((route: Route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-500" />
                          {route.originName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Navigation className="h-4 w-4 text-green-500" />
                          {route.destinationName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {route.distanceKm ? (
                          <Badge variant="outline">{route.distanceKm} km</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {route.durationMin ? (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            <span>{formatDuration(route.durationMin)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(route)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Rota</DialogTitle>
          </DialogHeader>
          {selectedRoute && (
            <div className="space-y-6">
              {/* Origem → Destino */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Origem</p>
                    <p className="font-bold text-lg">{selectedRoute.originName}</p>
                  </div>
                </div>
                <div className="text-muted-foreground">→</div>
                <div className="flex items-center gap-2">
                  <Navigation className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Destino</p>
                    <p className="font-bold text-lg">{selectedRoute.destinationName}</p>
                  </div>
                </div>
              </div>

              {/* Informações */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Distância</Label>
                  <p className="font-medium text-lg">
                    {selectedRoute.distanceKm ? `${selectedRoute.distanceKm} km` : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Duração Estimada</Label>
                  <p className="font-medium text-lg">{formatDuration(selectedRoute.durationMin)}</p>
                </div>
              </div>

              {/* Coordenadas */}
              <div>
                <Label className="text-muted-foreground mb-2 block">Coordenadas</Label>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-muted-foreground mb-1">Origem</p>
                    <p className="font-mono">
                      {selectedRoute.originLat.toFixed(6)}, {selectedRoute.originLng.toFixed(6)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded">
                    <p className="text-muted-foreground mb-1">Destino</p>
                    <p className="font-mono">
                      {selectedRoute.destinationLat.toFixed(6)}, {selectedRoute.destinationLng.toFixed(6)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Data de cadastro */}
              <div>
                <Label className="text-muted-foreground">Cadastrada em</Label>
                <p className="font-medium">
                  {new Date(selectedRoute.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Google Maps Link */}
              <div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&origin=${selectedRoute.originLat},${selectedRoute.originLng}&destination=${selectedRoute.destinationLat},${selectedRoute.destinationLng}`;
                    window.open(url, '_blank');
                  }}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Ver no Google Maps
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDetailsModalOpen(false); setSelectedRoute(null); }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
