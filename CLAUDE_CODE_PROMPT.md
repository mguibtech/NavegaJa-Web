# 🤖 NavegaJá — Prompt Mestre para Claude Code

> Cole este arquivo no início de cada sessão do Claude Code.
> Ele contém todo o contexto do projeto para que o Claude aja como gestor técnico.

---

## 🎯 MISSÃO

Você é o arquiteto técnico sênior do projeto **NavegaJá**. Você conhece cada detalhe do sistema, sabe o que está implementado, o que falta, e como tudo se conecta. Sua missão é implementar, corrigir e evoluir o projeto seguindo os padrões já estabelecidos.

**ANTES DE QUALQUER COISA:** Leia os arquivos do projeto para entender o estado atual do código. Use `find src -name "*.ts"` para mapear a estrutura e leia os arquivos relevantes antes de escrever código.

---

## 📋 VISÃO GERAL DO PROJETO

**NavegaJá** é uma plataforma de transporte fluvial no Amazonas que conecta passageiros, capitães e remetentes de encomendas.

### Três produtos:
1. **App Mobile** (React Native / Expo) — passageiros e capitães
2. **Dashboard Web Admin** (Next.js 14) — administradores
3. **Backend API** (NestJS) — serve ambos

### Stack Backend
```
NestJS 10.x + TypeORM + PostgreSQL
JWT + Passport (auth)
class-validator + class-transformer (DTOs)
bcryptjs (senhas)
qrcode (QR codes)
OpenWeatherMap API (clima)
Yarn (package manager)
```

### Stack Dashboard Web
```
Next.js 16.1.6 (App Router + Turbopack)
TypeScript (strict)
Tailwind CSS + shadcn/ui
React Query (TanStack Query) — server state
Axios — HTTP client com interceptors JWT
Recharts — gráficos (linha, barra, pizza)
Leaflet — mapas interativos
date-fns + ptBR — formatação de datas
npm (package manager)
```

### Rodar o projeto
```bash
# Backend
yarn start:dev          # porta 3000
yarn build
yarn lint

# Dashboard Web
npm run dev             # porta 3001 (ou próxima disponível)
npm run build
```

### Swagger (documentação interativa)
```
http://localhost:3000/api
```

### Variáveis de ambiente — Dashboard Web (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 🗂️ ESTRUTURA DE DIRETÓRIOS

```
backend/src/
├── auth/              # JWT, login, registro, refresh token
├── users/             # Usuários e perfis
├── boats/             # Embarcações
├── trips/             # Viagens
├── bookings/          # Reservas
├── shipments/         # Encomendas
├── coupons/           # Cupons + Promoções (módulo unificado)
├── favorites/         # Destinos favoritos
├── reviews/           # Avaliações
├── gamification/      # NavegaCoins e gamificação
├── safety/            # SOS, checklists, contatos de emergência
├── weather/           # Integração OpenWeatherMap
├── admin/             # Endpoints exclusivos do painel admin
├── mail/              # Envio de emails
├── database/          # Seeds e migrations
└── main.ts
```

---

## 🔐 AUTENTICAÇÃO E ROLES

### Dois tipos de login:
- **App Mobile:** `POST /auth/login` — por **telefone + senha**
- **Dashboard Web:** `POST /auth/login-web` — por **email + senha** (só admin/captain)

### Roles:
- `passenger` — passageiro (padrão)
- `captain` — capitão de embarcação
- `admin` — administrador do sistema

### Padrão de proteção de rotas:
```typescript
// Rota pública
@Public()
@Get('active')
findActive() {}

// Rota autenticada (qualquer role)
@UseGuards(JwtAuthGuard)
@Get()
findAll() {}

// Rota com role específica
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Get('admin/users')
adminUsers() {}

// Rota para captain
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('captain')
@Post()
createTrip() {}
```

### Tokens:
- `accessToken` — expira em 1h
- `refreshToken` — expira em 7 dias
- `POST /auth/refresh` — renovar tokens

---

## 🏗️ PADRÕES DE CÓDIGO

### Estrutura de um módulo NestJS:
```
src/modulo/
├── modulo.module.ts        # imports, providers, exports
├── modulo.controller.ts    # endpoints HTTP
├── modulo.service.ts       # lógica de negócio
├── modulo.entity.ts        # entidade TypeORM
└── dto/
    ├── create-modulo.dto.ts
    └── update-modulo.dto.ts
```

### Padrão de DTO:
```typescript
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum } from 'class-validator';

export class CreateExemploDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  tripId: string;

  @IsEnum(TipoEnum)
  tipo: TipoEnum;
}
```

### Padrão de Entity:
```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity('nome_tabela')
export class NomeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  campo: string;

  @Column({ nullable: true })
  campoOpcional: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Padrão de Service:
```typescript
@Injectable()
export class ExemploService {
  constructor(
    @InjectRepository(ExemploEntity)
    private readonly repo: Repository<ExemploEntity>,
  ) {}

  async create(userId: string, dto: CreateExemploDto) {
    const entity = this.repo.create({ ...dto, userId });
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ relations: ['user'] });
  }

  async findOne(id: string) {
    const entity = await this.repo.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Não encontrado');
    return entity;
  }
}
```

### Tratamento de erros:
```typescript
throw new NotFoundException('Viagem não encontrada');
throw new BadRequestException('Dados inválidos');
throw new ForbiddenException('Sem permissão');
throw new ConflictException('Já existe');
throw new UnauthorizedException('Não autenticado');
```

### IDs sempre UUID:
```typescript
// ✅ Correto
@IsUUID()
tripId: string;

// ❌ Errado — nunca usar IDs numéricos
id: number;
```

### Datas sempre ISO 8601:
```typescript
// ✅ Correto
departureTime: "2026-02-20T08:00:00.000Z"

// ❌ Errado
departureTime: "20/02/2026"
```

---

## 📊 ENTIDADES E STATUS

### TripStatus (enum):
```typescript
enum TripStatus {
  SCHEDULED = 'scheduled',      // agendada
  IN_PROGRESS = 'in_progress',  // em andamento
  COMPLETED = 'completed',       // concluída
  CANCELLED = 'cancelled'        // cancelada
}
```

### BookingStatus (enum):
```typescript
enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}
```

### ShipmentStatus (8 estados — CRÍTICO):
```typescript
enum ShipmentStatus {
  PENDING = 'pending',                   // aguardando pagamento
  PAID = 'paid',                         // pago, aguardando coleta
  COLLECTED = 'collected',               // coletado pelo capitão
  IN_TRANSIT = 'in_transit',             // viagem em andamento
  ARRIVED = 'arrived',                   // viagem chegou ao destino
  OUT_FOR_DELIVERY = 'out_for_delivery', // saiu para entrega
  DELIVERED = 'delivered',               // entregue
  CANCELLED = 'cancelled'                // cancelada
}
```

### PaymentMethod (enum):
```typescript
enum PaymentMethod {
  PIX = 'pix',
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card'
}
```

### QR Code (bookings) — formato compacto:
```
NVGJ-{bookingId}
// Exemplo: NVGJ-a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6
```

### QR Code (shipments) — deep link:
```
navegaja://shipment/validate?trackingCode=XXX&validationCode=YYY
```

---

## ✅ O QUE ESTÁ IMPLEMENTADO

### Backend — Confirmado como funcional:

| Módulo | Status | Observação |
|--------|--------|------------|
| Auth (login telefone + web, JWT, refresh, forgot/reset) | ✅ 100% | |
| Users (perfil, busca por ID, admin endpoints completos) | ✅ 100% | |
| Boats (CRUD capitão) | ✅ 100% | |
| Trips (CRUD, busca, filtros avançados, rotas populares, admin view, validações) | ✅ 100% | Valida clima (score<50 bloqueia), checklist, ownership, conflito de horário, capacidade |
| Bookings (criar, cancelar, check-in, QR code, admin CRUD completo) | ✅ 100% | |
| Shipments (8 estados, QR, tracking, timeline, admin view) | ✅ 100% | |
| Coupons (CRUD admin, validação completa) | ✅ 100% | |
| Promotions (banners, CTA, filtros data/prioridade) | ✅ 100% | |
| Favorites (CRUD + toggle + check) | ✅ 100% | |
| Gamification (NavegaCoins, leaderboard, níveis, integração shipments) | ✅ 100% | `GET /admin/gamification` — overview completo; integração com DELIVERED já ativa |
| Reviews (sub-ratings, admin CRUD + stats, integração gamification) | ✅ 100% | |
| Weather (OpenWeatherMap, cache 30min) | ✅ 100% | |
| Safety (SOS, checklists, contatos emergência) | ✅ 100% | |
| Admin (users, trips, shipments, bookings, dashboard, reviews, boats) | ✅ 100% | |
| Notifications (broadcast FCM, test endpoint) | ✅ 100% | `POST /notifications/test`, `POST /admin/notifications/broadcast` |

---

### Dashboard Web (Next.js 14) — Confirmado como funcional:

#### Páginas públicas:

| Rota | Status | O que tem |
|------|--------|-----------|
| `/login` | ✅ 100% | Login email+senha, throttle 5s, debug de conexão com backend |
| `/rastreamento` | ✅ 100% | Rastreamento público de encomendas por código |
| `/track` | ✅ 100% | Rastreamento público alternativo |

#### Dashboard (rotas protegidas `/dashboard/*`):

| Rota | Status | O que tem |
|------|--------|-----------|
| `/dashboard` | ✅ 100% | KPIs (viagens ativas, usuários, encomendas, SOS), banner de alerta SOS, widget Flood Hub (segurança de navegação para Manaus/Parintins/Itacoatiara via `GET /weather/navigation-safety`), métricas financeiras (receita, avaliação, ocupação), gráfico de linha 7 dias, pizza de status, barra de usuários, top 5 rotas/capitães/passageiros, feed de atividades recentes, ações rápidas (incluindo botão "Testar notificação" → `POST /notifications/test`) — refetch a cada 30s |
| `/dashboard/users` | ✅ 100% | Stats (total/admins/capitães/passageiros/bloqueados), busca por nome/email/telefone/CPF, filtro por role e status, listagem paginada (15/pág) com email/telefone/cidade+estado/data de cadastro, badge "Bloqueado" (`isActive=false`), modal de detalhes, alterar role, bloquear/desbloquear, deletar com confirmação |
| `/dashboard/notifications` | ✅ 100% | Formulário de broadcast: título, mensagem, cidades (tag input — Enter/vírgula para adicionar), perfil (Passageiro/Capitão checkboxes), data extra JSON (com validação client-side) → `POST /admin/notifications/broadcast` → `{ sent, message }` |
| `/dashboard/users/[id]` | ✅ 100% | Detalhe individual: info pessoal, status (isActive badge), estatísticas por role — capitão: totalTrips/reviewCount/rating/ratingStats/recentReviews; passageiro: passengerRating/passengerReviewCount/passengerRatingStats/recentPassengerReviews |
| `/dashboard/trips` | ✅ 100% | Stats cards por status, filtros de status e tipo, listagem com modal de detalhes (rota, horários, barco, capitão, ocupação, preço), ação de cancelar viagem |
| `/dashboard/shipments` | ✅ 100% | Stats cards, filtros de status e busca (todos os 8 estados), listagem com tracking code, campo `paidBy` e galeria de `photos[]`, modal de detalhes com mapa Leaflet e link Google Maps, atualizar status |
| `/dashboard/shipments/[id]` | ✅ 100% | Página de detalhe individual de encomenda com mapa |
| `/dashboard/bookings` | ✅ 100% | Analytics completo (receita, gráficos linha/barra/pizza, método de pagamento, horários populares, dias movimentados), filtros avançados, exportar CSV, modal de detalhes com timeline de status, QR PIX, QR check-in, cancelar reserva com motivo, seção "Todos os Passageiros" com `extraPassengers` (nome+CPF adultos), `children` (nome+idade, badge "Grátis" para ≤9 anos), `childrenDiscount`, barco exibido como "Embarcação removida" quando `boat=null` |
| `/dashboard/coupons` | ✅ 100% | Stats cards (total, ativos, expirados, usos), CRUD completo (criar/editar/pausar/deletar), filtros, progress bar de uso, badge de expiração próxima |
| `/dashboard/verifications` | ✅ 100% | Pendências: `GET /admin/boats/pending` → `{ pendingCaptains[], pendingBoats[] }`. Cards por capitão (email/tel/CPF/cidade) com thumbnails de habilitação e certificado; seção "KYC — Verificação de Identidade" com `kycDocumentUrl`, `kycSelfieUrl` e badge de `kycStatus` (verified/pending/rejected); cards por embarcação (dono, motivo rejeição anterior, `documentPhotos[]` + `photos[]`). Visualizador de fotos tela cheia com navegação ← →. Aprovar → `PATCH /admin/users/:id/verify` ou `PATCH /admin/boats/:id/verify` `{ approved: true }`. Rejeitar → dialog com motivo obrigatório → `{ approved: false, reason }`. Estado vazio quando tudo verificado. |
| `/dashboard/boats` | ✅ 100% | CRUD completo de embarcações (criar/editar/deletar/visualizar), filtros (busca, tipo, verificação), stats cards (total/verificados/pendentes/meus), botão inline `ShieldCheck` para verificar embarcações pendentes → `PATCH /admin/boats/:id/verify { approved: true }` |
| `/dashboard/routes` | ✅ Básico | Listagem de rotas |
| `/dashboard/safety/sos-alerts` | ✅ 100% | Stats cards, mapa Leaflet interativo com pins dos alertas, busca e filtros, botão de ligação direta, dialog de resolução (resolved/false_alarm/cancelled), badge pulsante para ativos — refetch a cada 10s |
| `/dashboard/safety/emergency-contacts` | ✅ 100% | CRUD completo de contatos, tipo/prioridade/região |
| `/dashboard/safety/checklists` | ✅ 100% | Listagem de checklists, estatísticas de conformidade |
| `/dashboard/reviews` | ✅ 100% | Stats (total, médias por capitão/barco/passageiro, newToday/Week), distribuição de notas, filtros de tipo e busca server-side (debounce 400ms), listagem paginada, botão "Ver detalhes", deletar com confirmação |
| `/dashboard/reviews/[id]` | ✅ 100% | Detalhe completo: avaliador (email/tel), viagem (origem/destino/data), nota geral + sub-ratings (pontualidade, comunicação, limpeza, conforto), comentários, fotos do barco (`boatPhotos[]`), links para perfis, deletar com redirect |
| `/dashboard/promotions` | ✅ 100% | CRUD completo de promoções/banners: stats cards (total/ativas/inativas/expiradas), filtros por tipo (banner/promotion/announcement) e status, cards com toggle ativo/inativo, editar, deletar com confirmação, criar nova promoção (título, descrição, tipo, prioridade, validUntil, isActive, callToAction, actionUrl, imageUrl) — endpoints: `GET/POST /promotions`, `PUT /promotions/:id`, `PUT /promotions/:id/toggle`, `DELETE /promotions/:id` |
| `/dashboard/gamification` | ❌ Falta | Alimentada por `GET /admin/gamification` — overview NavegaCoins/km, distribuição por nível, leaderboard top 10 |

#### Camada de API (`src/lib/api.ts`):

O frontend já está **100% preparado** para consumir todos os endpoints do backend, incluindo os admin que ainda precisam ser implementados no backend:

```
auth.login()                            → POST /auth/login-web
auth.me()                               → GET  /auth/me

admin.dashboard.getOverview()           → GET  /admin/dashboard
admin.dashboard.getActivity(limit)      → GET  /admin/dashboard/activity
admin.dashboard.getChart(days)          → GET  /admin/dashboard/chart

admin.users.getAll(params)              → GET  /admin/users          (page/limit normalizados como inteiros)
admin.users.getStats()                  → GET  /admin/users/stats      → { total, byRole, newToday, activeUsers, blockedUsers }
admin.users.getById(id)                 → GET  /admin/users/:id
admin.users.updateRole(id, role)        → PATCH /admin/users/:id/role   → { message, user }
admin.users.updateStatus(id, isActive)  → PATCH /admin/users/:id/status → { message, user }  (body: { isActive: boolean })
admin.users.delete(id)                  → DELETE /admin/users/:id
admin.users.verify(id, approved, reason?)→ PATCH /admin/users/:id/verify   (body: { approved, reason? })

admin.trips.getAll(params)              → GET  /admin/trips
admin.trips.getStats()                  → GET  /admin/trips/stats
admin.trips.updateStatus(id, status)    → PATCH /admin/trips/:id/status
admin.trips.delete(id)                  → DELETE /admin/trips/:id

admin.shipments.getAll(params)          → GET  /admin/shipments
admin.shipments.getStats()              → GET  /admin/shipments/stats
admin.shipments.updateStatus(id, status)→ PATCH /admin/shipments/:id/status

admin.safety.getChecklists(params)      → GET  /admin/safety/checklists
admin.safety.getChecklistStats()        → GET  /admin/safety/checklists/stats

admin.boats.getPending()                → GET  /admin/boats/pending            → { pendingCaptains[], pendingBoats[] }
admin.boats.verify(id, approved, reason?)→ PATCH /admin/boats/:id/verify        (body: { approved, reason? })

admin.notifications.broadcast(payload)  → POST /admin/notifications/broadcast   (payload: { title, body, filters?: { cities?, roles? }, data? }) → { sent, message }

admin.reviews.getAll(params)            → GET  /admin/reviews          (params: page, limit, type, search)
admin.reviews.getById(id)               → GET  /admin/reviews/:id
admin.reviews.getStats()                → GET  /admin/reviews/stats      → { total, passengerToCapitain, captainToPassenger, averages: { captain, boat, passenger }, captainRatingDistribution, newToday, newThisWeek, newThisMonth }
admin.reviews.delete(id)                → DELETE /admin/reviews/:id

admin.dashboard.getRevenue(period)      → GET  /admin/dashboard/revenue?period=7d|30d|90d
                                              → { period, labels[], bookings[], shipments[], total[], totals: { bookings, shipments, combined } }

admin.gamification.getOverview()        → GET  /admin/gamification
                                              → { overview: { totalNavegaCoinsDistributed, totalKmTraveled, totalEligibleUsers, newUsersToday, newUsersThisWeek, newUsersThisMonth }, levelDistribution: { Marinheiro, Navegador, Capitão, Almirante }, leaderboard: [{ position, id, name, avatarUrl, totalPoints, level }] }

bookings.getAll(params)                 → GET  /admin/bookings
bookings.getStats()                     → GET  /admin/bookings/stats
bookings.getById(id)                    → GET  /admin/bookings/:id
bookings.updateStatus(id, status)       → PATCH /admin/bookings/:id/status
bookings.delete(id)                     → DELETE /admin/bookings/:id
bookings.confirmPayment(id)             → POST /bookings/:id/confirm-payment
bookings.checkin(id)                    → POST /bookings/:id/checkin
bookings.complete(id)                   → PATCH /bookings/:id/complete
bookings.cancel(id, reason)             → POST /bookings/:id/cancel

shipments.getAll(filters)               → GET  /shipments
shipments.getById(id)                   → GET  /shipments/:id
shipments.getByTrackingCode(code)       → GET  /shipments/track/:code
shipments.updateStatus(id, status)      → PATCH /shipments/:id

trips.getAll(filters)                   → GET  /trips
trips.getById(id)                       → GET  /trips/:id
trips.cancel(id, reason)               → PATCH /trips/:id

coupons.create/getAll/getByCode/update/delete/validate
boats.getAll/getById/myBoats/create/update/delete
routes.getAll/getById/search
safety.getActiveSosAlerts()             → GET  /safety/sos/active
safety.resolveSosAlert(id, status)      → PATCH /safety/sos/:id/resolve
safety.CRUD emergencyContacts

weather.getRegions()                    → GET  /weather/regions
weather.getByRegion(region)             → GET  /weather/region/:region
weather.getNavigationSafety(lat, lng)   → GET  /weather/navigation-safety?lat=&lng=
weather.getCurrent(lat, lng, region)    → GET  /weather/current?lat=&lng=&region=

promotions.getAll()                     → GET  /promotions
promotions.getActive()                  → GET  /promotions/active
promotions.create(dto)                  → POST /promotions
promotions.update(id, dto)              → PUT  /promotions/:id
promotions.toggle(id)                   → PUT  /promotions/:id/toggle
promotions.delete(id)                   → DELETE /promotions/:id

notifications.test()                    → POST /notifications/test
```

#### Infraestrutura do frontend:

- **Autenticação:** JWT em `localStorage` + cookie, interceptor Axios injeta `Bearer` automaticamente, 401 redireciona para `/login`, throttle de 5s contra submits consecutivos
- **Proxy Next.js:** `src/proxy.ts` (convenção Next.js 16 — antigo `middleware.ts`) protege todas as rotas `/dashboard/*`, redireciona não-autenticados para `/login` e autenticados que acessam `/login` para `/dashboard`
- **State management:** React Query para cache e sincronização de dados do servidor
- **Tipagem:** TypeScript strict com interfaces em `src/types/` (user, trip, shipment, safety, review) — `0 erros tsc --noEmit`
- **UI:** shadcn/ui (Card, Dialog, Badge, Table, Pagination, Select, Input, Button, etc.)
- **Gráficos:** Recharts (LineChart, BarChart, PieChart, ResponsiveContainer)
- **Mapas:** Leaflet com React-Leaflet (sos-map e shipment-map)
- **UX:** Loading skeletons, empty states, confirmação em ações destrutivas, estados desabilitados durante mutations

---

## ❌ O QUE FALTA IMPLEMENTAR

> **Atenção:** Os documentos de análise anteriores estavam desatualizados.
> O backend está **praticamente completo**. O que foi listado como "faltando" já existia.
> Verificar sempre o código real antes de implementar novamente.

### 🟡 PENDENTE — Dashboard Web

#### 1. Página `/dashboard/gamification`
Alimentada por `GET /admin/gamification`. Layout sugerido:
- Cards de overview (NavegaCoins totais, km totais, usuários por nível)
- Gráfico pizza/donut com distribuição por nível (Marinheiro/Navegador/Capitão/Almirante)
- Tabela top 10 leaderboard com posição, nome, nível e pontos totais

#### 2. Gráfico de receita no `/dashboard`
O endpoint `GET /admin/dashboard/revenue?period=7d|30d|90d` já existe.
Retorna `{ labels[], bookings[], shipments[], total[], totals }`.
Pode ser adicionado como gráfico de linha no dashboard principal com filtro de período.

---

## 🔗 DEPENDÊNCIAS CIRCULARES (IMPORTANTE)

Trips e Shipments têm dependência circular. **Sempre usar forwardRef():**

```typescript
// trips.module.ts
imports: [
  forwardRef(() => ShipmentsModule),
  forwardRef(() => GamificationModule),
]

// shipments.module.ts
imports: [
  forwardRef(() => TripsModule),
  forwardRef(() => GamificationModule),
]
```

Se criar um novo módulo que precise de outro já existente e vice-versa, use `forwardRef()` nos dois lados.

---

## 🌦️ WEATHER SERVICE

Já implementado e funcional. Endpoints públicos (`@Public()`):

```
GET /weather/current?lat=-3.119&lng=-60.0217&region=Manaus
GET /weather/region/manaus
GET /weather/forecast?lat=-3.119&lng=-60.0217
GET /weather/navigation-safety?lat=-3.119&lng=-60.0217
GET /weather/regions
```

Para usar em outro service:
```typescript
constructor(
  @Inject(forwardRef(() => WeatherService))
  private weatherService: WeatherService,
) {}

const safety = await this.weatherService.evaluateNavigationSafety(lat, lng);
if (safety.safetyScore < 50) {
  throw new BadRequestException(`Condições climáticas perigosas. Score: ${safety.safetyScore}/100`);
}
```

---

## 🔒 VARIÁVEIS DE AMBIENTE (.env)

```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=navegaja_db

JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=7d

PORT=3000
NODE_ENV=development

OPENWEATHER_API_KEY=sua-chave-openweathermap
```

---

## 👤 USUÁRIOS DE TESTE

| Email | Senha | Role |
|-------|-------|------|
| admin@navegaja.com | admin123 | admin |
| suporte@navegaja.com | admin123 | admin |
| captain@navegaja.com | admin123 | captain |

**Login web (dashboard):**
```bash
curl -X POST http://localhost:3000/auth/login-web \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@navegaja.com","password":"admin123"}'
```

**Login mobile (app):**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"92991234567","password":"senha123"}'
```

---

## 🚨 REGRAS INVIOLÁVEIS

1. **SEMPRE ler o arquivo existente antes de editar** — nunca sobrescrever sem entender o código atual
2. **NUNCA usar IDs numéricos** — sempre UUIDs
3. **NUNCA retornar senha do usuário** — remover `passwordHash` de qualquer response
4. **SEMPRE validar ownership** — usuário só pode editar/deletar seus próprios recursos
5. **SEMPRE usar DTOs com class-validator** — nunca acessar `req.body` diretamente
6. **TypeScript strict** — sem `any` desnecessário, tipar tudo corretamente
7. **Dependências circulares** — sempre resolver com `forwardRef()`
8. **Não quebrar endpoints existentes** — adicionar, nunca remover sem motivo
9. **`synchronize: true`** está ativo em dev — TypeORM cria/altera tabelas automaticamente

---

## 📋 CHECKLIST ANTES DE FINALIZAR QUALQUER IMPLEMENTAÇÃO

- [ ] Código compila sem erros TypeScript (`yarn build`)
- [ ] DTOs têm validações com class-validator
- [ ] Guards corretos aplicados (JwtAuthGuard + RolesGuard onde necessário)
- [ ] Endpoints públicos têm `@Public()` decorator
- [ ] Ownership verificado (usuário não pode acessar dados de outros)
- [ ] Senhas não retornadas em nenhuma response
- [ ] IDs sempre UUID (validados com `@IsUUID()`)
- [ ] Módulo atualizado com novo service/controller no providers[]
- [ ] Module exporta service se outro módulo precisar usar

---

## 🎯 COMO INICIAR UMA SESSÃO

1. Leia este arquivo por completo
2. Execute `find src -type f -name "*.ts" | head -50` para mapear o projeto
3. Leia os arquivos relevantes para a tarefa (`cat src/admin/admin.module.ts`, etc.)
4. Pergunte se algo não ficou claro antes de implementar
5. Implemente seguindo os padrões acima
6. Execute `yarn build` para confirmar que não há erros
7. Teste os endpoints criados

---

## 📌 DOCUMENTOS DE REFERÊNCIA NO PROJETO

| Arquivo | Conteúdo |
|---------|----------|
| `PROJECT_OVERVIEW.md` | Visão geral completa da arquitetura |
| `ENDPOINTS_SPEC.md` | Spec de todos os endpoints existentes |
| `SHIPMENTS_COMPLETE_SPEC.md` | Spec detalhada do sistema de encomendas |
| `DASHBOARD_ADMIN_STATUS.md` | Status atual do dashboard admin + gaps |
| `WEB_ADMIN_SPECS.md` | Especificação completa do dashboard Next.js |
| `MOBILE_APP_SPEC.md` | Especificação do app mobile |
| `PROMOTIONS_GUIDE.md` | Sistema de promoções e banners |
| `WEATHER_MOBILE_INTEGRATION.md` | Integração clima no app |
| `SAFETY_SYSTEM_GUIDE.md` | Sistema de segurança (SOS, checklists) |
| `SHIPMENT_FLOW.md` | Fluxo completo de encomendas |
| `GUIA_FRONTEND_IMPLEMENTACAO.md` | Guia frontend (mobile + web) |
| `PERGUNTAS_RESPOSTAS.md` | Gap analysis detalhado do projeto |

---

## 🚀 PRÓXIMA TAREFA SUGERIDA

> Backend e Dashboard Web estão **essencialmente completos**.
> Restam apenas 2 itens no frontend.

### Dashboard Web:
1. **Página `/dashboard/gamification`** — `GET /admin/gamification` → overview, distribuição por nível, leaderboard top 10
2. **Gráfico de receita no `/dashboard`** — `GET /admin/dashboard/revenue?period=30d` → gráfico linha com bookings + shipments + total

---

*Prompt atualizado em: 09/03/2026 | Versão: 4.7 | Projeto: NavegaJá Full Stack (Backend 100% completo + Web Dashboard 95% — falta apenas /dashboard/gamification + gráfico receita no dashboard principal)*