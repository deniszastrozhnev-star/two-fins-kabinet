import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js использует динамические require() до воркер-скрипта — при бандлинге
  // сервером Next.js эти пути ломаются, поэтому пакет нужно оставить внешним
  serverExternalPackages: ["tesseract.js"],
  // Языковые данные OCR лежат локально (src/lib/tessdata) и читаются напрямую с диска —
  // без этого трассировщик Next.js не включит их в serverless-бандл на Vercel.
  // tesseract.js полностью бандлим целиком: его worker_threads-скрипт грузится по
  // динамическому пути в рантайме, трассировщик не видит такие require и обрезает пакет,
  // из-за чего относительный require('..') внутри воркера падает на Vercel.
  outputFileTracingIncludes: {
    "/**": [
      "./src/lib/tessdata/**",
      "./node_modules/tesseract.js/**",
      "./node_modules/tesseract.js-core/**",
    ],
  },
};

export default nextConfig;
