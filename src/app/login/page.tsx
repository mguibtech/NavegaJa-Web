'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ship } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/api';
import { ErrorAlert } from '@/components/error-alert';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [statusCode, setStatusCode] = useState<number | undefined>();
  const [isOnline, setIsOnline] = useState(true);
  const [canSubmit, setCanSubmit] = useState(true); // Controle para evitar submits rápidos

  // Atualizar status online/offline após montagem (client-side only)
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Bloquear se já estiver processando ou se tiver erro recente
    if (!canSubmit || loading) {
      console.log('⏸️ Aguarde antes de tentar novamente');
      return;
    }

    setCanSubmit(false);
    setLoading(true);
    setError('');
    setStatusCode(undefined);

    console.log('🔐 Tentando fazer login com:', { email });
    setDebugInfo('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      console.log('📡 Enviando requisição para:', `${apiUrl}/auth/login-web`);
      setDebugInfo(`Tentando conectar em: ${apiUrl}/auth/login-web`);

      const data = await auth.login(email, password);

      console.log('✅ Login bem-sucedido!', data);

      // Salvar token e usuário no localStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Salvar token no cookie também (para o middleware)
      document.cookie = `token=${data.accessToken}; path=/; max-age=604800`; // 7 dias

      console.log('🍪 Token salvo no cookie e localStorage');

      // Forçar reload da página para o middleware detectar o cookie
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('❌ Erro no login:', err);
      console.error('Response:', err.response);
      console.error('Data:', err.response?.data);
      console.error('Status:', err.response?.status);

      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (!navigator.onLine) {
        errorMessage = 'Sem conexão com a internet.';
      } else if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
        errorMessage = 'Servidor não está respondendo. Verifique se o backend está rodando.';
      }

      const debugText = `
Status: ${err.response?.status || 'N/A'}
URL: ${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/auth/login-web
Message: ${err.message}
Response: ${JSON.stringify(err.response?.data, null, 2)}
      `;

      setError(errorMessage);
      setDebugInfo(debugText);
      setStatusCode(err.response?.status);

      // Bloquear reenvio por 5 segundos após erro para garantir leitura
      setTimeout(() => {
        setCanSubmit(true);
      }, 5000);
    } finally {
      setLoading(false);
    }
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@navegaja.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                autoComplete="current-password"
              />
            </div>
            {error && (
              <ErrorAlert
                error={error}
                statusCode={statusCode}
                debugInfo={debugInfo}
              />
            )}
            <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
              {loading ? 'Entrando...' : !canSubmit ? 'Aguarde...' : 'Entrar'}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Acesso restrito a administradores e capitães
            </p>
            <div className="mt-4 rounded border border-dashed border-gray-300 bg-gray-50 p-2 text-xs">
              <p className="font-medium">🔧 Info Técnica:</p>
              <p>Backend: {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}</p>
              <p>Status: {isOnline ? '🟢 Online' : '🔴 Offline'}</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
