import {pad} from "../core/utils.js";
import {openCalendar} from "../ui/calendar.js";
const DOW = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
// DS3231 lưu GIỜ ĐỊA PHƯƠNG, nên ts là "epoch địa phương" → đọc bằng getUTC*
let offset = -new Date().getTimezoneOffset() * 60000;   // trước khi có dữ liệu: dùng giờ trình duyệt
export function render(el) {
  el.innerHTML = `<h3>🕒 DS3231 Thời Gian <span class="small">nhấn vào ngày để tra cứu</span></h3>
   <button class="datebtn" id="date-btn" title="Chọn ngày để xem/tải dữ liệu">📅 <span id="date-txt">--</span></button>
   <div class="clock-big" id="clock-txt">--:--:--</div>
   <div class="small">Cập nhật cuối: <span id="clock-last">--</span></div>`;
  el.querySelector("#date-btn").onclick = () => openCalendar();
  const tick = () => {
    const d = new Date(Date.now() + offset);
    el.querySelector("#date-txt").textContent = `${DOW[d.getUTCDay()]}, ${pad(d.getUTCDate())}/${pad(d.getUTCMonth()+1)}/${d.getUTCFullYear()}`;
    el.querySelector("#clock-txt").textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
  };
  tick(); setInterval(tick, 1000);
}
export function update(live) {
  if (live.ts > 1.7e9) offset = live.ts * 1000 - Date.now();
  const n = new Date(); document.getElementById("clock-last").textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
}
