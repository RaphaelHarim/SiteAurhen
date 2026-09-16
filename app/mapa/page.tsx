import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { MapToken } from "@/lib/types";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import MapaAurhen from "@/components/map/MapaAurhen";

export const dynamic = "force-dynamic";

export default async function PaginaMapa() {
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

  const { data: mapas } = await supabase
    .from("maps")
    .select("*")
    .order("created_at")
    .returns<Mapa[]>();

  const ativo = mapas?.find((m) => m.is_active) ?? null;

  const { data: tokens } = ativo
    ? await supabase.from("map_tokens").select("*").eq("map_id", ativo.id).returns<MapToken[]>()
    : { data: [] as MapToken[] };

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-6">
      <header className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h1 className="cinzel text-2xl tracking-wide text-violet-100">
            {ativo?.name ?? "Aurhen"}
          </h1>
          <p className="text-sm text-violet-300/60">
            {ehMestre ? "Você controla o mapa" : "Acompanhando a mesa"}
          </p>
        </div>
        <nav className="flex gap-4 text-sm text-violet-300/70">
          <Link href="/ficha" className="hover:text-violet-100">
            Ficha
          </Link>
          {ehMestre && (
            <Link href="/mesa" className="hover:text-violet-100">
              Mesa
            </Link>
          )}
        </nav>
      </header>

      <MapaAurhen
        mapaInicial={ativo}
        tokensIniciais={tokens ?? []}
        mapas={mapas ?? []}
        ehMestre={ehMestre}
      />
    </div>
  );
}
