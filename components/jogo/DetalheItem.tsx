"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpCircle, Coins, Loader2, Sparkles, X } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { EquipSlot, InventoryItem, Rarity, StatKey } from "@/lib/types";
import { RARITY_LABELS, RARITY_STYLE, SLOT_LABELS, STAT_LABELS, formatarBonus } from "@/lib/types";

const TETO: Record<Rarity, number> = { comum: 1, raro: 2, epico: 3, lendario: 3 };

const GRUPO_PESO: Record<string, number> = {
  ring1: 0.75, ring2: 0.75, amulet: 0.75, cloak: 0.75, belt: 0.75, gloves: 0.75,
  quick1: 0.75, quick2: 0.75, quick3: 0.75, backpack: 0.75,
  chest: 1.25, feet: 1.25, head: 1.25,
  off_hand: 0.5,
};

const BASE: Record<Rarity, number> = { comum: 200, raro: 750, epico: 1250, lendario: 2000 };

/** Mesma conta do banco, repetida aqui só para mostrar o preço antes de clicar. */
export function custoUp(raridade: Rarity, slot: string) {
  return Math.round(BASE[raridade] * (GRUPO_PESO[slot] ?? 1));
}

const CUSTO_TRANSMUTACAO: Partial<Record<Rarity, number>> = { comum: 5000, raro: 15000 };

const MARCOS = [
  "bônus numérico",
  "mecânica exclusiva da categoria",
  "técnica — 1x por descanso curto",
  "passiva permanente",
  "Despertar — a habilidade máxima",
];

export default function DetalheItem({
  item,
  ouro,
  aoFechar,
  aoAtualizar,
}: {
  item: InventoryItem & { up_level?: number };
  ouro: number;
  aoFechar: () => void;
  aoAtualizar: (item: InventoryItem & { up_level: number }, ouroNovo: number) => void;
}) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = criarClienteNavegador();

  const nivel = item.up_level ?? 0;
  const r = RARITY_STYLE[item.rarity];
  const teto = TETO[item.rarity];
  const bonusAtual = Math.min(nivel, teto);
  const custo = custoUp(item.rarity, item.slot_type);
  const custoRar = CUSTO_TRANSMUTACAO[item.rarity];

  async function subirUp() {
    setOcupado(true);
    setErro(null);
    const { data, error } = await supabase.rpc("subir_up", { p_item: item.id });
    setOcupado(false);
    if (error) {
      setErro(error.message);
      return;
    }
    aoAtualizar({ ...item, up_level: data.up_level }, data.ouro_restante);
  }

  async function subirRaridade() {
    setOcupado(true);
    setErro(null);
    const { data, error } = await supabase.rpc("subir_raridade", { p_item: item.id });
    setOcupado(false);
    if (error) {
      setErro(error.message);
      return;
    }
    aoAtualizar({ ...item, rarity: data.raridade, up_level: nivel }, data.ouro_restante);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={aoFechar}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border bg-[#120F1D] p-6 ${r.border} ${r.glow}`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className={`cinzel text-xl ${r.text}`}>{item.name}</h3>
            <p className="text-[11px] uppercase tracking-wider text-violet-300/50">
              {RARITY_LABELS[item.rarity]}
              {item.slot_type !== "backpack" &&
                ` · ${SLOT_LABELS[item.slot_type as EquipSlot] ?? ""}`}
            </p>
          </div>
          <button onClick={aoFechar} className="text-violet-300/60 hover:text-violet-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {item.description && (
          <p className="mb-4 text-sm leading-relaxed text-violet-200/70">{item.description}</p>
        )}

        {/* trilha de UPs */}
        <div className="mb-4">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-[10px] uppercase tracking-[0.2em] text-violet-300/60">
              Melhorias
            </span>
            <span className="text-xs text-violet-200/70">
              UP {nivel} de 5 · bônus {formatarBonus(bonusAtual)}
              {bonusAtual >= teto && nivel >= 1 && (
                <span className="ml-1 text-amber-300/80">teto da raridade</span>
              )}
            </span>
          </div>

          <div className="space-y-1">
            {MARCOS.map((marco, i) => {
              const up = i + 1;
              const feito = nivel >= up;
              return (
                <div
                  key={up}
                  className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                    feito
                      ? "border-violet-500/40 bg-violet-500/10 text-violet-100"
                      : "border-violet-500/15 bg-black/30 text-violet-300/40"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                      feito ? "bg-violet-600 text-white" : "bg-black/50 text-violet-300/50"
                    }`}
                  >
                    {up}
                  </span>
                  {up === 5 ? (
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      {marco}
                    </span>
                  ) : (
                    marco
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* bônus que a peça soma na ficha */}
        {Object.keys(item.stats_bonus).length > 0 && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-emerald-300/70">
              Soma na ficha
            </p>
            {Object.entries(item.stats_bonus).map(([k, v]) => (
              <p key={k} className="flex justify-between text-xs">
                <span className="text-violet-200/70">{STAT_LABELS[k as StatKey]}</span>
                <span className="text-emerald-400">{formatarBonus(v as number)}</span>
              </p>
            ))}
          </div>
        )}

        {erro && (
          <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
            {erro}
          </p>
        )}

        {/* ações */}
        <div className="space-y-2 border-t border-violet-500/15 pt-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-amber-300/80">
              <Coins className="h-3.5 w-3.5" />
              {ouro.toLocaleString("pt-BR")} po
            </span>
          </div>

          {nivel < 5 ? (
            <button
              onClick={subirUp}
              disabled={ocupado || ouro < custo}
              className="flex w-full items-center justify-between rounded-lg bg-violet-600 px-4 py-2.5 text-sm text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="flex items-center gap-2">
                {ocupado ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUpCircle className="h-4 w-4" />
                )}
                Subir para o UP {nivel + 1}
              </span>
              <span className="text-xs opacity-90">{custo.toLocaleString("pt-BR")} po</span>
            </button>
          ) : (
            <p className="rounded-lg border border-violet-500/20 bg-black/30 px-4 py-2.5 text-center text-xs text-violet-300/60">
              No UP 5. Daqui só subindo a raridade.
            </p>
          )}

          {custoRar ? (
            <button
              onClick={subirRaridade}
              disabled={ocupado || ouro < custoRar}
              className="flex w-full items-center justify-between rounded-lg border border-amber-400/40 px-4 py-2.5 text-sm text-amber-200 transition hover:bg-amber-400/10 disabled:opacity-40"
            >
              <span>
                Transmutar para {item.rarity === "comum" ? "Rara" : "Épica"}
              </span>
              <span className="text-xs opacity-90">{custoRar.toLocaleString("pt-BR")} po</span>
            </button>
          ) : item.rarity === "epico" ? (
            <p className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-4 py-2.5 text-center text-xs text-amber-200/70">
              Épica não sobe para lendária. Lendário só se acha.
            </p>
          ) : null}

          <p className="pt-1 text-center text-[10px] text-violet-300/40">
            O UP 5 ainda pede um feito e o catalisador certo, fora do sistema.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
