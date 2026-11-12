import {auth, getDevice} from "../core/firebase.js";
import {BACKEND_URL} from "../core/firebase-config.js";
import {esc} from "../core/utils.js";
// Trợ lý AI trên web: gọi BACKEND (/api/chat). Backend đọc số liệu cảm biến THẬT từ Firebase và gọi Gemini bằng GEMINI_API_KEY.
// Trình duyệt không bao giờ nhìn thấy khóa Gemini.
let history = [], busy = false;
const QUICK = ["Không khí hiện tại có tốt không?", "Nên chỉnh quạt thế nào?", "Xu hướng PM2.5 hôm nay ra sao?"];
const html = s => esc(s).replace(/\n/g, "<br>");

export function render(el) {
  el.innerHTML = `<h3>✨ Trợ lý AI (Gemini) <span class="pill off" id="ai-state">đang kiểm tra…</span></h3>
   <div class="chat" id="chat-box"><div class="msg-ai">Xin chào! Mình phân tích số liệu cảm biến thật và gợi ý cách chỉnh máy lọc.</div></div>
   <div class="chips">${QUICK.map(q => `<button class="chip">${esc(q)}</button>`).join("")}</div>
   <div class="chat-in"><input id="chat-input" maxlength="1000" placeholder="Hỏi về chất lượng không khí…" autocomplete="off"><button class="btn" id="chat-send">Gửi</button></div>`;
  el.querySelectorAll(".chip").forEach(b => b.onclick = () => ask(b.textContent));
  el.querySelector("#chat-send").onclick = () => ask(el.querySelector("#chat-input").value);
  el.querySelector("#chat-input").onkeydown = e => { if (e.key === "Enter") ask(e.target.value); };
  checkBackend();
}
function setState(t, c) { const s = document.getElementById("ai-state"); if (s) { s.textContent = t; s.className = "pill " + c; } }
async function checkBackend() {
  if (!BACKEND_URL) return setState("chưa cấu hình backend", "off");
  try {
    const j = await (await fetch(BACKEND_URL.replace(/\/+$/, "") + "/health")).json();
    setState(j.ai ? "sẵn sàng" : "backend thiếu GEMINI_API_KEY", j.ai ? "ok" : "warn");
  } catch { setState("không kết nối được backend", "bad"); }
}
export function update() {}                // số liệu do backend tự đọc từ Firebase
export function setConfig() {}             // giữ cho tương thích dashboard.js cũ

function add(cls, text) {
  const b = document.getElementById("chat-box"), d = document.createElement("div");
  d.className = cls; d.innerHTML = html(text); b.appendChild(d); b.scrollTop = b.scrollHeight; return d;
}
async function ask(text) {
  text = (text || "").trim(); if (!text || busy) return;
  const input = document.getElementById("chat-input"); input.value = "";
  add("msg-me", text);
  if (!BACKEND_URL) return add("msg-ai", "Chưa cấu hình BACKEND_URL trong js/core/firebase-config.js.");
  if (!auth.currentUser) return add("msg-ai", "Bạn cần đăng nhập.");
  busy = true; const wait = add("msg-ai", "…");
  try {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(BACKEND_URL.replace(/\/+$/, "") + "/api/chat", {
      method: "POST", headers: {"Content-Type": "application/json", "Authorization": "Bearer " + token},
      body: JSON.stringify({message: text, history: history.slice(-10), deviceId: getDevice()})});
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error || ("HTTP " + r.status));
    history.push({role: "user", text}, {role: "model", text: j.reply}); history = history.slice(-12);
    wait.innerHTML = html(j.reply) + (j.online === false ? "<br><small>⚠ Thiết bị đang ngoại tuyến, số liệu có thể đã cũ.</small>" : "");
  } catch (e) { wait.textContent = "Lỗi trợ lý AI: " + e.message; }
  busy = false; document.getElementById("chat-box").scrollTop = 1e9;
}
