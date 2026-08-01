/** Limites e helpers compartilhados — upload de anexo em Eventos (Etapa 8). */

export const MAX_EVENTO_ANEXO_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function parseUploadBase64(input: string): Buffer {
  const trimmed = input.trim();
  const raw = trimmed.includes(",") ? trimmed.split(",").pop()! : trimmed;
  return Buffer.from(raw, "base64");
}

export function assertAnexoUploadSize(byteLength: number): void {
  if (byteLength <= 0) {
    throw new Error("Arquivo vazio.");
  }
  if (byteLength > MAX_EVENTO_ANEXO_BYTES) {
    const mb = MAX_EVENTO_ANEXO_BYTES / (1024 * 1024);
    throw new Error(`Arquivo muito grande. Máximo: ${mb}MB.`);
  }
}

export function assertAnexoContentType(contentType: string): string {
  const ct = contentType.split(";")[0]!.trim().toLowerCase();
  if (!ALLOWED_MIME.has(ct)) {
    throw new Error("Tipo de arquivo não permitido.");
  }
  return ct;
}

export function fileCategoryFromContentType(contentType: string): "foto" | "documento" {
  return contentType.startsWith("image/") ? "foto" : "documento";
}

export function sanitizeAnexoFilename(name: string): string {
  const base = name.replace(/[/\\]/g, "_").trim() || "anexo";
  return base.slice(0, 180);
}

export function displayNameForAnexo(nome: string, contentType?: string | null): string {
  if (nome) return nome;
  if (contentType?.startsWith("image/")) return "Imagem";
  return "Arquivo";
}
