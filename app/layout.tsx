import type { Metadata } from "next";
import { Cinzel, Inter } from "next/font/google";
import Moldura from "@/components/Moldura";
import "./globals.css";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-cinzel",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "RPG de Aurhen",
  description: "Portal do jogador e do mestre",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${cinzel.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-[#0A0910] text-violet-50 antialiased">
        <div
          className="pointer-events-none fixed inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60rem 40rem at 20% -10%, rgba(124,58,237,.18), transparent 60%), radial-gradient(50rem 30rem at 90% 110%, rgba(168,85,247,.12), transparent 60%)",
          }}
          aria-hidden
        />
        <main className="relative">
          <Moldura>{children}</Moldura>
        </main>
      </body>
    </html>
  );
}
