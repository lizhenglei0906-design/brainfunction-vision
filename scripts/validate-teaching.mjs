import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const teaching=read('public/docs/teaching-review.json'), original=read('public/docs/coordinate-review.generated.json');
assert.equal(sha('public/docs/coordinate-review.generated.json'),'9296a93a2312d5cf38a3fa022c0aea447796793200160f9692161ffd63e90ba5');
const originals=new Map(original.rows.map(r=>[r.recordId,r]));
const mul=(m,v)=>m.map(r=>r.reduce((a,x,i)=>a+x*v[i],0));
function check(r){
 const o=originals.get(r.recordId);assert(o?.candidate,'Only existing reviewed candidates are eligible');
 assert.deepEqual(r.originalXYZ,o.originalXYZ);assert.equal(r.preciseDisplayAllowed,false);assert.equal(r.verifiedTargetXYZ,null);assert.equal(r.teachingDisplayAllowed,true);assert(r.uncertainty.length>20);assert(r.coverageNote);assert(r.notIndividualErrorBound);
 const view=mul(teaching.rasToViewer,[...r.approximateTargetXYZ,1]);assert(view.slice(0,3).every((v,i)=>Math.abs(v-r.viewerXYZ[i])<1e-8));
 if(r.sourceId.startsWith('jonides')){
  const back=mul(teaching.methods.lancasterFslForwardMatrix,[...r.approximateTargetXYZ,1]);
  assert(back.slice(0,3).every((v,i)=>Math.abs(v-(i===0?-r.originalXYZ[0]:r.originalXYZ[i]))<1e-8));
  assert(r.originalXYZ[0]<0&&r.approximateTargetXYZ[0]>0);assert(r.uncertainty.includes('本项目后加'));
 }else assert.deepEqual(r.approximateTargetXYZ,o.candidate.unroundedXYZ);
}
assert.equal(teaching.paperPoints.length,72);assert.equal(new Set(teaching.paperPoints.map(r=>r.recordId)).size,72);teaching.paperPoints.forEach(check);
assert.equal(teaching.paperPoints.filter(r=>r.regionCaution).length,10);assert.equal(teaching.paperPoints.filter(r=>r.labelAtApproximatePosition===0).length,23);
const jonides=teaching.paperPoints.find(r=>r.sourceId.startsWith('jonides'));
for(const mutate of [r=>{r.originalXYZ[0]*=-1},r=>{r.preciseDisplayAllowed=true},r=>{r.approximateTargetXYZ[0]*=-1},r=>{r.viewerXYZ[0]+=1},r=>{r.recordId='unreviewed'}]){
 const broken=structuredClone(jonides);mutate(broken);assert.throws(()=>check(broken));
}
const ns=read('src/data/paradigm-library/teaching-nodes.json');assert.equal(teaching.nodes.length,260);assert.equal(Object.keys(ns).length,260);
for(const n of teaching.nodes){assert.equal(n.teachingDecision,'RETAIN_SCHEMATIC');assert.equal(n.currentPlacementIsPublishedPeak,false);assert.equal(n.preciseDisplayAllowed,false);assert.equal(ns[n.nodeId].note,n.teachingNote);assert.equal(ns[n.nodeId].displayLabel,n.displayLabel);if(n.placementType==='PARCEL_SURFACE_ANCHOR')assert(n.actualVertexLabelMatches&&n.actualVertexPositionMatches);else assert(n.teachingNote.includes('整体或双侧'));}
assert.equal(sha('src/data/brain-surface/cerebellum-suitpy-fsl-pial.surface.json'),teaching.cerebellum.cerebellumSha256);
assert.equal(read('package.json').scripts.preview.includes('4197'),true);
console.log(JSON.stringify({status:'PASS',paperApproximatePoints:72,schematicNodes:260,regionCautions:10,zeroCorticalLabels:23,negativeControls:5,originalEvidenceUnchanged:true,precisionNotPromoted:true},null,2));
