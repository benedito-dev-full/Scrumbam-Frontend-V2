import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",

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
    return [
      {
        // Assets versionados (hash no nome) — cache longo e imutavel.
        // Precisa vir ANTES da regra geral e ser explicito porque, no modo
        // standalone, a regra `/:path*` tambem casaria com /_next/static.
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
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
