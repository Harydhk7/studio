export type ThemePalette = {
  primary: string;
  primaryForeground: string;
  background: string;
  foreground: string;
  card: string;
  muted: string;
  border: string;
};

export type ThemeConfig = {
  light: ThemePalette;
  dark: ThemePalette;
};

const DEFAULT_LIGHT_THEME: ThemePalette = {
  primary: "#0071e3",
  primaryForeground: "#ffffff",
  background: "#fbfbfd",
  foreground: "#1d1d1f",
  card: "#ffffff",
  muted: "#ececf0",
  border: "#e5e5eb",
};

const DEFAULT_DARK_THEME: ThemePalette = {
  primary: "#1f8fff",
  primaryForeground: "#ffffff",
  background: "#000000",
  foreground: "#fafafa",
  card: "#1a1a1c",
  muted: "#242429",
  border: "#30303a",
};

const sanitizeThemePaletteWithDefaults = (
  theme: Partial<ThemePalette> | null | undefined,
  defaults: ThemePalette,
): ThemePalette => {
  const source = theme ?? {};
  return {
    primary: source.primary ?? defaults.primary,
    primaryForeground: source.primaryForeground ?? defaults.primaryForeground,
    background: source.background ?? defaults.background,
    foreground: source.foreground ?? defaults.foreground,
    card: source.card ?? defaults.card,
    muted: source.muted ?? defaults.muted,
    border: source.border ?? defaults.border,
  };
};

const hexToHslTriplet = (hexColor: string): string | null => {
  const hex = hexColor.trim().replace(/^#/, "");
  const normalized =
    hex.length === 3
      ? hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : hex;
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
  }
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return `${h} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

export const sanitizeThemePalette = (theme?: Partial<ThemePalette> | null): ThemePalette => {
  return sanitizeThemePaletteWithDefaults(theme, DEFAULT_LIGHT_THEME);
};

export const sanitizeThemeConfig = (theme?: unknown): ThemeConfig => {
  const candidate = theme && typeof theme === "object" ? (theme as Record<string, unknown>) : {};
  const hasNested = !!candidate.light || !!candidate.dark;
  if (hasNested) {
    return {
      light: sanitizeThemePalette(candidate.light as Partial<ThemePalette>),
      dark: sanitizeThemePaletteWithDefaults(
        candidate.dark as Partial<ThemePalette>,
        DEFAULT_DARK_THEME,
      ),
    };
  }
  // Backward compatibility: old flat theme object becomes light theme.
  const oldFlat = sanitizeThemePalette(candidate as Partial<ThemePalette>);
  return {
    light: oldFlat,
    dark: DEFAULT_DARK_THEME,
  };
};

export const applyThemePalette = (theme?: unknown) => {
  if (typeof document === "undefined") return;
  const config = sanitizeThemeConfig(theme);
  const root = document.documentElement;
  const mappings: Array<[keyof ThemePalette, string, string]> = [
    ["primary", "--theme-light-primary", "--theme-dark-primary"],
    ["primaryForeground", "--theme-light-primary-foreground", "--theme-dark-primary-foreground"],
    ["background", "--theme-light-background", "--theme-dark-background"],
    ["foreground", "--theme-light-foreground", "--theme-dark-foreground"],
    ["card", "--theme-light-card", "--theme-dark-card"],
    ["muted", "--theme-light-muted", "--theme-dark-muted"],
    ["border", "--theme-light-border", "--theme-dark-border"],
  ];
  for (const [key, lightVar, darkVar] of mappings) {
    const lightHsl = hexToHslTriplet(config.light[key]);
    if (lightHsl) root.style.setProperty(lightVar, lightHsl);
    const darkHsl = hexToHslTriplet(config.dark[key]);
    if (darkHsl) root.style.setProperty(darkVar, darkHsl);
  }
};

