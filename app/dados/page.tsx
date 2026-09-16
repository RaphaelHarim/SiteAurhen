"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dices, RotateCcw } from "lucide-react";

const DADOS = [4, 6, 8, 10, 12, 20, 100] as const;

interface Rolagem {
  id: number;
  formula: string;
  valores: number[];
  modificador: number;
  total: number;
  critico: "acerto" | "falha" | null;
  quando: string;
}

export default function PaginaDados() {
  const [quantidade, setQuantidade] = useState(1);
  const [faces, setFaces] = useState<number>(20);
  const [modificador, setModificador] = useState(0);
  const [historico, setHistorico] = useState<Rolagem[]>([]);
  const [rolando, setRolando] = useState(false);

  function rolar() {
    setRolando(true);

    const valores = Array.from(
      { length: quantidade },
      () => Math.floor(Math.random() * faces) + 1
    );
    const total = valores.reduce((a, b) => a + b, 0) + modificador;

    const critico =
      faces === 20 && quantidade === 1
        ? valores[0] === 20
          ? "acerto"
          : valores[0] === 1
            ? "falha"
            : null
        : null;

    const nova: Rolagem = {
      id: Date.now(),
      formula: `${quantidade}d${faces}${modificador ? (modificador > 0 ? `+${modificador}` : modificador) : ""}`,
      valores,
      modificador,
      total,
      critico,
      quando: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };

    setTimeout(() => {
      setHistorico((h) => [nova, ...h].slice(0, 30));
      setRolando(false);
    }, 280);
  }

  const ultima = historico[0];

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="cinzel text-2xl tracking-wide text-violet-100">Dados</h1>
        <p className="text-sm text-violet-300/60">
          Por enquanto a rolagem é só sua. Compartilhar com a mesa vem depois.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
        <section className="rounded-2xl border border-violet-500/25 bg-[#120F1D]/80 p-5 backdrop-blur-xl">
          <div className="mb-5 flex flex-wrap gap-2">
            {DADOS.map((f) => (
              <button
                key={f}
                onClick={() => setFaces(f)}
                className={`h-14 w-14 rounded-xl border-2 text-sm font-semibold transition ${
                  faces === f
                    ? "border-violet-400 bg-violet-600/25 text-violet-50 shadow-[0_0_18px_-4px_rgba(168,85,247,.9)]"
                    : "border-violet-500/20 bg-black/40 text-violet-300/60 hover:border-violet-500/50"
                }`}
              >
                d{f}
              </button>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap items-end gap-4">
            <Numero rotulo="Quantidade" valor={quantidade} aoMudar={setQuantidade} min={1} max={20} />
            <Numero rotulo="Modificador" valor={modificador} aoMudar={setModificador} min={-20} max={20} />
            <div className="ml-auto text-right">
              <p className="text-xs text-violet-300/50">Fórmula</p>
              <p className="cinzel text-xl text-violet-100">
                {quantidade}d{faces}
                {modificador ? (modificador > 0 ? `+${modificador}` : modificador) : ""}
              </p>
            </div>
          </div>

          <button
            onClick={rolar}
            disabled={rolando}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3.5 font-medium text-white transition hover:bg-violet-500 disabled:opacity-60"
          >
            <Dices className={`h-5 w-5 ${rolando ? "animate-spin" : ""}`} />
            Rolar
          </button>

          <AnimatePresence mode="wait">
            {ultima && !rolando && (
              <motion.div
                key={ultima.id}
                initial={{ opacity: 0, scale: 0.9, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="mt-6 text-center"
              >
                <p
                  className={`cinzel text-6xl ${
                    ultima.critico === "acerto"
                      ? "text-amber-300 drop-shadow-[0_0_20px_rgba(224,184,76,.7)]"
                      : ultima.critico === "falha"
                        ? "text-rose-400 drop-shadow-[0_0_20px_rgba(244,63,94,.6)]"
                        : "text-violet-100"
                  }`}
                >
                  {ultima.total}
                </p>
                <p className="mt-1 text-sm text-violet-300/60">
                  {ultima.valores.join(" + ")}
                  {ultima.modificador
                    ? ultima.modificador > 0
                      ? ` + ${ultima.modificador}`
                      : ` − ${Math.abs(ultima.modificador)}`
                    : ""}
                </p>
                {ultima.critico && (
                  <p
                    className={`mt-2 text-xs uppercase tracking-[0.3em] ${
                      ultima.critico === "acerto" ? "text-amber-300" : "text-rose-400"
                    }`}
                  >
                    {ultima.critico === "acerto" ? "acerto crítico" : "falha crítica"}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <aside className="rounded-2xl border border-violet-500/25 bg-[#120F1D]/80 p-5 backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm uppercase tracking-wider text-violet-200/80">Histórico</h2>
            {historico.length > 0 && (
              <button
                onClick={() => setHistorico([])}
                className="text-violet-300/50 hover:text-violet-100"
                title="Limpar"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}
          </div>

          {historico.length === 0 ? (
            <p className="text-sm text-violet-300/40">Nada rolado ainda.</p>
          ) : (
            <ul className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
              {historico.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-lg border border-violet-500/15 bg-black/30 px-3 py-2 text-sm"
                >
                  <div>
                    <span className="text-violet-200/80">{r.formula}</span>
                    <span className="ml-2 text-xs text-violet-300/40">{r.quando}</span>
                  </div>
                  <span
                    className={`cinzel text-lg ${
                      r.critico === "acerto"
                        ? "text-amber-300"
                        : r.critico === "falha"
                          ? "text-rose-400"
                          : "text-violet-100"
                    }`}
                  >
                    {r.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

function Numero({
  rotulo,
  valor,
  aoMudar,
  min,
  max,
}: {
  rotulo: string;
  valor: number;
  aoMudar: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-violet-300/60">{rotulo}</p>
      <div className="flex items-center gap-1 rounded-lg border border-violet-500/25 bg-black/40 p-1">
        <button
          onClick={() => aoMudar(Math.max(min, valor - 1))}
          className="h-8 w-8 rounded text-violet-200 hover:bg-violet-500/20"
        >
          −
        </button>
        <span className="w-10 text-center text-violet-100">{valor}</span>
        <button
          onClick={() => aoMudar(Math.min(max, valor + 1))}
          className="h-8 w-8 rounded text-violet-200 hover:bg-violet-500/20"
        >
          +
        </button>
      </div>
    </div>
  );
}
