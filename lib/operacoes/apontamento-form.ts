/**
 * FASE 2H — validação de formulário de apontamento + mensagens amigáveis.
 * Regras de negócio alinhadas ao servidor (sem inventar dose/clima etc.).
 */

export type ApontamentoFormFields = {
  inicioReal: string;
  fimReal: string;
  areaExecutada: string;
  areaUnidade: string;
  insumoDesc: string;
  insumoQtd: string;
  insumoUnidade: string;
  /** Quando preenchido, dispensa descrição textual (insumo de catálogo). */
  insumoEstoqueItemId?: number | null;
};

export type ApontamentoFieldKey =
  | "inicioReal"
  | "fimReal"
  | "areaExecutada"
  | "areaUnidade"
  | "insumoQtd"
  | "insumoUnidade"
  | "insumoDesc"
  | "_form";

export type ApontamentoFieldErrors = Partial<Record<ApontamentoFieldKey, string>>;

export type ApontamentoFormParseOk = {
  ok: true;
  inicioReal: Date;
  fimReal: Date | null;
  areaExecutada: number | null;
  areaUnidade: string;
  insumos?: Array<{
    descricao: string | null;
    quantidade: number;
    unidade: string;
  }>;
};

export type ApontamentoFormParseFail = {
  ok: false;
  errors: ApontamentoFieldErrors;
  firstErrorKey: ApontamentoFieldKey;
};

export type ApontamentoFormParseResult = ApontamentoFormParseOk | ApontamentoFormParseFail;

/**
 * Aceita YYYY-MM-DDTHH:mm[.ss][Z] ou com espaço — constrói Date local estável.
 * Evita Invalid Date em engines que rejeitam ISO sem segundos.
 */
export function parseApontamentoDateTimeLocal(value: string): Date | null {
  const v = value.trim();
  if (!v) return null;

  const m = v.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/,
  );
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const h = Number(m[4]);
    const mi = Number(m[5]);
    const s = Number(m[6] ?? 0);
    const tz = m[7];
    if (tz) {
      const iso = `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${String(s).padStart(2, "0")}${tz === "Z" ? "Z" : tz}`;
      const parsed = new Date(iso);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const local = new Date(y, mo - 1, d, h, mi, s, 0);
    return Number.isNaN(local.getTime()) ? null : local;
  }

  const fallback = new Date(v);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

export function toApontamentoDateTimeLocalValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FIELD_ORDER: ApontamentoFieldKey[] = [
  "inicioReal",
  "fimReal",
  "areaExecutada",
  "areaUnidade",
  "insumoDesc",
  "insumoQtd",
  "insumoUnidade",
  "_form",
];

export function validateApontamentoForm(
  fields: ApontamentoFormFields,
): ApontamentoFormParseResult {
  const errors: ApontamentoFieldErrors = {};

  if (!fields.inicioReal.trim()) {
    errors.inicioReal = "Início real é obrigatório.";
  }
  const inicio = fields.inicioReal.trim()
    ? parseApontamentoDateTimeLocal(fields.inicioReal)
    : null;
  if (fields.inicioReal.trim() && !inicio) {
    errors.inicioReal =
      "Início real inválido. Use o formato AAAA-MM-DDTHH:mm (ex.: 2026-08-06T08:30).";
  }

  let fim: Date | null = null;
  if (fields.fimReal.trim()) {
    fim = parseApontamentoDateTimeLocal(fields.fimReal);
    if (!fim) {
      errors.fimReal =
        "Horário final inválido. Use o formato AAAA-MM-DDTHH:mm.";
    } else if (inicio && inicio.getTime() > fim.getTime()) {
      errors.fimReal = "O horário final não pode ser anterior ao início.";
    }
  }

  let areaExecutada: number | null = null;
  const areaRaw = fields.areaExecutada.trim();
  if (areaRaw) {
    areaExecutada = Number(areaRaw.replace(",", "."));
    if (Number.isNaN(areaExecutada) || areaExecutada < 0) {
      errors.areaExecutada = "A área executada deve ser um número maior ou igual a zero.";
    } else if (!fields.areaUnidade.trim()) {
      errors.areaUnidade = "Informe a unidade da área executada.";
    }
  }

  const hasInsumo = Boolean(
    fields.insumoDesc.trim() ||
      fields.insumoQtd.trim() ||
      (fields.insumoEstoqueItemId != null && fields.insumoEstoqueItemId > 0),
  );
  let insumos: ApontamentoFormParseOk["insumos"];
  if (hasInsumo) {
    const qtd = fields.insumoQtd.trim()
      ? Number(fields.insumoQtd.replace(",", "."))
      : Number.NaN;
    if (!(qtd > 0) || Number.isNaN(qtd)) {
      errors.insumoQtd = "A quantidade do insumo deve ser maior que zero.";
    }
    if (!fields.insumoUnidade.trim()) {
      errors.insumoUnidade = "Informe a unidade do insumo.";
    }
    const hasCatalogRef = fields.insumoEstoqueItemId != null && fields.insumoEstoqueItemId > 0;
    if (!fields.insumoDesc.trim() && !hasCatalogRef) {
      errors.insumoDesc = "Informe o nome do insumo ou remova a quantidade.";
    }
    if (!errors.insumoQtd && !errors.insumoUnidade && !errors.insumoDesc) {
      insumos = [
        {
          descricao: fields.insumoDesc.trim() || null,
          quantidade: qtd,
          unidade: fields.insumoUnidade.trim(),
        },
      ];
    }
  }

  const keys = FIELD_ORDER.filter((k) => errors[k]);
  if (keys.length > 0) {
    return { ok: false, errors, firstErrorKey: keys[0]! };
  }

  return {
    ok: true,
    inicioReal: inicio!,
    fimReal: fim,
    areaExecutada,
    areaUnidade: fields.areaUnidade.trim() || "ha",
    insumos,
  };
}

export function resolveApontamentoOperacaoId(
  listItemId: number,
  serverRow: { id: number } | null | undefined,
): number {
  if (serverRow?.id != null && Number.isFinite(serverRow.id)) {
    return serverRow.id;
  }
  return listItemId;
}

export type MappedApontamentoError = {
  userMessage: string;
  field?: ApontamentoFieldKey;
  technicalLog: string;
};

function readTrpcErrorMeta(error: unknown): { code: string; message: string } {
  if (error && typeof error === "object") {
    const e = error as {
      message?: string;
      data?: { code?: string };
      shape?: { data?: { code?: string }; message?: string };
    };
    const code = String(e.data?.code ?? e.shape?.data?.code ?? "");
    const message =
      typeof e.message === "string" && e.message.length > 0
        ? e.message
        : typeof e.shape?.message === "string"
          ? e.shape.message
          : "";
    return { code, message };
  }
  if (typeof error === "string") return { code: "", message: error };
  return { code: "", message: "" };
}

/**
 * Mapeia erros tRPC/servidor para português simples (sem vazar stack/JSON feio).
 */
export function mapApontamentoServerError(error: unknown): MappedApontamentoError {
  const { code, message: trpcMessage } = readTrpcErrorMeta(error);
  const technical =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  const msg = trpcMessage || technical;

  if (
    code === "FORBIDDEN" ||
    /FORBIDDEN|não tem permissão|permission/i.test(msg)
  ) {
    if (/SAFRA_READ_ONLY|safra encerrada/i.test(msg)) {
      return {
        userMessage: "Esta safra está encerrada e permite somente consulta.",
        field: "_form",
        technicalLog: technical,
      };
    }
    return {
      userMessage: "Você não tem permissão para registrar execução nesta operação.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (code === "CONFLICT" || /CONFLICT|conflito de revisão|alterada por outra sessão/i.test(msg)) {
    return {
      userMessage:
        "Este registro foi alterado em outra sessão. Atualize os dados e tente novamente.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (/APONTAMENTO_STATUS_DENIED|não é possível registrar execução em status/i.test(msg)) {
    return {
      userMessage:
        "Esta operação não permite novos apontamentos no status atual. Coloque-a em execução (ou reabra) para registrar.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (/APONTAMENTO_REQUIRED/i.test(msg)) {
    return {
      userMessage: "Registre a execução real (início) antes de concluir a operação.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (/INVALID_APONTAMENTO_HORARIO|início deve ser/i.test(msg)) {
    return {
      userMessage: "O horário final não pode ser anterior ao início.",
      field: "fimReal",
      technicalLog: technical,
    };
  }

  if (/INVALID_APONTAMENTO_AREA|unidade obrigatória quando há área/i.test(msg)) {
    return {
      userMessage: "Informe a unidade da área executada.",
      field: "areaUnidade",
      technicalLog: technical,
    };
  }

  if (/INVALID_APONTAMENTO_INSUMO|quantidade deve ser/i.test(msg)) {
    return {
      userMessage: "A quantidade do insumo deve ser maior que zero.",
      field: "insumoQtd",
      technicalLog: technical,
    };
  }

  if (
    code === "BAD_REQUEST" ||
    code === "PARSE_ERROR" ||
    /BAD_REQUEST|validation|invalid_type|Expected |ZodError|Input validation/i.test(msg)
  ) {
    return {
      userMessage:
        "Não foi possível salvar: revise os campos do formulário (datas, área e insumos) e tente novamente.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (/APONTAMENTO_INSUMO_NOT_FOUND/i.test(msg)) {
    return {
      userMessage:
        "O insumo selecionado não pertence a esta propriedade. Escolha outro item ou informe o nome manualmente.",
      field: "insumoDesc",
      technicalLog: technical,
    };
  }

  if (/APONTAMENTO_MAQUINA_NOT_FOUND/i.test(msg)) {
    return {
      userMessage: "A máquina selecionada não pertence a esta propriedade.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (/APONTAMENTO_EVIDENCIA_NOT_FOUND/i.test(msg)) {
    return {
      userMessage: "O arquivo de evidência não foi encontrado. Remova ou anexe novamente.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (
    code === "NOT_FOUND" &&
    (/OPERACAO_AGRICOLA_NOT_FOUND|TENANT_NOT_FOUND|Recurso não encontrado/i.test(msg) ||
      (!/APONTAMENTO_/i.test(msg) && /NOT_FOUND/i.test(msg)))
  ) {
    return {
      userMessage: "Operação não encontrada ou sem acesso. Atualize a tela e tente novamente.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (code === "NOT_FOUND" || /NOT_FOUND/i.test(msg)) {
    return {
      userMessage: "Não foi possível salvar o apontamento. Atualize a tela e tente novamente.",
      field: "_form",
      technicalLog: technical,
    };
  }

  if (/doesn't exist|ER_NO_SUCH_TABLE|operacoes_agricolas_apontamentos/i.test(msg)) {
    return {
      userMessage:
        "O banco ainda não está preparado para apontamentos (migration 0039). Contate o suporte técnico.",
      field: "_form",
      technicalLog: technical,
    };
  }

  return {
    userMessage: "Não foi possível salvar o apontamento. Tente novamente.",
    field: "_form",
    technicalLog: technical,
  };
}

export function firstApontamentoErrorMessage(errors: ApontamentoFieldErrors): string {
  for (const key of FIELD_ORDER) {
    const msg = errors[key];
    if (msg) return msg;
  }
  return "Revise o formulário.";
}
