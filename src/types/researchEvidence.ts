import type { BrainAtlasSource, BrainNetworkTaxonomy, Yeo7Network } from "./brainAtlas";

export type EvidenceSourceType = "paper" | "dataset" | "specification" | "model_note";

export type EvidenceIndexStatus = "foundation" | "draft" | "review_needed";

export type EvidenceRelation = "network_prior" | "cross_network_prior" | "study_observation";

export type EvidenceConfidence = "reference" | "strong_prior" | "working_hypothesis";

export interface EvidenceSource {
  id: string;
  type: EvidenceSourceType;
  title: string;
  citation: string;
  year?: number;
  doi?: string;
  pmid?: string;
  pmcid?: string;
  url?: string;
  scope?: string;
  tags?: string[];
}

export interface EvidenceDomain {
  id: string;
  label: string;
  englishLabel: string;
  description: string;
  primaryNetwork?: Yeo7Network;
  relatedNetworks: Yeo7Network[];
  relation: EvidenceRelation;
  confidence: EvidenceConfidence;
  tags: string[];
  sourceIds: string[];
}

export interface ResearchEvidenceIndex {
  id: string;
  name: string;
  version: string;
  status: EvidenceIndexStatus;
  atlas: {
    atlas: BrainAtlasSource;
    resolution: number;
    networkTaxonomy: BrainNetworkTaxonomy;
    coordinateSpace: string;
  };
  method: string;
  sources: EvidenceSource[];
  domains: EvidenceDomain[];
}

export interface ParcelDomainMatch {
  domain: EvidenceDomain;
  matchType: "primary_network" | "related_network";
}
