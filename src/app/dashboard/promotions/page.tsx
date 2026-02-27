'use client';

import { useState, useMemo, useEffect, startTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Megaphone, Plus, Search, Filter, ToggleLeft, ToggleRight,
  Trash2, Edit2, Calendar, Star, MapPin, ExternalLink, Image,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { promotions } from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PromotionForm {
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  type: string;
  priority: number;
  validFrom: string;
  validUntil: string;
  cities: string;
}

interface Promotion extends PromotionForm {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const EMPTY_FORM: PromotionForm = {
  title: '',
  description: '',
  imageUrl: '',
  ctaText: '',
  ctaUrl: '',
  type: 'banner',
  priority: 1,
  validFrom: '',
  validUntil: '',
  cities: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildPayload(form: PromotionForm) {
  const payload: Record<string, unknown> = {
    title: form.title,
    type: form.type,
    priority: form.priority,
  };
  if (form.description) payload.description = form.description;
  if (form.imageUrl) payload.imageUrl = form.imageUrl;
  if (form.ctaText) payload.ctaText = form.ctaText;
  if (form.ctaUrl) payload.ctaUrl = form.ctaUrl;
  if (form.validFrom) payload.validFrom = new Date(form.validFrom).toISOString();
  if (form.validUntil) payload.validUntil = new Date(form.validUntil).toISOString();
  if (form.cities) payload.cities = form.cities.split(',').map((c) => c.trim()).filter(Boolean);
  return payload;
}

function isExpired(p: Promotion) {
  if (!p.validUntil) return false;
  return new Date(p.validUntil) < new Date();
}

function getStatus(p: Promotion) {
  if (!p.isActive) return 'inactive';
  if (isExpired(p)) return 'expired';
  return 'active';
}

// ─── Form Component ───────────────────────────────────────────────────────────

function PromotionFormFields({
  form,
  onChange,
}: {
  form: PromotionForm;
  onChange: (f: PromotionForm) => void;
}) {
  return (
    <div className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-title">
            Título <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pf-title"
            placeholder="Ex: Promoção de Verão"
            value={form.title}
            onChange={(e) => onChange({ ...form, title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-type">Tipo</Label>
          <Select value={form.type} onValueChange={(v) => onChange({ ...form, type: v })}>
            <SelectTrigger id="pf-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="banner">Banner</SelectItem>
              <SelectItem value="promotion">Promoção</SelectItem>
              <SelectItem value="announcement">Anúncio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pf-description">Descrição</Label>
        <Input
          id="pf-description"
          placeholder="Descrição breve da promoção"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pf-imageUrl">URL da Imagem</Label>
        <Input
          id="pf-imageUrl"
          placeholder="https://exemplo.com/imagem.jpg"
          value={form.imageUrl}
          onChange={(e) => onChange({ ...form, imageUrl: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-ctaText">Texto do Botão (CTA)</Label>
          <Input
            id="pf-ctaText"
            placeholder="Ex: Ver ofertas"
            value={form.ctaText}
            onChange={(e) => onChange({ ...form, ctaText: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-ctaUrl">Link do Botão (CTA)</Label>
          <Input
            id="pf-ctaUrl"
            placeholder="Ex: navegaja://trips"
            value={form.ctaUrl}
            onChange={(e) => onChange({ ...form, ctaUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-validFrom">Válido de</Label>
          <Input
            id="pf-validFrom"
            type="date"
            value={form.validFrom}
            onChange={(e) => onChange({ ...form, validFrom: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-validUntil">Válido até</Label>
          <Input
            id="pf-validUntil"
            type="date"
            value={form.validUntil}
            onChange={(e) => onChange({ ...form, validUntil: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pf-priority">Prioridade</Label>
          <Input
            id="pf-priority"
            type="number"
            min="1"
            max="100"
            value={form.priority}
            onChange={(e) => onChange({ ...form, priority: Number(e.target.value) })}
          />
          <p className="text-xs text-muted-foreground">Menor número = maior prioridade</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="pf-cities">Cidades (separadas por vírgula)</Label>
          <Input
            id="pf-cities"
            placeholder="Ex: Manaus, Parintins"
            value={form.cities}
            onChange={(e) => onChange({ ...form, cities: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Deixe em branco para todas as cidades</p>
        </div>
      </div>
    </div>
  );
}

// ─── Promotion Card ───────────────────────────────────────────────────────────

function PromotionCard({
  p,
  onEdit,
  onToggle,
  onDelete,
  isToggling,
  isDeleting,
}: {
  p: Promotion;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  isToggling: boolean;
  isDeleting: boolean;
}) {
  const status = getStatus(p);

  const statusBadge = {
    active: <Badge className="bg-secondary/15 text-secondary border-secondary/30">Ativo</Badge>,
    inactive: <Badge className="bg-muted text-muted-foreground border-border">Inativo</Badge>,
    expired: <Badge className="bg-destructive/15 text-destructive border-destructive/30">Expirado</Badge>,
  }[status];

  const typeBadge = {
    banner: <Badge variant="outline" className="text-primary border-primary/30">Banner</Badge>,
    promotion: <Badge variant="outline" className="text-accent border-accent/30">Promoção</Badge>,
    announcement: <Badge variant="outline" className="text-info border-info/30">Anúncio</Badge>,
  }[p.type as 'banner' | 'promotion' | 'announcement'] ?? (
    <Badge variant="outline">{p.type}</Badge>
  );

  return (
    <div className="flex gap-4 p-5 rounded-lg border hover:shadow-md transition-all bg-linear-to-r from-primary/5 to-transparent">
      {/* Thumbnail */}
      <div className="shrink-0 w-24 h-16 rounded-lg bg-muted border flex items-center justify-center overflow-hidden">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
        ) : (
          <Image className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-foreground truncate">{p.title}</span>
          {statusBadge}
          {typeBadge}
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
            <Star className="h-3 w-3" /> Prioridade {p.priority}
          </span>
        </div>

        {p.description && (
          <p className="text-sm text-foreground/70 line-clamp-1">{p.description}</p>
        )}

        <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
          {(p.validFrom || p.validUntil) && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {p.validFrom ? new Date(p.validFrom).toLocaleDateString('pt-BR') : '—'}
              {' → '}
              {p.validUntil ? new Date(p.validUntil).toLocaleDateString('pt-BR') : 'sem fim'}
            </span>
          )}
          {p.ctaUrl && (
            <span className="flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {p.ctaText || p.ctaUrl}
            </span>
          )}
          {p.cities && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {typeof p.cities === 'string' ? p.cities : (p.cities as string[]).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 shrink-0">
        <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:text-primary" onClick={onEdit}>
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={p.isActive ? 'hover:bg-warning/10 hover:text-warning' : 'hover:bg-secondary/10 hover:text-secondary'}
          onClick={onToggle}
          disabled={isToggling}
          title={p.isActive ? 'Desativar' : 'Ativar'}
        >
          {p.isActive ? <ToggleRight className="h-3.5 w-3.5 text-secondary" /> : <ToggleLeft className="h-3.5 w-3.5" />}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<PromotionForm>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<PromotionForm>(EMPTY_FORM);
  const itemsPerPage = 6;

  // ── Queries & Mutations ──
  const { data: allData = [], isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: promotions.getAll,
    refetchInterval: 60000,
  });

  const createMutation = useMutation({
    mutationFn: (form: PromotionForm) => promotions.create(buildPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setIsCreateOpen(false);
      setCreateForm(EMPTY_FORM);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: PromotionForm }) =>
      promotions.update(id, buildPayload(form)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setIsEditOpen(false);
      setEditId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => promotions.toggle(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => promotions.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['promotions'] }),
  });

  // ── Derived state ──
  const all = Array.isArray(allData) ? allData as Promotion[] : [];

  const stats = {
    total: all.length,
    active: all.filter((p) => getStatus(p) === 'active').length,
    inactive: all.filter((p) => getStatus(p) === 'inactive').length,
    expired: all.filter((p) => getStatus(p) === 'expired').length,
  };

  const filtered = useMemo(() => {
    return all.filter((p) => {
      const matchSearch = !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === 'all' || p.type === typeFilter;
      const matchStatus = statusFilter === 'all' || getStatus(p) === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [all, searchTerm, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    startTransition(() => setCurrentPage(1));
  }, [searchTerm, typeFilter, statusFilter]);

  // ── Handlers ──
  const handleEdit = (p: Promotion) => {
    setEditId(p.id);
    setEditForm({
      title: p.title,
      description: p.description || '',
      imageUrl: p.imageUrl || '',
      ctaText: p.ctaText || '',
      ctaUrl: p.ctaUrl || '',
      type: p.type,
      priority: p.priority,
      validFrom: p.validFrom ? new Date(p.validFrom).toISOString().split('T')[0] : '',
      validUntil: p.validUntil ? new Date(p.validUntil).toISOString().split('T')[0] : '',
      cities: Array.isArray(p.cities) ? (p.cities as string[]).join(', ') : (p.cities || ''),
    });
    setIsEditOpen(true);
  };

  const handleDelete = (p: Promotion) => {
    if (confirm(`Deseja deletar a promoção "${p.title}"?`)) {
      deleteMutation.mutate(p.id);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-lg bg-linear-to-br from-primary/5 via-primary-light/5 to-transparent p-6 border border-primary/10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Promoções & Banners</h1>
              <p className="mt-1 text-base text-foreground/70">
                Gerenciar banners e promoções exibidos no app
              </p>
            </div>
          </div>

          {/* Create Dialog */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Nova Promoção
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Promoção</DialogTitle>
                <DialogDescription>
                  Preencha os dados do banner ou promoção
                </DialogDescription>
              </DialogHeader>
              <PromotionFormFields form={createForm} onChange={setCreateForm} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsCreateOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => createMutation.mutate(createForm)}
                  disabled={!createForm.title || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Criando...' : 'Criar Promoção'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Dialog */}
          <Dialog open={isEditOpen} onOpenChange={(v) => { setIsEditOpen(v); if (!v) setEditId(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Editar Promoção</DialogTitle>
                <DialogDescription>Atualize os dados da promoção</DialogDescription>
              </DialogHeader>
              <PromotionFormFields form={editForm} onChange={setEditForm} />
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setIsEditOpen(false); setEditId(null); }}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-primary hover:bg-primary/90"
                  onClick={() => editId && updateMutation.mutate({ id: editId, form: editForm })}
                  disabled={!editForm.title || updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-5 md:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, color: 'border-l-primary', textColor: 'text-primary' },
          { label: 'Ativos', value: stats.active, color: 'border-l-secondary/30', textColor: 'text-secondary' },
          { label: 'Inativos', value: stats.inactive, color: 'border-l-muted-foreground/30', textColor: 'text-muted-foreground' },
          { label: 'Expirados', value: stats.expired, color: 'border-l-destructive/30', textColor: 'text-destructive' },
        ].map((s) => (
          <Card key={s.label} className={`border-l-4 ${s.color} shadow-md`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-bold ${s.textColor}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="banner">Banner</SelectItem>
                  <SelectItem value="promotion">Promoção</SelectItem>
                  <SelectItem value="announcement">Anúncio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="expired">Expirados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card className="shadow-md">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle>Promoções ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                Nenhuma promoção encontrada
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Crie uma nova promoção clicando no botão acima
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginated.map((p) => (
                <PromotionCard
                  key={p.id}
                  p={p}
                  onEdit={() => handleEdit(p)}
                  onToggle={() => toggleMutation.mutate(p.id)}
                  onDelete={() => handleDelete(p)}
                  isToggling={toggleMutation.isPending && toggleMutation.variables === p.id}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === p.id}
                />
              ))}

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filtered.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
