"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Gift, Loader2, Plus, Trash2 } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Character, GameItem, Rarity, SlotType, StatKey } from "@/lib/types";
import { RARITY_LABELS, RARITY_STYLE, SLOT_LABELS, STAT_LABELS, formatarBonus } from "@/lib/types";

const RARIDADES: Rarity[] = ["comum", "raro", "epico", "lendario"];

const SLOTS: SlotType[] = [
  "backpack",
  "head",
  "cloak",
  "chest",
  "gloves",
  "feet",
  "amulet",
  "main_hand",
  "off_hand",
  "ring1",
  "belt",
];

const ATRIBUTOS: StatKey[] = [
  "str",
  "agi",
  "vit",
  "int",
  "wis",
  "pre",
  "armor_class",
  "magic_res",
  "initiative",
  "max_pv",
  "max_pm",
];

export default function CatalogoItens({
  itensIniciais,
  personagens,
}: {
  itensIniciais: GameItem[];
  personagens: Character[];
}) {
  const [itens, setItens] = useState(itensIniciais);
  const [criando, setCriando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    rarity: "comum" as Rarity,
    slot_type: "backpack" as SlotType,
    bonus: {} as Record<string, number>,
  });

  const supabase = criarClienteNavegador();

  async function criar() {
    if (!form.name.trim()) return;
    setOcupado(true);
    setErro(null);

    const { data, error } = await supabase
      .from("game_items")
      .insert({
        name: form.name.trim(),
        description: form.description.trim() || null,
        rarity: form.rarity,
        slot_type: form.slot_type,
        stats_bonus: form.bonus,
      })
      .select()
      .single<GameItem>();

    setOcupado(false);
    if (error) {
      setErro(error.message);
      return;
    }

    setItens([data, ...itens]);
    setForm({ name: "", description: "", rarity: "comum", slot_type: "backpack", bonus: {} });
    setCriando(false);
  }

  async function apagar(id: string) {
    const anterior = itens;
    setItens(itens.filter((i) => i.id !== id));
    const { error } = await supabase.from("game_items").delete().eq("id", id);
    if (error) {
      setItens(anterior);
      setErro(error.message);
    }
  }

  async function entregar(itemId: string, charId: string, nome: string, para: string) {
    setOcupado(true);
    setErro(null);
    const { error } = await supabase.rpc("dar_item", { p_char: charId, p_modelo: itemId });
    setOcupado(false);

    if (error) {
      setErro(error.message);
      return;
    }
    setAviso(`${nome} entregue para ${para}.`);
    setTimeout(() => setAviso(null), 4000);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="cinzel text-lg text-violet-100">Catálogo de itens</h2>
          <p className="text-xs text-violet-300/50">
            O que você cria aqui vira modelo. Entregar copia o item para a mochila do jogador.
          </p>
        </div>
        <button
          onClick={() => setCriando(!criando)}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white transition hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Novo item
        </button>
      </div>

      {aviso && (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {aviso}
        </p>
      )}
      {erro && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {erro}
        </p>
      )}

      {/* formulário */}
      {criando && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="overflow-hidden rounded-xl border border-violet-500/25 bg-[#120F1D]/80 p-4"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-violet-300/70">Nome</span>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Lâmina Vazia"
                className="w-full rounded-lg border border-violet-500/25 bg-black/50 px-3 py-2 text-sm text-violet-100"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-violet-300/70">Raridade</span>
              <select
                value={form.rarity}
                onChange={(e) => setForm({ ...form, rarity: e.target.value as Rarity })}
                className="w-full rounded-lg border border-violet-500/25 bg-black/50 px-3 py-2 text-sm text-violet-100"
              >
                {RARIDADES.map((r) => (
                  <option key={r} value={r}>
                    {RARITY_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs text-violet-300/70">Onde equipa</span>
              <select
                value={form.slot_type}
                onChange={(e) => setForm({ ...form, slot_type: e.target.value as SlotType })}
                className="w-full rounded-lg border border-violet-500/25 bg-black/50 px-3 py-2 text-sm text-violet-100"
              >
                <option value="backpack">Não equipa (consumível)</option>
                {SLOTS.filter((s) => s !== "backpack").map((s) => (
                  <option key={s} value={s}>
                    {SLOT_LABELS[s as keyof typeof SLOT_LABELS]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs text-violet-300/70">Descrição</span>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                placeholder="Lendária adormecida: acorda com a Afinidade."
                className="w-full rounded-lg border border-violet-500/25 bg-black/50 px-3 py-2 text-sm text-violet-100"
              />
            </label>

            <div className="sm:col-span-2">
              <span className="mb-2 block text-xs text-violet-300/70">Bônus</span>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {ATRIBUTOS.map((a) => (
                  <label key={a} className="flex items-center gap-1.5">
                    <span className="flex-1 truncate text-[10px] text-violet-300/60">
                      {STAT_LABELS[a]}
                    </span>
                    <input
                      type="number"
                      value={form.bonus[a] ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        const novo = { ...form.bonus };
                        if (v === "" || v === "0") delete novo[a];
                        else novo[a] = Number(v);
                        setForm({ ...form, bonus: novo });
                      }}
                      className="w-12 rounded border border-violet-500/25 bg-black/50 px-1 py-1 text-center text-xs text-violet-100"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={criar}
            disabled={ocupado || !form.name.trim()}
            className="mt-4 flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Salvar no catálogo
          </button>
        </motion.div>
      )}

      {/* lista */}
      {itens.length === 0 ? (
        <p className="rounded-xl border border-dashed border-violet-500/25 p-8 text-center text-sm text-violet-300/50">
          O catálogo está vazio. Crie o primeiro item.
        </p>
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {itens.map((item) => {
            const r = RARITY_STYLE[item.rarity];
            const bonus = Object.entries(item.stats_bonus);
            return (
              <article
                key={item.id}
                className={`rounded-xl border bg-[#120F1D]/70 p-3.5 ${r.border}`}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div>
                    <p className={`cinzel text-sm ${r.text}`}>{item.name}</p>
                    <p className="text-[10px] uppercase tracking-wider text-violet-300/50">
                      {RARITY_LABELS[item.rarity]}
                      {item.slot_type !== "backpack" &&
                        ` · ${SLOT_LABELS[item.slot_type as keyof typeof SLOT_LABELS]}`}
                    </p>
                  </div>
                  <button
                    onClick={() => apagar(item.id)}
                    className="text-violet-300/40 transition hover:text-rose-400"
                    aria-label={`Apagar ${item.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {bonus.length > 0 && (
                  <p className="mb-2 flex flex-wrap gap-x-3 text-[11px] text-emerald-400/90">
                    {bonus.map(([k, v]) => (
                      <span key={k}>
                        {STAT_LABELS[k as StatKey]} {formatarBonus(v as number)}
                      </span>
                    ))}
                  </p>
                )}

                {item.description && (
                  <p className="mb-2.5 text-xs text-violet-200/60">{item.description}</p>
                )}

                <div className="flex items-center gap-1.5 border-t border-violet-500/15 pt-2.5">
                  <Gift className="h-3.5 w-3.5 text-violet-400/70" />
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const p = personagens.find((c) => c.id === e.target.value);
                      if (p) entregar(item.id, p.id, item.name, p.name);
                      e.target.value = "";
                    }}
                    disabled={ocupado || personagens.length === 0}
                    className="flex-1 rounded border border-violet-500/25 bg-black/40 px-2 py-1 text-xs text-violet-100"
                  >
                    <option value="">entregar para…</option>
                    {personagens.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
