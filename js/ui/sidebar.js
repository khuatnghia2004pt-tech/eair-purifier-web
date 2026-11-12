import {$, $$} from "../core/utils.js";
// Mỗi "phòng" = một nhóm cảm biến. Nhấn nhóm → lọc thẻ; nhấn cảm biến → chỉ hiện cảm biến đó.
const ROOMS = [
  {id:"all",   icon:"home",  name:"Tổng quan", sensors:[]},
  {id:"air",   icon:"air",   name:"Không khí", sensors:[["scd41","SCD41 – CO₂"],["sgp41","SGP41 – VOC/NOx"],["pms7003","PMS7003 – Bụi mịn"]]},
  {id:"env",   icon:"env",   name:"Môi trường", sensors:[["ds3231","DS3231 – Thời gian"],["bh1750","BH1750 – Ánh sáng"]]},
  {id:"fan",   icon:"fan",   name:"Điều khiển quạt", sensors:[["fan","Quạt PWM"]]},
  {id:"ai",    icon:"ai",    name:"Trợ lý AI", sensors:[["assistant","Trò chuyện"]]},
  {id:"chart", icon:"chart", name:"Phân tích", sensors:[["chart","Biểu đồ cảm biến"],["smart","Fuzzy / Adaptive & học thói quen"],["settings","Ngưỡng AI"],["stats","Thống kê tuần"],["health","Sức khỏe cảm biến"],["forecast","Đánh giá dự báo 15/30 phút"]]},
  {id:"building", icon:"home", name:"Tòa nhà", sensors:[["building","So sánh phòng & AQS"]]},
  {id:"energy", icon:"fan", name:"Năng lượng", sensors:[["energy","Điện năng quạt AUTO/FIXED"]]},
  {id:"network", icon:"data", name:"Truyền thông", sensors:[["reliability","MQTT & mất gói"]]},
  {id:"data",  icon:"data",  name:"Thư viện dữ liệu", sensors:[["library","Xuất dữ liệu"]]}
];
export function initSidebar() {
  const side = $("#side"), app = $("#app");
  side.innerHTML = ROOMS.map(r => `<div class="grp" data-g="${r.id}">
    <button data-room="${r.id}" title="${r.name}"><img src="assets/rooms/${r.icon}.svg" alt=""><span>${r.name}</span></button>
    <div class="subs">${r.sensors.map(([k, n]) => `<button data-s="${k}">${n}</button>`).join("")}</div></div>`).join("");
  const show = (group, sensor) => {
    $$("#grid .card").forEach(c => c.classList.toggle("hide-card",
      !(group === "all" || (sensor ? c.dataset.sensor === sensor : c.dataset.group === group))));
    $$(".grp > button").forEach(b => b.classList.toggle("on", b.dataset.room === group));
    $$(".grp").forEach(g => g.classList.toggle("expanded", g.dataset.g === group && group !== "all"));
    $$(".subs button").forEach(b => b.classList.toggle("on", b.dataset.s === sensor));
  };
  $$("[data-room]").forEach(b => b.onclick = () => { app.classList.add("open"); show(b.dataset.room); });
  $$("[data-s]").forEach(b => b.onclick = () => show(b.closest(".grp").dataset.g, b.dataset.s));
  $("#btn-menu").onclick = () => app.classList.toggle("open");
  show("all");
  return show;
}
