/**
 * Mock de autenticação para desenvolvimento offline.
 *
 * Simula os endpoints POST /auth/login, POST /auth/register e GET /auth/me
 * sem precisar do backend rodando. Persiste usuários registrados via localStorage
 * para que o registro funcione entre reloads da página.
 *
 * Usuário demo pré-cadastrado:
 *   Email: demo@scrumban.com
 *   Senha: demo1234
 *
 * @see use-auth.ts — ativado quando NEXT_PUBLIC_MOCK_AUTH=true
 */

import type { UserDto, AuthResponseDto } from '@/lib/types/api';

// ─── Usuário e resposta demo ──────────────────────────────────────────────────

const MOCK_USER: UserDto = {
  id: 'mock-user-01',
  email: 'demo@scrumban.com',
  name: 'Demo User',
  entidadeId: 'mock-espaco-01',
  organizationId: 'mock-org-01',
  organizationName: 'Minha Empresa',
  orgRole: 'ADMIN',
  availableOrgs: [{ id: 'mock-org-01', nome: 'Minha Empresa', role: 'ADMIN' }],
  isOrphan: false,
};

const MOCK_TOKEN = 'mock-access-token-dev';
const MOCK_REFRESH = 'mock-refresh-token-dev';

const MOCK_AUTH_RESPONSE: AuthResponseDto = {
  accessToken: MOCK_TOKEN,
  refreshToken: MOCK_REFRESH,
  expiresIn: 3600,
  tokenType: 'Bearer',
  user: MOCK_USER,
};

// ─── Persistência de usuários registrados ────────────────────────────────────

const MOCK_USERS_KEY = 'scrumban_mock_users';

interface MockUserRecord {
  email: string;
  password: string;
  name: string;
  organizationName?: string;
  user: UserDto;
}

function loadMockUsers(): MockUserRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(MOCK_USERS_KEY);
    if (stored) return JSON.parse(stored) as MockUserRecord[];
  } catch {
    /* ignore parse errors */
  }
  return [];
}

function saveMockUsers(users: MockUserRecord[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

// ─── Utilitário ───────────────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Cria um objeto de erro no formato AxiosError para que getApiErrorMessage() funcione. */
function mockApiError(statusCode: number, message: string): unknown {
  return {
    response: {
      data: {
        statusCode,
        message,
        error: statusCode === 401 ? 'Unauthorized' : 'Conflict',
      },
    },
  };
}

// ─── Handlers mock ────────────────────────────────────────────────────────────

/**
 * Simula POST /auth/login.
 *
 * Aceita o usuário demo e usuários registrados via mockRegister() nesta sessão.
 * Rejeita com erro 401 se as credenciais não forem válidas.
 */
export async function mockLogin(
  email: string,
  password: string,
): Promise<AuthResponseDto> {
  await delay(600);

  // Usuário demo fixo
  if (email === 'demo@scrumban.com' && password === 'demo1234') {
    return MOCK_AUTH_RESPONSE;
  }

  // Usuários registrados durante a sessão
  const users = loadMockUsers();
  const found = users.find((u) => u.email === email && u.password === password);
  if (found) {
    return {
      accessToken: `mock-token-${found.user.id}`,
      refreshToken: `mock-refresh-${found.user.id}`,
      expiresIn: 3600,
      tokenType: 'Bearer',
      user: found.user,
    };
  }

  throw mockApiError(401, 'Email ou senha incorretos');
}

/**
 * Simula POST /auth/register.
 *
 * Persiste o novo usuário no localStorage para que login funcione após reload.
 * Rejeita com erro 409 se o email já estiver em uso.
 */
export async function mockRegister(
  name: string,
  email: string,
  password: string,
  organizationName?: string,
): Promise<AuthResponseDto> {
  await delay(800);

  const users = loadMockUsers();

  // Verifica duplicidade
  if (email === 'demo@scrumban.com' || users.some((u) => u.email === email)) {
    throw mockApiError(409, 'Este email já está em uso');
  }

  const userId = `mock-user-${crypto.randomUUID().slice(0, 8)}`;
  const orgId = organizationName
    ? `mock-org-${crypto.randomUUID().slice(0, 8)}`
    : undefined;

  const newUser: UserDto = {
    id: userId,
    email,
    name,
    entidadeId: `mock-espaco-${crypto.randomUUID().slice(0, 8)}`,
    organizationId: orgId,
    organizationName: organizationName ?? undefined,
    orgRole: organizationName ? 'ADMIN' : undefined,
    availableOrgs: organizationName
      ? [{ id: orgId as string, nome: organizationName, role: 'ADMIN' }]
      : [],
    isOrphan: !organizationName,
  };

  const record: MockUserRecord = {
    email,
    password,
    name,
    organizationName,
    user: newUser,
  };

  saveMockUsers([...users, record]);

  return {
    accessToken: `mock-token-${userId}`,
    refreshToken: `mock-refresh-${userId}`,
    expiresIn: 3600,
    tokenType: 'Bearer',
    user: newUser,
  };
}

/**
 * Simula GET /auth/me.
 *
 * Resolve para o UserDto correspondente ao token fornecido.
 * Rejeita com erro 401 se o token não for reconhecido.
 */
export async function mockMe(token: string): Promise<UserDto> {
  await delay(200);

  if (token === MOCK_TOKEN) return MOCK_USER;

  const users = loadMockUsers();
  const userId = token.replace('mock-token-', '');
  const found = users.find((u) => u.user.id === userId);
  if (found) return found.user;

  throw mockApiError(401, 'Token inválido');
}
