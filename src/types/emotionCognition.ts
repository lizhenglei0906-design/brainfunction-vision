import type { Yeo7Network } from "./brainAtlas";

export type EmotionCognitionValence = "positive" | "negative";

export type EmotionCognitionEvidenceTier =
  | "E0_network_prior"
  | "E1_cross_domain_review"
  | "E2_task_family"
  | "E3_point_level_reviewed";

export interface EmotionCognitionMechanismBranch {
  id: string;
  label: string;
  description: string;
  primaryNetworks: Yeo7Network[];
  safeClaim: string;
  boundary: string;
}

export interface EmotionCognitionValenceImpact {
  valence: EmotionCognitionValence;
  label: string;
  mechanismBranchIds: string[];
  cognitiveEffect: string;
  observableSigns: string[];
  safeUse: string;
  doNotSay: string;
  evidenceTier: EmotionCognitionEvidenceTier;
  sourceIds: string[];
}

export interface EmotionCognitionFunctionImpact {
  functionId: string;
  label: string;
  englishLabel: string;
  bridgeStrength: "strongest" | "strong" | "candidate" | "secondary" | "exploratory";
  summary: string;
  positive: EmotionCognitionValenceImpact;
  negative: EmotionCognitionValenceImpact;
  uiHook: string;
  trainingBoundary: string;
  storyBoundary: string;
}

export interface EmotionCognitionSourceAnchor {
  sourceId: string;
  role: "primary_anchor" | "supporting_boundary" | "future_acquisition";
  evidenceTier: EmotionCognitionEvidenceTier;
  useFor: string;
}

export interface EmotionCognitionImpactFramework {
  id: string;
  version: string;
  updated: string;
  status: "addon_ready";
  scope: string;
  routeHint: string;
  sourceAnchors: EmotionCognitionSourceAnchor[];
  mechanismBranches: EmotionCognitionMechanismBranch[];
  globalGuardrails: string[];
  functionImpacts: EmotionCognitionFunctionImpact[];
}

export type EmotionModulationNodeKind =
  | "cortical_proxy"
  | "specialized_atlas_anchor"
  | "app_fit_preview_anchor";

export type EmotionModulationSupportLevel =
  | "application_ready"
  | "review_grade"
  | "candidate_preview"
  | "boundary_only";

export type EmotionModulationAtlasReference =
  | {
      type: "schaefer200_parcels";
      atlasId: "schaefer-200-7networks";
      parcelIds: string[];
    }
  | {
      type: "surface_structures";
      surfaceId: string;
      atlasIds: string[];
      structureIds: string[];
    };

export interface EmotionModulation3dNode {
  id: string;
  label: string;
  englishLabel: string;
  nodeKind: EmotionModulationNodeKind;
  supportLevel: EmotionModulationSupportLevel;
  mechanismBranchIds: string[];
  sourceIds: string[];
  atlasReference: EmotionModulationAtlasReference;
  visualRole: "highlight" | "anchor" | "context";
  safeUse: string;
  boundary: string;
}

export interface EmotionModulation3dEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  mechanismBranchIds: string[];
  label: string;
  interpretation: string;
  boundary: string;
}

export interface EmotionModulationFunction3dMapping {
  functionId: string;
  displayStrength: "strongest" | "strong" | "secondary" | "candidate" | "exploratory";
  defaultNodeIds: string[];
  defaultEdgeIds: string[];
  primaryMechanismBranchIds: string[];
  summary: string;
  shortCopy: string;
  uiPlacement: "foundation_function_dropdown";
  displayPolicy: string;
  boundary: string;
}

export interface EmotionModulation3dLayerContract {
  id: string;
  version: string;
  updated: string;
  status: "p0_contract_ready";
  scope: string;
  relationshipToFoundationFunctions: string;
  displayMode: "overlay_modulation_layer";
  routeHint: string;
  globalGuardrails: string[];
  atlasLayerPolicy: {
    schaefer200: string;
    specializedAtlases: string;
    ashsAppFitPreview: string;
  };
  nodes: EmotionModulation3dNode[];
  edges: EmotionModulation3dEdge[];
  functionMappings: EmotionModulationFunction3dMapping[];
  consumerContracts: {
    uiThread: string[];
    storyThread: string[];
    trainingThread: string[];
  };
}
