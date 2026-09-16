"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export default function CriarPersonagem() {
  const [nome, setNome] = useState("");
  const [classe, setClasse] = useState("");
  const [raca, setRaca] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function criar() {
    setOcupado(true);
    setErro(null);
    const supabase = criarClienteNavegador();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("characters").insert({
      user_id: user.id,
      name: nome,
      class: classe || null,
      race: raca || null,
      max_pv: 10,
      current_pv: 10,
    });

    setOcupado(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-violet-500/25 bg-[#120F1D]/80 p-7 backdrop-blur-xl">
      <h1 className="cinzel text-2xl text-violet-100">Seu primeiro personagem</h1>
      <p className="mb-6 text-sm text-violet-300/60">
        Só o nome já basta. O resto o mestre ajusta depois.
      </p>

      <div className="space-y-3">
        {[
          ["Nome", nome, setNome, "Kaelen de Forjabranca"],
          ["Classe", classe, setClasse, "Guerreiro"],
          ["Raça ou origem", raca, setRaca, "Humano"],
        ].map(([rotulo, valor, set, dica]) => (
          <label key={rotulo as string} className="block">
            <span className="mb-1 block text-xs text-violet-300/70">{rotulo as string}</span>
            <input
              value={valor as string}
              placeholder={dica as string}
              onChange={(e) => (set as (v: string) => void)(e.target.value)}
              className="w-full rounded-lg border border-violet-500/25 bg-black/40 px-3 py-2
                         text-violet-50 placeholder:text-violet-400/30 focus:border-violet-400/60 focus:outline-none"
            />
          </label>
        ))}
      </div>

      {erro && <p className="mt-4 text-sm text-rose-300">{erro}</p>}

      <button
        onClick={criar}
        disabled={ocupado || !nome}
        className="mt-5 w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white
                   transition hover:bg-violet-500 disabled:opacity-40"
      >
        {ocupado ? "Criando…" : "Criar personagem"}
      </button>
    </div>
  );
}
