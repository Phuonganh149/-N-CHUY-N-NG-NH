/* ═══════════════════════════════════════════════════════════════
   notif-ui.js — Shared Notification UI (dùng cho cả admin & user)
═══════════════════════════════════════════════════════════════ */

function initNotifUI(role) {
  const user = JSON.parse(localStorage.getItem('cvms_user') || 'null');
  if (!user) return;

  // Thêm notification panel vào DOM nếu chưa có
  if (!document.getElementById('notif-panel')) {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="notif-overlay" onclick="closeNotifPanel()" style="display:none;position:fixed;inset:0;z-index:999"></div>
      <div id="notif-panel" style="display:none;position:fixed;top:56px;right:16px;width:360px;max-height:480px;background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius-lg);box-shadow:0 8px 32px rgba(0,0,0,.18);z-index:1000;overflow:hidden;flex-direction:column">
        <div style="padding:14px 16px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;font-size:14px">🔔 Thông báo</span>
          <button onclick="markAllRead('${role}')" style="font-size:11px;color:var(--accent);background:none;border:none;cursor:pointer">Đánh dấu tất cả đã đọc</button>
        </div>
        <div id="notif-list" style="overflow-y:auto;max-height:380px;padding:8px 0"></div>
      </div>
    `);
  }

  updateNotifBadge(role, user.email);

  // Gắn sự kiện cho nút chuông
  document.querySelectorAll('.notif-btn').forEach(btn => {
    btn.style.position = 'relative';
    btn.addEventListener('click', () => toggleNotifPanel(role, user.email));
  });

  // Cập nhật badge mỗi 5 giây (real-time sim)
  setInterval(() => updateNotifBadge(role, user.email), 5000);
}

function updateNotifBadge(role, email) {
  const count = role === 'admin' ? CVMS.countUnreadAdmin() : CVMS.countUnreadUser(email);
  document.querySelectorAll('.notif-btn').forEach(btn => {
    let badge = btn.querySelector('.notif-badge');
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'notif-badge';
        badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;line-height:1';
        btn.appendChild(badge);
      }
      badge.textContent = count > 9 ? '9+' : count;
    } else {
      if (badge) badge.remove();
    }
  });
}

function toggleNotifPanel(role, email) {
  const panel   = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-overlay');
  if (!panel) return;
  const isOpen = panel.style.display === 'flex';
  if (isOpen) {
    panel.style.display = 'none';
    overlay.style.display = 'none';
  } else {
    renderNotifList(role, email);
    panel.style.display = 'flex';
    overlay.style.display = 'block';
  }
}

function closeNotifPanel() {
  const panel   = document.getElementById('notif-panel');
  const overlay = document.getElementById('notif-overlay');
  if (panel)   panel.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
}

function renderNotifList(role, email) {
  const list  = document.getElementById('notif-list');
  if (!list) return;
  const notifs = role === 'admin' ? CVMS.getNotifAdmin() : CVMS.getNotifUser(email);
  if (notifs.length === 0) {
    list.innerHTML = '<div style="padding:32px;text-align:center;color:var(--text-secondary);font-size:13px">Không có thông báo nào.</div>';
    return;
  }
  list.innerHTML = notifs.map(n => `
    <div style="padding:12px 16px;border-bottom:1px solid var(--border);background:${n.read ? 'transparent' : 'rgba(var(--accent-rgb,59,130,246),0.06)'};cursor:default">
      <div style="font-weight:${n.read ? '500' : '700'};font-size:13px;margin-bottom:3px">${n.title}</div>
      <div style="font-size:12px;color:var(--text-secondary);line-height:1.5">${n.body}</div>
      <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;opacity:.7">${n.time}</div>
    </div>
  `).join('');
}

function markAllRead(role) {
  const user = JSON.parse(localStorage.getItem('cvms_user') || 'null');
  if (!user) return;
  if (role === 'admin') CVMS.markAdminNotifsRead();
  else CVMS.markUserNotifsRead(user.email);
  renderNotifList(role, user.email);
  updateNotifBadge(role, user.email);
}
