import {ref, set, update as upd} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {db, devPath} from "../core/firebase.js";
const MODES = [["auto","Tự động (AUTO)"],["manual","Manual"],["fixed","Cố định (FIXED)"],["boost","Boost"],["sleep","Sleep"]];
let ctl = {mode:"auto", pwm:40, fixedPct:40, power:true}, timer;
const write = patch => upd(ref(db, devPath("control")), {...patch, updatedAt: Date.now()}).catch(e => alert("Không gửi được lệnh: " + e.message));
export function render(el) {
  el.innerHTML = `<h3>ĐIỀU KHIỂN QUẠT PWM</h3>
   <svg class="fanicon" id="fan-ico" viewBox="0 0 24 24" fill="none" stroke="#7fd4ff" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="12" r="1.8"/><path d="M12 10C12 5 8 3 6 5s0 5 4 6M14 12c5 0 7 4 5 6s-5 0-6-4M12 14c0 5 4 7 6 5s0-5-4-6M10 12c-5 0-7-4-5-6s5 0 6 4"/></svg>
   <div class="seg" id="fan-modes">${MODES.map(([k,t]) => `<button data-m="${k}">${t}</button>`).join("")}</div>
   <div class="small" id="fan-hint"></div>
   <div class="line"><span>Tốc độ quạt (PWM)</span><b id="fan-pct">0%</b></div>
   <input type="range" id="fan-range" min="0" max="100" step="5" value="40">
   <div class="line"><span>Công tắc nguồn quạt</span><button class="switch on" id="fan-sw" aria-label="Bật/tắt quạt"></button></div>
   <div class="small">Tốc độ thực tế đang chạy: <b id="fan-real">--</b>% · điều khiển: <b id="fan-why">--</b></div>
   <div class="small" id="fan-fc"></div>`;
  el.querySelectorAll("[data-m]").forEach(b => b.onclick = () => {
    if (b.dataset.m === "fixed") write({mode: "fixed", fixedPct: ctl.fixedPct});
    else write({mode: b.dataset.m});
  });
  const r = el.querySelector("#fan-range");
  r.oninput = () => { el.querySelector("#fan-pct").textContent = r.value + "%"; clearTimeout(timer);
    timer = setTimeout(() => write(ctl.mode === "fixed" ? {mode: "fixed", fixedPct: +r.value} : {mode: "manual", pwm: +r.value}), 300); };
  el.querySelector("#fan-sw").onclick = () => write({power: !ctl.power});
}
// Lệnh điều khiển (control) lấy trực tiếp từ DB để UI luôn khớp trạng thái thật
export function setControl(c) {
  ctl = {mode: c?.mode || "auto", pwm: c?.pwm ?? 40, fixedPct: c?.fixedPct ?? 40, power: c?.power ?? true};
  document.querySelectorAll("#fan-modes [data-m]").forEach(b => b.classList.toggle("on", b.dataset.m === ctl.mode));
  const r = document.getElementById("fan-range"); if (!r) return;
  r.disabled = !ctl.power; if (document.activeElement !== r) r.value = ctl.mode === "fixed" ? ctl.fixedPct : ctl.pwm;
  const adjustable = ctl.mode === "manual" || ctl.mode === "fixed";
  const activePct = ctl.mode === "fixed" ? ctl.fixedPct : ctl.pwm;
  document.getElementById("fan-pct").textContent = adjustable ? activePct + "%" : "--";
  document.getElementById("fan-sw").classList.toggle("on", ctl.power);
  document.getElementById("fan-hint").textContent = {auto:"Fuzzy Logic tự chỉnh quạt theo PM2.5, CO₂, VOC/NOx, có dự báo trước và học thói quen của bạn.",manual:"Kéo thanh trượt để đặt tốc độ.",boost:"Chạy 100% để lọc nhanh.",sleep:"Chạy êm 20%.",fixed:"Chạy quạt ở duty cố định để làm chế độ đối chứng thí nghiệm."}[ctl.mode];
}
export function update(l) {
  document.getElementById("fan-real").textContent = l.fanPct ?? "--";
  document.getElementById("fan-why").textContent = ({fuzzy:"Fuzzy",predict:"Dự báo (tăng trước)",habit:"Theo thói quen",failsafe:"An toàn (mất cảm biến)",boost:"Boost",sleep:"Sleep",manual:"Thủ công",fixed:"Cố định",tat:"Tắt"})[l.fanWhy] || "--";
  const fc = l.fc, box = document.getElementById("fan-fc");
  if (box) box.textContent = fc ? "Dự báo: " + [fc.pm15 != null && "15′ PM2.5 " + fc.pm15, fc.pm30 != null && "30′ PM2.5 " + fc.pm30, fc.co215 != null && "15′ CO₂ " + fc.co215]
      .filter(Boolean).join(" · ") + " → quạt dự kiến " + (fc.fan ?? "--") + "%" + (fc.conf ? " · độ hiểu thói quen " + fc.conf + "%" : "") : "";
  document.getElementById("fan-ico").classList.toggle("spin", (l.fanPct || 0) > 0 && l.power !== false);
  const ic = document.getElementById("fan-ico"); if (ic) ic.style.animationDuration = (2.2 - (l.fanPct || 0) / 60) + "s";
}
