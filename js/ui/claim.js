import {$, esc} from "../core/utils.js";
import {claim, remember} from "../core/devices.js";
// Hộp thoại ghép thiết bị (ID + mã 8 số hiện trên màn hình thiết bị).
export function openClaim({uid, role, required = false, onDone}) {
  const root = $("#modal-root");
  root.innerHTML = `<div class="modal" id="cl-bg"><div class="cal claim">
    <h3>🔗 Ghép thiết bị</h3>
    <p class="small">${required ? "Tài khoản này chưa có thiết bị nào. " : ""}Nhập <b>ID</b> và <b>mã ghép 8 số</b> hiện luân phiên ở thanh dưới cùng TFT (dạng <code>ID:eair01 MA:12345678</code>). Mã sẽ đổi sau khi thiết bị ghi nhận tài khoản đã ghép.</p>${role === "admin" ? '<p class="small">Quản trị viên có thể nhập ID và để trống mã để đăng ký ID trong danh sách quản trị.</p>' : ''}
    <label>ID thiết bị<input id="cl-id" placeholder="eair01" autocomplete="off" autocapitalize="none"></label>
    <label>Mã ghép<input id="cl-code" inputmode="numeric" maxlength="8" placeholder="8 chữ số" autocomplete="off"></label>
    <div class="small claim-err" id="cl-err"></div>
    <div class="claim-row"><button class="btn" id="cl-ok">Ghép thiết bị</button>${required ? "" : `<button class="link" id="cl-x">Đóng</button>`}</div></div></div>`;
  const close = () => { root.innerHTML = ""; };
  if (!required) { $("#cl-x").onclick = close; $("#cl-bg").onclick = e => { if (e.target.id === "cl-bg") close(); }; }
  $("#cl-ok").onclick = async () => {
    const btn = $("#cl-ok"), err = $("#cl-err"); btn.disabled = true; err.textContent = "";
    try { const id = await claim(uid, role, $("#cl-id").value, $("#cl-code").value); remember(uid, id); close(); onDone(id); }
    catch (e) { err.textContent = e.message; btn.disabled = false; }
  };
}
