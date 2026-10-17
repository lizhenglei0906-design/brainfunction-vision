import type { Yeo7Network } from "./brainAtlas";
import type { ConnectionOverlayRelation } from "./connectionOverlay";
import type { TaskOverlayNodeRole } from "./taskOverlay";

export type CognitiveFactorId =
  | "reasoning"
  | "memory_verbal"
  | "updating"
  | "memory_spatial"
  | "judgment_speed"
  | "divided_attention"
  | "inhibition"
  | "short_term_capacity"
  | "shifting";

export type ParadigmEvidenceStatus = "heatmap_seed" | "network_prior" | "review_needed";
export type ParadigmOverlayDisplayLayer = "default" | "support" | "boundary";

export interface ParadigmOverlayNode {
  id: string;
  label: string;
  role: TaskOverlayNodeRole | "context" | "modulator";
  networkId: Yeo7Network;
  regionCoverageId?: string;
  physicalStructureId?: string;
  specializedAtlasLabelIds?: string[];
  displayParcelId?: string;
  candidateParcelIds?: string[];
  weight: number;
  caption: string;
  displayLayer?: ParadigmOverlayDisplayLayer;
  accentColor?: string;
}

export interface ParadigmOverlayEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: ConnectionOverlayRelation;
  weight: number;
  caption: string;
  accentColor?: string;
}

export interface CognitiveParadigm {
  id: string;
  label: string;
  englishLabel: string;
  primaryFunctionId: string;
  functionIds: string[];
  factorIds: CognitiveFactorId[];
  heatmapVariables: string[];
  description: string;
  contentUse: string;
  candidateNetworks: Yeo7Network[];
  evidenceStatus: ParadigmEvidenceStatus;
  evidenceNote: string;
  overlay: {
    nodes: ParadigmOverlayNode[];
    edges: ParadigmOverlayEdge[];
  };
}

export interface ParadigmLibrary {
  id: string;
  name: string;
  version: string;
  status: "seed";
  sourceNote: string;
  paradigms: CognitiveParadigm[];
}

export type ParadigmImportanceTier = "core" | "supporting" | "related" | "context";

export interface FunctionParadigmImportanceItem {
  paradigmId: string;
  rank: number;
  tier: ParadigmImportanceTier;
  rationale: string;
}

export interface FunctionParadigmImportanceEntry {
  functionId: string;
  paradigms: FunctionParadigmImportanceItem[];
}

export interface FunctionParadigmImportanceRegistry {
  id: string;
  version: string;
  status: "seed";
  updated: string;
  rankingPolicy: string[];
  functions: FunctionParadigmImportanceEntry[];
}
