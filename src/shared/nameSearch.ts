// Fold accents (including Vietnamese đ) and punctuation once per name/query.
export const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

export const indexName = (name: string | null) => {
  const normalized = normalizeName(name ?? "");
  const words = normalized.split(" ").filter(Boolean);
  return {
    normalized,
    compact: words.join(""),
    initials: words.map((word) => Array.from(word)[0]).join(""),
  };
};

export const matchesName = (
  name: ReturnType<typeof indexName>,
  normalizedQuery: string,
) => {
  if (!normalizedQuery) return true;
  const tokens = normalizedQuery.split(" ");
  const compactQuery = tokens.join("");

  if (
    tokens.every((token) => name.normalized.includes(token)) ||
    name.compact.includes(compactQuery)
  ) {
    return true;
  }

  // Allow omitted middle initials: PN also matches Phong Van Nguyen (PVN).
  let position = 0;
  const initials = Array.from(name.initials);
  for (const letter of compactQuery) {
    position = initials.indexOf(letter, position);
    if (position === -1) return false;
    position++;
  }
  return true;
};
