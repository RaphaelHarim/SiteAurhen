"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, MapPin, Plus, Skull, Box } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import type { TokenType } from "@/lib/types";

export default function BarraMestre({ mapa, mapas }: { mapa: Mapa; mapas: Mapa[] }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<TokenType>("boss");
  const arquivoRef = useRef<HTMLInputElement>(null);
  const supabase = criarClienteNavegador();

  async function trocarMapa(id: string) {
    setOcupado(true);
    // o índice único só deixa um mapa ativo, então desliga os outros antes
    await supabase.from("maps").update({ is_active: false }).eq("is_active", true);
    await supabase.from("maps").update({ is_active: true }).eq("id", id);
    setOcupado(false);
  }

  async function subirMapa(arquivo: File) {
    setOcupado(true);
    setErro(null);

    const caminho = `${Date.now()}-${arquivo.name.replace(/[^\w.-]/g, "_")}`;
    const { error: erroUpload } = await supabase.storage
      .from("maps")
      .upload(caminho, arquivo, { cacheControl: "3600" });

    if (erroUpload) {
      setErro(erroUpload.message);
      setOcupado(false);
      return;
    }

    const { data } = supabase.storage.from("maps").getPublicUrl(caminho);

    await supabase.from("maps").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase.from("maps").insert({
      name: arquivo.name.replace(/\.[^.]+$/, ""),
      background_url: data.publicUrl,
      is_active: true,
    });

    if (error) setErro(error.message);
    setOcupado(false);
  }

  async function criarToken() {
    if (!novoNome.trim()) return;
    setOcupado(true);

    const { error } = await supabase.from("map_tokens").insert({
      map_id: mapa.id,
      token_type: novoTipo,
      label: novoNome.trim(),
      pos_x: 50,
      pos_y: 50,
      is_visible: novoTipo !== "boss",
      payload:
        novoTipo === "boss"
          ? { pv_atual: 100, pv_max: 100, descricao: "" }
          : novoTipo === "chest"
            ? { itens: [] }
            : {},
    });

    if (error) setErro(error.message);
    setNovoNome("");
    setOcupado(false);
  }

  return (
    <div className="rounded-xl border border-violet-500/25 bg-[#120F1D]/80 p-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="h-4 w-4 text-violet-400" />

        <select
          value={mapa.id}
          onChange={(e) => trocarMapa(e.target.value)}
          className="rounded-lg border border-violet-500/25 bg-black/50 px-3 py-1.5 text-sm text-violet-100"
        >
          {mapas.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => arquivoRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 px-3 py-1.5 text-sm text-violet-200 hover:bg-violet-500/10"
        >
          <ImagePlus className="h-4 w-4" />
          Novo mapa
        </button>
        <input
          ref={arquivoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && subirMapa(e.target.files[0])}
        />

        <span className="mx-1 h-5 w-px bg-violet-500/25" />

        <div className="flex items-center gap-1 rounded-lg border border-violet-500/25 bg-black/40 p-0.5">
          {(
            [
              ["boss", Skull, "Chefe"],
              ["chest", Box, "Baú"],
              ["player", MapPin, "Ponto"],
            ] as [TokenType, typeof Skull, string][]
          ).map(([tipo, Icone, rotulo]) => (
            <button
              key={tipo}
              onClick={() => setNovoTipo(tipo)}
              title={rotulo}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition ${
                novoTipo === tipo
                  ? "bg-violet-600 text-white"
                  : "text-violet-300/70 hover:bg-violet-500/10"
              }`}
            >
              <Icone className="h-3.5 w-3.5" />
              {rotulo}
            </button>
          ))}
        </div>

        <input
          value={novoNome}
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && criarToken()}
          placeholder="nome do token"
          className="w-40 rounded-lg border border-violet-500/25 bg-black/50 px-3 py-1.5 text-sm text-violet-100 placeholder:text-violet-400/30"
        />

        <button
          onClick={criarToken}
          disabled={ocupado || !novoNome.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white transition hover:bg-violet-500 disabled:opacity-40"
        >
          {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Colocar
        </button>
      </div>

      {erro && <p className="mt-2 text-xs text-rose-300">{erro}</p>}

      <p className="mt-2 text-xs text-violet-300/40">
        Chefes nascem escondidos dos jogadores. Clique no token para abrir, esconder ou apagar.
      </p>
    </div>
  );
}
