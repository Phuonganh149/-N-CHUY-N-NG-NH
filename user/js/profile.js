/* =============================================
   DACV/user/js/profile.js - PHIÊN BẢN CẢI TIẾN
   Hồ sơ cá nhân + Upload CV + Xem trước CV
============================================= */

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('cvms_user') || 'null');
    if (!user) {
        window.location.href = '../../login.html';
        return;
    }

    // Điền thông tin
    document.getElementById('p-name').value = user.name || '';
    document.getElementById('p-email').value = user.email || '';
    document.getElementById('p-phone').value = user.phone || '';
    document.getElementById('p-address').value = user.address || '';
    document.getElementById('p-bio').value = user.bio || '';

    renderApplicationHistory(user.email);
    renderCurrentCV(user.email);

    document.getElementById('save-profile').addEventListener('click', () => saveProfile(user));
    setupCVUpload(user.email);

    if (typeof initNotifUI === 'function') initNotifUI('user');
});

// Lưu hồ sơ
function saveProfile(user) {
    user.phone = document.getElementById('p-phone').value.trim();
    user.address = document.getElementById('p-address').value.trim();
    user.bio = document.getElementById('p-bio').value.trim();
    localStorage.setItem('cvms_user', JSON.stringify(user));
    showToast('✅ Đã lưu thông tin hồ sơ thành công!');
}

// Upload CV
function setupCVUpload(email) {
    const dropZone = document.getElementById('cv-drop-zone');
    const fileInput = document.getElementById('cv-file-input');

    dropZone?.addEventListener('click', () => fileInput?.click());
    dropZone?.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone?.addEventListener('drop', e => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files[0]) handleFileUpload(e.dataTransfer.files[0], email);
    });

    fileInput?.addEventListener('change', e => {
        if (e.target.files[0]) handleFileUpload(e.target.files[0], email);
    });
}

function handleFileUpload(file, email) {
    const allowedExt = ['pdf','doc','docx','jpg','jpeg','png'];
    const ext = file.name.split('.').pop().toLowerCase();

    if (!allowedExt.includes(ext)) return showToast('⚠️ Chỉ hỗ trợ PDF, Word, JPG, PNG', 'error');
    if (file.size > 5*1024*1024) return showToast('⚠️ File không được vượt quá 5MB', 'error');

    const reader = new FileReader();
    reader.onload = function(e) {
        const cvKey = 'cvms_cv_' + email.replace(/[^a-z0-9]/gi, '_');
        const cvData = {
            name: file.name,
            ext: ext,
            size: file.size,
            base64: e.target.result,
            uploadedAt: new Date().toLocaleString('vi-VN')
        };
        localStorage.setItem(cvKey, JSON.stringify(cvData));

        // Cập nhật cho admin
        let allCVs = JSON.parse(localStorage.getItem('cvms_all_cvs') || '{}');
        allCVs[email] = {name: file.name, ext, size: file.size, uploadedAt: cvData.uploadedAt};
        localStorage.setItem('cvms_all_cvs', JSON.stringify(allCVs));

        showToast('✅ Upload CV thành công!');
        renderCurrentCV(email);
    };
    reader.readAsDataURL(file);
}

// ==================== RENDER CV + NÚT XEM TRƯỚC ====================
function renderCurrentCV(email) {
    const cvKey = 'cvms_cv_' + email.replace(/[^a-z0-9]/gi, '_');
    const cvData = JSON.parse(localStorage.getItem(cvKey) || 'null');
    const container = document.getElementById('cv-current');

    if (!container) return;

    if (!cvData) {
        container.innerHTML = `<p style="color:#64748b">Chưa có CV nào được tải lên.</p>`;
        return;
    }

    const sizeKB = (cvData.size / 1024).toFixed(1);
    container.innerHTML = `
        <div style="display:flex; align-items:center; gap:12px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px;">
            <span style="font-size:32px">${cvData.ext === 'pdf' ? '📄' : '🖼️'}</span>
            <div style="flex:1">
                <div style="font-weight:600">${cvData.name}</div>
                <div style="font-size:13px; color:#64748b">${sizeKB} KB • ${cvData.uploadedAt}</div>
            </div>
            <button onclick="previewCV('${email}')" style="padding:8px 16px; background:var(--accent); color:white; border:none; border-radius:8px; cursor:pointer;">
                👁️ Xem trước
            </button>
            <button onclick="deleteCV('${email}')" style="color:#ef4444; background:none; border:none; font-size:20px; cursor:pointer;">🗑️</button>
        </div>`;
}

// Xem trước CV (Modal)
function previewCV(email) {
    const cvKey = 'cvms_cv_' + email.replace(/[^a-z0-9]/gi, '_');
    const cvData = JSON.parse(localStorage.getItem(cvKey) || 'null');
    if (!cvData) return showToast('Không tìm thấy CV!', 'error');

    let modal = document.getElementById('cv-preview-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'cv-preview-modal';
        modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:9999;display:flex;align-items:center;justify-content:center;`;
        modal.innerHTML = `
            <div style="background:white; width:90%; max-width:1000px; max-height:90vh; border-radius:12px; overflow:hidden; position:relative;">
                <div style="padding:12px 20px; border-bottom:1px solid #ddd; display:flex; justify-content:space-between; align-items:center;">
                    <strong>${cvData.name}</strong>
                    <button onclick="closePreviewModal()" style="font-size:24px; background:none; border:none; cursor:pointer;">✕</button>
                </div>
                <div id="preview-content" style="padding:10px; overflow:auto; max-height:calc(90vh - 60px);"></div>
            </div>`;
        document.body.appendChild(modal);
    }

    const content = document.getElementById('preview-content');
    if (['jpg','jpeg','png'].includes(cvData.ext)) {
        content.innerHTML = `<img src="${cvData.base64}" style="width:100%; max-height:80vh; object-fit:contain;">`;
    } else if (cvData.ext === 'pdf') {
        content.innerHTML = `<iframe src="${cvData.base64}" style="width:100%; height:80vh; border:none;"></iframe>`;
    } else {
        content.innerHTML = `<p style="text-align:center;padding:50px;">Không hỗ trợ xem trước file này. Vui lòng tải xuống.</p>`;
    }

    modal.style.display = 'flex';
}

function closePreviewModal() {
    const modal = document.getElementById('cv-preview-modal');
    if (modal) modal.style.display = 'none';
}

// Xóa CV
function deleteCV(email) {
    if (!confirm('Xóa CV này?')) return;
    const cvKey = 'cvms_cv_' + email.replace(/[^a-z0-9]/gi, '_');
    localStorage.removeItem(cvKey);

    let allCVs = JSON.parse(localStorage.getItem('cvms_all_cvs') || '{}');
    delete allCVs[email];
    localStorage.setItem('cvms_all_cvs', JSON.stringify(allCVs));

    renderCurrentCV(email);
    showToast('🗑️ Đã xóa CV.');
}

// Render lịch sử ứng tuyển
function renderApplicationHistory(email) {
    const apps = CVMS.getApplications().filter(a => a.userEmail === email);
    const tbody = document.getElementById('my-applications');
    if (!tbody) return;

    if (apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:40px;color:#64748b">Chưa có đơn ứng tuyển nào.</td></tr>`;
        return;
    }

    const statusClass = {'Mới nộp':'badge-blue','Đang xem xét':'badge-amber','Phỏng vấn':'badge-purple','Đã offer':'badge-green','Từ chối':'badge-red'};
    tbody.innerHTML = apps.slice().reverse().map(app => `
        <tr>
            <td><strong>${app.jobTitle}</strong><br><small>${app.company}</small></td>
            <td>${app.location}</td>
            <td>${app.date}</td>
            <td><span class="badge ${statusClass[app.status]||'badge-blue'}">${app.status}</span></td>
            <td style="color:#64748b">${app.adminNote || '—'}</td>
        </tr>
    `).join('');
}

// Toast
function showToast(msg, type = 'success') {
    let toast = document.getElementById('u-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'u-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `u-toast show ${type === 'error' ? 'warn' : ''}`;
    setTimeout(() => toast.classList.remove('show'), 2800);
}
