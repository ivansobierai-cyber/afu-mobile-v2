/**
 * Env lido sob demanda — evita capturar JWT_SECRET vazio no import
 * (testes definem process.env em beforeAll / vitest.setup).
 */

/**
 * Normaliza a base Forge/OpenAI-compatível:
 * - acrescenta https:// se faltar esquema;
 * - remove /v1 ou /v1/chat/completions acidentais (o cliente LLM acrescenta o path);
 * - preserva `/compatible-mode` (Alibaba MaaS / Model Studio).
 */
export function normalizeForgeApiUrl(raw: string | undefined | null): string {
  let u = (raw ?? "").trim();
  if (!u) return "";
  if (!/^https?:\/\//i.test(u)) {
    u = `https://${u}`;
  }
  u = u.replace(/\/+$/, "");
  u = u.replace(/\/compatible-mode\/v1\/chat\/completions$/i, "/compatible-mode");
  u = u.replace(/\/v1\/chat\/completions$/i, "");
  u = u.replace(/\/compatible-mode\/v1$/i, "/compatible-mode");
  u = u.replace(/\/v1$/i, "");
  return u.replace(/\/+$/, "");
}

export const ENV = {
  get appId() {
    return process.env.VITE_APP_ID ?? "";
  },
  get cookieSecret() {
    return process.env.JWT_SECRET ?? "";
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? "";
  },
  get oAuthServerUrl() {
    return process.env.OAUTH_SERVER_URL ?? "";
  },
  get ownerOpenId() {
    return process.env.OWNER_OPEN_ID ?? "";
  },
  get isProduction() {
    return process.env.NODE_ENV === "production";
  },
  get forgeApiUrl() {
    return normalizeForgeApiUrl(process.env.BUILT_IN_FORGE_API_URL);
  },
  get forgeApiKey() {
    return process.env.BUILT_IN_FORGE_API_KEY ?? "";
  },
  /** Modelo OpenAI-compatível (obrigatório em Alibaba MaaS). Ex.: qwen3-vl-plus */
  get forgeModel() {
    return (process.env.BUILT_IN_FORGE_MODEL ?? "").trim();
  },
};
