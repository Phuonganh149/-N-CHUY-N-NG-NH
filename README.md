# CVMS Recruitment

Ứng dụng quản lý tuyển dụng, hồ sơ CV và quy trình xét duyệt ứng viên cho doanh nghiệp.

Dự án đã có giao diện web, mobile app bằng Capacitor, backend API bằng Node.js và database Supabase/SQLite. Khi cấu hình Supabase trong `.env`, dữ liệu sẽ lưu trên Supabase; nếu chưa cấu hình thì app tự fallback về SQLite local. `localStorage` chỉ còn dùng để giữ phiên đăng nhập trên trình duyệt.

## Chức năng chính

- Trang giới thiệu doanh nghiệp và danh sách việc làm.
- Đăng ký, đăng nhập ứng viên và tài khoản admin/HR.
- Admin quản lý tin tuyển dụng.
- Ứng viên nộp đơn vào vị trí tuyển dụng.
- Admin quản lý danh sách ứng viên.
- Pipeline tuyển dụng theo từng giai đoạn.
- Báo cáo tổng quan.
- Hồ sơ ứng viên và upload/lưu CV vào database.
- Thông báo nội bộ cho admin và ứng viên.
- Phân tích CV bằng Claude API khi cấu hình `ANTHROPIC_API_KEY`.
- Chatbot AI tư vấn việc làm, CV, kỹ năng và phỏng vấn bằng Groq API.

## Tài khoản mặc định

Admin:

```text
Email: admincv@gmail.com
Mật khẩu: 123456
```

Ứng viên đăng ký trực tiếp tại:

```text
login.html
```

## Cài đặt

Cài dependencies:

```powershell
npm.cmd install
```

Tạo file `.env` từ mẫu:

```powershell
Copy-Item .env.example .env
```

Nội dung `.env`:

```text
PORT=4173
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=
```

`SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY` lấy trong Supabase Project Settings. `SERVICE_ROLE_KEY` chỉ được để ở backend `.env`, không đưa lên frontend hoặc GitHub.

`ANTHROPIC_API_KEY` chỉ cần điền nếu muốn dùng tính năng AI phân tích CV.

`GROQ_API_KEY` dùng cho chatbot AI. Key chỉ cấu hình ở backend qua `.env` hoặc hằng `CODE_KEYS` trong `scripts/serve.mjs`; giao diện không hiển thị ô nhập API key.

Google/GitHub/Facebook OAuth dùng cho đăng ký/đăng nhập nhanh. Callback URL khi chạy local:

```text
http://localhost:4173/api/auth/oauth/google/callback
http://localhost:4173/api/auth/oauth/github/callback
http://localhost:4173/api/auth/oauth/facebook/callback
```

Nếu chạy bằng port khác, thay `4173` bằng port đang dùng.

## Chạy local

```powershell
npm.cmd run dev
```

Mở:

```text
http://localhost:4173
```

Server sẽ chạy cả web static và API backend.

## Database Supabase

Để dùng Supabase:

1. Tạo project trên Supabase.
2. Vào SQL Editor.
3. Chạy toàn bộ file:

```text
supabase/schema.sql
```

4. Điền `.env`:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. Chạy lại server:

```powershell
npm.cmd run dev
```

Kiểm tra API:

```text
http://localhost:4173/api/health
```

Nếu trả về `"database":"supabase"` là đã dùng Supabase.

## Migrate SQLite lên Supabase

Nếu đã có dữ liệu local trong SQLite và muốn đẩy lên Supabase, chạy:

```powershell
npm.cmd run db:migrate:supabase
```

Lệnh này đọc `data/cvms.sqlite` và upsert vào các bảng Supabase.

## Database SQLite fallback

Database SQLite được tự tạo tại:

```text
data/cvms.sqlite
```

Các bảng chính:

```text
users
jobs
applications
notifications
cvs
```

Thư mục `data/` không commit lên Git để tránh đưa dữ liệu thật lên repository.

## API chính

```text
GET    /api/health
GET    /api/jobs
POST   /api/jobs
PATCH  /api/jobs/:id
POST   /api/jobs/:id/close
GET    /api/applications
POST   /api/applications
PATCH  /api/applications/:id/status
PATCH  /api/applications/:id/pipeline
GET    /api/notifications
POST   /api/notifications/read
POST   /api/auth/register
POST   /api/auth/login
PATCH  /api/users/profile
GET    /api/cvs
GET    /api/cvs/:email
PUT    /api/cvs/:email
DELETE /api/cvs/:email
POST   /api/analyze-cv
POST   /api/chat
```

## Mobile app

Mobile app dùng Capacitor. Mặc định app Android emulator gọi backend qua:

```text
http://10.0.2.2:4173
```

Nếu chạy trên máy thật hoặc server khác, đặt biến:

```powershell
$env:CAPACITOR_SERVER_URL="http://IP_MAY_CHU:4173"
npm.cmd run mobile:sync
```

Đồng bộ web assets và native project:

```powershell
npm.cmd run mobile:sync
```

Mở Android project:

```powershell
npm.cmd run mobile:android
```

Cần Android Studio và JDK 17 hoặc mới hơn để build APK.

## Cấu trúc thư mục

```text
.
├── Trangchu.html
├── Tuyendung.html
├── login.html
├── admin/
├── user/
├── css/
├── jss/
│   ├── ai-chatbot-widget.js
│   ├── data.js
│   └── notif-ui.js
├── scripts/
│   ├── db-adapter.mjs
│   ├── migrate-sqlite-to-supabase.mjs
│   ├── serve.mjs
│   └── prepare-mobile.mjs
├── supabase/
│   └── schema.sql
├── capacitor.config.ts
├── .env.example
└── package.json
```

## Ghi chú

- Mật khẩu tài khoản mới được băm bằng PBKDF2 trước khi lưu database.
- Backend tự chọn Supabase khi có `SUPABASE_URL` và `SUPABASE_SERVICE_ROLE_KEY`.
- Widget chatbot AI đã được gắn vào các trang web chính, admin và user.
- `www/` là thư mục build cho mobile và không commit lên Git.
- Một số icon/chart dùng CDN, thiết bị cần internet để hiển thị đầy đủ.

## Tên đề tài

**Xây dựng ứng dụng quản lý tuyển dụng, hồ sơ CV và quy trình xét duyệt ứng viên cho doanh nghiệp.**
