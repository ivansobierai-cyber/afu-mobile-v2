import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MediaFile {
  id: string;
  conteudoId: string;
  nome: string;
  tipo: 'imagem' | 'pdf' | 'video';
  base64: string;
  tamanho: number;
  dataCriacao: number;
  sincronizado: boolean;
}

interface MediaUploadProps {
  conteudoId: string;
  onMediaAdded?: (media: MediaFile) => void;
  maxArquivos?: number;
}

const STORAGE_KEY = 'admin_media_files';

export function MediaUpload({
  conteudoId,
  onMediaAdded,
  maxArquivos = 5,
}: MediaUploadProps) {
  const [medias, setMedias] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar mídias do AsyncStorage
  React.useEffect(() => {
    carregarMedias();
  }, [conteudoId]);

  const carregarMedias = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      if (data) {
        const todasMedias: MediaFile[] = JSON.parse(data);
        const mediasConteudo = todasMedias.filter(m => m.conteudoId === conteudoId);
        setMedias(mediasConteudo);
      }
    } catch (error) {
      console.error('Erro ao carregar mídias:', error);
    }
  }, [conteudoId]);

  const salvarMedias = useCallback(async (novasMedias: MediaFile[]) => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const todasMedias: MediaFile[] = data ? JSON.parse(data) : [];

      // Remover mídias antigas do conteúdo
      const outrasMedias = todasMedias.filter(m => m.conteudoId !== conteudoId);

      // Salvar todas
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...outrasMedias, ...novasMedias]));
      setMedias(novasMedias);

      if (onMediaAdded && novasMedias.length > medias.length) {
        onMediaAdded(novasMedias[novasMedias.length - 1]);
      }
    } catch (error) {
      console.error('Erro ao salvar mídias:', error);
    }
  }, [conteudoId, medias, onMediaAdded]);

  const adicionarMedia = useCallback(async (tipo: 'imagem' | 'pdf' | 'video', base64: string, nome: string) => {
    if (medias.length >= maxArquivos) {
      Alert.alert('Limite atingido', `Máximo de ${maxArquivos} arquivos por conteúdo`);
      return;
    }

    const novaMedia: MediaFile = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      conteudoId,
      nome,
      tipo,
      base64,
      tamanho: base64.length,
      dataCriacao: Date.now(),
      sincronizado: false,
    };

    await salvarMedias([...medias, novaMedia]);
  }, [medias, conteudoId, maxArquivos, salvarMedias]);

  const removerMedia = useCallback(async (mediaId: string) => {
    Alert.alert('Confirmar', 'Remover este arquivo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const novasMedias = medias.filter(m => m.id !== mediaId);
          await salvarMedias(novasMedias);
        },
      },
    ]);
  }, [medias, salvarMedias]);

  const simularUploadImagem = useCallback(async () => {
    // Simular seleção de imagem
    // Em produção, usar expo-image-picker
    const base64Mock = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    await adicionarMedia('imagem', base64Mock, `imagem_${Date.now()}.png`);
    Alert.alert('Sucesso', 'Imagem adicionada');
  }, [adicionarMedia]);

  const simularUploadPDF = useCallback(async () => {
    // Simular upload de PDF
    const base64Mock = 'JVBERi0xLjQKJeLj...'; // Truncado para brevidade
    await adicionarMedia('pdf', base64Mock, `documento_${Date.now()}.pdf`);
    Alert.alert('Sucesso', 'PDF adicionado');
  }, [adicionarMedia]);

  const simularUploadVideo = useCallback(async () => {
    // Simular upload de vídeo
    const base64Mock = 'AAAAIGZ0eXBpc29tAA...'; // Truncado para brevidade
    await adicionarMedia('video', base64Mock, `video_${Date.now()}.mp4`);
    Alert.alert('Sucesso', 'Vídeo adicionado');
  }, [adicionarMedia]);

  const formatarTamanho = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <View className="bg-surface rounded-lg p-4 border border-border">
      <Text className="text-lg font-bold text-foreground mb-4">Mídia do Conteúdo</Text>

      {/* Botões de Upload */}
      <View className="flex-row gap-2 mb-4">
        <TouchableOpacity
          onPress={simularUploadImagem}
          disabled={medias.length >= maxArquivos}
          className={`flex-1 px-3 py-2 rounded ${medias.length >= maxArquivos ? 'bg-border' : 'bg-primary'}`}
        >
          <Text className={`text-center font-semibold text-sm ${medias.length >= maxArquivos ? 'text-muted' : 'text-white'}`}>
            📷 Imagem
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={simularUploadPDF}
          disabled={medias.length >= maxArquivos}
          className={`flex-1 px-3 py-2 rounded ${medias.length >= maxArquivos ? 'bg-border' : 'bg-primary'}`}
        >
          <Text className={`text-center font-semibold text-sm ${medias.length >= maxArquivos ? 'text-muted' : 'text-white'}`}>
            📄 PDF
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={simularUploadVideo}
          disabled={medias.length >= maxArquivos}
          className={`flex-1 px-3 py-2 rounded ${medias.length >= maxArquivos ? 'bg-border' : 'bg-primary'}`}
        >
          <Text className={`text-center font-semibold text-sm ${medias.length >= maxArquivos ? 'text-muted' : 'text-white'}`}>
            🎥 Vídeo
          </Text>
        </TouchableOpacity>
      </View>

      {/* Status */}
      <Text className="text-xs text-muted mb-3">
        {medias.length}/{maxArquivos} arquivos
      </Text>

      {/* Lista de Mídias */}
      {medias.length > 0 ? (
        <ScrollView horizontal className="mb-4">
          {medias.map((media) => (
            <View key={media.id} className="bg-background rounded-lg p-3 mr-3 border border-border min-w-32">
              <View className="flex-row justify-between items-start mb-2">
                <Text className="text-2xl">
                  {media.tipo === 'imagem' ? '📷' : media.tipo === 'pdf' ? '📄' : '🎥'}
                </Text>
                <TouchableOpacity
                  onPress={() => removerMedia(media.id)}
                  className="bg-error/20 px-2 py-1 rounded"
                >
                  <Text className="text-error text-xs">✕</Text>
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-semibold text-foreground truncate mb-1">
                {media.nome}
              </Text>
              <Text className="text-xs text-muted mb-2">
                {formatarTamanho(media.tamanho)}
              </Text>

              <View className={`px-2 py-1 rounded ${media.sincronizado ? 'bg-success/20' : 'bg-warning/20'}`}>
                <Text className={`text-xs font-semibold ${media.sincronizado ? 'text-success' : 'text-warning'}`}>
                  {media.sincronizado ? '✓ Sincronizado' : '⏳ Pendente'}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="bg-background rounded-lg p-4 mb-4 items-center">
          <Text className="text-muted text-center text-sm">
            Nenhuma mídia adicionada ainda
          </Text>
        </View>
      )}

      {/* Dica */}
      <View className="bg-primary/10 rounded-lg p-3 border border-primary/20">
        <Text className="text-xs text-primary font-semibold mb-1">💡 Dica</Text>
        <Text className="text-xs text-primary/80">
          Todos os arquivos são armazenados localmente em base64 e sincronizados automaticamente quando online.
        </Text>
      </View>
    </View>
  );
}
