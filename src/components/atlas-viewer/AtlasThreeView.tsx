import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import physicalStructuresData from "../../data/brain-structures/physical-structures.seed.json";
import cerebellumSuitSurfaceUrl from "../../data/brain-surface/cerebellum-suitpy-fsl-pial.surface.json?url";
import brainSurfaceUrl from "../../data/brain-surface/schaefer200-mni-label-volume.surface.json?url";
import { getNetworkColor } from "../../lib/networkPalette";
import { getParcelCompactDisplayName } from "../../lib/parcelNaming";
import type {
  BrainNetworkDefinition,
  BrainParcel,
  Hemisphere,
  Yeo7Network,
} from "../../types/brainAtlas";
import type {
  BrainSurfaceHemisphere,
  BrainSurfaceModel,
  BrainSurfaceParcel,
} from "../../types/brainSurface";
import type { ParcelIdentityEntry } from "../../types/parcelIdentity";
import type {
  PhysicalBrainStructureComponent,
  PhysicalBrainStructureRegistry,
  PhysicalBrainSystem,
} from "../../types/physicalBrainStructures";
import type {
  ParadigmOverlayEdge,
  ParadigmOverlayNode,
} from "../../types/paradigmLibrary";
import { SURFACE_OPACITY_RANGE } from "./AtlasThreeViewConfig";
import {
  ATLAS_FINE_STRUCTURE_MATERIAL,
  ATLAS_STRUCTURE_VISUAL_RULES,
  type AtlasStructureOpacityConfig,
  atlasStructureOpacity,
  atlasStructureMaterialColor,
  atlasStructureRenderOrder,
  cerebellumCapOpacity,
  cerebellumDetailLineOpacity,
  cerebellumSurfaceOpacity,
  cerebellumVolumeOverviewOpacity,
  cortexDisplayOpacity,
  createBrainstemSupportMaterial,
  createCortexSurfaceMaterial,
  createOverviewSoftStructureMaterial,
  overviewXrayOpacity,
  physicalStructureGlassColor,
  physicalStructureOpacity,
  usesPresentationVisualBaseline,
} from "./AtlasThreeViewVisualSystem";

const CAMERA_DISTANCE = 620;
const CAMERA_DISTANCE_RANGE = { min: 320, max: 980 } as const;
const CAMERA_REFERENCE_SHORT_SIDE = 520;
const CAMERA_ZOOM_SCALE_RANGE = { min: 0.56, max: 1.56 } as const;
const LABEL_OFFSETS = [
  new THREE.Vector3(-34, 32, 0),
  new THREE.Vector3(42, 12, 0),
  new THREE.Vector3(-28, -30, 0),
  new THREE.Vector3(34, -26, 0),
  new THREE.Vector3(0, 40, 0),
];
const NODE_LABEL_OFFSETS: Record<string, THREE.Vector3> = {
  "stroop-dlpfc-rule": new THREE.Vector3(-78, 42, 0),
  "stroop-ifg-inhibition": new THREE.Vector3(62, -40, 0),
  "foundation-global-input": new THREE.Vector3(-118, 8, 0),
  "foundation-global-attention": new THREE.Vector3(34, 72, 0),
  "foundation-global-reaction-speed": new THREE.Vector3(-58, -52, 0),
  "foundation-global-short-memory": new THREE.Vector3(-82, 76, 0),
  "foundation-global-executive": new THREE.Vector3(-58, -88, 0),
  "foundation-global-reading": new THREE.Vector3(52, 44, 0),
  "foundation-global-calculation": new THREE.Vector3(116, 78, 0),
  "foundation-global-imagery": new THREE.Vector3(110, -28, 0),
  "foundation-global-reasoning": new THREE.Vector3(-96, 34, 0),
  "foundation-global-long-memory": new THREE.Vector3(72, 82, 0),
};
const DISPLAY_SURFACE_INFLATION = 0;
const ATLAS_REFERENCE_INITIAL_ROTATION = { x: -0.22, y: -0.5 };
// RAS coordinates map posterior cortex toward the default camera; +90deg Y rotation presents the left temporal side.
const LEFT_TEMPORAL_PRESENTATION_ROTATION = { x: -0.18, y: Math.PI / 2 };
const THALAMUS_PRESENTATION_OFFSET = new THREE.Vector3(0, -10, -8);
const MTL_MESH_STRUCTURE_IDS = new Set([
  "hippocampal-formation",
  "amygdala",
  "entorhinal-parahippocampal-interface",
]);
const FUNCTION_OVERVIEW_CANDIDATE_HEAT_RATIO = 0.56;
const FUNCTION_OVERVIEW_MAX_CANDIDATE_HEAT = 0.64;
const CEREBELLUM_OUTER_POINT_SIZE = {
  active: 0.68,
  default: 0.42,
};
const CEREBELLUM_FOLD_POINT_SIZE = {
  active: 0.28,
  default: 0.18,
};
const EVIDENCE_LAYER_RENDER_ORDER = 60;
const CORTICAL_DETAIL_PROFILE = {
  sulcBase: 0.8,
  sulcContrast: 0.16,
  sulcMax: 1,
  sulcMin: 0.56,
} as const;
const FUNCTION_ROLE_HEAT_COLORS = {
  sensory_input: "#4f8fd8",
  attention_orienting: "#2fb7a7",
  salience_detection: "#f0a342",
  conflict_monitoring: "#dc5d5d",
  executive_control: "#7f6ce6",
  response_selection: "#d8893f",
  memory_context: "#bd6ad0",
  affective_value: "#df6a99",
  context: "#7f93a8",
  modulator: "#66a86a",
} as const satisfies Record<ParadigmOverlayNode["role"], string>;
const physicalStructureRegistry = physicalStructuresData as PhysicalBrainStructureRegistry;

export type AtlasThreeViewLevel = "function_overview" | "paradigm_detail" | "atlas_reference";

function initialRotationForViewLevel(viewLevel: AtlasThreeViewLevel) {
  // Presentation views should consistently open on the left temporal side.
  return viewLevel === "atlas_reference" ? ATLAS_REFERENCE_INITIAL_ROTATION : LEFT_TEMPORAL_PRESENTATION_ROTATION;
}

type CorticalStructureId =
  | "frontal"
  | "parietal"
  | "temporal"
  | "occipital_visual"
  | "sensorimotor"
  | "insula_operculum"
  | "cingulate_medial";

interface CorticalStructureDefinition {
  id: CorticalStructureId;
  label: string;
  color: string;
}

const CORTICAL_STRUCTURES: CorticalStructureDefinition[] = [
  { id: "frontal", label: "额叶", color: "#5f7f91" },
  { id: "parietal", label: "顶叶", color: "#7ea65e" },
  { id: "temporal", label: "颞叶", color: "#b67b68" },
  { id: "occipital_visual", label: "枕叶/视觉", color: "#6f8fc5" },
  { id: "sensorimotor", label: "运动区", color: "#c9904d" },
  { id: "insula_operculum", label: "岛叶/岛盖", color: "#b16d96" },
  { id: "cingulate_medial", label: "扣带/内侧", color: "#8875b7" },
];

const physicalSystemById = new Map(
  physicalStructureRegistry.systems.map((system) => [system.id, system]),
);
const physicalStructureById = new Map(
  physicalStructureRegistry.structures.map((structure) => [structure.id, structure]),
);
const physicalComponentsByStructureId = physicalStructureRegistry.components.reduce<
  Map<string, PhysicalBrainStructureComponent[]>
>((componentsByStructure, component) => {
  const components = componentsByStructure.get(component.structureId) ?? [];
  components.push(component);
  componentsByStructure.set(component.structureId, components);
  return componentsByStructure;
}, new Map());

export interface TeachingPaperPoint { recordId: string; viewerXYZ: number[]; }

interface AtlasThreeViewProps {
  teachingPaperPoints?: TeachingPaperPoint[];
  selectedTeachingPointId?: string;
  onSelectTeachingPoint?: (recordId: string) => void;
  atlasSmoothed?: boolean;
  enableAshsAppFitPreview?: boolean;
  parcels: BrainParcel[];
  parcelIdentityById: Map<string, ParcelIdentityEntry>;
  networkById: Record<string, BrainNetworkDefinition>;
  viewLevel: AtlasThreeViewLevel;
  focusNetworkIds: Set<Yeo7Network> | null;
  semanticNetworkIds: Set<Yeo7Network>;
  overlayNodes: ParadigmOverlayNode[];
  functionHeatNodes?: ParadigmOverlayNode[];
  overlayEdges: ParadigmOverlayEdge[];
  preferOverlayNodeLabels?: boolean;
  preserveViewOnOverlayChange?: boolean;
  selectedOverlayNodeId?: string;
  selectedParcelId: string;
  selectedPhysicalNodeId?: string;
  selectedPhysicalStructureId?: string;
  structureOpacities?: AtlasStructureOpacityConfig;
  surfaceOpacity: number;
  autoRotate?: boolean;
  cameraFitScale?: number;
  transitionKey?: string | null;
  viewResetKey?: string | null;
  onSelectParcel: (parcel: BrainParcel) => void;
  onClearSelection?: () => void;
  onSelectOverlayNode?: (nodeId: string | null) => void;
  onSelectPhysicalStructure?: (selection: AtlasPhysicalStructureSelection) => void;
}

export interface AtlasPhysicalStructureSelection {
  atlasId?: string;
  caption?: string;
  caution?: string;
  componentId?: string;
  englishLabel?: string;
  label?: string;
  laterality?: "left" | "right" | "midline" | "bilateral" | string;
  overlayNodeId?: string;
  precisionLabel?: string;
  sourceLabel?: string;
  structureId: string;
  surfaceStructureId?: string;
}

interface SavedThreeViewState {
  cameraZ?: number;
  cameraZoomScale?: number;
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  viewLevel: AtlasThreeViewLevel;
  viewResetKey: string | null;
}

interface CerebellumSurfaceModel {
  id: string;
  status: string;
  sourceAtlasId: string;
  coordinateSpace: string;
  pointFormat: string;
  outerPoints: Array<[number, number, number, number]>;
  foldPoints: Array<[number, number, number, number]>;
  quality: {
    labelCount: number;
    outerPointCount: number;
    foldPointCount: number;
  };
}

interface CerebellumTemplateSurfaceModel {
  id: string;
  status: string;
  source: {
    repository: string;
    surfaceFile: string;
    license: string;
  };
  coordinateSpace: string;
  surfaceType: string;
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  quality: {
    vertexCount: number;
    faceCount: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

interface Cit168SubcorticalSurfaceStructure {
  id: string;
  abbreviation: string;
  label: string;
  englishLabel: string;
  color: string;
  renderGroup: string;
  structureId: string;
  volumeValue: number;
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  quality: {
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

interface Cit168SubcorticalSurfaceModel {
  id: string;
  status: string;
  source: {
    doi: string;
    osfProject: string;
    neurovaultCollection: string;
  };
  coordinateSpace: string;
  surfaceType: string;
  structures: Cit168SubcorticalSurfaceStructure[];
  quality: {
    structureCount: number;
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
  };
}

interface ThalamusSurfaceStructure {
  id: string;
  label: string;
  englishLabel: string;
  color: string;
  laterality: string;
  caution: string;
  structureId: "thalamus";
  volumeValue: number;
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  quality: {
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

interface ThalamusSurfaceModel {
  id: string;
  status: string;
  coordinateSpace: string;
  surfaceType: string;
  structures: ThalamusSurfaceStructure[];
  quality: {
    structureCount: number;
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
  };
}

interface LeadDbsSubcorticalSurfaceStructure {
  id: string;
  atlasId: string;
  label: string;
  englishLabel: string;
  color: string;
  laterality: "left" | "right" | string;
  renderGroup: "basal-ganglia" | "thalamus" | string;
  sourcePath: string;
  structureId: "basal-ganglia" | "thalamus";
  threshold: number;
  caution: string;
  mniCentroid: [number, number, number];
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  quality: {
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

interface LeadDbsSubcorticalSurfaceModel {
  id: string;
  status: string;
  coordinateSpace: string;
  surfaceType: string;
  structures: LeadDbsSubcorticalSurfaceStructure[];
  quality: {
    structureCount: number;
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
  };
}

interface MtlSurfaceStructure {
  id: string;
  atlasId: string;
  atlasLabelId: string;
  label: string;
  englishLabel: string;
  color: string;
  laterality: "left" | "right";
  caution: string;
  previewStatus?: string;
  sourceLabel?: string;
  structureId: "hippocampal-formation" | "amygdala" | "entorhinal-parahippocampal-interface";
  taskUse: string[];
  volumeValue: number;
  vertices: Array<[number, number, number]>;
  faces: Array<[number, number, number]>;
  quality: {
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
    bounds: {
      min: [number, number, number];
      max: [number, number, number];
    };
  };
}

interface MtlSurfaceModel {
  id: string;
  status: string;
  coordinateSpace: string;
  surfaceType: string;
  previewContract?: {
    featureGate?: string;
    requiredViewerLabels?: string[];
  };
  structures: MtlSurfaceStructure[];
  quality: {
    structureCount: number;
    vertexCount: number;
    faceCount: number;
    voxelCount: number;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function responsiveCameraDistance(width: number, height: number, cameraFitScale = 1) {
  const shortSide = Math.max(1, Math.min(width, height));
  const aspect = width / Math.max(1, height);
  const sizeScale = clamp(shortSide / CAMERA_REFERENCE_SHORT_SIDE, 0.72, 1.18);
  const narrowFitScale = aspect < 1 ? clamp(1 / aspect, 1, 1.24) : 1;
  return clamp(
    (CAMERA_DISTANCE / Math.sqrt(sizeScale)) * narrowFitScale * cameraFitScale,
    CAMERA_DISTANCE_RANGE.min,
    CAMERA_DISTANCE_RANGE.max,
  );
}

function stringFromUserData(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function visualStructureKeyForPhysicalStructure({
  structureId,
  systemId,
}: {
  structureId: string;
  systemId?: string;
}) {
  if (structureId === "thalamus") {
    return "thalamus";
  }
  if (structureId === "basal-ganglia") {
    return "basalGanglia";
  }
  if (structureId === "cerebellum" || systemId === "cerebellum") {
    return "cerebellum";
  }
  if (MTL_MESH_STRUCTURE_IDS.has(structureId)) {
    return "limbic";
  }
  return "limbic";
}

function surfaceVector(point: [number, number, number]) {
  const [x, y, z] = point;
  return new THREE.Vector3(x, z, -y);
}

function blendSurfacePoint(
  pial: [number, number, number],
  inflated: [number, number, number],
) {
  return pial.map((coordinate, index) => {
    return coordinate * (1 - DISPLAY_SURFACE_INFLATION) + inflated[index] * DISPLAY_SURFACE_INFLATION;
  }) as [number, number, number];
}

function displaySurfaceVertex(surface: BrainSurfaceHemisphere, vertexIndex: number) {
  const pial = surface.pialVertices[vertexIndex];
  const inflated = surface.inflatedVertices[vertexIndex];
  return inflated ? blendSurfacePoint(pial, inflated) : pial;
}

function displayParcelCentroid(parcel: BrainSurfaceParcel) {
  return parcel.inflatedCentroid
    ? blendSurfacePoint(parcel.surfaceCentroid, parcel.inflatedCentroid)
    : parcel.surfaceCentroid;
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "");
  return {
    r: parseInt(normalized.slice(0, 2), 16) / 255,
    g: parseInt(normalized.slice(2, 4), 16) / 255,
    b: parseInt(normalized.slice(4, 6), 16) / 255,
  };
}

function mixRgb(
  first: { r: number; g: number; b: number },
  second: { r: number; g: number; b: number },
  amount: number,
) {
  const t = clamp(amount, 0, 1);
  return {
    r: first.r * (1 - t) + second.r * t,
    g: first.g * (1 - t) + second.g * t,
    b: first.b * (1 - t) + second.b * t,
  };
}

type RgbColor = ReturnType<typeof hexToRgb>;

function sulcBaseColor(sulc: number) {
  const shade = clamp(
    CORTICAL_DETAIL_PROFILE.sulcBase + sulc * CORTICAL_DETAIL_PROFILE.sulcContrast,
    CORTICAL_DETAIL_PROFILE.sulcMin,
    CORTICAL_DETAIL_PROFILE.sulcMax,
  );
  return { r: shade * 0.98, g: shade, b: shade * 0.98 };
}

function structureForParcel(identity: ParcelIdentityEntry | undefined, parcel: BrainSurfaceParcel | undefined) {
  // Official functional labels do not establish a detailed anatomical lobe assignment.
  if (identity?.resolvedRegionName.status === "source_label") return undefined;
  const text = [
    identity?.resolvedRegionName.label,
    identity?.resolvedRegionName.shortLabel,
    identity?.resolvedRegionName.englishLabel,
    identity?.anatomicalProxy.label,
    identity?.anatomicalProxy.englishLabel,
    parcel?.label,
    parcel?.network,
  ]
    .filter(Boolean)
    .join(" ");

  if (/扣带|胼胝体周围|cingulate/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "cingulate_medial");
  }
  if (/岛叶|岛盖|外侧裂|insula|operculum/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "insula_operculum");
  }
  if (/中央前|中央后|中央沟|中央旁|躯体|运动|precentral|postcentral|somatomotor/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "sensorimotor");
  }
  if (/顶|楔前|缘上|角回|parietal|precuneus|supramarginal|angular/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "parietal");
  }
  if (/枕|距状|舌回|楔叶|梭状|枕颞|视觉|occipital|calcarine|lingual|fusiform|visual/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "occipital_visual");
  }
  if (/颞|海马旁|temporal|parahippocampal/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "temporal");
  }
  if (/额|眶|直回|H 形|frontal|prefrontal|orbitofrontal/i.test(text)) {
    return CORTICAL_STRUCTURES.find((structure) => structure.id === "frontal");
  }

  return undefined;
}

function structureTintAmount(viewLevel: AtlasThreeViewLevel) {
  if (usesPresentationVisualBaseline(viewLevel)) {
    return 0.22;
  }
  if (viewLevel === "atlas_reference") {
    return 0.46;
  }
  return 0.34;
}

interface FunctionHeatParcel {
  color: RgbColor;
  priority: number;
  weight: number;
}

function functionHeatColorForNode(node: ParadigmOverlayNode) {
  return hexToRgb(FUNCTION_ROLE_HEAT_COLORS[node.role]);
}

function surfaceColorForVertex({
  parcel,
  parcelIdentityById,
  sulc,
  visibleParcelIds,
  selectedParcelId,
  focusNetworkIds,
  semanticNetworkIds,
  overlayNetworkIds,
  functionHeatParcelById,
  overlayParcelWeightById,
  viewLevel,
}: {
  parcel: BrainSurfaceParcel | undefined;
  parcelIdentityById: Map<string, ParcelIdentityEntry>;
  sulc: number;
  visibleParcelIds: Set<string>;
  selectedParcelId: string;
  focusNetworkIds: Set<Yeo7Network> | null;
  semanticNetworkIds: Set<Yeo7Network>;
  overlayNetworkIds: Set<Yeo7Network>;
  functionHeatParcelById: Map<string, FunctionHeatParcel>;
  overlayParcelWeightById: Map<string, number>;
  viewLevel: AtlasThreeViewLevel;
}) {
  const baseSulc = sulcBaseColor(sulc);
  const structure = structureForParcel(parcel ? parcelIdentityById.get(parcel.id) : undefined, parcel);
  const base = structure
    ? mixRgb(baseSulc, hexToRgb(structure.color), structureTintAmount(viewLevel))
    : baseSulc;
  if (!parcel || !visibleParcelIds.has(parcel.id)) {
    return mixRgb(base, { r: 1, g: 1, b: 1 }, 0.56);
  }

  const focused = !focusNetworkIds || focusNetworkIds.has(parcel.network);
  const paletteColor = hexToRgb(getNetworkColor(parcel.network));

  if (usesPresentationVisualBaseline(viewLevel)) {
    return structure ? mixRgb(base, { r: 1, g: 1, b: 1 }, 0.18) : mixRgb(base, paletteColor, 0.04);
  }

  if (parcel.id === selectedParcelId) {
    return { r: 0.09, g: 0.13, b: 0.16 };
  }

  if (!focused) {
    return mixRgb(base, { r: 1, g: 1, b: 1 }, 0.62);
  }

  if (overlayNetworkIds.has(parcel.network)) {
    return mixRgb(base, paletteColor, 0.42);
  }
  if (semanticNetworkIds.has(parcel.network)) {
    return mixRgb(base, paletteColor, 0.28);
  }

  return base;
}

function createSurfaceGeometry(
  hemisphere: Hemisphere,
  brainSurface: BrainSurfaceModel,
  options: {
    visibleParcelIds: Set<string>;
    parcelIdentityById: Map<string, ParcelIdentityEntry>;
    selectedParcelId: string;
    focusNetworkIds: Set<Yeo7Network> | null;
    semanticNetworkIds: Set<Yeo7Network>;
    overlayNetworkIds: Set<Yeo7Network>;
    functionHeatParcelById: Map<string, FunctionHeatParcel>;
    overlayParcelWeightById: Map<string, number>;
    viewLevel: AtlasThreeViewLevel;
  },
) {
  const surface = brainSurface.hemispheres[hemisphere];
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  surface.pialVertices.forEach((_, vertexIndex) => {
    const vertex = displaySurfaceVertex(surface, vertexIndex);
    const position = surfaceVector(vertex);
    const parcelId = surface.parcelByVertex[vertexIndex];
    const parcel = parcelId ? brainSurface.parcels[parcelId] : undefined;
    const color = surfaceColorForVertex({
      parcel,
      parcelIdentityById: options.parcelIdentityById,
      sulc: surface.sulc[vertexIndex] ?? 0,
      visibleParcelIds: options.visibleParcelIds,
      selectedParcelId: options.selectedParcelId,
      focusNetworkIds: options.focusNetworkIds,
      semanticNetworkIds: options.semanticNetworkIds,
      overlayNetworkIds: options.overlayNetworkIds,
      functionHeatParcelById: options.functionHeatParcelById,
      overlayParcelWeightById: options.overlayParcelWeightById,
      viewLevel: options.viewLevel,
    });
    positions.push(position.x, position.y, position.z);
    colors.push(color.r, color.g, color.b);
  });

  surface.faces.forEach((face) => {
    indices.push(face[0], face[1], face[2]);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function surfaceAnchorVectors(
  parcels: BrainParcel[],
  networkIds: Set<Yeo7Network>,
  brainSurface: BrainSurfaceModel,
) {
  const buckets = new Map<Yeo7Network, { count: number; vector: THREE.Vector3 }>();

  parcels.forEach((parcel) => {
    const surfaceParcel = brainSurface.parcels[parcel.id];
    if (!surfaceParcel) {
      return;
    }
    parcel.networkMemberships.forEach((membership) => {
      if (!networkIds.has(membership.network)) {
        return;
      }

      const bucket = buckets.get(membership.network) ?? {
        count: 0,
        vector: new THREE.Vector3(),
      };
      bucket.count += 1;
      bucket.vector.add(surfaceVector(displayParcelCentroid(surfaceParcel)));
      buckets.set(membership.network, bucket);
    });
  });

  return Array.from(buckets.entries()).reduce<Record<string, THREE.Vector3>>(
    (anchors, [networkId, bucket]) => {
      anchors[networkId] = bucket.vector.divideScalar(bucket.count);
      return anchors;
    },
    {},
  );
}

function representativeParcelForSurfaceAnchor(
  parcels: BrainParcel[],
  networkId: Yeo7Network,
  anchor: THREE.Vector3,
  brainSurface: BrainSurfaceModel,
) {
  let bestParcel: BrainParcel | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  parcels.forEach((parcel) => {
    if (!parcel.networkMemberships.some((membership) => membership.network === networkId)) {
      return;
    }

    const surfaceParcel = brainSurface.parcels[parcel.id];
    if (!surfaceParcel) {
      return;
    }

    const distance = surfaceVector(displayParcelCentroid(surfaceParcel)).distanceToSquared(anchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestParcel = parcel;
    }
  });

  return bestParcel;
}

function surfaceAnchorForParcelIds(
  parcelIds: string[] | undefined,
  brainSurface: BrainSurfaceModel,
) {
  if (!parcelIds || parcelIds.length === 0) {
    return undefined;
  }

  const anchor = new THREE.Vector3();
  let count = 0;
  parcelIds.forEach((parcelId) => {
    const surfaceParcel = brainSurface.parcels[parcelId];
    if (!surfaceParcel) {
      return;
    }
    anchor.add(surfaceVector(displayParcelCentroid(surfaceParcel)));
    count += 1;
  });

  return count > 0 ? anchor.divideScalar(count) : undefined;
}

function displayParcelIdsForOverlayNode(node: ParadigmOverlayNode) {
  return node.displayParcelId ? [node.displayParcelId] : node.candidateParcelIds ?? [];
}

function centerForBounds(bounds: {
  min: [number, number, number];
  max: [number, number, number];
}) {
  return new THREE.Vector3(
    (bounds.min[0] + bounds.max[0]) / 2,
    (bounds.min[1] + bounds.max[1]) / 2,
    (bounds.min[2] + bounds.max[2]) / 2,
  );
}

function averageStructureCenters(
  structures: Array<{
    quality: {
      bounds: {
        min: [number, number, number];
        max: [number, number, number];
      };
    };
  }>,
) {
  if (structures.length === 0) {
    return undefined;
  }
  return structures
    .reduce((sum, structure) => sum.add(centerForBounds(structure.quality.bounds)), new THREE.Vector3())
    .divideScalar(structures.length);
}

function functionOverviewCandidateHeatWeight(node: ParadigmOverlayNode) {
  return clamp(node.weight * FUNCTION_OVERVIEW_CANDIDATE_HEAT_RATIO, 0.16, FUNCTION_OVERVIEW_MAX_CANDIDATE_HEAT);
}

function registerFunctionHeatParcel(
  heatParcels: Map<string, FunctionHeatParcel>,
  parcelId: string,
  node: ParadigmOverlayNode,
  weight: number,
  priority: number,
) {
  const existing = heatParcels.get(parcelId);
  if (existing && existing.priority + existing.weight >= priority + weight) {
    return;
  }
  heatParcels.set(parcelId, {
    color: functionHeatColorForNode(node),
    priority,
    weight,
  });
}

function physicalStructureAnchor(
  structureId: string | undefined,
  atlasAnchorByStructureId?: Map<string, THREE.Vector3>,
) {
  if (!structureId) {
    return undefined;
  }

  const atlasAnchor = atlasAnchorByStructureId?.get(structureId);
  if (atlasAnchor) {
    return atlasAnchor.clone();
  }

  const components = physicalComponentsByStructureId.get(structureId);
  if (!components || components.length === 0) {
    return undefined;
  }

  const anchor = new THREE.Vector3();
  components.forEach((component) => {
    anchor.add(new THREE.Vector3(component.center[0], component.center[1], component.center[2]));
  });
  return anchor.divideScalar(components.length);
}

function physicalStructureLabel(structureId: string | undefined) {
  if (!structureId) {
    return undefined;
  }
  return physicalStructureById.get(structureId)?.label;
}

function representativeParcelForOverlayNode(
  parcels: BrainParcel[],
  node: ParadigmOverlayNode,
  anchor: THREE.Vector3,
  brainSurface: BrainSurfaceModel,
) {
  const displayParcelIds = displayParcelIdsForOverlayNode(node);
  if (displayParcelIds.length === 0) {
    return representativeParcelForSurfaceAnchor(parcels, node.networkId, anchor, brainSurface);
  }

  const candidateParcelIds = new Set(displayParcelIds);
  let bestParcel: BrainParcel | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;

  parcels.forEach((parcel) => {
    if (!candidateParcelIds.has(parcel.id)) {
      return;
    }

    const surfaceParcel = brainSurface.parcels[parcel.id];
    if (!surfaceParcel) {
      return;
    }

    const distance = surfaceVector(displayParcelCentroid(surfaceParcel)).distanceToSquared(anchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestParcel = parcel;
    }
  });

  return bestParcel;
}

function roundedRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const corner = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + corner, y);
  context.lineTo(x + width - corner, y);
  context.quadraticCurveTo(x + width, y, x + width, y + corner);
  context.lineTo(x + width, y + height - corner);
  context.quadraticCurveTo(x + width, y + height, x + width - corner, y + height);
  context.lineTo(x + corner, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - corner);
  context.lineTo(x, y + corner);
  context.quadraticCurveTo(x, y, x + corner, y);
  context.closePath();
}

function createLabelSprite(label: string, accentColor: string, opacity = 1) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const lines = label.split("\n").map((line) => line.trim()).filter(Boolean);
  const safeLines = lines.length ? lines : [label];
  const lineHeight = 32;
  context.font = "700 28px Inter, system-ui, sans-serif";
  const textWidth = Math.max(...safeLines.map((line) => context.measureText(line).width));
  const width = Math.ceil(textWidth + 42);
  const height = Math.max(54, 26 + safeLines.length * lineHeight);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.scale(pixelRatio, pixelRatio);
  context.font = "700 28px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";
  roundedRectPath(context, 2, 5, width - 4, height - 10, 10);
  context.fillStyle = "rgba(255, 255, 255, 0.9)";
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = accentColor;
  context.stroke();
  context.fillStyle = "#17202a";
  const firstLineY = height / 2 - ((safeLines.length - 1) * lineHeight) / 2;
  safeLines.forEach((line, index) => {
    context.fillText(line, 21, firstLineY + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    depthTest: false,
    depthWrite: false,
    map: texture,
    opacity,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width * 0.28, height * 0.28, 1);
  return sprite;
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let currentLine = "";
  Array.from(text).forEach((char) => {
    const nextLine = `${currentLine}${char}`;
    if (currentLine && context.measureText(nextLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = nextLine;
    }
  });
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.slice(0, 3);
}

function createDescriptionSprite(description: string, accentColor: string, opacity = 1) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const pixelRatio = window.devicePixelRatio || 1;
  const width = 520;
  const lineHeight = 38;
  context.font = "700 28px Inter, system-ui, sans-serif";
  const lines = wrapCanvasText(context, description, width - 64);
  const height = Math.max(116, 58 + lines.length * lineHeight);
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  context.scale(pixelRatio, pixelRatio);
  context.textBaseline = "middle";
  roundedRectPath(context, 3, 6, width - 6, height - 12, 16);
  context.fillStyle = "rgba(255, 255, 255, 0.96)";
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = accentColor;
  context.stroke();

  roundedRectPath(context, 22, 20, 92, 24, 12);
  context.fillStyle = accentColor;
  context.fill();
  context.font = "800 14px Inter, system-ui, sans-serif";
  context.fillStyle = "#ffffff";
  context.fillText("当前关注", 36, 32);

  context.font = "700 28px Inter, system-ui, sans-serif";
  context.fillStyle = "#17202a";
  lines.forEach((line, index) => {
    context.fillText(line, 28, 70 + index * lineHeight);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    depthTest: false,
    depthWrite: false,
    map: texture,
    opacity,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(width * 0.26, height * 0.26, 1);
  return sprite;
}

function overlayNodeForParcelId(nodes: ParadigmOverlayNode[], parcelId: string) {
  return (
    nodes.find((node) => node.displayParcelId === parcelId) ??
    nodes.find((node) => node.candidateParcelIds?.includes(parcelId))
  );
}

function overlayNodeLabelKey(node: ParadigmOverlayNode) {
  if (node.physicalStructureId) {
    return `physical:${node.physicalStructureId}`;
  }
  if (node.displayParcelId) {
    return `parcel:${node.displayParcelId}`;
  }
  const candidateParcelId = node.candidateParcelIds?.[0];
  return candidateParcelId ? `parcel:${candidateParcelId}` : `node:${node.id}`;
}

function isEmotionModulationOverlayId(id: string) {
  return id.startsWith("emotion-modulation:");
}

function isFoundationGlobalOverviewNodeId(id: string) {
  return id.startsWith("foundation-global-");
}

function uniqueLabelLines(labels: string[]) {
  const seen = new Set<string>();
  return labels.filter((label) => {
    if (seen.has(label)) {
      return false;
    }
    seen.add(label);
    return true;
  });
}

function anchorSpriteCornerToPoint(sprite: THREE.Sprite, direction: THREE.Vector3) {
  const centerX = direction.x < -1 ? 1 : direction.x > 1 ? 0 : 0.5;
  const centerY = direction.y < -1 ? 1 : direction.y > 1 ? 0 : 0.5;
  sprite.center.set(centerX, centerY);
}

function createOverlayCurve(
  start: THREE.Vector3,
  end: THREE.Vector3,
  edgeIndex: number,
) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const distance = direction.length() || 1;
  const normal = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 1, 0));
  if (normal.lengthSq() < 0.001) {
    normal.crossVectors(direction, new THREE.Vector3(1, 0, 0));
  }
  normal.normalize();

  const sign = edgeIndex % 2 === 0 ? 1 : -1;
  const curveLift = clamp(distance * 0.22, 24, 68);
  const curveSide = clamp(distance * 0.16, 22, 62) * sign;
  const verticalLift = new THREE.Vector3(0, curveLift, 0);
  const sideLift = normal.multiplyScalar(curveSide);
  const controlOne = start
    .clone()
    .add(direction.clone().multiplyScalar(0.28))
    .add(sideLift)
    .add(verticalLift);
  const controlTwo = start
    .clone()
    .add(direction.clone().multiplyScalar(0.72))
    .add(sideLift)
    .add(verticalLift);

  return new THREE.CubicBezierCurve3(start, controlOne, controlTwo, end);
}

function createOrientationHeadModel() {
  const root = new THREE.Group();
  const skinMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 0.54,
    clearcoatRoughness: 0.38,
    color: 0xf0ddd0,
    metalness: 0.02,
    roughness: 0.46,
  });
  const featureMaterial = new THREE.MeshStandardMaterial({
    color: 0x17202a,
    metalness: 0.04,
    roughness: 0.4,
  });
  const noseMaterial = new THREE.MeshStandardMaterial({
    color: 0xd7a98f,
    metalness: 0.02,
    roughness: 0.48,
  });
  const neckMaterial = new THREE.MeshPhysicalMaterial({
    clearcoat: 0.34,
    clearcoatRoughness: 0.42,
    color: 0xe6cbbd,
    metalness: 0,
    roughness: 0.52,
  });

  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), skinMaterial);
  head.scale.set(0.82, 1.05, 0.74);
  head.position.y = 0.25;
  root.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.4, 0.68, 28), neckMaterial);
  neck.position.y = -0.82;
  root.add(neck);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.42, 24), noseMaterial);
  nose.position.set(0, 0.23, 0.86);
  nose.rotation.x = Math.PI / 2;
  root.add(nose);

  const eyeGeometry = new THREE.SphereGeometry(0.085, 18, 12);
  [
    [-0.28, 0.44, 0.68],
    [0.28, 0.44, 0.68],
  ].forEach(([x, y, z]) => {
    const eye = new THREE.Mesh(eyeGeometry, featureMaterial);
    eye.position.set(x, y, z);
    eye.scale.set(1, 0.82, 0.55);
    root.add(eye);
  });

  const earGeometry = new THREE.SphereGeometry(0.18, 18, 12);
  [-0.78, 0.24, -0.02, 0.78, 0.24, -0.02].forEach((_, index, values) => {
    if (index % 3 !== 0) {
      return;
    }
    const ear = new THREE.Mesh(earGeometry, skinMaterial);
    ear.position.set(values[index], values[index + 1], values[index + 2]);
    ear.scale.set(0.62, 1, 0.52);
    root.add(ear);
  });

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.035, 0.035), featureMaterial);
  brow.position.set(0, 0.63, 0.64);
  brow.scale.z = 0.45;
  root.add(brow);

  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.025, 0.025), featureMaterial);
  mouth.position.set(0, -0.12, 0.71);
  mouth.scale.z = 0.35;
  root.add(mouth);

  return root;
}

function createPhysicalStructureMesh({
  active,
  component,
  structureOpacity,
  surfaceOpacity,
  system,
  viewLevel,
}: {
  active: boolean;
  component: PhysicalBrainStructureComponent;
  structureOpacity: number;
  surfaceOpacity: number;
  system: PhysicalBrainSystem;
  viewLevel: AtlasThreeViewLevel;
}) {
  const opacityBase =
    component.opacity ??
    (system.id === "cerebellum" ? 0.2 : 0.18);
  const opacity = physicalStructureOpacity({
    active,
    multiplier: clamp(opacityBase / 0.24, 0.78, 1.18),
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
  const color = component.color ?? system.color;
  const visualKey = visualStructureKeyForPhysicalStructure({
    structureId: component.structureId,
    systemId: system.id,
  });
  const visualColor =
    visualKey === "cerebellum"
      ? color
      : atlasStructureMaterialColor(visualKey, active, color);
  const glassColor = physicalStructureGlassColor(visualColor, active);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 40, 24),
    new THREE.MeshPhysicalMaterial({
      clearcoat: 0.78,
      clearcoatRoughness: 0.28,
      color: glassColor,
      depthTest: false,
      depthWrite: false,
      emissive: glassColor,
      emissiveIntensity: active ? 0.025 : 0.008,
      ior: 1.22,
      metalness: 0,
      opacity,
      roughness: 0.36,
      transparent: true,
      transmission: active ? 0.12 : 0.04,
    }),
  );

  mesh.position.set(component.center[0], component.center[1], component.center[2]);
  mesh.scale.set(component.scale[0], component.scale[1], component.scale[2]);
  if (component.rotation) {
    mesh.rotation.set(component.rotation[0], component.rotation[1], component.rotation[2]);
  }
  mesh.renderOrder = active ? 18 : 8;
  mesh.userData.physicalStructureId = component.structureId;
  mesh.userData.physicalComponentId = component.id;
  mesh.userData.physicalLabel = component.label;
  mesh.userData.physicalEnglishLabel = component.englishLabel;
  mesh.userData.physicalLaterality = component.laterality;
  return mesh;
}

function createCerebellumPointTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 48;
  canvas.height = 48;
  const context = canvas.getContext("2d");
  if (!context) {
    return undefined;
  }

  const gradient = context.createRadialGradient(24, 24, 0, 24, 24, 24);
  gradient.addColorStop(0, "rgba(255,255,255,0.94)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.58)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 48, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function cerebellumPointColor(labelIndex: number, type: "outer" | "fold", active: boolean) {
  const labelTint = (labelIndex % 7) / 6;
  const hue = 0.54 + labelTint * 0.018;
  const saturation = active
    ? type === "outer"
      ? 0.16
      : 0.2
    : type === "outer"
      ? 0.08
      : 0.12;
  const lightness = active
    ? type === "outer"
      ? 0.74
      : 0.56
    : type === "outer"
      ? 0.7
      : 0.54;
  return new THREE.Color().setHSL(hue, saturation, lightness);
}

function createCerebellumPointGeometry(
  points: Array<[number, number, number, number]>,
  type: "outer" | "fold",
  active: boolean,
) {
  const positions: number[] = [];
  const colors: number[] = [];
  points.forEach((point) => {
    positions.push(point[0], point[1], point[2]);
    const color = cerebellumPointColor(point[3], type, active);
    colors.push(color.r, color.g, color.b);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

function createCerebellumVolumeMesh({
  active,
  center,
  color,
  rim,
  scale,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  center: [number, number, number];
  color: string;
  rim?: boolean;
  scale: [number, number, number];
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const useOverviewBaseline = usesPresentationVisualBaseline(viewLevel);
  const opacity =
    useOverviewBaseline
      ? cerebellumVolumeOverviewOpacity(surfaceOpacity, structureOpacity)
      : physicalStructureOpacity({
          active,
          multiplier: rim ? 0.18 : 0.34,
          structureOpacity,
          surfaceOpacity,
          viewLevel,
        });
  const glassColor = physicalStructureGlassColor(color, active, rim ? 0.12 : 0.08);
  const cerebellumColor =
    ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.color[
      active ? "active" : "default"
    ];
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(1, 56, 32),
    useOverviewBaseline
      ? new THREE.MeshStandardMaterial({
          color: cerebellumColor,
          depthTest: true,
          depthWrite: false,
          emissive: ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.emissive,
          emissiveIntensity: 0.01,
          metalness: 0,
          opacity,
          roughness: 0.9,
          side: THREE.FrontSide,
          transparent: true,
        })
      : new THREE.MeshPhysicalMaterial({
          clearcoat: 0.88,
          clearcoatRoughness: 0.24,
          color: glassColor,
          depthTest: false,
          depthWrite: false,
          emissive: glassColor,
          emissiveIntensity: active ? 0.012 : 0.004,
          ior: 1.26,
          metalness: 0,
          opacity,
          roughness: 0.22,
          side: rim ? THREE.BackSide : THREE.FrontSide,
          specularIntensity: 0.2,
          thickness: 12,
          transmission: active ? 0.08 : 0.04,
          transparent: true,
        }),
  );

  mesh.position.set(center[0], center[1], center[2]);
  const scaleBoost = rim ? 1.045 : 1;
  mesh.scale.set(scale[0] * scaleBoost, scale[1] * scaleBoost, scale[2] * scaleBoost);
  mesh.renderOrder = active ? (rim ? 10 : atlasStructureRenderOrder("cerebellum", true)) : rim ? 6 : atlasStructureRenderOrder("cerebellum", false);
  return mesh;
}

function quantile(values: number[], ratio: number) {
  if (!values.length) {
    return 0;
  }
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor((sorted.length - 1) * ratio)];
}

function createCerebellumVolumeParts(points: Array<[number, number, number, number]>) {
  const axisScale: [number, number, number] = [0.38, 0.24, 0.28];
  const groups = [
    {
      color: "#8fb2bc",
      id: "left-posterior-cerebellum-volume",
      points: points.filter((point) => point[0] < -24 && point[1] < -135),
    },
    {
      color: "#9abfc7",
      id: "left-anterior-cerebellum-volume",
      points: points.filter((point) => point[0] < -24 && point[1] >= -145),
    },
    {
      color: "#91b6c0",
      id: "right-posterior-cerebellum-volume",
      points: points.filter((point) => point[0] > 24 && point[1] < -135),
    },
    {
      color: "#9ec3cb",
      id: "right-anterior-cerebellum-volume",
      points: points.filter((point) => point[0] > 24 && point[1] >= -145),
    },
    {
      color: "#83a8b2",
      id: "posterior-cerebellar-vermis-volume",
      points: points.filter((point) => Math.abs(point[0]) <= 20 && point[1] < -135),
    },
    {
      color: "#7f9faa",
      id: "anterior-cerebellar-vermis-volume",
      points: points.filter((point) => Math.abs(point[0]) <= 18 && point[1] >= -145),
    },
  ];

  return groups
    .filter((group) => group.points.length > 12)
    .map((group) => {
      const ranges = [0, 1, 2].map((axis) => {
        const values = group.points.map((point) => point[axis]);
        const low = quantile(values, 0.04);
        const high = quantile(values, 0.96);
        return { high, low };
      });
      return {
        center: ranges.map(({ high, low }) => Number(((high + low) / 2).toFixed(2))) as [number, number, number],
        color: group.color,
        id: group.id,
        scale: ranges.map(
          ({ high, low }, axis) => Number(((high - low) * axisScale[axis]).toFixed(2)),
        ) as [number, number, number],
      };
    });
}

function createCerebellumTemplateGeometry(model: CerebellumTemplateSurfaceModel) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(model.vertices.flat(), 3),
  );
  geometry.setIndex(model.faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createCerebellumTemplateDisplayGeometry(model: CerebellumTemplateSurfaceModel) {
  const bounds = model.vertices.reduce(
    (currentBounds, [x, y, z]) => {
      currentBounds.min.x = Math.min(currentBounds.min.x, x);
      currentBounds.min.y = Math.min(currentBounds.min.y, y);
      currentBounds.min.z = Math.min(currentBounds.min.z, z);
      currentBounds.max.x = Math.max(currentBounds.max.x, x);
      currentBounds.max.y = Math.max(currentBounds.max.y, y);
      currentBounds.max.z = Math.max(currentBounds.max.z, z);
      return currentBounds;
    },
    {
      max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
      min: new THREE.Vector3(Infinity, Infinity, Infinity),
    },
  );
  const center = new THREE.Vector3().addVectors(bounds.min, bounds.max).multiplyScalar(0.5);
  const halfExtents = new THREE.Vector3().subVectors(bounds.max, bounds.min).multiplyScalar(0.5);
  const geometry = new THREE.SphereGeometry(1, 64, 32);
  geometry.scale(halfExtents.x * 0.96, halfExtents.y * 0.92, halfExtents.z * 0.86);
  geometry.translate(center.x, center.y - halfExtents.y * 0.02, center.z - halfExtents.z * 0.03);
  geometry.computeVertexNormals();
  return geometry;
}

function cerebellumLoopNormal(model: CerebellumTemplateSurfaceModel, loop: number[]) {
  const normal = new THREE.Vector3();
  loop.forEach((vertexIndex, index) => {
    const current = model.vertices[vertexIndex];
    const next = model.vertices[loop[(index + 1) % loop.length]];
    normal.x += (current[1] - next[1]) * (current[2] + next[2]);
    normal.y += (current[2] - next[2]) * (current[0] + next[0]);
    normal.z += (current[0] - next[0]) * (current[1] + next[1]);
  });
  if (normal.lengthSq() < 1e-6) {
    return new THREE.Vector3(0, 0, 1);
  }
  return normal.normalize();
}

function cerebellumBoundaryLoops(model: CerebellumTemplateSurfaceModel) {
  const edgeCounts = new Map<string, number>();
  const edgeKey = (left: number, right: number) =>
    left < right ? `${left}:${right}` : `${right}:${left}`;

  model.faces.forEach(([a, b, c]) => {
    [
      [a, b],
      [b, c],
      [c, a],
    ].forEach(([left, right]) => {
      const key = edgeKey(left, right);
      edgeCounts.set(key, (edgeCounts.get(key) ?? 0) + 1);
    });
  });

  const adjacency = new Map<number, number[]>();
  const boundaryEdges: Array<[number, number]> = [];
  edgeCounts.forEach((count, key) => {
    if (count !== 1) {
      return;
    }
    const [left, right] = key.split(":").map(Number) as [number, number];
    boundaryEdges.push([left, right]);
    adjacency.set(left, [...(adjacency.get(left) ?? []), right]);
    adjacency.set(right, [...(adjacency.get(right) ?? []), left]);
  });

  const visited = new Set<string>();
  const loops: number[][] = [];
  boundaryEdges.forEach(([start, firstNext]) => {
    if (visited.has(edgeKey(start, firstNext))) {
      return;
    }

    const loop = [start];
    let previous = start;
    let current = firstNext;
    for (let guard = 0; guard < boundaryEdges.length + 2; guard += 1) {
      visited.add(edgeKey(previous, current));
      if (current === start) {
        break;
      }
      loop.push(current);
      const next = (adjacency.get(current) ?? []).find(
        (candidate) => candidate !== previous && !visited.has(edgeKey(current, candidate)),
      );
      if (next === undefined) {
        break;
      }
      previous = current;
      current = next;
    }

    if (loop.length >= 3) {
      loops.push(loop);
    }
  });

  return loops;
}

function cerebellumBoundaryCapIndices(model: CerebellumTemplateSurfaceModel) {
  const indices: number[] = [];

  cerebellumBoundaryLoops(model).forEach((loop) => {
    if (loop.length < 3) {
      return;
    }
    const centroid = loop.reduce(
      (sum, vertexIndex) => {
        const [x, y, z] = model.vertices[vertexIndex];
        sum.x += x;
        sum.y += y;
        sum.z += z;
        return sum;
      },
      new THREE.Vector3(),
    ).multiplyScalar(1 / loop.length);
    const normal = cerebellumLoopNormal(model, loop);
    const referenceAxis = Math.abs(normal.z) < 0.86 ? new THREE.Vector3(0, 0, 1) : new THREE.Vector3(0, 1, 0);
    const axisX = new THREE.Vector3().crossVectors(referenceAxis, normal).normalize();
    const axisY = new THREE.Vector3().crossVectors(normal, axisX).normalize();
    const contour = loop.map((vertexIndex) => {
      const [x, y, z] = model.vertices[vertexIndex];
      const point = new THREE.Vector3(x, y, z).sub(centroid);
      return new THREE.Vector2(point.dot(axisX), point.dot(axisY));
    });

    THREE.ShapeUtils.triangulateShape(contour, []).forEach(([a, b, c]) => {
      indices.push(loop[a], loop[b], loop[c]);
    });
  });

  return indices;
}

function createCerebellumTemplateClosedGeometry(model: CerebellumTemplateSurfaceModel) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(model.vertices.flat(), 3),
  );
  geometry.setIndex([...model.faces.flat(), ...cerebellumBoundaryCapIndices(model)]);
  geometry.computeVertexNormals();
  return geometry;
}

function createCerebellumTemplateCapGeometry(model: CerebellumTemplateSurfaceModel) {
  const positions: number[] = [];
  const indexMap = new Map<number, number>();

  cerebellumBoundaryLoops(model).forEach((loop) => {
    loop.forEach((vertexIndex) => {
      if (indexMap.has(vertexIndex)) {
        return;
      }
      indexMap.set(vertexIndex, positions.length / 3);
      positions.push(...model.vertices[vertexIndex]);
    });
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(cerebellumBoundaryCapIndices(model).map((vertexIndex) => indexMap.get(vertexIndex) ?? 0));
  geometry.computeVertexNormals();
  return geometry;
}

function createCerebellumTemplateSmoothSealGeometry(model: CerebellumTemplateSurfaceModel) {
  const largestLoop = cerebellumBoundaryLoops(model).sort((left, right) => right.length - left.length)[0];
  if (!largestLoop || largestLoop.length < 3) {
    return null;
  }

  const centroid = largestLoop.reduce(
    (sum, vertexIndex) => {
      const [x, y, z] = model.vertices[vertexIndex];
      sum.x += x;
      sum.y += y;
      sum.z += z;
      return sum;
    },
    new THREE.Vector3(),
  ).multiplyScalar(1 / largestLoop.length);
  const segments = largestLoop.length;
  const rings = 5;
  const positions = [centroid.x, centroid.y, centroid.z];
  const indices: number[] = [];

  for (let ring = 1; ring <= rings; ring += 1) {
    const radiusScale = ring / rings;
    for (let index = 0; index < segments; index += 1) {
      const [x, y, z] = model.vertices[largestLoop[index]];
      const boundaryPoint = new THREE.Vector3(x, y, z);
      const point = new THREE.Vector3().lerpVectors(centroid, boundaryPoint, radiusScale);
      positions.push(point.x, point.y, point.z);
    }
  }

  for (let index = 0; index < segments; index += 1) {
    indices.push(0, index + 1, ((index + 1) % segments) + 1);
  }
  for (let ring = 1; ring < rings; ring += 1) {
    const innerStart = 1 + (ring - 1) * segments;
    const outerStart = 1 + ring * segments;
    for (let index = 0; index < segments; index += 1) {
      const innerA = innerStart + index;
      const innerB = innerStart + ((index + 1) % segments);
      const outerA = outerStart + index;
      const outerB = outerStart + ((index + 1) % segments);
      indices.push(innerA, outerA, innerB, innerB, outerA, outerB);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createCerebellumTemplateSmoothSealMesh({
  active,
  model,
  structureOpacity,
  surfaceOpacity,
}: {
  active: boolean;
  model: CerebellumTemplateSurfaceModel;
  structureOpacity: number;
  surfaceOpacity: number;
}) {
  const geometry = createCerebellumTemplateSmoothSealGeometry(model);
  if (!geometry) {
    return null;
  }
  const sealOpacity = clamp(surfaceOpacity * structureOpacity * 0.08, 0, 0.1);
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.color[
        active ? "active" : "default"
      ],
      depthTest: true,
      depthWrite: false,
      opacity: sealOpacity,
      side: THREE.DoubleSide,
      transparent: true,
    }),
  );
  mesh.renderOrder = active ? 8 : 4;
  return mesh;
}

type BrainstemProfileRing = {
  center: THREE.Vector3;
  radiusDepth: number;
  radiusX: number;
  ventralBulge?: number;
};

function brainstemDepthAxisForRing(profile: BrainstemProfileRing[], index: number) {
  const previous = profile[Math.max(0, index - 1)].center;
  const next = profile[Math.min(profile.length - 1, index + 1)].center;
  const tangent = new THREE.Vector3().subVectors(next, previous).normalize();
  const leftRightAxis = new THREE.Vector3(1, 0, 0);
  const depthAxis = new THREE.Vector3().crossVectors(tangent, leftRightAxis).normalize();
  if (depthAxis.lengthSq() < 1e-6) {
    return new THREE.Vector3(0, 0, 1);
  }
  return depthAxis;
}

function createAnatomicalBrainstemGeometry() {
  const profile: BrainstemProfileRing[] = [
    { center: new THREE.Vector3(0, -49, 24), radiusDepth: 4.6, radiusX: 5.8 },
    { center: new THREE.Vector3(0, -59, 33), radiusDepth: 5.6, radiusX: 7.2 },
    { center: new THREE.Vector3(0, -70, 43), radiusDepth: 6.8, radiusX: 9.2, ventralBulge: 0.08 },
    { center: new THREE.Vector3(0, -82, 55), radiusDepth: 9.0, radiusX: 11.8, ventralBulge: 0.24 },
    { center: new THREE.Vector3(0, -95, 67), radiusDepth: 7.7, radiusX: 10.2, ventralBulge: 0.14 },
    { center: new THREE.Vector3(0, -108, 80), radiusDepth: 6.2, radiusX: 7.6 },
    { center: new THREE.Vector3(0, -120, 94), radiusDepth: 5.1, radiusX: 5.9 },
    { center: new THREE.Vector3(0, -132, 109), radiusDepth: 4.5, radiusX: 4.9 },
    { center: new THREE.Vector3(0, -142, 125), radiusDepth: 4.0, radiusX: 4.3 },
    { center: new THREE.Vector3(0, -150, 142), radiusDepth: 3.4, radiusX: 3.7 },
  ];
  const radialSegments = 48;
  const positions: number[] = [];
  const leftRightAxis = new THREE.Vector3(1, 0, 0);

  profile.forEach((ring, ringIndex) => {
    const depthAxis = brainstemDepthAxisForRing(profile, ringIndex);
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      const lateral = Math.cos(angle);
      const depth = Math.sin(angle);
      const organicScale = 1 + 0.025 * Math.sin(angle * 3 + ringIndex * 0.7);
      const bulgeScale = depth > 0 ? 1 + (ring.ventralBulge ?? 0) * depth : 1;
      const point = ring.center
        .clone()
        .addScaledVector(leftRightAxis, lateral * ring.radiusX * organicScale)
        .addScaledVector(depthAxis, depth * ring.radiusDepth * bulgeScale * organicScale);
      positions.push(point.x, point.y, point.z);
    }
  });

  const indices: number[] = [];
  for (let ringIndex = 0; ringIndex < profile.length - 1; ringIndex += 1) {
    const ringStart = ringIndex * radialSegments;
    const nextRingStart = (ringIndex + 1) * radialSegments;
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const current = ringStart + segment;
      const currentNext = ringStart + ((segment + 1) % radialSegments);
      const next = nextRingStart + segment;
      const nextNext = nextRingStart + ((segment + 1) % radialSegments);
      indices.push(current, next, currentNext, currentNext, next, nextNext);
    }
  }

  const firstCapIndex = positions.length / 3;
  positions.push(...profile[0].center.toArray());
  for (let segment = 0; segment < radialSegments; segment += 1) {
    indices.push(firstCapIndex, (segment + 1) % radialSegments, segment);
  }

  const lastCapIndex = positions.length / 3;
  const lastRingStart = (profile.length - 1) * radialSegments;
  positions.push(...profile[profile.length - 1].center.toArray());
  for (let segment = 0; segment < radialSegments; segment += 1) {
    indices.push(lastCapIndex, lastRingStart + segment, lastRingStart + ((segment + 1) % radialSegments));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTaperedTubeGeometry({
  radialSegments = 24,
  rings,
}: {
  radialSegments?: number;
  rings: Array<{
    center: THREE.Vector3;
    radiusDepth: number;
    radiusX: number;
  }>;
}) {
  const positions: number[] = [];
  const indices: number[] = [];
  const leftRightAxis = new THREE.Vector3(1, 0, 0);

  rings.forEach((ring, ringIndex) => {
    const previous = rings[Math.max(0, ringIndex - 1)].center;
    const next = rings[Math.min(rings.length - 1, ringIndex + 1)].center;
    const tangent = new THREE.Vector3().subVectors(next, previous).normalize();
    let depthAxis = new THREE.Vector3().crossVectors(tangent, leftRightAxis).normalize();
    if (depthAxis.lengthSq() < 1e-6) {
      depthAxis = new THREE.Vector3(0, 0, 1);
    }

    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = (segment / radialSegments) * Math.PI * 2;
      const point = ring.center
        .clone()
        .addScaledVector(leftRightAxis, Math.cos(angle) * ring.radiusX)
        .addScaledVector(depthAxis, Math.sin(angle) * ring.radiusDepth);
      positions.push(point.x, point.y, point.z);
    }
  });

  for (let ringIndex = 0; ringIndex < rings.length - 1; ringIndex += 1) {
    const ringStart = ringIndex * radialSegments;
    const nextRingStart = (ringIndex + 1) * radialSegments;
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const current = ringStart + segment;
      const currentNext = ringStart + ((segment + 1) % radialSegments);
      const next = nextRingStart + segment;
      const nextNext = nextRingStart + ((segment + 1) % radialSegments);
      indices.push(current, next, currentNext, currentNext, next, nextNext);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createBrainstemPeduncleMesh({
  material,
  rings,
}: {
  material: THREE.Material;
  rings: Array<{
    center: THREE.Vector3;
    radiusDepth: number;
    radiusX: number;
  }>;
}) {
  return new THREE.Mesh(createTaperedTubeGeometry({ rings }), material);
}

function cloneBrainstemMaterialWithOpacityScale(material: THREE.Material, opacityScale: number) {
  const clone = material.clone();
  if ("opacity" in clone && typeof clone.opacity === "number") {
    clone.opacity = clamp(clone.opacity * opacityScale, 0, 1);
    clone.transparent = clone.opacity < 0.995;
  }
  clone.depthWrite = false;
  return clone;
}

function createBrainstemSupportMesh({
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const group = new THREE.Group();
  const material = createBrainstemSupportMaterial({ structureOpacity, surfaceOpacity, viewLevel });
  const body = new THREE.Mesh(
    createAnatomicalBrainstemGeometry(),
    cloneBrainstemMaterialWithOpacityScale(material, 0.9),
  );
  body.userData.physicalComponentId = "brainstem-body-midbrain-pons-medulla";
  group.add(body);

  [
    {
      id: "left-cerebral-peduncle",
      rings: [
        { center: new THREE.Vector3(-5, -51, 26), radiusDepth: 2.0, radiusX: 2.6 },
        { center: new THREE.Vector3(-9, -59, 33), radiusDepth: 2.2, radiusX: 3.0 },
        { center: new THREE.Vector3(-13, -68, 41), radiusDepth: 1.8, radiusX: 2.4 },
      ],
    },
    {
      id: "right-cerebral-peduncle",
      rings: [
        { center: new THREE.Vector3(5, -51, 26), radiusDepth: 2.0, radiusX: 2.6 },
        { center: new THREE.Vector3(9, -59, 33), radiusDepth: 2.2, radiusX: 3.0 },
        { center: new THREE.Vector3(13, -68, 41), radiusDepth: 1.8, radiusX: 2.4 },
      ],
    },
    {
      id: "left-middle-cerebellar-peduncle",
      rings: [
        { center: new THREE.Vector3(-12, -76, 62), radiusDepth: 3.5, radiusX: 4.6 },
        { center: new THREE.Vector3(-25, -88, 72), radiusDepth: 4.0, radiusX: 5.2 },
        { center: new THREE.Vector3(-41, -103, 84), radiusDepth: 3.2, radiusX: 4.0 },
      ],
    },
    {
      id: "right-middle-cerebellar-peduncle",
      rings: [
        { center: new THREE.Vector3(12, -76, 62), radiusDepth: 3.5, radiusX: 4.6 },
        { center: new THREE.Vector3(25, -88, 72), radiusDepth: 4.0, radiusX: 5.2 },
        { center: new THREE.Vector3(41, -103, 84), radiusDepth: 3.2, radiusX: 4.0 },
      ],
    },
  ].forEach((peduncle) => {
    const mesh = createBrainstemPeduncleMesh({
      material: cloneBrainstemMaterialWithOpacityScale(material, 0.42),
      rings: peduncle.rings,
    });
    mesh.userData.physicalComponentId = peduncle.id;
    group.add(mesh);
  });

  const ponsSulcus = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -70, 45),
      new THREE.Vector3(0, -82, 56),
      new THREE.Vector3(0, -95, 68),
    ]),
    new THREE.LineBasicMaterial({
      color: "#9caaa6",
      depthTest: true,
      depthWrite: false,
      opacity: Math.min(0.16, surfaceOpacity * structureOpacity * 0.16),
      transparent: true,
    }),
  );
  ponsSulcus.renderOrder = atlasStructureRenderOrder("brainstem", false) + 1;
  group.add(ponsSulcus);
  // This teaching illustration remains legible through the transparent anatomy.
  group.renderOrder = 12;
  group.userData.physicalStructureId = "brainstem-visual-support";
  group.userData.physicalLabel = "脑干";
  group.userData.physicalEnglishLabel = "Brainstem visual support";
  group.userData.physicalCaution = "用于补足小脑与大脑之间的教学级形态连续性，不作为当前证据层的定位点。";
  return group;
}

function createCerebellumTemplateMesh({
  active,
  model,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  model: CerebellumTemplateSurfaceModel;
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const opacity = cerebellumSurfaceOpacity({ active, structureOpacity, surfaceOpacity, viewLevel });
  const opaque = opacity >= 0.995;
  const cerebellumColor = new THREE.Color(
    ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.color[active ? "active" : "default"],
  );
  const mesh = new THREE.Mesh(
    createCerebellumTemplateGeometry(model),
    new THREE.MeshStandardMaterial({
      color: cerebellumColor,
      depthTest: true,
      depthWrite: opaque,
      emissive: ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.emissive,
      emissiveIntensity: usesPresentationVisualBaseline(viewLevel) ? 0.012 : 0.018,
      metalness: 0,
      opacity,
      roughness: usesPresentationVisualBaseline(viewLevel) ? 0.9 : 0.84,
      side: THREE.DoubleSide,
      transparent: !opaque,
    }),
  );
  mesh.renderOrder = atlasStructureRenderOrder("cerebellum", active);
  return mesh;
}

function createCerebellumTemplateCapMesh({
  active,
  model,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  model: CerebellumTemplateSurfaceModel;
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const opacity = cerebellumCapOpacity({ active, structureOpacity, surfaceOpacity, viewLevel });
  const opaque = opacity >= 0.995;
  const cerebellumColor = new THREE.Color(
    ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.color[active ? "active" : "default"],
  );
  const cap = new THREE.Mesh(
    createCerebellumTemplateCapGeometry(model),
    new THREE.MeshBasicMaterial({
      color: cerebellumColor,
      depthTest: true,
      depthWrite: opaque,
      opacity,
      side: THREE.DoubleSide,
      transparent: !opaque,
    }),
  );
  cap.renderOrder = active ? 10 : 6;
  return cap;
}

function createCerebellumTemplateDetailMesh({
  active,
  model,
  structureOpacity,
  viewLevel,
}: {
  active: boolean;
  model: CerebellumTemplateSurfaceModel;
  structureOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const baseGeometry = createCerebellumTemplateGeometry(model);
  const wireGeometry = new THREE.WireframeGeometry(baseGeometry);
  baseGeometry.dispose();
  const detail = new THREE.LineSegments(
    wireGeometry,
    new THREE.LineBasicMaterial({
      color: ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.detailLineColor,
      depthTest: true,
      depthWrite: false,
      opacity: cerebellumDetailLineOpacity(active, viewLevel, structureOpacity),
      transparent: true,
    }),
  );
  detail.renderOrder = active ? 19 : 9;
  return detail;
}

function createSubcorticalStructureGeometry(structure: Cit168SubcorticalSurfaceStructure) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(structure.vertices.flat(), 3),
  );
  geometry.setIndex(structure.faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createSubcorticalStructureMesh({
  active,
  structure,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  structure: Cit168SubcorticalSurfaceStructure;
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const coreBasalGanglia = structure.renderGroup === "basal-ganglia";
  const basalGangliaDetailMultiplier = ATLAS_STRUCTURE_VISUAL_RULES.basalGanglia.detailMultiplier;
  if (usesPresentationVisualBaseline(viewLevel)) {
    const mesh = new THREE.Mesh(
      createSubcorticalStructureGeometry(structure),
      createOverviewSoftStructureMaterial({
        active,
        color: structure.color,
        structureOpacity,
        structureKey: "basalGanglia",
        surfaceOpacity,
        viewLevel,
      }),
    );
    mesh.renderOrder = atlasStructureRenderOrder("basalGanglia", active);
    mesh.userData.structureId = structure.id;
    mesh.userData.physicalStructureId = structure.structureId;
    mesh.userData.physicalSurfaceStructureId = structure.id;
    mesh.userData.physicalLabel = structure.label;
    mesh.userData.physicalEnglishLabel = structure.englishLabel;
    mesh.userData.physicalAtlasId = "cit168-subcortical-det25";
    return mesh;
  }

  const opacity = physicalStructureOpacity({
    active,
    fine: !coreBasalGanglia,
    multiplier: coreBasalGanglia ? basalGangliaDetailMultiplier.active : 0.36,
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
  const visualColor = atlasStructureMaterialColor("basalGanglia", active, structure.color);
  const glassColor = physicalStructureGlassColor(visualColor, active, coreBasalGanglia ? 0.04 : 0.12);
  const mesh = new THREE.Mesh(
    createSubcorticalStructureGeometry(structure),
    new THREE.MeshPhysicalMaterial({
      clearcoat: ATLAS_FINE_STRUCTURE_MATERIAL.clearcoat,
      clearcoatRoughness: ATLAS_FINE_STRUCTURE_MATERIAL.clearcoatRoughness,
      color: glassColor,
      depthTest: false,
      depthWrite: false,
      emissive: glassColor,
      emissiveIntensity: active ? 0.012 : 0.003,
      ior: 1.22,
      metalness: 0,
      opacity,
      roughness: ATLAS_FINE_STRUCTURE_MATERIAL.roughness,
      side: THREE.FrontSide,
      specularIntensity: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityDefault,
      thickness: 4,
      transmission: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.transmissionActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.transmissionDefault,
      transparent: true,
    }),
  );
  mesh.renderOrder = atlasStructureRenderOrder("basalGanglia", active);
  mesh.userData.structureId = structure.id;
  mesh.userData.physicalStructureId = structure.structureId;
  mesh.userData.physicalSurfaceStructureId = structure.id;
  mesh.userData.physicalLabel = structure.label;
  mesh.userData.physicalEnglishLabel = structure.englishLabel;
  mesh.userData.physicalAtlasId = "cit168-subcortical-det25";
  return mesh;
}

function createThalamusStructureGeometry(structure: ThalamusSurfaceStructure) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(structure.vertices.flat(), 3),
  );
  geometry.setIndex(structure.faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createSoftStructureProxyGeometry(vertices: Array<[number, number, number]>) {
  const bounds = vertices.reduce(
    (currentBounds, [x, y, z]) => {
      currentBounds.min.x = Math.min(currentBounds.min.x, x);
      currentBounds.min.y = Math.min(currentBounds.min.y, y);
      currentBounds.min.z = Math.min(currentBounds.min.z, z);
      currentBounds.max.x = Math.max(currentBounds.max.x, x);
      currentBounds.max.y = Math.max(currentBounds.max.y, y);
      currentBounds.max.z = Math.max(currentBounds.max.z, z);
      return currentBounds;
    },
    {
      max: new THREE.Vector3(-Infinity, -Infinity, -Infinity),
      min: new THREE.Vector3(Infinity, Infinity, Infinity),
    },
  );
  const center = new THREE.Vector3().addVectors(bounds.min, bounds.max).multiplyScalar(0.5);
  const halfExtents = new THREE.Vector3().subVectors(bounds.max, bounds.min).multiplyScalar(0.5);
  const geometry = new THREE.SphereGeometry(1, 18, 12);
  geometry.scale(
    Math.max(halfExtents.x * 0.9, 2.4),
    Math.max(halfExtents.y * 0.9, 2.4),
    Math.max(halfExtents.z * 0.9, 2.4),
  );
  geometry.translate(center.x, center.y, center.z);
  geometry.computeVertexNormals();
  return geometry;
}

function createThalamusStructureMesh({
  active,
  structure,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  structure: ThalamusSurfaceStructure;
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  if (usesPresentationVisualBaseline(viewLevel)) {
    const mesh = new THREE.Mesh(
      createThalamusStructureGeometry(structure),
      createOverviewSoftStructureMaterial({
        active,
        color: structure.color,
        structureOpacity,
        structureKey: "thalamus",
        surfaceOpacity,
        viewLevel,
      }),
    );
    mesh.renderOrder = atlasStructureRenderOrder("thalamus", active);
    mesh.userData.structureId = structure.id;
    mesh.userData.physicalStructureId = structure.structureId;
    mesh.userData.physicalSurfaceStructureId = structure.id;
    mesh.userData.physicalLabel = structure.label;
    mesh.userData.physicalEnglishLabel = structure.englishLabel;
    mesh.userData.physicalLaterality = structure.laterality;
    mesh.userData.physicalCaution = structure.caution;
    mesh.userData.physicalAtlasId = "harvard-oxford-thalamus";
    return mesh;
  }

  const thalamusDetailMultiplier = ATLAS_STRUCTURE_VISUAL_RULES.thalamus.detailMultiplier;
  const opacity = physicalStructureOpacity({
    active,
    fine: true,
    multiplier: active ? thalamusDetailMultiplier.active : thalamusDetailMultiplier.default,
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
  const xrayOpacity = overviewXrayOpacity({ active, structureOpacity, surfaceOpacity, viewLevel });
  const visualColor = atlasStructureMaterialColor("thalamus", active, structure.color);
  const glassColor = physicalStructureGlassColor(visualColor, active, 0.02);
  const mesh = new THREE.Mesh(
    createThalamusStructureGeometry(structure),
    new THREE.MeshPhysicalMaterial({
      clearcoat: ATLAS_FINE_STRUCTURE_MATERIAL.clearcoat,
      clearcoatRoughness: ATLAS_FINE_STRUCTURE_MATERIAL.clearcoatRoughness,
      color: glassColor,
      depthTest: false,
      depthWrite: false,
      emissive: glassColor,
      emissiveIntensity: active ? 0.01 : 0.003,
      ior: 1.22,
      metalness: 0,
      opacity: xrayOpacity ?? opacity,
      roughness: ATLAS_FINE_STRUCTURE_MATERIAL.roughness,
      side: THREE.FrontSide,
      specularIntensity: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityDefault,
      thickness: 5,
      transmission: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.transmissionActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.transmissionDefault,
      transparent: true,
    }),
  );
  mesh.renderOrder = atlasStructureRenderOrder("thalamus", active);
  mesh.userData.structureId = structure.id;
  mesh.userData.physicalStructureId = structure.structureId;
  mesh.userData.physicalSurfaceStructureId = structure.id;
  mesh.userData.physicalLabel = structure.label;
  mesh.userData.physicalEnglishLabel = structure.englishLabel;
  mesh.userData.physicalLaterality = structure.laterality;
  mesh.userData.physicalCaution = structure.caution;
  mesh.userData.physicalAtlasId = "harvard-oxford-thalamus";
  return mesh;
}

function createLeadDbsSubcorticalStructureGeometry(structure: LeadDbsSubcorticalSurfaceStructure) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(structure.vertices.flat(), 3),
  );
  geometry.setIndex(structure.faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createLeadDbsSubcorticalStructureMesh({
  active,
  structure,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  structure: LeadDbsSubcorticalSurfaceStructure;
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  if (usesPresentationVisualBaseline(viewLevel)) {
    const mesh = new THREE.Mesh(
      createSoftStructureProxyGeometry(structure.vertices),
      createOverviewSoftStructureMaterial({
        active,
        color: structure.color,
        structureOpacity,
        structureKey: structure.structureId === "thalamus" ? "thalamus" : "basalGanglia",
        surfaceOpacity,
        viewLevel,
      }),
    );
    mesh.renderOrder = active ? 19 : 9;
    mesh.userData.structureId = structure.id;
    mesh.userData.physicalStructureId = structure.structureId;
    mesh.userData.physicalSurfaceStructureId = structure.id;
    mesh.userData.physicalLabel = structure.label;
    mesh.userData.physicalEnglishLabel = structure.englishLabel;
    mesh.userData.physicalLaterality = structure.laterality;
    mesh.userData.physicalCaution = structure.caution;
    mesh.userData.physicalAtlasId = structure.atlasId;
    return mesh;
  }

  const isSmallTarget = /stn|vim|tha-md|tha-lpu|tha-mpu/i.test(structure.id);
  const opacity = physicalStructureOpacity({
    active,
    fine: true,
    multiplier: active ? (isSmallTarget ? 0.45 : 0.38) : 0.14,
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
  const xrayOpacity = overviewXrayOpacity({ active, structureOpacity, surfaceOpacity, viewLevel });
  const structureKey = structure.structureId === "thalamus" ? "thalamus" : "basalGanglia";
  const visualColor = atlasStructureMaterialColor(structureKey, active, structure.color);
  const glassColor = physicalStructureGlassColor(
    visualColor,
    active,
    structureKey === "thalamus" ? 0.02 : isSmallTarget ? 0.08 : 0.12,
  );
  const mesh = new THREE.Mesh(
    createLeadDbsSubcorticalStructureGeometry(structure),
    new THREE.MeshPhysicalMaterial({
      clearcoat: ATLAS_FINE_STRUCTURE_MATERIAL.clearcoat,
      clearcoatRoughness: ATLAS_FINE_STRUCTURE_MATERIAL.clearcoatRoughness,
      color: glassColor,
      depthTest: false,
      depthWrite: false,
      emissive: glassColor,
      emissiveIntensity: active ? 0.012 : 0.003,
      ior: 1.24,
      metalness: 0,
      opacity: xrayOpacity ?? opacity,
      roughness: ATLAS_FINE_STRUCTURE_MATERIAL.roughness,
      side: THREE.FrontSide,
      specularIntensity: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityDefault,
      thickness: isSmallTarget ? 3.5 : 5,
      transmission: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.transmissionActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.transmissionDefault,
      transparent: true,
    }),
  );
  mesh.renderOrder = active ? 19 : 9;
  mesh.userData.structureId = structure.id;
  mesh.userData.physicalStructureId = structure.structureId;
  mesh.userData.physicalSurfaceStructureId = structure.id;
  mesh.userData.physicalLabel = structure.label;
  mesh.userData.physicalEnglishLabel = structure.englishLabel;
  mesh.userData.physicalLaterality = structure.laterality;
  mesh.userData.physicalCaution = structure.caution;
  mesh.userData.physicalAtlasId = structure.atlasId;
  return mesh;
}

function createMtlStructureGeometry(structure: MtlSurfaceStructure) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(structure.vertices.flat(), 3),
  );
  geometry.setIndex(structure.faces.flat());
  geometry.computeVertexNormals();
  return geometry;
}

function createMtlStructureMesh({
  active,
  appFitPreview = false,
  structure,
  structureOpacity,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  appFitPreview?: boolean;
  structure: MtlSurfaceStructure;
  structureOpacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const juelichFineStructure = structure.atlasId === "juelich-mtl-cytoarchitectonic";
  const limbicDetailMultiplier = ATLAS_STRUCTURE_VISUAL_RULES.limbic.detailMultiplier;
  if (usesPresentationVisualBaseline(viewLevel)) {
    const mesh = new THREE.Mesh(
      createMtlStructureGeometry(structure),
      createOverviewSoftStructureMaterial({
        active,
        color: structure.color,
        structureOpacity,
        structureKey: appFitPreview ? "ashsPreview" : "limbic",
        surfaceOpacity,
        viewLevel,
      }),
    );
    mesh.renderOrder = atlasStructureRenderOrder(appFitPreview ? "ashsPreview" : "limbic", active);
    mesh.userData.structureId = structure.id;
    mesh.userData.physicalStructureId = structure.structureId;
    mesh.userData.physicalSurfaceStructureId = structure.id;
    mesh.userData.physicalLabel = structure.label;
    mesh.userData.physicalEnglishLabel = structure.englishLabel;
    mesh.userData.physicalLaterality = structure.laterality;
    mesh.userData.physicalCaution = structure.caution;
    mesh.userData.physicalAtlasId = structure.atlasId;
    return mesh;
  }

  const opacity = physicalStructureOpacity({
    active,
    fine: juelichFineStructure || appFitPreview,
    multiplier: appFitPreview
      ? active
        ? limbicDetailMultiplier.appFitActive
        : limbicDetailMultiplier.appFitDefault
      : juelichFineStructure
        ? active
          ? limbicDetailMultiplier.fineActive
          : limbicDetailMultiplier.fineDefault
        : active
          ? limbicDetailMultiplier.active
          : limbicDetailMultiplier.default,
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
  const xrayOpacity = overviewXrayOpacity({ active, structureOpacity, surfaceOpacity, viewLevel });
  const structureKey = appFitPreview ? "ashsPreview" : "limbic";
  const visualColor = atlasStructureMaterialColor(structureKey, active, structure.color);
  const glassColor = physicalStructureGlassColor(
    visualColor,
    active,
    appFitPreview ? 0.08 : juelichFineStructure ? 0.12 : 0.08,
  );
  const mesh = new THREE.Mesh(
    createMtlStructureGeometry(structure),
    new THREE.MeshPhysicalMaterial({
      clearcoat: appFitPreview ? 0.28 : ATLAS_FINE_STRUCTURE_MATERIAL.clearcoat,
      clearcoatRoughness: appFitPreview ? 0.68 : ATLAS_FINE_STRUCTURE_MATERIAL.clearcoatRoughness,
      color: glassColor,
      depthTest: false,
      depthWrite: false,
      emissive: glassColor,
      emissiveIntensity: appFitPreview ? (active ? 0.012 : 0.004) : active ? 0.012 : 0.003,
      ior: 1.22,
      metalness: 0,
      opacity: xrayOpacity ?? opacity,
      roughness: ATLAS_FINE_STRUCTURE_MATERIAL.roughness,
      side: THREE.FrontSide,
      specularIntensity: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.specularIntensityDefault,
      thickness: 4,
      transmission: active
        ? ATLAS_FINE_STRUCTURE_MATERIAL.transmissionActive
        : ATLAS_FINE_STRUCTURE_MATERIAL.transmissionDefault,
      transparent: true,
    }),
  );
  mesh.renderOrder = appFitPreview
    ? atlasStructureRenderOrder("ashsPreview", active)
    : active
      ? atlasStructureRenderOrder("limbic", true)
      : juelichFineStructure
        ? 6
        : atlasStructureRenderOrder("limbic", false);
  mesh.userData.structureId = structure.id;
  mesh.userData.physicalStructureId = structure.structureId;
  mesh.userData.physicalSurfaceStructureId = structure.id;
  mesh.userData.physicalLabel = structure.label;
  mesh.userData.physicalEnglishLabel = structure.englishLabel;
  mesh.userData.physicalLaterality = structure.laterality;
  mesh.userData.physicalCaution = structure.caution;
  mesh.userData.physicalAtlasId = structure.atlasId;
  if (appFitPreview) {
    mesh.userData.physicalPrecisionLabel = "Application-fit preview";
    mesh.userData.physicalSourceLabel = structure.sourceLabel ?? "ASHS T1ext app-fit preview";
  }
  return mesh;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach(disposeMaterial);
    return;
  }

  Object.values(material).forEach((value: unknown) => {
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  });
  material.dispose();
}

function objectMaterials(object: THREE.Object3D): THREE.Material[] {
  if (
    object instanceof THREE.Mesh ||
    object instanceof THREE.Sprite ||
    object instanceof THREE.Line ||
    object instanceof THREE.Points
  ) {
    const material = object.material;
    return Array.isArray(material) ? material : [material];
  }
  return [];
}

function disposeObject3D(
  object: THREE.Object3D,
  disposedGeometries = new Set<THREE.BufferGeometry>(),
) {
  object.traverse((child: THREE.Object3D) => {
    if (child instanceof THREE.Mesh) {
      if (!disposedGeometries.has(child.geometry)) {
        child.geometry.dispose();
        disposedGeometries.add(child.geometry);
      }
      disposeMaterial(child.material);
    }
    if (child instanceof THREE.Sprite) {
      disposeMaterial(child.material);
    }
    if (child instanceof THREE.Line) {
      if (!disposedGeometries.has(child.geometry)) {
        child.geometry.dispose();
        disposedGeometries.add(child.geometry);
      }
      disposeMaterial(child.material);
    }
    if (child instanceof THREE.Points) {
      if (!disposedGeometries.has(child.geometry)) {
        child.geometry.dispose();
        disposedGeometries.add(child.geometry);
      }
      disposeMaterial(child.material);
    }
  });
}

function clearThreeGroup(group: THREE.Group) {
  const disposedGeometries = new Set<THREE.BufferGeometry>();
  [...group.children].forEach((child) => {
    group.remove(child);
    disposeObject3D(child, disposedGeometries);
  });
}

function clearThreeGroupWhenIdle(group: THREE.Group) {
  const clearGroup = () => clearThreeGroup(group);
  const idleWindow = window as Window & {
    requestIdleCallback?: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number;
  };

  if (idleWindow.requestIdleCallback) {
    idleWindow.requestIdleCallback(clearGroup, { timeout: 1200 });
    return;
  }

  window.setTimeout(clearGroup, 280);
}

function updateDynamicLayerTelemetry(
  mount: HTMLDivElement | null,
  parent: THREE.Object3D,
  phase: "crossfading" | "stable",
) {
  if (!mount) {
    return;
  }
  const layerCount = parent.children.filter((child) => child.userData.brainFunctionDynamicLayer === true).length;
  mount.dataset.dynamicLayerPhase = layerCount > 1 ? "crossfading" : phase;
  mount.dataset.dynamicLayerCount = String(layerCount);
}

function fadeOutAndRemoveThreeGroup(group: THREE.Group, durationMs = 820, onRemoved?: () => void) {
  const parent = group.parent;
  if (!parent) {
    clearThreeGroupWhenIdle(group);
    onRemoved?.();
    return;
  }

  const fadeMaterials: Array<{ material: THREE.Material; opacity: number }> = [];
  group.traverse((object) => {
    objectMaterials(object).forEach((material) => {
      if (fadeMaterials.some((entry) => entry.material === material)) {
        return;
      }
      material.transparent = true;
      fadeMaterials.push({ material, opacity: material.opacity });
    });
  });

  if (fadeMaterials.length === 0) {
    parent.remove(group);
    clearThreeGroupWhenIdle(group);
    onRemoved?.();
    return;
  }

  const startedAt = window.performance.now();
  const fadeFrame = (frameNow: number) => {
    if (group.parent !== parent) {
      clearThreeGroupWhenIdle(group);
      onRemoved?.();
      return;
    }

    const rawProgress = clamp((frameNow - startedAt) / durationMs, 0, 1);
    const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
    const opacityScale = 1 - progress;
    fadeMaterials.forEach(({ material, opacity }) => {
      material.opacity = opacity * opacityScale;
      material.needsUpdate = true;
    });

    if (rawProgress < 1) {
      window.requestAnimationFrame(fadeFrame);
      return;
    }

    parent.remove(group);
    clearThreeGroupWhenIdle(group);
    onRemoved?.();
  };
  window.requestAnimationFrame(fadeFrame);
}

export function AtlasThreeView({
  teachingPaperPoints, selectedTeachingPointId, onSelectTeachingPoint,
  atlasSmoothed = false,
  enableAshsAppFitPreview = false,
  parcels,
  parcelIdentityById,
  networkById,
  viewLevel,
  focusNetworkIds,
  semanticNetworkIds,
  overlayNodes,
  functionHeatNodes,
  overlayEdges,
  preferOverlayNodeLabels = false,
  preserveViewOnOverlayChange = false,
  selectedOverlayNodeId,
  selectedParcelId,
  selectedPhysicalNodeId,
  selectedPhysicalStructureId,
  structureOpacities,
  surfaceOpacity: requestedSurfaceOpacity,
  autoRotate = false,
  cameraFitScale = 1,
  transitionKey,
  viewResetKey,
  onSelectParcel,
  onClearSelection,
  onSelectOverlayNode,
  onSelectPhysicalStructure,
}: AtlasThreeViewProps) {
  const teachingRootRef = useRef<THREE.Group | null>(null);
  const teachingMeshesRef = useRef<THREE.Mesh[]>([]);
  const onSelectTeachingPointRef = useRef(onSelectTeachingPoint);
  useEffect(() => { onSelectTeachingPointRef.current = onSelectTeachingPoint; }, [onSelectTeachingPoint]);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const orientationMountRef = useRef<HTMLDivElement | null>(null);
  const onSelectParcelRef = useRef(onSelectParcel);
  const onClearSelectionRef = useRef(onClearSelection);
  const onSelectOverlayNodeRef = useRef(onSelectOverlayNode);
  const onSelectPhysicalStructureRef = useRef(onSelectPhysicalStructure);
  const autoRotateRef = useRef(autoRotate);
  const savedViewStateRef = useRef<SavedThreeViewState | null>(null);
  const dynamicLayerRef = useRef<THREE.Group | null>(null);
  const staticSelectableMeshesRef = useRef<THREE.Mesh[]>([]);
  const dynamicSelectableMeshesRef = useRef<THREE.Mesh[]>([]);
  const fadeTargetsRef = useRef<Array<{ material: THREE.Material; targetOpacity: number }>>([]);
  const pulseTargetsRef = useRef<Array<{ object: THREE.Object3D; baseScale: THREE.Vector3 }>>([]);
  const transitionStartedAtRef = useRef(0);
  const shouldAnimateOverlayRef = useRef(false);
  const lastDynamicNetworkKeyRef = useRef<string | null>(null);
  const lastDynamicSelectionKeyRef = useRef<string | null>(null);
  const [staticSceneVersion, setStaticSceneVersion] = useState(0);
  const [rawBrainSurface, setBrainSurface] = useState<BrainSurfaceModel | null>(null);
  // Geometry and parcel anchors switch together, using the same original vertex identity.
  // The alternate view is local display smoothing, not measured cortical inflation.
  const brainSurface = useMemo<BrainSurfaceModel | null>(() => {
    if (!rawBrainSurface || !atlasSmoothed) return rawBrainSurface;
    return {
      ...rawBrainSurface,
      hemispheres: {
        LH: { ...rawBrainSurface.hemispheres.LH, pialVertices: rawBrainSurface.hemispheres.LH.inflatedVertices },
        RH: { ...rawBrainSurface.hemispheres.RH, pialVertices: rawBrainSurface.hemispheres.RH.inflatedVertices },
      },
      parcels: Object.fromEntries(Object.entries(rawBrainSurface.parcels).map(([id, parcel]) => [id, {
        ...parcel, surfaceCentroid: parcel.inflatedCentroid ?? parcel.surfaceCentroid,
      }])),
    };
  }, [rawBrainSurface, atlasSmoothed]);
  const [cerebellumSurface, setCerebellumSurface] = useState<CerebellumSurfaceModel | null>(null);
  const [cerebellumTemplateSurface, setCerebellumTemplateSurface] =
    useState<CerebellumTemplateSurfaceModel | null>(null);
  const [subcorticalSurface, setSubcorticalSurface] = useState<Cit168SubcorticalSurfaceModel | null>(null);
  const [thalamusSurface, setThalamusSurface] = useState<ThalamusSurfaceModel | null>(null);
  const [leaddbsSubcorticalSurface, setLeaddbsSubcorticalSurface] =
    useState<LeadDbsSubcorticalSurfaceModel | null>(null);
  const [mtlSurface, setMtlSurface] = useState<MtlSurfaceModel | null>(null);
  const [ashsAppFitPreviewSurface, setAshsAppFitPreviewSurface] = useState<MtlSurfaceModel | null>(null);
  const [surfaceLoadFailed, setSurfaceLoadFailed] = useState(false);
  const [cerebellumSurfaceLoadFailed, setCerebellumSurfaceLoadFailed] = useState(false);
  const [cerebellumTemplateSurfaceLoadFailed, setCerebellumTemplateSurfaceLoadFailed] = useState(false);
  const [subcorticalSurfaceLoadFailed, setSubcorticalSurfaceLoadFailed] = useState(false);
  const [thalamusSurfaceLoadFailed, setThalamusSurfaceLoadFailed] = useState(false);
  const [leaddbsSubcorticalSurfaceLoadFailed, setLeaddbsSubcorticalSurfaceLoadFailed] = useState(false);
  const [mtlSurfaceLoadFailed, setMtlSurfaceLoadFailed] = useState(false);
  const [ashsAppFitPreviewSurfaceLoadFailed, setAshsAppFitPreviewSurfaceLoadFailed] = useState(false);
  const overlayNetworkIds = useMemo(
    () => new Set(overlayNodes.map((node) => node.networkId)),
    [overlayNodes],
  );
  const overlayParcelIds = useMemo(
    () => new Set(overlayNodes.flatMap((node) => displayParcelIdsForOverlayNode(node))),
    [overlayNodes],
  );
  const functionHeatSourceNodes =
    viewLevel === "function_overview" ? functionHeatNodes ?? overlayNodes : overlayNodes;
  const overlayParcelWeightById = useMemo(() => {
    const weights = new Map<string, number>();
    functionHeatSourceNodes.forEach((node) => {
      displayParcelIdsForOverlayNode(node).forEach((parcelId) => {
        weights.set(parcelId, Math.max(weights.get(parcelId) ?? 0, node.weight));
      });
      if (viewLevel !== "function_overview") {
        return;
      }
      const candidateHeatWeight = functionOverviewCandidateHeatWeight(node);
      node.candidateParcelIds?.forEach((parcelId) => {
        weights.set(parcelId, Math.max(weights.get(parcelId) ?? 0, candidateHeatWeight));
      });
    });
    return weights;
  }, [functionHeatSourceNodes, viewLevel]);
  const functionHeatParcelById = useMemo(() => {
    const heatParcels = new Map<string, FunctionHeatParcel>();
    if (viewLevel !== "function_overview") {
      return heatParcels;
    }

    functionHeatSourceNodes.forEach((node) => {
      displayParcelIdsForOverlayNode(node).forEach((parcelId) => {
        registerFunctionHeatParcel(heatParcels, parcelId, node, node.weight, 2);
      });
      const candidateHeatWeight = functionOverviewCandidateHeatWeight(node);
      node.candidateParcelIds?.forEach((parcelId) => {
        registerFunctionHeatParcel(heatParcels, parcelId, node, candidateHeatWeight, 1);
      });
    });

    return heatParcels;
  }, [functionHeatSourceNodes, viewLevel]);
  const activePhysicalStructureIds = useMemo(
    () => {
      const structureIds = new Set(
        overlayNodes
          .map((node) => node.physicalStructureId)
          .filter((structureId): structureId is string => Boolean(structureId)),
      );
      if (selectedPhysicalStructureId) {
        structureIds.add(selectedPhysicalStructureId);
      }
      return structureIds;
    },
    [overlayNodes, selectedPhysicalStructureId],
  );
  const selectedParcelIsOverlay =
    viewLevel !== "paradigm_detail" || overlayParcelIds.has(selectedParcelId);
  const emptyStaticOverlayNetworkIds = useMemo(() => new Set<Yeo7Network>(), []);
  const emptyStaticSemanticNetworkIds = useMemo(() => new Set<Yeo7Network>(), []);
  const emptyStaticFunctionHeatParcelById = useMemo(() => new Map<string, FunctionHeatParcel>(), []);
  const emptyStaticOverlayParcelWeightById = useMemo(() => new Map<string, number>(), []);
  const emptyStaticPhysicalStructureIds = useMemo(() => new Set<string>(), []);
  const staticSurfaceUsesLiveTaskContext = viewLevel === "atlas_reference";
  const staticSurfaceFocusNetworkIds = staticSurfaceUsesLiveTaskContext ? focusNetworkIds : null;
  const staticSurfaceSemanticNetworkIds =
    staticSurfaceUsesLiveTaskContext ? semanticNetworkIds : emptyStaticSemanticNetworkIds;
  const staticSurfaceOverlayNetworkIds =
    staticSurfaceUsesLiveTaskContext ? overlayNetworkIds : emptyStaticOverlayNetworkIds;
  const staticSurfaceFunctionHeatParcelById =
    staticSurfaceUsesLiveTaskContext ? functionHeatParcelById : emptyStaticFunctionHeatParcelById;
  const staticSurfaceOverlayParcelWeightById =
    staticSurfaceUsesLiveTaskContext ? overlayParcelWeightById : emptyStaticOverlayParcelWeightById;
  const staticSurfaceSelectedParcelId = staticSurfaceUsesLiveTaskContext ? selectedParcelId : "";
  const staticSurfaceSelectedParcelIsOverlay =
    staticSurfaceUsesLiveTaskContext ? selectedParcelIsOverlay : true;
  const staticActivePhysicalStructureIds =
    staticSurfaceUsesLiveTaskContext ? activePhysicalStructureIds : emptyStaticPhysicalStructureIds;
  const visibleParcelIds = useMemo(() => new Set(parcels.map((parcel) => parcel.id)), [parcels]);
  const showDetailPins = viewLevel !== "function_overview";
  const surfaceOpacity = clamp(
    requestedSurfaceOpacity,
    SURFACE_OPACITY_RANGE.min,
    SURFACE_OPACITY_RANGE.max,
  );
  const atlasStructureOpacities = useMemo(
    () => ({
      ashsPreview: atlasStructureOpacity(structureOpacities, "ashsPreview"),
      basalGanglia: atlasStructureOpacity(structureOpacities, "basalGanglia"),
      brainstem: atlasStructureOpacity(structureOpacities, "brainstem"),
      cerebellum: atlasStructureOpacity(structureOpacities, "cerebellum"),
      cortex: atlasStructureOpacity(structureOpacities, "cortex"),
      limbic: atlasStructureOpacity(structureOpacities, "limbic"),
      thalamus: atlasStructureOpacity(structureOpacities, "thalamus"),
    }),
    [structureOpacities],
  );
  useEffect(() => {
    onSelectParcelRef.current = onSelectParcel;
  }, [onSelectParcel]);
  useEffect(() => {
    onClearSelectionRef.current = onClearSelection;
  }, [onClearSelection]);

  useEffect(() => {
    onSelectOverlayNodeRef.current = onSelectOverlayNode;
  }, [onSelectOverlayNode]);

  useEffect(() => {
    onSelectPhysicalStructureRef.current = onSelectPhysicalStructure;
  }, [onSelectPhysicalStructure]);

  useEffect(() => {
    autoRotateRef.current = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    let cancelled = false;

    fetch(brainSurfaceUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load brain surface: ${response.status}`);
        }
        return response.json() as Promise<BrainSurfaceModel>;
      })
      .then((model) => {
        if (!cancelled) {
          setBrainSurface(model);
          setSurfaceLoadFailed(false);
        }
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) {
          setSurfaceLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);


  useEffect(() => {
    if (cerebellumTemplateSurface || cerebellumTemplateSurfaceLoadFailed) {
      return undefined;
    }

    let cancelled = false;

    fetch(cerebellumSuitSurfaceUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load SUIT cerebellum surface: ${response.status}`);
        }
        return response.json() as Promise<CerebellumTemplateSurfaceModel>;
      })
      .then((model) => {
        if (!cancelled) {
          setCerebellumTemplateSurface(model);
          setCerebellumTemplateSurfaceLoadFailed(false);
        }
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) {
          setCerebellumTemplateSurfaceLoadFailed(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [cerebellumTemplateSurface, cerebellumTemplateSurfaceLoadFailed]);






  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !brainSurface) {
      return undefined;
    }
    const mountElement = mount;
    const orientationMountElement = orientationMountRef.current;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 1, 2200);
    const savedViewState = savedViewStateRef.current;
    const normalizedViewResetKey = viewResetKey ?? null;
    const shouldRestoreView =
      preserveViewOnOverlayChange &&
      savedViewState?.viewLevel === viewLevel &&
      savedViewState.viewResetKey === normalizedViewResetKey;
    const restoredCameraZoomScale =
      shouldRestoreView && savedViewState
        ? savedViewState.cameraZoomScale ??
          clamp(
            (savedViewState.cameraZ ?? CAMERA_DISTANCE) / CAMERA_DISTANCE,
            CAMERA_ZOOM_SCALE_RANGE.min,
            CAMERA_ZOOM_SCALE_RANGE.max,
          )
        : 1;
    const cameraZoomScaleRef = { current: restoredCameraZoomScale };
    const responsiveCameraBaseRef = { current: CAMERA_DISTANCE };
    camera.position.set(0, 0, CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.className = "three-map-canvas";
    renderer.domElement.setAttribute("aria-label", "3D Schaefer 功能分区体积表面");
    mountElement.appendChild(renderer.domElement);

    const root = new THREE.Group();
    const initialRotation = initialRotationForViewLevel(viewLevel);
    if (shouldRestoreView) {
      root.rotation.set(savedViewState.rotation.x, savedViewState.rotation.y, savedViewState.rotation.z);
    } else {
      root.rotation.set(initialRotation.x, initialRotation.y, 0);
    }
    scene.add(root);
    teachingRootRef.current = root;

    let orientationRenderer: THREE.WebGLRenderer | null = null;
    let orientationScene: THREE.Scene | null = null;
    let orientationCamera: THREE.PerspectiveCamera | null = null;
    let orientationRoot: THREE.Group | null = null;
    if (orientationMountElement) {
      orientationScene = new THREE.Scene();
      orientationCamera = new THREE.PerspectiveCamera(34, 1, 0.1, 50);
      orientationCamera.position.set(0, 0.05, 5.2);
      orientationCamera.lookAt(0, 0.02, 0);

      orientationRenderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        preserveDrawingBuffer: true,
      });
      orientationRenderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      orientationRenderer.outputColorSpace = THREE.SRGBColorSpace;
      orientationRenderer.setClearColor(0x000000, 0);
      orientationRenderer.domElement.className = "brain-orientation-canvas";
      orientationRenderer.domElement.setAttribute("aria-label", "同步旋转的人头朝向模型");
      orientationMountElement.appendChild(orientationRenderer.domElement);

      orientationScene.add(new THREE.AmbientLight(0xffffff, 1.05));
      const keyLight = new THREE.DirectionalLight(0xffffff, 1.7);
      keyLight.position.set(3.5, 4.5, 5.5);
      orientationScene.add(keyLight);
      const rimLight = new THREE.DirectionalLight(0xb8d8ff, 0.62);
      rimLight.position.set(-3, 2.5, -3);
      orientationScene.add(rimLight);

      orientationRoot = new THREE.Group();
      const orientationHeadModel = createOrientationHeadModel();
      orientationHeadModel.rotation.y = Math.PI;
      orientationRoot.add(orientationHeadModel);
      orientationScene.add(orientationRoot);
    }

    function syncOrientationGuide() {
      if (!orientationRoot || !orientationRenderer || !orientationScene || !orientationCamera) {
        return;
      }
      orientationRoot.rotation.copy(root.rotation);
      orientationRenderer.render(orientationScene, orientationCamera);
    }
    syncOrientationGuide();

    (["LH", "RH"] as Hemisphere[]).forEach((hemisphere) => {
      const geometry = createSurfaceGeometry(
        hemisphere,
        brainSurface,
        {
          visibleParcelIds,
          parcelIdentityById,
          selectedParcelId: staticSurfaceSelectedParcelIsOverlay ? staticSurfaceSelectedParcelId : "",
          focusNetworkIds: staticSurfaceFocusNetworkIds,
          semanticNetworkIds: staticSurfaceSemanticNetworkIds,
          overlayNetworkIds: staticSurfaceOverlayNetworkIds,
          functionHeatParcelById: staticSurfaceFunctionHeatParcelById,
          overlayParcelWeightById: staticSurfaceOverlayParcelWeightById,
          viewLevel,
        },
      );
      const cortexOpacity = cortexDisplayOpacity(
        surfaceOpacity,
        viewLevel,
        atlasStructureOpacities.cortex,
      );
      const mesh = new THREE.Mesh(
        geometry,
        createCortexSurfaceMaterial({
          opacity: cortexOpacity,
          surfaceOpacity,
          viewLevel,
        }),
      );
      mesh.renderOrder = atlasStructureRenderOrder("cortex", false);
      mesh.userData.hemisphere = hemisphere;
      root.add(mesh);
    });

    const staticSelectableMeshes: THREE.Mesh[] = [];
    staticSelectableMeshesRef.current = staticSelectableMeshes;
    dynamicSelectableMeshesRef.current = [];
    const parcelById = new Map(parcels.map((parcel) => [parcel.id, parcel]));

    root.add(
      createBrainstemSupportMesh({
        structureOpacity: atlasStructureOpacities.brainstem,
        surfaceOpacity,
        viewLevel,
      }),
    );

    if (cerebellumTemplateSurface || cerebellumSurface) {
      const activeCerebellum = staticActivePhysicalStructureIds.has("cerebellum");
      const cerebellumGroup = new THREE.Group();
      cerebellumGroup.renderOrder = activeCerebellum ? 18 : 8;
      const useTemplateCerebellum = Boolean(cerebellumTemplateSurface);

      if (useTemplateCerebellum && cerebellumTemplateSurface) {
        const cerebellumMesh = createCerebellumTemplateMesh({
          active: activeCerebellum,
          model: cerebellumTemplateSurface,
          structureOpacity: atlasStructureOpacities.cerebellum,
          surfaceOpacity,
          viewLevel,
        });
        cerebellumMesh.userData.physicalStructureId = "cerebellum";
        cerebellumMesh.userData.physicalLabel = "小脑";
        cerebellumMesh.userData.physicalEnglishLabel = "Cerebellum";
        cerebellumMesh.userData.physicalLaterality = "bilateral";
        cerebellumGroup.add(cerebellumMesh);
        if (usesPresentationVisualBaseline(viewLevel)) {
          const smoothSeal = createCerebellumTemplateSmoothSealMesh({
            active: activeCerebellum,
            model: cerebellumTemplateSurface,
            structureOpacity: atlasStructureOpacities.cerebellum,
            surfaceOpacity,
          });
          if (smoothSeal) {
            cerebellumGroup.add(smoothSeal);
          }
        }
        if (!usesPresentationVisualBaseline(viewLevel)) {
          cerebellumGroup.add(
            createCerebellumTemplateCapMesh({
              active: activeCerebellum,
              model: cerebellumTemplateSurface,
              structureOpacity: atlasStructureOpacities.cerebellum,
              surfaceOpacity,
              viewLevel,
            }),
          );
        }
        if (!usesPresentationVisualBaseline(viewLevel)) {
          cerebellumGroup.add(
            createCerebellumTemplateDetailMesh({
              active: activeCerebellum,
              model: cerebellumTemplateSurface,
              structureOpacity: atlasStructureOpacities.cerebellum,
              viewLevel,
            }),
          );
        }
      } else if (cerebellumSurface) {
        createCerebellumVolumeParts(cerebellumSurface.outerPoints).forEach((volumePart) => {
          cerebellumGroup.add(
            createCerebellumVolumeMesh({
              active: activeCerebellum,
              center: volumePart.center,
              color: volumePart.color,
              scale: volumePart.scale,
              structureOpacity: atlasStructureOpacities.cerebellum,
              surfaceOpacity,
              viewLevel,
            }),
          );
          if (!usesPresentationVisualBaseline(viewLevel)) {
            cerebellumGroup.add(
              createCerebellumVolumeMesh({
                active: activeCerebellum,
                center: volumePart.center,
                color: volumePart.color,
                rim: true,
                scale: volumePart.scale,
                structureOpacity: atlasStructureOpacities.cerebellum,
                surfaceOpacity,
                viewLevel,
              }),
            );
          }
        });
      }

      if (cerebellumSurface && !useTemplateCerebellum && !usesPresentationVisualBaseline(viewLevel)) {
        const outerPointTexture = createCerebellumPointTexture();
        const outerGeometry = createCerebellumPointGeometry(cerebellumSurface.outerPoints, "outer", activeCerebellum);
        const outerMaterial = new THREE.PointsMaterial({
          alphaTest: outerPointTexture ? 0.02 : 0,
          color: "#ffffff",
          depthTest: false,
          depthWrite: false,
          map: outerPointTexture,
          opacity:
            physicalStructureOpacity({
              active: activeCerebellum,
              multiplier: activeCerebellum ? 0.95 : 1.2,
              surfaceOpacity,
              viewLevel,
            }),
          size: activeCerebellum ? CEREBELLUM_OUTER_POINT_SIZE.active : CEREBELLUM_OUTER_POINT_SIZE.default,
          sizeAttenuation: true,
          transparent: true,
          vertexColors: true,
        });
        const outerPoints = new THREE.Points(outerGeometry, outerMaterial);
        outerPoints.renderOrder = activeCerebellum ? 17 : 7;
        cerebellumGroup.add(outerPoints);
      }

      if (cerebellumSurface && !usesPresentationVisualBaseline(viewLevel)) {
        const foldPointTexture = createCerebellumPointTexture();
        const foldGeometry = createCerebellumPointGeometry(cerebellumSurface.foldPoints, "fold", activeCerebellum);
        const foldMaterial = new THREE.PointsMaterial({
          alphaTest: foldPointTexture ? 0.02 : 0,
          color: "#ffffff",
          depthTest: false,
          depthWrite: false,
          map: foldPointTexture,
          opacity: physicalStructureOpacity({
            active: activeCerebellum,
            multiplier: cerebellumTemplateSurface
              ? activeCerebellum
                ? 0.62
                : 0.42
              : 0.58,
            surfaceOpacity,
            viewLevel,
          }),
          size: cerebellumTemplateSurface
            ? activeCerebellum
              ? 0.28
              : 0.18
            : activeCerebellum
              ? CEREBELLUM_FOLD_POINT_SIZE.active
              : CEREBELLUM_FOLD_POINT_SIZE.default,
          sizeAttenuation: true,
          transparent: true,
          vertexColors: true,
        });
        const foldPoints = new THREE.Points(foldGeometry, foldMaterial);
        foldPoints.renderOrder = activeCerebellum ? 18 : 8;
        cerebellumGroup.add(foldPoints);
      }

      root.add(cerebellumGroup);
    }

    if (subcorticalSurface) {
      const activeSubcortical = staticActivePhysicalStructureIds.has("basal-ganglia");
      const subcorticalGroup = new THREE.Group();
      subcorticalGroup.renderOrder = activeSubcortical ? 16 : 6;
      subcorticalSurface.structures.forEach((structure) => {
        if (usesPresentationVisualBaseline(viewLevel) && structure.renderGroup !== "basal-ganglia") {
          return;
        }
        if (
          !usesPresentationVisualBaseline(viewLevel) &&
          !activeSubcortical &&
          structure.renderGroup !== "basal-ganglia"
        ) {
          return;
        }
        const subcorticalMesh = createSubcorticalStructureMesh({
          active: activeSubcortical,
          structure,
          structureOpacity: atlasStructureOpacities.basalGanglia,
          surfaceOpacity,
          viewLevel,
        });
        subcorticalGroup.add(subcorticalMesh);
      });
      root.add(subcorticalGroup);
    }

    if (thalamusSurface) {
      const activeThalamus = staticActivePhysicalStructureIds.has("thalamus");
      const thalamusGroup = new THREE.Group();
      thalamusGroup.position.copy(THALAMUS_PRESENTATION_OFFSET);
      thalamusGroup.renderOrder = activeThalamus ? 15 : 5;
      thalamusSurface.structures.forEach((structure) => {
        const thalamusMesh = createThalamusStructureMesh({
          active: activeThalamus,
          structure,
          structureOpacity: atlasStructureOpacities.thalamus,
          surfaceOpacity,
          viewLevel,
        });
        thalamusGroup.add(thalamusMesh);
      });
      root.add(thalamusGroup);
    }

    if (leaddbsSubcorticalSurface && !usesPresentationVisualBaseline(viewLevel)) {
      const activeLeadBasalGanglia = staticActivePhysicalStructureIds.has("basal-ganglia");
      const activeLeadThalamus = staticActivePhysicalStructureIds.has("thalamus");
      const leadBasalGangliaGroup = new THREE.Group();
      const leadThalamusGroup = new THREE.Group();
      leadThalamusGroup.position.copy(THALAMUS_PRESENTATION_OFFSET);
      leadBasalGangliaGroup.renderOrder = activeLeadBasalGanglia ? 19 : 9;
      leadThalamusGroup.renderOrder = activeLeadThalamus ? 19 : 9;

      leaddbsSubcorticalSurface.structures.forEach((structure) => {
        const activeStructure =
          structure.structureId === "basal-ganglia" ? activeLeadBasalGanglia : activeLeadThalamus;
        if (!activeStructure) {
          return;
        }
        const leadMesh = createLeadDbsSubcorticalStructureMesh({
          active: activeStructure,
          structure,
          structureOpacity:
            structure.structureId === "basal-ganglia"
              ? atlasStructureOpacities.basalGanglia
              : atlasStructureOpacities.thalamus,
          surfaceOpacity,
          viewLevel,
        });
        if (structure.structureId === "basal-ganglia") {
          leadBasalGangliaGroup.add(leadMesh);
        } else {
          leadThalamusGroup.add(leadMesh);
        }
      });

      if (leadBasalGangliaGroup.children.length > 0) {
        root.add(leadBasalGangliaGroup);
      }
      if (leadThalamusGroup.children.length > 0) {
        root.add(leadThalamusGroup);
      }
    }

    if (mtlSurface) {
      const mtlGroup = new THREE.Group();
      const activeMtlGroup = Array.from(MTL_MESH_STRUCTURE_IDS).some((structureId) =>
        staticActivePhysicalStructureIds.has(structureId),
      );
      mtlGroup.renderOrder = activeMtlGroup ? 17 : 7;
      mtlSurface.structures.forEach((structure) => {
        const activeMtlStructure = staticActivePhysicalStructureIds.has(structure.structureId);
        if (
          usesPresentationVisualBaseline(viewLevel) &&
          structure.atlasId === "juelich-mtl-cytoarchitectonic"
        ) {
          return;
        }
        const mtlMesh = createMtlStructureMesh({
          active: activeMtlStructure,
          structure,
          structureOpacity: atlasStructureOpacities.limbic,
          surfaceOpacity,
          viewLevel,
        });
        mtlGroup.add(mtlMesh);
      });
      root.add(mtlGroup);
    }

    if (enableAshsAppFitPreview && ashsAppFitPreviewSurface && !usesPresentationVisualBaseline(viewLevel)) {
      const ashsPreviewGroup = new THREE.Group();
      const activeAshsPreviewGroup = Array.from(MTL_MESH_STRUCTURE_IDS).some((structureId) =>
        staticActivePhysicalStructureIds.has(structureId),
      );
      ashsPreviewGroup.renderOrder = activeAshsPreviewGroup ? 21 : 11;
      ashsAppFitPreviewSurface.structures.forEach((structure) => {
        const activeAshsStructure = staticActivePhysicalStructureIds.has(structure.structureId);
        const ashsMesh = createMtlStructureMesh({
          active: activeAshsStructure,
          appFitPreview: true,
          structure,
          structureOpacity: atlasStructureOpacities.ashsPreview,
          surfaceOpacity,
          viewLevel,
        });
        ashsPreviewGroup.add(ashsMesh);
        staticSelectableMeshes.push(ashsMesh);
      });
      root.add(ashsPreviewGroup);
    }

    physicalStructureRegistry.components.forEach((component) => {
      if (component.systemId === "cerebellum" && (cerebellumTemplateSurface || cerebellumSurface)) {
        return;
      }
      if (component.structureId === "basal-ganglia" && subcorticalSurface) {
        return;
      }
      if (component.structureId === "thalamus" && thalamusSurface) {
        return;
      }
      if (mtlSurface && MTL_MESH_STRUCTURE_IDS.has(component.structureId)) {
        return;
      }
      const system = physicalSystemById.get(component.systemId);
      if (!system) {
        return;
      }
      const physicalMesh = createPhysicalStructureMesh({
        active: staticActivePhysicalStructureIds.has(component.structureId),
        component,
        structureOpacity:
          atlasStructureOpacities[
            visualStructureKeyForPhysicalStructure({
              structureId: component.structureId,
              systemId: component.systemId,
            })
          ],
        surfaceOpacity,
        system,
        viewLevel,
      });
      root.add(physicalMesh);
    });

    const evidenceLayer = new THREE.Group();
    evidenceLayer.renderOrder = EVIDENCE_LAYER_RENDER_ORDER;
    evidenceLayer.userData.brainFunctionDynamicLayer = true;
    dynamicLayerRef.current = evidenceLayer;
    root.add(evidenceLayer);
    updateDynamicLayerTelemetry(mountRef.current, root, "stable");
    setStaticSceneVersion((version) => version + 1);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(140, 240, 420);
    const fillLight = new THREE.DirectionalLight(0xd7edf2, 0.72);
    fillLight.position.set(-260, -90, 180);
    scene.add(ambientLight, keyLight, fillLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const dragState = {
      active: false,
      moved: false,
      pointerId: -1,
      x: 0,
      y: 0,
    };
    const renderedSize = {
      height: 0,
      width: 0,
    };

    function applyResponsiveCameraDistance(width: number, height: number) {
      const baseDistance = responsiveCameraDistance(width, height, cameraFitScale);
      responsiveCameraBaseRef.current = baseDistance;
      camera.position.z = clamp(
        baseDistance * cameraZoomScaleRef.current,
        CAMERA_DISTANCE_RANGE.min,
        CAMERA_DISTANCE_RANGE.max,
      );
      camera.updateProjectionMatrix();
    }

    function resize() {
      const rect = mountElement.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      renderedSize.width = width;
      renderedSize.height = height;
      camera.aspect = width / height;
      applyResponsiveCameraDistance(width, height);
      renderer.setSize(width, height, false);

      if (orientationRenderer && orientationCamera && orientationMountElement) {
        const orientationRect = orientationMountElement.getBoundingClientRect();
        const orientationWidth = Math.max(1, Math.floor(orientationRect.width));
        const orientationHeight = Math.max(1, Math.floor(orientationRect.height));
        orientationCamera.aspect = orientationWidth / orientationHeight;
        orientationCamera.updateProjectionMatrix();
        orientationRenderer.setSize(orientationWidth, orientationHeight, false);
      }
    }

    function resizeIfNeeded() {
      const rect = mountElement.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      if (width !== renderedSize.width || height !== renderedSize.height) {
        resize();
      }
    }

    function selectFromPointer(event: PointerEvent) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      // Paper points are shown in透视 mode and picked before the opaque cortex.
      const teachingHit = raycaster.intersectObjects(teachingMeshesRef.current, false)[0];
      if (teachingHit) {
        onSelectTeachingPointRef.current?.(String(teachingHit.object.userData.teachingRecordId));
        return;
      }
      const selectableMeshes = [
        ...staticSelectableMeshesRef.current,
        ...dynamicSelectableMeshesRef.current,
      ];
      const intersection = raycaster.intersectObjects(selectableMeshes, false)[0];
      const parcelId = intersection?.object.userData.parcelId;
      const parcel = typeof parcelId === "string" ? parcelById.get(parcelId) : undefined;
      if (parcel) {
        onSelectParcelRef.current(parcel);
        onSelectOverlayNodeRef.current?.(stringFromUserData(intersection.object.userData.overlayNodeId) ?? null);
        return;
      }

      const physicalStructureId = intersection?.object.userData.physicalStructureId;
      if (typeof physicalStructureId === "string") {
        onSelectOverlayNodeRef.current?.(null);
        onSelectPhysicalStructureRef.current?.({
          atlasId: stringFromUserData(intersection.object.userData.physicalAtlasId),
          caption: stringFromUserData(intersection.object.userData.physicalCaption),
          caution: stringFromUserData(intersection.object.userData.physicalCaution),
          componentId: stringFromUserData(intersection.object.userData.physicalComponentId),
          englishLabel: stringFromUserData(intersection.object.userData.physicalEnglishLabel),
          label: stringFromUserData(intersection.object.userData.physicalLabel),
          laterality: stringFromUserData(intersection.object.userData.physicalLaterality),
          overlayNodeId: stringFromUserData(intersection.object.userData.physicalOverlayNodeId),
          precisionLabel: stringFromUserData(intersection.object.userData.physicalPrecisionLabel),
          sourceLabel: stringFromUserData(intersection.object.userData.physicalSourceLabel),
          structureId: physicalStructureId,
          surfaceStructureId: stringFromUserData(intersection.object.userData.physicalSurfaceStructureId),
        });
        return;
      }

      onSelectOverlayNodeRef.current?.(null);
      onClearSelectionRef.current?.();
    }

    function handlePointerDown(event: PointerEvent) {
      dragState.active = true;
      dragState.moved = false;
      dragState.pointerId = event.pointerId;
      dragState.x = event.clientX;
      dragState.y = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    }

    function handlePointerMove(event: PointerEvent) {
      if (!dragState.active || event.pointerId !== dragState.pointerId) {
        return;
      }

      const dx = event.clientX - dragState.x;
      const dy = event.clientY - dragState.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        dragState.moved = true;
      }
      root.rotation.y += dx * 0.006;
      root.rotation.x = clamp(root.rotation.x + dy * 0.005, -1.25, 1.05);
      dragState.x = event.clientX;
      dragState.y = event.clientY;
    }

    function handlePointerUp(event: PointerEvent) {
      if (event.pointerId !== dragState.pointerId) {
        return;
      }

      if (!dragState.moved) {
        selectFromPointer(event);
      }
      dragState.active = false;
      dragState.pointerId = -1;
      renderer.domElement.releasePointerCapture(event.pointerId);
    }

    function handleWheel(event: WheelEvent) {
      event.preventDefault();
      const nextCameraDistance = clamp(
        camera.position.z + event.deltaY * 0.38,
        CAMERA_DISTANCE_RANGE.min,
        CAMERA_DISTANCE_RANGE.max,
      );
      cameraZoomScaleRef.current = clamp(
        nextCameraDistance / responsiveCameraBaseRef.current,
        CAMERA_ZOOM_SCALE_RANGE.min,
        CAMERA_ZOOM_SCALE_RANGE.max,
      );
      camera.position.z = clamp(
        responsiveCameraBaseRef.current * cameraZoomScaleRef.current,
        CAMERA_DISTANCE_RANGE.min,
        CAMERA_DISTANCE_RANGE.max,
      );
      camera.updateProjectionMatrix();
    }

    renderer.domElement.addEventListener("pointerdown", handlePointerDown);
    renderer.domElement.addEventListener("pointermove", handlePointerMove);
    renderer.domElement.addEventListener("pointerup", handlePointerUp);
    renderer.domElement.addEventListener("pointercancel", handlePointerUp);
    renderer.domElement.addEventListener("wheel", handleWheel, { passive: false });

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mountElement);
    window.addEventListener("resize", resize);
    resize();

    const resizeInterval = window.setInterval(resizeIfNeeded, 250);
    let animationFrame = 0;
    let lastAnimationAt = window.performance.now();
    function animate() {
      const frameNow = window.performance.now();
      const frameDeltaSeconds = Math.min((frameNow - lastAnimationAt) / 1000, 0.05);
      lastAnimationAt = frameNow;
      resizeIfNeeded();
      const fadeTargets = fadeTargetsRef.current;
      if (shouldAnimateOverlayRef.current && fadeTargets.length > 0) {
        const rawProgress = clamp((frameNow - transitionStartedAtRef.current) / 860, 0, 1);
        const progress = rawProgress * rawProgress * (3 - 2 * rawProgress);
        fadeTargets.forEach(({ material, targetOpacity }) => {
          material.opacity = targetOpacity * progress;
        });
        const pulse = 1 + Math.sin(progress * Math.PI) * 0.07;
        pulseTargetsRef.current.forEach(({ object, baseScale }) => {
          object.scale.copy(baseScale).multiplyScalar(pulse);
        });
        if (rawProgress >= 1) {
          shouldAnimateOverlayRef.current = false;
        }
      }
      if (autoRotateRef.current && !dragState.active) {
        root.rotation.y += frameDeltaSeconds * 0.22;
      }
      syncOrientationGuide();
      renderer.render(scene, camera);
      animationFrame = window.requestAnimationFrame(animate);
    }
    animate();

    return () => {
      savedViewStateRef.current = {
        cameraZoomScale: cameraZoomScaleRef.current,
        rotation: {
          x: root.rotation.x,
          y: root.rotation.y,
          z: root.rotation.z,
        },
        viewLevel,
        viewResetKey: normalizedViewResetKey,
      };
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      window.clearInterval(resizeInterval);
      window.removeEventListener("resize", resize);
      renderer.domElement.removeEventListener("pointerdown", handlePointerDown);
      renderer.domElement.removeEventListener("pointermove", handlePointerMove);
      renderer.domElement.removeEventListener("pointerup", handlePointerUp);
      renderer.domElement.removeEventListener("pointercancel", handlePointerUp);
      renderer.domElement.removeEventListener("wheel", handleWheel);
      renderer.domElement.remove();
      orientationRenderer?.domElement.remove();
      if (dynamicLayerRef.current === evidenceLayer) {
        dynamicLayerRef.current = null;
      }
      if (mountRef.current) {
        delete mountRef.current.dataset.dynamicLayerCount;
        delete mountRef.current.dataset.dynamicLayerPhase;
      }
      staticSelectableMeshesRef.current = [];
      dynamicSelectableMeshesRef.current = [];
      fadeTargetsRef.current = [];
      pulseTargetsRef.current = [];
      shouldAnimateOverlayRef.current = false;
      const disposedGeometries = new Set<THREE.BufferGeometry>();
      scene.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          if (!disposedGeometries.has(object.geometry)) {
            object.geometry.dispose();
            disposedGeometries.add(object.geometry);
          }
          disposeMaterial(object.material);
        }
        if (object instanceof THREE.Sprite) {
          disposeMaterial(object.material);
        }
        if (object instanceof THREE.Line) {
          if (!disposedGeometries.has(object.geometry)) {
            object.geometry.dispose();
            disposedGeometries.add(object.geometry);
          }
          disposeMaterial(object.material);
        }
        if (object instanceof THREE.Points) {
          if (!disposedGeometries.has(object.geometry)) {
            object.geometry.dispose();
            disposedGeometries.add(object.geometry);
          }
          disposeMaterial(object.material);
        }
      });
      orientationScene?.traverse((object: THREE.Object3D) => {
        if (object instanceof THREE.Mesh) {
          if (!disposedGeometries.has(object.geometry)) {
            object.geometry.dispose();
            disposedGeometries.add(object.geometry);
          }
          disposeMaterial(object.material);
        }
      });
      renderer.dispose();
      orientationRenderer?.dispose();
    };
  }, [
    parcelIdentityById,
    parcels,
    surfaceOpacity,
    viewLevel,
    viewResetKey,
    visibleParcelIds,
    brainSurface,
    cerebellumSurface,
    cerebellumTemplateSurface,
    subcorticalSurface,
    thalamusSurface,
    leaddbsSubcorticalSurface,
    mtlSurface,
    ashsAppFitPreviewSurface,
    enableAshsAppFitPreview,
    preserveViewOnOverlayChange,
    cameraFitScale,
    atlasStructureOpacities,
    staticActivePhysicalStructureIds,
    staticSurfaceFunctionHeatParcelById,
    staticSurfaceFocusNetworkIds,
    staticSurfaceOverlayNetworkIds,
    staticSurfaceOverlayParcelWeightById,
    staticSurfaceSemanticNetworkIds,
    staticSurfaceSelectedParcelId,
    staticSurfaceSelectedParcelIsOverlay,
  ]);

  useEffect(() => {
    const root = teachingRootRef.current;
    if (!root || !teachingPaperPoints || !staticSceneVersion) return;
    const layer = new THREE.Group();
    const meshes: THREE.Mesh[] = [];
    teachingPaperPoints.forEach(point => {
      const selected = point.recordId === selectedTeachingPointId;
      // Position is already in viewer coordinates; never snap to a parcel or apply surfaceVector twice.
      const mesh = new THREE.Mesh(new THREE.SphereGeometry(selected ? 3.7 : 2.5, 16, 12), new THREE.MeshBasicMaterial({ color: selected ? '#e99313' : '#17899d', transparent: true, opacity: 1, depthTest: false, depthWrite: false }));
      mesh.position.set(point.viewerXYZ[0], point.viewerXYZ[1], point.viewerXYZ[2]);
      mesh.renderOrder = selected ? 101 : 100;
      mesh.userData.teachingRecordId = point.recordId;
      layer.add(mesh); meshes.push(mesh);
    });
    root.add(layer); teachingMeshesRef.current = meshes;
    return () => {
      layer.removeFromParent();
      meshes.forEach(mesh => { mesh.geometry.dispose(); (mesh.material as THREE.Material).dispose(); });
      if (teachingMeshesRef.current === meshes) teachingMeshesRef.current = [];
    };
  }, [teachingPaperPoints, selectedTeachingPointId, staticSceneVersion]);

  useEffect(() => {
    const previousLayer = dynamicLayerRef.current;
    const dynamicLayerParent = previousLayer?.parent;
    if (!previousLayer || !dynamicLayerParent || !brainSurface || staticSceneVersion === 0) {
      return undefined;
    }

    let cancelled = false;
    let warmupFrame = 0;
    let buildFrame = 0;
    let stagedLayer: THREE.Group | null = null;
    let committedLayer: THREE.Group | null = null;

    warmupFrame = window.requestAnimationFrame(() => {
      buildFrame = window.requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }

        const evidenceLayer = new THREE.Group();
        evidenceLayer.renderOrder = EVIDENCE_LAYER_RENDER_ORDER;
        evidenceLayer.userData.brainFunctionDynamicLayer = true;
        stagedLayer = evidenceLayer;
        const dynamicSelectableMeshes: THREE.Mesh[] = [];
        const nextFadeTargets: Array<{ material: THREE.Material; targetOpacity: number }> = [];
        const nextPulseTargets: Array<{ object: THREE.Object3D; baseScale: THREE.Vector3 }> = [];
        type DynamicAnimationScope = "network" | "selection";
        const dynamicNetworkKey = [
          viewLevel,
          transitionKey ?? "stable",
          overlayNodes
            .map((node) => [
              node.id,
              node.networkId,
              node.physicalStructureId ?? "",
              displayParcelIdsForOverlayNode(node).join(","),
              node.weight.toFixed(3),
            ].join(":"))
            .join("|"),
          overlayEdges
            .map((edge) => [edge.id, edge.sourceNodeId, edge.targetNodeId, edge.weight.toFixed(3)].join(":"))
            .join("|"),
          [...overlayParcelIds].sort().join(","),
          [...overlayNetworkIds].sort().join(","),
          showDetailPins ? "pins" : "no-pins",
          enableAshsAppFitPreview ? "ashs" : "standard",
        ].join("::");
        const dynamicSelectionKey = [
          selectedOverlayNodeId ?? "",
          selectedPhysicalNodeId ?? "",
          selectedPhysicalStructureId ?? "",
          selectedParcelId ?? "",
        ].join("::");
        const shouldCrossfadeNetworkLayer =
          (viewLevel === "paradigm_detail" || viewLevel === "function_overview") &&
          Boolean(transitionKey) &&
          dynamicNetworkKey !== lastDynamicNetworkKeyRef.current;
        const shouldAnimateNetwork = shouldCrossfadeNetworkLayer && overlayNodes.length > 0;
        const shouldAnimateSelection =
          !shouldAnimateNetwork &&
          overlayNodes.length > 0 &&
          dynamicSelectionKey !== lastDynamicSelectionKeyRef.current &&
          Boolean(
            selectedOverlayNodeId ||
              selectedPhysicalNodeId ||
              selectedPhysicalStructureId ||
              (selectedParcelId && selectedParcelIsOverlay),
          );
        const selectedAnimationScope: DynamicAnimationScope = shouldAnimateNetwork ? "network" : "selection";
        const isLightweightOverviewLayer = viewLevel === "function_overview";
        const tubeSegments = isLightweightOverviewLayer ? 24 : 48;
        const tubeRadialSegments = isLightweightOverviewLayer ? 6 : 8;
        const auraRadialSegments = isLightweightOverviewLayer ? 7 : 10;

        function registerFadeTarget(
          material: THREE.Material,
          targetOpacity: number,
          scope: DynamicAnimationScope = "network",
        ) {
          const shouldAnimate = scope === "network" ? shouldAnimateNetwork : shouldAnimateSelection;
          if (!shouldAnimate) {
            return;
          }
          material.transparent = true;
          material.opacity = 0;
          nextFadeTargets.push({ material, targetOpacity });
        }

        function registerPulseTarget(object: THREE.Object3D, scope: DynamicAnimationScope = "network") {
          const shouldAnimate = scope === "network" ? shouldAnimateNetwork : shouldAnimateSelection;
          if (!shouldAnimate) {
            return;
          }
          nextPulseTargets.push({ object, baseScale: object.scale.clone() });
        }

        const parcelById = new Map(parcels.map((parcel) => [parcel.id, parcel]));
        let pinGeometry: THREE.SphereGeometry | null = null;
        let selectedPinGeometry: THREE.SphereGeometry | null = null;
        let overlayAnchorGeometry: THREE.SphereGeometry | null = null;
        let subcorticalOverlayAnchorGeometry: THREE.OctahedronGeometry | null = null;
        let subcorticalOverlayGlowGeometry: THREE.SphereGeometry | null = null;
        const getPinGeometry = () => {
          pinGeometry ??= new THREE.SphereGeometry(viewLevel === "paradigm_detail" ? 2.2 : 1.9, 14, 9);
          return pinGeometry;
        };
        const getSelectedPinGeometry = () => {
          selectedPinGeometry ??= new THREE.SphereGeometry(viewLevel === "paradigm_detail" ? 3.8 : 3.4, 18, 12);
          return selectedPinGeometry;
        };
        const getOverlayAnchorGeometry = () => {
          overlayAnchorGeometry ??= new THREE.SphereGeometry(
            4.7,
            isLightweightOverviewLayer ? 14 : 18,
            isLightweightOverviewLayer ? 9 : 12,
          );
          return overlayAnchorGeometry;
        };
        const getSubcorticalOverlayAnchorGeometry = () => {
          subcorticalOverlayAnchorGeometry ??= new THREE.OctahedronGeometry(5.9, 1);
          return subcorticalOverlayAnchorGeometry;
        };
        const getSubcorticalOverlayGlowGeometry = () => {
          subcorticalOverlayGlowGeometry ??= new THREE.SphereGeometry(
            9.4,
            isLightweightOverviewLayer ? 18 : 24,
            isLightweightOverviewLayer ? 10 : 14,
          );
          return subcorticalOverlayGlowGeometry;
        };

        if (showDetailPins) {
          parcels.forEach((parcel) => {
            const surfaceParcel = brainSurface.parcels[parcel.id];
            if (!surfaceParcel) {
              return;
            }
            const networkColor = getNetworkColor(parcel.network);
            const membershipNetworks = parcel.networkMemberships.map((membership) => membership.network);
            const semantic = membershipNetworks.some((networkId) => semanticNetworkIds.has(networkId));
            const overlayNetwork = membershipNetworks.some((networkId) => overlayNetworkIds.has(networkId));
            const overlayParcel = overlayParcelIds.has(parcel.id);
            const overlay = overlayNetwork || overlayParcel;
            const focused = focusNetworkIds
              ? membershipNetworks.some((networkId) => focusNetworkIds.has(networkId))
              : false;
            const dimmed = Boolean(focusNetworkIds && !focused);
            const selected = parcel.id === selectedParcelId && selectedParcelIsOverlay;
            const overlayParcelWeight = overlayParcelWeightById.get(parcel.id) ?? 0;
            const opacity =
              viewLevel === "paradigm_detail"
                ? selected
                  ? 0.98
                    : overlayParcel
                      ? 0.22 + overlayParcelWeight * 0.76
                      : overlayNetwork
                        ? 0.025
                      : semantic
                        ? 0.018
                        : dimmed
                          ? 0.012
                          : 0.015
                : dimmed
                  ? 0.025
                  : selected
                    ? 0.94
                    : overlay
                      ? 0.72
                      : semantic
                        ? 0.5
                        : 0.1;
            const material = new THREE.MeshStandardMaterial({
              color: networkColor,
              depthTest: false,
              depthWrite: false,
              emissive:
                selected || (viewLevel === "paradigm_detail" && overlayParcel)
                  ? new THREE.Color(networkColor)
                  : new THREE.Color("#000000"),
              emissiveIntensity:
                selected
                  ? 0.24
                  : viewLevel === "paradigm_detail" && overlayParcel
                    ? 0.1 + overlayParcelWeight * 0.12
                    : 0,
              metalness: 0.04,
              opacity,
              roughness: 0.58,
              transparent: true,
            });
            const mesh = new THREE.Mesh(
              selected || (overlayParcel && overlayParcelWeight > 0.5)
                ? getSelectedPinGeometry()
                : getPinGeometry(),
              material,
            );
            mesh.position.copy(surfaceVector(displayParcelCentroid(surfaceParcel)));
            mesh.renderOrder = selected || overlayParcel ? 28 : overlay || semantic ? 24 : 12;
            mesh.userData.parcelId = parcel.id;
            if (selected || overlayParcel) {
              const pointAnimationScope = selected ? selectedAnimationScope : "network";
              registerFadeTarget(material, opacity, pointAnimationScope);
              registerPulseTarget(mesh, pointAnimationScope);
            }
            dynamicSelectableMeshes.push(mesh);
            evidenceLayer.add(mesh);
          });
        }

        const atlasAnchorByStructureId = new Map<string, THREE.Vector3>();
        if (thalamusSurface) {
          const thalamusAnchor = averageStructureCenters(thalamusSurface.structures);
          if (thalamusAnchor) {
            atlasAnchorByStructureId.set("thalamus", thalamusAnchor.add(THALAMUS_PRESENTATION_OFFSET));
          }
        }
        if (subcorticalSurface) {
          const basalGangliaAnchor = averageStructureCenters(
            subcorticalSurface.structures.filter((structure) => structure.renderGroup === "basal-ganglia"),
          );
          if (basalGangliaAnchor) {
            atlasAnchorByStructureId.set("basal-ganglia", basalGangliaAnchor);
          }
        }
        if (leaddbsSubcorticalSurface) {
          const leadBasalGangliaAnchor = averageStructureCenters(
            leaddbsSubcorticalSurface.structures.filter((structure) => structure.structureId === "basal-ganglia"),
          );
          if (leadBasalGangliaAnchor) {
            atlasAnchorByStructureId.set("basal-ganglia", leadBasalGangliaAnchor);
          }
          const leadThalamusAnchor = averageStructureCenters(
            leaddbsSubcorticalSurface.structures.filter((structure) => structure.structureId === "thalamus"),
          );
          if (leadThalamusAnchor) {
            atlasAnchorByStructureId.set("thalamus", leadThalamusAnchor.add(THALAMUS_PRESENTATION_OFFSET));
          }
        }
        if (mtlSurface) {
          MTL_MESH_STRUCTURE_IDS.forEach((structureId) => {
            const mtlAnchor = averageStructureCenters(
              mtlSurface.structures.filter((structure) => structure.structureId === structureId),
            );
            if (mtlAnchor) {
              atlasAnchorByStructureId.set(structureId, mtlAnchor);
            }
          });
        }
        if (enableAshsAppFitPreview && ashsAppFitPreviewSurface) {
          ["hippocampal-formation", "amygdala"].forEach((structureId) => {
            const ashsAnchor = averageStructureCenters(
              ashsAppFitPreviewSurface.structures.filter((structure) => structure.structureId === structureId),
            );
            if (ashsAnchor) {
              atlasAnchorByStructureId.set(structureId, ashsAnchor);
            }
          });
        }

        const overlayAnchorIds = new Set(overlayNodes.map((node) => node.networkId));
        const networkAnchors = surfaceAnchorVectors(parcels, overlayAnchorIds, brainSurface);
        const nodeAnchors = new Map<string, THREE.Vector3>();
        const emotionLayerActive = overlayNodes.some((node) => isEmotionModulationOverlayId(node.id));
        overlayNodes.forEach((node) => {
          const physicalAnchor = physicalStructureAnchor(node.physicalStructureId, atlasAnchorByStructureId);
          const parcelAnchor = surfaceAnchorForParcelIds(displayParcelIdsForOverlayNode(node), brainSurface);
          const anchor = physicalAnchor ?? parcelAnchor ?? networkAnchors[node.networkId];
          if (anchor) {
            nodeAnchors.set(node.id, anchor);
          }
        });
        const overlayNodeById = new Map(overlayNodes.map((node) => [node.id, node]));
        const renderedLabelKeys = new Set<string>();
        const selectedLabelKeys = new Set<string>();
        const selectedOverlayNodeForLabel = selectedOverlayNodeId ? overlayNodeById.get(selectedOverlayNodeId) : undefined;
        const selectedPhysicalNodeForLabel = selectedPhysicalNodeId ? overlayNodeById.get(selectedPhysicalNodeId) : undefined;
        const selectedParcelForLabel = parcelById.get(selectedParcelId);
        const selectedParcelOverlayNodeForLabel = selectedParcelForLabel
          ? overlayNodeForParcelId(overlayNodes, selectedParcelForLabel.id)
          : undefined;
        if (selectedOverlayNodeForLabel) {
          selectedLabelKeys.add(overlayNodeLabelKey(selectedOverlayNodeForLabel));
        }
        if (selectedPhysicalNodeForLabel) {
          selectedLabelKeys.add(overlayNodeLabelKey(selectedPhysicalNodeForLabel));
        }
        if (selectedParcelOverlayNodeForLabel) {
          selectedLabelKeys.add(overlayNodeLabelKey(selectedParcelOverlayNodeForLabel));
        } else if (selectedParcelForLabel) {
          selectedLabelKeys.add(`parcel:${selectedParcelForLabel.id}`);
        }
        overlayEdges.forEach((edge, edgeIndex) => {
          const source = nodeAnchors.get(edge.sourceNodeId);
          const target = nodeAnchors.get(edge.targetNodeId);
          if (!source || !target) {
            return;
          }

          const sourceNode = overlayNodeById.get(edge.sourceNodeId);
          const emotionEdge = isEmotionModulationOverlayId(edge.id);
          const foundationEdge = viewLevel === "function_overview" && edge.id.startsWith("foundation-");
          const foundationFlowEdge = foundationEdge && edge.id.startsWith("foundation-flow-");
          const foundationControlEdge = foundationEdge && edge.id.startsWith("foundation-control-");
          const edgeColor = edge.accentColor ?? sourceNode?.accentColor ?? "#1f4f5d";
          const curve = createOverlayCurve(source, target, edgeIndex);
          const edgeRadius =
            viewLevel === "paradigm_detail"
              ? (emotionEdge ? 0.12 : 0.08) + edge.weight * (emotionEdge ? 0.36 : 0.28)
              : foundationFlowEdge
                ? 0.13 + edge.weight * 0.3
              : foundationControlEdge
                ? 0.09 + edge.weight * 0.22
              : (emotionEdge ? 0.07 : 0.045) + edge.weight * (emotionEdge ? 0.3 : 0.24);
          const edgeOpacity =
            viewLevel === "paradigm_detail"
              ? (emotionEdge ? 0.26 : 0.18) + edge.weight * (emotionEdge ? 0.72 : 0.68)
              : foundationFlowEdge
                ? 0.26 + edge.weight * 0.5
              : foundationControlEdge
                ? 0.18 + edge.weight * 0.42
              : (emotionEdge ? 0.14 : 0.08) + edge.weight * (emotionEdge ? 0.68 : 0.64);
          const geometry = new THREE.TubeGeometry(curve, tubeSegments, edgeRadius, tubeRadialSegments, false);
          const material = new THREE.MeshStandardMaterial({
            color: edgeColor,
            depthTest: false,
            depthWrite: false,
            emissive: edgeColor,
            emissiveIntensity: emotionEdge
              ? 0.32
              : foundationFlowEdge
                ? 0.18
              : foundationControlEdge
                ? 0.12
              : viewLevel === "paradigm_detail"
                ? 0.13
                : 0.08,
            opacity: edgeOpacity,
            roughness: 0.42,
            transparent: true,
          });
          registerFadeTarget(material, edgeOpacity);
          const edgeMesh = new THREE.Mesh(geometry, material);
          edgeMesh.renderOrder = 30;
          evidenceLayer.add(edgeMesh);

          if (emotionEdge || foundationFlowEdge) {
            const auraOpacity = emotionEdge ? Math.min(0.22, edgeOpacity * 0.28) : Math.min(0.18, edgeOpacity * 0.22);
            const auraGeometry = new THREE.TubeGeometry(
              curve,
              tubeSegments,
              edgeRadius * (emotionEdge ? 2.8 : 2.2),
              auraRadialSegments,
              false,
            );
            const auraMaterial = new THREE.MeshStandardMaterial({
              color: edgeColor,
              depthTest: false,
              depthWrite: false,
              emissive: edgeColor,
              emissiveIntensity: emotionEdge ? 0.24 : 0.14,
              opacity: auraOpacity,
              roughness: 0.7,
              transparent: true,
            });
            registerFadeTarget(auraMaterial, auraOpacity);
            const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
            auraMesh.renderOrder = 29;
            evidenceLayer.add(auraMesh);
          }

          const endcapOpacity = foundationEdge
            ? 0.12 + edge.weight * 0.42
            : 0.08 + edge.weight * 0.46;
          const endcapMaterial = new THREE.MeshStandardMaterial({
            color: edgeColor,
            depthTest: false,
            depthWrite: false,
            opacity: endcapOpacity,
            transparent: true,
          });
          registerFadeTarget(endcapMaterial, endcapOpacity);
          const endcap = new THREE.Mesh(
            new THREE.SphereGeometry(
              1.05 + edge.weight * 0.6,
              isLightweightOverviewLayer ? 10 : 14,
              isLightweightOverviewLayer ? 6 : 8,
            ),
            endcapMaterial,
          );
          endcap.position.copy(target);
          endcap.renderOrder = 31;
          evidenceLayer.add(endcap);
        });

        overlayNodes.forEach((node, nodeIndex) => {
          const anchor = nodeAnchors.get(node.id);
          const network = networkById[node.networkId];
          if (!anchor || !network) {
            return;
          }
          const labelParcel = representativeParcelForOverlayNode(
            parcels,
            node,
            anchor,
            brainSurface,
          );
          const selectedPhysicalNode = Boolean(
            node.physicalStructureId &&
              (selectedPhysicalNodeId
                ? selectedPhysicalNodeId === node.id
                : selectedPhysicalStructureId === node.physicalStructureId),
          );
          const selectedCorticalOverlayNode = Boolean(
            !node.physicalStructureId && selectedOverlayNodeId === node.id,
          );
          const selectedOverlayPoint = selectedPhysicalNode || selectedCorticalOverlayNode;
          const nodeColor = node.accentColor ?? getNetworkColor(node.networkId);
          const emotionNode = isEmotionModulationOverlayId(node.id);
          const subcorticalOverlayNode = Boolean(node.physicalStructureId);
          const nodeAnimationScope = selectedOverlayPoint ? selectedAnimationScope : "network";

          if (subcorticalOverlayNode) {
            const glowOpacity = selectedOverlayPoint ? 0.26 : emotionNode ? 0.16 : 0.1;
            const glowMaterial = new THREE.MeshStandardMaterial({
              color: nodeColor,
              depthTest: false,
              depthWrite: false,
              emissive: nodeColor,
              emissiveIntensity: emotionNode ? 0.2 : 0.08,
              opacity: glowOpacity,
              roughness: 0.7,
              transparent: true,
            });
            registerFadeTarget(glowMaterial, glowOpacity, nodeAnimationScope);
            const glowMesh = new THREE.Mesh(getSubcorticalOverlayGlowGeometry(), glowMaterial);
            glowMesh.position.copy(anchor);
            glowMesh.renderOrder = selectedOverlayPoint ? 33 : 24;
            evidenceLayer.add(glowMesh);
          }

          const anchorMesh = new THREE.Mesh(
            subcorticalOverlayNode ? getSubcorticalOverlayAnchorGeometry() : getOverlayAnchorGeometry(),
            new THREE.MeshStandardMaterial({
              color: nodeColor,
              depthTest: false,
              depthWrite: false,
              emissive: nodeColor,
              emissiveIntensity: selectedOverlayPoint ? 0.34 : emotionNode ? 0.24 : 0.16,
              opacity: selectedOverlayPoint ? 0.98 : (emotionNode ? 0.18 : 0.12) + node.weight * 0.78,
              transparent: true,
            }),
          );
          registerFadeTarget(
            anchorMesh.material,
            selectedOverlayPoint ? 0.98 : (emotionNode ? 0.18 : 0.12) + node.weight * 0.78,
            nodeAnimationScope,
          );
          registerPulseTarget(anchorMesh, nodeAnimationScope);
          anchorMesh.position.copy(anchor);
          if (subcorticalOverlayNode) {
            anchorMesh.rotation.set(Math.PI / 4, Math.PI / 5, 0);
          }
          anchorMesh.renderOrder = selectedOverlayPoint ? 34 : 26;
          if (selectedOverlayPoint) {
            anchorMesh.scale.multiplyScalar(1.5);
          } else if (subcorticalOverlayNode) {
            anchorMesh.scale.multiplyScalar(1.12);
          }
          if (node.physicalStructureId) {
            anchorMesh.userData.physicalStructureId = node.physicalStructureId;
            anchorMesh.userData.physicalOverlayNodeId = node.id;
            anchorMesh.userData.physicalLabel = node.label;
            anchorMesh.userData.physicalEnglishLabel = physicalStructureLabel(node.physicalStructureId) ?? node.label;
            anchorMesh.userData.physicalCaption = node.caption;
          }
          if (!node.physicalStructureId && labelParcel) {
            anchorMesh.userData.parcelId = labelParcel.id;
            anchorMesh.userData.overlayNodeId = node.id;
          }
          if (node.physicalStructureId || labelParcel) {
            dynamicSelectableMeshes.push(anchorMesh);
          }
          evidenceLayer.add(anchorMesh);

          if (selectedOverlayPoint) {
            const selectedColor = nodeColor;
            const selectedVolumeMaterial = new THREE.MeshPhysicalMaterial({
              color: selectedColor,
              depthTest: false,
              depthWrite: false,
              emissive: selectedColor,
              emissiveIntensity: 0.08,
              opacity: 0.16,
              roughness: 0.62,
              transparent: true,
              transmission: 0.22,
            });
            registerFadeTarget(selectedVolumeMaterial, 0.16, selectedAnimationScope);
            const selectedVolume = new THREE.Mesh(
              new THREE.SphereGeometry(viewLevel === "paradigm_detail" ? 13.5 : 9.5, 32, 18),
              selectedVolumeMaterial,
            );
            selectedVolume.position.copy(anchor);
            selectedVolume.renderOrder = 23;
            evidenceLayer.add(selectedVolume);

            const selectedCoreMaterial = new THREE.MeshStandardMaterial({
              color: selectedColor,
              depthTest: false,
              depthWrite: false,
              emissive: selectedColor,
              emissiveIntensity: 0.26,
              opacity: 0.48,
              transparent: true,
            });
            registerFadeTarget(selectedCoreMaterial, 0.48, selectedAnimationScope);
            const selectedCore = new THREE.Mesh(new THREE.SphereGeometry(5.6, 22, 14), selectedCoreMaterial);
            selectedCore.position.copy(anchor);
            selectedCore.renderOrder = 35;
            evidenceLayer.add(selectedCore);

            const selectedLabel = createDescriptionSprite(node.caption, selectedColor);
            if (selectedLabel) {
              registerFadeTarget(selectedLabel.material, 1, selectedAnimationScope);
              anchorSpriteCornerToPoint(
                selectedLabel,
                NODE_LABEL_OFFSETS[node.id] ?? LABEL_OFFSETS[nodeIndex % LABEL_OFFSETS.length],
              );
              selectedLabel.position.copy(anchor);
              selectedLabel.renderOrder = 44;
              evidenceLayer.add(selectedLabel);
            }
          }

          const labelParcelIdentity = labelParcel ? parcelIdentityById.get(labelParcel.id) : undefined;
          const labelText = preferOverlayNodeLabels
            ? node.label
            : node.physicalStructureId
              ? physicalStructureLabel(node.physicalStructureId) ?? node.label
            : labelParcel
              ? getParcelCompactDisplayName(labelParcelIdentity, labelParcel)
              : network.label;
          const labelKey = overlayNodeLabelKey(node);
          if (renderedLabelKeys.has(labelKey)) {
            return;
          }
          renderedLabelKeys.add(labelKey);
          if (selectedLabelKeys.has(labelKey)) {
            return;
          }
          const labelGroup = overlayNodes.filter(
            (candidateNode) =>
              overlayNodeLabelKey(candidateNode) === labelKey && nodeAnchors.has(candidateNode.id),
          );
          const labelLines = preferOverlayNodeLabels
            ? uniqueLabelLines(labelGroup.map((candidateNode) => candidateNode.label))
            : [labelText];
          const rawLabelOpacity = Math.max(
            ...labelGroup.map((candidateNode) => 0.28 + candidateNode.weight * 0.72),
            0.28 + node.weight * 0.72,
          );
          const primaryLabelNode = labelGroup.reduce(
            (primaryNode, candidateNode) =>
              candidateNode.weight > primaryNode.weight ? candidateNode : primaryNode,
            node,
          );
          const labelGroupIsEmotionLayer = labelGroup.some((candidateNode) =>
            isEmotionModulationOverlayId(candidateNode.id),
          );
          const labelOpacity =
            emotionLayerActive && !labelGroupIsEmotionLayer
              ? Math.min(rawLabelOpacity, 0.18)
              : rawLabelOpacity;
          const labelColor = primaryLabelNode.accentColor ?? getNetworkColor(primaryLabelNode.networkId);
          const labelOffset =
            labelGroup.map((candidateNode) => NODE_LABEL_OFFSETS[candidateNode.id]).find(Boolean) ??
            LABEL_OFFSETS[nodeIndex % LABEL_OFFSETS.length];
          const isFoundationGlobalLabel = labelGroup.some((candidateNode) =>
            isFoundationGlobalOverviewNodeId(candidateNode.id),
          );
          if (!isFoundationGlobalLabel) {
            const label = createLabelSprite(
              labelLines.join("\n"),
              labelColor,
              labelOpacity,
            );
            if (label) {
              registerFadeTarget(label.material, labelOpacity);
              anchorSpriteCornerToPoint(label, labelOffset);
              label.position.copy(anchor);
              label.renderOrder = 40;
              evidenceLayer.add(label);
            }
          }
        });

        const selectedParcel = parcelById.get(selectedParcelId);
        const selectedSurfaceParcel = selectedParcel ? brainSurface.parcels[selectedParcel.id] : undefined;
        if (showDetailPins && selectedParcelIsOverlay && selectedParcel && selectedSurfaceParcel) {
          const selectedAnchor = surfaceVector(displayParcelCentroid(selectedSurfaceParcel));
          const selectedColor = getNetworkColor(selectedParcel.network);
          const selectedVolumeMaterial = new THREE.MeshPhysicalMaterial({
            color: selectedColor,
            depthTest: false,
            depthWrite: false,
            emissive: selectedColor,
            emissiveIntensity: 0.08,
            opacity: viewLevel === "paradigm_detail" ? 0.18 : 0.1,
            roughness: 0.62,
            transparent: true,
            transmission: 0.22,
          });
          registerFadeTarget(
            selectedVolumeMaterial,
            viewLevel === "paradigm_detail" ? 0.18 : 0.1,
            selectedAnimationScope,
          );
          const selectedVolume = new THREE.Mesh(
            new THREE.SphereGeometry(viewLevel === "paradigm_detail" ? 13.5 : 9.5, 32, 18),
            selectedVolumeMaterial,
          );
          selectedVolume.position.copy(selectedAnchor);
          selectedVolume.renderOrder = 23;
          evidenceLayer.add(selectedVolume);

          const selectedCoreMaterial = new THREE.MeshStandardMaterial({
            color: selectedColor,
            depthTest: false,
            depthWrite: false,
            emissive: selectedColor,
            emissiveIntensity: 0.22,
            opacity: 0.42,
            transparent: true,
          });
          registerFadeTarget(selectedCoreMaterial, 0.42, selectedAnimationScope);
          const selectedCore = new THREE.Mesh(new THREE.SphereGeometry(5.2, 22, 14), selectedCoreMaterial);
          selectedCore.position.copy(selectedAnchor);
          selectedCore.renderOrder = 29;
          evidenceLayer.add(selectedCore);

          const selectedParcelIdentity = parcelIdentityById.get(selectedParcel.id);
          const selectedOverlayNode = overlayNodeForParcelId(overlayNodes, selectedParcel.id);
          const selectedDescription =
            selectedOverlayNode?.caption ?? getParcelCompactDisplayName(selectedParcelIdentity, selectedParcel);
          const selectedParcelLabelKey = selectedOverlayNode ? overlayNodeLabelKey(selectedOverlayNode) : undefined;
          const shouldRenderSelectedParcelLabel =
            !selectedOverlayNodeId || !selectedParcelLabelKey || !selectedLabelKeys.has(selectedParcelLabelKey);
          const selectedLabel = shouldRenderSelectedParcelLabel
            ? createDescriptionSprite(selectedDescription, selectedColor)
            : null;
          if (selectedLabel) {
            registerFadeTarget(selectedLabel.material, 1, selectedAnimationScope);
            anchorSpriteCornerToPoint(
              selectedLabel,
              selectedOverlayNode ? NODE_LABEL_OFFSETS[selectedOverlayNode.id] ?? LABEL_OFFSETS[1] : LABEL_OFFSETS[1],
            );
            selectedLabel.position.copy(selectedAnchor);
            selectedLabel.renderOrder = 44;
            evidenceLayer.add(selectedLabel);
          }
        }

        if (shouldAnimateNetwork) {
          const registeredFadeMaterials = new Set(nextFadeTargets.map(({ material }) => material));
          evidenceLayer.traverse((object) => {
            objectMaterials(object).forEach((material) => {
              if (registeredFadeMaterials.has(material)) {
                return;
              }
              registeredFadeMaterials.add(material);
              material.transparent = true;
              const targetOpacity = material.opacity;
              material.opacity = 0;
              nextFadeTargets.push({ material, targetOpacity });
            });
          });
        }

        if (cancelled) {
          clearThreeGroup(evidenceLayer);
          return;
        }

        const layerToReplace = dynamicLayerRef.current;
        dynamicLayerParent.add(evidenceLayer);
        dynamicLayerRef.current = evidenceLayer;
        dynamicSelectableMeshesRef.current = dynamicSelectableMeshes;
        fadeTargetsRef.current = nextFadeTargets;
        pulseTargetsRef.current = nextPulseTargets;
        transitionStartedAtRef.current = window.performance.now();
        shouldAnimateOverlayRef.current = shouldAnimateNetwork || shouldAnimateSelection;
        lastDynamicNetworkKeyRef.current = dynamicNetworkKey;
        lastDynamicSelectionKeyRef.current = dynamicSelectionKey;
        committedLayer = evidenceLayer;

        if (layerToReplace && layerToReplace !== evidenceLayer) {
          if (shouldCrossfadeNetworkLayer) {
            updateDynamicLayerTelemetry(mountRef.current, dynamicLayerParent, "crossfading");
            fadeOutAndRemoveThreeGroup(layerToReplace, 820, () => {
              updateDynamicLayerTelemetry(mountRef.current, dynamicLayerParent, "stable");
            });
          } else {
            dynamicLayerParent.remove(layerToReplace);
            clearThreeGroupWhenIdle(layerToReplace);
            updateDynamicLayerTelemetry(mountRef.current, dynamicLayerParent, "stable");
          }
        } else {
          updateDynamicLayerTelemetry(mountRef.current, dynamicLayerParent, "stable");
        }
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(warmupFrame);
      window.cancelAnimationFrame(buildFrame);
      if (stagedLayer && stagedLayer !== committedLayer) {
        clearThreeGroup(stagedLayer);
      }
    };
  }, [
    staticSceneVersion,
    brainSurface,
    overlayNodes,
    overlayEdges,
    overlayNetworkIds,
    overlayParcelIds,
    overlayParcelWeightById,
    parcels,
    parcelIdentityById,
    networkById,
    viewLevel,
    selectedParcelId,
    selectedParcelIsOverlay,
    selectedOverlayNodeId,
    selectedPhysicalNodeId,
    selectedPhysicalStructureId,
    showDetailPins,
    focusNetworkIds,
    semanticNetworkIds,
    preferOverlayNodeLabels,
    transitionKey,
    thalamusSurface,
    subcorticalSurface,
    leaddbsSubcorticalSurface,
    mtlSurface,
    ashsAppFitPreviewSurface,
    enableAshsAppFitPreview,
  ]);

  return (
    <div className="three-map-shell" data-testid="atlas-three-view" data-atlas-shape={atlasSmoothed ? "smoothed" : "volume"}>
      <div className="three-map" ref={mountRef} />
      <div className="brain-orientation-guide" aria-label="同步旋转的人头朝向模型">
        <div className="brain-orientation-model" ref={orientationMountRef} />
      </div>
    </div>
  );
}
