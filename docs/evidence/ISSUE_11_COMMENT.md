# Comment to paste into Issue #11

Related to #11

Da bo sung traceability/evidence cho chatbot AI:

- Branch: `improve/issue-11-traceability`
- Evidence: `docs/evidence/ISSUE_11_EVIDENCE.md`
- Acceptance criteria: `docs/evidence/ISSUE_11_ACCEPTANCE_CRITERIA.md`

Lenh/kiem tra da chay:

```powershell
node --check scripts/serve.mjs
node --check jss/ai-chatbot-widget.js
```

Server fallback test:

```powershell
$env:PORT='4311'
$env:GROQ_API_KEY='invalid_for_issue11_traceability'
node --experimental-sqlite scripts/serve.mjs
```

Ket qua test:

- 5/5 cau hoi ung vien co response khong rong.
- 5/5 cau hoi Admin/HR co response khong rong.
- 2/2 cau tieng Viet khong dau duoc xu ly dung domain.
- Quick prompt hoat dong.
- Luu duoc 3+ luot hoi thoai va van con sau reload.
- Xoa lich su thanh cong.
- API key sai khong lam crash, API tra `fallback=true`.
- Khong co uncaught JavaScript error nghiem trong tu app CVMS.

Tong test evidence: 16

Pass: 16

Fail: 0

Ghi chu: Co log mang Statsig/Cloudflare tu browser tooling, khong phai loi JavaScript cua ung dung CVMS.

