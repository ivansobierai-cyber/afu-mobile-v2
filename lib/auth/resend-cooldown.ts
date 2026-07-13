/** Utilitários puros de cooldown de reenvio de e-mail (sem dependências Expo). */

export function formatCooldownTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getCooldownMessage(cooldownSeconds: number, _maxAttempts = 5): string {
  if (cooldownSeconds <= 0) return "Reenviar E-mail";
  return `Reenviar em ${formatCooldownTime(cooldownSeconds)}`;
}
