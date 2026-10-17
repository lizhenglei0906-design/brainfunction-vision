import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=process.cwd(), base='/brainfunction-vision/', dist=path.join(root,'dist');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const json=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert(fs.readFileSync('vite.config.ts','utf8').includes('base: "'+base+'"'));
const staticFiles=files(dist);let resolvedLinks=0;
function localFile(href,from){
 if(!href||/^(?:https?:|mailto:|data:|tel:|#|\/\/)/i.test(href))return;
 const url=new URL(href,'https://example.invalid'+base+path.relative(dist,from).split(path.sep).join('/'));
 assert(url.pathname.startsWith(base),`Escaped Pages base: ${href} from ${from}`);
 const rel=decodeURIComponent(url.pathname.slice(base.length));
 const p=path.join(dist,rel||'index.html');assert(fs.existsSync(p),`Missing resource: ${url.pathname}`);
 assert(fs.statSync(p).isFile()||fs.existsSync(path.join(p,'index.html')));resolvedLinks++;
}
for(const p of staticFiles){
 if(p.endsWith('.html'))for(const m of fs.readFileSync(p,'utf8').matchAll(/\b(?:href|src)=["']([^"']+)["']/g))localFile(m[1],p);
 if(p.endsWith('.css'))for(const m of fs.readFileSync(p,'utf8').matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g))localFile(m[1],p);
}
for(const rel of ['LICENSE','CONTENT_LICENSE.md','THIRD_PARTY_NOTICES.md','CITATION.cff','LICENSES/CC-BY-4.0.txt','LICENSES/CBIG.txt','LICENSES/SUITPy.txt','docs/license-map.json','docs/paper-redistribution-records.json','docs/project-license.html'])assert(fs.existsSync(path.join(dist,rel)),`Missing public license: ${rel}`);
assert(!fs.existsSync('LICENSE.proposed.md'));
assert(fs.readFileSync('LICENSE','utf8').includes('Copyright (c) 2026 lizhenglei0906-design'));
const licenseMap=json('docs/license-map.json'), mapped=new Set(licenseMap.files.map(x=>x.path));
const sourceFiles=files(root).filter(p=>!path.relative(root,p).split(path.sep).some(x=>['node_modules','dist','.vite-cache','.git'].includes(x))&&!p.endsWith('.tsbuildinfo'));
for(const p of sourceFiles)assert(mapped.has(path.relative(root,p).split(path.sep).join('/')),`Unmapped license path: ${p}`);
assert.equal(licenseMap.grantBoundary,'Only project-owned expression; external works and scientific facts are not exclusively appropriated or relicensed');
assert.equal(sha('docs/license-map.json'),sha('public/docs/license-map.json'));
const outfile=path.join(root,'node_modules/.tmp/pages-runtime-check.mjs');fs.mkdirSync(path.dirname(outfile),{recursive:true});
await build({stdin:{contents:'export {PaperReaderPage} from "./src/components/atlas-viewer/PaperReaderPage";export {AtlasViewer} from "./src/components/atlas-viewer/AtlasViewer";export {siteUrl} from "./src/lib/siteUrl";',resolveDir:root},outfile,bundle:true,format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},define:{'import.meta.env.BASE_URL':JSON.stringify(base)},external:['react','react-dom','react-dom/server','react/jsx-runtime'],logLevel:'silent'});
const {PaperReaderPage,AtlasViewer,siteUrl}=await import(pathToFileURL(outfile));
for(const [input,expected] of [['/',base],['/?view=teaching-points',base+'?view=teaching-points'],['/docs/teaching-review.json',base+'docs/teaching-review.json'],['/assets/example.webp',base+'assets/example.webp'],[base+'docs/a',base+'docs/a'],['https://example.com/a','https://example.com/a'],['//example.com/a','//example.com/a'],['#anchor','#anchor']])assert.equal(siteUrl(input),expected);
function render(Component,query){globalThis.window={location:{search:query},innerWidth:1440,innerHeight:1000,devicePixelRatio:1};return renderToStaticMarkup(React.createElement(Component));}
let renderedViews=0,renderedLocalLinks=0;
function assertMarkup(html){
 for(const m of html.matchAll(/\b(?:href|src)="([^"<>]+)"/g)){
  const href=m[1].replaceAll('&amp;','&');if(!href.startsWith('/')||href.startsWith('//'))continue;
  assert(href.startsWith(base),`Rendered local link escaped Pages base: ${href}`);localFile(href,path.join(dist,'index.html'));renderedLocalLinks++;
 }
 renderedViews++;
}
const papers=json('src/data/research-evidence/local-paper-library.generated.json');
for(const s of papers.sources)assertMarkup(render(PaperReaderPage,'?view=paper-reader&sourceId='+s.sourceId));
for(const paradigm of ['stroop','multiple-object-tracking','temporal-order-judgment'])assertMarkup(render(AtlasViewer,'?function=attention&paradigm='+paradigm));
const teaching=json('public/docs/teaching-review.json');assert.equal(teaching.paperPoints.length,72);assert(teaching.paperPoints.every(p=>!p.preciseDisplayAllowed&&p.verifiedTargetXYZ===null));
console.log(JSON.stringify({status:'PASS',base,staticFiles:staticFiles.length,staticResolvedLinks:resolvedLinks,renderedViews,renderedLocalLinks,siteUrlCases:8,sourceLicensePaths:sourceFiles.length,teachingPrecisionUnchanged:true,scope:'Engineering path/rights checks; independent visual and teaching acceptance are separate'},null,2));
