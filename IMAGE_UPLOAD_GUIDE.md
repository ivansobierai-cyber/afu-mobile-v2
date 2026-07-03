# Upload de Imagens no Editor HTML — Guia de Uso

Suporte completo para upload de imagens diretamente no editor visual com conversão automática para base64 e inserção de tags HTML.

## Características

- **Seleção da Galeria** — Escolha imagens do dispositivo
- **Captura de Câmera** — Tire fotos diretamente
- **Conversão Base64** — Imagens embutidas no HTML
- **Validação Automática** — Verifica tamanho e tipo
- **Inserção Automática** — Tags img geradas automaticamente
- **Estilos Responsivos** — Imagens se adaptam ao tamanho da tela

## Instalação

O suporte a imagens já está integrado. Certifique-se de ter as dependências:

```bash
pnpm add expo-image-picker expo-file-system
```

## Como Usar

### 1. Abrir o Editor

Acesse a tela de conteúdos e clique em "Novo Conteúdo" ou edite um existente.

### 2. Inserir Imagem

1. Clique no botão **🖼️ Imagem** na toolbar
2. Escolha **📱 Galeria** ou **📷 Câmera**
3. Selecione ou tire uma foto
4. A imagem será inserida automaticamente no final do conteúdo

### 3. Visualizar Preview

Clique na aba **👁️ Preview** para ver como a imagem ficará no conteúdo final.

## Hook useImageUpload

O hook `useImageUpload` gerencia toda a lógica de upload:

```tsx
import { useImageUpload } from '@/hooks/use-image-upload';

export function MyComponent() {
  const {
    uploading,
    uploadedImages,
    pickFromGallery,
    takePhoto,
    removeImage,
    clearImages,
    generateImgTag,
  } = useImageUpload();

  const handleUpload = async () => {
    const image = await pickFromGallery();
    if (image) {
      const imgTag = generateImgTag(image, 'Minha imagem');
      console.log(imgTag);
    }
  };

  return (
    <TouchableOpacity onPress={handleUpload} disabled={uploading}>
      <Text>{uploading ? 'Enviando...' : 'Selecionar Imagem'}</Text>
    </TouchableOpacity>
  );
}
```

## Opções de Configuração

```tsx
const { pickFromGallery } = useImageUpload({
  maxSizeMB: 5, // Tamanho máximo em MB
  allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
});
```

## Validação

O hook valida automaticamente:

| Validação | Padrão | Customizável |
|-----------|--------|--------------|
| Tamanho máximo | 5 MB | ✅ Sim |
| Formatos | JPEG, PNG, GIF, WebP | ✅ Sim |
| Tipo MIME | image/* | ✅ Sim |

### Formatos Suportados

- **JPEG** — `image/jpeg` — Fotos e imagens coloridas
- **PNG** — `image/png` — Imagens com transparência
- **GIF** — `image/gif` — Animações
- **WebP** — `image/webp` — Compressão moderna

## Estrutura de Dados

```typescript
interface UploadedImage {
  id: string;              // ID único: img_timestamp_random
  base64: string;          // Dados da imagem em base64
  filename: string;        // Nome do arquivo original
  mimeType: string;        // Tipo MIME (image/jpeg, etc)
  width?: number;          // Largura em pixels
  height?: number;         // Altura em pixels
  sizeBytes: number;       // Tamanho em bytes
}
```

## Geração de Tag IMG

O hook gera tags IMG com estilos responsivos:

```html
<img 
  src="data:image/jpeg;base64,/9j/4AAQSkZJRgABA..." 
  alt="Imagem inserida" 
  style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" 
/>
```

### Estilos Aplicados

| Estilo | Valor | Propósito |
|--------|-------|----------|
| `max-width` | 100% | Responsividade |
| `height` | auto | Manter proporção |
| `border-radius` | 4px | Cantos arredondados |
| `margin` | 8px 0 | Espaçamento |

## Fluxo de Upload

```
1. Usuário clica em 🖼️ Imagem
   ↓
2. Menu aparece com Galeria / Câmera
   ↓
3. Usuário seleciona ou tira foto
   ↓
4. Validação de tamanho e tipo
   ↓
5. Conversão para base64
   ↓
6. Geração de tag img
   ↓
7. Inserção no HTML
   ↓
8. Preview atualizado
```

## Exemplos

### Exemplo 1: Artigo com Imagem

```html
<h1>Meu Artigo</h1>
<p>Introdução do artigo...</p>
<img src="data:image/jpeg;base64,..." alt="Foto principal" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />
<p>Conteúdo após a imagem...</p>
```

### Exemplo 2: Guia com Múltiplas Imagens

```html
<h1>Guia Passo a Passo</h1>
<h2>Passo 1</h2>
<p>Descrição do passo 1</p>
<img src="data:image/png;base64,..." alt="Passo 1" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />
<h2>Passo 2</h2>
<p>Descrição do passo 2</p>
<img src="data:image/png;base64,..." alt="Passo 2" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />
```

## Permissões

O hook solicita permissões automaticamente:

### iOS

Adicione ao `Info.plist`:
```xml
<key>NSPhotoLibraryUsageDescription</key>
<string>Precisamos acessar suas fotos para inserir imagens</string>
<key>NSCameraUsageDescription</key>
<string>Precisamos acessar sua câmera para tirar fotos</string>
```

### Android

Adicione ao `AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

## Limitações

- **Tamanho máximo** — 5 MB por padrão (customizável)
- **Formatos** — Apenas imagens (JPEG, PNG, GIF, WebP)
- **Armazenamento** — Base64 aumenta tamanho do HTML
- **Performance** — Muitas imagens grandes podem deixar lento

## Otimizações

### Reduzir Tamanho

```tsx
const { pickFromGallery } = useImageUpload({
  maxSizeMB: 2, // Reduzir limite
});
```

### Comprimir Imagens

Use ferramentas externas antes de fazer upload:
- TinyPNG
- ImageOptim
- Squoosh

### Lazy Loading

Para muitas imagens, considere carregar sob demanda:
```html
<img src="..." alt="..." loading="lazy" />
```

## Troubleshooting

### Permissão Negada

**Problema:** "Acesso à galeria é necessário"

**Solução:**
1. Vá para Configurações do dispositivo
2. Encontre o app AFU
3. Ative permissões de Câmera e Galeria

### Imagem Muito Grande

**Problema:** "Imagem muito grande. Máximo: 5MB"

**Solução:**
1. Comprima a imagem antes de fazer upload
2. Use um formato mais eficiente (WebP)
3. Reduza a resolução

### Formato Não Suportado

**Problema:** "Formato não suportado"

**Solução:**
1. Converta para JPEG, PNG, GIF ou WebP
2. Use um conversor online se necessário

### Imagem Não Aparece no Preview

**Problema:** Preview em branco ou sem imagem

**Solução:**
1. Verifique se a imagem foi inserida (veja o HTML)
2. Clique na aba Editor e depois Preview
3. Tente com uma imagem diferente

## Testes

Execute os testes de upload:

```bash
pnpm test tests/image-upload.test.ts
```

Cobertura:
- ✅ Validação de arquivo (tipo e tamanho)
- ✅ Conversão para base64
- ✅ Geração de tag img
- ✅ Inserção no editor
- ✅ Múltiplas imagens
- ✅ Metadados de imagem
- ✅ Tratamento de erros

## Roadmap

- [ ] Suporte a SVG
- [ ] Compressão automática
- [ ] Crop de imagens
- [ ] Filtros e efeitos
- [ ] Sincronização com servidor
- [ ] Galeria de imagens inseridas
- [ ] Undo/Redo para imagens
