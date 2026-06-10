/* =============================================
   DACV/jss/Tuyendung.js - PHIÊN BẢN CẢI TIẾN
   Hệ thống lọc việc làm thông minh + mượt mà
============================================= */

let allJobs = [];
let debounceTimeout = null;

// Render danh sách việc làm
function renderJobs(jobs) {
    const container = document.getElementById('jobsList');
    if (!container) return;

    container.innerHTML = '';

    if (jobs.length === 0) {
        container.innerHTML = `
            <p style="grid-column: 1/-1; text-align:center; padding: 80px 20px; 
                      color:#64748b; font-size:1.1rem;">
                ❌ Không tìm thấy công việc nào phù hợp với tiêu chí của bạn.
            </p>`;
        return;
    }

    jobs.forEach(job => {
        container.innerHTML += `
            <div class="job-card">
                <div class="job-info">
                    <h3>${job.title}</h3>
                    <p class="job-meta"><strong>${job.company}</strong> • ${job.location}</p>
                    <p class="job-meta">
                        <span style="color:var(--accent);font-weight:600;">
                            ${job.salary || (job.salaryNum ? job.salaryNum + ' triệu' : 'Thỏa thuận')}
                        </span> • 
                        ${(job.tags || []).join(', ')}
                    </p>
                    <p class="job-meta" style="font-size:0.85rem;color:#64748b">
                        Hạn: ${job.deadline}
                    </p>
                </div>
                <div>
                    <a href="login.html" class="apply-btn">Ứng tuyển ngay</a>
                </div>
            </div>`;
    });
}

// Lấy giá trị checkbox
function getSelectedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input:checked`))
                .map(i => i.value);
}

// Hàm lọc chính (có debounce)
function applyFilters() {
    if (debounceTimeout) clearTimeout(debounceTimeout);

    debounceTimeout = setTimeout(() => {
        const searchTerm = (document.getElementById('searchInput')?.value || '').toLowerCase().trim();

        const selectedLocations = getSelectedValues('companyFilter');
        const selectedIndustries = getSelectedValues('industryFilter');
        const selectedLevels = getSelectedValues('levelFilter');
        const selectedTypes = getSelectedValues('workTypeFilter');

        const salaryFrom = parseFloat(document.getElementById('salaryFrom')?.value) || 0;
        const salaryTo = parseFloat(document.getElementById('salaryTo')?.value) || 999;

        let filtered = allJobs.filter(j => j.active !== false);

        // Tìm kiếm
        if (searchTerm) {
            filtered = filtered.filter(j =>
                j.title.toLowerCase().includes(searchTerm) ||
                (j.company || '').toLowerCase().includes(searchTerm)
            );
        }

        // Bộ lọc
        if (selectedLocations.length) filtered = filtered.filter(j => selectedLocations.includes(j.location));
        if (selectedIndustries.length) {
            filtered = filtered.filter(j => 
                selectedIndustries.some(ind => 
                    (j.tags || []).includes(ind) || (j.dept || '').includes(ind)
                )
            );
        }
        if (selectedLevels.length) filtered = filtered.filter(j => selectedLevels.includes(j.level || ''));
        if (selectedTypes.length) filtered = filtered.filter(j => selectedTypes.includes(j.type || ''));

        // Lọc theo lương
        filtered = filtered.filter(j => {
            const salary = j.salaryNum || 0;
            return salary >= salaryFrom && salary <= salaryTo;
        });

        renderJobs(filtered);
    }, 180); // Debounce
}

// Reset tất cả
function resetAllFilters() {
    document.querySelectorAll('.checkbox-list input[type="checkbox"]').forEach(cb => cb.checked = false);
    ['searchInput', 'salaryFrom', 'salaryTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    applyFilters();
}

// Khởi tạo
function init() {
    allJobs = CVMS.getJobs();
    applyFilters(); // Render lần đầu

    // Gắn sự kiện
    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', applyFilters);
    });
    document.getElementById('salaryFrom')?.addEventListener('input', applyFilters);
    document.getElementById('salaryTo')?.addEventListener('input', applyFilters);

    // Nút reset
    document.querySelector('.reset-btn')?.addEventListener('click', resetAllFilters);
}

// Chạy khi load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
