"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  FlaskConical,
  Footprints,
  Gem,
  Hand,
  Shield,
  Shirt,
  Sparkles,
  Swords,
  Wallet,
  Wind,
} from "lucide-react";
import { useInventory } from "@/lib/hooks/useInventory";
import type { EquipSlot, InventoryItem, StatKey } from "@/lib/types";
import DetalheItem from "./DetalheItem";
import {
  RARITY_LABELS,
  RARITY_STYLE,
  SLOT_LABELS,
  SLOTS_RAPIDOS,
  STAT_LABELS,
  TAMANHO_MOCHILA,
  formatarBonus,
} from "@/lib/types";

const COLUNA_ESQ: EquipSlot[] = ["head", "cloak", "chest", "gloves", "feet"];
const COLUNA_DIR: EquipSlot[] = ["amulet", "main_hand", "off_hand", "ring1", "ring2", "belt"];

const ICONE: Record<EquipSlot, typeof Crown> = {
  head: Crown,
  cloak: Wind,
  chest: Shirt,
  gloves: Hand,
  feet: Footprints,
  amulet: Sparkles,
  main_hand: Swords,
  off_hand: Shield,
  ring1: Gem,
  ring2: Gem,
  belt: Wallet,
  quick1: FlaskConical,
  quick2: FlaskConical,
  quick3: FlaskConical,
};

function cabe(item: InventoryItem, destino: EquipSlot) {
  if (item.slot_type === "ring1" || item.slot_type === "ring2")
    return destino === "ring1" || destino === "ring2";
  // qualquer coisa da mochila pode virar atalho rápido
  if (SLOTS_RAPIDOS.includes(destino)) return true;
  return item.slot_type === destino;
}

export default function PainelEquipamento({
  itensIniciais,
  ouroInicial = 0,
  aoMudarBonus,
}: {
  itensIniciais: InventoryItem[];
  ouroInicial?: number;
  aoMudarBonus?: (itens: InventoryItem[]) => void;
}) {
  const { itens, erro, equipar, desequipar, mover, substituir } = useInventory(itensIniciais);
  const [arrastando, setArrastando] = useState<InventoryItem | null>(null);
  const [dica, setDica] = useState<{ item: InventoryItem; x: number; y: number } | null>(null);
  const [aberto, setAberto] = useState<InventoryItem | null>(null);
  const [ouro, setOuro] = useState(ouroInicial);

  useEffect(() => {
    aoMudarBonus?.(itens);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens]);

  const equipados = useMemo(() => {
    const m = {} as Record<EquipSlot, InventoryItem | undefined>;
    itens.forEach((i) => {
      if (i.is_equipped && i.slot_type !== "backpack") m[i.slot_type as EquipSlot] = i;
    });
    return m;
  }, [itens]);

  const mochila = useMemo(() => {
    const c = Array<InventoryItem | undefined>(TAMANHO_MOCHILA).fill(undefined);
    itens.forEach((i) => {
      if (!i.is_equipped && i.grid_position !== null && i.grid_position < TAMANHO_MOCHILA) {
        c[i.grid_position] = i;
      }
    });
    return c;
  }, [itens]);

  function clicar(item: InventoryItem) {
    if (item.is_equipped) {
      const livre = mochila.findIndex((c) => !c);
      if (livre >= 0) desequipar(item.id, livre);
      return;
    }
    if (item.slot_type === "backpack") return;
    const alvo = item.slot_type as EquipSlot;
    if (alvo === "ring1" && equipados.ring1 && !equipados.ring2) equipar(item.id, "ring2");
    else equipar(item.id, alvo);
  }

  const Slot = ({ slot, pequeno = false }: { slot: EquipSlot; pequeno?: boolean }) => {
    const item = equipados[slot];
    const r = item ? RARITY_STYLE[item.rarity] : null;
    const aceita = !!arrastando && !arrastando.is_equipped && cabe(arrastando, slot);
    const Icone = ICONE[slot];
    const tamanho = pequeno ? "h-11 w-11" : "h-[3.1rem] w-[3.1rem]";

    return (
      <motion.button
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.96 }}
        draggable={!!item}
        onDragStart={() => item && setArrastando(item)}
        onDragEnd={() => setArrastando(null)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => {
          if (aceita && arrastando) equipar(arrastando.id, slot);
          setArrastando(null);
        }}
        onClick={() => item && clicar(item)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (item) setAberto(item);
        }}
        onMouseEnter={(e) => item && setDica({ item, x: e.clientX, y: e.clientY })}
        onMouseLeave={() => setDica(null)}
        aria-label={item ? `${SLOT_LABELS[slot]}: ${item.name}` : `${SLOT_LABELS[slot]} vazio`}
        title={SLOT_LABELS[slot]}
        className={`${tamanho} rounded-xl border-2 transition-colors
          ${item ? `${r!.border} ${r!.bg} ${r!.glow}` : "border-violet-500/20 bg-black/40"}
          ${aceita ? "!border-dashed !border-emerald-400/80 !bg-emerald-400/10" : ""}`}
      >
        <Icone className={`mx-auto ${pequeno ? "h-5 w-5" : "h-6 w-6"} ${item ? r!.text : "text-violet-400/25"}`} />
      </motion.button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-1.5">
        <span className="text-[10px] uppercase tracking-wider text-amber-300/70">Ouro</span>
        <span className="text-sm text-amber-200">{ouro.toLocaleString("pt-BR")} po</span>
      </div>

      {erro && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {erro}
        </p>
      )}

      {/* equipamento */}
      <div className="flex justify-between gap-2">
        <div className="flex flex-col gap-2">
          {COLUNA_ESQ.map((s) => (
            <Slot key={s} slot={s} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {COLUNA_DIR.map((s) => (
            <Slot key={s} slot={s} />
          ))}
        </div>
      </div>

      {/* atalhos rápidos */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-violet-300/50">
          Consumo rápido
        </p>
        <div className="flex justify-center gap-2">
          {SLOTS_RAPIDOS.map((s) => (
            <Slot key={s} slot={s} pequeno />
          ))}
        </div>
      </div>

      {/* mochila */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/50">Mochila</p>
          <span className="text-[10px] text-violet-300/40">
            {mochila.filter(Boolean).length}/{TAMANHO_MOCHILA}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {mochila.map((item, i) => {
            const r = item ? RARITY_STYLE[item.rarity] : null;
            return (
              <motion.button
                key={i}
                whileHover={{ scale: item ? 1.1 : 1 }}
                draggable={!!item}
                onDragStart={() => item && setArrastando(item)}
                onDragEnd={() => setArrastando(null)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!arrastando) return;
                  if (arrastando.is_equipped) desequipar(arrastando.id, i);
                  else mover(arrastando.id, i);
                  setArrastando(null);
                }}
                onClick={() => item && clicar(item)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  if (item) setAberto(item);
                }}
                onMouseEnter={(e) => item && setDica({ item, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setDica(null)}
                aria-label={item ? item.name : `Espaço ${i + 1} vazio`}
                className={`relative aspect-square rounded-lg border transition-colors
                  ${item ? `${r!.border} ${r!.bg}` : "border-violet-500/15 bg-black/40"}
                  ${!item && arrastando ? "border-dashed border-emerald-400/50" : ""}`}
              >
                {item && <Gem className={`mx-auto h-3.5 w-3.5 ${r!.text}`} />}
                {item && item.quantity > 1 && (
                  <span className="absolute bottom-0 right-0.5 text-[9px] text-violet-100">
                    {item.quantity}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {aberto && (
          <DetalheItem
            item={aberto}
            ouro={ouro}
            aoFechar={() => setAberto(null)}
            aoAtualizar={(novo, ouroNovo) => {
              substituir(novo);
              setOuro(ouroNovo);
              setAberto(novo);
            }}
          />
        )}
      </AnimatePresence>

      {dica && !aberto && (
        <div
          style={{ left: dica.x + 14, top: dica.y + 14 }}
          className={`pointer-events-none fixed z-50 w-60 rounded-xl border bg-[#0A0910]/95 p-3 backdrop-blur ${RARITY_STYLE[dica.item.rarity].border}`}
        >
          <p className={`cinzel text-sm ${RARITY_STYLE[dica.item.rarity].text}`}>{dica.item.name}</p>
          <p className="mb-2 text-[10px] uppercase tracking-wider text-violet-300/50">
            {RARITY_LABELS[dica.item.rarity]}
            {dica.item.slot_type !== "backpack" &&
              ` · ${SLOT_LABELS[dica.item.slot_type as EquipSlot] ?? ""}`}
          </p>
          {Object.entries(dica.item.stats_bonus).map(([k, v]) => (
            <p key={k} className="flex justify-between text-xs">
              <span className="text-violet-200/70">{STAT_LABELS[k as StatKey]}</span>
              <span className="text-emerald-400">{formatarBonus(v as number)}</span>
            </p>
          ))}
          {dica.item.description && (
            <p className="mt-2 text-xs text-violet-200/60">{dica.item.description}</p>
          )}
        </div>
      )}

      <p className="text-center text-[10px] text-violet-300/40">
        Clique para equipar. Botão direito abre a melhoria.
      </p>
    </div>
  );
}
