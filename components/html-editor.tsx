import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useImageUpload } from '@/hooks/use-image-upload';

interface HtmlEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  maxHeight?: number;
}

type FormatAction = 'bold' | 'italic' | 'underline' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'link' | 'quote' | 'code' | 'hr';

const TOOLBAR_ACTIONS: Array<{ id: FormatAction; label: string; icon: string; description: string }> = [
  { id: 'bold', label: 'Negrito', icon: '𝐁', description: 'Ctrl+B' },
  { id: 'italic', label: 'Itálico', icon: '𝐈', description: 'Ctrl+I' },
  { id: 'underline', label: 'Sublinhado', icon: 'U̲', description: 'Ctrl+U' },
  { id: 'h1', label: 'Título 1', icon: 'H1', description: 'Título principal' },
  { id: 'h2', label: 'Título 2', icon: 'H2', description: 'Subtítulo' },
  { id: 'h3', label: 'Título 3', icon: 'H3', description: 'Seção' },
  { id: 'ul', label: 'Lista', icon: '•', description: 'Lista com pontos' },
  { id: 'ol', label: 'Numerada', icon: '1.', description: 'Lista numerada' },
  { id: 'quote', label: 'Citação', icon: '"', description: 'Bloco de citação' },
  { id: 'code', label: 'Código', icon: '</>', description: 'Bloco de código' },
  { id: 'link', label: 'Link', icon: '🔗', description: 'Inserir link' },
  { id: 'hr', label: 'Linha', icon: '—', description: 'Linha divisória' },
];

/**
 * HtmlEditor — Editor visual com toolbar de formatação e preview em tempo real
 * 
 * Suporta:
 * - Formatação básica (negrito, itálico, sublinhado)
 * - Títulos (H1, H2, H3)
 * - Listas (com pontos e numeradas)
 * - Citações e blocos de código
 * - Links e linhas divisórias
 * - Preview em tempo real com WebView
 */
export function HtmlEditor({
  value,
  onChange,
  placeholder = 'Digite seu conteúdo aqui...',
  maxHeight = 400,
}: HtmlEditorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [showImageOptions, setShowImageOptions] = useState(false);
  const { uploading, pickFromGallery, takePhoto, generateImgTag } = useImageUpload();

  // Inserir imagem no editor
  const handleInsertImage = useCallback(
    async (source: 'gallery' | 'camera') => {
      try {
        const image = source === 'gallery' ? await pickFromGallery() : await takePhoto();
        if (image) {
          const imgTag = generateImgTag(image, 'Imagem inserida');
          const newHtml = value + '\n' + imgTag + '\n';
          onChange(newHtml);
          setShowImageOptions(false);
          Alert.alert('Sucesso', 'Imagem inserida com sucesso');
        }
      } catch (error) {
        Alert.alert('Erro', 'Falha ao inserir imagem');
        console.error(error);
      }
    },
    [value, onChange, pickFromGallery, takePhoto, generateImgTag],
  );

  // Aplicar formatação ao texto
  const applyFormat = useCallback((action: FormatAction) => {
    let newHtml = value;
    const hasSelection = selectedText.length > 0;
    const textToFormat = hasSelection ? selectedText : 'texto';

    switch (action) {
      case 'bold':
        newHtml = value.replace(selectedText, `<strong>${textToFormat}</strong>`);
        break;
      case 'italic':
        newHtml = value.replace(selectedText, `<em>${textToFormat}</em>`);
        break;
      case 'underline':
        newHtml = value.replace(selectedText, `<u>${textToFormat}</u>`);
        break;
      case 'h1':
        newHtml = value.replace(selectedText, `<h1>${textToFormat}</h1>`);
        break;
      case 'h2':
        newHtml = value.replace(selectedText, `<h2>${textToFormat}</h2>`);
        break;
      case 'h3':
        newHtml = value.replace(selectedText, `<h3>${textToFormat}</h3>`);
        break;
      case 'ul':
        newHtml = value.replace(selectedText, `<ul><li>${textToFormat}</li></ul>`);
        break;
      case 'ol':
        newHtml = value.replace(selectedText, `<ol><li>${textToFormat}</li></ol>`);
        break;
      case 'quote':
        newHtml = value.replace(selectedText, `<blockquote>${textToFormat}</blockquote>`);
        break;
      case 'code':
        newHtml = value.replace(selectedText, `<code>${textToFormat}</code>`);
        break;
      case 'link':
        Alert.prompt(
          'Inserir Link',
          'Digite a URL:',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Inserir',
              onPress: (url: string | undefined) => {
                if (url) {
                  const linkHtml = `<a href="${url}">${textToFormat}</a>`;
                  onChange(value.replace(selectedText, linkHtml));
                }
              },
            },
          ],
          'plain-text',
        );
        return;
      case 'hr':
        newHtml = value + '\n<hr />\n';
        break;
    }

    onChange(newHtml);
    setSelectedText('');
  }, [value, selectedText, onChange]);

  // Gerar HTML para preview
  const generatePreviewHtml = useCallback((htmlContent: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
            padding: 16px;
            margin: 0;
          }
          h1 { font-size: 28px; font-weight: bold; margin: 16px 0 8px 0; }
          h2 { font-size: 22px; font-weight: bold; margin: 12px 0 6px 0; }
          h3 { font-size: 18px; font-weight: bold; margin: 10px 0 4px 0; }
          p { margin: 8px 0; }
          ul, ol { margin: 8px 0; padding-left: 20px; }
          li { margin: 4px 0; }
          blockquote {
            border-left: 4px solid #0a7ea4;
            padding-left: 12px;
            margin: 8px 0;
            font-style: italic;
            color: #666;
          }
          code {
            background: #f0f0f0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
          }
          pre {
            background: #f0f0f0;
            padding: 12px;
            border-radius: 4px;
            overflow-x: auto;
            margin: 8px 0;
          }
          a {
            color: #0a7ea4;
            text-decoration: underline;
          }
          hr {
            border: none;
            border-top: 1px solid #ddd;
            margin: 16px 0;
          }
          strong { font-weight: bold; }
          em { font-style: italic; }
          u { text-decoration: underline; }
        </style>
      </head>
      <body>
        ${htmlContent || '<p style="color: #999;">Preview aparecerá aqui...</p>'}
      </body>
      </html>
    `;
  }, []);



  return (
    <View className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Header com abas */}
      <View className="flex-row border-b border-border bg-background">
        <TouchableOpacity
          onPress={() => setShowPreview(false)}
          className={`flex-1 py-3 items-center ${!showPreview ? 'bg-primary' : 'bg-background'}`}
        >
          <Text className={`font-semibold ${!showPreview ? 'text-white' : 'text-foreground'}`}>
            ✏️ Editor
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowPreview(true)}
          className={`flex-1 py-3 items-center ${showPreview ? 'bg-primary' : 'bg-background'}`}
        >
          <Text className={`font-semibold ${showPreview ? 'text-white' : 'text-foreground'}`}>
            👁️ Preview
          </Text>
        </TouchableOpacity>
      </View>

      {!showPreview ? (
        <View>
          {/* Toolbar de Formatação */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="bg-background border-b border-border p-2"
          >
            <View className="flex-row flex-wrap">
              {TOOLBAR_ACTIONS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => applyFormat(item.id)}
                  className="bg-primary/20 rounded px-3 py-2 mr-2 mb-2 items-center justify-center"
                >
                  <Text className="text-primary font-bold text-lg">{item.icon}</Text>
                  <Text className="text-xs text-primary mt-1 text-center">{item.label}</Text>
                </TouchableOpacity>
              ))}
              {/* Botão de Upload de Imagens */}
              <TouchableOpacity
                onPress={() => setShowImageOptions(!showImageOptions)}
                disabled={uploading}
                className="bg-success/20 rounded px-3 py-2 mr-2 mb-2 items-center justify-center"
              >
                <Text className="text-success font-bold text-lg">🖼️</Text>
                <Text className="text-xs text-success mt-1 text-center">Imagem</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Editor de Texto */}
          <TextInput
            value={value}
            onChangeText={onChange}
            onSelectionChange={(e) => {
              const start = e.nativeEvent.selection.start;
              const end = e.nativeEvent.selection.end;
              setSelectedText(value.substring(start, end));
              setCursorPosition(start);
            }}
            placeholder={placeholder}
            placeholderTextColor="#999"
            multiline
            numberOfLines={12}
            className="bg-background text-foreground p-4 text-base"
            style={{ maxHeight }}
          />

          {/* Menu de Opções de Imagem */}
          {showImageOptions && (
            <View className="bg-success/10 border-t border-success/20 p-3 flex-row gap-2">
              <TouchableOpacity
                onPress={() => handleInsertImage('gallery')}
                disabled={uploading}
                className="flex-1 bg-success/20 px-3 py-2 rounded items-center"
              >
                <Text className="text-success font-semibold">📱 Galeria</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleInsertImage('camera')}
                disabled={uploading}
                className="flex-1 bg-success/20 px-3 py-2 rounded items-center"
              >
                <Text className="text-success font-semibold">📷 Câmera</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Info */}
          <View className="bg-primary/10 border-t border-border p-3">
            <Text className="text-xs text-primary">
              💡 Dica: Selecione texto e clique em um botão da toolbar para formatar. Use HTML diretamente se preferir.
            </Text>
          </View>
        </View>
      ) : (
        <View style={{ height: maxHeight, flex: 1 }}>
          <WebView
            source={{ html: generatePreviewHtml(value) }}
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
          />
        </View>
      )}
    </View>
  );
}
