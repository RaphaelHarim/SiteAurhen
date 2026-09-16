"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { criarClienteNavegador } from "@/lib/supabase/client";

export default function Entrar() {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [usuario, setUsuario] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const router = useRouter();

  async function enviar() {
    setOcupado(true);
    setErro(null);
    const supabase = criarClienteNavegador();

    const { error } =
      modo === "entrar"
        ? await supabase.auth.signInWithPassword({ email, password: senha })
        : await supabase.auth.signUp({
            email,
            password: senha,
            options: { data: { username: usuario || email.split("@")[0] } },
          });

    setOcupado(false);

    if (error) {
      setErro(traduzir(error.message));
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-violet-500/25 bg-[#120F1D]/80 p-7 shadow-[0_0_60px_-20px_rgba(124,58,237,.6)] backdrop-blur-xl">
        <h1 className="cinzel text-2xl tracking-wide text-violet-100">Aurhen</h1>
        <p className="mb-6 text-sm text-violet-300/60">
          {modo === "entrar" ? "Entre para ver a sua ficha." : "Crie a sua conta na mesa."}
        </p>

        <div className="space-y-3">
          {modo === "cadastrar" && (
            <Campo
              rotulo="Nome de usuário"
              valor={usuario}
              aoMudar={setUsuario}
              placeholder="como a mesa te chama"
            />
          )}
          <Campo rotulo="E-mail" tipo="email" valor={email} aoMudar={setEmail} />
          <Campo rotulo="Senha" tipo="password" valor={senha} aoMudar={setSenha} />
        </div>

        {erro && (
          <p className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
            {erro}
          </p>
        )}

        <button
          onClick={enviar}
          disabled={ocupado || !email || !senha}
          className="mt-5 w-full rounded-lg bg-violet-600 px-4 py-2.5 font-medium text-white transition
                     hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40
                     focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
                     focus-visible:outline-violet-400"
        >
          {ocupado ? "Um instante…" : modo === "entrar" ? "Entrar" : "Criar conta"}
        </button>

        <button
          onClick={() => {
            setModo(modo === "entrar" ? "cadastrar" : "entrar");
            setErro(null);
          }}
          className="mt-4 w-full text-sm text-violet-300/60 underline-offset-4 hover:text-violet-200 hover:underline"
        >
          {modo === "entrar" ? "Ainda não tenho conta" : "Já tenho conta"}
        </button>
      </div>
    </div>
  );
}

function Campo({
  rotulo,
  valor,
  aoMudar,
  tipo = "text",
  placeholder,
}: {
  rotulo: string;
  valor: string;
  aoMudar: (v: string) => void;
  tipo?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-violet-300/70">{rotulo}</span>
      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => aoMudar(e.target.value)}
        className="w-full rounded-lg border border-violet-500/25 bg-black/40 px-3 py-2 text-violet-50
                   placeholder:text-violet-400/30 focus:border-violet-400/60 focus:outline-none"
      />
    </label>
  );
}

function traduzir(mensagem: string) {
  if (mensagem.includes("Invalid login")) return "E-mail ou senha não conferem.";
  if (mensagem.includes("already registered")) return "Esse e-mail já tem conta.";
  if (mensagem.includes("Password should be")) return "A senha precisa de ao menos 6 caracteres.";
  if (mensagem.includes("Email not confirmed"))
    return "A conta existe mas falta confirmar o e-mail. Ligue o ENABLE_EMAIL_AUTOCONFIRM no .env do Docker.";
  return mensagem;
}
