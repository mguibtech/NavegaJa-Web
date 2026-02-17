'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Users, Search, Filter, Shield, User, Trash2, Eye, Mail, Phone, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { admin } from '@/lib/api';
import { User as UserType, UserRole, UserStatus } from '@/types/user';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Badge de Role
function RoleBadge({ role }: { role: UserRole }) {
  const variants: Record<UserRole, { className: string; icon: any; label: string }> = {
    [UserRole.ADMIN]: {
      className: 'bg-purple-100 text-purple-800 border-purple-300',
      icon: Shield,
      label: 'Administrador',
    },
    [UserRole.CAPTAIN]: {
      className: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: User,
      label: 'Capitão',
    },
    [UserRole.PASSENGER]: {
      className: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: User,
      label: 'Passageiro',
    },
  };

  const config = variants[role];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Badge de Status
function StatusBadge({ status }: { status: UserStatus }) {
  const variants: Record<UserStatus, { className: string; icon: any; label: string }> = {
    [UserStatus.ACTIVE]: {
      className: 'bg-green-100 text-green-800 border-green-300',
      icon: CheckCircle,
      label: 'Ativo',
    },
    [UserStatus.INACTIVE]: {
      className: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: XCircle,
      label: 'Inativo',
    },
    [UserStatus.SUSPENDED]: {
      className: 'bg-red-100 text-red-800 border-red-300',
      icon: XCircle,
      label: 'Suspenso',
    },
  };

  const config = variants[status] || variants[UserStatus.ACTIVE];
  const Icon = config.icon;

  return (
    <Badge className={config.className}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

// Modal de alteração de role
function ChangeRoleDialog({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [open, setOpen] = useState(false);

  const changeMutation = useMutation({
    mutationFn: (role: string) => admin.users.updateRole(user.id, role),
    onSuccess: () => {
      onSuccess();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Shield className="h-4 w-4 mr-2" />
          Alterar Role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar Permissão de Usuário</DialogTitle>
          <DialogDescription>
            Alterar a permissão de {user.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>
              Nova Permissão <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                <SelectItem value={UserRole.CAPTAIN}>Capitão</SelectItem>
                <SelectItem value={UserRole.PASSENGER}>Passageiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ <strong>Atenção:</strong> Alterar a permissão pode afetar o acesso do usuário ao sistema.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Campo obrigatório
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => changeMutation.mutate(selectedRole)}
            disabled={changeMutation.isPending || selectedRole === user.role}
          >
            {changeMutation.isPending ? 'Salvando...' : 'Salvar Alteração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal de confirmação de deleção
function DeleteUserDialog({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => admin.users.delete(user.id),
    onSuccess: () => {
      onSuccess();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 text-red-600" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deletar Usuário</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-800">
              ⚠️ <strong>ATENÇÃO:</strong> Todos os dados relacionados a este usuário serão removidos permanentemente.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deletando...' : 'Deletar Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Modal de detalhes do usuário
function UserDetailsDialog({ user }: { user: UserType }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Usuário
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Nome e Status */}
          <div>
            <h3 className="text-lg font-semibold">{user.name}</h3>
            <div className="mt-2 flex gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>

          {/* Contato */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 text-sm font-semibold">Contato</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
                {user.emailVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
                {user.phoneVerified && <CheckCircle className="h-4 w-4 text-green-600" />}
              </div>
            </div>
          </div>

          {/* Informações Pessoais */}
          {(user.cpf || user.birthDate) && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">Informações Pessoais</div>
              <div className="grid gap-2 text-sm md:grid-cols-2">
                {user.cpf && (
                  <div>
                    <p className="text-muted-foreground">CPF</p>
                    <p className="font-medium">{user.cpf}</p>
                  </div>
                )}
                {user.birthDate && (
                  <div>
                    <p className="text-muted-foreground">Data de Nascimento</p>
                    <p className="font-medium">
                      {format(new Date(user.birthDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Endereço */}
          {user.address && (
            <div className="rounded-lg border p-4">
              <div className="mb-2 text-sm font-semibold">Endereço</div>
              <div className="text-sm">
                {user.address.street && <p>{user.address.street}</p>}
                {(user.address.city || user.address.state) && (
                  <p>
                    {user.address.city}
                    {user.address.city && user.address.state && ', '}
                    {user.address.state}
                  </p>
                )}
                {user.address.zipCode && <p>CEP: {user.address.zipCode}</p>}
              </div>
            </div>
          )}

          {/* Datas */}
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Calendar className="h-4 w-4" />
              Datas
            </div>
            <div className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <p className="text-muted-foreground">Cadastro</p>
                <p className="font-medium">
                  {format(new Date(user.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {user.lastLogin && (
                <div>
                  <p className="text-muted-foreground">Último Login</p>
                  <p className="font-medium">
                    {format(new Date(user.lastLogin), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Query para buscar usuários
  const { data: usersResponse, isLoading, refetch } = useQuery({
    queryKey: ['users', roleFilter, statusFilter, currentPage],
    queryFn: () => {
      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      return admin.users.getAll(params);
    },
  });

  const usersData = usersResponse?.data || [];

  // Query para estatísticas
  const { data: stats } = useQuery({
    queryKey: ['users-stats'],
    queryFn: admin.users.getStats,
  });

  // Filtrar por busca
  const filteredUsers = useMemo(() => {
    return usersData.filter((user: UserType) => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        user.phone.includes(search) ||
        user.cpf?.includes(search)
      );
    });
  }, [usersData, searchTerm]);

  // Paginação
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter, statusFilter]);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['users'] });
    queryClient.invalidateQueries({ queryKey: ['users-stats'] });
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie todos os usuários do sistema NavegaJá
          </p>
        </div>
        <Button onClick={() => refetch()}>
          Atualizar
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.byRole?.admin || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Capitães</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.byRole?.captain || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Passageiros</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">
                {stats.byRole?.passenger || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros e Busca */}
      <Card>
        <CardHeader className="border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle>Filtros e Busca</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, email, telefone, CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Permissões</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrador</SelectItem>
                  <SelectItem value={UserRole.CAPTAIN}>Capitão</SelectItem>
                  <SelectItem value={UserRole.PASSENGER}>Passageiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value={UserStatus.ACTIVE}>Ativo</SelectItem>
                  <SelectItem value={UserStatus.INACTIVE}>Inativo</SelectItem>
                  <SelectItem value={UserStatus.SUSPENDED}>Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            {filteredUsers.length} usuário(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-base font-medium text-muted-foreground">
                {usersData.length === 0 ? 'Nenhum usuário registrado' : 'Nenhum resultado encontrado'}
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {usersData.length === 0
                  ? 'Quando houver usuários, eles aparecerão aqui'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedUsers.map((user: UserType) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{user.name}</p>
                      <RoleBadge role={user.role} />
                      <StatusBadge status={user.status} />
                    </div>
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{user.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Cadastro: {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <UserDetailsDialog user={user} />
                    <ChangeRoleDialog user={user} onSuccess={handleSuccess} />
                    {user.role !== UserRole.ADMIN && (
                      <DeleteUserDialog user={user} onSuccess={handleSuccess} />
                    )}
                  </div>
                </div>
              ))}

              {/* Paginação */}
              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={filteredUsers.length}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
