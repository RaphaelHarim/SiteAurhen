"use client";

import { useEffect, useState } from "react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { MapToken } from "@/lib/types";

export interface Mapa {
  id: string;
  name: string;
  background_url: string | null;
  is_active: boolean;
}

/**
 * Mantém o mapa ativo e seus tokens sincronizados entre todo mundo.
 *
 * As posições são guardadas em porcentagem (0 a 100) da largura e da
 * altura da imagem, não em pixels. Assim o token cai no mesmo ponto do
 * mapa num celular de 360px e num monitor de 2560px, e continua certo
 * se o mestre trocar a imagem por uma de outra resolução.
 */
export function useMapaRealtime(mapaInicial: Mapa | null, tokensIniciais: MapToken[]) {
  const [mapa, setMapa] = useState(mapaInicial);
  const [tokens, setTokens] = useState(tokensIniciais);

  useEffect(() => {
    const supabase = criarClienteNavegador();

    const canal = supabase
      .channel("mapa-aurhen")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "map_tokens" },
        (payload) => {
          setTokens((atual) => {
            if (payload.eventType === "DELETE") {
              return atual.filter((t) => t.id !== (payload.old as MapToken).id);
            }
            const novo = payload.new as MapToken;
            const existe = atual.some((t) => t.id === novo.id);
            return existe
              ? atual.map((t) => (t.id === novo.id ? novo : t))
              : [...atual, novo];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "maps" },
        async (payload) => {
          const novo = payload.new as Mapa;
          if (!novo?.is_active) return;

          setMapa(novo);
          // o mapa mudou: recarrega os tokens dele
          const { data } = await supabase
            .from("map_tokens")
            .select("*")
            .eq("map_id", novo.id)
            .returns<MapToken[]>();
          setTokens(data ?? []);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return { mapa, tokens, setTokens, setMapa };
}
