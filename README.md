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
- Chatbot AI theo ngữ cảnh ứng viên/admin: ứng viên được tư vấn nghề nghiệp đa ngành, admin/HR được hỗ trợ quản lý và chấm CV.
- Chatbot có gợi ý câu hỏi nhanh, lưu/xóa lịch sử phiên, nhận diện tiếng Việt có dấu/không dấu và có phản hồi dự phòng khi chưa cấu hình key hoặc API lỗi.

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

`GROQ_API_KEY` dùng cho chatbot AI. Key chỉ cấu hình ở backend qua `.env` hoặc hằng `CODE_KEYS` trong `scripts/serve.mjs`; giao diện không hiển thị ô nhập API key. Nếu chưa cấu hình key hoặc Groq API lỗi, chatbot vẫn trả lời bằng chế độ dự phòng dựa trên dữ liệu tuyển dụng CVMS.

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
POST   /api/applications/ai-assess-batch
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
├── docs/
│   ├── ISSUE_9_CHATBOT_QA.md
│   └── ISSUE_11_CHATBOT_QA.md
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
- Tài liệu phạm vi 3 ngày và QA cho chatbot nằm tại `docs/ISSUE_9_CHATBOT_QA.md`.
- Tài liệu hoàn thiện chatbot AI theo issue #11 nằm tại `docs/ISSUE_11_CHATBOT_QA.md`.
- Evidence ảnh giao diện và kết quả test issue #11 nằm tại `docs/evidence/ISSUE_11_EVIDENCE.md`.
- `www/` là thư mục build cho mobile và không commit lên Git.
- Một số icon/chart dùng CDN, thiết bị cần internet để hiển thị đầy đủ.

## Tên đề tài

**Xây dựng ứng dụng quản lý tuyển dụng, hồ sơ CV và quy trình xét duyệt ứng viên cho doanh nghiệp.**


## C?p nh?t ki?n tr?c production

Phi?n b?n hi?n t?i ?u ti?n tri?n khai ch?nh th?c theo m? h?nh **HTML/CSS/JS + Node.js backend + Supabase hosted**.

- Supabase l? database/runtime ch?nh khi ch?y web.
- SQLite ch? d?ng ?? migrate d? li?u c? b?ng `npm.cmd run db:migrate:supabase`, kh?ng d?ng l?m production runtime.
- `SUPABASE_SERVICE_ROLE_KEY` ch? ???c ??t trong `.env` backend ho?c bi?n m?i tr??ng hosting, kh?ng ??a v?o frontend/GitHub.
- `.env` v? `supabase/.temp/` ?? ???c ignore.

### Vai tr?

- `user`: ?ng vi?n xem vi?c l?m, ?ng tuy?n, upload CV PDF private.
- `company`: doanh nghi?p ?? ???c x?c minh, t? mua g?i, ??ng tin, nh?n h? s?, m? CV b?ng v?, qu?n l? pipeline/l?ch ph?ng v?n.
- `admin`: qu?n tr? n?n t?ng, x?c nh?n g?i/n?p v?, ki?m duy?t tin, c?u h?nh hoa h?ng, xem doanh thu/ho?n ti?n/tranh ch?p. Admin kh?ng t?o tin/qu?n l? ?ng vi?n/pipeline thay doanh nghi?p.

### Lu?ng mua g?i

1. Doanh nghi?p g?i y?u c?u/mua g?i.
2. Doanh nghi?p chuy?n kho?n theo QR Vietcombank.
3. Admin x?c nh?n thanh to?n.
4. H? th?ng k?ch ho?t `company_subscriptions` v? x?c minh doanh nghi?p.
5. Doanh nghi?p t? t?o tin; tin ? tr?ng th?i `Ch? ki?m duy?t` cho t?i khi admin duy?t.

### Lu?ng v? v? m? CV

- M?i y?u c?u n?p v? c? m? chuy?n kho?n ri?ng.
- Admin x?c nh?n n?p v? b?ng RPC, c?ng v? ??ng m?t l?n v? ghi `wallet_transactions`.
- M? CV b?ng RPC, tr? ph? ??ng m?t l?n theo `application_accesses`, kh?ng cho s? d? ?m.
- Ph? m? CV d?ng t? l? 1%-2% v? c? min/max fee trong `commission_settings`.
- CV l?u trong bucket private `private-cvs`; backend ch? t?o signed URL ng?n h?n cho ?ng vi?n s? h?u CV ho?c doanh nghi?p ?? m? kh?a.

### Migration production m?i

C?c migration b? sung quan tr?ng:

```text
supabase/migrations/202606140001_production_hardening.sql
supabase/migrations/202606140002_subscription_booking_ref.sql
```

Ch?y ki?m tra/push migration:

```powershell
npx supabase db push --dry-run
npx supabase db push
```
