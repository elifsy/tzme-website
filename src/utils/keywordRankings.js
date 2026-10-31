export const rankDevices = { desktop: '电脑端', mobile: '手机端' };
export const rankSources = { manual: '人工录入', import: 'CSV 导入', serpapi: '接口采集' };
export const rankLabel = (status, position, depth) => status === 'ranked' ? `第 ${position} 名` : status === 'not_found' ? `前 ${depth} 未检出` : status === 'error' ? '采集失败' : '待采集';
export const rankCsvHeaders = ['监测编号', '关键词', '终端', '采集时间', '状态', '名次', '命中链接', '备注'];
export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = '\t' + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function rankCsvTemplate(keywords) {
  return '\uFEFF' + [rankCsvHeaders, ...keywords.map(item => [item.id, item.keyword, rankDevices[item.device], '', '', '', '', ''])].map(row => row.map(csvCell).join(',')).join('\r\n');
}
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (character === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else if (quoted) quoted = false;
      else if (!cell) quoted = true;
      else throw new Error('CSV 引号格式不正确，请使用下载的模板。');
    } else if (!quoted && character === ',') { row.push(cell); cell = ''; }
    else if (!quoted && (character === '\n' || character === '\r')) {
      row.push(cell); if (row.some(value => value.trim())) rows.push(row); row = []; cell = '';
      if (character === '\r' && text[i + 1] === '\n') i++;
    } else cell += character;
  }
  if (quoted) throw new Error('CSV 引号未闭合。');
  row.push(cell); if (row.some(value => value.trim())) rows.push(row);
  return rows;
}
export function parseRankCsv(text, keywords) {
  const rows = parseCsv(text);
  if (rows.length < 2 || rows[0].map(value => value.trim()).join('|') !== rankCsvHeaders.join('|')) throw new Error('请使用当前下载的模板，并另存为 UTF-8 CSV 文件。');
  if (rows.length > 501) throw new Error('每次最多导入 500 条排名记录。');
  const monitors = new Map(keywords.map(item => [item.id, item]));
  return rows.slice(1).map((row, index) => {
    const fail = message => { throw new Error(`第 ${index + 2} 行：${message}`); };
    if (row.length !== rankCsvHeaders.length) fail('列数与模板不一致。');
    const [id, word, device, time, statusText, positionText, matchedUrl, notes] = row.map(value => value.trim());
    const monitor = monitors.get(id); if (!monitor) fail('监测编号不存在，请重新下载模板。');
    if (word !== monitor.keyword || ![monitor.device, rankDevices[monitor.device]].includes(device)) fail('关键词或终端与监测编号不一致。');
    if (!/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/i.test(time) || Number.isNaN(new Date(time).valueOf())) fail('采集时间请填写含时区的 ISO 时间，例如 2026-10-30T09:00:00+08:00。');
    const status = ({ 已检出: 'ranked', 未检出: 'not_found', ranked: 'ranked', not_found: 'not_found' })[statusText];
    if (!status) fail('状态请填写“已检出”或“未检出”，不能将空白当成未检出。');
    const position = positionText === '' ? null : Number(positionText);
    if (status === 'ranked' && (!Number.isInteger(position) || position < 1 || position > monitor.searchDepth)) fail(`名次应为 1–${monitor.searchDepth} 的整数。`);
    if (status === 'not_found' && position !== null) fail('未检出时请将名次留空。');
    return { keywordId: id, observedAt: new Date(time).toISOString(), status, position, matchedUrl, notes };
  });
}
