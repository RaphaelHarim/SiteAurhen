"use client";

import { useCallback, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { EquipSlot, InventoryItem } from "@/lib/types";

/**
 * Estado do inventário com atualização otimista.
 *
 * O arrastar precisa responder na hora. Se a interface esperasse a
 * resposta do servidor a cada peça movida, o atraso apareceria como
 * travamento. Então o estado local muda primeiro, a chamada vai depois,
 * e se o servidor recusar o estado volta ao que era.
 */
export function useInventory(inicial: InventoryItem[]) {
  const [itens, setItens] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const supabase = criarClienteNavegador();

  const aplicar = useCallback(
    async (
      otimista: (atual: InventoryItem[]) => InventoryItem[],
      chamada: () => Promise<{ error: { message: string } | null }>
    ) => {
      const anterior = itens;
      setItens(otimista(itens));
      setErro(null);

      const { error } = await chamada();
      if (error) {
        setItens(anterior);
        setErro(error.message);
      }
    },
    [itens]
  );

  const primeiraLivre = useCallback(
    (ignorar?: string) => {
      const ocupadas = new Set(
        itens
          .filter((i) => !i.is_equipped && i.grid_position !== null && i.id !== ignorar)
          .map((i) => i.grid_position)
      );
      for (let i = 0; i < 25; i++) if (!ocupadas.has(i)) return i;
      return null;
    },
    [itens]
  );

  const equipar = useCallback(
    (itemId: string, slot: EquipSlot) =>
      aplicar(
        (atual) => {
          const livre = primeiraLivre(itemId);
          return atual.map((i) => {
            if (i.id === itemId)
              return { ...i, is_equipped: true, slot_type: slot, grid_position: null };
            if (i.is_equipped && i.slot_type === slot)
              return { ...i, is_equipped: false, grid_position: livre };
            return i;
          });
        },
        () => supabase.rpc("equipar_item", { p_item: itemId, p_slot: slot })
      ),
    [aplicar, primeiraLivre, supabase]
  );

  const desequipar = useCallback(
    (itemId: string, pos: number) =>
      aplicar(
        (atual) =>
          atual.map((i) =>
            i.id === itemId ? { ...i, is_equipped: false, grid_position: pos } : i
          ),
        () => supabase.rpc("desequipar_item", { p_item: itemId, p_pos: pos })
      ),
    [aplicar, supabase]
  );

  const mover = useCallback(
    (itemId: string, pos: number) =>
      aplicar(
        (atual) => {
          const alvo = atual.find((i) => i.id === itemId);
          const ocupante = atual.find(
            (i) => !i.is_equipped && i.grid_position === pos && i.id !== itemId
          );
          return atual.map((i) => {
            if (i.id === itemId) return { ...i, grid_position: pos };
            if (ocupante && i.id === ocupante.id)
              return { ...i, grid_position: alvo?.grid_position ?? null };
            return i;
          });
        },
        () => supabase.rpc("mover_item", { p_item: itemId, p_pos: pos })
      ),
    [aplicar, supabase]
  );

  return { itens, erro, equipar, desequipar, mover, limparErro: () => setErro(null) };
}
