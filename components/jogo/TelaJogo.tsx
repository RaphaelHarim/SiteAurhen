"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Wifi } from "lucide-react";
import type { Character, InventoryItem, MapToken } from "@/lib/types";
import { somarBonus } from "@/lib/types";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import MapaAurhen from "@/components/map/MapaAurhen";
import PainelPersonagem from "./PainelPersonagem";
import PainelEquipamento from "./PainelEquipamento";
import FichaEditavel from "./FichaEditavel";

export default function TelaJogo({
  personagem,
  itens,
  mapa,
  tokens,
  mapas,
  ehMestre,
}: {
  personagem: Character;
  itens: InventoryItem[];
  mapa: Mapa | null;
  tokens: MapToken[];
  mapas: Mapa[];
  ehMestre: boolean;
}) {
  // o inventário vive no painel da direita, mas o bônus dele
  // alimenta os outros dois painéis, então sobe até aqui
  const [itensAtuais, setItensAtuais] = useState(itens);
  const bonus = useMemo(() => somarBonus(itensAtuais), [itensAtuais]);

  return (
    <div className="p-3 md:p-5">
      {/* cabeçalho */}
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-500/20 bg-[#120F1D]/70 px-5 py-3 backdrop-blur-xl">
        <div>
          <h1 className="cinzel text-xl tracking-wide text-violet-100">{personagem.name}</h1>
          <p className="text-xs text-violet-300/60">
            {personagem.race ?? "—"} · {personagem.class ?? "—"} · nível {personagem.level}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-emerald-400/80">
            <Wifi className="h-3.5 w-3.5" />
            sincronizado
          </span>
          <Link
            href="/codex"
            className="flex items-center gap-1.5 rounded-lg border border-violet-500/25 px-3 py-1.5 text-xs text-violet-200 transition hover:bg-violet-500/10"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Codex
          </Link>
        </div>
      </header>

      {/* três colunas */}
      <div className="grid gap-4 xl:grid-cols-[15rem_1fr_15rem]">
        <aside className="rounded-2xl border border-violet-500/20 bg-[#120F1D]/70 p-4 backdrop-blur-xl">
          <PainelPersonagem personagem={personagem} bonus={bonus} podeEditar />
        </aside>

        <section className="order-first xl:order-none">
          <MapaAurhen
            mapaInicial={mapa}
            tokensIniciais={tokens}
            mapas={mapas}
            ehMestre={ehMestre}
          />
        </section>

        <aside className="rounded-2xl border border-violet-500/20 bg-[#120F1D]/70 p-4 backdrop-blur-xl">
          <PainelEquipamento
            itensIniciais={itens}
            ouroInicial={(personagem as { gold?: number }).gold ?? 0}
            aoMudarBonus={setItensAtuais}
          />
        </aside>
      </div>

      <FichaEditavel
        personagem={personagem}
        bonus={bonus}
        ehMestre={ehMestre}
        podeEditar
      />
    </div>
  );
}
