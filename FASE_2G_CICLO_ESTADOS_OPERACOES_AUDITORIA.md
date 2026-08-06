# AFU Agro — FASE 2G

## Ciclo de Estados das Operações + Transições Server-side + Auditoria

**Base obrigatória:** `origin/main` pós-2F em `d2bb9c8d6b63d1bed5d00a776c14254b82a34398`  

**Fase anterior:** 2F encerrada via PR #40  

**Fonte funcional:** Plano Mestre de Evolução, ETAPA 3 — itens 3.1 e 3.2  

**Regra:** executar esta fase isoladamente. Não iniciar apontamentos, estoque, custos, mapa, offline ou DnD.

---

## 1. Objetivo

Evoluir `operacoes_agricolas` de uma entidade com status básico para um fluxo operacional controlado, auditável e seguro, mantendo separadas as entidades Evento, Tarefa, Operação e Apontamento.

Ao terminar a 2G:

- o servidor será a autoridade das transições de estado;
- nenhuma transição inválida poderá ser feita por UI ou chamada direta;
- safra histórica continuará imutável;
- RBAC será aplicado a cada transição;
- toda mudança de estado aceita produzirá histórico auditável;
- a interface mostrará somente ações válidas para o estado/permissão atuais;
- registros existentes continuarão legíveis e compatíveis.

---

## 2. Estado atual a preservar

Antes de alterar código, confirmar no `main` real:

- schema/migration de `operacoes_agricolas` e tipo atual de `status`;
- estados atualmente persistidos `planejada`, `em_execucao`, `concluida`, `cancelada` conforme a 2F);
- endpoints/mutações de `coreData.operacoes`;
- vínculo opcional `tarefaId` criado na 2E;
- `promoteFromEvento` e sua idempotência;
- guards de tenant, propriedade, safra gravável e RBAC;
- comportamento `readOnly` de safra encerrada;
- Lista/Kanban e filtros da 2F;
- testes 2C/2D/2E/2F existentes.

Não modificar antes desse inventário. Se o código real divergir deste documento, registrar a divergência e adaptar pela menor mudança compatível.

---

## 3. Contrato de estados

O Plano Mestre define como mínimo:

`Planejada → Liberada → Em execução → Pausada → Concluída → Aprovada`

Saídas alternativas:

- `Cancelada`
- `Bloqueada`
- `Reaberta`

### 3.1 Estados canônicos propostos

Usar nomes persistidos estáveis, após confirmar compatibilidade com o schema:

- `planejada`
- `liberada`
- `em_execucao`
- `pausada`
- `concluida`
- `aprovada`
- `cancelada`
- `bloqueada`
- `reaberta`

Não renomear estados existentes sem necessidade. Não reaproveitar status de Tarefa como se fosse status de Operação.

### 3.2 Matriz de transição

Criar uma única função/regra de domínio reutilizada pela API e UI. A matriz final deve ser documentada e testada.

Matriz inicial recomendada, sujeita apenas a incompatibilidade comprovada no domínio atual:

| De | Para permitido |

|---|---|

| `planejada` | `liberada`, `bloqueada`, `cancelada` |

| `liberada` | `em_execucao`, `bloqueada`, `cancelada` |

| `em_execucao` | `pausada`, `concluida`, `bloqueada`, `cancelada` |

| `pausada` | `em_execucao`, `bloqueada`, `cancelada` |

| `concluida` | `aprovada`, `reaberta` |

| `reaberta` | `liberada`, `cancelada` |

| `bloqueada` | retorno controlado conforme regra documentada, ou `cancelada` |

| `aprovada` | terminal; reabertura somente se houver regra e permissão explícitas |

| `cancelada` | terminal; não restaurar silenciosamente |

Para `bloqueada`, não adivinhar o estado de retorno. Se o produto precisar retornar ao estado anterior, persistir informação suficiente ou registrar a transição anterior no histórico e definir regra explícita.

---

## 4. Transição como operação de domínio server-side

Criar/reutilizar uma mutação única equivalente a `operacoes.transitionStatus`.

O cliente envia no máximo:

- `operacaoId`;
- estado de destino;
- motivo/observação quando exigido;
- versão/controle de concorrência se a arquitetura atual já suportar isso.

O servidor deve derivar do registro real:

- organização;
- propriedade;
- safra;
- estado atual;
- vínculos relevantes.

Antes de gravar:

1. autenticar usuário;
2. validar tenant sem revelar registros de outro tenant;
3. validar propriedade e operação;
4. validar safra gravável;
5. validar RBAC/capacidade da transição;
6. validar `estadoAtual → estadoDestino` na matriz canônica;
7. aplicar pré-condições específicas;
8. atualizar estado + gravar auditoria na mesma transação de banco.

Erros devem ter códigos de domínio estáveis, por exemplo `INVALID_OPERATION_TRANSITION`, `SAFRA_READ_ONLY` e `FORBIDDEN`, reutilizando padrões existentes quando houver.

Não aceitar que o cliente informe um `statusAnterior` confiável.

---

## 5. Concorrência e idempotência

Evitar que dois dispositivos/sessões façam transições conflitantes.

Implementar com a estratégia compatível com a stack atual (lock transacional, compare-and-set/versionamento ou equivalente).

Critérios:

- a transição verifica o estado atual dentro da transação;
- duas transições concorrentes não podem sobrescrever silenciosamente uma à outra;
- repetir exatamente uma transição já efetivada deve ter comportamento definido e não criar histórico falso duplicado;
- conflito retorna erro/resultado de domínio tratável pela UI.

---

## 6. Auditoria de estados

Criar histórico append-only para as mudanças de estado, seguindo padrões de auditoria já existentes no repositório.

Campos mínimos conceituais:

- `id`;
- `organizationId`;
- `propriedadeId`;
- `operacaoId`;
- `fromStatus`;
- `toStatus`;
- `actorUserId`;
- `createdAt`;
- `motivo`/observação opcional;
- origem da ação quando o projeto já possuir padrão equivalente.

Regras:

- update da Operação e insert do histórico na mesma transação;
- histórico não deve ser editável pela UI comum;
- leitura também respeita tenant/RBAC;
- não fabricar uma sequência histórica para operações antigas;
- se for necessário registrar o estado existente na implantação, usar um evento/snapshot explicitamente identificado como inicial, não uma falsa transição de usuário.

---

## 7. RBAC

Antes de criar nova permissão, inventariar capacidades existentes `operations.read`, `operations.write` e demais permissões reais).

Requisito funcional do Plano Mestre:

- operador autorizado pode iniciar, pausar e concluir;
- supervisor autorizado pode revisar/aprovar;
- auditor/read-only apenas consulta;
- safra encerrada bloqueia escrita independentemente do papel.

Se o RBAC atual não distingue execução de aprovação, não usar apenas um `if` de frontend. Propor a menor extensão coerente do permission model e documentá-la antes da implementação. Não criar papéis paralelos ou autorização específica somente nesta tela.

Testar negação server-side para cada transição sensível.

---

## 8. Migração e compatibilidade

Se os novos estados exigirem alteração de enum/constraint/schema:

- criar migration nova, pequena e reversível dentro do possível;
- nunca editar migration já aplicada;
- preservar os quatro valores já persistidos;
- não converter `concluida` antiga automaticamente em `aprovada`;
- não converter `planejada` antiga automaticamente em `liberada`;
- não produzir histórico retroativo fictício;
- testar banco limpo e upgrade de banco com dados 2F.

Se não for necessária migration, documentar por quê.

Não fazer backfill de `calendario_cuidados` nesta fase.

---

## 9. Interface mínima da 2G

Evoluir a interface da 2F sem redesenhá-la.

### Lista/Kanban

- reconhecer e exibir todos os estados canônicos;
- manter Lista e Kanban utilizáveis;
- não implementar drag-and-drop para transicionar estado;
- filtros de status devem incluir novos estados;
- estados não podem depender somente de cor para serem identificados.

### Ações

Ao abrir uma Operação, mostrar apenas transições permitidas pelo estado atual + permissão + safra gravável.

Exemplos de ações: Liberar, Iniciar, Pausar, Retomar, Concluir, Aprovar, Bloquear, Cancelar ou Reabrir conforme matriz final.

Para ações destrutivas/irreversíveis, exigir confirmação adequada. Para cancelamento/bloqueio/reabertura, registrar motivo quando a regra final definir como obrigatório.

### Histórico

Exibir uma linha do tempo/lista simples das mudanças de estado com data, ator e motivo disponível. Não construir ainda uma central de auditoria avançada.

Após mutação, atualizar queries necessárias sem reload completo.

---

## 10. Integrações que devem permanecer estáveis

### Evento → Operação

`promoteFromEvento` continua criando/encontrando Operação em `planejada`. Idempotência da 2F deve permanecer.

### Tarefa → Operação

Preservar `tarefaId` opcional e semântica 2E/2F. A mudança de estado de uma Operação NÃO deve automaticamente concluir/aprovar a Tarefa nesta fase, salvo se já existir uma regra canônica anterior que precise ser preservada e testada.

### Safra histórica

Toda transição deve ser negada no servidor em safra encerrada/arquivada. A UI não oferece botões de transição.

---

## 11. Testes obrigatórios

### Domínio

- todas as transições válidas da matriz;
- principais transições inválidas;
- estados terminais;
- bloqueada/reaberta conforme regra final;
- idempotência/repetição;
- concorrência ou compare-and-set, conforme implementação.

### Segurança

- `operations.read` não escreve;
- operador executa somente ações autorizadas;
- supervisor aprova quando autorizado;
- auditor não transiciona;
- outro tenant não acessa nem infere Operação;
- outra propriedade é negada;
- safra histórica sempre nega transição inclusive por chamada direta.

### Auditoria

- transição válida gera exatamente um registro;
- transição inválida não gera histórico de sucesso;
- actor/from/to/timestamp/vínculos corretos;
- falha ao inserir auditoria faz rollback da mudança de status.

### Regressão

- Evento → Operação continua idempotente;
- criação de Operação da 2F funciona;
- Lista/Kanban funcionam com estados antigos e novos;
- filtros continuam funcionando;
- - Registrar não regride;
- Tarefas continuam entidade separada;
- testes 2C/2D/2E/2F permanecem verdes.

---

## 12. Gate técnico

Executar os comandos reais definidos no repositório. No mínimo, equivalentes a:

```bash

npm run check

npm run test:ci

```

Exigir:

- typecheck PASS;
- unit/integration PASS;
- migration/schema check PASS, se houver migration;
- build web PASS;
- CI remoto no HEAD final SUCCESS;
- Bugbot sem finding bloqueante;
- Approval Agent aprovado;
- Vercel preview verde.

Não aceitar CI de SHA anterior como evidência.

---

## 13. Homologação visual/funcional

No preview autenticado, testar desktop e mobile:

1. Operação planejada mostra ações válidas;
2. fluxo principal chega até aprovada;
3. pausar/retomar funciona;
4. cancelamento/bloqueio/reabertura seguem a matriz final;
5. histórico mostra as transições executadas;
6. Lista/Kanban e filtro reconhecem novos estados;
7. auditor não vê ações de escrita;
8. safra encerrada permanece somente consulta;
9. troca de estado atualiza a tela sem reload completo;
10. não há overflow/corte crítico no mobile.

Produzir screenshots quando o ambiente permitir.

---

## 14. Fora do escopo — NÃO implementar na 2G

- apontamento real de execução (horários reais, área executada, insumos reais, operador/máquina reais, evidências);
- consumo/baixa de estoque;
- custos/receitas;
- automação de progresso/conclusão de Tarefa a partir da Operação;
- mapa operacional;
- DnD de Kanban para mudança de status;
- offline/sincronização;
- ações em massa;
- templates agrícolas;
- filtro por período pendente da 2F, salvo se estritamente necessário para corrigir regressão;
- backfill/migração de `calendario_cuidados`;
- qualquer fase posterior.

Esses itens devem permanecer como dívida/etapa futura, não como motivo para ampliar a PR 2G.

---

## 15. Estratégia de execução por PR

1. atualizar `main` e confirmar base `d2bb9c8...` ou descendente equivalente sem trabalho 2G;
2. criar branch exclusiva `feat/fase-2g-operacoes-state-machine`;
3. inventariar schema, APIs, RBAC e estados reais;
4. fechar contrato/matriz de transição;
5. implementar domínio server-side + concorrência;
6. implementar auditoria transacional;
7. adaptar schema/migration somente se necessário;
8. adaptar UI mínima da 2F;
9. adicionar testes;
10. rodar gate local;
11. abrir PR;
12. aguardar CI/reviews/preview;
13. executar homologação;
14. entregar relatório e PARAR.

**Não fazer merge sem autorização explícita do Ivan.**

---

## 16. Entrega obrigatória do agente

Responder no formato:

### FASE 2G — GATE PARA REVISÃO

- branch;
- base usada;
- SHA final;
- PR/URL;
- inventário do estado anterior;
- matriz final de transições;
- RBAC por transição;
- estratégia de concorrência/idempotência;
- schema/migration criada ou justificativa de ausência;
- estrutura de auditoria;
- arquivos alterados;
- testes adicionados e resultados;
- `npm run check`;
- `npm run test:ci`;
- CI remoto;
- Bugbot;
- Approval Agent;
- Vercel;
- homologação desktop/mobile;
- screenshots disponíveis;
- regressões 2C/2D/2E/2F;
- dívidas/futuro;
- recomendação `MERGE` ou `NÃO MERGE`.

**PARAR. Não fazer merge. Não iniciar a 2H.**