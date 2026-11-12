import {auth} from "../core/firebase.js";
import {onAuthStateChanged, sendEmailVerification, signOut} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {$} from "../core/utils.js";
const say = (t, ok) => { const m = $("#v-msg"); m.textContent = t; m.className = "msg " + (ok ? "ok" : "err"); };
let cool = 0;
onAuthStateChanged(auth, u => {
  if (!u) return location.replace("login.html");
  if (u.emailVerified) return location.replace("dashboard.html");
  $("#v-email").textContent = u.email;
});
$("#v-check").onclick = async () => {
  const u = auth.currentUser; if (!u) return;
  await u.reload(); await u.getIdToken(true);          // làm mới token để Database Rules thấy email_verified
  if (u.emailVerified) location.replace("dashboard.html"); else say("Chưa thấy xác minh. Hãy bấm link trong Gmail trước.");
};
$("#v-resend").onclick = async () => {
  if (Date.now() < cool) return say("Vui lòng đợi một chút rồi gửi lại.");
  try { await sendEmailVerification(auth.currentUser); cool = Date.now() + 60000; say("Đã gửi lại link xác minh.", true); }
  catch (e) { say(e.code === "auth/too-many-requests" ? "Gửi quá nhiều lần, hãy đợi vài phút." : e.message); }
};
$("#v-out").onclick = () => signOut(auth).then(() => location.replace("login.html"));
