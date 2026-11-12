import {ref, get, set, update, onValue} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {db} from "./firebase.js";
// Hồ sơ người dùng: users/<uid> = {email, role: "user"|"admin", disabled, createdAt, lastLogin}
export async function ensureProfile(user) {
  const r = ref(db, "users/" + user.uid), s = await get(r);
  if (!s.exists()) {
    const p = {email: user.email, role: "user", disabled: false, createdAt: Date.now(), lastLogin: Date.now()};
    await set(r, p); return p;
  }
  update(r, {lastLogin: Date.now()}).catch(() => {});
  return s.val();
}
export const watchProfile = (uid, cb) => onValue(ref(db, "users/" + uid), s => cb(s.val()));
