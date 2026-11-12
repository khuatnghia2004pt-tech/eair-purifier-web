# E-Air Purifier – WEB (Firebase + Backend Gemini)

## Cấu trúc
```
index.html login.html verify.html dashboard.html admin.html
css/ · assets/rooms/ (icon SVG)
js/core/    firebase-config.js · firebase.js · profile.js · utils.js
js/ui/      sidebar · notifications · calendar · gauge
js/widgets/ clock · light · co2 · voc · pm · fan · analytics · assistant · building · energy · reliability · forecast
js/pages/   login · verify · dashboard · admin
database.rules.json   (Firebase Realtime Database Rules)
tests/web.test.mjs    (kiểm thử bằng Node)
```
Thư mục cũ `EAir_Web/EAir_Web` đã được làm phẳng thành `EAir_Web/`.

## 1. Cấu hình
`js/core/firebase-config.js`: điền `apiKey, authDomain, databaseURL, projectId, appId` (đây là cấu hình công khai của web app, không phải bí mật) và `BACKEND_URL` (địa chỉ `EAir_Backend`, ví dụ `http://localhost:8787`).

## 2. Bật trong Firebase Console
- Authentication → Sign-in method: bật **Email/Password** và **Google**; Settings → Authorized domains: thêm tên miền chạy web.
- Realtime Database → Rules → dán `database.rules.json` → Publish.

## 3. Tạo tài khoản (làm một lần)
**Admin**: Authentication → Add user (email `admin@eair.local`, **tự đặt mật khẩu mạnh**, không dùng mật khẩu mẫu). Sau đó Realtime Database → thêm `users/<UID>`:
`email: "admin@eair.local"`, `role: "admin"`, `disabled: false`, `createdAt: 0`. Đăng nhập bằng `admin` + mật khẩu.

**Thiết bị ESP32** (thay cho "Database secret" cũ): Authentication → Add user (ví dụ `eair01@device.local`, mật khẩu ngẫu nhiên dài). Thêm `users/<UID thiết bị>`:
`email: "eair01@device.local"`, `role: "device"`, `disabled: false`, `deviceId: "eair01"`, `createdAt: 0`. `deviceId` phải khớp `DEVICE_ID` trong firmware. Điền email/mật khẩu này vào `EAir_ESP32/include/secrets.h` (`DEVICE_EMAIL`, `DEVICE_PASSWORD`).

Trang **🛡 Quản trị**: xem/tìm tài khoản, đổi quyền, khóa/mở khóa (chặn ngay), gửi email đặt lại mật khẩu, tạo tài khoản Gmail, bật/tắt trợ lý giọng nói, kiểm tra trạng thái backend.

## 4. Ghép nhiều thiết bị / nhiều tài khoản
Xem `../docs/NHIEU_TAI_KHOAN.md`. Mỗi ESP32 phải có tài khoản Firebase riêng với `role: "device"` và `deviceId` khớp `DEVICE_ID` trong firmware. Gmail người dùng đã xác minh nhập ID + mã 8 số trên TFT; dashboard hỗ trợ chọn thiết bị đã ghép.

## 5. Đăng ký Gmail có xác minh
Đăng ký @gmail.com → Firebase gửi link xác minh → bấm link → "Tôi đã xác minh". Database Rules chặn dữ liệu nếu email chưa xác minh hoặc không phải @gmail.com (admin/device là ngoại lệ theo `role`).

## 6. Trợ lý AI (Gemini)
Web **không** gọi Gemini trực tiếp và **không** lưu khóa trong Firebase. Web gửi câu hỏi + Firebase ID token tới `EAir_Backend` (`POST /api/chat`); backend đọc số liệu cảm biến thật từ Firebase và gọi Gemini bằng biến môi trường `GEMINI_API_KEY`. Xem `EAir_Backend/README.md`.
Nếu trước đây bạn từng dán khóa vào trang Quản trị (lưu ở `config/ai/apiKey`), trang Quản trị sẽ cảnh báo – hãy **thu hồi khóa đó trong Google AI Studio** và xóa khỏi Firebase.

## 7. Dashboard MQTT/InfluxDB V3.1
Web thêm tổng quan tòa nhà, so sánh AQS theo phòng, điện năng AUTO/FIXED, độ tin cậy truyền thông và đánh giá forecast 15/30 phút. Lịch sử hỗ trợ 1h/6h/24h/7d/30d.

Web **không** kết nối trực tiếp Mosquitto/InfluxDB. `js/core/api.js` gửi Firebase ID token tới Backend; Backend kiểm tra quyền thiết bị trước khi truy vấn InfluxDB. `INFLUX_TOKEN` chỉ nằm trong biến môi trường backend.

Backend cần cấu hình `INFLUX_URL`, `INFLUX_ORG`, `INFLUX_BUCKET`, `INFLUX_TOKEN`. Nếu `nodeId` MQTT khác Firebase `deviceId`, cấu hình ánh xạ `INFLUX_NODE_MAP_JSON` ở backend. Xem `../docs/HUONG_DAN_TEST_WEB_V3.1_VA_GITHUB.md`.

## 8. Chạy local
`py -m http.server 8080` (Windows) hoặc `python -m http.server 8080` trong thư mục này → http://localhost:8080. Backend mặc định `http://localhost:8787`; origin local phải được thêm vào `ALLOWED_ORIGINS`.

## 9. GitHub Pages
Repository có workflow `.github/workflows/deploy-pages.yml` để deploy riêng `EAir_Web`. GitHub Pages chỉ host website tĩnh; Backend Node.js, Mosquitto, Node-RED và InfluxDB phải chạy ở dịch vụ/máy chủ riêng. Xem hướng dẫn nêu trên.

## 10. Kiểm thử
`node --test tests/web.test.mjs` – escape HTML, Rules đa thiết bị, pairing, tích hợp widgets mới, token API và kiểm tra không để lộ Influx token. Đăng nhập thật, CORS production, Firebase Rules và giao diện trên trình duyệt cần được test sau khi cấu hình dịch vụ thật.
