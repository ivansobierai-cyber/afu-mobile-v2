import { getProdutoMarketplaceById, getUsuarioAfuById } from "../db";
import { sendPushToUsuario } from "./push-delivery";

const STATUS_LABELS: Record<string, string> = {
  aguardando: "aguardando confirmação",
  confirmado: "confirmado",
  em_preparo: "em preparo",
  enviado: "enviado",
  entregue: "entregue",
  cancelado: "cancelado",
};

export async function notifyVendedorNovoPedido(input: {
  vendedorId: number;
  compradorId: number;
  pedidoId: number;
  produtoId: number;
}): Promise<void> {
  const [comprador, produto] = await Promise.all([
    getUsuarioAfuById(input.compradorId),
    getProdutoMarketplaceById(input.produtoId),
  ]);
  void sendPushToUsuario(input.vendedorId, {
    title: "Novo pedido no marketplace",
    body: `${comprador?.nome ?? "Comprador"} solicitou ${produto?.nomeProduto ?? "um produto"}.`,
    data: { type: "marketplace_venda", pedidoId: String(input.pedidoId) },
    priority: "high",
  });
}

export async function notifyCompradorStatusPedido(input: {
  compradorId: number;
  pedidoId: number;
  status: string;
  produtoId: number;
}): Promise<void> {
  const produto = await getProdutoMarketplaceById(input.produtoId);
  const label = STATUS_LABELS[input.status] ?? input.status;
  void sendPushToUsuario(input.compradorId, {
    title: "Atualização do seu pedido",
    body: `${produto?.nomeProduto ?? "Pedido"} está ${label}.`,
    data: { type: "marketplace_pedido", pedidoId: String(input.pedidoId) },
    priority: "high",
  });
}

export async function notifyVendedorPagamento(input: {
  vendedorId: number;
  pedidoId: number;
  produtoId: number;
}): Promise<void> {
  const produto = await getProdutoMarketplaceById(input.produtoId);
  void sendPushToUsuario(input.vendedorId, {
    title: "Pagamento recebido",
    body: `PIX confirmado para ${produto?.nomeProduto ?? "pedido"} #${input.pedidoId}.`,
    data: { type: "marketplace_venda", pedidoId: String(input.pedidoId) },
    priority: "high",
  });
}
