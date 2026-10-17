export interface ParadigmStorySection {
  title: string;
  paragraphs: string[];
}

export interface ParadigmStoryFigure {
  paradigmId: string;
  title: string;
  subtitle: string;
  imageSrc?: string;
  alt: string;
  caption: string;
  imagePrompt?: string;
  imageStatus?: "ready" | "planned" | "needs_regeneration";
  sections: ParadigmStorySection[];
  status: "draft" | "review_ready" | "published";
}
