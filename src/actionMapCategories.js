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

// Formato da ação, conforme a seção "Tipos de ação e modelos iniciais" da
// especificação do Mapa de Ações Look.
export const ACTION_ITEM_TYPES = [
  { key: "conteudo", label: "Conteúdo", icon: "FileText" },
  { key: "midia", label: "Mídia", icon: "Megaphone" },
  { key: "relacionamento", label: "Relacionamento", icon: "Heart" },
  { key: "comercial", label: "Comercial", icon: "Briefcase" },
  { key: "imprensa", label: "Imprensa", icon: "Newspaper" },
  { key: "evento", label: "Evento", icon: "CalendarDays" },
  { key: "parceria", label: "Parceria", icon: "Handshake" },
  { key: "material_fisico", label: "Material físico", icon: "Package" },
  { key: "digital", label: "Digital", icon: "Globe" },
  { key: "institucional", label: "Institucional", icon: "Building2" }
];

export function itemTypeLabel(key) {
  return ACTION_ITEM_TYPES.find((type) => type.key === key)?.label ?? null;
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
