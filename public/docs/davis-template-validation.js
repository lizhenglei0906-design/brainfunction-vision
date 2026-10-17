const byId = (id) => document.getElementById(id);
const networkNames = {visual:'视觉网络',somatomotor:'躯体运动网络',dorsal_attention:'背侧注意网络',ventral_attention:'腹侧注意网络',limbic:'边缘网络',frontoparietal:'额顶控制网络',default_mode:'默认网络'};
const linkNames = {davis2009:'Davis 论文', 'fsl-history':'FSL 官方版本历史', 'fsl41-tree-unknown':'FSL 4.0 官方历史树', 'cbig-fixed-reference':'固定目标参考'};
const addText = (parent, tag, text, className) => {
  const element = document.createElement(tag);
  element.textContent = text;
  if (className) element.className = className;
  parent.append(element);
  return element;
};

try {
  const response = await fetch('davis-review.generated.json');
  if (!response.ok) throw new Error('数据未能载入');
  const data = await response.json();
  if (data.rows.length !== 42 || data.summary.preciseDisplayCount !== 0 || data.rows.some((r) => !r.diagnosticOnly || r.preciseDisplayAllowed || r.verifiedTargetXYZ !== null || r.verifiedViewerXYZ !== null || r.verifiedTargetFrameId !== null)) {
    throw new Error('数据与本页验证范围不一致');
  }
  byId('row-count').textContent = data.summary.sourceRows;
  byId('label-count').textContent = data.summary.nonzeroLabels;
  byId('zero-count').textContent = data.summary.zeroLabels;
  byId('precise-count').textContent = data.summary.preciseDisplayCount;
  data.chainSummary.forEach((text) => addText(byId('chain'), 'li', text));
  data.sourceLinks.forEach(({id,url}) => {
    const link = addText(byId('sources'), 'a', linkNames[id] || id);
    link.href = url;
    link.target = '_blank'; link.rel = 'noopener noreferrer';
  });
  function render() {
    const term = byId('search').value.trim().toLowerCase();
    const filter = byId('label-filter').value;
    const experiment = byId('experiment').value;
    const rows = data.rows.filter((row) => {
      const locator = row.sourceRowLocator;
      const text = [locator.rowRegionLabel, locator.contrast, row.originalXYZ.join(' '), row.originalXYZ.join(', '), row.parcelSourceLabel || '', networkNames[row.network] || ''].join(' ').toLowerCase();
      return (!term || text.includes(term)) && (filter === 'all' || (filter === 'zero' ? row.labelId === 0 : row.labelId > 0)) && (experiment === 'all' || String(locator.table) === experiment);
    });
    byId('rows').replaceChildren();
    rows.forEach((row) => {
      const tr = document.createElement('tr');
      const cell = document.createElement('td');
      const link = addText(cell, 'a', row.sourceRowLocator.rowRegionLabel);
      link.href = `coordinate-evidence.html?source=${encodeURIComponent(data.sourceId)}&record=${encodeURIComponent(row.recordId)}`;
      const loc = row.sourceRowLocator;
      addText(cell, 'small', `表 ${loc.table} · 簇 ${loc.clusterNumber} · 簇内第 ${loc.rowWithinCluster} 行 · 印刷页 ${loc.printedPage}`);
      tr.append(cell);
      addText(tr, 'td', row.originalXYZ.join(', '));
      addText(tr, 'td', Number(row.statistic.value).toFixed(2));
      const label = addText(tr, 'td', row.labelId ? `${networkNames[row.network] || row.network} · ${row.labelId}` : '无皮层标签（0）', row.labelId ? '' : 'zero');
      if (row.labelId) addText(label, 'small', row.parcelSourceLabel);
      addText(tr, 'td', '尚未建立');
      byId('rows').append(tr);
    });
    byId('result-count').textContent = `显示 ${rows.length} / ${data.rows.length} 处原表坐标；以下均为条件诊断。`;
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = addText(tr, 'td', '没有符合筛选的条目。'); td.colSpan = 5; byId('rows').append(tr);
    }
  }
  byId('search').addEventListener('input', render);
  byId('label-filter').addEventListener('change', render);
  byId('experiment').addEventListener('change', render);
  byId('clear').addEventListener('click', () => {
    byId('search').value = ''; byId('label-filter').value = 'all'; byId('experiment').value = 'all'; render();
  });
  render();
} catch (error) {
  byId('result-count').className = 'error';
  byId('result-count').textContent = `检查数据暂时不可用：${error.message}。请返回原表与来源页核对。`;
  ['search','label-filter','experiment','clear'].forEach((id) => { byId(id).disabled = true; });
}
