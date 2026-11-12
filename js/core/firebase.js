import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {getDatabase} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import {firebaseConfig} from "./firebase-config.js";

if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
  document.body.insertAdjacentHTML("afterbegin",
    `<div style="position:fixed;inset:0;z-index:999;background:#07182b;color:#e8f3ff;display:grid;place-items:center;font-family:Arial;padding:24px">
     <div style="max-width:520px"><h2>⚙️ Chưa cấu hình Firebase</h2>
     <p>Mở file <b>js/core/firebase-config.js</b> và điền apiKey, authDomain, databaseURL, projectId, appId của dự án Firebase mới, rồi tải lại trang (Ctrl+F5).</p></div></div>`);
  throw new Error("Thiếu cấu hình Firebase trong js/core/firebase-config.js");
}
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
// ID thiết bị được chọn sau khi xác thực quyền thành viên; không dùng ID cố định trên toàn web.
let currentDeviceId = null;
export const setDevice = id => { currentDeviceId = id || null; };
export const getDevice = () => currentDeviceId;
export const devPath = (sub = "") => `devices/${currentDeviceId || "_none_"}${sub ? "/" + sub : ""}`;
