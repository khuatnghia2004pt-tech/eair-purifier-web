import {gaugeSVG, setGauge} from "../ui/gauge.js";
import {num} from "../core/utils.js";
export function render(el) {
  el.innerHTML = `<h3>☀️ BH1750 Ánh Sáng <span class="pill off" id="lux-lv">--</span></h3>
   <div class="gauge" style="width:70%;margin:0 auto">${gaugeSVG("g-lux","#ffcf5c")}<div class="v"><span id="lux-v">--</span><br><span class="u">Lux</span></div></div>`;
}
export function update(l) {
  document.getElementById("lux-v").textContent = num(l.lux);
  setGauge("g-lux", Math.log10(1 + (l.lux || 0)) / 4);   // thang log 0..10 000 lux
  const lv = document.getElementById("lux-lv"), v = l.lux || 0;
  [lv.textContent, lv.className] = v < 50 ? ["Tối","pill off"] : v < 500 ? ["Vừa","pill ok"] : ["Sáng","pill warn"];
}
