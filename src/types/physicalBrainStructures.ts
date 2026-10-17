export type PhysicalBrainSystemId = "limbic_system" | "cerebellum" | "subcortical";

export interface PhysicalBrainSystem {
  id: PhysicalBrainSystemId;
  label: string;
  englishLabel: string;
  color: string;
  caution: string;
}

export interface PhysicalBrainStructureComponent {
  id: string;
  label: string;
  englishLabel: string;
  structureId: string;
  systemId: PhysicalBrainSystemId;
  laterality: "left" | "right" | "midline" | "bilateral";
  center: [number, number, number];
  scale: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  opacity?: number;
}

export interface PhysicalBrainStructure {
  id: string;
  label: string;
  englishLabel: string;
  systemId: PhysicalBrainSystemId;
  relatedRegionCoverageId?: string;
  specializedAtlasLabelIds?: string[];
  componentIds: string[];
  caution: string;
}

export interface PhysicalBrainStructureRegistry {
  id: string;
  version: string;
  status: "seed";
  coordinateSpace: "viewer_ras_approximate";
  sourceNote: string;
  systems: PhysicalBrainSystem[];
  structures: PhysicalBrainStructure[];
  components: PhysicalBrainStructureComponent[];
}
