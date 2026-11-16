# Google Play Store — AFU Agro

## Caminho de release escolhido

**Primário: EAS Build production → Android App Bundle (`.aab`) do app Expo nativo.**

| Critério | EAS AAB (Expo nativo) | TWA via PWABuilder (PR #57) |
|----------|------------------------|-----------------------------|
| Câmera / galeria (diagnóstico) | APIs nativas (`expo-image-picker`) | Depende do Chrome WebView; UX inferior |
| Localização (mapa de propriedades) | `expo-location` + permissões Android | Geolocation web, mais frágil |
| Notificações push / locais | `expo-notifications` + canal Android | Limitado / sem Expo Push nativo |
| SecureStore / fila offline | Completo | Armazenamento web |
| Play exige AAB assinado | Suportado (`buildType: app-bundle`) | Também gera AAB, mas empacota o site |
| Já preparado no repo | `eas.json` + `npm run eas:android:prod` | `public/manifest.webmanifest` + SW |

**Conclusão:** o produto mobile usa recursos nativos de forma central. O AAB Expo é o caminho correto para a Play Store. O TWA permanece como **alternativa documentada** (ver `twa-alternativa.md`) para um atalho web-only, não como build principal.

## Identidade do app

| Campo | Valor |
|-------|--------|
| Nome | AFU Agro |
| applicationId | `br.com.afuagro.app` |
| scheme deep link | `afuagro` |
| versionName | `1.0.0` (`app.config.ts` → `version`) |
| versionCode | EAS remoto (`appVersionSource: remote` + `autoIncrement` no profile `production`) |
| API produção | `https://api.afuagro.tech` |
| Demo login / skip auth | **desligados** no profile `production` |
| Política de privacidade | https://afuagro.tech/privacidade |
| Termos | https://afuagro.tech/termos |

## Artefatos nesta pasta

| Arquivo | Uso |
|---------|-----|
| `descricao-curta.txt` | Descrição curta (≤ 80 caracteres) |
| `descricao-completa.txt` | Descrição completa da ficha |
| `data-safety.md` | Respostas do formulário Data safety (derivadas do código) |
| `content-rating.md` | Notas para o questionário IARC |
| `checklist-release.md` | Checklist operacional |
| `politica-privacidade.md` | Espelho markdown da política (fonte de verdade no código: `lib/legal/privacidade-content.ts`) |
| `twa-alternativa.md` | Quando/como usar TWA |
| `passos-do-dono.md` | Credenciais Expo/Google/keystore — passos exatos |

## Comando de build (na máquina do dono)

```bash
npx eas login
npm run eas:android:prod
# ou: eas build --platform android --profile production
```

O profile `production` gera **app-bundle** (`.aab`), sem `EXPO_PUBLIC_SHOW_DEMO_LOGIN` e apontando para `api.afuagro.tech`.
