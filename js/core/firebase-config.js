// ===================== ĐIỀN CHỖ NÀY SAU KHI TẠO LẠI FIREBASE =====================
// Firebase Console → Project settings → Your apps → Web app → SDK setup and configuration → Config
export const firebaseConfig = {
  apiKey:      "AIzaSyBVa4OdAt-E1_iAZrrHuoypIAszRZE7jJI",   // ĐIỀN: apiKey
  authDomain:  "chat-luong-khong-khi-fb7c7.firebaseapp.com",   // ĐIỀN: vd  ten-du-an.firebaseapp.com
  databaseURL: "https://chat-luong-khong-khi-fb7c7-default-rtdb.asia-southeast1.firebasedatabase.app",   // ĐIỀN: link Realtime Database, vd  https://ten-du-an-default-rtdb.firebaseio.com
  projectId:   "chat-luong-khong-khi-fb7c7",   // ĐIỀN: projectId
  appId:       "1:776890571881:web:dfff3863db1fb2276496f8"    // ĐIỀN: appId
};
// ===================================================================================

export const ADMIN_ALIAS = "admin";                // gõ "admin" ở ô đăng nhập
export const ADMIN_EMAIL = "admin@eair.local";     // email thật của tài khoản admin trong Firebase Authentication
export const ALLOWED_EMAIL_DOMAIN = "gmail.com";   // chỉ cho đăng ký bằng Gmail
// Địa chỉ BACKEND (thư mục EAir_Backend) – nơi giữ GEMINI_API_KEY. Ví dụ chạy thử: "http://localhost:8787"; triển khai thật: "https://eair-backend.example.com".
// Khóa Gemini KHÔNG nằm ở web, KHÔNG nằm trong Firebase: chỉ là biến môi trường GEMINI_API_KEY trên backend.
export const BACKEND_URL ="https://eair-purifier-backend.onrender.com";
