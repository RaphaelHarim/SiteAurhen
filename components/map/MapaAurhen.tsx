"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Maximize2, Minimize2, Skull, Sword, Trash2, Box, X } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import type { MapToken } from "@/lib/types";
import { useMapaRealtime, type Mapa } from "@/lib/hooks/useMapaRealtime";
import BarraMestre from "./BarraMestre";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 6;

export default function MapaAurhen({
  mapaInicial,
  tokensIniciais,
  mapas,
  ehMestre,
}: {
  mapaInicial: Mapa | null;
  tokensIniciais: MapToken[];
  mapas: Mapa[];
  ehMestre: boolean;
}) {
  const { mapa, tokens, setTokens } = useMapaRealtime(mapaInicial, tokensIniciais);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [aberto, setAberto] = useState<MapToken | null>(null);
  const [cheia, setCheia] = useState(false);

  /**
   * Encaixa o mapa inteiro na janela.
   *
   * O zoom 1 e o tamanho original da imagem, que quase nunca e o que
   * cabe na tela. Esta conta acha a escala em que a imagem inteira
   * entra e centraliza o que sobrar.
   */
  const encaixar = useCallback(() => {
    const janela = janelaRef.current;
    const img = imgRef.current;
    if (!janela || !img || !img.naturalWidth) return;

    const larguraBase = janela.clientWidth;             // a imagem ocupa 100% da largura
    const alturaBase = larguraBase * (img.naturalHeight / img.naturalWidth);

    const escala = Math.min(
      janela.clientWidth / larguraBase,
      janela.clientHeight / alturaBase
    );

    setZoom(escala);
    setPan({
      x: (janela.clientWidth - larguraBase * escala) / 2,
      y: (janela.clientHeight - alturaBase * escala) / 2,
    });
  }, []);
  const areaRef = useRef<HTMLDivElement>(null);
  const janelaRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const supabase = criarClienteNavegador();

  // arrastar o mapa e arrastar token compartilham o mesmo gesto,
  // então guardamos qual dos dois começou
  const gesto = useRef<
    | { tipo: "pan"; x: number; y: number; panX: number; panY: number }
    | { tipo: "token"; id: string }
    | { tipo: "pinca"; dist: number; zoom: number }
    | null
  >(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());

  const visiveis = ehMestre ? tokens : tokens.filter((t) => t.is_visible);

  // Esc fecha a tela cheia. Sem isso, em tela cheia sem barra do
  // navegador, o jogador fica sem saída óbvia.
  useEffect(() => {
    const t = setTimeout(encaixar, 60);
    return () => clearTimeout(t);
  }, [cheia, mapa?.id, encaixar]);

  useEffect(() => {
    if (!cheia) return;
    const sair = (e: KeyboardEvent) => e.key === "Escape" && setCheia(false);
    window.addEventListener("keydown", sair);
    return () => window.removeEventListener("keydown", sair);
  }, [cheia]);

  /* ---------------- zoom e pan ---------------- */

  const aoRodar = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (e.deltaY < 0 ? 1.12 : 0.89))));
  }, []);

  function aoPressionar(e: React.PointerEvent) {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesto.current = {
        tipo: "pinca",
        dist: Math.hypot(a.x - b.x, a.y - b.y),
        zoom,
      };
      return;
    }

    gesto.current = { tipo: "pan", x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function aoMover(e: React.PointerEvent) {
    if (!gesto.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (gesto.current.tipo === "pinca" && pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const fator = dist / gesto.current.dist;
      setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, gesto.current.zoom * fator)));
      return;
    }

    if (gesto.current.tipo === "pan") {
      setPan({
        x: gesto.current.panX + (e.clientX - gesto.current.x),
        y: gesto.current.panY + (e.clientY - gesto.current.y),
      });
      return;
    }

    if (gesto.current.tipo === "token" && ehMestre) {
      const area = areaRef.current?.getBoundingClientRect();
      if (!area) return;
      const px = ((e.clientX - area.left - pan.x) / (area.width * zoom)) * 100;
      const py = ((e.clientY - area.top - pan.y) / (area.height * zoom)) * 100;
      const id = gesto.current.id;
      setTokens((atual) =>
        atual.map((t) =>
          t.id === id
            ? { ...t, pos_x: Math.max(0, Math.min(100, px)), pos_y: Math.max(0, Math.min(100, py)) }
            : t
        )
      );
    }
  }

  async function aoSoltar(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    const g = gesto.current;
    gesto.current = null;

    // só grava no banco ao soltar. Gravar durante o arrasto
    // geraria dezenas de escritas por segundo para todo mundo.
    if (g?.tipo === "token" && ehMestre) {
      const token = tokens.find((t) => t.id === g.id);
      if (token) {
        await supabase
          .from("map_tokens")
          .update({ pos_x: token.pos_x, pos_y: token.pos_y })
          .eq("id", token.id);
      }
    }
  }

  /* ---------------- ações do mestre ---------------- */

  async function alternarVisibilidade(token: MapToken) {
    await supabase
      .from("map_tokens")
      .update({ is_visible: !token.is_visible })
      .eq("id", token.id);
  }

  async function apagar(token: MapToken) {
    await supabase.from("map_tokens").delete().eq("id", token.id);
    setAberto(null);
  }

  /* ---------------- render ---------------- */

  // A barra do mestre precisa aparecer MESMO sem mapa: e por ela que
  // o primeiro mapa entra. Antes ela ficava depois deste if, e o
  // mestre ficava preso sem jeito de subir nada.
  if (!mapa) {
    return (
      <div className="space-y-3">
        {ehMestre && <BarraMestre mapa={null} mapas={mapas} />}
        <div className="rounded-xl border border-dashed border-violet-500/25 bg-[#120F1D]/50 p-10 text-center">
          <p className="text-violet-200/70">Nenhum mapa ativo.</p>
          <p className="mt-2 text-sm text-violet-300/50">
            {ehMestre
              ? "Arraste a imagem para a barra acima, ou use o botão Subir mapa."
              : "O mestre ainda não colocou nenhum mapa."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {ehMestre && !cheia && <BarraMestre mapa={mapa} mapas={mapas} />}

      <div
        ref={janelaRef}
        className={
          cheia
            ? "fixed inset-0 z-40 touch-none overflow-hidden bg-[#0A0910]"
            : "relative h-[calc(100vh-13rem)] min-h-[28rem] w-full touch-none overflow-hidden rounded-2xl border border-violet-500/25 bg-black/60 shadow-[0_0_60px_-25px_rgba(124,58,237,.7)]"
        }
        onWheel={aoRodar}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
      >
        <div
          ref={areaRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            width: "100%",
          }}
        >
          {mapa.background_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              ref={imgRef}
              src={mapa.background_url}
              alt={mapa.name}
              draggable={false}
              onLoad={encaixar}
              className="w-full select-none"
            />
          )}

          {visiveis.map((token) => (
            <Token
              key={token.id}
              token={token}
              zoom={zoom}
              ehMestre={ehMestre}
              aoComecarArrasto={(id, e) => {
                if (!ehMestre) return;
                e.stopPropagation();
                gesto.current = { tipo: "token", id };
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              }}
              aoClicar={() => setAberto(token)}
            />
          ))}
        </div>

        <Controles
          zoom={zoom}
          setZoom={setZoom}
          aoCentralizar={encaixar}
          cheia={cheia}
          aoAlternarCheia={() => setCheia(!cheia)}
        />
      </div>

      <AnimatePresence>
        {aberto && (
          <Detalhe
            token={aberto}
            ehMestre={ehMestre}
            aoFechar={() => setAberto(null)}
            aoAlternar={() => alternarVisibilidade(aberto)}
            aoApagar={() => apagar(aberto)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Token({
  token,
  zoom,
  ehMestre,
  aoComecarArrasto,
  aoClicar,
}: {
  token: MapToken;
  zoom: number;
  ehMestre: boolean;
  aoComecarArrasto: (id: string, e: React.PointerEvent) => void;
  aoClicar: () => void;
}) {
  const estilo = {
    player: { cor: "border-sky-400 bg-sky-500/20", icone: null },
    boss: { cor: "border-rose-500 bg-rose-600/25", icone: Skull },
    chest: { cor: "border-amber-400 bg-amber-500/20", icone: Box },
  }[token.token_type];

  const Icone = estilo.icone;
  const pv = token.payload as { pv_atual?: number; pv_max?: number };

  return (
    <motion.button
      layout
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: token.is_visible ? 1 : 0.4 }}
      style={{
        left: `${token.pos_x}%`,
        top: `${token.pos_y}%`,
        transform: `translate(-50%, -50%) scale(${1 / zoom})`,
      }}
      className="absolute"
      onPointerDown={(e) => aoComecarArrasto(token.id, e)}
      onClick={aoClicar}
      aria-label={token.label}
    >
      <div className="flex flex-col items-center">
        <div
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2
                      ${estilo.cor} backdrop-blur ${ehMestre ? "cursor-grab active:cursor-grabbing" : ""}
                      ${token.token_type === "boss" ? "animate-pulse" : ""}`}
        >
          {token.icon_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={token.icon_url} alt="" className="h-full w-full rounded-full object-cover" />
          ) : Icone ? (
            <Icone className="h-5 w-5 text-white/90" />
          ) : (
            <Sword className="h-5 w-5 text-white/90" />
          )}

          {!token.is_visible && (
            <span className="absolute -right-1 -top-1 rounded-full bg-black/80 p-0.5">
              <EyeOff className="h-3 w-3 text-violet-300" />
            </span>
          )}
        </div>

        <span className="mt-1 whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-violet-100">
          {token.label}
        </span>

        {token.token_type === "boss" && pv.pv_max ? (
          <div className="mt-0.5 h-1 w-11 overflow-hidden rounded-full bg-black/70">
            <div
              className="h-full bg-rose-500"
              style={{ width: `${Math.max(0, ((pv.pv_atual ?? 0) / pv.pv_max) * 100)}%` }}
            />
          </div>
        ) : null}
      </div>
    </motion.button>
  );
}

function Controles({
  zoom,
  setZoom,
  aoCentralizar,
  cheia,
  aoAlternarCheia,
}: {
  zoom: number;
  setZoom: (f: (z: number) => number) => void;
  aoCentralizar: () => void;
  cheia: boolean;
  aoAlternarCheia: () => void;
}) {
  return (
    <div className="absolute bottom-3 right-3 z-50 flex items-center gap-1 rounded-xl border border-violet-500/25 bg-black/80 p-1 backdrop-blur">
      <Botao onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z * 0.85))}>−</Botao>
      <span className="w-12 text-center text-xs text-violet-200/70">{Math.round(zoom * 100)}%</span>
      <Botao onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.18))}>+</Botao>
      <button
        onClick={aoCentralizar}
        className="h-8 rounded-lg px-2 text-xs text-violet-100 transition hover:bg-violet-500/20"
        title="Encaixar o mapa inteiro na tela"
      >
        encaixar
      </button>
      <span className="mx-0.5 h-5 w-px bg-violet-500/25" />
      <button
        onClick={aoAlternarCheia}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-violet-100 transition hover:bg-violet-500/20"
        title={cheia ? "Sair da tela cheia (Esc)" : "Tela cheia"}
      >
        {cheia ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

function Botao({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-8 w-8 rounded-lg text-violet-100 transition hover:bg-violet-500/20"
    >
      {children}
    </button>
  );
}

function Detalhe({
  token,
  ehMestre,
  aoFechar,
  aoAlternar,
  aoApagar,
}: {
  token: MapToken;
  ehMestre: boolean;
  aoFechar: () => void;
  aoAlternar: () => void;
  aoApagar: () => void;
}) {
  const p = token.payload as {
    descricao?: string;
    itens?: string[];
    pv_atual?: number;
    pv_max?: number;
    nivel?: string;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={aoFechar}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-violet-500/30 bg-[#120F1D] p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="cinzel text-xl text-violet-100">{token.label}</h3>
            <p className="text-xs uppercase tracking-wider text-violet-300/50">
              {{ player: "Personagem", boss: "Chefe", chest: "Baú" }[token.token_type]}
              {p.nivel ? ` · ${p.nivel}` : ""}
            </p>
          </div>
          <button onClick={aoFechar} className="text-violet-300/60 hover:text-violet-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {p.pv_max ? (
          <div className="mb-4">
            <div className="mb-1 flex justify-between text-xs text-violet-200/70">
              <span>Vida</span>
              <span>
                {p.pv_atual ?? 0}/{p.pv_max}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-black/60">
              <div
                className="h-full bg-rose-500"
                style={{ width: `${Math.max(0, ((p.pv_atual ?? 0) / p.pv_max) * 100)}%` }}
              />
            </div>
          </div>
        ) : null}

        {p.descricao && (
          <p className="mb-4 text-sm leading-relaxed text-violet-200/70">{p.descricao}</p>
        )}

        {p.itens?.length ? (
          <>
            <p className="mb-2 text-xs uppercase tracking-wider text-amber-300/70">Conteúdo</p>
            <ul className="mb-4 space-y-1">
              {p.itens.map((item, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-amber-400/20 bg-amber-400/5 px-3 py-1.5 text-sm text-amber-100"
                >
                  {item}
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {ehMestre && (
          <div className="flex gap-2 border-t border-violet-500/15 pt-4">
            <button
              onClick={aoAlternar}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-violet-500/30 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/10"
            >
              {token.is_visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {token.is_visible ? "Esconder" : "Mostrar"}
            </button>
            <button
              onClick={aoApagar}
              className="flex items-center justify-center gap-2 rounded-lg border border-rose-500/40 px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Apagar
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
