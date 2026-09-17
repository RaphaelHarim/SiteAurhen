"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Character, StatKey, StatsBonus } from "@/lib/types";
import { STAT_LABELS, formatarBonus } from "@/lib/types";

type FichaExtra = Character & {
  talents?: string | null;
  background?: string | null;
  notes?: string | null;
  lore?: string | null;
};

const ATRIBUTOS: [StatKey, string][] = [
  ["str", "Força"],
  ["agi", "Agilidade"],
  ["vit", "Vitalidade"],
  ["int", "Inteligência"],
  ["wis", "Sabedoria"],
  ["pre", "Presença"],
];

export default function FichaCompleta({
  personagem,
  bonus,
  ehMestre,
  podeEditar,
}: {
  personagem: FichaExtra;
  bonus: StatsBonus;
  ehMestre: boolean;
  podeEditar: boolean;
}) {
  const [p, setP] = useState(personagem);

  return (
    <section className="mt-6 space-y-5 border-t border-violet-500/15 pt-8">
      <h2 className="cinzel text-xl tracking-wide text-violet-100">Ficha completa</h2>

      {/* atributos */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {ATRIBUTOS.map(([chave, rotulo]) => {
          const base = p[chave] as number;
          const extra = bonus[chave] ?? 0;
          const total = base + extra;
          const mod = Math.floor((total - 10) / 2);
          return (
            <div
              key={chave}
              className="rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3 text-center"
            >
              <p className="text-[10px] uppercase tracking-wider text-violet-300/60">{rotulo}</p>
              <p className="cinzel text-2xl text-violet-50">{total}</p>
              <p className="text-xs text-violet-300/50">
                mod {formatarBonus(mod)}
                {extra !== 0 && <span className="ml-1 text-emerald-400">({formatarBonus(extra)})</span>}
              </p>
            </div>
          );
        })}
      </div>

      {/* derivadas */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            ["Defesa", p.armor_class + (bonus.armor_class ?? 0), ""],
            ["Resistência mágica", p.magic_res + (bonus.magic_res ?? 0), ""],
            ["Iniciativa", p.initiative + (bonus.initiative ?? 0), ""],
            ["Deslocamento", p.speed + (bonus.speed ?? 0), " m"],
          ] as [string, number, string][]
        ).map(([rotulo, valor, sufixo]) => (
          <div
            key={rotulo}
            className="rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-violet-300/60">{rotulo}</p>
            <p className="cinzel text-xl text-violet-50">
              {valor}
              {sufixo}
            </p>
          </div>
        ))}
      </div>

      {/* textos */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CampoTexto
          id={p.id}
          campo="talents"
          titulo="Talentos e habilidades"
          valor={p.talents ?? ""}
          podeEditar={podeEditar}
          aoSalvar={(v) => setP({ ...p, talents: v })}
        />
        <CampoTexto
          id={p.id}
          campo="background"
          titulo="Antecedente"
          valor={p.background ?? ""}
          podeEditar={podeEditar}
          aoSalvar={(v) => setP({ ...p, background: v })}
        />
        <CampoTexto
          id={p.id}
          campo="lore"
          titulo="História do personagem"
          valor={p.lore ?? ""}
          podeEditar={podeEditar}
          aoSalvar={(v) => setP({ ...p, lore: v })}
        />
        <CampoTexto
          id={p.id}
          campo="notes"
          titulo="Anotações do mestre"
          valor={p.notes ?? ""}
          podeEditar={ehMestre}
          destaque
          aoSalvar={(v) => setP({ ...p, notes: v })}
        />
      </div>
    </section>
  );
}

function CampoTexto({
  id,
  campo,
  titulo,
  valor,
  podeEditar,
  destaque = false,
  aoSalvar,
}: {
  id: string;
  campo: string;
  titulo: string;
  valor: string;
  podeEditar: boolean;
  destaque?: boolean;
  aoSalvar: (v: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState(valor);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    setSalvando(true);
    const supabase = criarClienteNavegador();
    const { error } = await supabase
      .from("characters")
      .update({ [campo]: texto })
      .eq("id", id);
    setSalvando(false);
    if (!error) {
      aoSalvar(texto);
      setEditando(false);
    }
  }

  return (
    <div
      className={`rounded-xl border p-4 ${
        destaque
          ? "border-amber-400/25 bg-amber-400/5"
          : "border-violet-500/20 bg-[#120F1D]/70"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <p
          className={`text-[10px] uppercase tracking-[0.2em] ${
            destaque ? "text-amber-300/70" : "text-violet-300/60"
          }`}
        >
          {titulo}
        </p>
        {podeEditar && (
          <button
            onClick={() => (editando ? salvar() : setEditando(true))}
            disabled={salvando}
            className="text-violet-300/50 transition hover:text-violet-100"
            aria-label={editando ? "Salvar" : "Editar"}
          >
            {editando ? <Check className="h-4 w-4" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      {editando ? (
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-lg border border-violet-500/25 bg-black/40 p-2 text-sm text-violet-100 focus:border-violet-400/60 focus:outline-none"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-200/70">
          {texto || <span className="text-violet-300/30">vazio</span>}
        </p>
      )}
    </div>
  );
}
