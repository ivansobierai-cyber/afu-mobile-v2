import { Platform, Alert, Share } from "react-native";
import { openBrowserAsync, WebBrowserPresentationStyle } from "expo-web-browser";

/**
 * Abre o HTML do laudo para visualização/impressão.
 * Web: nova janela + diálogo de impressão (salvar como PDF).
 * Mobile: WebBrowser com data URI HTML.
 */
export async function openLaudoHtml(html: string, titulo: string): Promise<void> {
  if (Platform.OS === "web") {
    const win = window.open("", "_blank");
    if (!win) {
      Alert.alert("Popup bloqueado", "Permita pop-ups no navegador para visualizar o laudo.");
      return;
    }
    win.document.write(html);
    win.document.title = titulo;
    win.document.close();
    win.focus();
    setTimeout(() => {
      try {
        win.print();
      } catch {
        // Usuário pode imprimir manualmente (Ctrl+P)
      }
    }, 400);
    return;
  }

  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  try {
    await openBrowserAsync(dataUrl, {
      presentationStyle: WebBrowserPresentationStyle.FULL_SCREEN,
    });
  } catch {
    await Share.share({ title: titulo, message: `${titulo}\n\nLaudo salvo no módulo Relatórios do AFU Agro.` });
  }
}
