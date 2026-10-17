import type { Yeo7Network } from "./brainAtlas";
import type { ParadigmOverlayEdge, ParadigmOverlayNode } from "./paradigmLibrary";

export type FunctionSynthesisStatus = "draft" | "candidate_network" | "reviewed_network";

export type FunctionParadigmRole = "core" | "supporting" | "boundary";

export type FunctionSourceSupportRole =
  | "task_identity"
  | "task_fmri"
  | "meta_review"
  | "behavioral_boundary"
  | "coordinate_boundary";

export type FunctionConvergenceConsistency = "high" | "medium" | "low" | "atlas_boundary";

export interface FunctionParadigmUse {
  paradigmId: string;
  role: FunctionParadigmRole;
  evidenceWeight: number;
  synthesisRole: string;
}

export interface FunctionSourceUse {
  sourceId: string;
  supportRole: FunctionSourceSupportRole;
  paradigmIds: string[];
  note: string;
}

export interface FunctionConvergenceRegion {
  id: string;
  label: string;
  networkId: Yeo7Network;
  regionCoverageId?: string;
  displayParcelId: string;
  candidateParcelIds: string[];
  overlapParadigmIds: string[];
  supportSourceIds: string[];
  consistency: FunctionConvergenceConsistency;
  interpretation: string;
  caution: string;
}

export interface FunctionPresentationStage {
  id: string;
  title: string;
  summary: string;
  nodeIds: string[];
  speakerCue: string;
}

export interface FunctionSynthesisEntry {
  functionId: string;
  status: FunctionSynthesisStatus;
  summary: string;
  salesNarrative: string;
  mechanismSummary: string;
  safeClaims: string[];
  avoidClaims: string[];
  paradigmUses: FunctionParadigmUse[];
  sourceUses: FunctionSourceUse[];
  convergenceRegions: FunctionConvergenceRegion[];
  presentationStages?: FunctionPresentationStage[];
  overlay: {
    nodes: ParadigmOverlayNode[];
    edges: ParadigmOverlayEdge[];
  };
  nextCoordinateReview: string[];
}

export interface FunctionSynthesisRegistry {
  id: string;
  name: string;
  version: string;
  status: "draft";
  sourceNote: string;
  syntheses: FunctionSynthesisEntry[];
}
