import Link from "next/link";
import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Character } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Mesa() {
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

  if (perfil?.role !== "mestre") redirect("/ficha");

  // a policy deixa o mestre ler todas as fichas
  const { data: fichas } = await supabase
    .from("characters")
    .select("*")
    .order("name")
    .returns<Character[]>();

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <header className="mb-8">
        <h1 className="cinzel text-3xl tracking-wide text-violet-100">A mesa</h1>
        <p className="text-sm text-violet-300/60">
          {fichas?.length ?? 0} personagem(ns) · você entrou como {perfil.username}
        </p>
      </header>

      {!fichas?.length ? (
        <p className="rounded-xl border border-violet-500/20 bg-[#120F1D]/60 p-6 text-violet-300/70">
          Ninguém criou ficha ainda. Assim que os jogadores entrarem, elas aparecem aqui.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fichas.map((f) => (
            <article
              key={f.id}
              className="rounded-xl border border-violet-500/25 bg-[#120F1D]/70 p-5 backdrop-blur"
            >
              <h2 className="cinzel text-lg text-violet-100">{f.name}</h2>
              <p className="mb-3 text-xs text-violet-300/60">
                {f.race ?? "—"} · {f.class ?? "—"} · nível {f.level}
              </p>

              <div className="space-y-2">
                <Medidor nome="PV" atual={f.current_pv} max={f.max_pv} cor="bg-rose-500" />
                <Medidor nome="PM" atual={f.current_pm} max={f.max_pm} cor="bg-violet-500" />
              </div>

              <dl className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
                {(
                  [
                    ["FOR", f.str],
                    ["AGI", f.agi],
                    ["VIT", f.vit],
                    ["INT", f.int],
                    ["SAB", f.wis],
                    ["PRE", f.pre],
                  ] as [string, number][]
                ).map(([k, v]) => (
                  <div key={k} className="rounded bg-black/30 py-1">
                    <dt className="text-[9px] text-violet-300/50">{k}</dt>
                    <dd className="text-violet-100">{v}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}

      <Link
        href="/ficha"
        className="mt-8 inline-block text-sm text-violet-300/70 underline-offset-4 hover:text-violet-200 hover:underline"
      >
        Ver a minha própria ficha
      </Link>
    </div>
  );
}

function Medidor({
  nome,
  atual,
  max,
  cor,
}: {
  nome: string;
  atual: number;
  max: number;
  cor: string;
}) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[11px] text-violet-200/70">
        <span>{nome}</span>
        <span>
          {atual}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
        <div
          className={`h-full rounded-full ${cor}`}
          style={{ width: `${max ? Math.min(100, (atual / max) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}
