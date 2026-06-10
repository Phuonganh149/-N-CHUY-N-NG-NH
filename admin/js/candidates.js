/* ═══════════════════════════════════════════════════════════════
   admin/js/candidates.js — Quản lý ứng viên + Xem CV + Phân tích AI
═══════════════════════════════════════════════════════════════ */

const STATUS_LIST = ['Mới nộp','Đang xem xét','Phỏng vấn','Đã offer','Từ chối'];
const statusCls   = { 'Mới nộp':'badge-green','Đang xem xét':'badge-amber','Phỏng vấn':'badge-blue','Đã offer':'badge-purple','Từ chối':'badge-red' };
let companiesCache = [];

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function jsArg(value) {
    return escapeHTML(JSON.stringify(String(value ?? '')));
}

function renderAiScoreCell(app) {
    if (app.aiScore === null || app.aiScore === undefined || app.aiScore === '') {
        return '<span style="font-size:11px;color:var(--text-secondary)">Chưa chấm</span>';
    }
    const score = Number(app.aiScore) || 0;
    const color = score >= 80 ? '#16a34a' : score >= 65 ? 'var(--accent)' : score >= 50 ? '#d97706' : '#dc2626';
    return `
      <div style="display:flex;flex-direction:column;gap:3px;min-width:72px">
        <strong style="font-size:14px;color:${color}">${score}/100</strong>
        <span style="font-size:10px;color:var(--text-secondary)">${escapeHTML(app.aiFitLevel || 'Đã chấm')}</span>
      </div>`;
}

/* ── Render bảng ứng viên ── */
function renderCandidates(list) {
    const tbody = document.getElementById('candidateTableBody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-secondary)">Chưa có ứng viên nào.</td></tr>';
        return;
    }

    const allCVs = CVMS.getCVIndex();

    tbody.innerHTML = list.map(a => {
        const hasCv = !!allCVs[a.userEmail];
        return `
        <tr>
          <td>
            <div class="cname">${escapeHTML(a.userName || a.userEmail)}</div>
            <div class="cpos">${escapeHTML(a.userEmail)}</div>
          </td>
          <td>${escapeHTML(a.jobTitle)}<div class="cpos">${escapeHTML(a.company)}</div></td>
          <td style="color:var(--text-secondary)">${escapeHTML(a.date)}</td>
          <td>${escapeHTML(a.location)}</td>
          <td>${renderAiScoreCell(a)}</td>
          <td><span class="badge ${statusCls[a.status]||'badge-blue'}">${escapeHTML(a.status)}</span></td>
          <td style="font-size:12px;color:var(--text-secondary);max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHTML(a.adminNote||'—')}</td>
          <td>
            ${hasCv
              ? `<button class="action-btn" onclick="openCVModal(${jsArg(a.userEmail)}, ${jsArg(a.userName||a.userEmail)}, ${Number(a.id)})">
                   <i class="ti ti-file-text"></i> Xem CV
                 </button>`
              : `<span style="font-size:11px;color:var(--text-secondary)">Chưa có CV</span>`
            }
          </td>
          <td class="candidate-actions">
            <select class="filter-select" style="font-size:11px;padding:4px 6px" onchange="changeStatus(${a.id}, this.value)">
              ${STATUS_LIST.map(s => `<option value="${s}" ${s===a.status?'selected':''}>${s}</option>`).join('')}
            </select>
            <button class="action-btn icon-action" title="Chi tiết" onclick="openCandidateModal(${a.id})"><i class="ti ti-user-search"></i></button>
            <button class="action-btn icon-action" title="${a.sharedToCompany ? 'Đã gửi doanh nghiệp' : 'Gửi ứng viên cho doanh nghiệp'}" onclick="shareCandidateToCompany(${a.id})" ${a.sharedToCompany ? 'disabled style="opacity:.45"' : ''}>
              <i class="ti ti-send"></i>
            </button>
          </td>
        </tr>`;
    }).join('');

    const countEl = document.querySelector('.page-header span');
    if (countEl) countEl.textContent = `${list.length} ứng viên`;
}

/* ── Đổi trạng thái ── */
function changeStatus(appId, newStatus) {
    CVMS.updateApplicationStatus(appId, newStatus, '');
    filterCandidates();
    showAdminToast(`✅ Đã cập nhật → ${newStatus}`);
}

/* ── Thêm ghi chú ── */
function addNote(appId) {
    const app = CVMS.getApplications().find(a => a.id === appId);
    if (!app) return;
    openCandidateModal(appId);
}

function openCandidateModal(appId) {
    const app = CVMS.getApplications().find(a => a.id === appId);
    if (!app) return;
    ensureCandidateModal();
    document.getElementById('candidate-modal-title').textContent = app.userName || app.userEmail;
    document.getElementById('candidate-modal-sub').textContent = app.userEmail;
    document.getElementById('candidate-job-title').textContent = app.jobTitle || 'Chưa rõ vị trí';
    document.getElementById('candidate-company').textContent = app.company || 'CVMS';
    document.getElementById('candidate-location').textContent = app.location || '—';
    document.getElementById('candidate-date').textContent = app.date || '—';
    document.getElementById('candidate-email').textContent = app.userEmail || '—';
    document.getElementById('candidate-status-input').value = app.status || 'Mới nộp';
    document.getElementById('candidate-note-input').value = app.adminNote || '';
    document.getElementById('candidate-modal').dataset.appId = appId;
    document.getElementById('candidate-modal').style.display = 'flex';
}

function closeCandidateModal() {
    const modal = document.getElementById('candidate-modal');
    if (modal) modal.style.display = 'none';
}

function ensureCandidateModal() {
    if (document.getElementById('candidate-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'candidate-modal';
    modal.className = 'candidate-modal';
    modal.innerHTML = `
      <div class="candidate-dialog">
        <div class="candidate-dialog-head">
          <div>
            <h3 id="candidate-modal-title">Ứng viên</h3>
            <p id="candidate-modal-sub"></p>
          </div>
          <button class="modal-close" type="button" onclick="closeCandidateModal()" title="Đóng"><i class="ti ti-x"></i></button>
        </div>
        <div class="candidate-detail-grid">
          <div class="candidate-detail-card span-2">
            <span>Vị trí ứng tuyển</span>
            <strong id="candidate-job-title"></strong>
            <p><span id="candidate-company"></span> • <span id="candidate-location"></span></p>
          </div>
          <div class="candidate-detail-card">
            <span>Ngày nộp</span>
            <strong id="candidate-date"></strong>
          </div>
          <div class="candidate-detail-card">
            <span>Email</span>
            <strong id="candidate-email"></strong>
          </div>
          <label class="candidate-field">
            <span>Trạng thái</span>
            <select id="candidate-status-input">
              ${STATUS_LIST.map(status => `<option value="${status}">${status}</option>`).join('')}
            </select>
          </label>
          <label class="candidate-field span-2">
            <span>Ghi chú HR</span>
            <textarea id="candidate-note-input" rows="5" placeholder="Nhập nhận xét, lịch hẹn phỏng vấn, hoặc lý do cập nhật trạng thái..."></textarea>
          </label>
        </div>
        <div class="candidate-modal-actions">
          <button class="action-btn" type="button" onclick="closeCandidateModal()">Hủy</button>
          <button class="add-btn" type="button" onclick="saveCandidateDetail()"><i class="ti ti-device-floppy"></i> Lưu cập nhật</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeCandidateModal(); });
}

function saveCandidateDetail() {
    const modal = document.getElementById('candidate-modal');
    const appId = Number(modal?.dataset.appId);
    if (!appId) return;
    const status = document.getElementById('candidate-status-input').value;
    const note = document.getElementById('candidate-note-input').value.trim();
    CVMS.updateApplicationStatus(appId, status, note);
    closeCandidateModal();
    filterCandidates();
    showAdminToast('✅ Đã lưu cập nhật ứng viên!');
}

function shareCandidateToCompany(appId) {
    const app = CVMS.getApplications().find(a => Number(a.id) === Number(appId));
    if (!app) return;
    const note = app.aiScore !== null && app.aiScore !== undefined
        ? `AI chấm ${app.aiScore}/100 - ${app.aiFitLevel || 'Đã đánh giá'}`
        : 'Admin gửi hồ sơ để doanh nghiệp xem xét.';
    try {
        CVMS.shareApplicationWithCompany(appId, note);
        filterCandidates();
        showAdminToast('✅ Đã gửi ứng viên sang doanh nghiệp.');
    } catch (error) {
        showAdminToast('⚠️ Không gửi được: ' + error.message);
    }
}

/* ── Filter ── */
function filterCandidates() {
    const status = document.getElementById('statusFilter')?.value || '';
    const q      = (document.getElementById('searchCandidate')?.value || '').toLowerCase();
    const companyId = Number(document.getElementById('companyCandidateFilter')?.value || 0);
    const all    = CVMS.getApplications();
    renderCandidates(all.filter(a =>
        (!status || a.status === status) &&
        (!companyId || Number(a.companyId) === companyId) &&
        (!q || (a.userName||'').toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q) || a.userEmail.toLowerCase().includes(q))
    ));
}

function refreshCompanyFilters() {
    companiesCache = CVMS.getCompanies();
    const select = document.getElementById('companyCandidateFilter');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Tất cả doanh nghiệp</option>' + companiesCache.map(company =>
        `<option value="${Number(company.id)}">${escapeHTML(company.name)}</option>`
    ).join('');
    select.value = current;
}

/* ══════════════════════════════════════════════════════════════
   MODAL XEM CV + PHÂN TÍCH AI
══════════════════════════════════════════════════════════════ */
function openCVModal(email, name, appId) {
    const cvData = CVMS.getCV(email);
    if (!cvData) { showAdminToast('⚠️ Không tìm thấy CV của ứng viên này.'); return; }
    const appData = CVMS.getApplications().find(a => Number(a.id) === Number(appId)) || null;

    // Tạo modal nếu chưa có
    let modal = document.getElementById('cv-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cv-modal';
        modal.style.cssText = `
            display:none;position:fixed;inset:0;z-index:2000;
            background:rgba(0,0,0,.55);backdrop-filter:blur(4px);
            align-items:center;justify-content:center;padding:20px`;
        modal.innerHTML = `
            <div style="background:var(--bg-card);border-radius:var(--radius-lg);width:100%;max-width:900px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 80px rgba(0,0,0,.35)">
              <!-- Header -->
              <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--border)">
                <div>
                  <div style="font-weight:700;font-size:16px" id="modal-title">CV Ứng viên</div>
                  <div style="font-size:12px;color:var(--text-secondary)" id="modal-sub"></div>
                </div>
                <button onclick="closeCVModal()" style="background:none;border:none;font-size:22px;cursor:pointer;color:var(--text-secondary)">✕</button>
              </div>

              <!-- Body: 2 cột -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;flex:1;overflow:hidden;min-height:0">

                <!-- Cột trái: Preview CV -->
                <div style="padding:20px;border-right:1px solid var(--border);overflow-y:auto;display:flex;flex-direction:column;gap:12px">
                  <div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px">📎 File CV</div>
                  <div id="cv-preview-area" style="flex:1;min-height:400px;border:1px solid var(--border);border-radius:var(--radius-md);overflow:hidden;background:var(--bg)"></div>
                  <div id="cv-file-info" style="font-size:11px;color:var(--text-secondary)"></div>
                </div>

                <!-- Cột phải: Phân tích AI -->
                <div style="padding:20px;overflow-y:auto;display:flex;flex-direction:column;gap:14px">
                  <div style="display:flex;align-items:center;justify-content:space-between">
                    <div style="font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px">🤖 AI chấm phù hợp</div>
                    <button id="ai-analyze-btn" onclick="analyzeCV()" style="padding:7px 14px;background:var(--accent);color:#fff;border:none;border-radius:var(--radius-md);font-size:12px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:6px">
                      <i class="ti ti-sparkles"></i> Chấm ngay
                    </button>
                  </div>
                  <div id="ai-result" style="flex:1;font-size:13px;line-height:1.7">
                    <div style="color:var(--text-secondary);text-align:center;padding:40px 20px">
                      <div style="font-size:40px;margin-bottom:12px">🤖</div>
                      <div>Nhấn <strong>"Chấm ngay"</strong> để AI đánh giá CV theo vị trí ứng tuyển</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) closeCVModal(); });
    }

    // Điền dữ liệu
    document.getElementById('modal-title').textContent = `CV — ${name}`;
    const industries = (cvData.industries || []).join(', ');
    document.getElementById('modal-sub').textContent   = `${cvData.name} • ${(cvData.size/1024).toFixed(0)} KB • Tải lên: ${cvData.uploadedAt}${industries ? ' • Ngành: ' + industries : ''}${appData ? ' • Ứng tuyển: ' + appData.jobTitle : ''}`;
    document.getElementById('cv-file-info').textContent = `Định dạng: ${cvData.ext.toUpperCase()}`;

    // Preview
    const previewArea = document.getElementById('cv-preview-area');
    const ext = cvData.ext;
    if (['jpg','jpeg','png'].includes(ext)) {
        previewArea.innerHTML = `<img src="${cvData.base64}" style="width:100%;height:100%;object-fit:contain">`;
    } else if (ext === 'pdf') {
        previewArea.innerHTML = `<iframe src="${cvData.base64}" style="width:100%;height:100%;border:none;min-height:400px"></iframe>`;
    } else {
        // Word doc - không preview được, hiển thị icon + download
        previewArea.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:16px;padding:32px">
              <div style="font-size:64px">📝</div>
              <div style="font-weight:600">${cvData.name}</div>
              <div style="font-size:12px;color:var(--text-secondary)">File Word không thể preview trực tiếp</div>
              <a href="${cvData.base64}" download="${cvData.name}" style="padding:10px 20px;background:var(--accent);color:#fff;border-radius:var(--radius-md);text-decoration:none;font-size:13px;font-weight:600">
                ⬇️ Tải xuống để xem
              </a>
            </div>`;
    }

    // Reset AI result
    document.getElementById('ai-result').innerHTML = appData?.aiScore !== null && appData?.aiScore !== undefined
      ? renderStoredAssessment(appData)
      : `
        <div style="color:var(--text-secondary);text-align:center;padding:40px 20px">
          <div style="font-size:40px;margin-bottom:12px">🤖</div>
          <div>Nhấn <strong>"Chấm ngay"</strong> để AI đánh giá CV theo vị trí ứng tuyển</div>
        </div>`;

    // Lưu data vào modal để analyzeCV dùng
    modal._cvData = cvData;
    modal._name   = name;
    modal._appData = appData;

    modal.style.display = 'flex';
}

function closeCVModal() {
    const modal = document.getElementById('cv-modal');
    if (modal) modal.style.display = 'none';
}

/* ── Phân tích CV bằng Claude AI ── */
async function analyzeCV() {
    const modal  = document.getElementById('cv-modal');
    const cvData = modal?._cvData;
    const appData = modal?._appData;
    if (!cvData) return;

    const btn       = document.getElementById('ai-analyze-btn');
    const resultEl  = document.getElementById('ai-result');

    btn.disabled   = true;
    btn.innerHTML  = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> Đang phân tích...';
    resultEl.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:12px">
          ${[1,2,3,4,5].map(()=>`<div style="height:18px;background:var(--border);border-radius:6px;animation:pulse 1.2s ease infinite"></div>`).join('')}
        </div>`;

    try {
        // Chuẩn bị content gửi cho Claude
        let messages;
        const ext = cvData.ext;
        const isImage = ['jpg','jpeg','png'].includes(ext);
        const isPDF   = ext === 'pdf';

        const targetIndustries = (cvData.industries || []).join(', ') || 'đa ngành';
        const jobContext = appData
            ? `Vị trí ứng tuyển: ${appData.jobTitle || ''}; Công ty: ${appData.company || ''}; Địa điểm: ${appData.location || ''}; Trạng thái hiện tại: ${appData.status || ''}; Ghi chú HR: ${appData.adminNote || 'chưa có'}`
            : 'Chưa có vị trí ứng tuyển cụ thể, hãy đánh giá CV theo ngành mục tiêu.';
        const systemPrompt = `Bạn là chuyên gia tuyển dụng đa ngành cho Admin CVMS. Không mặc định ứng viên thuộc CNTT. Hãy đánh giá CV theo ngành mục tiêu: ${targetIndustries} và theo bối cảnh tuyển dụng: ${jobContext}. Trả về JSON với cấu trúc sau (dùng null nếu không tìm thấy):
{
  "ho_ten": "",
  "sdt": "",
  "email": "",
  "ngay_sinh": "",
  "dia_chi": "",
  "ky_nang_chinh": [],
  "diem_manh": [],
  "diem_yeu": [],
  "kinh_nghiem_lam_viec": [{"cong_ty":"","vi_tri":"","thoi_gian":"","mo_ta":""}],
  "hoc_van": [{"truong":"","bang_cap":"","nganh":"","nam":""}],
  "nam_kinh_nghiem": 0,
  "linh_vuc_chinh": "",
  "diem_phu_hop_cv_job": 0,
  "muc_do_phu_hop": "",
  "ket_luan_tuyen_dung": "",
  "ly_do_phu_hop": [],
  "diem_can_lam_ro": [],
  "cau_hoi_phong_van_goi_y": [],
  "de_xuat_vong_tiep_theo": "",
  "nganh_phu_hop": [{"nganh":"","muc_do_phu_hop":0,"ly_do":""}],
  "ky_nang_chuyen_nganh": [],
  "tom_tat": "",
  "muc_luong_de_xuat": ""
}
Chỉ trả về JSON thuần túy, không markdown, không giải thích thêm.`;

        if (isImage) {
            const base64Data = cvData.base64.split(',')[1];
            const mimeType   = cvData.type || 'image/jpeg';
            messages = [{ role:'user', content: [
                { type:'image', source:{ type:'base64', media_type: mimeType, data: base64Data } },
                { type:'text',  text:`Đánh giá CV trong ảnh này theo ngành mục tiêu: ${targetIndustries}. Bối cảnh tuyển dụng: ${jobContext}. Chấm điểm phù hợp 0-100 và trả về JSON.` }
            ]}];
        } else if (isPDF) {
            const base64Data = cvData.base64.split(',')[1];
            messages = [{ role:'user', content: [
                { type:'document', source:{ type:'base64', media_type:'application/pdf', data: base64Data } },
                { type:'text', text:`Đánh giá CV trong file PDF này theo ngành mục tiêu: ${targetIndustries}. Bối cảnh tuyển dụng: ${jobContext}. Chấm điểm phù hợp 0-100 và trả về JSON.` }
            ]}];
        } else {
            // Word - chỉ gửi tên file + thông tin user làm context
            messages = [{ role:'user', content: `File Word: "${cvData.name}". Ứng viên: ${modal._name}. Ngành mục tiêu: ${targetIndustries}. Bối cảnh tuyển dụng: ${jobContext}. Hãy tạo checklist đánh giá CV theo vị trí, chấm điểm ước tính 0-100, đánh dấu rõ đây là ước tính vì không đọc được nội dung Word trực tiếp.` }];
        }

        const response = await fetch('/api/analyze-cv', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(CVMS.getToken() ? { Authorization: `Bearer ${CVMS.getToken()}` } : {}),
            },
            body: JSON.stringify({
                model:      'claude-sonnet-4-20250514',
                max_tokens: 1500,
                system:     systemPrompt,
                messages,
            }),
        });

        const data = await response.json();
        const text = (data.content || []).map(b => b.text || '').join('');
        const clean = text.replace(/```json|```/g,'').trim();

        let parsed;
        try { parsed = JSON.parse(clean); }
        catch { parsed = null; }

        renderAIResult(parsed, text);

    } catch (err) {
        resultEl.innerHTML = `<div style="color:#ef4444;padding:16px;background:rgba(239,68,68,.1);border-radius:var(--radius-md)">❌ Lỗi kết nối AI: ${err.message}</div>`;
    } finally {
        btn.disabled  = false;
        btn.innerHTML = '<i class="ti ti-sparkles"></i> Chấm lại';
    }
}

function renderAIResult(data, rawText) {
    const el = document.getElementById('ai-result');
    if (!data) {
        el.innerHTML = `<pre style="font-size:11px;white-space:pre-wrap;color:var(--text-secondary)">${rawText}</pre>`;
        return;
    }

    const tag = (label, val, color='var(--accent)') =>
        val ? `<span style="display:inline-block;padding:3px 10px;background:${color}22;color:${color};border-radius:20px;font-size:11px;font-weight:600;margin:2px">${val}</span>` : '';

    const section = (icon, title, content) =>
        `<div style="margin-bottom:14px">
           <div style="font-size:11px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">${icon} ${title}</div>
           <div style="font-size:13px;line-height:1.6">${content}</div>
         </div>`;

    const chips = (arr, color) => (arr||[]).length
        ? (arr||[]).map(s => tag('',s,color)).join('')
        : '<span style="color:var(--text-secondary);font-size:12px">Không có thông tin</span>';
    const asList = (value) => Array.isArray(value) ? value : (value ? [value] : []);
    const bullets = (arr) => asList(arr).length
        ? `<ul style="margin:6px 0 0;padding-left:18px">${asList(arr).map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
        : '<span style="color:var(--text-secondary);font-size:12px">Không có thông tin</span>';
    const fitScore = Number(data.diem_phu_hop_cv_job ?? data.diem_phu_hop ?? 0);
    const fitColor = fitScore >= 80 ? '#16a34a' : fitScore >= 65 ? 'var(--accent)' : fitScore >= 50 ? '#d97706' : '#dc2626';
    const fitSummary = data.diem_phu_hop_cv_job !== undefined || data.muc_do_phu_hop || data.ket_luan_tuyen_dung
        ? `<div style="padding:14px;border:1px solid ${fitColor}55;background:${fitColor}12;border-radius:var(--radius-md);margin-bottom:16px">
             <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px">
               <div>
                 <div style="font-size:11px;font-weight:800;color:${fitColor};text-transform:uppercase;letter-spacing:.5px">Điểm phù hợp CV - vị trí</div>
                 <div style="font-size:13px;font-weight:700;color:var(--text-primary)">${escapeHTML(data.muc_do_phu_hop || 'Chưa kết luận')}</div>
               </div>
               <div style="font-size:30px;font-weight:900;color:${fitColor}">${Math.max(0, Math.min(100, fitScore || 0))}<span style="font-size:13px">/100</span></div>
             </div>
             ${data.ket_luan_tuyen_dung ? `<div style="font-size:13px;line-height:1.55">${escapeHTML(data.ket_luan_tuyen_dung)}</div>` : ''}
           </div>`
        : '';

    let expHtml = '';
    if ((data.kinh_nghiem_lam_viec||[]).length) {
        expHtml = data.kinh_nghiem_lam_viec.map(e => `
            <div style="border-left:2px solid var(--accent);padding-left:10px;margin-bottom:8px">
              <div style="font-weight:600">${e.vi_tri||''} <span style="color:var(--text-secondary)">@ ${e.cong_ty||''}</span></div>
              <div style="font-size:11px;color:var(--text-secondary)">${e.thoi_gian||''}</div>
              ${e.mo_ta ? `<div style="font-size:12px;margin-top:3px">${e.mo_ta}</div>` : ''}
            </div>`).join('');
    } else expHtml = '<span style="color:var(--text-secondary);font-size:12px">Không có thông tin</span>';

    const industryHtml = (data.nganh_phu_hop || []).length
        ? data.nganh_phu_hop.map(item => `
            <div style="padding:8px 10px;border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:6px">
              <div style="font-weight:700">${item.nganh || ''} <span style="color:var(--accent)">(${item.muc_do_phu_hop || 0}%)</span></div>
              <div style="font-size:12px;color:var(--text-secondary)">${item.ly_do || ''}</div>
            </div>`).join('')
        : '<span style="color:var(--text-secondary);font-size:12px">Chưa xác định</span>';

    el.innerHTML = `
        ${fitSummary}
        ${data.tom_tat ? `<div style="padding:12px 14px;background:var(--accent-light,rgba(59,130,246,.08));border-radius:var(--radius-md);font-size:13px;line-height:1.6;margin-bottom:16px;border-left:3px solid var(--accent)">
          <strong>📋 Tóm tắt:</strong> ${data.tom_tat}
        </div>` : ''}

        ${section('👤','Thông tin cá nhân', `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px">
            ${data.ho_ten    ? `<div><b>Họ tên:</b> ${data.ho_ten}</div>` : ''}
            ${data.sdt       ? `<div><b>SĐT:</b> ${data.sdt}</div>` : ''}
            ${data.email     ? `<div><b>Email:</b> ${data.email}</div>` : ''}
            ${data.ngay_sinh ? `<div><b>Ngày sinh:</b> ${data.ngay_sinh}</div>` : ''}
            ${data.dia_chi   ? `<div style="grid-column:1/-1"><b>Địa chỉ:</b> ${data.dia_chi}</div>` : ''}
          </div>`)}

        ${section('⭐','Kỹ năng chính', chips(data.ky_nang_chinh, 'var(--accent)'))}
        ${section('✅','Lý do phù hợp', bullets(data.ly_do_phu_hop))}
        ${section('❓','Điểm cần làm rõ', bullets(data.diem_can_lam_ro))}
        ${section('🗣️','Câu hỏi phỏng vấn gợi ý', bullets(data.cau_hoi_phong_van_goi_y))}
        ${data.de_xuat_vong_tiep_theo ? section('➡️','Đề xuất vòng tiếp theo', `<strong>${escapeHTML(data.de_xuat_vong_tiep_theo)}</strong>`) : ''}
        ${section('🎯','Ngành phù hợp', industryHtml)}
        ${section('🔁','Kỹ năng chuyển ngành', chips(data.ky_nang_chuyen_nganh, '#0f766e'))}
        ${section('💪','Điểm mạnh', chips(data.diem_manh, '#16a34a'))}
        ${section('⚠️','Điểm cần cải thiện', chips(data.diem_yeu, '#d97706'))}
        ${section('💼','Kinh nghiệm làm việc', expHtml)}

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${data.nam_kinh_nghiem ? section('🕐','Kinh nghiệm', `<span style="font-size:20px;font-weight:800;color:var(--accent)">${data.nam_kinh_nghiem}</span> <span style="font-size:12px">năm</span>`) : ''}
          ${data.muc_luong_de_xuat ? section('💰','Lương đề xuất', `<span style="font-size:14px;font-weight:700;color:#16a34a">${data.muc_luong_de_xuat}</span>`) : ''}
        </div>
    `;
}

function renderStoredAssessment(app) {
    const score = Number(app.aiScore) || 0;
    const color = score >= 80 ? '#16a34a' : score >= 65 ? 'var(--accent)' : score >= 50 ? '#d97706' : '#dc2626';
    const detail = app.aiEvaluation || {};
    const list = (items) => Array.isArray(items) && items.length
        ? `<ul style="margin:6px 0 0;padding-left:18px">${items.map(item => `<li>${escapeHTML(item)}</li>`).join('')}</ul>`
        : '<span style="font-size:12px;color:var(--text-secondary)">Chưa có thông tin</span>';
    return `
      <div style="padding:14px;border:1px solid ${color}55;background:${color}12;border-radius:var(--radius-md);margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:center">
          <div>
            <div style="font-size:11px;font-weight:800;color:${color};text-transform:uppercase;letter-spacing:.5px">AI đã chấm tự động</div>
            <div style="font-size:13px;font-weight:700">${escapeHTML(app.aiFitLevel || 'Đã chấm')}</div>
            <div style="font-size:11px;color:var(--text-secondary)">Lúc: ${escapeHTML(app.aiEvaluatedAt || '—')}</div>
          </div>
          <div style="font-size:30px;font-weight:900;color:${color}">${score}<span style="font-size:13px">/100</span></div>
        </div>
      </div>
      ${detail.summary ? `<div style="font-size:13px;line-height:1.6;margin-bottom:12px">${escapeHTML(detail.summary)}</div>` : ''}
      <div style="display:grid;gap:12px">
        <div><b>Điểm mạnh:</b>${list(detail.strengths)}</div>
        <div><b>Rủi ro/cần làm rõ:</b>${list(detail.risks)}</div>
        <div><b>Câu hỏi phỏng vấn:</b>${list(detail.questions)}</div>
        ${detail.nextStep ? `<div><b>Đề xuất:</b> ${escapeHTML(detail.nextStep)}</div>` : ''}
      </div>`;
}

async function runBatchAiAssessment(force = false) {
    const btn = document.getElementById('ai-batch-score');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> Đang chấm...';
    }
    try {
        const result = CVMS.assessApplicationsBatch({ force, limit: 30 });
        filterCandidates();
        const msg = result.assessedCount
            ? `✅ AI đã chấm ${result.assessedCount} CV.`
            : 'AI không có CV mới cần chấm.';
        showAdminToast(msg);
    } catch (error) {
        showAdminToast('⚠️ Không chấm hàng loạt được: ' + error.message);
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="ti ti-sparkles"></i> AI chấm CV mới';
        }
    }
}

/* ── Toast ── */
function showAdminToast(msg) {
    let t = document.getElementById('admin-toast');
    if (!t) { t=document.createElement('div'); t.id='admin-toast'; t.style.cssText='position:fixed;bottom:24px;right:24px;background:var(--accent);color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s'; document.body.appendChild(t); }
    t.textContent=msg; t.style.opacity='1';
    setTimeout(()=>t.style.opacity='0', 2500);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
    // Inject animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:.4} 50%{opacity:1} }
    `;
    document.head.appendChild(style);

    refreshCompanyFilters();
    filterCandidates();
    document.getElementById('statusFilter')?.addEventListener('change', filterCandidates);
    document.getElementById('searchCandidate')?.addEventListener('input', filterCandidates);
    document.getElementById('companyCandidateFilter')?.addEventListener('change', filterCandidates);
    document.getElementById('ai-batch-score')?.addEventListener('click', () => runBatchAiAssessment(true));
    window.addEventListener('cvms:ai-batch-done', () => filterCandidates());
    if (typeof initNotifUI === 'function') initNotifUI('admin');
});
