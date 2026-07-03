# AFU — Analisador Fitotécnico Universal
## Mobile App Interface Design

---

## Brand Identity

**Palette principal:**
- Verde primário: `#2D6A4F` (verde floresta profundo — confiança agronômica)
- Verde claro: `#52B788` (ações, botões, destaques)
- Fundo claro: `#F8FAF5` (tom levemente esverdeado)
- Fundo escuro: `#0F1A14`
- Superfície clara: `#FFFFFF`
- Superfície escura: `#1A2E22`
- Texto primário claro: `#1A2E22`
- Texto primário escuro: `#E8F5E9`
- Texto secundário: `#6B7C6E`
- Borda: `#D4E8D8`
- Alerta/Erro: `#E53E3E`
- Aviso: `#F6AD55`
- Sucesso: `#38A169`

---

## Screen List

### Autenticação
1. **Splash / Onboarding** — Logo animado, slogan, botão de login

### Tab Bar Principal (5 abas)
2. **Dashboard** — Visão geral: clima, cultivos ativos, alertas, atividades recentes
3. **Propriedades** — Lista de fazendas/sítios, terrenos e talhões
4. **Cultivos** — Registro e acompanhamento de plantios
5. **Diagnóstico IA** — Upload de foto + análise por IA (pragas, doenças, nutrição)
6. **Mais** — Menu com módulos adicionais

### Telas de Detalhe (navegação stack)
7. **Detalhe da Propriedade** — Dados, mapa, terrenos vinculados
8. **Detalhe do Cultivo** — Fase fenológica, histórico, irrigação, nutrição
9. **Resultado do Diagnóstico** — Análise IA com recomendações técnicas
10. **Banco de Culturas** — Lista e detalhe de espécies agrícolas
11. **Pragas e Doenças** — Banco técnico de pragas e doenças
12. **Nutrição Vegetal** — Macro/micronutrientes, sintomas, recomendações
13. **Calendário Agrícola** — Eventos planejados e operações
14. **Clima Agrícola** — Necessidades climáticas por cultura
15. **Irrigação** — Recomendações hídricas por cultura/fase
16. **Histórico de Diagnósticos** — Lista de análises anteriores
17. **Perfil / Configurações** — Dados do usuário, preferências

---

## Primary Content and Functionality

### Dashboard
- Card de clima atual (temperatura, umidade, precipitação)
- Cards de cultivos ativos com fase fenológica e % progresso
- Alertas fitossanitários recentes
- Atalhos rápidos para diagnóstico, calendário e cultivos
- Indicadores: total de propriedades, cultivos ativos, diagnósticos realizados

### Propriedades
- FlatList de propriedades com nome, área, tipo de produção
- FAB para adicionar nova propriedade
- Formulário: nome, localização, área total, tipo (fazenda/sítio/chácara)
- Drill-down para terrenos/talhões dentro da propriedade

### Cultivos
- FlatList de cultivos com cultura, variedade, fase atual, data de plantio
- Status visual: em andamento / colhido / planejado
- Formulário: cultura, variedade, data plantio, data colheita prevista, área, terreno vinculado
- Detalhe: linha do tempo fenológica, irrigação, adubação, observações

### Diagnóstico IA
- Tela principal com câmera/galeria para upload
- Preview da imagem selecionada
- Seleção de contexto: cultura, parte da planta (folha/fruto/raiz/caule)
- Botão "Analisar com IA"
- Tela de resultado: imagem, diagnóstico, confiança, recomendações técnicas
- Histórico de análises anteriores

### Módulo Mais
- Banco de Culturas
- Pragas e Doenças
- Nutrição Vegetal
- Calendário Agrícola
- Clima Agrícola
- Irrigação
- Perfil

---

## Key User Flows

### Fluxo 1: Diagnóstico por IA
1. Tab "Diagnóstico" → Tela principal
2. Toca em "Tirar Foto" ou "Galeria"
3. Seleciona imagem da planta
4. Escolhe cultura e parte da planta
5. Toca "Analisar" → Loading com animação
6. Resultado: diagnóstico, severidade, recomendações
7. Pode salvar no histórico ou compartilhar

### Fluxo 2: Registrar Novo Cultivo
1. Tab "Cultivos" → FAB "+"
2. Preenche formulário: cultura, variedade, datas, área
3. Vincula a uma propriedade/terreno
4. Salva → aparece na lista com fase fenológica calculada

### Fluxo 3: Consultar Banco de Pragas
1. Tab "Mais" → "Pragas e Doenças"
2. Filtra por cultura ou busca por nome
3. Toca na praga → Detalhe: sintomas, nível de risco, controle, prevenção

---

## Color Choices

```js
primary: { light: '#2D6A4F', dark: '#52B788' }
background: { light: '#F8FAF5', dark: '#0F1A14' }
surface: { light: '#FFFFFF', dark: '#1A2E22' }
foreground: { light: '#1A2E22', dark: '#E8F5E9' }
muted: { light: '#6B7C6E', dark: '#8FA896' }
border: { light: '#D4E8D8', dark: '#2D4A35' }
success: { light: '#38A169', dark: '#68D391' }
warning: { light: '#D97706', dark: '#FBBF24' }
error: { light: '#E53E3E', dark: '#FC8181' }
tint: { light: '#52B788', dark: '#52B788' }
```

---

## Design Principles

- Cards com cantos arredondados (radius 16px) e sombra sutil
- Ícones de plantas/folhas no estilo Material Design
- Tipografia clara: título 24px bold, subtítulo 16px semibold, corpo 14px regular
- Status badges coloridos: verde (saudável), amarelo (atenção), vermelho (crítico)
- Imagens de plantas como thumbnails nos cards
- Bottom sheet para formulários de criação rápida
- Pull-to-refresh em todas as listas
- Skeleton loading para carregamento de dados
