/**
 * Notificações locais (expo-notifications) para lembretes de calendário
 * e alertas fitossanitários. No web, as chamadas são no-ops seguros.
 */
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

export type EventReminderInput = {
  eventId: number;
  titulo: string;
  dataProgramada: string;
  prioridade?: string;
};

let permissionRequested = false;
let handlerConfigured = false;

function ensureHandler() {
  if (handlerConfigured || Platform.OS === "web") return;
  handlerConfigured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  ensureHandler();

  if (!permissionRequested) {
    permissionRequested = true;
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === "granted";
    }
  }

  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

function reminderId(eventId: number) {
  return `calendario-evento-${eventId}`;
}

function parseEventDate(dataProgramada: string): Date | null {
  const raw = dataProgramada.trim();
  if (!raw) return null;
  const date = raw.length === 10 ? new Date(`${raw}T08:00:00`) : new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/** Agenda lembrete local 1 dia antes do evento (ou no horário se for hoje). */
export async function scheduleEventReminder(input: EventReminderInput): Promise<string | null> {
  if (Platform.OS === "web") return null;

  const granted = await ensurePermission();
  if (!granted) return null;

  const eventDate = parseEventDate(input.dataProgramada);
  if (!eventDate) return null;

  const triggerDate = new Date(eventDate);
  triggerDate.setDate(triggerDate.getDate() - 1);
  if (triggerDate.getTime() <= Date.now()) {
    triggerDate.setTime(eventDate.getTime() - 60 * 60 * 1000);
  }
  if (triggerDate.getTime() <= Date.now()) {
    triggerDate.setTime(Date.now() + 60 * 1000);
  }

  const id = reminderId(input.eventId);
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore missing
  }

  const prioridadeLabel =
    input.prioridade === "critica" || input.prioridade === "alta"
      ? ` [${(input.prioridade ?? "").toUpperCase()}]`
      : "";

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `Lembrete agrícola${prioridadeLabel}`,
      body: input.titulo,
      data: { eventId: input.eventId, type: "calendario" },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    },
  });

  return id;
}

export async function cancelEventReminder(eventId: number): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId(eventId));
  } catch {
    // ignore
  }
}

/** Alerta fitossanitário imediato (diagnóstico grave, etc.). */
export async function notifyFitossanitario(titulo: string, corpo: string): Promise<void> {
  if (Platform.OS === "web") return;
  const granted = await ensurePermission();
  if (!granted) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: corpo,
      data: { type: "fitossanitario" },
      sound: true,
    },
    trigger: null,
  });
}
