# Smoke manual — anexos Eventos (web)

**Rota:** Mais → Calendário → abrir um evento → seção **Anexos**  
**Conta:** `demo@afuagro.com.br` / `Demo@1234` (ou produtor demo na tela de login)

## Checklist pós-deploy

1. **Link externo**
   - Preencher nome + URL (`https://…`) e enviar.
   - O item aparece na lista; toque abre o link no navegador.

2. **Arquivo (web)**
   - Usar **Escolher arquivo** (ou equivalente) e enviar PNG ou PDF pequeno (&lt; limite do app).
   - Spinner some; anexo listado com ícone de documento.
   - Toque no anexo: abre URL assinada (nova aba ou download).

3. **Excluir**
   - Remover um anexo criado no teste (uploader ou dono do evento).

4. **Offline (opcional)**
   - Com rede desligada, upload deve falhar com mensagem clara (sem travar o modal).

## API automatizada

```bash
npm run smoke:eventos-anexos
```

Grava `docs/evidencias/smoke-eventos-anexos-latest.json`. Upload de arquivo é **opcional** no relatório se o storage Forge/S3 não estiver configurado no ambiente.
