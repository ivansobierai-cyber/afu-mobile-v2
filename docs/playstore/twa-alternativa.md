# Alternativa: TWA (Trusted Web Activity) via PWABuilder

O PR #57 preparou a web app para empacotamento TWA:

- `public/manifest.webmanifest`
- `public/service-worker.js`
- ícones PWA em `public/icons/`
- `scripts/prepare-web-dist.mjs` copia esses assets para `dist/`

## Quando usar TWA

- Precisa publicar rapidamente um wrapper do site https://afuagro.tech
- Aceita limitações de câmera, push e armazenamento frente ao app nativo
- Quer manter um segundo listing “web” (não recomendado como app principal)

## Quando **não** usar como release principal

O AFU Agro depende de `expo-image-picker`, `expo-location`, `expo-notifications`, SecureStore e sync offline. Esses fluxos são de primeira classe no AAB Expo; no TWA ficam degradados ou indisponíveis.

## Como gerar (resumo)

1. Deploy web atualizado em https://afuagro.tech  
2. Abrir [PWABuilder](https://www.pwabuilder.com/) e informar a URL  
3. Gerar pacote Android (TWA) e assinar conforme o assistente  
4. Declarar no Play Console que o app é TWA/WebView se aplicável  

**Recomendação do repositório:** manter TWA apenas como contingência; release oficial = EAS AAB.
