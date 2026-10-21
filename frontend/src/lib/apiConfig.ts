// Use Vite's proxy locally; configure an API origin for deployed builds.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
