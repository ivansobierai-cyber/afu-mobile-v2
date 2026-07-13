# Relatório Etapas 1–30 — MVP Planta Saudável

**Data:** julho/2026  
**Stack real:** Expo SDK 54 · Express · tRPC · MySQL 8 · Drizzle · Railway · Vercel · EAS

## Resumo executivo

| Fase | Etapas | Status |
|------|--------|--------|
| Estratégia (1–6) | Documentação de negócio | `doc` — conteúdo MVP coerente |
| Arquitetura técnica (7–12) | Docs alinhados à stack real | `done` |
| Design (13–16, 22–23) | Guias + app implementado | `done` |
| Governança (17–21) | KPIs live, RACI, execução | `done` |
| Implementação (24–28) | App, portal, admin, deploy | `done` |
| Piloto (29) | Infra DB + UI feedback | `partial` |
| Banco agronômico (30) | Schema + API + seed + catálogo | `done` |

**Progresso MVP (1–30):** calculado em `constants/afu-etapas.ts` via pesos de status.

## Entregas técnicas (jul/2026)

### Etapa 30 — Banco Agronômico
- Tabelas: `culturas_catalogo`, `clima_cultura`, `irrigacao_cultura`, `nutrientes_cultura`, `genetica_cultura`, `pragas_catalogo`, `doencas_catalogo`, `controle_pragas_cultura`
- API: `bancoAgronomico.catalogo.*`, `bancoAgronomico.consulta`
- Seed: `npm run seed:agronomico`
- UI: `catalogo-culturas.tsx` → MySQL; `cultura-catalogo/[id].tsx`

### Etapa 29 — Piloto
- Tabelas: `piloto_participantes`, `piloto_feedback`, `piloto_metricas`
- API: `piloto.participantes.*`, `piloto.feedback.*`, `piloto.metricas.resumo`
- UI: aba Piloto em `testes-campo.tsx`

### Fonte única
- `constants/afu-etapas.ts` — etapas 1–30, progresso, badges
- `components/afu-mvp-footer.tsx` — rodapé estratégia/design
- `components/afu-stack-banner.tsx` — divergências documentais

## Comandos de verificação

```bash
npm run check
npm run test
npm run db:push
npm run seed
npm run seed:agronomico
```

## Pendências pós-MVP

- Piloto com produtores reais (etapa 29 → `done`)
- Etapas 31–46 (expansão banco agronômico)
- Pagamento marketplace (Mercado Pago)
