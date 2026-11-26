// Remove the complete at-iqama row and keep any saved iqama preference.
module.exports = function hideIqamaControls(html) {
  const icon = '<div class="setting-label" aria-hidden="true">🕌</div>';
  const marker = html.indexOf(icon);
  const row = '<div class="setting-row" style="border-bottom:none; padding:8px 0;">';
  const next = '<div class="setting-row" style="border-bottom:none; padding:8px 0 4px;">';
  const start = html.lastIndexOf(row, marker);
  const end = html.indexOf(next, marker);
  if (marker < 0 || start < 0 || end < 0 || !html.slice(start,end).includes('id="pn-toggle-${t.key}"')) {
    throw new Error('Expected the iqama controls before the reminder row');
  }
  html = html.slice(0,start) + html.slice(end);
  const oldSave = 't.iqamaEnabled=!a||a.classList.contains("on")';
  if (html.split(oldSave).length !== 2) throw new Error('Expected the saved iqama preference');
  return html.replace(oldSave, 't.iqamaEnabled=a?a.classList.contains("on"):t.iqamaEnabled!==false');
};
