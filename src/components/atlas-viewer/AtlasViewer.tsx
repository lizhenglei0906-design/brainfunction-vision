import { siteUrl } from "../../lib/siteUrl";
import { publicPaperTargets } from "../../lib/publicPaperReading";
import teachingNodes from "../../data/paradigm-library/teaching-nodes.json";
import spatialAudit from "../../data/paradigm-library/spatial-audit.json";
import { Fragment, startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import atlasData from "../../data/brain-atlas/schaefer-200-7networks.json";
import taxonomyData from "../../data/brain-atlas/network-taxonomy.json";
import mathLogicStroopDemoData from "../../data/connection-overlays/math-logic-stroop-demo.json";
import {
  functionUseCaseRegistry,
  type FunctionUseCaseRole,
  type ParadigmUseCase,
} from "../../data/function-use-cases/foundation-function-use-cases";
import {
  emotionModulation3dFunctionMappingById,
  emotionModulation3dLayerContract,
  emotionModulation3dNodeById,
} from "../../data/emotion-cognition/emotionModulation3dLayer";
import { getParadigmStoryFigure } from "../../content/paradigm-stories/paradigm-story-figures";
import learningFunctionData from "../../data/learning-functions/bnu-learning-foundations.json";
import quantityUnderstandingTripletData from "../../data/product-composites/quantity-understanding-triplet.json";
import evidenceReviewContractsData from "../../data/paradigm-library/evidence-review-contracts.json";
import evidenceUpgradePlanData from "../../data/paradigm-library/evidence-upgrade-plan.json";
import functionParadigmImportanceData from "../../data/paradigm-library/function-paradigm-importance.seed.json";
import functionSynthesisData from "../../data/function-synthesis/foundation-function-synthesis.seed.json";
import paradigmLibraryData from "../../data/paradigm-library/foundational-paradigms.seed.json";
import parcelIdentityData from "../../data/parcel-identity/schaefer200-identity.seed.json";
import regionCoverageData from "../../data/region-coverage/region-coverage-registry.seed.json";
import mtlMemoryRoutingData from "../../data/specialized-atlases/mtl-memory-routing.seed.json";
import freeSurferMarkerCandidateData from "../../data/study-intake/freesurfer-icbm2009c-marker-candidates.generated.json";
import specializedAtlasRegistryData from "../../data/specialized-atlases/specialized-atlas-registry.seed.json";
import specializedAtlasLookupData from "../../data/study-intake/specialized-atlas-coordinate-lookup.generated.json";
import evidenceData from "../../data/research-evidence/foundational-functional-domains.json";
import evidenceConsumerInterfaceData from "../../data/research-evidence/evidence-consumer-interface.generated.json";
import localPaperLibraryData from "../../data/research-evidence/local-paper-library.generated.json";
import trainingParadigmCoverageData from "../../data/research-evidence/training-paradigm-coverage.generated.json";
import { getNetworkDomains, getParcelDomainMatches } from "../../lib/evidence";
import { withNetworkPalette } from "../../lib/networkPalette";
import {
  getParcelCompactDisplayName,
  getParcelRegionStatus,
  getParcelSearchText,
} from "../../lib/parcelNaming";
import { getParadigmMenuSummary } from "../../lib/paradigmMenuCopy";
import { getParadigmImportance, sortParadigmsByImportance } from "../../lib/paradigmImportance";
import { publicPresentationText } from "../../lib/presentationCopy";
import type {
  BrainAtlas,
  BrainNetworkDefinition,
  BrainNetworkTaxonomyFile,
  BrainParcel,
  Yeo7Network,
} from "../../types/brainAtlas";
import type {
  ConnectionOverlayFile,
  ConnectionOverlayNode,
  ConnectionOverlayRelation,
} from "../../types/connectionOverlay";
import type {
  CognitiveParadigm,
  FunctionParadigmImportanceRegistry,
  ParadigmImportanceTier,
  ParadigmLibrary,
  ParadigmOverlayEdge,
  ParadigmOverlayNode,
} from "../../types/paradigmLibrary";
import type {
  ParadigmEvidenceUpgradePlan,
  EvidenceSourceCandidate,
} from "../../types/paradigmEvidencePlan";
import type {
  EvidenceReviewScope,
  EvidenceSourceReview,
  ParadigmEvidenceReviewContracts,
  ParadigmReviewContract,
} from "../../types/paradigmEvidenceReview";
import type { ParcelIdentityEntry, ParcelIdentityRegistry } from "../../types/parcelIdentity";
import type {
  EvidenceDomain,
  EvidenceSource,
  ResearchEvidenceIndex,
} from "../../types/researchEvidence";
import type {
  RegionCoverageEntry,
  RegionCoverageRegistry,
  RegionCoverageStatus,
} from "../../types/regionCoverage";
import type { LearningFunctionCatalog } from "../../types/learningFunction";
import type { FunctionSynthesisRegistry } from "../../types/functionSynthesis";
import type { EmotionModulation3dNode, EmotionModulationFunction3dMapping } from "../../types/emotionCognition";
import { LearningFunctionNavigator } from "./LearningFunctionNavigator";
import { AtlasThreeView, type AtlasPhysicalStructureSelection, type AtlasThreeViewLevel } from "./AtlasThreeView";
import { SURFACE_OPACITY_RANGE } from "./AtlasThreeViewConfig";
import {
  DEFAULT_ATLAS_STRUCTURE_OPACITIES,
  type AtlasStructureOpacityConfig,
} from "./AtlasThreeViewVisualSystem";
import {
  LocalPaperReaderDrawer,
  type LocalPaperReaderFallback,
  type LocalPaperReaderSelection,
  type LocalPaperReaderSource,
  type LocalPaperReaderTarget,
  type LocalPaperReviewDoc,
} from "./LocalPaperReaderDrawer";
import { NetworkFilter } from "./NetworkFilter";
import { ParcelInfoPanel } from "./ParcelInfoPanel";
import { ParcelSearch } from "./ParcelSearch";
import { PhysicalStructureInfoPanel } from "./PhysicalStructureInfoPanel";

const atlas = atlasData as BrainAtlas;
const taxonomy = taxonomyData as BrainNetworkTaxonomyFile;
const evidenceIndex = evidenceData as ResearchEvidenceIndex;
const learningFunctionCatalog = learningFunctionData as LearningFunctionCatalog;
const teachingNodeById: Record<string, { note: string; displayLabel: string; originalLabel: string }> = teachingNodes;
const paradigmLibrary: ParadigmLibrary = { ...paradigmLibraryData, paradigms: paradigmLibraryData.paradigms.map(p => ({ ...p, overlay: { ...p.overlay, nodes: p.overlay.nodes.map(n => ({ ...n, label: teachingNodeById[n.id]?.displayLabel ?? n.label })) } })) } as ParadigmLibrary;
const functionParadigmImportanceRegistry = functionParadigmImportanceData as FunctionParadigmImportanceRegistry;
const evidenceUpgradePlan = evidenceUpgradePlanData as ParadigmEvidenceUpgradePlan;
const evidenceReviewContracts = evidenceReviewContractsData as ParadigmEvidenceReviewContracts;
const functionSynthesisRegistry = functionSynthesisData as FunctionSynthesisRegistry;
const evidenceConsumerInterface = evidenceConsumerInterfaceData as EvidenceConsumerInterfaceIndex;
const quantityUnderstandingTriplet = quantityUnderstandingTripletData as QuantityUnderstandingTripletContract;
const localPaperLibrary = localPaperLibraryData as LocalPaperLibraryIndex;
const trainingParadigmCoverage = trainingParadigmCoverageData as TrainingParadigmCoverageIndex;
const regionCoverageRegistry = regionCoverageData as RegionCoverageRegistry;
// Generated source-label rows are validated by scripts/validate-core.mjs and the source-frame check.
const parcelIdentityRegistry = parcelIdentityData as unknown as ParcelIdentityRegistry;
const freeSurferMarkerCandidates = freeSurferMarkerCandidateData as FreeSurferMarkerCandidateFile;
const specializedAtlasLookup = specializedAtlasLookupData as SpecializedAtlasLookupFile;
const specializedAtlasRegistry = specializedAtlasRegistryData as SpecializedAtlasRegistryFile;
const mtlMemoryRouting = mtlMemoryRoutingData as MtlMemoryRoutingFile;

const LEARNING_FUNCTION_NAV_ORDER = [
  "attention",
  "reaction_speed",
  "short_term_memory",
  "reading",
  "calculation",
  "mental_imagery_operation",
  "reasoning",
  "long_term_memory",
  "executive_function",
];

const learningFunctionNavRank = new Map(
  LEARNING_FUNCTION_NAV_ORDER.map((functionId, index) => [functionId, index]),
);

interface NarrativePresentationStage {
  id: string;
  title: string;
  summary: string;
  speakerCue: string;
  focusNodeIds?: string[];
  supportingNodeIds?: string[];
  mutedNodeIds?: string[];
  focusEdgeIds?: string[];
  supportingEdgeIds?: string[];
  mutedEdgeIds?: string[];
}

interface NarrativeConnectionOverlay extends ConnectionOverlayFile {
  presentationStages?: NarrativePresentationStage[];
  safeClaim?: string;
  boundary?: string;
}

interface LocalPaperLibrarySource {
  sourceId: string;
  title: string;
  citation?: string;
  year?: number;
  doi?: string | null;
  pmid?: string | null;
  pmcid?: string | null;
  sourceType?: string;
  supportScope?: string;
  materialState?: string;
  localTargets?: LocalPaperReaderTarget[];
  externalFallbacks?: LocalPaperReaderFallback[];
  localReviewDocs?: LocalPaperReviewDoc[];
  canonicalReader?: LocalPaperReaderTarget | null;
  canonicalPdf?: LocalPaperReaderTarget | null;
  fulltextStatus?: string;
}

interface LocalPaperLibraryIndex {
  lookup?: {
    doiToSourceId?: Record<string, string>;
  };
  sources: LocalPaperLibrarySource[];
}

interface EvidenceConsumerSource extends LocalPaperReaderSource {
  doi?: string | null;
  localReader?: LocalPaperReaderTarget | null;
}

interface EvidenceConsumerParadigm {
  paradigmId: string;
  sources: EvidenceConsumerSource[];
}

interface EvidenceConsumerInterfaceIndex {
  paradigms: EvidenceConsumerParadigm[];
}

interface QuantityUnderstandingTripletStage {
  id: string;
  order: number;
  label: string;
  prompt: string;
  formalParadigmIds: string[];
  measureLabels: string[];
  storyBeat: string;
}

interface QuantityUnderstandingTripletContract {
  id: string;
  label: string;
  summary: string;
  sourceIds: string[];
  stages: QuantityUnderstandingTripletStage[];
  storyConclusion: string;
  consumerBoundary: string[];
}

interface TrainingParadigmCoverageEvidence {
  fitLevel: string;
  note: string;
  sourceId: string;
  tier: string;
}

interface TrainingParadigmCoverageItem {
  boundarySourceIds: string[];
  coverageStatus: string;
  directSourceIds: string[];
  evidence: TrainingParadigmCoverageEvidence[];
  evidenceSourceIds: string[];
  label: string;
  paradigmId: string;
  policyRationale: string;
  trainingPolicy: string;
}

interface TrainingParadigmCoverageIndex {
  definitions: Record<string, string>;
  items: TrainingParadigmCoverageItem[];
  summary: {
    directT0T1Count: number;
    localTrainingSourceCount: number;
    noLocalTrainingEvidenceCount: number;
    paradigmCount: number;
    positiveAnchorCount: number;
  };
  updated: string;
}

interface TrainingEvidenceDisplayRow {
  evidence: TrainingParadigmCoverageEvidence;
  resolvedSource?: ResolvedEvidenceSourceReader;
  title: string;
  year?: number;
}

interface CognitiveFeedbackGeometry {
  dropPaths: string[];
  height: number;
  labelX: number;
  labelY: number;
  loopPath: string;
  originX: number;
  originY: number;
  width: number;
}

function clampOpacityValue(value: number, minValue: number, maxValue: number) {
  return Math.min(maxValue, Math.max(minValue, value));
}

function SurfaceOpacityControl({
  ariaLabel,
  className = "surface-opacity-control",
  label,
  maxValue = SURFACE_OPACITY_RANGE.max,
  minValue = SURFACE_OPACITY_RANGE.min,
  onChange,
  value,
}: {
  ariaLabel: string;
  className?: string;
  label: string;
  maxValue?: number;
  minValue?: number;
  onChange: (value: number) => void;
  value: number;
}) {
  const percentage = Math.round(value * 100);
  const progress = `${((value - minValue) / (maxValue - minValue || 1)) * 100}%`;
  const commitValue = useCallback(
    (nextValue: number) => onChange(Number(clampOpacityValue(nextValue, minValue, maxValue).toFixed(2))),
    [maxValue, minValue, onChange],
  );
  const commitFromPointer = useCallback(
    (clientX: number, target: HTMLElement) => {
      const rect = target.getBoundingClientRect();
      const ratio = rect.width ? (clientX - rect.left) / rect.width : 0;
      const boundedRatio = Math.min(1, Math.max(0, ratio));
      commitValue(minValue + boundedRatio * (maxValue - minValue));
    },
    [commitValue, maxValue, minValue],
  );

  return (
    <div className={className}>
      <span>{label}</span>
      <div
        aria-label={ariaLabel}
        aria-valuemax={Math.round(maxValue * 100)}
        aria-valuemin={Math.round(minValue * 100)}
        aria-valuenow={percentage}
        aria-valuetext={`${percentage}%`}
        className="surface-opacity-slider"
        onKeyDown={(event) => {
          if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
            event.preventDefault();
            commitValue(value - 0.05);
          }
          if (event.key === "ArrowRight" || event.key === "ArrowUp") {
            event.preventDefault();
            commitValue(value + 0.05);
          }
          if (event.key === "Home") {
            event.preventDefault();
            commitValue(minValue);
          }
          if (event.key === "End") {
            event.preventDefault();
            commitValue(maxValue);
          }
        }}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          commitFromPointer(event.clientX, event.currentTarget);
        }}
        onPointerMove={(event) => {
          if (event.buttons !== 1) {
            return;
          }
          commitFromPointer(event.clientX, event.currentTarget);
        }}
        role="slider"
        style={{ "--surface-opacity-progress": progress } as CSSProperties}
        tabIndex={0}
      >
        <i className="surface-opacity-slider-fill" />
        <i className="surface-opacity-slider-thumb" />
      </div>
      <strong>{percentage}%</strong>
    </div>
  );
}

const FOUNDATION_COGNITIVE_PROCESS_STAGES = [
  {
    id: "information-capture",
    title: "信息抓取",
    description: "看见、听见、抓住目标",
  },
  {
    id: "meaning-transform",
    title: "理解与转换",
    description: "读懂条件，转成关系",
  },
  {
    id: "model-reason",
    title: "建模与推理",
    description: "组织关系，推进判断",
  },
  {
    id: "settle-reuse",
    title: "沉淀与复用",
    description: "总结经验，下次调用",
  },
] as const;

const FOUNDATION_COGNITIVE_ABILITY_LANES = [
  {
    functionId: "attention",
    band: "below",
    row: 1,
    start: 1,
    end: 4,
    color: "#2f7f7f",
    description: "选择目标 / 切换关注 / 抗干扰",
  },
  {
    functionId: "reaction_speed",
    band: "below",
    row: 2,
    start: 1,
    end: 4,
    color: "#c86555",
    description: "接收、判断和反应的节奏",
  },
  {
    functionId: "short_term_memory",
    band: "below",
    row: 3,
    start: 1,
    end: 4,
    color: "#6d78b6",
    description: "托住目标、条件和中间结果",
  },
  {
    functionId: "executive_function",
    band: "below",
    row: 4,
    start: 1,
    end: 5,
    color: "#263b55",
    description: "守规则、切策略、抑冲动、查错误",
  },
  {
    functionId: "reading",
    band: "above",
    row: 2,
    start: 2,
    end: 3,
    color: "#4f7d5a",
    description: "把文字转化成语义",
  },
  {
    functionId: "calculation",
    band: "above",
    row: 3,
    start: 2,
    end: 4,
    color: "#9a7a32",
    description: "数量关系、算式建模、步骤推进",
  },
  {
    functionId: "mental_imagery_operation",
    label: "表象操作",
    band: "above",
    row: 1,
    start: 3,
    end: 5,
    color: "#7c65a8",
    description: "脑中摆图形、空间和关系",
  },
  {
    functionId: "reasoning",
    band: "above",
    row: 2,
    start: 3,
    end: 5,
    color: "#b2647b",
    description: "判断、排除、归纳和推导",
  },
  {
    functionId: "long_term_memory",
    band: "above",
    row: 3,
    start: 4,
    end: 5,
    color: "#637f3f",
    description: "沉淀经验，之后复用",
  },
] as const;

const FOUNDATION_NETWORK_ROLE_COPY: Record<string, { body: string; title: string }> = {
  attention: {
    title: "注意力网络",
    body: "帮助孩子抓住目标、切换关注，并在干扰出现时把注意拉回关键条件。它不是只管“专不专心”，而是贯穿看题、理解和推理的任务入口。",
  },
  reaction_speed: {
    title: "反应速度网络",
    body: "负责把看见或听见的信息快速辨别、选择反应并稳定输出。它影响孩子跟上课堂节奏、读题后动手的速度，以及反应是否拖慢整道题。",
  },
  short_term_memory: {
    title: "短时记忆网络",
    body: "把目标、条件和中间结果临时托住，让孩子能边看、边想、边更新。它一吃力，孩子就容易读到后面忘前面，或算到一半丢步骤。",
  },
  executive_function: {
    title: "执行功能网络",
    body: "负责守规则、切策略、压住冲动并检查错误。它像学习任务里的调度台，让孩子知道什么时候继续、什么时候换方法、什么时候停下来复查。",
  },
  reading: {
    title: "阅读能力网络",
    body: "把文字、符号和句子关系转成可以理解的意思。它决定孩子是不是能把题干条件、限定词和问题目标真正读进来。",
  },
  calculation: {
    title: "计算能力网络",
    body: "把数量、符号和步骤组织成可操作的关系。它既参与基础运算，也参与把题目里的数量关系搭成模型。",
  },
  mental_imagery_operation: {
    title: "表象操作网络",
    body: "在脑中摆放图形、空间位置和关系变化。它帮助孩子不只看见图，还能在脑里移动、旋转、比较和预演。",
  },
  reasoning: {
    title: "推理能力网络",
    body: "负责判断、排除、归纳和推导，把已知条件组织成下一步结论。它在复杂题里帮助孩子从“看懂了”走到“知道怎么走”。",
  },
  long_term_memory: {
    title: "长时记忆网络",
    body: "把做过的经验、方法和结论沉淀下来，并在下一次相似任务中调出来。它让学习不只是当场做完，而是能越做越熟。",
  },
};

const FOUNDATION_GLOBAL_NETWORK_COPY = {
  title: "九项能力协作网络",
  body: "一次学习任务通常会经历信息进入、理解转换、建模推理和沉淀复用。九项基础能力会在不同阶段接力，也会互相托住，让模糊的学习问题变成可以观察、可以训练的环节。",
};

const FOUNDATION_GLOBAL_OVERVIEW_NODES: ParadigmOverlayNode[] = [
  {
    id: "foundation-global-input",
    label: "输入\n看见 / 听见",
    role: "sensory_input",
    networkId: "visual",
    displayParcelId: "schaefer200_010",
    candidateParcelIds: ["schaefer200_010", "schaefer200_011", "schaefer200_148"],
    weight: 0.74,
    caption: "视觉和听觉信息先进入大脑，后面的理解、判断和反应都从这里开始。",
    accentColor: "#2f7f7f",
  },
  {
    id: "foundation-global-attention",
    label: "注意力\n注意调度",
    role: "attention_orienting",
    networkId: "dorsal_attention",
    displayParcelId: "schaefer200_145",
    weight: 0.82,
    caption: "帮助孩子选择当前目标、切换关注，并把无关干扰压下去。",
    accentColor: "#2f7f7f",
  },
  {
    id: "foundation-global-reaction-speed",
    label: "反应速度\n反应节奏",
    role: "response_selection",
    networkId: "somatomotor",
    displayParcelId: "schaefer200_125",
    weight: 0.68,
    caption: "影响孩子接收信息、做出判断和输出反应的整体节奏。",
    accentColor: "#c86555",
  },
  {
    id: "foundation-global-short-memory",
    label: "短时记忆\n临时保持",
    role: "memory_context",
    networkId: "frontoparietal",
    displayParcelId: "schaefer200_181",
    weight: 0.7,
    caption: "临时托住目标、条件和中间结果，让孩子能边看边想边更新。",
    accentColor: "#6d78b6",
  },
  {
    id: "foundation-global-executive",
    label: "DLPFC\n规则/调度",
    role: "executive_control",
    networkId: "frontoparietal",
    regionCoverageId: "dorsolateral-prefrontal-cortex",
    displayParcelId: "schaefer200_068",
    candidateParcelIds: [
      "schaefer200_066",
      "schaefer200_067",
      "schaefer200_068",
      "schaefer200_170",
      "schaefer200_171",
      "schaefer200_172",
      "schaefer200_173",
      "schaefer200_174",
      "schaefer200_175",
    ],
    weight: 0.74,
    caption: "外侧前额叶帮助保持规则、调度策略，并把任务推进方向稳住。",
    accentColor: "#263b55",
  },
  {
    id: "foundation-global-basal-ganglia",
    label: "基底节\n警觉/门控",
    role: "salience_detection",
    networkId: "ventral_attention",
    physicalStructureId: "basal-ganglia",
    weight: 0.68,
    caption: "基底节参与启动、警觉和门控，让当前任务从准备状态进入行动状态。",
    accentColor: "#d8893f",
  },
  {
    id: "foundation-global-reading",
    label: "阅读能力\n语义组织",
    role: "context",
    networkId: "default_mode",
    displayParcelId: "schaefer200_078",
    weight: 0.66,
    caption: "把文字、语序和题目目标组织成孩子能理解的意思。",
    accentColor: "#4f7d5a",
  },
  {
    id: "foundation-global-calculation",
    label: "IPS/SPL\n数量/空间",
    role: "memory_context",
    networkId: "dorsal_attention",
    regionCoverageId: "intraparietal-posterior-parietal",
    displayParcelId: "schaefer200_138",
    candidateParcelIds: [
      "schaefer200_033",
      "schaefer200_036",
      "schaefer200_038",
      "schaefer200_062",
      "schaefer200_138",
      "schaefer200_141",
      "schaefer200_142",
      "schaefer200_166",
      "schaefer200_167",
    ],
    weight: 0.68,
    caption: "顶叶附近承担数量、空间和关系工作区，是计算、表象和推理的重要支架。",
    accentColor: "#9a7a32",
  },
  {
    id: "foundation-global-ipl-integration",
    label: "IPL/角回\n整合接口",
    role: "memory_context",
    networkId: "default_mode",
    regionCoverageId: "angular-gyrus-inferior-parietal",
    displayParcelId: "schaefer200_082",
    candidateParcelIds: [
      "schaefer200_061",
      "schaefer200_063",
      "schaefer200_081",
      "schaefer200_082",
      "schaefer200_165",
      "schaefer200_166",
    ],
    weight: 0.62,
    caption: "下顶叶和角回帮助把文字意义、数量关系、中间结果和已有知识整合起来。",
    accentColor: "#4f7d5a",
  },
  {
    id: "foundation-global-imagery",
    label: "表象操作\n脑中摆图",
    role: "context",
    networkId: "visual",
    displayParcelId: "schaefer200_114",
    weight: 0.64,
    caption: "帮助孩子在脑中保持图形、空间和关系，并继续操作它们。",
    accentColor: "#7c65a8",
  },
  {
    id: "foundation-global-reasoning",
    label: "推理能力\n建模判断",
    role: "executive_control",
    networkId: "frontoparietal",
    displayParcelId: "schaefer200_173",
    weight: 0.7,
    caption: "把条件组织起来，完成判断、排除、归纳和推导。",
    accentColor: "#b2647b",
  },
  {
    id: "foundation-global-long-memory",
    label: "海马/MTL\n经验写入",
    role: "memory_context",
    networkId: "default_mode",
    regionCoverageId: "hippocampal-formation",
    physicalStructureId: "hippocampal-formation",
    weight: 0.66,
    caption: "海马和内侧颞叶参与把经验、事件和关系写入记忆。",
    accentColor: "#637f3f",
  },
  {
    id: "foundation-global-memory-reuse",
    label: "PCC/楔前叶\n经验调用",
    role: "memory_context",
    networkId: "default_mode",
    displayParcelId: "schaefer200_198",
    candidateParcelIds: ["schaefer200_198", "schaefer200_199", "schaefer200_200"],
    weight: 0.58,
    caption: "后扣带和楔前叶更偏向调用背景经验、熟悉模式和已经形成的知识。",
    accentColor: "#637f3f",
  },
];

const FOUNDATION_GLOBAL_OVERVIEW_EDGES: ParadigmOverlayEdge[] = [
  {
    id: "foundation-flow-input-reading",
    sourceNodeId: "foundation-global-input",
    targetNodeId: "foundation-global-reading",
    relation: "candidate_flow",
    weight: 0.66,
    caption: "信息先进入视觉/听觉入口，再被组织成可理解的语义和任务条件。",
    accentColor: "#2f7f7f",
  },
  {
    id: "foundation-flow-reading-ipl",
    sourceNodeId: "foundation-global-reading",
    targetNodeId: "foundation-global-ipl-integration",
    relation: "context_integration",
    weight: 0.6,
    caption: "文字理解之后，需要下顶叶/角回把语义、数量线索和已有知识接起来。",
    accentColor: "#4f7d5a",
  },
  {
    id: "foundation-flow-ipl-calculation",
    sourceNodeId: "foundation-global-ipl-integration",
    targetNodeId: "foundation-global-calculation",
    relation: "context_integration",
    weight: 0.62,
    caption: "语义和数量线索整合后，进入 IPS/SPL 数量空间工作区，形成可操作的关系模型。",
    accentColor: "#9a7a32",
  },
  {
    id: "foundation-flow-calculation-reasoning",
    sourceNodeId: "foundation-global-calculation",
    targetNodeId: "foundation-global-reasoning",
    relation: "candidate_flow",
    weight: 0.62,
    caption: "数量建模和步骤推进，为后续判断、排除和推理提供结构。",
    accentColor: "#c86555",
  },
  {
    id: "foundation-flow-imagery-calculation",
    sourceNodeId: "foundation-global-imagery",
    targetNodeId: "foundation-global-calculation",
    relation: "context_integration",
    weight: 0.54,
    caption: "空间表象把脑中摆图、图形位置和空间关系送入顶叶数量空间工作区。",
    accentColor: "#7c65a8",
  },
  {
    id: "foundation-flow-imagery-reasoning",
    sourceNodeId: "foundation-global-imagery",
    targetNodeId: "foundation-global-reasoning",
    relation: "context_integration",
    weight: 0.48,
    caption: "空间表象也会直接帮助推理过程组织关系。",
    accentColor: "#7c65a8",
  },
  {
    id: "foundation-flow-reasoning-hippocampus",
    sourceNodeId: "foundation-global-reasoning",
    targetNodeId: "foundation-global-long-memory",
    relation: "context_integration",
    weight: 0.58,
    caption: "推理完成后的经验、技巧和结论进入海马/MTL 绑定与写入边界。",
    accentColor: "#637f3f",
  },
  {
    id: "foundation-flow-hippocampus-reuse",
    sourceNodeId: "foundation-global-long-memory",
    targetNodeId: "foundation-global-memory-reuse",
    relation: "context_integration",
    weight: 0.52,
    caption: "写入后的经验会和 PCC/楔前叶的背景经验、熟悉模式和之后复用相连。",
    accentColor: "#637f3f",
  },
  {
    id: "foundation-control-basal-attention",
    sourceNodeId: "foundation-global-basal-ganglia",
    targetNodeId: "foundation-global-attention",
    relation: "salience_gate",
    weight: 0.62,
    caption: "基底节的警觉和门控让注意系统进入准备状态。",
    accentColor: "#d8893f",
  },
  {
    id: "foundation-control-basal-reaction",
    sourceNodeId: "foundation-global-basal-ganglia",
    targetNodeId: "foundation-global-reaction-speed",
    relation: "salience_gate",
    weight: 0.56,
    caption: "警觉和启动状态会影响接收、判断和反应的节奏。",
    accentColor: "#d8893f",
  },
  {
    id: "foundation-control-basal-executive",
    sourceNodeId: "foundation-global-basal-ganglia",
    targetNodeId: "foundation-global-executive",
    relation: "salience_gate",
    weight: 0.48,
    caption: "警觉和门控状态也会影响前额叶规则控制是否及时启动。",
    accentColor: "#d8893f",
  },
  {
    id: "foundation-control-attention-reading",
    sourceNodeId: "foundation-global-attention",
    targetNodeId: "foundation-global-reading",
    relation: "top_down_bias",
    weight: 0.54,
    caption: "注意调度决定哪些文字、条件和目标被优先处理。",
    accentColor: "#2f7f7f",
  },
  {
    id: "foundation-control-memory-calculation",
    sourceNodeId: "foundation-global-short-memory",
    targetNodeId: "foundation-global-calculation",
    relation: "coactivation",
    weight: 0.52,
    caption: "短时记忆把目标、条件和中间结果暂时托住，让顶叶工作区能连续建模。",
    accentColor: "#6d78b6",
  },
  {
    id: "foundation-control-memory-reasoning",
    sourceNodeId: "foundation-global-short-memory",
    targetNodeId: "foundation-global-reasoning",
    relation: "coactivation",
    weight: 0.48,
    caption: "推理推进时，短时记忆继续托住当前目标和中间结果。",
    accentColor: "#6d78b6",
  },
  {
    id: "foundation-control-executive-reasoning",
    sourceNodeId: "foundation-global-executive",
    targetNodeId: "foundation-global-reasoning",
    relation: "top_down_bias",
    weight: 0.64,
    caption: "DLPFC/外侧前额叶把规则和策略压在当前任务上，帮助推理沿着正确方向走。",
    accentColor: "#263b55",
  },
  {
    id: "foundation-control-executive-calculation",
    sourceNodeId: "foundation-global-executive",
    targetNodeId: "foundation-global-calculation",
    relation: "top_down_bias",
    weight: 0.52,
    caption: "DLPFC/外侧前额叶也参与维持步骤、检查规则和调整计算策略。",
    accentColor: "#263b55",
  },
  {
    id: "foundation-control-executive-ipl",
    sourceNodeId: "foundation-global-executive",
    targetNodeId: "foundation-global-ipl-integration",
    relation: "top_down_bias",
    weight: 0.46,
    caption: "DLPFC 会约束语义、数量和已有知识的整合方向，避免任务目标跑偏。",
    accentColor: "#263b55",
  },
];

interface ResolvedEvidenceSourceReader {
  source: EvidenceSourceCandidate;
  consumerSource?: EvidenceConsumerSource;
  librarySource?: LocalPaperLibrarySource;
  readerSource: LocalPaperReaderSource;
  target?: LocalPaperReaderTarget;
  externalHref?: string;
}

const mathLogicStroopDemo = mathLogicStroopDemoData as NarrativeConnectionOverlay;

const MAX_SEARCH_RESULTS = 7;
const MAX_NAMED_REGION_ITEMS = 10;

type ExplanationPanel = "overview" | "paradigm" | "quantity_triplet";
type VideoDemoMode = "problem_solving" | "quantity_comparison";

const VIDEO_DEMO_MODES: Array<{ id: VideoDemoMode; label: string; description: string }> = [
  { id: "problem_solving", label: "做题协作", description: "直觉、语义与冲突管理" },
  { id: "quantity_comparison", label: "数数与数量理解", description: "比较两种脑内连接" },
];

const VIDEO_NETWORK_STAGE_COPY: Record<string, { label: string; description: string }> = {
  "demo-stage-impulse": {
    label: "数学直觉",
    description: "数量直觉先给出冲动答案",
  },
  "demo-stage-logic-network": {
    label: "语义逻辑",
    description: "题干条件重建逻辑关系",
  },
  "demo-stage-conflict": {
    label: "冲突管理",
    description: "Stroop 监控压住冲动",
  },
  "demo-stage-integrated": {
    label: "协调做题",
    description: "协调直觉与语义逻辑协作",
  },
};

const VIDEO_NETWORK_STAGE_REGION_COPY: Record<string, { summary: string; regions: string[] }> = {
  "demo-stage-impulse": {
    summary: "数学直觉主要把视觉输入、顶叶数量/空间表征和熟练答案通路连起来，所以反应很快，也容易先给出冲动答案。",
    regions: ["视觉联合区", "顶内沟", "顶上小叶", "顶下小叶", "额顶控制区"],
  },
  "demo-stage-logic-network": {
    summary: "语义逻辑会把题干文字、限定词和条件关系组织起来，再交给前额叶和顶叶联合区维持推理结构。",
    regions: ["视觉联合区", "颞顶联合区", "颞中/颞下语义区", "背外侧前额叶", "顶叶联合区"],
  },
  "demo-stage-conflict": {
    summary: "冲突管理负责发现“直觉答案”和“题干要求”不一致，再调动前额叶、前岛叶和顶叶网络压住自动反应。",
    regions: ["视觉联合区", "前扣带/内侧额叶", "前岛叶/额叶岛盖", "丘脑", "背外侧前额叶", "额下回", "顶叶联合区", "前运动区/SMA"],
  },
  "demo-stage-integrated": {
    summary: "协调做题不是让直觉消失，而是让冲突管理先刹车，再让语义逻辑约束数学直觉重新参与计算。",
    regions: ["视觉联合区", "顶内沟/顶叶联合区", "颞顶语义网络", "前扣带/前岛叶", "前额叶控制区"],
  },
  "quantity-stage-counting": {
    summary: "机械数数更像一条顺序执行链：眼睛逐项寻找目标，后顶叶避免漏数和重数，额叶暂时守住计数规则与当前累计值。",
    regions: ["点阵视觉输入", "后顶叶逐项搜索", "顶内沟数量累加", "额叶计数顺序"],
  },
  "quantity-stage-language": {
    summary: "理解“七”或“7”代表多少时，除了看见符号，还要把数词语义、符号形式和顶叶数量表征接到一起，网络协作范围更广。",
    regions: ["数字/数词视觉输入", "颞叶数词语义", "下顶叶形式对应", "顶内沟数量意义"],
  },
};

const QUANTITY_COMPARISON_STAGES: NarrativePresentationStage[] = [
  {
    id: "quantity-stage-counting",
    title: "1. 机械数数",
    summary: "逐个寻找、维持顺序并累加当前数量。",
    speakerCue: "先看一条相对线性的执行链：看一个、记一个、再找下一个。",
  },
  {
    id: "quantity-stage-language",
    title: "2. 语言—数量理解",
    summary: "把数字、数词与真实数量接起来，再判断它们之间的大小关系。",
    speakerCue: "再看数量理解：它不只是继续数，而是让语言、符号和数量意义同时在线。",
  },
];

function prefixParadigmOverlay(paradigm: CognitiveParadigm, prefix: string) {
  const nodeId = (id: string) => `${prefix}:${id}`;
  return {
    nodes: paradigm.overlay.nodes.map((node) => ({ ...node, id: nodeId(node.id) })),
    edges: paradigm.overlay.edges.map((edge) => ({
      ...edge,
      id: `${prefix}:${edge.id}`,
      sourceNodeId: nodeId(edge.sourceNodeId),
      targetNodeId: nodeId(edge.targetNodeId),
    })),
  };
}

const mechanicalCountingParadigm = paradigmLibrary.paradigms.find(
  (paradigm) => paradigm.id === "subitizing-enumeration",
);
const symbolicQuantityParadigm = paradigmLibrary.paradigms.find(
  (paradigm) => paradigm.id === "symbolic-quantity-mapping",
);
const mechanicalCountingOverlay = mechanicalCountingParadigm
  ? prefixParadigmOverlay(mechanicalCountingParadigm, "quantity-counting")
  : { nodes: [], edges: [] };
const symbolicQuantityOverlay = symbolicQuantityParadigm
  ? prefixParadigmOverlay(symbolicQuantityParadigm, "quantity-language")
  : { nodes: [], edges: [] };
const languageQuantitySemanticNode: ParadigmOverlayNode = {
  id: "quantity-language:semantic-number-word",
  label: "颞叶数词语义",
  role: "context",
  networkId: "default_mode",
  regionCoverageId: "semantic-temporal-cortex",
  displayParcelId: "schaefer200_187",
  candidateParcelIds: ["schaefer200_076", "schaefer200_187"],
  weight: 0.76,
  caption: "数词和数量表达先被理解成有意义的语言内容，再与数字形式和数量大小对应。",
  accentColor: "#3975a9",
};
const languageQuantitySemanticEdge: ParadigmOverlayEdge = {
  id: "quantity-language:semantic-to-form-mapping",
  sourceNodeId: languageQuantitySemanticNode.id,
  targetNodeId: "quantity-language:symbol-quantity-ipl",
  relation: "context_integration",
  weight: 0.66,
  caption: "数词语义进入下顶叶，与数字形式和数量意义建立对应。",
  accentColor: "#3975a9",
};

function initialQaMode() {
  return new URLSearchParams(window.location.search).get("qa");
}

function isInitialNetworkFocusMode() {
  return initialQaMode() === "network-focus";
}

function isInitialBrainOnlyMode() {
  return initialQaMode() === "brain-only";
}

const THREE_VIEW_CAMERA_FIT_SCALE = {
  atlasReference: 1.24,
  brainOnly: 1.3,
  functionOverview: 1.3,
  globalOverview: 1.38,
  paradigmDetail: 1.32,
  videoNetworkFocus: 1.24,
} as const;

const PARADIGM_GUIDE_ROLE_LABELS: Record<FunctionUseCaseRole, string> = {
  anchor: "主入口",
  core: "主要范式",
  supporting: "主要范式",
  related: "次要范式",
  context: "次要范式",
};

const ATTENTION_RELATION_GROUPS = [
  {
    label: "进入和维持",
    paradigms: "CPT / 警觉任务",
    text: "看孩子能不能进入任务，并在任务变长以后继续守住目标。",
  },
  {
    label: "定向和搜索",
    paradigms: "Posner / 视觉搜索 / MOT",
    text: "看注意能不能转到正确位置，在复杂画面里找到目标，并同时追踪多个对象。",
  },
  {
    label: "抗干扰",
    paradigms: "Stroop / Flanker",
    text: "看规则、目标和旁边干扰互相竞争时，孩子能不能按当前任务来反应。",
  },
  {
    label: "资源分配",
    paradigms: "双任务 / 任务切换",
    text: "看两个任务同时挤进来时，大脑怎么排队、切换和分配处理资源。",
  },
];

const CALCULATION_PARADIGM_GROUPS = [
  {
    label: "数量理解",
    paradigmIds: [
      "approximate-number-sense",
      "symbolic-quantity-mapping",
      "number-comparison",
      "subitizing-enumeration",
      "number-line-estimation",
    ],
  },
  {
    label: "运算加工",
    paradigmIds: ["mental-arithmetic", "arithmetic-fact-retrieval"],
  },
  {
    label: "符号规则",
    paradigmIds: ["algebra-equation-solving"],
  },
  {
    label: "数学建模",
    paradigmIds: ["math-word-problem", "geometric-reasoning", "probability-statistics-reasoning"],
  },
] as const;

const CALCULATION_RELATION_GROUPS = [
  {
    label: "基础入口",
    paradigms: "数量理解",
    text: "先看孩子能否理解多少、大小、顺序，以及数字符号究竟代表什么。",
  },
  {
    label: "精确处理",
    paradigms: "计数 / 心算 / 算术事实",
    text: "在数量意义稳定以后，再观察精确计数、熟练答案提取和多步骤在线运算。",
  },
  {
    label: "规则变换",
    paradigms: "代数符号",
    text: "用等号、未知数和运算规则维持关系，并按步骤转换表达形式。",
  },
  {
    label: "综合应用",
    paradigms: "应用题 / 几何 / 概率统计",
    text: "把数量、语言、空间、条件和推理组织成可以解决的数学模型。",
  },
] as const;

const ATTENTION_LEARNING_READY_STATES = [
  "能进入任务，知道自己现在要看什么。",
  "能把目标维持住，不被最显眼的信息带跑。",
  "任务变长以后，还能把注意力拉回来。",
  "遇到冲突时，会先看规则，再做反应。",
];

const ATTENTION_LEARNING_UNSUPPORTED_STATES = [
  "刚开始慢热，需要别人反复提醒。",
  "漏看目标，或者只看到最显眼的部分。",
  "还没读完题就开始答，容易被字面信息带偏。",
  "做一会儿就掉线，错误集中出现在后半段。",
];

const RELATION_LABELS: Record<ConnectionOverlayRelation, string> = {
  candidate_flow: "参考流向",
  top_down_bias: "自上而下约束",
  salience_gate: "显著性门控",
  context_integration: "背景整合",
  coactivation: "共同激活",
  model_assumption: "模型假设",
};

const COVERAGE_LABELS: Record<RegionCoverageStatus, string> = {
  parcel_proxy: "点位代理",
  network_proxy: "网络代理",
  outside_current_atlas: "图谱外",
  needs_specialized_atlas: "需专门图谱",
  specialized_atlas_reference: "专门图谱参照",
};

const SOURCE_TYPE_LABELS: Record<string, string> = {
  paper: "论文",
  specification: "规范",
  model_note: "模型说明",
};

const SOURCE_KIND_LABELS: Record<string, string> = {
  review: "综述",
  meta_analysis: "元分析",
  task_study: "任务研究",
  behavioral_paradigm: "行为范式",
  atlas_note: "图谱说明",
};

const TRAINING_COVERAGE_STATUS_COPY: Record<
  string,
  {
    label: string;
    relation: (coverage: TrainingParadigmCoverageItem) => string;
    tone: string;
  }
> = {
  direct_training: {
    label: "直接训练",
    relation: (coverage) =>
      `有 ${coverage.directSourceIds.length} 项本地来源训练了同一范式或非常接近的操作版本；这里只作为训练设计依据，不写成产品疗效。`,
    tone: "direct",
  },
  near_component: {
    label: "近成分",
    relation: () =>
      "目前训练的是这个范式会用到的关键成分，不是本范式直接训练；适合启发训练抓手，不能替代专门验证。",
    tone: "near",
  },
  broad_plasticity: {
    label: "广义可塑性",
    relation: () =>
      "目前只是更宽泛的练习可塑性背景，不是本范式直接训练；只能说明相关能力可能可训练，不能推出这个范式会直接改善。",
    tone: "broad",
  },
  boundary_only: {
    label: "仅边界",
    relation: () =>
      "本地来源主要用于提醒迁移边界或反例边界；这里不把它写成正向训练依据。",
    tone: "boundary",
  },
  mitigation_only: {
    label: "规避/核验",
    relation: () =>
      "这个范式更适合用来核验错误模式或设计补偿策略，不建议把反复练习错误现象本身当成训练。",
    tone: "mitigation",
  },
  no_local_training_evidence: {
    label: "本地空缺",
    relation: () =>
      "当前本地库没有足够接近的训练研究；页面只保留观察和验证入口，不补写训练结论。",
    tone: "empty",
  },
};

const TRAINING_EVIDENCE_FIT_LABELS: Record<string, string> = {
  direct_training: "直接来源",
  near_component: "近成分来源",
  broad_plasticity: "广义背景",
  transfer_boundary: "迁移边界",
};

const REVIEW_SCOPE_LABELS: Record<EvidenceReviewScope, string> = {
  seed_only: "种子草稿",
  candidate_task_family: "范式族参考",
  candidate_network: "网络级参考",
  reviewed_network: "网络级已核",
  specialized_atlas_needed: "需专门图谱",
};

const MTL_ROUTE_STATUS_LABELS: Record<MtlMemoryRoute["status"], string> = {
  production_boundary: "生产边界",
  candidate_boundary: "候选边界",
  mechanism_boundary: "机制边界",
};

const FREESURFER_MARKER_ROLE_LABELS: Record<string, string> = {
  amygdala_nucleus_candidate: "杏仁核核团候选",
  hippocampal_subfield_candidate: "海马亚区候选",
  thalamic_nucleus_candidate: "丘脑分核候选",
};

const FREESURFER_MARKER_GATE_LABELS: Record<string, string> = {
  adult_probability_reasoning_marker_candidate: "成人概率推理边界",
  deductive_reasoning_boundary_marker_candidate: "推理边界候选",
  source_reviewed_marker_candidate: "来源坐标已核候选",
  stopping_meta_analysis_marker_candidate: "停止控制元分析候选",
};

const USE_CASE_ROLE_LABELS: Record<FunctionUseCaseRole, string> = {
  anchor: "主范式",
  core: "核心范式",
  supporting: "支撑范式",
  related: "参与范式",
  context: "学科场景",
};

const USE_CASE_ROLE_ORDER: Record<FunctionUseCaseRole, number> = {
  anchor: 0,
  core: 1,
  supporting: 2,
  related: 3,
  context: 4,
};

const FUNCTION_OVERVIEW_MAX_PARADIGM_HEAT_SOURCES = 7;
const FUNCTION_OVERVIEW_IMPORTANCE_HEAT_WEIGHT: Record<ParadigmImportanceTier, number> = {
  core: 0.52,
  supporting: 0.36,
  related: 0.22,
  context: 0.12,
};
const FUNCTION_OVERVIEW_STAGE_HEAT_WEIGHT: Record<string, number> = {
  reviewed_parcel: 1,
  reviewed_network: 0.76,
  ready_for_review: 0.62,
  source_candidates: 0.5,
  seeded: 0.42,
};

function clampOverviewHeat(value: number) {
  return Math.max(0.08, Math.min(value, 0.44));
}

function paradigmNodeToFunctionHeatNode(
  node: ParadigmOverlayNode,
  paradigm: CognitiveParadigm,
  functionId: string,
  tier: ParadigmImportanceTier,
  stage: string | undefined,
) {
  const importanceWeight = FUNCTION_OVERVIEW_IMPORTANCE_HEAT_WEIGHT[tier];
  const stageWeight = FUNCTION_OVERVIEW_STAGE_HEAT_WEIGHT[stage ?? ""] ?? 0.46;
  const primaryFunctionWeight = paradigm.primaryFunctionId === functionId ? 1 : 0.72;

  return {
    ...node,
    id: `function-heat-${functionId}-${paradigm.id}-${node.id}`,
    label: `${paradigm.label}：${node.label}`,
    weight: clampOverviewHeat(node.weight * importanceWeight * stageWeight * primaryFunctionWeight),
  };
}

function initialFunctionId() {
  const searchParams = new URLSearchParams(window.location.search);
  const requestedParadigmId = searchParams.get("paradigm");
  const requestedParadigm = paradigmLibrary.paradigms.find((paradigm) => paradigm.id === requestedParadigmId);
  const requestedFunctionId =
    searchParams.get("function") ??
    requestedParadigm?.primaryFunctionId ??
    (searchParams.get("qa") === "network-focus" ? "calculation" : null);
  if (!requestedFunctionId) {
    return null;
  }
  return learningFunctionCatalog.functions.find((learningFunction) => learningFunction.id === requestedFunctionId)?.id ?? null;
}

function initialParadigmId() {
  const requestedParadigmId = new URLSearchParams(window.location.search).get("paradigm");
  return paradigmLibrary.paradigms.find((paradigm) => paradigm.id === requestedParadigmId)?.id ?? null;
}

const emotionModulation3dEdgeById = new Map(
  emotionModulation3dLayerContract.edges.map((edge) => [edge.id, edge]),
);
const EMOTION_MODULATION_NODE_PREFIX = "emotion-modulation:";
const EMOTION_MODULATION_ACCENT = "#c85f4f";
const EMOTION_MODULATION_BOUNDARY_ACCENT = "#a9783f";
const EMOTION_MODULATION_GUARDRAIL = "状态调制层，不新增诊断或训练疗效结论";
const EMOTION_MODULATION_STRENGTH_LABELS: Record<EmotionModulationFunction3dMapping["displayStrength"], string> = {
  strongest: "最强调制",
  strong: "强调制",
  secondary: "参与调制",
  candidate: "候选调制",
  exploratory: "探索观察",
};
const EMOTION_MODULATION_BRANCH_LABELS: Record<string, string> = {
  "salience-capture": "显著性抢占",
  "control-demand": "控制需求",
  "value-feedback": "反馈价值",
  "memory-bias": "记忆权重",
  "arousal-speed-accuracy": "速度-准确率",
};
const EMOTION_MODULATION_MECHANISM_STYLES: Record<string, { color: string; gradient: string }> = {
  "salience-capture": {
    color: "#ff5a6f",
    gradient: "linear-gradient(135deg, #ff4b67 0%, #ff9f43 100%)",
  },
  "control-demand": {
    color: "#8d5cff",
    gradient: "linear-gradient(135deg, #6746ff 0%, #d466ff 100%)",
  },
  "value-feedback": {
    color: "#ffb000",
    gradient: "linear-gradient(135deg, #ffb000 0%, #ff6a3d 100%)",
  },
  "memory-bias": {
    color: "#22b8b5",
    gradient: "linear-gradient(135deg, #00a6d6 0%, #42d392 100%)",
  },
  "arousal-speed-accuracy": {
    color: "#f04ea1",
    gradient: "linear-gradient(135deg, #f04ea1 0%, #ffcf4a 100%)",
  },
};
const EMOTION_MODULATION_NODE_WEIGHT: Record<EmotionModulation3dNode["supportLevel"], number> = {
  application_ready: 0.72,
  review_grade: 0.58,
  candidate_preview: 0.44,
  boundary_only: 0.34,
};

function emotionOverlayNodeId(nodeId: string) {
  return `${EMOTION_MODULATION_NODE_PREFIX}${nodeId}`;
}

function emotionModulationPrimaryBranchId(branchIds: string[]) {
  return branchIds.find((branchId) => EMOTION_MODULATION_MECHANISM_STYLES[branchId]) ?? branchIds[0];
}

function emotionModulationAccentForBranches(
  branchIds: string[],
  supportLevel?: EmotionModulation3dNode["supportLevel"],
) {
  if (supportLevel === "boundary_only") {
    return EMOTION_MODULATION_BOUNDARY_ACCENT;
  }
  const primaryBranchId = emotionModulationPrimaryBranchId(branchIds);
  return EMOTION_MODULATION_MECHANISM_STYLES[primaryBranchId]?.color ?? EMOTION_MODULATION_ACCENT;
}

function emotionModulationCopy(
  mapping: EmotionModulationFunction3dMapping,
) {
  return mapping.shortCopy;
}

function emotionModulationRelation(branchIds: string[]): ConnectionOverlayRelation {
  if (branchIds.includes("control-demand")) {
    return "top_down_bias";
  }
  if (branchIds.includes("salience-capture")) {
    return "salience_gate";
  }
  if (branchIds.includes("memory-bias") || branchIds.includes("value-feedback")) {
    return "context_integration";
  }
  return "model_assumption";
}

function emotionPhysicalStructureIdForNode(
  node: EmotionModulation3dNode,
  enableAshsAppFitPreview: boolean,
) {
  if (node.nodeKind === "app_fit_preview_anchor" && !enableAshsAppFitPreview) {
    return undefined;
  }
  if (node.atlasReference.type !== "surface_structures") {
    return undefined;
  }

  const structureText = node.atlasReference.structureIds.join(" ").toLowerCase();
  if (structureText.includes("amygdala")) {
    return "amygdala";
  }
  if (structureText.includes("hippocampus")) {
    return "hippocampal-formation";
  }
  if (structureText.includes("thalamus") || structureText.includes("tha-")) {
    return "thalamus";
  }
  if (
    structureText.includes("accumbens") ||
    structureText.includes("caudate") ||
    structureText.includes("putamen") ||
    structureText.includes("pallidum") ||
    structureText.includes("hypothalamus") ||
    structureText.includes("tegmental") ||
    structureText.includes("substantia")
  ) {
    return "basal-ganglia";
  }

  return undefined;
}

function emotionModulationNodeToOverlayNode(
  node: EmotionModulation3dNode,
  parcelById: ReadonlyMap<string, BrainParcel>,
  enableAshsAppFitPreview: boolean,
): ParadigmOverlayNode | null {
  const displayLayer: ParadigmOverlayNode["displayLayer"] =
    node.supportLevel === "boundary_only" || node.supportLevel === "candidate_preview"
      ? "boundary"
      : node.supportLevel === "review_grade"
        ? "support"
        : "default";
  const accentColor =
    node.nodeKind === "app_fit_preview_anchor"
      ? "#b45cff"
      : emotionModulationAccentForBranches(node.mechanismBranchIds, node.supportLevel);
  const baseNode = {
    id: emotionOverlayNodeId(node.id),
    label: node.label,
    role: "modulator" as const,
    weight: EMOTION_MODULATION_NODE_WEIGHT[node.supportLevel],
    caption: `${node.safeUse} 边界：${node.boundary}`,
    displayLayer,
    accentColor,
  };

  if (node.atlasReference.type === "schaefer200_parcels") {
    const candidateParcelIds = node.atlasReference.parcelIds.filter((parcelId) => parcelById.has(parcelId));
    const displayParcelId = candidateParcelIds[0];
    const displayParcel = displayParcelId ? parcelById.get(displayParcelId) : undefined;
    if (!displayParcel) {
      return null;
    }

    return {
      ...baseNode,
      networkId: displayParcel.network,
      displayParcelId,
      candidateParcelIds,
    };
  }

  if (node.nodeKind === "app_fit_preview_anchor" && !enableAshsAppFitPreview) {
    return null;
  }

  const physicalStructureId = emotionPhysicalStructureIdForNode(node, enableAshsAppFitPreview);
  if (!physicalStructureId) {
    return null;
  }

  return {
    ...baseNode,
    networkId: "limbic",
    physicalStructureId,
    specializedAtlasLabelIds: node.atlasReference.structureIds,
  };
}

function emotionModulationNodesForMapping(
  mapping: EmotionModulationFunction3dMapping | null,
  parcelById: ReadonlyMap<string, BrainParcel>,
  enableAshsAppFitPreview: boolean,
) {
  if (!mapping) {
    return [] as ParadigmOverlayNode[];
  }

  return mapping.defaultNodeIds
    .map((nodeId) => emotionModulation3dNodeById[nodeId])
    .filter((node): node is EmotionModulation3dNode => Boolean(node))
    .map((node) => emotionModulationNodeToOverlayNode(node, parcelById, enableAshsAppFitPreview))
    .filter((node): node is ParadigmOverlayNode => Boolean(node));
}

function emotionModulationEdgesForMapping(
  mapping: EmotionModulationFunction3dMapping | null,
  availableNodeIds: Set<string>,
) {
  if (!mapping) {
    return [] as ParadigmOverlayEdge[];
  }

  return mapping.defaultEdgeIds
    .map((edgeId) => emotionModulation3dEdgeById.get(edgeId))
    .filter((edge): edge is NonNullable<typeof edge> => Boolean(edge))
    .map((edge) => ({
      id: emotionOverlayNodeId(edge.id),
      sourceNodeId: emotionOverlayNodeId(edge.sourceNodeId),
      targetNodeId: emotionOverlayNodeId(edge.targetNodeId),
      relation: emotionModulationRelation(edge.mechanismBranchIds),
      weight: 0.62,
      caption: `${edge.label}：${edge.interpretation} 边界：${edge.boundary}`,
      accentColor: emotionModulationAccentForBranches(edge.mechanismBranchIds),
    }))
    .filter((edge) => availableNodeIds.has(edge.sourceNodeId) && availableNodeIds.has(edge.targetNodeId));
}

function dimBaseOverlayNodeForEmotionLayer(node: ParadigmOverlayNode): ParadigmOverlayNode {
  return {
    ...node,
    displayLayer: "boundary",
    weight: Math.min(node.weight, node.physicalStructureId ? 0.12 : 0.08),
  };
}

function dimBaseOverlayEdgeForEmotionLayer(edge: ParadigmOverlayEdge): ParadigmOverlayEdge {
  return {
    ...edge,
    accentColor: edge.accentColor ?? "#8fa5ad",
    weight: Math.min(edge.weight, 0.08),
  };
}

function normalizeChineseSearchText(text: string) {
  return text.trim().toLowerCase().replace(/\s+/g, "");
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function scoreUseCaseMatch(query: string, useCase: ParadigmUseCase) {
  const normalizedQuery = normalizeChineseSearchText(query);
  if (!normalizedQuery) {
    return 0;
  }

  let score = 0;
  useCase.keywords.forEach((keyword) => {
    const normalizedKeyword = normalizeChineseSearchText(keyword);
    if (normalizedKeyword && normalizedQuery.includes(normalizedKeyword)) {
      score += 4;
    }
  });
  useCase.parentPhrases.forEach((phrase) => {
    const normalizedPhrase = normalizeChineseSearchText(phrase);
    if (normalizedPhrase && normalizedQuery.includes(normalizedPhrase)) {
      score += 6;
    }
  });
  [
    useCase.mechanismTitle,
    useCase.commonPresentation,
    ...useCase.dailyPresentations,
    ...useCase.academicPresentations,
  ].forEach((text) => {
    const normalizedText = normalizeChineseSearchText(text);
    if (normalizedText && normalizedText.includes(normalizedQuery)) {
      score += 2;
    }
  });

  return score;
}

interface SpecializedAtlasLookupMatch {
  atlasId: string;
  labelId: string | null;
  englishLabel: string | null;
  chineseLabel: string | null;
  reason: string;
}

interface SpecializedAtlasLookupRow {
  peakId: string;
  sourceId: string;
  paradigmId?: string;
  reportedRegion: string;
  mni: number[];
  atlasMatches: SpecializedAtlasLookupMatch[];
  reviewDecision: string;
  reviewNote?: string;
  caution: string;
}

interface SpecializedAtlasLookupFile {
  lookupRows: SpecializedAtlasLookupRow[];
}

interface FreeSurferMarkerCandidate {
  atlasId: string;
  atlasLabel: string;
  displayPolicy: string;
  includeInConservativeMarkerLayer: boolean;
  markerId: string;
  markerNote: string;
  mni: number[];
  paradigmId: string;
  probability: number;
  reportedRegion: string;
  role: string;
  sourceId: string;
  sourceReviewGate: string;
  userFacingLabel: string;
}

interface FreeSurferMarkerCandidateFile {
  markerCandidates: FreeSurferMarkerCandidate[];
  summary: {
    includedMarkerCandidateCount: number;
    heldMarkerCandidateCount: number;
  };
}

interface SpecializedAtlasLookupGroup {
  id: string;
  label: string;
  rowCount: number;
  sourceIds: string[];
  reportedRegions: string[];
  mniExamples: number[][];
  reviewNotes: string[];
  caution: string;
}

interface SpecializedAtlasRegistryFile {
  labels: Array<{
    id: string;
    chineseLabel: string;
    englishLabel: string;
    caution: string;
  }>;
}

interface MtlMemoryRoute {
  paradigmId: string;
  status: "production_boundary" | "candidate_boundary" | "mechanism_boundary";
  displayIntent: string;
  primaryAtlasLabelIds: string[];
  reviewAtlasLabelIds: string[];
  sourceIds: string[];
  safeTalkTrack: string;
  blockedClaims: string[];
  nextRefinementGate: string;
}

interface MtlMemoryRoutingFile {
  routes: MtlMemoryRoute[];
}

function getReviewedAtlasLabel(row: SpecializedAtlasLookupRow) {
  const labels = row.atlasMatches
    .map((match) => match.chineseLabel ?? match.englishLabel)
    .filter((label): label is string => Boolean(label));
  return [...new Set(labels)].join(" / ") || row.reportedRegion;
}

function groupSpecializedLookupRows(rows: SpecializedAtlasLookupRow[]) {
  const groups = new Map<string, SpecializedAtlasLookupGroup>();

  rows.forEach((row) => {
    const label = getReviewedAtlasLabel(row);
    const group = groups.get(label) ?? {
      id: label,
      label,
      rowCount: 0,
      sourceIds: [],
      reportedRegions: [],
      mniExamples: [],
      reviewNotes: [],
      caution: row.caution,
    };

    group.rowCount += 1;
    if (!group.sourceIds.includes(row.sourceId)) {
      group.sourceIds.push(row.sourceId);
    }
    if (!group.reportedRegions.includes(row.reportedRegion)) {
      group.reportedRegions.push(row.reportedRegion);
    }
    if (group.mniExamples.length < 3) {
      group.mniExamples.push(row.mni);
    }
    if (row.reviewNote && !group.reviewNotes.includes(row.reviewNote)) {
      group.reviewNotes.push(row.reviewNote);
    }
    groups.set(label, group);
  });

  return [...groups.values()].sort((a, b) => b.rowCount - a.rowCount || a.label.localeCompare(b.label, "zh-Hans-CN"));
}

const NODE_ROLE_LABELS: Record<string, string> = {
  sensory_input: "感觉输入",
  attention_orienting: "注意定向",
  salience_detection: "显著性检测",
  conflict_monitoring: "冲突监控",
  executive_control: "执行控制",
  response_selection: "反应选择",
  memory_context: "记忆背景",
  affective_value: "情绪价值",
  context: "背景",
  modulator: "调节",
};

function getOverlayDisplayParcelIds(nodes: ParadigmOverlayNode[]) {
  const displayParcelIds = new Set<string>();

  nodes.forEach((node) => {
    const firstDisplayParcelId = node.displayParcelId ?? node.candidateParcelIds?.[0];
    if (firstDisplayParcelId) {
      displayParcelIds.add(firstDisplayParcelId);
    }
  });

  return Array.from(displayParcelIds);
}

function getOverlayCoverageParcelIds(nodes: ParadigmOverlayNode[]) {
  const candidateParcelIds = new Set<string>();

  nodes.forEach((node) => {
    node.candidateParcelIds?.forEach((parcelId) => candidateParcelIds.add(parcelId));
  });

  return Array.from(candidateParcelIds);
}

function getParadigmDisplayParcelIds(paradigm: CognitiveParadigm) {
  return getOverlayDisplayParcelIds(paradigm.overlay.nodes);
}

function connectionNodeToParadigmNode(
  node: ConnectionOverlayNode,
  parcelById: ReadonlyMap<string, BrainParcel>,
): ParadigmOverlayNode | null {
  const parcel = node.parcelId ? parcelById.get(node.parcelId) : undefined;
  const networkId = node.networkId ?? parcel?.network;
  if (!networkId) {
    return null;
  }

  return {
    id: node.id,
    label: node.label,
    role: node.role,
    networkId,
    displayParcelId: node.displayParcelId ?? node.parcelId,
    candidateParcelIds: node.candidateParcelIds ?? (node.parcelId ? [node.parcelId] : undefined),
    regionCoverageId: node.regionCoverageId,
    physicalStructureId: node.physicalStructureId,
    specializedAtlasLabelIds: node.specializedAtlasLabelIds,
    displayLayer: node.displayLayer,
    accentColor: node.accentColor,
    weight: node.weight,
    caption: node.caption,
  };
}

function connectionOverlayToParadigmNodes(
  overlay: NarrativeConnectionOverlay | null,
  parcelById: ReadonlyMap<string, BrainParcel>,
) {
  if (!overlay) {
    return [];
  }

  return overlay.nodes
    .map((node) => connectionNodeToParadigmNode(node, parcelById))
    .filter((node): node is ParadigmOverlayNode => Boolean(node));
}

function applyNarrativeStageToNodes(
  nodes: ParadigmOverlayNode[],
  stage: NarrativePresentationStage | null,
) {
  if (!stage) {
    return nodes;
  }

  const focusNodeIds = new Set(stage.focusNodeIds ?? []);
  const supportingNodeIds = new Set(stage.supportingNodeIds ?? []);
  const mutedNodeIds = new Set(stage.mutedNodeIds ?? []);

  return nodes.map((node) => {
    if (focusNodeIds.has(node.id)) {
      return { ...node, weight: Math.max(node.weight, 0.94) };
    }
    if (supportingNodeIds.has(node.id)) {
      return { ...node, weight: Math.min(Math.max(node.weight, 0.18), 0.28) };
    }
    if (mutedNodeIds.has(node.id)) {
      return { ...node, weight: Math.min(node.weight, 0.04) };
    }
    return { ...node, weight: Math.min(node.weight, 0.06) };
  });
}

function applyNarrativeStageToEdges(
  edges: ParadigmOverlayEdge[],
  stage: NarrativePresentationStage | null,
) {
  if (!stage) {
    return edges;
  }

  const focusEdgeIds = new Set(stage.focusEdgeIds ?? []);
  const supportingEdgeIds = new Set(stage.supportingEdgeIds ?? []);
  const mutedEdgeIds = new Set(stage.mutedEdgeIds ?? []);

  return edges.map((edge) => {
    if (focusEdgeIds.has(edge.id)) {
      return { ...edge, weight: Math.max(edge.weight, 0.9) };
    }
    if (supportingEdgeIds.has(edge.id)) {
      return { ...edge, weight: Math.min(Math.max(edge.weight, 0.12), 0.2) };
    }
    if (mutedEdgeIds.has(edge.id)) {
      return { ...edge, weight: Math.min(edge.weight, 0.015) };
    }
    return { ...edge, weight: Math.min(edge.weight, 0.02) };
  });
}

function sourceHref(source: EvidenceSource) {
  if (source.url) {
    return source.url;
  }
  if (source.doi) {
    return `https://doi.org/${source.doi}`;
  }
  return undefined;
}

function sourceCandidateHref(source: EvidenceSourceCandidate) {
  if (source.url) {
    return source.url;
  }
  if (source.doi) {
    return `https://doi.org/${source.doi}`;
  }
  return undefined;
}

function sourceCandidateShortLabel(source: EvidenceSourceCandidate) {
  const authorToken = source.citation.split(",")[0]?.split(/\s+/)[0] ?? "研究";
  return `${authorToken} ${source.year}`;
}

function trainingCoverageStatusCopy(coverageStatus: string) {
  return (
    TRAINING_COVERAGE_STATUS_COPY[coverageStatus] ?? {
      label: coverageStatus,
      relation: (coverage: TrainingParadigmCoverageItem) =>
        trainingParadigmCoverage.definitions[coverage.coverageStatus] ?? "训练证据关系待补充。",
      tone: "neutral",
    }
  );
}

function trainingEvidenceFitLabel(fitLevel: string) {
  return TRAINING_EVIDENCE_FIT_LABELS[fitLevel] ?? fitLevel;
}

function trainingEvidenceSourceLabel(row: TrainingEvidenceDisplayRow) {
  if (row.resolvedSource) {
    return sourceCandidateShortLabel(row.resolvedSource.source);
  }
  return row.year ? `${row.title} ${row.year}` : row.title;
}

function normalizeDoi(doi?: string | null) {
  return doi
    ?.trim()
    .toLowerCase()
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
    .replace(/^doi:/, "");
}

function uniqueExternalFallbacks(fallbacks: Array<LocalPaperReaderFallback | null | undefined>) {
  const seen = new Set<string>();
  return fallbacks.filter((fallback): fallback is LocalPaperReaderFallback => {
    if (!fallback?.href || seen.has(fallback.href)) {
      return false;
    }
    seen.add(fallback.href);
    return true;
  });
}

function readableLocalTarget(target: LocalPaperReaderTarget) {
  return target.kind === "pdf" || target.kind === "html" || target.href.endsWith(".pdf");
}

function pickLocalReaderTarget(targets: LocalPaperReaderTarget[]) {
  return targets.find((target) => target.kind === "pdf") ?? targets.find(readableLocalTarget);
}

function spatialNodeNote(nodeId: string) {
  if (teachingNodeById[nodeId]) return teachingNodeById[nodeId].note;
  const audit = spatialAudit.nodes.find((row) => row.nodeId === nodeId);
  if (!audit) return "教学示意位置；不表示论文原始峰值。";
  return audit.bindingLevel === "PARADIGM_LEVEL_ONLY"
    ? "仅有范式级出处；本节点的专属坐标依据仍待核对。"
    : "区域关联示意；不表示论文原始峰值。";
}

function supportScopeLabel(scope?: string) {
  if (!scope) {
    return undefined;
  }
  if (scope === "reviewed_parcel") {
    return "区域关联已审阅";
  }
  return REVIEW_SCOPE_LABELS[scope as EvidenceReviewScope] ?? scope;
}

function readerMaterialLabel(target?: LocalPaperReaderTarget, hasExternalFallback = false) {
  if (target) {
    return target.kind === "html" ? "本地 HTML" : "本地全文";
  }
  return hasExternalFallback ? "外部出处" : "来源待补";
}

function evidenceAudienceStatus(evidenceItem: (typeof evidenceUpgradePlan.items)[number]) {
  if (evidenceItem.stage === "reviewed_parcel") {
    return "文献与区域关联已审阅";
  }
  if (evidenceItem.stage === "reviewed_network") {
    return "文献已核 · 网络级可讲";
  }
  if (evidenceItem.stage === "ready_for_review") {
    return "文献已挂 · 区域关联待审阅";
  }
  if (evidenceItem.claimTarget === "specialized_atlas_needed") {
    return "需要专门图谱";
  }
  return "文献已挂 · 演示参考";
}

function parcelCounts(parcels: BrainParcel[]) {
  return parcels.reduce<Record<Yeo7Network, number>>(
    (counts, parcel) => {
      parcel.networkMemberships.forEach((membership) => {
        counts[membership.network] += 1;
      });
      return counts;
    },
    {
      visual: 0,
      somatomotor: 0,
      dorsal_attention: 0,
      ventral_attention: 0,
      limbic: 0,
      frontoparietal: 0,
      default_mode: 0,
    },
  );
}

export function AtlasViewer() {
  const isVideoNetworkFocusMode = useMemo(() => isInitialNetworkFocusMode(), []);
  const isBrainOnlyMode = useMemo(() => isInitialBrainOnlyMode(), []);
  const networks = useMemo(() => taxonomy.networks.map(withNetworkPalette), []);
  const allNetworkIds = useMemo(() => networks.map((network) => network.id), [networks]);
  const [enabledNetworks, setEnabledNetworks] = useState<Set<Yeo7Network>>(
    () => new Set(allNetworkIds),
  );
  const [activeLearningFunctionId, setActiveLearningFunctionId] = useState<string | null>(() => initialFunctionId());
  const [activeParadigmId, setActiveParadigmId] = useState<string | null>(() => initialParadigmId());
  const [focusedNetworkId, setFocusedNetworkId] = useState<Yeo7Network | null>(null);
  const [selectedOverlayNodeId, setSelectedOverlayNodeId] = useState<string | null>(null);
  const [selectedParcelId, setSelectedParcelId] = useState("");
  const [selectedPhysicalStructure, setSelectedPhysicalStructure] =
    useState<AtlasPhysicalStructureSelection | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [brainSurfaceOpacity, setBrainSurfaceOpacity] = useState(0.72);
  const [atlasSmoothed, setAtlasSmoothed] = useState(false);
  const [autoRotateBrain, setAutoRotateBrain] = useState(
    () => new URLSearchParams(window.location.search).get("autoRotate") === "1",
  );
  const [videoDemoMode, setVideoDemoMode] = useState<VideoDemoMode>("problem_solving");
  const structureOpacities = useMemo<AtlasStructureOpacityConfig>(
    () => ({ ...DEFAULT_ATLAS_STRUCTURE_OPACITIES }),
    [],
  );
  const enableAshsAppFitPreview = false;
  const [showEmotionModulationLayer, setShowEmotionModulationLayer] = useState(false);
  const [activeNarrativeOverlayId, setActiveNarrativeOverlayId] = useState<string | null>(() =>
    isInitialNetworkFocusMode() ? mathLogicStroopDemo.id : null,
  );
  const [activeNarrativeStageId, setActiveNarrativeStageId] = useState<string | null>(() =>
    isInitialNetworkFocusMode() ? mathLogicStroopDemo.presentationStages?.[0]?.id ?? null : null,
  );
  const [activeExplanationPanel, setActiveExplanationPanel] = useState<ExplanationPanel>(() =>
    initialParadigmId() ? "paradigm" : "overview",
  );
  const [activeQuantityTripletStageId, setActiveQuantityTripletStageId] = useState(
    quantityUnderstandingTriplet.stages[0]?.id ?? "",
  );
  const [showShortTermMemoryTransfer, setShowShortTermMemoryTransfer] = useState(false);
  const [showFunctionParadigmGuide, setShowFunctionParadigmGuide] = useState(false);
  const [phenomenonQuery, setPhenomenonQuery] = useState("");
  const [activePaperReader, setActivePaperReader] = useState<LocalPaperReaderSelection | null>(null);
  const [globalDemoFunctionId, setGlobalDemoFunctionId] = useState<string | null>(null);
  const [globalDemoRenderFunctionId, setGlobalDemoRenderFunctionId] = useState<string | null>(null);
  const paradigmDetailCardRef = useRef<HTMLElement | null>(null);
  const cognitiveFeedbackLayerRef = useRef<HTMLDivElement | null>(null);
  const cognitiveStageRefs = useRef<Array<HTMLElement | null>>([]);
  const [cognitiveFeedbackGeometry, setCognitiveFeedbackGeometry] =
    useState<CognitiveFeedbackGeometry | null>(null);

  const counts = useMemo(() => parcelCounts(atlas.parcels), []);
  const learningFunctions = learningFunctionCatalog.functions;
  const paradigms = paradigmLibrary.paradigms;
  const learningFunctionNavItems = useMemo(
    () =>
      [...learningFunctions]
        .sort(
          (firstFunction, secondFunction) =>
            (learningFunctionNavRank.get(firstFunction.id) ?? LEARNING_FUNCTION_NAV_ORDER.length) -
              (learningFunctionNavRank.get(secondFunction.id) ?? LEARNING_FUNCTION_NAV_ORDER.length) ||
            firstFunction.order - secondFunction.order,
        )
        .map((learningFunction, index) => ({
          ...learningFunction,
          order: index + 1,
        })),
    [learningFunctions],
  );
  const learningFunctionById = useMemo(
    () => new Map(learningFunctions.map((learningFunction) => [learningFunction.id, learningFunction])),
    [learningFunctions],
  );
  const cognitiveAbilityRows = useMemo(() => {
    const rowsForBand = (band: "above" | "below") =>
      Array.from(
        new Set(
          FOUNDATION_COGNITIVE_ABILITY_LANES.filter((lane) => lane.band === band).map((lane) => lane.row),
        ),
      )
        .sort((a, b) => a - b)
        .map((row) => ({
          id: `${band}-${row}`,
          lanes: FOUNDATION_COGNITIVE_ABILITY_LANES.filter((lane) => lane.band === band && lane.row === row).sort(
            (a, b) => a.start - b.start || a.end - b.end,
          ),
        }));

    return {
      above: rowsForBand("above"),
      below: rowsForBand("below"),
    };
  }, []);
  const localPaperEvidenceSourceCount = useMemo(
    () =>
      localPaperLibrary.sources.filter((source) =>
        Boolean(source.canonicalReader ?? source.canonicalPdf ?? source.localTargets?.length),
      ).length,
    [],
  );
  const localPaperTargetCount = useMemo(
    () => localPaperLibrary.sources.reduce((total, source) => total + (source.localTargets?.length ?? 0), 0),
    [],
  );
  const parcelById = useMemo(() => new Map(atlas.parcels.map((parcel) => [parcel.id, parcel])), []);
  const narrativeOverlays = useMemo(() => [mathLogicStroopDemo], []);
  const activeNarrativeOverlay = useMemo(
    () =>
      narrativeOverlays.find((overlay) => overlay.id === activeNarrativeOverlayId) ??
      null,
    [activeNarrativeOverlayId, narrativeOverlays],
  );
  const activeNarrativeStage = useMemo(
    () =>
      activeNarrativeStageId
        ? activeNarrativeOverlay?.presentationStages?.find((stage) => stage.id === activeNarrativeStageId) ?? null
        : null,
    [activeNarrativeOverlay, activeNarrativeStageId],
  );
  const isQuantityComparisonDemo = isVideoNetworkFocusMode && videoDemoMode === "quantity_comparison";
  const activeQuantityComparisonOverlay = useMemo(() => {
    if (!isQuantityComparisonDemo) {
      return null;
    }
    if (activeNarrativeStageId === "quantity-stage-language") {
      return {
        nodes: [
          ...symbolicQuantityOverlay.nodes.filter(
            (node) => node.id !== "quantity-language:symbol-quantity-goal",
          ),
          languageQuantitySemanticNode,
        ],
        edges: [
          ...symbolicQuantityOverlay.edges.filter(
            (edge) =>
              edge.sourceNodeId !== "quantity-language:symbol-quantity-goal" &&
              edge.targetNodeId !== "quantity-language:symbol-quantity-goal",
          ),
          languageQuantitySemanticEdge,
        ],
      };
    }
    return mechanicalCountingOverlay;
  }, [activeNarrativeStageId, isQuantityComparisonDemo]);
  const baseNarrativeOverlayNodes = useMemo(
    () => connectionOverlayToParadigmNodes(activeNarrativeOverlay, parcelById),
    [activeNarrativeOverlay, parcelById],
  );
  const activeNarrativeOverlayNodes = useMemo(
    () =>
      activeQuantityComparisonOverlay?.nodes ??
      applyNarrativeStageToNodes(baseNarrativeOverlayNodes, activeNarrativeStage),
    [activeNarrativeStage, activeQuantityComparisonOverlay, baseNarrativeOverlayNodes],
  );
  const activeVideoStageRegionCopy = activeNarrativeStageId
    ? VIDEO_NETWORK_STAGE_REGION_COPY[activeNarrativeStageId] ?? null
    : null;
  const activeNarrativeOverlayEdges = useMemo(
    () =>
      activeQuantityComparisonOverlay?.edges ??
      applyNarrativeStageToEdges(activeNarrativeOverlay?.edges ?? [], activeNarrativeStage),
    [activeNarrativeOverlay, activeNarrativeStage, activeQuantityComparisonOverlay],
  );
  const evidenceUpgradeSourceById = useMemo(
    () => new Map(evidenceUpgradePlan.sources.map((source) => [source.id, source])),
    [],
  );
  const evidenceUpgradeByParadigmId = useMemo(
    () => new Map(evidenceUpgradePlan.items.map((item) => [item.paradigmId, item])),
    [],
  );
  const trainingCoverageByParadigmId = useMemo(
    () => new Map(trainingParadigmCoverage.items.map((item) => [item.paradigmId, item])),
    [],
  );
  const evidenceReviewByParadigmId = useMemo(
    () =>
      new Map<string, ParadigmReviewContract>(
        evidenceReviewContracts.paradigmReviews.map((review) => [review.paradigmId, review]),
      ),
    [],
  );
  const evidenceReviewBySourceId = useMemo(
    () =>
      new Map<string, EvidenceSourceReview>(
        evidenceReviewContracts.sourceReviews.map((review) => [review.sourceId, review]),
      ),
    [],
  );
  const localPaperSourceById = useMemo(
    () => new Map(localPaperLibrary.sources.map((source) => [source.sourceId, source])),
    [],
  );
  const localPaperSourceIdByDoi = useMemo(
    () => new Map(Object.entries(localPaperLibrary.lookup?.doiToSourceId ?? {})),
    [],
  );
  const evidenceConsumerByParadigmId = useMemo(
    () =>
      new Map<string, EvidenceConsumerParadigm>(
        evidenceConsumerInterface.paradigms.map((entry) => [entry.paradigmId, entry]),
      ),
    [],
  );
  const parcelIdentityById = useMemo(
    () =>
      new Map<string, ParcelIdentityEntry>(
        parcelIdentityRegistry.entries.map((identity) => [identity.parcelId, identity]),
      ),
    [],
  );
  const specializedAtlasLabelById = useMemo(
    () => new Map(specializedAtlasRegistry.labels.map((label) => [label.id, label])),
    [],
  );
  const activeLearningFunction = useMemo(
    () =>
      learningFunctions.find((learningFunction) => learningFunction.id === activeLearningFunctionId) ??
      null,
    [activeLearningFunctionId, learningFunctions],
  );
  const activeEmotionModulationMapping = activeLearningFunction
    ? emotionModulation3dFunctionMappingById[activeLearningFunction.id] ?? null
    : null;
  const activeEmotionModulationBranchLabels = activeEmotionModulationMapping
    ? activeEmotionModulationMapping.primaryMechanismBranchIds
        .map((branchId) => EMOTION_MODULATION_BRANCH_LABELS[branchId])
        .filter((label): label is string => Boolean(label))
    : [];
  const activeEmotionModulationLegendItems = activeEmotionModulationMapping
    ? activeEmotionModulationMapping.primaryMechanismBranchIds
        .map((branchId) => ({
          id: branchId,
          label: EMOTION_MODULATION_BRANCH_LABELS[branchId],
          color: EMOTION_MODULATION_MECHANISM_STYLES[branchId]?.color,
          gradient: EMOTION_MODULATION_MECHANISM_STYLES[branchId]?.gradient,
        }))
        .filter((item): item is { id: string; label: string; color: string; gradient: string } =>
          Boolean(item.label && item.color && item.gradient),
        )
    : [];
  const functionUseCaseSummaryById = useMemo(
    () => new Map(functionUseCaseRegistry.functions.map((summary) => [summary.functionId, summary])),
    [],
  );
  const activeFunctionUseCaseSummary = activeLearningFunction
    ? functionUseCaseSummaryById.get(activeLearningFunction.id) ?? null
    : null;
  const activeFunctionUseCases = useMemo(
    () =>
      activeLearningFunction
        ? functionUseCaseRegistry.paradigms
            .filter((useCase) => useCase.functionId === activeLearningFunction.id)
            .sort(
              (first, second) =>
                USE_CASE_ROLE_ORDER[first.role] - USE_CASE_ROLE_ORDER[second.role] ||
                first.mechanismTitle.localeCompare(second.mechanismTitle, "zh-Hans-CN"),
            )
        : [],
    [activeLearningFunction],
  );
  const activeMainFunctionUseCases = useMemo(
    () =>
      activeFunctionUseCases.filter(
        (useCase) =>
          useCase.role === "anchor" ||
          useCase.role === "core" ||
          useCase.role === "supporting",
      ),
    [activeFunctionUseCases],
  );
  const activeFunctionOverviewLine = activeLearningFunction
    ? `综合了 ${activeFunctionUseCases.length} 个范式，其中 ${activeMainFunctionUseCases.length} 个主要范式，其余为次要范式。`
    : "";
  const activeFunctionReadyStates = activeLearningFunction
    ? activeLearningFunction.id === "attention"
      ? ATTENTION_LEARNING_READY_STATES
      : [
          `能把${activeLearningFunction.label}稳定用在当前学习任务里。`,
          "任务变长、信息变多时，仍能保持速度和准确性。",
          "遇到干扰、变化或复杂条件时，可以调整策略继续完成。",
          "需要迁移到新题型时，能抓住当前任务真正要求。",
        ]
    : [];
  const activeFunctionUnsupportedStates = activeLearningFunction
    ? activeLearningFunction.id === "attention"
      ? ATTENTION_LEARNING_UNSUPPORTED_STATES
      : []
    : [];
  const activeFunctionSigns = useMemo(
    () =>
      uniqueStrings(
        activeFunctionUseCases.flatMap((useCase) => [
          ...useCase.dailyPresentations,
          ...useCase.academicPresentations,
        ]),
      ).slice(0, 6),
    [activeFunctionUseCases],
  );
  const activeFunctionParentPhrases = useMemo(
    () => uniqueStrings(activeFunctionUseCases.flatMap((useCase) => useCase.parentPhrases)).slice(0, 8),
    [activeFunctionUseCases],
  );
  const activeFunctionSynthesis = useMemo(
    () =>
      activeLearningFunction
        ? functionSynthesisRegistry.syntheses.find((synthesis) => synthesis.functionId === activeLearningFunction.id) ??
          null
        : null,
    [activeLearningFunction],
  );
  const activeFunctionParadigms = useMemo(
    () =>
      activeLearningFunction
        ? sortParadigmsByImportance(
            paradigms.filter((paradigm) => paradigm.functionIds.includes(activeLearningFunction.id)),
            functionParadigmImportanceRegistry,
            activeLearningFunction.id,
          )
        : [],
    [activeLearningFunction, paradigms],
  );
  const activePrimaryFunctionParadigms = useMemo(
    () =>
      activeLearningFunction
        ? activeFunctionParadigms.filter(
            (paradigm) => paradigm.primaryFunctionId === activeLearningFunction.id,
          )
        : [],
    [activeFunctionParadigms, activeLearningFunction],
  );
  const activeCalculationParadigmGroups = useMemo(
    () =>
      activeLearningFunction?.id === "calculation"
        ? CALCULATION_PARADIGM_GROUPS.map((group) => ({
            ...group,
            paradigms: group.paradigmIds
              .map((paradigmId) => activePrimaryFunctionParadigms.find((item) => item.id === paradigmId))
              .filter((item): item is CognitiveParadigm => Boolean(item)),
          })).filter((group) => group.paradigms.length > 0)
        : [],
    [activeLearningFunction, activePrimaryFunctionParadigms],
  );
  const activeRelatedFunctionParadigms = useMemo(
    () =>
      activeLearningFunction
        ? activeFunctionParadigms.filter(
            (paradigm) => paradigm.primaryFunctionId !== activeLearningFunction.id,
          )
        : [],
    [activeFunctionParadigms, activeLearningFunction],
  );
  const activeSidebarParadigmEntryCount =
    activeCalculationParadigmGroups.length > 0
      ? activeCalculationParadigmGroups.reduce(
          (total, group) => total + (group.label === "数量理解" ? 1 : group.paradigms.length),
          0,
        ) + activeRelatedFunctionParadigms.length
      : activeFunctionParadigms.length;
  const activeAnchorFunctionUseCase = useMemo(
    () =>
      activeFunctionUseCases.find((useCase) => useCase.role === "anchor") ??
      (activeFunctionUseCaseSummary
        ? activeFunctionUseCases.find(
            (useCase) => useCase.paradigmId === activeFunctionUseCaseSummary.anchorParadigmId,
          )
        : undefined) ??
      activeFunctionUseCases[0] ??
      null,
    [activeFunctionUseCaseSummary, activeFunctionUseCases],
  );
  const activeAnchorParadigm = activeAnchorFunctionUseCase
    ? paradigms.find((paradigm) => paradigm.id === activeAnchorFunctionUseCase.paradigmId) ?? null
    : null;
  const activeFunctionRelationBranches = useMemo(
    () =>
      activeFunctionUseCases
        .filter((useCase) => useCase.paradigmId !== activeAnchorFunctionUseCase?.paradigmId)
        .filter((useCase) => useCase.role === "core" || useCase.role === "supporting" || useCase.role === "related")
        .slice(0, 4)
        .map((useCase) => ({
          useCase,
          paradigm: paradigms.find((paradigm) => paradigm.id === useCase.paradigmId) ?? null,
        })),
    [activeAnchorFunctionUseCase, activeFunctionUseCases, paradigms],
  );
  const activeFunctionParadigmGuideRows = useMemo(
    () =>
      activeLearningFunction
        ? activeFunctionParadigms.map((paradigm) => {
            const useCase =
              activeFunctionUseCases.find((item) => item.paradigmId === paradigm.id) ?? null;
            const evidenceItem = evidenceUpgradeByParadigmId.get(paradigm.id);
            const sources = (evidenceItem?.sourceCandidateIds ?? [])
              .map((sourceId) => evidenceUpgradeSourceById.get(sourceId))
              .filter((source): source is EvidenceSourceCandidate => Boolean(source))
              .slice(0, 3);
            return {
              paradigm,
              roleLabel: useCase ? PARADIGM_GUIDE_ROLE_LABELS[useCase.role] : "次要范式",
              sources,
            };
          })
        : [],
    [
      activeFunctionParadigms,
      activeFunctionUseCases,
      activeLearningFunction,
      evidenceUpgradeByParadigmId,
      evidenceUpgradeSourceById,
    ],
  );
  const activeParadigm = useMemo(
    () => paradigms.find((paradigm) => paradigm.id === activeParadigmId) ?? null,
    [activeParadigmId, paradigms],
  );
  const isGlobalOverview = !activeLearningFunction && !activeParadigm && !activeNarrativeOverlay;
  const globalDemoFunction =
    isGlobalOverview && globalDemoFunctionId ? learningFunctionById.get(globalDemoFunctionId) ?? null : null;
  const globalDemoRenderFunction =
    isGlobalOverview && globalDemoRenderFunctionId
      ? learningFunctionById.get(globalDemoRenderFunctionId) ?? null
      : null;
  const globalDemoAbilityLane = useMemo(
    () =>
      globalDemoFunction
        ? FOUNDATION_COGNITIVE_ABILITY_LANES.find((lane) => lane.functionId === globalDemoFunction.id) ?? null
        : null,
    [globalDemoFunction],
  );
  const globalDemoFunctionSynthesis = useMemo(
    () =>
      globalDemoRenderFunction
        ? functionSynthesisRegistry.syntheses.find((synthesis) => synthesis.functionId === globalDemoRenderFunction.id) ??
          null
        : null,
    [globalDemoRenderFunction],
  );
  const globalDemoOverlayNodes = useMemo(
    () => (isGlobalOverview ? globalDemoFunctionSynthesis?.overlay.nodes ?? FOUNDATION_GLOBAL_OVERVIEW_NODES : []),
    [globalDemoFunctionSynthesis, isGlobalOverview],
  );
  const globalDemoOverlayEdges = useMemo(
    () => (isGlobalOverview ? globalDemoFunctionSynthesis?.overlay.edges ?? FOUNDATION_GLOBAL_OVERVIEW_EDGES : []),
    [globalDemoFunctionSynthesis, isGlobalOverview],
  );
  const effectiveBrainSurfaceOpacity = brainSurfaceOpacity;

  useEffect(() => {
    if (!isGlobalOverview && globalDemoFunctionId) {
      setGlobalDemoFunctionId(null);
    }
  }, [globalDemoFunctionId, isGlobalOverview]);

  useEffect(() => {
    if (!isGlobalOverview) {
      setGlobalDemoRenderFunctionId(null);
      return;
    }

    const renderFrame = window.requestAnimationFrame(() => {
      startTransition(() => {
        setGlobalDemoRenderFunctionId(globalDemoFunctionId);
      });
    });

    return () => {
      window.cancelAnimationFrame(renderFrame);
    };
  }, [globalDemoFunctionId, isGlobalOverview]);

  useEffect(() => {
    if (!isGlobalOverview) {
      setCognitiveFeedbackGeometry(null);
      return undefined;
    }

    const feedbackLayer = cognitiveFeedbackLayerRef.current;
    const stageElements = cognitiveStageRefs.current.slice(0, FOUNDATION_COGNITIVE_PROCESS_STAGES.length);
    if (!feedbackLayer || stageElements.some((element) => !element)) {
      return undefined;
    }

    let animationFrame = 0;
    const updateGeometry = () => {
      const layerRect = feedbackLayer.getBoundingClientRect();
      const stageRects = stageElements.map((element) => element?.getBoundingClientRect());
      if (!layerRect.width || !layerRect.height || stageRects.some((rect) => !rect)) {
        return;
      }

      const anchors = stageRects.map((rect) => ({
        x: rect!.left + rect!.width / 2 - layerRect.left,
        y: rect!.top - layerRect.top + 2,
      }));
      const [first, second, third, fourth] = anchors;
      if (!first || !second || !third || !fourth) {
        return;
      }

      const routeY = Math.max(18, Math.min(first.y, second.y, third.y, fourth.y) - 36);
      const branchEndY = Math.max(routeY + 16, first.y);
      const stageGap = Math.max(18, second.x - first.x);
      const leftEndY = routeY + (branchEndY - routeY) * 0.67;
      const cornerRadius = Math.min(18, Math.max(10, stageGap * 0.18), (leftEndY - routeY) * 0.72);
      const leftCornerX = first.x + cornerRadius;
      const rightCornerX = fourth.x - cornerRadius;
      const rightCornerY = routeY + cornerRadius;
      const leftCornerY = routeY + cornerRadius;
      const loopPath = [
        `M ${fourth.x.toFixed(1)} ${fourth.y.toFixed(1)}`,
        `L ${fourth.x.toFixed(1)} ${rightCornerY.toFixed(1)}`,
        `C ${fourth.x.toFixed(1)} ${routeY.toFixed(1)}`,
        `${fourth.x.toFixed(1)} ${routeY.toFixed(1)}`,
        `${rightCornerX.toFixed(1)} ${routeY.toFixed(1)}`,
        `L ${leftCornerX.toFixed(1)} ${routeY.toFixed(1)}`,
        `C ${first.x.toFixed(1)} ${routeY.toFixed(1)}`,
        `${first.x.toFixed(1)} ${routeY.toFixed(1)}`,
        `${first.x.toFixed(1)} ${leftCornerY.toFixed(1)}`,
        `L ${first.x.toFixed(1)} ${leftEndY.toFixed(1)}`,
      ].join(" ");
      const dropPaths = [second, third].map(
        (anchor) =>
          [
            `M ${anchor.x.toFixed(1)} ${routeY.toFixed(1)}`,
            `C ${anchor.x.toFixed(1)} ${(routeY + (branchEndY - routeY) * 0.34).toFixed(1)}`,
            `${anchor.x.toFixed(1)} ${(routeY + (branchEndY - routeY) * 0.66).toFixed(1)}`,
            `${anchor.x.toFixed(1)} ${branchEndY.toFixed(1)}`,
          ].join(" "),
      );
      const width = Math.max(1, layerRect.width);
      const height = Math.max(layerRect.height, branchEndY + 8);
      setCognitiveFeedbackGeometry((current) => {
        const next = {
          dropPaths,
          height,
          labelX: (first.x + fourth.x) / 2,
          labelY: Math.max(0, routeY - 22),
          loopPath,
          originX: fourth.x,
          originY: fourth.y,
          width,
        };
        if (
          current &&
          current.loopPath === next.loopPath &&
          current.dropPaths.join("|") === next.dropPaths.join("|") &&
          Math.abs(current.width - next.width) < 0.5 &&
          Math.abs(current.height - next.height) < 0.5
        ) {
          return current;
        }
        return next;
      });
    };

    const scheduleUpdate = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(updateGeometry);
    };

    scheduleUpdate();
    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(feedbackLayer);
    stageElements.forEach((element) => {
      if (element) {
        resizeObserver.observe(element);
      }
    });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isGlobalOverview]);

  const isFunctionProductSample = Boolean(activeLearningFunction && !activeNarrativeOverlay);
  const isAttentionProductSample = activeLearningFunction?.id === "attention" && !activeNarrativeOverlay;
  const isShortTermMemoryProductSample =
    activeLearningFunction?.id === "short_term_memory" && !activeNarrativeOverlay;
  const isCalculationQuantityTriplet =
    activeLearningFunction?.id === "calculation" &&
    !activeNarrativeOverlay &&
    activeExplanationPanel === "quantity_triplet";
  const quantityTripletStageByParadigmId = useMemo(
    () =>
      new Map(
        quantityUnderstandingTriplet.stages.flatMap((stage) =>
          stage.formalParadigmIds.map((paradigmId) => [paradigmId, stage] as const),
        ),
      ),
    [],
  );
  const activeQuantityTripletParadigmStage = activeParadigm
    ? quantityTripletStageByParadigmId.get(activeParadigm.id) ?? null
    : null;
  const isCalculationQuantityTripletContext =
    activeLearningFunction?.id === "calculation" &&
    !activeNarrativeOverlay &&
    (isCalculationQuantityTriplet || Boolean(activeQuantityTripletParadigmStage));
  const activeQuantityTripletStage = useMemo(
    () =>
      quantityUnderstandingTriplet.stages.find((stage) => stage.id === activeQuantityTripletStageId) ??
      quantityUnderstandingTriplet.stages[0],
    [activeQuantityTripletStageId],
  );
  const activeQuantityTripletStageParadigms = useMemo(
    () =>
      (activeQuantityTripletParadigmStage ?? activeQuantityTripletStage)?.formalParadigmIds
        .map((paradigmId) => paradigms.find((paradigm) => paradigm.id === paradigmId))
        .filter((paradigm): paradigm is CognitiveParadigm => Boolean(paradigm)) ?? [],
    [activeQuantityTripletParadigmStage, activeQuantityTripletStage, paradigms],
  );
  const functionOverviewExpanded =
    !isFunctionProductSample ||
    activeExplanationPanel === "overview" ||
    (!activeParadigm && !isCalculationQuantityTriplet);
  const functionParadigmExpanded = !isFunctionProductSample || activeExplanationPanel === "paradigm";

  useEffect(() => {
    if (!activeParadigmId || !functionParadigmExpanded) {
      return;
    }
    paradigmDetailCardRef.current?.scrollTo({ left: 0, top: 0 });
  }, [activeParadigmId, functionParadigmExpanded]);

  useEffect(() => {
    if (
      activeQuantityTripletParadigmStage &&
      activeQuantityTripletParadigmStage.id !== activeQuantityTripletStageId
    ) {
      setActiveQuantityTripletStageId(activeQuantityTripletParadigmStage.id);
    }
  }, [activeQuantityTripletParadigmStage, activeQuantityTripletStageId]);

  useEffect(() => {
    setShowShortTermMemoryTransfer(false);
  }, [activeLearningFunctionId, activeParadigmId]);

  const activeParadigmStoryFigure = useMemo(
    () => getParadigmStoryFigure(activeParadigm?.id),
    [activeParadigm],
  );
  const activeParadigmUseCase = useMemo(
    () =>
      activeParadigm && activeLearningFunction
        ? functionUseCaseRegistry.paradigms.find(
            (useCase) =>
              useCase.functionId === activeLearningFunction.id &&
              useCase.paradigmId === activeParadigm.id,
          ) ?? null
        : null,
    [activeLearningFunction, activeParadigm],
  );
  const activeDisplayUseCase =
    activeParadigmUseCase ??
    (activeFunctionUseCaseSummary
      ? activeFunctionUseCases.find((useCase) => useCase.paradigmId === activeFunctionUseCaseSummary.anchorParadigmId) ??
        activeFunctionUseCases[0] ??
        null
      : null);
  const showFunctionLevelManifestation = Boolean(
    activeLearningFunction &&
      activeFunctionUseCaseSummary &&
      !activeParadigm &&
      !activeNarrativeOverlay &&
      !isCalculationQuantityTriplet,
  );
  const phenomenonMatches = useMemo(
    () =>
      functionUseCaseRegistry.paradigms
        .map((useCase) => {
          const score = scoreUseCaseMatch(phenomenonQuery, useCase);
          const functionBoost = activeLearningFunction?.id === useCase.functionId ? 8 : 0;
          const roleBoost =
            useCase.role === "anchor" ? 5 : useCase.role === "core" ? 3 : useCase.role === "supporting" ? 1 : 0;
          return { score: score + functionBoost + roleBoost, rawScore: score, useCase };
        })
        .filter((match) => match.rawScore > 0)
        .sort(
          (first, second) =>
            second.score - first.score ||
            USE_CASE_ROLE_ORDER[first.useCase.role] - USE_CASE_ROLE_ORDER[second.useCase.role] ||
            first.useCase.mechanismTitle.localeCompare(second.useCase.mechanismTitle, "zh-Hans-CN"),
        )
        .slice(0, 4),
    [activeLearningFunction, phenomenonQuery],
  );
  const activeEvidenceUpgrade = useMemo(
    () =>
      activeParadigm
        ? evidenceUpgradePlan.items.find((item) => item.paradigmId === activeParadigm.id) ?? null
        : null,
    [activeParadigm],
  );
  const activeEvidenceUpgradeSources = useMemo(
    () =>
      activeEvidenceUpgrade
        ? activeEvidenceUpgrade.sourceCandidateIds
            .map((sourceId) => evidenceUpgradeSourceById.get(sourceId))
            .filter((source): source is EvidenceSourceCandidate => Boolean(source))
        : [],
    [activeEvidenceUpgrade, evidenceUpgradeSourceById],
  );
  const activeEvidenceConsumer = useMemo(
    () => (activeParadigm ? evidenceConsumerByParadigmId.get(activeParadigm.id) ?? null : null),
    [activeParadigm, evidenceConsumerByParadigmId],
  );
  const activeConsumerSourceById = useMemo(
    () => new Map((activeEvidenceConsumer?.sources ?? []).map((source) => [source.sourceId, source])),
    [activeEvidenceConsumer],
  );
  const resolveEvidenceSourceReader = useCallback(
    (source: EvidenceSourceCandidate): ResolvedEvidenceSourceReader => {
      const consumerSource = activeConsumerSourceById.get(source.id);
      const normalizedDoi = normalizeDoi(source.doi ?? consumerSource?.doi);
      const librarySource =
        localPaperSourceById.get(source.id) ??
        (normalizedDoi
          ? localPaperSourceById.get(localPaperSourceIdByDoi.get(normalizedDoi) ?? "")
          : undefined);
      const localTargets = publicPaperTargets(librarySource?.sourceId ?? source.id);
      const externalFallbacks = uniqueExternalFallbacks([
        ...(consumerSource?.externalFallbacks ?? []),
        ...(librarySource?.externalFallbacks ?? []),
        sourceCandidateHref(source)
          ? {
              href: sourceCandidateHref(source) ?? "",
              label: "外部出处",
              kind: "url",
            }
          : undefined,
      ]);
      const target = pickLocalReaderTarget(localTargets);
      const readerSource: LocalPaperReaderSource = {
        sourceId: librarySource?.sourceId ?? consumerSource?.sourceId ?? source.id,
        title: consumerSource?.title ?? librarySource?.title ?? source.title,
        citation: consumerSource?.citation ?? librarySource?.citation ?? source.citation,
        year: consumerSource?.year ?? librarySource?.year ?? source.year,
        sourceType: consumerSource?.sourceType ?? librarySource?.sourceType ?? source.kind,
        supportScope: consumerSource?.supportScope ?? librarySource?.supportScope,
        supports: consumerSource?.supports ?? source.useFor,
        safeUse: consumerSource?.safeUse,
        boundary: consumerSource?.boundary,
        materialState: readerMaterialLabel(target, externalFallbacks.length > 0),
        localTargets,
        externalFallbacks,
        localReviewDocs: [
          ...(consumerSource?.localReviewDocs ?? []),
          ...(librarySource?.localReviewDocs ?? []),
        ].filter((doc): doc is LocalPaperReviewDoc => Boolean(doc)),
      };

      return {
        source,
        consumerSource,
        librarySource,
        readerSource,
        target,
        externalHref: externalFallbacks[0]?.href,
      };
    },
    [activeConsumerSourceById, localPaperSourceById, localPaperSourceIdByDoi],
  );
  const activeEvidenceSourceReaders = useMemo<ResolvedEvidenceSourceReader[]>(
    () => activeEvidenceUpgradeSources.map(resolveEvidenceSourceReader),
    [activeEvidenceUpgradeSources, resolveEvidenceSourceReader],
  );
  const quantityTripletEvidenceSourceReaders = useMemo<ResolvedEvidenceSourceReader[]>(
    () =>
      quantityUnderstandingTriplet.sourceIds
        .map((sourceId) => evidenceUpgradeSourceById.get(sourceId))
        .filter((source): source is EvidenceSourceCandidate => Boolean(source))
        .map(resolveEvidenceSourceReader),
    [evidenceUpgradeSourceById, resolveEvidenceSourceReader],
  );
  const activeTrainingCoverage = useMemo(
    () => (activeParadigm ? trainingCoverageByParadigmId.get(activeParadigm.id) ?? null : null),
    [activeParadigm, trainingCoverageByParadigmId],
  );
  const activeTrainingEvidenceRows = useMemo<TrainingEvidenceDisplayRow[]>(
    () =>
      (activeTrainingCoverage?.evidence ?? []).map((evidence) => {
        const source = evidenceUpgradeSourceById.get(evidence.sourceId);
        const resolvedSource = source ? resolveEvidenceSourceReader(source) : undefined;
        const consumerSource = activeConsumerSourceById.get(evidence.sourceId);
        const librarySource = localPaperSourceById.get(evidence.sourceId);

        return {
          evidence,
          resolvedSource,
          title:
            resolvedSource?.readerSource.title ??
            consumerSource?.title ??
            librarySource?.title ??
            evidence.sourceId,
          year: resolvedSource?.readerSource.year ?? consumerSource?.year ?? librarySource?.year,
        };
      }),
    [
      activeConsumerSourceById,
      activeTrainingCoverage,
      evidenceUpgradeSourceById,
      localPaperSourceById,
      resolveEvidenceSourceReader,
    ],
  );
  const activeTrainingCoverageCopy = activeTrainingCoverage
    ? trainingCoverageStatusCopy(activeTrainingCoverage.coverageStatus)
    : null;
  const activeTrainingPreferredRows = activeTrainingCoverage
    ? activeTrainingEvidenceRows.filter(
        (row) =>
          activeTrainingCoverage.directSourceIds.includes(row.evidence.sourceId) ||
          row.evidence.fitLevel === "direct_training" ||
          (!activeTrainingCoverage.directSourceIds.length && row.evidence.fitLevel !== "transfer_boundary"),
      )
    : [];
  const activeTrainingPrimaryRows = (
    activeTrainingPreferredRows.length ? activeTrainingPreferredRows : activeTrainingEvidenceRows
  ).slice(0, 3);
  const activeTrainingBoundaryRows = activeTrainingCoverage
    ? activeTrainingEvidenceRows.filter(
        (row) =>
          activeTrainingCoverage.boundarySourceIds.includes(row.evidence.sourceId) ||
          row.evidence.fitLevel === "transfer_boundary",
      )
    : [];
  const activeTrainingBoundaryDisplayRows = activeTrainingBoundaryRows.length
    ? activeTrainingBoundaryRows
    : activeTrainingPrimaryRows;
  const activeTrainingFitLabels = Array.from(
    new Set(activeTrainingEvidenceRows.map((row) => trainingEvidenceFitLabel(row.evidence.fitLevel))),
  );
  const renderTrainingEvidenceSourceLink = (row: TrainingEvidenceDisplayRow) => {
    const label = trainingEvidenceSourceLabel(row);
    const resolvedSource = row.resolvedSource;

    if (resolvedSource?.target) {
      return (
        <button
          className="training-evidence-source-link"
          onClick={() =>
            setActivePaperReader({
              source: resolvedSource.readerSource,
              target: resolvedSource.target as LocalPaperReaderTarget,
            })
          }
          type="button"
        >
          {label}
        </button>
      );
    }

    if (resolvedSource?.externalHref) {
      return (
        <a
          className="training-evidence-source-link"
          href={resolvedSource.externalHref}
          rel="noreferrer"
          target="_blank"
        >
          {label}
        </a>
      );
    }

    return <span className="training-evidence-source-label">{label}</span>;
  };
  const activeEvidenceReview = useMemo(
    () => (activeParadigm ? evidenceReviewByParadigmId.get(activeParadigm.id) ?? null : null),
    [activeParadigm, evidenceReviewByParadigmId],
  );
  const baseOverlayNodes = activeNarrativeOverlay
    ? activeNarrativeOverlayNodes
    : activeParadigm?.overlay.nodes ??
      activeFunctionSynthesis?.overlay.nodes ??
      (isGlobalOverview ? globalDemoOverlayNodes : []);
  const activeEmotionModulationNodes = useMemo(
    () =>
      showEmotionModulationLayer && activeLearningFunction && !activeNarrativeOverlay
        ? emotionModulationNodesForMapping(
            activeEmotionModulationMapping,
            parcelById,
            enableAshsAppFitPreview,
          )
        : [],
    [
      activeEmotionModulationMapping,
      activeLearningFunction,
      activeNarrativeOverlay,
      enableAshsAppFitPreview,
      parcelById,
      showEmotionModulationLayer,
    ],
  );
  const activeEmotionModulationNodeIds = useMemo(
    () => new Set(activeEmotionModulationNodes.map((node) => node.id)),
    [activeEmotionModulationNodes],
  );
  const activeEmotionModulationEdges = useMemo(
    () => emotionModulationEdgesForMapping(activeEmotionModulationMapping, activeEmotionModulationNodeIds),
    [activeEmotionModulationMapping, activeEmotionModulationNodeIds],
  );
  const shouldDimBaseOverlayForEmotionLayer =
    showEmotionModulationLayer && activeEmotionModulationNodes.length > 0;
  const visibleBaseOverlayNodes = useMemo(
    () =>
      shouldDimBaseOverlayForEmotionLayer
        ? baseOverlayNodes.map(dimBaseOverlayNodeForEmotionLayer)
        : baseOverlayNodes,
    [baseOverlayNodes, shouldDimBaseOverlayForEmotionLayer],
  );
  const activeOverlayNodes = useMemo(
    () => [...visibleBaseOverlayNodes, ...activeEmotionModulationNodes],
    [activeEmotionModulationNodes, visibleBaseOverlayNodes],
  );
  const activeFunctionHeatNodes = useMemo(() => {
    const heatLearningFunction = activeLearningFunction ?? globalDemoFunction;
    const heatFunctionSynthesis = activeFunctionSynthesis ?? globalDemoFunctionSynthesis;

    if (!heatLearningFunction || !heatFunctionSynthesis) {
      return activeOverlayNodes;
    }

    if (globalDemoFunction && !activeLearningFunction) {
      const baseGlobalHeatNodes = shouldDimBaseOverlayForEmotionLayer
        ? heatFunctionSynthesis.overlay.nodes.map(dimBaseOverlayNodeForEmotionLayer)
        : heatFunctionSynthesis.overlay.nodes;
      return [...baseGlobalHeatNodes, ...activeEmotionModulationNodes];
    }

    const supplementalNodes = activeFunctionParadigms
      .map((paradigm) => ({
        paradigm,
        importance: getParadigmImportance(
          functionParadigmImportanceRegistry,
          heatLearningFunction.id,
          paradigm.id,
        ),
      }))
      .filter(({ importance }) => importance && importance.tier !== "context")
      .slice(0, FUNCTION_OVERVIEW_MAX_PARADIGM_HEAT_SOURCES)
      .flatMap(({ paradigm, importance }) => {
        if (!importance) {
          return [];
        }

        const evidenceStage = evidenceUpgradeByParadigmId.get(paradigm.id)?.stage;
        return paradigm.overlay.nodes.map((node) =>
          paradigmNodeToFunctionHeatNode(
            node,
            paradigm,
            heatLearningFunction.id,
            importance.tier,
            evidenceStage,
          ),
        );
      });

    const baseFunctionHeatNodes = [...heatFunctionSynthesis.overlay.nodes, ...supplementalNodes];
    const visibleFunctionHeatNodes = shouldDimBaseOverlayForEmotionLayer
      ? baseFunctionHeatNodes.map(dimBaseOverlayNodeForEmotionLayer)
      : baseFunctionHeatNodes;

    return [...visibleFunctionHeatNodes, ...activeEmotionModulationNodes];
  }, [
    activeEmotionModulationNodes,
    activeFunctionParadigms,
    activeFunctionSynthesis,
    activeLearningFunction,
    activeOverlayNodes,
    evidenceUpgradeByParadigmId,
    globalDemoFunction,
    globalDemoFunctionSynthesis,
    shouldDimBaseOverlayForEmotionLayer,
  ]);
  const baseOverlayEdges =
    activeNarrativeOverlay
      ? activeNarrativeOverlayEdges
      : activeParadigm?.overlay.edges ??
        activeFunctionSynthesis?.overlay.edges ??
        (isGlobalOverview ? globalDemoOverlayEdges : []);
  const visibleBaseOverlayEdges = useMemo(
    () =>
      shouldDimBaseOverlayForEmotionLayer
        ? baseOverlayEdges.map(dimBaseOverlayEdgeForEmotionLayer)
        : baseOverlayEdges,
    [baseOverlayEdges, shouldDimBaseOverlayForEmotionLayer],
  );
  const activeOverlayEdges = useMemo(
    () => [...visibleBaseOverlayEdges, ...activeEmotionModulationEdges],
    [activeEmotionModulationEdges, visibleBaseOverlayEdges],
  );
  const activeOverlayCoverageParcelCount = useMemo(
    () => getOverlayCoverageParcelIds(activeOverlayNodes).length,
    [activeOverlayNodes],
  );
  const activeOverlayLabel = isCalculationQuantityTriplet
    ? quantityUnderstandingTriplet.label
    : activeParadigm
      ? activeParadigm.label
    : activeNarrativeOverlay
      ? activeNarrativeOverlay.name
      : activeFunctionSynthesis && activeLearningFunction
        ? `${activeLearningFunction.label}综合`
        : globalDemoFunction
          ? `${globalDemoFunction.label}网络`
          : "全局认知流程";
  const activeOverlayPrompt = isCalculationQuantityTriplet
    ? quantityUnderstandingTriplet.summary
    : activeParadigm
      ? activeParadigm.contentUse
    : activeNarrativeOverlay
      ? activeNarrativeOverlay.description
      : activeFunctionSynthesis?.salesNarrative ??
        (globalDemoFunction
          ? (FOUNDATION_NETWORK_ROLE_COPY[globalDemoFunction.id]?.body ??
            `${globalDemoFunction.label} 会在学习任务的关键环节参与处理，帮助孩子把看到的内容变成可执行的动作。`)
          : FOUNDATION_GLOBAL_NETWORK_COPY.body);
  const activeOverlayModeLabel = isCalculationQuantityTriplet
    ? "综合任务"
    : activeParadigm
      ? "范式"
    : activeNarrativeOverlay
      ? "演示"
      : activeFunctionSynthesis
        ? "功能综合"
        : globalDemoFunction
          ? "功能演示"
          : "全局";
  const activeOverlayDetailLabel = isCalculationQuantityTriplet
    ? quantityUnderstandingTriplet.label
    : activeParadigm
      ? activeParadigm.label
    : activeNarrativeOverlay
      ? activeNarrativeOverlay.name
      : activeFunctionSynthesis && activeLearningFunction
        ? activeLearningFunction.label
        : globalDemoFunction?.label ?? "认知流程";
  const activeOverlayTitle = isCalculationQuantityTriplet
    ? "数量理解连接"
    : activeParadigm
      ? "当前范式连接"
    : activeNarrativeOverlay
      ? "当前演示连接"
      : activeLearningFunction
        ? "当前功能连接"
        : globalDemoFunction
          ? "当前网络"
          : "全局认知流程";
  const activeOverlayEmptyText = activeLearningFunction
    ? "这项功能还没有生成功能级综合连接。选择上方某个范式后，可以查看范式级曲线和节点标签。"
    : globalDemoFunction
      ? "这项能力暂时没有可显示的演示连接。"
      : "默认显示九项功能怎样参与一次学习任务。点击流程图里的某项能力，可以只切换右侧脑图网络。";
  const brainMapStoryTitle = isCalculationQuantityTriplet
    ? quantityUnderstandingTriplet.label
    : activeParadigm
      ? activeParadigm.label
    : activeNarrativeOverlay
      ? activeNarrativeOverlay.name
      : activeLearningFunction
        ? FOUNDATION_NETWORK_ROLE_COPY[activeLearningFunction.id]?.title ?? `${activeLearningFunction.label}网络`
        : globalDemoFunction
          ? FOUNDATION_NETWORK_ROLE_COPY[globalDemoFunction.id]?.title ?? `${globalDemoFunction.label}网络`
          : FOUNDATION_GLOBAL_NETWORK_COPY.title;
  const brainMapStoryBody = isCalculationQuantityTriplet
    ? "这张综合图只负责串起数量、数字符号和数轴三个环节。每一关的正式研究证据仍保留在对应范式中，不把综合图讲成新的精确定位。"
    : activeParadigm
      ? `这里展示的是 ${activeParadigm.label} 这类任务会调动哪些脑区协作。先看它需要孩子完成什么动作，再看这些动作如何连成一个完整的学习环节。`
    : activeNarrativeOverlay
      ? publicPresentationText(activeNarrativeOverlay.description)
      : activeFunctionSynthesis && activeLearningFunction
        ? (FOUNDATION_NETWORK_ROLE_COPY[activeLearningFunction.id]?.body ??
          `${activeLearningFunction.label} 参与学习任务中的关键处理环节，帮助孩子把输入的信息变成可理解、可操作的结果。`)
          : activeLearningFunction
            ? (FOUNDATION_NETWORK_ROLE_COPY[activeLearningFunction.id]?.body ??
              `${activeLearningFunction.label} 参与学习任务中的关键处理环节，帮助孩子把输入的信息变成可理解、可操作的结果。`)
            : globalDemoFunction
              ? (FOUNDATION_NETWORK_ROLE_COPY[globalDemoFunction.id]?.body ??
                `${globalDemoFunction.label} 会在学习任务的关键环节参与处理，帮助孩子把看到的内容变成可执行的动作。`)
              : FOUNDATION_GLOBAL_NETWORK_COPY.body;
  const evidencePanelTitle =
    activeParadigm || activeLearningFunction || activeNarrativeOverlay ? "深入机制与研究故事" : "图谱说明";
  const evidencePanelBadge = activeParadigm
    ? `${activeEvidenceUpgradeSources.length} 篇依据`
    : isCalculationQuantityTriplet
      ? `${quantityUnderstandingTriplet.stages.length} 关综合任务`
    : activeNarrativeOverlay
      ? "演示路径"
      : activeLearningFunction
        ? "功能机制"
        : "图谱参考";
  const activeRegionCoverage = useMemo(() => {
    if (activeNarrativeOverlay) {
      const narrativeRegionIds = new Set(
        activeNarrativeOverlayNodes
          .map((node) => node.regionCoverageId)
          .filter((regionId): regionId is string => Boolean(regionId)),
      );
      return regionCoverageRegistry.regions.filter((region) => narrativeRegionIds.has(region.id));
    }
    if (activeParadigm) {
      return regionCoverageRegistry.regions.filter((region) =>
        region.relatedParadigmIds.includes(activeParadigm.id),
      );
    }
    if (activeLearningFunction) {
      return regionCoverageRegistry.regions.filter((region) =>
        region.relatedFunctionIds.includes(activeLearningFunction.id),
      );
    }
    return [] as RegionCoverageEntry[];
  }, [activeLearningFunction, activeNarrativeOverlay, activeNarrativeOverlayNodes, activeParadigm]);
  const activeCoverageCounts = useMemo(
    () =>
      activeRegionCoverage.reduce<Partial<Record<RegionCoverageStatus, number>>>((countsByStatus, region) => {
        countsByStatus[region.coverageStatus] = (countsByStatus[region.coverageStatus] ?? 0) + 1;
        return countsByStatus;
      }, {}),
    [activeRegionCoverage],
  );
  const activeSpecializedLookupRows = useMemo(() => {
    if (!activeParadigm) {
      return [] as SpecializedAtlasLookupRow[];
    }

    return specializedAtlasLookup.lookupRows.filter(
      (row) => row.paradigmId === activeParadigm.id && row.reviewDecision === "review_label_available",
    );
  }, [activeParadigm]);
  const activeSpecializedLookupGroups = useMemo(
    () => groupSpecializedLookupRows(activeSpecializedLookupRows),
    [activeSpecializedLookupRows],
  );
  const activeFreeSurferMarkerCandidates = useMemo(() => {
    if (!activeParadigm) {
      return [] as FreeSurferMarkerCandidate[];
    }

    return freeSurferMarkerCandidates.markerCandidates
      .filter(
        (candidate) =>
          candidate.paradigmId === activeParadigm.id && candidate.includeInConservativeMarkerLayer,
      )
      .sort((a, b) => b.probability - a.probability || a.userFacingLabel.localeCompare(b.userFacingLabel, "zh-Hans-CN"));
  }, [activeParadigm]);
  const activeMtlMemoryRoute = useMemo(
    () => (activeParadigm ? mtlMemoryRouting.routes.find((route) => route.paradigmId === activeParadigm.id) ?? null : null),
    [activeParadigm],
  );
  const activeMtlPrimaryLabels = useMemo(
    () =>
      activeMtlMemoryRoute
        ? activeMtlMemoryRoute.primaryAtlasLabelIds
            .map((labelId) => specializedAtlasLabelById.get(labelId)?.chineseLabel ?? labelId)
            .filter((label, index, labels) => labels.indexOf(label) === index)
        : [],
    [activeMtlMemoryRoute, specializedAtlasLabelById],
  );
  const activeMtlReviewLabels = useMemo(
    () =>
      activeMtlMemoryRoute
        ? activeMtlMemoryRoute.reviewAtlasLabelIds
            .map((labelId) => specializedAtlasLabelById.get(labelId)?.chineseLabel ?? labelId)
            .filter((label, index, labels) => labels.indexOf(label) === index)
        : [],
    [activeMtlMemoryRoute, specializedAtlasLabelById],
  );
  const activeSpecializedStructures = useMemo(
    () =>
      activeRegionCoverage.filter(
        (region) =>
          region.coverageStatus === "specialized_atlas_reference" ||
          region.coverageStatus === "needs_specialized_atlas",
      ),
    [activeRegionCoverage],
  );
  const functionNetworkIds = useMemo(
    () =>
      new Set<Yeo7Network>([
        ...(activeLearningFunction?.candidateNetworks ?? []),
        ...(globalDemoFunction?.candidateNetworks ?? []),
        ...(activeFunctionSynthesis?.overlay.nodes.map((node) => node.networkId) ?? []),
        ...(globalDemoFunction ? activeOverlayNodes.map((node) => node.networkId) : []),
        ...(activeNarrativeOverlayNodes.map((node) => node.networkId) ?? []),
      ]),
    [
      activeLearningFunction,
      activeFunctionSynthesis,
      activeNarrativeOverlayNodes,
      activeOverlayNodes,
      globalDemoFunction,
    ],
  );
  const paradigmNetworkIds = useMemo(
    () => new Set<Yeo7Network>(activeParadigm?.candidateNetworks ?? []),
    [activeParadigm],
  );
  const narrativeNetworkIds = useMemo(
    () => new Set<Yeo7Network>(activeNarrativeOverlayNodes.map((node) => node.networkId)),
    [activeNarrativeOverlayNodes],
  );
  const videoNetworkFocusStages = isQuantityComparisonDemo
    ? QUANTITY_COMPARISON_STAGES
    : activeNarrativeOverlay?.presentationStages ?? [];
  const semanticNetworkIds = activeNarrativeOverlay ? narrativeNetworkIds : activeParadigm ? paradigmNetworkIds : functionNetworkIds;
  const focusNetworkIds = useMemo<Set<Yeo7Network> | null>(() => {
    if (focusedNetworkId) {
      return new Set([focusedNetworkId]);
    }
    if (activeNarrativeOverlay) {
      return narrativeNetworkIds;
    }
    if (activeParadigm) {
      return paradigmNetworkIds;
    }
    if (activeLearningFunction || globalDemoFunction) {
      return functionNetworkIds;
    }
    return null;
  }, [
    activeLearningFunction,
    activeNarrativeOverlay,
    activeParadigm,
    focusedNetworkId,
    functionNetworkIds,
    globalDemoFunction,
    narrativeNetworkIds,
    paradigmNetworkIds,
  ]);
  const threeViewLevel = useMemo<AtlasThreeViewLevel>(() => {
    if (activeNarrativeOverlay || activeParadigm) {
      return "paradigm_detail";
    }
    if (activeLearningFunction || isGlobalOverview) {
      return "function_overview";
    }
    return "atlas_reference";
  }, [activeLearningFunction, activeNarrativeOverlay, activeParadigm, isGlobalOverview]);
  const threeViewCameraFitScale = useMemo(() => {
    if (isVideoNetworkFocusMode) {
      return THREE_VIEW_CAMERA_FIT_SCALE.videoNetworkFocus;
    }
    if (isBrainOnlyMode) {
      return THREE_VIEW_CAMERA_FIT_SCALE.brainOnly;
    }
    if (isGlobalOverview) {
      return THREE_VIEW_CAMERA_FIT_SCALE.globalOverview;
    }
    if (threeViewLevel === "paradigm_detail") {
      return THREE_VIEW_CAMERA_FIT_SCALE.paradigmDetail;
    }
    if (threeViewLevel === "function_overview") {
      return THREE_VIEW_CAMERA_FIT_SCALE.functionOverview;
    }
    return THREE_VIEW_CAMERA_FIT_SCALE.atlasReference;
  }, [isBrainOnlyMode, isGlobalOverview, isVideoNetworkFocusMode, threeViewLevel]);
  const threeViewResetKey = useMemo(() => {
    if (isVideoNetworkFocusMode) {
      return "network-focus";
    }
    if (isGlobalOverview) {
      return "global-overview";
    }
    if (activeNarrativeOverlay) {
      return `narrative:${activeNarrativeOverlay.id}`;
    }
    if (activeParadigm) {
      return activeLearningFunction
        ? `paradigm-detail:${activeLearningFunction.id}`
        : "paradigm-detail";
    }
    if (activeLearningFunction) {
      return "function-overview";
    }
    return threeViewLevel;
  }, [activeLearningFunction, activeNarrativeOverlay, activeParadigm, isGlobalOverview, isVideoNetworkFocusMode, threeViewLevel]);
  const overlayNodeById = useMemo(
    () => new Map(activeOverlayNodes.map((node) => [node.id, node])),
    [activeOverlayNodes],
  );
  const selectedParcel = useMemo(
    () => atlas.parcels.find((parcel) => parcel.id === selectedParcelId) ?? null,
    [selectedParcelId],
  );
  const selectedParcelIdentity = selectedParcel ? parcelIdentityById.get(selectedParcel.id) : undefined;
  const networkById = useMemo(
    () =>
      networks.reduce<Record<string, BrainNetworkDefinition>>((items, network) => {
        items[network.id] = network;
        return items;
      }, {}),
    [networks],
  );
  const visibleParcels = useMemo(
    () =>
      atlas.parcels.filter((parcel) =>
        parcel.networkMemberships.some((membership) => enabledNetworks.has(membership.network)),
      ),
    [enabledNetworks],
  );
  const activeNamedParcels = useMemo(() => {
    const namedParcelIds = new Set<string>();
    const activeOverlayDisplayParcelIds = new Set<string>();
    const targetNetworkIds = focusNetworkIds ?? semanticNetworkIds;

    if (activeOverlayNodes.length > 0) {
      getOverlayDisplayParcelIds(activeOverlayNodes).forEach((parcelId) => {
        activeOverlayDisplayParcelIds.add(parcelId);
        namedParcelIds.add(parcelId);
      });
    } else if (targetNetworkIds.size === 0 && selectedParcel) {
      namedParcelIds.add(selectedParcel.id);
    } else {
      atlas.parcels.forEach((parcel) => {
        if (parcel.networkMemberships.some((membership) => targetNetworkIds.has(membership.network))) {
          namedParcelIds.add(parcel.id);
        }
      });
    }

    activeRegionCoverage.forEach((region) => {
      region.candidateParcelIds.forEach((parcelId) => {
        if (!activeParadigm && !activeFunctionSynthesis) {
          namedParcelIds.add(parcelId);
        }
      });
    });
    if (!activeParadigm && !activeNarrativeOverlay && selectedParcel) {
      namedParcelIds.add(selectedParcel.id);
    }

    return Array.from(namedParcelIds)
      .map((parcelId) => atlas.parcels.find((parcel) => parcel.id === parcelId))
      .filter((parcel): parcel is BrainParcel => Boolean(parcel))
      .sort((first, second) => {
        const firstActive = activeOverlayDisplayParcelIds.has(first.id);
        const secondActive = activeOverlayDisplayParcelIds.has(second.id);
        if (firstActive !== secondActive) {
          return firstActive ? -1 : 1;
        }
        return first.roi - second.roi;
      });
  }, [
    activeFunctionSynthesis,
    activeNarrativeOverlay,
    activeOverlayNodes,
    activeParadigm,
    activeRegionCoverage,
    focusNetworkIds,
    selectedParcel,
    semanticNetworkIds,
  ]);
  const searchResults = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return atlas.parcels
      .filter((parcel) => {
        const network = networkById[parcel.network];
        const identity = parcelIdentityById.get(parcel.id);
        const searchable = getParcelSearchText(parcel, identity, [
          network?.label,
          network?.englishLabel,
          network?.sourceName,
        ]);

        return searchable.includes(normalizedQuery);
      })
      .slice(0, MAX_SEARCH_RESULTS);
  }, [networkById, parcelIdentityById, searchQuery]);
  const selectedDomainMatches = useMemo(
    () => (selectedParcel ? getParcelDomainMatches(selectedParcel, evidenceIndex) : []),
    [selectedParcel],
  );
  const selectedNetworkDomains = useMemo(() => {
    const domainsById = new Map<string, EvidenceDomain>();
    selectedParcel?.networkMemberships.forEach((membership) => {
      getNetworkDomains(membership.network, evidenceIndex).forEach((domain) => {
        domainsById.set(domain.id, domain);
      });
    });
    return Array.from(domainsById.values());
  }, [selectedParcel]);
  const mapEyebrow = "3D RAS 视图";

  function enableAllNetworks() {
    setEnabledNetworks((current) => {
      if (current.size === allNetworkIds.length && allNetworkIds.every((networkId) => current.has(networkId))) {
        return current;
      }
      return new Set(allNetworkIds);
    });
  }

  function toggleNetwork(networkId: Yeo7Network) {
    setActiveLearningFunctionId(null);
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("overview");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
    if (focusedNetworkId === networkId && enabledNetworks.has(networkId)) {
      setFocusedNetworkId(null);
    }

    setEnabledNetworks((current) => {
      const next = new Set(current);
      if (next.has(networkId)) {
        next.delete(networkId);
      } else {
        next.add(networkId);
      }
      return next;
    });
  }

  function showAllNetworks() {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveLearningFunctionId(null);
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("overview");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function focusNetwork(networkId: Yeo7Network) {
    enableAllNetworks();
    setFocusedNetworkId(networkId);
    setActiveLearningFunctionId(null);
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("overview");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function clearNetworkFocus() {
    setFocusedNetworkId(null);
  }

  function selectVideoNetworkStage(stageId: string) {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveNarrativeStageId(stageId);
  }

  function selectVideoDemoMode(mode: VideoDemoMode) {
    setVideoDemoMode(mode);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveNarrativeStageId(
      mode === "quantity_comparison"
        ? QUANTITY_COMPARISON_STAGES[0]?.id ?? null
        : mathLogicStroopDemo.presentationStages?.[0]?.id ?? null,
    );
  }

  function selectLearningFunction(functionId: string) {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("overview");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
    setActiveLearningFunctionId((current) => (current === functionId ? null : functionId));
  }

  function selectGlobalDemoFunction(functionId: string) {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setGlobalDemoFunctionId((current) => (current === functionId ? null : functionId));
  }

  function clearLearningFunctionFocus() {
    setActiveLearningFunctionId(null);
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("overview");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function selectCalculationQuantityTriplet() {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveLearningFunctionId("calculation");
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("quantity_triplet");
    setActiveQuantityTripletStageId(quantityUnderstandingTriplet.stages[0]?.id ?? "");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function openQuantityTripletStage(stageId: string) {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveLearningFunctionId("calculation");
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("quantity_triplet");
    setActiveQuantityTripletStageId(stageId);
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function selectQuantityTripletParadigm(paradigm: CognitiveParadigm, stageId: string) {
    setActiveQuantityTripletStageId(stageId);
    selectParadigm(paradigm);
  }

  function returnToCalculationOverview() {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveLearningFunctionId("calculation");
    setActiveParadigmId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("overview");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function selectParadigm(paradigm: CognitiveParadigm) {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setActiveLearningFunctionId((current) => current ?? paradigm.primaryFunctionId);
    setActiveParadigmId(paradigm.id);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("paradigm");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function openParadigm(paradigm: CognitiveParadigm) {
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setActiveLearningFunctionId(paradigm.primaryFunctionId);
    setActiveParadigmId(paradigm.id);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("paradigm");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
  }

  function openUseCase(useCase: ParadigmUseCase) {
    const paradigm = paradigms.find((item) => item.id === useCase.paradigmId);
    enableAllNetworks();
    setFocusedNetworkId(null);
    setActiveNarrativeOverlayId(null);
    setActiveNarrativeStageId(null);
    setActiveLearningFunctionId(useCase.functionId);
    setActiveParadigmId(useCase.paradigmId);
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
    setActiveExplanationPanel("paradigm");
    setShowFunctionParadigmGuide(false);
    setActivePaperReader(null);
    if (paradigm) {
      const searchParams = new URLSearchParams({
        function: useCase.functionId,
        paradigm: paradigm.id,
        phenomenon: useCase.id,
      });
      window.history.replaceState(null, "", siteUrl(`/?${searchParams.toString()}`));
    }
  }

  function selectParcel(parcel: BrainParcel) {
    setSelectedOverlayNodeId(null);
    setSelectedParcelId(parcel.id);
    setSelectedPhysicalStructure(null);
    setEnabledNetworks((current) => {
      const membershipNetworks = parcel.networkMemberships.map((membership) => membership.network);
      if (membershipNetworks.every((networkId) => current.has(networkId))) {
        return current;
      }

      const next = new Set(current);
      membershipNetworks.forEach((networkId) => next.add(networkId));
      return next;
    });
  }

  function selectPhysicalStructure(selection: AtlasPhysicalStructureSelection) {
    setSelectedOverlayNodeId(null);
    setSelectedPhysicalStructure(selection);
    setSelectedParcelId("");
  }

  function clearMapSelection() {
    setSelectedOverlayNodeId(null);
    setSelectedParcelId("");
    setSelectedPhysicalStructure(null);
  }

  function openMathLogicStroopDemo() {
    window.location.href = siteUrl("/?qa=network-focus");
  }

  function openShortTermMemoryTransfer() {
    setShowShortTermMemoryTransfer(true);
  }

  const sidebarParadigmMenu =
    activeLearningFunction && !activeNarrativeOverlay ? (
      <section className="sidebar-paradigm-panel" aria-label="当前功能范式">
        <div className="sidebar-paradigm-heading">
          <div>
            <span>研究范式</span>
            <strong>研究范式与论文</strong>
          </div>
          <small>{activeSidebarParadigmEntryCount} 个入口</small>
        </div>
        <div className="sidebar-paradigm-list">
          {activeCalculationParadigmGroups.length > 0 ? (
            activeCalculationParadigmGroups.map((group) => (
              <div className="sidebar-paradigm-group" key={group.label}>
                <span>{group.label}</span>
                {group.label === "数量理解" ? (
                  <button
                    className={[
                      "sidebar-paradigm-item",
                      "quantity-triplet-entry",
                      isCalculationQuantityTripletContext ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={selectCalculationQuantityTriplet}
                    type="button"
                  >
                    <strong>{quantityUnderstandingTriplet.label}</strong>
                    <small>三关连续观察：看见数量、理解数字、放进数轴。</small>
                  </button>
                ) : (
                  group.paradigms.map((paradigm) => (
                    <button
                      className={[
                        "sidebar-paradigm-item",
                        activeParadigm?.id === paradigm.id ? "active" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      key={paradigm.id}
                      onClick={() => selectParadigm(paradigm)}
                      type="button"
                    >
                      <strong>{paradigm.label}</strong>
                      <small>{publicPresentationText(getParadigmMenuSummary(paradigm))}</small>
                    </button>
                  ))
                )}
              </div>
            ))
          ) : activePrimaryFunctionParadigms.length > 0 ? (
            <div className="sidebar-paradigm-group">
              <span>核心任务</span>
              {activePrimaryFunctionParadigms.map((paradigm) => (
                <button
                  className={[
                    "sidebar-paradigm-item",
                    activeParadigm?.id === paradigm.id ? "active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={paradigm.id}
                  onClick={() => selectParadigm(paradigm)}
                  type="button"
                >
                  <strong>{paradigm.label}</strong>
                  <small>{publicPresentationText(getParadigmMenuSummary(paradigm))}</small>
                </button>
              ))}
            </div>
          ) : null}
          {activeRelatedFunctionParadigms.length > 0 && (
            <div className="sidebar-paradigm-group related">
              <span>也会用到</span>
              {activeRelatedFunctionParadigms.map((paradigm) => (
                <button
                  className={[
                    "sidebar-paradigm-item",
                    "related",
                    activeParadigm?.id === paradigm.id ? "active" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={paradigm.id}
                  onClick={() => selectParadigm(paradigm)}
                  type="button"
                >
                  <strong>{paradigm.label}</strong>
                  <small>{publicPresentationText(getParadigmMenuSummary(paradigm))}</small>
                </button>
              ))}
            </div>
          )}
          {isShortTermMemoryProductSample && (
            <div className="sidebar-paradigm-group working-memory-topic">
              <span>专题讲解</span>
              
            </div>
          )}
          {isShortTermMemoryProductSample && (
            <div className="sidebar-paradigm-group transfer">
              <span>学科迁移</span>
              
            </div>
          )}
        </div>
      </section>
    ) : null;

  return (
    <main
      className={[
        "atlas-shell",
        activeNarrativeOverlay ? "narrative-demo-layout" : "",
        isVideoNetworkFocusMode ? "video-network-focus-layout" : "",
        isBrainOnlyMode ? "brain-only-layout" : "",
        isFunctionProductSample ? "function-product-layout" : "",
        !activeLearningFunction ? "no-function-selected" : "",
        isFunctionProductSample && functionOverviewExpanded ? "overview-expanded" : "",
        isFunctionProductSample && functionParadigmExpanded ? "paradigm-expanded" : "",
        isCalculationQuantityTripletContext ? "quantity-triplet-context-layout" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <aside className="atlas-sidebar" aria-label="图谱控制区">
        <div className="brand-block">
          <div>
            <p className="eyebrow">脑功能可视化</p>
            <h1>九项基础脑功能</h1>
            <p className="atlas-subtitle">200 个分区 / Yeo 7 网络 / 9 项功能</p>
          </div>
          <div className="sidebar-status" aria-label="图谱状态">
            <span>{visibleParcels.length} 个可见点位</span>
            <span>{evidenceIndex.domains.length} 个底图证据</span>
          </div>
        </div>

        <LearningFunctionNavigator
          activeFunction={activeLearningFunction}
          activeFunctionMenu={sidebarParadigmMenu}
          learningFunctions={learningFunctionNavItems}
          networkById={networkById}
          onClear={clearLearningFunctionFocus}
          onSelect={selectLearningFunction}
        />

        <section className="advanced-tools" aria-label="高级工具">
          <details className="advanced-section">
            <summary>
              <span>高级底图</span>
              <small>Yeo 7 网络</small>
            </summary>
            <NetworkFilter
              counts={counts}
              enabledNetworks={enabledNetworks}
              focusedNetwork={focusedNetworkId}
              networks={networks}
              onClearFocus={clearNetworkFocus}
              onFocus={focusNetwork}
              onShowAll={showAllNetworks}
              onToggle={toggleNetwork}
              selectedNetwork={selectedParcel?.network ?? null}
            />
          </details>

          <details className="advanced-section" open>
            <summary>
              <span>点位搜索</span>
              <small>
                {selectedParcel ? getParcelCompactDisplayName(selectedParcelIdentity, selectedParcel) : "点击点位后查看"}
              </small>
            </summary>
            <ParcelSearch
              identityById={parcelIdentityById}
              networkById={networkById}
              onQueryChange={setSearchQuery}
              onSelectParcel={selectParcel}
              query={searchQuery}
              results={searchResults}
            />
          </details>

          <details className="advanced-section">
            <summary>
              <span>证据域</span>
              <small>{evidenceIndex.sources.length} 个底图来源</small>
            </summary>
            <section className="evidence-summary" aria-label="证据层摘要">
              <div className="filter-title-row">
                <h2>证据参考</h2>
                <span>{evidenceIndex.version}</span>
              </div>
              <p>{evidenceIndex.name}</p>
              <div className="domain-chip-list">
                {selectedNetworkDomains.map((domain: EvidenceDomain) => (
                  <span className="domain-chip" key={domain.id}>
                    {domain.label}
                  </span>
                ))}
              </div>
              <section className="source-stack" aria-label="证据来源">
                <div className="panel-title-row">
                  <h3>证据来源</h3>
                  <span>{evidenceIndex.sources.length}</span>
                </div>
                <div className="source-list">
                  {evidenceIndex.sources.map((source) => {
                    const href = sourceHref(source);
                    const sourceBody = (
                      <>
                        <span className="source-type">{SOURCE_TYPE_LABELS[source.type] ?? source.type}</span>
                        <strong>{source.title}</strong>
                        <small>
                          {[source.year, source.doi ? `DOI ${source.doi}` : undefined]
                            .filter(Boolean)
                            .join(" · ")}
                        </small>
                      </>
                    );

                    return href ? (
                      <a className="source-item" href={href} key={source.id} rel="noreferrer" target="_blank">
                        {sourceBody}
                      </a>
                    ) : (
                      <article className="source-item" key={source.id}>
                        {sourceBody}
                      </article>
                    );
                  })}
                </div>
              </section>
            </section>
          </details>
        </section>
      </aside>

      <section className="atlas-workspace" aria-label="脑功能工作区">
        <section className="atlas-stage" aria-label="Schaefer 图谱">
          <div className="stage-header">
            <div>
              <p className="eyebrow">{mapEyebrow}</p>
              <h2>脑图</h2><small>核心浏览版 · 保留小脑与脑干示意。<a href={siteUrl("/THIRD_PARTY_NOTICES.md")} target="_blank" rel="noreferrer">素材与来源</a></small>
              <aside aria-label="公开候选模型说明" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}>
                <strong>Schaefer 功能分区体积图 · 200 区 / 7 网络</strong>
                <div style={{ display: "flex", gap: 6, margin: "6px 0" }}>
                  <button type="button" aria-pressed={!atlasSmoothed} onClick={() => setAtlasSmoothed(false)}>分区表面</button>
                  <button type="button" aria-pressed={atlasSmoothed} onClick={() => setAtlasSmoothed(true)}>平滑展示</button>
                  <a href={siteUrl("/docs/model-license.html")} target="_blank" rel="noreferrer">模型来源与许可</a>
                </div>
                <div>由官方功能分区体积生成，采用原始分区编号和网络名称；不是精细皮层重建。</div>
                <div>{atlasSmoothed ? "平滑形态仅用于展示，不可读取空间距离。" : "小脑与皮层已核对共同群体模板。"} 节点为教学示意，另可查看论文报告点的近似位置；脑干为示意。<a href={siteUrl("/docs/spatial-validation.html")} target="_blank" rel="noreferrer"> 定位说明</a><a href={siteUrl("/docs/coordinate-evidence.html")} target="_blank" rel="noreferrer"> · 论文坐标依据</a><a href={siteUrl("/?view=teaching-points")} target="_blank" rel="noreferrer"> · 查看近似论文点</a></div>
              </aside>
            </div>
            <div className="stage-actions">
              <div className="overlay-map-status" title={`${activeOverlayModeLabel} ${activeOverlayLabel}`}>
                <span>{activeOverlayModeLabel}</span>
                <strong>{activeOverlayLabel}</strong>
              </div>
              
              
              <button
                className={["demo-launch-button", activeNarrativeOverlay ? "active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={openMathLogicStroopDemo}
                type="button"
              >
                做题演示
              </button>
              <button
                aria-pressed={autoRotateBrain}
                className={["auto-rotate-button", autoRotateBrain ? "active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setAutoRotateBrain((current) => !current)}
                type="button"
              >
                自动旋转
              </button>
              {activeLearningFunction && (
                <div className="overlay-map-status function-status" title={`功能 ${activeLearningFunction.label}`}>
                  <span>功能</span>
                  <strong>{activeLearningFunction.label}</strong>
                </div>
              )}
              <SurfaceOpacityControl
                ariaLabel="整体显影"
                label="整体显影"
                onChange={setBrainSurfaceOpacity}
                value={effectiveBrainSurfaceOpacity}
              />
              {focusedNetworkId && (
                <button className="text-button" onClick={clearNetworkFocus} type="button">
                  清除聚焦
                </button>
              )}
            </div>
          </div>

          <div
            className={[
              "map-frame",
              "three-active",
              isGlobalOverview ? "global-overview-map" : "",
              globalDemoFunction ? "global-demo-active" : "",
              showEmotionModulationLayer ? "emotion-modulation-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <AtlasThreeView
              atlasSmoothed={atlasSmoothed}
              autoRotate={autoRotateBrain}
              enableAshsAppFitPreview={enableAshsAppFitPreview}
              focusNetworkIds={focusNetworkIds}
              networkById={networkById}
              onClearSelection={clearMapSelection}
              onSelectOverlayNode={setSelectedOverlayNodeId}
              onSelectParcel={selectParcel}
              onSelectPhysicalStructure={selectPhysicalStructure}
              overlayEdges={activeOverlayEdges}
              functionHeatNodes={threeViewLevel === "function_overview" ? activeFunctionHeatNodes : undefined}
              overlayNodes={activeOverlayNodes}
              parcelIdentityById={parcelIdentityById}
              parcels={visibleParcels}
              preferOverlayNodeLabels={threeViewLevel === "function_overview" || Boolean(activeNarrativeOverlay)}
              preserveViewOnOverlayChange={
                isVideoNetworkFocusMode ? true : threeViewLevel !== "atlas_reference" || Boolean(activeNarrativeOverlay)
              }
              selectedOverlayNodeId={selectedOverlayNodeId ?? ""}
              selectedParcelId={selectedParcel?.id ?? ""}
              selectedPhysicalNodeId={selectedPhysicalStructure?.overlayNodeId ?? ""}
              selectedPhysicalStructureId={selectedPhysicalStructure?.structureId ?? ""}
              semanticNetworkIds={semanticNetworkIds}
              structureOpacities={structureOpacities}
              surfaceOpacity={effectiveBrainSurfaceOpacity}
              cameraFitScale={threeViewCameraFitScale}
              transitionKey={
                activeNarrativeStage?.id ??
                activeParadigm?.id ??
                activeLearningFunction?.id ??
                (isGlobalOverview ? globalDemoRenderFunctionId ?? "global-overview" : threeViewLevel)
              }
              viewLevel={threeViewLevel}
              viewResetKey={threeViewResetKey}
            />
            {isGlobalOverview && (
              <div className="global-brain-flow-overlay" aria-label="全局认知流程示意">
                <div className="global-brain-flow-panel">
                  <div className="global-brain-flow-steps" aria-label="认知任务四步">
                    {FOUNDATION_COGNITIVE_PROCESS_STAGES.map((step, index) => {
                      const stageNumber = index + 1;
                      const isCoveredByActiveAbility =
                        globalDemoAbilityLane &&
                        stageNumber >= globalDemoAbilityLane.start &&
                        stageNumber < globalDemoAbilityLane.end;
                      return (
                        <article
                          className={[
                            "global-brain-flow-step",
                            globalDemoAbilityLane && isCoveredByActiveAbility ? "active" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          key={step.id}
                        >
                          <span>{String(stageNumber).padStart(2, "0")}</span>
                          <strong>{step.title}</strong>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
            {activeEmotionModulationMapping && !activeNarrativeOverlay && (
              <section className="emotion-modulation-map-panel" aria-label="情绪如何影响这项能力">
                <div className="emotion-modulation-map-head">
                  <div>
                    <span>情绪调制</span>
                    <strong>{EMOTION_MODULATION_STRENGTH_LABELS[activeEmotionModulationMapping.displayStrength]}</strong>
                  </div>
                  <label
                    className={[
                      "emotion-modulation-switch",
                      showEmotionModulationLayer ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      checked={showEmotionModulationLayer}
                      onChange={(event) => setShowEmotionModulationLayer(event.currentTarget.checked)}
                      type="checkbox"
                    />
                    <span>显示</span>
                  </label>
                </div>
                <p>{emotionModulationCopy(activeEmotionModulationMapping)}</p>
                <div className="emotion-modulation-branches compact" aria-label="调制环节">
                  {activeEmotionModulationBranchLabels.map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
                <small>{EMOTION_MODULATION_GUARDRAIL}</small>
              </section>
            )}
            {showEmotionModulationLayer && activeEmotionModulationLegendItems.length > 0 && (
              <aside className="emotion-3d-legend" aria-label="情绪调制 3D 图例">
                <div className="emotion-3d-legend-head">
                  <span>状态调制图例</span>
                  <strong>机制颜色</strong>
                </div>
                <div className="emotion-3d-legend-list">
                  {activeEmotionModulationLegendItems.map((item) => (
                    <span
                      className="emotion-3d-legend-item"
                      key={item.id}
                      style={{
                        "--legend-color": item.color,
                        "--legend-gradient": item.gradient,
                      } as CSSProperties}
                    >
                      {item.label}
                    </span>
                  ))}
                </div>
                <div className="emotion-3d-structure-legend">
                  <span><i className="legend-dot cortical" />皮层代理点</span>
                  <span><i className="legend-dot subcortical" />边缘/皮层下节点</span>
                </div>
              </aside>
            )}
            <aside className="brain-map-story-card" aria-label="当前网络说明">
              <span>
                {isCalculationQuantityTriplet
                  ? "综合任务"
                  : activeParadigm
                    ? "当前范式"
                    : activeNarrativeOverlay
                      ? "演示说明"
                      : "当前网络"}
              </span>
              <strong>{brainMapStoryTitle}</strong>
              <p>{brainMapStoryBody}</p>
              {activeParadigm && !activeNarrativeOverlay && (
                <div className="local-paper-reader-provenance" aria-label="3D脑图证据覆盖">
                  <small>
                    展示 {activeOverlayNodes.length} 个区域关联节点 / {activeOverlayCoverageParcelCount} 个相关分区
                  </small>
                  <small>教学示意位置，不表示论文原始峰值。</small>
                  {activeOverlayNodes.length > 0 && (
                    <details>
                      <summary>查看节点的坐标依据</summary>
                      <ul>
                        {activeOverlayNodes.map((node) => (
                          <li key={node.id}>
                            <a href={siteUrl(`/docs/coordinate-evidence.html?node=${encodeURIComponent(node.id)}`)} target="_blank" rel="noreferrer">{node.label}</a>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              )}
            </aside>
          </div>

          {isVideoNetworkFocusMode && videoNetworkFocusStages.length > 0 && (
            <section className="video-network-focus-strip" aria-label="做题演示功能协作">
              <div className="video-network-focus-topbar">
                <a className="video-network-focus-back" href={siteUrl("/?function=calculation")} aria-label="返回计算能力主界面">
                  ←
                </a>
                <div className="video-network-mode-switcher" aria-label="切换展示模式">
                  {VIDEO_DEMO_MODES.map((mode) => (
                    <button
                      aria-pressed={videoDemoMode === mode.id}
                      className={videoDemoMode === mode.id ? "active" : ""}
                      key={mode.id}
                      onClick={() => selectVideoDemoMode(mode.id)}
                      type="button"
                    >
                      <strong>{mode.label}</strong>
                      <small>{mode.description}</small>
                    </button>
                  ))}
                </div>
              </div>
              <div className="video-network-focus-title">
                <span>{isQuantityComparisonDemo ? "对比演示" : "做题演示"}</span>
                <strong>{isQuantityComparisonDemo ? "机械数数与数量理解" : "功能协作"}</strong>
              </div>
              <div className="video-network-focus-buttons">
                {videoNetworkFocusStages.map((stage, stageIndex) => {
                  const stageCopy = VIDEO_NETWORK_STAGE_COPY[stage.id] ?? {
                    label: stage.title.replace(/^\d+\.\s*/, ""),
                    description: stage.summary,
                  };
                  return (
                    <button
                      className={activeNarrativeStageId === stage.id ? "active" : ""}
                      key={stage.id}
                      onClick={() => selectVideoNetworkStage(stage.id)}
                      type="button"
                    >
                      <span className="video-network-stage-index">{stageIndex + 1}</span>
                      <span className="video-network-stage-copy">
                        <strong>{stageCopy.label}</strong>
                        <small>{stageCopy.description}</small>
                      </span>
                    </button>
                  );
                })}
              </div>
              {activeVideoStageRegionCopy && (
                <div className="video-network-region-card" aria-label="当前阶段脑区协作">
                  <span>脑区协作</span>
                  <p>{activeVideoStageRegionCopy.summary}</p>
                  <div>
                    {activeVideoStageRegionCopy.regions.map((region) => (
                      <small key={region}>{region}</small>
                    ))}
                  </div>
                </div>
              )}
              {isQuantityComparisonDemo && (
                <div className="video-network-contrast-card" aria-label="两种数量任务的连接差异">
                  <span>连接差异</span>
                  <div className={activeNarrativeStageId === "quantity-stage-counting" ? "active" : ""}>
                    <strong>机械数数</strong>
                    <small>视觉搜索 → 逐项定位 → 顺序累加</small>
                  </div>
                  <div className={activeNarrativeStageId === "quantity-stage-language" ? "active" : ""}>
                    <strong>数量理解</strong>
                    <small>数词语义 ↔ 符号形式 ↔ 数量意义</small>
                  </div>
                </div>
              )}
              <button
                aria-pressed={autoRotateBrain}
                className={["video-network-rotate-button", autoRotateBrain ? "active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() => setAutoRotateBrain((current) => !current)}
                type="button"
              >
                <span aria-hidden="true">↻</span>
                {autoRotateBrain ? "停止旋转" : "自动旋转"}
              </button>
              <SurfaceOpacityControl
                ariaLabel="演示页整体显影"
                className="video-network-opacity-control"
                label="整体显影"
                onChange={setBrainSurfaceOpacity}
                value={brainSurfaceOpacity}
              />
            </section>
          )}
        </section>

        <section className="current-detail-panel" aria-label="当前功能与证据">
          {activeNarrativeOverlay && (
            <section className="narrative-demo-panel" aria-label="当前演示脚本">
              <div className="narrative-demo-heading">
                <div>
                  <p className="eyebrow">内容演示模式</p>
                  <h2>{activeNarrativeOverlay.name}</h2>
                </div>
                <span>{activeOverlayNodes.length} 个节点 / {activeOverlayEdges.length} 条连接</span>
              </div>
              <p>{publicPresentationText(activeNarrativeOverlay.userPromptExample)}</p>
              <div className="narrative-stage-strip">
                {activeNarrativeOverlay.presentationStages?.map((stage) => (
                  <button
                    className={[
                      "narrative-stage-card",
                      activeNarrativeStage?.id === stage.id ? "active" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={stage.id}
                    onClick={() => setActiveNarrativeStageId(stage.id)}
                    type="button"
                  >
                    <strong>{stage.title}</strong>
                    <p>{publicPresentationText(stage.summary)}</p>
                    <small>{publicPresentationText(stage.speakerCue)}</small>
                  </button>
                ))}
              </div>
              <div className="narrative-boundary-row">
                {activeNarrativeOverlay.safeClaim && (
                  <article>
                    <strong>可讲</strong>
                    <p>{publicPresentationText(activeNarrativeOverlay.safeClaim)}</p>
                  </article>
                )}
                {activeNarrativeOverlay.boundary && (
                  <article>
                    <strong>边界</strong>
                    <p>{publicPresentationText(activeNarrativeOverlay.boundary)}</p>
                  </article>
                )}
              </div>
            </section>
          )}
          <section className="function-overview-strip" aria-label="当前功能说明">
            {isCalculationQuantityTripletContext ? (
              <div
                className={[
                  "quantity-triplet-context-bar",
                  activeQuantityTripletParadigmStage ? "child-open" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="quantity-triplet-context-heading">
                  <div>
                    <span>数量理解专题</span>
                    <h2>{quantityUnderstandingTriplet.label}</h2>
                    {!activeQuantityTripletParadigmStage && <p>{quantityUnderstandingTriplet.summary}</p>}
                  </div>
                  <button onClick={returnToCalculationOverview} type="button">
                    <span aria-hidden="true">←</span>
                    返回计算能力
                  </button>
                </div>

                <div className="quantity-triplet-stage-nav compact" role="tablist" aria-label="数量理解三个环节">
                  {quantityUnderstandingTriplet.stages.map((stage) => (
                    <button
                      aria-selected={activeQuantityTripletStage?.id === stage.id}
                      className={activeQuantityTripletStage?.id === stage.id ? "active" : ""}
                      key={stage.id}
                      onClick={() => openQuantityTripletStage(stage.id)}
                      role="tab"
                      type="button"
                    >
                      <span>{stage.order}</span>
                      <strong>{stage.label}</strong>
                    </button>
                  ))}
                </div>

                {activeQuantityTripletParadigmStage ? (
                  <div className="quantity-triplet-child-nav">
                    <button
                      className="quantity-triplet-stage-back"
                      onClick={() => openQuantityTripletStage(activeQuantityTripletParadigmStage.id)}
                      type="button"
                    >
                      <span aria-hidden="true">←</span>
                      返回本环节
                    </button>
                    <div aria-label={`${activeQuantityTripletParadigmStage.label}研究范式`}>
                      {activeQuantityTripletStageParadigms.map((paradigm) => (
                        <button
                          aria-pressed={activeParadigm?.id === paradigm.id}
                          className={activeParadigm?.id === paradigm.id ? "active" : ""}
                          key={paradigm.id}
                          onClick={() => selectQuantityTripletParadigm(paradigm, activeQuantityTripletParadigmStage.id)}
                          type="button"
                        >
                          {paradigm.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : activeQuantityTripletStage ? (
                  <p className="quantity-triplet-context-summary">
                    <strong>{activeQuantityTripletStage.label}</strong>
                    <span>{activeQuantityTripletStage.storyBeat}</span>
                  </p>
                ) : null}
              </div>
            ) : isFunctionProductSample && activeLearningFunction ? (
              <>
                {!functionOverviewExpanded && (
                  <button
                    className="panel-toggle-heading"
                    onClick={() => setActiveExplanationPanel("overview")}
                    type="button"
                  >
                    <span>{activeLearningFunction.label}是什么</span>
                    <strong>点击展开</strong>
                  </button>
                )}
                {functionOverviewExpanded ? (
                  <div className="attention-overview-content">
                    <div className="attention-definition-block">
                      <div className="attention-overview-heading-row">
                        <h2>{activeLearningFunction.label}是什么</h2>
                        <div className="attention-paradigm-summary">
                          <span>{activeFunctionOverviewLine}</span>
                          <button
                            aria-expanded={showFunctionParadigmGuide}
                            aria-label="查看范式说明"
                            className="concept-help-button"
                            onClick={() => setShowFunctionParadigmGuide((current) => !current)}
                            type="button"
                          >
                            ?
                          </button>
                        </div>
                      </div>
                      {isAttentionProductSample ? (
                        <>
                          <p>
                            注意力不是单一能力。它更像一套调度系统：先把人带进任务，再帮他选中目标、维持目标、
                            压住干扰，并在任务变化时重新分配资源。
                          </p>
                          <strong>
                            所以看注意力，不能只问"专不专心"。要看他在哪一步掉线：是进不来、看不准、守不住，
                            还是遇到冲突时太快反应。
                          </strong>
                        </>
                      ) : (
                        <>
                          <p>
                            {activeFunctionUseCaseSummary
                              ? publicPresentationText(activeFunctionUseCaseSummary.summary)
                              : publicPresentationText(activeLearningFunction.description)}
                          </p>
                          <strong>
                            所以看{activeLearningFunction.label}，不能只问"好不好"。要把它拆到具体范式里，看卡在输入、
                            保持、转换、控制还是输出哪一步。
                          </strong>
                        </>
                      )}
                    </div>

                    {showFunctionParadigmGuide && (
                      <section className="attention-paradigm-guide" aria-label="范式说明">
                        <div className="attention-paradigm-guide-intro">
                          <strong>范式是什么</strong>
                          <p>
                            范式就是研究者用来观察某种能力的标准任务。它不是诊断结论，也不是训练名称；
                            它的作用是把"{activeLearningFunction.label}不好"拆成更具体、可观察、可对照研究的问题。
                          </p>
                        </div>
                        <div className="attention-paradigm-guide-table" role="table">
                          <div className="attention-paradigm-guide-header" role="row">
                            <span role="columnheader">位置</span>
                            <span role="columnheader">范式</span>
                            <span role="columnheader">一句话说明</span>
                            <span role="columnheader">研究标签</span>
                          </div>
                          {activeFunctionParadigmGuideRows.map(({ paradigm, roleLabel, sources }) => (
                            <div className="attention-paradigm-guide-row" key={paradigm.id} role="row">
                              <span className="guide-role" role="cell">{roleLabel}</span>
                              <strong role="cell">{paradigm.label}</strong>
                              <p role="cell">{publicPresentationText(getParadigmMenuSummary(paradigm))}</p>
                              <div className="guide-source-tags" role="cell">
                                {sources.length > 0 ? (
                                  sources.map((source) => (
                                    <span key={source.id}>{sourceCandidateShortLabel(source)}</span>
                                  ))
                                ) : (
                                  <span>待补研究</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <div className="attention-relation-panel">
                      <div className="panel-title-row">
                        <h3>范式之间怎么分工</h3>
                        <span>{activeFunctionParadigms.length} 个范式</span>
                      </div>
                      <div
                        className={[
                          "attention-system-map",
                          activeLearningFunction.id === "calculation" ? "calculation-system-map" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        aria-label={`${activeLearningFunction.label}范式关系图`}
                      >
                        <article className="attention-system-center">
                          <span>主入口</span>
                          <strong>
                            {isAttentionProductSample
                              ? "ANT 注意网络测试"
                              : activeAnchorParadigm?.label ?? activeLearningFunction.label}
                          </strong>
                          <p>
                            {isAttentionProductSample
                              ? "先把注意力拆成准备、定向和执行控制三个环节，再决定要往哪一类范式继续看。"
                              : activeAnchorFunctionUseCase
                                ? publicPresentationText(activeAnchorFunctionUseCase.featureDescription)
                                : "先用主入口范式解释这项能力的大结构，再进入更具体的范式分工。"}
                          </p>
                        </article>
                        <div className="attention-system-branches">
                          {isAttentionProductSample
                            ? ATTENTION_RELATION_GROUPS.map((item) => (
                                <article key={item.label}>
                                  <span>{item.label}</span>
                                  <strong>{item.paradigms}</strong>
                                  <p>{item.text}</p>
                                </article>
                              ))
                            : activeLearningFunction.id === "calculation"
                              ? CALCULATION_RELATION_GROUPS.map((item) => (
                                  <article key={item.label}>
                                    <span>{item.label}</span>
                                    <strong>{item.paradigms}</strong>
                                    <p>{item.text}</p>
                                  </article>
                                ))
                            : activeFunctionRelationBranches.map(({ useCase, paradigm }) => (
                                <article key={useCase.id}>
                                  <span>{PARADIGM_GUIDE_ROLE_LABELS[useCase.role]}</span>
                                  <strong>{paradigm?.label ?? useCase.paradigmId}</strong>
                                  <p>{publicPresentationText(useCase.mechanismTitle)}</p>
                                </article>
                              ))}
                        </div>
                      </div>
                    </div>

                    <div className={`attention-state-grid ${isShortTermMemoryProductSample ? "short-memory" : ""}`}>
                      {isShortTermMemoryProductSample ? (
                        <>
                          <article className="strained">
                            <strong>短时记忆力差的学习表现</strong>
                            <ul>
                              {(activeFunctionSigns.length > 0
                                ? activeFunctionSigns.slice(0, 5)
                                : activeFunctionParentPhrases.slice(0, 5)
                              ).map((item) => (
                                <li key={item}>{publicPresentationText(item)}</li>
                              ))}
                            </ul>
                          </article>
                          
                        </>
                      ) : (
                        <>
                          <article>
                            <strong>可以支撑学习需要</strong>
                            <ul>
                              {activeFunctionReadyStates.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          </article>
                          <article className="strained">
                            <strong>暂时支撑不住学习需要</strong>
                            <ul>
                              {(isAttentionProductSample
                                ? activeFunctionUnsupportedStates
                                : activeFunctionSigns.length > 0
                                  ? activeFunctionSigns.slice(0, 4)
                                  : activeFunctionParentPhrases.slice(0, 4)
                              ).map((item) => (
                                <li key={item}>{publicPresentationText(item)}</li>
                              ))}
                            </ul>
                          </article>
                        </>
                      )}
                    </div>

                    <div className="attention-overview-footer">
                      <p>左侧菜单中选择一个范式，了解相关知识和论文依据。</p>
                    </div>
                  </div>
                ) : (
                  <div className="collapsed-panel-summary">
                    <strong>{activeLearningFunction.label}先按能力系统来理解。</strong>
                    <p>先理解大块概念，再点具体范式看它对应哪一种学习问题。</p>
                  </div>
                )}
              </>
            ) : activeLearningFunction ? (
              <>
                <div className="function-overview-copy">
                  <p className="eyebrow">当前功能</p>
                  <div className="function-overview-title-row">
                    <h2>{activeLearningFunction.label}</h2>
                    {activeFunctionOverviewLine && <span>{activeFunctionOverviewLine}</span>}
                  </div>
                  <p>
                    {activeFunctionUseCaseSummary
                      ? publicPresentationText(activeFunctionUseCaseSummary.summary)
                      : publicPresentationText(activeLearningFunction.description)}
                  </p>
                  <strong>
                    {activeFunctionUseCaseSummary
                      ? publicPresentationText(activeFunctionUseCaseSummary.networkSummary)
                      : publicPresentationText(activeLearningFunction.contentUse)}
                  </strong>
                </div>
                <div className="function-overview-meta">
                  {activeFunctionUseCaseSummary && (
                    <article>
                      <span>主范式</span>
                      <strong>
                        {paradigms.find((paradigm) => paradigm.id === activeFunctionUseCaseSummary.anchorParadigmId)?.label ??
                          activeFunctionUseCaseSummary.anchorParadigmId}
                      </strong>
                      <small>{activeFunctionUseCaseSummary.consultationCue}</small>
                    </article>
                  )}
                  {activeNarrativeOverlay && (
                    <article>
                      <span>已选演示</span>
                      <strong>{activeNarrativeOverlay.name}</strong>
                      <small>用于解释数学直觉、冲突控制和逻辑建模的切换关系</small>
                    </article>
                  )}
                  {activeParadigm && (
                    <article>
                      <span>已选范式</span>
                      <strong>{activeParadigm.label}</strong>
                      <small>
                        展示 {activeOverlayNodes.length} 个区域关联节点 / {activeOverlayCoverageParcelCount} 个相关分区
                      </small>
                    </article>
                  )}
                </div>
              </>
            ) : (
              <div className="foundation-system-overview">
                <div className="foundation-system-hero">
                  <div>
                    <p className="eyebrow">九项基础脑功能</p>
                    <h2>这就是智力的结构。</h2>
                  </div>
                  <p>
                    九项基础脑功能是智力的组成部分。智力表现不是一个笼统标签，
                    而是多个可观察、可验证、可训练的脑功能共同完成任务。
                    下面这张图把一个认知任务拆成四段，看每项能力从哪里介入、在哪里持续、在哪里退出。
                  </p>
                </div>

                <div className="cognitive-process-system" aria-label="九项脑功能的认知过程">
                  <div className="cognitive-process-map" aria-label="认知任务主流程与能力覆盖">
                    <div className="cognitive-process-map-heading">
                      <span>大脑处理信息的流程</span>
                      <p>一项学习任务会经过信息抓取、理解转换、建模推理和沉淀复用；每项基础能力会在不同环节介入。</p>
                    </div>
                    <div
                      className="cognitive-process-feedback-flow"
                      ref={cognitiveFeedbackLayerRef}
                      aria-label="经验回流影响下一次任务处理"
                    >
                      {cognitiveFeedbackGeometry && (
                        <>
                          <svg
                            aria-hidden="true"
                            className="cognitive-process-feedback-svg"
                            style={{ height: cognitiveFeedbackGeometry.height }}
                            viewBox={`0 0 ${cognitiveFeedbackGeometry.width} ${cognitiveFeedbackGeometry.height}`}
                          >
                            <defs>
                              <marker
                                id="cognitive-feedback-arrow"
                                markerHeight="6"
                                markerWidth="7"
                                orient="auto"
                                refX="3.5"
                                refY="3"
                              >
                                <path d="M 0 0 L 7 3 L 0 6 Z" />
                              </marker>
                            </defs>
                            <path
                              className="feedback-loop-path"
                              d={cognitiveFeedbackGeometry.loopPath}
                              markerEnd="url(#cognitive-feedback-arrow)"
                            />
                            {cognitiveFeedbackGeometry.dropPaths.map((path) => (
                              <path
                                className="feedback-drop-path"
                                d={path}
                                key={path}
                                markerEnd="url(#cognitive-feedback-arrow)"
                              />
                            ))}
                            <circle
                              className="feedback-origin-dot"
                              cx={cognitiveFeedbackGeometry.originX}
                              cy={cognitiveFeedbackGeometry.originY}
                              r="3.8"
                            />
                          </svg>
                          <span
                            style={
                              {
                                "--feedback-label-x": `${cognitiveFeedbackGeometry.labelX}px`,
                                "--feedback-label-y": `${cognitiveFeedbackGeometry.labelY}px`,
                              } as CSSProperties
                            }
                          >
                            沉淀经验会回到下一次看题、理解和建模。
                          </span>
                        </>
                      )}
                    </div>
                    <div className="cognitive-process-flow-board">
                      <div className="cognitive-process-stage-grid" aria-label="认知任务主流程">
                        {FOUNDATION_COGNITIVE_PROCESS_STAGES.map((step, index) => (
                          <article
                            className="cognitive-process-stage"
                            key={step.id}
                            ref={(element) => {
                              cognitiveStageRefs.current[index] = element;
                            }}
                          >
                            <span>{String(index + 1).padStart(2, "0")}</span>
                            <strong>{step.title}</strong>
                            <p>{step.description}</p>
                          </article>
                        ))}
                      </div>
                      <div className="cognitive-process-ability-overlay">
                        <div className="cognitive-ability-lanes cognitive-ability-lanes-above">
                          {cognitiveAbilityRows.above.map((row) => (
                            <div className="cognitive-ability-lane-row" key={row.id}>
                              {row.lanes.map((lane) => {
                                const learningFunction = learningFunctionById.get(lane.functionId);
                                const laneLabel = "label" in lane ? lane.label : undefined;
                                const isActiveGlobalDemoFunction = globalDemoFunctionId === lane.functionId;
                                return (
                                  <button
                                    aria-pressed={isActiveGlobalDemoFunction}
                                    className={[
                                      "cognitive-ability-bar",
                                      "cognitive-ability-button",
                                      isActiveGlobalDemoFunction ? "active" : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                    key={lane.functionId}
                                    onClick={() => selectGlobalDemoFunction(lane.functionId)}
                                    style={
                                      {
                                        "--lane-color": lane.color,
                                        "--lane-end": lane.end,
                                        "--lane-start": lane.start,
                                      } as CSSProperties
                                    }
                                    type="button"
                                  >
                                    <strong>{laneLabel ?? learningFunction?.label ?? lane.functionId}</strong>
                                    <p>{lane.description}</p>
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                        <div className="cognitive-ability-lanes cognitive-ability-lanes-below">
                          {cognitiveAbilityRows.below.map((row) => (
                            <div className="cognitive-ability-lane-row" key={row.id}>
                              {row.lanes.map((lane) => {
                                const learningFunction = learningFunctionById.get(lane.functionId);
                                const laneLabel = "label" in lane ? lane.label : undefined;
                                const isActiveGlobalDemoFunction = globalDemoFunctionId === lane.functionId;
                                return (
                                  <button
                                    aria-pressed={isActiveGlobalDemoFunction}
                                    className={[
                                      "cognitive-ability-bar",
                                      "cognitive-ability-button",
                                      isActiveGlobalDemoFunction ? "active" : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                    key={lane.functionId}
                                    onClick={() => selectGlobalDemoFunction(lane.functionId)}
                                    style={
                                      {
                                        "--lane-color": lane.color,
                                        "--lane-end": lane.end,
                                        "--lane-start": lane.start,
                                      } as CSSProperties
                                    }
                                    type="button"
                                  >
                                    <strong>{laneLabel ?? learningFunction?.label ?? lane.functionId}</strong>
                                    <p>{lane.description}</p>
                                  </button>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="model-evidence-summary">
                  <div className="panel-title-row">
                    <h3>脑模型与证据库</h3>
                    <span>结构摘要</span>
                  </div>
                  <p>
                    这张图不是给孩子贴标签，而是把学习中的模糊问题，放回可观察的脑功能、
                    可验证的研究范式和可训练的练习抓手里。
                  </p>
                  <div className="model-evidence-grid" aria-label="脑模型证据摘要">
                    <article>
                      <span>3D 图形</span>
                      <strong>{atlas.parcels.length} 个皮层点位</strong>
                      <small>Schaefer 200 底图承载功能网络位置。</small>
                    </article>
                    <article>
                      <span>功能与范式</span>
                      <strong>
                        {learningFunctions.length} 项功能 / {paradigms.length} 个范式
                      </strong>
                      <small>每项功能都能继续展开到研究范式和论文依据。</small>
                    </article>
                    <article>
                      <span>证据支持</span>
                      <strong>
                        {evidenceIndex.sources.length} 个来源 / {evidenceIndex.domains.length} 类证据
                      </strong>
                      <small>用于说明脑区、网络和任务机制之间的对应关系。</small>
                    </article>
                    <article>
                      <span>本地全文</span>
                      <strong>
                        {localPaperEvidenceSourceCount} 条研究源 / {localPaperTargetCount} 个阅读目标
                      </strong>
                      <small>支持后续查看论文、选段提问和证据边界说明。</small>
                    </article>
                    <article>
                      <span>图谱层</span>
                      <strong>
                        {regionCoverageRegistry.regions.length} 个脑区条目 / {specializedAtlasRegistry.labels.length} 个专门标签
                      </strong>
                      <small>把大脑区、点位和专门结构分层呈现。</small>
                    </article>
                  </div>
                </div>
              </div>
            )}
          </section>

          {activeLearningFunction && (
          <div className="detail-grid">
            {!isFunctionProductSample && (
            <article className="detail-card manifestation-card">
              <div className="panel-title-row">
                <h3>表现与现象路由</h3>
                <span>
                  {showFunctionLevelManifestation
                    ? "功能表现"
                    : activeDisplayUseCase
                      ? USE_CASE_ROLE_LABELS[activeDisplayUseCase.role]
                      : "待完善"}
                </span>
              </div>
              {showFunctionLevelManifestation && activeFunctionUseCaseSummary ? (
                <>
                  <div className="manifestation-focus function-level-manifestation">
                    <span>功能说明</span>
                    <strong>{activeFunctionUseCaseSummary.title}</strong>
                    <p>{publicPresentationText(activeFunctionUseCaseSummary.summary)}</p>
                  </div>
                  <div className="manifestation-section">
                    <strong>理想学习状态</strong>
                    <p>
                      {activeLearningFunction?.label ?? "这项能力"}理想状态是：任务开始时能进入，关键目标能稳定保持，
                      遇到干扰或复杂条件时能把资源放回真正该处理的信息上。{" "}
                      {publicPresentationText(activeFunctionUseCaseSummary.networkSummary)}
                    </p>
                  </div>
                  <div className="manifestation-section function-sign-summary">
                    <strong>有问题时的常见迹象</strong>
                    <p>{publicPresentationText(activeFunctionUseCaseSummary.consultationCue)}</p>
                    {activeFunctionSigns.length > 0 && (
                      <ul className="function-sign-list">
                        {activeFunctionSigns.map((item) => (
                          <li key={item}>{publicPresentationText(item)}</li>
                        ))}
                      </ul>
                    )}
                    {activeFunctionParentPhrases.length > 0 && (
                      <div className="parent-phrase-list" aria-label="家长常见描述">
                        {activeFunctionParentPhrases.map((phrase) => (
                          <span key={phrase}>{phrase}</span>
                        ))}
                      </div>
                    )}
                    
                  </div>
                  {activeFunctionUseCaseSummary.anchorParadigmId && (
                    <div className="manifestation-section">
                      <strong>主范式</strong>
                      <p>
                        {paradigms.find((paradigm) => paradigm.id === activeFunctionUseCaseSummary.anchorParadigmId)?.label ??
                          activeFunctionUseCaseSummary.anchorParadigmId}
                        ：作为这项功能的主要观察入口，适合先给家长解释整体机制，再拆到具体任务。
                      </p>
                    </div>
                  )}
                </>
              ) : activeDisplayUseCase ? (
                <>
                  <div className="manifestation-focus">
                    <span>{activeParadigm ? "当前范式" : "主范式样板"}</span>
                    <strong>{activeDisplayUseCase.mechanismTitle}</strong>
                    <p>{publicPresentationText(activeDisplayUseCase.featureDescription)}</p>
                  </div>
                  <div className="manifestation-section">
                    <strong>通性表现</strong>
                    <p>{publicPresentationText(activeDisplayUseCase.commonPresentation)}</p>
                  </div>
                  <div className="manifestation-two-column">
                    <section>
                      <strong>日常迹象</strong>
                      <ul>
                        {activeDisplayUseCase.dailyPresentations.map((item) => (
                          <li key={item}>{publicPresentationText(item)}</li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <strong>学科表现</strong>
                      <ul>
                        {activeDisplayUseCase.academicPresentations.map((item) => (
                          <li key={item}>{publicPresentationText(item)}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                  <div className="parent-phrase-list" aria-label="家长常见描述">
                    {activeDisplayUseCase.parentPhrases.map((phrase) => (
                      <span key={phrase}>{phrase}</span>
                    ))}
                  </div>
                  <div className="clarifying-question-list" aria-label="建议追问">
                    <strong>建议追问</strong>
                    {activeDisplayUseCase.clarifyingQuestions.map((question) => (
                      <p key={question}>{publicPresentationText(question)}</p>
                    ))}
                  </div>
                </>
              ) : (
                <p className="detail-muted">
                  这项功能的日常表现说明正在补齐。可以先查看右侧范式说明和脑图。
                </p>
              )}

              <section className="phenomenon-router" aria-label="现象分析">
                <div className="panel-title-row">
                  <h3>现象分析</h3>
                  <span>输入描述</span>
                </div>
                <textarea
                  aria-label="输入家长描述"
                  onChange={(event) => setPhenomenonQuery(event.currentTarget.value)}
                  placeholder="输入家长描述，例如：刚讲完就忘，做题做到一半忘了前面条件，口算中间数总丢。"
                  value={phenomenonQuery}
                />
                {phenomenonQuery.trim() ? (
                  <div className="phenomenon-match-list">
                    {phenomenonMatches.length > 0 ? (
                      phenomenonMatches.map(({ score, useCase }) => {
                        const matchParadigm = paradigms.find((paradigm) => paradigm.id === useCase.paradigmId);
                        const matchFunction = learningFunctions.find((learningFunction) => learningFunction.id === useCase.functionId);
                        return (
                          <button
                            className="phenomenon-match-card"
                            key={useCase.id}
                            onClick={() => openUseCase(useCase)}
                            type="button"
                          >
                            <span>{matchFunction?.label ?? useCase.functionId}</span>
                            <strong>{matchParadigm?.label ?? useCase.paradigmId}</strong>
                            <small>
                              {USE_CASE_ROLE_LABELS[useCase.role]} · 匹配 {score}
                            </small>
                            <p>{publicPresentationText(useCase.commonPresentation)}</p>
                          </button>
                        );
                      })
                    ) : (
                      <p className="detail-muted">暂时没有命中。可以换成更接近家长原话的描述。</p>
                    )}
                  </div>
                ) : (
                  <p className="detail-muted">输入家长原话后，这里会提示可能相关的功能和范式。</p>
                )}
              </section>
            </article>
            )}

            <article className="detail-card evidence-card" ref={paradigmDetailCardRef}>
              {isFunctionProductSample ? (
                !isCalculationQuantityTriplet && (
                  <button
                    className="panel-toggle-heading"
                    onClick={() => setActiveExplanationPanel("paradigm")}
                    type="button"
                  >
                    <span>{activeParadigm ? activeParadigm.label : "选择一个范式"}</span>
                    <strong>
                      {functionParadigmExpanded
                        ? "正在展开"
                        : activeParadigm
                          ? "点击展开"
                          : "先从左侧选择"}
                    </strong>
                  </button>
                )
              ) : (
                <div className="panel-title-row">
                  <h3>{evidencePanelTitle}</h3>
                  <span>{evidencePanelBadge}</span>
                </div>
              )}
              {isFunctionProductSample && !functionParadigmExpanded && !isCalculationQuantityTriplet ? (
                <div className="collapsed-panel-summary">
                  <strong>{activeParadigm?.label ?? `选择一个${activeLearningFunction?.label ?? ""}范式`}</strong>
                  <p>
                    {activeParadigm
                      ? "展开后查看这个范式对应的功能问题、典型表现，以及它背后的脑图机制。"
                      : `左侧选择 ${activeFunctionParadigms
                          .slice(0, 4)
                          .map((paradigm) => paradigm.label)
                          .join("、")} 等范式后，这里会显示具体解释。`}
                  </p>
                </div>
              ) : (
                <>
              {isCalculationQuantityTriplet ? (
                <section className="quantity-triplet-detail" aria-label={quantityUnderstandingTriplet.label}>
                  {activeQuantityTripletStage && (
                    <section
                      aria-label={activeQuantityTripletStage.label}
                      className="quantity-triplet-stage-panel"
                      id={`quantity-triplet-panel-${activeQuantityTripletStage.id}`}
                      role="tabpanel"
                    >
                      <header>
                        <span>第 {activeQuantityTripletStage.order} 关</span>
                        <h4>{activeQuantityTripletStage.label}</h4>
                        <p>{activeQuantityTripletStage.prompt}</p>
                      </header>

                      <div className="quantity-triplet-observations">
                        <strong>这一关主要看什么</strong>
                        <ul>
                          {activeQuantityTripletStage.measureLabels.map((measure) => (
                            <li key={measure}>{measure}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="quantity-triplet-paradigm-section">
                        <div>
                          <strong>对应的研究范式</strong>
                          <span>{activeQuantityTripletStage.formalParadigmIds.length} 个</span>
                        </div>
                        <p>点进具体范式后，可以继续看研究故事、脑图、论文依据和来源论文。</p>
                        <div className="quantity-triplet-paradigms" aria-label={`${activeQuantityTripletStage.label}正式范式`}>
                          {activeQuantityTripletStage.formalParadigmIds.map((paradigmId, paradigmIndex) => {
                            const paradigm = paradigms.find((item) => item.id === paradigmId);
                            return paradigm ? (
                              <button
                                key={paradigm.id}
                                onClick={() => selectQuantityTripletParadigm(paradigm, activeQuantityTripletStage.id)}
                                type="button"
                              >
                                <span>研究范式 {paradigmIndex + 1}</span>
                                <strong>{paradigm.label}</strong>
                                <small>{publicPresentationText(getParadigmMenuSummary(paradigm))}</small>
                              </button>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </section>
                  )}

                  <div className="quantity-triplet-conclusion">
                    <strong>三关怎么一起读</strong>
                    <p>{quantityUnderstandingTriplet.storyConclusion}</p>
                  </div>

                  <details className="evidence-story-disclosure quantity-triplet-evidence">
                    <summary>
                      <span>研究依据与使用边界</span>
                      <small>{quantityTripletEvidenceSourceReaders.length} 项本地来源</small>
                    </summary>
                    <section className="evidence-upgrade-panel" aria-label="数量理解三联任务研究来源">
                      <div className="evidence-public-brief">
                        <article>
                          <strong>结构来源</strong>
                          <p>已有平板数量筛查研究把点阵计数、符号比较和心理数轴放进同一电池；本项目只借用任务结构，不借用诊断阈值。</p>
                        </article>
                        <article>
                          <strong>训练锚点</strong>
                          <p>儿童四周数感训练直接练习点阵与数字的数量对应，并在训练前后测量行为和 fMRI；它只支撑第二关和相关近任务改变。</p>
                        </article>
                      </div>
                      <div className="upgrade-source-list">
                        {quantityTripletEvidenceSourceReaders.map(({ readerSource, source, target }) => (
                          <button
                            className="upgrade-source-item"
                            disabled={!target}
                            key={source.id}
                            onClick={() => target && setActivePaperReader({ source: readerSource, target })}
                            type="button"
                          >
                            <div className="upgrade-source-title-row">
                              <strong>{readerSource.title}</strong>
                              <small>{readerSource.materialState ?? "本地来源"}</small>
                            </div>
                            <div className="upgrade-source-meta">
                              <span>{readerSource.year ?? "来源"}</span>
                              <span>{supportScopeLabel(readerSource.supportScope) ?? "任务结构"}</span>
                            </div>
                            <p>{publicPresentationText(readerSource.supports ?? source.useFor)}</p>
                          </button>
                        ))}
                      </div>
                      <p className="candidate-source-note">
                        三关分别保留自己的指标和证据边界，不合成诊断总分，也不从综合图新增生产级 3D 点位。
                      </p>
                    </section>
                  </details>
                  {activePaperReader && (
                    <LocalPaperReaderDrawer
                      selection={activePaperReader}
                      supportLabel={supportScopeLabel(activePaperReader.source.supportScope)}
                      onClose={() => setActivePaperReader(null)}
                      onSelectTarget={(target) =>
                        setActivePaperReader((current) =>
                          current ? { ...current, target } : current,
                        )
                      }
                    />
                  )}
                </section>
              ) : isFunctionProductSample && !activeParadigm ? (
                <div className="empty-paradigm-panel">
                  <strong>先选一个范式</strong>
                  <p>
                    先理解{activeLearningFunction?.label ?? "这项能力"}这套系统，再进入
                    {activeFunctionParadigms.slice(0, 4).map((paradigm) => paradigm.label).join("、")}。
                    这里会显示对应的图、功能表现和研究故事。
                  </p>
                </div>
              ) : activeNarrativeOverlay ? (
                <>
                  <p>{publicPresentationText(activeNarrativeOverlay.description)}</p>
                  <p>{publicPresentationText(activeOverlayPrompt)}</p>
                  <div className="function-network-list">
                    {Array.from(semanticNetworkIds).map((networkId) => {
                      const network = networkById[networkId];
                      return (
                        <span key={networkId}>
                          <span className="inline-swatch" style={{ backgroundColor: network?.color }} />
                          {network?.label ?? networkId}
                        </span>
                      );
                    })}
                  </div>
                  <section className="evidence-upgrade-panel narrative-source-panel" aria-label="演示证据入口">
                    <div className="candidate-source-heading">
                      <strong>证据入口</strong>
                      <span>演示组合</span>
                    </div>
                    <p className="candidate-source-note">
                      这张图把计算直觉、冲突控制和逻辑建模组合成一条讲解路径；它适合做课堂演示，不把它说成应用题唯一专属脑区图。
                    </p>
                    <div className="upgrade-meta-row">
                      {activeNarrativeOverlay.sourceIds.map((sourceId) => {
                        const source = evidenceIndex.sources.find((item) => item.id === sourceId);
                        return <span key={sourceId}>{source?.year ?? "来源"} · {source?.title.split(":")[0] ?? sourceId}</span>;
                      })}
                    </div>
                    <div className="evidence-review-contract">
                      <article>
                        <strong>讲法核心</strong>
                        <p>
                          数学直觉可以很快，但遇到限定词和逻辑关系时，需要冲突控制网络把冲动答案刹住，再让额顶规则系统接管。
                        </p>
                      </article>
                      <article>
                        <strong>当前限制</strong>
                        <p>
                          这版先用于解释“为什么要先刹住冲动答案”；更精确的应用题专门证据还在继续补。
                        </p>
                      </article>
                    </div>
                  </section>
                </>
              ) : activeParadigm ? (
                <>
                  {activeParadigmStoryFigure ? (
                    <section className="paradigm-story-package" aria-label={`${activeParadigmStoryFigure.title} 全文故事`}>
                      <figure className="paradigm-story-figure">
                        {activeParadigmStoryFigure.imageSrc ? (
                          <img alt={activeParadigmStoryFigure.alt} src={siteUrl(activeParadigmStoryFigure.imageSrc)} />
                        ) : (
                          <div className="paradigm-story-image-placeholder" role="img" aria-label={activeParadigmStoryFigure.alt}>
                            <span>当前版本未附配图</span>
                            <p>{activeParadigmStoryFigure.caption}</p>
                          </div>
                        )}
                        <figcaption>
                          <span>{activeParadigmStoryFigure.title}</span>
                          <strong>{activeParadigmStoryFigure.subtitle}</strong>
                          <small>{activeParadigmStoryFigure.caption}</small>
                        </figcaption>
                      </figure>
                      <div className="paradigm-story-fulltext">
                        {activeParadigmStoryFigure.sections.map((section) => (
                          <Fragment key={section.title}>
                            <section className="paradigm-story-section">
                              <h4>{section.title}</h4>
                              {section.paragraphs.map((paragraph) => (
                                <p key={paragraph}>{paragraph}</p>
                              ))}
                            </section>
                            
                          </Fragment>
                        ))}
                      </div>
                    </section>
                  ) : (
                    <>
                      <p>{publicPresentationText(activeParadigm.description)}</p>
                      <p>{publicPresentationText(activeParadigm.contentUse)}</p>
                      
                    </>
                  )}
                  {activeEvidenceUpgrade && (
                    <details className="evidence-story-disclosure">
                      <summary>
                        <span>研究依据与证据边界</span>
                        <small>
                          {activeEvidenceSourceReaders.length} 项研究
                          {activeTrainingCoverageCopy ? ` · ${activeTrainingCoverageCopy.label}` : ""}
                        </small>
                      </summary>
                      <section className="evidence-upgrade-panel" aria-label="讲解口径与参考文献">
                      <div className="candidate-source-heading">
                        <strong>研究来源</strong>
                        <span>{activeEvidenceSourceReaders.length} 项</span>
                      </div>
                      <p className="candidate-source-note">
                        随附全文可在页面内阅读；其他研究保留原始来源入口。是否随附文件由再分发依据决定，不代表研究质量。
                      </p>
                      <div className="upgrade-meta-row">
                        
                      </div>
                      {activeEvidenceReview && (
                        <div className="evidence-public-brief" aria-label="当前范式讲解口径">
                          <article>
                            <strong>脑区映射</strong>
                            <p>{publicPresentationText(activeEvidenceReview.mappingSummary)}</p>
                          </article>
                        </div>
                      )}
                      {activeTrainingCoverage && activeTrainingCoverageCopy && (
                        <section
                          className={`training-evidence-compact tone-${activeTrainingCoverageCopy.tone}`}
                          aria-label="训练证据"
                        >
                          <div className="training-evidence-head">
                            <div>
                              <strong>训练证据</strong>
                              <p>这块只说明研究和训练设计的关系，不等于产品疗效或孩子个体判断。</p>
                            </div>
                            <span>{activeTrainingCoverageCopy.label}</span>
                          </div>
                          <div className="training-evidence-grid">
                            <article className="training-evidence-card training-evidence-relation">
                              <span>证据关系</span>
                              <strong>{activeTrainingCoverageCopy.label}</strong>
                              <p>{activeTrainingCoverageCopy.relation(activeTrainingCoverage)}</p>
                              {(activeTrainingCoverage.coverageStatus === "near_component" ||
                                activeTrainingCoverage.coverageStatus === "broad_plasticity") && (
                                <p className="training-evidence-boundary-note">同屏提醒：这不是本范式直接训练。</p>
                              )}
                              {activeTrainingFitLabels.length > 0 && (
                                <div className="training-evidence-fit-row">
                                  {activeTrainingFitLabels.map((label) => (
                                    <small key={label}>{label}</small>
                                  ))}
                                </div>
                              )}
                            </article>
                            <article className="training-evidence-card">
                              <span>研究条件</span>
                              {activeTrainingPrimaryRows.length > 0 ? (
                                activeTrainingPrimaryRows.map((row) => (
                                  <div className="training-evidence-source-line" key={`condition-${row.evidence.sourceId}`}>
                                    {renderTrainingEvidenceSourceLink(row)}
                                    <p>{publicPresentationText(row.evidence.note)}</p>
                                  </div>
                                ))
                              ) : (
                                <p>{publicPresentationText(activeTrainingCoverage.policyRationale)}</p>
                              )}
                            </article>
                            <article className="training-evidence-card">
                              <span>观察到的改变</span>
                              {activeTrainingPrimaryRows.length > 0 ? (
                                activeTrainingPrimaryRows.map((row) => (
                                  <p key={`change-${row.evidence.sourceId}`}>
                                    <strong>{trainingEvidenceSourceLabel(row)}</strong>
                                    {publicPresentationText(
                                      row.resolvedSource?.readerSource.supports ??
                                        row.resolvedSource?.source.useFor ??
                                        row.evidence.note,
                                    )}
                                  </p>
                                ))
                              ) : (
                                <p>当前没有可展示的本地正向训练来源。</p>
                              )}
                            </article>
                            <article className="training-evidence-card">
                              <span>迁移边界</span>
                              {activeTrainingBoundaryDisplayRows.length > 0 ? (
                                activeTrainingBoundaryDisplayRows.map((row) => (
                                  <p key={`boundary-${row.evidence.sourceId}`}>
                                    <strong>{trainingEvidenceSourceLabel(row)}</strong>
                                    {publicPresentationText(row.resolvedSource?.readerSource.boundary ?? row.evidence.note)}
                                  </p>
                                ))
                              ) : (
                                <p>{publicPresentationText(activeTrainingCoverage.policyRationale)}</p>
                              )}
                              <p className="training-evidence-floor">
                                不把训练内进步自动外推到学业成绩、诊断结论或儿童个体训练效果。
                              </p>
                            </article>
                          </div>
                        </section>
                      )}
                      <div className="upgrade-source-list">
                        {activeEvidenceSourceReaders.map((resolvedSource) => {
                          const { source, readerSource, target, externalHref } = resolvedSource;
                          const supportLabel = supportScopeLabel(readerSource.supportScope);
                          const sourceBody = (
                            <>
                              <div className="upgrade-source-title-row">
                                <strong>{readerSource.title}</strong>
                                <small>{readerSource.materialState ?? "来源"}</small>
                              </div>
                              <div className="upgrade-source-meta">
                                {[
                                  readerSource.year,
                                  SOURCE_KIND_LABELS[readerSource.sourceType ?? ""] ??
                                    readerSource.sourceType ??
                                    SOURCE_KIND_LABELS[source.kind] ??
                                    source.kind,
                                  supportLabel,
                                ]
                                  .filter(Boolean)
                                  .map((item) => (
                                    <span key={String(item)}>{item}</span>
                                  ))}
                              </div>
                              <p>{publicPresentationText(readerSource.supports ?? source.useFor)}</p>
                            </>
                          );

                          return target ? (
                            <button
                              className="upgrade-source-item"
                              key={source.id}
                              onClick={() => setActivePaperReader({ source: readerSource, target })}
                              type="button"
                            >
                              {sourceBody}
                            </button>
                          ) : externalHref ? (
                            <a className="upgrade-source-item" href={externalHref} key={source.id} rel="noreferrer" target="_blank">
                              {sourceBody}
                            </a>
                          ) : (
                            <article className="upgrade-source-item" key={source.id}>{sourceBody}</article>
                          );
                        })}
                      </div>
                      </section>
                    </details>
                  )}
                  {activePaperReader && (
                    <LocalPaperReaderDrawer
                      selection={activePaperReader}
                      supportLabel={supportScopeLabel(activePaperReader.source.supportScope)}
                      onClose={() => setActivePaperReader(null)}
                      onSelectTarget={(target) =>
                        setActivePaperReader((current) =>
                          current ? { ...current, target } : current,
                        )
                      }
                    />
                  )}
                  {activeMtlMemoryRoute && (
                    <details className="evidence-story-disclosure">
                      <summary>
                        <span>专门图谱边界</span>
                        <small>{MTL_ROUTE_STATUS_LABELS[activeMtlMemoryRoute.status]}</small>
                      </summary>
                      <section className="specialized-atlas-panel mtl-route-panel" aria-label="MTL 与海马结构边界">
                      <div className="panel-title-row">
                        <h3>MTL / 海马边界</h3>
                        <span>{MTL_ROUTE_STATUS_LABELS[activeMtlMemoryRoute.status]}</span>
                      </div>
                      <p className="candidate-source-note">
                        {publicPresentationText(activeMtlMemoryRoute.displayIntent)}
                      </p>
                      <div className="specialized-atlas-list">
                        <article className="specialized-atlas-item reviewed">
                          <div>
                            <strong>主要结构</strong>
                            <small>{activeMtlPrimaryLabels.length} 个标签</small>
                          </div>
                          <p>{activeMtlPrimaryLabels.join(" / ")}</p>
                        </article>
                        {activeMtlReviewLabels.length > 0 && (
                          <article className="specialized-atlas-item boundary">
                            <div>
                              <strong>复核边界</strong>
                              <small>{activeMtlReviewLabels.length} 个标签</small>
                            </div>
                            <p>{activeMtlReviewLabels.join(" / ")}</p>
                          </article>
                        )}
                      </div>
                      <div className="evidence-public-brief" aria-label="MTL 讲解边界">
                        <article>
                          <strong>可以这样讲</strong>
                          <p>{publicPresentationText(activeMtlMemoryRoute.safeTalkTrack)}</p>
                        </article>
                        <article>
                          <strong>不要这样讲</strong>
                          <p>{publicPresentationText(activeMtlMemoryRoute.blockedClaims[0])}</p>
                        </article>
                        <article>
                          <strong>精细边界</strong>
                          <p>{publicPresentationText(activeMtlMemoryRoute.nextRefinementGate)}</p>
                        </article>
                      </div>
                      </section>
                    </details>
                  )}
                </>
              ) : activeLearningFunction ? (
                <>
                  {activeFunctionSynthesis && (
                    <section className="evidence-upgrade-panel function-synthesis-panel" aria-label="功能综合核验">
                      <div className="candidate-source-heading">
                        <strong>研究故事</strong>
                        <span>{activeFunctionSynthesis.status === "reviewed_network" ? "讲解已核" : "参考讲解"}</span>
                      </div>
                      <p>{publicPresentationText(activeFunctionSynthesis.summary)}</p>
                      <p>{publicPresentationText(activeFunctionSynthesis.salesNarrative)}</p>
                      <details className="evidence-story-disclosure">
                        <summary>
                          <span>展开深层机制和证据边界</span>
                          <small>
                            {activeFunctionSynthesis.presentationStages?.length
                              ? `${activeFunctionSynthesis.presentationStages.length} 步路径`
                              : "深层说明"}
                          </small>
                        </summary>
                        <p>{publicPresentationText(activeFunctionSynthesis.mechanismSummary)}</p>
                        <div className="evidence-review-contract">
                          <article>
                            <strong>可讲机制</strong>
                            <p>{publicPresentationText(activeFunctionSynthesis.salesNarrative)}</p>
                          </article>
                          <article>
                            <strong>边界</strong>
                            <p>{publicPresentationText(activeFunctionSynthesis.avoidClaims[0])}</p>
                          </article>
                        </div>
                        {activeFunctionSynthesis.presentationStages?.length ? (
                          <div className="function-presentation-flow" aria-label="演示路径">
                            <div className="panel-title-row">
                              <h3>演示路径</h3>
                              <span>{activeFunctionSynthesis.presentationStages.length} 步</span>
                            </div>
                            {activeFunctionSynthesis.presentationStages.map((stage) => (
                              <article className="presentation-stage-card" key={stage.id}>
                                <strong>{stage.title}</strong>
                                <p>{publicPresentationText(stage.summary)}</p>
                                <small>{publicPresentationText(stage.speakerCue)}</small>
                              </article>
                            ))}
                          </div>
                        ) : null}
                        <div className="function-synthesis-region-list" aria-label="重合点位">
                          {activeFunctionSynthesis.convergenceRegions.map((region) => {
                            const network = networkById[region.networkId];
                            return (
                              <article className="function-synthesis-region" key={region.id}>
                                <div>
                                  <span className="inline-swatch" style={{ backgroundColor: network?.color }} />
                                  <strong>{region.label}</strong>
                                  <small>{region.overlapParadigmIds.length} 个范式重合</small>
                                </div>
                                <p>{publicPresentationText(region.interpretation)}</p>
                              </article>
                            );
                          })}
                        </div>
                      </details>
                    </section>
                  )}
                  <p>{publicPresentationText(activeLearningFunction.networkMappingNote)}</p>
                  <div className="function-network-list">
                    {activeLearningFunction.candidateNetworks.map((networkId) => {
                      const network = networkById[networkId];
                      return (
                        <span key={networkId}>
                          <span className="inline-swatch" style={{ backgroundColor: network?.color }} />
                          {network?.label ?? networkId}
                        </span>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p>网络筛选会直接聚焦 Yeo 底层分类，不代表某项训练功能的完整解释。</p>
              )}
              {(!isFunctionProductSample || activeParadigm) && (
              <details className="evidence-story-disclosure atlas-technical-disclosure">
                <summary>
                  <span>点位与图谱明细</span>
                  <small>{activeNamedParcels.length + activeRegionCoverage.length} 项</small>
                </summary>
              <section className="named-region-panel" aria-label="命名点位">
                <div className="panel-title-row">
                  <h3>命名点位</h3>
                  <span>{activeNamedParcels.length}</span>
                </div>
                <div className="named-region-list">
                  {activeNamedParcels.length === 0 && (
                    <p className="detail-muted">该范式还没有录入可定位的点位。</p>
                  )}
                  {activeNamedParcels.slice(0, MAX_NAMED_REGION_ITEMS).map((parcel) => {
                    const identity = parcelIdentityById.get(parcel.id);
                    const network = networkById[parcel.network];
                    return (
                      <button
                        className={[
                          "named-region-item",
                          selectedParcel && parcel.id === selectedParcel.id ? "active" : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        key={parcel.id}
                        onClick={() => selectParcel(parcel)}
                        type="button"
                      >
                        <span className="named-region-main">
                          <strong>{getParcelCompactDisplayName(identity, parcel)}</strong>
                          <small>
                            点位编号 {parcel.roi}
                          </small>
                        </span>
                        <span className="named-region-meta">
                          <span className="inline-swatch" style={{ backgroundColor: network?.color }} />
                          {getParcelRegionStatus(identity)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {activeNamedParcels.length > MAX_NAMED_REGION_ITEMS && (
                  <p className="detail-muted">
                    先显示前 {MAX_NAMED_REGION_ITEMS} 个点位；用点位搜索可以按 ROI、脑区名或网络名继续定位。
                  </p>
                )}
              </section>
              {activeRegionCoverage.length > 0 && (
                <section className="region-coverage-panel" aria-label="Atlas region coverage">
                  <div className="panel-title-row">
                  <h3>图谱覆盖</h3>
                    <span>{activeRegionCoverage.length}</span>
                  </div>
                  <div className="coverage-summary-row">
                    {(Object.keys(COVERAGE_LABELS) as RegionCoverageStatus[])
                      .filter((status) => activeCoverageCounts[status])
                      .map((status) => (
                        <span className={`coverage-pill ${status}`} key={status}>
                          {COVERAGE_LABELS[status]} {activeCoverageCounts[status]}
                        </span>
                      ))}
                  </div>
                  <div className="region-coverage-list">
                    {activeRegionCoverage.slice(0, 6).map((region) => (
                      <article className={`region-coverage-item ${region.coverageStatus}`} key={region.id}>
                        <div className="region-coverage-heading">
                          <strong>{region.label}</strong>
                          <span>{COVERAGE_LABELS[region.coverageStatus]}</span>
                        </div>
                        <small>{region.englishLabel}</small>
                        <p>{publicPresentationText(region.explanation)}</p>
                        <p className="coverage-caution">{publicPresentationText(region.caution)}</p>
                        <div className="coverage-chip-row">
                          {region.candidateNetworks.map((networkId) => {
                            const network = networkById[networkId];
                            return (
                              <span key={networkId}>
                                <span className="inline-swatch" style={{ backgroundColor: network?.color }} />
                                {network?.label ?? networkId}
                              </span>
                            );
                          })}
                          {region.candidateParcelIds.length > 0 && (
                            <span>{region.candidateParcelIds.length} 个定位点位</span>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {(activeSpecializedStructures.length > 0 ||
                activeSpecializedLookupGroups.length > 0 ||
                activeFreeSurferMarkerCandidates.length > 0) && (
                <section className="specialized-atlas-panel" aria-label="专门图谱状态">
                  <div className="panel-title-row">
                    <h3>专门图谱</h3>
                    <span>
                      {activeFreeSurferMarkerCandidates.length > 0
                        ? `${activeFreeSurferMarkerCandidates.length} 个精细结构`
                        : activeSpecializedLookupGroups.length > 0
                          ? `${activeSpecializedLookupGroups.length} 个结构命中`
                          : "边界层"}
                    </span>
                  </div>
                  <div className="specialized-atlas-list">
                    {activeSpecializedLookupGroups.length > 0 &&
                      activeSpecializedLookupGroups.map((group) => (
                        <article className="specialized-atlas-item reviewed" key={group.id}>
                          <div>
                            <strong>{group.label}</strong>
                            <small>
                              {group.sourceIds.length} 个研究来源
                            </small>
                          </div>
                          <p>
                            来源报告：
                            {group.reportedRegions.slice(0, 4).join(" / ")}
                            {group.reportedRegions.length > 4 ? " 等" : ""}
                          </p>
                          <small>{publicPresentationText(group.reviewNotes[0] ?? group.caution)}</small>
                        </article>
                      ))}
                    {activeFreeSurferMarkerCandidates.map((candidate) => (
                      <article className="specialized-atlas-item boundary" key={candidate.markerId}>
                        <div>
                          <strong>{candidate.userFacingLabel}</strong>
                          <small>{FREESURFER_MARKER_ROLE_LABELS[candidate.role] ?? "FreeSurfer marker 候选"}</small>
                        </div>
                        <p>
                          {candidate.atlasLabel}
                        </p>
                        <small>
                          {FREESURFER_MARKER_GATE_LABELS[candidate.sourceReviewGate] ?? candidate.sourceReviewGate}
                          ：{publicPresentationText(candidate.markerNote)}
                        </small>
                      </article>
                    ))}
                    {activeSpecializedLookupGroups.length === 0 &&
                      activeFreeSurferMarkerCandidates.length === 0 &&
                      activeSpecializedStructures.map((region) => (
                        <article className="specialized-atlas-item boundary" key={region.id}>
                          <div>
                            <strong>{region.label}</strong>
                            <small>{COVERAGE_LABELS[region.coverageStatus]}</small>
                          </div>
                          <p>{publicPresentationText(region.explanation)}</p>
                          <small>{publicPresentationText(region.caution)}</small>
                        </article>
                      ))}
                  </div>
                </section>
              )}
              </details>
              )}
                </>
              )}
            </article>
          </div>
          )}

          {!isFunctionProductSample && activeLearningFunction && (
          <>
          <details className="detail-disclosure">
            <summary>
              <span>{activeOverlayTitle}</span>
              <small>{activeOverlayDetailLabel}</small>
            </summary>
            <div className="detail-disclosure-body">
              {activeOverlayNodes.length > 0 ? (
                <>
                  <p className="overlay-prompt">{publicPresentationText(activeOverlayPrompt)}</p>
                  <p className="detail-muted">
                    当前 3D 显示区域关联示意：{activeOverlayNodes.length} 个节点、{activeOverlayCoverageParcelCount} 个相关分区；不表示论文原始峰值。
                  </p>
                  <div className="overlay-grid compact-overlay-grid">
                    <section className="overlay-section" aria-label="连接节点">
                      <div className="panel-title-row">
                        <h3>节点</h3>
                        <span>{activeOverlayNodes.length}</span>
                      </div>
                      <div className="overlay-node-list">
                        {activeOverlayNodes.map((node) => (
                          <article className="overlay-node-item" key={node.id}>
                            <div>
                              <span
                                className="inline-swatch"
                                style={{ backgroundColor: networkById[node.networkId]?.color }}
                              />
                              <strong>{node.label}</strong>
                            </div>
                            <small>
                              {networkById[node.networkId]?.label ?? node.networkId} ·{" "}
                              {NODE_ROLE_LABELS[node.role] ?? node.role}
                            </small>
                            <p>{publicPresentationText(node.caption)}</p>
                            <small>{spatialNodeNote(node.id)}</small>
                            <a href={siteUrl(`/docs/coordinate-evidence.html?node=${encodeURIComponent(node.id)}`)} target="_blank" rel="noreferrer">查看此节点的坐标依据</a>
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="overlay-section" aria-label="连接关系">
                      <div className="panel-title-row">
                        <h3>关系</h3>
                        <span>{activeOverlayEdges.length}</span>
                      </div>
                      <div className="overlay-edge-list">
                        {activeOverlayEdges.map((edge) => {
                          const sourceNode = overlayNodeById.get(edge.sourceNodeId);
                          const targetNode = overlayNodeById.get(edge.targetNodeId);
                          return (
                            <article className="overlay-edge-item" key={edge.id}>
                              <strong>
                                {sourceNode?.label ?? "未知"} 到 {targetNode?.label ?? "未知"}
                              </strong>
                              <small>{RELATION_LABELS[edge.relation]}</small>
                              <p>{publicPresentationText(edge.caption)}</p>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  </div>
                </>
              ) : (
                <p className="detail-muted">{activeOverlayEmptyText}</p>
              )}
            </div>
          </details>



          <details className="detail-disclosure" open>
            <summary>
              <span>当前点位</span>
              <small>
                {selectedParcel
                  ? getParcelCompactDisplayName(selectedParcelIdentity, selectedParcel)
                  : selectedPhysicalStructure?.label ?? "未选择"}
              </small>
            </summary>
            {selectedParcel ? (
              <ParcelInfoPanel
                domainMatches={selectedDomainMatches}
                identity={selectedParcelIdentity}
                network={networkById[selectedParcel.network]}
                networkById={networkById}
                parcel={selectedParcel}
              />
            ) : selectedPhysicalStructure ? (
              <PhysicalStructureInfoPanel selection={selectedPhysicalStructure} />
            ) : (
              <p className="detail-muted">点击脑图中的具体点位后，这里才显示该位置的一句话说明和证据边界。</p>
            )}
          </details>
          </>
          )}
        </section>
      </section>


    </main>
  );
}
