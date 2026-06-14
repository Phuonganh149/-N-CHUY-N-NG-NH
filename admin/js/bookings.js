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
  setText('booking-stat-total', total);
  setText('booking-stat-paid', paid);
  setText('booking-stat-confirmed', confirmed);
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
    const hasJob = false;
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
        </td>
        <td>
          <div class="booking-actions">
            <button class="action-btn success" type="button" onclick="confirmBooking(${Number(item.id)})" ${canConfirm ? '' : 'disabled'}>
              <i class="ti ti-check"></i> Xác nhận CK
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

// Admin kh?ng t?o tin t? booking. Lu?ng ??ng: x?c nh?n thanh to?n -> k?ch ho?t subscription -> doanh nghi?p t? ??ng tin.

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
