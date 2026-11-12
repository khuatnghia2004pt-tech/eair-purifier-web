import {$, store, hms, esc} from "../core/utils.js";
let KEY = "eair.notifs";                    // đổi theo tài khoản trong initNotifications (không dùng chung giữa các tài khoản)
let items = [], lastFired = {}, onGo = () => {};
const save = () => store.set(KEY, items.slice(0, 50));
const unread = () => items.filter(n => !n.read).length;

function paintBadge() { const b = $("#bell-badge"), n = unread(); b.textContent = n > 9 ? "9+" : n; b.classList.toggle("hidden", n === 0); }
function paintPanel() {
  const p = $("#notif");
  p.innerHTML = `<header><b>Thông báo (${unread()} chưa đọc)</b><span><button class="link" id="n-read">Đọc hết</button> · <button class="link" id="n-clear">Xóa</button></span></header>` +
    (items.length ? items.map((n, i) => `<div class="nitem ${n.read ? "" : "unread"}" data-i="${i}"><span>${esc(n.icon)}</span><div><b>${esc(n.title)}</b><small>${esc(n.text)}</small><small>${esc(n.time)}</small></div></div>`).join("")
                  : `<div class="empty">Chưa có thông báo nào</div>`);
  p.querySelector("#n-read").onclick = e => {
    e.stopPropagation();
    items.forEach(n => n.read = true); save(); paintBadge(); paintPanel();
  };
  p.querySelector("#n-clear").onclick = e => { e.stopPropagation(); items = []; save(); paintBadge(); paintPanel(); };
  p.querySelectorAll(".nitem").forEach(el => el.onclick = () => {
    const n = items[+el.dataset.i];
    n.read = true; save(); paintBadge(); paintPanel();
    p.classList.add("hidden"); onGo(n.target);       // nhấn thông báo → nhảy tới cảm biến liên quan
  });
}
export function initNotifications(goTo, uid) {
  KEY = "eair.notifs." + (uid || "anon"); items = store.get(KEY, []); lastFired = {};
  onGo = goTo; paintBadge();
  $("#btn-bell").onclick = e => { e.stopPropagation(); const p = $("#notif"); paintPanel(); p.classList.toggle("hidden"); };
  document.addEventListener("click", e => { if (!e.target.closest("#notif") && !e.target.closest("#btn-bell")) $("#notif").classList.add("hidden"); });
}
export function push(key, icon, title, text, target) {
  const now = Date.now(); if (lastFired[key] && now - lastFired[key] < 5 * 60e3) return;   // chống spam 5 phút
  lastFired[key] = now;
  items.unshift({key, icon, title, text, target, read: false, time: new Date().toLocaleString("vi-VN")}); save(); paintBadge();
  if (!$("#notif").classList.contains("hidden")) paintPanel();
}
export function syncDeviceAlarm(alarm) {
  const active = alarm?.active === true;
  const acknowledged = alarm?.acknowledged === true;
  if (!active || acknowledged) {
    let changed = false;
    items.forEach(n => {
      if (n.key === "device-alarm") { n.read = true; n.key = "device-alarm-closed-" + String(Date.now()); changed = true; }
    });
    lastFired["device-alarm"] = 0;
    if (changed) { save(); paintBadge(); if (!$("#notif").classList.contains("hidden")) paintPanel(); }
    return;
  }
  const reasons = Number(alarm?.reasons || 0);
  const detail = [];
  if (reasons & 1) detail.push("PM2.5 vượt ngưỡng");
  if (reasons & 2) detail.push("CO₂ vượt ngưỡng");
  if (reasons & 4) detail.push("AQS thấp");
  if (reasons & 8) detail.push("cảm biến cần kiểm tra");
  const message = detail.join(" · ") || "Thiết bị phát hiện điều kiện không an toàn";
  const existing = items.find(n => n.key === "device-alarm");
  if (existing) { existing.text = message; save(); }
  else push("device-alarm", "🚨", Number(alarm?.severity) >= 2 ? "Cảnh báo nguy hiểm" : "Cảnh báo chất lượng không khí", message, "aqs");
  paintBadge();
  if (!$("#notif").classList.contains("hidden")) paintPanel();
}

export function check(l, s) {
  if (l.pm25 > s.pm25Max) push("pm", "🌫️", "Bụi PM2.5 vượt ngưỡng", `PM2.5 = ${l.pm25} µg/m³ (ngưỡng ${s.pm25Max}).`, "pms7003");
  if (l.co2 > s.co2Max)   push("co2", "🌿", "CO₂ vượt ngưỡng", `CO₂ = ${l.co2} ppm (ngưỡng ${s.co2Max}).`, "scd41");
  if (l.voc > 250)        push("voc", "☣️", "Chỉ số VOC cao", `VOC index = ${l.voc}.`, "sgp41");
}
export const offlineAlert = () => push("off", "📡", "Thiết bị mất kết nối", "Không nhận dữ liệu mới từ ESP32-S3 trong 30 giây.", "fan");
