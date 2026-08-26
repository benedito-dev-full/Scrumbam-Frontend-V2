import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

  /**
   * Proxy de API para desenvolvimento local.
   *
   * A API de producao so libera CORS para `https://scrumban.com.br` e
   * `https://www.scrumban.com.br` — o preflight vindo de `localhost` volta 204
   * SEM `access-control-allow-origin`, e o browser aborta a chamada ("Erro
   * inesperado" na tela de login).
   *
   * Com este rewrite o browser fala apenas com o proprio Next (same-origin,
   * zero CORS) e o Next repassa a chamada server-side, onde CORS nao existe.
   *
   * INERTE por padrao: so liga quando `DEV_API_PROXY` esta definida (via
   * `.env.local`, que nao vai para o git). Em producao a variavel nao existe,
   * `rewrites()` devolve `[]` e o comportamento e identico ao de antes.
   *
   * Uso:
   *   .env.local
   *     NEXT_PUBLIC_API_URL=/api/v1
   *     DEV_API_PROXY=https://api.scrumban.com.br
   */
  async rewrites() {
    const target = process.env.DEV_API_PROXY;
    if (!target) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${target.replace(/\/$/, "")}/api/:path*`,
      },
    ];
  },

  /**
   * Headers de cache.
   *
   * Problema: o Cloudflare na frente do app cacheava o HTML das paginas com
   * `s-maxage=31536000` (1 ano). Como o HTML referencia os chunks JS por nome
   * com hash, um HTML antigo aponta eternamente para chunks antigos — e novos
   * deploys nunca chegavam ao usuario (dropdown nao aparecia).
   *
   * Solucao: instruir CDN/navegador a NAO cachear o HTML de forma duravel.
   * Os assets em `/_next/static/*` tem hash no nome e o proprio Next ja forca
   * `public, max-age=31536000, immutable` neles (nao pode ser sobrescrito),
   * entao nao precisam de regra aqui — e a regra abaixo nao os afeta.
   */
  async headers() {
    // Em DEV o `immutable` abaixo e veneno: os chunks de desenvolvimento tem
    // nome estavel (main-app.js, etc.), entao o browser guarda por 1 ANO um
    // bundle que ainda embute o valor antigo das `NEXT_PUBLIC_*`. Trocar o
    // .env.local e reiniciar nao adianta — o browser nunca rebusca o arquivo.
    // O proprio Next avisa disso no boot. Em producao os nomes tem hash e a
    // regra e correta, entao ela so vale ali.
    const isProd = process.env.NODE_ENV === "production";

    return [
      ...(isProd
        ? [
            {
              // Assets versionados (hash no nome) — cache longo e imutavel.
              // Precisa vir ANTES da regra geral e ser explicito porque, no
              // modo standalone, a regra `/:path*` tambem casaria com
              // /_next/static.
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
      {
        // HTML/documentos — nunca cachear de forma duravel no CDN/navegador.
        // Exclui /_next/* (assets) via regex negativa para nao rebaixar o
        // cache imutavel dos chunks.
        source: "/:path((?!_next/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
