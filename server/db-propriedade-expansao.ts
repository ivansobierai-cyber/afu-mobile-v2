import { and, eq, desc, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  ocorrenciasCampo,
  InsertOcorrenciaCampo,
  estoqueItens,
  InsertEstoqueItem,
  estoqueMovimentos,
  InsertEstoqueMovimento,
  estoqueLotes,
  estoqueReservas,
  InsertEstoqueReserva,
  orcamentosSafra,
  InsertOrcamentoSafra,
  custosOperacao,
  InsertCustoOperacao,
  financeiroLancamentos,
  InsertFinanceiroLancamento,
  atividadePropriedade,
  InsertAtividadePropriedade,
  maquinasOperacionais,
  InsertMaquinaOperacional,
  maquinaEventos,
  InsertMaquinaEvento,
  propriedades,
  terrenos,
} from "../drizzle/schema";

export async function listOcorrencias(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(ocorrenciasCampo)
    .where(eq(ocorrenciasCampo.propriedadeId, propriedadeId))
    .orderBy(desc(ocorrenciasCampo.createdAt));
}

function requireOrgId(
  data: { organizationId?: number | null },
  resolved?: number | null,
): number {
  const orgId = data.organizationId ?? resolved ?? null;
  if (orgId == null || !Number.isFinite(orgId) || orgId <= 0) {
    throw new Error("organizationId obrigatório no INSERT (Etapa 5)");
  }
  return orgId;
}

export async function createOcorrencia(data: InsertOcorrenciaCampo) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(ocorrenciasCampo).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateOcorrencia(
  id: number,
  data: Partial<InsertOcorrenciaCampo>,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { organizationId: _drop, ...safe } = data as any;
  const result = await db
    .update(ocorrenciasCampo)
    .set(safe)
    .where(
      and(eq(ocorrenciasCampo.id, id), eq(ocorrenciasCampo.organizationId, organizationId)),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Ocorrência não encontrada no tenant");
  }
}

export async function getOcorrenciaById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(ocorrenciasCampo).where(eq(ocorrenciasCampo.id, id)).limit(1);
  return rows[0];
}

export async function listEstoque(propriedadeId: number, organizationId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (organizationId != null) {
    return db
      .select()
      .from(estoqueItens)
      .where(
        and(
          eq(estoqueItens.propriedadeId, propriedadeId),
          eq(estoqueItens.organizationId, organizationId),
        ),
      );
  }
  return db.select().from(estoqueItens).where(eq(estoqueItens.propriedadeId, propriedadeId));
}

export async function createEstoqueItem(data: InsertEstoqueItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(estoqueItens).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function getEstoqueItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(estoqueItens).where(eq(estoqueItens.id, id)).limit(1);
  return rows[0];
}

/** Delta de saldo por tipo de movimento — saldo nunca é editado fora desta regra. */
export function deltaSaldoMovimento(
  tipo: InsertEstoqueMovimento["tipo"],
  quantidade: number,
): number {
  // reserva: trava disponível via estoque_reservas; não altera saldo físico
  if (tipo === "reserva" || tipo === "transferencia") return 0;
  if (["saida", "consumo", "perda"].includes(tipo)) return -quantidade;
  // entrada | ajuste
  return quantidade;
}

export function calcularSaldoPorMovimentos(
  movimentos: Array<{ tipo: InsertEstoqueMovimento["tipo"]; quantidade: string | number }>,
): number {
  let saldo = 0;
  for (const m of movimentos) {
    saldo += deltaSaldoMovimento(m.tipo, Number(m.quantidade));
  }
  return Math.round(saldo * 1000) / 1000;
}

export async function listMovimentosEstoque(opts: {
  itemId?: number;
  propriedadeId: number;
  organizationId: number;
  limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const limit = opts.limit ?? 100;
  const conds = [
    eq(estoqueMovimentos.propriedadeId, opts.propriedadeId),
    eq(estoqueMovimentos.organizationId, opts.organizationId),
  ];
  if (opts.itemId != null) conds.push(eq(estoqueMovimentos.itemId, opts.itemId));
  return db
    .select()
    .from(estoqueMovimentos)
    .where(and(...conds))
    .orderBy(desc(estoqueMovimentos.createdAt))
    .limit(limit);
}

/** Etapa 7 Passo 6 — indicadores do dashboard de estoque */
export async function getEstoqueDashboard(propriedadeId: number, organizationId: number) {
  const db = await getDb();
  if (!db) {
    return {
      estoqueAtual: { itens: 0, saldoTotal: 0 },
      consumoMensal: 0,
      reservas: { ativas: 0, quantidade: 0 },
      perdasMensal: 0,
      itensCriticos: [] as Array<{ id: number; nome: string; saldo: number; estoqueMinimo: number }>,
      valorTotalEstoque: 0,
      valorDisponivel: true,
    };
  }

  const itens = await listEstoque(propriedadeId, organizationId);
  const reservas = await listReservasPorPropriedade(propriedadeId, organizationId);
  const movimentos = await db
    .select()
    .from(estoqueMovimentos)
    .where(
      and(
        eq(estoqueMovimentos.propriedadeId, propriedadeId),
        eq(estoqueMovimentos.organizationId, organizationId),
      ),
    );

  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);

  let consumoMensal = 0;
  let perdasMensal = 0;
  for (const m of movimentos) {
    const created = new Date(m.createdAt);
    if (created < inicioMes) continue;
    const q = Number(m.quantidade);
    if (m.tipo === "consumo" || m.tipo === "saida") consumoMensal += q;
    if (m.tipo === "perda") perdasMensal += q;
  }

  const reservasAtivas = reservas.filter((r) => r.status === "ativa");
  const itensCriticos = itens
    .filter((i) => Number(i.saldo) <= Number(i.estoqueMinimo ?? 0))
    .map((i) => ({
      id: i.id,
      nome: i.nome,
      saldo: Number(i.saldo),
      estoqueMinimo: Number(i.estoqueMinimo ?? 0),
    }));

  const saldoTotal = itens.reduce((acc, i) => acc + Number(i.saldo), 0);
  const valorTotalEstoque = itens.reduce((acc, i) => {
    const saldo = Number(i.saldo);
    const cm = i.custoMedio != null ? Number(i.custoMedio) : 0;
    if (!Number.isFinite(saldo) || !Number.isFinite(cm) || saldo <= 0 || cm <= 0) return acc;
    return acc + saldo * cm;
  }, 0);

  return {
    estoqueAtual: { itens: itens.length, saldoTotal: Math.round(saldoTotal * 1000) / 1000 },
    consumoMensal: Math.round(consumoMensal * 1000) / 1000,
    reservas: {
      ativas: reservasAtivas.length,
      quantidade: Math.round(
        reservasAtivas.reduce((acc, r) => acc + Number(r.quantidade), 0) * 1000,
      ) / 1000,
    },
    perdasMensal: Math.round(perdasMensal * 1000) / 1000,
    itensCriticos,
    valorTotalEstoque: Math.round(valorTotalEstoque * 100) / 100,
    valorDisponivel: true,
  };
}

/** Custo médio ponderado após entrada com custo unitário. */
export function calcularCustoMedioPonderado(opts: {
  saldoAntes: number;
  custoMedioAntes: number | null;
  quantidadeEntrada: number;
  custoUnitario: number;
}): number {
  const qty = opts.quantidadeEntrada;
  const unit = opts.custoUnitario;
  const antes = opts.saldoAntes > 0 ? opts.saldoAntes : 0;
  const cm = opts.custoMedioAntes != null && Number.isFinite(opts.custoMedioAntes)
    ? opts.custoMedioAntes
    : 0;
  const novoSaldo = antes + qty;
  if (novoSaldo <= 0) return Math.round(unit * 10000) / 10000;
  if (antes <= 0 || cm <= 0) return Math.round(unit * 10000) / 10000;
  return Math.round(((antes * cm + qty * unit) / novoSaldo) * 10000) / 10000;
}

export async function findConsumoEstoqueByTarefaItem(tarefaId: number, itemId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(estoqueMovimentos)
    .where(
      and(
        eq(estoqueMovimentos.tarefaId, tarefaId),
        eq(estoqueMovimentos.itemId, itemId),
        eq(estoqueMovimentos.tipo, "consumo"),
      ),
    )
    .limit(1);
  return rows[0];
}

/**
 * Única via de alteração de saldo: grava movimento + reconstrói saldo pelos movimentos.
 * Auditoria: organizationId, propriedadeId, createdByUserId, timestamps.
 */
export async function registrarMovimentoEstoque(data: InsertEstoqueMovimento) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const item = await getEstoqueItem(data.itemId);
  if (!item) throw new Error("Item não encontrado");

  const qtd = Number(data.quantidade);
  if (!Number.isFinite(qtd) || qtd <= 0) {
    throw new Error("Quantidade inválida");
  }
  if (data.tipo === "consumo" && data.tarefaId == null) {
    throw new Error("Consumo exige operação relacionada (tarefaId)");
  }

  const organizationId = data.organizationId ?? item.organizationId ?? undefined;
  if (organizationId == null) throw new Error("organizationId obrigatório no movimento");
  const propriedadeId = data.propriedadeId ?? item.propriedadeId;
  const createdByUserId = data.createdByUserId ?? data.usuarioId;

  const historico = await db
    .select({ tipo: estoqueMovimentos.tipo, quantidade: estoqueMovimentos.quantidade })
    .from(estoqueMovimentos)
    .where(eq(estoqueMovimentos.itemId, item.id));
  const saldoProjetado = calcularSaldoPorMovimentos([
    ...historico,
    { tipo: data.tipo, quantidade: qtd },
  ]);
  if (saldoProjetado < -0.0005) {
    throw new Error("Saldo insuficiente para o movimento");
  }

  await db.insert(estoqueMovimentos).values({
    ...data,
    organizationId,
    propriedadeId,
    createdByUserId,
  });

  const saldoAntes = Number(item.saldo);
  const whereItem =
    item.organizationId != null
      ? and(eq(estoqueItens.id, item.id), eq(estoqueItens.organizationId, item.organizationId))
      : eq(estoqueItens.id, item.id);

  const patch: Partial<InsertEstoqueItem> = {
    saldo: saldoProjetado.toFixed(3),
  };
  // Transferência de depósito: atualiza depósito do item sem mudar quantidade
  if (data.tipo === "transferencia" && data.depositoId != null) {
    patch.depositoId = data.depositoId;
  }
  // Entrada com custo unitário → atualiza custo médio ponderado
  if (data.tipo === "entrada" && data.custoUnitario != null) {
    const unit = Number(data.custoUnitario);
    if (Number.isFinite(unit) && unit >= 0) {
      const cmAntes =
        item.custoMedio != null && Number.isFinite(Number(item.custoMedio))
          ? Number(item.custoMedio)
          : null;
      patch.custoMedio = calcularCustoMedioPonderado({
        saldoAntes,
        custoMedioAntes: cmAntes,
        quantidadeEntrada: qtd,
        custoUnitario: unit,
      }).toFixed(4);
    }
  }
  await db.update(estoqueItens).set(patch).where(whereItem);

  await registrarAtividade({
    propriedadeId,
    organizationId,
    usuarioId: createdByUserId,
    tipo: "estoque_movimento",
    titulo: `Estoque: ${data.tipo} · ${item.nome}`,
    detalhe: `${qtd} ${item.unidadeBase}${data.motivo ? ` — ${data.motivo}` : ""}`,
    gravidade: data.tipo === "perda" || data.tipo === "consumo" ? "atencao" : "info",
  });

  return {
    saldo: saldoProjetado,
    custoMedio: patch.custoMedio != null ? Number(patch.custoMedio) : item.custoMedio != null ? Number(item.custoMedio) : null,
  };
}

export async function listReservasAtivasPorItem(
  itemId: number,
  organizationId: number,
  excludeTarefaId?: number,
) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select()
    .from(estoqueReservas)
    .where(
      and(
        eq(estoqueReservas.itemId, itemId),
        eq(estoqueReservas.organizationId, organizationId),
        eq(estoqueReservas.status, "ativa"),
      ),
    );
  if (excludeTarefaId == null) return rows;
  return rows.filter((r) => r.tarefaId !== excludeTarefaId);
}

export async function quantidadeReservadaAtiva(
  itemId: number,
  organizationId: number,
  excludeTarefaId?: number,
): Promise<number> {
  const rows = await listReservasAtivasPorItem(itemId, organizationId, excludeTarefaId);
  return rows.reduce((acc, r) => acc + Number(r.quantidade), 0);
}

export async function saldoDisponivelEstoque(
  itemId: number,
  organizationId: number,
  excludeTarefaId?: number,
): Promise<{ saldo: number; reservado: number; disponivel: number; item: NonNullable<Awaited<ReturnType<typeof getEstoqueItem>>> }> {
  const item = await getEstoqueItem(itemId);
  if (!item) throw new Error("Item não encontrado");
  const saldo = Number(item.saldo);
  const reservado = await quantidadeReservadaAtiva(itemId, organizationId, excludeTarefaId);
  return { saldo, reservado, disponivel: Math.round((saldo - reservado) * 1000) / 1000, item };
}

export async function listLotesPorPropriedade(propriedadeId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(estoqueLotes)
    .where(
      and(
        eq(estoqueLotes.propriedadeId, propriedadeId),
        eq(estoqueLotes.organizationId, organizationId),
      ),
    );
}

export async function listReservasPorPropriedade(propriedadeId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(estoqueReservas)
    .where(
      and(
        eq(estoqueReservas.propriedadeId, propriedadeId),
        eq(estoqueReservas.organizationId, organizationId),
      ),
    );
}

export async function listReservasPorTarefa(tarefaId: number, organizationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(estoqueReservas)
    .where(
      and(
        eq(estoqueReservas.tarefaId, tarefaId),
        eq(estoqueReservas.organizationId, organizationId),
      ),
    );
}

/** Cria reservas ativas + movimento tipo reserva (saldo físico inalterado). */
export async function reservarInsumosParaTarefa(opts: {
  organizationId: number;
  propriedadeId: number;
  tarefaId: number;
  createdByUserId: number;
  usuarioId: number;
  itens: Array<{ itemId: number; quantidade: number }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const created: number[] = [];
  for (const linha of opts.itens) {
    const { disponivel, item } = await saldoDisponivelEstoque(
      linha.itemId,
      opts.organizationId,
    );
    if (
      item.propriedadeId !== opts.propriedadeId ||
      (item.organizationId != null && item.organizationId !== opts.organizationId)
    ) {
      throw new Error(`Item ${linha.itemId} fora do tenant`);
    }
    if (disponivel + 1e-9 < linha.quantidade) {
      throw new Error(`Reserva insuficiente para ${item.nome} (disponível ${disponivel})`);
    }
    const result = await db.insert(estoqueReservas).values({
      organizationId: opts.organizationId,
      propriedadeId: opts.propriedadeId,
      itemId: linha.itemId,
      tarefaId: opts.tarefaId,
      quantidade: linha.quantidade.toFixed(3),
      status: "ativa",
      createdByUserId: opts.createdByUserId,
    } satisfies InsertEstoqueReserva);
    const reservaId = result[0].insertId;
    created.push(reservaId);
    await registrarMovimentoEstoque({
      itemId: linha.itemId,
      organizationId: opts.organizationId,
      propriedadeId: opts.propriedadeId,
      usuarioId: opts.usuarioId,
      createdByUserId: opts.createdByUserId,
      tipo: "reserva",
      quantidade: linha.quantidade.toFixed(3),
      motivo: `Reserva tarefa #${opts.tarefaId}`,
      tarefaId: opts.tarefaId,
    } as InsertEstoqueMovimento);
  }
  return created;
}

export async function validarDisponibilidadeReservasTarefa(
  tarefaId: number,
  organizationId: number,
) {
  const reservas = (await listReservasPorTarefa(tarefaId, organizationId)).filter(
    (r) => r.status === "ativa",
  );
  for (const r of reservas) {
    const { disponivel, item } = await saldoDisponivelEstoque(
      r.itemId,
      organizationId,
      tarefaId,
    );
    if (disponivel + 1e-9 < Number(r.quantidade)) {
      throw new Error(
        `Disponibilidade insuficiente para ${item.nome} ao iniciar a operação (faltam insumos reservados)`,
      );
    }
  }
  return reservas;
}

/** Converte reservas ativas em consumo; aceita consumos extras com tarefa obrigatória. */
export async function consumirReservasDaTarefa(opts: {
  organizationId: number;
  propriedadeId: number;
  tarefaId: number;
  createdByUserId: number;
  usuarioId: number;
  consumosExtras?: Array<{ itemId: number; quantidade: number }>;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const reservas = (await listReservasPorTarefa(opts.tarefaId, opts.organizationId)).filter(
    (r) => r.status === "ativa",
  );

  for (const r of reservas) {
    const existing = await findConsumoEstoqueByTarefaItem(opts.tarefaId, r.itemId);
    if (!existing) {
      await registrarMovimentoEstoque({
        itemId: r.itemId,
        organizationId: opts.organizationId,
        propriedadeId: opts.propriedadeId,
        usuarioId: opts.usuarioId,
        createdByUserId: opts.createdByUserId,
        tipo: "consumo",
        quantidade: r.quantidade,
        motivo: `Consumo automático da tarefa ${opts.tarefaId}`,
        tarefaId: opts.tarefaId,
      } as InsertEstoqueMovimento);
    }
    await db
      .update(estoqueReservas)
      .set({ status: "consumida" })
      .where(
        and(
          eq(estoqueReservas.id, r.id),
          eq(estoqueReservas.organizationId, opts.organizationId),
        ),
      );
  }

  for (const consumo of opts.consumosExtras ?? []) {
    const alreadyReserved = reservas.some((r) => r.itemId === consumo.itemId);
    if (alreadyReserved) continue;
    const existing = await findConsumoEstoqueByTarefaItem(opts.tarefaId, consumo.itemId);
    if (existing) continue;
    const { disponivel, item } = await saldoDisponivelEstoque(
      consumo.itemId,
      opts.organizationId,
      opts.tarefaId,
    );
    if (
      item.propriedadeId !== opts.propriedadeId ||
      (item.organizationId != null && item.organizationId !== opts.organizationId)
    ) {
      throw new Error("Item de estoque não encontrado");
    }
    if (disponivel + 1e-9 < consumo.quantidade) {
      throw new Error(`Saldo insuficiente para ${item.nome}`);
    }
    await registrarMovimentoEstoque({
      itemId: consumo.itemId,
      organizationId: opts.organizationId,
      propriedadeId: opts.propriedadeId,
      usuarioId: opts.usuarioId,
      createdByUserId: opts.createdByUserId,
      tipo: "consumo",
      quantidade: consumo.quantidade.toFixed(3),
      motivo: `Consumo automático da tarefa ${opts.tarefaId}`,
      tarefaId: opts.tarefaId,
    } as InsertEstoqueMovimento);
  }
}

export async function liberarReservasDaTarefa(opts: {
  organizationId: number;
  tarefaId: number;
  statusFinal?: "liberada" | "cancelada";
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const reservas = (await listReservasPorTarefa(opts.tarefaId, opts.organizationId)).filter(
    (r) => r.status === "ativa",
  );
  for (const r of reservas) {
    await db
      .update(estoqueReservas)
      .set({ status: opts.statusFinal ?? "liberada" })
      .where(
        and(
          eq(estoqueReservas.id, r.id),
          eq(estoqueReservas.organizationId, opts.organizationId),
        ),
      );
  }
  return reservas.length;
}

export async function listOrcamentos(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orcamentosSafra).where(eq(orcamentosSafra.propriedadeId, propriedadeId));
}

export async function createOrcamento(data: InsertOrcamentoSafra) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(orcamentosSafra).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function listCustos(propriedadeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(custosOperacao)
    .where(eq(custosOperacao.propriedadeId, propriedadeId))
    .orderBy(desc(custosOperacao.dataCusto));
}

export async function createCusto(data: InsertCustoOperacao) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(custosOperacao).values({ ...data, organizationId });
  if (data.orcamentoId) {
    await db
      .update(orcamentosSafra)
      .set({
        custoRealizado: sql`${orcamentosSafra.custoRealizado} + ${data.valor}`,
      })
      .where(
        and(
          eq(orcamentosSafra.id, data.orcamentoId),
          eq(orcamentosSafra.organizationId, organizationId),
        ),
      );
  }
  return result[0].insertId;
}

export async function listFinanceiroLancamentos(
  propriedadeId: number,
  organizationId: number,
  safraId?: number,
) {
  const db = await getDb();
  if (!db) return [];
  const conds = [
    eq(financeiroLancamentos.propriedadeId, propriedadeId),
    eq(financeiroLancamentos.organizationId, organizationId),
  ];
  if (safraId != null) conds.push(eq(financeiroLancamentos.safraId, safraId));
  return db
    .select()
    .from(financeiroLancamentos)
    .where(and(...conds))
    .orderBy(desc(financeiroLancamentos.dataLancamento));
}

export async function createFinanceiroLancamento(data: InsertFinanceiroLancamento) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const organizationId = requireOrgId(data, data.organizationId);
  const result = await db.insert(financeiroLancamentos).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function listAtividades(propriedadeId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(atividadePropriedade)
    .where(eq(atividadePropriedade.propriedadeId, propriedadeId))
    .orderBy(desc(atividadePropriedade.createdAt))
    .limit(limit);
}

export async function registrarAtividade(data: InsertAtividadePropriedade) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  let organizationId = data.organizationId;
  if (organizationId == null && data.propriedadeId) {
    const prop = await db
      .select({ organizationId: propriedades.organizationId })
      .from(propriedades)
      .where(eq(propriedades.id, data.propriedadeId))
      .limit(1);
    organizationId = prop[0]?.organizationId ?? undefined;
  }
  organizationId = requireOrgId(data, organizationId);
  const result = await db.insert(atividadePropriedade).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateGeometriaPropriedade(
  id: number,
  data: {
    geometriaGeoJson: string;
    areaGeometricaHa?: string;
    geometriaOrigem?: "desenhada" | "gps" | "importada" | "integracao";
    expectedGeometriaVersao?: number;
  },
  organizationId: number,
): Promise<{ geometriaVersao: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const current = await db
    .select({
      id: propriedades.id,
      geometriaVersao: propriedades.geometriaVersao,
    })
    .from(propriedades)
    .where(and(eq(propriedades.id, id), eq(propriedades.organizationId, organizationId)))
    .limit(1);
  if (!current[0]) {
    throw new Error("Propriedade não encontrada no tenant");
  }
  const serverVersion = current[0].geometriaVersao ?? 1;
  if (
    data.expectedGeometriaVersao != null &&
    data.expectedGeometriaVersao !== serverVersion
  ) {
    const err = new Error(
      `Conflito de geometria: versão esperada ${data.expectedGeometriaVersao}, servidor ${serverVersion}`,
    );
    (err as any).code = "GEOMETRY_VERSION_CONFLICT";
    (err as any).serverVersion = serverVersion;
    throw err;
  }

  const result = await db
    .update(propriedades)
    .set({
      geometriaGeoJson: data.geometriaGeoJson,
      areaGeometricaHa: data.areaGeometricaHa,
      geometriaOrigem: data.geometriaOrigem ?? "desenhada",
      geometriaVersao: sql`COALESCE(${propriedades.geometriaVersao}, 0) + 1`,
    })
    .where(and(eq(propriedades.id, id), eq(propriedades.organizationId, organizationId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Propriedade não encontrada no tenant");
  }
  return { geometriaVersao: serverVersion + 1 };
}

export async function updateGeometriaTerreno(
  id: number,
  data: {
    geometriaGeoJson: string;
    areaGeometricaHa?: string;
    geometriaOrigem?: "desenhada" | "gps" | "importada" | "integracao";
    expectedGeometriaVersao?: number;
  },
  organizationId: number,
): Promise<{ geometriaVersao: number }> {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");

  const current = await db
    .select({
      id: terrenos.id,
      geometriaVersao: terrenos.geometriaVersao,
    })
    .from(terrenos)
    .where(and(eq(terrenos.id, id), eq(terrenos.organizationId, organizationId)))
    .limit(1);
  if (!current[0]) {
    throw new Error("Talhão não encontrado no tenant");
  }
  const serverVersion = current[0].geometriaVersao ?? 1;
  if (
    data.expectedGeometriaVersao != null &&
    data.expectedGeometriaVersao !== serverVersion
  ) {
    const err = new Error(
      `Conflito de geometria: versão esperada ${data.expectedGeometriaVersao}, servidor ${serverVersion}`,
    );
    (err as any).code = "GEOMETRY_VERSION_CONFLICT";
    (err as any).serverVersion = serverVersion;
    throw err;
  }

  const result = await db
    .update(terrenos)
    .set({
      geometriaGeoJson: data.geometriaGeoJson,
      areaGeometricaHa: data.areaGeometricaHa,
      geometriaOrigem: data.geometriaOrigem ?? "desenhada",
      geometriaVersao: sql`COALESCE(${terrenos.geometriaVersao}, 0) + 1`,
    })
    .where(and(eq(terrenos.id, id), eq(terrenos.organizationId, organizationId)));
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Talhão não encontrado no tenant");
  }
  return { geometriaVersao: serverVersion + 1 };
}

export async function listMaquinasOperacionais(
  propriedadeId: number,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.propriedadeId, propriedadeId),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    )
    .orderBy(desc(maquinasOperacionais.createdAt));
}

export async function getMaquinaOperacional(id: number, organizationId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.id, id),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    )
    .limit(1);
  return rows[0];
}

export async function createMaquinaOperacional(data: InsertMaquinaOperacional) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const organizationId = requireOrgId(data, data.organizationId);
  const result = await db.insert(maquinasOperacionais).values({ ...data, organizationId });
  return result[0].insertId;
}

export async function updateMaquinaOperacional(
  id: number,
  data: Partial<InsertMaquinaOperacional>,
  organizationId: number,
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const { organizationId: _dropOrg, propriedadeId: _dropProp, ...safe } = data as any;
  const result = await db
    .update(maquinasOperacionais)
    .set(safe)
    .where(
      and(
        eq(maquinasOperacionais.id, id),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Máquina não encontrada no tenant");
  }
}

export async function removeMaquinaOperacional(id: number, organizationId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db
    .delete(maquinasOperacionais)
    .where(
      and(
        eq(maquinasOperacionais.id, id),
        eq(maquinasOperacionais.organizationId, organizationId),
      ),
    );
  if (Number((result as any)[0]?.affectedRows ?? 0) === 0) {
    throw new Error("Máquina não encontrada no tenant");
  }
}

export async function listMaquinaEventos(
  maquinaId: number,
  organizationId: number,
  limit = 50,
) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(maquinaEventos)
    .where(
      and(
        eq(maquinaEventos.maquinaId, maquinaId),
        eq(maquinaEventos.organizationId, organizationId),
      ),
    )
    .orderBy(desc(maquinaEventos.createdAt))
    .limit(limit);
}

async function insertMaquinaEvento(data: InsertMaquinaEvento) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const organizationId = requireOrgId(data, data.organizationId);
  const result = await db.insert(maquinaEventos).values({ ...data, organizationId });
  return result[0].insertId;
}

/** Registra horímetro; novo valor deve ser >= horas atuais. */
export async function registrarHorimetroMaquina(opts: {
  maquinaId: number;
  organizationId: number;
  horas: number;
  descricao?: string;
  createdByUserId: number;
  tarefaId?: number;
}) {
  const maquina = await getMaquinaOperacional(opts.maquinaId, opts.organizationId);
  if (!maquina) throw new Error("Máquina não encontrada");
  const atual = Number(maquina.horasUso ?? 0);
  if (!Number.isFinite(opts.horas) || opts.horas < atual - 1e-9) {
    throw new Error(`Horímetro inválido (atual ${atual})`);
  }
  await updateMaquinaOperacional(
    opts.maquinaId,
    { horasUso: opts.horas.toFixed(1) },
    opts.organizationId,
  );
  const eventoId = await insertMaquinaEvento({
    organizationId: opts.organizationId,
    propriedadeId: maquina.propriedadeId,
    maquinaId: opts.maquinaId,
    tipo: "horimetro",
    valor: opts.horas.toFixed(3),
    descricao: opts.descricao ?? `Horímetro ${opts.horas}`,
    createdByUserId: opts.createdByUserId,
    tarefaId: opts.tarefaId,
  });
  return { eventoId, horasUso: opts.horas };
}

/** Abastecimento (entrada) ou consumo (saida) de combustível. */
export async function registrarCombustivelMaquina(opts: {
  maquinaId: number;
  organizationId: number;
  litros: number;
  sentido: "entrada" | "saida";
  descricao?: string;
  createdByUserId: number;
}) {
  const maquina = await getMaquinaOperacional(opts.maquinaId, opts.organizationId);
  if (!maquina) throw new Error("Máquina não encontrada");
  if (!Number.isFinite(opts.litros) || opts.litros <= 0) {
    throw new Error("Litros inválidos");
  }
  const atual = Number(maquina.combustivelLitros ?? 0);
  const novo =
    opts.sentido === "entrada" ? atual + opts.litros : atual - opts.litros;
  if (novo < -1e-9) throw new Error("Combustível insuficiente no tanque");
  await updateMaquinaOperacional(
    opts.maquinaId,
    { combustivelLitros: Math.max(0, novo).toFixed(2) },
    opts.organizationId,
  );
  const eventoId = await insertMaquinaEvento({
    organizationId: opts.organizationId,
    propriedadeId: maquina.propriedadeId,
    maquinaId: opts.maquinaId,
    tipo: "combustivel",
    valor: opts.litros.toFixed(3),
    sentido: opts.sentido,
    descricao: opts.descricao ?? `Combustível ${opts.sentido} ${opts.litros} L`,
    createdByUserId: opts.createdByUserId,
  });
  return { eventoId, combustivelLitros: Math.max(0, novo) };
}

/** Registra manutenção; opcionalmente coloca status em manutenção. */
export async function registrarManutencaoMaquina(opts: {
  maquinaId: number;
  organizationId: number;
  descricao: string;
  custo?: number;
  colocarEmManutencao?: boolean;
  createdByUserId: number;
}) {
  const maquina = await getMaquinaOperacional(opts.maquinaId, opts.organizationId);
  if (!maquina) throw new Error("Máquina não encontrada");
  const now = new Date();
  const patch: Partial<InsertMaquinaOperacional> = {
    ultimaManutencaoAt: now,
  };
  if (opts.colocarEmManutencao) patch.status = "manutencao";
  await updateMaquinaOperacional(opts.maquinaId, patch, opts.organizationId);
  const eventoId = await insertMaquinaEvento({
    organizationId: opts.organizationId,
    propriedadeId: maquina.propriedadeId,
    maquinaId: opts.maquinaId,
    tipo: "manutencao",
    valor: opts.custo != null ? opts.custo.toFixed(3) : undefined,
    descricao: opts.descricao,
    createdByUserId: opts.createdByUserId,
  });
  return { eventoId, status: opts.colocarEmManutencao ? "manutencao" : maquina.status };
}

/** Atualiza disponibilidade (status) com auditoria. */
export async function setDisponibilidadeMaquina(opts: {
  maquinaId: number;
  organizationId: number;
  status: "disponivel" | "em_uso" | "manutencao" | "inativa";
  descricao?: string;
  createdByUserId: number;
}) {
  const maquina = await getMaquinaOperacional(opts.maquinaId, opts.organizationId);
  if (!maquina) throw new Error("Máquina não encontrada");
  await updateMaquinaOperacional(
    opts.maquinaId,
    { status: opts.status },
    opts.organizationId,
  );
  const eventoId = await insertMaquinaEvento({
    organizationId: opts.organizationId,
    propriedadeId: maquina.propriedadeId,
    maquinaId: opts.maquinaId,
    tipo: "disponibilidade",
    descricao: opts.descricao ?? `Status → ${opts.status}`,
    createdByUserId: opts.createdByUserId,
  });
  return { eventoId, status: opts.status };
}

export async function findTarefaByClientMutationId(clientMutationId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const { tarefasOperacionais } = await import("../drizzle/schema");
  const rows = await db
    .select()
    .from(tarefasOperacionais)
    .where(eq(tarefasOperacionais.clientMutationId, clientMutationId))
    .limit(1);
  return rows[0];
}
