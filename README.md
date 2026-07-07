# AFU Agro — Planta Saudável

App mobile/web para produtores rurais: dashboard, propriedades, cultivos, diagnóstico por IA, calendário, suporte e relatórios.

Stack: **Expo SDK 54**, **Expo Router**, **tRPC**, **Drizzle ORM**, **MySQL/MariaDB**, **NativeWind**.

## Requisitos

- Node.js 20+
- npm
- **Docker Desktop** (recomendado) ou MySQL/MariaDB instalado localmente
- Conta Expo (opcional, para builds EAS Android/iOS)

## Setup rápido

```bash
# 1. Dependências
npm install

# 2. Ambiente
cp .env.example .env
# Edite .env: DATABASE_URL e JWT_SECRET (valores padrão já batem com o Docker abaixo)

# 3. Banco MySQL via Docker
npm run db:up
# Aguarde ~20s até o healthcheck ficar healthy (docker compose ps)

# 4. Schema do banco
npm run db:push

# 5. Dados demo (opcional)
npm run seed
npm run seed:marketplace

# 6. API + Metro
npm run dev
```

### Banco com Docker

O `docker-compose.yml` sobe MySQL 8 na porta **3306** com as credenciais do `.env.example`:

| Variável | Valor |
|----------|--------|
| `DATABASE_URL` | `mysql://afu:afu_local_dev@127.0.0.1:3306/afu_mobile` |
| Usuário root (admin) | `root` / `root` |

```bash
npm run db:up      # sobe o container
npm run db:logs    # acompanha logs
npm run db:down    # para o container (mantém dados)
npm run db:reset   # apaga volume e recria do zero
```

**Instalar Docker Desktop (Windows):**

```powershell
winget install Docker.DockerDesktop
```

Reinicie o PC se solicitado, abra o **Docker Desktop** e aguarde ficar *Running* antes de `npm run db:up`.

> **Primeira instalação no Windows:** o `wsl --install` pode exigir **reinício**. Se o Docker não subir, verifique também se a virtualização está ativa na BIOS (Intel VT-x / AMD-V).

## Setup rápido (sem Docker)

- Web / Metro: [http://localhost:8081](http://localhost:8081)
- API: [http://localhost:3000](http://localhost:3000)

### Conta demo (após `npm run seed`)

| Campo | Valor |
|-------|--------|
| E-mail | `demo@afuagro.com.br` |
| Senha | `Demo@1234` |

**Comprador demo** (para testar pedidos no marketplace):

| Campo | Valor |
|-------|--------|
| E-mail | `comprador@afuagro.com.br` |
| Senha | `Demo@1234` |

Crie com `npm run seed:comprador` se ainda não existir.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + Metro (web na porta 8081) |
| `npm run check` | TypeScript (`tsc --noEmit`) |
| `npm run test` | Testes Vitest |
| `npm run db:push` | Gera e aplica migrations Drizzle |
| `npm run db:up` | Sobe MySQL via Docker Compose |
| `npm run db:down` | Para o container MySQL |
| `npm run db:reset` | Recria o banco do zero (apaga volume) |
| `npm run seed` | Seed idempotente de dados demo |
| `npm run seed:marketplace` | Popula catálogo demo do marketplace |
| `npm run build` / `npm start` | Build e start da API em produção |

## Dev client Android (EAS)

Projeto EAS: `@sobierai/afu-mobile`.

```bash
npm run eas:android:dev      # dev client (internal)
npm run eas:android:preview  # APK interno (staging)
npm run eas:android:prod     # build produção (AAB)
```

Ajuste `EXPO_PUBLIC_API_BASE_URL` em `eas.json` (profiles `preview` / `production`) para a URL real da API.

No celular, a API **não** usa `localhost`. Defina no `.env` o IP da máquina:

```env
EXPO_PUBLIC_API_BASE_URL=http://SEU_IP_LAN:3000
```

Depois reinicie o Metro e conecte o dev client ao bundler na porta **8081**.

### Push em produção (FCM/APNs)

1. Configure credenciais no [Expo dashboard](https://expo.dev) → projeto `@sobierai/afu-mobile` → Credentials
2. Android: upload da chave FCM (Firebase)
3. iOS: APNs key ou certificado
4. Build com `eas:android:prod` ou `eas:ios:prod` — push remoto só funciona em **dispositivo físico**

### Alertas climáticos automáticos

Na API, ative o scheduler ou chame o endpoint agendado:

```env
WEATHER_ALERTS_ENABLED=1
WEATHER_ALERTS_INTERVAL_MS=21600000
SCHEDULED_TASK_SECRET=seu_segredo_longo
```

```bash
npm run weather:alerts
# ou POST /api/scheduled/weather-alerts com Authorization: Bearer <SCHEDULED_TASK_SECRET>
```

O job envia push de **geada, chuva forte, calor e vento** para propriedades com GPS cadastrado (dedup 12h).

## Estrutura

```
app/           # Telas (Expo Router)
components/    # UI compartilhada
hooks/         # Auth, sessão, offline, upload
lib/           # tRPC client, API, offline, tema
server/        # Express + tRPC + Drizzle
drizzle/       # Schema e migrations SQL
scripts/       # seed, load-env, utilitários
```

## Segurança

- `.env` está no `.gitignore` — use apenas `.env.example` como modelo.
- Não commite chaves JWT, `DATABASE_URL` com senha, keystores ou tokens EAS locais.

## Documentação extra

- `PROJECT_REVIEW.md` — revisão do MVP
- `ADMIN_OFFLINE_GUIDE.md` — modo offline / admin
- `todo.md` — checklist de entregas
- `server/README.md` — detalhes do backend

## Licença

Projeto privado (`private: true`).
