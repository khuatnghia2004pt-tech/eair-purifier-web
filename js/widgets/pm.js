import {num, levelPM25} from "../core/utils.js";
export function render(a, b) {
  a.innerHTML = `<h3>🌫️ PMS7003 Bụi mịn <span class="pill off" id="pm-lv">--</span></h3>
   <div class="row3"><div><div class="small">PM1.0</div><b id="pm1-v">--</b><div class="small">µg/m³</div></div>
   <div><div class="small">PM2.5</div><b id="pm25-v">--</b><div class="small">µg/m³</div></div>
   <div><div class="small">PM10</div><b id="pm10-v">--</b><div class="small">µg/m³</div></div></div>`;
  b.innerHTML = `<h3>Biểu đồ bụi (30 mẫu gần nhất)</h3><div class="bars" id="pm-bars"></div>`;
}
const hist = [];
export function update(l) {
  document.getElementById("pm1-v").textContent = num(l.pm1); document.getElementById("pm25-v").textContent = num(l.pm25); document.getElementById("pm10-v").textContent = num(l.pm10);
  const [t, c] = levelPM25(l.pm25 || 0), lv = document.getElementById("pm-lv"); lv.textContent = t; lv.className = "pill " + c;
  hist.push(l.pm25 || 0); if (hist.length > 30) hist.shift();
  const max = Math.max(50, ...hist), col = v => v <= 12 ? "#2fe08a" : v <= 35 ? "#ffb020" : "#ff5468";
  document.getElementById("pm-bars").innerHTML = hist.map(v => `<i style="height:${Math.max(4, v / max * 100)}%;background:${col(v)}"></i>`).join("");
}
