/* ═══════════════════════════════════════════════════════════════
   user/js/dashboard.js — Tổng quan ứng viên (sync real-time)
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    const raw  = localStorage.getItem('cvms_user');
    const user = raw ? JSON.parse(raw) : null;
    if (!user) return;

    // Chào tên
    const greet = document.getElementById('greet-name');
    if (greet) greet.textContent = 'Chào mừng, ' + user.name + '!';

    // Thống kê
    const allApps = CVMS.getApplications();
    const myApps  = allApps.filter(a => a.userEmail === user.email);
    const allJobs = CVMS.getJobs().filter(j => j.active !== false);
    const recommendedJobs = pickRecommendedJobs(allJobs, user.email, myApps);

    setStatCard('stat-total',     myApps.length);
    setStatCard('stat-reviewing', myApps.filter(a => a.status === 'Đang xem xét').length);
    setStatCard('stat-interview', myApps.filter(a => a.status === 'Phỏng vấn').length);
    setStatCard('stat-offer',     recommendedJobs.length);

    // Danh sách đơn gần nhất
    renderAppliedJobs(myApps, user.email);
    renderRecommendedJobs(recommendedJobs);

    // Notification
    if (typeof initNotifUI === 'function') initNotifUI('user');
});

function setStatCard(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
}

function renderAppliedJobs(myApps, email) {
    const el = document.getElementById('recent-applications');
    if (!el) return;
    if (myApps.length === 0) {
        el.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-secondary);padding:28px">Bạn chưa nộp đơn vào vị trí nào. <a href="jobs.html" style="color:var(--accent)">Tìm việc ngay →</a></td></tr>';
        return;
    }
    const statusMap = {
        'Mới nộp':      'badge-blue',
        'Đang xem xét': 'badge-amber',
        'Phỏng vấn':    'badge-purple',
        'Đã offer':     'badge-green',
        'Từ chối':      'badge-red',
    };
    el.innerHTML = myApps.slice().reverse().slice(0,8).map(a => `
        <tr>
          <td><div class="cname">${escapeHTML(a.jobTitle)}</div><div class="cpos">${escapeHTML(a.company)}</div></td>
          <td style="color:var(--text-secondary)">${escapeHTML(a.date)}</td>
          <td>${escapeHTML(a.location)}</td>
          <td><span class="badge ${statusMap[a.status] || 'badge-blue'}">${escapeHTML(a.status)}</span></td>
        </tr>`).join('');
}

function pickRecommendedJobs(allJobs, email, myApps) {
    let industries = [];
    try {
        industries = CVMS.getCV(email)?.industries || [];
    } catch {}
    const applied = new Set(myApps.map(app => app.jobId));
    const scored = allJobs
        .filter(job => !applied.has(job.id))
        .map(job => {
            const haystack = [job.dept, job.title, ...(job.tags || [])].join(' ').toLowerCase();
            const score = industries.reduce((total, industry) => total + (haystack.includes(String(industry).toLowerCase()) ? 4 : 0), 0);
            return { job, score };
        })
        .sort((a, b) => b.score - a.score || (b.job.id || 0) - (a.job.id || 0));
    return scored.slice(0, 5).map(item => item.job);
}

function renderRecommendedJobs(jobs) {
    const list = document.querySelector('.job-list');
    if (!list) return;
    if (!jobs.length) {
        list.innerHTML = '<div style="font-size:12px;color:var(--text-secondary);padding:12px 0">Hiện chưa có vị trí mới phù hợp. Hãy cập nhật ngành trong hồ sơ CV để nhận gợi ý tốt hơn.</div>';
        return;
    }
    const badgeClasses = ['badge-green', 'badge-blue', 'badge-amber', 'badge-purple'];
    list.innerHTML = jobs.map((job, index) => `
      <div class="job-row">
        <div>
          <div class="job-title">${escapeHTML(job.title)}</div>
          <div class="job-meta">${escapeHTML(job.company)} • ${escapeHTML(job.location)} • ${escapeHTML(job.dept || 'Khác')}</div>
        </div>
        <span class="badge ${badgeClasses[index % badgeClasses.length]}">${escapeHTML(job.salary || 'Thỏa thuận')}</span>
      </div>
    `).join('');
}
