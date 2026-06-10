document.addEventListener('DOMContentLoaded', () => {
    const container   = document.getElementById('container');
    const registerBtn = document.getElementById('register');
    const loginBtn    = document.getElementById('login');

    if (registerBtn) registerBtn.addEventListener('click', () => container.classList.add('active'));
    if (loginBtn)    loginBtn.addEventListener('click',    () => container.classList.remove('active'));
});

/* Toast Notification */
function showToast(msg, type = 'success', duration = 2500) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position:fixed;top:24px;left:50%;transform:translateX(-50%);
            padding:14px 28px;border-radius:50px;font-weight:600;
            box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:10000;
            white-space:nowrap;transition:all 0.4s;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = type === 'error' ? 'toast error' : 'toast';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    setTimeout(() => {
        toast.style.transform = 'translateX(-50%) translateY(-100px)';
    }, duration);
}

/* Simple hash function (demo) */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

/* ĐĂNG KÝ */
function handleSignUp(e) {
    e.preventDefault();

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password) {
        showToast('⚠️ Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    if (password.length < 8) {
        showToast('⚠️ Mật khẩu phải có ít nhất 8 ký tự!', 'error');
        return;
    }
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        showToast('⚠️ Mật khẩu phải chứa chữ hoa và số!', 'error');
        return;
    }

    if (email === 'admincv@gmail.com') {
        showToast('⚠️ Email này không được phép đăng ký!', 'error');
        return;
    }

    let users = JSON.parse(localStorage.getItem('cmcbook_users_list') || '[]');
    if (users.some(u => u.email === email)) {
        showToast('⚠️ Email này đã được sử dụng!', 'error');
        return;
    }

    users.push({
        name,
        email,
        password: simpleHash(password),
        role: 'user',
        createdAt: new Date().toISOString()
    });

    localStorage.setItem('cmcbook_users_list', JSON.stringify(users));
    showToast('✅ Đăng ký thành công! Hãy đăng nhập ngay.');

    setTimeout(() => {
        document.getElementById('container').classList.remove('active');
    }, 1200);
}

/* ĐĂNG NHẬP */
function handleSignIn(e) {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('⚠️ Vui lòng nhập email và mật khẩu!', 'error');
        return;
    }

    // Admin account
    if (email === 'admincv@gmail.com' && password === '123456') {
        localStorage.setItem('cvms_user', JSON.stringify({
            name: 'Admin',
            email: email,
            role: 'admin'
        }));
        showToast('✅ Chào mừng Admin!', 'success');
        setTimeout(() => window.location.href = './admin/pages/dashboard.html', 900);
        return;
    }

    // User account
    const users = JSON.parse(localStorage.getItem('cmcbook_users_list') || '[]');
    const found = users.find(u => u.email === email && u.password === simpleHash(password));

    if (!found) {
        showToast('❌ Email hoặc mật khẩu không chính xác!', 'error');
        return;
    }

    localStorage.setItem('cvms_user', JSON.stringify({
        name: found.name,
        email: found.email,
        role: 'user'
    }));

    showToast(`✅ Đăng nhập thành công! Chào mừng ${found.name}`);
    setTimeout(() => {
        window.location.href = './user/pages/dashboard.html';
    }, 900);
}

/* Quên mật khẩu */
function forgotPassword() {
    showToast('ℹ️ Vui lòng liên hệ admin để khôi phục mật khẩu.', 'success', 3500);
}
