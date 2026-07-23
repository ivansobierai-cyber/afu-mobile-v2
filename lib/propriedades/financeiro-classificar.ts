/**
 * Classificação automática de lançamentos financeiros (Etapa 8 Passo 2).
 */
export type TipoLancamentoFinanceiro = "despesa" | "receita" | "custo" | "investimento";

export function classificarLancamentoFinanceiro(
  tipo: TipoLancamentoFinanceiro,
  descricao: string,
): string {
  const d = descricao
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (tipo === "receita") {
    if (/(venda|colheita|comercializ)/.test(d)) return "venda_producao";
    if (/(arrenda|aluguel)/.test(d)) return "arrendamento";
    if (/(servico|prestacao)/.test(d)) return "servico";
    return "receita_outra";
  }

  if (tipo === "investimento") {
    if (/(trator|colheit|pulveriz|caminhao|maquina|equipamento)/.test(d)) return "ativo_imobilizado";
    if (/(infra|galpao|silo|irrig)/.test(d)) return "infraestrutura";
    return "investimento_outro";
  }

  // despesa | custo
  if (/(salario|mao de obra|diaria|operador|funcionario)/.test(d)) return "mao_obra";
  if (/(diesel|combust|gasolina|etanol)/.test(d)) return "combustivel";
  if (/(adubo|ureia|npk|defensiv|herbic|fungic|insetic|semente|fertiliz)/.test(d)) return "insumo";
  if (/(manutenc|peca|oficina|reparo)/.test(d)) return "manutencao";
  if (/(frete|transporte|logistica)/.test(d)) return "logistica";
  if (/(energia|agua|imposto|taxa|seguro)/.test(d)) return "overhead";
  if (tipo === "custo") return "custo_operacional";
  return "despesa_outra";
}
