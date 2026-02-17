'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ticket, Plus, Percent, Calendar, Users, TrendingUp, Filter, Search, Trash2, MapPin, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { coupons } from '@/lib/api';

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any>(null);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    description: '',
    type: 'percentage',
    value: 0,
    minPurchase: 0,
    maxDiscount: null,
    validUntil: '',
    usageLimit: 100,
    applicableTo: 'both', // 'trips', 'shipments', 'both'
    fromCity: null,
    toCity: null,
    minWeight: null,
    maxWeight: null,
  });
  const itemsPerPage = 5;

  // Query para buscar cupons
  const { data: couponsData = [], isLoading, refetch } = useQuery({
    queryKey: ['coupons'],
    queryFn: coupons.getAll,
    refetchInterval: 30000,
  });

  // Mutation para criar cupom
  const createMutation = useMutation({
    mutationFn: (formData: typeof newCoupon) => {
      // Remover valores null/undefined/vazios para não enviar campos desnecessários
      const payload = { ...formData };
      Object.keys(payload).forEach((key) => {
        const value = payload[key as keyof typeof payload];
        if (value === null || value === undefined || value === '') {
          delete payload[key as keyof typeof payload];
        }
      });

      return coupons.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsCreateDialogOpen(false);
      setNewCoupon({
        code: '',
        description: '',
        type: 'percentage',
        value: 0,
        minPurchase: 0,
        maxDiscount: null,
        validUntil: '',
        usageLimit: 100,
        applicableTo: 'both',
        fromCity: null,
        toCity: null,
        minWeight: null,
        maxWeight: null,
      });
    },
  });

  // Mutation para deletar cupom
  const deleteMutation = useMutation({
    mutationFn: coupons.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
    },
  });

  // Mutation para atualizar cupom
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => coupons.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      setIsEditDialogOpen(false);
      setEditingCoupon(null);
    },
  });

  const allCoupons = couponsData;

  // Helper para calcular status do cupom baseado nos dados da API
  const getCouponStatus = (coupon: any) => {
    const now = new Date();
    const expiresAt = new Date(coupon.validUntil);

    if (expiresAt < now) return 'expired';
    if (!coupon.isActive) return 'paused';
    return 'active';
  };

  const stats = {
    total: allCoupons.length,
    active: allCoupons.filter((c: any) => getCouponStatus(c) === 'active').length,
    expired: allCoupons.filter((c: any) => getCouponStatus(c) === 'expired').length,
    used: allCoupons.reduce((sum: number, c: any) => sum + (c.usageCount || 0), 0),
  };

  // Filtrar cupons
  const filteredCoupons = useMemo(() => {
    return allCoupons.filter((coupon: any) => {
      const matchesSearch = !searchTerm ||
        coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        coupon.description.toLowerCase().includes(searchTerm.toLowerCase());
      const couponStatus = getCouponStatus(coupon);
      const matchesStatus = statusFilter === 'all' || couponStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter, allCoupons]);

  // Paginação
  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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

  // Função para abrir modal de edição
  const handleEditCoupon = (coupon: any) => {
    setEditingCoupon({
      id: coupon.id, // Adicionar ID para poder salvar
      code: coupon.code,
      description: coupon.description || '',
      type: coupon.type,
      value: coupon.value,
      minPurchase: coupon.minPurchase || 0,
      maxDiscount: coupon.maxDiscount || null,
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || 100,
      applicableTo: coupon.applicableTo || 'both',
      fromCity: coupon.fromCity || null,
      toCity: coupon.toCity || null,
      minWeight: coupon.minWeight || null,
      maxWeight: coupon.maxWeight || null,
    });
    setIsEditDialogOpen(true);
  };

  // Função para pausar/ativar cupom
  const handleToggleActive = (coupon: any) => {
    const newStatus = !coupon.isActive;
    const action = newStatus ? 'ativado' : 'pausado';

    if (confirm(`Deseja realmente ${newStatus ? 'ativar' : 'pausar'} o cupom ${coupon.code}?`)) {
      updateMutation.mutate({
        id: coupon.id,
        data: { isActive: newStatus },
      });
    }
  };

  // Função para salvar edição
  const handleSaveEdit = () => {
    if (!editingCoupon) return;

    // Remover valores null/undefined/vazios e o ID do payload
    const { id, ...payload } = editingCoupon;
    Object.keys(payload).forEach((key) => {
      const value = payload[key as keyof typeof payload];
      if (value === null || value === undefined || value === '') {
        delete payload[key as keyof typeof payload];
      }
    });

    updateMutation.mutate({
      id: editingCoupon.id,
      data: payload,
    });
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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="h-4 w-4 mr-2" />
                Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Cupom</DialogTitle>
                <DialogDescription>
                  Preencha os dados do cupom de desconto
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">
                      Código do Cupom <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="code"
                      placeholder="Ex: DESCONTO20"
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicableTo">Aplicável a</Label>
                    <Select
                      value={newCoupon.applicableTo}
                      onValueChange={(value) => setNewCoupon({ ...newCoupon, applicableTo: value })}
                    >
                      <SelectTrigger id="applicableTo">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="both">Ambos (Viagens e Encomendas)</SelectItem>
                        <SelectItem value="trips">Apenas Viagens</SelectItem>
                        <SelectItem value="shipments">Apenas Encomendas</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {newCoupon.applicableTo === 'both' && '💡 Cupom válido para reservas de viagens e envio de encomendas'}
                      {newCoupon.applicableTo === 'trips' && '🚢 Cupom válido apenas para reservas de viagens de passageiros'}
                      {newCoupon.applicableTo === 'shipments' && '📦 Cupom válido apenas para envio de encomendas/cargas'}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    placeholder="Descrição do cupom"
                    value={newCoupon.description}
                    onChange={(e) => setNewCoupon({ ...newCoupon, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Tipo de Desconto</Label>
                    <Select
                      value={newCoupon.type}
                      onValueChange={(value) => setNewCoupon({ ...newCoupon, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value">
                      {newCoupon.type === 'percentage' ? 'Desconto (%)' : 'Valor (R$)'} <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      min="0"
                      max={newCoupon.type === 'percentage' ? '100' : undefined}
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="usageLimit">Limite de Usos</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      min="1"
                      value={newCoupon.usageLimit}
                      onChange={(e) => setNewCoupon({ ...newCoupon, usageLimit: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="validUntil">Data de Expiração</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={newCoupon.validUntil}
                      onChange={(e) => setNewCoupon({ ...newCoupon, validUntil: e.target.value })}
                    />
                  </div>
                </div>

                {/* Filtros de Rota (Opcional) */}
                <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                    <MapPin className="h-4 w-4" />
                    Filtros de Rota (Opcional)
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fromCity">Cidade de Origem</Label>
                      <Input
                        id="fromCity"
                        placeholder="Ex: Manaus"
                        value={newCoupon.fromCity || ''}
                        onChange={(e) => setNewCoupon({ ...newCoupon, fromCity: e.target.value || null as any })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toCity">Cidade de Destino</Label>
                      <Input
                        id="toCity"
                        placeholder="Ex: Parintins"
                        value={newCoupon.toCity || ''}
                        onChange={(e) => setNewCoupon({ ...newCoupon, toCity: e.target.value || null as any })}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco para aplicar a todas as rotas
                  </p>
                </div>

                {/* Filtros de Peso (Para Encomendas) */}
                {(newCoupon.applicableTo === 'shipments' || newCoupon.applicableTo === 'both') && (
                  <div className="space-y-3 rounded-lg border p-4 bg-accent/5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                      <Package className="h-4 w-4" />
                      Filtros de Peso para Encomendas (Opcional)
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minWeight">Peso Mínimo (kg)</Label>
                        <Input
                          id="minWeight"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Ex: 0.5"
                          value={newCoupon.minWeight || ''}
                          onChange={(e) => setNewCoupon({ ...newCoupon, minWeight: e.target.value ? Number(e.target.value) : null as any })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxWeight">Peso Máximo (kg)</Label>
                        <Input
                          id="maxWeight"
                          type="number"
                          step="0.1"
                          min="0"
                          placeholder="Ex: 10"
                          value={newCoupon.maxWeight || ''}
                          onChange={(e) => setNewCoupon({ ...newCoupon, maxWeight: e.target.value ? Number(e.target.value) : null as any })}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Deixe em branco para não restringir por peso
                    </p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  <span className="text-destructive">*</span> Campos obrigatórios
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-accent hover:bg-accent/90"
                  onClick={() => createMutation.mutate(newCoupon)}
                  disabled={
                    !newCoupon.code ||
                    newCoupon.value <= 0 ||
                    createMutation.isPending
                  }
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Cupom'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Edição */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Cupom</DialogTitle>
                <DialogDescription>
                  Atualize os dados do cupom de desconto
                </DialogDescription>
              </DialogHeader>
              {editingCoupon && (
                <>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-code">
                          Código do Cupom <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="edit-code"
                          placeholder="Ex: DESCONTO20"
                          value={editingCoupon.code}
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-applicableTo">Aplicável a</Label>
                        <Select
                          value={editingCoupon.applicableTo}
                          onValueChange={(value) => setEditingCoupon({ ...editingCoupon, applicableTo: value })}
                        >
                          <SelectTrigger id="edit-applicableTo">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Ambos (Viagens e Encomendas)</SelectItem>
                            <SelectItem value="trips">Apenas Viagens</SelectItem>
                            <SelectItem value="shipments">Apenas Encomendas</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                          {editingCoupon.applicableTo === 'both' && '💡 Cupom válido para reservas de viagens e envio de encomendas'}
                          {editingCoupon.applicableTo === 'trips' && '🚢 Cupom válido apenas para reservas de viagens de passageiros'}
                          {editingCoupon.applicableTo === 'shipments' && '📦 Cupom válido apenas para envio de encomendas/cargas'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-description">Descrição</Label>
                      <Input
                        id="edit-description"
                        placeholder="Descrição do cupom"
                        value={editingCoupon.description}
                        onChange={(e) => setEditingCoupon({ ...editingCoupon, description: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-type">Tipo de Desconto</Label>
                        <Select
                          value={editingCoupon.type}
                          onValueChange={(value) => setEditingCoupon({ ...editingCoupon, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">Porcentagem (%)</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-value">
                          {editingCoupon.type === 'percentage' ? 'Desconto (%)' : 'Valor (R$)'} <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="edit-value"
                          type="number"
                          min="0"
                          max={editingCoupon.type === 'percentage' ? '100' : undefined}
                          value={editingCoupon.value}
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, value: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-usageLimit">Limite de Usos</Label>
                        <Input
                          id="edit-usageLimit"
                          type="number"
                          min="1"
                          value={editingCoupon.usageLimit}
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, usageLimit: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-validUntil">Data de Expiração</Label>
                        <Input
                          id="edit-validUntil"
                          type="date"
                          value={editingCoupon.validUntil}
                          onChange={(e) => setEditingCoupon({ ...editingCoupon, validUntil: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Filtros de Rota (Opcional) */}
                    <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                        <MapPin className="h-4 w-4" />
                        Filtros de Rota (Opcional)
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-fromCity">Cidade de Origem</Label>
                          <Input
                            id="edit-fromCity"
                            placeholder="Ex: Manaus"
                            value={editingCoupon.fromCity || ''}
                            onChange={(e) => setEditingCoupon({ ...editingCoupon, fromCity: e.target.value || null })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-toCity">Cidade de Destino</Label>
                          <Input
                            id="edit-toCity"
                            placeholder="Ex: Parintins"
                            value={editingCoupon.toCity || ''}
                            onChange={(e) => setEditingCoupon({ ...editingCoupon, toCity: e.target.value || null })}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Deixe em branco para aplicar a todas as rotas
                      </p>
                    </div>

                    {/* Filtros de Peso (Para Encomendas) */}
                    {(editingCoupon.applicableTo === 'shipments' || editingCoupon.applicableTo === 'both') && (
                      <div className="space-y-3 rounded-lg border p-4 bg-accent/5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/70">
                          <Package className="h-4 w-4" />
                          Filtros de Peso para Encomendas (Opcional)
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit-minWeight">Peso Mínimo (kg)</Label>
                            <Input
                              id="edit-minWeight"
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="Ex: 0.5"
                              value={editingCoupon.minWeight || ''}
                              onChange={(e) => setEditingCoupon({ ...editingCoupon, minWeight: e.target.value ? Number(e.target.value) : null })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit-maxWeight">Peso Máximo (kg)</Label>
                            <Input
                              id="edit-maxWeight"
                              type="number"
                              step="0.1"
                              min="0"
                              placeholder="Ex: 10"
                              value={editingCoupon.maxWeight || ''}
                              onChange={(e) => setEditingCoupon({ ...editingCoupon, maxWeight: e.target.value ? Number(e.target.value) : null })}
                            />
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Deixe em branco para não restringir por peso
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="text-destructive">*</span> Campos obrigatórios
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setIsEditDialogOpen(false);
                        setEditingCoupon(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="flex-1 bg-accent hover:bg-accent/90"
                      onClick={handleSaveEdit}
                      disabled={
                        !editingCoupon.code ||
                        editingCoupon.value <= 0 ||
                        updateMutation.isPending
                      }
                    >
                      {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
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

      {/* Filtros */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros e Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Código ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cupons */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Cupons ({filteredCoupons.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                Nenhum cupom encontrado
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedCoupons.map((coupon: any) => {
              const couponStatus = getCouponStatus(coupon);
              const usagePercentage = getUsagePercentage(coupon.usageCount, coupon.usageLimit);
              const daysUntilExpire = Math.ceil(
                (new Date(coupon.validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
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
                      {getStatusBadge(couponStatus)}
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
                          <div className="font-bold text-accent text-lg">
                            {coupon.type === 'percentage' ? `${coupon.value}%` : `R$ ${Number(coupon.value).toFixed(2)}`}
                          </div>
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
                            {new Date(coupon.validUntil).toLocaleDateString('pt-BR')}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="hover:bg-accent/10 hover:text-accent"
                      onClick={() => handleEditCoupon(coupon)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={
                        coupon.isActive
                          ? "hover:bg-destructive/10 hover:text-destructive"
                          : "hover:bg-secondary/10 hover:text-secondary"
                      }
                      onClick={() => handleToggleActive(coupon)}
                      disabled={updateMutation.isPending}
                    >
                      {coupon.isActive ? 'Pausar' : 'Ativar'}
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Paginação */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredCoupons.length}
              />
            )}
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
