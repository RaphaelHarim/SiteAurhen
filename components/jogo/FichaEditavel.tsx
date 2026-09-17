"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Plus, Shield, Trash2 } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Character, StatKey, StatsBonus } from "@/lib/types";
import { formatarBonus } from "@/lib/types";

/* ------------------------------------------------------------------ */

const ATRIBUTOS: [StatKey, string, string][] = [
  ["str", "For", "Força"],
  ["agi", "Des", "Destreza"],
  ["vit", "Con", "Constituição"],
  ["int", "Int", "Inteligência"],
  ["wis", "Sab", "Sabedoria"],
  ["pre", "Car", "Carisma"],
];

/** Perícia -> atributo que a governa. */
const PERICIAS: [string, StatKey][] = [
  ["Acrobacia", "agi"],
  ["Adestrar Animais", "wis"],
  ["Arcanismo", "int"],
  ["Atletismo", "str"],
  ["Atuação", "pre"],
  ["Enganação", "pre"],
  ["Furtividade", "agi"],
  ["História", "int"],
  ["Intimidação", "pre"],
  ["Intuição", "wis"],
  ["Investigação", "int"],
  ["Medicina", "wis"],
  ["Natureza", "int"],
  ["Percepção", "wis"],
  ["Persuasão", "pre"],
  ["Prestidigitação", "agi"],
  ["Religião", "int"],
  ["Sobrevivência", "wis"],
];

const BLOCOS: [string, string][] = [
  ["origem", "Origem"],
  ["raca", "Raça"],
  ["talentos", "Talentos"],
  ["classe", "Classe"],
];

type Traco = { t: string; d: string };
type Tracos = Record<string, Traco[]>;

export type FichaCompletaDados = Character & {
  proficiency_bonus?: number;
  subclass?: string | null;
  origin?: string | null;
  idiomas?: string | null;
  saving_throws?: StatKey[];
  skills?: Record<string, number>;
  traits?: Tracos;
  talents?: string | null;
  background?: string | null;
  notes?: string | null;
  lore?: string | null;
};

export function mod(valor: number) {
  return Math.floor((valor - 10) / 2);
}

/* ------------------------------------------------------------------ */

export default function FichaEditavel({
  personagem,
  bonus,
  podeEditar,
  ehMestre,
}: {
  personagem: FichaCompletaDados;
  bonus: StatsBonus;
  podeEditar: boolean;
  ehMestre: boolean;
}) {
  const [p, setP] = useState<FichaCompletaDados>({
    ...personagem,
    saving_throws: personagem.saving_throws ?? [],
    skills: personagem.skills ?? {},
    traits: personagem.traits ?? { origem: [], raca: [], talentos: [], classe: [] },
  });
  const [salvo, setSalvo] = useState(true);
  const supabase = criarClienteNavegador();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Salva sozinho, um segundo depois da última tecla.
   *
   * Sem isso o jogador teria que clicar em salvar a cada campo, e ia
   * esquecer. Com um salvamento por tecla, seriam dezenas de escritas
   * por minuto. Um segundo de espera resolve os dois lados.
   */
  const agendarSalvar = useCallback(
    (mudanca: Partial<FichaCompletaDados>) => {
      setP((atual) => {
        const novo = { ...atual, ...mudanca };
        setSalvo(false);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
          const { id, ...campos } = novo;
          await supabase
            .from("characters")
            .update({
              name: campos.name,
              class: campos.class,
              subclass: campos.subclass,
              race: campos.race,
              origin: campos.origin,
              level: campos.level,
              max_pv: campos.max_pv,
              current_pv: campos.current_pv,
              armor_class: campos.armor_class,
              speed: campos.speed,
              idiomas: campos.idiomas,
              str: campos.str,
              agi: campos.agi,
              vit: campos.vit,
              int: campos.int,
              wis: campos.wis,
              pre: campos.pre,
              saving_throws: campos.saving_throws,
              skills: campos.skills,
              traits: campos.traits,
              notes: campos.notes,
              lore: campos.lore,
            })
            .eq("id", id);
          setSalvo(true);
        }, 1000);
        return novo;
      });
    },
    [supabase]
  );

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const bp = p.proficiency_bonus ?? 2;
  const editavel = podeEditar || ehMestre;

  function valorAtributo(k: StatKey) {
    return (p[k] as number) + (bonus[k] ?? 0);
  }

  function alternarSalvaguarda(k: StatKey) {
    if (!editavel) return;
    const atual = p.saving_throws ?? [];
    agendarSalvar({
      saving_throws: atual.includes(k) ? atual.filter((x) => x !== k) : [...atual, k],
    });
  }

  function ciclarPericia(nome: string) {
    if (!editavel) return;
    const atual = { ...(p.skills ?? {}) };
    const n = (atual[nome] ?? 0) + 1;
    if (n > 2) delete atual[nome];
    else atual[nome] = n;
    agendarSalvar({ skills: atual });
  }

  function mexerTraco(bloco: string, indice: number, campo: "t" | "d", valor: string) {
    const t = { ...(p.traits ?? {}) };
    const lista = [...(t[bloco] ?? [])];
    lista[indice] = { ...lista[indice], [campo]: valor };
    t[bloco] = lista;
    agendarSalvar({ traits: t });
  }

  function addTraco(bloco: string) {
    const t = { ...(p.traits ?? {}) };
    t[bloco] = [...(t[bloco] ?? []), { t: "", d: "" }];
    agendarSalvar({ traits: t });
  }

  function tirarTraco(bloco: string, indice: number) {
    const t = { ...(p.traits ?? {}) };
    t[bloco] = (t[bloco] ?? []).filter((_, i) => i !== indice);
    agendarSalvar({ traits: t });
  }

  return (
    <section className="mt-6 space-y-5 border-t border-violet-500/15 pt-8">
      <div className="flex items-center justify-between">
        <h2 className="cinzel text-xl tracking-wide text-violet-100">Ficha</h2>
        <span
          className={`flex items-center gap-1.5 text-[11px] ${
            salvo ? "text-emerald-400/70" : "text-amber-300/80"
          }`}
        >
          {salvo ? <Check className="h-3.5 w-3.5" /> : null}
          {salvo ? "salvo" : "salvando…"}
        </span>
      </div>

      {/* identidade */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Campo rotulo="Nome" valor={p.name} editavel={editavel} aoMudar={(v) => agendarSalvar({ name: v })} />
        <Campo rotulo="Raça" valor={p.race ?? ""} editavel={editavel} aoMudar={(v) => agendarSalvar({ race: v })} />
        <Campo rotulo="Classe" valor={p.class ?? ""} editavel={editavel} aoMudar={(v) => agendarSalvar({ class: v })} />
        <Campo rotulo="Subclasse" valor={p.subclass ?? ""} editavel={editavel} aoMudar={(v) => agendarSalvar({ subclass: v })} />
        <Campo rotulo="Origem" valor={p.origin ?? ""} editavel={editavel} aoMudar={(v) => agendarSalvar({ origin: v })} />
        <Campo rotulo="Idiomas" valor={p.idiomas ?? ""} editavel={editavel} aoMudar={(v) => agendarSalvar({ idiomas: v })} />
        <Numero rotulo="Nível" valor={p.level} editavel={editavel} aoMudar={(v) => agendarSalvar({ level: v })} />
        <div className="rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/60">Proficiência</p>
          <p className="cinzel text-xl text-violet-50">{formatarBonus(bp)}</p>
          <p className="text-[10px] text-violet-300/40">segue o nível</p>
        </div>
      </div>

      {/* combate */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Numero rotulo="HP máximo" valor={p.max_pv} editavel={editavel} aoMudar={(v) => agendarSalvar({ max_pv: v })} />
        <Numero
          rotulo="AC"
          valor={p.armor_class}
          extra={bonus.armor_class ?? 0}
          editavel={editavel}
          aoMudar={(v) => agendarSalvar({ armor_class: v })}
        />
        <Numero
          rotulo="Deslocamento"
          valor={p.speed}
          sufixo=" m"
          editavel={editavel}
          aoMudar={(v) => agendarSalvar({ speed: v })}
        />
        <div className="rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3">
          <p className="text-[10px] uppercase tracking-wider text-violet-300/60">Iniciativa</p>
          <p className="cinzel text-xl text-violet-50">
            {formatarBonus(mod(valorAtributo("agi")) + (bonus.initiative ?? 0))}
          </p>
        </div>
      </div>

      {/* atributos e salvaguardas */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-violet-300/50">
          Atributos · clique no escudo para marcar salvaguarda
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {ATRIBUTOS.map(([chave, curto, longo]) => {
            const total = valorAtributo(chave);
            const m = mod(total);
            const salva = (p.saving_throws ?? []).includes(chave);
            const extra = bonus[chave] ?? 0;
            return (
              <div
                key={chave}
                className="rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3 text-center"
              >
                <p className="text-[10px] uppercase tracking-wider text-violet-300/60" title={longo}>
                  {curto}
                </p>
                {editavel ? (
                  <input
                    type="number"
                    value={p[chave] as number}
                    onChange={(e) => agendarSalvar({ [chave]: Number(e.target.value) } as never)}
                    className="w-full bg-transparent text-center font-[Cinzel,serif] text-2xl text-violet-50 focus:outline-none"
                  />
                ) : (
                  <p className="cinzel text-2xl text-violet-50">{total}</p>
                )}
                <p className="text-xs text-violet-300/60">
                  {formatarBonus(m)}
                  {extra !== 0 && <span className="ml-1 text-emerald-400">({formatarBonus(extra)})</span>}
                </p>
                <button
                  onClick={() => alternarSalvaguarda(chave)}
                  disabled={!editavel}
                  className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded py-0.5 text-[10px] transition ${
                    salva
                      ? "bg-violet-600/30 text-violet-100"
                      : "text-violet-300/30 hover:text-violet-300/70"
                  }`}
                  title="Proficiência em salvaguarda"
                >
                  <Shield className="h-3 w-3" />
                  {salva ? formatarBonus(m + bp) : "salvaguarda"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* perícias */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-violet-300/50">
          Perícias · clique para alternar entre nada, proficiente e especialista
        </p>
        <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
          {PERICIAS.map(([nome, atributo]) => {
            const nivel = (p.skills ?? {})[nome] ?? 0;
            const m = mod(valorAtributo(atributo));
            const total = m + (nivel === 2 ? bp * 2 : nivel === 1 ? bp : 0);
            return (
              <button
                key={nome}
                onClick={() => ciclarPericia(nome)}
                disabled={!editavel}
                className={`flex items-center justify-between rounded-lg border px-3 py-1.5 text-left text-xs transition ${
                  nivel === 2
                    ? "border-amber-400/50 bg-amber-400/10 text-amber-100"
                    : nivel === 1
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-100"
                      : "border-violet-500/15 bg-black/30 text-violet-300/50"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      nivel === 2 ? "bg-amber-300" : nivel === 1 ? "bg-violet-400" : "bg-violet-500/25"
                    }`}
                  />
                  {nome}
                  {nivel === 2 && <span className="text-[9px] opacity-70">(E)</span>}
                </span>
                <span className="tabular-nums">{formatarBonus(total)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* traços por bloco */}
      <div className="grid gap-4 lg:grid-cols-2">
        {BLOCOS.map(([chave, titulo]) => (
          <div key={chave} className="rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/60">{titulo}</p>
              {editavel && (
                <button
                  onClick={() => addTraco(chave)}
                  className="text-violet-300/50 transition hover:text-violet-100"
                  aria-label={`Acrescentar em ${titulo}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-2">
              {((p.traits ?? {})[chave] ?? []).length === 0 && (
                <p className="text-xs text-violet-300/30">
                  {editavel ? "Clique no + para acrescentar." : "vazio"}
                </p>
              )}

              {((p.traits ?? {})[chave] ?? []).map((traco, i) => (
                <div key={i} className="rounded-lg border border-violet-500/15 bg-black/30 p-2">
                  <div className="flex items-center gap-1">
                    {editavel ? (
                      <input
                        value={traco.t}
                        onChange={(e) => mexerTraco(chave, i, "t", e.target.value)}
                        placeholder="nome do traço"
                        className="flex-1 bg-transparent text-xs font-semibold text-violet-100 placeholder:text-violet-400/25 focus:outline-none"
                      />
                    ) : (
                      <p className="flex-1 text-xs font-semibold text-violet-100">{traco.t}</p>
                    )}
                    {editavel && (
                      <button
                        onClick={() => tirarTraco(chave, i)}
                        className="text-violet-300/30 transition hover:text-rose-400"
                        aria-label="Remover"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {editavel ? (
                    <textarea
                      value={traco.d}
                      onChange={(e) => mexerTraco(chave, i, "d", e.target.value)}
                      placeholder="o que faz"
                      rows={2}
                      className="mt-1 w-full resize-y bg-transparent text-xs text-violet-200/70 placeholder:text-violet-400/25 focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-xs text-violet-200/70">{traco.d}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* história e anotações */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Texto
          rotulo="História do personagem"
          valor={p.lore ?? ""}
          editavel={editavel}
          aoMudar={(v) => agendarSalvar({ lore: v })}
        />
        <Texto
          rotulo="Anotações do mestre"
          valor={p.notes ?? ""}
          editavel={ehMestre}
          destaque
          aoMudar={(v) => agendarSalvar({ notes: v })}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */

function Campo({
  rotulo,
  valor,
  editavel,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  editavel: boolean;
  aoMudar: (v: string) => void;
}) {
  return (
    <label className="block rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3">
      <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-violet-300/60">
        {rotulo}
      </span>
      {editavel ? (
        <input
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          className="w-full bg-transparent text-sm text-violet-50 focus:outline-none"
        />
      ) : (
        <span className="block text-sm text-violet-50">{valor || "—"}</span>
      )}
    </label>
  );
}

function Numero({
  rotulo,
  valor,
  extra = 0,
  sufixo = "",
  editavel,
  aoMudar,
}: {
  rotulo: string;
  valor: number;
  extra?: number;
  sufixo?: string;
  editavel: boolean;
  aoMudar: (v: number) => void;
}) {
  return (
    <label className="block rounded-xl border border-violet-500/20 bg-[#120F1D]/70 p-3">
      <span className="mb-0.5 block text-[10px] uppercase tracking-wider text-violet-300/60">
        {rotulo}
      </span>
      {editavel ? (
        <input
          type="number"
          value={valor}
          onChange={(e) => aoMudar(Number(e.target.value))}
          className="w-full bg-transparent font-[Cinzel,serif] text-xl text-violet-50 focus:outline-none"
        />
      ) : (
        <span className="cinzel block text-xl text-violet-50">
          {valor}
          {sufixo}
        </span>
      )}
      {extra !== 0 && (
        <span className="text-[10px] text-emerald-400">
          {formatarBonus(extra)} do equipamento = {valor + extra}
        </span>
      )}
    </label>
  );
}

function Texto({
  rotulo,
  valor,
  editavel,
  destaque = false,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  editavel: boolean;
  destaque?: boolean;
  aoMudar: (v: string) => void;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        destaque ? "border-amber-400/25 bg-amber-400/5" : "border-violet-500/20 bg-[#120F1D]/70"
      }`}
    >
      <p
        className={`mb-2 text-[10px] uppercase tracking-[0.2em] ${
          destaque ? "text-amber-300/70" : "text-violet-300/60"
        }`}
      >
        {rotulo}
      </p>
      {editavel ? (
        <textarea
          value={valor}
          onChange={(e) => aoMudar(e.target.value)}
          rows={5}
          className="w-full resize-y rounded-lg border border-violet-500/20 bg-black/40 p-2 text-sm text-violet-100 focus:border-violet-400/60 focus:outline-none"
        />
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-violet-200/70">
          {valor || <span className="text-violet-300/30">vazio</span>}
        </p>
      )}
    </div>
  );
}
