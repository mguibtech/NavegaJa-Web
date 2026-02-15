'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/api';

// Função para formatar telefone
const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, '');
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 4) return `+${numbers.slice(0, 2)} ${numbers.slice(2)}`;
  if (numbers.length <= 6) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4)}`;
  if (numbers.length <= 11) return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
  return `+${numbers.slice(0, 2)} ${numbers.slice(2, 4)} ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
};

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Remover formatação do telefone antes de enviar
      const cleanPhone = phone.replace(/\D/g, '');
      const data = await auth.login(`+${cleanPhone}`, password);

      // Salvar token e usuário no localStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Salvar token no cookie também (para o middleware)
      document.cookie = `token=${data.accessToken}; path=/; max-age=604800`; // 7 dias

      // Forçar reload da página para o middleware detectar o cookie
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary via-primary-mid to-primary-light p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg">
            <Ship className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">NavegaJá Admin</CardTitle>
          <CardDescription className="text-muted-foreground">
            Entre com suas credenciais para acessar o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                type="text"
                placeholder="+55 92 99999-9999"
                value={phone}
                onChange={handlePhoneChange}
                maxLength={19}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
