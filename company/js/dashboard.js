let companyDashboardData = { bookings: [], jobs: [], shortlisted: [] };

const bookingStatusLabels = {
  pending_payment: 'Chờ thanh toán',
  waiting_admin_confirm: 'Chờ admin kiểm tra CK',
  payment_confirmed: 'Đã xác nhận thanh toán',
  job_created: 'Đã tạo tin',
  rejected: 'Từ chối',
};

const paymentStatusLabels = {
  waiting_transfer: 'Chờ chuyển khoản',
  customer_confirmed: 'Bạn đã xác nhận CK',
  admin_confirmed: 'Admin đã xác nhận',
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function badge(label, cls = 'badge-blue') {
  return `<span class="badge ${cls}">${escapeHTML(label)}</span>`;
}

function statusBadge(status) {
  const cls = {
    pending_payment: 'badge-amber',
    waiting_admin_confirm: 'badge-blue',
    payment_confirmed: 'badge-green',
    job_created: 'badge-purple',
    rejected: 'badge-red',
  }[status] || 'badge-blue';
  return badge(bookingStatusLabels[status] || status || 'Chờ xử lý', cls);
}

function paymentBadge(status) {
  const cls = {
    waiting_transfer: 'badge-amber',
    customer_confirmed: 'badge-blue',
    admin_confirmed: 'badge-green',
  }[status] || 'badge-amber';
  return badge(paymentStatusLabels[status] || status || 'Chờ chuyển khoản', cls);
}

function renderStats() {
  const pendingFeedback = companyDashboardData.shortlisted.filter(item => !item.companyFeedback).length;
  setText('company-stat-bookings', companyDashboardData.bookings.length);
  setText('company-stat-jobs', companyDashboardData.jobs.filter(job => job.active !== false).length);
  setText('company-stat-candidates', companyDashboardData.shortlisted.length);
  setText('company-stat-pending', pendingFeedback);
}

function renderBookings() {
  const tbody = document.getElementById('companyBookingBody');
  const bookings = companyDashboardData.bookings || [];
  if (!tbody) return;
  if (!bookings.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--text-secondary)">Chưa có yêu cầu nào. Hãy tạo booking để admin đăng bài.</td></tr>';
    return;
  }
  tbody.innerHTML = bookings.map(item => `
    <tr>
      <td>#${Number(item.id)}</td>
      <td>
        <div class="cname">${escapeHTML(item.packageLabel || item.packageKey || 'Basic')}</div>
        <div class="cpos">${money(item.totalAmount)} • ${Number(item.quantity || 1)} tin</div>
      </td>
      <td>
        ${paymentBadge(item.paymentStatus)}
        ${item.paymentConfirmedAt ? `<div class="cpos">${escapeHTML(item.paymentConfirmedAt)}</div>` : ''}
      </td>
      <td>
        ${statusBadge(item.status)}
        ${item.jobId ? `<div class="cpos">Tin #${Number(item.jobId)}</div>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderJobs() {
  const tbody = document.getElementById('companyJobBody');
  const jobs = companyDashboardData.jobs || [];
  if (!tbody) return;
  if (!jobs.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:28px;color:var(--text-secondary)">Chưa có tin nào được admin đăng.</td></tr>';
    return;
  }
  tbody.innerHTML = jobs.map(job => `
    <tr>
      <td>
        <div class="cname">${escapeHTML(job.title)}</div>
        <div class="cpos">${escapeHTML(job.dept || 'Khác')}</div>
      </td>
      <td>${escapeHTML(job.location || '—')}</td>
      <td>${Number(job.applicants || 0)}</td>
      <td>${badge(job.active === false ? 'Đã đóng' : (job.status || 'Đang tuyển'), job.active === false ? 'badge-red' : 'badge-green')}</td>
    </tr>
  `).join('');
}

function renderAiCell(app) {
  if (app.aiScore === null || app.aiScore === undefined || app.aiScore === '') {
    return '<span style="font-size:11px;color:var(--text-secondary)">Chưa có điểm</span>';
  }
  const score = Number(app.aiScore || 0);
  const color = score >= 80 ? '#16a34a' : score >= 65 ? 'var(--accent)' : score >= 50 ? '#d97706' : '#dc2626';
  return `
    <div class="company-ai-score">
      <strong style="color:${color}">${score}/100</strong>
      <span class="cpos">${escapeHTML(app.aiFitLevel || 'Đã chấm')}</span>
    </div>`;
}

function renderCandidates() {
  const tbody = document.getElementById('companyCandidateBody');
  const candidates = companyDashboardData.shortlisted || [];
  if (!tbody) return;
  if (!candidates.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:var(--text-secondary)">Chưa có ứng viên nào được admin gửi sang.</td></tr>';
    return;
  }
  tbody.innerHTML = candidates.map(app => `
    <tr>
      <td>
        <div class="cname">${escapeHTML(app.userName || app.userEmail)}</div>
        <div class="cpos">${escapeHTML(app.userEmail || '')}</div>
      </td>
      <td>
        <div>${escapeHTML(app.jobTitle || 'Chưa rõ')}</div>
        <div class="cpos">${escapeHTML(app.sharedAt ? 'Gửi lúc ' + app.sharedAt : '')}</div>
      </td>
      <td>${renderAiCell(app)}</td>
      <td>
        <div class="cpos">${escapeHTML(app.companyShareNote || app.adminNote || 'Admin gửi để doanh nghiệp xem xét.')}</div>
      </td>
      <td>
        <div class="feedback-control">
          <select class="filter-select" id="feedback-${Number(app.id)}">
            <option value="">Chọn phản hồi</option>
            <option value="Muốn phỏng vấn" ${app.companyFeedback === 'Muốn phỏng vấn' ? 'selected' : ''}>Muốn phỏng vấn</option>
            <option value="Từ chối ứng viên" ${app.companyFeedback === 'Từ chối ứng viên' ? 'selected' : ''}>Từ chối</option>
            <option value="Cần thêm ứng viên" ${app.companyFeedback === 'Cần thêm ứng viên' ? 'selected' : ''}>Cần thêm ứng viên</option>
          </select>
          <button class="action-btn" type="button" onclick="sendFeedback(${Number(app.id)})"><i class="ti ti-send"></i></button>
        </div>
        ${app.companyFeedback ? `<div class="feedback-note">Đã phản hồi: ${escapeHTML(app.companyFeedback)}${app.companyFeedbackAt ? ' • ' + escapeHTML(app.companyFeedbackAt) : ''}</div>` : ''}
      </td>
    </tr>
  `).join('');
}

function sendFeedback(appId) {
  const feedback = document.getElementById(`feedback-${Number(appId)}`)?.value || '';
  if (!feedback) {
    showCompanyToast('Hãy chọn phản hồi trước.', 'error');
    return;
  }
  try {
    CVMS.updateCompanyApplicationFeedback(appId, feedback);
    showCompanyToast('Đã gửi phản hồi cho admin.');
    loadDashboard();
  } catch (error) {
    showCompanyToast(error.message, 'error');
  }
}

function loadDashboard() {
  try {
    companyDashboardData = CVMS.getCompanyDashboard();
    const user = companyDashboardData.user || JSON.parse(localStorage.getItem('cvms_user') || '{}');
    setText('companyNameTitle', user.companyName || user.name || 'Doanh nghiệp');
    renderStats();
    renderBookings();
    renderJobs();
    renderCandidates();
  } catch (error) {
    showCompanyToast(error.message, 'error');
  }
}

function showCompanyToast(msg, type = 'success') {
  let t = document.getElementById('company-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'company-toast';
    t.className = 'admin-toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `admin-toast ${type === 'error' ? 'error' : ''}`;
  t.style.opacity = '1';
  setTimeout(() => t.style.opacity = '0', 2800);
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
  if (typeof initNotifUI === 'function') initNotifUI('company');
});
