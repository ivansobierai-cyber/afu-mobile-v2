# AFU AGI — integração com AFU Agro

App Android nativo em `apps/agi-mobile/` (Kotlin + Jetpack Compose), interface do assistente multiagente para o workflow AFU Agro.

## Estrutura

| Path | Papel |
|------|--------|
| `apps/agi-mobile/` | Projeto Gradle (applicationId `tech.afuagro.agi`, nome **AFU AGI**) |
| `server/plant-healthy-gateway.ts` | Gateway REST fino `/api/plant_healthy/*` + `/api/agi/*` |
| `docs/agi/` | Contratos e assinatura de release |

## Painel (Dashboard)

Destino de navegação de primeiro nível **Painel** (`AgiRoute.Dashboard`), separado do Chat:

- Resumo da fazenda (org/propriedade AFU após login JWT)
- Status de agentes e tarefas
- Métricas de monitoramento (latência, tokens, erros)
- Atalhos para Agentes, Tarefas e Planta Saudável

Telas existentes (Home, Chat, Agents, Tasks, Menu, ApiRouter, Memory, Intelligence, PlantHealthy, Settings) permanecem.

## Contrato REST (gateway)

Auth: `Authorization: Bearer <accessToken JWT AFU>`.

| Método | Path | Descrição |
|--------|------|-----------|
| `POST` | `/api/agi/auth/login` | Login e-mail/senha → access + refresh + org |
| `POST` | `/api/agi/auth/refresh` | Renova access token |
| `GET` | `/api/agi/context` | Org ativa + propriedades (tenant) |
| `POST` | `/api/agi/context/select` | Troca org ativa (+ propriedade opcional) |
| `POST` | `/api/plant_healthy/analyze_image` | Diagnóstico IA (Forge no servidor) + persistência |
| `POST` | `/api/plant_healthy/telemetry` | Telemetria IoT normalizada (audit log tenant) |
| `GET` | `/api/plant_healthy/alerts` | Alertas da propriedade ou diagnósticos graves |

Body `analyze_image` (cliente AGI):

```json
{
  "image_base64": "...",
  "crop_type": "soja",
  "generation": "G3",
  "field_notes": "folhas amareladas",
  "propriedade_id": 1,
  "persist": true
}
```

Resposta mapeada para o contrato AGI (`diagnosis`, `confidence` 0–1, `recommendations`, …) + `diagnostico_id`.

RBAC: mesmas permissões tRPC (`diagnostics.write`, `property.read`) e isolamento por `organizationId`.

## Deep links

| Scheme | Exemplo | Destino |
|--------|---------|---------|
| `afuagi://` | `afuagi://dashboard` | Painel |
| `afuagi://` | `afuagi://chat` | Chat |
| `afuagi://` | `afuagi://plant` | Planta Saudável |
| `afuagro://agi/...` | `afuagro://agi/dashboard` | Idem (companion AFU Agro) |

No AFU Agro (Expo), abrir o AGI com `Linking.openURL('afuagi://dashboard')` (opcional).

## Build debug / testes

```bash
cd apps/agi-mobile
echo "sdk.dir=$ANDROID_HOME" > local.properties   # ou caminho do SDK
./gradlew :app:assembleDebug :app:testDebugUnitTest
```

APK debug: `apps/agi-mobile/app/build/outputs/apk/debug/app-debug.apk`

## Release signing (keystore do dono)

O `build.gradle.kts` espera variáveis de ambiente (não commitar o `.jks`):

| Env | Uso |
|-----|-----|
| `KEYSTORE_PATH` | Caminho absoluto do `*.jks` / `*.keystore` |
| `STORE_PASSWORD` | Senha do keystore |
| `KEY_PASSWORD` | Senha da key `upload` |

```bash
export KEYSTORE_PATH=/secure/afu-agi-upload.jks
export STORE_PASSWORD=...
export KEY_PASSWORD=...
./gradlew :app:assembleRelease
```

Passos do dono:

1. Gerar keystore Play (`keytool -genkeypair -keystore afu-agi-upload.jks -alias upload ...`) se ainda não existir.
2. Guardar em cofre (1Password/etc.) — **nunca** no Git.
3. Configurar secrets no CI/EAS ou build local com as env acima.
4. Publicar AAB/APK na Play Console (app separado do AFU Agro Expo).

## n8n (WP-11 — fora deste PR)

Workflows orquestrador/status/memory-sync continuam configuráveis em **Configurações → SERVIDOR AGI & N8N**. O gateway Planta Saudável não substitui o n8n; ele amarra o agente agrícola ao backend AFU real.
