import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Visão Geral", "IA & APIs", "IoT", "Pagamentos", "Parceiros"];

export default function IntegracoesTecnicasScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1B5E20" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#2E7D32" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔗</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Integrações Técnicas</Text>
            <Text style={{ color: "#A5D6A7" }} className="text-xs">Etapa 12 · Arquitetura Técnica</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#1B5E20" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">🔗 Mapa de Integrações</Text>
              {[
                { cat: "IA / LLM", integ: "OpenAI GPT-4o, Anthropic Claude 3, Google Gemini Pro" },
                { cat: "Comunicação", integ: "Meta WhatsApp Business API, Firebase Push, Twilio SMS" },
                { cat: "Pagamentos", integ: "Stripe, Mercado Pago, PIX (Banco Central)" },
                { cat: "Geoespacial", integ: "Google Maps, Mapbox, INPE (satélite), Sentinel Hub" },
                { cat: "Clima", integ: "INMET, Open-Meteo, Climatempo API" },
                { cat: "IoT", integ: "MQTT Broker, AWS IoT Core, Zigbee, LoRaWAN" },
                { cat: "Identidade", integ: "Google OAuth, Apple Sign-In, Meta OAuth" },
                { cat: "Armazenamento", integ: "AWS S3, MinIO, Cloudflare R2" },
              ].map((r) => (
                <View key={r.cat} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#1B5E2020" }}>
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold w-28">{r.cat}</Text>
                  <Text className="text-xs text-muted flex-1">{r.integ}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { nome: "OpenAI GPT-4o Vision", cor: "#1565C0", uso: "Diagnóstico fitossanitário por foto", detalhes: ["Modelo: gpt-4o-2024-11-20", "Input: imagem base64 + contexto agronômico", "Output: JSON estruturado com diagnóstico", "Custo: ~$0,01 por diagnóstico", "Cache: resultados similares cacheados 24h"] },
              { nome: "Anthropic Claude 3", cor: "#7B1FA2", uso: "Análise agronômica textual e relatórios", detalhes: ["Modelo: claude-3-5-sonnet", "Uso: geração de laudos e relatórios", "Fallback quando GPT-4o indisponível"] },
              { nome: "Google Gemini Pro", cor: "#C62828", uso: "Processamento de documentos e PDFs", detalhes: ["Modelo: gemini-1.5-pro", "Uso: análise de laudos de solo em PDF", "Extração de dados estruturados"] },
            ].map((api) => (
              <View key={api.nome} style={{ backgroundColor: api.cor + "12", borderWidth: 1, borderColor: api.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: api.cor }} className="text-sm font-bold mb-1">{api.nome}</Text>
                <Text className="text-xs text-muted mb-2">Uso: {api.uso}</Text>
                {api.detalhes.map((d) => (
                  <Text key={d} className="text-xs text-muted">• {d}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">📡 Protocolos IoT</Text>
              {[
                { p: "MQTT", uso: "Sensores de solo e clima (leve, baixo consumo)" },
                { p: "HTTP/REST", uso: "Dispositivos com conectividade estável" },
                { p: "LoRaWAN", uso: "Sensores em áreas remotas sem WiFi" },
                { p: "Zigbee", uso: "Redes locais de sensores em estufas" },
                { p: "4G/LTE", uso: "Estações meteorológicas autônomas" },
              ].map((r) => (
                <View key={r.p} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ backgroundColor: "#1B5E2020", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 10 }}>
                    <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{r.p}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{r.uso}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-2">🌡️ Sensores Suportados</Text>
              {["Umidade do solo (capacitivo)", "Temperatura do ar e solo", "pH do solo", "Condutividade elétrica (CE)", "Pluviômetro", "Anemômetro (velocidade do vento)", "Sensor de luminosidade"].map((s) => (
                <Text key={s} className="text-xs text-muted">• {s}</Text>
              ))}
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            {[
              { nome: "Stripe", cor: "#1565C0", uso: "Pagamentos internacionais e assinaturas SaaS", features: ["Assinaturas recorrentes (SaaS)", "Webhooks para eventos de pagamento", "Suporte a cartão, boleto e PIX", "Dashboard de receita e churn"] },
              { nome: "Mercado Pago", cor: "#00B1EA", uso: "Pagamentos no marketplace (Brasil)", features: ["PIX instantâneo", "Boleto bancário", "Cartão de crédito/débito", "Split de pagamento (marketplace)"] },
              { nome: "PIX (Banco Central)", cor: "#1B5E20", uso: "Transferências instantâneas", features: ["QR Code estático e dinâmico", "Chave PIX por CNPJ/CPF", "Webhook de confirmação", "Sem taxa para pessoa física"] },
            ].map((p) => (
              <View key={p.nome} style={{ backgroundColor: p.cor + "12", borderWidth: 1, borderColor: p.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: p.cor }} className="text-sm font-bold mb-1">{p.nome}</Text>
                <Text className="text-xs text-muted mb-2">{p.uso}</Text>
                {p.features.map((f) => (
                  <Text key={f} className="text-xs text-muted">• {f}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            {[
              { cat: "Dados Climáticos", cor: "#1565C0", parceiros: [
                { n: "INMET", d: "Dados meteorológicos oficiais do Brasil" },
                { n: "Open-Meteo", d: "Previsão do tempo global gratuita" },
                { n: "Climatempo", d: "Previsão agrícola especializada" },
              ]},
              { cat: "Geoespacial e Satélite", cor: "#7B1FA2", parceiros: [
                { n: "INPE", d: "Imagens de satélite e queimadas" },
                { n: "Sentinel Hub", d: "Sentinel-2 NDVI e análise espectral" },
                { n: "Google Maps Platform", d: "Mapas, geocodificação e rotas" },
              ]},
              { cat: "Dados Agronômicos", cor: "#1B5E20", parceiros: [
                { n: "EMBRAPA", d: "Banco de dados de cultivares e pesquisas" },
                { n: "MAPA", d: "Registros de agroquímicos e sementes" },
                { n: "IBGE", d: "Dados censitários e produção agrícola" },
              ]},
            ].map((g) => (
              <View key={g.cat} style={{ backgroundColor: g.cor + "12", borderWidth: 1, borderColor: g.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: g.cor }} className="text-sm font-bold mb-3">{g.cat}</Text>
                {g.parceiros.map((p) => (
                  <View key={p.n} style={{ borderBottomWidth: 1, borderBottomColor: g.cor + "20" }} className="py-2">
                    <Text style={{ color: g.cor }} className="text-xs font-bold">{p.n}</Text>
                    <Text className="text-xs text-muted">{p.d}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/integracoes-tecnicas"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
