import {onAuthStateChanged, signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {ref, onValue} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {auth, db, devPath, setDevice} from "../core/firebase.js";
import {$} from "../core/utils.js";
import {ensureProfile, watchProfile} from "../core/profile.js";
import {initSidebar} from "../ui/sidebar.js";
import {initNotifications, check, offlineAlert, syncDeviceAlarm} from "../ui/notifications.js";
import {listDevices, chosen, remember} from "../core/devices.js";
import {openClaim} from "../ui/claim.js";
import * as clock from "../widgets/clock.js";
import * as light from "../widgets/light.js";
import * as co2 from "../widgets/co2.js";
import * as voc from "../widgets/voc.js";
import * as pm from "../widgets/pm.js";
import * as aqs from "../widgets/aqs.js";
import * as fan from "../widgets/fan.js";
import * as ana from "../widgets/analytics.js";
import * as ai from "../widgets/assistant.js";
import * as smart from "../widgets/smart.js";
import * as health from "../widgets/health.js";
import * as building from "../widgets/building.js";
import * as energy from "../widgets/energy.js";
import * as reliability from "../widgets/reliability.js";
import * as forecast from "../widgets/forecast.js";
import {apiGet} from "../core/api.js";

onAuthStateChanged(auth, user => {
  if (!user) return location.replace("login.html");
  $("#btn-user").textContent = (user.email || "?")[0].toUpperCase(); $("#btn-user").title = user.email;
  ensureProfile(user).then(p => {
    if (p.disabled) return lock();
    if (p.role !== "admin" && !user.emailVerified) return location.replace("verify.html");
    $("#btn-admin").classList.toggle("hidden", p.role !== "admin");
    watchProfile(user.uid, q => { if (!q) return; if (q.disabled) lock(); $("#btn-admin").classList.toggle("hidden", q.role !== "admin"); });
    start(user, p);
  }).catch(e => alert("Không đọc được hồ sơ tài khoản: " + e.message + "\nKiểm tra Database Rules."));
});
$("#btn-user").onclick = () => { if (confirm("Đăng xuất khỏi " + (auth.currentUser?.email || "tài khoản") + "?")) signOut(auth); };

function lock() { alert("Tài khoản của bạn đã bị khóa bởi quản trị viên."); signOut(auth); }
let started = false, lastRx = 0;
async function start(user, profile) {
  if (started) return; started = true;
  const sel = $("#dev-sel");
  $("#btn-addev").onclick = () => openClaim({uid: user.uid, role: profile.role, onDone: () => location.reload()});
  const ids = await listDevices(user.uid, profile.role);
  if (!ids.length) {
    initNotifications(() => {}, user.uid);
    setConn("Chưa ghép thiết bị", "off"); sel.classList.add("hidden");
    openClaim({uid: user.uid, role: profile.role, required: true, onDone: () => location.reload()});
    return;
  }

  const dev = chosen(user.uid, ids);
  setDevice(dev); remember(user.uid, dev); window.eairCurrentDevice = dev;
  sel.innerHTML = ids.map(id => `<option value="${id}" ${id === dev ? "selected" : ""}>📟 ${id}</option>`).join("");
  sel.classList.toggle("hidden", ids.length < 2);
  sel.onchange = () => { remember(user.uid, sel.value); window.eairCurrentDevice = sel.value; location.reload(); };

  clock.render($("#card-clock")); aqs.render($("#card-aqs")); light.render($("#card-lux")); co2.render($("#card-co2")); voc.render($("#card-voc"));
  pm.render($("#card-pm"), $("#card-pmbar")); fan.render($("#card-fan")); ai.render($("#card-ai"));
  smart.render($("#card-smart")); health.render($("#card-health"));
  ana.render($("#card-chart"), $("#card-set"), $("#card-stat"), $("#card-lib"));
  building.render($("#card-building")); energy.render($("#card-energy"));
  reliability.render($("#card-reliability")); forecast.render($("#card-forecast"));
  const show = initSidebar();
  initNotifications(sensor => {
    const room = ({scd41:"air",sgp41:"air",pms7003:"air",aqs:"air",health:"air",fan:"fan"})[sensor] || "all";
    show(room, sensor);
  }, user.uid);

  onValue(ref(db, devPath("alarm")), snap => syncDeviceAlarm(snap.val()));
  onValue(ref(db, devPath("ui")), snap => {
    const ui = snap.val(); const el = $("#device-ui");
    if (!el) return;
    if (!ui) { el.textContent = "MIC: -- · TFT: --"; el.className = "pill off"; return; }
    const pages = ["PM2.5", "CO₂", "VOC", "AQS", "Năng lượng"];
    const mic = ui.micEnabled === true ? "MIC: BẬT" : "MIC: TẮT";
    const page = Number.isInteger(Number(ui.displayPage)) ? pages[Number(ui.displayPage)] || "--" : "--";
    el.textContent = `${mic} · TFT: ${page}`; el.className = "pill ok";
  });
  onValue(ref(db, devPath("live")), snap => {
    const live = snap.val(); if (!live) return;
    lastRx = Date.now();
    [clock, aqs, light, co2, voc, pm, fan, ana, ai, smart].forEach(w => w.update(live));
    check(live, ana.getSettings());
  }, err => setConn("Lỗi: " + err.code, "bad"));
  onValue(ref(db, devPath("control")), snap => fan.setControl(snap.val()));
  onValue(ref(db, devPath("settings")), snap => { ana.setSettings(snap.val()); smart.setSettings(snap.val()); });
  onValue(ref(db, devPath("habit")), snap => smart.setHabit(snap.val()));
  onValue(ref(db, devPath("health")), snap => health.update(snap.val()));

  const historyRange = $("#history-range");
  const refreshInsights = async () => {
    await building.refresh(ids);
    try {
      const range = historyRange?.value || "6h";
      const data = await apiGet(`/api/telemetry?deviceId=${encodeURIComponent(getSelectedDevice())}&range=${encodeURIComponent(range)}&limit=20000`);
      energy.update(data); reliability.update(data); forecast.update(data);
    } catch (e) {
      const message = e.message || "Không tải được dữ liệu InfluxDB";
      ["#energy-state", "#reliability-state", "#forecast-state"].forEach(selector => {
        const el = document.querySelector(selector); if (el) { el.textContent = message; el.className = "pill warn"; }
      });
    }
  };
  historyRange?.addEventListener("change", refreshInsights);
  refreshInsights();
  setInterval(refreshInsights, 60000);

  setInterval(() => {
    if (!lastRx) return setConn("Chờ dữ liệu từ thiết bị…", "off");
    const online = Date.now() - lastRx < 30000;
    setConn(online ? "Thiết bị trực tuyến" : "Thiết bị ngoại tuyến", online ? "ok" : "bad");
    if (!online) offlineAlert();
  }, 3000);
}
function getSelectedDevice() { return document.querySelector("#dev-sel")?.value || (typeof window !== "undefined" ? window.eairCurrentDevice : null) || ""; }
function setConn(text, cls) { const el = $("#conn"); el.textContent = text; el.className = "pill " + cls; }
