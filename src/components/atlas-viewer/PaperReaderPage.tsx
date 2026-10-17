import { siteUrl } from "../../lib/siteUrl";
import { publicPaperTargets } from "../../lib/publicPaperReading";
import { useEffect, useMemo, useState } from "react";
import evidenceDisplayLedgerData from "../../data/display-ledger/evidence-display-ledger.generated.json";
import evidenceConsumerInterfaceData from "../../data/research-evidence/evidence-consumer-interface.generated.json";
import localPaperLibraryData from "../../data/research-evidence/local-paper-library.generated.json";
import paperReadingIndexData from "../../data/research-evidence/paper-reading-index.generated.json";
import {
  LocalPaperReaderContent,
  type LocalPaperReaderFallback,
  type LocalPaperReaderSelection,
  type LocalPaperReaderSource,
  type LocalPaperReaderTarget,
} from "./LocalPaperReaderDrawer";
import "./PaperReaderPage.css";

interface LocalTargetLike {
  fileName?: string;
  href?: string;
  kind?: string;
  label?: string;
  path?: string;
  role?: string;
}

interface EvidenceSourceLike {
  boundary?: string;
  citation?: string;
  doi?: string | null;
  externalFallbacks?: LocalPaperReaderFallback[];
  localReader?: LocalTargetLike | null;
  localReviewDocs?: Array<{ href?: string; kind?: string; label?: string; path?: string }>;
  localTargets?: LocalTargetLike[];
  materialState?: string;
  safeUse?: string;
  sourceId: string;
  sourceType?: string;
  supportScope?: string;
  supports?: string;
  title: string;
  year?: number | null;
}

interface ConsumerParadigm {
  functionIds?: string[];
  label: string;
  paradigmId: string;
  primaryFunctionId?: string;
  sources: EvidenceSourceLike[];
}

interface EvidenceConsumerInterfaceData {
  paradigms: ConsumerParadigm[];
}

interface LocalPaperLibrarySource extends EvidenceSourceLike {
  canonicalPdf?: LocalTargetLike | null;
  canonicalReader?: LocalTargetLike | null;
  fulltextStatus?: string;
  paradigmLinks?: Array<{ label?: string; paradigmId: string; primaryFunctionId?: string }>;
}

interface LocalPaperLibraryData {
  sources: LocalPaperLibrarySource[];
}

interface ReadingIndexSource extends EvidenceSourceLike {
  externalLinks?: LocalPaperReaderFallback[];
  localReadTargets?: LocalTargetLike[];
  primaryReadTarget?: LocalTargetLike | null;
  useFor?: string;
}

interface PaperReadingIndexData {
  sourceIndex: ReadingIndexSource[];
}

interface EvidenceDisplayLedgerData {
  functions: Array<{
    functionId: string;
    label: string;
  }>;
}

const evidenceConsumerInterface = evidenceConsumerInterfaceData as EvidenceConsumerInterfaceData;
const localPaperLibrary = localPaperLibraryData as LocalPaperLibraryData;
const paperReadingIndex = paperReadingIndexData as PaperReadingIndexData;
const evidenceDisplayLedger = evidenceDisplayLedgerData as EvidenceDisplayLedgerData;

const SUPPORT_SCOPE_LABELS: Record<string, string> = {
  candidate_network: "网络级候选",
  candidate_task_family: "范式族候选",
  reviewed_network: "网络级已核",
  reviewed_parcel: "点位已核",
  seed_only: "种子资料",
  specialized_atlas_needed: "需专门图谱",
};

function mergeFallbacks(...fallbackGroups: Array<LocalPaperReaderFallback[] | undefined>) {
  const seen = new Set<string>();
  return fallbackGroups
    .flatMap((group) => group ?? [])
    .filter((fallback) => {
      if (!fallback.href || seen.has(fallback.href)) {
        return false;
      }
      seen.add(fallback.href);
      return true;
    });
}

function firstText(...values: Array<string | undefined | null>) {
  return values.find((value): value is string => Boolean(value?.trim()));
}

function supportScopeLabel(scope?: string) {
  if (!scope) {
    return undefined;
  }
  return SUPPORT_SCOPE_LABELS[scope] ?? scope;
}

function buildReaderSource(sourceId: string, paradigmId: string | null) {
  const consumerSources = evidenceConsumerInterface.paradigms
    .flatMap((paradigm) => paradigm.sources.map((source) => ({ paradigm, source })))
    .filter((item) => item.source.sourceId === sourceId);
  const primaryConsumerSource =
    consumerSources.find((item) => item.paradigm.paradigmId === paradigmId)?.source ?? consumerSources[0]?.source;
  const localSource = localPaperLibrary.sources.find((source) => source.sourceId === sourceId);
  const readingIndexSource = paperReadingIndex.sourceIndex.find((source) => source.sourceId === sourceId);
  const source = localSource ?? primaryConsumerSource ?? readingIndexSource;

  if (!source || sourceId === "model-note-v0") {
    return null;
  }

  const localTargets = publicPaperTargets(sourceId);

  const readerSource: LocalPaperReaderSource = {
    boundary: firstText(primaryConsumerSource?.boundary, readingIndexSource?.boundary, localSource?.boundary),
    citation: firstText(primaryConsumerSource?.citation, readingIndexSource?.citation, localSource?.citation),
    externalFallbacks: mergeFallbacks(
      primaryConsumerSource?.externalFallbacks,
      localSource?.externalFallbacks,
      readingIndexSource?.externalLinks,
    ),
    localReviewDocs: [
      ...(primaryConsumerSource?.localReviewDocs ?? []),
      ...(localSource?.localReviewDocs ?? []),
      ...(readingIndexSource?.localReviewDocs ?? []),
    ],
    localTargets,
    materialState: firstText(
      primaryConsumerSource?.materialState,
      localSource?.materialState,
      localSource?.fulltextStatus,
      readingIndexSource?.materialState,
    ),
    safeUse: firstText(primaryConsumerSource?.safeUse, readingIndexSource?.safeUse, localSource?.safeUse),
    sourceId,
    sourceType: firstText(primaryConsumerSource?.sourceType, readingIndexSource?.sourceType, localSource?.sourceType),
    supportScope: firstText(
      primaryConsumerSource?.supportScope,
      readingIndexSource?.supportScope,
      localSource?.supportScope,
    ),
    supports: firstText(primaryConsumerSource?.supports, readingIndexSource?.supports, localSource?.supports),
    title: source.title,
    year: primaryConsumerSource?.year ?? readingIndexSource?.year ?? localSource?.year ?? undefined,
  };

  return {
    consumerParadigms: consumerSources.map((item) => item.paradigm),
    source: readerSource,
  };
}

function pickRequestedTarget(source: LocalPaperReaderSource, requestedFile: string | null) {
  if (!source.localTargets.length) {
    return null;
  }
  if (!requestedFile) {
    return source.localTargets[0];
  }
  return (
    source.localTargets.find((target) => target.path === requestedFile || target.href === requestedFile) ??
    source.localTargets.find((target) => target.fileName === requestedFile) ??
    source.localTargets[0]
  );
}

function readerBackHref(functionId: string | null) {
  const params = new URLSearchParams();
  if (functionId) {
    params.set("function", functionId);
  }
  return siteUrl(`/?${params.toString()}`);
}

export function PaperReaderPage() {
  const searchParams = new URLSearchParams(window.location.search);
  const sourceId = searchParams.get("sourceId") ?? "";
  const requestedFile = searchParams.get("file");
  const functionId = searchParams.get("function");
  const paradigmId = searchParams.get("paradigm");
  const readerBundle = useMemo(() => buildReaderSource(sourceId, paradigmId), [sourceId, paradigmId]);
  const requestedTarget = useMemo(
    () => (readerBundle ? pickRequestedTarget(readerBundle.source, requestedFile) : null),
    [readerBundle, requestedFile],
  );
  const [activeTarget, setActiveTarget] = useState<LocalPaperReaderTarget | null>(requestedTarget);

  useEffect(() => {
    setActiveTarget(requestedTarget);
  }, [requestedTarget]);

  const activeFunction = evidenceDisplayLedger.functions.find((item) => item.functionId === functionId);
  const activeParadigm =
    readerBundle?.consumerParadigms.find((paradigm) => paradigm.paradigmId === paradigmId) ??
    readerBundle?.consumerParadigms[0];

  if (!readerBundle) {
    return <main className="paper-reader-page paper-reader-empty-page"><header>
      <a href={readerBackHref(functionId)}>返回脑图与范式故事</a>
      <h1>未找到这条论文来源</h1><p>请从范式的研究列表重新选择论文。</p>
    </header></main>;
  }
  if (!activeTarget) {
    return <main className="paper-reader-page paper-reader-empty-page"><header>
      <a href={readerBackHref(functionId)}>返回脑图与范式故事</a>
      <h1>{readerBundle.source.title}</h1>
      <p>{readerBundle.source.citation}</p>
      <h2>原始来源阅读</h2><p>本候选未随附这篇论文的全文，请使用下列原始来源入口。</p>
      <nav aria-label="原始来源">{readerBundle.source.externalFallbacks.map((link) =>
        <a key={link.href} href={link.href} target="_blank" rel="noreferrer">{link.label ?? "打开原始来源"}</a>)}</nav>
    </header></main>;
  }

  const selection: LocalPaperReaderSelection = {
    source: readerBundle.source,
    target: activeTarget,
  };

  return (
    <main className="paper-reader-page">
      <header className="paper-reader-page-head">
        <div>
          <p className="eyebrow">Paper Reader</p>
          <h1>论文阅读界面</h1>
          <p>
            {activeFunction?.label ?? "资料库"} {activeParadigm ? `· ${activeParadigm.label}` : ""} ·{" "}
            {readerBundle.source.sourceId}
          </p>
        </div>
        <nav aria-label="论文阅读导航">
          <a href={readerBackHref(functionId)}>返回资料库</a>
          <a href={siteUrl(activeTarget.path ? `/fulltext/${activeTarget.path.split("/fulltext/")[1]}` : activeTarget.href)} target="_blank" rel="noreferrer">
            单独打开文件
          </a>
        </nav>
      </header>

      <LocalPaperReaderContent
        className="paper-reader-page-panel"
        headingLabel="论文阅读工作台"
        selection={selection}
        supportLabel={supportScopeLabel(readerBundle.source.supportScope)}
        onSelectTarget={setActiveTarget}
      />
    </main>
  );
}
