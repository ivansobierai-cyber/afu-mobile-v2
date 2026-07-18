/**
 * Etapa 10 — tentativas reais de invasão entre contas (MySQL local).
 *
 * Cenários: A lê/altera/baixa B, troca IDs, membership removido sincroniza,
 * cache/relatórios isolados.
 */
import { beforeAll, describe, expect, it } from "vitest";
import { TRPCError } from "@trpc/server";
import {
  createIsolatedTenantPair,
  expectTenantDenied,
  type TenantFixture,
} from "./helpers/tenant-fixture";

const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("Etapa 10 — cross-tenant attack suite", () => {
  let a: TenantFixture;
  let b: TenantFixture;
  const evidence: Array<{ case: string; result: string }> = [];

  beforeAll(async () => {
    if (!process.env.JWT_SECRET) process.env.JWT_SECRET = "test_jwt_secret_etapa10";
    ({ a, b } = await createIsolatedTenantPair());
  }, 120_000);

  it("A lê propriedade própria e B está isolado na listagem", async () => {
    const listA = await a.caller.coreData.propriedades.list({ cacheScope: a.organizationId });
    expect(listA.some((p) => p.id === a.propriedadeId)).toBe(true);
    expect(listA.some((p) => p.id === b.propriedadeId)).toBe(false);
    evidence.push({ case: "list_isolation", result: "PASS" });
  });

  it("A tenta LER propriedade de B por ID → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.coreData.propriedades.get({ id: b.propriedadeId }),
    );
    evidence.push({ case: "A_read_B_property", result: msg });
  });

  it("A tenta LER talhão de B → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.coreData.terrenos.listByPropriedade({ propriedadeId: b.propriedadeId }),
    );
    evidence.push({ case: "A_list_B_terrenos", result: msg });
  });

  it("A tenta ALTERAR propriedade de B → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.coreData.propriedades.update({
        id: b.propriedadeId,
        data: { nome: "HACKED_BY_A" },
      }),
    );
    const still = await b.caller.coreData.propriedades.get({ id: b.propriedadeId });
    expect(still.nome).not.toBe("HACKED_BY_A");
    evidence.push({ case: "A_update_B_property", result: msg });
  });

  it("A tenta DELETAR propriedade de B → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.coreData.propriedades.delete({ id: b.propriedadeId }),
    );
    const still = await b.caller.coreData.propriedades.get({ id: b.propriedadeId });
    expect(still.id).toBe(b.propriedadeId);
    evidence.push({ case: "A_delete_B_property", result: msg });
  });

  it("A troca IDs: cria cultivo em propriedade de B → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.coreData.cultivos.create({
        propriedadeId: b.propriedadeId,
        terrenoId: b.terrenoId,
        nomeCultura: "SojaHack",
        status: "em_andamento",
      }),
    );
    evidence.push({ case: "A_create_cultivo_on_B", result: msg });
  });

  it("A tenta baixar relatório de B por id → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.secondaryData.relatorios.getDownloadUrl({ id: b.relatorioId }),
    );
    evidence.push({ case: "A_download_B_report", result: msg });
  });

  it("A tenta baixar arquivo com storageKey de B → NOT_FOUND", async () => {
    const msg = await expectTenantDenied(
      a.caller.secondaryData.files.getDownloadUrl({ storageKey: b.storageKey }),
    );
    evidence.push({ case: "A_download_B_storageKey", result: msg });
  });

  it("A gera relatório e cache não cruza com B (mesmos filtros)", async () => {
    const payload = {
      tipo: "diagnostico" as const,
      titulo: "Laudo isolamento",
      conteudo: JSON.stringify({ problema: "teste", orgHint: "shared-filters" }),
      dataEmissao: "18/07/2026",
    };
    const reportA = await a.caller.analise.gerarPDF(payload);
    const reportB = await b.caller.analise.gerarPDF(payload);
    expect(reportA.html).toBeTruthy();
    expect(reportB.html).toBeTruthy();

    const { reportFingerprint } = await import("../server/report-html");
    const { getReportCache, invalidateOrgReportCache } = await import("../server/report-cache");
    const fingerprint = reportFingerprint(payload);
    expect(getReportCache(a.organizationId, fingerprint)).not.toBeNull();
    expect(getReportCache(b.organizationId, fingerprint)).not.toBeNull();
    invalidateOrgReportCache(a.organizationId);
    expect(getReportCache(a.organizationId, fingerprint)).toBeNull();
    expect(getReportCache(b.organizationId, fingerprint)).not.toBeNull();
    evidence.push({ case: "report_cache_isolation", result: "PASS" });
  });

  it("dashboard stats de A ≠ B e não inclui propriedade do outro", async () => {
    const statsA = await a.caller.coreData.dashboard.stats({ cacheScope: a.organizationId });
    const statsB = await b.caller.coreData.dashboard.stats({ cacheScope: b.organizationId });
    expect(statsA.propriedades).toBeGreaterThanOrEqual(1);
    expect(statsB.propriedades).toBeGreaterThanOrEqual(1);
    // Cada um vê só o próprio conjunto (fixtures novas → tipicamente 1)
    expect(statsA.propriedades).toBe(1);
    expect(statsB.propriedades).toBe(1);
    evidence.push({
      case: "dashboard_stats_isolation",
      result: `A=${statsA.propriedades},B=${statsB.propriedades}`,
    });
  });

  it("usuário removido tenta sincronizar / acessar → bloqueado", async () => {
    const { setMembershipStatus, getActiveMembership, setActiveOrganizationId } = await import(
      "../server/db-organizations"
    );
    const { getDb } = await import("../server/db");
    const { usuariosAfu } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    await setActiveOrganizationId(a.perfilId, a.organizationId);
    await setMembershipStatus(a.membershipId, a.organizationId, "removido");

    try {
      const membership = await getActiveMembership(a.userId, a.organizationId);
      expect(membership).toBeNull();

      const db = await getDb();
      const perfil = db
        ? (
            await db.select().from(usuariosAfu).where(eq(usuariosAfu.id, a.perfilId)).limit(1)
          )[0]
        : null;
      expect(perfil?.activeOrganizationId ?? null).toBeNull();

      await expect(
        a.caller.coreData.propriedades.list({ cacheScope: a.organizationId }),
      ).rejects.toBeInstanceOf(TRPCError);

      await expect(
        a.caller.coreData.propriedades.get({ id: a.propriedadeId }),
      ).rejects.toBeInstanceOf(TRPCError);

      evidence.push({
        case: "removed_member_sync",
        result: "FORBIDDEN/blocked+activeOrganizationId_cleared",
      });
    } finally {
      await setMembershipStatus(a.membershipId, a.organizationId, "ativo");
      await setActiveOrganizationId(a.perfilId, a.organizationId);
    }
  });

  it("IA: A solicita contexto com propriedadeId de B → NOT_FOUND", async () => {
    // Sem chamar LLM real se não houver forge key — a validação de tenant ocorre antes
    const msg = await expectTenantDenied(
      a.caller.diagnostico.analisar({
        imageBase64: "AAAA",
        culturaNome: "Soja",
        parteAnalisada: "folha",
        propriedadeId: b.propriedadeId,
      }),
    );
    evidence.push({ case: "A_ai_with_B_property", result: msg });
  });

  it("assertCanAccessStorageKey bloqueia user A na chave de B", async () => {
    const { assertCanAccessStorageKey } = await import("../server/private-files");
    await expect(
      assertCanAccessStorageKey({
        userId: a.userId,
        userRole: "user",
        storageKey: b.storageKey,
      }),
    ).rejects.toBeInstanceOf(TRPCError);
    evidence.push({ case: "assert_storage_acl", result: "PASS" });
  });

  it("evidência consolidada: todos os casos registrados", () => {
    expect(evidence.length).toBeGreaterThanOrEqual(10);
    // eslint-disable-next-line no-console
    console.log(
      "\n[Etapa10 EVIDENCE]\n" +
        evidence.map((e) => ` - ${e.case}: ${e.result}`).join("\n"),
    );
  });
});
