import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Character, InventoryItem, MapToken } from "@/lib/types";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import TelaJogo from "@/components/jogo/TelaJogo";
import CriarPersonagem from "@/app/ficha/CriarPersonagem";

export const dynamic = "force-dynamic";

export default async function PaginaJogo() {
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

  // o mestre nao tem personagem: a casa dele e o painel
  if (ehMestre) redirect("/mestre");

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

  const [{ data: itens }, { data: mapas }] = await Promise.all([
    supabase
      .from("inventory_items")
      .select("*")
      .eq("character_id", personagem.id)
      .returns<InventoryItem[]>(),
    supabase.from("maps").select("*").order("created_at").returns<Mapa[]>(),
  ]);

  const ativo = mapas?.find((m) => m.is_active) ?? null;

  const { data: tokens } = ativo
    ? await supabase.from("map_tokens").select("*").eq("map_id", ativo.id).returns<MapToken[]>()
    : { data: [] as MapToken[] };

  return (
    <TelaJogo
      personagem={personagem}
      itens={itens ?? []}
      mapa={ativo}
      tokens={tokens ?? []}
      mapas={mapas ?? []}
      ehMestre={ehMestre}
    />
  );
}
