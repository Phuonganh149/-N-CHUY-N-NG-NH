/* ═══════════════════════════════════════════════════════════════
   Tuyendung.js — Trang tuyển dụng công khai (đọc từ CVMS data)
═══════════════════════════════════════════════════════════════ */

function renderJobs(jobs) {
    const container = document.getElementById('jobsList');
    if (!container) return;
    container.innerHTML = '';
    if (jobs.length === 0) {
        container.innerHTML = `<p style="text-align:center;padding:100px 20px;color:#64748b;font-size:1.1rem;grid-column:1/-1">Không tìm thấy công việc nào phù hợp.</p>`;
        return;
    }
    jobs.forEach(job => {
        container.innerHTML += `
            <div class="job-card">
                <div class="job-info">
                    <h3>${escapeHTML(job.title)}</h3>
                    <p class="job-meta"><strong>${escapeHTML(job.company)}</strong> • ${escapeHTML(job.location)} • ${escapeHTML(job.dept || 'Khác')}</p>
                    <p class="job-meta">
                        <span style="color:var(--accent);font-weight:600;">${escapeHTML(job.salary || job.salaryNum + ' triệu')}</span> •
                        ${(job.tags || []).map(escapeHTML).join(', ')}
                    </p>
                    <p class="job-meta" style="font-size:.85rem;color:#64748b">Hạn: ${escapeHTML(job.deadline)}</p>
                </div>
                <div>
                    <a href="login.html" class="apply-btn">Ứng tuyển ngay</a>
                </div>
            </div>`;
    });
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function getSelectedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map(i => i.value);
}

function applyFilters() {
    const all = CVMS.getJobs().filter(j => j.active !== false);
    const searchTerm        = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();
    const selectedLocations = getSelectedValues('companyFilter');
    const selectedIndustries= getSelectedValues('industryFilter');
    const selectedLevels    = getSelectedValues('levelFilter');
    const selectedTypes     = getSelectedValues('workTypeFilter');
    const salaryFrom        = parseFloat(document.getElementById('salaryFrom')?.value) || 0;
    const salaryTo          = parseFloat(document.getElementById('salaryTo')?.value)   || 999;

    let filtered = all;
    if (searchTerm)              filtered = filtered.filter(j => [j.title, j.company, j.location, j.dept, ...(j.tags || [])].join(' ').toLowerCase().includes(searchTerm));
    if (selectedLocations.length) filtered = filtered.filter(j => selectedLocations.includes(j.location));
    if (selectedIndustries.length)filtered = filtered.filter(j => selectedIndustries.some(i => [j.dept, ...(j.tags || [])].join(' ').toLowerCase().includes(i.toLowerCase())));
    if (selectedLevels.length)    filtered = filtered.filter(j => selectedLevels.some(i => [j.title, ...(j.tags || [])].join(' ').toLowerCase().includes(i.toLowerCase())));
    if (selectedTypes.length)     filtered = filtered.filter(j => selectedTypes.some(i => (j.tags || []).join(' ').toLowerCase().includes(i.toLowerCase())));
    filtered = filtered.filter(j => (j.salaryNum||0) >= salaryFrom && (j.salaryNum||999) <= salaryTo);

    renderJobs(filtered);
}

function resetAllFilters() {
    document.querySelectorAll('.checkbox-list input[type="checkbox"]').forEach(cb => cb.checked = false);
    ['salaryFrom','salaryTo','searchInput'].forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
    applyFilters();
}

function init() {
    applyFilters();
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.addEventListener('change', applyFilters));
    document.getElementById('salaryFrom')?.addEventListener('input', applyFilters);
    document.getElementById('salaryTo')?.addEventListener('input', applyFilters);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
