import type { BrainNetworkTaxonomy, Yeo7Network } from "./brainAtlas";

export type LearningFunctionEvidenceStatus =
  | "business_taxonomy"
  | "network_prior"
  | "review_needed";

export type LearningParadigmStatus = "seed" | "draft" | "reviewed";

export interface LearningParadigmSeed {
  id: string;
  label: string;
  englishLabel?: string;
  status: LearningParadigmStatus;
  note: string;
}

export interface LearningFunctionDefinition {
  id: string;
  order: number;
  label: string;
  englishLabel: string;
  description: string;
  contentUse: string;
  candidateNetworks: Yeo7Network[];
  networkMappingNote: string;
  paradigmExamples: LearningParadigmSeed[];
  evidenceStatus: LearningFunctionEvidenceStatus;
  tags: string[];
}

export interface LearningFunctionCatalog {
  id: string;
  name: string;
  version: string;
  status: "foundation";
  sourceNote: string;
  atlasContext: {
    networkTaxonomy: BrainNetworkTaxonomy;
    mappingStatus: "candidate_network_prior";
  };
  functions: LearningFunctionDefinition[];
}
