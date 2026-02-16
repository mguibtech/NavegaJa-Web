'use client';

import { AlertCircle, XCircle, Info, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorAlertProps {
  error: string;
  statusCode?: number;
  debugInfo?: string;
}

export function ErrorAlert({ error, statusCode, debugInfo }: ErrorAlertProps) {
  // Determinar ícone e cor baseado no status code
  const getErrorConfig = () => {
    if (!statusCode) {
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        title: 'Erro',
        color: 'text-red-600',
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        icon: XCircle,
        variant: 'destructive' as const,
        title: 'Não Autorizado',
        color: 'text-red-600',
      };
    }

    if (statusCode === 404) {
      return {
        icon: AlertTriangle,
        variant: 'destructive' as const,
        title: 'Não Encontrado',
        color: 'text-orange-600',
      };
    }

    if (statusCode >= 500) {
      return {
        icon: AlertCircle,
        variant: 'destructive' as const,
        title: 'Erro no Servidor',
        color: 'text-red-600',
      };
    }

    return {
      icon: Info,
      variant: 'destructive' as const,
      title: `Erro ${statusCode}`,
      color: 'text-red-600',
    };
  };

  const config = getErrorConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-2">
      <Alert variant={config.variant}>
        <Icon className="h-4 w-4" />
        <AlertTitle>{config.title}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>

      {debugInfo && (
        <details className="rounded-md border border-gray-200 bg-gray-50 p-3">
          <summary className="cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
            🔍 Detalhes Técnicos (clique para expandir)
          </summary>
          <pre className="mt-2 whitespace-pre-wrap text-xs text-gray-600">
            {debugInfo}
          </pre>
        </details>
      )}

      {statusCode === 401 && (
        <div className="rounded-md bg-blue-50 p-3 text-sm">
          <p className="font-medium text-blue-900">💡 Dica:</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-blue-800">
            <li>Verifique se o email está correto</li>
            <li>Verifique se a senha está correta</li>
            <li>Certifique-se de que o usuário existe no banco de dados</li>
            <li>Apenas administradores e capitães podem acessar</li>
          </ul>
        </div>
      )}

      {!statusCode && error.includes('Network Error') && (
        <div className="rounded-md bg-orange-50 p-3 text-sm">
          <p className="font-medium text-orange-900">⚠️ Backend não está respondendo</p>
          <ul className="mt-1 list-inside list-disc space-y-1 text-orange-800">
            <li>Verifique se o backend está rodando</li>
            <li>Execute: <code className="rounded bg-orange-100 px-1 py-0.5">cd backend && yarn start:dev</code></li>
            <li>O backend deve estar em: {debugInfo?.match(/URL: (.+)/)?.[1]}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
