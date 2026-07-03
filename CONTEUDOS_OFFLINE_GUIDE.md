# Guia — CRUD de Conteúdos de Estudos Offline

## 📋 Visão Geral

O CRUD de Conteúdos de Estudos foi desenvolvido com suporte completo a **modo offline-first**, permitindo que administradores criem, editem e deletem conteúdos educativos (artigos, guias, PDFs, vídeos, imagens) mesmo sem conexão à internet.

---

## 🚀 Funcionalidades Principais

### 1. **CRUD Completo** (`/admin/conteudos-offline`)
- ✅ Criar novos conteúdos com validação Zod
- ✅ Editar conteúdos existentes
- ✅ Deletar conteúdos com confirmação
- ✅ Filtrar por módulo educativo
- ✅ Indicador de status de sincronização

### 2. **Tipos de Conteúdo Suportados**
- 📄 **Artigo** — Texto formatado em HTML
- 📖 **Guia** — Conteúdo estruturado com múltiplas seções
- 📕 **PDF** — Documentos em PDF (armazenados em base64)
- 🎥 **Vídeo** — URLs de vídeo ou vídeos em base64
- 🖼️ **Imagem** — Imagens em base64 para offline

### 3. **Upload de Mídia Offline**
- ✅ Captura de imagens (câmera/galeria)
- ✅ Upload de PDFs
- ✅ Upload de vídeos
- ✅ Armazenamento em base64 no AsyncStorage
- ✅ Sincronização automática ao conectar

### 4. **Validação com Zod**
- ✅ Título: 3-200 caracteres
- ✅ Descrição: 10-1000 caracteres
- ✅ Tipo: artigo|guia|pdf|video|imagem
- ✅ Módulo: obrigatório
- ✅ Conteúdo: obrigatório
- ✅ Tags: array de strings (opcional)
- ✅ Ordem: número inteiro >= 0

### 5. **Sincronização Automática**
- ✅ Fila de sincronização com AsyncStorage
- ✅ Retry automático com backoff exponencial
- ✅ Resolução de conflitos (last-write-wins)
- ✅ Indicador visual de status (🟢🟡🟠🔴)

---

## 🛠️ Como Usar

### Acessar o CRUD de Conteúdos

```
1. Abra o app
2. Navegue até "Admin" → "Conteúdos"
3. Você verá a lista de conteúdos existentes
```

### Criar Novo Conteúdo

```
1. Clique em "+ Novo Conteúdo"
2. Preencha os campos:
   - Módulo (obrigatório)
   - Título (3-200 caracteres)
   - Descrição (10-1000 caracteres)
   - Tipo (artigo, guia, pdf, video, imagem)
   - Conteúdo (HTML, URL ou texto)
   - Tags (opcional, separadas por vírgula)
   - Ordem (padrão: 0)
   - Ativo (padrão: sim)
3. Clique em "Salvar"
```

### Editar Conteúdo

```
1. Clique no botão "Editar" do conteúdo
2. Modifique os campos desejados
3. Clique em "Salvar"
```

### Deletar Conteúdo

```
1. Clique no botão "Deletar"
2. Confirme a exclusão
3. Conteúdo será removido da lista
```

### Filtrar por Módulo

```
1. Na seção "Filtrar por Módulo"
2. Clique em um módulo para filtrar
3. Clique em "Todos" para remover filtro
```

### Adicionar Mídia

```
1. Na tela de edição, clique em "📷 Imagem", "📄 PDF" ou "🎥 Vídeo"
2. Selecione o arquivo
3. Arquivo será armazenado localmente em base64
4. Indicador mostrará "⏳ Pendente" até sincronizar
```

---

## 💾 Estrutura de Dados

### Conteúdo

```typescript
interface Conteudo {
  id: string;                                    // ID único
  moduloId: string;                              // Módulo educativo
  titulo: string;                                // 3-200 caracteres
  descricao: string;                             // 10-1000 caracteres
  tipo: 'artigo' | 'guia' | 'pdf' | 'video' | 'imagem';
  conteudo: string;                              // HTML, URL ou texto
  urlArquivo?: string;                           // URL do arquivo (opcional)
  tags: string[];                                // Array de tags
  ordem: number;                                 // Ordem de exibição
  ativo: boolean;                                // Ativo/inativo
  dataCriacao: number;                           // Timestamp
  dataAtualizacao: number;                       // Timestamp
  syncStatus: 'sincronizado' | 'pendente' | 'sincronizando' | 'erro';
  syncError?: string;                            // Mensagem de erro
}
```

### Arquivo de Mídia

```typescript
interface MediaFile {
  id: string;                                    // ID único
  conteudoId: string;                            // Conteúdo vinculado
  nome: string;                                  // Nome do arquivo
  tipo: 'imagem' | 'pdf' | 'video';
  base64: string;                                // Dados em base64
  tamanho: number;                               // Tamanho em bytes
  dataCriacao: number;                           // Timestamp
  sincronizado: boolean;                         // Status de sincronização
}
```

---

## 🔄 Fluxo de Sincronização

```
┌─────────────────────────────────────────────────────┐
│ Usuário cria/edita/deleta conteúdo (offline)       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Dados salvos em AsyncStorage                        │
│ Item adicionado à syncQueue                         │
│ Indicador: "🟠 1 pendente(s)"                       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Volta online? │
         └───────┬───────┘
                 │
         ┌───────▼───────┐
         │ Sim           │
         └───────┬───────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ Indicador: "🟡 Sincronizando..."                   │
│ Processa syncQueue item por item                    │
│ Envia para servidor via tRPC                        │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────▼───────────┐
         │ Sucesso?          │
         └───────┬───────┬───┘
                 │       │
        ┌────────▼─┐  ┌──▼────────┐
        │ Sim      │  │ Não       │
        └────┬─────┘  └──┬────────┘
             │           │
             ▼           ▼
    Remove da queue  Retry com backoff
    Atualiza status  (até 3 tentativas)
             │           │
             └─────┬─────┘
                   │
                   ▼
    ┌──────────────────────────────┐
    │ Indicador: "🟢 Sincronizado" │
    └──────────────────────────────┘
```

---

## 🧪 Testes

### Executar Suite de Testes

```bash
npm test -- tests/conteudo-sync.test.ts
```

### Casos de Teste Cobertos

- ✅ Validação com Zod (8 testes)
- ✅ Operações de sincronização (3 testes)
- ✅ Tipos de conteúdo (5 testes)
- ✅ Filtros e busca (6 testes)
- ✅ Ordenação (2 testes)
- ✅ Sincronização com fila (3 testes)
- ✅ Resolução de conflitos (2 testes)
- ✅ Validação de limites (3 testes)

**Total: 32 testes** cobrindo CRUD offline completo

---

## 📱 Como Testar Modo Offline

### Passo 1: Criar Conteúdo

```
1. Abra o app
2. Navegue até "Admin" → "Conteúdos"
3. Clique em "+ Novo Conteúdo"
4. Preencha os campos e clique "Salvar"
```

### Passo 2: Ativar Modo Offline

**Em Navegador (DevTools):**
```
1. F12 → DevTools
2. Ctrl+Shift+P → "offline"
3. Selecione "Go offline"
```

**Em Dispositivo Android/iOS:**
```
1. Ative modo avião (desativa WiFi + dados)
2. Ou desligue WiFi/dados manualmente
```

### Passo 3: Fazer Alterações Offline

```
1. Crie um novo conteúdo
2. Edite um conteúdo existente
3. Delete um conteúdo
4. Observe o indicador: "🟠 3 pendente(s)"
```

### Passo 4: Adicionar Mídia Offline

```
1. Na tela de edição, clique em "📷 Imagem"
2. Selecione uma imagem
3. Arquivo será armazenado em base64
4. Indicador mostrará "⏳ Pendente"
```

### Passo 5: Voltar Online e Sincronizar

```
1. Desative modo avião / reconecte WiFi
2. Observe o indicador mudar para "🟡 Sincronizando..."
3. Após sucesso: "🟢 Sincronizado"
4. Mídias serão enviadas ao servidor
```

---

## 🔐 Segurança

### Autenticação

- Token JWT armazenado em AsyncStorage com segurança
- Validação de sessão ao voltar online
- Logout automático se sessão expirar

### Validação de Dados

- Schemas Zod validam dados antes de salvar localmente
- Prevenção de dados inválidos no banco local
- Sanitização de HTML/conteúdo antes de persistir

### Prevenção de Perda de Dados

- Autosave a cada 30 segundos
- Backup automático em AsyncStorage
- Confirmação antes de deletar
- Histórico de sincronização com timestamps

---

## 🚨 Troubleshooting

### Problema: Conteúdo não sincroniza

**Solução:**
1. Verifique conexão de internet
2. Verifique indicador de status
3. Verifique logs de erro
4. Limpe cache do app e tente novamente

### Problema: Conflito de dados

**Solução:**
1. Versão mais recente é mantida automaticamente
2. Versão antiga é descartada
3. Verifique relatório de sincronização para detalhes

### Problema: Mídia não sincroniza

**Solução:**
1. Verifique tamanho do arquivo (máx. 5MB recomendado)
2. Verifique espaço disponível em AsyncStorage
3. Tente novamente ao reconectar
4. Considere comprimir imagens antes de upload

### Problema: App lento offline

**Solução:**
1. AsyncStorage pode ficar lento com muitos dados
2. Implemente paginação/lazy loading
3. Considere migrar para SQLite em futuro
4. Limpe dados antigos periodicamente

---

## 📊 Monitoramento

### Relatório de Sincronização

```
Relatório de Sincronização
==========================
Data: 20/06/2026 14:30:45
Total de itens: 5
Sucesso: 4
Erro: 1
Taxa de sucesso: 80.0%

Itens com erro:
- conteudo (criar): Timeout na conexão
```

### Acessar Logs

```javascript
// No console do app
import { useConteudoSync } from '@/hooks/use-conteudo-sync';

const { syncQueue } = useConteudoSync();
console.log('Fila de sincronização:', syncQueue);
```

---

## 🔌 Integração com AdminContext

O hook `useConteudoSync` pode ser integrado com `AdminContext` para persistência global:

```typescript
import { useConteudoSync } from '@/hooks/use-conteudo-sync';

export function ConteudosOfflineScreen() {
  const { conteudos, criarConteudo, atualizarConteudo, deletarConteudo } = useConteudoSync();
  
  // Usar dados e funções
}
```

---

## 📝 Roadmap Futuro

- [ ] Migração para SQLite (melhor performance)
- [ ] Sincronização seletiva (escolher o que sincronizar)
- [ ] Compressão de imagens antes de upload
- [ ] Notificações de conflito com UI para resolução manual
- [ ] Backup automático em cloud
- [ ] Modo dark/light completo
- [ ] Suporte a múltiplos idiomas
- [ ] Editor de conteúdo WYSIWYG

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Logs de erro no console
- Relatório de sincronização
- Documentação do código-fonte
- Testes em `tests/conteudo-sync.test.ts`

**Desenvolvido com ❤️ para agricultura inteligente.**
