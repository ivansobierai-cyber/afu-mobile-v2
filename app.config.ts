// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig, ConfigContext } from "expo/config";

/** Application ID estável para Play Store / App Store (não usar IDs Manus de template). */
const ANDROID_PACKAGE = "br.com.afuagro.app";
const IOS_BUNDLE_ID = "br.com.afuagro.app";
const DEEP_LINK_SCHEME = "afuagro";

/** Cleartext só em perfis locais/dev; produção e preview HTTPS ficam bloqueados. */
const easProfile = process.env.EAS_BUILD_PROFILE ?? "";
const allowCleartext =
  easProfile === "development" ||
  easProfile === "apk" ||
  process.env.ALLOW_CLEARTEXT === "1";

const env = {
  appName: "AFU Agro",
  appSlug: "afu-mobile",
  scheme: DEEP_LINK_SCHEME,
  iosBundleId: IOS_BUNDLE_ID,
  androidPackage: ANDROID_PACKAGE,
};

export default ({ config: _config }: ConfigContext): ExpoConfig => {
  const config: ExpoConfig = {
    name: env.appName,
    slug: env.appSlug,
    owner: "sobierai",
    extra: {
      eas: {
        projectId: "a1dfdf25-6741-4df3-b724-cabb3aab3174",
      },
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
      privacyPolicyUrl: "https://afuagro.tech/privacidade",
      termsUrl: "https://afuagro.tech/termos",
    },
    /**
     * versionName (visível na loja). versionCode Android é gerido pelo EAS
     * (`cli.appVersionSource: remote` + `autoIncrement` no profile production).
     */
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: env.scheme,
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: env.iosBundleId,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSCameraUsageDescription:
          "O AFU Agro precisa da câmera para fotografar plantas no diagnóstico.",
        NSPhotoLibraryUsageDescription:
          "O AFU Agro precisa das fotos para anexar imagens ao diagnóstico e eventos.",
        NSLocationWhenInUseUsageDescription:
          "O AFU Agro usa sua localização para marcar propriedades no mapa.",
      },
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#2D6A4F",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: env.androidPackage,
      /**
       * Permissões alinhadas ao uso real do código:
       * - CAMERA / READ_MEDIA_IMAGES → expo-image-picker (diagnóstico e anexos)
       * - ACCESS_*_LOCATION → expo-location (marcação de propriedades)
       * - POST_NOTIFICATIONS → expo-notifications (lembretes e push)
       * Sem microfone: expo-audio não é usado no app.
       * Sem storage legado WRITE/READ_EXTERNAL_STORAGE (Play rejeita em API 33+).
       */
      permissions: [
        "CAMERA",
        "READ_MEDIA_IMAGES",
        "POST_NOTIFICATIONS",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
      ],
      blockedPermissions: [
        // App não grava áudio; expo-audio no package.json ainda declara isso no manifesto nativo.
        "android.permission.RECORD_AUDIO",
        "android.permission.MODIFY_AUDIO_SETTINGS",
        "android.permission.FOREGROUND_SERVICE_MICROPHONE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_VIDEO",
        "android.permission.READ_MEDIA_AUDIO",
      ],
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: env.scheme,
              host: "*",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
      name: env.appName,
      shortName: "AFU Agro",
      description:
        "Diagnóstico inteligente de plantas, gestão de cultivos e suporte para produtores rurais.",
      themeColor: "#2D6A4F",
      backgroundColor: "#0F1A14",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "expo-web-browser",
      // Pacotes de áudio/vídeo ficam no package.json para uso futuro,
      // mas não entram nos plugins de produção para não injetar RECORD_AUDIO / PiP.
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#2D6A4F",
          dark: {
            backgroundColor: "#0F1A14",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            buildArchs: ["armeabi-v7a", "arm64-v8a"],
            minSdkVersion: 24,
            targetSdkVersion: 35,
            usesCleartextTraffic: allowCleartext,
          },
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "O AFU Agro precisa de acesso às suas fotos para diagnóstico de plantas e anexos.",
          cameraPermission:
            "O AFU Agro precisa de acesso à câmera para fotografar plantas.",
          // Diagnóstico usa só imagem — não solicitar microfone / RECORD_AUDIO.
          microphonePermission: false,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "O AFU Agro usa sua localização para marcar propriedades no mapa.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/images/icon.png",
          color: "#2D6A4F",
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  };

  return config;
};
