import {num} from '../core/utils.js';

let root, chart;
export function render(el) {
  root = el;
  el.innerHTML = `<h3>⚡ NĂNG LƯỢNG QUẠT <span class="pill off" id="energy-state">Chờ dữ liệu</span></h3>
    <div class="energy-kpis"><div><span>Điện năng tích lũy</span><b id="energy-total">-- Wh</b></div><div><span>Công suất danh định</span><b id="energy-rated">-- W</b></div><div><span>Duty hiện tại</span><b id="energy-duty">--%</b></div></div>
    <div class="energy-modes">
      <div><span>AUTO · Wh / công suất TB</span><b id="energy-auto">--</b></div>
      <div><span>FIXED · Wh / công suất TB</span><b id="energy-fixed">--</b></div>
      <div><span>MANUAL · Wh / công suất TB</span><b id="energy-manual">--</b></div>
    </div>
    <div class="energy-comparison" id="energy-comparison">Chênh lệch AUTO/FIXED: chưa đủ dữ liệu đối chứng.</div>
    <div class="chart-wrap"><canvas id="energy-chart"></canvas></div>
    <div class="small muted-note">Wh được ước tính từ duty PWM × công suất danh định × thời gian. Công suất TB trong từng chế độ = Wh / thời gian quan sát. Chỉ so sánh AUTO/FIXED khi mỗi chế độ có ít nhất 5 phút dữ liệu; cần giữ điều kiện thử nghiệm tương đương và đối chiếu đồng hồ đo công suất.</div>`;
  if (typeof Chart !== 'undefined') chart = new Chart(el.querySelector('#energy-chart'), {
    type: 'line', data: { labels: [], datasets: [{ label: 'Điện năng tích lũy (Wh)', data: [], borderColor: '#ffd166', backgroundColor: 'rgba(255,209,102,.12)', fill: true, pointRadius: 0, tension: .25 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { labels: { color: '#cfe8ff' } } }, scales: { x: { ticks: { color: '#8fb3d1', maxTicksLimit: 6 }, grid: { color: '#123352' } }, y: { beginAtZero: true, ticks: { color: '#8fb3d1' }, grid: { color: '#123352' } } } }
  });
}

export function update(payload) {
  if (!root) return;
  const rows = (payload?.data || []).filter(r => Number.isFinite(r.timeMs)).sort((a, b) => a.timeMs - b.timeMs);
  const latest = rows.at(-1);
  if (!latest || !Number.isFinite(latest.fanEnergyWh)) {
    setState('Chưa có trường fanEnergyWh', 'warn');
    return;
  }
  root.querySelector('#energy-total').textContent = num(latest.fanEnergyWh, 3) + ' Wh';
  root.querySelector('#energy-rated').textContent = Number.isFinite(latest.fanRatedW) ? num(latest.fanRatedW, 1) + ' W' : '-- W';
  root.querySelector('#energy-duty').textContent = Number.isFinite(latest.fanPct) ? num(latest.fanPct, 0) + '%' : '--%';

  const perMode = { auto: { wh: 0, hours: 0, intervals: 0 }, fixed: { wh: 0, hours: 0, intervals: 0 }, manual: { wh: 0, hours: 0, intervals: 0 } };
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i - 1], b = rows[i];
    if (!Number.isFinite(a.fanEnergyWh) || !Number.isFinite(b.fanEnergyWh) || a.bootId !== b.bootId) continue;
    const dt = b.timeMs - a.timeMs, delta = b.fanEnergyWh - a.fanEnergyWh;
    if (dt <= 0 || dt > 5 * 60000 || delta < 0 || delta > 10 || a.mode !== b.mode) continue;
    const mode = String(b.mode || '').toLowerCase();
    if (Object.hasOwn(perMode, mode)) { perMode[mode].wh += delta; perMode[mode].hours += dt / 3600000; perMode[mode].intervals++; }
  }
  for (const mode of Object.keys(perMode)) {
    const v = perMode[mode], avgW = v.hours > 0 ? v.wh / v.hours : null;
    root.querySelector(`#energy-${mode}`).textContent = `${num(v.wh, 3)} Wh · ${avgW == null ? '--' : num(avgW, 1) + ' W'}`;
  }
  const valid = latest.energyConfigValid === 1 || latest.energyConfigValid === true;
  const counted = Object.values(perMode).reduce((s, x) => s + x.intervals, 0);
  setState(valid ? `${counted} khoảng mẫu đã tính` : 'Kiểm tra công suất cấu hình', valid ? 'ok' : 'warn');
  const auto = perMode.auto, fixed = perMode.fixed;
  const comparison = root.querySelector('#energy-comparison');
  if (auto.hours >= 5 / 60 && fixed.hours >= 5 / 60 && fixed.wh > 0) {
    const autoW = auto.wh / auto.hours, fixedW = fixed.wh / fixed.hours;
    const saving = (fixedW - autoW) / fixedW * 100;
    comparison.textContent = `Công suất TB: AUTO ${num(autoW, 1)} W · FIXED ${num(fixedW, 1)} W · chênh lệch ${num(saving, 1)}% (số ước tính, không phải kết luận tiết kiệm đã đo).`;
  } else comparison.textContent = 'Chênh lệch AUTO/FIXED: cần ít nhất 5 phút dữ liệu hợp lệ cho mỗi chế độ.';

  if (chart) {
    const sample = rows.slice(-120);
    chart.data.labels = sample.map(r => new Date(r.timeMs).toLocaleTimeString('vi-VN'));
    chart.data.datasets[0].data = sample.map(r => Number.isFinite(r.fanEnergyWh) ? r.fanEnergyWh : null);
    chart.update('none');
  }
}
function setState(text, tone) { const el = root?.querySelector('#energy-state'); if (el) { el.textContent = text; el.className = 'pill ' + tone; } }
