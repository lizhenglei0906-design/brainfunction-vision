import * as THREE from "three";
import { SURFACE_OPACITY_RANGE } from "./AtlasThreeViewConfig";
import type { AtlasThreeViewLevel } from "./AtlasThreeView";

export type AtlasVisualStructureKey =
  | "ashsPreview"
  | "basalGanglia"
  | "brainstem"
  | "cerebellum"
  | "cortex"
  | "limbic"
  | "thalamus";

export type AtlasStructureOpacityConfig = Record<AtlasVisualStructureKey, number>;
type AtlasTintedStructureKey = Exclude<AtlasVisualStructureKey, "brainstem" | "cerebellum" | "cortex">;

type RenderOrderRule = {
  active: number;
  default: number;
};

export const DEFAULT_ATLAS_STRUCTURE_OPACITIES = {
  ashsPreview: 0.58,
  basalGanglia: 0.33,
  brainstem: 0.78,
  cerebellum: 0.83,
  cortex: 0.83,
  limbic: 0.55,
  thalamus: 0.54,
} as const satisfies AtlasStructureOpacityConfig;

export const ATLAS_STRUCTURE_VISUAL_RULES = {
  ashsPreview: {
    overviewActiveColor: "#9a5d99",
    overviewColor: "#8c648f",
    overviewOpacityScale: 0.64,
    renderOrder: { active: 21, default: 11 },
  },
  basalGanglia: {
    detailMultiplier: { active: 0.62, default: 0.14, fineActive: 0.45 },
    overviewActiveColor: "#3f7890",
    overviewColor: "#587789",
    overviewOpacityScale: 0.72,
    renderOrder: { active: 16, default: 6 },
  },
  brainstem: {
    color: "#5f7d98",
    emissive: "#edf2f8",
    opacity: {
      detailBase: 0.16,
      detailMax: 0.32,
      detailMin: 0.18,
      detailScale: 0.16,
      overviewBase: 0.18,
      overviewMax: 0.34,
      overviewMin: 0.16,
      overviewScale: 0.14,
    },
    renderOrder: { active: 8, default: 8 },
  },
  cerebellum: {
    color: { active: "#e4edf1", default: "#eff5f7" },
    detailLineColor: "#607986",
    emissive: "#f2f7f8",
    opacity: {
      capDetailActiveMultiplier: 0.5,
      capDetailDefaultMultiplier: 0.38,
      capOverviewActive: 0.46,
      capOverviewDefault: 0.36,
      detailLineActive: 0.075,
      detailLineDefault: 0.04,
      detailLineDetailActive: 0.13,
      detailLineDetailDefault: 0.08,
      sealActive: 0.18,
      sealDefault: 0.12,
      surfaceDetailActiveMultiplier: 0.86,
      surfaceDetailDefaultMultiplier: 0.72,
      surfaceOverviewActive: 0.92,
      surfaceOverviewDefault: 0.76,
      volumeOverviewBase: 0.48,
      volumeOverviewMax: 0.82,
      volumeOverviewMin: 0.5,
      volumeOverviewScale: 0.32,
    },
    renderOrder: { active: 9, default: 5 },
  },
  cortex: {
    color: { detail: "#f7fcfd", overview: "#edf4f2" },
    detailEmissive: 0.036,
    detailRoughness: 0.82,
    emissive: "#e7f3f4",
    lowOpacityHashThreshold: 0,
    opacity: {
      detailBase: 0.3,
      detailMin: 0.34,
      detailScale: 0.68,
      overviewBase: 0.28,
      overviewMax: 0.98,
      overviewMin: 0.3,
      overviewScale: 0.7,
    },
    overviewEmissive: 0.012,
    overviewRoughness: 0.88,
    renderOrder: { active: 2, default: 2 },
  },
  limbic: {
    detailMultiplier: {
      active: 0.58,
      appFitActive: 0.48,
      appFitDefault: 0.18,
      fineActive: 0.42,
      fineDefault: 0.16,
      default: 0.24,
    },
    overviewActiveColor: "#9d5aa0",
    overviewColor: "#8a668f",
    overviewOpacityScale: 0.78,
    renderOrder: { active: 17, default: 7 },
  },
  thalamus: {
    detailMultiplier: { active: 0.46, default: 0.22 },
    overviewActiveColor: "#c96f1d",
    overviewColor: "#9b6028",
    overviewOpacityScale: 0.62,
    renderOrder: { active: 15, default: 5 },
  },
} as const satisfies Record<AtlasVisualStructureKey, unknown>;

export const ATLAS_FINE_STRUCTURE_MATERIAL = {
  clearcoat: 0.2,
  clearcoatRoughness: 0.76,
  roughness: 0.8,
  specularIntensityActive: 0.055,
  specularIntensityDefault: 0.018,
  transmissionActive: 0.01,
  transmissionDefault: 0.004,
} as const;

const PHYSICAL_STRUCTURE_OPACITY_FACTOR = {
  active: 0.78,
  activeFine: 0.68,
  detail: 0.28,
  detailFine: 0.22,
  overview: 0.4,
  overviewFine: 0.32,
} as const;

const PHYSICAL_STRUCTURE_GLASS_TINT = new THREE.Color("#edf7f8");

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function renderOrderFor(rule: RenderOrderRule, active: boolean) {
  return active ? rule.active : rule.default;
}

function boundedOpacity(value: number | undefined) {
  return clamp(value ?? 1, 0, 1);
}

function directOverviewOpacity(surfaceOpacity: number, structureOpacity: number | undefined) {
  return clamp(surfaceOpacity * boundedOpacity(structureOpacity), 0, 1);
}

export function usesPresentationVisualBaseline(viewLevel: AtlasThreeViewLevel) {
  return viewLevel !== "atlas_reference";
}

function overviewInternalOpacity({
  active,
  max = active ? 0.48 : 0.34,
  min = active ? 0.28 : 0.18,
  scale = 1,
  structureOpacity,
  surfaceOpacity,
}: {
  active: boolean;
  max?: number;
  min?: number;
  scale?: number;
  structureOpacity?: number;
  surfaceOpacity: number;
}) {
  const base = (active ? 0.3 : 0.2) + surfaceOpacity * (active ? 0.18 : 0.14);
  return clamp(base * scale * boundedOpacity(structureOpacity), 0, max);
}

export function atlasStructureOpacity(
  opacities: Partial<AtlasStructureOpacityConfig> | undefined,
  structureKey: AtlasVisualStructureKey,
) {
  return boundedOpacity(opacities?.[structureKey] ?? DEFAULT_ATLAS_STRUCTURE_OPACITIES[structureKey]);
}

export function atlasStructureRenderOrder(structureKey: AtlasVisualStructureKey, active: boolean) {
  const rule = ATLAS_STRUCTURE_VISUAL_RULES[structureKey].renderOrder as RenderOrderRule;
  return renderOrderFor(rule, active);
}

export function physicalStructureOpacity({
  active,
  fine,
  multiplier = 1,
  structureOpacity = 1,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  fine?: boolean;
  multiplier?: number;
  structureOpacity?: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const baseOpacity = clamp(surfaceOpacity, SURFACE_OPACITY_RANGE.min, SURFACE_OPACITY_RANGE.max);
  let factor: number;
  if (active) {
    factor = fine ? PHYSICAL_STRUCTURE_OPACITY_FACTOR.activeFine : PHYSICAL_STRUCTURE_OPACITY_FACTOR.active;
  } else if (usesPresentationVisualBaseline(viewLevel)) {
    factor = fine ? PHYSICAL_STRUCTURE_OPACITY_FACTOR.overviewFine : PHYSICAL_STRUCTURE_OPACITY_FACTOR.overview;
  } else {
    factor = fine ? PHYSICAL_STRUCTURE_OPACITY_FACTOR.detailFine : PHYSICAL_STRUCTURE_OPACITY_FACTOR.detail;
  }
  const opacity = baseOpacity * factor * multiplier * boundedOpacity(structureOpacity);
  const paradigmContextMinimum =
    viewLevel === "paradigm_detail" && !active ? (fine ? 0.09 : 0.08) : 0;
  return clamp(Math.max(opacity, paradigmContextMinimum), 0, SURFACE_OPACITY_RANGE.max);
}

export function physicalStructureGlassColor(color: string, active: boolean, amount = 0) {
  return new THREE.Color(color).lerp(
    PHYSICAL_STRUCTURE_GLASS_TINT,
    clamp((active ? 0.34 : 0.52) + amount, 0, 0.82),
  );
}

export function atlasStructureMaterialColor(
  structureKey: AtlasTintedStructureKey,
  active: boolean,
  fallbackColor: string,
) {
  const rule = ATLAS_STRUCTURE_VISUAL_RULES[structureKey] as {
    overviewActiveColor?: string;
    overviewColor?: string;
  };
  return active ? rule.overviewActiveColor ?? fallbackColor : rule.overviewColor ?? fallbackColor;
}

export function cortexDisplayOpacity(
  surfaceOpacity: number,
  viewLevel: AtlasThreeViewLevel,
  structureOpacity = 1,
) {
  const { opacity } = ATLAS_STRUCTURE_VISUAL_RULES.cortex;
  if (usesPresentationVisualBaseline(viewLevel)) {
    return directOverviewOpacity(surfaceOpacity, structureOpacity);
  }
  return clamp(
    (opacity.detailBase + surfaceOpacity * opacity.detailScale) * boundedOpacity(structureOpacity),
    0,
    SURFACE_OPACITY_RANGE.max,
  );
}

export function cortexUsesHashedTransparency(opacity: number, viewLevel: AtlasThreeViewLevel) {
  return (
    usesPresentationVisualBaseline(viewLevel) &&
    opacity > 0 &&
    opacity <= ATLAS_STRUCTURE_VISUAL_RULES.cortex.lowOpacityHashThreshold
  );
}

export function overviewXrayOpacity({
  active,
  structureOpacity = 1,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  structureOpacity?: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  if (!usesPresentationVisualBaseline(viewLevel)) {
    return null;
  }
  return directOverviewOpacity(surfaceOpacity, structureOpacity);
}

export function createCortexSurfaceMaterial({
  opacity,
  surfaceOpacity,
  viewLevel,
}: {
  opacity: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const useHashedTransparency = cortexUsesHashedTransparency(opacity, viewLevel);
  const cortex = ATLAS_STRUCTURE_VISUAL_RULES.cortex;
  const opaque = opacity >= 0.995;
  const useOverviewBaseline = usesPresentationVisualBaseline(viewLevel);
  return new THREE.MeshStandardMaterial({
    alphaHash: useHashedTransparency,
    alphaToCoverage: useHashedTransparency,
    color: useOverviewBaseline ? cortex.color.overview : cortex.color.detail,
    depthTest: true,
    depthWrite: !useOverviewBaseline && opaque,
    dithering: true,
    emissive: cortex.emissive,
    emissiveIntensity: useOverviewBaseline ? cortex.overviewEmissive : cortex.detailEmissive,
    flatShading: false,
    metalness: 0,
    opacity,
    roughness: useOverviewBaseline ? cortex.overviewRoughness : cortex.detailRoughness,
    side: THREE.FrontSide,
    transparent: !opaque,
    vertexColors: true,
  });
}

export function createOverviewSoftStructureMaterial({
  active,
  color,
  opacityScale,
  structureKey,
  structureOpacity = 1,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  color: string;
  opacityScale?: number;
  structureKey: AtlasTintedStructureKey;
  structureOpacity?: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const rule = ATLAS_STRUCTURE_VISUAL_RULES[structureKey] as { overviewOpacityScale?: number };
  const structureColor = new THREE.Color(atlasStructureMaterialColor(structureKey, active, color));
  const baseColor = structureColor.lerp(
    new THREE.Color(active ? "#eef3f2" : "#f2f6f5"),
    active ? 0.16 : 0.22,
  );
  const baseOpacity = active
    ? clamp(0.28 + surfaceOpacity * 0.18, 0.32, 0.46)
    : clamp(0.21 + surfaceOpacity * 0.12, 0.24, 0.34);
  const opacity =
    usesPresentationVisualBaseline(viewLevel)
      ? overviewInternalOpacity({
          active,
          scale: rule.overviewOpacityScale ?? 1,
          structureOpacity,
          surfaceOpacity,
        })
      : clamp(
          baseOpacity * (opacityScale ?? rule.overviewOpacityScale ?? 1) * boundedOpacity(structureOpacity),
          0,
          SURFACE_OPACITY_RANGE.max,
        );
  const opaque = opacity >= 0.995;
  return new THREE.MeshBasicMaterial({
    color: baseColor,
    depthTest: true,
    depthWrite: opaque,
    opacity,
    side: THREE.DoubleSide,
    transparent: !opaque,
  });
}

export function createBrainstemSupportMaterial({
  structureOpacity = 1,
  surfaceOpacity,
}: {
  structureOpacity?: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const { brainstem } = ATLAS_STRUCTURE_VISUAL_RULES;
  // Use the same overall/structure visibility controls as the surrounding surfaces.
  // The additional body and peduncle scales are applied by the support mesh.
  const opacity = directOverviewOpacity(surfaceOpacity, structureOpacity);
  const opaque = opacity >= 0.995;
  return new THREE.MeshStandardMaterial({
    color: brainstem.color,
    // The sample labels this layer as schematic; retain it as a visible X-ray guide.
    depthTest: false,
    depthWrite: opaque,
    emissive: brainstem.emissive,
    emissiveIntensity: 0.01,
    metalness: 0,
    opacity,
    roughness: 0.86,
    transparent: !opaque,
  });
}

export function cerebellumSurfaceOpacity({
  active,
  structureOpacity = 1,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  structureOpacity?: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const { opacity } = ATLAS_STRUCTURE_VISUAL_RULES.cerebellum;
  if (usesPresentationVisualBaseline(viewLevel)) {
    const base = active ? opacity.surfaceOverviewActive : opacity.surfaceOverviewDefault;
    return clamp(base * (0.48 + surfaceOpacity * 0.42) * boundedOpacity(structureOpacity), 0, 0.72);
  }
  return physicalStructureOpacity({
    active,
    multiplier: active ? opacity.surfaceDetailActiveMultiplier : opacity.surfaceDetailDefaultMultiplier,
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
}

export function cerebellumCapOpacity({
  active,
  structureOpacity = 1,
  surfaceOpacity,
  viewLevel,
}: {
  active: boolean;
  structureOpacity?: number;
  surfaceOpacity: number;
  viewLevel: AtlasThreeViewLevel;
}) {
  const { opacity } = ATLAS_STRUCTURE_VISUAL_RULES.cerebellum;
  if (usesPresentationVisualBaseline(viewLevel)) {
    const base = active ? opacity.capOverviewActive : opacity.capOverviewDefault;
    return clamp(base * (0.42 + surfaceOpacity * 0.36) * boundedOpacity(structureOpacity), 0, 0.36);
  }
  return physicalStructureOpacity({
    active,
    multiplier: active ? opacity.capDetailActiveMultiplier : opacity.capDetailDefaultMultiplier,
    structureOpacity,
    surfaceOpacity,
    viewLevel,
  });
}

export function cerebellumVolumeOverviewOpacity(surfaceOpacity: number, structureOpacity = 1) {
  return clamp(
    (ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.opacity.volumeOverviewBase +
      surfaceOpacity * ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.opacity.volumeOverviewScale) *
      boundedOpacity(structureOpacity),
    ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.opacity.volumeOverviewMin * boundedOpacity(structureOpacity),
    ATLAS_STRUCTURE_VISUAL_RULES.cerebellum.opacity.volumeOverviewMax,
  );
}

export function cerebellumDetailLineOpacity(
  active: boolean,
  viewLevel: AtlasThreeViewLevel,
  structureOpacity = 1,
) {
  const { opacity } = ATLAS_STRUCTURE_VISUAL_RULES.cerebellum;
  const base =
    usesPresentationVisualBaseline(viewLevel)
      ? active
        ? opacity.detailLineActive
        : opacity.detailLineDefault
      : active
        ? opacity.detailLineDetailActive
        : opacity.detailLineDetailDefault;
  return base * 0.72 * boundedOpacity(structureOpacity);
}
