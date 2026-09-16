"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Footprints,
  Gem,
  Hand,
  Shield,
  Shirt,
  Sparkles,
  Swords,
  Wind,
} from "lucide-react";
import {
  Character,
  EquipSlot,
  InventoryItem,
  RARITY_LABELS,
  RARITY_STYLE,
  SLOT_LABELS,
  STAT_LABELS,
  StatKey,
  formatarBonus,
  somarBonus,
} from "@/lib/types";

const BACKPACK_SIZE = 25;

const SLOTS_ESQUERDA: EquipSlot[] = ["head", "cloak", "chest", "feet"];
const SLOTS_DIREITA: EquipSlot[] = [
  "amulet",
  "main_hand",
  "off_hand",
  "ring1",
  "ring2",
  "gloves",
];

const SLOT_ICON: Record<EquipSlot, typeof Crown> = {
  head: Crown,
  cloak: Wind,
  chest: Shirt,
  feet: Footprints,
  amulet: Sparkles,
  main_hand: Swords,
  off_hand: Shield,
  ring1: Gem,
  ring2: Gem,
  gloves: Hand,
};

/** Um item de mochila pode ir para o slot pedido? */
function cabeNoSlot(item: InventoryItem, destino: EquipSlot): boolean {
  if (item.slot_type === "ring1" || item.slot_type === "ring2") {
    return destino === "ring1" || destino === "ring2";
  }
  return item.slot_type === destino;
}

interface Props {
  character: Character;
  items: InventoryItem[];
  /** Equipa um item da mochila no slot indicado. */
  onEquip: (itemId: string, slot: EquipSlot) => void;
  /** Devolve um item equipado para a mochila, na célula indicada. */
  onUnequip: (itemId: string, gridPosition: number) => void;
  /** Move um item entre células da mochila. */
  onMove: (itemId: string, gridPosition: number) => void;
  readOnly?: boolean;
}

export default function CharacterInventory({
  character,
  items,
  onEquip,
  onUnequip,
  onMove,
  readOnly = false,
}: Props) {
  const [arrastando, setArrastando] = useState<InventoryItem | null>(null);
  const [hover, setHover] = useState<{ item: InventoryItem; x: number; y: number } | null>(null);

  const equipados = useMemo(() => {
    const mapa = {} as Record<EquipSlot, InventoryItem | undefined>;
    for (const item of items) {
      if (item.is_equipped && item.slot_type !== "backpack") {
        mapa[item.slot_type as EquipSlot] = item;
      }
    }
    return mapa;
  }, [items]);

  const mochila = useMemo(() => {
    const celulas = Array<InventoryItem | undefined>(BACKPACK_SIZE).fill(undefined);
    for (const item of items) {
      if (!item.is_equipped && item.grid_position !== null) {
        celulas[item.grid_position] = item;
      }
    }
    return celulas;
  }, [items]);

  const bonus = useMemo(() => somarBonus(items), [items]);

  const primeiraCelulaLivre = () => mochila.findIndex((c) => !c);

  function soltarNoSlot(slot: EquipSlot) {
    if (!arrastando || readOnly) return;
    if (arrastando.is_equipped) return;
    if (!cabeNoSlot(arrastando, slot)) return;
    onEquip(arrastando.id, slot);
    setArrastando(null);
  }

  function soltarNaCelula(posicao: number) {
    if (!arrastando || readOnly) return;
    if (mochila[posicao] && mochila[posicao]!.id !== arrastando.id) return;
    if (arrastando.is_equipped) onUnequip(arrastando.id, posicao);
    else onMove(arrastando.id, posicao);
    setArrastando(null);
  }

  function clicar(item: InventoryItem) {
    if (readOnly) return;
    if (item.is_equipped) {
      const livre = primeiraCelulaLivre();
      if (livre >= 0) onUnequip(item.id, livre);
      return;
    }
    if (item.slot_type === "backpack") return;
    const alvo = item.slot_type as EquipSlot;
    if (alvo === "ring1" && equipados.ring1 && !equipados.ring2) onEquip(item.id, "ring2");
    else onEquip(item.id, alvo);
  }

  return (
    <div
      className="relative rounded-2xl border border-violet-500/25 bg-[#120F1D]/80 p-5
                 shadow-[0_0_60px_-20px_rgba(124,58,237,0.6)] backdrop-blur-xl
                 md:p-7"
      onDragEnd={() => setArrastando(null)}
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-[Cinzel,serif] text-2xl tracking-wide text-violet-100">
            {character.name}
          </h2>
          <p className="text-sm text-violet-300/60">
            {character.race ?? "Origem desconhecida"} · {character.class ?? "sem classe"} ·
            nível {character.level}
          </p>
        </div>
        <Recursos character={character} bonus={bonus} />
      </header>

      <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-start">
        <Coluna
          slots={SLOTS_ESQUERDA}
          equipados={equipados}
          arrastando={arrastando}
          onSoltar={soltarNoSlot}
          onArrastar={setArrastando}
          onClicar={clicar}
          onHover={setHover}
          alinhamento="start"
        />

        <Retrato character={character} bonus={bonus} />

        <Coluna
          slots={SLOTS_DIREITA}
          equipados={equipados}
          arrastando={arrastando}
          onSoltar={soltarNoSlot}
          onArrastar={setArrastando}
          onClicar={clicar}
          onHover={setHover}
          alinhamento="end"
        />
      </div>

      <section className="mt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="font-[Cinzel,serif] text-sm tracking-[0.2em] text-violet-200/80">
            MOCHILA
          </h3>
          <span className="text-xs text-violet-300/50">
            {mochila.filter(Boolean).length} de {BACKPACK_SIZE}
          </span>
        </div>

        <div className="grid w-fit grid-cols-5 gap-2">
          {mochila.map((item, i) => (
            <Celula
              key={i}
              item={item}
              indice={i}
              arrastando={arrastando}
              onSoltar={soltarNaCelula}
              onArrastar={setArrastando}
              onClicar={clicar}
              onHover={setHover}
            />
          ))}
        </div>
      </section>

      <AnimatePresence>
        {hover && <Tooltip item={hover.item} x={hover.x} y={hover.y} />}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Recursos({
  character,
  bonus,
}: {
  character: Character;
  bonus: Record<string, number | undefined>;
}) {
  const barras = [
    {
      nome: "Vida",
      atual: character.current_pv,
      max: character.max_pv + (bonus.max_pv ?? 0),
      cor: "from-rose-600 to-rose-400",
    },
    {
      nome: "Mana",
      atual: character.current_pm,
      max: character.max_pm + (bonus.max_pm ?? 0),
      cor: "from-violet-600 to-fuchsia-400",
    },
    {
      nome: "Esforço",
      atual: character.current_effort,
      max: character.max_effort,
      cor: "from-amber-600 to-amber-300",
    },
  ];

  return (
    <div className="flex gap-4">
      {barras.map((b) => (
        <div key={b.nome} className="w-28">
          <div className="mb-1 flex justify-between text-[11px] text-violet-200/70">
            <span>{b.nome}</span>
            <span>
              {b.atual}/{b.max}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-black/50">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${b.cor}`}
              initial={false}
              animate={{ width: `${b.max ? Math.min(100, (b.atual / b.max) * 100) : 0}%` }}
              transition={{ type: "spring", stiffness: 160, damping: 22 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Retrato({
  character,
  bonus,
}: {
  character: Character;
  bonus: Record<string, number | undefined>;
}) {
  const atributos: [StatKey, number][] = [
    ["str", character.str],
    ["agi", character.agi],
    ["vit", character.vit],
    ["int", character.int],
    ["wis", character.wis],
    ["pre", character.pre],
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="absolute -inset-3 rounded-full bg-violet-600/20 blur-2xl" aria-hidden />
        <div
          className="relative h-52 w-52 overflow-hidden rounded-full border-2 border-violet-400/50
                     shadow-[0_0_40px_-8px_rgba(168,85,247,0.8)]"
        >
          {character.portrait_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={character.portrait_url}
              alt={`Retrato de ${character.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0A0910] text-violet-400/40">
              <Sparkles className="h-10 w-10" />
            </div>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 text-center">
        {atributos.map(([chave, base]) => {
          const extra = bonus[chave] ?? 0;
          return (
            <div
              key={chave}
              className="rounded-lg border border-violet-500/20 bg-black/30 px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-wider text-violet-300/60">
                {STAT_LABELS[chave].slice(0, 3)}
              </dt>
              <dd className="font-[Cinzel,serif] text-lg text-violet-50">
                {base + extra}
                {extra !== 0 && (
                  <span className="ml-1 text-xs text-emerald-400">
                    {formatarBonus(extra)}
                  </span>
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="flex gap-3 text-xs text-violet-200/70">
        <Derivada nome="Defesa" valor={character.armor_class + (bonus.armor_class ?? 0)} />
        <Derivada nome="Res. mágica" valor={character.magic_res + (bonus.magic_res ?? 0)} />
        <Derivada nome="Iniciativa" valor={character.initiative + (bonus.initiative ?? 0)} />
        <Derivada nome="Deslocamento" valor={character.speed + (bonus.speed ?? 0)} sufixo=" m" />
      </div>
    </div>
  );
}

function Derivada({ nome, valor, sufixo = "" }: { nome: string; valor: number; sufixo?: string }) {
  return (
    <div className="rounded-md border border-violet-500/15 bg-black/20 px-2 py-1">
      <span className="text-violet-300/50">{nome} </span>
      <span className="font-semibold text-violet-100">
        {valor}
        {sufixo}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */

interface ColunaProps {
  slots: EquipSlot[];
  equipados: Record<EquipSlot, InventoryItem | undefined>;
  arrastando: InventoryItem | null;
  onSoltar: (slot: EquipSlot) => void;
  onArrastar: (item: InventoryItem | null) => void;
  onClicar: (item: InventoryItem) => void;
  onHover: (h: { item: InventoryItem; x: number; y: number } | null) => void;
  alinhamento: "start" | "end";
}

function Coluna({ slots, equipados, arrastando, onSoltar, onArrastar, onClicar, onHover, alinhamento }: ColunaProps) {
  return (
    <div
      className={`flex flex-row flex-wrap justify-center gap-3 lg:flex-col ${
        alinhamento === "end" ? "lg:items-end" : "lg:items-start"
      }`}
    >
      {slots.map((slot) => (
        <SlotEquipamento
          key={slot}
          slot={slot}
          item={equipados[slot]}
          aceitando={!!arrastando && !arrastando.is_equipped && cabeNoSlot(arrastando, slot)}
          onSoltar={() => onSoltar(slot)}
          onArrastar={onArrastar}
          onClicar={onClicar}
          onHover={onHover}
        />
      ))}
    </div>
  );
}

function SlotEquipamento({
  slot,
  item,
  aceitando,
  onSoltar,
  onArrastar,
  onClicar,
  onHover,
}: {
  slot: EquipSlot;
  item?: InventoryItem;
  aceitando: boolean;
  onSoltar: () => void;
  onArrastar: (i: InventoryItem | null) => void;
  onClicar: (i: InventoryItem) => void;
  onHover: (h: { item: InventoryItem; x: number; y: number } | null) => void;
}) {
  const Icone = SLOT_ICON[slot];
  const estilo = item ? RARITY_STYLE[item.rarity] : null;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.97 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onSoltar}
      draggable={!!item}
      onDragStart={() => item && onArrastar(item)}
      onClick={() => item && onClicar(item)}
      onMouseEnter={(e) => item && onHover({ item, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => onHover(null)}
      aria-label={item ? `${SLOT_LABELS[slot]}: ${item.name}` : `${SLOT_LABELS[slot]} vazio`}
      className={`group relative h-16 w-16 rounded-xl border-2 transition-colors
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-violet-400
        ${item ? `${estilo!.border} ${estilo!.bg} ${estilo!.glow}` : "border-violet-500/25 bg-black/40"}
        ${aceitando ? "border-dashed border-emerald-400/80 bg-emerald-400/10" : ""}`}
    >
      {item ? (
        item.icon_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.icon_url} alt="" className="h-full w-full rounded-lg object-cover p-1" />
        ) : (
          <Icone className={`mx-auto h-7 w-7 ${estilo!.text}`} />
        )
      ) : (
        <Icone className="mx-auto h-6 w-6 text-violet-400/25" />
      )}

      <span
        className="pointer-events-none absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap
                   text-[10px] text-violet-300/0 transition-colors group-hover:text-violet-300/70"
      >
        {SLOT_LABELS[slot]}
      </span>
    </motion.button>
  );
}

function Celula({
  item,
  indice,
  arrastando,
  onSoltar,
  onArrastar,
  onClicar,
  onHover,
}: {
  item?: InventoryItem;
  indice: number;
  arrastando: InventoryItem | null;
  onSoltar: (i: number) => void;
  onArrastar: (i: InventoryItem | null) => void;
  onClicar: (i: InventoryItem) => void;
  onHover: (h: { item: InventoryItem; x: number; y: number } | null) => void;
}) {
  const estilo = item ? RARITY_STYLE[item.rarity] : null;
  const livre = !item && !!arrastando;

  return (
    <motion.button
      type="button"
      whileHover={{ scale: item ? 1.07 : 1.02 }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={() => onSoltar(indice)}
      draggable={!!item}
      onDragStart={() => item && onArrastar(item)}
      onClick={() => item && onClicar(item)}
      onMouseEnter={(e) => item && onHover({ item, x: e.clientX, y: e.clientY })}
      onMouseLeave={() => onHover(null)}
      aria-label={item ? item.name : `Espaço ${indice + 1} vazio`}
      className={`relative h-14 w-14 rounded-lg border transition-colors
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
        focus-visible:outline-violet-400
        ${item ? `${estilo!.border} ${estilo!.bg}` : "border-violet-500/15 bg-black/40"}
        ${livre ? "border-dashed border-emerald-400/50" : ""}`}
    >
      {item &&
        (item.icon_url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={item.icon_url} alt="" className="h-full w-full rounded-md object-cover p-1" />
        ) : (
          <Gem className={`mx-auto h-5 w-5 ${estilo!.text}`} />
        ))}

      {item && item.quantity > 1 && (
        <span className="absolute bottom-0.5 right-1 text-[10px] font-semibold text-violet-100">
          {item.quantity}
        </span>
      )}
    </motion.button>
  );
}

function Tooltip({ item, x, y }: { item: InventoryItem; x: number; y: number }) {
  const estilo = RARITY_STYLE[item.rarity];
  const bonus = Object.entries(item.stats_bonus) as [StatKey, number][];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.14 }}
      style={{ left: x + 16, top: y + 16 }}
      className={`pointer-events-none fixed z-50 w-64 rounded-xl border bg-[#0A0910]/95 p-3
                  backdrop-blur-md ${estilo.border} ${estilo.glow}`}
    >
      <p className={`font-[Cinzel,serif] text-sm ${estilo.text}`}>{item.name}</p>
      <p className="mb-2 text-[11px] uppercase tracking-wider text-violet-300/50">
        {RARITY_LABELS[item.rarity]}
        {item.slot_type !== "backpack" && ` · ${SLOT_LABELS[item.slot_type as EquipSlot]}`}
      </p>

      {bonus.length > 0 && (
        <ul className="mb-2 space-y-0.5">
          {bonus.map(([chave, valor]) => (
            <li key={chave} className="flex justify-between text-xs">
              <span className="text-violet-200/70">{STAT_LABELS[chave]}</span>
              <span className="font-semibold text-emerald-400">{formatarBonus(valor)}</span>
            </li>
          ))}
        </ul>
      )}

      {item.description && (
        <p className="text-xs leading-relaxed text-violet-200/60">{item.description}</p>
      )}
    </motion.div>
  );
}
