import Link from "next/link";
import { criarClienteServidor } from "@/lib/supabase/server";
import { BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

interface Artigo {
  id: string;
  title: string;
  slug: string;
  category: string;
  icon: string | null;
}

export default async function PaginaCodex() {
  const supabase = await criarClienteServidor();

  const { data: artigos } = await supabase
    .from("codex_articles")
    .select("id, title, slug, category, icon")
    .order("category")
    .order("sort_order")
    .returns<Artigo[]>();

  const porCategoria = (artigos ?? []).reduce<Record<string, Artigo[]>>((acc, a) => {
    (acc[a.category] ??= []).push(a);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8">
      <header className="mb-6">
        <h1 className="cinzel text-2xl tracking-wide text-violet-100">Codex</h1>
        <p className="text-sm text-violet-300/60">
          O guia da mesa, para ninguém se perder no meio da sessão.
        </p>
      </header>

      {Object.keys(porCategoria).length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-500/25 bg-[#120F1D]/50 p-10 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-violet-400/40" />
          <p className="text-violet-200/70">O Codex ainda está vazio.</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-violet-300/50">
            Os PDFs que já existem — Codex do Ferreiro, Guia do Mundo, Fichas de Chefe — entram
            aqui como artigos em Markdown, com busca e menu lateral.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(porCategoria).map(([categoria, lista]) => (
            <section key={categoria}>
              <h2 className="mb-3 text-xs uppercase tracking-[0.25em] text-violet-300/50">
                {categoria}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {lista.map((a) => (
                  <Link
                    key={a.id}
                    href={`/codex/${a.slug}`}
                    className="group rounded-xl border border-violet-500/25 bg-[#120F1D]/70 p-4 transition hover:border-violet-400/50 hover:bg-violet-500/5"
                  >
                    <p className="cinzel text-violet-100 group-hover:text-violet-50">
                      {a.icon ? `${a.icon} ` : ""}
                      {a.title}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
