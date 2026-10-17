import type { Yeo7Network } from "./brainAtlas";
import type { TaskOverlayNodeRole, TaskOverlayStatus } from "./taskOverlay";

export type ConnectionOverlayMode = "research_paradigm" | "narrative_expression";

export type ConnectionOverlayNodeKind = "network" | "parcel" | "domain";

export type ConnectionOverlayRelation =
  | "candidate_flow"
  | "top_down_bias"
  | "salience_gate"
  | "context_integration"
  | "coactivation"
  | "model_assumption";

export interface ConnectionOverlayNode {
  id: string;
  kind: ConnectionOverlayNodeKind;
  label: string;
  role: TaskOverlayNodeRole | "context" | "modulator";
  weight: number;
  networkId?: Yeo7Network;
  parcelId?: string;
  displayParcelId?: string;
  candidateParcelIds?: string[];
  physicalStructureId?: string;
  regionCoverageId?: string;
  specializedAtlasLabelIds?: string[];
  displayLayer?: "default" | "support" | "boundary";
  accentColor?: string;
  domainId?: string;
  caption: string;
}

export interface ConnectionOverlayEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: ConnectionOverlayRelation;
  weight: number;
  caption: string;
  sourceClaimIds: string[];
  accentColor?: string;
}

export interface ConnectionOverlayFile {
  id: string;
  name: string;
  version: string;
  mode: ConnectionOverlayMode;
  status: TaskOverlayStatus;
  userPromptExample: string;
  description: string;
  sourceIds: string[];
  sourceClaimIds: string[];
  nodes: ConnectionOverlayNode[];
  edges: ConnectionOverlayEdge[];
}
