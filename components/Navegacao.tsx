"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Crown, Dices, ScrollText, Swords, LogOut } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * O menu muda conforme o papel: o mestre nao tem ficha nem mesa de
 * jogo, e o jogador nao ve o painel de controle. Em vez de esconder
 * itens, cada papel tem a sua lista.
 */
const LINKS_JOGADOR = [
  { href: "/jogo", rotulo: "Mesa de jogo", Icone: Swords },
  { href: "/ficha", rotulo: "Ficha", Icone: ScrollText },
  { href: "/dados", rotulo: "Dados", Icone: Dices },
  { href: "/codex", rotulo: "Codex", Icone: BookOpen },
];

const LINKS_MESTRE = [
  { href: "/mestre", rotulo: "Painel", Icone: Crown },
  { href: "/dados", rotulo: "Dados", Icone: Dices },
  { href: "/codex", rotulo: "Codex", Icone: BookOpen },
];

export default function Navegacao({
  ehMestre,
  nome,
}: {
  ehMestre: boolean;
  nome: string;
}) {
  const caminho = usePathname();
  const router = useRouter();
  const itens = ehMestre ? LINKS_MESTRE : LINKS_JOGADOR;

  async function sair() {
    await criarClienteNavegador().auth.signOut();
    router.push("/entrar");
    router.refresh();
  }

  return (
    <>
      {/* lateral, no computador */}
      <aside className="fixed left-0 top-0 hidden h-screen w-56 flex-col border-r border-violet-500/15 bg-[#0d0b15]/80 p-4 backdrop-blur-xl lg:flex">
        <div className="mb-8 px-2">
          <p className="cinzel text-xl tracking-widest text-violet-100">AURHEN</p>
          <p className="truncate text-xs text-violet-300/50">
            {nome} · {ehMestre ? "mestre" : "jogador"}
          </p>
        </div>

        <nav className="flex-1 space-y-1">
          {itens.map(({ href, rotulo, Icone }) => {
            const ativo = caminho.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  ativo
                    ? "bg-violet-600/20 text-violet-100 shadow-[inset_2px_0_0_0_rgb(168,85,247)]"
                    : "text-violet-300/60 hover:bg-violet-500/10 hover:text-violet-100"
                }`}
              >
                <Icone className="h-4 w-4" />
                {rotulo}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={sair}
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-violet-300/50 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </aside>

      {/* barra de baixo, no celular */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-violet-500/20 bg-[#0d0b15]/95 backdrop-blur-xl lg:hidden">
        {itens.map(({ href, rotulo, Icone }) => {
          const ativo = caminho.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] transition ${
                ativo ? "text-violet-200" : "text-violet-300/45"
              }`}
            >
              <Icone className={`h-5 w-5 ${ativo ? "drop-shadow-[0_0_6px_rgba(168,85,247,.8)]" : ""}`} />
              {rotulo}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
