export type UserRole = "mestre" | "jogador";

export type Rarity = "comum" | "raro" | "epico" | "lendario";

export type EquipSlot =
  | "head"
  | "cloak"
  | "chest"
  | "feet"
  | "amulet"
  | "main_hand"
  | "off_hand"
  | "ring1"
  | "ring2"
  | "gloves";

export type SlotType = EquipSlot | "backpack";

export type TokenType = "player" | "boss" | "chest";

/** Chaves aceitas em stats_bonus. Valores são somados aos do personagem. */
export type StatKey =
  | "str"
  | "agi"
  | "vit"
  | "int"
  | "wis"
  | "pre"
  | "armor_class"
  | "magic_res"
  | "initiative"
  | "speed"
  | "max_pv"
  | "max_pm";

export type StatsBonus = Partial<Record<StatKey, number>>;

export interface Character {
  id: string;
  user_id: string;
  name: string;
  class: string | null;
  race: string | null;
  level: number;
  xp: number;
  max_pv: number;
  current_pv: number;
  max_pm: number;
  current_pm: number;
  max_effort: number;
  current_effort: number;
  str: number;
  agi: number;
  vit: number;
  int: number;
  wis: number;
  pre: number;
  armor_class: number;
  magic_res: number;
  initiative: number;
  speed: number;
  portrait_url: string | null;
}

export interface InventoryItem {
  id: string;
  character_id: string;
  name: string;
  description: string | null;
  rarity: Rarity;
  slot_type: SlotType;
  stats_bonus: StatsBonus;
  icon_url: string | null;
  is_equipped: boolean;
  grid_position: number | null;
  quantity: number;
}

export interface MapToken {
  id: string;
  map_id: string;
  character_id: string | null;
  token_type: TokenType;
  label: string;
  pos_x: number;
  pos_y: number;
  icon_url: string | null;
  is_visible: boolean;
  payload: Record<string, unknown>;
}

export const STAT_LABELS: Record<StatKey, string> = {
  str: "Força",
  agi: "Agilidade",
  vit: "Vitalidade",
  int: "Inteligência",
  wis: "Sabedoria",
  pre: "Presença",
  armor_class: "Defesa",
  magic_res: "Resistência mágica",
  initiative: "Iniciativa",
  speed: "Deslocamento",
  max_pv: "PV máximo",
  max_pm: "PM máximo",
};

export const RARITY_LABELS: Record<Rarity, string> = {
  comum: "Comum",
  raro: "Raro",
  epico: "Épico",
  lendario: "Lendário",
};

/** Cor, brilho e borda de cada raridade. Usado em slots e tooltips. */
export const RARITY_STYLE: Record<
  Rarity,
  { text: string; border: string; glow: string; bg: string }
> = {
  comum: {
    text: "text-zinc-300",
    border: "border-zinc-600/70",
    glow: "",
    bg: "bg-zinc-500/10",
  },
  raro: {
    text: "text-sky-300",
    border: "border-sky-500/70",
    glow: "shadow-[0_0_14px_-2px_rgba(56,189,248,0.55)]",
    bg: "bg-sky-500/10",
  },
  epico: {
    text: "text-violet-300",
    border: "border-violet-500/80",
    glow: "shadow-[0_0_18px_-2px_rgba(168,85,247,0.7)]",
    bg: "bg-violet-500/10",
  },
  lendario: {
    text: "text-amber-300",
    border: "border-amber-400/80",
    glow: "shadow-[0_0_22px_-1px_rgba(224,184,76,0.75)]",
    bg: "bg-amber-400/10",
  },
};

export const SLOT_LABELS: Record<EquipSlot, string> = {
  head: "Cabeça",
  cloak: "Manto",
  chest: "Peitoral",
  feet: "Pés",
  amulet: "Amuleto",
  main_hand: "Mão principal",
  off_hand: "Mão secundária",
  ring1: "Anel",
  ring2: "Anel",
  gloves: "Luvas",
};

/** Soma os bônus de todas as peças equipadas. */
export function somarBonus(itens: InventoryItem[]): StatsBonus {
  return itens
    .filter((i) => i.is_equipped)
    .reduce<StatsBonus>((acc, item) => {
      for (const [chave, valor] of Object.entries(item.stats_bonus)) {
        const k = chave as StatKey;
        acc[k] = (acc[k] ?? 0) + (valor ?? 0);
      }
      return acc;
    }, {});
}

export function formatarBonus(valor: number): string {
  return valor >= 0 ? `+${valor}` : `${valor}`;
}
