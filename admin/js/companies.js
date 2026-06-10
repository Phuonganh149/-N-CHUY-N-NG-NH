let companiesCache = [];
let jobsCache = [];
let editingCompanyId = null;

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function companyInitials(name) {
    const words = String(name || 'C').trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(word => word[0]).join('').toUpperCase();
}

function renderCompanies(list) {
    const tbody = document.getElementById('companyTableBody');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:32px;color:var(--text-secondary)">Chưa có doanh nghiệp nào.</td></tr>';
        updateCompanyCount(0);
        return;
    }
    tbody.innerHTML = list.map(company => {
        const jobs = jobsCache.filter(job => Number(job.companyId) === Number(company.id));
        const activeJobs = jobs.filter(job => job.active !== false).length;
        const status = company.status || 'active';
        const statusLabel = status === 'paused' ? 'Tạm dừng' : 'Đang hoạt động';
        const statusCls = status === 'paused' ? 'badge-amber' : 'badge-green';
        return `
        <tr>
          <td>
            <div class="company-name-cell">
              <div class="company-logo">${escapeHTML(companyInitials(company.name))}</div>
              <div>
                <div class="cname">${escapeHTML(company.name)}</div>
                <div class="cpos">${escapeHTML(company.slug || '')}</div>
              </div>
            </div>
          </td>
          <td>${escapeHTML(company.industry || 'Chưa cập nhật')}</td>
          <td>${escapeHTML(company.location || 'Chưa cập nhật')}</td>
          <td><span class="badge badge-blue">${escapeHTML(company.plan || 'Starter')}</span></td>
          <td>${activeJobs}/${jobs.length}</td>
          <td><span class="badge ${statusCls}">${statusLabel}</span></td>
          <td>
            <button class="action-btn icon-action" title="Sửa doanh nghiệp" onclick="openCompanyModal(${Number(company.id)})">
              <i class="ti ti-edit"></i>
            </button>
          </td>
        </tr>`;
    }).join('');
    updateCompanyCount(list.length);
}

function updateCompanyCount(count) {
    const el = document.getElementById('company-count');
    if (el) el.textContent = `${count} doanh nghiệp`;
}

function refreshCompanies() {
    companiesCache = CVMS.getCompanies();
    jobsCache = CVMS.getJobs();
    filterCompanies();
}

function filterCompanies() {
    const q = ((document.getElementById('companySearch')?.value || document.getElementById('topCompanySearch')?.value || '')).toLowerCase();
    const status = document.getElementById('companyStatusFilter')?.value || '';
    const list = companiesCache.filter(company =>
        (!status || company.status === status) &&
        (!q || [company.name, company.slug, company.industry, company.location, company.plan].join(' ').toLowerCase().includes(q))
    );
    renderCompanies(list);
}

function openCompanyModal(id = null) {
    editingCompanyId = id;
    ensureCompanyModal();
    const company = id ? companiesCache.find(item => Number(item.id) === Number(id)) : null;
    document.getElementById('company-modal-title').textContent = company ? 'Sửa doanh nghiệp' : 'Thêm doanh nghiệp';
    document.getElementById('company-save-label').textContent = company ? 'Lưu thay đổi' : 'Thêm doanh nghiệp';
    setField('company-name-input', company?.name || '');
    setField('company-industry-input', company?.industry || '');
    setField('company-location-input', company?.location || 'Hà Nội');
    setField('company-plan-input', company?.plan || 'Starter');
    setField('company-status-input', company?.status || 'active');
    document.getElementById('company-modal').style.display = 'flex';
    setTimeout(() => document.getElementById('company-name-input')?.focus(), 40);
}

function closeCompanyModal() {
    const modal = document.getElementById('company-modal');
    if (modal) modal.style.display = 'none';
    editingCompanyId = null;
}

function setField(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function ensureCompanyModal() {
    if (document.getElementById('company-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'company-modal';
    modal.className = 'cvms-modal';
    modal.innerHTML = `
      <div class="cvms-dialog">
        <div class="cvms-dialog-head">
          <div>
            <h3 id="company-modal-title">Thêm doanh nghiệp</h3>
            <p>Doanh nghiệp được dùng khi tạo tin tuyển dụng và thống kê ứng viên toàn nền tảng.</p>
          </div>
          <button class="modal-close" type="button" onclick="closeCompanyModal()" title="Đóng"><i class="ti ti-x"></i></button>
        </div>
        <form id="company-form" class="company-form">
          <label class="form-field span-2">
            <span>Tên doanh nghiệp</span>
            <input id="company-name-input" required placeholder="VD: Nova Retail">
          </label>
          <label class="form-field">
            <span>Ngành</span>
            <input id="company-industry-input" placeholder="VD: Bán lẻ & Thương mại">
          </label>
          <label class="form-field">
            <span>Địa điểm chính</span>
            <select id="company-location-input">
              <option>Hà Nội</option>
              <option>Hồ Chí Minh</option>
              <option>Đà Nẵng</option>
              <option>Cần Thơ</option>
              <option>Bình Dương</option>
              <option>Remote</option>
            </select>
          </label>
          <label class="form-field">
            <span>Gói sử dụng</span>
            <select id="company-plan-input">
              <option>Starter</option>
              <option>Growth</option>
              <option>Enterprise</option>
            </select>
          </label>
          <label class="form-field">
            <span>Trạng thái</span>
            <select id="company-status-input">
              <option value="active">Đang hoạt động</option>
              <option value="paused">Tạm dừng</option>
            </select>
          </label>
          <div class="company-modal-actions span-2">
            <button class="action-btn" type="button" onclick="closeCompanyModal()">Hủy</button>
            <button class="add-btn" type="submit"><i class="ti ti-device-floppy"></i> <span id="company-save-label">Thêm doanh nghiệp</span></button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeCompanyModal(); });
    document.getElementById('company-form').addEventListener('submit', saveCompanyFromModal);
}

function readCompanyForm() {
    const name = document.getElementById('company-name-input').value.trim();
    if (!name) throw new Error('Vui lòng nhập tên doanh nghiệp.');
    return {
        name,
        industry: document.getElementById('company-industry-input').value.trim(),
        location: document.getElementById('company-location-input').value,
        plan: document.getElementById('company-plan-input').value,
        status: document.getElementById('company-status-input').value,
    };
}

function saveCompanyFromModal(event) {
    event.preventDefault();
    try {
        const payload = readCompanyForm();
        if (editingCompanyId) {
            CVMS.updateCompany(editingCompanyId, payload);
            showAdminToast('Đã cập nhật doanh nghiệp.');
        } else {
            CVMS.addCompany(payload);
            showAdminToast('Đã thêm doanh nghiệp mới.');
        }
        closeCompanyModal();
        refreshCompanies();
    } catch (error) {
        showAdminToast(error.message, 'error');
    }
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
    setTimeout(() => t.style.opacity = '0', 2600);
}

document.addEventListener('DOMContentLoaded', () => {
    refreshCompanies();
    ['companySearch', 'topCompanySearch'].forEach(id => document.getElementById(id)?.addEventListener('input', filterCompanies));
    document.getElementById('companyStatusFilter')?.addEventListener('change', filterCompanies);
    if (typeof initNotifUI === 'function') initNotifUI('admin');
});
