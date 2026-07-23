/**
 * Cultivos V2 — arquivos/fotos vinculados ao cultivo (via diagnósticos + private_files).
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb } from "./db";
import {
  diagnosticosIa,
  privateFiles,
  type Cultura,
} from "../drizzle/schema";

export type CultivoArquivoItem = {
  id: string;
  origem: "diagnostico_imagem" | "private_file";
  titulo: string;
  categoria: string;
  contentType: string | null;
  url: string | null;
  storageKey: string | null;
  diagnosticoId: number | null;
  createdAt: string | null;
};

export async function buildCultivoArquivos(
  organizationId: number,
  cultura: Cultura,
): Promise<{ items: CultivoArquivoItem[]; total: number }> {
  const db = await getDb();
  if (!db) return { items: [], total: 0 };

  const diagnosticos = await db
    .select()
    .from(diagnosticosIa)
    .where(
      and(
        eq(diagnosticosIa.organizationId, organizationId),
        eq(diagnosticosIa.culturaId, cultura.id),
      ),
    )
    .orderBy(desc(diagnosticosIa.dataDiagnostico));

  const items: CultivoArquivoItem[] = [];

  for (const d of diagnosticos) {
    if (d.imagemUrl) {
      items.push({
        id: `diag-img-${d.id}`,
        origem: "diagnostico_imagem",
        titulo:
          d.pragaProvavel ||
          d.doencaProvavel ||
          `Diagnóstico #${d.id}`,
        categoria: "diagnostico",
        contentType: null,
        url: d.imagemUrl,
        storageKey: d.imagemUrl.startsWith("org/") ? d.imagemUrl : null,
        diagnosticoId: d.id,
        createdAt: d.dataDiagnostico
          ? new Date(d.dataDiagnostico).toISOString()
          : null,
      });
    }
  }

  const diagIds = diagnosticos.map((d) => d.id);
  if (diagIds.length > 0) {
    const files = await db
      .select()
      .from(privateFiles)
      .where(
        and(
          eq(privateFiles.organizationId, organizationId),
          inArray(privateFiles.diagnosticoId, diagIds),
        ),
      )
      .orderBy(desc(privateFiles.createdAt));

    const seenKeys = new Set(
      items.map((i) => i.storageKey).filter(Boolean) as string[],
    );
    for (const f of files) {
      if (seenKeys.has(f.storageKey)) continue;
      seenKeys.add(f.storageKey);
      items.push({
        id: `file-${f.id}`,
        origem: "private_file",
        titulo:
          f.originalName ||
          f.storageKey.split("/").pop() ||
          `Arquivo #${f.id}`,
        categoria: f.category,
        contentType: f.contentType,
        url: `/manus-storage/${f.storageKey}`,
        storageKey: f.storageKey,
        diagnosticoId: f.diagnosticoId,
        createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : null,
      });
    }
  }

  items.sort((a, b) => {
    const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return tb - ta;
  });

  return { items, total: items.length };
}
