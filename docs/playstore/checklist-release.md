# Checklist de release — Google Play

## Antes do build

- [ ] Conta Google Play Console ativa (taxa de desenvolvedor paga)
- [ ] Organização / política de privacidade URL pública no ar (`https://afuagro.tech/privacidade`)
- [ ] Deploy web com rotas `/privacidade` e `/termos` (após merge deste PR)
- [ ] API `https://afu-mobile-v2-production.up.railway.app/api/health` → 200 (`ready: true`)
- [ ] `eas.json` profile `production`: `buildType: app-bundle`, demo login `0`, API Railway
- [ ] `applicationId` = `br.com.afuagro.app` (primeira publicação — não mudar depois)

## Assinatura e EAS

- [ ] `npx eas login` na conta Expo dona do projeto (`@sobierai/afu-mobile`)
- [ ] Credenciais Android: gerar keystore no EAS **ou** upload do keystore próprio (guardar backup!)
- [ ] `npm run eas:android:prod`
- [ ] Baixar o `.aab` do dashboard Expo

## Play Console — ficha

- [ ] Título: AFU Agro
- [ ] Descrição curta: `docs/playstore/descricao-curta.txt`
- [ ] Descrição completa: `docs/playstore/descricao-completa.txt`
- [ ] Ícone 512×512 (usar `assets/images/icon.png` / `public/icons/afu-icon-512.png`)
- [ ] Feature graphic 1024×500 (criar no Canva se ainda não existir)
- [ ] Screenshots telefone (mín. 2) — capturar do build interno/preview
- [ ] Política de privacidade URL
- [ ] Data safety: seguir `data-safety.md`
- [ ] Content rating: seguir `content-rating.md`
- [ ] Público-alvo / Families: **não** participar do Families se for só 18+

## Faixa de lançamento

- [ ] Upload do AAB na faixa **interna** (teste)
- [ ] Smoke: login e-mail/senha, diagnóstico (câmera), propriedade+GPS, notificação local
- [ ] Promover para fechada/aberta/produção quando estável

## Pós-release

- [ ] Guardar keystore / credentials EAS
- [ ] Próximas versões: só `eas build --profile production` (autoIncrement do versionCode)
- [ ] Nunca republicar com outro `applicationId`
