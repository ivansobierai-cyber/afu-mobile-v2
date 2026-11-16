# AFU AGI (Android)

Interface nativa do assistente multiagente AFU Agro.

- **applicationId / namespace:** `tech.afuagro.agi`
- **Nome:** AFU AGI
- **Integração:** JWT AFU + gateway REST em `server/plant-healthy-gateway.ts`
- **Docs:** [docs/agi/AFU_AGI_INTEGRATION.md](../../docs/agi/AFU_AGI_INTEGRATION.md)

## Setup

```bash
cp .env.example .env   # sem chaves LLM
echo "sdk.dir=$ANDROID_HOME" > local.properties
./gradlew :app:assembleDebug :app:testDebugUnitTest
```

Emulador → API local: `http://10.0.2.2:3000` (Configurações → Conta AFU Agro).

## Release

Ver seção de assinatura em `docs/agi/AFU_AGI_INTEGRATION.md` (keystore do dono via env).
