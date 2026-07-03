# HtmlEditor — Guia de Uso

Editor visual com preview em tempo real para criação e edição de conteúdos em HTML.

## Características

- **Toolbar de Formatação** — 12 ações de formatação com ícones intuitivos
- **Preview em Tempo Real** — Visualize o HTML renderizado enquanto edita
- **Suporte a HTML** — Edite HTML diretamente ou use a toolbar
- **Responsivo** — Funciona em dispositivos móveis e tablets
- **Offline-First** — Funciona completamente offline com AsyncStorage

## Instalação

```bash
pnpm add react-native-webview
```

## Uso Básico

```tsx
import { HtmlEditor } from '@/components/html-editor';

export function MyComponent() {
  const [html, setHtml] = useState('<p>Conteúdo inicial</p>');

  return (
    <HtmlEditor
      value={html}
      onChange={setHtml}
      placeholder="Digite seu conteúdo aqui..."
      maxHeight={400}
    />
  );
}
```

## Props

| Prop | Tipo | Padrão | Descrição |
|------|------|--------|-----------|
| `value` | string | - | Conteúdo HTML atual |
| `onChange` | (html: string) => void | - | Callback ao alterar conteúdo |
| `placeholder` | string | "Digite seu conteúdo aqui..." | Placeholder do editor |
| `maxHeight` | number | 400 | Altura máxima do editor em pixels |

## Ações da Toolbar

| Ícone | Ação | Descrição | Resultado |
|-------|------|-----------|-----------|
| **𝐁** | Negrito | Ctrl+B | `<strong>texto</strong>` |
| **𝐈** | Itálico | Ctrl+I | `<em>texto</em>` |
| **U̲** | Sublinhado | Ctrl+U | `<u>texto</u>` |
| **H1** | Título 1 | - | `<h1>texto</h1>` |
| **H2** | Título 2 | - | `<h2>texto</h2>` |
| **H3** | Título 3 | - | `<h3>texto</h3>` |
| **•** | Lista | - | `<ul><li>texto</li></ul>` |
| **1.** | Numerada | - | `<ol><li>texto</li></ol>` |
| **"** | Citação | - | `<blockquote>texto</blockquote>` |
| **</>** | Código | - | `<code>texto</code>` |
| **🔗** | Link | - | `<a href="url">texto</a>` |
| **—** | Linha | - | `<hr />` |

## Fluxo de Uso

### 1. Editar com Toolbar

```
1. Selecione o texto que deseja formatar
2. Clique em um botão da toolbar
3. O HTML é aplicado automaticamente
```

### 2. Editar HTML Diretamente

```
1. Clique na aba "✏️ Editor"
2. Digite ou edite HTML diretamente
3. Clique na aba "👁️ Preview" para visualizar
```

### 3. Visualizar Preview

```
1. Clique na aba "👁️ Preview"
2. Veja o HTML renderizado em tempo real
3. Volte à aba "✏️ Editor" para continuar editando
```

## Exemplos

### Exemplo 1: Artigo Simples

```html
<h1>Título do Artigo</h1>
<p>Parágrafo introdutório com <strong>destaques</strong> e <em>ênfase</em>.</p>
<h2>Seção 1</h2>
<p>Conteúdo da seção.</p>
<ul>
  <li>Ponto 1</li>
  <li>Ponto 2</li>
  <li>Ponto 3</li>
</ul>
```

### Exemplo 2: Guia com Passos

```html
<h1>Guia de Instalação</h1>
<h2>Pré-requisitos</h2>
<ul>
  <li>Node.js 18+</li>
  <li>npm ou pnpm</li>
</ul>
<h2>Passos</h2>
<ol>
  <li>Clone o repositório</li>
  <li>Instale as dependências</li>
  <li>Execute o servidor</li>
</ol>
<blockquote>Nota: Certifique-se de ter as permissões corretas.</blockquote>
```

### Exemplo 3: Conteúdo Técnico

```html
<h1>Configuração de Banco de Dados</h1>
<p>Para configurar o banco de dados, use o seguinte comando:</p>
<code>npm run db:push</code>
<p>Isso criará as tabelas necessárias.</p>
<h2>Estrutura do Schema</h2>
<pre><code>CREATE TABLE conteudos (
  id VARCHAR(255) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  conteudo TEXT NOT NULL
);</code></pre>
```

## Integração com Conteúdos

O HtmlEditor está integrado na tela `app/admin/conteudos-offline.tsx`:

```tsx
<HtmlEditor
  value={formData.conteudo}
  onChange={(html) => setFormData({ ...formData, conteudo: html })}
  placeholder="Digite seu conteúdo aqui..."
  maxHeight={350}
/>
```

## Validação

Antes de salvar conteúdo, valide:

```tsx
const isValid = formData.conteudo.trim().length > 0;
if (!isValid) {
  Alert.alert('Erro', 'Conteúdo é obrigatório');
  return;
}
```

## Sanitização de HTML

O editor **não sanitiza** HTML automaticamente. Para produção, use:

```tsx
import DOMPurify from 'dompurify';

const sanitized = DOMPurify.sanitize(html);
```

## Limitações

- **Sem WYSIWYG Completo** — Use a toolbar ou edite HTML diretamente
- **Sem Undo/Redo** — Implemente com `useReducer` se necessário
- **Sem Drag-and-Drop** — Use `MediaUpload` para upload de mídia
- **Sem Colaboração em Tempo Real** — Sincronize via backend

## Performance

- **Renderização** — Preview usa WebView, pode ser lento em conteúdo muito grande
- **Armazenamento** — HTML é salvo em AsyncStorage (limite ~5MB)
- **Sincronização** — Conteúdo é sincronizado com backend via AdminContext

## Troubleshooting

### Preview não aparece

1. Verifique se `react-native-webview` está instalado
2. Confirme que `WebView` está importado corretamente
3. Teste com conteúdo HTML simples: `<p>Teste</p>`

### Formatação não funciona

1. Selecione o texto antes de clicar na toolbar
2. Verifique se o texto selecionado não está vazio
3. Tente editar HTML diretamente

### Conteúdo não salva

1. Verifique se `onChange` está conectado ao estado
2. Confirme que `AdminContext` está disponível
3. Teste a sincronização com `state.syncQueue`

## Testes

Execute os testes do HtmlEditor:

```bash
pnpm test tests/html-editor.test.ts
```

Cobertura:
- ✅ Formatação de texto (negrito, itálico, sublinhado)
- ✅ Títulos (H1, H2, H3)
- ✅ Listas (com pontos e numeradas)
- ✅ Citações e blocos de código
- ✅ Links e linhas divisórias
- ✅ Composição de formatações
- ✅ Validação de conteúdo
- ✅ Preview HTML

## Roadmap

- [ ] Suporte a imagens inline
- [ ] Undo/Redo com useReducer
- [ ] Colaboração em tempo real
- [ ] Suporte a Markdown
- [ ] Temas de editor (light/dark)
- [ ] Exportação para PDF
