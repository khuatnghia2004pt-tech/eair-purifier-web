import {num} from '../core/utils.js';

let root;
export function render(el) {
  root = el;
  el.innerHTML = `<h3>📡 ĐỘ TIN CẬY TRUYỀN THÔNG <span class="pill off" id="reliability-state">Chờ dữ liệu MQTT</span></h3>
    <div class="reliability-grid">
      <div><span>Mẫu telemetry nhận được</span><b id="rel-received">--</b></div>
      <div><span>Khoảng trống seq</span><b id="rel-missing">--</b></div>
      <div><span>Tỷ lệ quan sát</span><b id="rel-rate">--%</b></div>
      <div><span>RSSI trung bình</span><b id="rel-rssi">-- dBm</b></div>
      <div><span>RSSI gần nhất</span><b id="rel-last-rssi">-- dBm</b></div>
      <div><span>Uptime gần nhất</span><b id="rel-uptime">--</b></div>
    </div>
    <div class="small muted-note">Khoảng trống seq được ước tính từ số thứ tự quan sát trong cùng bootId. Chỉ phản ánh chu kỳ không xuất hiện trong InfluxDB; không phân biệt được mất Wi-Fi, MQTT, Node-RED hoặc ghi InfluxDB.</div>`;
}
export function update(payload) {
  if (!root) return;
  const rows = (payload?.data || []).filter(r => Number.isFinite(r.timeMs)).sort((a, b) => a.timeMs - b.timeMs);
  if (!rows.length) return setState('Chưa có telemetry trong khoảng chọn', 'warn');
  let missing = 0, comparable = 0;
  const groups = new Map();
  for (const r of rows) {
    if (!Number.isFinite(r.seq)) continue;
    const key = `${r.bootId || 'unknown'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(r.seq);
  }
  for (const seqs of groups.values()) {
    for (let i = 1; i < seqs.length; i++) {
      const diff = seqs[i] - seqs[i - 1];
      if (diff > 1 && diff < 1000000) { missing += diff - 1; comparable += diff; }
      else if (diff === 1) comparable++;
    }
  }
  const observed = rows.filter(r => Number.isFinite(r.seq)).length;
  const rate = comparable + missing > 0 ? observed / (observed + missing) * 100 : null;
  const rssis = rows.map(r => r.rssi).filter(Number.isFinite);
  const avg = rssis.length ? rssis.reduce((s, x) => s + x, 0) / rssis.length : null;
  const latest = rows.at(-1);
  root.querySelector('#rel-received').textContent = String(rows.length);
  root.querySelector('#rel-missing').textContent = String(missing);
  root.querySelector('#rel-rate').textContent = rate == null ? '--%' : num(rate, 2) + '%';
  root.querySelector('#rel-rssi').textContent = avg == null ? '-- dBm' : num(avg, 1) + ' dBm';
  root.querySelector('#rel-last-rssi').textContent = Number.isFinite(latest.rssi) ? num(latest.rssi, 0) + ' dBm' : '-- dBm';
  root.querySelector('#rel-uptime').textContent = Number.isFinite(latest.uptime) ? formatDuration(latest.uptime) : '--';
  setState(payload.truncated ? 'Dữ liệu bị giới hạn bởi limit' : `${groups.size} phiên boot`, payload.truncated ? 'warn' : 'ok');
}
function setState(t, tone) { const e = root?.querySelector('#reliability-state'); if (e) { e.textContent = t; e.className = 'pill ' + tone; } }
function formatDuration(seconds) { const s = Math.max(0, Math.floor(seconds)); const d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return `${d} ngày ${h} giờ ${m} phút`; }
