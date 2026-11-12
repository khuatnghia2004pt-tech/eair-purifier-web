import {num} from "../core/utils.js";
// Trực quan hóa hồ sơ Adaptive.h do ESP32 tự học. Không tự suy diễn dữ liệu còn thiếu.
let habit = null, settings = {predictMin: 15, learn: true}, last = {};
const get = (obj, i) => obj && obj[i] !== undefined && obj[i] !== null ? Number(obj[i]) : null;
const $id = id => document.getElementById(id);

export function render(el) {
  el.innerHTML = `<h3>🧠 AI DỰ BÁO & HỌC THÓI QUEN <span class="pill off" id="sm-state">Đang chờ dữ liệu</span></h3>
    <div class="line"><span>AI học môi trường và thói quen chỉnh quạt</span><b id="sm-samples">0 mẫu</b></div>
    <div class="seg" id="sm-days"><button data-day="wd" class="on">Ngày thường</button><button data-day="we">Cuối tuần</button></div>
    <div class="small">PM2.5 điển hình theo giờ (µg/m³)</div><div class="bars sm-bars" id="sm-bars"></div>
    <div class="sm-axis"><span>0h</span><span>6h</span><span>12h</span><span>18h</span><span>23h</span></div>
    <div class="line"><span>Chênh lệch quạt AI học được</span><b id="sm-bias">--</b></div>
    <div class="small" id="sm-quiet">Chưa có hồ sơ giờ yên tĩnh.</div>
    <div class="small" id="sm-forecast">Dự báo sẽ xuất hiện khi ESP32 thu đủ dữ liệu xu hướng.</div>
    <div class="small">Mô hình được lưu trên ESP32; cần thời gian vận hành để học. Dữ liệu trống không được thay bằng số 0.</div>`;
  el.querySelectorAll("#sm-days [data-day]").forEach(b => b.onclick = () => {
    el.querySelectorAll("#sm-days [data-day]").forEach(x => x.classList.toggle("on", x === b));
    paint();
  });
  paint();
}
export function setSettings(s) { settings = {...settings, ...(s || {})}; paint(); }
export function setHabit(h) { habit = h || null; paint(); }
export function update(l) { last = l || {}; paint(); }
function paint() {
  const bars = $id("sm-bars"); if (!bars) return;
  const day = document.querySelector("#sm-days [data-day].on")?.dataset.day || "wd";
  const key = day === "we" ? "pmWe" : "pmWd";
  const vals = Array.from({length:24}, (_, i) => get(habit?.[key], i));
  const present = vals.filter(v => v !== null && Number.isFinite(v));
  const max = Math.max(35, ...present);
  bars.innerHTML = vals.map((v, i) => {
    const h = v === null || !Number.isFinite(v) ? 3 : Math.max(4, Math.min(100, v / max * 100));
    const c = v === null ? "#33475c" : v <= 12 ? "#2fe08a" : v <= 35 ? "#ffb020" : "#ff5468";
    return `<i title="${i}h: ${v === null ? "chưa có mẫu" : v.toFixed(1) + " µg/m³"}" style="height:${h}%;background:${c}"></i>`;
  }).join("");
  $id("sm-samples").textContent = `${Number(habit?.n || 0).toLocaleString("vi-VN")} mẫu`;
  const bias = Array.from({length:24}, (_, i) => get(habit?.bias, i)).filter(v => v !== null && Number.isFinite(v));
  const avgBias = bias.length ? bias.reduce((a,b)=>a+b,0)/bias.length : null;
  $id("sm-bias").textContent = avgBias === null ? "Chưa đủ dữ liệu" : `${avgBias > 0 ? "+" : ""}${avgBias.toFixed(1)}% trung bình theo giờ`;
  const quietKey = day === "we" ? "quietWe" : "quietWd";
  const quiet = Array.from({length:24}, (_, i) => get(habit?.[quietKey], i));
  const q = quiet.reduce((best, v, i) => v !== null && Number.isFinite(v) && (!best || v > best.v) ? {h:i,v} : best, null);
  $id("sm-quiet").textContent = q && q.v >= .6 ? `Khung giờ thường chạy êm: khoảng ${q.h}:00 (mức quen thuộc ${(q.v*100).toFixed(0)}%).` : "Chưa nhận diện được khung giờ chạy êm rõ ràng.";
  const state = $id("sm-state");
  state.textContent = !habit ? "Chưa nhận dữ liệu học" : (settings.learn === false ? "Đã tắt học" : "Đang học trên ESP32");
  state.className = "pill " + (!habit ? "off" : settings.learn === false ? "warn" : "ok");
  const f = last.fc || {};
  const pm = f.pm15 ?? f.pm30, co = f.co215 ?? f.co230;
  $id("sm-forecast").textContent = pm !== undefined || co !== undefined
    ? `Dự báo ESP32: PM2.5 ${num(pm,0)} µg/m³ · CO₂ ${num(co,0)} ppm · quạt dự kiến ${num(f.fan,0)}% · độ tin cậy ${num(f.conf,0)}%.`
    : `Dự báo ${settings.predictMin === 0 ? "đang tắt" : "đang tích lũy xu hướng (cần tối thiểu khoảng 8 phút)"}.`;
}
