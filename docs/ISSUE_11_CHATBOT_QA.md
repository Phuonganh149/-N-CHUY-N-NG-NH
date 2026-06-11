# Issue #11 - Chatbot AI ho tro tuyen dung va tu van nghe nghiep

Issue: https://github.com/hieunofun/cong-nghe-phan-mem/issues/11

## Muc tieu

Hoan thien chatbot AI trong CVMS de phuc vu dung 2 nhom nguoi dung:

- Ung vien: hoi ve tim viec, nganh nghe, ky nang, muc luong, phong van, chuyen nganh va sua CV.
- Admin/HR nen tang: tra cuu nhanh du lieu tuyen dung, quan ly CV, cham diem ho so ung vien va goi y buoc xu ly tiep theo.

Chatbot phai van hoat dong on dinh khi chua cau hinh AI key hoac API AI bi loi.

## Pham vi trien khai

| Hang muc | File chinh | Ket qua |
| --- | --- | --- |
| Widget chatbot theo role | `jss/ai-chatbot-widget.js` | Tu tach che do ung vien va admin dua tren URL, hien quick prompt rieng cho tung role. |
| Luu lich su ngan trong phien | `jss/ai-chatbot-widget.js` | Dung `sessionStorage`, chi giu cac tin gan nhat de tranh qua tai prompt. |
| Xoa lich su chat | `jss/ai-chatbot-widget.js` | Nut `Xoa` xoa session history va khoi tao lai loi chao. |
| API chat co fallback | `scripts/serve.mjs` | `/api/chat` tra HTTP 200 voi cau tra loi du phong khi thieu/loi `GROQ_API_KEY`. |
| Nhan dien tieng Viet co dau/khong dau | `scripts/serve.mjs` | `normalizeSearchText`, `detectIntent`, `detectCategory` xu ly cau hoi nhu `muc luong`, `ke toan`, `phong van`. |
| Dua du lieu CVMS vao cau tra loi | `scripts/serve.mjs` | Prompt/fallback lay jobs, companies, applications de tra loi theo boi canh he thong. |
| Cham CV hang loat cho admin | `jss/ai-chatbot-widget.js`, `scripts/serve.mjs`, `admin/js/candidates.js` | Admin co nut cham CV, API batch luu `aiScore`, `aiFitLevel`, `aiEvaluation`, ket qua hien trong trang ung vien. |

## Acceptance criteria

| Tieu chi issue #11 | Trang thai | Chung cu trong code |
| --- | --- | --- |
| Chatbot hoat dong tren ung vien va admin | Dat | Widget duoc gan trong `user/pages/*` va `admin/pages/*`, role config tach `user_career` va `admin_cv_manage`. |
| Goi y cau hoi nhanh | Dat | `quickPrompts` rieng cho tung role trong `jss/ai-chatbot-widget.js`. |
| Luu lich su hoi thoai ngan | Dat | `cvms_ai_history_${mode}` trong `sessionStorage`, gui toi da cac tin gan nhat len API. |
| Xoa lich su hoi thoai | Dat | Nut `Xoa` goi `clearHistory()`. |
| Fallback khi thieu/loi AI key | Dat | `buildFallbackChatReply()` tra cau tra loi du phong va warning ro rang. |
| Ho tro tieng Viet khong dau | Dat | `normalizeSearchText()` bo dau va chuan hoa ky tu tieng Viet dac biet, loc intent/category bang tu khong dau. |
| Toi uu theo du lieu CVMS | Dat | `buildChatContext()` va `rankJobsForQuestion()` dua jobs/companies/applications vao cau tra loi. |
| Admin/HR loc va danh gia CV | Dat | `/api/applications/ai-assess-batch` cham CV hang loat, luu diem va hien trong `admin/js/candidates.js`. |
| Giao dien ro rang, khong hien API key | Dat | API key chi doc tu backend; widget khong co o nhap key. |

## QA checklist

| Ma QA | Khu vuc | Buoc kiem thu | Ket qua mong doi |
| --- | --- | --- | --- |
| QA-11-01 | Ung vien | Mo `user/pages/jobs.html`, bam `AI tu van`, hoi `co viec nao dang tuyen o Ha Noi?` | Chatbot tra loi theo viec lam CVMS, khong tra loi lan man ngoai tuyen dung. |
| QA-11-02 | Ung vien | Hoi khong dau: `muc luong ke toan khoang bao nhieu` | API nhan dien duoc intent luong va nganh tai chinh/ke toan, co cau tra loi phu hop. |
| QA-11-03 | Ung vien | Bam quick prompt ve ky nang/phong van | Noi dung prompt duoc gui vao chat va co phan hoi. |
| QA-11-04 | Ung vien | Gui vai tin lien tiep, reload trang trong cung phien | Lich su gan nhat van hien lai tu `sessionStorage`. |
| QA-11-05 | Ung vien/Admin | Bam nut `Xoa` | Lich su bien mat, hien lai loi chao ban dau. |
| QA-11-06 | Admin | Mo `admin/pages/candidates.html`, bam `Cham CV moi` | He thong goi batch assessment, luu diem AI neu ung vien co CV. |
| QA-11-07 | Admin | Mo chi tiet ung vien da cham | Hien `aiScore`, `aiFitLevel`, tom tat, diem manh, rui ro, cau hoi phong van va de xuat buoc tiep theo. |
| QA-11-08 | Backend | Chay server khong co `GROQ_API_KEY`, goi `/api/chat` | HTTP 200, `fallback: true`, co `warning` va cau tra loi du phong. |
| QA-11-09 | Backend | Cau hinh sai `GROQ_API_KEY`, goi `/api/chat` | API khong lam hong widget, van tra fallback va warning loi Groq. |
| QA-11-10 | Giao dien | Kiem tra mobile width khoang 390px | Widget vua man hinh, nut chat/khung chat khong tran noi dung chinh. |

## Lenh kiem tra nhanh

Kiem tra cu phap JavaScript:

```powershell
node --check scripts/serve.mjs
node --check jss/ai-chatbot-widget.js
node --check jss/data.js
```

Kiem tra fallback API khi server dang chay:

```powershell
Invoke-RestMethod -Method POST http://localhost:4173/api/chat `
  -ContentType 'application/json' `
  -Body '{"message":"muc luong ke toan khoang bao nhieu","mode":"user_career"}'
```

Kiem tra admin chat context:

```powershell
Invoke-RestMethod -Method POST http://localhost:4173/api/chat `
  -ContentType 'application/json' `
  -Body '{"message":"tom tat cac vi tri dang tuyen va checklist cham CV","mode":"admin_cv_manage"}'
```

## Gioi han

- Chatbot khong thay HR ra quyet dinh tuyen/loai cuoi cung; ket qua AI chi la goi y tham khao.
- Neu khong co `ANTHROPIC_API_KEY`, he thong van cham CV bang heuristic/fallback nhung khong doc sau noi dung file PDF/anh.
- Neu khong co `GROQ_API_KEY`, chatbot van tra loi theo du lieu CVMS nhung khong co kha nang suy luan sau nhu model AI that.
