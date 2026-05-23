import type { ReactNode } from 'react';

/**
 * Layout split-screen para páginas de autenticação.
 *
 * Lado esquerdo: branding + proposta de valor visual do Scrumban.
 * Lado direito: formulário (children).
 * Em mobile: só o formulário (lado esquerdo oculto).
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#070b12]">
      {/* ── Lado esquerdo — branding ────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:flex-1 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: 'linear-gradient(135deg, #070b12 0%, #080d16 60%, #060b14 100%)',
          borderRight: '1px solid rgba(255,255,255,0.04)',
        }}
      >
        {/* Grade de fundo sutil */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(34,211,238,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,1) 1px, transparent 1px)
            `,
            backgroundSize: '44px 44px',
          }}
        />

        {/* Glow azul/ciano */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(34,211,238,0.07) 0%, rgba(59,130,246,0.05) 40%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
              <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.25"/>
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">Scrumban</span>
        </div>

        {/* Conteúdo central */}
        <div className="relative z-10 flex-1 flex flex-col justify-center max-w-md">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-8 w-fit"
            style={{
              background: 'rgba(34,211,238,0.08)',
              border: '1px solid rgba(34,211,238,0.2)',
              color: '#67e8f9',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee] animate-pulse" />
            Simples desde o primeiro dia
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Pare de perder tempo
            <br />
            tentando se{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #22d3ee, #60a5fa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              organizar.
            </span>
          </h1>

          <p className="text-[#64748b] text-base leading-relaxed mb-10">
            Você não precisa saber nada de metodologia. Cria uma tarefa, atribui pra alguém e pronto — o Scrumban cuida do resto.
          </p>

          {/* Feature cards */}
          <div className="flex flex-col gap-3">
            {[
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="1" width="5" height="5" rx="1" fill="#22d3ee"/>
                    <rect x="8" y="1" width="5" height="5" rx="1" fill="#22d3ee" opacity="0.5"/>
                    <rect x="1" y="8" width="5" height="5" rx="1" fill="#22d3ee" opacity="0.5"/>
                    <rect x="8" y="8" width="5" height="5" rx="1" fill="#22d3ee" opacity="0.2"/>
                  </svg>
                ),
                label: 'Seu time na mesma página',
                desc: 'Todo mundo vê o que precisa fazer — sem reunião, sem confusão',
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 4h10M2 7h7M2 10h5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ),
                label: 'Tudo em um só lugar',
                desc: 'Tarefas, anotações e documentos — sem ficar pulando de app em app',
              },
              {
                icon: (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v3l2 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="7" cy="7" r="5" stroke="#22d3ee" strokeWidth="1.5"/>
                  </svg>
                ),
                label: 'Veja o progresso em tempo real',
                desc: 'Saiba exatamente o que está pronto e o que ainda falta',
              },
            ].map((f) => (
              <div
                key={f.label}
                className="flex items-start gap-3 p-3.5 rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(34,211,238,0.08)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#e2e8f0]">{f.label}</p>
                  <p className="text-xs text-[#475569] mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div className="relative z-10 flex items-center gap-6">
          <p className="text-xs text-[#334155]">© 2026 Scrumban</p>
          <span className="text-[#1e293b]">·</span>
          <p className="text-xs text-[#334155]">Feito para times que entregam</p>
        </div>
      </div>

      {/* ── Lado direito — formulário ────────────────────────────────────── */}
      <div className="flex flex-1 lg:max-w-[560px] items-center justify-center p-6 lg:p-14">
        <div className="w-full max-w-[440px]">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #22d3ee, #3b82f6)' }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <rect x="1" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.95"/>
                <rect x="11" y="1" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="1" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.6"/>
                <rect x="11" y="11" width="6" height="6" rx="1.5" fill="white" opacity="0.25"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-white tracking-tight">Scrumban</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
