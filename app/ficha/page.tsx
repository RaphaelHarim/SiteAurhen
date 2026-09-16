import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Character, InventoryItem } from "@/lib/types";
import FichaCliente from "./FichaCliente";
import CriarPersonagem from "./CriarPersonagem";

export const dynamic = "force-dynamic";

export default async function Ficha() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: personagem } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle<Character>();

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
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <FichaCliente personagem={personagem} itensIniciais={itens ?? []} />
    </div>
  );
}
