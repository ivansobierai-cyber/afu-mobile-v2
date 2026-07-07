/**
 * Bypass de autenticação — apenas quando explicitamente ativado.
 * Para desenvolver sem login: EXPO_PUBLIC_DEV_SKIP_AUTH=1 ou DEV_SKIP_AUTH=1
 */
function readEnvFlag(value: string | undefined): boolean | null {
  if (value === undefined || value === "") return null;
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return null;
}

export const DEV_USER_OPEN_ID = "afu-dev-local";

/** Auth ativa por padrão; bypass só com flag explícita. */
export function isAuthDisabled(): boolean {
  const explicit =
    readEnvFlag(process.env.EXPO_PUBLIC_DEV_SKIP_AUTH) ??
    readEnvFlag(process.env.DEV_SKIP_AUTH);

  return explicit === true;
}

/** Botões de login demo — visíveis em dev ou com EXPO_PUBLIC_SHOW_DEMO_LOGIN=1 (ex.: profile apk). */
export function isDemoLoginEnabled(): boolean {
  const explicit = readEnvFlag(process.env.EXPO_PUBLIC_SHOW_DEMO_LOGIN);
  if (explicit !== null) return explicit;
  return typeof __DEV__ !== "undefined" && __DEV__;
}
