// Values shared by the provider, the settings screen and the tests. Kept out
// of the .jsx file so React Fast Refresh stays happy.
export const STORE_KEY = "skillspan.preferences.v1";

export const THEMES = ["light", "dark", "system"];
export const ACCENTS = ["blue", "violet", "emerald", "amber"];
export const LANGUAGES = ["en", "ar"];

export const ACCENT_SWATCHES = {
  blue: { hex: "#3b8bff", label: "Ocean" },
  violet: { hex: "#7c3aed", label: "Violet" },
  emerald: { hex: "#059669", label: "Emerald" },
  amber: { hex: "#f59e0b", label: "Sunset" },
};

export const DEFAULT_PREFERENCES = { theme: "light", accent: "blue", lang: "en" };
