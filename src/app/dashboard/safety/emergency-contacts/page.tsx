'use client';

import { useQuery } from '@tanstack/react-query';
import { Phone, MapPin, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safety } from '@/lib/api';
import { EmergencyContact } from '@/types/safety';

export default function EmergencyContactsPage() {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: safety.getEmergencyContacts,
  });

  const sortedContacts = [...contacts].sort((a, b) => a.priority - b.priority);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contatos de Emergência</h1>
        <p className="text-muted-foreground">
          Números de telefone de serviços públicos e de emergência
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Carregando...</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedContacts.map((contact: EmergencyContact) => (
            <Card key={contact.id} className="relative overflow-hidden">
              {contact.priority <= 2 && (
                <div className="absolute right-0 top-0 rounded-bl-lg bg-yellow-100 px-2 py-1">
                  <Star className="h-4 w-4 fill-yellow-600 text-yellow-600" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {contact.type}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.description && (
                  <p className="text-sm text-muted-foreground">
                    {contact.description}
                  </p>
                )}

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`tel:${contact.phoneNumber}`}
                      className="font-mono font-semibold hover:underline"
                    >
                      {contact.phoneNumber}
                    </a>
                  </div>

                  {contact.region && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{contact.region}</span>
                    </div>
                  )}
                </div>

                <Button
                  asChild
                  className="w-full"
                  variant={contact.priority <= 2 ? 'default' : 'outline'}
                >
                  <a href={`tel:${contact.phoneNumber}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Ligar Agora
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
