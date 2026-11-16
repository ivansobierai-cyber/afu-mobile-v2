/**
 * Deep links opcionais AFU Agro (Expo) → AFU AGI (Android nativo).
 * Schemes registrados no Manifest do AGI: afuagi:// e afuagro://agi/...
 */
export type AgiDeepLinkTarget =
  | "dashboard"
  | "chat"
  | "plant"
  | "settings"
  | "agents"
  | "tasks";

export function buildAgiDeepLink(target: AgiDeepLinkTarget = "dashboard"): string {
  return `afuagi://${target}`;
}

export function buildAgiCompanionDeepLink(target: AgiDeepLinkTarget = "dashboard"): string {
  return `afuagro://agi/${target}`;
}
