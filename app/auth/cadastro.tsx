import { Redirect } from "expo-router";

/** @deprecated Use /auth/cadastro-new — redirecionamento de compatibilidade */
export default function LegacyCadastroRedirect() {
  return <Redirect href="/auth/cadastro-new" />;
}
