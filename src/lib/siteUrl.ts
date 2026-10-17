/** Prefix local URLs with Vite's configured Pages base. External URLs pass through. */
export function siteUrl(href: string): string {
  if (!href.startsWith("/") || href.startsWith("//")) return href;
  const base = import.meta.env?.BASE_URL ?? "/";
  if (base === "/" || href.startsWith(base)) return href;
  return base + href.slice(1);
}
