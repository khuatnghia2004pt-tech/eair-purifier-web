import {num, levelVOC} from "../core/utils.js";
export function render(el) {
  el.innerHTML = `<h3>☣️ SGP41 Chỉ Số Khí Độc <span class="pill off" id="voc-lv">--</span></h3>
   <div class="idx"><span>Chỉ số VOC:</span><b id="voc-v">--</b><span id="voc-bars"></span></div>
   <div class="idx"><span>Chỉ số NOx:</span><b id="nox-v">--</b><span id="nox-bars"></span></div>
   <div class="small">Thang chỉ số khí: 1–500 (100 = mức nền trung bình)</div>`;
}
const bars = (v, max) => { const n = Math.min(5, Math.ceil(5 * v / max)); return [0,1,2,3,4].map(i => `<i style="${i < n ? `background:${["#2fe08a","#9be04a","#ffd23d","#ff9d4d","#ff5468"][i]}` : ""}"></i>`).join(" "); };
export function update(l) {
  document.getElementById("voc-v").textContent = num(l.voc); document.getElementById("nox-v").textContent = num(l.nox);
  document.getElementById("voc-bars").innerHTML = bars(l.voc || 0, 500); document.getElementById("nox-bars").innerHTML = bars(l.nox || 0, 500);
  const [t, c] = levelVOC(l.voc || 0), lv = document.getElementById("voc-lv"); lv.textContent = t; lv.className = "pill " + c;
}
