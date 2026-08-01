import { updateCultura } from "../db";
import { resolveProducaoColheitaKg } from "../../lib/eventos/produtividade-colheita";

export async function syncCultivoProducaoFromColheita(opts: {
  organizationId: number;
  culturaId: number;
  explicitKg?: number | null;
  titulo?: string | null;
  descricao?: string | null;
  checklistJson?: string | null;
}): Promise<{ synced: boolean; producaoKg: number | null }> {
  const producaoKg = resolveProducaoColheitaKg({
    explicitKg: opts.explicitKg,
    titulo: opts.titulo,
    descricao: opts.descricao,
    checklistJson: opts.checklistJson,
  });
  if (producaoKg == null || producaoKg <= 0) {
    return { synced: false, producaoKg: null };
  }
  await updateCultura(
    opts.culturaId,
    {
      producaoReal: producaoKg.toString(),
      status: "colhido",
    },
    opts.organizationId,
  );
  return { synced: true, producaoKg };
}
