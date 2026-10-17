import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {formatReportedStatistic} from '../public/docs/coordinate-statistics.js';
const read = p => fs.readFileSync(p, 'utf8');
const json = p => JSON.parse(read(p));
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const data = json('public/docs/coordinate-review.generated.json');
const nav = json('public/docs/coordinate-navigation.json');
assert.equal(hash('public/docs/coordinate-review.generated.json'), nav.dataSha256);
assert.equal(data.rows.length, 109);
assert.equal(data.summary.preciseDisplayCount, 0);
assert.equal(data.summary.currentDirectPeakPositionBindings, 0);
assert.equal(data.summary.releaseReady, false);
const recordMap = new Map(data.rows.map(r => [r.recordId, r]));
assert.equal(recordMap.size, 109);
// Expectations follow the checked original tables, including their printed scales.
const statisticExamples = new Map([
  ['rec-ba07f0c1f932fabd4ccab61c', 'ALE = 66.5 ×10⁻³；簇体积 29632 mm³'],
  ['rec-3e2bb9408057e50a14b28876', 'ALE = 0.0331；簇体积 17848 mm³'],
  ['rec-5c4c148ef8e30af75c9daded', 'Z = 5.36'],
  ['rec-f72b4b91faeef990070bd67a', 'Z = 3.78; P = 0.000; voxel extent = 1397'],
  ['rec-327b5ec2e646b15b5439c67f', 'Fig. 3 focus, P < 0.05 corrected'],
]);
for (const [id, expected] of statisticExamples) {
  assert.equal(formatReportedStatistic(recordMap.get(id).reportedStatistic), expected, id);
}
let scaledStatistics = 0, textualStatistics = 0;
for (const row of data.rows) {
  const stat = row.reportedStatistic;
  const rendered = formatReportedStatistic(stat);
  if (typeof stat === 'string') {
    assert.equal(rendered, stat, `Lost original statistic text: ${row.recordId}`);
    textualStatistics++;
  } else {
    assert(rendered.includes(String(stat.value)), `Lost numeric value: ${row.recordId}`);
    if (stat.scale === 'x10^-3') {
      assert(rendered.includes('×10⁻³'), `Lost ALE multiplier: ${row.recordId}`);
      scaledStatistics++;
    } else {
      assert(!rendered.includes('×10⁻³'), `Added incorrect multiplier: ${row.recordId}`);
    }
    if (stat.clusterVolumeMm3 != null) assert(rendered.includes(`${stat.clusterVolumeMm3} mm³`));
  }
}
assert.equal(scaledStatistics, 19);
assert.equal(textualStatistics, 30);
assert.equal(formatReportedStatistic(null), '统计量见原表');
assert.equal(formatReportedStatistic({type:'ALE', value:0, scale:'unscaled', clusterVolumeMm3:0}), 'ALE = 0；簇体积 0 mm³');
assert.equal(formatReportedStatistic({type:'T', value:3.5, scale:'reported custom scale'}), 'T = 3.5（原表倍率：reported custom scale）');
for (const r of data.rows) {
  assert.equal(r.sourceRowStatus, 'SOURCE_ROW_VERIFIED');
  assert.equal(r.preciseDisplayAllowed, false);
  assert.equal(r.verifiedDisplayXYZ, null);
  assert.equal(r.targetReferenceStatus, 'TARGET_REFERENCE_NOT_ESTABLISHED');
  assert(r.sourceRowLocator.pdfPage > 0);
  assert(r.originalXYZ.every(Number.isFinite));
  if (r.candidate) { assert.equal(r.candidate.targetFrameId, null); assert.equal(r.candidate.preciseDisplayAllowed, false); }
}
const paradigms = json('src/data/paradigm-library/foundational-paradigms.seed.json').paradigms;
const nodes = paradigms.flatMap(p => p.overlay.nodes.map(n => ({...n, paradigmId:p.id})));
assert.equal(nodes.length, 260);
assert.equal(nav.nodes.length, 260);
for (const n of nodes) {
  const a = data.nodeAssociations.find(a => a.nodeId === n.id);
  assert(a);
  assert.equal(a.paradigmId, n.paradigmId);
  assert.equal(a.displayParcelId, n.displayParcelId ?? null);
  assert.equal(a.physicalStructureId, n.physicalStructureId ?? null);
  assert.equal(a.networkId, n.networkId);
  assert.equal(a.publishedPeakRecordId, null);
  assert.equal(a.currentPlacementIsPublishedPeak, false);
}
assert.equal(data.peakAssociationProposals.length, 5);
assert.equal(data.peakAssociationProposals.flatMap(p => p.sourceRecordIds).length, 10);
for (const p of data.peakAssociationProposals) {
  assert(nodes.some(n => n.id === p.nodeId && n.paradigmId === 'temporal-order-judgment'));
  assert.equal(p.currentPlacementMustRemainSeparate, true);
  assert.equal(p.noNearestParcelInferenceUsed, true);
  for (const id of p.sourceRecordIds) assert.equal(recordMap.get(id).sourceId, p.sourceId);
}
assert.equal(data.historicalArithmeticCorrections.length, 4);
for (const correction of data.historicalArithmeticCorrections) {
  assert(recordMap.has(correction.originalRecordId));
  assert.equal(correction.preciseDisplayAllowed, false);
  assert.equal(correction.sourceScientificRouteSelected, false);
  assert.notDeepEqual(correction.beforeXYZ, correction.repairedMirrorXYZ);
}
for (const file of ['public/docs/coordinate-review.generated.json','public/docs/coordinate-navigation.json']) {
  assert(!/\/Users\/|file:\/\/|data:image|article\.pdf/.test(read(file)), `Internal evidence leaked: ${file}`);
}
for (const file of ['coordinate-evidence.html','coordinate-evidence.css','coordinate-evidence.js','coordinate-statistics.js']) assert(fs.existsSync(`public/docs/${file}`));
const viewer = read('src/components/atlas-viewer/AtlasViewer.tsx');
assert(viewer.includes('/docs/coordinate-evidence.html?node=${encodeURIComponent(node.id)}'));
const js = read('public/docs/coordinate-evidence.js');
assert(js.includes('PARADIGM_REFERENCE_ONLY'));
assert(!js.includes('nearest'));
const provenance = json('docs/model-provenance.json');
assert.equal(provenance.coordinateRepair.dataSha256, nav.dataSha256);
console.log(JSON.stringify({status:'PASS',verifiedOriginalRows:109,reportedStatisticsPreserved:109,scaledStatistics,textualStatistics,restrictedCandidates:72,correctedArithmeticRows:4,nodeAssociations:260,proposedEvidenceLinks:10,preciseDisplayPoints:0,publicEvidencePrivacy:'PASS',scope:'Provenance consumption and unchanged anchors; not scientific registration proof'},null,2));
