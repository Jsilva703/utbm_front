# RacePulse Frontend

Frontend MVP em Next.js para acompanhamento público de atletas e teste experimental de tracking via iPhone/PWA.

## Objetivo

Este projeto entrega a interface visual do RacePulse:

- home com código do atleta;
- acompanhamento público com mapa, progresso e última atualização;
- detalhes e histórico paginado;
- tela interna `/test-tracking` para teste de GPS no iPhone;
- área administrativa em `/admin`;
- PWA adicionável à Home Screen.

O backend Rails fica separado e não é alterado por este projeto.

## Área administrativa

Rotas:

- `/admin/login`
- `/admin`
- `/admin/athletes`
- `/admin/races`
- `/admin/tracking-sessions`

O fluxo admin usa BFF no Next.js:

```text
Browser -> /api/admin/* no Next.js -> /api/v1/admin/* no Rails
```

O browser não chama os endpoints administrativos do Rails diretamente.

No login, o Rails devolve o cookie de sessão administrativa. O Next.js captura apenas o
valor opaco desse cookie e cria um cookie first-party:

```text
utmb_trail_admin_session
```

Esse cookie é `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção. Nas próximas
requisições, o BFF reconstrói o header para o Rails como:

```text
Cookie: _utmb_trail_admin_session=<valor opaco>
```

Não usar `localStorage` ou `sessionStorage` para autenticação admin.

## Arquitetura

```text
                 RacePulse

            ┌───────────────────┐
            │      iPhone       │
            │   PWA Tracking    │
            └─────────┬─────────┘
                      │ GPS
                      ▼
            ┌───────────────────┐
            │ Next.js / Vercel  │
            │ server proxy      │
            └─────────┬─────────┘
                      │ ingest_token
                      ▼
            ┌───────────────────┐
            │ Rails API Render  │
            └─────────┬─────────┘
                      │
                      ▼
                 PostgreSQL

Família / amigo
       │
       ▼
Next.js / Vercel
       │
       ▼
public_token server-side
       │
       ▼
Rails Public Tracking API
```

## Stack

- Next.js App Router
- TypeScript
- React
- Leaflet + OpenStreetMap
- CSS customizado mobile-first
- Vitest

## Instalação

```bash
npm install
```

## Rodar local

```bash
npm run dev
```

O frontend sobe em `http://localhost:3000`.

## Variáveis de ambiente

Crie `.env.local` a partir de `.env.example`.

```text
NEXT_PUBLIC_API_BASE_URL=
TEST_TRACKING_SESSION_ID=
RAILS_INGEST_TOKEN=
ATHLETE_SESSION_SECRET=
```

Exemplo de uso:

```text
NEXT_PUBLIC_API_BASE_URL=https://utmb-trail.onrender.com
TEST_TRACKING_SESSION_ID=<id da TrackingSession de teste>
RAILS_INGEST_TOKEN=<ingest_token da TrackingSession de teste>
ATHLETE_SESSION_SECRET=<segredo longo para selar o cookie do atleta no Next>
```

Não commitar `.env.local`.

## Integração com Rails

Endpoints usados:

- `GET /health`
- `GET /api/v1/public/tracking/:public_token`
- `GET /api/v1/public/tracking/:public_token/locations`
- `GET /api/v1/public/tracking/code/:public_access_code`
- `GET /api/v1/public/tracking/code/:public_access_code/locations`
- `GET /api/v1/public/tracking/code/:public_access_code/route`
- `POST /api/v1/tracking_sessions/:id/locations`
- `POST /api/v1/tracking_sessions/:id/locations/batch`
- `POST /api/v1/tracking_sessions/:id/finish`
- `POST /api/v1/admin/session`
- `DELETE /api/v1/admin/session`
- `GET /api/v1/admin/dashboard`
- `GET /api/v1/admin/athletes`
- `POST /api/v1/admin/athletes`
- `GET /api/v1/admin/athletes/:id`
- `GET /api/v1/admin/races`
- `POST /api/v1/admin/races`
- `GET /api/v1/admin/races/:id`
- `POST /api/v1/admin/races/:id/route`
- `GET /api/v1/admin/tracking_sessions`
- `POST /api/v1/admin/tracking_sessions`
- `GET /api/v1/admin/tracking_sessions/:id`

O navegador não recebe `ingest_token`. Escritas do modo `/test-tracking` passam por Route Handlers do Next.js, que usam `RAILS_INGEST_TOKEN` server-side.

No admin, o `ingest_token` aparece somente na resposta de criação da TrackingSession para
uso operacional imediato.

## Fluxo `/athlete`

O atleta usa `/athlete` com um código curto de acesso da TrackingSession.

```text
Atleta -> /athlete -> /api/athlete/session -> Rails /api/v1/athlete/session
```

O browser nunca recebe `ingest_token`. O Next.js guarda a credencial necessária em um
cookie first-party selado:

```text
utmb_trail_athlete_session
```

Esse cookie é `HttpOnly`, `SameSite=Lax`, `Path=/` e `Secure` em produção. O valor é
criptografado pelo Next com `ATHLETE_SESSION_SECRET`.

Depois da ativação:

```text
Browser -> /api/athlete/locations       -> Rails com ingest_token server-side
Browser -> /api/athlete/locations/batch -> Rails com ingest_token server-side
Browser -> /api/athlete/finish          -> Rails com ingest_token server-side
```

O código público de visualização (`public_access_code`) e o código do atleta (`athlete_access_code`) são separados.

## Fluxo público

Família e amigos digitam o código público na Home.

```text
public_access_code -> Next.js Route Handler -> Rails Public API by code
```

Qualquer outro código retorna:

```text
Não encontramos uma sessão de acompanhamento com esse código.
```

Esse código é temporário para MVP e não é mecanismo real de segurança.

## Mapa

O mapa usa Leaflet com OpenStreetMap.

O backend atual não expõe a rota completa da prova. Por isso o frontend mostra:

- posição atual;
- trilha percorrida a partir do histórico público;
- marcador inicial e último ponto conhecido.

Pendência futura: endpoint público para retornar `RoutePoints` ou uma polyline da rota oficial.

## Polling

A tela pública atualiza o tracking a cada 15 segundos.

Configuração centralizada em:

```text
src/lib/config.ts
```

## PWA / Home Screen

O app possui manifesto, ícones, `theme_color`, `background_color`, `display: standalone` e metadados Apple.

No iPhone:

1. abrir a URL no Safari;
2. tocar em compartilhar;
3. escolher "Adicionar à Tela de Início".

Não foi criado Service Worker nesta etapa, porque o MVP não precisa cache offline de aplicação; apenas buffer offline de pontos GPS.

## Modo `/test-tracking`

Tela experimental para teste real:

- solicita GPS somente após toque em `INICIAR`;
- usa `navigator.geolocation.watchPosition`;
- salva pontos no IndexedDB;
- sincroniza em lote via proxy server-side;
- mantém contadores de enviados, pendentes e último envio;
- pausa coleta local sem finalizar sessão;
- finalização exige confirmação explícita.

## Buffer offline

Quando o envio falha ou o aparelho fica offline, as posições ficam em IndexedDB.

Quando a conexão volta ou o usuário toca em `Sincronizar agora`, o app usa:

```text
POST /api/v1/tracking_sessions/:id/locations/batch
```

O backend já aplica idempotência por `client_point_id`.

## Limitações iOS/PWA

O iOS pode suspender geolocalização e JavaScript quando:

- tela bloqueia;
- PWA vai para background;
- Safari decide economizar energia.

Este MVP valida PWA ativa + GPS + API + buffer + mapa. O comportamento com tela bloqueada deve ser medido em teste real.

## Build

```bash
npm run build
```

## Testes

```bash
npm test
```

## Deploy manual na Vercel

Framework:

```text
Next.js
```

Build Command:

```bash
npm run build
```

Output:

```text
.next
```

Environment Variables:

```text
NEXT_PUBLIC_API_BASE_URL=https://utmb-trail.onrender.com
TEST_TRACKING_SESSION_ID=<id>
RAILS_INGEST_TOKEN=<ingest_token>
ATHLETE_SESSION_SECRET=<segredo longo para cookie do atleta>
```

Não há variável de ambiente com credencial administrativa. O login usa e-mail e senha
cadastrados no backend Rails.

Não fazer deploy automático sem revisar as variáveis.
