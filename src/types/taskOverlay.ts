import type { BrainAtlasSource, BrainNetworkTaxonomy } from "./brainAtlas";

export type TaskOverlayStatus = "draft" | "review_needed" | "validated";

export type TaskOverlayNodeRole =
  | "sensory_input"
  | "attention_orienting"
  | "salience_detection"
  | "conflict_monitoring"
  | "executive_control"
  | "response_selection"
  | "memory_context"
  | "affective_value";

export interface TaskOverlayNode {
  parcelId: string;
  role: TaskOverlayNodeRole;
  activationWeight: number;
  confidence: "low" | "medium" | "high";
  caption: string;
  evidenceSourceIds: string[];
}

export interface TaskOverlayEdge {
  sourceParcelId: string;
  targetParcelId: string;
  relation: "candidate_flow" | "reported_connectivity" | "model_assumption";
  weight: number;
  caption: string;
  evidenceSourceIds: string[];
}

export interface TaskOverlayFile {
  id: string;
  name: string;
  version: string;
  status: TaskOverlayStatus;
  atlas: {
    atlas: BrainAtlasSource;
    resolution: number;
    networkTaxonomy: BrainNetworkTaxonomy;
    coordinateSpace: string;
  };
  taskFamily: string;
  paradigm?: string;
  description: string;
  nodes: TaskOverlayNode[];
  edges: TaskOverlayEdge[];
}
