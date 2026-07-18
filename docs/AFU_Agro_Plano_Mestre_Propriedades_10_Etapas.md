# AFU Agro — Plano Mestre de Evolução do Gerenciamento de Propriedades

## Plano operacional em 10 etapas para execução por agente de IA

**Produto:** AFU Agro — Analisador Fitotécnico Universal  
**Superfície avaliada:** aplicação web/mobile em `https://afu-mobile-web.vercel.app/`  
**Escopo principal:** gerenciamento de propriedades, fazendas, sítios, áreas de cultivo, terrenos, talhões, cultivos, tarefas, operações, mapas, recursos, custos, monitoramento e inteligência agronômica.  
**Objetivo estratégico:** transformar o painel atual, predominantemente cadastral, em uma central operacional e decisória que continue simples para iniciantes e seja capaz de atender propriedades e grupos agrícolas de grande porte.

---

# 1. Instrução principal para o agente executor

Você é o agente técnico e de produto responsável por evoluir o AFU Agro de maneira incremental, segura, verificável e compatível com o sistema existente.

Seu trabalho não é apenas adicionar telas. Você deve conectar dados, decisões e operações em um fluxo coerente:

`Propriedade → Talhão → Safra → Cultivo → Ocorrência → Diagnóstico → Recomendação → Tarefa → Operação executada → Consumo → Custo → Resultado`

Execute uma etapa por vez. Não avance para a etapa seguinte enquanto os critérios de aceite da etapa atual não estiverem atendidos ou enquanto houver erro crítico conhecido.

Antes de modificar qualquer código:

1. Inspecione a arquitetura, rotas, componentes, banco, APIs, autenticação, permissões e testes existentes.
2. Localize e reutilize componentes, estilos e padrões já usados no AFU Agro.
3. Registre o comportamento atual que precisa ser preservado.
4. Identifique alterações locais ou código do usuário que não pertençam à tarefa e não os sobrescreva.
5. Planeje migrações reversíveis para qualquer mudança de dados.
6. Explique as decisões que alterem estrutura, regras de negócio ou experiência do usuário.

Ao finalizar cada tarefa:

1. Execute testes proporcionais ao risco.
2. Teste estados com dados, sem dados, carregando, erro e offline quando aplicável.
3. Teste pelo menos um usuário iniciante e um cenário de grande operação.
4. Verifique desktop e celular.
5. Verifique permissões e isolamento entre propriedades.
6. Registre o que foi implementado, o que foi adiado e quais riscos permanecem.
7. Produza evidências visuais das telas alteradas.

---

# 2. Contexto atual que deve ser preservado

O AFU Agro já possui ou demonstra possuir:

- Autenticação e perfis de usuário.
- Dashboard com Propriedades, Cultivos, Diagnóstico, Laboratório, Laudos, Eventos, Marketplace, Clima e Materiais.
- Cadastro de propriedades.
- Cadastro e gerenciamento de terrenos/talhões.
- Cadastro de cultivos.
- Mapa com coordenadas e marcador da propriedade.
- Cartão de clima.
- Informações cadastrais da propriedade.
- Área total, área mapeada e área disponível.
- Estrutura `calendario_cuidados`, usada como agenda agrícola.
- Diagnósticos e fluxo relacionado à saúde das plantas.
- Marketplace com estoque de produtos comerciais.
- Diferentes perfis, incluindo produtor, comprador, parceiro e administrador.

O agente deve evoluir essas partes, não criar módulos duplicados sem antes verificar se existe uma base reutilizável.

## Problemas confirmados na avaliação

- O painel da propriedade é uma página longa, com assuntos empilhados e sem navegação interna clara.
- O painel responde melhor “o que está cadastrado” do que “o que precisa ser feito”.
- O mapa funciona principalmente como localização e ainda não como ferramenta espacial de manejo.
- Agenda, diagnóstico, estoque e outros recursos estão fragmentados entre módulos.
- Ações prioritárias, tarefas, riscos, custos e resultados não estão reunidos no contexto da fazenda.
- Componentes interativos web apresentam riscos de semântica e acessibilidade.
- O carregamento inicial pode exibir o dashboard antes de concluir a verificação de sessão.
- O sistema precisa diferenciar dados permanentes da propriedade dos dados temporais de cada safra.

---

# 3. Princípios obrigatórios

## 3.1 Simplicidade progressiva

- Mostrar primeiro o essencial.
- Revelar recursos avançados conforme a necessidade.
- Não obrigar o pequeno produtor a preencher dados empresariais complexos.
- Não limitar o grande produtor a cards simplificados sem filtros, comparação e ações em massa.

## 3.2 Contexto sempre visível

Toda tela operacional deve deixar claro:

- Propriedade selecionada.
- Safra/período selecionado.
- Talhão ou conjunto de talhões, quando aplicável.
- Status de sincronização.
- Data da última atualização.

## 3.3 Fonte única de verdade

Não duplicar a mesma informação em módulos independentes. Uma operação concluída deve atualizar, quando aplicável:

- Progresso da tarefa.
- Histórico do talhão.
- Estoque.
- Custo.
- Agenda.
- Indicadores.
- Rastreabilidade.

## 3.4 Segurança agronômica

- Diagnóstico automatizado é apoio à decisão, não confirmação absoluta.
- Toda recomendação deve mostrar fonte, dados usados, data e confiança.
- Recomendações de aplicação, dose, produto, intervalo de segurança ou restrição legal devem exigir validações adequadas e, quando necessário, aprovação de profissional habilitado.
- O sistema não deve executar automaticamente uma aplicação agrícola de risco.

## 3.5 Preservação do histórico

- Registros operacionais não devem ser apagados silenciosamente.
- Preferir arquivamento, cancelamento e correção auditável.
- Registrar autor, data, valor anterior, valor novo e motivo de alterações importantes.

## 3.6 Offline desde a arquitetura

Mesmo antes da implementação completa do modo offline, IDs, estados, anexos e APIs devem ser preparados para sincronização futura.

## 3.7 Acessibilidade e responsividade

- Não depender apenas de cor.
- Áreas de toque com pelo menos 44 × 44 px quando possível.
- Texto principal legível em celular.
- Foco visível e navegação por teclado no web.
- Controles com nome e função acessíveis.

---

# 4. Hierarquia de dados obrigatória

O agente deve verificar o modelo existente e aproximá-lo gradualmente desta hierarquia, evitando migrações destrutivas:

1. **Organização ou conta** — pessoa, empresa, grupo ou cooperativa.
2. **Propriedade** — fazenda, sítio ou unidade rural.
3. **Área espacial** — perímetro geral da propriedade.
4. **Talhão/terreno** — unidade operacional dentro da propriedade.
5. **Safra/ciclo** — período produtivo que agrupa planejamento e resultados.
6. **Cultivo** — cultura/variedade implantada em um talhão dentro de uma safra.
7. **Ocorrência** — observação de campo, problema, anomalia ou evento georreferenciado.
8. **Diagnóstico** — avaliação humana, laboratorial ou automatizada da ocorrência.
9. **Recomendação** — proposta de ação com evidência, responsável e aprovação.
10. **Tarefa** — trabalho planejado e atribuído.
11. **Operação/apontamento** — execução real da tarefa ou atividade.
12. **Movimento de recurso** — consumo de insumo, máquina, combustível e mão de obra.
13. **Custo/receita** — efeito econômico relacionado à safra, cultivo, talhão ou operação.
14. **Resultado** — produtividade, resposta ao manejo, conclusão e aprendizado.

## Regra temporal

- Nome, localização e perímetro são dados da propriedade.
- Solo pode ter informação geral, mas análises devem ser datadas, localizadas e versionadas.
- Cultura, plantio, operações, custos e produtividade devem pertencer a uma safra/ciclo.
- Nunca sobrescrever uma safra anterior para representar a safra atual.

---

# 5. Arquitetura de navegação alvo

## No celular

Abas primárias dentro da propriedade:

1. Visão geral
2. Mapa
3. Operações
4. Tarefas
5. Mais

Dentro de **Mais**:

- Talhões
- Cultivos e safras
- Monitoramento
- Custos e resultados
- Recursos e estoque
- Documentos
- Configurações

## No computador/tablet

Permitir menu lateral ou abas amplas:

- Visão geral
- Mapa
- Talhões
- Cultivos e safras
- Operações
- Tarefas
- Monitoramento
- Custos e resultados
- Recursos
- Documentos
- Configurações

---

# ETAPA 1 — Fundação técnica, carregamento, acessibilidade e consistência

## Objetivo

Preparar uma base segura para todas as outras mudanças, corrigindo problemas transversais antes de ampliar o produto.

## Por que esta etapa vem primeiro

Adicionar novas funções sobre carregamentos ambíguos, controles sem semântica, estados inconsistentes ou modelo de dados indefinido aumentaria o retrabalho. Esta etapa reduz o risco das nove seguintes.

## Tarefas e subtarefas

### 1.1 Mapear o sistema atual

- Inventariar rotas, telas, serviços, hooks, entidades, tabelas e endpoints.
- Identificar o provedor de autenticação e como a sessão é restaurada.
- Mapear Propriedade, Terreno/Talhão, Cultivo, Calendário, Diagnóstico, Marketplace e usuários.
- Identificar componentes reutilizáveis: cards, cabeçalhos, modais, formulários, mapas, chips e estados de carregamento.
- Criar uma matriz “existe / parcial / ausente / duplicado”.

### 1.2 Definir contratos e vocabulário

- Padronizar os termos “propriedade”, “talhão”, “safra”, “cultivo”, “tarefa”, “operação”, “ocorrência” e “diagnóstico”.
- Decidir se “terreno” e “talhão” representam a mesma entidade ou entidades diferentes.
- Não renomear dados persistidos sem migração e compatibilidade.
- Documentar unidades padrão: hectare, quilograma, litro, hora, moeda e produtividade.

### 1.3 Corrigir a inicialização

- Criar estado explícito `verificando_sessao`.
- Não renderizar dashboard com zeros antes de confirmar autenticação.
- Mostrar uma tela neutra com mensagem clara.
- Separar os estados `autenticado`, `não autenticado`, `erro de autenticação` e `offline com sessão local`.
- Implementar limite de espera e ação “Tentar novamente”.

### 1.4 Padronizar estados das telas

Criar componentes reutilizáveis para:

- Carregando.
- Vazio inicial com chamada para ação.
- Vazio após filtros.
- Erro recuperável.
- Erro sem permissão.
- Sem conexão.
- Conteúdo desatualizado.
- Sincronização pendente.

### 1.5 Corrigir acessibilidade web/mobile

- Usar controles semânticos ou propriedades equivalentes como `accessibilityRole`.
- Associar rótulos aos campos.
- Adicionar nomes acessíveis a ícones.
- Corrigir ordem de foco.
- Garantir uso por teclado.
- Criar foco visível.
- Aumentar texto excessivamente pequeno.
- Verificar contraste de texto, bordas, chips e estados.
- Não usar somente vermelho/verde para status.
- Padronizar área mínima de toque.

### 1.6 Criar base de qualidade

- Configurar captura de erros da aplicação sem expor dados sensíveis.
- Adicionar testes básicos das rotas principais.
- Criar teste do fluxo de sessão.
- Criar teste dos estados vazio, erro e carregamento.
- Documentar convenções para componentes novos.

## Critérios de aceite

- Usuário não vê dashboard falso antes da sessão ser resolvida.
- Todas as telas principais possuem estados de carregamento, vazio e erro compreensíveis.
- Login e navegação principal podem ser usados por teclado no web.
- Campos possuem rótulos associados e controles possuem nomes acessíveis.
- Nenhuma mudança quebra o fluxo atual de propriedades, cultivos ou diagnóstico.
- Existe documento com o modelo atual e as decisões de nomenclatura.

## Entregáveis

- Inventário técnico.
- Glossário de domínio.
- Componentes de estado.
- Correções de acessibilidade prioritárias.
- Testes de fundação.
- Lista de dívida técnica encontrada.

---

# ETAPA 2 — Novo painel da propriedade com navegação contextual

## Objetivo

Transformar a tela atual da propriedade em um centro organizado, preservando mapa, informações, talhões e cultivos existentes.

## Por que esta etapa é necessária

Hoje os conteúdos são empilhados. Conforme novas funções forem adicionadas, a página ficaria longa e difícil. A navegação contextual estabelece onde cada função futura ficará.

## Tarefas e subtarefas

### 2.1 Criar cabeçalho persistente da propriedade

Mostrar:

- Nome da propriedade.
- Município/UF.
- Safra selecionada.
- Status geral.
- Última atualização/sincronização.
- Seletor de propriedade.
- Botão `+ Registrar`.
- Menu de ações administrativas.

O menu administrativo deve conter editar, exportar, arquivar e, com proteção adicional, excluir.

### 2.2 Implementar abas responsivas

- Criar estrutura de navegação descrita na seção 5.
- Preservar a aba selecionada ao voltar de uma tela de detalhe.
- Permitir link direto para uma aba quando tecnicamente possível.
- Manter propriedade e safra no contexto.
- Não recarregar todos os dados ao trocar de aba sem necessidade.

### 2.3 Reorganizar o conteúdo existente

- Mover informações cadastrais detalhadas para Configurações.
- Manter resumo cadastral pequeno na Visão geral.
- Colocar mapa completo na aba Mapa.
- Colocar lista completa de talhões em Talhões.
- Colocar cultivos em Cultivos e safras.
- Manter atalhos na Visão geral.

### 2.4 Criar seletor de safra

- Mostrar safra atual por padrão.
- Permitir consultar safras anteriores sem misturar dados.
- Indicar quando o usuário está vendo histórico.
- Não permitir que editar o passado altere a safra atual sem confirmação e permissão.
- Criar ação para iniciar nova safra a partir de planejamento anterior, sem copiar execuções e custos realizados.

### 2.5 Criar API agregadora da visão geral

Retornar, em uma consulta coerente:

- Resumo de área.
- Cultivos ativos.
- Tarefas.
- Alertas.
- Clima.
- Atividade recente.
- Custos resumidos quando existirem.
- Qualidade/atualização dos dados.

Evitar dezenas de consultas independentes que façam cards piscarem em tempos diferentes.

## Critérios de aceite

- Usuário chega a qualquer seção da fazenda em até dois toques após abri-la.
- Cabeçalho sempre informa propriedade e safra.
- Voltar de um talhão mantém contexto e posição lógica.
- Informações históricas não são misturadas à safra atual.
- Tela funciona em celular, tablet e desktop.
- Rotas e recursos antigos continuam acessíveis.

## Entregáveis

- Novo shell do painel da propriedade.
- Abas responsivas.
- Seletor de safra.
- API/serviço agregador.
- Migração segura de rotas ou compatibilidade com rotas antigas.

---

# ETAPA 3 — Integrar agenda, tarefas e operações

## Objetivo

Reaproveitar `calendario_cuidados` e evoluí-lo para um fluxo operacional completo ligado à propriedade, talhão, cultivo e safra.

## Por que esta etapa é necessária

Uma agenda apenas informa uma data. Uma gestão operacional precisa informar o que fazer, onde, quem fará, com quais recursos, qual foi o resultado e se o trabalho foi aprovado.

## Definições obrigatórias

- **Evento:** algo que acontece ou deve ser lembrado.
- **Tarefa:** trabalho atribuído com prazo e responsável.
- **Operação:** atividade agrícola planejada ou executada.
- **Apontamento:** registro real de execução, consumo, tempo e evidência.

Não usar os quatro conceitos como sinônimos.

## Tarefas e subtarefas

### 3.1 Evoluir o modelo de dados

Uma tarefa deve admitir:

- Organização, propriedade, safra, cultivo e talhão.
- Tipo de operação.
- Título e instruções.
- Prioridade.
- Status.
- Responsável e equipe.
- Data prevista, janela e recorrência.
- Área planejada.
- Máquina, implemento e insumos planejados.
- Checklist.
- Dependências.
- Fotos, documentos e localização.
- Aprovação.
- Motivo de cancelamento.

Um apontamento deve admitir:

- Horário real de início e fim.
- Área executada.
- Quantidade real de insumos.
- Máquina e operador reais.
- Condições observadas.
- Evidências.
- Pausas e problemas.
- Resultado imediato.

### 3.2 Implementar ciclo de estados

Estados mínimos:

`Planejada → Liberada → Em execução → Pausada → Concluída → Aprovada`

Saídas alternativas:

- Cancelada.
- Bloqueada.
- Reaberta.

Definir quem pode realizar cada transição.

### 3.3 Migrar a agenda existente

- Mapear eventos atuais para o novo modelo.
- Preservar IDs e histórico sempre que possível.
- Não converter lembretes simples em operações concluídas.
- Marcar origem do registro como `calendario_legado`.
- Validar quantidade antes e depois da migração.

### 3.4 Criar interfaces operacionais

- Lista.
- Calendário.
- Kanban por status.
- Mapa.
- Visão por responsável.
- Visão por máquina.
- Filtros por propriedade, talhão, cultura, período, status e prioridade.

### 3.5 Criar modelos reutilizáveis

Templates para:

- Plantio.
- Adubação.
- Irrigação.
- Pulverização.
- Vistoria.
- Amostragem.
- Colheita.
- Manutenção.

Template sugere campos, mas não deve inserir automaticamente dose ou recomendação de risco sem validação.

### 3.6 Permitir operações em massa

Para grandes produtores:

- Criar tarefa para múltiplos talhões.
- Atribuir equipe em massa.
- Alterar data e prioridade em massa.
- Separar uma tarefa geral em subtarefas por talhão.
- Consolidar progresso sem perder registros individuais.

## Critérios de aceite

- Uma tarefa pode ser criada a partir da propriedade ou do talhão.
- Operador consegue iniciar, pausar e concluir trabalho.
- Supervisor consegue revisar e aprovar.
- Execução real fica separada do planejamento.
- Histórico não é perdido em cancelamentos e correções.
- Agenda antiga continua consultável após migração.
- Ações em massa não misturam dados de propriedades diferentes.

## Entregáveis

- Modelo de tarefa/operação/apontamento.
- Migração da agenda.
- Telas de lista, calendário e execução.
- Templates.
- Permissões e auditoria.

---

# ETAPA 4 — “Hoje na fazenda” e “Atenção necessária”

## Objetivo

Fazer a Visão geral responder rapidamente o que está acontecendo e o que exige ação.

## Por que esta etapa é necessária

Contadores como “2 cultivos” informam volume, mas não prioridade. O usuário precisa transformar informação em decisão.

## Tarefas e subtarefas

### 4.1 Criar bloco “Hoje”

Mostrar:

- Tarefas de hoje.
- Tarefas atrasadas.
- Operações em andamento.
- Responsáveis.
- Progresso diário.
- Clima relevante.
- Próximos eventos.
- Máquinas indisponíveis quando o módulo existir.

### 4.2 Criar motor inicial de alertas por regras

Começar com regras determinísticas, antes de IA preditiva:

- Tarefa atrasada.
- Tarefa bloqueada.
- Talhão sem vistoria dentro do intervalo configurado.
- Cultivo sem informação obrigatória.
- Chuva ou vento acima do limite configurado para operação planejada.
- Estoque insuficiente para tarefa.
- Máquina com manutenção vencida.
- Custo acima do orçamento.
- Dado desatualizado ou falha de sincronização.
- Documento pendente.

### 4.3 Padronizar um alerta

Todo alerta deve conter:

- Título compreensível.
- Propriedade/talhão afetado.
- Gravidade: informativo, atenção, alto ou crítico.
- Motivo.
- Fonte.
- Data/hora.
- Ação recomendada.
- Botão para resolver ou criar tarefa.
- Opções adiar, marcar como visto e encerrar com motivo.

### 4.4 Evitar fadiga de alertas

- Agrupar alertas repetidos.
- Não repetir o mesmo alerta a cada atualização.
- Priorizar por impacto e urgência.
- Permitir configuração por usuário e papel.
- Manter histórico de resolução.

### 4.5 Criar feed de atividade recente

Registrar de modo legível:

- Tarefa criada/concluída.
- Vistoria registrada.
- Diagnóstico confirmado.
- Insumo consumido.
- Documento anexado.
- Alteração importante.

### 4.6 Personalização controlada

- Permitir reorganizar ou ocultar cards.
- Fornecer configuração padrão por perfil.
- Não permitir ocultar alertas críticos obrigatórios.

## Critérios de aceite

- Usuário entende a situação da fazenda em menos de 30 segundos.
- Cada alerta leva a uma ação possível.
- Alertas possuem fonte e horário.
- Tarefas atrasadas não são apresentadas apenas como um número sem contexto.
- Falha do clima não bloqueia o restante do painel.
- Perfil operador vê trabalho; perfil gestor vê consolidação.

## Entregáveis

- Cards “Hoje” e “Atenção necessária”.
- Motor de regras inicial.
- Feed de atividades.
- Preferências de painel.

---

# ETAPA 5 — Mapa operacional com propriedades e talhões em polígonos

## Objetivo

Evoluir o mapa de marcador para uma ferramenta espacial de cadastro, monitoramento e execução.

## Por que esta etapa é necessária

Coordenadas indicam onde fica a propriedade, mas não informam limites, área, sobreposição, zonas ou localização de problemas.

## Tarefas e subtarefas

### 5.1 Definir padrão geoespacial

- Armazenar geometria em formato compatível com GeoJSON.
- Usar referência WGS84/EPSG:4326 para intercâmbio.
- Calcular área com método geodésico ou projeção apropriada; não calcular hectares diretamente sobre graus.
- Versionar geometrias.
- Registrar origem: desenhada, GPS, importada ou integração.

### 5.2 Perímetro da propriedade

- Desenhar no mapa.
- Editar vértices.
- Importar arquivo.
- Calcular área.
- Comparar área declarada e área geométrica.
- Avisar divergências sem sobrescrever automaticamente.

### 5.3 Polígonos de talhões

- Criar dentro da propriedade.
- Validar sobreposição.
- Validar geometria inválida.
- Permitir dividir e unir com preservação de histórico.
- Calcular área disponível.
- Impedir exclusão destrutiva quando houver cultivo ou operação relacionada.

### 5.4 Importação e exportação

Prioridades:

- GeoJSON.
- KML.
- Shapefile compactado.
- CSV de pontos quando aplicável.

Validar sistema de coordenadas, tamanho, campos, geometria e duplicidade antes de confirmar.

### 5.5 Camadas

- Limites.
- Talhões por status.
- Cultivos.
- Ocorrências.
- Vistorias.
- Operações planejadas e realizadas.
- Solo.
- Imagens e índices futuros.
- Sensores futuros.

### 5.6 Interação

- Tocar em talhão abre resumo.
- Filtros por safra, cultivo e status.
- Legenda clara.
- Comparação temporal.
- Ações “Criar ocorrência” e “Criar tarefa aqui”.
- Seleção múltipla para grandes propriedades.

## Critérios de aceite

- Usuário desenha ou importa propriedade e talhões.
- Área calculada mostra método e unidade.
- Sistema detecta sobreposição e geometria inválida.
- Talhão no mapa abre seu contexto correto.
- Alterações geométricas têm histórico.
- Mapa permanece utilizável em celular.

## Entregáveis

- Modelo geoespacial.
- Editor de perímetro/talhões.
- Importadores/exportadores.
- Camadas e legenda.
- Validações topológicas.

---

# ETAPA 6 — Fluxo diagnóstico → ocorrência → tarefa → resultado

## Objetivo

Conectar o analisador fitotécnico à operação da fazenda e medir se a ação produziu resultado.

## Por que esta etapa é necessária

Um diagnóstico isolado vira apenas um laudo. O valor operacional aparece quando ele é associado ao local, confirmado, transformado em ação e acompanhado.

## Tarefas e subtarefas

### 6.1 Criar ocorrência de campo

Campos mínimos:

- Propriedade, talhão, cultivo e safra.
- Ponto ou área no mapa.
- Data/hora.
- Categoria.
- Descrição.
- Fotos, áudio e documentos.
- Contagem, incidência ou severidade quando aplicável.
- Responsável pela observação.
- Condições e método de amostragem.

### 6.2 Associar diagnóstico

Registrar:

- Origem: IA, técnico, agrônomo ou laboratório.
- Hipóteses.
- Evidências observadas.
- Dados ausentes.
- Confiança.
- Versão do modelo ou método.
- Responsável pela confirmação.
- Status: preliminar, confirmado, inconclusivo ou descartado.

### 6.3 Criar recomendação explicável

Mostrar:

- O que foi identificado.
- Por que a recomendação foi gerada.
- Dados usados.
- Limitações.
- Alternativas.
- Urgência.
- Necessidade de confirmação profissional.
- Fonte técnica e data quando disponível.

### 6.4 Converter recomendação em tarefa

- Usuário revisa antes de criar.
- Escolhe talhões/área.
- Define responsável e prazo.
- Confirma recursos.
- Mantém vínculo com ocorrência e diagnóstico.
- Alterações posteriores não apagam a recomendação original.

### 6.5 Fazer acompanhamento

- Agendar nova vistoria.
- Comparar antes/depois.
- Registrar resolvido, melhorou, estável ou piorou.
- Calcular tempo até resposta.
- Associar custo da intervenção.
- Permitir reabrir a ocorrência.

### 6.6 Criar salvaguardas

- Não apresentar hipótese como certeza.
- Não gerar automaticamente prescrição legal.
- Exigir campos e aprovação conforme risco.
- Registrar consentimento e autoria de decisões.
- Proteger fotos e localização conforme permissões.

## Critérios de aceite

- Diagnóstico pode ser ligado a talhão e safra.
- Recomendação informa confiança e origem.
- Tarefa criada preserva vínculo completo.
- Nova vistoria mede o desfecho.
- Usuário consegue consultar todo o histórico causal.
- Ações agronômicas críticas exigem revisão adequada.

## Entregáveis

- Ocorrências georreferenciadas.
- Diagnósticos versionados.
- Recomendações explicáveis.
- Conversão em tarefa.
- Acompanhamento de resultado.

---

# ETAPA 7 — Estoque agrícola integrado às operações

## Objetivo

Criar estoque de insumos e materiais da fazenda, separado do estoque comercial do Marketplace, mas preparado para integrações futuras.

## Por que esta etapa é necessária

O Marketplace controla itens oferecidos comercialmente. A operação agrícola precisa controlar compra, lote, armazenamento, reserva, consumo e rastreabilidade.

## Tarefas e subtarefas

### 7.1 Definir entidades

- Item/insumo.
- Categoria.
- Unidade de medida.
- Lote.
- Validade.
- Fornecedor.
- Local de armazenamento.
- Saldo.
- Movimento.
- Reserva.
- Inventário/ajuste.
- Documento e ficha de segurança quando aplicável.

### 7.2 Tipos de movimento

- Entrada por compra.
- Transferência.
- Reserva para tarefa.
- Consumo por operação.
- Devolução.
- Perda/avaria.
- Ajuste de inventário.
- Saída comercial quando integrada.

Todo movimento deve ter autor, data, motivo e referência.

### 7.3 Regras de unidade

- Definir unidade base.
- Permitir conversões configuradas e auditáveis.
- Não misturar kg, L, unidade e embalagem sem fator de conversão.
- Mostrar quantidade e unidade em todos os relatórios.

### 7.4 Integrar com tarefas

- Planejamento reserva insumo.
- Aprovação valida disponibilidade.
- Execução registra consumo real.
- Diferença planejado/real exige justificativa quando exceder limite.
- Cancelamento libera reserva.
- Correção gera movimento reverso, não alteração silenciosa.

### 7.5 Alertas

- Estoque mínimo.
- Insuficiente para tarefa.
- Validade próxima.
- Lote bloqueado.
- Divergência de inventário.
- Material sem localização.

### 7.6 Recursos para escala

- Vários depósitos.
- Transferências entre propriedades.
- Leitura por QR/barcode futura.
- Inventário em massa.
- Importação por planilha.
- Permissões por depósito.

## Critérios de aceite

- Marketplace e estoque agrícola não compartilham saldo indevidamente.
- Tarefa reserva e operação consome.
- Saldo nunca muda sem movimento correspondente.
- Unidades são consistentes.
- Histórico de lote e consumo é rastreável.
- Correções preservam auditoria.

## Entregáveis

- Cadastro de insumos.
- Depósitos e lotes.
- Movimentação e reservas.
- Integração com tarefas.
- Alertas e relatórios básicos.

---

# ETAPA 8 — Custos, máquinas, equipe e resultados econômicos

## Objetivo

Relacionar operações e recursos ao resultado econômico da propriedade, safra, cultivo e talhão.

## Por que esta etapa é necessária

Grandes e pequenos produtores precisam saber não apenas o que foi realizado, mas quanto custou, onde houve desvio e qual produtividade paga a operação.

## Tarefas e subtarefas

### 8.1 Estruturar custos

- Centro de custo.
- Orçamento.
- Despesa.
- Custo de insumo.
- Custo de máquina.
- Custo de combustível.
- Custo de mão de obra.
- Serviço terceirizado.
- Rateio.
- Receita e produção.

### 8.2 Orçamento por safra

- Planejar por propriedade, cultura e talhão.
- Definir custo previsto por hectare.
- Comparar comprometido, reservado e realizado.
- Versionar revisões do orçamento.
- Não apagar orçamento inicial ao revisar.

### 8.3 Máquinas e implementos

- Cadastro.
- Disponibilidade.
- Horímetro/quilometragem.
- Manutenção preventiva e corretiva.
- Combustível.
- Operador.
- Capacidade e largura de trabalho.
- Custo por hora.
- Histórico de uso por operação.

### 8.4 Equipe

- Funções e permissões.
- Alocação em tarefas.
- Horas planejadas e realizadas.
- Produtividade operacional.
- Não usar métricas individuais sem contexto de qualidade e condições.

### 8.5 Cálculo operacional

Calcular com regras documentadas:

- Custo por hectare.
- Custo por talhão.
- Custo por cultura.
- Custo por operação.
- Planejado versus realizado.
- Hectares por hora.
- Consumo por hectare.
- Produtividade de equilíbrio.
- Margem estimada e realizada.

### 8.6 Evitar dupla contabilização

- Definir se uma compra entra no caixa, estoque ou custo da safra em cada momento.
- Consumo transfere valor do estoque para o custo operacional.
- Rateios devem somar ao total original.
- Correções devem manter trilha.

## Critérios de aceite

- Operação concluída pode gerar custos de insumo, máquina e mão de obra.
- Totais fecham com seus detalhamentos.
- Usuário consegue ver planejado versus realizado.
- Indicadores mostram período, safra, unidade e fonte.
- Permissões financeiras impedem acesso indevido.
- Comparação entre propriedades usa os mesmos critérios.

## Entregáveis

- Orçamento da safra.
- Cadastro de máquinas e equipe.
- Apropriação de custos.
- Indicadores econômicos.
- Relatórios por propriedade, talhão, cultura e operação.

---

# ETAPA 9 — Offline, sincronização, segurança e confiabilidade

## Objetivo

Permitir trabalho de campo sem internet e sincronizar posteriormente sem perda ou duplicação de dados.

## Por que esta etapa é necessária

Conectividade rural é irregular. Se o usuário não puder registrar uma operação no campo, o sistema perde dados justamente no momento mais importante.

## Tarefas e subtarefas

### 9.1 Arquitetura local

- Banco local apropriado à plataforma.
- IDs gerados no dispositivo, preferencialmente UUID.
- Fila de mutações.
- Cache de propriedades, talhões, cultivos e tarefas atribuídas.
- Anexos armazenados separadamente até envio.
- Criptografia e armazenamento seguro para dados sensíveis e sessão.

### 9.2 Estados de sincronização

Todo registro relevante deve admitir:

- Somente local.
- Aguardando envio.
- Sincronizando.
- Sincronizado.
- Conflito.
- Erro.

Mostrar esses estados ao usuário em linguagem simples.

### 9.3 Idempotência

- Repetir uma requisição não pode criar duas operações.
- Cada mutação deve ter identificador único.
- Servidor deve reconhecer tentativa já processada.
- Upload de anexo deve poder continuar ou reiniciar de forma segura.

### 9.4 Conflitos

Definir política por tipo de dado:

- Anotação nova: mesclar quando possível.
- Mesmo campo editado por duas pessoas: pedir resolução ou aplicar regra explícita.
- Operação aprovada: não aceitar sobrescrita silenciosa.
- Geometria: conflito sempre exige revisão.
- Estoque: usar movimentos, nunca “última gravação vence”.

### 9.5 Experiência offline

- Banner discreto “Sem conexão”.
- Mensagem “Salvo neste aparelho”.
- Contador de itens pendentes.
- Ação “Sincronizar agora”.
- Aviso antes de sair da conta com itens não enviados.
- Permitir captura de fotos e GPS.

### 9.6 Segurança e governança

- Revogação de dispositivo.
- Expiração de sessão com tratamento offline adequado.
- Mínimo de dados por perfil.
- Auditoria de sincronização.
- Política de retenção de anexos.
- Backup e restauração testados.

### 9.7 Testes obrigatórios

- Criar tarefa e operação em modo avião.
- Fechar e reabrir o app antes de sincronizar.
- Sincronizar após conexão retornar.
- Repetir envio.
- Dois usuários editando o mesmo registro.
- Falha durante upload de foto.
- Estoque consumido por dois dispositivos.

## Critérios de aceite

- Nenhum registro é perdido ao fechar o app offline.
- Reenvio não duplica dados.
- Conflitos importantes não são resolvidos silenciosamente.
- Usuário entende o que está local e o que está sincronizado.
- Fotos e apontamentos voltam a sincronizar após falha.
- Dados de uma organização não aparecem em outra.

## Entregáveis

- Banco/cache local.
- Fila de sincronização.
- UI de estados e conflitos.
- Idempotência no servidor.
- Testes offline e documentação de recuperação.

---

# ETAPA 10 — Métricas, escala empresarial e inteligência explicável

## Objetivo

Transformar dados confiáveis em indicadores, comparação, previsão e recomendação útil para pequenos produtores, gestores e grandes grupos agrícolas.

## Por que esta etapa é a última

IA e previsão só são úteis quando propriedade, safra, tarefas, mapas, operações, estoque, custos e sincronização possuem dados consistentes. Antecipar esta etapa produziria números visualmente atraentes, mas pouco confiáveis.

## Tarefas e subtarefas

### 10.1 Catálogo de métricas

Cada métrica deve registrar:

- Nome.
- Definição.
- Fórmula.
- Unidade.
- Período.
- Escopo.
- Fonte.
- Atualização.
- Responsável.
- Se é medida, calculada, estimada ou prevista.
- Confiança e cobertura quando aplicável.

### 10.2 Métricas operacionais

- Tarefas previstas, concluídas e atrasadas.
- Área trabalhada.
- Hectares por hora.
- Tempo produtivo e ocioso.
- Consumo de combustível por hectare.
- Disponibilidade de máquinas.
- Planejado versus realizado.

### 10.3 Métricas agronômicas

- Estágio fenológico.
- Dias após plantio.
- Última vistoria.
- Ocorrências abertas.
- Incidência/severidade quando os dados permitirem.
- Chuva acumulada.
- Área afetada.
- Evolução após intervenção.
- Produtividade prevista e realizada.

### 10.4 Métricas econômicas

- Custo por hectare.
- Custo por talhão/cultura/operação.
- Desvio do orçamento.
- Produtividade de equilíbrio.
- Receita prevista e realizada.
- Margem por hectare.

### 10.5 Painéis por perfil

- **Operador:** trabalho do dia e instruções.
- **Técnico/agronômico:** ocorrências, vistorias, diagnóstico e acompanhamento.
- **Gerente:** progresso, recursos, custos e riscos.
- **Proprietário/direção:** comparação, margem, produção e tendências.
- **Administrador:** saúde do sistema, permissões e qualidade dos dados.

### 10.6 Escala empresarial

- Visão consolidada de várias propriedades.
- Filtros por região, unidade, cultura e safra.
- Comparação normalizada.
- Ações em massa com proteção.
- Hierarquia organizacional.
- Aprovações.
- Exportação e API.
- Integrações com máquinas, sensores, estações, laboratórios e serviços externos.

### 10.7 Inteligência explicável

Uma previsão/recomendação deve mostrar:

- Resultado proposto.
- Dados usados.
- Período e cobertura.
- Confiança.
- Principais fatores.
- Limitações.
- Ação sugerida.
- Responsável pela decisão.
- Resultado observado depois da ação.

### 10.8 Cenários

Permitir simulações como:

- Planejado versus provável.
- Atraso de operação.
- Aumento de custo de insumo.
- Mudança de produtividade.
- Indisponibilidade de máquina.

Deixar claro que cenário não é garantia.

### 10.9 Monitoramento dos modelos

- Versão do modelo.
- Data de implantação.
- Dados de entrada.
- Taxa de aceitação/rejeição.
- Erros e falsos alertas.
- Desempenho por cultura/região.
- Feedback humano.
- Possibilidade de desligar modelo problemático.

### 10.10 Qualidade dos dados

Criar um indicador de qualidade que considere:

- Dados obrigatórios preenchidos.
- Atualização.
- Cobertura dos talhões.
- Origem.
- Consistência de unidades.
- Sincronização.
- Validação humana.

Não esconder baixa qualidade atrás de um número preciso.

## Critérios de aceite

- Toda métrica mostra período, unidade e fonte.
- Comparações usam definições iguais.
- Previsões são identificadas como estimativas.
- Recomendações apresentam confiança e limitações.
- Gestor compara várias propriedades sem perder acesso ao detalhe.
- Modelos possuem versão, monitoramento e mecanismo de desligamento.
- Usuário consegue informar se a recomendação foi útil e qual foi o resultado.

## Entregáveis

- Catálogo de métricas.
- Dashboards por perfil.
- Consolidação multi-propriedade.
- Motor de cenários.
- Recomendações explicáveis.
- Monitoramento e governança de modelos.

---

# 6. Dependências entre etapas

## O que pode ocorrer em paralelo

- Pesquisa e desenho da nova navegação podem começar durante a Etapa 1, mas implementação depende da fundação.
- Modelagem geoespacial pode ser pesquisada durante as Etapas 2 e 3.
- Catálogo de insumos e máquinas pode ser preparado antes das Etapas 7 e 8.
- Catálogo de métricas pode ser redigido antes da Etapa 10, mas não deve ser exibido sem fonte confiável.

## O que não deve ser invertido

- Não construir IA avançada antes de estruturar dados e resultados.
- Não integrar consumo ao estoque antes de definir tarefa e apontamento.
- Não calcular custo real antes de separar planejamento de execução.
- Não ativar sincronização offline sem idempotência.
- Não permitir edição geográfica em massa sem versionamento.

## Ondas recomendadas

1. **Onda de fundação:** Etapas 1 e 2.
2. **Onda operacional:** Etapas 3 e 4.
3. **Onda agronômica espacial:** Etapas 5 e 6.
4. **Onda de recursos e resultado:** Etapas 7 e 8.
5. **Onda de confiabilidade e inteligência:** Etapas 9 e 10.

---

# 7. Estratégia de priorização dentro de cada etapa

Classificar cada item:

- **P0 — bloqueador:** segurança, perda de dados, sessão, isolamento, cálculo incorreto ou fluxo principal quebrado.
- **P1 — essencial:** necessário para concluir o objetivo da etapa.
- **P2 — melhoria:** aumenta eficiência ou clareza, mas não bloqueia.
- **P3 — futuro:** integração ou otimização que depende de maior maturidade.

O agente deve concluir P0 e P1 antes de avançar. P2 pode ser adiado com justificativa. P3 deve ir para backlog, não ser implementado silenciosamente.

---

# 8. Protocolo de execução de cada tarefa pela IA

Para cada tarefa, responder internamente e documentar:

1. **Problema:** qual dor está sendo resolvida?
2. **Usuário:** quem usa e em qual contexto?
3. **Estado atual:** o que já existe?
4. **Dependências:** quais dados, permissões ou módulos são necessários?
5. **Risco:** pode causar perda, mistura, cálculo errado ou ação agronômica inadequada?
6. **Proposta:** qual é a menor solução completa?
7. **Contrato de dados:** entradas, saídas, unidades, estados e erros.
8. **Interface:** carregamento, vazio, erro, sucesso, offline e permissão.
9. **Implementação:** mudanças mínimas e compatíveis.
10. **Migração:** como preservar registros existentes?
11. **Testes:** unidade, integração, fluxo e visual.
12. **Aceite:** como provar que está pronto?
13. **Observabilidade:** como detectar falha em produção?
14. **Documentação:** o que outro agente precisa saber para continuar?

---

# 9. Matriz mínima de testes

Cada etapa deve considerar:

## Perfis

- Usuário não autenticado.
- Produtor iniciante.
- Produtor com uma propriedade.
- Gestor com várias propriedades.
- Técnico/agronômico.
- Operador.
- Administrador.
- Usuário sem permissão financeira.

## Estados de dados

- Nenhum registro.
- Um registro.
- Muitos registros.
- Dados incompletos.
- Dados históricos.
- Dados conflitantes.
- Dados importados.

## Dispositivos

- Celular estreito.
- Celular grande.
- Tablet.
- Desktop.
- Teclado no web.

## Rede

- Normal.
- Lenta.
- Interrompida.
- Offline.
- Retorno da conexão.

## Segurança

- Usuário tentando acessar outra organização.
- Alteração sem permissão.
- Exclusão de registro com dependências.
- Repetição de requisição.
- Upload inválido.
- Entrada malformada.

---

# 10. Definição global de concluído

Uma etapa somente está concluída quando:

- P0 e P1 estão implementados.
- Migrações foram testadas com cópia representativa dos dados.
- Não há perda de histórico.
- Permissões foram verificadas.
- Estados vazio, carregando, erro e sucesso existem.
- Celular e desktop foram verificados.
- Testes automatizados relevantes passam.
- Fluxo principal foi testado ponta a ponta.
- Métricas e unidades estão documentadas.
- Acessibilidade básica foi verificada.
- Logs não expõem dados sensíveis.
- Documentação foi atualizada.
- Há evidência visual antes/depois.
- Pendências e riscos estão registrados.
- Um segundo agente ou revisor consegue entender e continuar o trabalho.

---

# 11. Resultado esperado ao final das 10 etapas

Ao abrir uma propriedade, o usuário deverá conseguir:

1. Saber qual propriedade e safra está vendo.
2. Entender o status geral em poucos segundos.
3. Ver o que precisa ser feito hoje.
4. Identificar alertas e áreas afetadas.
5. Abrir o mapa e trabalhar com limites reais.
6. Gerenciar talhões e cultivos com histórico.
7. Registrar ocorrência e diagnóstico.
8. Transformar recomendação em tarefa.
9. Executar a operação mesmo sem internet.
10. Consumir insumos e recursos de modo rastreável.
11. Atualizar custos automaticamente.
12. Medir o resultado da ação.
13. Comparar planejado e realizado.
14. Consultar várias propriedades quando possuir escala empresarial.
15. Receber previsões e recomendações explicáveis, nunca apresentadas como certezas sem evidência.

O objetivo final não é ter o maior número de módulos. É fazer cada informação levar a uma decisão, cada decisão levar a uma execução e cada execução produzir um histórico mensurável e confiável.

