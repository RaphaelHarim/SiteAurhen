import { redirect } from "next/navigation";
import { criarClienteServidor } from "@/lib/supabase/server";

export default async function Inicio() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  redirect(perfil?.role === "mestre" ? "/mesa" : "/ficha");
}
