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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function showToast(msg, type = 'success', duration = 2500) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.className = 'toast' + (type === 'error' ? ' error' : '');
    void toast.offsetWidth;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

function apiPost(path, body, token = '') {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', path, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(JSON.stringify(body || {}));
    let data = {};
    try { data = JSON.parse(xhr.responseText || '{}'); } catch {}
    if (xhr.status >= 400) {
        const err = new Error(data.error || data.msg || 'Lỗi máy chủ');
        err.status = xhr.status;
        err.code = data.code || '';
        throw err;
    }
    return data;
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

function validateRegistrationConsents(role, consents) {
    if (!consents.terms || !consents.privacy) return 'Bạn cần đồng ý Điều khoản và Chính sách bảo mật.';
    if (role === 'user' && !consents.candidateConsent) return 'Ứng viên cần đồng ý xử lý và chia sẻ CV khi ứng tuyển.';
    if (role === 'company' && !consents.companyPolicy) return 'Doanh nghiệp cần đồng ý Chính sách doanh nghiệp.';
    return '';
}

async function handleSignUp(e) {
    e.preventDefault();

    const name     = document.getElementById('reg-name').value.trim();
    const email    = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    const roleRaw  = document.getElementById('reg-role')?.value || 'user';
    const role     = roleRaw === 'company' ? 'company' : 'user';
    const consents = collectRegistrationConsents();

    if (!name || !email || !password) {
        showToast('Vui lòng điền đầy đủ thông tin!', 'error');
        return;
    }
    if (!EMAIL_PATTERN.test(email)) {
        showToast('Email không hợp lệ.', 'error');
        return;
    }
    if (password.length < 8) {
        showToast('Mật khẩu phải tối thiểu 8 ký tự.', 'error');
        return;
    }
    if (!['user', 'company'].includes(role)) {
        showToast('Vai trò không hợp lệ.', 'error');
        return;
    }
    const consentError = validateRegistrationConsents(role, consents);
    if (consentError) { showToast(consentError, 'error'); return; }

    try {
        const result = await CVMSAuth.signUp(email, password, {
            data: {
                name,
                cvms_role: role,
                consents,
            },
        });
        if (result.error) {
            const msg = String(result.error.message || '').toLowerCase();
            if (msg.includes('registered') || msg.includes('already') || msg.includes('exists')) {
                showToast('Email này đã được đăng ký. Vui lòng đăng nhập.', 'error');
            } else {
                showToast(result.error.message || 'Không đăng ký được.', 'error');
            }
            return;
        }
        const session = result.data?.session;
        if (session?.access_token) {
            // Email confirmation disabled on project — finalize profile and go to dashboard.
            try {
                const loginResult = apiPost('/api/auth/login', {}, session.access_token);
                if (!loginResult.ok) throw new Error(loginResult.msg || 'Đăng nhập thất bại sau khi đăng ký.');
                localStorage.setItem('cvms_user', JSON.stringify(loginResult.user));
                localStorage.setItem('cvms_token', session.access_token);
                if (result.data.user?.id) localStorage.setItem('cvms_auth_user_id', result.data.user.id);
                showToast('Đăng ký thành công! Đang chuyển vào hệ thống...');
                const dest = loginResult.user.role === 'admin' ? './admin/pages/dashboard.html'
                           : loginResult.user.role === 'company' ? './company/pages/dashboard.html'
                           : './user/pages/dashboard.html';
                setTimeout(() => { window.location.href = dest; }, 700);
            } catch (err) {
                showToast(err.message || 'Không hoàn tất đăng nhập sau đăng ký.', 'error');
            }
        } else {
            showToast('Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản trước khi đăng nhập.', 'success', 5500);
            setTimeout(() => {
                document.getElementById('container').classList.remove('active');
                const loginEmail = document.getElementById('login-email');
                if (loginEmail) loginEmail.value = email;
            }, 900);
        }
    } catch (error) {
        showToast(error.message || 'Không đăng ký được.', 'error');
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
        if (authResult.error) {
            const msg = String(authResult.error.message || '').toLowerCase();
            if (msg.includes('confirm')) {
                showToast('Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư.', 'error', 4500);
            } else if (msg.includes('invalid')) {
                showToast('Email hoặc mật khẩu không đúng.', 'error');
            } else {
                showToast(authResult.error.message, 'error');
            }
            return;
        }
        const accessToken = authResult.data.session?.access_token;
        if (!accessToken) { showToast('Không lấy được phiên đăng nhập.', 'error'); return; }
        let result;
        try {
            result = apiPost('/api/auth/login', {}, accessToken);
        } catch (err) {
            if (err.status === 401 && err.code === 'email_not_confirmed') {
                showToast('Tài khoản chưa xác nhận email. Vui lòng kiểm tra hộp thư.', 'error', 4500);
            } else if (err.status === 401) {
                showToast('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', 'error');
            } else {
                showToast(err.message || 'Đăng nhập thất bại.', 'error');
            }
            return;
        }
        if (!result.ok) { showToast(result.msg || 'Đăng nhập thất bại.', 'error'); return; }

        localStorage.setItem('cvms_user', JSON.stringify(result.user));
        localStorage.setItem('cvms_token', accessToken);
        if (authResult.data.user?.id) localStorage.setItem('cvms_auth_user_id', authResult.data.user.id);
        showToast('Đăng nhập thành công! Chào mừng ' + result.user.name + '!');

        const dest = result.user.role === 'admin' ? './admin/pages/dashboard.html'
                   : result.user.role === 'company' ? './company/pages/dashboard.html'
                   : './user/pages/dashboard.html';
        setTimeout(() => { window.location.href = dest; }, 700);
    } catch (error) {
        showToast(error.message || 'Đăng nhập thất bại.', 'error');
    }
}

function forgotPassword() {
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    if (!email || !EMAIL_PATTERN.test(email)) {
        showToast('Nhập email hợp lệ vào ô đăng nhập rồi bấm Quên mật khẩu.', 'error');
        return;
    }
    CVMSAuth.client().auth.resetPasswordForEmail(email)
        .then(() => showToast('Đã gửi email đặt lại mật khẩu (nếu email tồn tại).', 'success', 4500))
        .catch((err) => showToast(err.message || 'Không gửi được email đặt lại mật khẩu.', 'error'));
}

function handleOAuth(provider) {
    if (!['google', 'github', 'facebook'].includes(provider)) return;
    const role = document.getElementById('reg-role')?.value || 'user';
    window.location.href = `/api/auth/oauth/${provider}/start?role=${encodeURIComponent(role)}`;
}
