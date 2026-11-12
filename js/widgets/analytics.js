import {ref, set, get} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {db, devPath} from "../core/firebase.js";
import {ymd, num} from "../core/utils.js";
import {openCalendar} from "../ui/calendar.js";
let chart, settings = {co2Max: 1000, pm25Max: 35, predictMin: 15, learn: true};
export const getSettings = () => settings;

export function render(chartEl, setEl, statEl, libEl) {
  chartEl.innerHTML = `<h3>PHÂN TÍCH (60 mẫu gần nhất)</h3><div style="height:230px"><canvas id="chart"></canvas></div>`;
  setEl.innerHTML = `<h3>CÀI ĐẶT NGƯỠNG AI</h3>
   <div class="line"><span>CO₂</span><b><span id="s-co2-v">1000</span> ppm</b></div><input type="range" id="s-co2" min="600" max="2000" step="50" value="1000">
   <div class="line"><span>PM2.5</span><b><span id="s-pm-v">35</span> µg/m³</b></div><input type="range" id="s-pm" min="10" max="150" step="5" value="35">
   <div class="small">Dùng cho chế độ AUTO và thông báo.</div>
   <div class="line"><span>Dự báo trước</span><select id="s-pred"><option value="0">Tắt</option><option value="15">15 phút</option><option value="30">30 phút</option></select></div>
   <div class="line"><span>Học thói quen của bạn</span><button class="switch on" id="s-learn" aria-label="Bật/tắt học thói quen"></button></div>
   <div class="small">AUTO tăng quạt trước khi không khí xấu đi (dựa xu hướng + giờ giấc quen thuộc) và nhớ cách bạn hay chỉnh quạt. Không bao giờ giảm quạt khi không khí đang xấu.</div>`;
  statEl.innerHTML = `<h3>THỐNG KÊ TRUNG BÌNH TUẦN</h3><div id="stat-body" class="small">Đang tính…</div>`;
  libEl.innerHTML = `<h3>THƯ VIỆN DỮ LIỆU</h3>
   <button class="exp" id="lib-xl">📗 Xuất dữ liệu (Excel/CSV)</button><button class="exp" id="lib-pdf">📕 Báo cáo PDF</button>
   <div class="small">Mở lịch để chọn ngày cần xuất.</div>`;
  libEl.querySelector("#lib-xl").onclick = () => openCalendar("csv");
  libEl.querySelector("#lib-pdf").onclick = () => openCalendar("pdf");

  chart = new Chart(chartEl.querySelector("#chart"), {type: "line",
    data: {labels: [], datasets: [
      {label: "PM2.5", data: [], borderColor: "#ff9d4d", tension: .35, pointRadius: 0, yAxisID: "y"},
      {label: "Nhiệt độ", data: [], borderColor: "#2ec8ff", tension: .35, pointRadius: 0, yAxisID: "y"},
      {label: "Độ ẩm", data: [], borderColor: "#2fe08a", tension: .35, pointRadius: 0, yAxisID: "y"},
      {label: "CO₂", data: [], borderColor: "#b388ff", tension: .35, pointRadius: 0, yAxisID: "y2"}]},
    options: {animation: false, maintainAspectRatio: false, interaction: {mode: "index", intersect: false},
      plugins: {legend: {labels: {color: "#cfe8ff", boxWidth: 12}}},
      scales: {x: {ticks: {color: "#8fb3d1", maxTicksLimit: 6}, grid: {color: "#123352"}},
               y: {ticks: {color: "#8fb3d1"}, grid: {color: "#123352"}},
               y2: {position: "right", ticks: {color: "#b388ff"}, grid: {display: false}}}}});

  const co2 = setEl.querySelector("#s-co2"), pm = setEl.querySelector("#s-pm");
  const save = () => set(ref(db, devPath("settings")), settings).catch(e => alert("Không lưu được ngưỡng: " + e.message));
  co2.oninput = () => { settings.co2Max = +co2.value; setEl.querySelector("#s-co2-v").textContent = co2.value; };
  pm.oninput  = () => { settings.pm25Max = +pm.value; setEl.querySelector("#s-pm-v").textContent = pm.value; };
  co2.onchange = pm.onchange = save;
  const pred = setEl.querySelector("#s-pred"), learn = setEl.querySelector("#s-learn");
  pred.onchange = () => { settings.predictMin = +pred.value; save(); };
  learn.onclick = () => { settings.learn = !settings.learn; learn.classList.toggle("on", settings.learn); save(); };
  weekStats();
}
export function setSettings(s) {
  if (!s) return;
  settings = {co2Max: s.co2Max ?? 1000, pm25Max: s.pm25Max ?? 35, predictMin: [0, 15, 30].includes(s.predictMin) ? s.predictMin : 15, learn: s.learn !== false};
  const c = document.getElementById("s-co2"), p = document.getElementById("s-pm"); if (!c) return;
  c.value = settings.co2Max; p.value = settings.pm25Max;
  document.getElementById("s-co2-v").textContent = settings.co2Max; document.getElementById("s-pm-v").textContent = settings.pm25Max;
  const pr = document.getElementById("s-pred"), lr = document.getElementById("s-learn");
  if (pr) pr.value = String(settings.predictMin); if (lr) lr.classList.toggle("on", settings.learn);
}
export function update(l) {
  if (!chart) return; const d = chart.data, t = new Date().toLocaleTimeString("vi-VN");
  d.labels.push(t); d.datasets[0].data.push(l.pm25); d.datasets[1].data.push(l.temp); d.datasets[2].data.push(l.hum); d.datasets[3].data.push(l.co2);
  if (d.labels.length > 60) { d.labels.shift(); d.datasets.forEach(s => s.data.shift()); }
  chart.update("none");
}
async function weekStats() {
  const acc = {pm25: [], co2: [], temp: [], hum: []}; let days = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    try { const s = await get(ref(db, devPath("history/" + ymd(d)))); if (!s.exists()) continue; days++;
      Object.values(s.val()).forEach(r => Object.keys(acc).forEach(k => { if (typeof r[k] === "number") acc[k].push(r[k]); })); } catch {}
  }
  const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  document.getElementById("stat-body").innerHTML = days ? `
    <div class="line"><span>PM2.5 TB</span><b>${num(avg(acc.pm25),1)} µg/m³</b></div>
    <div class="line"><span>CO₂ TB</span><b>${num(avg(acc.co2))} ppm</b></div>
    <div class="line"><span>Nhiệt độ TB</span><b>${num(avg(acc.temp),1)} °C</b></div>
    <div class="line"><span>Độ ẩm TB</span><b>${num(avg(acc.hum))} %</b></div>
    <div class="small">Từ ${days}/7 ngày có dữ liệu</div>` : "Chưa có dữ liệu lịch sử trong 7 ngày.";
}
