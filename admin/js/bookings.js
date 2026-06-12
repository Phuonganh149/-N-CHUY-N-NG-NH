let bookingsCache = [];
let activeBookingId = null;

const bookingStatusLabels = {
  pending_payment: 'Chờ thanh toán',
  waiting_admin_confirm: 'DN đã chuyển khoản',
  payment_confirmed: 'Admin đã xác nhận',
  job_created: 'Đã tạo tin',
  rejected: 'Từ chối',
};

const paymentStatusLabels = {
  waiting_transfer: 'Chờ chuyển khoản',
  customer_confirmed: 'DN xác nhận CK',
  admin_confirmed: 'Admin xác nhận',
};

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function statusBadge(status) {
  const cls = {
    pending_payment: 'badge-amber',
    waiting_admin_confirm: 'badge-blue',
    payment_confirmed: 'badge-green',
    job_created: 'badge-purple',
    rejected: 'badge-red',
  }[status] || 'badge-blue';
  return `<span class="badge ${cls}">${escapeHTML(bookingStatusLabels[status] || status || 'Chờ xử lý')}</span>`;
}

function paymentBadge(status) {
  const cls = {
    waiting_transfer: 'badge-amber',
    customer_confirmed: 'badge-blue',
    admin_confirmed: 'badge-green',
  }[status] || 'badge-amber';
  return `<span class="badge ${cls}">${escapeHTML(paymentStatusLabels[status] || status || 'Chờ chuyển khoản')}</span>`;
}

function renderStats() {
  const total = bookingsCache.length;
  const paid = bookingsCache.filter(item => item.paymentStatus === 'customer_confirmed' || item.status === 'waiting_admin_confirm').length;
  const confirmed = bookingsCache.filter(item => item.paymentStatus === 'admin_confirmed' || item.status === 'payment_confirmed').length;
  const jobs = bookingsCache.filter(item => item.jobId || item.status === 'job_created').length;
  setText('booking-stat-total', total);
  setText('booking-stat-paid', paid);
  setText('booking-stat-confirmed', confirmed);
  setText('booking-stat-jobs', jobs);
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderBookings(list) {
  const tbody = document.getElementById('bookingTableBody');
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-secondary)">Chưa có yêu cầu booking nào.</td></tr>';
    setText('booking-count', '0 yêu cầu');
    return;
  }
  tbody.innerHTML = list.map(item => {
    const canConfirm = item.paymentStatus === 'customer_confirmed' || item.status === 'waiting_admin_confirm';
    const canCreateJob = item.paymentStatus === 'admin_confirmed' || item.status === 'payment_confirmed' || item.status === 'job_created';
    const hasJob = !!item.jobId || item.status === 'job_created';
    return `
      <tr>
        <td>
          <div class="booking-company">
            <span class="booking-id">#${Number(item.id)}</span>
            <span class="cname">${escapeHTML(item.companyName)}</span>
            <span class="cpos">${escapeHTML(item.contactName || '')} • ${escapeHTML(item.email || '')}</span>
            <span class="cpos">${escapeHTML(item.phone || '')}</span>
          </div>
        </td>
        <td>
          <div>${escapeHTML(item.packageLabel || item.packageKey || 'Basic')}</div>
          <div class="cpos">${Number(item.quantity || 1)} tin • ${Number(item.duration || 30)} ngày</div>
        </td>
        <td>
          <div class="booking-money">${money(item.totalAmount)}</div>
          <div style="margin-top:5px">${paymentBadge(item.paymentStatus)}</div>
          ${item.paymentConfirmedAt ? `<div class="cpos">${escapeHTML(item.paymentConfirmedAt)}</div>` : ''}
        </td>
        <td>
          <div class="cname">${escapeHTML(item.jobTitle || 'Chưa ghi vị trí')}</div>
          <div class="booking-note" title="${escapeHTML(item.note || '')}">${escapeHTML(item.note || item.industry || 'Không có ghi chú')}</div>
        </td>
        <td>
          ${statusBadge(item.status)}
          ${item.rejectedReason ? `<div class="cpos">${escapeHTML(item.rejectedReason)}</div>` : ''}
          ${hasJob ? `<div class="cpos">Job #${Number(item.jobId || 0)}</div>` : ''}
        </td>
        <td>
          <div class="booking-actions">
            <button class="action-btn success" type="button" onclick="confirmBooking(${Number(item.id)})" ${canConfirm ? '' : 'disabled'}>
              <i class="ti ti-check"></i> Xác nhận CK
            </button>
            <button class="action-btn primary" type="button" onclick="openJobFromBookingModal(${Number(item.id)})" ${canCreateJob && !hasJob ? '' : 'disabled'}>
              <i class="ti ti-briefcase"></i> Tạo tin
            </button>
            <button class="action-btn danger" type="button" onclick="rejectBooking(${Number(item.id)})" ${item.status === 'rejected' || hasJob ? 'disabled' : ''}>
              <i class="ti ti-x"></i> Từ chối
            </button>
          </div>
        </td>
      </tr>`;
  }).join('');
  setText('booking-count', `${list.length} yêu cầu`);
}

function filterBookings() {
  const q = ((document.getElementById('bookingSearch')?.value || document.getElementById('topBookingSearch')?.value || '')).toLowerCase();
  const status = document.getElementById('bookingStatusFilter')?.value || '';
  const payment = document.getElementById('bookingPaymentFilter')?.value || '';
  const list = bookingsCache.filter(item =>
    (!status || item.status === status) &&
    (!payment || item.paymentStatus === payment) &&
    (!q || [item.companyName, item.contactName, item.email, item.phone, item.jobTitle, item.industry, item.note].join(' ').toLowerCase().includes(q))
  );
  renderBookings(list);
}

function refreshBookings() {
  try {
    bookingsCache = CVMS.getCompanyBookings();
    renderStats();
    filterBookings();
  } catch (error) {
    const msg = String(error.message || '');
    if (msg.includes('401') || msg.toLowerCase().includes('unauthorized') || msg.toLowerCase().includes('đăng nhập')) {
      showAdminToast('Phiên đăng nhập hết hạn. Đang chuyển về trang đăng nhập...', 'error');
      setTimeout(() => { window.location.href = '../../login.html'; }, 1800);
    } else {
      showAdminToast(msg || 'Không tải được danh sách yêu cầu.', 'error');
    }
    renderBookings([]);
  }
}

function confirmBooking(id) {
  const btn = document.querySelector(`button[onclick="confirmBooking(${Number(id)})"]`);
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="ti ti-loader-2"></i> Đang xử lý...'; }
  try {
    const booking = CVMS.adminConfirmCompanyBooking(id);
    // Cập nhật cache local trước khi refresh để UI nhanh hơn
    const idx = bookingsCache.findIndex(b => Number(b.id) === Number(id));
    if (idx !== -1 && booking) bookingsCache[idx] = booking;
    showAdminToast('Đã xác nhận thanh toán và kích hoạt doanh nghiệp.');
    refreshBookings();
  } catch (error) {
    showAdminToast(error.message, 'error');
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="ti ti-check"></i> Xác nhận CK'; }
  }
}

function rejectBooking(id) {
  const reason = prompt('Lý do từ chối/tạm dừng yêu cầu này:', 'Thông tin chuyển khoản chưa khớp hoặc cần bổ sung hồ sơ.');
  if (reason === null) return; // User nhấn Cancel
  const btn = document.querySelector(`button[onclick="rejectBooking(${Number(id)})"]`);
  if (btn) { btn.disabled = true; }
  try {
    CVMS.rejectCompanyBooking(id, reason);
    showAdminToast('Đã cập nhật trạng thái từ chối.');
    refreshBookings();
  } catch (error) {
    showAdminToast(error.message, 'error');
    if (btn) btn.disabled = false;
  }
}

function openJobFromBookingModal(id) {
  const booking = bookingsCache.find(item => Number(item.id) === Number(id));
  if (!booking) return;
  activeBookingId = id;
  ensureJobFromBookingModal();
  setField('booking-job-title', booking.jobTitle || '');
  setField('booking-job-location', 'Hà Nội');
  setField('booking-job-dept', booking.industry || 'Other');
  setField('booking-job-salary', 'Thỏa thuận');
  setField('booking-job-deadline', defaultDeadline(Number(booking.duration || 30)));
  setField('booking-job-qty', Math.max(1, Number(booking.quantity || 1)));
  setField('booking-job-tags', [booking.industry, booking.packageLabel].filter(Boolean).join(', '));
  setText('booking-job-company', booking.companyName || 'Doanh nghiệp');
  document.getElementById('booking-job-modal').style.display = 'flex';
}

function closeJobFromBookingModal() {
  const modal = document.getElementById('booking-job-modal');
  if (modal) modal.style.display = 'none';
  activeBookingId = null;
}

function ensureJobFromBookingModal() {
  if (document.getElementById('booking-job-modal')) return;
  const modal = document.createElement('div');
  modal.id = 'booking-job-modal';
  modal.className = 'cvms-modal booking-job-modal';
  modal.innerHTML = `
    <div class="cvms-dialog">
      <div class="cvms-dialog-head">
        <div>
          <h3>Tạo tin từ booking</h3>
          <p>Doanh nghiệp: <strong id="booking-job-company"></strong></p>
        </div>
        <button class="modal-close" type="button" onclick="closeJobFromBookingModal()" title="Đóng"><i class="ti ti-x"></i></button>
      </div>
      <form id="booking-job-form" class="booking-job-form">
        <label class="form-field span-2">
          <span>Vị trí tuyển dụng</span>
          <input id="booking-job-title" required placeholder="VD: Nhân viên kinh doanh">
        </label>
        <label class="form-field">
          <span>Địa điểm</span>
          <input id="booking-job-location" required placeholder="Hà Nội">
        </label>
        <label class="form-field">
          <span>Bộ phận/ngành</span>
          <input id="booking-job-dept" required placeholder="Kinh doanh">
        </label>
        <label class="form-field">
          <span>Mức lương</span>
          <input id="booking-job-salary" placeholder="Thỏa thuận">
        </label>
        <label class="form-field">
          <span>Hạn nộp</span>
          <input id="booking-job-deadline" required placeholder="dd/mm/yyyy">
        </label>
        <label class="form-field">
          <span>Số lượng</span>
          <input id="booking-job-qty" type="number" min="1" required>
        </label>
        <label class="form-field">
          <span>Từ khóa</span>
          <input id="booking-job-tags" placeholder="Sales, CRM, B2B">
        </label>
        <div class="booking-modal-actions span-2">
          <button class="action-btn" type="button" onclick="closeJobFromBookingModal()">Hủy</button>
          <button class="add-btn" type="submit"><i class="ti ti-device-floppy"></i> Tạo tin tuyển dụng</button>
        </div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) closeJobFromBookingModal(); });
  document.getElementById('booking-job-form').addEventListener('submit', submitJobFromBooking);
}

function submitJobFromBooking(event) {
  event.preventDefault();
  if (!activeBookingId) return;
  const payload = {
    title: document.getElementById('booking-job-title').value.trim(),
    location: document.getElementById('booking-job-location').value.trim(),
    dept: document.getElementById('booking-job-dept').value.trim(),
    salary: document.getElementById('booking-job-salary').value.trim() || 'Thỏa thuận',
    deadline: document.getElementById('booking-job-deadline').value.trim(),
    qty: Number(document.getElementById('booking-job-qty').value || 1),
    tags: document.getElementById('booking-job-tags').value.trim(),
  };
  if (!payload.title || !payload.location || !payload.deadline) {
    showAdminToast('Vui lòng nhập vị trí, địa điểm và hạn nộp.', 'error');
    return;
  }
  try {
    const result = CVMS.createJobFromBooking(activeBookingId, payload);
    closeJobFromBookingModal();
    showAdminToast(`Đã tạo tin "${result.job?.title || payload.title}".`);
    refreshBookings();
  } catch (error) {
    showAdminToast(error.message, 'error');
  }
}

function setField(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value;
}

function defaultDeadline(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(7, Number(days || 30)));
  return date.toLocaleDateString('vi-VN');
}

function showAdminToast(msg, type = 'success') {
  let t = document.getElementById('admin-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'admin-toast';
    // Inject inline style lần đầu để không phụ thuộc CSS riêng
    t.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      padding: 12px 18px; border-radius: 10px; font-size: 13px;
      font-weight: 600; max-width: 360px; box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      transition: opacity 0.3s; pointer-events: none;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  if (type === 'error') {
    t.style.background = '#fef2f2';
    t.style.color = '#b91c1c';
    t.style.border = '1px solid #fecaca';
  } else {
    t.style.background = '#f0fdf4';
    t.style.color = '#166534';
    t.style.border = '1px solid #bbf7d0';
  }
  t.style.opacity = '1';
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(() => { t.style.opacity = '0'; }, 3200);
}

document.addEventListener('DOMContentLoaded', () => {
  refreshBookings();
  ['bookingSearch', 'topBookingSearch'].forEach(id => document.getElementById(id)?.addEventListener('input', filterBookings));
  ['bookingStatusFilter', 'bookingPaymentFilter'].forEach(id => document.getElementById(id)?.addEventListener('change', filterBookings));
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('refreshBtn');
    if (btn) btn.querySelector('i')?.classList.add('spin-once');
    refreshBookings();
    setTimeout(() => btn?.querySelector('i')?.classList.remove('spin-once'), 600);
  });
  if (typeof initNotifUI === 'function') initNotifUI('admin');
});
