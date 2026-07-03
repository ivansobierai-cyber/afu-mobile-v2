import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

const TABS = [
  { id: "modulos", label: "Módulos" },
  { id: "catalogos", label: "Catálogos" },
  { id: "rastreabilidade", label: "Rastreab." },
  { id: "pedidos", label: "Pedidos" },
  { id: "marketplace", label: "Mercado" },
  { id: "dashboard", label: "Dashboard" },
];

export default function MarketplaceAgricolaScreen() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState("modulos");

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-1">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🛒</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">AFU Marketplace</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">
              Produtos · Mudas · Sementes · Rastreabilidade · Logística
            </Text>
          </View>
          <View style={{ backgroundColor: "#C62828" }} className="rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">Etapa 44</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-2">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              className="mr-1 py-3 px-3"
            >
              <Text style={{ color: activeTab === tab.id ? "#1B5E20" : colors.muted, fontWeight: activeTab === tab.id ? "700" : "400", fontSize: 13 }}>
                {tab.label}
              </Text>
              {activeTab === tab.id && (
                <View style={{ backgroundColor: "#1B5E20", height: 2 }} className="rounded-full mt-1" />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">

        {/* ─── MÓDULOS ─── */}
        {activeTab === "modulos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Módulos do Marketplace</Text>
            <Text className="text-xs text-muted mb-4">7 atores · 8 módulos · Tabela de produtos · 8 categorias</Text>

            {/* Atores */}
            <View style={{ backgroundColor: "#1B5E20" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">🤝 Atores Conectados</Text>
              <View className="flex-row flex-wrap gap-2">
                {["Produtores", "Cooperativas", "Consumidores", "Mercados", "Atacadistas", "Exportadores", "Fornecedores"].map((a) => (
                  <View key={a} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text className="text-white text-xs font-semibold">{a}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* 8 Módulos */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { m: "Produtos Agrícolas", emoji: "🌽", cor: "#2E7D32" },
                { m: "Mudas", emoji: "🌱", cor: "#388E3C" },
                { m: "Sementes", emoji: "🌾", cor: "#F57F17" },
                { m: "Insumos", emoji: "🧪", cor: "#0288D1" },
                { m: "Máquinas", emoji: "🚜", cor: "#455A64" },
                { m: "Serviços Técnicos", emoji: "👨‍🌾", cor: "#7B1FA2" },
                { m: "Fretes", emoji: "🚛", cor: "#C62828" },
                { m: "Certificações", emoji: "📜", cor: "#00695C" },
              ].map((mod) => (
                <View key={mod.m} style={{ backgroundColor: mod.cor + "15", borderWidth: 1, borderColor: mod.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                  <Text className="text-xl">{mod.emoji}</Text>
                  <Text style={{ color: mod.cor }} className="text-xs font-bold">{mod.m}</Text>
                </View>
              ))}
            </View>

            {/* Tabela marketplace_produtos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">🗄️ Tabela: marketplace_produtos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["id", "produtor_id", "categoria", "nome_produto", "descricao", "preco", "unidade", "estoque", "status"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Categorias</Text>
                <View className="flex-row flex-wrap gap-1">
                  {["Hortaliças", "Frutas", "Raízes", "Café", "Mudas", "Sementes", "Bioinsumos", "Fertilizantes"].map((cat) => (
                    <View key={cat} style={{ backgroundColor: "#F1F8E9", borderWidth: 1, borderColor: "#558B2F30" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#558B2F" }} className="text-xs">{cat}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── CATÁLOGOS ─── */}
        {activeTab === "catalogos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Catálogos de Produtos</Text>
            <Text className="text-xs text-muted mb-4">Mudas · Sementes · Bioinsumos · Serviços Técnicos</Text>

            {/* Mudas */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#388E3C30" }}>
              <View style={{ backgroundColor: "#388E3C" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌱 Catálogo de Mudas</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Morango Albion", "Morango San Andreas", "Café Catuaí", "Café Arara", "Mandioca BRS Formosa", "Batata-doce BRS Amélia"].map((m) => (
                  <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#388E3C30", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#388E3C" }} className="text-xs font-bold">{m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Sementes */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌾 Catálogo de Sementes</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Lote", "Cultivar", "Geração", "Pureza", "Germinação", "Validade"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-bold">{c}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Bioinsumos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🧬 Catálogo de Bioinsumos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Trichoderma", "Azospirillum", "Rhizobium", "Bacillus subtilis"].map((b) => (
                  <View key={b} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#0288D1" }} className="text-xs font-bold">{b}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Serviços Técnicos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">👨‍🌾 Serviços Técnicos</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Agronomia", "Análise de Solo", "Análise Foliar", "Topografia", "Drones", "Irrigação", "Consultoria"].map((s) => (
                  <View key={s} style={{ backgroundColor: "#F3E5F5", borderWidth: 1, borderColor: "#7B1FA230", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#7B1FA2" }} className="text-xs font-bold">{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── RASTREABILIDADE ─── */}
        {activeTab === "rastreabilidade" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Rastreabilidade AFU</Text>
            <Text className="text-xs text-muted mb-4">QR Code · Fluxo · Certificações · Produtores</Text>

            {/* Lote */}
            <View style={{ backgroundColor: "#004D40" }} className="rounded-xl p-4 mb-4">
              <Text className="text-white text-sm font-bold mb-3">📦 Cada Lote Terá</Text>
              <View className="flex-row flex-wrap gap-2">
                {[
                  { i: "QR Code", emoji: "📱" },
                  { i: "Código Único", emoji: "🔑" },
                  { i: "Origem", emoji: "📍" },
                  { i: "Data de Produção", emoji: "📅" },
                  { i: "Histórico Completo", emoji: "📋" },
                ].map((item) => (
                  <View key={item.i} style={{ backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 12, padding: 8, width: "47%" }} className="flex-row items-center gap-2">
                    <Text className="text-base">{item.emoji}</Text>
                    <Text className="text-white text-xs font-semibold">{item.i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fluxo */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔄 Fluxo de Rastreabilidade</Text>
              </View>
              <View className="p-4 bg-surface">
                {[
                  { e: "Plantio", emoji: "🌱", cor: "#2E7D32" },
                  { e: "Monitoramento", emoji: "📡", cor: "#0288D1" },
                  { e: "Colheita", emoji: "🌾", cor: "#F57F17" },
                  { e: "Armazenamento", emoji: "🏭", cor: "#455A64" },
                  { e: "Venda", emoji: "🛒", cor: "#7B1FA2" },
                  { e: "Consumidor", emoji: "👤", cor: "#C62828" },
                ].map((step, i) => (
                  <View key={step.e} className="flex-row items-center mb-1">
                    <View style={{ backgroundColor: step.cor, width: 28, height: 28, borderRadius: 14, marginRight: 10 }} className="items-center justify-center">
                      <Text className="text-white text-xs font-bold">{i + 1}</Text>
                    </View>
                    <Text className="text-base mr-2">{step.emoji}</Text>
                    <Text style={{ color: step.cor }} className="text-sm font-bold flex-1">{step.e}</Text>
                    {i < 5 && <Text style={{ color: colors.muted }} className="text-xs">↓</Text>}
                  </View>
                ))}
              </View>
            </View>

            {/* Certificações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#00695C30" }}>
              <View style={{ backgroundColor: "#00695C" }} className="p-3">
                <Text className="text-white text-sm font-bold">📜 Certificações Suportadas</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Orgânico", "Produção Integrada", "GlobalG.A.P.", "Fair Trade", "Rainforest Alliance"].map((cert) => (
                  <View key={cert} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#00695C30" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">✅ {cert}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Cadastro de Produtores */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">👨‍🌾 Cadastro de Produtores</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-1">
                {["id", "nome", "cpf_cnpj", "propriedade", "municipio", "estado", "certificacoes", "avaliacao"].map((c) => (
                  <View key={c} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-mono">{c}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── PEDIDOS ─── */}
        {activeTab === "pedidos" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Pedidos e Pagamentos</Text>
            <Text className="text-xs text-muted mb-4">Tabela pedidos · 6 status · 5 métodos · Carteira AFU · Fretes</Text>

            {/* Tabela pedidos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🗄️ Tabela: pedidos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["id", "cliente_id", "produtor_id", "valor", "status", "data"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#1B5E20" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
                <Text className="text-xs font-bold text-foreground mb-2">Status do Pedido</Text>
                <View className="flex-row flex-wrap gap-1">
                  {[
                    { s: "Aguardando", cor: "#F57F17" },
                    { s: "Pago", cor: "#0288D1" },
                    { s: "Separação", cor: "#7B1FA2" },
                    { s: "Enviado", cor: "#1565C0" },
                    { s: "Entregue", cor: "#2E7D32" },
                    { s: "Cancelado", cor: "#C62828" },
                  ].map((st) => (
                    <View key={st.s} style={{ backgroundColor: st.cor + "15", borderWidth: 1, borderColor: st.cor + "30" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: st.cor }} className="text-xs font-bold">{st.s}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Pagamentos */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">💳 Métodos de Pagamento</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {[
                  { m: "PIX", emoji: "⚡", cor: "#00695C" },
                  { m: "Cartão", emoji: "💳", cor: "#1565C0" },
                  { m: "Boleto", emoji: "📄", cor: "#455A64" },
                  { m: "Transferência", emoji: "🏦", cor: "#7B1FA2" },
                  { m: "Carteira Digital", emoji: "👛", cor: "#C62828" },
                ].map((p) => (
                  <View key={p.m} style={{ backgroundColor: p.cor + "15", borderWidth: 1, borderColor: p.cor + "30", width: "47%" }} className="rounded-xl p-3 flex-row items-center gap-2">
                    <Text className="text-xl">{p.emoji}</Text>
                    <Text style={{ color: p.cor }} className="text-xs font-bold">{p.m}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Carteira AFU */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">👛 Carteira AFU</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Receber pagamentos", "Pagar fornecedores", "Transferir saldo", "Relatórios financeiros"].map((f) => (
                  <View key={f} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", width: "47%" }} className="rounded-xl p-2">
                    <Text style={{ color: "#F57F17" }} className="text-xs font-bold">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fretes */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#C6282830" }}>
              <View style={{ backgroundColor: "#C62828" }} className="p-3">
                <Text className="text-white text-sm font-bold">🚛 Banco de Fretes</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["Origem", "Destino", "Peso", "Volume", "Transportadora", "Prazo"].map((c) => (
                    <View key={c} style={{ backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#C6282830" }} className="rounded-full px-2 py-0.5">
                      <Text style={{ color: "#C62828" }} className="text-xs font-mono">{c}</Text>
                    </View>
                  ))}
                </View>
                <View className="flex-row gap-2">
                  {["Local", "Regional", "Nacional", "Internacional"].map((t) => (
                    <View key={t} style={{ backgroundColor: "#C62828", flex: 1 }} className="rounded-xl p-2 items-center">
                      <Text className="text-white text-xs font-bold text-center">{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ─── MARKETPLACE ─── */}
        {activeTab === "marketplace" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Marketplace</Text>
            <Text className="text-xs text-muted mb-4">Regional · Nacional · Internacional · Avaliações · Fidelidade</Text>

            {/* Regional */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#2E7D3230" }}>
              <View style={{ backgroundColor: "#2E7D32" }} className="p-3">
                <Text className="text-white text-sm font-bold">📍 Marketplace Regional</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Município", "Estado", "Região", "Distância"].map((f) => (
                  <View key={f} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230", width: "47%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#2E7D32" }} className="text-xs font-bold">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Nacional */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1565C030" }}>
              <View style={{ backgroundColor: "#1565C0" }} className="p-3">
                <Text className="text-white text-sm font-bold">🇧🇷 Marketplace Nacional</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Categoria", "Preço", "Certificação", "Disponibilidade"].map((f) => (
                  <View key={f} style={{ backgroundColor: "#E3F2FD", borderWidth: 1, borderColor: "#1565C030", width: "47%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Internacional */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#00695C30" }}>
              <View style={{ backgroundColor: "#00695C" }} className="p-3">
                <Text className="text-white text-sm font-bold">🌍 Marketplace Internacional</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Documentação", "Certificações", "Logística", "Rastreabilidade"].map((f) => (
                  <View key={f} style={{ backgroundColor: "#E0F2F1", borderWidth: 1, borderColor: "#00695C30", width: "47%" }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#00695C" }} className="text-xs font-bold">{f}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Avaliações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#F57F1730" }}>
              <View style={{ backgroundColor: "#F57F17" }} className="p-3">
                <Text className="text-white text-sm font-bold">⭐ Avaliações (1 a 5 estrelas)</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Produtor", "Produto", "Entrega"].map((cat) => (
                  <View key={cat} style={{ backgroundColor: "#FFF8E1", borderWidth: 1, borderColor: "#F57F1730", flex: 1 }} className="rounded-xl p-3 items-center">
                    <Text className="text-xl mb-1">⭐</Text>
                    <Text style={{ color: "#F57F17" }} className="text-xs font-bold text-center">{cat}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Fidelidade */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#7B1FA230" }}>
              <View style={{ backgroundColor: "#7B1FA2" }} className="p-3">
                <Text className="text-white text-sm font-bold">🎁 Programa de Fidelidade</Text>
              </View>
              <View className="p-4 bg-surface flex-row gap-2">
                {["Pontos", "Descontos", "Benefícios técnicos"].map((b) => (
                  <View key={b} style={{ backgroundColor: "#F3E5F5", borderWidth: 1, borderColor: "#7B1FA230", flex: 1 }} className="rounded-xl p-2 items-center">
                    <Text style={{ color: "#7B1FA2" }} className="text-xs font-bold text-center">{b}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* ─── DASHBOARD ─── */}
        {activeTab === "dashboard" && (
          <View className="pb-8">
            <Text className="text-base font-bold text-foreground mb-1">Dashboard Comercial</Text>
            <Text className="text-xs text-muted mb-4">5 KPIs · IA comercial · Recomendações · 15 módulos</Text>

            {/* KPIs */}
            <View className="flex-row flex-wrap gap-2 mb-4">
              {[
                { k: "Vendas", emoji: "📈", cor: "#2E7D32" },
                { k: "Receita", emoji: "💰", cor: "#F57F17" },
                { k: "Pedidos", emoji: "📦", cor: "#1565C0" },
                { k: "Clientes", emoji: "👥", cor: "#7B1FA2" },
                { k: "Produtos", emoji: "🌽", cor: "#00695C" },
              ].map((k) => (
                <View key={k.k} style={{ backgroundColor: k.cor + "15", borderWidth: 1, borderColor: k.cor + "30", width: "47%" }} className="rounded-xl p-3">
                  <Text className="text-2xl mb-1">{k.emoji}</Text>
                  <Text style={{ color: k.cor }} className="text-xs font-bold">{k.k}</Text>
                </View>
              ))}
            </View>

            {/* IA Comercial */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">🤖 Inteligência Comercial — IA analisa</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2 mb-3">
                {["Demanda", "Oferta", "Preços", "Tendências", "Sazonalidade"].map((a) => (
                  <View key={a} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-full px-3 py-1">
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-semibold">{a}</Text>
                  </View>
                ))}
              </View>
              <View className="px-4 pb-4">
                <Text className="text-xs font-bold text-foreground mb-2">💡 Recomendações da IA</Text>
                {[
                  "Alta demanda por morango.",
                  "Preço favorável para café.",
                  "Oportunidade para venda de mudas.",
                ].map((r, i) => (
                  <View key={i} className="flex-row items-start mb-1">
                    <Text style={{ color: "#2E7D32" }} className="text-xs mr-2">→</Text>
                    <Text className="text-xs text-foreground flex-1">{r}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Integrações */}
            <View className="rounded-xl overflow-hidden mb-4" style={{ borderWidth: 1, borderColor: "#0288D130" }}>
              <View style={{ backgroundColor: "#0288D1" }} className="p-3">
                <Text className="text-white text-sm font-bold">🔗 Integrações</Text>
              </View>
              <View className="p-4 bg-surface flex-row flex-wrap gap-2">
                {["Calendário Agrícola", "Estoque", "Produção", "Colheita", "Laudos", "Certificados", "Qualidade"].map((i) => (
                  <View key={i} style={{ backgroundColor: "#E1F5FE", borderWidth: 1, borderColor: "#0288D130" }} className="rounded-full px-2 py-0.5">
                    <Text style={{ color: "#0288D1" }} className="text-xs">{i}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Status 15 módulos */}
            <View className="rounded-xl overflow-hidden" style={{ borderWidth: 1, borderColor: "#1B5E2030" }}>
              <View style={{ backgroundColor: "#1B5E20" }} className="p-3">
                <Text className="text-white text-sm font-bold">✅ Status AFU — 15 Módulos Concluídos</Text>
              </View>
              <View className="p-4 bg-surface">
                <View className="flex-row flex-wrap gap-1 mb-3">
                  {["Agronomia", "Solos", "Clima", "Genética", "Nutrição", "Irrigação", "Pragas", "Doenças", "Calendário", "Laboratório", "Economia", "IA", "Geointeligência", "IoT", "Marketplace"].map((m) => (
                    <View key={m} style={{ backgroundColor: "#E8F5E9", borderWidth: 1, borderColor: "#2E7D3230" }} className="rounded-full px-2 py-0.5 flex-row items-center gap-1">
                      <Text style={{ color: "#2E7D32" }} className="text-xs">✅</Text>
                      <Text style={{ color: "#2E7D32" }} className="text-xs font-semibold">{m}</Text>
                    </View>
                  ))}
                </View>
                <View style={{ backgroundColor: "#0D47A115", borderWidth: 1, borderColor: "#0D47A130" }} className="rounded-xl p-3">
                  <Text style={{ color: "#0D47A1" }} className="text-xs font-bold">Próxima: Etapa 45</Text>
                  <Text style={{ color: "#0D47A1" }} className="text-xs">AFU Centro de Comando (NOC Agrícola) — monitoramento nacional, painéis em tempo real, alertas críticos e controle operacional completo do ecossistema AFU</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
