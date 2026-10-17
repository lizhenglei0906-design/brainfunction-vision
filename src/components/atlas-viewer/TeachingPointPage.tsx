import { siteUrl } from "../../lib/siteUrl";
import { useEffect, useMemo, useState } from "react";
import atlasData from "../../data/brain-atlas/schaefer-200-7networks.json";
import taxonomyData from "../../data/brain-atlas/network-taxonomy.json";
import identityData from "../../data/parcel-identity/schaefer200-identity.seed.json";
import type { BrainAtlas, BrainNetworkDefinition, BrainNetworkTaxonomyFile, Yeo7Network } from "../../types/brainAtlas";
import type { ParcelIdentityRegistry } from "../../types/parcelIdentity";
import { withNetworkPalette } from "../../lib/networkPalette";
import { AtlasThreeView } from "./AtlasThreeView";
import type { ParadigmOverlayNode, ParadigmOverlayEdge } from "../../types/paradigmLibrary";
import "./TeachingPointPage.css";
interface PaperPoint {
  recordId: string; ordinal: number; sourceId: string; reportedRegion: string; originalXYZ: number[];
  approximateTargetXYZ: number[]; viewerXYZ: number[]; methodLabel: string; uncertainty: string;
  regionCaution: string | null; coverageNote: string; reportedContrast: string;
  sourceLocator: { table?: string; figure?: string; printedPage?: number; pdfPage?: number; clusterNumber?: number; rowWithinCluster?: number; rowWithinSubgroup?: number };
  alternativeApproximateTransforms: { method: string; distanceFromSelectedMm: number }[];
  teachingDisplayAllowed: boolean;
}
interface TeachingReview { paperPoints: PaperPoint[]; sources: { sourceId: string; title: string; url: string }[]; }
const atlas = atlasData as BrainAtlas;
const networks = Object.fromEntries((taxonomyData as BrainNetworkTaxonomyFile).networks.map(withNetworkPalette).map(n => [n.id, n])) as Record<string, BrainNetworkDefinition>;
const identities = new Map((identityData as unknown as ParcelIdentityRegistry).entries.map(p => [p.parcelId, p]));
const emptyNetworks = new Set<Yeo7Network>();
const emptyNodes: ParadigmOverlayNode[] = [];
const emptyEdges: ParadigmOverlayEdge[] = [];
const fmt = (xyz: number[]) => `[${xyz.map(n => Number(n.toFixed(1))).join(', ')}]`;
const shortName = (id: string) => ({ 'davis-2009-temporal-order-judgment': 'Davis 2009 · 时间顺序判断', 'fan-2005-ant-fmri': 'Fan 2005 · 注意网络', 'jonides-1993-spatial-wm-pet': 'Jonides 1993 · 空间工作记忆' }[id] ?? id);
export function TeachingPointPage() {
  const [data, setData] = useState<TeachingReview | null>(null);
  const [error, setError] = useState('');
  const [recordId, setRecordId] = useState(() => new URLSearchParams(location.search).get('record') ?? '');
  const [opacity, setOpacity] = useState(.32);
  const [showOthers, setShowOthers] = useState(true);
  const [reset, setReset] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    fetch(siteUrl('/docs/teaching-review.json'), { signal: abort.signal }).then(r => { if (!r.ok) throw new Error('教学点数据加载失败'); return r.json(); }).then(setData).catch(e => { if (!abort.signal.aborted) setError(String(e.message)); });
    return () => abort.abort();
  }, []);
  const approved = useMemo(() => data?.paperPoints.filter(p => p.teachingDisplayAllowed) ?? [], [data]);
  const selected = approved.find(p => p.recordId === recordId) ?? approved[0];
  const rows = useMemo(() => approved.filter(p => p.sourceId === selected?.sourceId), [approved, selected?.sourceId]);
  const displayed = useMemo(() => showOthers ? rows : selected ? [selected] : [], [rows, showOthers, selected]);
  useEffect(() => {
    if (selected) { const q = new URLSearchParams({ view: 'teaching-points', record: selected.recordId }); history.replaceState(null, '', siteUrl(`/?${q}`)); }
  }, [selected]);
  if (error) return <main className="teaching-page"><h1>{error}</h1><a href={siteUrl("/")}>返回脑图</a></main>;
  if (!selected || !data) return <main className="teaching-page">正在加载论文点…</main>;
  const source = data.sources.find(s => s.sourceId === selected.sourceId)!;
  const index = rows.findIndex(p => p.recordId === selected.recordId);
  const loc = selected.sourceLocator;
  const locator = [loc.table ? `表 ${loc.table}` : loc.figure ? `图 ${loc.figure}` : '', loc.printedPage ? `印刷页 ${loc.printedPage}` : '', loc.clusterNumber ? `簇 ${loc.clusterNumber}` : '', loc.rowWithinCluster || loc.rowWithinSubgroup ? `组内第 ${loc.rowWithinCluster ?? loc.rowWithinSubgroup} 行` : ''].filter(Boolean).join(' · ');
  return <main className="teaching-page">
    <header className="teaching-header"><div><a href={siteUrl("/")}>← 返回脑图与故事</a><h1>论文点位 · 教学近似</h1><p>原文报告点与主界面示意节点分开。保留来源，理解大致位置关系。</p></div><a href={siteUrl("/docs/model-license.html")} target="_blank" rel="noreferrer">模型来源与许可 ↗</a></header>
    <div className="teaching-layout">
      <section className="teaching-model" aria-label="近似论文点三维视图">
        <div className="teaching-toolbar"><label>论文 <select aria-label="选择论文" value={selected.sourceId} onChange={e => setRecordId(approved.find(p => p.sourceId === e.target.value)!.recordId)}>{[...new Set(approved.map(p => p.sourceId))].map(id => <option key={id} value={id}>{shortName(id)}</option>)}</select></label><button onClick={() => setReset(n => n + 1)}>复位视角</button></div>
        <div className="teaching-canvas">
          <AtlasThreeView parcels={atlas.parcels} parcelIdentityById={identities} networkById={networks} viewLevel="atlas_reference" focusNetworkIds={null} semanticNetworkIds={emptyNetworks} overlayNodes={emptyNodes} overlayEdges={emptyEdges} selectedParcelId="" surfaceOpacity={opacity} preserveViewOnOverlayChange viewResetKey={`teaching-${reset}`} onSelectParcel={() => {}} teachingPaperPoints={displayed} selectedTeachingPointId={selected.recordId} onSelectTeachingPoint={setRecordId} />
        </div>
        <div className="teaching-controls"><label>表面透明度 <input aria-label="表面透明度" type="range" min=".12" max=".8" step=".02" value={opacity} onChange={e => setOpacity(Number(e.target.value))} /></label><label><input type="checkbox" checked={showOthers} onChange={e => setShowOthers(e.target.checked)} />显示同篇其他点</label></div>
        <p className="teaching-hint">拖动旋转 · 滚轮缩放 · 点击圆点或下方条目选点。金色为当前点，青色为同篇其他点。圆点透视显示，深部点也可见；大小不代表显著性或误差半径。</p>
        <p className="teaching-hint">皮层采用未平滑的功能分区表面；小脑保留共同群体参考；脑干为教学示意。</p>
      </section>
      <aside className="teaching-detail" aria-live="polite"><span className="teaching-badge">近似位置 · {index + 1} / {rows.length}</span><h2>{selected.reportedRegion}</h2><p className="teaching-muted">上方为原文脑区名，不代表本项目确认了精确边界。</p><p className="teaching-coordinates"><strong>原文坐标</strong> {fmt(selected.originalXYZ)} mm<br/><strong>近似对照坐标</strong> {fmt(selected.approximateTargetXYZ)} mm</p><h3>{selected.methodLabel}</h3><p>{selected.uncertainty}</p>{selected.regionCaution && <p className="teaching-caution">{selected.regionCaution}</p>}<p>{selected.coverageNote}</p><p className="teaching-muted">{locator}<br/>{selected.reportedContrast}</p><a href={source.url} target="_blank" rel="noreferrer">{source.title} ↗</a><p><a href={siteUrl(`/docs/coordinate-evidence.html?source=${encodeURIComponent(selected.sourceId)}&record=${encodeURIComponent(selected.recordId)}`)} target="_blank" rel="noreferrer">原表证据与转换细节 ↗</a></p>{selected.alternativeApproximateTransforms.length > 0 && <details><summary>变换选择的敏感性</summary><p>与其他 Lancaster 变体相比，此点坐标差异最大 {Math.max(...selected.alternativeApproximateTransforms.map(a => a.distanceFromSelectedMm)).toFixed(2)} mm。这是备选公式差异，不是个体误差范围。</p><a href="https://brainmap.org/icbm2tal/" target="_blank" rel="noreferrer">转换方法来源 ↗</a></details>}<nav className="teaching-step"><button disabled={index === 0} onClick={() => setRecordId(rows[index - 1].recordId)}>上一点</button><button disabled={index === rows.length - 1} onClick={() => setRecordId(rows[index + 1].recordId)}>下一点</button></nav></aside>
    </div>
    <section className="teaching-list" aria-label="当前论文全部点位"><h2>{shortName(selected.sourceId)} · {rows.length} 个报告点</h2><div>{rows.map((p, i) => <button key={p.recordId} aria-pressed={p.recordId === selected.recordId} onClick={() => setRecordId(p.recordId)}><strong>{i + 1}. {p.reportedRegion}</strong><span>{fmt(p.originalXYZ)} · {p.regionCaution ? '有脑区名限制' : '近似对照'}</span></button>)}</div></section>
  </main>;
}
