import { test, expect, type Page, type BrowserContext } from "@playwright/test";

/**
 * E2E — ABA NOVA NÃO PODE VIRAR ZUMBI (plano §6.5, sintoma A).
 *
 * O bug: os tokens moravam em `sessionStorage` (escopo ABA) e o gate de rota é
 * o cookie `scrumbam_auth=1` (escopo NAVEGADOR). Numa aba NOVA do MESMO
 * contexto: o cookie existe → o proxy autoriza a entrada; o `sessionStorage`
 * está vazio → `accessToken == null` → toda query tem gate
 * `enabled: !!accessToken` → **nenhum request sai** → nenhum 401 → nenhum
 * logout. O app fica DENTRO, VAZIO, para sempre (avatar `?`, zero projeto).
 *
 * ANTES DA F2 este teste FALHA em três asserções independentes:
 *   1. nenhum request autenticado é disparado na aba B (o mais eloquente:
 *      o silêncio de rede É o bug);
 *   2. o avatar renderiza `?`;
 *   3. a sidebar não tem nenhum espaço.
 *
 * DEPOIS DA F2 (localStorage + bootstrap defensivo) a aba B nasce com sessão:
 * dispara `/auth/me`, o avatar mostra o nome e a sidebar lista os workspaces.
 *
 * PRÉ-REQUISITO: backend + frontend rodando e credenciais reais.
 *   E2E_EMAIL=... E2E_PASSWORD=... npx playwright test e2e/auth-new-tab.spec.ts
 */

const EMAIL = process.env.E2E_EMAIL ?? "";
const PASSWORD = process.env.E2E_PASSWORD ?? "";

test.skip(
  !EMAIL || !PASSWORD,
  "defina E2E_EMAIL e E2E_PASSWORD (o teste exige backend real — sessão não se simula)",
);

async function login(page: Page): Promise<void> {
  await page.goto("/login");
  await page.locator("#email").fill(EMAIL);
  await page.locator("#password").fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30_000,
  });
}

test.describe("sessão em aba nova", () => {
  test("aba nova no mesmo navegador entra COM sessão (não vira zumbi)", async ({
    context,
  }: {
    context: BrowserContext;
  }) => {
    // ─── Aba A: login normal ────────────────────────────────────────────────
    const tabA = await context.newPage();
    await login(tabA);

    // O cookie de rota existe no CONTEXTO (navegador) — é ele que autoriza a
    // aba nova a entrar. Se ele não existisse, não haveria zumbi possível.
    const cookies = await context.cookies();
    expect(
      cookies.some((c) => c.name === "scrumbam_auth"),
      "cookie scrumbam_auth deve existir após o login",
    ).toBe(true);

    // ─── Aba B: MESMO contexto, storage de aba vazio ────────────────────────
    const tabB = await context.newPage();

    // O silêncio de rede é o sintoma: contamos os requests autenticados.
    const authedRequests: string[] = [];
    tabB.on("request", (req) => {
      if (req.headers()["authorization"]?.startsWith("Bearer ")) {
        authedRequests.push(req.url());
      }
    });

    await tabB.goto("/");

    // (1) A aba B DEVE falar com o backend. Antes da F2: zero requests.
    await expect
      .poll(() => authedRequests.length, {
        message:
          "aba nova não disparou NENHUM request autenticado — este é o estado zumbi",
        timeout: 20_000,
      })
      .toBeGreaterThan(0);

    // Não pode ter sido chutada para o login: a sessão é válida.
    expect(new URL(tabB.url()).pathname).not.toBe("/login");

    // (2) O avatar mostra o usuário — nunca `?`.
    const avatar = tabB.locator('button[aria-label="Menu do usuário"]');
    await expect(avatar).toBeVisible();
    await expect(avatar).not.toHaveText("?");
    await avatar.click();
    await expect(tabB.getByText(EMAIL)).toBeVisible();
    await tabB.keyboard.press("Escape");

    // (3) A sidebar tem workspaces (o app carregou de verdade, não só a casca).
    await expect(
      tabB.locator("nav a, aside a").first(),
      "sidebar vazia — a aba nova entrou sem dados",
    ).toBeVisible();
  });

  test("logout em uma aba desloga as demais (BroadcastChannel)", async ({
    context,
  }: {
    context: BrowserContext;
  }) => {
    const tabA = await context.newPage();
    await login(tabA);

    const tabB = await context.newPage();
    await tabB.goto("/");
    await expect(
      tabB.locator('button[aria-label="Menu do usuário"]'),
    ).toBeVisible();

    // Logout na aba A
    await tabA.locator('button[aria-label="Menu do usuário"]').click();
    await tabA.getByText("Sair", { exact: true }).click();
    await tabA.waitForURL(/\/login/, { timeout: 20_000 });

    // A aba B tem que cair para /login sozinha — requisito ASVS de terminação
    // de sessão (uma sessão encerrada não sobrevive em outra aba).
    await tabB.waitForURL(/\/login/, { timeout: 20_000 });
  });
});
