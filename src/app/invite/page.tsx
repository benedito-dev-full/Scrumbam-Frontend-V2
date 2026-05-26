'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/stores/auth';
import type { AuthResponseDto } from '@/lib/types/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface InviteInfo {
  orgName: string;
  inviterName: string;
  email: string;
  role: 'MEMBER' | 'VIEWER';
  expiresAt: string;
  flow: 'new_user' | 'existing_user';
}

interface AcceptResponse extends AuthResponseDto {
  redirectTo: string;
}

// ─── Helpers visuais ──────────────────────────────────────────────────────────

const CYAN = '#00d2c8';

function Spinner() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: '50%',
      border: `3px solid rgba(0,210,200,0.15)`,
      borderTopColor: CYAN,
      animation: 'spin 0.8s linear infinite',
    }} />
  );
}

function roleLabel(role: string) {
  return role === 'VIEWER' ? 'Visualizador' : 'Membro';
}

// ─── Inner page (usa useSearchParams — deve estar dentro de Suspense) ─────────

function InvitePageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const { setTokens, setUser } = useAuthStore.getState();

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'invalid'>('loading');

  // form new_user
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Busca info do convite
  useEffect(() => {
    if (!token) { setLoadState('invalid'); return; }
    api.get<InviteInfo>(`/invites/${token}`)
      .then((res) => { setInfo(res.data); setLoadState('ready'); })
      .catch(() => setLoadState('invalid'));
  }, [token]);

  const handleAccept = async () => {
    if (!info) return;
    setError(null);

    if (info.flow === 'new_user') {
      if (!name.trim() || name.trim().length < 2) {
        setError('Informe seu nome completo (mínimo 2 caracteres).'); return;
      }
      if (password.length < 8) {
        setError('Senha deve ter no mínimo 8 caracteres.'); return;
      }
    }

    setSubmitting(true);
    try {
      const body = info.flow === 'new_user'
        ? { name: name.trim(), password }
        : {};

      const res = await api.post<AcceptResponse>(`/invites/${token}/accept`, body);
      const { accessToken, refreshToken, user, redirectTo } = res.data;

      setTokens(accessToken, refreshToken);
      setUser(user);

      router.replace(redirectTo ?? '/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === 'string' ? msg : 'Erro ao aceitar convite. O link pode ter expirado.');
      setSubmitting(false);
    }
  };

  // ── Loading ──
  if (loadState === 'loading') {
    return (
      <div style={centerStyle}>
        <Spinner />
        <p style={{ color: '#666', fontSize: 13, marginTop: 16 }}>Verificando convite...</p>
      </div>
    );
  }

  // ── Inválido / expirado ──
  if (loadState === 'invalid' || !info) {
    return (
      <div style={centerStyle}>
        <div style={cardStyle}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: '#e4e4e4', marginBottom: 8 }}>
            Convite inválido ou expirado
          </h1>
          <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
            Este link de convite não é válido, já foi usado ou expirou.
            Peça um novo convite ao administrador da organização.
          </p>
          <button
            type="button"
            onClick={() => router.replace('/login')}
            style={btnPrimaryStyle}
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  // ── Convite válido ──
  return (
    <div style={centerStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={cardStyle}>
        {/* Logo / marca */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #00d2c8 0%, #0099cc 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: -1,
          }}>
            S
          </div>
        </div>

        {/* Cabeçalho */}
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e4e4e4', textAlign: 'center', marginBottom: 6 }}>
          Você foi convidado
        </h1>
        <p style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 1.6, marginBottom: 24 }}>
          <strong style={{ color: '#ccc' }}>{info.inviterName}</strong> convidou você para entrar na organização{' '}
          <strong style={{ color: CYAN }}>{info.orgName}</strong> como{' '}
          <strong style={{ color: '#ccc' }}>{roleLabel(info.role)}</strong>.
        </p>

        {/* Email (readonly) */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>E-mail</label>
          <input
            type="email"
            value={info.email}
            readOnly
            style={{ ...inputStyle, background: '#0d0d0d', color: '#666', cursor: 'default' }}
          />
        </div>

        {/* Formulário: só para new_user */}
        {info.flow === 'new_user' && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Seu nome completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="ex: Maria Souza"
                autoComplete="name"
                style={{
                  ...inputStyle,
                  borderColor: nameFocused ? CYAN : 'var(--border)',
                  boxShadow: nameFocused ? `0 0 0 2px rgba(0,210,200,0.15)` : 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: 24, position: 'relative' }}>
              <label style={labelStyle}>Criar senha</label>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPassFocused(true)}
                onBlur={() => setPassFocused(false)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                style={{
                  ...inputStyle,
                  paddingRight: 44,
                  borderColor: passFocused ? CYAN : 'var(--border)',
                  boxShadow: passFocused ? `0 0 0 2px rgba(0,210,200,0.15)` : 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((v) => !v)}
                style={{
                  position: 'absolute', right: 12, top: 33,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#555', fontSize: 12, padding: 4,
                }}
              >
                {showPass ? 'ocultar' : 'mostrar'}
              </button>
            </div>
          </>
        )}

        {/* existing_user — apenas confirmação */}
        {info.flow === 'existing_user' && (
          <div style={{
            background: 'rgba(0,210,200,0.06)', border: '1px solid rgba(0,210,200,0.2)',
            borderRadius: 8, padding: '12px 14px', marginBottom: 24,
            fontSize: 13, color: '#888', lineHeight: 1.6,
          }}>
            Você já tem uma conta com este e-mail. Clique em{' '}
            <strong style={{ color: CYAN }}>Aceitar convite</strong> para entrar na organização.
          </div>
        )}

        {/* Erro */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 13, color: '#f87171', lineHeight: 1.5,
          }}>
            {error}
          </div>
        )}

        {/* Botão aceitar */}
        <button
          type="button"
          onClick={handleAccept}
          disabled={submitting}
          style={{
            ...btnPrimaryStyle,
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Entrando...' : 'Aceitar convite'}
        </button>

        {/* Expiração */}
        <p style={{ fontSize: 11, color: '#444', textAlign: 'center', marginTop: 16 }}>
          Este convite expira em{' '}
          {new Date(info.expiresAt).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Page (exportada — wraps InvitePageInner em Suspense) ────────────────────

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div style={centerStyle}>
        <Spinner />
      </div>
    }>
      <InvitePageInner />
    </Suspense>
  );
}

// ─── Estilos base ─────────────────────────────────────────────────────────────

const centerStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: '#0d0d0d', padding: '24px 16px',
};

const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 420, borderRadius: 16,
  background: '#161616', border: '1px solid var(--border)',
  padding: '36px 32px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: '#888', marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: '100%', height: 42, borderRadius: 8,
  border: '1.5px solid var(--border)',
  background: '#111', color: '#e4e4e4', fontSize: 13,
  padding: '0 14px', outline: 'none', boxSizing: 'border-box',
  transition: 'border-color .15s, box-shadow .15s',
};

const btnPrimaryStyle: React.CSSProperties = {
  width: '100%', height: 44, borderRadius: 10,
  border: 'none', background: CYAN,
  color: '#0d0d0d', fontSize: 14, fontWeight: 700,
  cursor: 'pointer', transition: 'opacity .15s',
};
