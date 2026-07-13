import { defineConfig, devices } from "@playwright/test";

/**
 * Configuração Playwright — e2e de sessão (F2).
 *
 * NÃO sobe servidor: os testes de sessão precisam do backend REAL (login,
 * /auth/me, /auth/refresh). Suba o stack antes:
 *
 *   # backend
 *   cd ../Scrumban-Backend-V2 && npm run start:dev
 *   # frontend
 *   npm run dev            # http://localhost:3001
 *
 *   E2E_EMAIL=... E2E_PASSWORD=... npx playwright test
 *
 * Variáveis:
 *   E2E_BASE_URL  (default http://localhost:3001)
 *   E2E_EMAIL / E2E_PASSWORD  — credenciais de um usuário com ao menos 1 espaço
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
