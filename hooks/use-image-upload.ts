import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Alert } from 'react-native';

interface ImageUploadOptions {
  maxSizeMB?: number;
  allowedFormats?: string[];
}

interface UploadedImage {
  id: string;
  base64: string;
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
  sizeBytes: number;
}

const DEFAULT_OPTIONS: ImageUploadOptions = {
  maxSizeMB: 5,
  allowedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
};

/**
 * Hook useImageUpload — Gerencia seleção e conversão de imagens para base64
 *
 * Recursos:
 * - Seleção de imagens da galeria ou câmera
 * - Conversão automática para base64
 * - Validação de tamanho e tipo de arquivo
 * - Geração de IDs únicos para imagens
 * - Tratamento de erros com feedback ao usuário
 */
export function useImageUpload(options: ImageUploadOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // Solicitar permissão de acesso à galeria
  const requestGalleryPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }, []);

  // Solicitar permissão de acesso à câmera
  const requestCameraPermission = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    return status === 'granted';
  }, []);

  // Converter arquivo para base64
  const fileToBase64 = useCallback(async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Erro ao converter arquivo para base64:', error);
      throw new Error('Falha ao converter imagem');
    }
  }, []);

  // Obter informações do arquivo
  const getFileInfo = useCallback(
    async (uri: string): Promise<{ sizeBytes: number; filename: string }> => {
      try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        const filename = uri.split('/').pop() || 'image.jpg';
        const sizeBytes = (fileInfo as any).size || 0;
        return {
          sizeBytes,
          filename,
        };
      } catch (error) {
        console.error('Erro ao obter informações do arquivo:', error);
        return { sizeBytes: 0, filename: 'image.jpg' };
      }
    },
    [],
  );

  // Validar imagem
  const validateImage = useCallback(
    (mimeType: string, sizeBytes: number): { valid: boolean; error?: string } => {
      // Validar tipo
      if (!config.allowedFormats?.includes(mimeType)) {
        return {
          valid: false,
          error: `Formato não suportado. Use: ${config.allowedFormats?.join(', ')}`,
        };
      }

      // Validar tamanho
      const maxSizeBytes = (config.maxSizeMB || 5) * 1024 * 1024;
      if (sizeBytes > maxSizeBytes) {
        const maxMB = config.maxSizeMB || 5;
        return {
          valid: false,
          error: `Imagem muito grande. Máximo: ${maxMB}MB`,
        };
      }

      return { valid: true };
    },
    [config],
  );

  // Selecionar imagem da galeria
  const pickFromGallery = useCallback(async (): Promise<UploadedImage | null> => {
    try {
      setUploading(true);

      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        Alert.alert('Permissão negada', 'Acesso à galeria é necessário');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const mimeType = asset.type === 'image' ? 'image/jpeg' : 'image/png';

      // Obter informações do arquivo
      const fileInfo = await getFileInfo(asset.uri);

      // Validar imagem
      const validation = validateImage(mimeType, fileInfo.sizeBytes);
      if (!validation.valid) {
        Alert.alert('Erro', validation.error || 'Imagem inválida');
        return null;
      }

      // Converter para base64
      const base64 = await fileToBase64(asset.uri);

      const uploadedImage: UploadedImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        base64,
        filename: fileInfo.filename,
        mimeType,
        width: asset.width,
        height: asset.height,
        sizeBytes: fileInfo.sizeBytes,
      };

      setUploadedImages((prev) => [...prev, uploadedImage]);
      return uploadedImage;
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Falha ao selecionar imagem');
      return null;
    } finally {
      setUploading(false);
    }
  }, [requestGalleryPermission, getFileInfo, validateImage, fileToBase64]);

  // Tirar foto com câmera
  const takePhoto = useCallback(async (): Promise<UploadedImage | null> => {
    try {
      setUploading(true);

      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        Alert.alert('Permissão negada', 'Acesso à câmera é necessário');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      const asset = result.assets[0];
      const mimeType = 'image/jpeg';

      // Obter informações do arquivo
      const fileInfo = await getFileInfo(asset.uri);

      // Validar imagem
      const validation = validateImage(mimeType, fileInfo.sizeBytes);
      if (!validation.valid) {
        Alert.alert('Erro', validation.error || 'Imagem inválida');
        return null;
      }

      // Converter para base64
      const base64 = await fileToBase64(asset.uri);

      const uploadedImage: UploadedImage = {
        id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        base64,
        filename: fileInfo.filename,
        mimeType,
        width: asset.width,
        height: asset.height,
        sizeBytes: fileInfo.sizeBytes,
      };

      setUploadedImages((prev) => [...prev, uploadedImage]);
      return uploadedImage;
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      Alert.alert('Erro', 'Falha ao tirar foto');
      return null;
    } finally {
      setUploading(false);
    }
  }, [requestCameraPermission, getFileInfo, validateImage, fileToBase64]);

  // Remover imagem do histórico
  const removeImage = useCallback((imageId: string) => {
    setUploadedImages((prev) => prev.filter((img) => img.id !== imageId));
  }, []);

  // Limpar todas as imagens
  const clearImages = useCallback(() => {
    setUploadedImages([]);
  }, []);

  // Gerar tag img HTML
  const generateImgTag = useCallback(
    (image: UploadedImage, alt: string = 'Imagem'): string => {
      const dataUrl = `data:${image.mimeType};base64,${image.base64}`;
      return `<img src="${dataUrl}" alt="${alt}" style="max-width: 100%; height: auto; border-radius: 4px; margin: 8px 0;" />`;
    },
    [],
  );

  return {
    uploading,
    uploadedImages,
    pickFromGallery,
    takePhoto,
    removeImage,
    clearImages,
    generateImgTag,
  };
}
