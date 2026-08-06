# FASE 2F — UX Operações Agrícolas

## Inventário da UX anterior

A aba **Operações** do painel (`PropriedadeOperacoesPanel`) listava exclusivamente **tarefas operacionais** (`coreData.tarefas`), com rótulos “Operações” / “Nova tarefa”, transições de status de tarefa e consumo de estoque ao concluir.

## Decisão Tarefa × Operação na interface

| Entidade | Onde na UI | API |
|----------|------------|-----|
| **Operação agrícola** | Segmento “Operações agrícolas” | `coreData.operacoes` |
| **Tarefa** | Segmento “Tarefas” | `coreData.tarefas` |
| **Evento** | Agenda (`calendario`) | `coreData.calendario` |
| **Apontamento** | (fora do escopo 2F) | — |

Não houve substituição de tarefa por operação: o conteúdo legado foi movido para `PropriedadeTarefasPanel` e renomeado semanticamente.

## Kanban

Colunas = estados persistidos da 2E (`planejada`, `em_execucao`, `concluida`, `cancelada`). Sem drag-and-drop que altere status.

## Evento → Operação

Botão explícito no detalhe do evento (`EventoDetailModal`) com `promoteFromEvento`, visível apenas com `operations.write`.

## + Registrar

Itens separados: “Nova operação agrícola” e “Nova tarefa”.
