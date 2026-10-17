import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=process.cwd();
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const lib=JSON.parse(read('src/data/research-evidence/local-paper-library.generated.json'));
const papers=JSON.parse(read('docs/paper-redistribution-records.json'));
const bundled=lib.sources.filter(s=>s.localTargets.length);
assert.equal(lib.sources.length,214);assert.equal(bundled.length,9);
assert.equal(lib.sources.filter(s=>!s.localTargets.length).length,205);
const targets=[];
assert.equal(lib.summary.canonicalReaderCount,9);assert.equal(lib.summary.canonicalPdfCount,0);assert.equal(lib.summary.localTargetCount,9);
const consumer=JSON.parse(read('src/data/research-evidence/evidence-consumer-interface.generated.json'));
const consumerSources=consumer.paradigms.flatMap(p=>p.sources);
assert.equal(consumer.summary.localReaderSourceCount,new Set(consumerSources.filter(s=>s.localReader).map(s=>s.sourceId)).size);
assert.equal(consumer.summary.paradigmWithLocalReaderCount,consumer.paradigms.filter(p=>p.sources.some(s=>s.localReader)).length);
for(const s of lib.sources)assert.equal(s.naming.hasCanonicalArticlePdf,false);
for(const s of lib.sources){
 assert(s.localTargets.length||s.externalFallbacks.some(x=>/^https?:\/\//.test(x.href)),`No access path: ${s.sourceId}`);
 for(const t of s.localTargets){assert(t.href.startsWith('/fulltext/'));assert(fs.existsSync(path.join(root,'public',t.href)));assert.equal(s.canonicalReader.href,t.href);targets.push(t.href);}
}
const aliasArrays = ['localTargets','localReadTargets'];
const aliasSingles = ['localReader','primaryReadTarget','canonicalReader','canonicalPdf','canonicalArticlePdf','preferredLocalTarget'];
let targetAliasChecks = 0;
function checkTarget(t, filename) {
 if (!t) return;
 assert.equal(typeof t,'object',`Invalid target in ${filename}`);
 assert(targets.includes(t.href),`Unbundled target in ${filename}: ${t.href}`);
 assert.equal(t.kind,'html');assert.equal(t.fileName,'article.html');
 assert.equal(t.path,'src/data/research-evidence'+t.href);
 targetAliasChecks++;
}
function walk(o,filename){
 if(Array.isArray(o)){o.forEach(x=>walk(x,filename));return;}if(!o||typeof o!=='object')return;
 for(const key of aliasArrays)if(key in o)o[key].forEach(t=>checkTarget(t,filename));
 for(const key of aliasSingles)if(key in o&&typeof o[key]!=='string')checkTarget(o[key],filename);
 if(o.sourceId){assert.notEqual(o.sourceId,'model-note-v0');if('hasLocalFulltext' in o)assert.equal(o.hasLocalFulltext,bundled.some(s=>s.sourceId===o.sourceId));}
 if(o.href?.startsWith('/src/'))assert.fail(`Legacy local URL in ${filename}: ${o.href}`);
 if(o.href?.startsWith('/fulltext/'))checkTarget(o,filename);
 Object.values(o).forEach(x=>walk(x,filename));
}
for(const p of files(path.join(root,'src/data')).filter(x=>x.endsWith('.json')))walk(JSON.parse(fs.readFileSync(p,'utf8')),p);
for(const p of files(path.join(root,'src'))){const s=fs.readFileSync(p,'utf8');assert(!s.includes('/Users/'),'Local user path leaked');assert(!/sk-[a-zA-Z0-9]{25,}/.test(s),'Credential-shaped value');}
const app=read('src/App.tsx');assert(!/ParentIntake|TrainingGame|ProgressHub|runtime-copy-edit/.test(app));
const viewer=read('src/components/atlas-viewer/AtlasViewer.tsx');assert(!/href=[^\n]*(progress-hub|parent-intake|training-game-library|working-memory)/.test(viewer));assert(!viewer.includes('<EvidenceReviewWorkbench'));assert(!viewer.includes('<TrainingSolutionCard'));
assert(!read('vite.config.ts').includes('middlewares'));// A source checkout has Git metadata; only browser-served metadata is forbidden.
assert(!fs.existsSync(path.join(root,'public','.git')));
assert.equal(files(path.join(root,'public/fulltext')).length,9);
for(const row of papers.filter(x=>x.decision==='included-CC-BY'))for(const rel of row.includedFiles){const s=read(rel);assert(s.includes('creativecommons.org/licenses/by/'));assert(!/<img\b|<script\b|<iframe\b/.test(s));assert(s.includes('Original article'));}
const story=read('src/content/paradigm-stories/paradigm-story-figures.ts');assert.equal((story.match(/^    paradigmId:/gm)||[]).length,57);assert.equal((story.match(/^    imageSrc:/gm)||[]).length,57);
const illustrations=JSON.parse(read('docs/story-illustration-records.json'));
assert.equal(illustrations.length,57);assert.equal(new Set(illustrations.map(x=>x.imageSrc)).size,57);
for(const item of illustrations){assert.equal(item.decision,'included-project-created-user-confirmed');assert(story.includes('imageSrc: '+JSON.stringify(item.imageSrc)));assert(fs.existsSync(path.join(root,'public',item.imageSrc)));assert(item.pixelWidth>0&&item.pixelHeight>0);assert.equal(item.openContentLicense,'CC-BY-4.0');assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root,'public',item.imageSrc))).digest('hex'),item.sha256);}

assert.equal(JSON.parse(read('src/data/study-intake/specialized-atlas-coordinate-lookup.generated.json')).lookupRows.length,0);
assert.equal(JSON.parse(read('src/data/study-intake/freesurfer-icbm2009c-marker-candidates.generated.json')).markerCandidates.length,0);
assert.equal(files(path.join(root,'src/data/brain-surface')).length,2);
assert(read('LICENSES/CBIG.txt').includes('Permission is hereby granted'));
assert(read('LICENSES/SUITPy.txt').includes('Permission is hereby granted'));
const identities=JSON.parse(read('src/data/parcel-identity/schaefer200-identity.seed.json'));
assert.equal(identities.entries.length,200);
assert(identities.entries.every(x=>x.resolvedRegionName.status==='source_label'));
assert(!/destrieux|surface_atlas_overlap/i.test(JSON.stringify(identities)));
await import('./validate-reading.mjs');
console.log(JSON.stringify({targetAliasChecks,status:'PASS',sourceRecords:214,bundledArticleSources:9,sourceLinkOnly:205,storyTexts:57,storyImages:57,brainMeshes:2,localTargetPathsChecked:targets.length,scopeAndPrivatePathChecks:'PASS'},null,2));
