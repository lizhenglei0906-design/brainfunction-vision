import physicalStructuresData from "../../data/brain-structures/physical-structures.seed.json";
import regionCoverageData from "../../data/region-coverage/region-coverage-registry.seed.json";
import { publicPresentationText } from "../../lib/presentationCopy";
import type { PhysicalBrainStructureRegistry } from "../../types/physicalBrainStructures";
import type {
  RegionCoverageEntry,
  RegionCoverageRegistry,
  RegionCoverageStatus,
} from "../../types/regionCoverage";
import type { AtlasPhysicalStructureSelection } from "./AtlasThreeView";

const physicalStructureRegistry = physicalStructuresData as PhysicalBrainStructureRegistry;
const regionCoverageRegistry = regionCoverageData as RegionCoverageRegistry;

const physicalSystemById = new Map(
  physicalStructureRegistry.systems.map((system) => [system.id, system]),
);
const physicalStructureById = new Map(
  physicalStructureRegistry.structures.map((structure) => [structure.id, structure]),
);
const physicalComponentById = new Map(
  physicalStructureRegistry.components.map((component) => [component.id, component]),
);

const PHYSICAL_STRUCTURE_SUMMARY_BY_ID: Record<string, string> = {
  "hippocampal-formation":
    "长期记忆中负责情景、来源、联想绑定和新信息编码的核心内侧颞叶结构；当前用于说明记忆系统的位置关系。",
  amygdala:
    "参与情绪显著性、价值线索和记忆调制，适合在面孔、情绪和记忆联结类解释里作为边缘系统节点。",
  "entorhinal-parahippocampal-interface":
    "新信息进入海马系统、情景背景绑定和空间/场景线索整合的接口层，适合解释记忆线索如何进入长时记忆系统。",
  thalamus:
    "皮层外的中继和调节结构，常出现在警觉、注意定向、反应门控、停止控制、推理和部分计算任务的证据边界中。",
  "basal-ganglia":
    "尾状核、壳核、苍白球和伏隔核等皮层外环路，参与反应选择、抑制控制、反馈学习和习惯化自动化。",
  cerebellum:
    "参与运动定时、误差调节、速度控制，也会在注意、计算、表象操作等任务中作为调节性结构出现。",
};

function lateralityLabel(laterality: string | undefined) {
  if (laterality === "left") {
    return "左侧";
  }
  if (laterality === "right") {
    return "右侧";
  }
  if (laterality === "midline") {
    return "中线";
  }
  if (laterality === "bilateral") {
    return "双侧";
  }
  return "未标注";
}

function coverageStatusLabel(status: RegionCoverageStatus | undefined) {
  if (status === "specialized_atlas_reference") {
    return "已有专门图谱参考";
  }
  if (status === "needs_specialized_atlas") {
    return "需要专门图谱精修";
  }
  if (status === "outside_current_atlas") {
    return "Schaefer 外结构";
  }
  if (status === "parcel_proxy") {
    return "皮层点位代理";
  }
  if (status === "network_proxy") {
    return "网络层代理";
  }
  return "待确认";
}

function findFallbackComponent(selection: AtlasPhysicalStructureSelection) {
  if (selection.componentId) {
    return physicalComponentById.get(selection.componentId) ?? null;
  }
  return (
    physicalStructureRegistry.components.find(
      (component) =>
        component.structureId === selection.structureId &&
        (!selection.laterality || component.laterality === selection.laterality),
    ) ?? null
  );
}

function atlasSourceLabel(selection: AtlasPhysicalStructureSelection, coverage: RegionCoverageEntry | undefined) {
  if (selection.sourceLabel) {
    return selection.sourceLabel;
  }
  if (selection.atlasId?.includes("ashs-upennpmc-t1ext")) {
    return "ASHS T1ext app-fit preview";
  }
  if (selection.atlasId?.includes("juelich")) {
    return "Juelich MTL";
  }
  if (selection.atlasId?.includes("harvard-oxford")) {
    return "Harvard-Oxford";
  }
  if (selection.surfaceStructureId?.includes("harvard-oxford")) {
    return "Harvard-Oxford";
  }
  if (coverage?.coverageStatus === "specialized_atlas_reference") {
    return "专门图谱参考";
  }
  return "物理结构锚点";
}

function precisionStatusLabel(selection: AtlasPhysicalStructureSelection, coverage: RegionCoverageEntry | undefined) {
  if (selection.precisionLabel) {
    return selection.precisionLabel;
  }
  if (selection.atlasId?.includes("ashs-upennpmc-t1ext")) {
    return "Application-fit preview";
  }
  return coverageStatusLabel(coverage?.coverageStatus);
}

interface PhysicalStructureInfoPanelProps {
  selection: AtlasPhysicalStructureSelection;
}

export function PhysicalStructureInfoPanel({ selection }: PhysicalStructureInfoPanelProps) {
  const structure = physicalStructureById.get(selection.structureId);
  const component = findFallbackComponent(selection);
  const system = structure ? physicalSystemById.get(structure.systemId) : undefined;
  const coverage = structure?.relatedRegionCoverageId
    ? regionCoverageRegistry.regions.find((region) => region.id === structure.relatedRegionCoverageId)
    : undefined;
  const label = selection.label ?? component?.label ?? structure?.label ?? selection.structureId;
  const englishLabel =
    selection.englishLabel ?? component?.englishLabel ?? structure?.englishLabel ?? selection.surfaceStructureId;
  const summary =
    selection.caption ??
    PHYSICAL_STRUCTURE_SUMMARY_BY_ID[selection.structureId] ??
    coverage?.explanation ??
    structure?.caution ??
    "这是当前图谱中的皮层外辅助结构，用于补足 Schaefer200 无法覆盖的真实脑区位置。";
  const boundary = selection.caution ?? coverage?.caution ?? structure?.caution ?? system?.caution;

  return (
    <aside className="parcel-panel physical-structure-panel" aria-label="当前皮层外结构">
      <p className="eyebrow">当前结构</p>
      <h2>{label}</h2>

      <dl className="parcel-facts">
        <div>
          <dt>结构系统</dt>
          <dd>{system?.label ?? "皮层外结构"}</dd>
        </div>
        <div>
          <dt>侧别</dt>
          <dd>{lateralityLabel(selection.laterality ?? component?.laterality)}</dd>
        </div>
        <div>
          <dt>结构 ID</dt>
          <dd>{selection.structureId}</dd>
        </div>
        {selection.surfaceStructureId && (
          <div>
            <dt>图谱标签</dt>
            <dd>{selection.surfaceStructureId}</dd>
          </div>
        )}
        <div>
          <dt>图谱来源</dt>
          <dd>{atlasSourceLabel(selection, coverage)}</dd>
        </div>
        <div>
          <dt>精度状态</dt>
          <dd>{precisionStatusLabel(selection, coverage)}</dd>
        </div>
      </dl>

      <div className="network-note physical-summary">
        <strong>{englishLabel}</strong>
        <p>{publicPresentationText(summary)}</p>
      </div>

      {boundary && (
        <section className="membership-note" aria-label="证据边界">
          <div className="panel-title-row">
            <h3>证据边界</h3>
            <span>{precisionStatusLabel(selection, coverage)}</span>
          </div>
          <div className="domain-list">
            <article className="domain-item">
              <strong>{coverage?.label ?? structure?.label ?? label}</strong>
              <small>{coverage?.englishLabel ?? structure?.englishLabel ?? englishLabel}</small>
              <p>{publicPresentationText(boundary)}</p>
              {coverage?.nextAtlasNeed && <p>{publicPresentationText(coverage.nextAtlasNeed)}</p>}
            </article>
          </div>
        </section>
      )}
    </aside>
  );
}
