# AFU Agro — Prompt Mestre para Segurança, Privacidade e Isolamento de Dados

## Plano executável para arquitetura multiusuário e multi-organização

Copie este documento e entregue ao agente responsável pelo código do AFU Agro.

---

# PROMPT PARA O AGENTE EXECUTOR

Você é o arquiteto de software, segurança e dados responsável por garantir que o AFU Agro use corretamente as informações adicionadas por cada cliente, sem misturar propriedades, cultivos, diagnósticos, tarefas, estoques, custos, relatórios ou arquivos entre contas diferentes.

O AFU Agro é uma plataforma de gerenciamento agronômico com:

- Usuários e perfis.
- Organizações, empresas, produtores e equipes.
- Propriedades rurais.
- Terrenos e talhões.
- Safras e cultivos.
- Ocorrências e diagnósticos.
- Recomendações.
- Tarefas e operações.
- Estoque agrícola.
- Custos e orçamentos.
- Máquinas e equipe.
- Fotos, documentos e laudos.
- Métricas e relatórios.
- Dados offline e sincronização.
- Recursos de inteligência artificial.

Sua missão é implementar uma arquitetura **multi-tenant**, na qual os dados sejam isolados por organização e compartilhados somente com usuários autorizados dessa organização.

Não implemente alterações antes de inspecionar o código, o banco, as APIs, a autenticação, o armazenamento de arquivos, o cache e o funcionamento offline existentes.

Não presuma que a simples existência de `userId` em uma tabela garante isolamento. Não presuma que esconder um botão na interface impede acesso. Toda autorização deve ser validada no servidor e, quando possível, reforçada pelo banco de dados.

---

# 1. Objetivo de segurança

O sistema deve garantir que:

1. Um usuário não veja dados de outra organização.
2. Um usuário não altere dados de outra organização.
3. Um usuário não descubra dados privados alterando IDs na URL ou requisição.
4. Um relatório contenha somente dados pertencentes ao escopo autorizado.
5. Fotos e documentos não sejam públicos por padrão.
6. Cache, armazenamento offline e filas de sincronização não misturem contas.
7. Uma IA não receba dados de clientes não autorizados.
8. Um usuário com várias organizações possa alternar entre elas sem misturar informações.
9. Uma equipe possa compartilhar os dados da mesma fazenda conforme suas permissões.
10. Toda ação importante tenha registro auditável.

---

# 2. Correção conceitual obrigatória

Não separar todos os dados exclusivamente por usuário.

Usar esta estrutura:

`Usuário → vínculo com organização → propriedade → talhão → safra → demais registros`

## Por que

Uma propriedade pode ser usada por várias pessoas:

- Proprietário.
- Administrador.
- Gerente.
- Agrônomo.
- Técnico.
- Operador.
- Consultor.
- Auditor.

Se cada registro pertencesse somente ao usuário que o criou, os integrantes da equipe não conseguiriam colaborar. O proprietário lógico dos dados operacionais deve ser a **organização**, enquanto `createdByUserId` registra quem criou o dado.

## Separação correta

### Dados pessoais do usuário

- Nome e conta.
- Preferências de interface.
- Tema.
- Idioma.
- Notificações pessoais.
- Rascunhos privados, quando suportados.
- Dispositivos e sessões.

### Dados compartilhados da organização

- Propriedades.
- Talhões.
- Safras.
- Cultivos.
- Ocorrências.
- Diagnósticos.
- Tarefas.
- Operações.
- Estoque.
- Custos.
- Máquinas.
- Documentos.
- Relatórios.

Esses dados são compartilhados somente com membros autorizados da organização.

---

# 3. Modelo de dados alvo

Inspecione o modelo atual e adapte-o gradualmente. Não faça migração destrutiva.

## Entidades de identidade e acesso

### users

- `id`
- dados de autenticação e perfil
- status
- datas de criação e atualização

### organizations

- `id`
- nome
- tipo: produtor individual, empresa, grupo, cooperativa ou outro
- status
- proprietário principal, quando aplicável
- datas

### organization_memberships

- `id`
- `organizationId`
- `userId`
- `role`
- status: convidado, ativo, suspenso ou removido
- data de entrada
- quem convidou
- permissões adicionais opcionais

Criar restrição para evitar vínculo duplicado do mesmo usuário com a mesma organização.

## Entidades operacionais

As entidades operacionais devem possuir vínculo seguro com a organização. Dependendo do banco e da estratégia de RLS, incluir `organizationId` diretamente nas tabelas de domínio, mesmo quando ele também puder ser descoberto pela propriedade.

### properties

- `id`
- `organizationId`
- nome
- localização
- área
- geometria
- dados técnicos
- status
- `createdByUserId`
- datas

### fields ou terrains

- `id`
- `organizationId`
- `propertyId`
- nome
- área
- geometria
- status
- autor e datas

### seasons

- `id`
- `organizationId`
- `propertyId`
- nome/identificador da safra
- início e fim
- status
- autor e datas

### crops

- `id`
- `organizationId`
- `propertyId`
- `fieldId`
- `seasonId`
- cultura, variedade e dados agronômicos
- status
- autor e datas

### Demais tabelas

Aplicar escopo equivalente a:

- occurrences
- diagnoses
- recommendations
- tasks
- operations
- operation_records
- inventory_items
- inventory_lots
- inventory_movements
- budgets
- costs
- machines
- team_allocations
- reports
- files
- audit_logs

## Regras de consistência

- Um talhão deve pertencer à mesma organização da propriedade.
- Uma safra deve pertencer à mesma organização e propriedade.
- Um cultivo deve referenciar talhão, propriedade e safra compatíveis.
- Uma tarefa não pode ser vinculada a um talhão de outra organização.
- Um movimento de estoque não pode consumir item de outra organização.
- Um relatório não pode combinar dados de organizações diferentes, exceto quando houver recurso administrativo explicitamente autorizado, agregado e auditado.

Aplicar essas regras no servidor e, quando tecnicamente possível, também no banco com chaves, restrições, políticas ou triggers cuidadosamente testadas.

---

# 4. Princípio de autorização

## Nunca confiar no cliente

O cliente pode enviar `organizationId`, `propertyId` ou qualquer outro ID para indicar contexto, mas o servidor deve:

1. Obter o usuário a partir de sessão/token validado.
2. Confirmar que o usuário é membro ativo da organização.
3. Confirmar que o papel permite a ação.
4. Confirmar que a propriedade pertence à organização.
5. Confirmar que todos os registros relacionados pertencem ao mesmo escopo.
6. Somente então executar a consulta ou mutação.

Nunca aceitar um `organizationId` como prova de autorização.

## Camadas de proteção

Implementar proteção em várias camadas:

1. Interface: esconder ou desabilitar ações não permitidas.
2. API: autenticação, escopo e papel obrigatórios.
3. Serviço/repositório: consultas sempre filtradas pelo tenant.
4. Banco: Row-Level Security ou mecanismo equivalente quando suportado.
5. Armazenamento de arquivos: caminhos privados e URLs temporárias.
6. Auditoria: registrar acesso e mutações relevantes.

A interface é conveniência. API e banco são a barreira real.

---

# 5. Papéis e permissões

Criar uma matriz clara, evitando permissões espalhadas em condições improvisadas.

## Proprietário

- Controle completo da organização.
- Gerenciar membros e permissões.
- Ver dados operacionais e financeiros.
- Arquivar propriedades.
- Aprovar operações de alto impacto.

## Administrador da organização

- Gerenciar propriedades, equipes e configurações permitidas.
- Pode ter restrições em faturamento ou transferência de propriedade.

## Gerente

- Planejar e acompanhar operações.
- Ver custos quando autorizado.
- Gerenciar equipe e recursos.
- Aprovar tarefas conforme política.

## Agrônomo/técnico

- Vistorias, ocorrências, diagnósticos e recomendações.
- Criar ou aprovar tarefas agronômicas conforme habilitação.
- Não acessar finanças automaticamente.

## Operador

- Ver tarefas atribuídas.
- Iniciar, pausar e concluir operações.
- Registrar consumo, fotos e ocorrências.
- Não alterar orçamento ou cadastro organizacional.

## Consultor

- Acesso limitado a propriedades, períodos ou módulos definidos.
- Preferir expiração automática do acesso.

## Auditor/visualização

- Leitura somente do escopo autorizado.
- Sem mutações.
- Downloads e exportações podem exigir permissão adicional.

## Administrador da plataforma

Não permitir acesso irrestrito silencioso a dados privados. Se existir suporte excepcional:

- Usar mecanismo de acesso emergencial ou “break glass”.
- Exigir motivo.
- Registrar autor, horário, organização e duração.
- Notificar ou tornar auditável conforme política.
- Usar menor privilégio.

---

# 6. Padrão obrigatório das APIs

Criar camadas ou procedimentos equivalentes a:

1. `publicProcedure`: somente conteúdo realmente público.
2. `authenticatedProcedure`: exige sessão válida.
3. `organizationProcedure`: exige organização ativa e membership.
4. `roleProcedure`: exige papel/permissão.
5. `propertyProcedure`: valida propriedade dentro da organização.

## Exemplo conceitual

```text
requisição
  → validar sessão
  → resolver organização ativa
  → validar membership
  → validar permissão
  → validar propriedade e relações
  → executar consulta já filtrada pelo tenant
  → auditar quando necessário
  → retornar somente campos permitidos
```

## Proibições

- Não usar consultas como `findById(id)` em dados privados sem filtro de organização.
- Não buscar primeiro pelo ID e somente depois decidir se deveria mostrar.
- Não retornar registros de todas as organizações e filtrar no aplicativo.
- Não confiar em filtros do frontend.
- Não usar papel enviado pelo cliente.
- Não deixar endpoints administrativos sem middleware específico.

## Consultas seguras

Preferir conceitos como:

```text
findFirst({
  where: {
    id: requestedId,
    organizationId: authorizedOrganizationId
  }
})
```

Para relações profundas, validar escopo em uma única consulta segura ou transação.

---

# 7. Row-Level Security e banco de dados

Se o banco for PostgreSQL e a arquitetura permitir, implementar Row-Level Security como defesa adicional.

## Objetivo

Mesmo que uma consulta da aplicação esqueça o filtro, o banco deve impedir leitura ou escrita fora do tenant.

## Regras

- Definir contexto de tenant por conexão/transação de maneira segura.
- Criar políticas de SELECT, INSERT, UPDATE e DELETE.
- Validar membership ativa.
- Impedir `organizationId` diferente no INSERT.
- Impedir mover registro para outra organização por UPDATE.
- Não executar APIs comuns com papel que ignore RLS.
- Isolar migrações e tarefas administrativas.
- Testar RLS diretamente no banco.

Se RLS não for compatível com a pilha atual, implementar uma camada de repositórios tenant-aware e criar regra de lint/revisão que proíba acesso direto às tabelas privadas fora dessa camada.

---

# 8. Arquivos, fotos, laudos e relatórios

## Armazenamento privado

- Nunca usar bucket público por padrão para arquivos de clientes.
- Usar chaves com organização e IDs não previsíveis.
- Não depender somente do nome da pasta para segurança.
- Validar autorização antes de gerar URL.
- Usar URLs assinadas e temporárias.
- Aplicar limite de tamanho e tipo.
- Verificar upload malformado.
- Remover metadados sensíveis quando necessário.

## Relatórios

O fluxo correto é:

```text
sessão válida
  → organização autorizada
  → propriedade/safra autorizada
  → consulta filtrada no servidor
  → agregação
  → geração do relatório
  → armazenamento privado
  → URL temporária
  → auditoria do download
```

## Regras dos relatórios

- Todo relatório deve registrar `organizationId`.
- Registrar filtros, propriedade, safra, período e autor.
- Não reutilizar cache de relatório entre tenants.
- Chave de cache deve conter tenant, papel, filtros e versão dos dados.
- Verificar se o usuário ainda possui acesso no momento do download.
- Revogar ou expirar links.
- Não expor nomes, coordenadas, custos ou diagnósticos de outra organização.

---

# 9. Dashboard, métricas e cache

## Dashboard

Todas as consultas devem usar a organização ativa e, quando aplicável:

- Propriedade.
- Safra.
- Talhão.
- Papel do usuário.

## Cache

Uma chave segura deve incluir, conforme o caso:

```text
organizationId + userId/role + propertyId + seasonId + filtros + versão
```

Não usar chave genérica como `dashboard`, `report-2026` ou `property-15` quando o cache atender vários clientes.

## Invalidação

Ao alterar uma operação, invalidar somente:

- Organização correta.
- Propriedade correta.
- Safra correta.
- Métricas afetadas.

Não limpar ou retornar cache global de outro cliente.

---

# 10. Offline e troca de contas

O modo offline é uma área crítica para vazamento de dados.

## Regras obrigatórias

- Banco local separado logicamente por usuário e organização.
- Filas de sincronização identificadas por usuário, organização e dispositivo.
- Nunca enviar fila criada por uma conta após login em outra conta.
- Ao trocar de organização, trocar também o escopo do cache.
- Ao sair da conta, tratar dados pendentes antes de limpar sessão.
- Limpar ou criptografar dados locais conforme política.
- Não deixar fotos acessíveis a outro usuário do mesmo aparelho.
- Não reutilizar IDs locais sem namespace.
- Validar tenant novamente no servidor durante a sincronização.
- Uma fila offline não concede autorização permanente; se o usuário perdeu acesso, a mutação deve ser rejeitada com tratamento compreensível.

## Conflitos

- Estoque deve usar movimentos, não última gravação vence.
- Operação aprovada não pode ser sobrescrita silenciosamente.
- Geometria conflitante exige revisão.
- Registrar conflito e usuário responsável pela resolução.

---

# 11. Inteligência artificial e privacidade

## Dados enviados à IA

- Enviar somente o mínimo necessário.
- Validar autorização antes de preparar o contexto.
- Não misturar histórico de organizações diferentes.
- Não incluir dados financeiros ou pessoais se não forem necessários.
- Registrar qual dado foi usado, para qual finalidade e qual modelo.
- Proteger fotos e coordenadas.

## Memória e contexto

- Memória de um usuário não pode ser usada para outro.
- Memória compartilhada deve pertencer explicitamente à organização.
- Contexto de uma propriedade não pode contaminar outra.
- Limpar contexto ao trocar de organização ou propriedade.

## Treinamento e melhoria

- Não usar dados privados de clientes para treinamento sem base legal, contrato e consentimento apropriados.
- Quando usar dados agregados, aplicar anonimização e verificar risco de reidentificação.
- Permitir política de exclusão/opt-out quando aplicável.
- Não expor dados reais em prompts, logs ou ambientes de teste.

## Saída da IA

- Mostrar que é recomendação ou estimativa.
- Registrar modelo, versão, fonte e confiança.
- Manter vínculo com a organização e propriedade.
- Exigir revisão humana para decisões agronômicas críticas.

---

# 12. Logs, auditoria e observabilidade

## Audit log

Registrar para ações importantes:

- `organizationId`
- `userId`
- papel
- ação
- tipo e ID do recurso
- data/hora
- resultado
- origem/dispositivo
- valores anteriores e novos quando apropriado
- motivo para ações sensíveis

## Não registrar

- Senhas.
- Tokens completos.
- Chaves de API.
- Conteúdo integral de documentos privados.
- Fotos em logs.
- Dados pessoais desnecessários.

## Alertas de segurança

- Tentativas repetidas de acessar IDs de outro tenant.
- Falhas de autorização.
- Exportações incomuns.
- Acesso administrativo excepcional.
- Mudança de papel.
- Exclusão ou arquivamento em massa.
- Erros de RLS.

---

# 13. Migração segura dos dados existentes

Não quebrar usuários ou propriedades atuais.

## Plano de migração

1. Fazer inventário das tabelas e relações atuais.
2. Criar backup verificável.
3. Criar `organizations` e `organization_memberships`.
4. Criar uma organização pessoal para cada proprietário atual quando necessário.
5. Vincular o usuário existente como proprietário.
6. Adicionar `organizationId` inicialmente opcional às tabelas existentes.
7. Preencher `organizationId` usando o proprietário e as relações atuais.
8. Gerar relatório de registros sem proprietário, ambíguos ou órfãos.
9. Corrigir ambiguidades antes de continuar.
10. Adicionar índices compostos.
11. Implantar código que lê e grava com tenant.
12. Comparar quantidades e resultados antigos/novos.
13. Tornar `organizationId` obrigatório onde aplicável.
14. Ativar políticas de banco progressivamente.
15. Remover caminhos antigos somente após período de estabilidade.

## Índices sugeridos

Avaliar índices como:

- `(organizationId, id)`
- `(organizationId, propertyId)`
- `(organizationId, seasonId)`
- `(organizationId, createdAt)`
- `(organizationId, status)`

Criar somente após analisar consultas reais e plano de execução.

## Rollback

- Migrações devem ser reversíveis quando possível.
- Não excluir colunas antigas no mesmo lançamento da migração.
- Manter registro de backfill.
- Ter procedimento de restauração.

---

# 14. Plano de implementação em 10 etapas

## Etapa 1 — Auditoria e ameaça

- Mapear autenticação, APIs, banco, arquivos, cache e offline.
- Listar todas as tabelas privadas.
- Mapear consultas sem filtro de tenant.
- Criar modelo de ameaças: IDOR, vazamento, cache cruzado, arquivo público, escalada de privilégio e sincronização errada.
- Entregar relatório antes de modificar.

### Aceite

- Todas as rotas privadas estão inventariadas.
- Todos os locais que acessam dados privados estão identificados.

## Etapa 2 — Organização e membership

- Criar entidades de organização e vínculo.
- Criar organização ativa na sessão.
- Implementar alternância segura entre organizações.
- Criar matriz de papéis.

### Aceite

- Usuário sem membership não acessa a organização.
- Troca de organização troca completamente o escopo.

## Etapa 3 — Migração do banco

- Adicionar e preencher `organizationId`.
- Criar restrições e índices.
- Resolver órfãos.
- Validar contagens.
- Preparar rollback.

### Aceite

- Nenhum registro privado fica sem tenant.
- Nenhum registro muda de proprietário incorretamente.

## Etapa 4 — Autorização na API

- Criar procedures/middlewares tenant-aware.
- Migrar endpoints.
- Validar recursos relacionados.
- Remover acesso direto inseguro.

### Aceite

- Alterar IDs na requisição retorna não autorizado/não encontrado sem vazar informação.

## Etapa 5 — Repositórios e RLS

- Centralizar consultas privadas.
- Implementar RLS ou defesa equivalente.
- Impedir INSERT/UPDATE cruzado.
- Testar banco diretamente.

### Aceite

- Uma consulta defeituosa da aplicação ainda não consegue ler outro tenant quando RLS estiver habilitado.

## Etapa 6 — Arquivos e relatórios

- Tornar armazenamento privado.
- Gerar URLs temporárias.
- Escopar geração e cache de relatórios.
- Auditar downloads.

### Aceite

- URL expirada ou usuário removido não baixa o arquivo.
- Relatório nunca contém outra organização.

## Etapa 7 — Dashboard, métricas e cache

- Corrigir consultas agregadas.
- Namespacing de cache.
- Invalidar por tenant.
- Validar relatórios e KPIs.

### Aceite

- Dois clientes com IDs iguais em recursos diferentes recebem seus próprios dados.

## Etapa 8 — Offline e dispositivos

- Separar banco local e filas.
- Tratar troca de conta e organização.
- Revalidar autorização na sincronização.
- Criptografar dados sensíveis.

### Aceite

- Login com outra conta no mesmo aparelho não mostra nem envia dados anteriores.

## Etapa 9 — IA, logs e governança

- Escopar contexto da IA.
- Reduzir dados enviados.
- Remover segredos de logs.
- Criar auditoria e alertas.
- Definir política de uso para melhoria de modelos.

### Aceite

- Contexto de IA e memória não atravessam tenants.
- Logs não contêm credenciais ou documentos privados.

## Etapa 10 — Testes, rollout e monitoramento

- Executar testes automatizados de isolamento.
- Implantar gradualmente com feature flag quando necessário.
- Monitorar falhas.
- Criar plano de incidente.
- Documentar operação e suporte.

### Aceite

- Suite de segurança passa.
- Métricas não indicam registros órfãos ou acesso cruzado.
- Rollback foi ensaiado.

---

# 15. Testes obrigatórios de isolamento

Criar pelo menos:

## Testes de leitura

- Usuário A tenta abrir propriedade de B pelo ID.
- Usuário A lista talhões passando `organizationId` de B.
- Usuário A tenta baixar relatório de B.
- Usuário A tenta acessar foto por URL conhecida.
- Usuário removido tenta usar URL assinada antiga.

## Testes de escrita

- Usuário A tenta editar propriedade de B.
- Usuário A cria tarefa usando talhão de B.
- Usuário A tenta movimentar estoque de B.
- Usuário A tenta associar cultivo de A a safra de B.
- Operador tenta alterar orçamento.
- Leitor tenta executar mutação.

## Testes de enumeração

- IDs sequenciais diferentes.
- Respostas não devem confirmar se recurso privado de outro tenant existe.
- Mensagens e tempos não devem facilitar enumeração desnecessária.

## Testes de cache

- Acessar dashboard de A e depois B.
- Gerar mesmo relatório com mesmos filtros para A e B.
- Alternar organizações rapidamente.
- Invalidar dados de A sem afetar ou revelar B.

## Testes offline

- Criar operação offline em A, sair e entrar em B.
- Trocar organização com fila pendente.
- Remover membership antes da sincronização.
- Dois dispositivos consumindo o mesmo estoque.

## Testes de arquivos

- Modificar chave/ID do arquivo.
- Reutilizar URL após expiração.
- Compartilhar URL com usuário sem membership.
- Fazer upload com tipo e tamanho inválidos.

## Testes de relatório

- Relatório por propriedade.
- Relatório consolidado da organização.
- Filtro por safra.
- Usuário sem permissão financeira.
- Cache e regeneração.

## Testes de IA

- Trocar organização durante uma conversa.
- Solicitar dados de propriedade não autorizada.
- Verificar logs e prompts.
- Confirmar que memória privada não atravessa usuários.

---

# 16. Critérios globais de conclusão

O trabalho somente está concluído quando:

- Todas as tabelas privadas possuem escopo de organização seguro.
- Toda API privada valida sessão, membership, papel e recurso.
- Consultas não dependem de filtros do frontend.
- Arquivos são privados e usam autorização para download.
- Relatórios são gerados no escopo correto.
- Cache contém namespace de tenant.
- Offline não mistura contas.
- IA não mistura contextos.
- Logs não expõem segredos.
- Migração preservou todos os dados existentes.
- Testes de leitura e escrita cruzada falham de forma segura.
- Ações administrativas são auditadas.
- Documentação explica como criar uma nova função sem quebrar isolamento.
- Um revisor de segurança independente aprovou as áreas críticas ou registrou pendências.

---

# 17. Formato de resposta obrigatório do agente

Antes de implementar, responda:

1. Arquitetura atual encontrada.
2. Vulnerabilidades ou lacunas encontradas.
3. Modelo de tenant proposto.
4. Tabelas e APIs afetadas.
5. Migração planejada.
6. Estratégia de RLS/autorização.
7. Testes que serão criados.
8. Riscos e rollback.

Durante a implementação, mantenha uma lista de tarefas com apenas uma etapa em andamento.

Após cada etapa, responda:

1. O que foi alterado.
2. Evidência de que funciona.
3. Testes executados.
4. Tentativas de acesso cruzado testadas.
5. Migrações realizadas.
6. Riscos restantes.
7. Decisão de avançar ou bloquear a próxima etapa.

Não declare segurança completa somente porque a interface escondeu dados. Não avance se os testes de isolamento falharem.

