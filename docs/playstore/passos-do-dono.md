# Passos restantes do dono (credenciais)

Este ambiente de agente **não** tem login Expo, Android SDK completo nem keystore da Play. Não inventamos artefato assinado. Siga abaixo na sua máquina.

## 1. Expo / EAS

```bash
# Node 24 (ver .nvmrc)
nvm use
cd /caminho/afu-mobile-v2
npm ci

# Login na conta que possui o projeto EAS a1dfdf25-6741-4df3-b724-cabb3aab3174
npx eas-cli login
npx eas-cli whoami
npx eas-cli project:info
```

## 2. Credenciais Android (keystore)

Na primeira build production, o EAS pergunta:

```bash
npx eas-cli credentials -p android
# ou deixe o assistente da build criar:
npx eas-cli build --platform android --profile production
```

Opções:

1. **Gerar keystore no EAS** (mais simples) — baixe o backup imediatamente e guarde offline.  
2. **Upload de keystore existente** — se já tiver um para `br.com.afuagro.app`.

Sem esse keystore, não é possível atualizar o mesmo app na Play depois.

## 3. Build AAB

```bash
npm run eas:android:prod
# equivalente:
npx eas-cli build --platform android --profile production
```

Confirme no log:

- `applicationId`: `br.com.afuagro.app`
- `version` / versionCode auto-incrementado
- env: `EXPO_PUBLIC_API_BASE_URL=https://api.afuagro.tech`
- env: `EXPO_PUBLIC_SHOW_DEMO_LOGIN=0`
- artefato: **Android App Bundle**

Baixe o `.aab` pelo link do Expo dashboard.

## 4. Google Play Console

1. Criar app “AFU Agro”, idioma pt-BR.  
2. Preencher ficha com `docs/playstore/descricao-*.txt`.  
3. Data safety ← `data-safety.md`.  
4. Content rating ← `content-rating.md`.  
5. Política: `https://afuagro.tech/privacidade` (deploy web após merge).  
6. Criar release na faixa interna e enviar o `.aab`.  

Opcional (submit automático):

```bash
npx eas-cli submit --platform android --profile production --latest
```

Requer Google Service Account JSON com acesso à Play Console (configure em `eas credentials` / `eas.json` submit).

## 5. O que este VM **não** conseguiu

| Item | Motivo |
|------|--------|
| `.aab` assinado de produção | Sem `eas login` / keystore do dono |
| `expo prebuild` + Gradle release | Sem Android SDK/`ANDROID_HOME` no ambiente |
| Upload na Play Console | Requer conta Google do dono |

## 6. Verificação local possível sem credenciais

```bash
npm run check
npm run test:ci
node -e "const c=require('./app.config.ts')" # use tsc/vitest abaixo
```

Teste automatizado: `tests/playstore-android-config.test.ts` valida package, AAB profile e flags de produção.
