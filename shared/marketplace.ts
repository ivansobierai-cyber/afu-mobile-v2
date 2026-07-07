export type MetodoPagamento = "pix" | "na_entrega";

export interface CartItem {
  produtoId: number;
  nome: string;
  preco: number;
  unidade?: string;
  quantidade: number;
  vendedorId: number;
}

export const PAGAMENTO_LABELS: Record<MetodoPagamento, string> = {
  pix: "PIX (pagamento online)",
  na_entrega: "Pagar na entrega",
};

export const PAGAMENTO_STATUS: Record<string, { label: string; color: string }> = {
  pendente: { label: "Pagamento pendente", color: "#D97706" },
  pago: { label: "Pago", color: "#16A34A" },
  estornado: { label: "Estornado", color: "#6B7280" },
  cancelado: { label: "Cancelado", color: "#6B7280" },
};

export const PEDIDO_STATUS_STEPS = [
  "aguardando",
  "confirmado",
  "em_preparo",
  "enviado",
  "entregue",
] as const;

const METODO_PREFIX = /^__mp:(pix|na_entrega)__\n?/;

export function encodeMarketplaceObservacoes(
  metodo: MetodoPagamento,
  observacoes?: string,
): string {
  const base = `__mp:${metodo}__`;
  const extra = observacoes?.trim();
  return extra ? `${base}\n${extra}` : base;
}

export function parseMarketplaceObservacoes(raw: string | null | undefined): {
  metodo: MetodoPagamento | null;
  observacoes: string;
} {
  if (!raw) return { metodo: null, observacoes: "" };
  const match = raw.match(METODO_PREFIX);
  if (!match) return { metodo: null, observacoes: raw };
  return {
    metodo: match[1] as MetodoPagamento,
    observacoes: raw.replace(METODO_PREFIX, "").trim(),
  };
}

export function generateDemoPixCode(pedidoId: number, valor: number): string {
  const valorStr = valor.toFixed(2);
  return `00020126580014BR.GOV.BCB.PIX0136demo@afuagro.com.br520400005303986540${valorStr.length}${valorStr}5802BR5913AFU Marketplace6009SAO PAULO62070503***6304${String(pedidoId).padStart(4, "0")}`;
}
