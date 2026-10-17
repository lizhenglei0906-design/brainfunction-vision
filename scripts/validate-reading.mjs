import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const root=process.cwd();
const lib=JSON.parse(fs.readFileSync('src/data/research-evidence/local-paper-library.generated.json','utf8'));
const index=JSON.parse(fs.readFileSync('src/data/research-evidence/paper-reading-index.generated.json','utf8'));
assert.equal(index.summary.localFulltextSourceCount,9);assert.equal(index.summary.localReadTargetCount,9);assert.equal(index.sourceIndex.length,214);
const outfile=path.join(root,'node_modules/.tmp/reading-runtime-check.mjs');fs.mkdirSync(path.dirname(outfile),{recursive:true});
await build({stdin:{contents:'export {PaperReaderPage} from "./src/components/atlas-viewer/PaperReaderPage";export {AtlasViewer} from "./src/components/atlas-viewer/AtlasViewer";export {publicPaperTargets,isPublicPaperHtmlResponse} from "./src/lib/publicPaperReading";',resolveDir:root},outfile,bundle:true,format:'esm',platform:'node',jsx:'automatic',loader:{'.css':'empty'},external:['react','react-dom','react-dom/server','react/jsx-runtime'],logLevel:'silent'});
const {PaperReaderPage,AtlasViewer,publicPaperTargets,isPublicPaperHtmlResponse}=await import(pathToFileURL(outfile));
const render=(Component,query)=>{globalThis.window={location:{search:query},innerWidth:1440,innerHeight:1000,devicePixelRatio:1};return renderToStaticMarkup(React.createElement(Component));};
let sourceOnlyPages=0,localPages=0;
for(const source of lib.sources){
 const targets=publicPaperTargets(source.sourceId);assert.equal(targets.length,source.localTargets.length);const html=render(PaperReaderPage,'?view=paper-reader&sourceId='+source.sourceId);
 if(!targets.length){assert(html.includes('原始来源阅读'));assert(!html.includes('<iframe'));assert(!html.includes('单独打开文件'));assert(/href="https?:/.test(html));sourceOnlyPages++;}
 else {assert(html.includes('单独打开文件'));assert.equal((html.match(/<button[^>]*>HTML · article · article.html<\/button>/g)||[]).length,1);assert(!/article\.(txt|pdf|xml)/.test(html));assert(html.includes(targets[0].href));localPages++;}
}
for(const sourceId of ['felssberg-2025-mot-training-fmri','jones-2020-working-memory-metacognitive-academic-transfer','damestani-2021-auditory-oddball-tone-discrimination']){
 for(const file of ['article.txt','article.pdf','article.xml','article.html']){const html=render(PaperReaderPage,'?view=paper-reader&sourceId='+sourceId+'&file='+file);assert(html.includes('/fulltext/'+sourceId+'/article.html'));assert(!/article\.(txt|pdf|xml)/.test(html));assert.equal((html.match(/<button[^>]*>HTML · article · article.html<\/button>/g)||[]).length,1);}
}
for(const sourceId of ['jovicich-2001-motion-tracking-load','macdonald-2000-stroop-control']){assert.equal(publicPaperTargets(sourceId).length,0);const html=render(PaperReaderPage,'?view=paper-reader&sourceId='+sourceId+'&file=article.pdf');assert(html.includes('原始来源阅读'));assert(!html.includes('单独打开文件'));}
assert(render(PaperReaderPage,'?view=paper-reader&sourceId=model-note-v0').includes('未找到这条论文来源'));
for(const source of lib.sources.filter(s=>s.localTargets.length)){
 const target=publicPaperTargets(source.sourceId)[0];const text=fs.readFileSync(path.join(root,'public',target.href),'utf8');assert(isPublicPaperHtmlResponse('text/html; charset=utf-8',text,target.href));assert(!isPublicPaperHtmlResponse('text/plain',text,target.href));assert(!isPublicPaperHtmlResponse('text/html',text,'/fulltext/'+source.sourceId+'/article.txt'));assert(!isPublicPaperHtmlResponse('text/html','<!doctype html><html><div id="root"></div><script src="/assets/index-x.js"></script></html>',target.href));assert(!isPublicPaperHtmlResponse('text/html',text+'<div id="root"></div>',target.href));
}
for(const paradigm of ['multiple-object-tracking','stroop']){
 const html=render(AtlasViewer,'?function=attention&paradigm='+paradigm);assert(!/\/fulltext\/[^" ]+\.(pdf|txt|xml)/.test(html));
 if(paradigm==='multiple-object-tracking'){assert(html.includes('https://doi.org/10.1162/089892901753294347'));assert(!html.includes('/fulltext/jovicich-2001-motion-tracking-load/'));}
 if(paradigm==='stroop'){assert(html.includes('https://doi.org/10.1126/science.288.5472.1835'));assert(!html.includes('/fulltext/macdonald-2000-stroop-control/'));}
}
console.log(JSON.stringify({readingResolution:'PASS',sourceOnlyDeepLinks:sourceOnlyPages,localDeepLinks:localPages,legacyFileQueriesChecked:12,mainEvidenceViews:['MOT','Stroop'],contentFallbackGuards:'PASS',duplicateFileOptions:'NONE'},null,2));

if(process.env.READING_BASE_URL){
 let actualArticles=0;
 for(const source of lib.sources.filter(s=>s.localTargets.length)){
  const target=publicPaperTargets(source.sourceId)[0];const response=await fetch(process.env.READING_BASE_URL+target.href);const content=await response.text();assert(response.ok);assert(isPublicPaperHtmlResponse(response.headers.get('content-type')??'',content,target.href));actualArticles++;
 }
 const canonical=publicPaperTargets('felssberg-2025-mot-training-fmri')[0];const rejected=[];
 for(const href of ['/fulltext/felssberg-2025-mot-training-fmri/article.txt','/fulltext/damestani-2021-auditory-oddball-tone-discrimination/article.xml','/fulltext/jovicich-2001-motion-tracking-load/article.pdf']){
  const response=await fetch(process.env.READING_BASE_URL+href);const text=await response.text();assert(!isPublicPaperHtmlResponse(response.headers.get('content-type')??'',text,canonical.href));rejected.push({href,status:response.status,bodyRejectedAsArticle:true});
 }
 console.log(JSON.stringify({actualArticleResponses:actualArticles,actualFallbackResponsesRejected:rejected},null,2));
}
