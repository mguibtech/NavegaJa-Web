# NavegaJá Admin - Painel Administrativo

Sistema web de gestão administrativa para o NavegaJá, plataforma de transporte fluvial.

## 🚀 Tecnologias

- **Next.js 16** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes de UI
- **React Query** - Gerenciamento de estado servidor
- **Axios** - Cliente HTTP
- **Leaflet** - Mapas (em integração)
- **Recharts** - Gráficos e visualizações

## 📁 Estrutura do Projeto

```
navegaja-web/
├── src/
│   ├── app/                      # Páginas (App Router)
│   │   ├── dashboard/           # Painel administrativo
│   │   │   ├── safety/          # Módulo de segurança
│   │   │   │   ├── sos-alerts/  # Alertas SOS
│   │   │   │   ├── emergency-contacts/
│   │   │   │   └── checklists/
│   │   │   └── page.tsx         # Dashboard home
│   │   ├── login/               # Autenticação
│   │   └── layout.tsx           # Layout raiz
│   ├── components/
│   │   ├── layout/              # Componentes de layout
│   │   │   ├── sidebar.tsx      # Menu lateral
│   │   │   ├── header.tsx       # Cabeçalho
│   │   │   └── providers.tsx    # React Query Provider
│   │   └── ui/                  # Componentes Shadcn
│   ├── lib/
│   │   ├── api.ts               # Cliente API e endpoints
│   │   └── utils.ts             # Utilitários
│   └── types/
│       └── safety.ts            # Tipos TypeScript
├── middleware.ts                # Proteção de rotas
└── .env.local                   # Variáveis de ambiente
```

## 🔧 Instalação

```bash
# Instalar dependências
yarn install

# Configurar variáveis de ambiente
# Editar .env.local com a URL da API
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 🏃 Executar

```bash
# Desenvolvimento
yarn dev

# Build de produção
yarn build

# Iniciar produção
yarn start
```

O aplicativo estará disponível em [http://localhost:3000](http://localhost:3000)

## 🔐 Autenticação

O sistema utiliza JWT para autenticação. Ao fazer login:

1. O token é armazenado no localStorage
2. Todas as requisições incluem o token no header Authorization
3. O middleware protege as rotas do dashboard
4. Logout limpa o localStorage e redireciona para /login

## 📱 Funcionalidades

### Dashboard Principal
- Visão geral de estatísticas
- Viagens ativas, reservas, encomendas
- Alertas SOS em destaque

### Módulo de Segurança

#### Alertas SOS
- Visualização em tempo real de alertas de emergência
- Mapa com localização dos alertas
- Informações detalhadas (usuário, tipo, localização, hora)
- Sistema de resolução de alertas
- Botão de chamada direta
- Atualização automática a cada 10 segundos

#### Contatos de Emergência
- Listagem de serviços públicos:
  - Marinha
  - Bombeiros
  - Polícia
  - SAMU
  - Defesa Civil
  - Capitania dos Portos
- Botão de chamada direta
- Organização por prioridade

#### Checklists de Segurança
- Monitoramento de verificações pré-viagem
- Histórico de checklists
- Estatísticas de aprovação

## 🔌 Integração com API

O arquivo `src/lib/api.ts` centraliza todas as chamadas à API:

```typescript
// Autenticação
auth.login(phone, password)
auth.me()

// Segurança
safety.getEmergencyContacts()
safety.getActiveSosAlerts()
safety.resolveSosAlert(id, status, notes)

// Estatísticas
stats.getDashboardStats()
```

## 🎨 Temas e Estilos

O projeto utiliza Tailwind CSS com variáveis CSS para temas. Para personalizar cores:

1. Editar `src/app/globals.css`
2. Modificar variáveis CSS:
   - `--primary`
   - `--secondary`
   - `--accent`
   - `--muted`
   - etc.

## 📝 Próximos Passos

- [ ] Integrar mapa Leaflet na página de SOS Alerts
- [ ] Adicionar páginas de gestão:
  - [ ] Usuários
  - [ ] Viagens
  - [ ] Reservas
  - [ ] Encomendas
  - [ ] Cupons
- [ ] Implementar sistema de notificações em tempo real
- [ ] Adicionar gráficos e dashboards analíticos
- [ ] Implementar filtros e busca avançada
- [ ] Adicionar exportação de relatórios
- [ ] Sistema de permissões por role
- [ ] Logs de auditoria

## 🤝 Backend

Este projeto se conecta ao backend NestJS localizado em `../backend`.

Certifique-se de que o backend está rodando em `http://localhost:3000` ou configure a URL em `.env.local`.

## 📞 Suporte

Para dúvidas ou problemas, contate a equipe de desenvolvimento NavegaJá.

---

**© 2026 NavegaJá - Plataforma de Transporte Fluvial**
