import {gaugeSVG, setGauge} from "../ui/gauge.js";
import {num, levelCO2} from "../core/utils.js";
export function render(el) {
  el.innerHTML = `<h3>🌿 SCD41 Khí CO₂ &amp; Môi Trường <span class="pill off" id="co2-lv">--</span></h3>
   <div class="gauges">
    <div class="gauge">${gaugeSVG("g-co2","#2fe08a")}<div class="v" id="co2-v">--</div><span class="u">ppm CO₂</span></div>
    <div class="gauge">${gaugeSVG("g-temp","#ff9d4d")}<div class="v"><span id="temp-v">--</span>°C</div><span class="u">Độ ẩm: <span id="hum-v">--</span>%</span></div>
   </div>`;
}
export function update(l) {
  document.getElementById("co2-v").textContent = num(l.co2);
  document.getElementById("temp-v").textContent = num(l.temp, 1);
  document.getElementById("hum-v").textContent = num(l.hum);
  setGauge("g-co2", (l.co2 || 0) / 2000); setGauge("g-temp", ((l.temp || 0) - 10) / 40);
  const [t, c] = levelCO2(l.co2 || 0), lv = document.getElementById("co2-lv"); lv.textContent = t; lv.className = "pill " + c;
}
