import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0f0f11', position: 'relative', overflow: 'hidden' }}
    >
      {/* glow índigo suave */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -60%)',
          width: 640, height: 640,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.06) 45%, transparent 70%)',
          filter: 'blur(56px)',
          pointerEvents: 'none',
        }}
      />

      <div className="relative z-10 w-full max-w-[400px] py-12">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div
            style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="white" opacity="0.95" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="white" opacity="0.5" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="white" opacity="0.5" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="white" opacity="0.2" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#e8e8f0', letterSpacing: '-0.2px' }}>
            Scrumban
          </span>
        </div>

        {/* card com superfície elevada */}
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 16,
            padding: '32px 28px',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
