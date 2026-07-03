import { Redirect } from "expo-router";

/** @deprecated Substituído por admin-usuarios.tsx (tRPC) */
export default function AdministracaoRedirect() {
  return <Redirect href="/mais/admin-usuarios" />;
}
