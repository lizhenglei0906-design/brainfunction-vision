import type { Yeo7Network } from "./brainAtlas";

export type RegionCoverageStatus =
  | "parcel_proxy"
  | "network_proxy"
  | "outside_current_atlas"
  | "needs_specialized_atlas"
  | "specialized_atlas_reference";

export type RegionStructureType =
  | "cortical"
  | "subcortical"
  | "cerebellar"
  | "network_construct";

export type RegionLaterality = "left" | "right" | "bilateral" | "midline" | "not_applicable";

export interface RegionCoverageEntry {
  id: string;
  label: string;
  englishLabel: string;
  aliases: string[];
  structureType: RegionStructureType;
  laterality: RegionLaterality;
  coverageStatus: RegionCoverageStatus;
  relatedParadigmIds: string[];
  relatedFunctionIds: string[];
  candidateNetworks: Yeo7Network[];
  candidateParcelIds: string[];
  explanation: string;
  caution: string;
  nextAtlasNeed?: string;
}

export interface RegionCoverageRegistry {
  id: string;
  version: string;
  status: "seed";
  atlasScope: string;
  sourceNote: string;
  regions: RegionCoverageEntry[];
}
