/* ═══════════════════════════════════════
   reports.js
═══════════════════════════════════════ */
const MONTHS     = ['T1','T2','T3','T4','T5','T6'];
const TREND_DATA = [45, 62, 58, 81, 95, 87];

const SOURCE_LABELS = ['Referral','LinkedIn','Website','TopCV','Facebook'];
const SOURCE_DATA   = [90, 78, 55, 42, 30];
const SOURCE_COLORS = ['#1d9e75','#4f8ef7','#8b5cf6','#ba7517','#e24b4a'];

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('reportBarChart')) makeBarChart('reportBarChart', MONTHS, TREND_DATA);
  if (document.getElementById('sourceChart')) makeDoughnutChart('sourceChart', SOURCE_LABELS, SOURCE_DATA, SOURCE_COLORS);
  loadFinanceReport();
});

function money(value) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]));
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function loadFinanceReport() {
  if (!window.CVMS?.getAdminFinance) return;
  try {
    const finance = CVMS.getAdminFinance();
    const summary = finance.summary || {};
    setText('finance-revenue', money(summary.recognizedRevenue));
    setText('finance-topups', money(summary.walletTopupsNotRevenue));
    setText('finance-cv-revenue', money(summary.cvUnlockRevenue));
    setText('finance-rate', `${(Number(summary.commissionRate || 0.015) * 100).toFixed(1)}%`);
    const input = document.getElementById('commissionRateInput');
    if (input) input.value = (Number(summary.commissionRate || 0.015) * 100).toFixed(1);
    renderPendingTopups(finance.topups || []);
    renderPendingSubscriptions(finance.subscriptions || []);
    renderRefunds(finance.refunds || []);
    renderFinanceTransactions(finance.transactions || []);
    renderFinanceRevenues(finance.revenues || []);
  } catch (error) {
    renderPendingTopups([]);
  }
}

function renderPendingTopups(topups) {
  const tbody = document.getElementById('financeTopupBody');
  if (!tbody) return;
  const pending = topups.filter(item => item.status === 'pending');
  if (!pending.length) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-secondary)">Không có yêu cầu nạp ví chờ duyệt.</td></tr>';
    return;
  }
  tbody.innerHTML = pending.map(item => `
    <tr>
      <td>#${Number(item.id)}</td>
      <td>${escapeHTML(item.requestedBy || 'Doanh nghiệp')}</td>
      <td>${money(item.amount)}</td>
      <td><button class="action-btn success" onclick="confirmWalletTopup(${Number(item.id)})"><i class="ti ti-check"></i> Xác nhận</button></td>
    </tr>
  `).join('');
}

function confirmWalletTopup(id) {
  try {
    CVMS.adminConfirmWalletTopup(id);
    loadFinanceReport();
  } catch (error) {
    alert(error.message || 'Không xác nhận được nạp ví.');
  }
}

function saveCommissionRate() {
  try {
    const rate = Number(document.getElementById('commissionRateInput')?.value || 1.5);
    CVMS.updateCommission(rate);
    loadFinanceReport();
  } catch (error) {
    alert(error.message || 'Không lưu được tỷ lệ.');
  }
}


function renderPendingSubscriptions(rows) {
  let host = document.getElementById('financeSubscriptionsBody');
  if (!host) return;
  const pending = rows.filter(item => item.status === 'pending_payment' || item.status === 'waiting_admin_confirm');
  host.innerHTML = pending.length ? pending.map(item => `
    <tr><td>#${Number(item.id)}</td><td>${escapeHTML(item.plan_id || '')}</td><td>${money(item.amount)}</td><td><button class="action-btn success" onclick="confirmSubscription(${Number(item.id)})">X?c nh?n</button></td></tr>
  `).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-secondary)">Kh?ng c? g?i ch? x?c nh?n.</td></tr>';
}

function confirmSubscription(id) {
  try { CVMS.adminConfirmSubscription(id); loadFinanceReport(); }
  catch (error) { alert(error.message || 'Kh?ng x?c nh?n ???c g?i.'); }
}

function renderRefunds(rows) {
  let host = document.getElementById('financeRefundBody');
  if (!host) return;
  const pending = rows.filter(item => item.status === 'pending');
  host.innerHTML = pending.length ? pending.map(item => `
    <tr><td>#${Number(item.id)}</td><td>${money(item.amount)}</td><td>${escapeHTML(item.reason || '')}</td><td><button class="action-btn success" onclick="approveRefund(${Number(item.id)})">Duy?t</button></td></tr>
  `).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-secondary)">Kh?ng c? ho?n ti?n ch? duy?t.</td></tr>';
}

function approveRefund(id) {
  try { CVMS.adminApproveRefund(id); loadFinanceReport(); }
  catch (error) { alert(error.message || 'Kh?ng duy?t ???c ho?n ti?n.'); }
}


function renderFinanceTransactions(rows) {
  const tbody = document.getElementById('financeTransactionBody');
  if (!tbody) return;
  const data = rows.slice(0, 20);
  tbody.innerHTML = data.length ? data.map(item => `
    <tr><td>${escapeHTML(item.companyId || item.company_id || '')}</td><td>${escapeHTML(item.type || '')}</td><td>${money(item.amount)}</td><td>${money(item.balanceAfter || item.balance_after)}</td><td>${escapeHTML(item.createdAt || item.created_at || '')}</td></tr>
  `).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text-secondary)">Ch?a c? giao d?ch v?.</td></tr>';
}

function renderFinanceRevenues(rows) {
  const tbody = document.getElementById('financeRevenueBody');
  if (!tbody) return;
  const data = rows.slice(0, 20);
  tbody.innerHTML = data.length ? data.map(item => `
    <tr><td>${escapeHTML(item.source || '')}</td><td>${money(item.amount)}</td><td>${escapeHTML(item.refType || item.ref_type || '')} #${escapeHTML(item.refId || item.ref_id || '')}</td><td>${escapeHTML(item.recognizedAt || item.recognized_at || '')}</td></tr>
  `).join('') : '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--text-secondary)">Ch?a c? doanh thu ghi nh?n.</td></tr>';
}
