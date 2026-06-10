/* ═══════════════════════════════════════════════════════════════
   admin/js/dashboard.js — Dashboard admin (stats từ shared data)
═══════════════════════════════════════════════════════════════ */
const MONTHS     = ['T1','T2','T3','T4','T5','T6'];
const TREND_DATA = [45, 62, 58, 81, 95, 87];

document.addEventListener('DOMContentLoaded', () => {
    if (typeof makeLineChart === 'function') makeLineChart('trendChart', MONTHS, TREND_DATA);

    // Cập nhật stat cards từ dữ liệu thực
    const jobs = CVMS.getJobs();
    const apps = CVMS.getApplications();
    const companies = CVMS.getCompanies();

    setStatCard('stat-jobs-active', jobs.filter(j => j.active !== false).length);
    setStatCard('stat-apps-total',  apps.length);
    setStatCard('stat-companies',   companies.length);
    setStatCard('stat-hired',       apps.filter(a => a.status === 'Đã offer').length);
    setStatCard('stage-total', apps.length);
    setStatCard('stage-screening', apps.filter(a => ['screening', 'review'].includes(a.pipelineStage) || a.status === 'Đang xem xét').length);
    setStatCard('stage-interview', apps.filter(a => a.pipelineStage === 'interview' || a.status === 'Phỏng vấn').length);
    setStatCard('stage-offer', apps.filter(a => a.pipelineStage === 'offer' || a.status === 'Đã offer').length);
    setStatCard('stage-hired', apps.filter(a => a.pipelineStage === 'hired').length);

    // Danh sách ứng viên mới nhất
    renderRecentApps(apps);
    renderTopJobs(jobs);

    if (typeof initNotifUI === 'function') initNotifUI('admin');
});

function setStatCard(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function renderRecentApps(apps) {
    const el = document.getElementById('recent-candidates');
    if (!el) return;
    const recent = apps.slice().reverse().slice(0, 6);
    if (recent.length === 0) {
        el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-secondary)">Chưa có ứng viên nào.</td></tr>';
        return;
    }
    const statusCls = { 'Mới nộp':'badge-green','Đang xem xét':'badge-amber','Phỏng vấn':'badge-blue','Đã offer':'badge-purple','Từ chối':'badge-red' };
    el.innerHTML = recent.map(a => `
        <tr>
          <td><div class="cname">${a.userName||a.userEmail}</div><div class="cpos">${a.userEmail}</div></td>
          <td>${a.jobTitle}</td>
          <td>${a.company || '—'}</td>
          <td style="color:var(--text-secondary)">${a.date}</td>
          <td><span class="badge ${statusCls[a.status]||'badge-green'}">${a.status}</span></td>
        </tr>`).join('');
}

function renderTopJobs(jobs) {
    const el = document.getElementById('top-jobs-list');
    if (!el) return;
    const top = jobs.filter(job => job.active !== false).sort((a, b) => (b.applicants || 0) - (a.applicants || 0)).slice(0, 4);
    if (!top.length) {
        el.innerHTML = '<div style="color:var(--text-secondary);font-size:13px">Chưa có vị trí nào.</div>';
        return;
    }
    el.innerHTML = top.map(job => `
        <div class="job-row">
          <div>
            <div class="job-title">${job.title}</div>
            <div class="job-meta">${job.company || '—'} • ${job.location || '—'} • ${job.deadline || 'Chưa đặt hạn'}</div>
          </div>
          <span class="badge badge-blue">${job.applicants || 0} UV</span>
        </div>`).join('');
}
