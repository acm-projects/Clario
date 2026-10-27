/** Resolve CSS tokens for APIs (Monaco/canvas) that require concrete values. */
export function token(name:string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
export function tokenNumber(name:string) { return parseFloat(token(name)); }
export const categories = ['Technical','Reasoning','Communication','Overall'] as const;
export const chartTokens = ['--chart-technical','--chart-reasoning','--chart-communication','--chart-overall'] as const;
