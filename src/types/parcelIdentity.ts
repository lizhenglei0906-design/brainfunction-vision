import type { Hemisphere, Yeo7Network } from "./brainAtlas";

export type ParcelIdentityRegistryStatus = "seed";
export type ParcelProxyConfidence = "low" | "medium";
export type ParcelRegionNameStatus = "proxy_pending_overlap" | "atlas_overlap" | "source_label";
export type ParcelRegionNameConfidence = "low" | "medium" | "high";
export type ParcelRegionNameMethod = "schaefer_label_family" | "surface_atlas_overlap" | "schaefer_source_label";

export interface ParcelAnatomicalProxy {
  label: string;
  englishLabel: string;
  aliases: string[];
  confidence: ParcelProxyConfidence;
  basis: string;
  caution: string;
}

export interface ParcelResolvedRegionName {
  label: string;
  englishLabel: string;
  shortLabel: string;
  status: ParcelRegionNameStatus;
  confidence: ParcelRegionNameConfidence;
  method: ParcelRegionNameMethod;
  sourceAtlas: string;
  isExactAnatomicalName: boolean;
  basis: string;
  caution: string;
  aliases: string[];
}

export interface ParcelIdentityEntry {
  id: string;
  parcelId: string;
  roi: number;
  sourceLabel: string;
  neutralLabel: string;
  hemisphere: Hemisphere;
  centroidMni: [number, number, number];
  identityLabel: string;
  identitySource: "schaefer_source_label";
  schaefer: {
    networkOrder: "7Networks";
    networkSourceName: string;
    parcelShortName: string;
    sourceFamily: string;
    sourceIdentityConfidence: "source_exact";
  };
  networkClassification: {
    taxonomy: "Yeo7";
    network: Yeo7Network;
    label: string;
    sourceName: string;
  };
  resolvedRegionName: ParcelResolvedRegionName;
  anatomicalProxy: ParcelAnatomicalProxy;
}

export interface ParcelIdentityRegistry {
  id: string;
  version: string;
  status: ParcelIdentityRegistryStatus;
  atlasId: string;
  sourceNote: string;
  entries: ParcelIdentityEntry[];
}
