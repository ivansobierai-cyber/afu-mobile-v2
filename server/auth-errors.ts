/**
 * Erros de dependência de autenticação (DB / e-mail) vs credenciais inválidas.
 */

export class AuthDependencyError extends Error {
  readonly code = "AUTH_DEPENDENCY" as const;

  constructor(message = "Database not available") {
    super(message);
    this.name = "AuthDependencyError";
  }
}

export function isAuthDependencyError(error: unknown): boolean {
  if (error instanceof AuthDependencyError) return true;
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("database not available") ||
    msg.includes("banco de dados não disponível") ||
    msg.includes("banco de dados nao disponivel")
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
