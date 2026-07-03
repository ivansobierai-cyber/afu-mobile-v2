# AFU Agro — Planta Saudável

App mobile/web para produtores rurais: dashboard, propriedades, cultivos, diagnóstico por IA, calendário, suporte e relatórios.

Stack: **Expo SDK 54**, **Expo Router**, **tRPC**, **Drizzle ORM**, **MySQL/MariaDB**, **NativeWind**.

## Requisitos

- Node.js 20+
- npm
- MySQL ou MariaDB (local ou remoto)
- Conta Expo (opcional, para builds EAS Android/iOS)

## Setup rápido

```bash
# 1. Dependências
npm install

# 2. Ambiente
cp .env.example .env
# Edite .env: DATABASE_URL e JWT_SECRET

# 3. Schema do banco
npm run db:push

# 4. Dados demo (opcional)
npm run seed

# 5. API + Metro
npm run dev
```

- Web / Metro: [http://localhost:8081](http://localhost:8081)
- API: [http://localhost:3000](http://localhost:3000)

### Conta demo (após `npm run seed`)

| Campo | Valor |
|-------|--------|
| E-mail | `demo@afuagro.com.br` |
| Senha | `Demo@1234` |

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API + Metro (web na porta 8081) |
| `npm run check` | TypeScript (`tsc --noEmit`) |
| `npm run test` | Testes Vitest |
| `npm run db:push` | Gera e aplica migrations Drizzle |
| `npm run seed` | Seed idempotente de dados demo |
| `npm run build` / `npm start` | Build e start da API em produção |

## Dev client Android (EAS)

Projeto EAS: `@sobierai/afu-mobile`.

```bash
eas build --platform android --profile development
```

No celular, a API **não** usa `localhost`. Defina no `.env` o IP da máquina:

```env
EXPO_PUBLIC_API_BASE_URL=http://SEU_IP_LAN:3000
```

Depois reinicie o Metro e conecte o dev client ao bundler na porta **8081**.

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
