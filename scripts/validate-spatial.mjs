import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';

const read = (p) => fs.readFileSync(p, 'utf8');
const json = (p) => JSON.parse(read(p));
const sha = (p) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const manifest = json('docs/model-provenance.json');
assert.deepEqual(manifest, json('public/docs/model-provenance.json'));
for (const asset of manifest.assets) assert.equal(sha(asset.path), asset.sha256);
assert.equal(sha('src/data/brain-surface/schaefer200-mni-label-volume.surface.json'), 'e3ba7074b1f71ce7c827fd96096f71645d0ef4d5d4dc9df4c3497375c1716186');

const cerebellum = json('src/data/brain-surface/cerebellum-suitpy-fsl-pial.surface.json');
assert.equal(cerebellum.vertices.length, 28834);
assert.equal(cerebellum.faces.length, 56588);
assert(cerebellum.vertices.every(v => v.length === 3 && v.every(Number.isFinite)));
const used = new Set();
for (const face of cerebellum.faces) {
  assert.equal(face.length, 3);
  assert.equal(new Set(face).size, 3);
  for (const index of face) {
    assert(Number.isInteger(index) && index >= 0 && index < cerebellum.vertices.length);
    used.add(index);
  }
}
assert.equal(used.size, cerebellum.vertices.length);
assert.equal(cerebellum.generatedFrom.fittedTransformUsed, false);
assert.equal(cerebellum.validation.paperPeakRegistration, 'NOT_ESTABLISHED');
assert.equal(cerebellum.validation.fineLobularRegistration, 'NOT_ESTABLISHED');

const audit = json('src/data/paradigm-library/spatial-audit.json');
assert.deepEqual(audit, json('public/docs/display-spatial-audit.json'));
const paradigms = json('src/data/paradigm-library/foundational-paradigms.seed.json').paradigms;
const originalNodes = paradigms.flatMap(p => p.overlay.nodes.map(n => ({...n, paradigmId: p.id})));
const byId = new Map(audit.nodes.map(n => [n.nodeId, n]));
assert.equal(paradigms.length, 57);
assert.equal(originalNodes.length, 260);
assert.equal(byId.size, 260);
assert.equal(audit.nodes.filter(n => n.bindingLevel === 'CONVERGENCE_REGION_AGGREGATE').length, 217);
assert.equal(audit.nodes.filter(n => n.bindingLevel === 'PARADIGM_LEVEL_ONLY').length, 43);
for (const node of originalNodes) {
  const row = byId.get(node.id);
  assert(row, `Missing spatial audit: ${node.id}`);
  assert.equal(row.paradigmId, node.paradigmId);
  assert.equal(row.displayParcelId, node.displayParcelId ?? null);
  assert.equal(row.physicalStructureId, node.physicalStructureId ?? null);
  assert.equal(row.directPeakId, null);
  assert.equal(row.exactPaperLocalization, 'NOT_ESTABLISHED');
  assert(row.sourceIds.length > 0);
}
assert.equal(audit.nodes.filter(n => n.sourceAuditIssues.includes('F1_FRAME_FAN')).length, 16);
assert.equal(audit.nodes.filter(n => n.sourceAuditIssues.includes('F2_KIM_ARITHMETIC')).length, 17);
const viewer = read('src/components/atlas-viewer/AtlasViewer.tsx');
assert(!viewer.includes('return "点位已核"'));
assert(!viewer.includes('return "文献与点位已核"'));
assert(viewer.includes('spatialNodeNote(node.id)'));
assert(viewer.includes('/docs/spatial-validation.html'));
assert(fs.existsSync('public/docs/spatial-validation.html'));
assert.equal(json('src/data/display-ledger/evidence-display-ledger.generated.json').displayStatusLabels.production_reviewed, '文献与区域关联已审阅');
assert.equal(manifest.releaseReadiness, 'LOCAL_FIRST_RELEASE_PREPARATION_PENDING_OWNER_PUBLIC_ACTION');
console.log(JSON.stringify({status: 'PASS', scope: 'Asset integrity, full-node audit coverage and no precision promotion; not scientific registration proof', nodes: 260, regionalAggregate: 217, paradigmOnly: 43, directPeakBindings: 0, cerebellumVertices: used.size, cerebellumFaces: cerebellum.faces.length}, null, 2));
