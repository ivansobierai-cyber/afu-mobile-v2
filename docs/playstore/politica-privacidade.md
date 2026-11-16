# Política de Privacidade — AFU Agro

**URL pública (após deploy web):** https://afuagro.tech/privacidade  
**Fonte de verdade no app:** `lib/legal/privacidade-content.ts`  
**Atualizado em:** 16 de novembro de 2026  
**Contato:** suporte@afuagro.com.br

Esta Política de Privacidade descreve como o AFU Agro (Analisador Fitotécnico Universal) trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## 1. Controlador

O controlador dos dados é a operação AFU Agro. Contato para privacidade e direitos do titular: suporte@afuagro.com.br.

## 2. Dados que coletamos

- **Conta:** nome, e-mail, senha (hash), telefone opcional, tipo de perfil.
- **Perfil produtor:** documento (quando informado), cidade, estado, região, tipo de produtor.
- **Operação agrícola:** propriedades (incl. latitude/longitude), safras, cultivos, estoque, custos, operações, eventos e anexos.
- **Diagnóstico:** fotos de plantas e resultados associados à conta/organização.
- **Dispositivo:** token de push (Expo), plataforma, nome do dispositivo, ID local de sync offline.
- **Suporte:** tickets e mensagens.

## 3. Finalidades

Prestação do serviço, notificações, localização sob demanda, fotos sob demanda, segurança e auditoria multi-tenant. Bases: execução de contrato, consentimento e legítimo interesse, conforme o caso.

## 4. Compartilhamento

Não vendemos dados pessoais. Processadores de infraestrutura (API, banco, storage, e-mail/IA quando configurados) podem processar dados necessários ao serviço. Membros da organização veem dados conforme RBAC.

## 5. Segurança

HTTPS na API de produção (`api.afuagro.tech`). Tokens em SecureStore no mobile. Senhas apenas como hash.

## 6. Direitos do titular (LGPD)

Acesso, correção, portabilidade, oposição e exclusão via suporte@afuagro.com.br (até 30 dias úteis). Autoatendimento completo de exclusão ainda não está no app.

## 7. Menores

Serviço destinado a maiores de 18 anos (produtores e profissionais).

## 8. Permissões do app

Câmera/fotos, localização em uso, notificações. Sem microfone nem storage legado amplo.

## 9. Alterações

A data de revisão aparece nesta página e na rota `/privacidade` do app/web.
