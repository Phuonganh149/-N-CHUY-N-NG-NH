const ADMIN_PAYMENT = {
  bankName: 'MB Bank',
  accountName: 'CVMS Admin',
  accountNumber: '0987654321',
};

const PACKAGE_PRICES = {
  basic: { label: 'Basic', price: 1500000 },
  standard: { label: 'Standard', price: 3500000 },
  priority: { label: 'Priority', price: 5900000 },
};

let currentBooking = null;

function money(value) {
  return Number(value || 0).toLocaleString('vi-VN') + 'đ';
}

function showResult(message, type = '') {
  const el = document.getElementById('bookingResult');
  if (!el) return;
  el.textContent = message;
  el.className = `result-note ${type}`.trim();
}

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('cvms_user') || 'null');
  } catch {
    return null;
  }
}

function getPackageData() {
  const packageKey = document.getElementById('packageKey').value;
  return PACKAGE_PRICES[packageKey] || PACKAGE_PRICES.basic;
}

function getTotalAmount() {
  const pkg = getPackageData();
  const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
  return pkg.price * quantity;
}

function getDraftPaymentData() {
  const pkg = getPackageData();
  const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
  return {
    id: null,
    companyName: document.getElementById('companyName').value.trim() || 'Doanh nghiệp',
    packageLabel: pkg.label,
    quantity,
    totalAmount: getTotalAmount(),
  };
}

function getPaymentData(source = null) {
  const draft = getDraftPaymentData();
  return {
    ...draft,
    ...(source || {}),
    quantity: Math.max(1, Number(source?.quantity || draft.quantity || 1)),
    totalAmount: Number(source?.totalAmount ?? draft.totalAmount ?? 0),
  };
}

function getTransferText(source = null) {
  const item = getPaymentData(source);
  return [
    'CVMS BOOKING',
    `MA: ${item.id || 'CHUA GUI'}`,
    `CTY: ${item.companyName}`,
    `GOI: ${item.packageLabel}`,
    `SL: ${item.quantity}`,
    `TT: ${money(item.totalAmount)}`
  ].join(' | ');
}

function renderPayment(source = currentBooking) {
  const item = getPaymentData(source);
  const transferText = getTransferText(source);
  document.getElementById('accountName').textContent = ADMIN_PAYMENT.accountName;
  document.getElementById('bankName').textContent = ADMIN_PAYMENT.bankName;
  document.getElementById('accountNumber').textContent = ADMIN_PAYMENT.accountNumber;
  document.getElementById('bookingCode').textContent = item.id ? `#${item.id}` : 'Chưa gửi';
  document.getElementById('paymentAmount').textContent = money(item.totalAmount);
  document.getElementById('transferNote').textContent = transferText;
  document.getElementById('bookingQr').src = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(transferText)}`;
  document.getElementById('totalAmount').textContent = money(getTotalAmount());
}

function populateUserDefaults() {
  const user = getCurrentUser();
  if (!user) return;
  if (user.role === 'company') {
    document.getElementById('companyName').value = user.companyName || user.name || '';
    document.getElementById('contactName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
  } else {
    document.getElementById('contactName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
  }
}

function collectBooking() {
  const pkg = getPackageData();
  const quantity = Math.max(1, Number(document.getElementById('quantity').value || 1));
  return {
    role: 'company',
    companyName: document.getElementById('companyName').value.trim(),
    contactName: document.getElementById('contactName').value.trim(),
    email: document.getElementById('email').value.trim().toLowerCase(),
    phone: document.getElementById('phone').value.trim(),
    industry: document.getElementById('industry').value.trim(),
    packageKey: document.getElementById('packageKey').value,
    packageLabel: pkg.label,
    jobTitle: document.getElementById('jobTitle').value.trim(),
    quantity,
    duration: Number(document.getElementById('duration').value || 30),
    totalAmount: getTotalAmount(),
    note: document.getElementById('note').value.trim(),
    submittedRole: getCurrentUser()?.role || 'company',
    source: 'booking-page',
  };
}

function setStep(step) {
  const shell = document.querySelector('.booking-shell');
  const isPayment = step === 'payment';
  shell?.classList.toggle('form-step', !isPayment);
  shell?.classList.toggle('payment-step', isPayment);
  document.getElementById('stepForm')?.classList.toggle('active', !isPayment);
  document.getElementById('stepPayment')?.classList.toggle('active', isPayment);
  if (isPayment) syncPaymentConfirmationState();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncPaymentConfirmationState() {
  const checkbox = document.getElementById('transferDone');
  const button = document.getElementById('confirmPayment');
  const status = document.getElementById('paymentStatus');
  const confirmed = currentBooking?.paymentStatus === 'customer_confirmed';
  if (checkbox) {
    checkbox.checked = confirmed;
    checkbox.disabled = confirmed;
  }
  if (button) {
    button.disabled = confirmed || !checkbox?.checked;
    button.innerHTML = confirmed
      ? '<i class="ti ti-check"></i> Đã gửi xác nhận chuyển khoản'
      : '<i class="ti ti-check"></i> Xác nhận đã chuyển khoản';
  }
  if (status) {
    status.textContent = confirmed
      ? 'Đã ghi nhận bạn đã chuyển khoản. Admin sẽ kiểm tra và xác nhận giao dịch.'
      : 'Đang chờ doanh nghiệp chuyển khoản.';
    status.classList.toggle('done', confirmed);
  }
}

function copyPaymentInfo() {
  const text = [
    `Mã yêu cầu: ${currentBooking?.id ? `#${currentBooking.id}` : 'Chưa gửi'}`,
    `Ngân hàng: ${ADMIN_PAYMENT.bankName}`,
    `Chủ tài khoản: ${ADMIN_PAYMENT.accountName}`,
    `Số tài khoản: ${ADMIN_PAYMENT.accountNumber}`,
    `Số tiền: ${money(getPaymentData(currentBooking).totalAmount)}`,
    `Nội dung: ${getTransferText(currentBooking)}`
  ].join('\n');
  navigator.clipboard?.writeText(text).then(() => {
    showResult('Đã sao chép thông tin thanh toán.', 'success');
  }).catch(() => {
    showResult('Không thể sao chép tự động, bạn có thể copy thủ công.', 'error');
  });
}

function bindEvents() {
  ['companyName', 'contactName', 'email', 'phone', 'industry', 'packageKey', 'quantity', 'duration', 'jobTitle', 'note']
    .forEach((id) => document.getElementById(id)?.addEventListener('input', () => {
      currentBooking = null;
      renderPayment();
    }));
  document.getElementById('packageKey')?.addEventListener('change', renderPayment);
  document.getElementById('quantity')?.addEventListener('change', renderPayment);
  document.getElementById('duration')?.addEventListener('change', renderPayment);
  document.getElementById('copyPayment')?.addEventListener('click', copyPaymentInfo);
  document.getElementById('bookingForm')?.addEventListener('submit', submitBooking);
  document.getElementById('transferDone')?.addEventListener('change', syncPaymentConfirmationState);
  document.getElementById('confirmPayment')?.addEventListener('click', confirmTransfer);
  document.getElementById('newBooking')?.addEventListener('click', startNewBooking);
}

function submitBooking(event) {
  event.preventDefault();
  const payload = collectBooking();
  if (!payload.companyName || !payload.contactName || !payload.email || !payload.phone) {
    showResult('Vui lòng điền đủ tên doanh nghiệp, người liên hệ, email và số điện thoại.', 'error');
    return;
  }

  const submitButton = event.submitter || document.querySelector('.submit-btn');
  if (submitButton) submitButton.disabled = true;
  try {
    const result = CVMS.submitCompanyBooking(payload);
    if (!result.ok) {
      showResult(result.msg || 'Không gửi được yêu cầu booking.', 'error');
      return;
    }
    currentBooking = { ...payload, ...(result.booking || {}) };
    showResult('Yêu cầu booking đã được gửi. Hãy hoàn tất bước thanh toán.', 'success');
    renderPayment(currentBooking);
    setStep('payment');
  } catch (error) {
    showResult(error.message, 'error');
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function confirmTransfer() {
  const checkbox = document.getElementById('transferDone');
  const button = document.getElementById('confirmPayment');
  if (!currentBooking?.id) {
    showResult('Bạn cần gửi yêu cầu booking trước khi xác nhận chuyển khoản.', 'error');
    return;
  }
  if (!checkbox?.checked) {
    showResult('Hãy tick xác nhận đã chuyển khoản trước.', 'error');
    return;
  }

  if (button) {
    button.disabled = true;
    button.innerHTML = '<i class="ti ti-loader-2"></i> Đang gửi xác nhận...';
  }
  try {
    const result = CVMS.confirmCompanyBookingPayment(currentBooking.id, currentBooking.email);
    if (!result.ok) {
      showResult(result.msg || 'Không xác nhận được thanh toán.', 'error');
      syncPaymentConfirmationState();
      return;
    }
    currentBooking = { ...currentBooking, ...(result.booking || {}), paymentStatus: 'customer_confirmed' };
    syncPaymentConfirmationState();
    showResult('Đã ghi nhận xác nhận chuyển khoản. Admin sẽ kiểm tra giao dịch.', 'success');
  } catch (error) {
    showResult(error.message, 'error');
    syncPaymentConfirmationState();
  }
}

function startNewBooking() {
  currentBooking = null;
  document.getElementById('bookingForm')?.reset();
  populateUserDefaults();
  showResult('', '');
  renderPayment();
  syncPaymentConfirmationState();
  setStep('form');
}

document.addEventListener('DOMContentLoaded', () => {
  populateUserDefaults();
  renderPayment();
  bindEvents();
  setStep('form');
});
