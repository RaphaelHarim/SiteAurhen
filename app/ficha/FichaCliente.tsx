"use client";

import { useMemo, useState } from "react";
import type { Character, InventoryItem } from "@/lib/types";
import { somarBonus } from "@/lib/types";
import PainelPersonagem from "@/components/jogo/PainelPersonagem";
import PainelEquipamento from "@/components/jogo/PainelEquipamento";
import FichaEditavel, { type FichaCompletaDados } from "@/components/jogo/FichaEditavel";

export default function FichaCliente({
  personagem,
  itensIniciais,
  ehMestre = false,
}: {
  personagem: FichaCompletaDados;
  itensIniciais: InventoryItem[];
  ehMestre?: boolean;
}) {
  const [itens, setItens] = useState(itensIniciais);
  const bonus = useMemo(() => somarBonus(itens), [itens]);

  return (
    <div className="mx-auto max-w-6xl p-3 md:p-6">
      <header className="mb-4 rounded-2xl border border-violet-500/20 bg-[#120F1D]/70 px-5 py-3 backdrop-blur-xl">
        <h1 className="cinzel text-xl tracking-wide text-violet-100">{personagem.name}</h1>
        <p className="text-xs text-violet-300/60">
          {personagem.race ?? "—"} · {personagem.class ?? "—"}
          {personagem.subclass ? ` (${personagem.subclass})` : ""} · nível {personagem.level}
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <aside className="rounded-2xl border border-violet-500/20 bg-[#120F1D]/70 p-4 backdrop-blur-xl">
          <PainelPersonagem
            personagem={personagem as Character}
            bonus={bonus}
            podeEditar
          />
        </aside>

        <section className="rounded-2xl border border-violet-500/20 bg-[#120F1D]/70 p-4 backdrop-blur-xl">
          <PainelEquipamento
            itensIniciais={itensIniciais}
            ouroInicial={(personagem as { gold?: number }).gold ?? 0}
            aoMudarBonus={setItens}
          />
        </section>
      </div>

      <FichaEditavel
        personagem={personagem}
        bonus={bonus}
        podeEditar
        ehMestre={ehMestre}
      />
    </div>
  );
}
