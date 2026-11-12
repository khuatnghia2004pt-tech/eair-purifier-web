export const pad = n => String(n).padStart(2, "0");
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
export const hms = d => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
export const num = (v, dp = 0) => (v === undefined || v === null || Number.isNaN(+v)) ? "--" : (+v).toFixed(dp);
export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
// Mức chất lượng: trả về [nhãn, class]
export const levelCO2  = v => v < 800 ? ["Tốt","ok"] : v < 1200 ? ["Trung bình","warn"] : ["Kém","bad"];
export const levelPM25 = v => v <= 12 ? ["Sạch","ok"] : v <= 35 ? ["Khá","warn"] : ["Xấu","bad"];
export const levelVOC  = v => v <= 100 ? ["Tốt","ok"] : v <= 250 ? ["Trung bình","warn"] : ["Kém","bad"];

// Escape HTML để không chèn mã độc từ dữ liệu bên ngoài vào giao diện
export const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
