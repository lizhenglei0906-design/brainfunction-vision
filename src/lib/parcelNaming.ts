import type { BrainParcel } from "../types/brainAtlas";
import type { ParcelIdentityEntry } from "../types/parcelIdentity";

const CONFIDENCE_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export function getPublicRegionDisplayLabel(label: string | undefined) {
  if (!label) {
    return undefined;
  }
  const displayLabel = label
    .replace(/候选分区/g, "")
    .replace(/功能分区/g, "功能区")
    .replace(/候选区/g, "")
    .replace(/候选/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return displayLabel.length > 0 ? displayLabel : undefined;
}

function confidenceLabel(confidence: string) {
  return CONFIDENCE_LABELS[confidence] ?? confidence;
}

export function getParcelRegionLabel(identity: ParcelIdentityEntry | undefined, parcel: BrainParcel) {
  return getPublicRegionDisplayLabel(identity?.resolvedRegionName.label ?? identity?.anatomicalProxy.label) ?? parcel.sourceLabel;
}

export function getParcelRegionShortLabel(identity: ParcelIdentityEntry | undefined, parcel: BrainParcel) {
  return getPublicRegionDisplayLabel(identity?.resolvedRegionName.shortLabel ?? identity?.anatomicalProxy.label) ?? parcel.sourceLabel;
}

export function getParcelRegionStatus(identity: ParcelIdentityEntry | undefined) {
  if (!identity) {
    return "待命名";
  }
  if (identity.resolvedRegionName.status === "source_label") {
    return "官方功能分区标签";
  }
  if (identity.resolvedRegionName.status === "atlas_overlap") {
    return `图谱重叠 · ${confidenceLabel(identity.resolvedRegionName.confidence)}`;
  }
  return `待重叠复核 · ${confidenceLabel(identity.resolvedRegionName.confidence)}`;
}

export function getParcelFunctionalTag(identity: ParcelIdentityEntry | undefined) {
  if (!identity) {
    return undefined;
  }
  return getPublicRegionDisplayLabel(identity.anatomicalProxy.label);
}

export function getParcelCompactDisplayName(identity: ParcelIdentityEntry | undefined, parcel: BrainParcel) {
  const regionLabel = getParcelRegionShortLabel(identity, parcel);
  const functionalTag = getParcelFunctionalTag(identity);
  if (!functionalTag || functionalTag === regionLabel) {
    return regionLabel;
  }
  return `${regionLabel} · ${functionalTag}`;
}

export function getParcelSearchText(
  parcel: BrainParcel,
  identity: ParcelIdentityEntry | undefined,
  extraTerms: Array<string | undefined>,
) {
  return [
    parcel.id,
    parcel.roi.toString(),
    `roi ${parcel.roi}`,
    `parcel ${parcel.roi}`,
    parcel.neutralLabel,
    parcel.displayLabel,
    parcel.sourceLabel,
    parcel.parcelShortName,
    parcel.hemisphere,
    identity?.resolvedRegionName.label,
    identity?.resolvedRegionName.englishLabel,
    identity?.resolvedRegionName.shortLabel,
    identity?.resolvedRegionName.status,
    identity?.resolvedRegionName.sourceAtlas,
    ...(identity?.resolvedRegionName.aliases ?? []),
    identity?.anatomicalProxy.label,
    identity?.anatomicalProxy.englishLabel,
    ...(identity?.anatomicalProxy.aliases ?? []),
    ...extraTerms,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
