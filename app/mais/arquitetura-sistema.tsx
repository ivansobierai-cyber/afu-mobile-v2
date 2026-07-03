import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Visão Geral", "Camadas", "Componentes", "Fluxos", "Decisões"];

export default function ArquiteturaSistemaScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#1A237E" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#283593" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🏗️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Arquitetura de Sistema</Text>
            <Text style={{ color: "#9FA8DA" }} className="text-xs">Etapa 7 · Arquitetura Técnica</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#1A237E" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1A237E15", borderWidth: 1, borderColor: "#1A237E30" }} className="rounded-xl p-4">
              <Text style={{ color: "#1A237E" }} className="text-sm font-bold mb-3">🏛️ Arquitetura Geral do AFU</Text>
              <Text className="text-sm text-foreground leading-relaxed mb-3">
                O AFU adota uma arquitetura <Text className="font-bold">microserviços orientada a eventos</Text>, com frontend mobile-first, backend NestJS modular, banco PostgreSQL e camada de IA multimodal.
              </Text>
              {[
                { camada: "Frontend", techs: "React Native (Expo) · Next.js 15 · React Admin" },
                { camada: "Backend", techs: "NestJS · TypeScript · REST + WebSocket" },
                { camada: "Banco de Dados", techs: "PostgreSQL 16 · Redis · MinIO (S3)" },
                { camada: "IA / ML", techs: "GPT-4o Vision · Claude 3 · Gemini Pro" },
                { camada: "Infraestrutura", techs: "Docker · Kubernetes · AWS / GCP" },
                { camada: "Mensageria", techs: "BullMQ · Redis Streams · Socket.IO" },
              ].map((r) => (
                <View key={r.camada} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#1A237E20" }}>
                  <Text style={{ color: "#1A237E" }} className="text-xs font-bold w-28">{r.camada}</Text>
                  <Text className="text-xs text-muted flex-1">{r.techs}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1A237E" }} className="text-sm font-bold mb-2">📐 Padrões Arquiteturais</Text>
              {["Clean Architecture (backend)", "Repository Pattern (dados)", "CQRS (leitura/escrita separados)", "Event-Driven Architecture (IoT)", "BFF — Backend for Frontend (mobile)", "API Gateway (roteamento)"].map((p) => (
                <Text key={p} className="text-xs text-muted">• {p}</Text>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { n: "1", t: "Camada de Apresentação", cor: "#1565C0", items: ["App Mobile — React Native (Expo SDK 54)", "Portal Web do Produtor — Next.js 15", "Painel Administrativo — React + Vite", "WhatsApp Bot — Meta Business API"] },
              { n: "2", t: "Camada de API Gateway", cor: "#7B1FA2", items: ["Nginx como reverse proxy", "Rate limiting e throttling", "JWT validation middleware", "CORS e segurança de headers"] },
              { n: "3", t: "Camada de Negócio (NestJS)", cor: "#1B5E20", items: ["Módulos: Auth, Produtores, Cultivos", "Módulos: Diagnóstico, Banco Agronômico", "Módulos: IoT, Geointeligência, Marketplace", "Módulos: Laboratório, Economia, NOC"] },
              { n: "4", t: "Camada de Dados", cor: "#C62828", items: ["PostgreSQL 16 — dados relacionais", "Redis — cache e sessões", "MinIO — arquivos e imagens", "TimescaleDB — séries temporais IoT"] },
              { n: "5", t: "Camada de IA", cor: "#E65100", items: ["GPT-4o Vision — diagnóstico por foto", "Claude 3 — análise agronômica", "Gemini Pro — processamento de texto", "Fine-tuning proprietário (AFU 2.0+)"] },
            ].map((c) => (
              <View key={c.n} style={{ backgroundColor: c.cor + "12", borderWidth: 1, borderColor: c.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View style={{ backgroundColor: c.cor, width: 24, height: 24, borderRadius: 12 }} className="items-center justify-center">
                    <Text className="text-white text-xs font-bold">{c.n}</Text>
                  </View>
                  <Text style={{ color: c.cor }} className="text-sm font-bold flex-1">{c.t}</Text>
                </View>
                {c.items.map((item) => (
                  <Text key={item} className="text-xs text-muted">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#1A237E" }} className="text-sm font-bold mb-3">🧩 Componentes Principais</Text>
              {[
                { comp: "AFU Core API", resp: "CRUD de produtores, propriedades, cultivos e diagnósticos" },
                { comp: "AFU IA Engine", resp: "Orquestração de chamadas à IA, cache de resultados, fine-tuning" },
                { comp: "AFU Agro Bank", resp: "Banco de dados agronômico: culturas, clima, solo, pragas" },
                { comp: "AFU IoT Hub", resp: "Recepção e processamento de dados de sensores em tempo real" },
                { comp: "AFU GEO Service", resp: "Integração com satélites, drones e mapas de NDVI" },
                { comp: "AFU Lab", resp: "Gestão de amostras, análises e laudos digitais" },
                { comp: "AFU Market", resp: "Marketplace de insumos, rastreabilidade e pagamentos" },
                { comp: "AFU NOC", resp: "Centro de comando: monitoramento, alertas e dashboards" },
              ].map((r) => (
                <View key={r.comp} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-2">
                  <Text style={{ color: "#1A237E" }} className="text-xs font-bold">{r.comp}</Text>
                  <Text className="text-xs text-muted mt-1">{r.resp}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            {[
              { t: "Diagnóstico por Foto", cor: "#1B5E20", steps: ["App captura foto", "Upload para MinIO (S3)", "AFU IA Engine recebe URL", "GPT-4o Vision analisa imagem", "Resultado retornado em JSON", "App exibe diagnóstico + recomendação"] },
              { t: "Alerta IoT Automático", cor: "#C62828", steps: ["Sensor envia leitura via MQTT", "AFU IoT Hub processa evento", "Regra de alerta disparada", "BullMQ enfileira notificação", "Push notification enviada", "NOC registra evento no log"] },
            ].map((f) => (
              <View key={f.t} style={{ backgroundColor: f.cor + "12", borderWidth: 1, borderColor: f.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: f.cor }} className="text-sm font-bold mb-3">{f.t}</Text>
                {f.steps.map((s, i) => (
                  <View key={s} className="flex-row items-center gap-2 mb-2">
                    <View style={{ backgroundColor: f.cor, width: 20, height: 20, borderRadius: 10 }} className="items-center justify-center">
                      <Text className="text-white text-xs">{i + 1}</Text>
                    </View>
                    <Text className="text-xs text-muted flex-1">{s}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            {[
              { d: "NestJS vs Express", escolha: "NestJS", motivo: "Arquitetura modular, DI nativo, decorators, melhor para times grandes e projetos complexos." },
              { d: "PostgreSQL vs MongoDB", escolha: "PostgreSQL", motivo: "Dados agronômicos têm relações complexas. ACID garantido. Suporte a JSON (JSONB) para flexibilidade." },
              { d: "Expo vs React Native CLI", escolha: "Expo SDK 54", motivo: "EAS Build, OTA updates, acesso nativo simplificado, comunidade ativa, menor custo de manutenção." },
              { d: "REST vs GraphQL", escolha: "REST + WebSocket", motivo: "REST para CRUD padrão, WebSocket para IoT em tempo real. GraphQL adicionado no AFU 3.0." },
              { d: "AWS vs GCP vs Azure", escolha: "AWS (primário)", motivo: "Maior presença no Brasil, melhor latência, S3 compatível com MinIO para migração futura." },
            ].map((d) => (
              <View key={d.d} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <Text style={{ color: "#1A237E" }} className="text-xs font-bold mb-1">⚖️ {d.d}</Text>
                <View style={{ backgroundColor: "#1B5E2020", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 6 }}>
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">✅ {d.escolha}</Text>
                </View>
                <Text className="text-xs text-muted leading-relaxed">{d.motivo}</Text>
              </View>
            ))}
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/arquitetura-sistema"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
