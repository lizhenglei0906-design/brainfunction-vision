import {formatReportedStatistic} from './coordinate-statistics.js';

const $ = id => document.getElementById(id);
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xyz = point => Array.isArray(point) ? `[ ${point.map(v => Number(v).toLocaleString('en-US', {maximumFractionDigits: 4})).join(', ')} ]` : '未建立';
const paperName = id => ({'fan-2005-ant-fmri':'Fan 2005 · 注意网络','kim-2011-subsequent-memory':'Kim 2011 · 后续记忆','spaniol-2009-episodic-memory':'Spaniol 2009 · 情景记忆','jonides-1993-spatial-wm-pet':'Jonides 1993 · 空间工作记忆','davis-2009-temporal-order-judgment':'Davis 2009 · 时间顺序判断'}[id] ?? id);
const frameName = row => ({'fan-2005-ant-fmri':'Talairach（由作者使用 Brett 方法报告）','kim-2011-subsequent-memory':'Talairach（Lancaster 变体未明确）','spaniol-2009-episodic-memory':'Talairach（混合来源的元分析）','jonides-1993-spatial-wm-pet':'原文 Talairach 约定（负 x 为右侧）','davis-2009-temporal-order-judgment':'MNI152（作者报告 FSL 4.1 / FLIRT）'}[row.sourceId] ?? row.reportedFrame);
function locatorText(row) {
  const l = row.sourceRowLocator;
  return [l.table ? `表 ${l.table}` : l.figure ? `图 ${l.figure}` : '', l.printedPage ? `印刷页 ${l.printedPage}` : '', l.pdfPage ? `PDF 第 ${l.pdfPage} 页` : '', l.clusterNumber ? `簇 ${l.clusterNumber}` : '', (l.rowWithinCluster ?? l.rowWithinSubgroup) ? `组内第 ${l.rowWithinCluster ?? l.rowWithinSubgroup} 行` : '', l.subgroupOrContrast ?? ''].filter(Boolean).join(' · ');
}
function safeUrl(url) {
  try { const u = new URL(url); return u.protocol === 'https:' ? escape(u.href) : '#'; } catch { return '#'; }
}
try {
  const [data, nav, teaching] = await Promise.all(['coordinate-review.generated.json', 'coordinate-navigation.json', 'teaching-review.json'].map(async path => {
    const r = await fetch(path); if (!r.ok) throw new Error('来源数据加载失败'); return r.json();
  }));
  const query = new URLSearchParams(location.search);
  let nodeId = query.get('node');
  let selectedId = query.get('record');
  let sourceId = query.get('source') ?? 'davis-2009-temporal-order-judgment';
  const nodes = new Map(nav.nodes.map(n => [n.nodeId, n]));
  const associations = new Map(data.nodeAssociations.map(n => [n.nodeId, n]));
  const papers = new Map(data.sources.map(s => [s.sourceId, s]));
  const titles = new Map(nav.sources.map(s => [s.sourceId, s.title]));
  $('verified-count').textContent = data.rows.length;
  $('repair-count').textContent = data.historicalArithmeticCorrections.length;
  $('precise-count').textContent = data.summary.preciseDisplayCount;
  $('coverage').textContent = `盘点覆盖 ${data.summary.sourceCount} 个来源、${data.summary.originalCoordinateFiles} 份既有文件。${nav.methodsReviewedSources} 篇方法经过有界核查，109 处原文坐标已逐行核对；其余 ${nav.unreviewedOriginalRows} 条旧原始展开记录尚未逐行语义核对。${data.summary.normalizedRows} 条记录包含原始与派生副本，不能当作同等数量的独立峰值。`;

  function baseRows() {
    if (!nodeId) return data.rows;
    const proposal = data.peakAssociationProposals.find(p => p.nodeId === nodeId);
    return proposal ? data.rows.filter(r => proposal.sourceRecordIds.includes(r.recordId)) : [];
  }
  function nodeContext() {
    const el = $('node-context'); el.hidden = !nodeId;
    if (!nodeId) return;
    const node = nodes.get(nodeId), association = associations.get(nodeId);
    if (!node || !association) { el.innerHTML = '<h2>未找到这个节点</h2><p>请返回脑图重新打开节点依据，或查看全部已核来源。</p>'; return; }
    const proposal = data.peakAssociationProposals.find(p => p.nodeId === nodeId);
    const teachingNode = teaching.nodes.find(n => n.nodeId === nodeId);
    el.innerHTML = `<h2>${escape(teachingNode?.displayLabel ?? node.label)}</h2><p>${escape(teachingNode?.teachingNote ?? "教学示意锚点")}</p><p>${association.associationType === 'PARADIGM_REFERENCE_ONLY' ? '当前只有范式级出处，本节点的专属坐标依据仍待核对。' : '图上位置采用区域、结构或网络锚点，没有直接绑定论文峰值。'}</p><p>${proposal ? '下列原文峰值与此节点所述脑区有关，可核对来源。它们没有决定节点当前位置，也不能单独证明节点所述的认知机制。' : '此节点尚无经过逐峰核对的专属关联。本页不会把它所引用论文里的任意坐标当成它的位置证据。'}</p><p class="node-tags">已有出处：${association.sourceIds.map(id => escape(titles.get(id) ?? paperName(id))).join('；')}</p>`;
  }
  function refreshOptions() {
    const ids = [...new Set(baseRows().map(r => r.sourceId))];
    if (!ids.includes(sourceId)) sourceId = ids[0] ?? '';
    $('source').innerHTML = ids.length ? ids.map(id => `<option value="${escape(id)}">${escape(paperName(id))}</option>`).join('') : '<option value="">此节点没有已核逐峰关联</option>';
    $('source').value = sourceId;
    $('source').disabled = !ids.length;
    nodeContext(); render();
  }
  function renderDetail(row) {
    if (!row) { $('detail').innerHTML = '<p class="empty">没有符合条件的已核原文条目。可以清除筛选，或查看全部已核来源。</p>'; return; }
    const p = papers.get(row.sourceId);
    const teachingPoint = teaching.paperPoints.find(p => p.recordId === row.recordId);
    const c = row.candidate;
    const transform = c?.transformHistory?.[0];
    let transformText = '该来源的具体变换路径尚未获准，未自动选择转换矩阵。';
    if (transform?.transformId === 'brett1999-piecewise') transformText = '按找回的 Brett 参考公式逆算。先撤销旋转，再按恢复后的 z 选择上、下段缩放；结果仅是历史 MNI 参考下的近似候选。';
    if (transform?.transformId === 'jonides1993-x-convention') transformText = '仅翻转 x 的正负，将作者“负 x 为右侧”的约定转为常见 RAS 约定。它仍是历史 Talairach 坐标，未转换到当前 FSL 模板。';
    if (transform?.transformId === 'preserve-reported-coordinate') transformText = '保留作者报告的 MNI152 数字，没有追加空间换算。作者的方法路径已核，但与当前所选 FSL 模板的精确对应仍未建立。';
    const correction = data.historicalArithmeticCorrections.find(x => x.originalRecordId === row.recordId);
    const evidenceNodes = data.peakAssociationProposals.filter(p => p.sourceRecordIds.includes(row.recordId));
    const statistic = formatReportedStatistic(row.reportedStatistic);
    $('detail').innerHTML = `<span class="badge">${teachingPoint ? "教学近似可查看 · 非精确定位" : "原文条目已核 · 尚无教学映射"}</span>
      <h2>${escape(row.reportedRegion)}</h2>
      ${teachingPoint ? `<section class="step"><h3>教学近似位置</h3><p>${escape(teachingPoint.uncertainty)}</p>${teachingPoint.regionCaution ? `<p class="boundary">${escape(teachingPoint.regionCaution)}</p>` : ""}<a href="../?view=teaching-points&record=${encodeURIComponent(row.recordId)}">在脑图中查看这一点 →</a></section>` : ""}
      <div class="coordinates">${escape(xyz(row.originalXYZ))} <small>毫米 · 按原文约定</small></div>
      <p class="locator">${escape(frameName(row))}<br>${escape(locatorText(row))}<br>${escape(statistic)}</p>
      <p class="locator muted">${escape(row.reportedContrast)}</p>
      <a class="source-link" href="${safeUrl(p.url)}" target="_blank" rel="noreferrer">查看原论文 ↗</a>
      <section class="step"><h3>从原文到换算结果</h3><p>${escape(transformText)}</p>
      ${c ? `<p><strong>${transform.transformId === 'preserve-reported-coordinate' ? '保留的原值' : '受限计算结果'}：${escape(xyz(c.displayRoundedXYZ))} mm</strong></p>` : ''}
      ${correction ? `<p>这条旧副本已按当时声明的 Lancaster SPM2 逆算纠正：</p><table><thead><tr><th>旧副本</th><th>算术修正</th></tr></thead><tbody><tr><td>${escape(xyz(correction.beforeXYZ))}</td><td>${escape(xyz(correction.repairedMirrorXYZ))}</td></tr></tbody></table><p>仅修复旧算式；原研究具体使用哪种变体仍未明确，修正结果未获精确显示准入。</p>` : ''}
      <p class="boundary">当前目标模板对应未建立，未生成获准显示的精确坐标。</p></section>
      <section class="step"><h3>它与图上节点的关系</h3><p>${evidenceNodes.length ? `相关节点：${evidenceNodes.map(n => escape(nodes.get(n.nodeId)?.label ?? n.nodeId)).join('、')}。这是原文区域证据的关联，节点继续使用原有示意锚点。` : '目前没有把这条原文坐标作为某个节点的直接位置来源。论文出处和节点显示位置分别记录。'}</p></section>
      <details><summary>查看追溯细节</summary><p>原始记录：<code>${escape(row.recordId)}</code></p><p>来源：<code>${escape(row.sourceId)}</code></p>${transform ? `<p>方法：<code>${escape(transform.transformId)} / ${escape(transform.version)}</code></p><p>未舍入结果：<code>${escape(JSON.stringify(c.unroundedXYZ))}</code></p><p>方法定义哈希：<code>${escape(transform.definitionSha256)}</code></p>` : ''}<p>原文证据哈希：<code>${escape(row.sourceEvidenceSha256[0])}</code></p><p>原始数字保留，派生计算另存；逐点不确定性未因数值复现而消失。</p></details>`;
  }
  function render() {
    const needle = $('search').value.trim().toLowerCase();
    const rows = baseRows().filter(r => r.sourceId === sourceId && (!needle || `${r.reportedRegion} ${r.reportedContrast} ${r.originalXYZ.join(', ')} ${r.legacyPointId}`.toLowerCase().includes(needle)));
    if (!rows.some(r => r.recordId === selectedId)) selectedId = rows.find(r => r.recordId === 'rec-808621d3763bed7f930a348e')?.recordId ?? rows[0]?.recordId;
    $('source-title').textContent = papers.get(sourceId)?.title ?? '当前没有已核的专属坐标关联';
    $('result-count').textContent = `${rows.length} 处已核原文条目${nodeId ? ' · 仅此节点的相关原表证据' : ''}`;
    $('records').innerHTML = rows.length ? rows.map(r => `<button type="button" class="record" data-record="${escape(r.recordId)}" aria-pressed="${r.recordId === selectedId}"><strong>${escape(r.reportedRegion)}</strong><span>${escape(xyz(r.originalXYZ))} · ${escape(r.sourceRowLocator.table ? `表 ${r.sourceRowLocator.table}` : `图 ${r.sourceRowLocator.figure ?? '—'}`)}</span></button>`).join('') : '<p class="empty">没有已核条目。完整盘点仍保留未核记录，未将它们升级为通过。</p>';
    renderDetail(rows.find(r => r.recordId === selectedId));
  }
  $('records').addEventListener('click', event => {
    const button = event.target.closest('button[data-record]'); if (!button) return;
    selectedId = button.dataset.record;
    const q = new URLSearchParams(); q.set('source', sourceId); q.set('record', selectedId); if (nodeId) q.set('node', nodeId);
    history.replaceState(null, '', `?${q}`); render();
  });
  $('source').addEventListener('change', () => { sourceId = $('source').value; selectedId = null; $('search').value = ''; render(); });
  $('search').addEventListener('input', render);
  $('all-sources').addEventListener('click', () => { nodeId = null; selectedId = null; $('search').value = ''; history.replaceState(null, '', location.pathname); refreshOptions(); });
  refreshOptions();
} catch (error) {
  $('detail').innerHTML = `<p class="error">${escape(error.message)}。请刷新本页，或返回脑图查看定位说明。</p>`;
  $('result-count').textContent = '来源数据未加载';
}
