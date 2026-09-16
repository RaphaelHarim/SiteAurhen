import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(paraGravar) {
          // Em Server Components não dá para escrever cookie. O middleware
          // cuida do refresh da sessão, então aqui o erro é esperado e inofensivo.
          try {
            paraGravar.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            /* ignorado de propósito */
          }
        },
      },
    }
  );
}
