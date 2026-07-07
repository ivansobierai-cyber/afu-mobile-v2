export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string | number | boolean>;
  priority?: "default" | "normal" | "high";
}

export interface ExpoPushTicket {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
}

export interface ExpoPushResponse {
  data: ExpoPushTicket[];
}
