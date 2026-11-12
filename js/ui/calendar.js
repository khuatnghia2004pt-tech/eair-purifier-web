import {ref, get} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {db, devPath} from "../core/firebase.js";
import {pad, ymd, $, esc} from "../core/utils.js";
const MONTHS = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const COLS = ["time","pm1","pm25","pm10","co2","temp","hum","voc","nox","lux"];
const tstr = ts => { const d = new Date(ts * 1000); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; }; // ts = giờ địa phương của RTC

export function openCalendar(action) {
  const root = $("#modal-root"); let view = new Date(), sel = null, rows = [];
  root.innerHTML = `<div class="modal" id="cal-bg"><div class="cal">
    <div class="cal-head"><button class="iconbtn" id="c-prev">‹</button><b id="c-title"></b><button class="iconbtn" id="c-next">›</button></div>
    <div class="cal-grid" id="c-grid"></div><div class="cal-res" id="c-res">Chọn một ngày để truy xuất dữ liệu.</div>
    <div class="cal-act"><button class="btn" id="c-csv" disabled>⬇ Tải Excel/CSV</button><button class="btn sec" id="c-pdf" disabled>🖨 Báo cáo PDF</button><button class="btn sec" id="c-close">Đóng</button></div></div></div>`;
  const close = () => root.innerHTML = "";
  $("#c-close").onclick = close; $("#cal-bg").onclick = e => { if (e.target.id === "cal-bg") close(); };

  function draw() {
    const y = view.getFullYear(), m = view.getMonth(), first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate(), today = ymd(new Date());
    $("#c-title").textContent = `${MONTHS[m]} ${y}`;
    let h = ["CN","T2","T3","T4","T5","T6","T7"].map(d => `<div class="dow">${d}</div>`).join("") + "<span></span>".repeat(first);
    for (let d = 1; d <= days; d++) { const key = `${y}-${pad(m+1)}-${pad(d)}`;
      h += `<button data-d="${key}" class="${key === sel ? "sel" : ""} ${key === today ? "today" : ""} ${key > today ? "future" : ""}">${d}</button>`; }
    $("#c-grid").innerHTML = h;
    $("#c-grid").querySelectorAll("[data-d]").forEach(b => b.onclick = () => pick(b.dataset.d));
  }
  async function pick(day) {
    sel = day; draw(); $("#c-res").textContent = "Đang tải dữ liệu ngày " + day + "…"; $("#c-csv").disabled = $("#c-pdf").disabled = true;
    try {
      const s = await get(ref(db, devPath("history/" + day)));
      rows = s.exists() ? Object.values(s.val()).sort((a, b) => a.ts - b.ts) : [];
    } catch (e) { $("#c-res").textContent = "Lỗi tải dữ liệu: " + e.message; return; }
    if (!rows.length) { $("#c-res").textContent = `Ngày ${day}: không có dữ liệu.`; return; }
    const avg = k => (rows.reduce((a, r) => a + (+r[k] || 0), 0) / rows.length).toFixed(1);
    $("#c-res").innerHTML = `<b>Ngày ${day}</b>: ${rows.length} mẫu (${tstr(rows[0].ts)} → ${tstr(rows.at(-1).ts)})<br>PM2.5 TB ${avg("pm25")} µg/m³ · CO₂ TB ${avg("co2")} ppm · Nhiệt độ TB ${avg("temp")} °C · Độ ẩm TB ${avg("hum")} %`;
    $("#c-csv").disabled = $("#c-pdf").disabled = false;
    if (action === "csv") exportCsv(); if (action === "pdf") exportPdf();
  }
  const line = r => COLS.map(c => c === "time" ? tstr(r.ts) : (r[c] ?? "")).join(",");
  function exportCsv() {
    const csv = "\ufeff" + COLS.join(",") + "\n" + rows.map(line).join("\n");   // BOM để Excel đọc đúng
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], {type: "text/csv;charset=utf-8"}));
    a.download = `eair_${sel}.csv`; a.click(); URL.revokeObjectURL(a.href);
  }
  function exportPdf() {   // mở trang in → chọn "Lưu dưới dạng PDF"
    const w = open("", "_blank"); if (!w) return alert("Trình duyệt đang chặn cửa sổ bật lên.");
    w.document.write(`<title>Báo cáo ${esc(sel)}</title><style>body{font-family:Arial;padding:24px}table{border-collapse:collapse;width:100%;font-size:12px}td,th{border:1px solid #999;padding:4px 6px;text-align:right}th{background:#eee}</style>
      <h2>Báo cáo chất lượng không khí – ${esc(sel)}</h2><p>Số mẫu: ${rows.length}</p>
      <table><tr>${COLS.map(c => `<th>${c}</th>`).join("")}</tr>${rows.map(r => `<tr>${COLS.map(c => `<td>${esc(c === "time" ? tstr(r.ts) : (r[c] ?? ""))}</td>`).join("")}</tr>`).join("")}</table>`);
    w.document.close(); w.onload = () => w.print();
  }
  $("#c-csv").onclick = exportCsv; $("#c-pdf").onclick = exportPdf;
  $("#c-prev").onclick = () => { view.setMonth(view.getMonth() - 1); draw(); };
  $("#c-next").onclick = () => { view.setMonth(view.getMonth() + 1); draw(); };
  draw();
}
