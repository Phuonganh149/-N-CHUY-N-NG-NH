/* ═══════════════════════════════════════════════════════════════
   user/js/profile.js — Hồ sơ cá nhân + Upload CV
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const raw  = localStorage.getItem('cvms_user');
    const user = raw ? JSON.parse(raw) : {};

    // Điền thông tin
    const fields = {
        'p-name': user.name || '',
        'p-email': user.email || '',
        'p-phone': user.phone || '',
        'p-address': user.address || '',
        'p-bio': user.bio || '',
        'p-target-position': user.targetPosition || '',
        'p-experience-level': user.experienceLevel || '',
        'p-education': user.education || '',
        'p-skills': user.skills || '',
        'p-expected-salary': user.expectedSalary || '',
        'p-desired-locations': user.desiredLocations || '',
        'p-work-type': user.workType || '',
        'p-portfolio': user.portfolio || '',
        'p-linkedin': user.linkedin || '',
    };
    Object.entries(fields).forEach(([id, val]) => { const el=document.getElementById(id); if(el) el.value=val; });

    // Lịch sử ứng tuyển
    const allApps = CVMS.getApplications();
    const myApps  = allApps.filter(a => a.userEmail === user.email);
    const tbody   = document.getElementById('my-applications');
    if (tbody) {
        if (myApps.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-secondary)">Chưa có đơn ứng tuyển nào. <a href="jobs.html" style="color:var(--accent)">Tìm việc →</a></td></tr>';
        } else {
            const map = { 'Mới nộp':'badge-blue','Đang xem xét':'badge-amber','Phỏng vấn':'badge-purple','Đã offer':'badge-green','Từ chối':'badge-red' };
            tbody.innerHTML = myApps.slice().reverse().map(a => `
                <tr>
                  <td><div class="cname">${escapeHTML(a.jobTitle)}</div><div class="cpos">${escapeHTML(a.company)}</div></td>
                  <td>${escapeHTML(a.location)}</td>
                  <td style="color:var(--text-secondary)">${escapeHTML(a.date)}</td>
                  <td><span class="badge ${map[a.status]||'badge-blue'}">${escapeHTML(a.status)}</span></td>
                  <td style="font-size:12px;color:var(--text-secondary)">${escapeHTML(a.adminNote||'—')}</td>
                </tr>`).join('');
        }
    }

    // Lưu hồ sơ
    document.getElementById('save-profile')?.addEventListener('click', () => {
        user.name    = document.getElementById('p-name')?.value.trim()    || user.name;
        user.phone   = document.getElementById('p-phone')?.value.trim()   || '';
        user.address = document.getElementById('p-address')?.value.trim() || '';
        user.bio     = document.getElementById('p-bio')?.value.trim()     || '';
        user.targetPosition   = document.getElementById('p-target-position')?.value.trim() || '';
        user.experienceLevel  = document.getElementById('p-experience-level')?.value.trim() || '';
        user.education        = document.getElementById('p-education')?.value.trim() || '';
        user.skills           = document.getElementById('p-skills')?.value.trim() || '';
        user.expectedSalary   = document.getElementById('p-expected-salary')?.value.trim() || '';
        user.desiredLocations = document.getElementById('p-desired-locations')?.value.trim() || '';
        user.workType         = document.getElementById('p-work-type')?.value.trim() || '';
        user.portfolio        = document.getElementById('p-portfolio')?.value.trim() || '';
        user.linkedin         = document.getElementById('p-linkedin')?.value.trim() || '';
        try {
            const saved = CVMS.updateProfile(user.email, user);
            localStorage.setItem('cvms_user', JSON.stringify(saved));
            renderProfileInsights(saved, CVMS.getCV(user.email));
            showToast('✅ Đã lưu thông tin thành công!');
        } catch (error) {
            showToast('⚠️ ' + error.message, 'warn');
        }
    });

    // Hiển thị CV đã upload (nếu có)
    renderCVStatus(user.email);
    restoreIndustries(user.email);
    renderProfileInsights(user, CVMS.getCV(user.email));

    // Upload CV
    const fileInput = document.getElementById('cv-file-input');
    const dropZone  = document.getElementById('cv-drop-zone');

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file) handleCVUpload(file, user.email);
    });
    fileInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) handleCVUpload(file, user.email);
    });

    if (typeof initNotifUI === 'function') initNotifUI('user');
});

function handleCVUpload(file, email) {
    const allowed = ['application/pdf','application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg','image/png','image/jpg'];
    const ext = file.name.split('.').pop().toLowerCase();
    const allowedExt = ['pdf','doc','docx','jpg','jpeg','png'];

    if (!allowedExt.includes(ext)) {
        showToast('⚠️ Chỉ chấp nhận file PDF, Word hoặc ảnh (JPG, PNG)', 'warn');
        return;
    }
    if (file.size > 5 * 1024 * 1024) {
        showToast('⚠️ File không được vượt quá 5MB', 'warn');
        return;
    }

    const statusEl = document.getElementById('cv-upload-status');
    if (statusEl) { statusEl.textContent = '⏳ Đang tải lên...'; statusEl.style.color = 'var(--accent)'; }

    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        // Lưu CV vào database SQLite qua backend.
        const cvData = {
            name:     file.name,
            type:     file.type || 'application/octet-stream',
            ext:      ext,
            size:     file.size,
            base64:   base64,
            uploadedAt: new Date().toLocaleString('vi-VN'),
            email:    email,
            industries: getSelectedIndustries(),
        };
        try {
            CVMS.saveCV(email, cvData);
            showToast('✅ Upload CV thành công!');
            renderCVStatus(email);
            const updatedUser = JSON.parse(localStorage.getItem('cvms_user') || '{}');
            renderProfileInsights(updatedUser, CVMS.getCV(email));
        } catch(err) {
            showToast('⚠️ File quá lớn để lưu. Vui lòng dùng file nhỏ hơn 2MB.', 'warn');
        }
    };
    reader.readAsDataURL(file);
}

function getSelectedIndustries() {
    return Array.from(document.querySelectorAll('#cv-industry-options input:checked'))
        .map(input => input.value)
        .filter(Boolean);
}

function restoreIndustries(email) {
    const cvData = CVMS.getCV(email);
    const selected = new Set(cvData?.industries || []);
    document.querySelectorAll('#cv-industry-options input').forEach(input => {
        input.checked = selected.has(input.value);
    });
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function renderCVStatus(email) {
    const cvData = CVMS.getCV(email);
    const el = document.getElementById('cv-current');
    if (!el) return;

    if (!cvData) {
        el.innerHTML = '<span style="color:var(--text-secondary);font-size:13px">Chưa có CV nào được tải lên.</span>';
        return;
    }
    const icon = cvData.ext === 'pdf' ? '📄' : ['jpg','jpeg','png'].includes(cvData.ext) ? '🖼️' : '📝';
    const sizeKB = (cvData.size / 1024).toFixed(0);
    const industries = (cvData.industries || []).map(item => `<span class="jtag">${escapeHTML(item)}</span>`).join('');
    el.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-md)">
            <span style="font-size:28px">${icon}</span>
            <div style="flex:1">
                <div style="font-weight:600;font-size:13px">${escapeHTML(cvData.name)}</div>
                <div style="font-size:11px;color:var(--text-secondary)">Cập nhật: ${cvData.uploadedAt} • ${sizeKB} KB</div>
                ${industries ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px">${industries}</div>` : ''}
            </div>
            <button onclick="deleteCVFile('${email}')" style="background:none;border:none;color:var(--red,#ef4444);cursor:pointer;font-size:18px" title="Xóa CV">🗑️</button>
        </div>`;
}

function getSkills(value) {
    return String(value || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
}

function renderProfileInsights(user, cvData) {
    const checks = [
        { label: 'Thông tin liên hệ', done: !!(user.name && user.email && user.phone) },
        { label: 'Mục tiêu nghề nghiệp', done: !!(user.targetPosition && user.experienceLevel) },
        { label: 'Ngành muốn ứng tuyển', done: !!(cvData?.industries || []).length },
        { label: 'Kỹ năng nổi bật', done: getSkills(user.skills).length >= 3 },
        { label: 'Học vấn / chứng chỉ', done: !!user.education },
        { label: 'CV đã tải lên', done: !!cvData },
        { label: 'Mức lương & địa điểm', done: !!(user.expectedSalary && user.desiredLocations) },
        { label: 'Portfolio / LinkedIn', done: !!(user.portfolio || user.linkedin) },
    ];
    const done = checks.filter(item => item.done).length;
    const score = Math.round(done / checks.length * 100);
    const list = document.getElementById('profile-completeness-list');
    if (list) {
        list.innerHTML = checks.map(item => `
          <div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:5px">
              <span>${escapeHTML(item.label)}</span>
              <span style="color:${item.done ? 'var(--green)' : 'var(--amber)'};font-weight:600">${item.done ? 'Hoàn thành' : 'Cần bổ sung'}</span>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${item.done ? 100 : 20}%;background:${item.done ? 'var(--green)' : 'var(--amber)'}"></div></div>
          </div>
        `).join('');
    }
    const scoreEl = document.getElementById('profile-completeness-score');
    if (scoreEl) scoreEl.textContent = `${score}%`;
    const next = checks.find(item => !item.done);
    const nextEl = document.getElementById('profile-next-step');
    if (nextEl) nextEl.textContent = next ? `Gợi ý: bổ sung "${next.label}" để hồ sơ nổi bật hơn với nhà tuyển dụng.` : 'Hồ sơ đã rất đầy đủ. Hãy cập nhật CV khi có kinh nghiệm mới.';

    const skillBox = document.getElementById('profile-skill-tags');
    if (skillBox) {
        const skills = getSkills(user.skills);
        skillBox.innerHTML = skills.length
            ? skills.map(skill => `<span class="jtag">${escapeHTML(skill)}</span>`).join('')
            : '<span style="font-size:12px;color:var(--text-secondary)">Chưa có kỹ năng. Hãy nhập kỹ năng ở phần Năng lực & liên kết.</span>';
    }

    const summary = document.getElementById('profile-summary-box');
    if (summary) {
        summary.innerHTML = `
          <div><b>Vị trí:</b> ${escapeHTML(user.targetPosition || 'Chưa chọn')}</div>
          <div><b>Kinh nghiệm:</b> ${escapeHTML(user.experienceLevel || 'Chưa cập nhật')}</div>
          <div><b>Lương kỳ vọng:</b> ${escapeHTML(user.expectedSalary || 'Chưa cập nhật')}</div>
          <div><b>Địa điểm:</b> ${escapeHTML(user.desiredLocations || 'Chưa cập nhật')}</div>
          <div><b>Ngành CV:</b> ${escapeHTML((cvData?.industries || []).join(', ') || 'Chưa chọn')}</div>
        `;
    }
}

function deleteCVFile(email) {
    if (!confirm('Xóa CV hiện tại?')) return;
    CVMS.deleteCV(email);
    renderCVStatus(email);
    const user = JSON.parse(localStorage.getItem('cvms_user') || '{}');
    renderProfileInsights(user, null);
    showToast('🗑️ Đã xóa CV.');
}

function showToast(msg, type) {
    let t = document.getElementById('u-toast');
    if (!t) { t=document.createElement('div'); t.id='u-toast'; document.body.appendChild(t); }
    t.textContent=msg;
    t.className='u-toast show' + (type==='warn'?' warn':'');
    setTimeout(()=>t.classList.remove('show'), 2800);
}
