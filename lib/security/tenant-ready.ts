/**
 * Compatibilidade: preview/web novo + API Railway antiga (sem organizations no session).
 * Sessão nova sempre inclui `organizations: []` mesmo sem membership.
 * Sessão antiga omite o campo — aí liberamos queries por usuário autenticado.
 */
export function isLegacySessionWithoutOrgs(session: unknown): boolean {
  if (!session || typeof session !== "object") return false;
  const s = session as Record<string, unknown>;
  if (!s.user) return false;
  return !("organizations" in s);
}

export function resolveTenantReady(opts: {
  session: unknown;
  activeOrganizationId: number | null | undefined;
}): boolean {
  if (isLegacySessionWithoutOrgs(opts.session)) {
    return true;
  }
  return opts.activeOrganizationId != null && opts.activeOrganizationId > 0;
}
