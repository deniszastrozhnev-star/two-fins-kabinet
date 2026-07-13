import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // tesseract.js использует динамические require() до воркер-скрипта — при бандлинге
  // сервером Next.js эти пути ломаются, поэтому пакет нужно оставить внешним
  serverExternalPackages: ["tesseract.js"],
};

export default nextConfig;
