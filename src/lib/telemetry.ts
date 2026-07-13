/**
 * Telemetria de sessão (F0 — Observabilidade).
 *
 * Um único beacon, e o mais importante do plano: mede o **estado zumbi**
 * (sintoma A do incidente de sessão).
 *
 * O zumbi acontece porque o gate de rota é um cookie (`scrumbam_auth=1`, escopo
 * NAVEGADOR) enquanto o token vive em `sessionStorage` (escopo ABA). Numa aba
 * nova, o cookie existe e o token não: o app renderiza "logado", mas toda query
 * tem `enabled: !!accessToken` — nenhum request sai, nenhum 401 acontece,
 * nenhum logout dispara. O usuário fica preso num app vazio (avatar `?`, zero
 * projetos) sem nenhum sinal chegando ao backend. É por isso que este contador
 * não existia: **o estado zumbi é, por definição, silencioso**.
 *
 * Este módulo dá voz a ele. Depois da Fase 2 (localStorage + bootstrap
 * defensivo), o contador `frontend.auth_zombie` deve ir a ZERO.
 *
 * REGRA: nunca envia token, refresh token, email ou id. Só o boolean
 * `hadRefreshToken` — que separa o zumbi recuperável (dava para fazer refresh
 * silencioso) do zumbi puro (storage vazio, só o cookie sobreviveu).
 */

/** Nome do cookie de sessão lido pelo proxy do Next para proteger rotas. */
const AUTH_COOKIE = "scrumbam_auth";

/**
 * Flag de "já reportei nesta aba". Evita beacon duplicado no StrictMode do
 * React (que monta o efeito duas vezes em dev) e em re-mounts do Providers.
 */
const BEACON_SENT_KEY = "scrumbam_zombie_beacon_sent";

/**
 * Retorna `true` se o cookie de sessão está presente no navegador.
 *
 * É o mesmo sinal que o `proxy.ts` usa para liberar a rota — ou seja, é
 * exatamente o que faz o app achar que está logado.
 */
export function hasAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => c.trim().startsWith(`${AUTH_COOKIE}=`));
}

/**
 * Envia o beacon de estado zumbi para o backend.
 *
 * Fire-and-forget por decisão: usa `keepalive` (sobrevive a navegação) e
 * engole qualquer erro. Telemetria NUNCA pode travar ou quebrar o boot do app.
 *
 * O endpoint (`POST /telemetry/auth-zombie`) é público **por necessidade**: o
 * usuário zumbi não tem access token — exigir auth tornaria impossível medir
 * justamente o caso que ele existe para medir.
 *
 * @param hadRefreshToken - Havia refresh token no storage no momento da detecção
 *
 * @example
 * ```typescript
 * if (hasAuthCookie() && !accessToken) {
 *   reportAuthZombie(!!refreshToken);
 * }
 * ```
 */
export function reportAuthZombie(hadRefreshToken: boolean): void {
  if (typeof window === "undefined") return;

  const baseURL = process.env.NEXT_PUBLIC_API_URL;
  // Sem backend configurado (modo mock/offline) não há o que reportar.
  if (!baseURL || process.env.NEXT_PUBLIC_MOCK_AUTH === "true") return;

  try {
    if (sessionStorage.getItem(BEACON_SENT_KEY) === "1") return;
    sessionStorage.setItem(BEACON_SENT_KEY, "1");
  } catch {
    // sessionStorage indisponível (modo privado exótico) — segue sem dedupe.
  }

  try {
    void fetch(`${baseURL}/telemetry/auth-zombie`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // Payload MÍNIMO: o backend rejeita qualquer chave extra (400).
      body: JSON.stringify({ hadRefreshToken }),
      keepalive: true,
    }).catch(() => {
      // Silencioso: telemetria não pode virar erro visível ao usuário.
    });
  } catch {
    // idem.
  }
}
