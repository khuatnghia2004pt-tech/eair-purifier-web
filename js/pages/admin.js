import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth, onAuthStateChanged, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification, signOut}
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {ref, onValue, update, set} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {auth, db, devPath, setDevice} from "../core/firebase.js";
import {listDevices} from "../core/devices.js";
import {firebaseConfig, ALLOWED_EMAIL_DOMAIN, BACKEND_URL} from "../core/firebase-config.js";
import {ensureProfile} from "../core/profile.js";
import {$} from "../core/utils.js";

let me = null, users = {}, started = false;
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const fmt = t => t ? new Date(t).toLocaleString("vi-VN") : "--";

onAuthStateChanged(auth, async user => {
  if (!user) return location.replace("login.html");
  me = user;
  try {
    const p = await ensureProfile(user);
    if (p.disabled || p.role !== "admin") { alert("Bạn không có quyền quản trị."); return location.replace("dashboard.html"); }
  } catch (e) { alert("Lỗi đọc hồ sơ: " + e.message); return location.replace("dashboard.html"); }
  if (!started) { started = true; start(); }
});

async function start() {
  const ids = await listDevices(me.uid, "admin");
  if (ids.length) setDevice(ids[0]);
  onValue(ref(db, "users"), s => { users = s.val() || {}; draw(); }, e => alert("Không đọc được danh sách: " + e.code));
  let rx = 0;
  onValue(ref(db, devPath("live")), () => { rx = Date.now(); });
  setInterval(() => { const on = rx && Date.now() - rx < 30000, c = $("#conn"); c.textContent = "Thiết bị: " + (rx ? (on ? "trực tuyến" : "ngoại tuyến") : "chưa có dữ liệu"); c.className = "pill " + (on ? "ok" : rx ? "bad" : "off"); }, 2000);
  $("#q").oninput = draw; $("#n-add").onclick = addUser;
  onValue(ref(db, "config/ai"), x => {
    const c = x.val() || {}; $("#ai-voice-on").checked = c.voiceEnabled !== false;
    $("#ai-leak").classList.toggle("hidden", !c.apiKey);
  });
  checkBackend();
  $("#ai-save").onclick = async () => {
    const m = $("#ai-msg");
    try { await update(ref(db, "config/ai"), {voiceEnabled: $("#ai-voice-on").checked}); m.textContent = "Đã lưu."; m.className = "msg ok"; }
    catch (e) { m.textContent = e.message; m.className = "msg err"; }
  };
  $("#ai-purge").onclick = async () => {
    if (!confirm("Xóa apiKey khỏi Firebase? (Nhớ thu hồi khóa này trong Google AI Studio.)")) return;
    try { await set(ref(db, "config/ai/apiKey"), null); } catch (e) { alert(e.message); }
  };
}

async function checkBackend() {
  const el = $("#ai-backend");
  if (!BACKEND_URL) { el.textContent = "Chưa cấu hình BACKEND_URL trong js/core/firebase-config.js."; return; }
  try {
    const j = await (await fetch(BACKEND_URL.replace(/\/+$/, "") + "/health")).json();
    el.textContent = "Backend: trực tuyến · Gemini: " + (j.ai ? "đã có GEMINI_API_KEY" : "CHƯA có GEMINI_API_KEY") + " · xác thực Firebase: " + (j.auth ? "bật" : "chưa cấu hình FIREBASE_PROJECT_ID");
  } catch { el.textContent = "Không kết nối được backend (" + BACKEND_URL + ")."; }
}

function draw() {
  const list = Object.entries(users), q = $("#q").value.trim().toLowerCase();
  $("#st-all").textContent = list.length;
  $("#st-admin").textContent = list.filter(([, u]) => u.role === "admin").length;
  $("#st-lock").textContent = list.filter(([, u]) => u.disabled).length;
  $("#st-new").textContent = list.filter(([, u]) => Date.now() - (u.createdAt || 0) < 7 * 864e5).length;
  const rows = list.filter(([, u]) => !q || (u.email || "").toLowerCase().includes(q)).sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
  $("#rows").innerHTML = rows.map(([uid, u]) => { const self = uid === me.uid; return `<tr>
    <td>${esc(u.email)} ${self ? '<span class="me">(bạn)</span>' : ""}</td>
    <td><select class="rolesel" data-role="${uid}" ${self ? "disabled" : ""}><option value="user" ${u.role !== "admin" ? "selected" : ""}>Người dùng</option><option value="admin" ${u.role === "admin" ? "selected" : ""}>Quản trị</option></select></td>
    <td><span class="pill ${u.disabled ? "bad" : "ok"}">${u.disabled ? "Đã khóa" : "Hoạt động"}</span></td>
    <td>${fmt(u.createdAt)}</td><td>${fmt(u.lastLogin)}</td>
    <td class="act"><button data-lock="${uid}" class="danger" ${self ? "disabled" : ""}>${u.disabled ? "Mở khóa" : "Khóa"}</button>
      <button data-reset="${esc(u.email)}">Gửi mail đặt lại MK</button></td></tr>`; }).join("") || `<tr><td colspan="6" class="small">Không có tài khoản.</td></tr>`;
  document.querySelectorAll("[data-role]").forEach(s => s.onchange = () => {
    if (!confirm("Đổi quyền tài khoản này thành '" + s.value + "'?")) return draw();
    update(ref(db, "users/" + s.dataset.role), {role: s.value}).catch(e => alert(e.message)); });
  document.querySelectorAll("[data-lock]").forEach(b => b.onclick = () => {
    const u = users[b.dataset.lock], to = !u.disabled;
    if (confirm((to ? "Khóa" : "Mở khóa") + " tài khoản " + u.email + "?")) update(ref(db, "users/" + b.dataset.lock), {disabled: to}).catch(e => alert(e.message)); });
  document.querySelectorAll("[data-reset]").forEach(b => b.onclick = async () => {
    try { await sendPasswordResetEmail(auth, b.dataset.reset); alert("Đã gửi email đặt lại mật khẩu tới " + b.dataset.reset); } catch (e) { alert(e.message); } });
}

// Tạo tài khoản bằng app Firebase phụ để quản trị viên KHÔNG bị đăng xuất
async function addUser() {
  const email = $("#n-email").value.trim(), pass = $("#n-pass").value, role = $("#n-role").value, m = $("#n-msg");
  const say = (t, ok) => { m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); };
  if (!email || pass.length < 6) return say("Nhập email và mật khẩu tối thiểu 6 ký tự.");
  if (!email.toLowerCase().endsWith("@" + ALLOWED_EMAIL_DOMAIN)) return say(`Chỉ tạo được email @${ALLOWED_EMAIL_DOMAIN}.`);
  $("#n-add").disabled = true; say("Đang tạo…", true);
  try {
    const sec = initializeApp(firebaseConfig, "secondary-" + Date.now()), sAuth = getAuth(sec);
    const cred = await createUserWithEmailAndPassword(sAuth, email, pass);
    await set(ref(db, "users/" + cred.user.uid), {email, role, disabled: false, createdAt: Date.now(), lastLogin: null});
    await sendEmailVerification(cred.user).catch(() => {});
    await signOut(sAuth);
    say("Đã tạo " + email + " và gửi link xác minh về Gmail đó. Gửi mật khẩu tạm cho người dùng.", true);
    $("#n-email").value = $("#n-pass").value = "";
  } catch (e) { say(e.code === "auth/email-already-in-use" ? "Email này đã tồn tại." : e.message); }
  $("#n-add").disabled = false;
}
