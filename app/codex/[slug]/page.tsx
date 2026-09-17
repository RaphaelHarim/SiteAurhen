import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { criarClienteServidor } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Artigo {
  id: string;
  title: string;
  slug: string;
  category: string;
  content_markdown: string;
  is_published: boolean;
}

export default async function ArtigoCodex({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");

  // a política do banco já esconde os não publicados de quem não é mestre,
  // então um artigo do mestre simplesmente não vem para o jogador
  const { data: artigo } = await supabase
    .from("codex_articles")
    .select("*")
    .eq("slug", slug)
    .maybeSingle<Artigo>();

  if (!artigo) notFound();

  return (
    <article className="mx-auto max-w-3xl p-4 md:p-8">
      <Link
        href="/codex"
        className="mb-6 inline-flex items-center gap-2 text-sm text-violet-300/60 transition hover:text-violet-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Codex
      </Link>

      <header className="mb-6 border-b border-violet-500/20 pb-4">
        <p className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-violet-300/50">
          {artigo.category}
          {!artigo.is_published && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-400/10 px-1.5 py-0.5 text-amber-300/80">
              <Lock className="h-3 w-3" />
              só o mestre
            </span>
          )}
        </p>
        <h1 className="cinzel text-3xl leading-tight text-violet-100">{artigo.title}</h1>
      </header>

      <div className="prose-aurhen">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{artigo.content_markdown}</ReactMarkdown>
      </div>
    </article>
  );
}
