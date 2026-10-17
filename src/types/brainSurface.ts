import type { Hemisphere, Yeo7Network } from "./brainAtlas";

export interface BrainSurfaceHemisphere {
  pialVertices: Array<[number, number, number]>;
  inflatedVertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  sulc: Array<number | null>;
  sulcMissingMask?: boolean[];
  labelBackgroundMask?: boolean[];
  parcelByVertex: Array<string | null>;
}

export interface BrainSurfaceParcel {
  id: string;
  surfaceCentroid: [number, number, number];
  inflatedCentroid: [number, number, number];
  vertexCount: number;
  hemisphere: Hemisphere;
  network: Yeo7Network;
  networkColor: string;
  label: string;
  displayLabel: string;
  sourceLabel: string;
  centroidMni: [number, number, number];
}

export interface BrainSurfaceModel {
  id: string;
  surface: string;
  atlas: string;
  parcellation: string;
  source: {
    surface: string;
    annotations: string[];
    localAtlas: string;
  };
  hemispheres: Record<Hemisphere, BrainSurfaceHemisphere>;
  parcels: Record<string, BrainSurfaceParcel>;
  quality: {
    parcelCount: number;
    missingParcelIds: string[];
    missingAnnotationLabels: Record<Hemisphere, string[]>;
  };
}
