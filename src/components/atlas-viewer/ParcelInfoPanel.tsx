import type { BrainNetworkDefinition, BrainParcel } from "../../types/brainAtlas";
import {
  getParcelFunctionalTag,
  getParcelRegionLabel,
  getParcelRegionStatus,
  getPublicRegionDisplayLabel,
} from "../../lib/parcelNaming";
import { publicPresentationText } from "../../lib/presentationCopy";
import type { ParcelIdentityEntry } from "../../types/parcelIdentity";
import type { ParcelDomainMatch } from "../../types/researchEvidence";

interface ParcelInfoPanelProps {
  domainMatches: ParcelDomainMatch[];
  identity?: ParcelIdentityEntry;
  network: BrainNetworkDefinition;
  networkById: Record<string, BrainNetworkDefinition>;
  parcel: BrainParcel;
}

function confidenceLabel(confidence: ParcelDomainMatch["domain"]["confidence"]) {
  if (confidence === "strong_prior") {
    return "参考强度高";
  }
  if (confidence === "working_hypothesis") {
    return "待验证假设";
  }
  return "参考资料";
}

function hemisphereLabel(hemisphere: BrainParcel["hemisphere"]) {
  return hemisphere === "LH" ? "左半球" : "右半球";
}

function exactAnatomicalLabel(isExact: boolean) {
  return isExact ? "相对明确" : "混合边界";
}

function identitySourceLabel(source: ParcelIdentityEntry["identitySource"] | undefined) {
  if (source === "schaefer_source_label") {
    return "Schaefer 原始标签";
  }
  return "待确认";
}

function assignmentTypeLabel(assignmentType: string) {
  if (assignmentType === "primary") {
    return "主归属";
  }
  return assignmentType;
}

function atlasConfidenceLabel(confidence: string | undefined) {
  if (confidence === "high") {
    return "高可信";
  }
  if (confidence === "medium") {
    return "中等可信";
  }
  if (confidence === "low") {
    return "低可信";
  }
  return confidence ?? "待确认";
}

export function ParcelInfoPanel({
  domainMatches,
  identity,
  network,
  networkById,
  parcel,
}: ParcelInfoPanelProps) {
  const anatomicalProxy = identity?.anatomicalProxy;
  const resolvedRegionName = identity?.resolvedRegionName;
  const regionLabel = getParcelRegionLabel(identity, parcel);
  const functionalTag = getParcelFunctionalTag(identity);
  const regionStatus = getParcelRegionStatus(identity);

  return (
    <aside className="parcel-panel" aria-label="当前点位">
      <p className="eyebrow">当前点位</p>
      <h2>{regionLabel}</h2>

      <dl className="parcel-facts">
        <div>
          <dt>ROI</dt>
          <dd>{parcel.roi}</dd>
        </div>
        <div>
          <dt>半球</dt>
          <dd>{hemisphereLabel(parcel.hemisphere)}</dd>
        </div>
        <div>
          <dt>点位 ID</dt>
          <dd>{parcel.neutralLabel}</dd>
        </div>
        <div>
          <dt>原始图谱标签</dt>
          <dd>{parcel.sourceLabel}</dd>
        </div>
        <div>
          <dt>命名状态</dt>
          <dd>{regionStatus}</dd>
        </div>
        {functionalTag && (
          <div>
            <dt>功能标签</dt>
            <dd>{functionalTag}</dd>
          </div>
        )}
        {resolvedRegionName && (
          <div>
            <dt>解剖命名</dt>
            <dd>{resolvedRegionName.status === "source_label" ? "未提供精细解剖名称" : exactAnatomicalLabel(resolvedRegionName.isExactAnatomicalName)}</dd>
          </div>
        )}
        <div>
          <dt>主网络</dt>
          <dd>
            <span className="inline-swatch" style={{ backgroundColor: network.color }} />
            {network.label}
          </dd>
        </div>
        <div>
          <dt>分区代表坐标（MNI RAS，非论文峰值）</dt>
          <dd>{parcel.centroidMni.map((value) => value.toFixed(0)).join(", ")}</dd>
        </div>
        <div>
          <dt>教学显示坐标（非毫米）</dt>
          <dd>{parcel.displayPosition.map((value) => value.toFixed(2)).join(", ")}</dd>
        </div>
        <div>
          <dt>身份来源</dt>
          <dd>{identitySourceLabel(identity?.identitySource)}</dd>
        </div>
      </dl>

      {identity && anatomicalProxy && (
        <section className="membership-note" aria-label="点位身份映射">
          <div className="panel-title-row">
            <h3>点位身份</h3>
            <span>{atlasConfidenceLabel(resolvedRegionName?.confidence ?? anatomicalProxy.confidence)}</span>
          </div>
          <div className="domain-list">
            <article className="domain-item">
              <div>
                <strong>
                  {getPublicRegionDisplayLabel(resolvedRegionName?.label ?? anatomicalProxy.label)}
                </strong>
                <small>{resolvedRegionName?.englishLabel ?? anatomicalProxy.englishLabel}</small>
              </div>
              <p>{publicPresentationText(resolvedRegionName?.basis ?? anatomicalProxy.basis)}</p>
              <p>{publicPresentationText(resolvedRegionName?.caution ?? anatomicalProxy.caution)}</p>
              <div className="domain-meta">
                <span>{resolvedRegionName?.method ?? "proxy"}</span>
                <span>{resolvedRegionName?.sourceAtlas ?? "Schaefer"}</span>
                <span>标签族 {identity.schaefer.sourceFamily}</span>
                <span>{identity.schaefer.sourceIdentityConfidence}</span>
              </div>
            </article>
          </div>
        </section>
      )}

      <div className="network-note">
        <strong>{network.englishLabel}</strong>
        <p>{publicPresentationText(network.description)}</p>
      </div>

      <section className="membership-note" aria-label="网络归属">
        <div className="panel-title-row">
          <h3>网络归属</h3>
          <span>{parcel.networkMemberships.length}</span>
        </div>
        <div className="membership-list">
          {parcel.networkMemberships.map((membership) => {
            const membershipNetwork = networkById[membership.network];
            return (
              <article className="membership-item" key={`${membership.taxonomy}-${membership.network}`}>
                <div>
                  <span className="inline-swatch" style={{ backgroundColor: membershipNetwork.color }} />
                  <strong>{membershipNetwork.label}</strong>
                </div>
                <small>
                  {membership.taxonomy} · 权重 {membership.weight.toFixed(2)} ·{" "}
                  {assignmentTypeLabel(membership.assignmentType)}
                </small>
              </article>
            );
          })}
        </div>
      </section>

      <section className="domain-note" aria-label="功能参考">
        <div className="panel-title-row">
          <h3>功能参考</h3>
          <span>{domainMatches.length}</span>
        </div>
        <div className="domain-list">
          {domainMatches.map(({ domain, matchType }) => (
            <article className="domain-item" key={domain.id}>
              <div>
                <strong>{publicPresentationText(domain.label)}</strong>
                <small>{domain.englishLabel}</small>
              </div>
              <p>{publicPresentationText(domain.description)}</p>
              <div className="domain-meta">
                <span>{matchType === "primary_network" ? "网络参考" : "跨网络参考"}</span>
                <span>{confidenceLabel(domain.confidence)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </aside>
  );
}
