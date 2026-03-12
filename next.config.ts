import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  cacheOnNavigation: true,
  reloadOnOnline: true,
  // Sempre ativo para garantir que a VPS irá injetar o SW, já que podemos estar executando sem NODE_ENV explicitado.
  disable: false,
});

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
};

export default withSerwist(nextConfig);
