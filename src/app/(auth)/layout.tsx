"use client";

/**
 * Layout minimalista para as páginas de autenticação (/login, /register).
 *
 * Sem sidebar nem topbar — centraliza o conteúdo na tela com fundo escuro.
 * Todas as páginas dentro de `(auth)/` herdam este layout automaticamente.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
      <div className="w-full max-w-[400px] px-4">
        <div className="text-center mb-8">
          <span className="text-2xl font-bold text-[#e4e4e7] tracking-tight">
            Scrumbam
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
