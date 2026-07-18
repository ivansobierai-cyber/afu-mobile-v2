# Glossário — Gerenciamento de Propriedades AFU

| Termo UI | Entidade / tabela | Definição |
|----------|-------------------|-----------|
| **Propriedade** | `propriedades` | Fazenda, sítio ou unidade rural. Pertence a um `produtor`. |
| **Talhão** | `terrenos` | Unidade operacional dentro da propriedade. Schema mantém o nome `terrenos`; UI preferencial: **Talhão**. |
| **Terreno** | `terrenos` | Sinônimo legado de talhão. Não criar tabela separada. |
| **Cultivo** | `culturas` | Cultura/variedade implantada em um talhão (e futuramente em uma safra). |
| **Cultura (catálogo)** | `culturas_catalogo` | Ficha técnica botânica do banco agronômico (não é o cultivo do produtor). |
| **Safra / ciclo** | `safras` (Etapa 2+) | Período produtivo que agrupa planejamento e resultados. Dados temporais pertencem à safra. |
| **Evento** | `calendario_cuidados` | Lembrete/agenda. Não é tarefa operacional completa. |
| **Tarefa** | `tarefas_operacionais` | Trabalho atribuído com prazo, status e vínculo a propriedade/talhão. |
| **Operação** | tipo em `tarefas_operacionais.tipoOperacao` | Tipo de atividade agrícola (plantio, irrigação, etc.). |
| **Apontamento** | `apontamentos_operacao` | Registro real de execução (início/fim, área, notas). |
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
