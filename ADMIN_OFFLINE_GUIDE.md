# Guia de Uso — Admin Panel Offline

## 📋 Visão Geral

O Admin Panel foi desenvolvido com suporte completo a **modo offline-first**, permitindo que administradores gerenciem conteúdos, módulos e registros agrícolas mesmo sem conexão à internet.

---

## 🚀 Funcionalidades Principais

### 1. **CRUD de Módulos** (`/admin/modulos-offline`)
- ✅ Criar novos módulos educativos
- ✅ Editar módulos existentes
- ✅ Deletar módulos
- ✅ Reordenar módulos
- ✅ Indicador de status de sincronização

### 2. **CRUD de Conteúdos de Estudos**
- ✅ Adicionar artigos, guias, vídeos, PDFs
- ✅ Editar conteúdos
- ✅ Deletar conteúdos
- ✅ Suporte a múltiplos tipos de conteúdo
- ✅ Upload de imagens e anexos (offline)

### 3. **Sincronização Automática**
- ✅ Fila de sincronização com AsyncStorage
- ✅ Retry automático com backoff exponencial
- ✅ Resolução de conflitos (last-write-wins)
- ✅ Logs de auditoria

### 4. **Indicador de Status**
- 🟢 **Sincronizado** — Todos os dados estão em sync com servidor
- 🟡 **Sincronizando** — Enviando dados para servidor
- 🟠 **Pendente** — Alterações aguardando sincronização
- 🔴 **Offline** — Sem conexão com internet

---

## 📱 Como Testar Modo Offline

### Passo 1: Acessar Admin Panel
```
1. Abra o app
2. Navegue até "Admin" → "Módulos"
3. Crie/edite alguns módulos
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
1. Crie um novo módulo
2. Edite um módulo existente
3. Delete um módulo
4. Observe o indicador: "🟠 1 pendente(s)"
```

### Passo 4: Voltar Online e Sincronizar
```
1. Desative modo avião / reconecte WiFi
2. Clique em "Sincronizar Agora" (se aparecer)
3. Observe o indicador mudar para "🟡 Sincronizando..."
4. Após sucesso: "🟢 Sincronizado"
```

---

## 💾 Estrutura de Dados Offline

### AsyncStorage Keys
```javascript
// Dados principais
'admin-data' → {
  modulos: Modulo[],
  conteudos: Conteudo[],
  registros: RegistroAgricola[],
  ultimaSincronizacao: number,
}

// Fila de sincronização
'sync-queue' → SyncQueue[]

// Imagens locais
'images-cache' → {
  [id]: base64String
}
```

### Tipos de Dados

**Módulo:**
```typescript
{
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: 'sincronizado' | 'pendente' | 'erro';
}
```

**Conteúdo:**
```typescript
{
  id: string;
  moduloId: string;
  titulo: string;
  descricao: string;
  tipo: 'artigo' | 'guia' | 'video' | 'pdf' | 'imagem';
  conteudo: string; // HTML ou URL
  autor: string;
  dataCriacao: number;
  dataAtualizacao: number;
  syncStatus: 'sincronizado' | 'pendente' | 'erro';
}
```

---

## 🔄 Fluxo de Sincronização

```
┌─────────────────────────────────────────────────────┐
│ Usuário faz alteração (offline)                     │
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

## 🛠️ Tratamento de Conflitos

### Estratégia: Last-Write-Wins
Se o mesmo item for editado offline e online simultaneamente:
- **Versão com timestamp mais recente vence**
- Versão mais antiga é descartada
- Conflito é registrado em logs de auditoria

Exemplo:
```javascript
// Local (offline)
{ id: '1', nome: 'Solo', dataAtualizacao: 1000 }

// Remoto (servidor)
{ id: '1', nome: 'Solo Fértil', dataAtualizacao: 900 }

// Resultado após sincronização
{ id: '1', nome: 'Solo', dataAtualizacao: 1000 } ✓
```

---

## 📊 Monitoramento e Logs

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
- modulo (criar): Timeout na conexão
```

### Acessar Logs
```javascript
// No console do app
import { syncService } from '@/lib/admin/sync-service';

const relatorio = syncService.gerarRelatorioSync(sucesso, erro);
console.log(relatorio);
```

---

## 🔐 Segurança

### Autenticação Offline
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

---

## 🧪 Testes

### Executar Suite de Testes
```bash
npm test -- tests/admin-offline.test.ts
```

### Casos de Teste Cobertos
- ✅ Criar/editar/deletar módulos offline
- ✅ Processar fila de sincronização
- ✅ Resolver conflitos
- ✅ Retry automático
- ✅ Persistência em AsyncStorage
- ✅ Geração de relatórios

---

## 🚨 Troubleshooting

### Problema: Dados não sincronizam
**Solução:**
1. Verifique conexão de internet
2. Clique em "Sincronizar Agora"
3. Verifique logs de erro
4. Limpe cache do app e tente novamente

### Problema: Conflito de dados
**Solução:**
1. Versão mais recente é mantida automaticamente
2. Versão antiga é descartada
3. Verifique relatório de sincronização para detalhes

### Problema: App lento offline
**Solução:**
1. AsyncStorage pode ficar lento com muitos dados
2. Implemente paginação/lazy loading
3. Considere migrar para SQLite em futuro

---

## 📝 Roadmap Futuro

- [ ] Migração para SQLite (melhor performance)
- [ ] Sincronização seletiva (escolher o que sincronizar)
- [ ] Compressão de imagens antes de upload
- [ ] Notificações de conflito com UI para resolução manual
- [ ] Backup automático em cloud
- [ ] Modo dark/light completo

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Logs de erro no console
- Relatório de sincronização
- Documentação do código-fonte

**Desenvolvido com ❤️ para agricultura inteligente.**
