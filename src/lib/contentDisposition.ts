/**
 * HTTP-заголовки принимают только ASCII — а имя файла в S3-ключе берётся как
 * есть из оригинального имени, которое загрузил родитель (чек из банковского
 * приложения часто называется кириллицей, вроде "Чек Сбербанк.pdf"). Прямая
 * подстановка такого имени в `filename="..."` ломает саму сборку заголовка,
 * и браузер получает 500 на самом безобидном шаге — просто открыть файл.
 * Формат по RFC 6266/5987: ASCII-запасной вариант в `filename`, настоящее имя
 * в UTF-8 — в `filename*`, его понимают все современные браузеры.
 */
export function contentDispositionHeader(filename: string, disposition: "inline" | "attachment" = "inline"): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'") || "file";
  const encoded = encodeURIComponent(filename);
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encoded}`;
}
