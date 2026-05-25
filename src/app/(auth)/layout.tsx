import type { ReactNode } from 'react';

/**
 * Layout centralizado para páginas de autenticação.
 *
 * Fundo escuro liso, formulário no centro da tela.
 * Em mobile o comportamento é idêntico — sem split-screen.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4">
      <div className="w-full max-w-[380px] py-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="#0a0a0a" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#0a0a0a" opacity="0.4" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="#0a0a0a" opacity="0.4" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#0a0a0a" opacity="0.15" />
            </svg>
          </div>
          <span className="text-[15px] font-semibold text-white tracking-tight">Scrumban</span>
        </div>

        {children}
      </div>
    </div>
  );
}
