import React, { useState } from "react";
import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useRouter } from "expo-router";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Participante {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  pode: string[];
}

interface Categoria {
  id: string;
  nome: string;
  icone: string;
  cor: string;
  itens: string[];
}

interface TabData {
  id: string;
  label: string;
  icone: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TABS: TabData[] = [
  { id: "participantes", label: "Participantes", icone: "person.2.fill" },
  { id: "produtos", label: "Produtos", icone: "tag.fill" },
  { id: "pedidos", label: "Pedidos", icone: "cart.fill" },
  { id: "logistica", label: "Logística", icone: "tractor.fill" },
  { id: "ia", label: "IA/Mercado", icone: "chart.line.uptrend.xyaxis" },
  { id: "banco", label: "Banco", icone: "server.rack" },
];

const PARTICIPANTES: Participante[] = [
  {
    id: "produtor",
    nome: "Produtor",
    icone: "sprout.fill",
    cor: "#2E7D32",
    pode: [
      "Cadastrar produtos",
      "Definir preços",
      "Controlar estoque",
      "Receber pedidos",
      "Acompanhar pagamentos",
    ],
  },
  {
    id: "cooperativa",
    nome: "Cooperativa",
    icone: "building.2.fill",
    cor: "#1565C0",
    pode: [
      "Consolidar produtos",
      "Vender em lote",
      "Organizar logística",
      "Representar produtores",
    ],
  },
  {
    id: "comprador",
    nome: "Comprador",
    icone: "cart.fill",
    cor: "#EF6C00",
    pode: [
      "Pesquisar produtos",
      "Realizar pedidos",
      "Avaliar fornecedores",
      "Acompanhar entregas",
    ],
  },
  {
    id: "industria",
    nome: "Indústria",
    icone: "wrench.fill",
    cor: "#6A1B9A",
    pode: [
      "Comprar matéria-prima",
      "Solicitar contratos",
      "Programar fornecimento",
    ],
  },
  {
    id: "exportador",
    nome: "Exportador",
    icone: "globe",
    cor: "#00695C",
    pode: [
      "Buscar fornecedores",
      "Acompanhar certificações",
      "Verificar rastreabilidade",
    ],
  },
];

const CATEGORIAS: Categoria[] = [
  {
    id: "agricolas",
    nome: "Agrícolas",
    icone: "leaf.fill",
    cor: "#2E7D32",
    itens: ["Grãos", "Frutas", "Hortaliças", "Sementes", "Mudas"],
  },
  {
    id: "pecuarios",
    nome: "Pecuários",
    icone: "drop.fill",
    cor: "#1565C0",
    itens: ["Leite", "Mel", "Ovos", "Derivados"],
  },
  {
    id: "processados",
    nome: "Processados",
    icone: "flask.fill",
    cor: "#EF6C00",
    itens: ["Farinha", "Polpas", "Conservas", "Alimentos especiais"],
  },
  {
    id: "insumos",
    nome: "Insumos",
    icone: "bolt.fill",
    cor: "#795548",
    itens: ["Fertilizantes", "Bioinsumos", "Corretivos"],
  },
];

const CAMPOS_PRODUTO = [
  "Nome",
  "Categoria",
  "Descrição",
  "Preço",
  "Quantidade",
  "Unidade",
  "Fotos",
  "Certificações",
  "Origem",
  "Disponibilidade",
];

const CERTIFICACOES = [
  { nome: "Orgânico", cor: "#2E7D32", icone: "leaf.fill" },
  { nome: "Sustentável", cor: "#1565C0", icone: "globe" },
  { nome: "Agricultura Familiar", cor: "#EF6C00", icone: "sprout.fill" },
  { nome: "Boas Práticas Agrícolas", cor: "#6A1B9A", icone: "checkmark.circle.fill" },
];

const FLUXO_PEDIDO = [
  { etapa: "Comprador", icone: "person.fill", cor: "#1565C0" },
  { etapa: "Carrinho", icone: "cart.fill", cor: "#EF6C00" },
  { etapa: "Pedido", icone: "doc.text.fill", cor: "#2E7D32" },
  { etapa: "Pagamento", icone: "checkmark.circle.fill", cor: "#00695C" },
  { etapa: "Separação", icone: "square.grid.2x2.fill", cor: "#6A1B9A" },
  { etapa: "Envio", icone: "paperplane.fill", cor: "#795548" },
  { etapa: "Entrega", icone: "location.fill", cor: "#1B4332" },
  { etapa: "Avaliação", icone: "star.fill", cor: "#F9A825" },
];

const STATUS_PEDIDO = [
  { status: "Pendente", cor: "#EF6C00" },
  { status: "Pago", cor: "#2E7D32" },
  { status: "Separação", cor: "#1565C0" },
  { status: "Enviado", cor: "#6A1B9A" },
  { status: "Entregue", cor: "#00695C" },
  { status: "Cancelado", cor: "#C62828" },
];

const PAGAMENTOS = [
  { tipo: "PIX", icone: "bolt.fill", cor: "#2E7D32" },
  { tipo: "Cartão", icone: "creditcard.fill", cor: "#1565C0" },
  { tipo: "Boleto", icone: "doc.text.fill", cor: "#795548" },
  { tipo: "Transferência", icone: "arrow.right", cor: "#EF6C00" },
  { tipo: "Carteira Digital", icone: "iphone", cor: "#6A1B9A" },
];

const LOGISTICA_CADASTRO = [
  "Transportadoras",
  "Veículos",
  "Rotas",
  "Centros de distribuição",
];

const MONITORAMENTO = [
  { etapa: "Coleta", icone: "arrow.up.doc.fill", cor: "#2E7D32" },
  { etapa: "Transporte", icone: "tractor.fill", cor: "#1565C0" },
  { etapa: "Entrega", icone: "location.fill", cor: "#EF6C00" },
];

const TIPOS_CONTRATO = [
  { tipo: "Compra", cor: "#2E7D32" },
  { tipo: "Venda", cor: "#1565C0" },
  { tipo: "Parceria", cor: "#EF6C00" },
  { tipo: "Fornecimento", cor: "#6A1B9A" },
];

const IA_ANALISE = [
  "Preços de mercado",
  "Demanda regional",
  "Sazonalidade",
  "Concorrência",
  "Regiões estratégicas",
];

const IA_SUGESTOES = [
  { sugestao: "Melhor período de venda", icone: "calendar", cor: "#2E7D32" },
  { sugestao: "Preço sugerido", icone: "chart.line.uptrend.xyaxis", cor: "#1565C0" },
  { sugestao: "Mercados potenciais", icone: "globe", cor: "#EF6C00" },
  { sugestao: "Risco de queda", icone: "exclamationmark.triangle.fill", cor: "#C62828" },
];

const INTEGRACOES_AFU = [
  { modulo: "Diagnóstico IA", desc: "Histórico sanitário da cultura", icone: "eye.fill", cor: "#1565C0" },
  { modulo: "Laboratório", desc: "Laudos de qualidade anexados", icone: "flask.fill", cor: "#795548" },
  { modulo: "Certificações", desc: "Validação de documentos", icone: "checkmark.circle.fill", cor: "#2E7D32" },
  { modulo: "Sensores IoT", desc: "Condições de produção", icone: "antenna.radiowaves.left.and.right", cor: "#1B4332" },
  { modulo: "Relatórios", desc: "Rastreabilidade completa", icone: "doc.text.fill", cor: "#6A1B9A" },
];

const TABELAS_BD = [
  { tabela: "produtos", campos: "id, nome, categoria_id, preco, quantidade, unidade, fotos, origem, disponivel", chave: "PK: id" },
  { tabela: "categorias", campos: "id, nome, descricao, icone", chave: "PK: id" },
  { tabela: "estoques", campos: "id, produto_id, disponivel, reservado, vendido, minimo", chave: "FK: produto_id" },
  { tabela: "pedidos", campos: "id, comprador_id, status, total, data_pedido, data_entrega", chave: "FK: comprador_id" },
  { tabela: "itens_pedido", campos: "id, pedido_id, produto_id, quantidade, preco_unitario", chave: "FK: pedido_id, produto_id" },
  { tabela: "pagamentos", campos: "id, pedido_id, tipo, valor, status, data_pagamento", chave: "FK: pedido_id" },
  { tabela: "entregas", campos: "id, pedido_id, transportadora, status, rastreio, data_entrega", chave: "FK: pedido_id" },
  { tabela: "avaliacoes", campos: "id, pedido_id, nota_qualidade, nota_entrega, nota_comunicacao, comentario", chave: "FK: pedido_id" },
  { tabela: "certificacoes", campos: "id, produto_id, tipo, numero, validade, emissor, status", chave: "FK: produto_id" },
  { tabela: "lotes", campos: "id, produto_id, codigo, origem, talhao, data_producao, data_colheita, qr_code", chave: "FK: produto_id" },
  { tabela: "contratos", campos: "id, tipo, vendedor_id, comprador_id, valor, status, assinatura_digital", chave: "FK: vendedor_id, comprador_id" },
];

const INDICADORES_DASHBOARD = [
  { label: "Volume Negociado", valor: "1.250 t", icone: "scalemass.fill", cor: "#2E7D32" },
  { label: "Receita Total", valor: "R$ 4,2M", icone: "chart.line.uptrend.xyaxis", cor: "#1565C0" },
  { label: "Produtos Ativos", valor: "8.430", icone: "tag.fill", cor: "#EF6C00" },
  { label: "Pedidos/mês", valor: "12.800", icone: "cart.fill", cor: "#6A1B9A" },
  { label: "Exportações", valor: "R$ 890K", icone: "globe", cor: "#00695C" },
  { label: "Avaliação Média", valor: "4,7 ★", icone: "star.fill", cor: "#F9A825" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MarketplaceRuralScreen() {
  const colors = useColors();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("participantes");
  const [expandedParticipante, setExpandedParticipante] = useState<string | null>(null);
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(null);
  const [expandedTabela, setExpandedTabela] = useState<string | null>(null);

  const renderParticipantesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          5 Participantes do Marketplace
        </Text>
        {PARTICIPANTES.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setExpandedParticipante(expandedParticipante === p.id ? null : p.id)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: p.cor + "20" }]}>
                <IconSymbol name={p.icone as any} size={20} color={p.cor} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{p.nome}</Text>
              <View style={[styles.countBadge, { backgroundColor: p.cor + "20" }]}>
                <Text style={[styles.countText, { color: p.cor }]}>{p.pode.length} ações</Text>
              </View>
              <IconSymbol
                name={expandedParticipante === p.id ? "chevron.up" : "chevron.down"}
                size={16}
                color={colors.muted}
              />
            </View>
            {expandedParticipante === p.id && (
              <View style={styles.cardBody}>
                {p.pode.map((acao, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={[styles.dot, { backgroundColor: p.cor }]} />
                    <Text style={[styles.listText, { color: colors.foreground }]}>{acao}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          4 Categorias de Produtos
        </Text>
        {CATEGORIAS.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setExpandedCategoria(expandedCategoria === cat.id ? null : cat.id)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: cat.cor + "20" }]}>
                <IconSymbol name={cat.icone as any} size={20} color={cat.cor} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{cat.nome}</Text>
              <View style={[styles.countBadge, { backgroundColor: cat.cor + "20" }]}>
                <Text style={[styles.countText, { color: cat.cor }]}>{cat.itens.length} tipos</Text>
              </View>
              <IconSymbol
                name={expandedCategoria === cat.id ? "chevron.up" : "chevron.down"}
                size={16}
                color={colors.muted}
              />
            </View>
            {expandedCategoria === cat.id && (
              <View style={styles.cardBody}>
                <View style={styles.chipRow}>
                  {cat.itens.map((item, i) => (
                    <View key={i} style={[styles.chip, { backgroundColor: cat.cor + "15", borderColor: cat.cor + "40" }]}>
                      <Text style={[styles.chipText, { color: cat.cor }]}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Certificações Integradas
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {CERTIFICACOES.map((cert, i) => (
            <View key={i} style={[styles.certRow, i < CERTIFICACOES.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.iconBadge, { backgroundColor: cert.cor + "20" }]}>
                <IconSymbol name={cert.icone as any} size={16} color={cert.cor} />
              </View>
              <View style={styles.certInfo}>
                <Text style={[styles.certNome, { color: colors.foreground }]}>{cert.nome}</Text>
                <Text style={[styles.certDesc, { color: colors.muted }]}>Número · Validade · Emissor · Status · Documento</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderProdutosTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Cadastro de Produto
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.exampleBox}>
            <Text style={[styles.exampleTitle, { color: "#2E7D32" }]}>Exemplo: Milho Verde</Text>
            <Text style={[styles.exampleValue, { color: colors.foreground }]}>R$ 2,50/kg · Disponível</Text>
          </View>
          <View style={styles.fieldGrid}>
            {CAMPOS_PRODUTO.map((campo, i) => (
              <View key={i} style={[styles.fieldItem, { backgroundColor: "#2E7D32" + "10", borderColor: "#2E7D32" + "30" }]}>
                <Text style={[styles.fieldText, { color: "#2E7D32" }]}>{campo}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Rastreabilidade por Lote
        </Text>
        <View style={[styles.darkCard, { backgroundColor: "#1B2B1B" }]}>
          <Text style={[styles.darkCardTitle, { color: "#4CAF50" }]}>🔍 QR Code para Consulta Pública</Text>
          {[
            { label: "Código", valor: "LOT-2026-001234" },
            { label: "Origem", valor: "Fazenda São João — MT" },
            { label: "Talhão", valor: "Talhão 3 — Soja" },
            { label: "Data Produção", valor: "15/01/2026" },
            { label: "Data Colheita", valor: "20/04/2026" },
            { label: "Certificações", valor: "Orgânico · Sustentável" },
            { label: "Histórico", valor: "3 análises · 2 diagnósticos" },
          ].map((item, i) => (
            <View key={i} style={styles.darkRow}>
              <Text style={styles.darkLabel}>{item.label}:</Text>
              <Text style={styles.darkValue}>{item.valor}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Gestão de Estoque
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {[
            { label: "Disponível", valor: "850 kg", cor: "#2E7D32" },
            { label: "Reservado", valor: "120 kg", cor: "#EF6C00" },
            { label: "Vendido", valor: "2.340 kg", cor: "#1565C0" },
            { label: "Mínimo", valor: "100 kg", cor: "#C62828" },
          ].map((item, i) => (
            <View key={i} style={[styles.stockRow, i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.stockDot, { backgroundColor: item.cor }]} />
              <Text style={[styles.stockLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Text style={[styles.stockValue, { color: item.cor }]}>{item.valor}</Text>
            </View>
          ))}
          <View style={[styles.alertBox, { backgroundColor: "#C62828" + "15", borderColor: "#C62828" + "40" }]}>
            <IconSymbol name="bell.fill" size={14} color="#C62828" />
            <Text style={[styles.alertText, { color: "#C62828" }]}>Alertas automáticos de reposição quando estoque atingir o mínimo</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderPedidosTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Fluxo do Pedido (8 etapas)
        </Text>
        <View style={[styles.darkCard, { backgroundColor: "#0D1B2A" }]}>
          {FLUXO_PEDIDO.map((item, i) => (
            <View key={i} style={styles.fluxoRow}>
              <View style={[styles.fluxoIconBox, { backgroundColor: item.cor + "30" }]}>
                <IconSymbol name={item.icone as any} size={18} color={item.cor} />
              </View>
              <Text style={[styles.fluxoLabel, { color: "#E8F5E9" }]}>{item.etapa}</Text>
              {i < FLUXO_PEDIDO.length - 1 && (
                <View style={[styles.fluxoArrow, { backgroundColor: item.cor + "40" }]}>
                  <IconSymbol name="chevron.down" size={12} color={item.cor} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Status do Pedido
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chipRow}>
            {STATUS_PEDIDO.map((s, i) => (
              <View key={i} style={[styles.statusChip, { backgroundColor: s.cor + "20", borderColor: s.cor + "50" }]}>
                <View style={[styles.statusDot, { backgroundColor: s.cor }]} />
                <Text style={[styles.statusText, { color: s.cor }]}>{s.status}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Formas de Pagamento
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {PAGAMENTOS.map((p, i) => (
            <View key={i} style={[styles.pagRow, i < PAGAMENTOS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[styles.iconBadge, { backgroundColor: p.cor + "20" }]}>
                <IconSymbol name={p.icone as any} size={18} color={p.cor} />
              </View>
              <Text style={[styles.pagLabel, { color: colors.foreground }]}>{p.tipo}</Text>
            </View>
          ))}
          <View style={[styles.infoBox, { backgroundColor: "#1565C0" + "10", borderColor: "#1565C0" + "30" }]}>
            <Text style={[styles.infoText, { color: "#1565C0" }]}>
              Split de pagamento · Emissão de comprovantes · Conciliação financeira
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Avaliações
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {["Qualidade", "Entrega", "Comunicação", "Confiabilidade"].map((criterio, i) => (
            <View key={i} style={styles.avalRow}>
              <Text style={[styles.avalLabel, { color: colors.foreground }]}>{criterio}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <IconSymbol key={star} name="star.fill" size={14} color="#F9A825" />
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderLogisticaTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Cadastro de Logística
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.fieldGrid}>
            {LOGISTICA_CADASTRO.map((item, i) => (
              <View key={i} style={[styles.fieldItem, { backgroundColor: "#1565C0" + "10", borderColor: "#1565C0" + "30" }]}>
                <Text style={[styles.fieldText, { color: "#1565C0" }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Monitoramento de Entrega
        </Text>
        <View style={[styles.darkCard, { backgroundColor: "#0A1628" }]}>
          {MONITORAMENTO.map((m, i) => (
            <View key={i} style={styles.fluxoRow}>
              <View style={[styles.fluxoIconBox, { backgroundColor: m.cor + "30" }]}>
                <IconSymbol name={m.icone as any} size={18} color={m.cor} />
              </View>
              <Text style={[styles.fluxoLabel, { color: "#E3F2FD" }]}>{m.etapa}</Text>
              {i < MONITORAMENTO.length - 1 && (
                <View style={[styles.fluxoArrow, { backgroundColor: m.cor + "40" }]}>
                  <IconSymbol name="chevron.down" size={12} color={m.cor} />
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Contratos Digitais
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.chipRow}>
            {TIPOS_CONTRATO.map((c, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: c.cor + "15", borderColor: c.cor + "40" }]}>
                <Text style={[styles.chipText, { color: c.cor }]}>{c.tipo}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.infoBox, { backgroundColor: "#2E7D32" + "10", borderColor: "#2E7D32" + "30", marginTop: 12 }]}>
            <Text style={[styles.infoText, { color: "#2E7D32" }]}>
              ✍️ Assinatura eletrônica · Aceite digital · Histórico de versões
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Painéis por Perfil
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.subTitle, { color: "#2E7D32" }]}>Painel do Produtor</Text>
          <View style={styles.chipRow}>
            {["Produtos ativos", "Pedidos", "Receita", "Estoque", "Avaliações", "Certificações"].map((item, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: "#2E7D32" + "15", borderColor: "#2E7D32" + "40" }]}>
                <Text style={[styles.chipText, { color: "#2E7D32" }]}>{item}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.subTitle, { color: "#1565C0", marginTop: 12 }]}>Painel do Comprador</Text>
          <View style={styles.chipRow}>
            {["Pedidos", "Fornecedores", "Favoritos", "Histórico", "Pagamentos"].map((item, i) => (
              <View key={i} style={[styles.chip, { backgroundColor: "#1565C0" + "15", borderColor: "#1565C0" + "40" }]}>
                <Text style={[styles.chipText, { color: "#1565C0" }]}>{item}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderIaTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Inteligência de Mercado
        </Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardSubtitle, { color: colors.muted }]}>A IA analisa em tempo real:</Text>
          {IA_ANALISE.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <View style={[styles.dot, { backgroundColor: "#2E7D32" }]} />
              <Text style={[styles.listText, { color: colors.foreground }]}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Sugestões da IA
        </Text>
        {IA_SUGESTOES.map((s, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: s.cor + "20" }]}>
                <IconSymbol name={s.icone as any} size={18} color={s.cor} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{s.sugestao}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Integração com Módulos AFU
        </Text>
        {INTEGRACOES_AFU.map((integ, i) => (
          <View key={i} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: integ.cor + "20" }]}>
                <IconSymbol name={integ.icone as any} size={18} color={integ.cor} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{integ.modulo}</Text>
                <Text style={[styles.cardDesc, { color: colors.muted }]}>{integ.desc}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Meta de Escalabilidade
        </Text>
        <View style={[styles.darkCard, { backgroundColor: "#1B2B1B" }]}>
          {[
            { label: "Produtores", valor: "100.000", icone: "sprout.fill" },
            { label: "Produtos", valor: "1.000.000", icone: "tag.fill" },
            { label: "Pedidos", valor: "10.000.000", icone: "cart.fill" },
          ].map((item, i) => (
            <View key={i} style={styles.metaRow}>
              <IconSymbol name={item.icone as any} size={20} color="#4CAF50" />
              <Text style={styles.metaLabel}>{item.label}</Text>
              <Text style={styles.metaValor}>{item.valor}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderBancoTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          11 Tabelas do Marketplace
        </Text>
        {TABELAS_BD.map((t) => (
          <TouchableOpacity
            key={t.tabela}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setExpandedTabela(expandedTabela === t.tabela ? null : t.tabela)}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBadge, { backgroundColor: "#2E7D32" + "20" }]}>
                <IconSymbol name="server.rack" size={16} color="#2E7D32" />
              </View>
              <Text style={[styles.cardTitle, { color: colors.foreground }]}>{t.tabela}</Text>
              <View style={[styles.pkBadge, { backgroundColor: "#1565C0" + "20" }]}>
                <Text style={[styles.pkText, { color: "#1565C0" }]}>{t.chave}</Text>
              </View>
              <IconSymbol
                name={expandedTabela === t.tabela ? "chevron.up" : "chevron.down"}
                size={16}
                color={colors.muted}
              />
            </View>
            {expandedTabela === t.tabela && (
              <View style={styles.cardBody}>
                <Text style={[styles.camposText, { color: colors.muted }]}>{t.campos}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Dashboard Estratégico
        </Text>
        <View style={styles.statsGrid}>
          {INDICADORES_DASHBOARD.map((ind, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: ind.cor + "15", borderColor: ind.cor + "30" }]}>
              <IconSymbol name={ind.icone as any} size={22} color={ind.cor} />
              <Text style={[styles.statValor, { color: ind.cor }]}>{ind.valor}</Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{ind.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "participantes": return renderParticipantesTab();
      case "produtos": return renderProdutosTab();
      case "pedidos": return renderPedidosTab();
      case "logistica": return renderLogisticaTab();
      case "ia": return renderIaTab();
      case "banco": return renderBancoTab();
      default: return renderParticipantesTab();
    }
  };

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: "#2E7D32", borderBottomColor: "#1B5E20" }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <IconSymbol name="chevron.left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Marketplace Rural AFU</Text>
          <Text style={styles.headerSubtitle}>Etapa 16 · Comercialização Inteligente</Text>
        </View>
        <View style={[styles.etapaBadge, { backgroundColor: "#fff" + "20" }]}>
          <Text style={styles.etapaText}>E16</Text>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && { borderBottomColor: "#2E7D32", borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <IconSymbol
              name={tab.icone as any}
              size={16}
              color={activeTab === tab.id ? "#2E7D32" : colors.muted}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.id ? "#2E7D32" : colors.muted },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>{renderContent()}</View>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 12, color: "#C8E6C9", marginTop: 2 },
  etapaBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  etapaText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  tabBar: { maxHeight: 56, borderBottomWidth: 1 },
  tabBarContent: { paddingHorizontal: 12, alignItems: "center", gap: 4 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 16 },
  tabLabel: { fontSize: 12, fontWeight: "600" },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  subTitle: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  card: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.08)" },
  cardInfo: { flex: 1 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: "600" },
  cardDesc: { fontSize: 12, marginTop: 2 },
  cardSubtitle: { fontSize: 12, marginBottom: 10 },
  iconBadge: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  countText: { fontSize: 11, fontWeight: "700" },
  pkBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  pkText: { fontSize: 10, fontWeight: "600" },
  listItem: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  listText: { fontSize: 13 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: "600" },
  certRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  certInfo: { flex: 1 },
  certNome: { fontSize: 13, fontWeight: "600" },
  certDesc: { fontSize: 11, marginTop: 2 },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  fieldItem: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  fieldText: { fontSize: 12, fontWeight: "600" },
  exampleBox: { backgroundColor: "#2E7D32" + "10", borderRadius: 8, padding: 10, marginBottom: 10 },
  exampleTitle: { fontSize: 14, fontWeight: "700" },
  exampleValue: { fontSize: 13, marginTop: 2 },
  darkCard: { borderRadius: 12, padding: 16, marginBottom: 8 },
  darkCardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 12 },
  darkRow: { flexDirection: "row", gap: 8, marginBottom: 6 },
  darkLabel: { fontSize: 12, color: "#81C784", fontWeight: "600", width: 120 },
  darkValue: { fontSize: 12, color: "#E8F5E9", flex: 1 },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  stockDot: { width: 10, height: 10, borderRadius: 5 },
  stockLabel: { flex: 1, fontSize: 13 },
  stockValue: { fontSize: 14, fontWeight: "700" },
  alertBox: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, borderWidth: 1, padding: 10, marginTop: 12 },
  alertText: { flex: 1, fontSize: 12 },
  infoBox: { borderRadius: 8, borderWidth: 1, padding: 10 },
  infoText: { fontSize: 12, textAlign: "center" },
  fluxoRow: { alignItems: "center", marginBottom: 4 },
  fluxoIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  fluxoLabel: { fontSize: 13, fontWeight: "600", marginTop: 4 },
  fluxoArrow: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", marginVertical: 2 },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: "600" },
  pagRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  pagLabel: { fontSize: 13, fontWeight: "600" },
  avalRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  avalLabel: { fontSize: 13 },
  starsRow: { flexDirection: "row", gap: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#2E7D32" + "30" },
  metaLabel: { flex: 1, fontSize: 14, color: "#C8E6C9", fontWeight: "600" },
  metaValor: { fontSize: 16, color: "#4CAF50", fontWeight: "700" },
  camposText: { fontSize: 12, lineHeight: 18 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: { width: "47%", borderRadius: 12, borderWidth: 1, padding: 14, alignItems: "center", gap: 6 },
  statValor: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, textAlign: "center" },
});
