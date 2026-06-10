/* ═══════════════════════════════════════════════════════════════
   admin/js/jobs.js — Quản lý tin tuyển dụng
═══════════════════════════════════════════════════════════════ */

let allJobsCache = [];
let companiesCache = [];
let editingJobId = null;

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function parseDeadline(value) {
    const match = String(value || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!match) return Number.MAX_SAFE_INTEGER;
    const [, day, month, year] = match;
    return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
}

function companyNameById(companyId) {
    const company = companiesCache.find(item => Number(item.id) === Number(companyId));
    return company?.name || '';
}

function renderCompanyOptions(selectedId = null) {
    const select = document.getElementById('job-company-input');
    if (!select) return;
    const hasSelection = selectedId !== null && selectedId !== undefined && selectedId !== '';
    select.innerHTML = `<option value="" ${hasSelection ? '' : 'selected'}>Chọn doanh nghiệp</option>` + companiesCache.map(company => `
      <option value="${Number(company.id)}" ${Number(company.id) === Number(selectedId) ? 'selected' : ''}>
        ${escapeHTML(company.name)}
      </option>`).join('');
}

function renderCompanyFilterOptions() {
    const select = document.getElementById('companyFilter');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Tất cả doanh nghiệp</option>' + companiesCache.map(company =>
        `<option value="${Number(company.id)}">${escapeHTML(company.name)}</option>`
    ).join('');
    select.value = current;
}

function renderJobs(list) {
    const tbody = document.getElementById('jobTableBody');
    if (!tbody) return;
    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-secondary)">Chưa có tin tuyển dụng nào.</td></tr>';
        updateJobTabs();
        return;
    }
    tbody.innerHTML = list.map(j => {
        const pct = Math.min(100, Math.round((j.applicants || 0) / Math.max(1, (j.qty || 1) * 10) * 100));
        const activeCls = j.active === false ? 'badge-red' : (j.status === 'Sắp hết hạn' ? 'badge-amber' : 'badge-green');
        const activeLabel = j.active === false ? 'Đã đóng' : j.status;
        const tags = (j.tags || []).slice(0, 3).map(tag => `<span class="job-chip">${escapeHTML(tag)}</span>`).join('');
        return `
        <tr>
          <td>
            <div style="font-weight:600;font-size:13px">${escapeHTML(j.title)}</div>
            <div class="job-dept">${escapeHTML(j.company || 'CVMS')} • ${escapeHTML(j.dept || 'Other')}</div>
            ${tags ? `<div class="job-chip-row">${tags}</div>` : ''}
          </td>
          <td>${escapeHTML(j.location)}</td>
          <td style="text-align:center">${escapeHTML(j.qty || 1)}</td>
          <td style="color:var(--text-secondary)">${escapeHTML(j.deadline || 'Chưa đặt')}</td>
          <td>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
            <div class="job-progress-label">${escapeHTML(j.applicants || 0)} UV</div>
          </td>
          <td><span class="badge ${activeCls}">${escapeHTML(activeLabel)}</span></td>
          <td>
            <div class="job-actions">
              <button class="action-btn icon-action" title="Sửa tin" onclick="openJobModal(${j.id})" ${j.active === false ? 'disabled' : ''}>
                <i class="ti ti-edit"></i>
              </button>
              <button class="action-btn danger icon-action" title="Đóng tin" onclick="closeJob(${j.id})" ${j.active === false ? 'disabled style="opacity:.4"' : ''}>
                <i class="ti ti-lock"></i>
              </button>
            </div>
          </td>
        </tr>`;
    }).join('');
    updateJobTabs();
}

function updateJobTabs() {
    const tabs = document.querySelectorAll('.tab-row .tab');
    const active = allJobsCache.filter(j => j.active !== false).length;
    const closed = allJobsCache.filter(j => j.active === false).length;
    if (tabs[0]) tabs[0].textContent = `Đang tuyển (${active})`;
    if (tabs[1]) tabs[1].textContent = 'Bản nháp (0)';
    if (tabs[2]) tabs[2].textContent = `Đã đóng (${closed})`;
}

function openJobModal(id = null) {
    editingJobId = id;
    ensureJobModal();

    const job = id ? allJobsCache.find(item => item.id === id) : null;
    const modal = document.getElementById('job-modal');
    const form = document.getElementById('job-form');
    form.reset();

    document.getElementById('job-modal-title').textContent = job ? 'Sửa tin tuyển dụng' : 'Tạo tin tuyển dụng';
    document.getElementById('job-save-label').textContent = job ? 'Lưu thay đổi' : 'Tạo tin';

    renderCompanyOptions(job?.companyId || companiesCache.find(c => c.name === job?.company)?.id || '');
    setField('job-title-input', job?.title || '');
    setField('job-company-input', job?.companyId || companiesCache.find(c => c.name === job?.company)?.id || '');
    setField('job-location-input', job?.location || 'Hà Nội');
    setField('job-dept-input', job?.dept || 'Engineering');
    setField('job-salary-input', job?.salary || 'Thỏa thuận');
    setField('job-deadline-input', job?.deadline || '');
    setField('job-qty-input', job?.qty || 1);
    setField('job-status-input', job?.status || 'Đang tuyển');
    setField('job-tags-input', (job?.tags || []).join(', '));

    modal.style.display = 'flex';
    setTimeout(() => document.getElementById('job-title-input')?.focus(), 40);
}

function closeJobModal() {
    const modal = document.getElementById('job-modal');
    if (modal) modal.style.display = 'none';
    editingJobId = null;
}

function setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function ensureJobModal() {
    if (document.getElementById('job-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'job-modal';
    modal.className = 'cvms-modal';
    modal.innerHTML = `
      <div class="cvms-dialog job-dialog">
        <div class="cvms-dialog-head">
          <div>
            <h3 id="job-modal-title">Tạo tin tuyển dụng</h3>
            <p>Điền đầy đủ thông tin để ứng viên thấy tin mới ngay trên cổng tuyển dụng.</p>
          </div>
          <button class="modal-close" type="button" onclick="closeJobModal()" title="Đóng"><i class="ti ti-x"></i></button>
        </div>
        <form id="job-form" class="job-form">
          <label class="form-field span-2">
            <span>Vị trí tuyển dụng</span>
            <input id="job-title-input" required placeholder="VD: Senior Frontend Developer">
          </label>
          <label class="form-field">
            <span>Doanh nghiệp tuyển dụng</span>
            <select id="job-company-input" required></select>
          </label>
          <label class="form-field">
            <span>Chi nhánh</span>
            <select id="job-location-input" required>
              <option>Hà Nội</option>
              <option>Hồ Chí Minh</option>
              <option>Đà Nẵng</option>
              <option>Remote</option>
            </select>
          </label>
          <label class="form-field">
            <span>Bộ phận</span>
            <select id="job-dept-input" required>
              <option>Công nghệ thông tin</option>
              <option>Marketing</option>
              <option>Kinh doanh</option>
              <option>Tài chính - Kế toán</option>
              <option>Nhân sự</option>
              <option>Thiết kế - Sáng tạo</option>
              <option>Dịch vụ khách hàng</option>
              <option>Vận hành - Logistics</option>
              <option>Giáo dục - Đào tạo</option>
              <option>Pháp lý - Tuân thủ</option>
              <option>Sản xuất - Kỹ thuật</option>
              <option>Dữ liệu - Phân tích</option>
              <option>Hành chính</option>
              <option>Quản lý dự án</option>
              <option>Mua hàng</option>
              <option>Phân tích nghiệp vụ</option>
              <option>Other</option>
            </select>
          </label>
          <label class="form-field">
            <span>Mức lương</span>
            <input id="job-salary-input" placeholder="VD: 18-25 tr">
          </label>
          <label class="form-field">
            <span>Hạn nộp</span>
            <input id="job-deadline-input" required placeholder="dd/mm/yyyy">
          </label>
          <label class="form-field">
            <span>Số lượng</span>
            <input id="job-qty-input" type="number" min="1" max="99" required>
          </label>
          <label class="form-field">
            <span>Trạng thái</span>
            <select id="job-status-input">
              <option>Đang tuyển</option>
              <option>Sắp hết hạn</option>
            </select>
          </label>
          <label class="form-field span-2">
            <span>Kỹ năng/từ khóa</span>
            <input id="job-tags-input" placeholder="React, TypeScript, Node.js">
          </label>
          <div class="job-modal-actions span-2">
            <button class="action-btn" type="button" onclick="closeJobModal()">Hủy</button>
            <button class="add-btn" type="submit"><i class="ti ti-device-floppy"></i> <span id="job-save-label">Tạo tin</span></button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeJobModal(); });
    document.getElementById('job-form').addEventListener('submit', saveJobFromModal);
}

function readJobForm() {
    const title = document.getElementById('job-title-input').value.trim();
    const companyId = Number(document.getElementById('job-company-input').value || 0);
    const company = companyNameById(companyId);
    const location = document.getElementById('job-location-input').value.trim();
    const dept = document.getElementById('job-dept-input').value.trim();
    const salary = document.getElementById('job-salary-input').value.trim();
    const deadline = document.getElementById('job-deadline-input').value.trim();
    const qty = Number(document.getElementById('job-qty-input').value || 1);
    const status = document.getElementById('job-status-input').value;
    const tags = document.getElementById('job-tags-input').value
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

    if (!title || !companyId || !company || !location || !deadline) {
        throw new Error('Vui lòng điền vị trí, doanh nghiệp, chi nhánh và hạn nộp.');
    }
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(deadline)) {
        throw new Error('Hạn nộp cần theo định dạng dd/mm/yyyy.');
    }
    if (!Number.isFinite(qty) || qty < 1) {
        throw new Error('Số lượng tuyển phải lớn hơn 0.');
    }

    return {
        title,
        companyId,
        company,
        location,
        salary: salary || 'Thỏa thuận',
        salaryNum: extractSalaryNumber(salary),
        deadline,
        qty,
        tags,
        dept,
        status,
        active: true,
    };
}

function extractSalaryNumber(salary) {
    const nums = String(salary || '').match(/\d+/g);
    return nums ? Number(nums[0]) : 0;
}

function saveJobFromModal(event) {
    event.preventDefault();
    try {
        const payload = readJobForm();
        if (editingJobId) {
            CVMS.updateJob(editingJobId, payload);
            showAdminToast('✅ Đã cập nhật tin tuyển dụng!');
        } else {
            const created = CVMS.addJob(payload);
            showAdminToast(`✅ Đã tạo tin: "${created.title}"`);
        }
        closeJobModal();
        refreshJobs();
    } catch (error) {
        showAdminToast(`⚠️ ${error.message}`, 'error');
    }
}

function closeJob(id) {
    const job = allJobsCache.find(j => j.id === id) || CVMS.getJobs().find(j => j.id === id);
    if (!job) return;
    if (confirm(`Đóng tin "${job.title}"? Ứng viên sẽ không thể nộp thêm.`)) {
        CVMS.closeJob(id);
        refreshJobs();
        showAdminToast('✅ Đã đóng tin tuyển dụng!');
    }
}

function refreshJobs() {
    companiesCache = CVMS.getCompanies();
    renderCompanyFilterOptions();
    allJobsCache = CVMS.getJobs();
    filterJobs();
}

function filterJobs() {
    const q = (document.getElementById('searchJob')?.value || '').toLowerCase();
    const companyId = Number(document.getElementById('companyFilter')?.value || 0);
    const location = document.getElementById('locationFilter')?.value || '';
    const dept = document.getElementById('deptFilter')?.value || '';
    const sort = document.getElementById('sortJob')?.value || 'newest';

    let list = allJobsCache.filter(j =>
        (!q || [j.title, j.company, j.location, j.dept, ...(j.tags || [])].join(' ').toLowerCase().includes(q)) &&
        (!companyId || Number(j.companyId) === companyId) &&
        (!location || j.location === location) &&
        (!dept || j.dept === dept)
    );

    if (sort === 'applicants') list = list.sort((a, b) => (b.applicants || 0) - (a.applicants || 0));
    else if (sort === 'deadline') list = list.sort((a, b) => parseDeadline(a.deadline) - parseDeadline(b.deadline));
    else list = list.sort((a, b) => (b.id || 0) - (a.id || 0));

    renderJobs(list);
}

function showAdminToast(msg, type = 'success') {
    let t = document.getElementById('admin-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'admin-toast';
        t.className = 'admin-toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = `admin-toast ${type === 'error' ? 'error' : ''}`;
    t.style.opacity = '1';
    setTimeout(() => t.style.opacity = '0', 2800);
}

document.addEventListener('DOMContentLoaded', () => {
    refreshJobs();
    ['searchJob', 'companyFilter', 'locationFilter', 'deptFilter', 'sortJob'].forEach(id => {
        document.getElementById(id)?.addEventListener(id === 'searchJob' ? 'input' : 'change', filterJobs);
    });
    if (typeof initNotifUI === 'function') initNotifUI('admin');
});
