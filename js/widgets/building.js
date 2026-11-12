import {apiGet} from '../core/api.js';
import {esc, num} from '../core/utils.js';

let root;
export function render(el) {
  root = el;
  el.innerHTML = `<h3>🏢 TỔNG QUAN TÒA NHÀ <span class="pill off" id="building-state">Đang chờ dữ liệu MQTT</span></h3>
    <div class="building-summary" id="building-summary">
      <div class="building-kpi"><span>AQS trung bình</span><b id="building-avg">--</b><small>điểm / 100</small></div>
      <div class="building-kpi"><span>Phòng cần ưu tiên</span><b id="building-worst">--</b><small id="building-worst-score">AQS --</small></div>
      <div class="building-kpi"><span>Node có dữ liệu</span><b id="building-online">--</b><small>trong danh sách được ghép</small></div>
    </div>
    <div class="room-grid" id="building-rooms"><div class="empty">Dữ liệu InfluxDB sẽ xuất hiện sau khi Node-RED nhận telemetry.</div></div>
    <div class="small muted-note">AQS là chỉ số nội bộ của firmware. Trạng thái MQTT/Influx phản ánh dữ liệu đã được Node-RED ghi nhận, không phải chứng nhận tuân thủ tiêu chuẩn IAQ.</div>`;
}

export async function refresh(deviceIds) {
  if (!root) return;
  if (!Array.isArray(deviceIds) || !deviceIds.length) return setState('Chưa có thiết bị', 'off');
  try {
    const q = encodeURIComponent(deviceIds.join(','));
    const result = await apiGet('/api/building/summary?deviceIds=' + q);
    const s = result.summary || {};
    root.querySelector('#building-avg').textContent = num(s.meanAqs, 1);
    root.querySelector('#building-worst').textContent = s.worstRoom || '--';
    root.querySelector('#building-worst-score').textContent = s.worstAqs == null ? 'AQS --' : `AQS ${num(s.worstAqs, 1)}`;
    root.querySelector('#building-online').textContent = `${s.nodesOnline ?? 0}/${deviceIds.length}`;
    const rooms = root.querySelector('#building-rooms');
    if (!result.rooms?.length) rooms.innerHTML = `<div class="empty">Chưa có telemetry MQTT trong 10 phút gần nhất. Kiểm tra Mosquitto, Node-RED và cấu hình nodeId.</div>`;
    else rooms.innerHTML = result.rooms.map(r => {
      const level = r.aqs == null ? ['Thiếu AQS', 'off'] : r.aqs >= 80 ? ['Tốt', 'ok'] : r.aqs >= 60 ? ['Khá', 'ok'] : r.aqs >= 40 ? ['Trung bình', 'warn'] : ['Kém', 'bad'];
      return `<article class="room-tile"><div class="room-head"><b>${esc(r.roomName || r.nodeId)}</b><span class="pill ${level[1]}">${level[0]}</span></div>
        <div class="room-score">${num(r.aqs, 0)}<small>/100</small></div>
        <div class="room-metrics"><span>PM2.5 <b>${num(r.pm25, 1)}</b></span><span>CO₂ <b>${num(r.co2, 0)}</b></span><span>Quạt <b>${num(r.fanPct, 0)}%</b></span></div>
        <div class="small">Node ${esc(r.nodeId)} · ${r.ts ? new Date(r.ts).toLocaleString('vi-VN') : 'không rõ thời gian'}</div></article>`;
    }).join('');
    setState(`InfluxDB · ${result.rooms.length} node`, 'ok');
  } catch (e) { setState(e.message, 'warn'); }
}
function setState(text, tone) {
  const state = root?.querySelector('#building-state');
  if (state) { state.textContent = text; state.className = 'pill ' + tone; }
}
