const normalize = (value = "") => String(value ?? "").toLowerCase().trim();

export const getQuickSearchResults = (query, items = [], limit = 10) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return items.slice(0, limit);
  }

  const matches = items.filter((item) => {
    const label = normalize(item.label);
    const keywords = Array.isArray(item.keywords)
      ? item.keywords.map(normalize)
      : [];

    if (label.includes(normalizedQuery)) {
      return true;
    }

    return keywords.some((keyword) => keyword.includes(normalizedQuery));
  });

  return matches.slice(0, limit);
};

export default getQuickSearchResults;
