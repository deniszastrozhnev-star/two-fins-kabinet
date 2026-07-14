import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js использует динамические require() до воркер-скрипта — при бандлинге
  // сервером Next.js эти пути ломаются, поэтому пакет нужно оставить внешним
  serverExternalPackages: ["tesseract.js"],
  // Языковые данные OCR лежат локально (src/lib/tessdata) и читаются напрямую с диска —
  // без этого трассировщик Next.js не включит их в serverless-бандл на Vercel.
  outputFileTracingIncludes: {
    "/**": ["./src/lib/tessdata/**"],
  },
};

export default nextConfig;
