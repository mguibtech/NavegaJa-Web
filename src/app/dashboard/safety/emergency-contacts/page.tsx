'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { Phone, MapPin, Star, AlertCircle, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { safety } from '@/lib/api';
import { EmergencyContact } from '@/types/safety';

export default function EmergencyContactsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // 3x3 grid

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['emergency-contacts'],
    queryFn: safety.getEmergencyContacts,
  });

  // Extrair tipos e regiões únicos
  const uniqueTypes = Array.from(new Set(contacts.map((c: EmergencyContact) => c.type)));
  const uniqueRegions = Array.from(new Set(contacts.map((c: EmergencyContact) => c.region).filter(Boolean)));

  // Filtrar contatos
  const filteredContacts = useMemo(() => {
    return contacts.filter((contact: EmergencyContact) => {
      const matchesSearch = !searchTerm ||
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phoneNumber.includes(searchTerm) ||
        contact.description?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'all' || contact.type === typeFilter;
      const matchesRegion = regionFilter === 'all' || contact.region === regionFilter;

      return matchesSearch && matchesType && matchesRegion;
    });
  }, [contacts, searchTerm, typeFilter, regionFilter]);

  // Ordenar e paginar
  const sortedContacts = [...filteredContacts].sort((a, b) => a.priority - b.priority);
  const totalPages = Math.ceil(sortedContacts.length / itemsPerPage);
  const paginatedContacts = sortedContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset para página 1 quando filtros mudam
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, regionFilter]);

  return (
    <div className="space-y-8">
      {/* Header com gradiente sutil */}
      <div className="rounded-lg bg-linear-to-br from-primary/5 via-primary-mid/5 to-primary-light/5 p-6 border border-primary/10">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Contatos de Emergência
            </h1>
            <p className="mt-1 text-base text-foreground/70">
              Números de telefone de serviços públicos e de emergência
            </p>
          </div>
        </div>
      </div>

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
                  placeholder="Nome, telefone, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Serviço</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  {uniqueTypes.map((type) => (
                    <SelectItem key={type as string} value={type as string}>{type as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="region">Região</Label>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger id="region">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Regiões</SelectItem>
                  {uniqueRegions.map((region) => (
                    <SelectItem key={region as string} value={region as string}>{region as string}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {sortedContacts.length > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {sortedContacts.length} contato(s) encontrado(s)
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Carregando contatos...</p>
          </div>
        </div>
      ) : sortedContacts.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-base font-medium text-muted-foreground">
              {contacts.length === 0 ? 'Nenhum contato registrado' : 'Nenhum resultado encontrado'}
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {contacts.length === 0
                ? 'Quando houver contatos, eles aparecerão aqui'
                : 'Tente ajustar os filtros de busca'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {paginatedContacts.map((contact: EmergencyContact) => {
            const isPriority = contact.priority <= 2;

            return (
              <Card
                key={contact.id}
                className={`
                  relative overflow-hidden transition-all duration-300 hover:shadow-lg
                  ${isPriority
                    ? 'border-l-4 border-l-accent shadow-md bg-linear-to-br from-white via-white to-accent/5'
                    : 'border-l-4 border-l-primary/30 hover:border-l-primary/50'
                  }
                `}
              >
                {isPriority && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 backdrop-blur-sm">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    <span className="text-xs font-semibold text-accent">Prioritário</span>
                  </div>
                )}

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between pr-20">
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-bold text-foreground leading-tight">
                        {contact.name}
                      </CardTitle>
                      <Badge
                        className={`
                          ${isPriority
                            ? 'bg-accent/15 text-accent-foreground border-accent/30 hover:bg-accent/25'
                            : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15'
                          }
                        `}
                      >
                        {contact.type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {contact.description && (
                    <p className="text-sm leading-relaxed text-foreground/70">
                      {contact.description}
                    </p>
                  )}

                  <div className="space-y-3 rounded-lg bg-muted/30 p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="rounded-full bg-primary/10 p-1.5">
                        <Phone className="h-4 w-4 text-primary" />
                      </div>
                      <a
                        href={`tel:${contact.phoneNumber}`}
                        className="font-mono text-base font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {contact.phoneNumber}
                      </a>
                    </div>

                    {contact.region && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="rounded-full bg-secondary/10 p-1.5">
                          <MapPin className="h-4 w-4 text-secondary" />
                        </div>
                        <span className="text-foreground/60 font-medium">{contact.region}</span>
                      </div>
                    )}
                  </div>

                  <Button
                    asChild
                    className={`
                      w-full font-semibold transition-all duration-200 shadow-sm
                      ${isPriority
                        ? 'bg-accent hover:bg-accent/90 text-white hover:shadow-md'
                        : 'bg-primary hover:bg-primary-mid text-white hover:shadow-md'
                      }
                    `}
                  >
                    <a href={`tel:${contact.phoneNumber}`}>
                      <Phone className="mr-2 h-4 w-4" />
                      Ligar Agora
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  itemsPerPage={itemsPerPage}
                  totalItems={sortedContacts.length}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
