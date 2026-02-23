'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useEffect, startTransition, useRef } from 'react';
import type { ElementType } from 'react';
import { Users, Search, Filter, Shield, User, Trash2, Eye, EyeOff, Mail, Phone, Calendar, CheckCircle, XCircle, Ban, LockOpen, MapPin, Anchor, Plus, ShieldAlert, ShieldCheck } from 'lucide-react';
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
  const variants: Record<UserRole, { className: string; icon: ElementType; label: string }> = {
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
  const variants: Record<UserStatus, { className: string; icon: ElementType; label: string }> = {
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

// Badge de isActive (bloqueado/ativo pelo admin)
function ActiveBadge({ isActive }: { isActive: boolean }) {
  if (isActive) return null;
  return (
    <Badge className="bg-red-100 text-red-800 border-red-300">
      <Ban className="h-3 w-3 mr-1" />
      Bloqueado
    </Badge>
  );
}

// Badge + botão de verificação para capitães
function VerificationBadge({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
  const queryClient = useQueryClient();
  if (user.role !== UserRole.CAPTAIN) return null;

  const resetMutation = useMutation({
    mutationFn: () => admin.users.verify(user.id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['pending-verifications'] });
      onSuccess();
    },
  });

  if (user.isVerified === false) {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-300">
        <ShieldAlert className="h-3 w-3 mr-1" />
        Doc. pendente
      </Badge>
    );
  }

  if (user.isVerified === true) {
    return (
      <div className="flex items-center gap-1">
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Verificado
        </Badge>
        <button
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          title="Resetar verificação (re-envio de documentos)"
          className="text-xs text-amber-600 hover:text-amber-800 underline underline-offset-2 disabled:opacity-50"
        >
          {resetMutation.isPending ? '...' : 'Resetar'}
        </button>
      </div>
    );
  }

  return null;
}

// Modal de bloquear/desbloquear
function ToggleStatusDialog({ user, onSuccess }: { user: UserType; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const blocking = user.isActive;

  const toggleMutation = useMutation({
    mutationFn: () => admin.users.updateStatus(user.id, !user.isActive),
    onSuccess: () => {
      onSuccess();
      setOpen(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" title={blocking ? 'Bloquear usuário' : 'Desbloquear usuário'}>
          {blocking
            ? <Ban className="h-4 w-4 text-orange-500" />
            : <LockOpen className="h-4 w-4 text-green-600" />
          }
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{blocking ? 'Bloquear Usuário' : 'Desbloquear Usuário'}</DialogTitle>
          <DialogDescription>
            {blocking
              ? `Bloquear o acesso de ${user.name} ao aplicativo?`
              : `Restaurar o acesso de ${user.name} ao aplicativo?`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="rounded-lg border p-4">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          {blocking && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <p className="text-sm text-orange-800">
                ⚠️ O usuário não conseguirá fazer login enquanto estiver bloqueado.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant={blocking ? 'destructive' : 'default'}
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
          >
            {toggleMutation.isPending
              ? 'Salvando...'
              : blocking ? 'Bloquear Usuário' : 'Desbloquear Usuário'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

// Municípios do Amazonas
const CIDADES_AM = [
  'Alvarães', 'Amaturá', 'Anamã', 'Anori', 'Apuí', 'Atalaia do Norte', 'Autazes',
  'Barcelos', 'Barreirinha', 'Benjamin Constant', 'Beruri', 'Boa Vista do Ramos',
  'Boca do Acre', 'Borba', 'Caapiranga', 'Canutama', 'Carauari', 'Careiro',
  'Careiro da Várzea', 'Coari', 'Codajás', 'Eirunepé', 'Envira', 'Fonte Boa',
  'Guajará', 'Humaitá', 'Ipixuna', 'Iranduba', 'Itacoatiara', 'Itamarati',
  'Itapiranga', 'Japurá', 'Juruá', 'Jutaí', 'Lábrea', 'Manacapuru', 'Manaquiri',
  'Manaus', 'Manicoré', 'Maraã', 'Maués', 'Nhamundá', 'Nova Olinda do Norte',
  'Novo Airão', 'Novo Aripuanã', 'Parintins', 'Pauini', 'Presidente Figueiredo',
  'Rio Preto da Eva', 'Santa Isabel do Rio Negro', 'Santo Antônio do Içá',
  'São Gabriel da Cachoeira', 'São Paulo de Olivença', 'São Sebastião do Uatumã',
  'Silves', 'Tabatinga', 'Tapauá', 'Tefé', 'Tonantins', 'Uarini', 'Urucará',
  'Urucurituba',
];

// Combobox de cidades do Amazonas
function CityCombobox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  // Sincroniza o texto quando o valor externo muda (ex: reset do form)
  useEffect(() => { setSearch(value); }, [value]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    CIDADES_AM.filter(c => c.toLowerCase().includes(search.toLowerCase())),
    [search]
  );

  const handleSelect = (city: string) => {
    onChange(city);
    setSearch(city);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id="cap-city"
          placeholder="Digite ou selecione a cidade..."
          value={search}
          onChange={e => { setSearch(e.target.value); onChange(''); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {filtered.map(city => (
            <button
              key={city}
              type="button"
              onMouseDown={e => { e.preventDefault(); handleSelect(city); }}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground ${
                city === value ? 'bg-accent/50 font-medium' : ''
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Formata telefone brasileiro: (99) 99999-9999
function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Modal de criação de capitão
function CreateCaptainDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', city: '' });
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => admin.captains.create({
      name: form.name.trim(),
      phone: form.phone.replace(/\D/g, ''),
      password: form.password,
      ...(form.email.trim() && { email: form.email.trim() }),
      ...(form.city.trim() && { city: form.city.trim() }),
    }),
    onSuccess: () => {
      onSuccess();
      setOpen(false);
      setForm({ name: '', email: '', phone: '', password: '', city: '' });
      setError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erro ao criar capitão. Verifique os dados e tente novamente.');
    },
  });

  const phoneDigits = form.phone.replace(/\D/g, '');
  const isValid = form.name.trim() && phoneDigits.length >= 10 && form.password.length >= 6;

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setError(''); }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Criar Capitão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Anchor className="h-5 w-5 text-blue-600" />
            Criar Novo Capitão
          </DialogTitle>
          <DialogDescription>
            A conta será criada com <strong>isVerified=false</strong>. O capitão ainda precisará ter seus documentos aprovados em Verificações.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cap-name">
              Nome completo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cap-name"
              placeholder="Carlos Navegador"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap-email">E-mail</Label>
            <Input
              id="cap-email"
              type="email"
              placeholder="capitao@exemplo.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap-phone">
              Telefone <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cap-phone"
              placeholder="(92) 99200-1099"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: formatPhone(e.target.value) }))}
              inputMode="numeric"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap-password">
              Senha <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="cap-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cap-city">Cidade</Label>
            <CityCombobox
              value={form.city}
              onChange={city => setForm(f => ({ ...f, city }))}
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Campo obrigatório
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!isValid || createMutation.isPending}
          >
            {createMutation.isPending ? 'Criando...' : 'Criar Capitão'}
          </Button>
        </DialogFooter>
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
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (roleFilter !== 'all') params.role = roleFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      return admin.users.getAll(params);
    },
  });

  const usersData = Array.isArray(usersResponse) ? usersResponse : (usersResponse?.data || []);

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
  useEffect(() => {
    startTransition(() => { setCurrentPage(1); });
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
        <div className="flex gap-2">
          <CreateCaptainDialog onSuccess={handleSuccess} />
          <Button variant="outline" onClick={() => refetch()}>
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.newToday || 0} novos hoje
              </p>
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
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1">
                <Ban className="h-4 w-4 text-red-500" />
                Bloqueados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.blockedUsers || 0}
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
              {paginatedUsers.map((user: UserType) => {
                const city = user.city || user.address?.city;
                const state = user.state || user.address?.state;
                const location = city && state ? `${city}, ${state}` : city || state || '—';
                return (
                  <div
                    key={user.id}
                    className="rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                  >
                    {/* Linha 1: nome + badges + ações */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <p className="font-semibold truncate">{user.name}</p>
                        <RoleBadge role={user.role} />
                        <StatusBadge status={user.status} />
                        <ActiveBadge isActive={user.isActive} />
                        <VerificationBadge user={user} onSuccess={handleSuccess} />
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <UserDetailsDialog user={user} />
                        <ChangeRoleDialog user={user} onSuccess={handleSuccess} />
                        {user.role !== UserRole.ADMIN && (
                          <ToggleStatusDialog user={user} onSuccess={handleSuccess} />
                        )}
                        {user.role !== UserRole.ADMIN && (
                          <DeleteUserDialog user={user} onSuccess={handleSuccess} />
                        )}
                      </div>
                    </div>
                    {/* Linha 2: info em grid 2×2 */}
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{user.email || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{user.phone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>Cadastro: {format(new Date(user.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                      </div>
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
