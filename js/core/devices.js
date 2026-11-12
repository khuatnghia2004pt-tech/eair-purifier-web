import {ref, get, set, remove} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {db} from "./firebase.js";
import {store} from "./utils.js";
// Mỗi tài khoản chỉ thấy thiết bị đã GHÉP với mình: users/<uid>/devices/<id> = true  +  devices/<id>/members/<uid> = mã ghép.
// Quản trị viên xem được mọi thiết bị trong deviceList. Quyền thật sự do Database Rules quyết định.
const ID_RE = /^[a-z0-9_-]{3,32}$/;
export const validId = x => ID_RE.test(x);
export async function listDevices(uid, role) {
  try {
    const s = await get(ref(db, role === "admin" ? "deviceList" : `users/${uid}/devices`));
    return Object.keys(s.val() || {}).sort();
  } catch { return []; }
}
export const chosen = (uid, ids) => { const k = store.get("eair.dev." + uid, null); return ids.includes(k) ? k : (ids[0] || null); };
export const remember = (uid, id) => store.set("eair.dev." + uid, id);
export async function claim(uid, role, rawId, rawCode) {
  const id = String(rawId || "").trim().toLowerCase(), code = String(rawCode || "").trim();
  if (!validId(id)) throw new Error("ID thiết bị không hợp lệ (chữ thường, số, - hoặc _, dài 3–32 ký tự).");
  if (role === "admin" && !code) {
    // Quản trị viên có thể đăng ký ID trước; rules giới hạn thao tác này cho admin.
    await set(ref(db, `deviceList/${id}`), true);
    return id;
  }
  if (!/^[0-9]{8}$/.test(code)) throw new Error("Mã ghép gồm 8 chữ số, hiện trên màn hình thiết bị (thanh dưới cùng).");
  const memberRef = ref(db, `devices/${id}/members/${uid}`);
  try {
    await set(memberRef, code);
    await set(ref(db, `users/${uid}/devices/${id}`), true);
  } catch (e) {
    // Nếu bước ghi danh sách tài khoản thất bại, thu hồi membership vừa tạo để không bị ghép dở.
    try { await remove(memberRef); } catch {}
    throw new Error("Không ghép được thiết bị. Kiểm tra ID, mã 8 số, Gmail đã xác minh và Database Rules; mã có thể đã được dùng hoặc đã đổi.");
  }
  return id;
}
