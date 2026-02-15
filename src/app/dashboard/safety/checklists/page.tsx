'use client';

import { CheckCircle, XCircle, Clock, Ship } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Placeholder - integrar com API depois
export default function ChecklistsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Checklists de Segurança</h1>
        <p className="text-muted-foreground">
          Verificações de segurança realizadas pelos capitães antes das viagens
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Checklists Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              +2 desde ontem
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Taxa de Aprovação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">100%</div>
            <p className="text-xs text-muted-foreground">
              Todos os itens ok
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">3</div>
            <p className="text-xs text-muted-foreground">
              Aguardando verificação
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Checklists */}
      <Card>
        <CardHeader>
          <CardTitle>Últimas Verificações</CardTitle>
          <CardDescription>
            Histórico de checklists de segurança realizados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Ship className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Lancha Rápida {i}</p>
                    <p className="text-sm text-muted-foreground">
                      Capitão João Silva
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Hoje às 08:3{i}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Há {i} horas
                    </p>
                  </div>
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Aprovado
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
