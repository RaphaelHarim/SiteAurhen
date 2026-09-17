import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Character, GameItem, MapToken } from "@/lib/types";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import PainelMestre from "@/components/mestre/PainelMestre";

export const dynamic = "force-dynamic";

export default async function PaginaMestre() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role, username")
    .eq("user_id", user.id)
    .single();

  // jogador não entra aqui: a tela dele é a mesa de jogo
  if (perfil?.role !== "mestre") redirect("/jogo");

  const [{ data: mapas }, { data: personagens }, { data: catalogo }] = await Promise.all([
    supabase.from("maps").select("*").order("created_at").returns<Mapa[]>(),
    supabase.from("characters").select("*").order("name").returns<Character[]>(),
    supabase.from("game_items").select("*").order("created_at", { ascending: false }).returns<GameItem[]>(),
  ]);

  const ativo = mapas?.find((m) => m.is_active) ?? null;

  const { data: tokens } = ativo
    ? await supabase.from("map_tokens").select("*").eq("map_id", ativo.id).returns<MapToken[]>()
    : { data: [] as MapToken[] };

  return (
    <PainelMestre
      mapa={ativo}
      tokens={tokens ?? []}
      mapas={mapas ?? []}
      personagens={personagens ?? []}
      catalogo={catalogo ?? []}
      nome={perfil.username}
    />
  );
}
