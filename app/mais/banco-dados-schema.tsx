import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Estrutura", "Tabelas Core", "Agronômico", "Relações", "Performance"];

export default function BancoDadosSchemaScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#004D40" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#00695C" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">🗄️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Banco de Dados e Schema</Text>
            <Text style={{ color: "#80CBC4" }} className="text-xs">Etapa 8 · Arquitetura Técnica</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#004D40" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#004D4015", borderWidth: 1, borderColor: "#004D4030" }} className="rounded-xl p-4">
              <Text style={{ color: "#004D40" }} className="text-sm font-bold mb-3">🗄️ Estrutura do Banco de Dados</Text>
              {[
                { k: "SGBD Principal", v: "PostgreSQL 16" },
                { k: "ORM", v: "Drizzle ORM (TypeScript)" },
                { k: "Cache", v: "Redis 7.x" },
                { k: "Arquivos", v: "MinIO (S3-compatible)" },
                { k: "Séries Temporais", v: "TimescaleDB (extensão PG)" },
                { k: "Busca Full-Text", v: "PostgreSQL FTS + pg_trgm" },
                { k: "Geoespacial", v: "PostGIS (extensão PG)" },
                { k: "Migrações", v: "Drizzle Kit" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#004D4020" }}>
                  <Text className="text-xs text-muted w-36">{r.k}</Text>
                  <Text style={{ color: "#004D40" }} className="text-xs font-bold flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#004D40" }} className="text-sm font-bold mb-2">📊 Schemas (Namespaces)</Text>
              {[
                { s: "public", desc: "Dados core: usuários, propriedades, cultivos" },
                { s: "agro", desc: "Banco agronômico: culturas, pragas, doenças" },
                { s: "iot", desc: "Dispositivos, leituras e alertas IoT" },
                { s: "geo", desc: "Talhões, imagens de satélite, NDVI" },
                { s: "lab", desc: "Amostras, análises e laudos" },
                { s: "market", desc: "Produtos, pedidos e transações" },
              ].map((r) => (
                <View key={r.s} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <View style={{ backgroundColor: "#004D4020", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginRight: 10 }}>
                    <Text style={{ color: "#004D40" }} className="text-xs font-bold">{r.s}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{r.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            {[
              { tabela: "users", campos: ["id UUID PK", "email VARCHAR UNIQUE", "password_hash VARCHAR", "role ENUM(produtor,tecnico,admin)", "created_at TIMESTAMPTZ"] },
              { tabela: "propriedades", campos: ["id UUID PK", "user_id UUID FK→users", "nome VARCHAR", "area_ha DECIMAL", "municipio VARCHAR", "estado CHAR(2)", "geom GEOMETRY(Polygon)"] },
              { tabela: "cultivos", campos: ["id UUID PK", "propriedade_id UUID FK", "cultura_id UUID FK", "data_plantio DATE", "area_ha DECIMAL", "status ENUM(ativo,colhido,perdido)"] },
              { tabela: "diagnosticos", campos: ["id UUID PK", "cultivo_id UUID FK", "foto_url VARCHAR", "resultado JSONB", "confianca DECIMAL", "ia_modelo VARCHAR", "created_at TIMESTAMPTZ"] },
            ].map((t) => (
              <View key={t.tabela} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <View style={{ backgroundColor: "#004D40", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 8 }}>
                  <Text className="text-white text-xs font-bold">{t.tabela}</Text>
                </View>
                {t.campos.map((c) => (
                  <Text key={c} style={{ fontFamily: "monospace" }} className="text-xs text-muted">  {c}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            {[
              { tabela: "agro.culturas", campos: ["id UUID PK", "nome VARCHAR", "nome_cientifico VARCHAR", "familia VARCHAR", "ciclo_dias INT", "dados JSONB"] },
              { tabela: "agro.pragas", campos: ["id UUID PK", "nome_comum VARCHAR", "nome_cientifico VARCHAR", "tipo ENUM(inseto,fungo,bacteria,virus,nematoide)", "culturas_afetadas UUID[]", "controles JSONB"] },
              { tabela: "agro.clima_culturas", campos: ["id UUID PK", "cultura_id UUID FK", "temp_min DECIMAL", "temp_ideal DECIMAL", "temp_max DECIMAL", "chuva_min_mm INT", "chuva_max_mm INT"] },
              { tabela: "agro.seed_tecnico", campos: ["id UUID PK", "cultura_id UUID FK", "geracao ENUM(G1,G2,G3,G4,G5)", "pureza_pct DECIMAL", "origem VARCHAR", "dados JSONB"] },
            ].map((t) => (
              <View key={t.tabela} style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
                <View style={{ backgroundColor: "#1B5E20", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginBottom: 8 }}>
                  <Text className="text-white text-xs font-bold">{t.tabela}</Text>
                </View>
                {t.campos.map((c) => (
                  <Text key={c} style={{ fontFamily: "monospace" }} className="text-xs text-muted">  {c}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#004D40" }} className="text-sm font-bold mb-3">🔗 Diagrama de Relações (resumido)</Text>
              {[
                { de: "users", para: "propriedades", tipo: "1:N", desc: "Um usuário tem várias propriedades" },
                { de: "propriedades", para: "cultivos", tipo: "1:N", desc: "Uma propriedade tem vários cultivos" },
                { de: "cultivos", para: "diagnosticos", tipo: "1:N", desc: "Um cultivo tem vários diagnósticos" },
                { de: "cultivos", para: "agro.culturas", tipo: "N:1", desc: "Vários cultivos referenciam uma cultura" },
                { de: "propriedades", para: "geo.talhoes", tipo: "1:N", desc: "Uma propriedade tem vários talhões" },
                { de: "geo.talhoes", para: "iot.dispositivos", tipo: "1:N", desc: "Um talhão tem vários sensores IoT" },
                { de: "iot.dispositivos", para: "iot.leituras", tipo: "1:N", desc: "Um dispositivo gera muitas leituras" },
              ].map((r) => (
                <View key={r.de + r.para} className="flex-row items-center py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: "#004D40" }} className="text-xs font-bold w-24">{r.de}</Text>
                  <View style={{ backgroundColor: "#004D4020", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginHorizontal: 6 }}>
                    <Text style={{ color: "#004D40" }} className="text-xs">{r.tipo}</Text>
                  </View>
                  <Text style={{ color: "#004D40" }} className="text-xs font-bold w-24">{r.para}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#004D40" }} className="text-sm font-bold mb-3">⚡ Estratégias de Performance</Text>
              {[
                { t: "Índices", items: ["B-tree em FKs e campos de busca frequente", "GiST para geometrias PostGIS", "GIN para JSONB e full-text search", "Índice parcial para registros ativos"] },
                { t: "Cache Redis", items: ["Cache de banco agronômico (TTL 24h)", "Sessões de usuário (TTL 7 dias)", "Resultados de IA recentes (TTL 1h)", "Rate limiting por usuário"] },
                { t: "Particionamento", items: ["iot.leituras particionada por mês", "diagnosticos particionado por ano", "Retenção automática de dados antigos"] },
                { t: "Connection Pool", items: ["PgBouncer para pool de conexões", "Max 100 conexões por instância", "Pool size = 2 × CPU cores"] },
              ].map((g) => (
                <View key={g.t} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <Text style={{ color: "#004D40" }} className="text-xs font-bold mb-2">{g.t}</Text>
                  {g.items.map((item) => (
                    <Text key={item} className="text-xs text-muted">• {item}</Text>
                  ))}
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/banco-dados-schema"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
