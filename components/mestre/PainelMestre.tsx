"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Map, Package, Users } from "lucide-react";
import type { Character, GameItem, MapToken } from "@/lib/types";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import MapaAurhen from "@/components/map/MapaAurhen";
import CatalogoItens from "./CatalogoItens";

type Aba = "mapa" | "mesa" | "itens";

export default function PainelMestre({
  mapa,
  tokens,
  mapas,
  personagens,
  catalogo,
  nome,
}: {
  mapa: Mapa | null;
  tokens: MapToken[];
  mapas: Mapa[];
  personagens: Character[];
  catalogo: GameItem[];
  nome: string;
}) {
  const [aba, setAba] = useState<Aba>("mapa");

  const abas: [Aba, string, typeof Map][] = [
    ["mapa", "Mapa", Map],
    ["mesa", "Mesa", Users],
    ["itens", "Itens", Package],
  ];

  return (
    <div className="mx-auto max-w-6xl p-3 md:p-6">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="cinzel text-2xl tracking-wide text-violet-100">Mesa do mestre</h1>
          <p className="text-sm text-violet-300/60">
            {nome} · {personagens.length} jogador(es)
          </p>
        </div>

        <div className="flex gap-1 rounded-xl border border-violet-500/25 bg-black/40 p-1">
          {abas.map(([id, rotulo, Icone]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition ${
                aba === id
                  ? "bg-violet-600 text-white"
                  : "text-violet-300/60 hover:bg-violet-500/10 hover:text-violet-100"
              }`}
            >
              <Icone className="h-4 w-4" />
              {rotulo}
            </button>
          ))}
        </div>
      </header>

      <motion.div key={aba} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
        {aba === "mapa" && (
          <MapaAurhen mapaInicial={mapa} tokensIniciais={tokens} mapas={mapas} ehMestre />
        )}

        {aba === "mesa" && <VisaoMesa personagens={personagens} />}

        {aba === "itens" && (
          <CatalogoItens itensIniciais={catalogo} personagens={personagens} />
        )}
      </motion.div>
    </div>
  );
}

function VisaoMesa({ personagens }: { personagens: Character[] }) {
  if (personagens.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-violet-500/25 p-10 text-center text-violet-300/50">
        Ninguém criou ficha ainda. Assim que os jogadores entrarem, elas aparecem aqui.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {personagens.map((p) => (
        <article
          key={p.id}
          className="rounded-xl border border-violet-500/25 bg-[#120F1D]/70 p-4 backdrop-blur"
        >
          <div className="mb-3 flex items-center gap-3">
            {p.portrait_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={p.portrait_url}
                alt=""
                className="h-11 w-11 rounded-full border border-violet-400/40 object-cover"
              />
            ) : (
              <div className="h-11 w-11 rounded-full border border-violet-400/20 bg-black/40" />
            )}
            <div className="min-w-0">
              <p className="cinzel truncate text-violet-100">{p.name}</p>
              <p className="truncate text-[11px] text-violet-300/50">
                {p.race ?? "—"} · {p.class ?? "—"} · nv {p.level}
              </p>
            </div>
          </div>

          <Barra nome="PV" atual={p.current_pv} max={p.max_pv} cor="bg-rose-500" />
          <Barra nome="PM" atual={p.current_pm} max={p.max_pm} cor="bg-violet-500" />

          <dl className="mt-3 grid grid-cols-6 gap-1 text-center text-[10px]">
            {(
              [
                ["FOR", p.str],
                ["AGI", p.agi],
                ["VIT", p.vit],
                ["INT", p.int],
                ["SAB", p.wis],
                ["PRE", p.pre],
              ] as [string, number][]
            ).map(([k, v]) => (
              <div key={k} className="rounded bg-black/30 py-1">
                <dt className="text-violet-300/45">{k}</dt>
                <dd className="text-violet-100">{v}</dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}

function Barra({
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
  if (!max) return null;
  return (
    <div className="mb-1.5">
      <div className="mb-0.5 flex justify-between text-[10px] text-violet-200/70">
        <span>{nome}</span>
        <span>
          {atual}/{max}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-black/50">
        <div
          className={`h-full rounded-full ${cor}`}
          style={{ width: `${Math.min(100, (atual / max) * 100)}%` }}
        />
      </div>
    </div>
  );
}
