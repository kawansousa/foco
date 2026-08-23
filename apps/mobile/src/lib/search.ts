const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Busca simples: ignora maiúsculas e acentos; query vazia casa com tudo. */
export function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  const q = normalize(query);
  if (!q) return true;
  return fields.some((f) => !!f && normalize(f).includes(q));
}
