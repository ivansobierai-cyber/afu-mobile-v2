import { Redirect } from "expo-router";

/** Alias institucional → `/auth/login` (URL pública https://afuagro.tech/login). */
export default function LoginAlias() {
  return <Redirect href={"/auth/login" as any} />;
}
