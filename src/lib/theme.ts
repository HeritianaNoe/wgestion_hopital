export const THEME_COOKIE = "theme";

export const THEMES = {
  green: { label: "Vert & blanc", description: "Vert & blanc (par défaut)" },
  blue: { label: "Bleu foncé & blanc", description: "Bleu foncé & blanc" },
  gray: { label: "Gris foncé & blanc", description: "Gris foncé & blanc" },
  red: { label: "Rouge foncé & blanc", description: "Rouge foncé & blanc" },
} as const;

export type ThemeKey = keyof typeof THEMES;
export const DEFAULT_THEME: ThemeKey = "green";

export function isTheme(value: unknown): value is ThemeKey {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(THEMES, value);
}
