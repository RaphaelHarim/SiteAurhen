"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Dices, Loader2, Minus, Plus, Sparkles } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { Character, StatKey, StatsBonus } from "@/lib/types";
import { STAT_LABELS, formatarBonus } from "@/lib/types";

const RECURSOS = [
  { campo: "current_pv", max: "max_pv", nome: "Vida", cor: "from-rose-600 to-rose-400" },
  { campo: "current_pm", max: "max_pm", nome: "Mana", cor: "from-violet-600 to-fuchsia-400" },
  { campo: "current_effort", max: "max_effort", nome: "Esforço", cor: "from-amber-600 to-amber-300" },
  { campo: "current_sanity", max: "max_sanity", nome: "Sanidade", cor: "from-emerald-600 to-teal-400" },
] as const;

const ATALHOS: [StatKey, string][] = [
  ["str", "FOR"],
  ["agi", "AGI"],
  ["vit", "VIT"],
  ["int", "INT"],
  ["wis", "SAB"],
  ["pre", "PRE"],
];

/**
 * Reduz a imagem para 512px e converte para WebP antes de enviar.
 *
 * Uma foto de celular tem 4 MB e 4000px de largura. Num círculo de
 * 144px isso é desperdício puro: demora para subir, ocupa o storage e
 * atrasa o carregamento da ficha de todo mundo. Depois deste corte
 * sobram uns 40 KB, com a mesma aparência na tela.
 */
async function prepararImagem(arquivo: File): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const lado = Math.min(bitmap.width, bitmap.height);
  const destino = Math.min(512, lado);

  const canvas = document.createElement("canvas");
  canvas.width = destino;
  canvas.height = destino;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não consegui processar a imagem.");

  // recorte quadrado a partir do centro
  ctx.drawImage(
    bitmap,
    (bitmap.width - lado) / 2,
    (bitmap.height - lado) / 2,
    lado,
    lado,
    0,
    0,
    destino,
    destino
  );

  return new Promise((ok, falha) =>
    canvas.toBlob(
      (b) => (b ? ok(b) : falha(new Error("Falhou ao converter a imagem."))),
      "image/webp",
      0.88
    )
  );
}

export default function PainelPersonagem({
  personagem,
  bonus,
  podeEditar,
}: {
  personagem: Character & { current_sanity?: number; max_sanity?: number };
  bonus: StatsBonus;
  podeEditar: boolean;
}) {
  const [p, setP] = useState(personagem);
  const [rolagem, setRolagem] = useState<{ rotulo: string; dado: number; mod: number } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);
  const supabase = criarClienteNavegador();

  /**
   * Grava um valor absoluto.
   *
   * A funcao do banco trabalha com passos (mais 1, menos 1) porque foi
   * feita para o combate. Aqui a gente calcula o passo que leva do
   * valor atual ao digitado, e manda de uma vez. Assim ninguem precisa
   * clicar vinte vezes para encher a vida.
   */
  async function definir(campo: string, novo: number) {
    const atual = (p[campo as keyof typeof p] as number) ?? 0;
    const delta = novo - atual;
    if (delta === 0) return;
    await ajustar(campo, delta);
  }

  async function ajustar(campo: string, delta: number) {
    if (!podeEditar) return;
    const anterior = p;
    setP((atual) => ({
      ...atual,
      [campo]: Math.max(0, (atual[campo as keyof typeof atual] as number) + delta),
    }));
    const { error } = await supabase.rpc("ajustar_recurso", {
      p_char: p.id,
      p_campo: campo,
      p_delta: delta,
    });
    if (error) setP(anterior);
  }

  async function enviarRetrato(arquivo: File) {
    setEnviando(true);
    setErro(null);

    try {
      const imagem = await prepararImagem(arquivo);
      const caminho = `${p.id}/${Date.now()}.webp`;

      const { error: erroUpload } = await supabase.storage
        .from("portraits")
        .upload(caminho, imagem, { contentType: "image/webp", upsert: true });

      if (erroUpload) throw erroUpload;

      const { data } = supabase.storage.from("portraits").getPublicUrl(caminho);

      const { error: erroBanco } = await supabase
        .from("characters")
        .update({ portrait_url: data.publicUrl })
        .eq("id", p.id);

      if (erroBanco) throw erroBanco;

      setP({ ...p, portrait_url: data.publicUrl });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Não consegui enviar a imagem.";
      setErro(
        msg.includes("row-level security")
          ? "O storage está sem permissão. Rode o storage-aurhen.sql no Supabase."
          : msg
      );
    } finally {
      setEnviando(false);
    }
  }

  function rolarAtributo(chave: StatKey, rotulo: string) {
    const valor = (p[chave] as number) + (bonus[chave] ?? 0);
    const mod = Math.floor((valor - 10) / 2);
    const dado = Math.floor(Math.random() * 20) + 1;
    setRolagem({ rotulo, dado, mod });
    setTimeout(() => setRolagem(null), 4000);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* retrato */}
      <div className="relative mx-auto">
        <div className="absolute -inset-3 rounded-full bg-violet-600/20 blur-2xl" aria-hidden />

        <button
          onClick={() => podeEditar && arquivoRef.current?.click()}
          disabled={!podeEditar || enviando}
          className="group relative block h-36 w-36 overflow-hidden rounded-full border-2 border-violet-400/50 shadow-[0_0_40px_-10px_rgba(168,85,247,.9)] disabled:cursor-default"
          aria-label="Trocar o retrato do personagem"
        >
          {p.portrait_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={p.portrait_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#0A0910] text-violet-400/40">
              <Sparkles className="h-8 w-8" />
            </div>
          )}

          {podeEditar && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/70 text-violet-100 opacity-0 transition group-hover:opacity-100">
              {enviando ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <Camera className="h-6 w-6" />
                  <span className="text-[10px]">trocar foto</span>
                </>
              )}
            </span>
          )}
        </button>

        <input
          ref={arquivoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && enviarRetrato(e.target.files[0])}
        />
      </div>

      {erro && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-2 py-1.5 text-[11px] text-rose-200">
          {erro}
        </p>
      )}

      {/* recursos */}
      <div className="space-y-2.5">
        {RECURSOS.map(({ campo, max, nome, cor }) => {
          const atual = (p[campo as keyof typeof p] as number) ?? 0;
          const teto = ((p[max as keyof typeof p] as number) ?? 0) + (bonus[max as StatKey] ?? 0);
          if (!teto && nome !== "Vida") return null;

          return (
            <div key={campo}>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-violet-200/70">{nome}</span>
                <div className="flex items-center gap-1">
                  {podeEditar && (
                    <>
                      <button
                        onClick={() => ajustar(campo, -10)}
                        className="rounded px-1 text-[10px] text-violet-300/40 hover:bg-violet-500/20 hover:text-violet-100"
                        aria-label={`Tirar 10 de ${nome}`}
                      >
                        −10
                      </button>
                      <button
                        onClick={() => ajustar(campo, -1)}
                        className="rounded p-0.5 text-violet-300/50 hover:bg-violet-500/20 hover:text-violet-100"
                        aria-label={`Tirar 1 de ${nome}`}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                    </>
                  )}

                  {podeEditar ? (
                    <input
                      type="number"
                      value={atual}
                      onChange={(e) => definir(campo, Number(e.target.value))}
                      onFocus={(e) => e.target.select()}
                      className="w-10 rounded bg-black/40 text-center tabular-nums text-violet-100 focus:bg-black/60 focus:outline-none"
                      aria-label={`${nome} atual`}
                    />
                  ) : (
                    <span className="tabular-nums text-violet-100">{atual}</span>
                  )}

                  <span className="tabular-nums text-violet-300/50">/{teto}</span>

                  {podeEditar && (
                    <>
                      <button
                        onClick={() => ajustar(campo, 1)}
                        className="rounded p-0.5 text-violet-300/50 hover:bg-violet-500/20 hover:text-violet-100"
                        aria-label={`Somar 1 de ${nome}`}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => ajustar(campo, 10)}
                        className="rounded px-1 text-[10px] text-violet-300/40 hover:bg-violet-500/20 hover:text-violet-100"
                        aria-label={`Somar 10 de ${nome}`}
                      >
                        +10
                      </button>
                      <button
                        onClick={() => definir(campo, teto)}
                        title="Encher"
                        className="rounded px-1 text-[10px] text-emerald-400/60 hover:bg-emerald-500/20 hover:text-emerald-300"
                      >
                        max
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-black/50">
                <motion.div
                  className={`h-full rounded-full bg-gradient-to-r ${cor}`}
                  initial={false}
                  animate={{ width: `${teto ? Math.min(100, (atual / teto) * 100) : 0}%` }}
                  transition={{ type: "spring", stiffness: 180, damping: 24 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* atalhos de rolagem */}
      <div>
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-violet-300/50">
          Testes rápidos
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {ATALHOS.map(([chave, rotulo]) => {
            const valor = (p[chave] as number) + (bonus[chave] ?? 0);
            const mod = Math.floor((valor - 10) / 2);
            return (
              <button
                key={chave}
                onClick={() => rolarAtributo(chave, STAT_LABELS[chave])}
                className="rounded-lg border border-violet-500/20 bg-black/30 py-1.5 transition hover:border-violet-400/60 hover:bg-violet-500/10"
                title={`Rolar 1d20 ${formatarBonus(mod)}`}
              >
                <span className="block text-[9px] text-violet-300/60">{rotulo}</span>
                <span className="block text-sm text-violet-100">{formatarBonus(mod)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {rolagem && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`rounded-xl border p-3 text-center ${
              rolagem.dado === 20
                ? "border-amber-400/60 bg-amber-400/10"
                : rolagem.dado === 1
                  ? "border-rose-500/60 bg-rose-500/10"
                  : "border-violet-500/30 bg-violet-500/5"
            }`}
          >
            <p className="text-[10px] uppercase tracking-wider text-violet-300/60">
              {rolagem.rotulo}
            </p>
            <p className="cinzel text-3xl text-violet-50">{rolagem.dado + rolagem.mod}</p>
            <p className="text-[11px] text-violet-300/50">
              d20 = {rolagem.dado} {formatarBonus(rolagem.mod)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-violet-300/40">
        <Dices className="h-3.5 w-3.5" />
        clique num atributo para rolar
      </div>
    </div>
  );
}
