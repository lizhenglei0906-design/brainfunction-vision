import localPaperLibraryData from "../data/research-evidence/local-paper-library.generated.json";

export interface PublicPaperTarget {
  path: string;
  href: string;
  fileName: string;
  kind: string;
  role: string;
}

// Both reader entrances use this exact projection of the bundled files.
export function publicPaperTargets(sourceId: string): PublicPaperTarget[] {
  const source = localPaperLibraryData.sources.find((item) => item.sourceId === sourceId);
  const expectedHref = `/fulltext/${sourceId}/article.html`;
  const seen = new Set<string>();
  return (source?.localTargets ?? []).filter((target) => {
    if (target.href !== expectedHref || target.kind !== "html" || seen.has(target.href)) return false;
    seen.add(target.href);
    return true;
  });
}

export function isPublicPaperHtmlResponse(contentType: string, content: string, href: string): boolean {
  const known = localPaperLibraryData.sources.some((source) => publicPaperTargets(source.sourceId).some((target) => target.href === href));
  return known && contentType.toLowerCase().includes("text/html") &&
    content.includes("Text-only reading edition derived from the archived article.") &&
    content.includes("Original article") && content.includes("creativecommons.org/licenses/by/") &&
    !/<script\b|id=["']root["']|\/src\/main\.tsx|\/assets\/index-[^"']+\.js/i.test(content);
}
