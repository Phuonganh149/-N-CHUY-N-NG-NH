# Issue #11 Acceptance Criteria

Issue: https://github.com/hieunofun/cong-nghe-phan-mem/issues/11

Branch: `improve/issue-11-traceability`

## Measurable criteria

| ID | Acceptance criterion | Measurement | Required result | Actual result | Status |
| --- | --- | --- | --- | --- | --- |
| AC-01 | Chatbot runs on candidate UI | Login candidate, open `AI tu van` | AI widget opens on candidate dashboard | Opened on `/user/pages/dashboard.html` | Pass |
| AC-02 | Chatbot runs on Admin/HR UI | Login admin, open `Chat AI` | AI widget opens in admin context | Opened on `/admin/pages/dashboard.html`, title `AI Quan ly CV` | Pass |
| AC-03 | Candidate questions have non-empty replies | Send 5 candidate questions to `/api/chat` | 5/5 replies have length greater than 0 | 5/5 replies non-empty, reply lengths 575-732 | Pass |
| AC-04 | Admin/HR questions have non-empty replies | Send 5 admin questions to `/api/chat` | 5/5 replies have length greater than 0 | 5/5 replies non-empty, reply lengths 812-868 | Pass |
| AC-05 | Vietnamese no-accent input is handled | Send 2 no-accent questions | Intent/category should match the question domain | `muc luong ke toan` -> `hoi_luong/tai_chinh`; `loc cv ... nhan su` -> `hoi_cv/nhan_su` | Pass |
| AC-06 | Invalid API key does not crash chatbot | Run server with invalid `GROQ_API_KEY` | API returns fallback instead of error/crash | 10/10 API calls returned `fallback=true` and warning | Pass |
| AC-07 | Chat history stores at least 3 turns | Send quick prompt plus 3 messages, reload page | At least 3 user turns remain after reload | After reload: `userMessages=4`, `botMessages=5` | Pass |
| AC-08 | Clear history works | Click `Xoa` button | Stored conversation is cleared and greeting remains | After clear: `userMessages=0`, `botMessages=1` | Pass |
| AC-09 | Quick prompt works | Click candidate/admin quick prompt | Prompt is sent and bot reply is non-empty | Candidate and admin quick prompts produced bot replies | Pass |
| AC-10 | No uncaught JavaScript error | Check browser console after candidate/admin UI tests | No `Uncaught`, `ReferenceError`, `TypeError`, `SyntaxError` from app | Candidate `severeErrorCount=0`, Admin `severeErrorCount=0` | Pass |

## Test commands

```powershell
node --check scripts/serve.mjs
node --check jss/ai-chatbot-widget.js
```

Server used for fallback tests:

```powershell
$env:PORT='4311'
$env:GROQ_API_KEY='invalid_for_issue11_traceability'
node --experimental-sqlite scripts/serve.mjs
```

API endpoint used:

```text
POST http://localhost:4311/api/chat
```

## Result summary

| Total criteria | Pass | Fail |
| --- | --- | --- |
| 10 | 10 | 0 |

