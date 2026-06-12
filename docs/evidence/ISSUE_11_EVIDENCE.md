# Issue #11 Evidence - Chatbot AI CVMS

Issue: https://github.com/hieunofun/cong-nghe-phan-mem/issues/11

Traceability branch: `improve/issue-11-traceability`

Test date: 2026-06-12

## Test environment

```text
Local server: http://localhost:4311
Database: SQLite local
GROQ_API_KEY: invalid_for_issue11_traceability
Purpose: force real fallback path without using a real AI key
```

Syntax checks run:

```powershell
node --check scripts/serve.mjs
node --check jss/ai-chatbot-widget.js
```

Raw API summary: `issue-11-api-test-result.json`

## Test results

| Test ID | Chuc nang | Input | Ket qua mong doi | Ket qua thuc te | Pass/Fail | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| API-CAN-01 | Ung vien hoi tu van nghe nghiep | `Toi nen chon nganh marketing hay nhan su?` | API tra `mode=user_career`, response khong rong | `mode=user_career`, `intent=tim_viec`, `category=kinh_doanh`, `replyLength=602`, `fallback=true` | Pass | `/api/chat` tren `localhost:4311` |
| API-CAN-02 | Ung vien hoi muc luong | `Muc luong ke toan tong hop khoang bao nhieu?` | API tra response khong rong va nhan dien cau hoi luong | `mode=user_career`, `intent=hoi_luong`, `replyLength=604`, `fallback=true` | Pass | `/api/chat` tren `localhost:4311` |
| API-CAN-03 | Ung vien hoi phong van | `Lam sao chuan bi phong van vi tri nhan su?` | API tra response khong rong cho ung vien | `mode=user_career`, `replyLength=591`, `fallback=true` | Pass | `/api/chat` tren `localhost:4311` |
| API-CAN-04 | Ung vien hoi khong dau | `muc luong ke toan khoang bao nhieu` | Cau khong dau duoc xu ly dung luong/ke toan | `intent=hoi_luong`, `category=tai_chinh`, `replyLength=575`, `fallback=true` | Pass | No-accent API test |
| API-CAN-05 | Ung vien hoi khong dau ve CV | `toi can sua cv de ung tuyen marketing` | Cau khong dau duoc xu ly dung CV/marketing | `intent=hoi_cv`, `category=kinh_doanh`, `replyLength=732`, `fallback=true` | Pass | No-accent API test |
| API-ADM-01 | Admin/HR tom tat vi tri | `Tom tat cac vi tri dang tuyen` | API tra `mode=admin_cv_manage`, response khong rong | `mode=admin_cv_manage`, `replyLength=838`, `fallback=true` | Pass | `/api/chat` admin mode |
| API-ADM-02 | Admin/HR checklist cham CV | `Checklist cham CV trong CVMS` | API tra response khong rong ve quan ly/cham CV | `intent=hoi_cv`, `replyLength=812`, `fallback=true` | Pass | `/api/chat` admin mode |
| API-ADM-03 | Admin/HR so sanh ung vien | `So sanh ung vien phu hop cho vi tri ke toan` | API tra response khong rong cho tac vu HR | `mode=admin_cv_manage`, `replyLength=818`, `fallback=true` | Pass | `/api/chat` admin mode |
| API-ADM-04 | Admin/HR cau hoi phong van | `Goi y cau hoi phong van cho marketing` | API tra response khong rong cho phong van | `category=kinh_doanh`, `replyLength=868`, `fallback=true` | Pass | `/api/chat` admin mode |
| API-ADM-05 | Admin/HR hoi khong dau | `loc cv phu hop cho vi tri nhan su` | Cau khong dau duoc xu ly dung CV/nhan su | `intent=hoi_cv`, `category=nhan_su`, `replyLength=862`, `fallback=true` | Pass | No-accent admin API test |
| UI-CAN-01 | Quick prompt ung vien | Click quick prompt `Co viec nao dang tuyen o Ha Noi?` | Prompt duoc gui va bot tra response khong rong | Browser DOM co `userMessages=4`, `botMessages=5`, last bot text khong rong | Pass | In-app browser DOM test |
| UI-CAN-02 | Luu 3 luot hoi thoai | Gui 3 tin nhan sau quick prompt, reload trang | Sau reload van con it nhat 3 tin user va bot response | Sau reload: `userMessages=4`, `botMessages=5` | Pass | In-app browser reload test |
| UI-CAN-03 | Xoa lich su | Click nut `Xoa` trong chatbot | Lich su mat, chi con loi chao ban dau | Sau clear: `userMessages=0`, `botMessages=1` | Pass | In-app browser clear test |
| UI-ADM-01 | Chatbot Admin/HR | Login admin, mo `Chat AI`, click quick prompt admin | Hien AI Quan ly CV, co nut cham CV, bot tra response | `title=AI Quan ly CV`, `scoreBtn=1`, `promptCount=1`, bot text khong rong | Pass | In-app browser admin DOM test |
| SYS-01 | Fallback khi API key sai | Server chay voi `GROQ_API_KEY=invalid_for_issue11_traceability` | API khong crash, tra fallback va warning | Tat ca 10 API test co `fallback=true`, warning `Invalid API Key` | Pass | Forced invalid-key run |
| SYS-02 | Khong co uncaught JS error nghiem trong | Candidate/admin browser test | Khong co `Uncaught`, `ReferenceError`, `TypeError`, `SyntaxError` tu app CVMS | Candidate `severeErrorCount=0`, Admin `severeErrorCount=0` | Pass | Browser console filtered for severe app errors |

## Summary

| Total | Pass | Fail |
| --- | --- | --- |
| 16 | 16 | 0 |

## Notes

- Browser runner emitted external Statsig/Cloudflare network messages from the tooling environment. They were not CVMS page errors and were not counted as uncaught JavaScript errors in the app.
- Existing visual evidence files remain in this folder:
  - `issue-11-candidate-chatbot.png`
  - `issue-11-admin-chatbot.png`
- This update does not change chatbot runtime code; it improves traceability, measurable acceptance criteria and real test evidence for issue #11.
