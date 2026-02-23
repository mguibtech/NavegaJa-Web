'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { boats } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, Trash2, Edit2, Ship, CheckCircle, XCircle, Eye, ShieldCheck } from 'lucide-react';
import { admin } from '@/lib/api';

interface Boat {
  id: string;
  name: string;
  type: string;
  capacity: number;
  model?: string;
  year?: number;
  photoUrl?: string;
  amenities: string[];
  photos: string[];
  registrationNum?: string;
  isVerified: boolean;
  createdAt: string;
  owner?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function BoatsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedBoat, setSelectedBoat] = useState<Boat | null>(null);
  const [amenitiesInput, setAmenitiesInput] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'lancha',
    capacity: 0,
    model: '',
    year: new Date().getFullYear(),
    photoUrl: '',
    registrationNum: '',
    amenities: [] as string[],
  });

  // Queries
  const { data: boatsData = [], isLoading } = useQuery({
    queryKey: ['boats'],
    queryFn: boats.getAll,
  });

  const { data: myBoatsData = [] } = useQuery({
    queryKey: ['my-boats'],
    queryFn: boats.myBoats,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: boats.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['my-boats'] });
      setIsCreateModalOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) => boats.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['my-boats'] });
      setIsEditModalOpen(false);
      setSelectedBoat(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: boats.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['my-boats'] });
      setIsDeleteModalOpen(false);
      setSelectedBoat(null);
    },
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => admin.boats.verify(id, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
    },
  });

  // Filtros
  const filteredBoats = useMemo(() => {
    let filtered = Array.isArray(boatsData) ? boatsData : [];

    if (searchTerm) {
      filtered = filtered.filter((boat: Boat) =>
        boat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        boat.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        boat.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((boat: Boat) => boat.type === typeFilter);
    }

    if (verifiedFilter !== 'all') {
      const isVerified = verifiedFilter === 'verified';
      filtered = filtered.filter((boat: Boat) => boat.isVerified === isVerified);
    }

    return filtered;
  }, [boatsData, searchTerm, typeFilter, verifiedFilter]);

  // Stats
  const stats = useMemo(() => {
    const allBoats = Array.isArray(boatsData) ? boatsData : [];
    return {
      total: allBoats.length,
      verified: allBoats.filter((b: Boat) => b.isVerified).length,
      pending: allBoats.filter((b: Boat) => !b.isVerified).length,
      myBoats: Array.isArray(myBoatsData) ? myBoatsData.length : 0,
    };
  }, [boatsData, myBoatsData]);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'lancha',
      capacity: 0,
      model: '',
      year: new Date().getFullYear(),
      photoUrl: '',
      registrationNum: '',
      amenities: [],
    });
    setAmenitiesInput('');
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (boat: Boat) => {
    setSelectedBoat(boat);
    setFormData({
      name: boat.name,
      type: boat.type,
      capacity: boat.capacity,
      model: boat.model || '',
      year: boat.year || new Date().getFullYear(),
      photoUrl: boat.photoUrl || '',
      registrationNum: boat.registrationNum || '',
      amenities: boat.amenities || [],
    });
    setAmenitiesInput((boat.amenities || []).join(', '));
    setIsEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (selectedBoat) {
      updateMutation.mutate({ id: selectedBoat.id, data: formData });
    }
  };

  const handleDelete = (boat: Boat) => {
    setSelectedBoat(boat);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedBoat) {
      deleteMutation.mutate(selectedBoat.id);
    }
  };

  const handleViewDetails = (boat: Boat) => {
    setSelectedBoat(boat);
    setIsDetailsModalOpen(true);
  };

  const handleAmenitiesChange = (value: string) => {
    setAmenitiesInput(value);
    const amenitiesArray = value.split(',').map(a => a.trim()).filter(a => a.length > 0);
    setFormData({ ...formData, amenities: amenitiesArray });
  };

  const boatTypes = [
    { value: 'lancha', label: 'Lancha' },
    { value: 'voadeira', label: 'Voadeira' },
    { value: 'balsa', label: 'Balsa' },
    { value: 'recreio', label: 'Recreio' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Barcos</h1>
          <p className="text-muted-foreground">Gerencie as embarcações cadastradas no sistema</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Cadastrar Barco
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total de Barcos</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Verificados</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats.verified}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pendentes</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Meus Barcos</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats.myBoats}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, tipo ou proprietário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {boatTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Verificação</Label>
              <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="verified">Verificados</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Barcos ({filteredBoats.length})</CardTitle>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Proprietário</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBoats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      Nenhum barco encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBoats.map((boat: Boat) => (
                    <TableRow key={boat.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4 text-muted-foreground" />
                          {boat.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {boatTypes.find(t => t.value === boat.type)?.label || boat.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{boat.capacity} pessoas</TableCell>
                      <TableCell>
                        {boat.owner?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {boat.isVerified ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="mr-1 h-3 w-3" />
                            Pendente
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {!boat.isVerified && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => verifyMutation.mutate(boat.id)}
                              disabled={verifyMutation.isPending}
                              title="Verificar embarcação"
                            >
                              <ShieldCheck className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(boat)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(boat)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(boat)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cadastrar Novo Barco</DialogTitle>
            <DialogDescription>
              Preencha as informações da embarcação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lancha Azul"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boatTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidade *</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 12"
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: Phantom 500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="Ex: 2024"
                />
              </div>
              <div>
                <Label>Número de Registro</Label>
                <Input
                  value={formData.registrationNum}
                  onChange={(e) => setFormData({ ...formData, registrationNum: e.target.value })}
                  placeholder="Ex: ABC-1234"
                />
              </div>
            </div>

            <div>
              <Label>URL da Foto</Label>
              <Input
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>

            <div>
              <Label>Comodidades (separadas por vírgula)</Label>
              <Textarea
                value={amenitiesInput}
                onChange={(e) => handleAmenitiesChange(e.target.value)}
                placeholder="Ex: Wi-Fi, Ar condicionado, Banheiro, Cozinha"
                rows={3}
              />
              {formData.amenities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsCreateModalOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!formData.name || !formData.type || formData.capacity <= 0 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Barco</DialogTitle>
            <DialogDescription>
              Atualize as informações da embarcação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Lancha Azul"
                />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {boatTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Capacidade *</Label>
                <Input
                  type="number"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 12"
                />
              </div>
              <div>
                <Label>Modelo</Label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="Ex: Phantom 500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Ano</Label>
                <Input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                  placeholder="Ex: 2024"
                />
              </div>
              <div>
                <Label>Número de Registro</Label>
                <Input
                  value={formData.registrationNum}
                  onChange={(e) => setFormData({ ...formData, registrationNum: e.target.value })}
                  placeholder="Ex: ABC-1234"
                />
              </div>
            </div>

            <div>
              <Label>URL da Foto</Label>
              <Input
                value={formData.photoUrl}
                onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>

            <div>
              <Label>Comodidades (separadas por vírgula)</Label>
              <Textarea
                value={amenitiesInput}
                onChange={(e) => handleAmenitiesChange(e.target.value)}
                placeholder="Ex: Wi-Fi, Ar condicionado, Banheiro, Cozinha"
                rows={3}
              />
              {formData.amenities.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {formData.amenities.map((amenity, idx) => (
                    <Badge key={idx} variant="secondary">{amenity}</Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); setSelectedBoat(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!formData.name || !formData.type || formData.capacity <= 0 || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Barco</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o barco <strong>{selectedBoat?.name}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDeleteModalOpen(false); setSelectedBoat(null); }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Barco</DialogTitle>
          </DialogHeader>
          {selectedBoat && (
            <div className="space-y-6">
              {selectedBoat.photoUrl && (
                <div className="w-full h-48 bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedBoat.photoUrl}
                    alt={selectedBoat.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Nome</Label>
                  <p className="font-medium">{selectedBoat.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <p className="font-medium">
                    {boatTypes.find(t => t.value === selectedBoat.type)?.label || selectedBoat.type}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Capacidade</Label>
                  <p className="font-medium">{selectedBoat.capacity} pessoas</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Modelo</Label>
                  <p className="font-medium">{selectedBoat.model || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Ano</Label>
                  <p className="font-medium">{selectedBoat.year || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Registro</Label>
                  <p className="font-medium">{selectedBoat.registrationNum || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Proprietário</Label>
                  <p className="font-medium">{selectedBoat.owner?.name || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    {selectedBoat.isVerified ? (
                      <Badge className="bg-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verificado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="mr-1 h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedBoat.amenities && selectedBoat.amenities.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Comodidades</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedBoat.amenities.map((amenity, idx) => (
                      <Badge key={idx} variant="outline">{amenity}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Cadastrado em</Label>
                <p className="font-medium">
                  {new Date(selectedBoat.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsDetailsModalOpen(false); setSelectedBoat(null); }}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
