import {num} from '../core/utils.js';

let root, chart;
export function render(el) {
  root = el;
  el.innerHTML = `<h3>🔮 ĐÁNH GIÁ DỰ BÁO 15 / 30 PHÚT <span class="pill off" id="forecast-state">Chờ dữ liệu</span></h3>
    <div class="forecast-metrics">
      <div><b>15 phút · PM2.5</b><span id="f15-pm">MAE -- · RMSE --</span><small id="f15-pm-n">0 cặp ghép</small></div>
      <div><b>30 phút · PM2.5</b><span id="f30-pm">MAE -- · RMSE --</span><small id="f30-pm-n">0 cặp ghép</small></div>
      <div><b>15 phút · CO₂</b><span id="f15-co2">MAE -- · RMSE --</span><small id="f15-co2-n">0 cặp ghép</small></div>
      <div><b>30 phút · CO₂</b><span id="f30-co2">MAE -- · RMSE --</span><small id="f30-co2-n">0 cặp ghép</small></div>
    </div>
    <div class="chart-wrap"><canvas id="forecast-chart"></canvas></div>
    <div class="small muted-note">Chỉ ghép dự báo với mẫu thực gần thời điểm đích (t + 15/30 phút). MAE/RMSE chỉ hiển thị khi có ít nhất 10 cặp hợp lệ; kết quả phụ thuộc độ phủ dữ liệu và không phải xác nhận mô hình AI độc lập.</div>`;
  if (typeof Chart !== 'undefined') chart = new Chart(el.querySelector('#forecast-chart'), {
    type: 'line', data: { labels: [], datasets: [
      { label: 'Dự báo PM2.5 (+15m)', data: [], borderColor: '#ffbd69', pointRadius: 0, tension: .2 },
      { label: 'Thực tế PM2.5 (+15m)', data: [], borderColor: '#2fe08a', pointRadius: 0, tension: .2 },
      { label: 'Dự báo PM2.5 (+30m)', data: [], borderColor: '#b388ff', pointRadius: 0, tension: .2 },
      { label: 'Thực tế PM2.5 (+30m)', data: [], borderColor: '#2ec8ff', pointRadius: 0, tension: .2 }
    ] }, options: { responsive: true, maintainAspectRatio: false, animation: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { labels: { color: '#cfe8ff', boxWidth: 12 } } }, scales: { x: { ticks: { color: '#8fb3d1', maxTicksLimit: 6 }, grid: { color: '#123352' } }, y: { beginAtZero: true, ticks: { color: '#8fb3d1' }, grid: { color: '#123352' } } } }
  });
}

export function update(payload) {
  if (!root) return;
  const rows = (payload?.data || []).filter(r => Number.isFinite(r.timeMs)).sort((a, b) => a.timeMs - b.timeMs);
  if (rows.length < 3) return setState('Chưa đủ lịch sử', 'warn');
  const p15 = pairs(rows, 15, 'pm25'), p30 = pairs(rows, 30, 'pm25');
  const c15 = pairs(rows, 15, 'co2'), c30 = pairs(rows, 30, 'co2');
  showMetric('f15-pm', 'f15-pm-n', p15); showMetric('f30-pm', 'f30-pm-n', p30);
  showMetric('f15-co2', 'f15-co2-n', c15); showMetric('f30-co2', 'f30-co2-n', c30);
  const available = p15.length + p30.length + c15.length + c30.length;
  setState(available ? `${available} cặp dự báo–thực tế` : 'Chưa ghép được cặp dự báo', available ? 'ok' : 'warn');
  if (chart) {
    const series = [p15, p30];
    const labelMap = new Map();
    for (const list of series) for (const pair of list) labelMap.set(pair.targetTime, new Date(pair.targetTime).toLocaleTimeString('vi-VN'));
    const allTimes = [...labelMap.keys()].sort((a, b) => a - b);
    const max = 100, stride = Math.max(1, Math.ceil(allTimes.length / max)), times = allTimes.filter((_, i) => i % stride === 0);
    chart.data.labels = times.map(t => labelMap.get(t));
    const map = list => new Map(list.map(p => [p.targetTime, p.forecast]));
    const actual = list => new Map(list.map(p => [p.targetTime, p.actual]));
    chart.data.datasets[0].data = times.map(t => map(p15).get(t) ?? null);
    chart.data.datasets[1].data = times.map(t => actual(p15).get(t) ?? null);
    chart.data.datasets[2].data = times.map(t => map(p30).get(t) ?? null);
    chart.data.datasets[3].data = times.map(t => actual(p30).get(t) ?? null);
    chart.update('none');
  }
}

function pairs(rows, horizonMinutes, metric) {
  const forecastKey = `forecast${horizonMinutes}_${metric}`;
  const actualKey = `actual_${metric}`;
  const horizon = horizonMinutes * 60000;
  const positiveDiffs = [];
  for (let i = 1; i < rows.length; i++) { const d = rows[i].timeMs - rows[i - 1].timeMs; if (d > 0 && d < 5 * 60000) positiveDiffs.push(d); }
  positiveDiffs.sort((a, b) => a - b);
  const tolerance = Math.max(90000, positiveDiffs.length ? positiveDiffs[Math.floor(positiveDiffs.length / 2)] * 2 : 90000);
  const out = [];
  for (const source of rows) {
    const forecast = source[forecastKey]; if (!Number.isFinite(forecast)) continue;
    const targetTime = source.timeMs + horizon;
    let lo = 0, hi = rows.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (rows[mid].timeMs < targetTime) lo = mid + 1; else hi = mid; }
    const candidates = [rows[lo - 1], rows[lo]].filter(Boolean).sort((a, b) => Math.abs(a.timeMs - targetTime) - Math.abs(b.timeMs - targetTime));
    const actualRow = candidates[0];
    if (!actualRow || Math.abs(actualRow.timeMs - targetTime) > tolerance) continue;
    const actual = Number.isFinite(actualRow[actualKey]) ? actualRow[actualKey] : actualRow[metric];
    if (!Number.isFinite(actual)) continue;
    out.push({ forecast, actual, targetTime, error: forecast - actual });
  }
  return out;
}
function showMetric(valueId, countId, data) {
  const v = root.querySelector('#' + valueId), n = root.querySelector('#' + countId);
  if (data.length < 10) { v.textContent = 'MAE -- · RMSE --'; n.textContent = `${data.length} cặp · cần ít nhất 10`; return; }
  const mae = data.reduce((s, p) => s + Math.abs(p.error), 0) / data.length;
  const rmse = Math.sqrt(data.reduce((s, p) => s + p.error * p.error, 0) / data.length);
  v.textContent = `MAE ${num(mae, 2)} · RMSE ${num(rmse, 2)}`; n.textContent = `${data.length} cặp dự báo–thực tế`;
}
function setState(t, tone) { const e = root?.querySelector('#forecast-state'); if (e) { e.textContent = t; e.className = 'pill ' + tone; } }
