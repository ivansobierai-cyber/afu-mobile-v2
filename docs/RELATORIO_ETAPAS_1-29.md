# Relatório Etapas 1–29 — MVP Planta Saudável

**Data:** julho/2026  
**Stack real:** Expo SDK 54 · Express · tRPC · MySQL 8 · Drizzle · Railway · Vercel · EAS

## Resumo executivo

| Fase | Etapas | Status predominante |
|------|--------|---------------------|
| Estratégia (1–6) | Documentação de negócio | `doc` |
| Arquitetura técnica (7–12) | Docs divergentes do código | `partial` |
| Design (13–16, 22–23) | Design system + protótipos | `partial` / `doc` |
| Governança (17–21) | **17–18 corrigidas** nesta entrega | `doc` / `partial` |
| Implementação (24–29) | App web/mobile + staging | `done` / `partial` / `pending` |

**Progresso MVP (1–29):** calculado por peso de status em `constants/afu-etapas.ts`  
(`done`=100%, `partial`=65%, `doc`=35%, `pending`=0%).

## Correções aplicadas (jul/2026)

1. **`constants/afu-etapas.ts`** — fonte única das etapas 1–29, stack real e helpers de progresso.
2. **`app/mais/estrutura-organizacional.tsx`** — etapa 17 (equipe, RACI, parceiros).
3. **`app/mais/kpis.tsx`** — etapa 18 (KPIs MVP com status staging).
4. **`app/mais/indice-geral.tsx`** — progresso por status (não mais “tem rota = 100%”).
5. **`components/afu-stack-banner.tsx`** — banner de stack em telas com docs NestJS/PostgreSQL.
6. **Menu Mais** — seções 17–21 e 22–29; badges via `etapaBadgeForRoute()`.
7. **`app/mais/testes-campo.tsx`** — aba Homologação com checklist pré-piloto.

## Divergências documentais conhecidas

Várias telas de arquitetura (etapas 7–8, 21, 24, 26, 28) ainda descrevem **NestJS, Prisma e PostgreSQL**.  
O código em `server/` usa **Express + tRPC + MySQL + Drizzle**. O banner verde em cada tela indica a stack implementada.

## Pilares MVP (skill afu-mvp-finalize)

| Pilar | Status |
|-------|--------|
| Auth JWT + navegação | ✅ |
| Dashboard Planta Saudável | ✅ |
| Diagnóstico IA (foto → laudo) | ✅ |
| CRUD propriedades/cultivos/terrenos | ✅ |
| Relatórios PDF | ✅ parcial |
| Mapa GPS web (OSM) | ✅ |
| Marketplace PIX | demo |
| Offline conteúdos | parcial |
| Piloto etapa 29 | ⏳ pendente |

## Próximos passos

- Concluir piloto (10–50 produtores) — etapa 29.
- Alinhar docs técnicos 7–12 com Drizzle/MySQL ou manter como “plano futuro”.
- Vitest: suites `auth-flow` e `resend-email` reintegradas ao `npm run test`.
