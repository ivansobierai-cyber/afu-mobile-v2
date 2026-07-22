/**
 * Stub web — notificações locais não rodam no browser.
 * Evita importar expo-notifications (side-effect DevicePushTokenAutoRegistration).
 */
export type EventReminderInput = {
  eventId: number;
  titulo: string;
  dataProgramada: string;
  prioridade?: string;
};

export async function scheduleEventReminder(_input: EventReminderInput): Promise<string | null> {
  return null;
}

export async function cancelEventReminder(_eventId: number): Promise<void> {
  // no-op
}

export async function notifyFitossanitario(_titulo: string, _corpo: string): Promise<void> {
  // no-op
}
