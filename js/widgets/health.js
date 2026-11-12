import {esc} from "../core/utils.js";
import {push} from "../ui/notifications.js";
// Sức khỏe cảm biến do ESP32 tính (SensorHealth.h). Đây là cảnh báo dựa trên TRIỆU CHỨNG, không phải kết luận hiệu chuẩn.
const SENSORS = [["pms", "PMS7003 – Bụi mịn", "pms7003"], ["scd", "SCD41 – CO₂/nhiệt/ẩm", "scd41"], ["sgp", "SGP41 – VOC/NOx", "sgp41"], ["bh", "BH1750 – Ánh sáng", "bh1750"], ["rtc", "DS3231 – Đồng hồ", "ds3231"]];
// bit cờ khớp enum Flag trong firmware
export const FLAGS = [
  [1,   "Thường xuyên không có dữ liệu → kiểm tra dây/nguồn/đầu nối"],
  [2,   "Chập chờn, hay mất rồi có lại → kiểm tra đầu nối, dây I²C/UART"],
  [4,   "Số đo đứng yên bất thường (kẹt giá trị) → khả năng hỏng cảm biến"],
  [8,   "Số đo vô lý (vd PM1 lớn hơn PM2.5, độ ẩm >100%) → khả năng hỏng/bẩn cảm biến"],
  [16,  "Nhiều khung dữ liệu lỗi → kiểm tra dây UART/nhiễu; nếu vẫn lỗi thì thay"],
  [32,  "Nền CO₂ 24 giờ bất thường → có thể lệch hiệu chuẩn (thử đưa ra ngoài trời ~10 phút so sánh với ~420 ppm) hoặc phòng ít thông gió"],
  [64,  "Đã dùng ≥80% tuổi thọ danh định → nên chuẩn bị thay"],
  [128, "Đã quá tuổi thọ danh định → nên thay"],
  [256, "Đồng hồ lệch nhiều so với NTP → kiểm tra/thay pin CR2032"],
  [512, "Hay chạm giới hạn dải đo (có thể do môi trường quá nặng hoặc cảm biến bão hòa)"]
];
const status = sc => sc >= 80 ? ["ok", "Tốt"] : sc >= 50 ? ["warn", "Theo dõi"] : ["bad", "Nên kiểm tra/thay"];
export function render(el) {
  el.innerHTML = `<h3>SỨC KHỎE CẢM BIẾN <span class="pill off" id="hl-pill">chưa có dữ liệu</span></h3><div id="hl-body" class="small">Đang chờ thiết bị gửi dữ liệu (cập nhật mỗi phút)…</div>
   <div class="small">Cảnh báo dựa trên triệu chứng (mất kết nối, kẹt giá trị, số đo vô lý, lỗi khung, nền CO₂, tuổi thọ). Không thay thế việc đối chiếu với thiết bị chuẩn.</div>`;
}
export function update(h) {
  const body = document.getElementById("hl-body"); if (!body) return;
  if (!h) return;
  const stale = h.ts && Date.now() / 1000 + 7 * 3600 - h.ts > 600;      // ts theo giờ VN; quá 10 phút không cập nhật
  let worst = 100;
  body.innerHTML = SENSORS.map(([k, name, target]) => {
    const s = h[k]; if (!s) return "";
    const [cls, txt] = status(s.sc); worst = Math.min(worst, s.sc);
    const msgs = FLAGS.filter(([bit]) => (s.fl & bit)).map(([, t]) => `<li>${esc(t)}</li>`).join("");
    if (s.sc < 50) push("hl-" + k, "🛠️", `Cảm biến ${name.split(" – ")[0]} có dấu hiệu hỏng`, FLAGS.filter(([bit]) => (s.fl & bit)).map(([, t]) => t).join("; ").slice(0, 160), target);
    return `<div class="hl-row"><div><b>${esc(name)}</b>${s.lf !== undefined ? `<small>Tuổi thọ đã dùng ${s.lf}%</small><div class="hl-life"><i style="width:${Math.min(100, s.lf)}%"></i></div>` : ""}</div>
      <div><span class="pill ${cls}">${s.sc}</span></div><div><b>${txt}</b>${msgs ? `<ul>${msgs}</ul>` : ""}</div></div>`;
  }).join("");
  const p = document.getElementById("hl-pill"), [c, t] = stale ? ["off", "dữ liệu cũ"] : status(worst);
  p.className = "pill " + c; p.textContent = t;
}
