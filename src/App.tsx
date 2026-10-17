import { siteUrl } from "./lib/siteUrl";
import { lazy, Suspense } from "react";
import { AtlasViewer } from "./components/atlas-viewer/AtlasViewer";
const PaperReaderPage = lazy(() => import("./components/atlas-viewer/PaperReaderPage").then(m => ({ default: m.PaperReaderPage })));
const TeachingPointPage = lazy(() => import("./components/atlas-viewer/TeachingPointPage").then(m => ({ default: m.TeachingPointPage })));
export default function App() {
 const view = new URLSearchParams(window.location.search).get("view");
 if (view && view !== "paper-reader" && view !== "teaching-points") return <main><h1>此入口不属于核心浏览版</h1><a href={siteUrl("/")}>返回脑图、范式故事与论文</a></main>;
 return <><Suspense fallback={<main>正在加载...</main>}>{view === "paper-reader" ? <PaperReaderPage /> : view === "teaching-points" ? <TeachingPointPage /> : <AtlasViewer />}</Suspense><footer className="project-attribution">BrainFunction · <a href="https://github.com/lizhenglei0906-design" target="_blank" rel="noreferrer">lizhenglei0906-design</a> · <a href={siteUrl("/docs/project-license.html")} target="_blank" rel="noreferrer">代码 MIT · 原创内容 CC BY 4.0 · 第三方条款</a></footer></>;
}
