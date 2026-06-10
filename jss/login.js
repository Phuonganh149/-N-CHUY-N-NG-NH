/* ═══════════════════════════════════════════════════════
   login.js — CVMS Authentication
   ─ Toggle form Sign In / Sign Up
   ─ Đăng ký/đăng nhập qua backend SQLite
   ─ Đăng nhập: admin → /admin/pages/dashboard.html
                user  → /Trangchu.html
═══════════════════════════════════════════════════════ */

/* ── Toggle form ──────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    const container   = document.getElementById('container');
    const registerBtn = document.getElementById('register');
    const loginBtn    = document.getElementById('login');
    const roleSelect  = document.getElementById('reg-role');
    const nameInput   = document.getElementById('reg-name');

    if (registerBtn) registerBtn.addEventListener('click', () => container.classList.add('active'));
    if (loginBtn)    loginBtn.addEventListener('click',    () => container.classList.remove('active'));
    if (roleSelect && nameInput) {
        const syncSignupMode = () => {
            const role = roleSelect.value;
            nameInput.placeholder = role === 'company'
                ? 'Tên doanh nghiệp / Người liên hệ'
                : 'Họ và tên';
        };
        roleSelect.addEventListener('change', syncSignupMode);
        syncSignupMode();
    }
});

/* ── Toast ────────────────────────────────────────────── */
function showToast(msg, type = 'success', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className   = 'toast' + (type === 'error' ? ' error' : '');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── API helper ───────────────────────────────────────── */
function apiRequest(path, body) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(JSON.stringify(body || {}));
    let data = {};
    try { data = JSON.parse(xhr.responseText || '{}'); } catch {}
    if (xhr.status >= 400) throw new Error(data.error || data.msg || 'Lỗi máy chủ');
    return data;
}

/* ── ĐĂNG KÝ ─────────────────────────────────────────── */
function handleSignUp(e) {
    e.preventDefault();

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const role     = document.getElementById('reg-role')?.value || 'user';

    if (!name || !email || !password) {
        showToast('⚠️ Vui lòng điền đầy đủ thông tin!', 'error'); return;
    }
    if (password.length < 6) {
        showToast('⚠️ Mật khẩu phải từ 6 ký tự!', 'error'); return;
    }

    // Không cho đăng ký bằng email admin
    if (email === 'admincv@gmail.com') {
        showToast('⚠️ Email này không được phép đăng ký!', 'error'); return;
    }

    try {
        const result = apiRequest('/api/auth/register', { name, email, password, role });
        if (!result.ok) {
            showToast('⚠️ ' + result.msg, 'error');
            return;
        }
        showToast(role === 'company'
            ? '✅ Đăng ký doanh nghiệp thành công! Hãy đăng nhập để vào trang booking.'
            : '✅ Đăng ký thành công! Hãy đăng nhập.'
        );
        setTimeout(() => {
            document.getElementById('container').classList.remove('active');
            const loginEmail = document.getElementById('login-email');
            if (loginEmail) loginEmail.value = email;
        }, 1000);
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

/* ── ĐĂNG NHẬP ───────────────────────────────────────── */
function handleSignIn(e) {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('⚠️ Vui lòng nhập email và mật khẩu!', 'error'); return;
    }

    try {
        const result = apiRequest('/api/auth/login', { email, password });
        if (!result.ok) {
            showToast('❌ ' + result.msg, 'error');
            return;
        }

        localStorage.setItem('cvms_user', JSON.stringify(result.user));
        localStorage.setItem('cvms_token', result.token || '');
        showToast('✅ Đăng nhập thành công! Chào mừng ' + result.user.name + '!');

        if (result.user.role === 'admin') {
            setTimeout(() => { window.location.href = './admin/pages/dashboard.html'; }, 900);
        } else if (result.user.role === 'company') {
            setTimeout(() => { window.location.href = './company/pages/dashboard.html'; }, 900);
        } else {
            setTimeout(() => { window.location.href = './user/pages/dashboard.html'; }, 900);
        }
    } catch (error) {
        showToast('❌ ' + error.message, 'error');
    }
}

/* ── Quên mật khẩu (placeholder) ─────────────────────── */
function forgotPassword() {
    showToast('ℹ️ Vui lòng liên hệ admin để đặt lại mật khẩu.', 'success', 3000);
}

function handleOAuth(provider) {
    if (!['google', 'github', 'facebook'].includes(provider)) return;
    const role = document.getElementById('reg-role')?.value || 'user';
    window.location.href = `/api/auth/oauth/${provider}/start?role=${encodeURIComponent(role)}`;
}
