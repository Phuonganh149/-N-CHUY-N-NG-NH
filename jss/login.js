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
            nameInput.placeholder = roleSelect.value === 'company'
                ? 'Tên doanh nghiệp / Người liên hệ'
                : 'Họ và tên';
        };
        roleSelect.addEventListener('change', syncSignupMode);
        syncSignupMode();
    }
});

function showToast(msg, type = 'success', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' error' : '');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function apiRequest(path, body, token = '') {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(JSON.stringify(body || {}));
    let data = {};
    try { data = JSON.parse(xhr.responseText || '{}'); } catch {}
    if (xhr.status >= 400) throw new Error(data.error || data.msg || 'Lỗi máy chủ');
    return data;
}

async function handleSignUp(e) {
    e.preventDefault();

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const role     = document.getElementById('reg-role')?.value || 'user';

    if (!name || !email || !password) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('Mật khẩu phải từ 6 ký tự!', 'error');
        return;
    }
    if (email === 'admincv@gmail.com') {
        showToast('Email này không được phép đăng ký!', 'error');
        return;
    }

    try {
        const authResult = await CVMSAuth.signUp(email, password);
        if (authResult.error) throw authResult.error;
        const accessToken = authResult.data.session?.access_token;
        if (!accessToken) {
            showToast('Supabase ?? t?o t?i kho?n. Vui l?ng x?c nh?n email r?i ??ng nh?p ?? ho?n t?t h? s?.', 'success', 4500);
            return;
        }
        const result = apiRequest('/api/auth/register', { name, email, role, consents }, accessToken);
        if (!result.ok) {
            showToast(result.msg || 'Kh?ng ??ng k? ???c.', 'error');
            return;
        }
        localStorage.setItem('cvms_user', JSON.stringify(result.user || {}));
        localStorage.setItem('cvms_token', accessToken);
        if (authResult.data.user?.id) localStorage.setItem('cvms_auth_user_id', authResult.data.user.id);
        showToast(role === 'company'
            ? '??ng k? doanh nghi?p th?nh c?ng! H?y ??ng nh?p ?? v?o dashboard doanh nghi?p.'
            : '??ng k? th?nh c?ng! H?y ??ng nh?p.'
        );
        setTimeout(() => {
            document.getElementById('container').classList.remove('active');
            const loginEmail = document.getElementById('login-email');
            if (loginEmail) loginEmail.value = email;
        }, 900);
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function handleSignIn(e) {
    e.preventDefault();

    const email    = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    if (!email || !password) {
        showToast('Vui lòng nhập email và mật khẩu!', 'error');
        return;
    }

    try {
        const authResult = await CVMSAuth.signIn(email, password);
        if (authResult.error) throw authResult.error;
        const accessToken = authResult.data.session?.access_token;
        if (!accessToken) throw new Error('Supabase Auth kh?ng tr? v? access token.');
        const result = apiRequest('/api/auth/login', {}, accessToken);
        if (!result.ok) {
            showToast(result.msg || 'Email ho?c m?t kh?u kh?ng ??ng!', 'error');
            return;
        }

        localStorage.setItem('cvms_user', JSON.stringify(result.user));
        localStorage.setItem('cvms_token', accessToken);
        if (authResult.data.user?.id) localStorage.setItem('cvms_auth_user_id', authResult.data.user.id);
        showToast('??ng nh?p th?nh c?ng! Ch?o m?ng ' + result.user.name + '!');

        if (result.user.role === 'admin') {
            setTimeout(() => { window.location.href = './admin/pages/dashboard.html'; }, 700);
        } else if (result.user.role === 'company') {
            setTimeout(() => { window.location.href = './company/pages/dashboard.html'; }, 700);
        } else {
            setTimeout(() => { window.location.href = './user/pages/dashboard.html'; }, 700);
        }
    } catch (error) {
        showToast(error.message, 'error');
    }
}

function forgotPassword() {
    showToast('Vui lòng liên hệ admin để đặt lại mật khẩu.', 'success', 3000);
}


function collectRegistrationConsents() {
    return {
        terms: !!document.getElementById('consent-terms')?.checked,
        privacy: !!document.getElementById('consent-privacy')?.checked,
        candidateConsent: !!document.getElementById('consent-candidate')?.checked,
        companyPolicy: !!document.getElementById('consent-company')?.checked,
        marketing: !!document.getElementById('consent-marketing')?.checked,
    };
}

function handleOAuth(provider) {
    if (!['google', 'github', 'facebook'].includes(provider)) return;
    const role = document.getElementById('reg-role')?.value || 'user';
    window.location.href = `/api/auth/oauth/${provider}/start?role=${encodeURIComponent(role)}`;
}
