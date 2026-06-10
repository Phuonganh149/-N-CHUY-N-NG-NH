# Issue #9 - Chatbot AI CVMS trong 3 ngay

## Pham vi thuc hien

Issue #9 duoc thu gon theo huong de tai moi: "Xay dung ung dung quan ly tuyen dung, ho so CV va quy trinh xet duyet ung vien cho doanh nghiep".

Trong vong 3 ngay, chatbot chi tap trung vao cac tac vu can thiet cho CVMS:

- Tu van viec lam, muc luong, ky nang, phong van va CV cho ung vien.
- Ho tro admin nam nhanh vi tri dang tuyen va checklist xu ly CV.
- Dung du lieu viec lam, doanh nghiep va don ung tuyen co san trong he thong.
- Xu ly truong hop thieu `GROQ_API_KEY` hoac Groq API loi bang phan hoi du phong.
- Co goi y cau hoi nhanh va nut xoa lich su hoi thoai tren giao dien.

## Cong viec da cap nhat

| Hang muc | Ket qua |
| --- | --- |
| Chatbot dung ngu canh tuyen dung | Backend dua danh sach viec lam, doanh nghiep, don ung tuyen vao prompt va fallback. |
| Thieu API key | Khong bao loi tho; tra ve phan hoi du phong tu du lieu CVMS. |
| Groq API loi | Tra ve fallback co `warning` de giao dien thong bao de hieu. |
| Hoi thoai nhieu luot | Widget gui lich su gan nhat va luu lich su trong `sessionStorage`. |
| Goi y nhanh | Them cac nut cau hoi mau rieng cho admin va ung vien. |
| Xoa lich su | Them nut `Xoa` trong widget chatbot. |
| Kiem tra mobile | Widget giu kich thuoc theo `100vw/100vh`, co vung goi y cuon ngang. |

## Ke hoach 3 ngay

| Ngay | Noi dung |
| --- | --- |
| Ngay 1 | Ra soat chatbot, prompt, du lieu viec lam va loi khi thieu key. |
| Ngay 2 | Bo sung fallback, goi y nhanh, xoa lich su va luu ngu canh chat. |
| Ngay 3 | Kiem thu tren trang tuyen dung, trang user, trang admin va ghi lai ket qua QA. |

## Test case QA

| Ma | Man hinh | Cau hoi / thao tac | Ket qua mong doi |
| --- | --- | --- | --- |
| QA-01 | Trang tuyen dung | "Co viec nao dang tuyen o Ha Noi?" | Chatbot liet ke viec lam phu hop, co dia diem va luong neu co. |
| QA-02 | Trang tuyen dung | "Muc luong Frontend Developer khoang bao nhieu?" | Chatbot tra loi theo du lieu viec lam CVMS, khong noi ngoai ngu canh. |
| QA-03 | Trang tuyen dung | Bam goi y nhanh | Noi dung goi y duoc gui vao chatbot va co phan hoi. |
| QA-04 | Trang admin | "Checklist cham CV trong he thong CVMS" | Chatbot tra ve checklist xu ly CV cho admin. |
| QA-05 | Trang admin | Bam "Xoa" | Lich su chat bien mat, hien lai loi chao ban dau. |
| QA-06 | Backend khong co `GROQ_API_KEY` | Gui bat ky cau hoi nao | API `/api/chat` tra HTTP 200, `fallback: true` va thong bao de hieu. |
| QA-07 | Groq API loi | Key sai hoac mat ket noi API | API tra fallback thay vi lam widget dung o thong bao loi ky thuat. |

## Gioi han ngoai pham vi

- Khong huan luyen model AI rieng.
- Khong xay RAG/vector database rieng trong issue nay.
- Khong bat buoc doc noi dung file CV bang Groq; phan doc CV nang cao van thuoc luong `ANTHROPIC_API_KEY`.
- Khong thay doi toan bo quy trinh tuyen dung ngoai cac diem chatbot can ho tro.
