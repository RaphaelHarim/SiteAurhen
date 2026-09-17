"use client";

import { useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, MapPin, Plus, Skull, Box } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Mapa } from "@/lib/hooks/useMapaRealtime";
import type { TokenType } from "@/lib/types";

export default function BarraMestre({ mapa, mapas }: { mapa: Mapa | null; mapas: Mapa[] }) {
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [passo, setPasso] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const [colando, setColando] = useState(false);
  const [url, setUrl] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoTipo, setNovoTipo] = useState<TokenType>("boss");
  const arquivoRef = useRef<HTMLInputElement>(null);
  const supabase = criarClienteNavegador();

  async function ativar(id: string) {
    await supabase.from("maps").update({ is_active: false }).eq("is_active", true);
    await supabase.from("maps").update({ is_active: true }).eq("id", id);
  }

  async function criarMapa(nome: string, endereco: string) {
    await supabase.from("maps").update({ is_active: false }).eq("is_active", true);
    const { error } = await supabase
      .from("maps")
      .insert({ name: nome, background_url: endereco, is_active: true });
    if (error) throw error;
  }

  async function subirArquivo(arquivo: File) {
    setOcupado(true);
    setErro(null);

    try {
      if (!arquivo.type.startsWith("image/")) {
        throw new Error("Isso não é uma imagem.");
      }
      if (arquivo.size > 25 * 1024 * 1024) {
        throw new Error(
          `A imagem tem ${(arquivo.size / 1024 / 1024).toFixed(1)} MB. Salve como JPG ou WebP antes de subir.`
        );
      }

      setPasso("enviando a imagem…");
      const caminho = `${Date.now()}-${arquivo.name.replace(/[^\w.-]/g, "_")}`;
      const { error: erroUpload } = await supabase.storage
        .from("maps")
        .upload(caminho, arquivo, { cacheControl: "3600", upsert: true });

      if (erroUpload) throw erroUpload;

      setPasso("registrando o mapa…");
      const { data } = supabase.storage.from("maps").getPublicUrl(caminho);
      await criarMapa(arquivo.name.replace(/\.[^.]+$/, ""), data.publicUrl);

      setPasso(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErro(
        msg.includes("row-level security") || msg.includes("Unauthorized")
          ? "O storage está sem permissão de escrita. Rode o storage-aurhen.sql no SQL Editor."
          : msg.includes("Bucket not found")
            ? "O bucket 'maps' não existe. Rode o storage-aurhen.sql no SQL Editor."
            : msg
      );
      setPasso(null);
    } finally {
      setOcupado(false);
    }
  }

  async function usarUrl() {
    if (!url.trim()) return;
    setOcupado(true);
    setErro(null);
    try {
      await criarMapa("Mapa de Aurhen", url.trim());
      setUrl("");
      setColando(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setOcupado(false);
    }
  }

  async function criarToken() {
    if (!novoNome.trim() || !mapa) return;
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
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setArrastando(true);
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastando(false);
        const arquivo = e.dataTransfer.files?.[0];
        if (arquivo) subirArquivo(arquivo);
      }}
      className={`rounded-xl border p-3 backdrop-blur transition ${
        arrastando
          ? "border-emerald-400/70 bg-emerald-400/10"
          : "border-violet-500/25 bg-[#120F1D]/80"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <MapPin className="h-4 w-4 text-violet-400" />

        {mapas.length > 0 && (
          <select
            value={mapa?.id ?? ""}
            onChange={(e) => ativar(e.target.value)}
            className="rounded-lg border border-violet-500/25 bg-black/50 px-3 py-1.5 text-sm text-violet-100"
          >
            {mapas.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => arquivoRef.current?.click()}
          disabled={ocupado}
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 px-3 py-1.5 text-sm text-violet-200 hover:bg-violet-500/10 disabled:opacity-50"
        >
          {ocupado ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          Subir mapa
        </button>

        <button
          onClick={() => setColando(!colando)}
          className="flex items-center gap-1.5 rounded-lg border border-violet-500/30 px-3 py-1.5 text-sm text-violet-200 hover:bg-violet-500/10"
          title="Usar um endereço de imagem que já está na internet"
        >
          <Link2 className="h-4 w-4" />
          Colar link
        </button>

        <input
          ref={arquivoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && subirArquivo(e.target.files[0])}
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
          disabled={!mapa}
          className="w-36 rounded-lg border border-violet-500/25 bg-black/50 px-3 py-1.5 text-sm text-violet-100 placeholder:text-violet-400/30 disabled:opacity-40"
        />

        <button
          onClick={criarToken}
          disabled={ocupado || !novoNome.trim() || !mapa}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-sm text-white transition hover:bg-violet-500 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Colocar
        </button>
      </div>

      {colando && (
        <div className="mt-2 flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && usarUrl()}
            placeholder="https://… endereço da imagem do mapa"
            className="flex-1 rounded-lg border border-violet-500/25 bg-black/50 px-3 py-1.5 text-sm text-violet-100 placeholder:text-violet-400/30"
          />
          <button
            onClick={usarUrl}
            disabled={ocupado || !url.trim()}
            className="rounded-lg bg-violet-600 px-4 py-1.5 text-sm text-white disabled:opacity-40"
          >
            Usar
          </button>
        </div>
      )}

      {passo && <p className="mt-2 text-xs text-violet-300/60">{passo}</p>}

      {erro && (
        <p className="mt-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
          {erro}
        </p>
      )}

      <p className="mt-2 text-xs text-violet-300/40">
        Arraste a imagem para cá, ou use os botões. Chefes nascem escondidos dos jogadores.
      </p>
    </div>
  );
}
