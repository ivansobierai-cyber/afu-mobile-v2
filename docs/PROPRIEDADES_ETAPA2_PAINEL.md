# Etapa 2 — Painel da propriedade com navegação contextual

**Status:** concluída (aceite)  
**Branch:** `cursor/security-multitenant-audit-fd64`  
**Fonte:** `AFU_Agro_Plano_Mestre_Propriedades_10_Etapas.md` — ETAPA 2

---

## 1. Alterações realizadas

| Item | Detalhe |
|------|---------|
| Shell com abas | Já existia em `app/propriedades/[id].tsx` (Visão / Mapa / Operações / Talhões / Cultivos / Mais) |
| Cabeçalho | `+ Registrar`, menu admin (⋮), seletor de safra, Trocar, status, atualização |
| Safra | `buildSafraOptions` / `isHistoricoSafra` — histórico sem misturar safra atual |
| Menus | `components/propriedade-panel-menus.tsx` |
| Overview | Visão usa `expansao.overview.contagens` (atalhos/stats) |
| Deep link | `?tab=` sincronizado; retorno de talhões via `returnTab` |
| Rotas antigas | `terrenos`, `mapa`, lista, cultivos — intactas |

---

## 2. Critérios de aceite

| Critério | Status |
|----------|--------|
| ≤2 toques para qualquer seção | OK (abas + Mais) |
| Cabeçalho com propriedade e safra | OK (+ seletor) |
| Voltar de talhão mantém contexto | OK (`returnTab=talhoes`) |
| Histórico ≠ safra atual | OK (banner + alerta) |
| Celular / tablet / desktop | OK (`isWide`) |
| Rotas antigas acessíveis | OK |

---

## 3. Testes

```bash
npx vitest run tests/safra-label.test.ts
npm run test:security:etapa10   # isolamento não regrediu
```

---

## 4. Riscos / follow-ups

- Arquivar soft ainda não tem coluna/API — UI informa “em breve”.
- Entidade `safras` persistida virá em etapas seguintes; hoje o contexto é por rótulo.
- Aba “Tarefas” dedicada do plano §5 continua coberta por Operações (desvio MVP intencional).

---

## 5. Decisão

**AVANÇAR** para Etapa 3 (agenda / tarefas / operações integradas).
