/* ═══════════════════════════════════════════════════════════════
   user/js/jobs.js — Danh sách việc làm + ứng tuyển (sync với admin)
═══════════════════════════════════════════════════════════════ */

function renderJobs(list) {
    const container = document.getElementById('jobs-grid');
    if (!container) return;
    if (list.length === 0) {
        container.innerHTML = '<p style="text-align:center;padding:48px;color:var(--text-secondary)">Không tìm thấy vị trí phù hợp.</p>';
        return;
    }
    const user    = JSON.parse(localStorage.getItem('cvms_user') || 'null');
    const myApps  = user ? CVMS.getApplications().filter(a => a.userEmail === user.email) : [];
    const applied = new Set(myApps.map(a => a.jobId));
    const saved = getSavedJobs();

    container.innerHTML = list.map(j => {
        const isApplied = applied.has(j.id);
        const isSaved = saved.has(String(j.id));
        return `
        <div class="job-card-u">
            <div class="jc-header">
                <div class="jc-logo">${escapeHTML((j.dept || j.company || 'C').charAt(0))}</div>
                <div>
                    <div class="jc-title">${escapeHTML(j.title)}</div>
                    <div class="jc-company">${escapeHTML(j.company)} • ${escapeHTML(j.dept || 'Khác')}</div>
                </div>
            </div>
            <div class="jc-meta">
                <span><i class="ti ti-map-pin"></i> ${escapeHTML(j.location)}</span>
                <span><i class="ti ti-coin"></i> ${escapeHTML(j.salary)}</span>
                <span><i class="ti ti-calendar"></i> HSD: ${escapeHTML(j.deadline)}</span>
            </div>
            <div class="jc-tags">${(j.tags||[]).map(t => `<span class="jtag">${escapeHTML(t)}</span>`).join('')}</div>
            <div class="job-card-actions">
                <button class="secondary-btn-u" onclick="openJobDetail(${j.id})"><i class="ti ti-file-description"></i> Chi tiết</button>
                <button class="secondary-btn-u ${isSaved ? 'saved' : ''}" onclick="toggleSaveJob(${j.id})"><i class="ti ${isSaved ? 'ti-bookmark-filled' : 'ti-bookmark'}"></i> ${isSaved ? 'Đã lưu' : 'Lưu'}</button>
            </div>
            ${isApplied
                ? `<button class="apply-btn-u" style="background:var(--text-secondary);cursor:default" disabled>✓ Đã ứng tuyển</button>`
                : `<button class="apply-btn-u" onclick="applyJob(${j.id})"><i class="ti ti-send"></i> Ứng tuyển ngay</button>`
            }
        </div>`;
    }).join('');
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function applyJob(jobId) {
    const user = JSON.parse(localStorage.getItem('cvms_user') || 'null');
    if (!user) { window.location.href = '../../login.html'; return; }

    const result = CVMS.applyJob(jobId, user.email, user.name);
    if (!result.ok) { showToast('⚠️ ' + result.msg, 'warn'); return; }

    showToast('✅ Ứng tuyển thành công! Chúng tôi sẽ liên hệ sớm.');
    // Reload để cập nhật nút
    setTimeout(() => doFilter(), 300);
}

function getSavedJobs() {
    try {
        return new Set(CVMS.getSavedJobs().map(item => String(item.jobId)));
    } catch {
        return new Set(JSON.parse(localStorage.getItem('cvms_saved_jobs') || '[]').map(String));
    }
}

function setSavedJobs(saved) {
    localStorage.setItem('cvms_saved_jobs', JSON.stringify(Array.from(saved)));
}

function toggleSaveJob(jobId) {
    const saved = getSavedJobs();
    const key = String(jobId);
    try {
        const result = CVMS.toggleSavedJob(jobId);
        if (result.saved) {
            saved.add(key);
            showToast('✅ Đã lưu việc làm vào tài khoản của bạn.');
        } else {
            saved.delete(key);
            showToast('Đã bỏ lưu việc làm.');
        }
    } catch (error) {
        if (saved.has(key)) {
            saved.delete(key);
            showToast('Đã bỏ lưu việc làm trên trình duyệt này.');
        } else {
            saved.add(key);
            showToast('✅ Đã lưu tạm trên trình duyệt này.');
        }
    }
    setSavedJobs(saved);
    doFilter();
}

function openJobDetail(jobId) {
    const job = _allJobs.find(item => item.id === jobId);
    if (!job) return;
    ensureJobDetailModal();
    const saved = getSavedJobs().has(String(jobId));
    const modal = document.getElementById('job-detail-modal');
    modal.dataset.jobId = jobId;
    document.getElementById('job-detail-title').textContent = job.title;
    document.getElementById('job-detail-sub').textContent = `${job.company} • ${job.location} • ${job.dept || 'Khác'}`;
    document.getElementById('job-detail-meta').innerHTML = `
        <span><i class="ti ti-coin"></i> ${escapeHTML(job.salary || 'Thỏa thuận')}</span>
        <span><i class="ti ti-calendar"></i> Hạn nộp: ${escapeHTML(job.deadline || 'Chưa đặt')}</span>
        <span><i class="ti ti-users"></i> Tuyển ${escapeHTML(job.qty || 1)} người</span>
    `;
    document.getElementById('job-detail-tags').innerHTML = (job.tags || []).map(tag => `<span class="jtag">${escapeHTML(tag)}</span>`).join('');
    document.getElementById('job-detail-content').innerHTML = buildJobDetailContent(job);
    document.getElementById('job-detail-save').innerHTML = `<i class="ti ${saved ? 'ti-bookmark-filled' : 'ti-bookmark'}"></i> ${saved ? 'Đã lưu' : 'Lưu việc'}`;
    document.getElementById('job-detail-save').classList.toggle('saved', saved);
    modal.style.display = 'flex';
}

function closeJobDetail() {
    const modal = document.getElementById('job-detail-modal');
    if (modal) modal.style.display = 'none';
}

function ensureJobDetailModal() {
    if (document.getElementById('job-detail-modal')) return;
    const modal = document.createElement('div');
    modal.id = 'job-detail-modal';
    modal.className = 'job-detail-modal';
    modal.innerHTML = `
      <div class="job-detail-dialog">
        <div class="job-detail-head">
          <div>
            <h3 id="job-detail-title"></h3>
            <p id="job-detail-sub"></p>
          </div>
          <button class="modal-close-u" onclick="closeJobDetail()" title="Đóng"><i class="ti ti-x"></i></button>
        </div>
        <div class="job-detail-body">
          <div id="job-detail-meta" class="job-detail-meta"></div>
          <div id="job-detail-tags" class="jc-tags"></div>
          <div id="job-detail-content" class="job-detail-content"></div>
        </div>
        <div class="job-detail-actions">
          <button id="job-detail-save" class="secondary-btn-u" onclick="toggleSaveFromDetail()"></button>
          <button class="apply-btn-u" onclick="applyFromDetail()"><i class="ti ti-send"></i> Ứng tuyển vị trí này</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeJobDetail(); });
}

function toggleSaveFromDetail() {
    const jobId = Number(document.getElementById('job-detail-modal')?.dataset.jobId);
    if (!jobId) return;
    toggleSaveJob(jobId);
    openJobDetail(jobId);
}

function applyFromDetail() {
    const jobId = Number(document.getElementById('job-detail-modal')?.dataset.jobId);
    if (!jobId) return;
    applyJob(jobId);
    closeJobDetail();
}

function buildJobDetailContent(job) {
    const dept = job.dept || 'Khác';
    const tagText = (job.tags || []).join(', ');
    return `
      <section>
        <h4>Mô tả công việc</h4>
        <ul>
          <li>Tham gia vận hành và phát triển các hoạt động thuộc bộ phận ${escapeHTML(dept)}.</li>
          <li>Phối hợp với các phòng ban liên quan để hoàn thành mục tiêu tuyển dụng/vận hành của công ty.</li>
          <li>Báo cáo tiến độ, đề xuất cải tiến quy trình và đảm bảo chất lượng công việc.</li>
        </ul>
      </section>
      <section>
        <h4>Yêu cầu chính</h4>
        <ul>
          <li>Có kiến thức hoặc kinh nghiệm liên quan đến ${escapeHTML(dept)}.</li>
          <li>Ưu tiên kỹ năng: ${escapeHTML(tagText || 'giao tiếp, học hỏi nhanh, làm việc nhóm')}.</li>
          <li>Chủ động, có trách nhiệm và phù hợp với môi trường làm việc chuyên nghiệp.</li>
        </ul>
      </section>
      <section>
        <h4>Quyền lợi</h4>
        <ul>
          <li>Mức lương ${escapeHTML(job.salary || 'thỏa thuận')} theo năng lực.</li>
          <li>Cơ hội đào tạo, phát triển nghề nghiệp và xét tăng lương định kỳ.</li>
          <li>Môi trường làm việc đa ngành, phối hợp cùng nhiều đội ngũ trong công ty.</li>
        </ul>
      </section>
    `;
}

function showToast(msg, type) {
    let t = document.getElementById('u-toast');
    if (!t) { t = document.createElement('div'); t.id = 'u-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.className   = 'u-toast show' + (type === 'warn' ? ' warn' : '');
    setTimeout(() => t.classList.remove('show'), 3000);
}

let _allJobs = [];
let _savedOnly = false;
function doFilter() {
    const q   = (document.getElementById('job-search')?.value || '').toLowerCase();
    const loc = document.getElementById('job-loc')?.value || '';
    const dept = document.getElementById('job-dept')?.value || '';
    const savedJobs = getSavedJobs();
    const filtered = _allJobs.filter(j =>
        j.active !== false &&
        (!q   || [j.title, j.company, j.location, j.dept, ...(j.tags || [])].join(' ').toLowerCase().includes(q)) &&
        (!loc || j.location === loc) &&
        (!dept || j.dept === dept) &&
        (!_savedOnly || savedJobs.has(String(j.id)))
    );
    renderJobs(filtered);
    const count = document.getElementById('jobs-count');
    if (count) count.textContent = _savedOnly ? `${filtered.length} đã lưu` : `${filtered.length} vị trí`;
    updateDeptChips(dept);
    const savedBtn = document.getElementById('saved-only');
    if (savedBtn) {
        savedBtn.classList.toggle('saved', _savedOnly);
        savedBtn.innerHTML = `<i class="ti ${_savedOnly ? 'ti-bookmark-filled' : 'ti-bookmark'}"></i> ${_savedOnly ? 'Đang xem đã lưu' : 'Việc đã lưu'}`;
    }
}

function populateDeptFilter() {
    const select = document.getElementById('job-dept');
    if (!select) return;
    const current = select.value;
    const depts = Array.from(new Set(_allJobs.map(j => j.dept).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'vi'));
    select.innerHTML = '<option value="">Tất cả ngành nghề</option>' + depts.map(dept => `<option value="${escapeHTML(dept)}">${escapeHTML(dept)}</option>`).join('');
    select.value = current;
    renderDeptChips(depts);
}

function renderDeptChips(depts) {
    const wrap = document.getElementById('dept-chips');
    if (!wrap) return;
    const items = depts.map(dept => {
        const total = _allJobs.filter(job => job.active !== false && job.dept === dept).length;
        return `<button type="button" class="dept-chip" data-dept="${escapeHTML(dept)}">${escapeHTML(dept)} <span>${total}</span></button>`;
    });
    wrap.innerHTML = `<button type="button" class="dept-chip active" data-dept="">Tất cả <span>${_allJobs.filter(job => job.active !== false).length}</span></button>` + items.join('');
    wrap.querySelectorAll('.dept-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            const select = document.getElementById('job-dept');
            if (select) select.value = btn.dataset.dept || '';
            doFilter();
        });
    });
}

function updateDeptChips(activeDept) {
    document.querySelectorAll('.dept-chip').forEach(btn => {
        btn.classList.toggle('active', (btn.dataset.dept || '') === activeDept);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    _allJobs = CVMS.getJobs();
    populateDeptFilter();
    doFilter();

    document.getElementById('job-search')?.addEventListener('input', doFilter);
    document.getElementById('job-loc')?.addEventListener('change', doFilter);
    document.getElementById('job-dept')?.addEventListener('change', doFilter);
    document.getElementById('saved-only')?.addEventListener('click', () => {
        _savedOnly = !_savedOnly;
        doFilter();
    });
    if (typeof initNotifUI === 'function') initNotifUI('user');
});
