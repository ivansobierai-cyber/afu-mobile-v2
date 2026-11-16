# 🤖 AI Database Builder
## AI Development Assistant para Aplicações de Banco de Dados

![Status](https://img.shields.io/badge/status-active-brightgreen)
![Python](https://img.shields.io/badge/python-3.8+-blue)
![PowerShell](https://img.shields.io/badge/PowerShell-7.0+-lightblue)

---

## 📋 O que é?

Um **assistente de desenvolvimento IA** que:
- ✅ Lê sua lista de tarefas
- ✅ Gera código etapa por etapa usando Claude AI
- ✅ Salva tudo localmente
- ✅ Testa automaticamente cada fase
- ✅ Integra-se perfeitamente no VS Code

---

## 🚀 Instalação Rápida

### 1️⃣ Pré-requisitos
- **Python 3.8+** [Download](https://www.python.org)
- **PowerShell 7+** (ou PowerShell integrado no Windows)
- **VS Code** [Download](https://code.visualstudio.com)
- **Chave API Anthropic** [Obter aqui](https://console.anthropic.com)

### 2️⃣ Setup do Projeto

```powershell
# Clone ou baixe os arquivos para seu projeto
# Estrutura esperada:
# projeto/
# ├── ai_builder_backend.py
# ├── ai_builder.ps1
# ├── tasks.txt
# ├── .env.example
# └── generated_code/

# Instale as dependências Python
python -m pip install anthropic python-dotenv

# Copie o arquivo .env.example
copy .env.example .env

# IMPORTANTE: Edite .env com sua chave API
notepad .env
# Adicione: ANTHROPIC_API_KEY=sua_chave_aqui
```

### 3️⃣ Configure no VS Code

**Opção A: Terminal Integrado (Recomendado)**
```
1. Abra o projeto em VS Code: code .
2. Abra o terminal: Ctrl + `
3. Execute: .\ai_builder.ps1
```

**Opção B: Tarefa VS Code**
Crie `.vscode/tasks.json`:
```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "AI Builder - Executar",
      "type": "shell",
      "command": "powershell",
      "args": ["-ExecutionPolicy", "Bypass", "-File", "ai_builder.ps1"],
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "problemMatcher": []
    }
  ]
}
```
Depois execute com: `Ctrl + Shift + B`

---

## 📝 Como Usar

### Passo 1: Criar Sua Lista de Tarefas

Edite o arquivo `tasks.txt` com suas tarefas:

```
### ETAPA 1: Criar Banco de Dados
- Criar tabela de usuários
- Campos: id, nome, email
- Validação de email

### ETAPA 2: Operações CRUD
- Criar função de inserção
- Criar função de leitura
- Criar função de atualização
- Criar função de deleção
```

### Passo 2: Executar o Builder

**No Terminal do VS Code:**
```powershell
# Menu interativo
.\ai_builder.ps1

# Ou direto (sem menu)
python ai_builder_backend.py
```

### Passo 3: Acompanhar o Progresso

```
[Info] ✅ Código gerado com sucesso!
[Info] Testando: etapa_1_criar_banco_de_dados.py...
[Success] ✅ etapa_1_criar_banco_de_dados.py passou!
[Success] Relatório salvo: logs/report_2024-01-15_10-30-45.txt
```

### Passo 4: Revisar o Código Gerado

```
generated_code/
├── etapa_1_criar_banco_de_dados.py
├── etapa_2_classe_conexao.py
├── etapa_3_operacoes_crud.py
└── etapa_4_testes.py
```

---

## 🎯 Fluxo Completo

```
┌─────────────────────┐
│  Escrever Tarefas   │
│  em tasks.txt       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Executar Script PS  │
│ ai_builder.ps1      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Claude Gera Código  │
│ (API Anthropic)     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Salvar Arquivos    │
│  (generated_code/)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Testar Código      │
│  (Automaticamente)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Gerar Relatório     │
│ (logs/report_*.txt) │
└─────────────────────┘
```

---

## 🔧 Opções do Script PowerShell

```powershell
# Executar tudo
.\ai_builder.ps1

# Só gerar código (sem testes)
# Use a opção 2 no menu

# Só testar
# Use a opção 3 no menu

# Abrir no VS Code
# Use a opção 4 no menu

# Ver último relatório
# Use a opção 5 no menu
```

---

## 📊 Estrutura de Diretórios

```
seu-projeto/
├── ai_builder_backend.py      # Backend Python
├── ai_builder.ps1              # Script PowerShell
├── tasks.txt                   # Suas tarefas
├── .env                        # Configuração (NÃO COMMITAR!)
├── .env.example               # Template do .env
├── .gitignore                 # (adicione .env)
│
├── generated_code/            # Código gerado automaticamente
│   ├── etapa_1_*.py
│   ├── etapa_2_*.py
│   └── etapa_n_*.py
│
├── tests/                     # Testes automatizados
│   └── test_*.py
│
├── logs/                      # Logs e relatórios
│   └── report_*.txt
│
├── data/                      # Arquivos de banco de dados
│   └── *.db
│
└── .vscode/                   # Configuração VS Code
    └── tasks.json
```

---

## ⚙️ Variáveis de Ambiente

Edite `.env`:

```env
# API
ANTHROPIC_API_KEY=sk-ant-...

# Modelo (recomendado: claude-opus-4-6)
AI_MODEL=claude-opus-4-6

# Diretórios
OUTPUT_DIR=generated_code
TEST_DIR=tests
LOG_DIR=logs

# Debug
DEBUG=false
VERBOSE=true
```

---

## 🧪 Exemplo de Resultado

**Input (tasks.txt):**
```
### Criar tabela de produtos
- Campos: id, nome, preco
- Validar dados
```

**Output (etapa_1_criar_tabela_de_produtos.py):**
```python
import sqlite3
from datetime import datetime

class ProdutosDB:
    def __init__(self, db_file='produtos.db'):
        """Inicializa conexão com banco de dados"""
        self.db_file = db_file
        self.conn = None
        self.criar_tabela()
    
    def criar_tabela(self):
        """Cria tabela de produtos se não existir"""
        try:
            self.conn = sqlite3.connect(self.db_file)
            cursor = self.conn.cursor()
            
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS produtos (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    nome TEXT NOT NULL,
                    preco REAL NOT NULL,
                    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            ''')
            
            self.conn.commit()
            print("✅ Tabela 'produtos' criada com sucesso!")
            
        except sqlite3.Error as e:
            print(f"❌ Erro ao criar tabela: {e}")
        finally:
            if self.conn:
                self.conn.close()

if __name__ == "__main__":
    db = ProdutosDB()
```

---

## ❓ Troubleshooting

### Erro: "Python não encontrado"
```powershell
# Verifique a instalação
python --version

# Ou use python3
python3 --version
```

### Erro: "ANTHROPIC_API_KEY não definida"
```powershell
# Certifique-se de editar .env com sua chave
notepad .env

# E confirme que a variável está definida
$env:ANTHROPIC_API_KEY
```

### Erro: "Execution Policy"
```powershell
# Execute como administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Testes falhando
```powershell
# Verifique os logs
Get-Content logs/report_*.txt

# E a saída do Python
python generated_code/etapa_1_*.py
```

---

## 📚 Recursos

- [Documentação Claude API](https://docs.anthropic.com)
- [Python sqlite3](https://docs.python.org/3/library/sqlite3.html)
- [PowerShell Docs](https://learn.microsoft.com/en-us/powershell/)
- [VS Code Extension API](https://code.visualstudio.com/api)

---

## 🤝 Contribuindo

Melhorias sugeridas:
- [ ] Suporte a MySQL/PostgreSQL
- [ ] Interface web
- [ ] VS Code Extension oficial
- [ ] Suporte a múltiplos modelos IA
- [ ] Cache de prompts

---

## 📄 Licença

MIT License - Use livremente!

---

## 🎓 Tutorial Rápido

### Seu Primeiro App de Banco de Dados

1. **Copie os arquivos para sua pasta:**
   ```
   projeto/
   ├── ai_builder_backend.py
   ├── ai_builder.ps1
   ├── tasks.txt
   ├── .env.example
   ```

2. **Configure a chave API:**
   ```powershell
   copy .env.example .env
   notepad .env
   # Adicione sua chave
   ```

3. **Edite tasks.txt** com suas tarefas

4. **Execute no PowerShell:**
   ```powershell
   .\ai_builder.ps1
   # Escolha opção 1
   ```

5. **Veja o código gerado em `generated_code/`**

6. **Testes rodam automaticamente!**

---

## 💡 Dicas

✅ **Seja específico nas tarefas** - Quanto mais claro, melhor o código
✅ **Use comentários** - Explique o que quer em português
✅ **Revise o código gerado** - Sempre valide antes de usar em produção
✅ **Mantenha tasks.txt** - Reutilize para projetos similares
✅ **Exporte para Git** - Todos os arquivos são versionáveis

---

**Pronto? Comece agora!** 🚀

```powershell
.\ai_builder.ps1
```

