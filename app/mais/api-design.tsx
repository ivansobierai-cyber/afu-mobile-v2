import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Visão Geral", "Endpoints", "Autenticação", "WebSocket", "Padrões"];

export default function ApiDesignScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#311B92" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#4527A0" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🔌</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">API Design</Text>
            <Text style={{ color: "#B39DDB" }} className="text-xs">Etapa 9 · Arquitetura Técnica</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#311B92" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#311B9215", borderWidth: 1, borderColor: "#311B9230" }} className="rounded-xl p-4">
              <Text style={{ color: "#311B92" }} className="text-sm font-bold mb-3">🔌 Visão Geral da API AFU</Text>
              {[
                { k: "Estilo", v: "RESTful + WebSocket (IoT)" },
                { k: "Protocolo", v: "HTTPS (TLS 1.3)" },
                { k: "Formato", v: "JSON (application/json)" },
                { k: "Versionamento", v: "/api/v1/ → /api/v2/" },
                { k: "Documentação", v: "OpenAPI 3.1 + Swagger UI" },
                { k: "Base URL (prod)", v: "https://api.afu.agro.br/v1" },
                { k: "Rate Limit", v: "100 req/min (free) · 1000 req/min (pro)" },
                { k: "Autenticação", v: "JWT Bearer + API Key (B2B)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#311B9220" }}>
                  <Text className="text-xs text-muted w-32">{r.k}</Text>
                  <Text style={{ color: "#311B92" }} className="text-xs font-bold flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { modulo: "Auth", cor: "#1B5E20", endpoints: [
                { method: "POST", path: "/auth/login", desc: "Login com e-mail e senha" },
                { method: "POST", path: "/auth/refresh", desc: "Renovar access token" },
                { method: "POST", path: "/auth/logout", desc: "Invalidar sessão" },
              ]},
              { modulo: "Produtores", cor: "#1565C0", endpoints: [
                { method: "GET", path: "/produtores/:id", desc: "Dados do produtor" },
                { method: "PUT", path: "/produtores/:id", desc: "Atualizar perfil" },
                { method: "GET", path: "/produtores/:id/propriedades", desc: "Listar propriedades" },
              ]},
              { modulo: "Diagnóstico", cor: "#C62828", endpoints: [
                { method: "POST", path: "/diagnosticos", desc: "Criar diagnóstico (upload foto)" },
                { method: "GET", path: "/diagnosticos/:id", desc: "Resultado do diagnóstico" },
                { method: "GET", path: "/diagnosticos/historico", desc: "Histórico paginado" },
              ]},
              { modulo: "Banco Agronômico", cor: "#7B1FA2", endpoints: [
                { method: "GET", path: "/culturas", desc: "Listar culturas disponíveis" },
                { method: "GET", path: "/culturas/:id/pragas", desc: "Pragas por cultura" },
                { method: "GET", path: "/culturas/:id/clima", desc: "Dados climáticos da cultura" },
              ]},
              { modulo: "IoT", cor: "#E65100", endpoints: [
                { method: "POST", path: "/iot/leituras", desc: "Receber leitura de sensor" },
                { method: "GET", path: "/iot/dispositivos/:id/leituras", desc: "Histórico de leituras" },
                { method: "GET", path: "/iot/alertas/ativos", desc: "Alertas ativos" },
              ]},
            ].map((m) => (
              <View key={m.modulo} style={{ backgroundColor: m.cor + "10", borderWidth: 1, borderColor: m.cor + "30" }} className="rounded-xl p-4">
                <Text style={{ color: m.cor }} className="text-sm font-bold mb-3">{m.modulo}</Text>
                {m.endpoints.map((e) => (
                  <View key={e.path} className="flex-row items-center gap-2 mb-2">
                    <View style={{ backgroundColor: e.method === "GET" ? "#1565C020" : e.method === "POST" ? "#1B5E2020" : "#E6510020", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, width: 44 }}>
                      <Text style={{ color: e.method === "GET" ? "#1565C0" : e.method === "POST" ? "#1B5E20" : "#E65100" }} className="text-xs font-bold text-center">{e.method}</Text>
                    </View>
                    <Text style={{ fontFamily: "monospace", color: m.cor }} className="text-xs flex-1">{e.path}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#311B92" }} className="text-sm font-bold mb-3">🔐 Fluxo de Autenticação JWT</Text>
              {[
                { n: "1", t: "Login", d: "POST /auth/login com {email, password} → retorna {accessToken, refreshToken}" },
                { n: "2", t: "Uso", d: "Header: Authorization: Bearer <accessToken> em todas as requisições autenticadas" },
                { n: "3", t: "Expiração", d: "accessToken: 15 minutos · refreshToken: 7 dias" },
                { n: "4", t: "Renovação", d: "POST /auth/refresh com {refreshToken} → novo accessToken" },
                { n: "5", t: "Logout", d: "POST /auth/logout invalida o refreshToken no Redis" },
              ].map((s) => (
                <View key={s.n} className="flex-row gap-3 mb-3">
                  <View style={{ backgroundColor: "#311B92", width: 22, height: 22, borderRadius: 11 }} className="items-center justify-center flex-shrink-0">
                    <Text className="text-white text-xs font-bold">{s.n}</Text>
                  </View>
                  <View className="flex-1">
                    <Text style={{ color: "#311B92" }} className="text-xs font-bold">{s.t}</Text>
                    <Text className="text-xs text-muted mt-1">{s.d}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#311B92" }} className="text-sm font-bold mb-2">🔑 API Key (B2B)</Text>
              <Text className="text-xs text-muted leading-relaxed">Para integrações B2B (cooperativas, revendas), o AFU oferece API Keys com escopos definidos. Header: <Text style={{ fontFamily: "monospace", color: "#311B92" }}>X-AFU-API-Key: afu_live_xxx</Text></Text>
            </View>
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#311B9215", borderWidth: 1, borderColor: "#311B9230" }} className="rounded-xl p-4">
              <Text style={{ color: "#311B92" }} className="text-sm font-bold mb-3">⚡ WebSocket — IoT em Tempo Real</Text>
              <Text className="text-xs text-muted mb-3">URL: wss://api.afu.agro.br/v1/iot/ws</Text>
              {[
                { evento: "iot:leitura", dir: "Server→Client", desc: "Nova leitura de sensor (temperatura, umidade, pH)" },
                { evento: "iot:alerta", dir: "Server→Client", desc: "Alerta disparado por regra de negócio" },
                { evento: "iot:subscribe", dir: "Client→Server", desc: "Subscrever a um dispositivo específico" },
                { evento: "diagnostico:resultado", dir: "Server→Client", desc: "Resultado de diagnóstico IA pronto" },
                { evento: "noc:evento", dir: "Server→Client", desc: "Evento do NOC (alerta crítico, sistema)" },
              ].map((e) => (
                <View key={e.evento} style={{ borderBottomWidth: 1, borderBottomColor: "#311B9220" }} className="py-2">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text style={{ fontFamily: "monospace", color: "#311B92" }} className="text-xs font-bold">{e.evento}</Text>
                    <View style={{ backgroundColor: e.dir.startsWith("Server") ? "#1B5E2020" : "#1565C020", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: e.dir.startsWith("Server") ? "#1B5E20" : "#1565C0" }} className="text-xs">{e.dir}</Text>
                    </View>
                  </View>
                  <Text className="text-xs text-muted">{e.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#311B92" }} className="text-sm font-bold mb-3">📐 Padrões de Resposta</Text>
              <Text style={{ fontFamily: "monospace", color: "#1B5E20" }} className="text-xs mb-3">{"// Sucesso\n{\n  \"success\": true,\n  \"data\": { ... },\n  \"meta\": { \"page\": 1, \"total\": 100 }\n}"}</Text>
              <Text style={{ fontFamily: "monospace", color: "#C62828" }} className="text-xs">{"// Erro\n{\n  \"success\": false,\n  \"error\": {\n    \"code\": \"VALIDATION_ERROR\",\n    \"message\": \"Campo obrigatório\",\n    \"details\": [ ... ]\n  }\n}"}</Text>
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#311B92" }} className="text-sm font-bold mb-2">📋 Códigos HTTP Utilizados</Text>
              {[
                { code: "200", desc: "OK — Sucesso com dados" },
                { code: "201", desc: "Created — Recurso criado" },
                { code: "400", desc: "Bad Request — Dados inválidos" },
                { code: "401", desc: "Unauthorized — Token inválido" },
                { code: "403", desc: "Forbidden — Sem permissão" },
                { code: "404", desc: "Not Found — Recurso não existe" },
                { code: "429", desc: "Too Many Requests — Rate limit" },
                { code: "500", desc: "Internal Server Error" },
              ].map((r) => (
                <View key={r.code} className="flex-row py-1">
                  <Text style={{ color: parseInt(r.code) < 300 ? "#1B5E20" : parseInt(r.code) < 500 ? "#E65100" : "#C62828", fontFamily: "monospace" }} className="text-xs font-bold w-12">{r.code}</Text>
                  <Text className="text-xs text-muted flex-1">{r.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/api-design"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
