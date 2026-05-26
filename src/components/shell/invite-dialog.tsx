"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronUp, ChevronDown, Check, Plus } from "lucide-react";
import { useInviteDialogStore } from "@/lib/stores/invite-dialog";
import { useCreateInvite } from "@/hooks/use-org-members";

function IcMember() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M19 8v6M16 11h6" />
    </svg>
  );
}

const ROLES = [
  {
    id: "membro",
    label: "Membro",
    desc: "Pode acessar todos os itens públicos em seu Espaço de trabalho.",
    badge: null,
  },
  {
    id: "membro-limitado",
    label: "Membro limitado",
    desc: "Só pode acessar itens compartilhados com o usuário.",
    badge: "Colaborador do Chat",
  },
  {
    id: "convidado",
    label: "Convidado",
    desc: "Não pode usar todos os recursos e não pode ser adicionado a Espaços. Só pode acessar itens compartilhados com ele.",
    badge: null,
  },
  {
    id: "administrador",
    label: "Administrador",
    desc: "Pode gerenciar espaços, pessoas, cobranças e outras configurações do espaço de trabalho.",
    badge: null,
  },
];

export function InviteDialog() {
  const { open, closeDialog } = useInviteDialogStore();
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const createInvite = useCreateInvite();

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setEmail("");
      setRoleOpen(false);
      setSelectedRole(ROLES[0]);
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (roleOpen) setRoleOpen(false);
        else closeDialog();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, roleOpen, closeDialog]);

  const handleSend = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed) { setError("Informe pelo menos um e-mail."); return; }

    const roleMap: Record<string, "MEMBER" | "VIEWER"> = {
      membro: "MEMBER",
      "membro-limitado": "MEMBER",
      convidado: "VIEWER",
      administrador: "MEMBER",
    };
    const backendRole = roleMap[selectedRole.id] ?? "MEMBER";

    const emails = trimmed.split(/[\s,;]+/).filter(Boolean);
    try {
      for (const e of emails) {
        await createInvite.mutateAsync({ email: e, role: backendRole });
      }
      setSuccess(true);
      setTimeout(() => closeDialog(), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(typeof msg === "string" ? msg : "Falha ao enviar convite. Tente novamente.");
    }
  };

  if (!open) return null;

  return (
    <div
      onClick={() => { if (roleOpen) setRoleOpen(false); else closeDialog(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 480, borderRadius: 12,
          background: "var(--accent)",
          border: "1px solid var(--border)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          padding: "24px 24px 20px",
          position: "relative",
        }}
      >
        {/* fechar */}
        <button type="button" onClick={closeDialog} style={{
          position: "absolute", top: 14, right: 14,
          width: 28, height: 28, borderRadius: 7,
          border: 0, background: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--muted-foreground)",
        }}
          onMouseEnter={e => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "var(--foreground)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
        >
          <X size={15} />
        </button>

        {/* título */}
        <h2 style={{ fontSize: 16, color: "var(--foreground)", marginBottom: 20, lineHeight: 1.3 }}>
          Convide pessoas <strong style={{ fontWeight: 800 }}>gratuitamente</strong>
        </h2>

        {/* email */}
        <label style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)", display: "block", marginBottom: 8 }}>
          Convidar por e-mail
        </label>
        <input
          ref={inputRef}
          type="text"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="E-mail, separado por vírgulas ou espaços"
          style={{
            width: "100%", height: 42, borderRadius: 8,
            border: focused ? "1.5px solid #4f7ef7" : "1.5px solid var(--border)",
            background: "var(--background)", color: "var(--foreground)", fontSize: 13,
            padding: "0 14px", outline: "none", boxSizing: "border-box",
            transition: "border-color .15s",
          }}
        />

        {/* Adicionar como */}
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--muted-foreground)", marginTop: 18, marginBottom: 10 }}>
          Adicionar como
        </p>

        {/* bloco de cargo — relativo para o dropdown */}
        <div style={{ position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 12,
            padding: "12px 14px", borderRadius: roleOpen ? "8px 8px 0 0" : 8,
            background: "var(--accent)",
            border: "1px solid var(--border)",
            borderBottom: roleOpen ? "1px solid var(--border)" : "1px solid var(--border)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              background: "var(--secondary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--muted-foreground)",
            }}>
              <IcMember />
            </div>
            <div style={{ flex: 1 }}>
              <button type="button" onClick={() => setRoleOpen(v => !v)} style={{
                display: "flex", alignItems: "center", gap: 4,
                border: 0, background: "none", cursor: "pointer", padding: 0,
                color: "var(--foreground)", fontSize: 14, fontWeight: 600,
              }}
                onMouseEnter={e => { e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "var(--foreground)"; }}
              >
                {selectedRole.label}
                {roleOpen
                  ? <ChevronUp size={13} strokeWidth={2.5} />
                  : <ChevronDown size={13} strokeWidth={2.5} />
                }
              </button>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)", marginTop: 3, lineHeight: 1.5 }}>
                {selectedRole.desc}
              </p>
            </div>
          </div>

          {/* dropdown de cargos */}
          {roleOpen && (
            <div style={{
              position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10,
              background: "var(--accent)",
              border: "1px solid var(--border)",
              borderTop: "none",
              borderRadius: "0 0 8px 8px",
              overflow: "hidden",
            }}>
              {ROLES.map((role) => (
                <button key={role.id} type="button" onClick={() => { setSelectedRole(role); setRoleOpen(false); }}
                  style={{
                    display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                    width: "100%", padding: "10px 14px",
                    border: 0, background: "none", cursor: "pointer", textAlign: "left",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = "var(--border)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "none"; }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{role.label}</span>
                      {role.badge && (
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: "#a78bfa",
                          background: "rgba(139,92,246,0.20)",
                          borderRadius: 4, padding: "1px 6px",
                        }}>{role.badge}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{role.desc}</p>
                  </div>
                  {selectedRole.id === role.id && (
                    <Check size={14} strokeWidth={2.5} style={{ color: "#4f7ef7", marginTop: 2, flexShrink: 0 }} />
                  )}
                </button>
              ))}

              {/* divisor + Adicionar função personalizada */}
              <div style={{ borderTop: "1px solid var(--border)", margin: "2px 0" }} />
              <button type="button" style={{
                display: "flex", alignItems: "center", gap: 6,
                width: "100%", padding: "10px 14px",
                border: 0, background: "none", cursor: "pointer",
                color: "var(--muted-foreground)", fontSize: 13,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--foreground)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
              >
                <Plus size={13} strokeWidth={2.5} />
                Adicionar função personalizada
              </button>
            </div>
          )}
        </div>

        {/* erro / sucesso */}
        {error && (
          <p style={{ fontSize: 12, color: "#f87171", marginTop: 12 }}>{error}</p>
        )}
        {success && (
          <p style={{ fontSize: 12, color: "#4ade80", marginTop: 12 }}>Convite enviado com sucesso!</p>
        )}

        {/* botões */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button type="button" onClick={closeDialog} style={{
            height: 36, padding: "0 18px", borderRadius: 7,
            border: 0, background: "none", cursor: "pointer",
            color: "var(--muted-foreground)", fontSize: 13, fontWeight: 500,
          }}
            onMouseEnter={e => { e.currentTarget.style.color = "var(--foreground)"; }}
            onMouseLeave={e => { e.currentTarget.style.color = "var(--muted-foreground)"; }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={createInvite.isPending || success || !email.trim()}
            style={{
              height: 36, padding: "0 20px", borderRadius: 7,
              border: 0,
              background: createInvite.isPending || success || !email.trim() ? "var(--accent)" : "var(--primary)",
              cursor: createInvite.isPending || success || !email.trim() ? "not-allowed" : "pointer",
              color: createInvite.isPending || success || !email.trim() ? "var(--muted-foreground)" : "var(--primary-foreground)",
              fontSize: 13, fontWeight: 700, transition: "all .15s",
            }}
          >
            {createInvite.isPending ? "Enviando..." : success ? "Enviado!" : "Enviar convite gratuito"}
          </button>
        </div>
      </div>
    </div>
  );
}
