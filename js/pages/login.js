import {auth} from "../core/firebase.js";
import {ADMIN_ALIAS, ADMIN_EMAIL, ALLOWED_EMAIL_DOMAIN} from "../core/firebase-config.js";
import {signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, sendEmailVerification,
        GoogleAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence, browserSessionPersistence, onAuthStateChanged}
  from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {$, $$} from "../core/utils.js";

const ERR = {
  "auth/invalid-credential":"Tài khoản hoặc mật khẩu không đúng.","auth/user-not-found":"Không tìm thấy tài khoản.",
  "auth/wrong-password":"Mật khẩu không đúng.","auth/email-already-in-use":"Email này đã được đăng ký.",
  "auth/weak-password":"Mật khẩu quá yếu (tối thiểu 6 ký tự).","auth/invalid-email":"Email không hợp lệ.",
  "auth/too-many-requests":"Thử quá nhiều lần, vui lòng đợi một lúc.","auth/network-request-failed":"Lỗi mạng.",
  "auth/popup-closed-by-user":"Bạn đã đóng cửa sổ đăng nhập Google.","auth/unauthorized-domain":"Tên miền này chưa được thêm vào Authentication → Settings → Authorized domains.",
  "auth/operation-not-allowed":"Chưa bật phương thức đăng nhập này trong Firebase Authentication.",
  "auth/invalid-api-key":"apiKey Firebase chưa đúng – kiểm tra js/core/firebase-config.js."
};
const errText = err => ERR[err.code] || ((err.code || "").includes("api-key") ? ERR["auth/invalid-api-key"] : err.message);
const say = (form, text, ok = false) => { const m = $(".msg", form); m.textContent = text; m.className = "msg " + (ok ? "ok" : "err"); };
const busy = (form, b) => $$("button.btn", form).forEach(x => x.disabled = b);
const toEmail = v => v.trim().toLowerCase() === ADMIN_ALIAS ? ADMIN_EMAIL : v.trim();
let registering = false;

onAuthStateChanged(auth, u => { if (u && !registering) location.replace("dashboard.html"); });

$$("[data-go]").forEach(b => b.onclick = () => $$("form[data-view]").forEach(f => f.classList.toggle("hidden", f.dataset.view !== b.dataset.go)));
$$("[data-eye]").forEach(b => b.onclick = () => { const i = $("#" + b.dataset.eye); i.type = i.type === "password" ? "text" : "password"; });

$("#f-login").onsubmit = async e => {
  e.preventDefault(); const f = e.target; busy(f, true); say(f, "");
  try {
    await setPersistence(auth, $("#l-remember").checked ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, toEmail($("#l-email").value), $("#l-pass").value);
  } catch (err) { say(f, errText(err)); busy(f, false); }
};
$("#btn-google").onclick = async () => {
  const f = $("#f-login"); busy(f, true); say(f, "");
  try { await signInWithPopup(auth, new GoogleAuthProvider()); } catch (err) { say(f, errText(err)); busy(f, false); }
};
$("#f-register").onsubmit = async e => {
  e.preventDefault(); const f = e.target; say(f, "");
  const email = $("#r-email").value.trim().toLowerCase();
  if (!email.endsWith("@" + ALLOWED_EMAIL_DOMAIN)) return say(f, `Chỉ nhận email @${ALLOWED_EMAIL_DOMAIN}.`);
  if ($("#r-pass").value !== $("#r-pass2").value) return say(f, "Hai mật khẩu không khớp.");
  busy(f, true); registering = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, $("#r-pass").value);
    await sendEmailVerification(cred.user);
    location.replace("verify.html");
  } catch (err) { registering = false; say(f, errText(err)); busy(f, false); }
};
$("#f-forgot").onsubmit = async e => {
  e.preventDefault(); const f = e.target; busy(f, true); say(f, "");
  try { await sendPasswordResetEmail(auth, toEmail($("#f-email").value)); say(f, "Đã gửi email đặt lại mật khẩu. Hãy kiểm tra hộp thư (cả mục Spam).", true); }
  catch (err) { say(f, errText(err)); }
  busy(f, false);
};

(() => {
  const c = $("#bg"), x = c.getContext("2d"); let W, H, P = [];
  const rs = () => { W = c.width = c.offsetWidth; H = c.height = c.offsetHeight; P = Array.from({length: 70}, () => ({x: Math.random()*W, y: Math.random()*H, r: 1+Math.random()*3, s: .2+Math.random()*.8})); };
  addEventListener("resize", rs); rs();
  (function loop() {
    x.clearRect(0, 0, W, H);
    for (const p of P) { p.x += p.s; p.y -= p.s*.25; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H;
      x.beginPath(); x.arc(p.x, p.y, p.r, 0, 7); x.fillStyle = `rgba(46,200,255,${.12+p.r*.06})`; x.fill(); }
    requestAnimationFrame(loop);
  })();
})();
