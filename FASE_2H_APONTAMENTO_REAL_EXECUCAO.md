# AFU Agro — FASE 2H: Apontamento Real de Execução das Operações

## 0. Identidade e ponto de partida

| Campo | Valor |

|---|---|

| Produto | AFU Agro — Analisador Fitotécnico Universal |

| Fase | 2H — Apontamento Real de Execução |

| Base obrigatória | `main` @ `cd4906e739c112ce94eaac300785ecfaa8bac430` (pós-2G / PR #41) |

| Fase anterior | 2G encerrada e integrada em `main` |

| Regra de execução | Uma fase por vez; sem merge automático |

Esta fase continua a Etapa 3 do Plano Mestre: **Evento → Tarefa → Operação → Apontamento**. A 2G definiu e protegeu o ciclo de estados da operação. A 2H deve separar definitivamente **planejamento** de **execução real**, registrando o que aconteceu no campo de maneira estruturada, auditável e preparada para consumo/estoque/custo em fases futuras.

---

## 1. Objetivo

Implementar o **apontamento real** vinculado a uma `operacao_agricola`, permitindo registrar:

- horário real de início e fim;
- área efetivamente executada;
- operador/equipe real;
- máquina e implemento realmente utilizados, quando já houver entidade reutilizável;
- insumos e quantidades efetivamente utilizados **sem movimentar estoque**;
- condições observadas;
- pausas/problemas relevantes;
- evidências/fotos, reutilizando a infraestrutura existente;
- resultado imediato e observações;
- autor, data, origem e rastreabilidade;
- vínculo seguro com organização, propriedade, safra, talhão e operação.

Resultado esperado: abrir uma operação e enxergar claramente **Planejado × Realizado**, com o realizado persistido como fonte única de verdade para integrações futuras.

---

## 2. O que NÃO entra na 2H

Não implementar nesta fase:

- baixa, reserva ou movimento de estoque;
- custo real, orçamento, rateio, preço ou financeiro;
- cadastro completo de estoque/almoxarifado;
- telemetria de máquinas;
- geotracking/trilha GPS ou mapa operacional;
- drag-and-drop do Kanban;
- sincronização offline/fila offline;
- automação Tarefa ↔ Operação;
- recomendação automática de dose, produto ou aplicação;
- IA agronômica;
- refatoração ampla da 2G;
- qualquer item da 2I+.

Se insumo, máquina, implemento, equipe, anexo ou catálogo ainda não possuir entidade estável no domínio, **não criar um subsistema paralelo**. Modelar apenas o mínimo compatível ou registrar a dívida explicitamente para a fase apropriada.

---

## 3. Regras obrigatórias antes de codificar

1. Criar branch própria a partir do SHA-base acima e confirmar que `main` não mudou de forma incompatível.
2. Inventariar o domínio atual pós-2G:
  - `operacoes_agricolas`;
  - `operacoes_agricolas_status_historico`;
  - `statusRevision` / `statusBeforeBlocked`;
  - router/API de operações;
  - detalhe da operação;
  - permissões `operations.read`, `operations.write`, `operations.approve`;
  - guardas de tenant/propriedade/safra;
  - mecanismos existentes de anexos, usuários/equipe, máquinas/implementos e insumos.
3. Preservar integralmente a máquina de estados aprovada na 2G.
4. Reutilizar padrões existentes de schema, Drizzle, tRPC/API, validação, erros e testes.
5. Não modificar dados de produção durante desenvolvimento/testes.
6. Não fazer backfill fictício de execução para operações antigas.

Entregar no relatório final um pequeno **inventário pré-2H** explicando o que foi reutilizado e o que não existia.

---

## 4. Contrato de domínio

### 4.1 Entidade

Criar uma entidade canônica de apontamento vinculada à operação. O desenho deve permitir **1 operação → N apontamentos**, pois uma mesma operação pode ocorrer em mais de uma sessão/trecho de trabalho sem perder o histórico individual.

Nome sugerido, adaptável ao padrão real do repositório:

`operacoes_agricolas_apontamentos`

Campos mínimos esperados:

- `id`;
- `organizationId`;
- `propriedadeId`;
- `safraId`;
- `operacaoAgricolaId`;
- `talhaoId`, quando a operação possuir talhão;
- `inicioReal`;
- `fimReal`;
- `areaExecutada` + unidade compatível;
- responsável/operador real, preferencialmente por referência existente;
- máquina/implemento real, somente quando houver modelo reutilizável;
- `condicoesObservadas`;
- `problemasPausas` ou estrutura equivalente simples;
- `resultadoImediato`;
- `observacoes`;
- `createdByUserId`;
- `updatedByUserId`;
- `createdAt` / `updatedAt`;
- revisão/versão para concorrência otimista, se o padrão atual exigir.

IDs de contexto nunca devem ser confiados cegamente a partir do cliente. O servidor deve carregar a operação dentro do tenant atual e derivar/validar propriedade, safra e talhão.

### 4.2 Insumos realizados

Modelar a quantidade realmente informada por apontamento de forma estruturada, preparada para integração posterior, por exemplo uma coleção/tabela filha de itens.

Cada item deve admitir, conforme o catálogo existente:

- referência ao insumo/produto quando disponível;
- descrição controlada apenas se necessária para compatibilidade;
- quantidade real;
- unidade;
- autoria/data.

**Regra absoluta da 2H:** salvar um insumo realizado **não** cria movimento de estoque, **não** reserva saldo e **não** calcula custo.

### 4.3 Evidências

Reutilizar o mecanismo de anexos/fotos já existente. Não criar um novo provedor de arquivos. Toda evidência deve ficar vinculada ao apontamento/operação e protegida pelo mesmo tenant/RBAC.

### 4.4 Planejado × realizado

Planejamento continua na operação/tarefa existente. Apontamento guarda somente o realizado.

Não sobrescrever campos planejados ao salvar o realizado. A UI deve apresentar comparação derivada, por exemplo:

| Informação | Planejado | Realizado |

|---|---|---|

| Área | operação | soma/resultado dos apontamentos |

| Período | janela prevista | início/fim real |

| Responsável | planejado | operador/equipe real |

| Máquina | planejada | utilizada |

| Insumos | planejados | quantidades apontadas |

Não criar KPIs econômicos na 2H.

---

## 5. Integração com a máquina de estados 2G

A 2H **não substitui** `transitionStatus` nem cria uma segunda máquina de estados.

Regras:

1. `planejada` / `liberada`: leitura do planejado; não registrar execução concluída como se já tivesse ocorrido.
2. `em_execucao`: permitir criar/editar apontamento de execução.
3. `pausada`: preservar apontamentos; permitir completar dados já realizados, sem fingir nova execução.
4. `concluida`: apontamento fica disponível para revisão; edição somente conforme política explícita e antes da aprovação.
5. `reaberta`: volta a permitir correção/continuação conforme RBAC e fluxo 2G.
6. `aprovada`: dados de execução ficam imutáveis por API normal.
7. `cancelada`: nenhum novo apontamento de execução; histórico existente permanece consultável.
8. `bloqueada`: nenhum novo trabalho enquanto bloqueada; histórico permanece consultável.

### 5.1 Conclusão protegida

Ao transicionar `em_execucao → concluida`, o servidor deve exigir que exista apontamento suficiente para caracterizar a execução real, no mínimo com dados temporais válidos e autoria. Definir validação mínima após inventário do domínio, documentá-la e testá-la.

Essa exigência vale **na nova transição**, sem alterar retroativamente operações já concluídas/aprovadas antes da 2H. Não gerar apontamentos artificiais.

### 5.2 Horários e transições

O timestamp da transição 2G é auditoria de estado; ele não deve apagar nem substituir o horário real informado pelo campo. A UI pode sugerir o horário da ação como valor inicial, mas o realizado deve permanecer explicitamente registrável/corrigível antes da aprovação.

---

## 6. Validações de negócio

Implementar no servidor, no mínimo:

- `inicioReal <= fimReal` quando houver fim;
- datas/horários coerentes e em formato/timezone consistente com o projeto;
- `areaExecutada >= 0`;
- unidade obrigatória quando houver quantidade;
- quantidades de insumo `> 0`;
- nenhuma referência de outro tenant/propriedade;
- talhão deve pertencer à propriedade/operação quando aplicável;
- operação de safra encerrada/arquivada é somente leitura;
- operação aprovada não aceita alteração normal de apontamento;
- estado incompatível rejeita criação/edição;
- erro de domínio estável e previsível para UI/testes.

Não impor regras agronômicas inventadas (dose máxima, produto recomendado, condição climática ideal etc.).

---

## 7. Segurança, RBAC e isolamento multitenant

Reutilizar o modelo atual sempre que possível:

| Permissão | 2H |

|---|---|

| `operations.read` | consultar apontamentos/evidências autorizados |

| `operations.write` | criar/editar apontamento em estado e safra graváveis |

| `operations.approve` | revisar/aprovar via fluxo 2G; não concede escrita irrestrita após aprovação |

Toda query/mutação deve partir do usuário autenticado e validar servidor-side:

`organizationId → propriedadeId → safraId → operacaoAgricolaId → apontamentoId`

Testar explicitamente cross-tenant, outra propriedade, outra safra, usuário sem permissão e auditor/read-only. Não revelar existência de registros de outro tenant em mensagens de erro.

---

## 8. Concorrência, idempotência e auditoria

1. Reutilizar o padrão de `statusRevision`/concorrência da 2G como referência; apontamentos editáveis devem possuir proteção contra sobrescrita silenciosa quando duas sessões editarem o mesmo registro.
2. Criação/reenvio deve aceitar mecanismo idempotente `clientMutationId` ou padrão equivalente do projeto) quando houver risco de duplo submit.
3. O mesmo identificador idempotente com payload/destino incompatível deve gerar `CONFLICT`, não replay silencioso.
4. Toda criação/alteração deve registrar autor e timestamps.
5. Se houver infraestrutura geral de auditoria, reutilizá-la. Não criar um segundo sistema global de auditoria só para 2H.
6. Operação `aprovada` nunca aceita sobrescrita silenciosa.

---

## 9. API mínima

Adaptar ao padrão do router atual; nomes abaixo são conceituais:

- `listApontamentos(operacaoId)`;
- `getApontamento(id)`;
- `createApontamento(...)`;
- `updateApontamento(...)`;
- anexar/remover evidência via mecanismo existente, se autorizado;
- carregar resumo `Planejado × Realizado` sem duplicar fonte de verdade.

Evitar endpoint que aceite `organizationId` livremente e depois grave sem derivar contexto da operação.

Não criar `delete` destrutivo como fluxo principal. Se o produto precisar corrigir registros, preferir política auditável compatível com os padrões existentes; documentar a escolha.

---

## 10. UI/UX

Evoluir o detalhe da operação criado na 2G, sem construir uma área paralela.

### 10.1 Detalhe da operação

Adicionar seção **Execução real** com:

- resumo Planejado × Realizado;
- lista/sessões de apontamento;
- ação `Registrar execução` quando permitida;
- ação de editar/completar quando permitida;
- evidências;
- identificação de quem registrou e quando;
- mensagem clara em modo somente leitura/aprovado.

### 10.2 Formulário

Priorizar uso de campo em celular:

- poucos campos essenciais visíveis inicialmente;
- campos avançados progressivos;
- alvos de toque adequados;
- teclado correto para número/data;
- prevenção de duplo submit;
- loading/erro/sucesso claros;
- validações em linguagem simples;
- preservar o contexto da propriedade/safra/operação.

### 10.3 Estados visuais obrigatórios

Testar e tratar:

- carregando;
- vazio/sem apontamento;
- com um e múltiplos apontamentos;
- erro;
- read-only por permissão;
- safra histórica;
- operação aprovada/cancelada/bloqueada;
- conflito de edição.

---

## 11. Migração e compatibilidade

Criar migration incremental no próximo número disponível após o inventário do `main`.

Obrigatório:

- não renumerar migrations existentes;
- preservar todas as operações 2G;
- nenhum backfill de execução inventada;
- migration repetível/segura conforme padrão atual de CI;
- schema e migration coerentes;
- rollback/recuperação documentado conforme capacidade do projeto;
- operações antigas sem apontamento continuam consultáveis.

Se a 2H acrescentar uma guarda de conclusão, ela deve agir apenas quando ocorrer uma nova transição para `concluida`, não invalidar registros históricos já persistidos.

---

## 12. Testes obrigatórios

Criar suite específica da 2H e manter regressões 2G/2F.

### 12.1 Domínio/API

Testar pelo menos:

1. criar apontamento em operação autorizada;
2. listar/obter apenas dentro do tenant correto;
3. editar com permissão;
4. usuário somente leitura não grava;
5. cross-tenant é negado;
6. outra propriedade/safra é negada;
7. safra encerrada/arquivada é negada;
8. operação aprovada é imutável;
9. operação cancelada/bloqueada não recebe nova execução;
10. horários inválidos são rejeitados;
11. quantidades/unidades inválidas são rejeitadas;
12. conflito de revisão não sobrescreve;
13. replay idempotente não duplica;
14. replay incompatível gera `CONFLICT`;
15. transição para `concluida` sem apontamento mínimo é negada;
16. transição para `concluida` com apontamento válido funciona;
17. operação histórica concluída antes da 2H continua consultável sem backfill;
18. `promoteFromEvento` continua idempotente e cria operação `planejada`;
19. state machine 2G continua rejeitando transições proibidas.

### 12.2 UI

Testar:

- formulário abre com contexto correto;
- salvamento atualiza o detalhe sem refresh manual;
- duplo clique/toque não duplica registro;
- Planejado × Realizado não troca/edita o planejado;
- permissões escondem/desabilitam ações sem serem a autoridade de segurança;
- approved/read-only não apresenta edição ativa;
- mobile sem overflow/cortes críticos.

### 12.3 Gates técnicos

Executar conforme scripts existentes:

- `npm run check`;
- suite 2H;
- suites 2G e 2F;
- `npm run test:ci`;
- build/validate remoto;
- migration/schema checks.

Se o SHA mudar após um fix, os checks válidos são os do **novo HEAD**.

---

## 13. Homologação manual desktop/mobile

No preview autenticado do PR:

1. abrir operação em estado permitido;
2. registrar início/fim real;
3. registrar área executada;
4. registrar operador/máquina quando suportados pelo domínio existente;
5. registrar insumo/quantidade e confirmar que **nenhum estoque/custo foi alterado**;
6. anexar evidência se a infraestrutura existente suportar;
7. salvar e conferir Planejado × Realizado;
8. criar segundo apontamento na mesma operação;
9. concluir a operação com apontamento válido;
10. revisar/aprovar e confirmar imutabilidade;
11. validar auditor/read-only;
12. validar safra histórica;
13. conferir Lista/Kanban/fluxo 2G sem regressão;
14. repetir o fluxo essencial em celular.

Gerar screenshots das telas alteradas sempre que o ambiente permitir.

---

## 14. Critérios de aceite da FASE 2H

A 2H só pode ser considerada pronta quando:

- existe entidade persistente e segura de apontamento real;
- planejamento e realizado permanecem separados;
- uma operação aceita múltiplos apontamentos sem perder histórico;
- conclusão nova exige execução real mínima válida;
- operações antigas não recebem histórico/apontamento fictício;
- RBAC e isolamento multitenant são server-side;
- safra histórica e operação aprovada são somente leitura;
- concorrência/idempotência impedem duplicação/sobrescrita silenciosa;
- insumos realizados ficam estruturados **sem movimentar estoque/custo**;
- UI desktop/mobile permite registrar e consultar o realizado;
- testes 2H passam;
- regressões 2G/2F passam;
- CI + Vercel + reviews do HEAD final estão verdes;
- homologação visual/funcional foi realizada;
- nenhum finding bloqueante permanece.

---

## 15. Entrega obrigatória do agente

Entregar relatório com o título:

`FASE 2H — GATE PARA REVISÃO`

Incluir:

- branch;
- base exata;
- SHA final;
- URL do PR;
- inventário pré-2H;
- modelo final do apontamento e itens realizados;
- relação Operação → Apontamentos;
- regras por status 2G;
- regra de conclusão;
- RBAC;
- isolamento multitenant;
- concorrência/idempotência;
- auditoria;
- migration/schema;
- arquivos principais alterados;
- testes novos e contagens;
- regressões 2G/2F;
- `npm run check`;
- `npm run test:ci`/CI;
- Vercel;
- Bugbot/reviews/Approval Agent disponíveis;
- homologação desktop/mobile;
- screenshots;
- findings/dívidas restantes;
- confirmação explícita de que **estoque e custos não foram movimentados**;
- recomendação `MERGE` ou `NÃO MERGE`.

Ao terminar: **PARAR. NÃO FAZER MERGE. NÃO INICIAR 2I.**

---

## 16. Prompt curto para entregar junto ao arquivo

```text

Execute a FASE 2H exatamente conforme FASE_2H_APONTAMENTO_REAL_[EXECUCAO.md](http://EXECUCAO.md).

Base obrigatória: main @ cd4906e739c112ce94eaac300785ecfaa8bac430 (pós-2G).

Primeiro inventarie o domínio existente e reutilize os padrões atuais. Implemente o apontamento real separado do planejamento, preserve integralmente a máquina de estados/RBAC/multitenancy da 2G e não crie backfill fictício.

Não movimentar estoque. Não calcular custos. Não implementar mapa, offline, DnD, automação tarefa↔operação ou 2I+.

Execute testes e gates no HEAD final. Ao terminar, entregue “FASE 2H — GATE PARA REVISÃO”, não faça merge e pare.

```

---

## 17. Referência de produto

Este plano deriva do Plano Mestre do AFU, especialmente da Etapa 3:

> Operação = atividade agrícola planejada ou executada. Apontamento = registro real de execução, consumo, tempo e evidência.

E preserva as dependências explícitas do Plano Mestre: **não integrar consumo ao estoque antes de tarefa/apontamento estarem definidos** e **não calcular custo real antes de separar planejamento de execução**.