import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // По умолчанию тело запроса Server Action ограничено 1 МБ — этого хватало для
  // текстовых форм, но недостаточно для загрузки видео в "Историях" (до 25 МБ)
  // и фото (до 8 МБ) с запасом на служебные байты multipart/form-data.
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
  // sharp грузит платформенный нативный .node-аддон по вычисляемому в рантайме пути —
  // Next.js автоматически подхватывает это только для next/image, а не для прямого
  // импорта в серверном коде, поэтому без явного исключения он тихо падает на Vercel.
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/**": [
      // serverExternalPackages выше исключает sharp из бандлинга, но не гарантирует,
      // что автотрассировщик подхватит его платформенный нативный биндинг для КАЖДОГО
      // serverless-маршрута — на проде это привело к ERR_DLOPEN_FAILED
      // (libvips-cpp.so не найден) конкретно в функции загрузки договора, хотя чек и
      // справка (тот же sharp, тот же ленивый импорт) работали нормально. Явно
      // указываем нужные платформенные пакеты.
      "./node_modules/@img/sharp-linux-x64/**",
      "./node_modules/@img/sharp-libvips-linux-x64/**",
    ],
  },
};

export default nextConfig;
