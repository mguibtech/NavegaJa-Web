'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bell, Send, X, Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { admin } from '@/lib/api';

export default function NotificationsPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [dataJson, setDataJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [result, setResult] = useState<{ sent: number; message: string } | null>(null);

  const broadcastMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => admin.notifications.broadcast(payload),
    onSuccess: (data: { sent: number; message: string }) => {
      setResult(data);
      setTitle('');
      setBody('');
      setCities([]);
      setRoles([]);
      setDataJson('');
    },
  });

  const addCity = () => {
    const city = cityInput.trim();
    if (city && !cities.includes(city)) {
      setCities(prev => [...prev, city]);
      setCityInput('');
    }
  };

  const removeCity = (city: string) => setCities(prev => prev.filter(c => c !== city));

  const toggleRole = (role: string) =>
    setRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);

  const handleSubmit = () => {
    if (dataJson.trim()) {
      try {
        JSON.parse(dataJson);
        setJsonError('');
      } catch {
        setJsonError('JSON inválido — verifique a sintaxe');
        return;
      }
    }

    const payload: Record<string, unknown> = { title, body };
    const filters: Record<string, string[]> = {};
    if (cities.length > 0) filters.cities = cities;
    if (roles.length > 0) filters.roles = roles;
    if (Object.keys(filters).length > 0) payload.filters = filters;
    if (dataJson.trim()) payload.data = JSON.parse(dataJson);

    broadcastMutation.mutate(payload);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Notificações</h1>
        <p className="text-muted-foreground">
          Envie notificações push para os usuários do app NavegaJá
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Enviar Notificação
          </CardTitle>
          <CardDescription>
            Envie para todos os dispositivos registrados ou segmente por cidade e perfil.
            Campos de segmentação vazios = envio para todos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="notif-title">Título *</Label>
            <Input
              id="notif-title"
              placeholder="Ex: 🎉 Promoção especial!"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="notif-body">Mensagem *</Label>
            <Textarea
              id="notif-body"
              placeholder="Ex: Aproveite 20% OFF em todas as viagens este fim de semana!"
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={3}
            />
          </div>

          {/* Cidades */}
          <div className="space-y-2">
            <Label>Cidades <span className="text-muted-foreground font-normal">(opcional — vazio = todos)</span></Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Manaus"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addCity();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addCity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {cities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cities.map(city => (
                  <Badge key={city} variant="secondary" className="gap-1 pl-2.5">
                    {city}
                    <button
                      onClick={() => removeCity(city)}
                      className="ml-0.5 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Perfil */}
          <div className="space-y-2">
            <Label>Perfil <span className="text-muted-foreground font-normal">(opcional — vazio = todos)</span></Label>
            <div className="flex gap-6">
              {[
                { id: 'passenger', label: 'Passageiro' },
                { id: 'captain', label: 'Capitão' },
              ].map(({ id, label }) => (
                <label key={id} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={roles.includes(id)}
                    onChange={() => toggleRole(id)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Data extra JSON */}
          <div className="space-y-2">
            <Label htmlFor="notif-data">
              Data extra JSON <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="notif-data"
              placeholder={'{\n  "type": "coupon",\n  "couponCode": "PARINTINS20"\n}'}
              value={dataJson}
              onChange={e => { setDataJson(e.target.value); setJsonError(''); }}
              rows={4}
              className="font-mono text-sm"
            />
            {jsonError && (
              <p className="text-xs text-destructive">{jsonError}</p>
            )}
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!title.trim() || !body.trim() || broadcastMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            {broadcastMutation.isPending ? 'Enviando...' : 'Enviar notificação'}
          </Button>

          {/* Resultado de sucesso */}
          {result && (
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 space-y-1">
              <p className="text-sm font-semibold text-green-800">✓ {result.message}</p>
              <p className="text-sm text-green-700">
                Enviado para <span className="font-bold">{result.sent}</span> dispositivo{result.sent !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Erro */}
          {broadcastMutation.isError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">
                Erro ao enviar notificação. Verifique a conexão com o backend.
              </p>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
