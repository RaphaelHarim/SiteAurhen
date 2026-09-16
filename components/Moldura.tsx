import { criarClienteServidor } from "@/lib/supabase/server";
import Navegacao from "./Navegacao";

/**
 * Envolve toda página logada: busca o perfil no servidor, monta a
 * navegação e abre espaço para o conteúdo. Em rotas sem sessão
 * (a tela de entrar) devolve só o conteúdo, sem menu.
 */
export default async function Moldura({ children }: { children: React.ReactNode }) {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <>{children}</>;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("user_id", user.id)
    .single();

  return (
    <>
      <Navegacao
        ehMestre={perfil?.role === "mestre"}
        nome={perfil?.username ?? user.email ?? ""}
      />
      <div className="pb-20 lg:pb-0 lg:pl-56">{children}</div>
    </>
  );
}
