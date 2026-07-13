import React, { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { AfuStackBanner } from "@/components/afu-stack-banner";
import { RelatedLinks } from "@/components/related-links";
import { RELATED_LINKS_MAP } from "@/constants/related-links-map";

const TABS = ["Cloud", "Docker", "Ambientes", "Monitoramento", "SLA"];

export default function InfraestruturaScreen() {
  const colors = useColors();
  const [tab, setTab] = useState(0);

  return (
    <ScreenContainer>
      <View style={{ backgroundColor: "#37474F" }} className="px-4 pt-4 pb-3">
        <View className="flex-row items-center gap-3 mb-2">
          <View style={{ backgroundColor: "#455A64" }} className="w-10 h-10 rounded-xl items-center justify-center">
            <Text className="text-white text-xl">☁️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-white text-base font-bold">Infraestrutura Técnica</Text>
            <Text style={{ color: "#B0BEC5" }} className="text-xs">Etapa 11 · Arquitetura Técnica</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-2 pt-1">
            {TABS.map((t, i) => (
              <TouchableOpacity key={t} onPress={() => setTab(i)}
                style={{ backgroundColor: tab === i ? "#fff" : "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                <Text style={{ color: tab === i ? "#37474F" : "#fff" }} className="text-xs font-bold">{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView className="flex-1 px-4 pt-4">
        <AfuStackBanner note="Infraestrutura abaixo cita AWS/Kubernetes. O MVP staging usa Railway (API) e Vercel (web)." />
        {tab === 0 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#37474F15", borderWidth: 1, borderColor: "#37474F30" }} className="rounded-xl p-4">
              <Text style={{ color: "#37474F" }} className="text-sm font-bold mb-3">☁️ Estratégia Cloud</Text>
              {[
                { k: "Provedor Principal", v: "AWS (São Paulo — sa-east-1)" },
                { k: "Provedor Secundário", v: "GCP (multi-cloud para IA)" },
                { k: "CDN", v: "CloudFront (AWS) + Cloudflare" },
                { k: "DNS", v: "Route 53 (AWS)" },
                { k: "Certificados SSL", v: "AWS Certificate Manager" },
                { k: "Secrets Management", v: "AWS Secrets Manager" },
                { k: "Container Registry", v: "AWS ECR" },
                { k: "Object Storage", v: "AWS S3 + MinIO (self-hosted)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#37474F20" }}>
                  <Text className="text-xs text-muted w-36">{r.k}</Text>
                  <Text style={{ color: "#37474F" }} className="text-xs font-bold flex-1">{r.v}</Text>
                </View>
              ))}
            </View>
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#37474F" }} className="text-sm font-bold mb-2">🏗️ Serviços AWS Utilizados</Text>
              {[
                { s: "EC2 / ECS", d: "Containers da aplicação" },
                { s: "RDS (PostgreSQL)", d: "Banco de dados gerenciado" },
                { s: "ElastiCache (Redis)", d: "Cache e sessões" },
                { s: "S3", d: "Arquivos, imagens, backups" },
                { s: "SQS / SNS", d: "Filas e notificações" },
                { s: "CloudWatch", d: "Logs e métricas" },
                { s: "WAF", d: "Proteção de aplicação web" },
              ].map((r) => (
                <View key={r.s} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
                  <Text style={{ color: "#37474F" }} className="text-xs font-bold w-32">{r.s}</Text>
                  <Text className="text-xs text-muted flex-1">{r.d}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 1 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#37474F" }} className="text-sm font-bold mb-3">🐳 Docker Compose — Serviços</Text>
              {[
                { s: "afu-api", img: "afu/api:latest", port: "3000", desc: "Backend NestJS" },
                { s: "afu-postgres", img: "postgres:16", port: "5432", desc: "Banco de dados" },
                { s: "afu-redis", img: "redis:7-alpine", port: "6379", desc: "Cache e sessões" },
                { s: "afu-minio", img: "minio/minio", port: "9000", desc: "Object storage" },
                { s: "afu-nginx", img: "nginx:alpine", port: "80/443", desc: "Reverse proxy" },
                { s: "afu-worker", img: "afu/worker:latest", port: "-", desc: "BullMQ workers" },
                { s: "afu-timescale", img: "timescale/timescaledb", port: "5433", desc: "IoT time series" },
                { s: "afu-pgbouncer", img: "pgbouncer/pgbouncer", port: "6432", desc: "Connection pool" },
              ].map((r) => (
                <View key={r.s} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-2">
                  <View className="flex-row items-center gap-2">
                    <Text style={{ color: "#37474F", fontFamily: "monospace" }} className="text-xs font-bold w-28">{r.s}</Text>
                    <Text style={{ color: "#1565C0" }} className="text-xs w-12">{r.port}</Text>
                    <Text className="text-xs text-muted flex-1">{r.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 2 && (
          <View className="gap-4">
            {[
              { env: "DEV", cor: "#1565C0", desc: "Ambiente local do desenvolvedor", items: ["Docker Compose local", "Banco de dados local", "Hot reload ativo", "Logs verbosos", "Sem rate limiting"] },
              { env: "STAGING", cor: "#E65100", desc: "Ambiente de homologação (pré-produção)", items: ["AWS ECS (t3.medium)", "RDS PostgreSQL (db.t3.micro)", "Dados anonimizados", "CI/CD automático", "Testes de integração"] },
              { env: "PROD", cor: "#1B5E20", desc: "Ambiente de produção", items: ["AWS ECS (c5.xlarge)", "RDS PostgreSQL (db.r5.large)", "Multi-AZ (alta disponibilidade)", "Auto Scaling ativo", "SLA 99,9%"] },
            ].map((e) => (
              <View key={e.env} style={{ backgroundColor: e.cor + "12", borderWidth: 1, borderColor: e.cor + "30" }} className="rounded-xl p-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <View style={{ backgroundColor: e.cor, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 }}>
                    <Text className="text-white text-xs font-bold">{e.env}</Text>
                  </View>
                  <Text className="text-xs text-muted flex-1">{e.desc}</Text>
                </View>
                {e.items.map((item) => (
                  <Text key={item} className="text-xs text-muted">• {item}</Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {tab === 3 && (
          <View className="gap-4">
            <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }} className="rounded-xl p-4">
              <Text style={{ color: "#37474F" }} className="text-sm font-bold mb-3">📊 Stack de Observabilidade</Text>
              {[
                { t: "Métricas", tool: "Prometheus + Grafana", desc: "CPU, memória, latência de API, filas" },
                { t: "Logs", tool: "CloudWatch + Loki", desc: "Logs estruturados JSON, retenção 90 dias" },
                { t: "Tracing", tool: "OpenTelemetry + Jaeger", desc: "Rastreamento distribuído de requests" },
                { t: "Alertas", tool: "PagerDuty + Slack", desc: "Alertas críticos 24/7 para on-call" },
                { t: "Uptime", tool: "Pingdom + StatusPage", desc: "Monitoramento externo + página de status" },
                { t: "APM", tool: "Datadog (AFU 2.0+)", desc: "Application Performance Monitoring" },
              ].map((r) => (
                <View key={r.t} style={{ borderBottomWidth: 1, borderBottomColor: colors.border }} className="py-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text style={{ color: "#37474F" }} className="text-xs font-bold w-20">{r.t}</Text>
                    <Text style={{ color: "#1565C0" }} className="text-xs font-bold flex-1">{r.tool}</Text>
                  </View>
                  <Text className="text-xs text-muted">{r.desc}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 4 && (
          <View className="gap-4">
            <View style={{ backgroundColor: "#1B5E2015", borderWidth: 1, borderColor: "#1B5E2030" }} className="rounded-xl p-4">
              <Text style={{ color: "#1B5E20" }} className="text-sm font-bold mb-3">✅ SLA — Acordo de Nível de Serviço</Text>
              {[
                { k: "Disponibilidade", v: "99,9% (≤ 8,7h downtime/ano)" },
                { k: "Latência API (p95)", v: "< 200ms" },
                { k: "Diagnóstico IA", v: "< 10 segundos" },
                { k: "RTO (Recovery Time)", v: "< 1 hora" },
                { k: "RPO (Recovery Point)", v: "< 15 minutos" },
                { k: "Backup", v: "Diário automático + retenção 30 dias" },
                { k: "Janela de Manutenção", v: "Domingos 02h–04h (horário de Brasília)" },
              ].map((r) => (
                <View key={r.k} className="flex-row py-2" style={{ borderBottomWidth: 1, borderBottomColor: "#1B5E2020" }}>
                  <Text className="text-xs text-muted flex-1">{r.k}</Text>
                  <Text style={{ color: "#1B5E20" }} className="text-xs font-bold">{r.v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <RelatedLinks links={RELATED_LINKS_MAP["/mais/infraestrutura-tecnica"]} />
      </ScrollView>
    </ScreenContainer>
  );
}
