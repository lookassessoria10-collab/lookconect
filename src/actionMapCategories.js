export const ACTION_MAP_CATEGORIES = [
  { key: "objetivos", label: "Objetivos", color: "#6355c7" },
  { key: "publico_alvo", label: "Público-alvo", color: "#2f6fed" },
  { key: "canais", label: "Canais", color: "#d1892f" },
  { key: "recursos", label: "Recursos", color: "#0f7c8f" },
  { key: "acoes", label: "Ações", color: "#1fae74" },
  { key: "resultados", label: "Resultados", color: "#e07a3f" },
  { key: "riscos", label: "Riscos", color: "#c94f4f" }
];

export function categoryLabel(key) {
  return ACTION_MAP_CATEGORIES.find((category) => category.key === key)?.label ?? key;
}

export function categoryColor(key) {
  return ACTION_MAP_CATEGORIES.find((category) => category.key === key)?.color ?? "#3457d5";
}

export function actionMapToCategories(map) {
  if (!map) return null;

  return {
    title: map.title,
    subtitle: map.subtitle,
    categories: ACTION_MAP_CATEGORIES.map((category) => ({
      key: category.key,
      label: category.label,
      color: category.color,
      items: (map.itemsByCategory[category.key] ?? []).map((item) => ({ title: item.title, meta: "" }))
    }))
  };
}
