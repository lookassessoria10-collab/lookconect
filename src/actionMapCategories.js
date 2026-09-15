export const ACTION_MAP_CATEGORIES = [
  { key: "objetivos", label: "Objetivos", color: "#7c6fe0", tint: "#efecfd" },
  { key: "publico_alvo", label: "Público-alvo", color: "#1f9d6c", tint: "#e6f7ee" },
  { key: "canais", label: "Canais", color: "#c99a1f", tint: "#faf3dc" },
  { key: "recursos", label: "Recursos", color: "#2f6fed", tint: "#e8f0fe" },
  { key: "acoes", label: "Ações", color: "#d1447e", tint: "#fbe7f0" },
  { key: "resultados", label: "Resultados", color: "#e0812f", tint: "#fdf0e3" },
  { key: "riscos", label: "Riscos", color: "#c94f4f", tint: "#fbe9e9" }
];

export function categoryLabel(key) {
  return ACTION_MAP_CATEGORIES.find((category) => category.key === key)?.label ?? key;
}

export function categoryColor(key) {
  return ACTION_MAP_CATEGORIES.find((category) => category.key === key)?.color ?? "#3457d5";
}

export function categoryTint(key) {
  return ACTION_MAP_CATEGORIES.find((category) => category.key === key)?.tint ?? "#eef1fb";
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
