/** Полнотекстовый поиск по имени на клиенте: без учёта регистра, слова запроса
 * можно вводить в любом порядке (ищем каждое слово как подстроку в "Фамилия Имя"). */
export function matchesNameQuery(lastName: string, firstName: string, query: string): boolean {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const haystack = `${lastName} ${firstName}`.toLowerCase();
  return tokens.every((token) => haystack.includes(token));
}
