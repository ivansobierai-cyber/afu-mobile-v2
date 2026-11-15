export function resolveWebAppUrl(input: {
  host?: string;
  protocol?: string;
  forwardedProto?: string;
}): string {
  const configured = [process.env.APP_URL, process.env.EXPO_WEB_PREVIEW_URL, process.env.EXPO_PACKAGER_PROXY_URL]
    .map((value) => value?.trim())
    .find((value) => Boolean(value));
  if (configured) return configured.replace(/\/$/, "");

  const host = input.host?.trim();
  const local = !host || /^localhost(?::\d+)?$/i.test(host) || host.startsWith("127.0.0.1");
  if (!local && host) {
    const forwarded = input.forwardedProto?.split(",")[0]?.trim();
    const proto = forwarded === "http" || forwarded === "https" ? forwarded : input.protocol || "https";
    return `${proto}://${host}/`;
  }
  return "http://localhost:8081";
}
