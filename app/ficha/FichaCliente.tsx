"use client";

import CharacterInventory from "@/components/inventory/CharacterInventory";
import { useInventory } from "@/lib/hooks/useInventory";
import type { Character, InventoryItem } from "@/lib/types";

export default function FichaCliente({
  personagem,
  itensIniciais,
}: {
  personagem: Character;
  itensIniciais: InventoryItem[];
}) {
  const { itens, erro, equipar, desequipar, mover, limparErro } =
    useInventory(itensIniciais);

  return (
    <>
      {erro && (
        <div className="mb-4 flex items-start justify-between gap-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span>{erro}</span>
          <button onClick={limparErro} className="shrink-0 text-rose-300 hover:text-rose-100">
            fechar
          </button>
        </div>
      )}

      <CharacterInventory
        character={personagem}
        items={itens}
        onEquip={equipar}
        onUnequip={desequipar}
        onMove={mover}
      />
    </>
  );
}
