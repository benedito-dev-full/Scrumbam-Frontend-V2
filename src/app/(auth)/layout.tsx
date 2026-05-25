import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0c0e14' }}>

      {/* ── Lado esquerdo — branding ──────────────────────────────────────── */}
      <div
        className="hidden lg:flex"
        style={{
          flex: '0 0 52%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(145deg, #061a1f 0%, #082028 50%, #071c24 100%)',
          borderRight: '1px solid rgba(0,210,200,0.08)',
        }}
      >
        {/* glow ciano superior */}
        <div aria-hidden style={{
          position: 'absolute', top: -120, left: -80,
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,200,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* glow ciano inferior */}
        <div aria-hidden style={{
          position: 'absolute', bottom: -100, right: -60,
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,180,170,0.09) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* grade sutil */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: `
            linear-gradient(rgba(0,210,200,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,200,1) 1px, transparent 1px)
          `,
          backgroundSize: '48px 48px',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #00d2c8 0%, #00a89e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(0,210,200,0.3)',
          }}>
            <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.95" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.55" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.55" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.22" />
            </svg>
          </div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#e0f7f6', letterSpacing: '-0.3px' }}>
            Scrumban
          </span>
        </div>

        {/* Conteúdo central */}
        <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 440 }}>

          {/* badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 100, marginBottom: 32, width: 'fit-content',
            background: 'rgba(0,210,200,0.08)',
            border: '1px solid rgba(0,210,200,0.2)',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d2c8', display: 'block', boxShadow: '0 0 6px #00d2c8' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#00d2c8', letterSpacing: '0.02em' }}>
              Gestão simples de verdade
            </span>
          </div>

          <h1 style={{
            fontSize: 38, fontWeight: 800, lineHeight: 1.18,
            color: '#e8f8f7', marginBottom: 20, letterSpacing: '-0.8px',
          }}>
            Tudo que o seu<br />
            time precisa em{' '}
            <span style={{
              background: 'linear-gradient(90deg, #00d2c8, #00f5ea)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              um só lugar.
            </span>
          </h1>

          <p style={{ fontSize: 15, color: '#4a7a78', lineHeight: 1.7, marginBottom: 44 }}>
            Do backlog à entrega — organize tarefas, acompanhe sprints e colabore em tempo real. Sem curva de aprendizado.
          </p>

          {/* três bullets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { emoji: '⚡', title: 'Pronto em minutos', desc: 'Configure seu workspace e comece a criar tarefas agora mesmo.' },
              { emoji: '🎯', title: 'Foco no que importa', desc: 'Kanban, sprints e planejador visual em uma só ferramenta.' },
              { emoji: '🤝', title: 'Time sempre alinhado', desc: 'Comentários, menções e atualizações em tempo real.' },
            ].map((item) => (
              <div key={item.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                  background: 'rgba(0,210,200,0.08)',
                  border: '1px solid rgba(0,210,200,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 17,
                }}>
                  {item.emoji}
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#c8eeec', marginBottom: 3 }}>{item.title}</p>
                  <p style={{ fontSize: 13, color: '#3d6664', lineHeight: 1.5 }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rodapé */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
          <p style={{ fontSize: 12, color: '#1e3d3c' }}>© 2026 Scrumban</p>
          <span style={{ color: '#162e2d' }}>·</span>
          <p style={{ fontSize: 12, color: '#1e3d3c' }}>Feito para times que entregam</p>
        </div>
      </div>

      {/* ── Lado direito — formulário ────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 24px',
        background: '#0c0e14',
        position: 'relative',
      }}>
        {/* glow ciano muito sutil atrás do form */}
        <div aria-hidden style={{
          position: 'absolute',
          top: '50%', left: '40%',
          transform: 'translate(-50%, -60%)',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,210,200,0.06) 0%, transparent 65%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
          {/* Logo mobile (só aparece em telas pequenas) */}
          <div className="lg:hidden" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #00d2c8, #00a89e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.95" />
                <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.55" />
                <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.55" />
                <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.22" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#e0f7f6' }}>Scrumban</span>
          </div>

          {children}
        </div>
      </div>

    </div>
  );
}
