import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { InventoryItem } from "@/lib/types";
import type { FichaCompletaDados } from "@/components/jogo/FichaEditavel";
import FichaCliente from "./FichaCliente";
import CriarPersonagem from "./CriarPersonagem";

export const dynamic = "force-dynamic";

export default async function Ficha() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const ehMestre = perfil?.role === "mestre";

  // o mestre não tem ficha própria: a casa dele é o painel
  if (ehMestre) redirect("/mestre");

  const { data: personagem } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle<FichaCompletaDados>();

  if (!personagem) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <CriarPersonagem />
      </div>
    );
  }

  const { data: itens } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("character_id", personagem.id)
    .returns<InventoryItem[]>();

  return (
    <FichaCliente
      personagem={personagem}
      itensIniciais={itens ?? []}
      ehMestre={ehMestre}
    />
  );
}
