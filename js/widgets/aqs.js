const level = score => score >= 80 ? ["Tốt", "ok"] : score >= 60 ? ["Khá", "ok"] : score >= 40 ? ["Trung bình", "warn"] : ["Kém", "bad"];

export function render(el) {
  el.innerHTML = `<h3>🌿 AQS – Điểm chất lượng không khí <span class="pill off" id="aqs-level">Chưa có</span></h3>
    <div class="aqs-value"><b id="aqs-value">--</b><span>/100</span></div>
    <div class="aqs-track"><i id="aqs-bar"></i></div>
    <div class="small">100 = tốt hơn · Chỉ số tổng hợp nội bộ tức thời, không phải AQI/chứng nhận đạt chuẩn.</div>`;
}

export function update(l) {
  const value = document.getElementById("aqs-value");
  const badge = document.getElementById("aqs-level");
  const bar = document.getElementById("aqs-bar");
  if (!value || !badge || !bar) return;
  const score = l?.aqs;
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 100) {
    value.textContent = "--"; badge.textContent = "Chưa đủ dữ liệu"; badge.className = "pill off"; bar.style.width = "0%"; return;
  }
  const [name, color] = level(score);
  value.textContent = String(Math.round(score)); badge.textContent = name; badge.className = "pill " + color;
  bar.style.width = score + "%";
}
