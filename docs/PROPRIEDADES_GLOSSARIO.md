# Glossário — Gerenciamento de Propriedades AFU

| Termo UI | Entidade / tabela | Definição |
|----------|-------------------|-----------|
| **Propriedade** | `propriedades` | Fazenda, sítio ou unidade rural. Pertence a um `produtor`. |
| **Talhão** | `terrenos` | Unidade operacional dentro da propriedade. Schema mantém o nome `terrenos`; UI preferencial: **Talhão**. |
| **Terreno** | `terrenos` | Sinônimo legado de talhão. Não criar tabela separada. |
| **Cultivo** | `culturas` | Cultura/variedade implantada em um talhão (e futuramente em uma safra). |
| **Cultura (catálogo)** | `culturas_catalogo` | Ficha técnica botânica do banco agronômico (não é o cultivo do produtor). |
| **Safra / ciclo** | `safras` (Etapa 2+) | Período produtivo que agrupa planejamento e resultados. Dados temporais pertencem à safra. |
| **Evento** | `calendario_cuidados` | Lembrete/agenda. Não é tarefa operacional completa. Com `propriedadeId`, a ponte WP-02 mantém tarefa vinculada via `legadoEventoId`. |
| **Tarefa** | `tarefas_operacionais` | Trabalho atribuído com prazo, status e vínculo a propriedade/talhão. |
| **Operação (tipo legado)** | `tarefas_operacionais.tipoOperacao` | Classificação da atividade na tarefa (plantio, irrigação, etc.). Mantido. |
| **Operação agrícola** | `operacoes_agricolas` | Atividade de campo de registro (FASE 2E+). Distinta de tarefa; pode ligar a evento (`eventoOrigemId`) e/ou tarefa (`tarefaId`). |
| **Apontamento (legado)** | `apontamentos_operacao` | Execução registrada na tarefa. Mantido. |
| **Apontamento (canônico)** | `operacoes_agricolas_apontamentos` | Execução real da operação agrícola (FASE 2H). |
| **Ocorrência** | (Etapa 6) | Observação de campo georreferenciada. |
| **Diagnóstico** | `diagnosticos_ia` | Avaliação IA/humana/laboratorial ligada à ocorrência/cultivo. |

## Unidades padrão

- Área: **ha** (hectare); também alqueire / m² quando declarado
- Massa: kg · Volume: L · Tempo: h · Moeda: BRL
- Produtividade: kg/ha ou sc/ha conforme cultura

## Regra temporal

- Nome, localização e perímetro → propriedade
- Análises de solo → datadas e versionadas
- Plantio, operações, custos, produtividade → safra/ciclo
- Nunca sobrescrever safra anterior para representar a atual
