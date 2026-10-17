export type Hemisphere = "LH" | "RH";

export type BrainAtlasSource = "Schaefer2018";

export type BrainNetworkTaxonomy = "Yeo7" | "Yeo17";

export type Yeo7Network =
  | "visual"
  | "somatomotor"
  | "dorsal_attention"
  | "ventral_attention"
  | "limbic"
  | "frontoparietal"
  | "default_mode";

export interface BrainNetworkDefinition {
  id: Yeo7Network;
  sourceName: string;
  label: string;
  englishLabel: string;
  description: string;
  color: string;
}

export type NetworkMembershipAssignment = "primary" | "candidate" | "overlap" | "task_derived";

export interface BrainNetworkMembership {
  taxonomy: BrainNetworkTaxonomy;
  network: Yeo7Network;
  sourceName: string;
  weight: number;
  assignmentType: NetworkMembershipAssignment;
  source: string;
  note?: string;
}

export interface BrainParcel {
  id: string;
  roi: number;
  atlas: BrainAtlasSource;
  resolution: number;
  networkTaxonomy: BrainNetworkTaxonomy;
  hemisphere: Hemisphere;
  neutralLabel: string;
  sourceLabel: string;
  parcelShortName: string;
  displayLabel: string;
  networkMemberships: BrainNetworkMembership[];
  network: Yeo7Network;
  networkSourceName: string;
  centroidMni: [number, number, number];
  displayPosition: [number, number, number];
  sourceColorRgb: [number, number, number] | null;
  sourceColorHex: string | null;
  networkColor: string;
}

export interface BrainAtlas {
  id: string;
  name: string;
  source: {
    atlas: string;
    networkTaxonomy: string;
    coordinateSpace: string;
    rawFiles: string[];
  };
  resolution: number;
  networkTaxonomy: BrainNetworkTaxonomy;
  parcels: BrainParcel[];
}

export interface BrainNetworkTaxonomyFile {
  id: string;
  name: string;
  networks: BrainNetworkDefinition[];
}
