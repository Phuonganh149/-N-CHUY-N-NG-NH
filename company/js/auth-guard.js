(function () {
  document.documentElement.style.visibility = 'hidden';

  const raw = localStorage.getItem('cvms_user');
  const token = localStorage.getItem('cvms_token') || '';
  let user = null;
  try { user = raw ? JSON.parse(raw) : null; } catch { user = null; }

  const freshUser = token ? getSessionUser(token, 'company') : null;
  if (!user || user.role !== 'company' || !token || !freshUser) {
    localStorage.removeItem('cvms_user');
    localStorage.removeItem('cvms_token');
    window.location.replace('../../login.html');
    return;
  }

  user = freshUser;
  localStorage.setItem('cvms_user', JSON.stringify(user));
  document.documentElement.style.visibility = 'visible';

  document.addEventListener('DOMContentLoaded', () => {
    const initials = getInitials(user.name || user.email || 'DN');
    document.querySelectorAll('.avatar').forEach(el => el.textContent = initials);
    const nameEl = document.querySelector('.avatar-info p');
    const roleEl = document.querySelector('.avatar-info span');
    if (nameEl) nameEl.textContent = user.companyName || user.name || 'Doanh nghiệp';
    if (roleEl) roleEl.textContent = user.platformRole || user.companyRole || 'Đối tác doanh nghiệp';

    document.getElementById('logoutBtn')?.addEventListener('click', () => {
      if (!confirm('Bạn có chắc muốn đăng xuất?')) return;
      logout(token);
      window.location.href = '../../login.html';
    });
  });

  function getSessionUser(token, role) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/api/auth/me', false);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(null);
      if (xhr.status >= 400) return null;
      const data = JSON.parse(xhr.responseText || '{}');
      return data.user?.role === role ? data.user : null;
    } catch {
      return null;
    }
  }

  function logout(token) {
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/auth/logout', false);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send('{}');
    } catch {}
    localStorage.removeItem('cvms_user');
    localStorage.removeItem('cvms_token');
  }

  function getInitials(value) {
    return String(value || 'DN').trim().split(/\s+/).map(word => word[0]).slice(-2).join('').toUpperCase();
  }
})();
