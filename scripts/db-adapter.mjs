import { mkdir } from 'node:fs/promises';
import { pbkdf2Sync, randomBytes, timingSafeEqual } from 'node:crypto';
import { dirname, join } from 'node:path';

export async function createStore(root, defaultJobs, defaultCompanies = []) {
  const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

  if (supabaseUrl && supabaseKey) {
    const store = createSupabaseStore(supabaseUrl, supabaseKey, defaultJobs, defaultCompanies);
    try {
      await store.init();
    } catch (error) {
      throw new Error(`Supabase init failed. Run supabase/schema.sql in Supabase SQL Editor first. ${error.message}`);
    }
    return store;
  }

  const store = await createSqliteStore(root, defaultJobs, defaultCompanies);
  await store.init();
  return store;
}

function createSupabaseStore(supabaseUrl, supabaseKey, defaultJobs, defaultCompanies = []) {
  const baseUrl = `${supabaseUrl}/rest/v1`;

  async function request(table, query = '', options = {}) {
    const response = await fetch(`${baseUrl}/${table}${query}`, {
      method: options.method || 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        ...(options.prefer ? { Prefer: options.prefer } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const raw = await response.text();
    const data = raw ? JSON.parse(raw) : null;
    if (!response.ok) {
      throw new Error(data?.message || data?.error || response.statusText);
    }
    return data;
  }

  async function selectOne(table, query) {
    const rows = await request(table, `${query}&limit=1`);
    return rows?.[0] || null;
  }

  async function attachCompany(user) {
    if (!user) return user;
    const company = user.companyId ? normalizeCompany(await selectOne('companies', `?select=*&id=eq.${Number(user.companyId)}`)) : null;
    return {
      ...user,
      companyId: user.companyId || null,
      companyName: company?.name || '',
      companySlug: company?.slug || '',
      companyIndustry: company?.industry || '',
      companyPlan: company?.plan || '',
      platformRole: user.role === 'admin' ? 'Quản trị nền tảng' : user.role === 'company' ? 'Đối tác doanh nghiệp' : user.platformRole || '',
    };
  }

  async function init() {
    await ensurePlatformAdmin();
    await seedCompanies();
    await seedBookingRequests();
    const jobs = await request('jobs', '?select=id&limit=1');
    if (!jobs.length) {
      await request('jobs', '?select=*', {
        method: 'POST',
        prefer: 'return=representation',
        body: defaultJobs.map(serializeJob),
      });
    }
  }

  async function seedCompanies() {
    if (!defaultCompanies.length) return;
    await request('companies', '?on_conflict=id&select=*', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates',
      body: defaultCompanies,
    });
  }

  async function seedBookingRequests() {
    try {
      await request('booking_requests', '?select=id&limit=1');
    } catch {
      // Table may not exist yet; schema/migration will create it.
    }
  }

  async function ensurePlatformAdmin() {
    const exists = await selectOne('users', `?select=email&email=eq.${encodeFilter('admincv@gmail.com')}`);
    if (!exists) {
      await request('users', '', {
        method: 'POST',
        body: { email: 'admincv@gmail.com', name: 'Nguyễn Admin', password: hashPassword('123456'), role: 'admin', companyId: null, companyRole: 'Platform Admin' },
      });
      return;
    }
    await request('users', `?email=eq.${encodeFilter('admincv@gmail.com')}`, {
      method: 'PATCH',
      body: { role: 'admin', companyId: null, companyRole: 'Platform Admin' },
    });
  }

  async function getCompanies() {
    const rows = await request('companies', '?select=*&order=name.asc');
    return rows.map(normalizeCompany);
  }

  async function getCompany(id) {
    const row = await selectOne('companies', `?select=*&id=eq.${Number(id)}`);
    return normalizeCompany(row);
  }

  async function addCompany(company) {
    const id = Date.now();
    const rows = await request('companies', '?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: normalizeCompanyInput(company, id),
    });
    return normalizeCompany(rows[0]);
  }

  async function updateCompany(id, patch) {
    const rows = await request('companies', `?id=eq.${Number(id)}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: normalizeCompanyInput(patch, Number(id), true),
    });
    return normalizeCompany(rows[0]);
  }

  async function getJobs() {
    const rows = await request('jobs', '?select=*&order=id.desc');
    return rows.map(normalizeJob);
  }

  async function addJob(job) {
    const id = Date.now();
    const rows = await request('jobs', '?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: serializeJob({
        id,
        title: job.title,
        company: job.company || 'CVMS',
        companyId: job.companyId || null,
        location: job.location,
        salary: job.salary || 'Thỏa thuận',
        salaryNum: job.salaryNum || 0,
        deadline: job.deadline,
        tags: job.tags || [],
        dept: job.dept || 'Other',
        qty: job.qty || 1,
        applicants: 0,
        status: job.status || 'Đang tuyển',
        active: true,
      }),
    });
    await addNotification({
      role: 'user',
      type: 'new_job',
      title: '🆕 Vị trí tuyển dụng mới!',
      body: `"${job.title}" tại ${job.company || 'CVMS'} — ${job.location}`,
      jobId: id,
    });
    return normalizeJob(rows[0]);
  }

  async function updateJob(id, patch) {
    const current = await selectOne('jobs', `?select=*&id=eq.${id}`);
    if (!current) throw new Error('Job not found');
    const next = { ...normalizeJob(current), ...patch };
    const rows = await request('jobs', `?id=eq.${id}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: serializeJob(next),
    });
    return normalizeJob(rows[0]);
  }

  async function closeJob(id) {
    const rows = await request('jobs', `?id=eq.${id}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { active: false, status: 'Đã đóng' },
    });
    return normalizeJob(rows[0]);
  }

  async function getApplications() {
    const rows = await request('applications', '?select=*&order=dateTs.asc');
    return rows.map(normalizeApplication);
  }

  async function applyJob({ jobId, userEmail, userName }) {
    const duplicate = await selectOne('applications', `?select=id&jobId=eq.${jobId}&userEmail=eq.${encodeFilter(userEmail)}`);
    if (duplicate) return { ok: false, msg: 'Bạn đã ứng tuyển vị trí này rồi!' };

    const job = normalizeJob(await selectOne('jobs', `?select=*&id=eq.${jobId}`));
    if (!job || job.active === false) return { ok: false, msg: 'Vị trí không tồn tại hoặc đã đóng!' };

    const id = Date.now();
    const now = new Date();
    const app = {
      id,
      jobId,
      companyId: job.companyId || null,
      jobTitle: job.title,
      company: job.company,
      location: job.location,
      userEmail,
      userName,
      status: 'Mới nộp',
      pipelineStage: 'new',
      date: now.toLocaleDateString('vi-VN'),
      dateTs: Date.now(),
      adminNote: '',
    };
    const rows = await request('applications', '?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: app,
    });
    await request('jobs', `?id=eq.${jobId}`, {
      method: 'PATCH',
      body: { applicants: (job.applicants || 0) + 1 },
    });
    await addNotification({
      role: 'admin',
      type: 'new_application',
      title: '🔔 Ứng viên mới!',
      body: `${userName} vừa nộp đơn vào "${job.title}"`,
      appId: id,
      companyId: job.companyId || null,
      userEmail,
    });
    return { ok: true, app: normalizeApplication(rows[0]) };
  }

  async function updateApplicationStatus(appId, newStatus, adminNote = '') {
    const pipelineStage = statusToStage(newStatus);
    const rows = await request('applications', `?id=eq.${appId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { status: newStatus, adminNote, pipelineStage },
    });
    const app = rows[0];
    if (!app) throw new Error('Application not found');
    const messages = statusMessages(app, adminNote);
    if (messages[newStatus]) {
      await addNotification({
        role: 'user',
        targetEmail: app.userEmail,
        type: 'status_update',
        title: '📋 Cập nhật đơn ứng tuyển',
      body: messages[newStatus],
      appId,
      companyId: app.companyId || null,
      jobTitle: app.jobTitle,
      });
    }
    return normalizeApplication(app);
  }

  async function updatePipelineStage(appId, stage) {
    const stageStatusMap = { new: 'Mới nộp', screening: 'Đang xem xét', interview: 'Phỏng vấn', review: 'Đang xem xét', offer: 'Đã offer', hired: 'Đã offer', rejected: 'Từ chối' };
    const rows = await request('applications', `?id=eq.${appId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { pipelineStage: stage, status: stageStatusMap[stage] || 'Đang xem xét' },
    });
    const app = rows[0];
    if (!app) throw new Error('Application not found');
    const stageLabel = { new: 'Mới', screening: 'Screening', interview: 'Phỏng vấn', review: 'Đánh giá', offer: 'Offer', hired: 'Nhận việc' };
    if (['interview', 'offer', 'hired'].includes(stage)) {
      await addNotification({
        role: 'user',
        targetEmail: app.userEmail,
        type: 'pipeline_move',
        title: '📋 Cập nhật hồ sơ',
        body: `Đơn ứng tuyển "${app.jobTitle}" đã chuyển sang giai đoạn: ${stageLabel[stage]}`,
        appId,
        companyId: app.companyId || null,
      });
    }
    return normalizeApplication(app);
  }

  async function register({ name, email, password, role = 'user' }) {
    if (!name || !email || !password) return { ok: false, msg: 'Thiếu thông tin đăng ký!' };
    if (email === 'admincv@gmail.com') return { ok: false, msg: 'Email này không được phép đăng ký!' };
    const exists = await selectOne('users', `?select=email&email=eq.${encodeFilter(email)}`);
    if (exists) return { ok: false, msg: 'Email này đã được đăng ký!' };
    await request('users', '', {
      method: 'POST',
      body: { email, name, password: hashPassword(password), role: role === 'company' ? 'company' : 'user', companyRole: role === 'company' ? 'Đối tác doanh nghiệp' : '' },
    });
    return { ok: true };
  }

  async function login({ email, password }) {
    const row = await selectOne('users', `?select=*&email=eq.${encodeFilter(email)}`);
    if (!row || !verifyPassword(password, row.password)) return { ok: false, msg: 'Email hoặc mật khẩu không đúng!' };
    if (!String(row.password).startsWith('pbkdf2$')) {
      await request('users', `?email=eq.${encodeFilter(email)}`, {
        method: 'PATCH',
        body: { password: hashPassword(password) },
      });
    }
    const { password: _password, ...user } = row;
    return { ok: true, user: await attachCompany(user) };
  }

  async function getUserByEmail(email) {
    const row = await selectOne('users', `?select=*&email=eq.${encodeFilter(email)}`);
    if (!row) return null;
    const { password: _password, ...user } = row;
    return attachCompany(user);
  }

  async function oauthLogin({ email, name, provider, role = 'user' }) {
    if (!email) return { ok: false, msg: 'OAuth không trả về email!' };
    let row = await selectOne('users', `?select=*&email=eq.${encodeFilter(email)}`);
    if (!row) {
      await request('users', '', {
        method: 'POST',
        body: { email, name: name || email, password: `oauth:${provider || 'provider'}`, role: role === 'company' ? 'company' : 'user', companyRole: role === 'company' ? 'Đối tác doanh nghiệp' : '' },
      });
      row = await selectOne('users', `?select=*&email=eq.${encodeFilter(email)}`);
    }
    const { password: _password, ...user } = row;
    return { ok: true, user: await attachCompany(user) };
  }

  async function updateProfile(email, patch) {
    const rows = await request('users', `?email=eq.${encodeFilter(email)}&select=email,name,role,companyId,companyRole,phone,address,bio,targetPosition,experienceLevel,education,skills,expectedSalary,desiredLocations,workType,portfolio,linkedin`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: buildProfilePatch(patch),
    });
    return rows[0];
  }

  async function addNotification(notification) {
    await request('notifications', '', {
      method: 'POST',
      body: buildNotification(notification),
    });
  }

  async function addBookingRequest(payload) {
    const item = normalizeBookingRequestInput(payload);
    const rows = await request('booking_requests', '?select=*', {
      method: 'POST',
      prefer: 'return=representation',
      body: item,
    });
    await addNotification({
      role: 'admin',
      type: 'company_booking',
      title: '🏢 Yêu cầu booking mới',
      body: `${item.companyName} muốn đặt gói ${item.packageLabel} cho ${item.jobTitle || 'đăng tin tuyển dụng'}.`,
      userEmail: item.email,
    });
    return rows?.[0] || item;
  }

  async function getBookingRequests() {
    try {
      const rows = await request('booking_requests', '?select=*&order=id.desc');
      return rows || [];
    } catch {
      return [];
    }
  }

  async function ensureCompanyForBooking(booking = {}) {
    const companyName = String(booking.companyName || '').trim() || 'Doanh nghiệp chưa đặt tên';
    const slug = slugify(companyName);
    let company = normalizeCompany(await selectOne('companies', `?select=*&slug=eq.${encodeFilter(slug)}`));
    if (!company) {
      company = await addCompany({
        name: companyName,
        slug,
        industry: booking.industry || 'Chưa phân loại',
        location: 'Hà Nội',
        plan: packageToPlan(booking.packageKey),
        status: 'active',
      });
    }
    if (booking.email) {
      await request('users', `?email=eq.${encodeFilter(booking.email)}`, {
        method: 'PATCH',
        body: { companyId: company.id, companyRole: 'Đối tác doanh nghiệp' },
      });
    }
    if (booking.id) {
      await request('booking_requests', `?id=eq.${Number(booking.id)}`, {
        method: 'PATCH',
        body: { companyId: company.id },
      });
    }
    return company;
  }

  async function adminConfirmBookingPayment(id) {
    const bookingId = Number(id);
    const current = await selectOne('booking_requests', `?select=*&id=eq.${bookingId}`);
    if (!current) throw new Error('Không tìm thấy yêu cầu booking.');
    const company = await ensureCompanyForBooking(current);
    const adminConfirmedAt = new Date().toLocaleString('vi-VN');
    const rows = await request('booking_requests', `?id=eq.${bookingId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        status: 'payment_confirmed',
        paymentStatus: 'admin_confirmed',
        adminConfirmedAt,
        companyId: company.id,
      },
    });
    await addNotification({
      role: 'company',
      targetEmail: current.email,
      type: 'booking_payment_confirmed',
      title: 'Thanh toán booking đã được xác nhận',
      body: `Admin đã xác nhận thanh toán cho yêu cầu booking #${bookingId}.`,
      companyId: company.id,
      userEmail: current.email,
    });
    return rows?.[0] || { ...current, status: 'payment_confirmed', paymentStatus: 'admin_confirmed', adminConfirmedAt, companyId: company.id };
  }

  async function rejectBookingRequest(id, reason = '') {
    const bookingId = Number(id);
    const current = await selectOne('booking_requests', `?select=*&id=eq.${bookingId}`);
    if (!current) throw new Error('Không tìm thấy yêu cầu booking.');
    const rows = await request('booking_requests', `?id=eq.${bookingId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { status: 'rejected', rejectedReason: String(reason || '').trim() },
    });
    await addNotification({
      role: 'company',
      targetEmail: current.email,
      type: 'booking_rejected',
      title: 'Yêu cầu booking cần kiểm tra lại',
      body: reason || `Yêu cầu booking #${bookingId} đã bị tạm từ chối. Vui lòng liên hệ admin.`,
      userEmail: current.email,
    });
    return rows?.[0] || { ...current, status: 'rejected', rejectedReason: reason };
  }

  async function createJobFromBooking(id, payload = {}) {
    const bookingId = Number(id);
    const booking = await selectOne('booking_requests', `?select=*&id=eq.${bookingId}`);
    if (!booking) throw new Error('Không tìm thấy yêu cầu booking.');
    const existingJobId = Number(booking.jobId || 0);
    if (existingJobId) {
      const existing = await getJobs().then((jobs) => jobs.find((job) => Number(job.id) === existingJobId));
      if (existing) return { booking, job: existing };
    }
    const company = await ensureCompanyForBooking(booking);
    const job = await addJob({
      title: payload.title || booking.jobTitle || 'Tin tuyển dụng mới',
      companyId: company.id,
      company: company.name,
      location: payload.location || company.location || 'Hà Nội',
      salary: payload.salary || 'Thỏa thuận',
      salaryNum: extractSalaryNumber(payload.salary || ''),
      deadline: payload.deadline || defaultDeadline(Number(booking.duration || 30)),
      tags: normalizeTags(payload.tags || booking.industry || booking.packageLabel || ''),
      dept: payload.dept || booking.industry || 'Other',
      qty: Math.max(1, Number(payload.qty || booking.quantity || 1)),
      status: 'Đang tuyển',
      active: true,
    });
    const rows = await request('booking_requests', `?id=eq.${bookingId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { status: 'job_created', jobId: job.id, companyId: company.id },
    });
    await addNotification({
      role: 'company',
      targetEmail: booking.email,
      type: 'booking_job_created',
      title: 'Tin tuyển dụng đã được đăng',
      body: `Admin đã tạo tin "${job.title}" từ yêu cầu booking #${bookingId}.`,
      jobId: job.id,
      companyId: company.id,
      userEmail: booking.email,
    });
    return { booking: rows?.[0] || { ...booking, status: 'job_created', jobId: job.id, companyId: company.id }, job };
  }

  async function shareApplicationWithCompany(appId, note = '') {
    const id = Number(appId);
    const current = await selectOne('applications', `?select=*&id=eq.${id}`);
    if (!current) throw new Error('Không tìm thấy hồ sơ ứng tuyển.');
    const sharedAt = new Date().toLocaleString('vi-VN');
    const rows = await request('applications', `?id=eq.${id}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { sharedToCompany: true, sharedAt, companyShareNote: String(note || '').trim() },
    });
    const app = normalizeApplication(rows?.[0] || current);
    const companyUsers = current.companyId
      ? await request('users', `?select=email&role=eq.company&companyId=eq.${Number(current.companyId)}&limit=1`)
      : [];
    await addNotification({
      role: 'company',
      targetEmail: companyUsers?.[0]?.email || null,
      type: 'candidate_shortlist',
      title: 'Admin đã gửi ứng viên phù hợp',
      body: `${current.userName || current.userEmail} đã được gửi sang doanh nghiệp cho vị trí "${current.jobTitle}".`,
      appId: id,
      companyId: current.companyId || null,
      jobTitle: current.jobTitle,
      userEmail: current.userEmail,
    });
    return app;
  }

  async function updateCompanyApplicationFeedback(appId, user, feedback = '') {
    const id = Number(appId);
    const current = await selectOne('applications', `?select=*&id=eq.${id}`);
    if (!current) throw new Error('Không tìm thấy hồ sơ ứng viên.');
    if (Number(user.companyId || 0) && Number(current.companyId || 0) !== Number(user.companyId)) {
      throw new Error('Doanh nghiệp không có quyền phản hồi hồ sơ này.');
    }
    const companyFeedbackAt = new Date().toLocaleString('vi-VN');
    const rows = await request('applications', `?id=eq.${id}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: { companyFeedback: String(feedback || '').trim(), companyFeedbackAt },
    });
    await addNotification({
      role: 'admin',
      type: 'company_candidate_feedback',
      title: 'Doanh nghiệp phản hồi ứng viên',
      body: `${user.name || user.email} phản hồi hồ sơ "${current.userName || current.userEmail}": ${feedback || 'Đã xem hồ sơ'}`,
      appId: id,
      companyId: current.companyId || null,
      jobTitle: current.jobTitle,
      userEmail: current.userEmail,
    });
    return normalizeApplication(rows?.[0] || current);
  }

  async function getCompanyDashboard(user) {
    const companyId = Number(user.companyId || 0);
    const byEmail = await request('booking_requests', `?select=*&email=eq.${encodeFilter(user.email || '')}&order=id.desc`);
    const byCompany = companyId
      ? await request('booking_requests', `?select=*&companyId=eq.${companyId}&order=id.desc`)
      : [];
    const bookings = mergeById([...(byEmail || []), ...(byCompany || [])]);
    const jobs = companyId
      ? (await request('jobs', `?select=*&companyId=eq.${companyId}&order=id.desc`)).map(normalizeJob)
      : [];
    const shortlisted = companyId
      ? (await request('applications', `?select=*&companyId=eq.${companyId}&sharedToCompany=eq.true&order=dateTs.desc`)).map(normalizeApplication)
      : [];
    return { user, companyId: companyId || null, bookings, jobs, shortlisted };
  }

  async function confirmBookingPayment(id, email = '') {
    const bookingId = Number(id);
    const current = await selectOne('booking_requests', `?select=*&id=eq.${bookingId}`);
    if (!current) throw new Error('Không tìm thấy yêu cầu booking.');
    const suppliedEmail = String(email || '').trim().toLowerCase();
    if (suppliedEmail && String(current.email || '').trim().toLowerCase() !== suppliedEmail) {
      throw new Error('Email xác nhận không khớp với yêu cầu booking.');
    }
    const paymentConfirmedAt = new Date().toLocaleString('vi-VN');
    const rows = await request('booking_requests', `?id=eq.${bookingId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        status: 'waiting_admin_confirm',
        paymentStatus: 'customer_confirmed',
        paymentConfirmedAt,
      },
    });
    const booking = rows?.[0] || { ...current, status: 'waiting_admin_confirm', paymentStatus: 'customer_confirmed', paymentConfirmedAt };
    await addNotification({
      role: 'admin',
      type: 'company_booking_payment',
      title: '💳 Doanh nghiệp đã xác nhận chuyển khoản',
      body: `${booking.companyName || current.companyName} đã xác nhận chuyển khoản cho booking #${booking.id || bookingId}.`,
      userEmail: booking.email || current.email,
    });
    return booking;
  }

  async function getNotifications(role, email) {
    if (role === 'admin') {
      const rows = await request('notifications', "?select=*&role=eq.admin&order=id.desc&limit=50");
      return rows.map(normalizeNotification);
    }
    if (role === 'company') {
      const rows = await request('notifications', `?select=*&role=eq.company&or=(targetEmail.is.null,targetEmail.eq.${encodeFilter(email || '')})&order=id.desc&limit=100`);
      return rows.map(normalizeNotification);
    }
    const rows = await request('notifications', `?select=*&role=eq.user&or=(targetEmail.is.null,targetEmail.eq.${encodeFilter(email || '')})&order=id.desc&limit=100`);
    return rows.map(normalizeNotification);
  }

  async function markNotificationsRead(role, email) {
    if (role === 'admin') {
      await request('notifications', '?role=eq.admin', { method: 'PATCH', body: { read: true } });
      return;
    }
    if (role === 'company') {
      await request('notifications', `?role=eq.company&or=(targetEmail.is.null,targetEmail.eq.${encodeFilter(email || '')})`, { method: 'PATCH', body: { read: true } });
      return;
    }
    await request('notifications', `?role=eq.user&or=(targetEmail.is.null,targetEmail.eq.${encodeFilter(email || '')})`, { method: 'PATCH', body: { read: true } });
  }

  async function getCvIndex() {
    const rows = await request('cvs', '?select=email,name,ext,size,uploadedAt,industries&order=uploadedAt.desc');
    return Object.fromEntries(rows.map((row) => [row.email, row]));
  }

  async function getCv(email) {
    return selectOne('cvs', `?select=*&email=eq.${encodeFilter(email)}`);
  }

  async function saveCv(email, cv) {
    const rows = await request('cvs', '?on_conflict=email&select=*', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: { email, name: cv.name, type: cv.type, ext: cv.ext, size: cv.size, base64: cv.base64, uploadedAt: cv.uploadedAt, industries: normalizeIndustries(cv.industries) },
    });
    return rows[0];
  }

  async function deleteCv(email) {
    await request('cvs', `?email=eq.${encodeFilter(email)}`, { method: 'DELETE' });
  }

  async function saveApplicationAssessment(appId, assessment) {
    const score = Number.isFinite(Number(assessment.aiScore)) ? Math.max(0, Math.min(100, Math.round(Number(assessment.aiScore)))) : null;
    const rows = await request('applications', `?id=eq.${appId}&select=*`, {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        aiScore: score,
        aiFitLevel: assessment.aiFitLevel || '',
        aiEvaluation: assessment.aiEvaluation || {},
        aiEvaluatedAt: assessment.aiEvaluatedAt || new Date().toLocaleString('vi-VN'),
      },
    });
    return normalizeApplication(rows[0]);
  }

  async function getSavedJobs(email) {
    try {
      return request('saved_jobs', `?select=jobId,savedAt&userEmail=eq.${encodeFilter(email || '')}&order=savedAt.desc`);
    } catch {
      return [];
    }
  }

  async function toggleSavedJob(email, jobId) {
    const existing = await getSavedJobs(email);
    if (existing.some((item) => Number(item.jobId) === Number(jobId))) {
      await request('saved_jobs', `?userEmail=eq.${encodeFilter(email)}&jobId=eq.${jobId}`, { method: 'DELETE' });
      return { saved: false, jobId };
    }
    await request('saved_jobs', '', {
      method: 'POST',
      body: { userEmail: email, jobId, savedAt: new Date().toLocaleString('vi-VN') },
    });
    return { saved: true, jobId };
  }

  return {
    provider: 'supabase',
    init,
    getCompanies,
    getCompany,
    addCompany,
    updateCompany,
    getJobs,
    addJob,
    updateJob,
    closeJob,
    getApplications,
    applyJob,
    updateApplicationStatus,
    updatePipelineStage,
    register,
    login,
    getUserByEmail,
    oauthLogin,
    updateProfile,
    getNotifications,
    markNotificationsRead,
    addBookingRequest,
    getBookingRequests,
    confirmBookingPayment,
    adminConfirmBookingPayment,
    rejectBookingRequest,
    createJobFromBooking,
    shareApplicationWithCompany,
    updateCompanyApplicationFeedback,
    getCompanyDashboard,
    getCvIndex,
    getCv,
    saveCv,
    deleteCv,
    saveApplicationAssessment,
    getSavedJobs,
    toggleSavedJob,
  };
}

async function createSqliteStore(root, defaultJobs, defaultCompanies = []) {
  const { DatabaseSync } = await import('node:sqlite');
  const dbPath = join(root, 'data', 'cvms.sqlite');
  await mkdir(dirname(dbPath), { recursive: true });

  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  function addColumnIfMissing(table, column, type) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some((item) => item.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    }
  }

  function init() {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        companyId INTEGER,
        companyRole TEXT,
        phone TEXT,
        address TEXT,
        bio TEXT,
        targetPosition TEXT,
        experienceLevel TEXT,
        education TEXT,
        skills TEXT,
        expectedSalary TEXT,
        desiredLocations TEXT,
        workType TEXT,
        portfolio TEXT,
        linkedin TEXT
      );
      CREATE TABLE IF NOT EXISTS companies (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT,
        industry TEXT,
        location TEXT,
        plan TEXT,
        status TEXT DEFAULT 'active',
        createdAt TEXT
      );
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        company TEXT NOT NULL,
        companyId INTEGER,
        location TEXT NOT NULL,
        salary TEXT,
        salaryNum INTEGER DEFAULT 0,
        deadline TEXT,
        tags TEXT,
        dept TEXT,
        qty INTEGER DEFAULT 1,
        applicants INTEGER DEFAULT 0,
        status TEXT DEFAULT 'Đang tuyển',
        active INTEGER DEFAULT 1
      );
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY,
        jobId INTEGER NOT NULL,
        companyId INTEGER,
        jobTitle TEXT NOT NULL,
        company TEXT NOT NULL,
        location TEXT NOT NULL,
        userEmail TEXT NOT NULL,
        userName TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Mới nộp',
        pipelineStage TEXT NOT NULL DEFAULT 'new',
        date TEXT,
        dateTs INTEGER,
        adminNote TEXT DEFAULT '',
        aiScore INTEGER,
        aiFitLevel TEXT,
        aiEvaluation TEXT,
        aiEvaluatedAt TEXT,
        sharedToCompany INTEGER DEFAULT 0,
        sharedAt TEXT,
        companyShareNote TEXT,
        companyFeedback TEXT,
        companyFeedbackAt TEXT
      );
      CREATE TABLE IF NOT EXISTS saved_jobs (
        userEmail TEXT NOT NULL,
        jobId INTEGER NOT NULL,
        savedAt TEXT,
        PRIMARY KEY (userEmail, jobId)
      );
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY,
        role TEXT NOT NULL,
        targetEmail TEXT,
        type TEXT,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        appId INTEGER,
        jobId INTEGER,
        companyId INTEGER,
        jobTitle TEXT,
        userEmail TEXT,
        time TEXT,
        read INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS cvs (
        email TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        ext TEXT,
        size INTEGER,
        base64 TEXT NOT NULL,
        uploadedAt TEXT,
        industries TEXT
      );
      CREATE TABLE IF NOT EXISTS booking_requests (
        id INTEGER PRIMARY KEY,
        role TEXT NOT NULL DEFAULT 'company',
        companyName TEXT NOT NULL,
        contactName TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        industry TEXT,
        packageKey TEXT,
        packageLabel TEXT,
        jobTitle TEXT,
        quantity INTEGER DEFAULT 1,
        duration INTEGER DEFAULT 30,
        totalAmount INTEGER DEFAULT 0,
        note TEXT,
        status TEXT DEFAULT 'pending',
        paymentStatus TEXT DEFAULT 'waiting_transfer',
        paymentConfirmedAt TEXT,
        adminConfirmedAt TEXT,
        rejectedReason TEXT,
        companyId INTEGER,
        jobId INTEGER,
        createdAt TEXT,
        source TEXT DEFAULT 'public'
      );
    `);

    addColumnIfMissing('cvs', 'industries', 'TEXT');
    addColumnIfMissing('users', 'companyId', 'INTEGER');
    addColumnIfMissing('users', 'companyRole', 'TEXT');
    addColumnIfMissing('jobs', 'companyId', 'INTEGER');
    addColumnIfMissing('applications', 'companyId', 'INTEGER');
    addColumnIfMissing('notifications', 'companyId', 'INTEGER');
    for (const column of ['targetPosition', 'experienceLevel', 'education', 'skills', 'expectedSalary', 'desiredLocations', 'workType', 'portfolio', 'linkedin']) {
      addColumnIfMissing('users', column, 'TEXT');
    }
    addColumnIfMissing('applications', 'aiScore', 'INTEGER');
    addColumnIfMissing('applications', 'aiFitLevel', 'TEXT');
    addColumnIfMissing('applications', 'aiEvaluation', 'TEXT');
    addColumnIfMissing('applications', 'aiEvaluatedAt', 'TEXT');
    addColumnIfMissing('applications', 'sharedToCompany', 'INTEGER DEFAULT 0');
    addColumnIfMissing('applications', 'sharedAt', 'TEXT');
    addColumnIfMissing('applications', 'companyShareNote', 'TEXT');
    addColumnIfMissing('applications', 'companyFeedback', 'TEXT');
    addColumnIfMissing('applications', 'companyFeedbackAt', 'TEXT');
    addColumnIfMissing('booking_requests', 'role', 'TEXT');
    addColumnIfMissing('booking_requests', 'companyName', 'TEXT');
    addColumnIfMissing('booking_requests', 'contactName', 'TEXT');
    addColumnIfMissing('booking_requests', 'email', 'TEXT');
    addColumnIfMissing('booking_requests', 'phone', 'TEXT');
    addColumnIfMissing('booking_requests', 'industry', 'TEXT');
    addColumnIfMissing('booking_requests', 'packageKey', 'TEXT');
    addColumnIfMissing('booking_requests', 'packageLabel', 'TEXT');
    addColumnIfMissing('booking_requests', 'jobTitle', 'TEXT');
    addColumnIfMissing('booking_requests', 'quantity', 'INTEGER');
    addColumnIfMissing('booking_requests', 'duration', 'INTEGER');
    addColumnIfMissing('booking_requests', 'totalAmount', 'INTEGER');
    addColumnIfMissing('booking_requests', 'note', 'TEXT');
    addColumnIfMissing('booking_requests', 'status', 'TEXT');
    addColumnIfMissing('booking_requests', 'paymentStatus', 'TEXT');
    addColumnIfMissing('booking_requests', 'paymentConfirmedAt', 'TEXT');
    addColumnIfMissing('booking_requests', 'adminConfirmedAt', 'TEXT');
    addColumnIfMissing('booking_requests', 'rejectedReason', 'TEXT');
    addColumnIfMissing('booking_requests', 'companyId', 'INTEGER');
    addColumnIfMissing('booking_requests', 'jobId', 'INTEGER');
    addColumnIfMissing('booking_requests', 'createdAt', 'TEXT');
    addColumnIfMissing('booking_requests', 'source', 'TEXT');

    const insertCompany = db.prepare(`
      INSERT INTO companies (id, name, slug, industry, location, plan, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name=excluded.name, slug=excluded.slug, industry=excluded.industry, location=excluded.location, plan=excluded.plan, status=excluded.status
    `);
    for (const company of defaultCompanies) {
      insertCompany.run(company.id, company.name, company.slug || '', company.industry || '', company.location || '', company.plan || 'Starter', company.status || 'active', new Date().toLocaleString('vi-VN'));
    }

    ensurePlatformAdmin('admincv@gmail.com', 'Nguyễn Admin');
    db.prepare("UPDATE users SET companyId = NULL, companyRole = 'Platform Admin' WHERE role = 'admin'").run();

    const insertDefault = db.prepare(`
      INSERT OR IGNORE INTO jobs (id, title, company, companyId, location, salary, salaryNum, deadline, tags, dept, qty, applicants, status, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const updateUntouchedDefault = db.prepare(`
      UPDATE jobs
      SET title=?, company=?, companyId=?, location=?, salary=?, salaryNum=?, deadline=?, tags=?, dept=?, qty=?, status=?, active=?
      WHERE id=? AND applicants=0
    `);
    for (const job of defaultJobs) {
      insertDefault.run(job.id, job.title, job.company, job.companyId || 1, job.location, job.salary, job.salaryNum, job.deadline, JSON.stringify(job.tags), job.dept, job.qty, job.applicants, job.status, job.active ? 1 : 0);
      updateUntouchedDefault.run(job.title, job.company, job.companyId || 1, job.location, job.salary, job.salaryNum, job.deadline, JSON.stringify(job.tags), job.dept, job.qty, job.status, job.active ? 1 : 0, job.id);
    }
    db.prepare('UPDATE jobs SET companyId = 1 WHERE companyId IS NULL').run();
    db.prepare('UPDATE applications SET companyId = COALESCE((SELECT companyId FROM jobs WHERE jobs.id = applications.jobId), 1) WHERE companyId IS NULL').run();
    db.prepare('UPDATE notifications SET companyId = COALESCE((SELECT companyId FROM jobs WHERE jobs.id = notifications.jobId), companyId) WHERE companyId IS NULL AND jobId IS NOT NULL').run();
  }

  function ensurePlatformAdmin(email, name) {
    const existing = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (!existing) {
      db.prepare(`
        INSERT INTO users (email, name, password, role, companyId, companyRole)
        VALUES (?, ?, ?, 'admin', NULL, 'Platform Admin')
      `).run(email, name, hashPassword('123456'));
      return;
    }
    db.prepare(`
      UPDATE users
      SET role = 'admin', companyId = NULL, companyRole = 'Platform Admin'
      WHERE email = ?
    `).run(email);
  }

  function getCompanies() {
    return db.prepare('SELECT * FROM companies ORDER BY name ASC').all();
  }

  function getCompany(id) {
    return db.prepare('SELECT * FROM companies WHERE id = ?').get(id) || null;
  }

  function addCompany(company) {
    const id = Date.now();
    const item = normalizeCompanyInput(company, id);
    db.prepare(`
      INSERT INTO companies (id, name, slug, industry, location, plan, status, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(item.id, item.name, item.slug, item.industry, item.location, item.plan, item.status, item.createdAt);
    return getCompany(id);
  }

  function updateCompany(id, patch) {
    const current = getCompany(id);
    if (!current) throw new Error('Company not found');
    const item = normalizeCompanyInput({ ...current, ...patch }, Number(id));
    db.prepare(`
      UPDATE companies
      SET name = ?, slug = ?, industry = ?, location = ?, plan = ?, status = ?
      WHERE id = ?
    `).run(item.name, item.slug, item.industry, item.location, item.plan, item.status, Number(id));
    if (patch.name) {
      db.prepare('UPDATE jobs SET company = ? WHERE companyId = ?').run(item.name, Number(id));
      db.prepare('UPDATE applications SET company = ? WHERE companyId = ?').run(item.name, Number(id));
    }
    return getCompany(id);
  }

  function getJobs() {
    return db.prepare('SELECT * FROM jobs ORDER BY id DESC').all().map(normalizeJob);
  }

  function addJob(job) {
    const id = Date.now();
    db.prepare(`
      INSERT INTO jobs (id, title, company, companyId, location, salary, salaryNum, deadline, tags, dept, qty, applicants, status, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 1)
    `).run(id, job.title, job.company || 'CVMS', job.companyId || 1, job.location, job.salary || 'Thỏa thuận', job.salaryNum || 0, job.deadline, JSON.stringify(job.tags || []), job.dept || 'Other', job.qty || 1, job.status || 'Đang tuyển');

    addNotification({
      role: 'user',
      type: 'new_job',
      title: '🆕 Vị trí tuyển dụng mới!',
      body: `"${job.title}" tại ${job.company || 'CVMS'} — ${job.location}`,
      jobId: id,
      companyId: job.companyId || 1,
    });
    return normalizeJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id));
  }

  function updateJob(id, patch) {
    const current = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
    if (!current) throw new Error('Job not found');
    const next = { ...normalizeJob(current), ...patch };
    db.prepare(`
      UPDATE jobs SET title=?, company=?, companyId=?, location=?, salary=?, salaryNum=?, deadline=?, tags=?, dept=?, qty=?, applicants=?, status=?, active=? WHERE id=?
    `).run(next.title, next.company, next.companyId || 1, next.location, next.salary, next.salaryNum || 0, next.deadline, JSON.stringify(next.tags || []), next.dept, next.qty || 1, next.applicants || 0, next.status, next.active === false ? 0 : 1, id);
    return normalizeJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id));
  }

  function closeJob(id) {
    db.prepare("UPDATE jobs SET active = 0, status = 'Đã đóng' WHERE id = ?").run(id);
    return normalizeJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(id));
  }

  function getApplications() {
    return db.prepare('SELECT * FROM applications ORDER BY dateTs ASC').all().map(normalizeApplication);
  }

  function applyJob({ jobId, userEmail, userName }) {
    const duplicate = db.prepare('SELECT id FROM applications WHERE jobId = ? AND userEmail = ?').get(jobId, userEmail);
    if (duplicate) return { ok: false, msg: 'Bạn đã ứng tuyển vị trí này rồi!' };
    const job = normalizeJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(jobId));
    if (!job || job.active === false) return { ok: false, msg: 'Vị trí không tồn tại hoặc đã đóng!' };

    const id = Date.now();
    const now = new Date();
    db.prepare(`
      INSERT INTO applications (id, jobId, companyId, jobTitle, company, location, userEmail, userName, status, pipelineStage, date, dateTs, adminNote)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Mới nộp', 'new', ?, ?, '')
    `).run(id, jobId, job.companyId || 1, job.title, job.company, job.location, userEmail, userName, now.toLocaleDateString('vi-VN'), Date.now());
    db.prepare('UPDATE jobs SET applicants = applicants + 1 WHERE id = ?').run(jobId);

    addNotification({
      role: 'admin',
      type: 'new_application',
      title: '🔔 Ứng viên mới!',
      body: `${userName} vừa nộp đơn vào "${job.title}"`,
      appId: id,
      companyId: job.companyId || 1,
      userEmail,
    });
    return { ok: true, app: normalizeApplication(db.prepare('SELECT * FROM applications WHERE id = ?').get(id)) };
  }

  function updateApplicationStatus(appId, newStatus, adminNote = '') {
    const pipelineStage = statusToStage(newStatus);
    db.prepare('UPDATE applications SET status = ?, adminNote = ?, pipelineStage = ? WHERE id = ?').run(newStatus, adminNote, pipelineStage, appId);
    const app = normalizeApplication(db.prepare('SELECT * FROM applications WHERE id = ?').get(appId));
    if (!app) throw new Error('Application not found');
    const messages = statusMessages(app, adminNote);
    if (messages[newStatus]) {
      addNotification({
        role: 'user',
        targetEmail: app.userEmail,
        type: 'status_update',
        title: '📋 Cập nhật đơn ứng tuyển',
        body: messages[newStatus],
        appId,
        companyId: app.companyId || null,
        jobTitle: app.jobTitle,
      });
    }
    return app;
  }

  function updatePipelineStage(appId, stage) {
    const stageStatusMap = { new: 'Mới nộp', screening: 'Đang xem xét', interview: 'Phỏng vấn', review: 'Đang xem xét', offer: 'Đã offer', hired: 'Đã offer', rejected: 'Từ chối' };
    db.prepare('UPDATE applications SET pipelineStage = ?, status = ? WHERE id = ?').run(stage, stageStatusMap[stage] || 'Đang xem xét', appId);
    const app = normalizeApplication(db.prepare('SELECT * FROM applications WHERE id = ?').get(appId));
    if (!app) throw new Error('Application not found');
    const stageLabel = { new: 'Mới', screening: 'Screening', interview: 'Phỏng vấn', review: 'Đánh giá', offer: 'Offer', hired: 'Nhận việc' };
    if (['interview', 'offer', 'hired'].includes(stage)) {
      addNotification({
        role: 'user',
        targetEmail: app.userEmail,
        type: 'pipeline_move',
        title: '📋 Cập nhật hồ sơ',
        body: `Đơn ứng tuyển "${app.jobTitle}" đã chuyển sang giai đoạn: ${stageLabel[stage]}`,
        appId,
        companyId: app.companyId || null,
      });
    }
    return app;
  }

  function register({ name, email, password, role = 'user' }) {
    if (!name || !email || !password) return { ok: false, msg: 'Thiếu thông tin đăng ký!' };
    if (email === 'admincv@gmail.com') return { ok: false, msg: 'Email này không được phép đăng ký!' };
    const exists = db.prepare('SELECT email FROM users WHERE email = ?').get(email);
    if (exists) return { ok: false, msg: 'Email này đã được đăng ký!' };
    db.prepare("INSERT INTO users (email, name, password, role, companyRole) VALUES (?, ?, ?, ?, ?)").run(email, name, hashPassword(password), role === 'company' ? 'company' : 'user', role === 'company' ? 'Đối tác doanh nghiệp' : '');
    return { ok: true };
  }

  function login({ email, password }) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row || !verifyPassword(password, row.password)) return { ok: false, msg: 'Email hoặc mật khẩu không đúng!' };
    if (!String(row.password).startsWith('pbkdf2$')) {
      db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hashPassword(password), email);
    }
    const { password: _password, ...user } = row;
    return { ok: true, user: attachCompany(user) };
  }

  function getUserByEmail(email) {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) return null;
    const { password: _password, ...user } = row;
    return attachCompany(user);
  }

  function oauthLogin({ email, name, provider, role = 'user' }) {
    if (!email) return { ok: false, msg: 'OAuth không trả về email!' };
    let row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row) {
      db.prepare("INSERT INTO users (email, name, password, role, companyRole) VALUES (?, ?, ?, ?, ?)")
        .run(email, name || email, `oauth:${provider || 'provider'}`, role === 'company' ? 'company' : 'user', role === 'company' ? 'Đối tác doanh nghiệp' : '');
      row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    }
    const { password: _password, ...user } = row;
    if (user.role === 'admin') user.platformRole = 'Quản trị nền tảng';
    if (user.role === 'company') user.platformRole = 'Đối tác doanh nghiệp';
    return { ok: true, user: attachCompany(user) };
  }

  function updateProfile(email, patch) {
    const next = buildProfilePatch(patch);
    db.prepare(`
      UPDATE users
      SET name = ?, phone = ?, address = ?, bio = ?, targetPosition = ?, experienceLevel = ?, education = ?, skills = ?, expectedSalary = ?, desiredLocations = ?, workType = ?, portfolio = ?, linkedin = ?
      WHERE email = ?
    `).run(next.name, next.phone, next.address, next.bio, next.targetPosition, next.experienceLevel, next.education, next.skills, next.expectedSalary, next.desiredLocations, next.workType, next.portfolio, next.linkedin, email);
    return attachCompany(db.prepare('SELECT email, name, role, companyId, companyRole, phone, address, bio, targetPosition, experienceLevel, education, skills, expectedSalary, desiredLocations, workType, portfolio, linkedin FROM users WHERE email = ?').get(email));
  }

  function addNotification(notification) {
    const item = buildNotification(notification);
    db.prepare(`
      INSERT INTO notifications (id, role, targetEmail, type, title, body, appId, jobId, companyId, jobTitle, userEmail, time, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(item.id, item.role, item.targetEmail, item.type, item.title, item.body, item.appId, item.jobId, item.companyId, item.jobTitle, item.userEmail, item.time);
  }

  function addBookingRequest(payload) {
    const item = normalizeBookingRequestInput(payload);
    db.prepare(`
      INSERT INTO booking_requests (id, role, companyName, contactName, email, phone, industry, packageKey, packageLabel, jobTitle, quantity, duration, totalAmount, note, status, paymentStatus, paymentConfirmedAt, createdAt, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(item.id, item.role, item.companyName, item.contactName, item.email, item.phone, item.industry, item.packageKey, item.packageLabel, item.jobTitle, item.quantity, item.duration, item.totalAmount, item.note, item.status, item.paymentStatus, item.paymentConfirmedAt, item.createdAt, item.source);
    addNotification({
      role: 'admin',
      type: 'company_booking',
      title: '🏢 Yêu cầu booking mới',
      body: `${item.companyName} muốn đặt gói ${item.packageLabel} cho ${item.jobTitle || 'đăng tin tuyển dụng'}.`,
      userEmail: item.email,
    });
    return db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(item.id);
  }

  function getBookingRequests() {
    return db.prepare('SELECT * FROM booking_requests ORDER BY id DESC').all();
  }

  function ensureCompanyForBooking(booking = {}) {
    const companyName = String(booking.companyName || '').trim() || 'Doanh nghiệp chưa đặt tên';
    const slug = slugify(companyName);
    let company = db.prepare('SELECT * FROM companies WHERE slug = ? OR lower(name) = lower(?) LIMIT 1').get(slug, companyName);
    if (!company) {
      company = addCompany({
        name: companyName,
        slug,
        industry: booking.industry || 'Chưa phân loại',
        location: 'Hà Nội',
        plan: packageToPlan(booking.packageKey),
        status: 'active',
      });
    }
    if (booking.email) {
      db.prepare("UPDATE users SET companyId = ?, companyRole = 'Đối tác doanh nghiệp' WHERE email = ?").run(company.id, booking.email);
    }
    if (booking.id) {
      db.prepare('UPDATE booking_requests SET companyId = ? WHERE id = ?').run(company.id, booking.id);
    }
    return normalizeCompany(company);
  }

  function adminConfirmBookingPayment(id) {
    const bookingId = Number(id);
    const current = db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
    if (!current) throw new Error('Không tìm thấy yêu cầu booking.');
    const company = ensureCompanyForBooking(current);
    const adminConfirmedAt = new Date().toLocaleString('vi-VN');
    db.prepare(`
      UPDATE booking_requests
      SET status = 'payment_confirmed', paymentStatus = 'admin_confirmed', adminConfirmedAt = ?, companyId = ?
      WHERE id = ?
    `).run(adminConfirmedAt, company.id, bookingId);
    addNotification({
      role: 'company',
      targetEmail: current.email,
      type: 'booking_payment_confirmed',
      title: 'Thanh toán booking đã được xác nhận',
      body: `Admin đã xác nhận thanh toán cho yêu cầu booking #${bookingId}.`,
      companyId: company.id,
      userEmail: current.email,
    });
    return db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
  }

  function rejectBookingRequest(id, reason = '') {
    const bookingId = Number(id);
    const current = db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
    if (!current) throw new Error('Không tìm thấy yêu cầu booking.');
    db.prepare("UPDATE booking_requests SET status = 'rejected', rejectedReason = ? WHERE id = ?").run(String(reason || '').trim(), bookingId);
    addNotification({
      role: 'company',
      targetEmail: current.email,
      type: 'booking_rejected',
      title: 'Yêu cầu booking cần kiểm tra lại',
      body: reason || `Yêu cầu booking #${bookingId} đã bị tạm từ chối. Vui lòng liên hệ admin.`,
      userEmail: current.email,
    });
    return db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
  }

  function createJobFromBooking(id, payload = {}) {
    const bookingId = Number(id);
    const booking = db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
    if (!booking) throw new Error('Không tìm thấy yêu cầu booking.');
    const existingJobId = Number(booking.jobId || 0);
    if (existingJobId) {
      const existing = normalizeJob(db.prepare('SELECT * FROM jobs WHERE id = ?').get(existingJobId));
      if (existing) return { booking, job: existing };
    }
    const company = ensureCompanyForBooking(booking);
    const job = addJob({
      title: payload.title || booking.jobTitle || 'Tin tuyển dụng mới',
      companyId: company.id,
      company: company.name,
      location: payload.location || company.location || 'Hà Nội',
      salary: payload.salary || 'Thỏa thuận',
      salaryNum: extractSalaryNumber(payload.salary || ''),
      deadline: payload.deadline || defaultDeadline(Number(booking.duration || 30)),
      tags: normalizeTags(payload.tags || booking.industry || booking.packageLabel || ''),
      dept: payload.dept || booking.industry || 'Other',
      qty: Math.max(1, Number(payload.qty || booking.quantity || 1)),
      status: 'Đang tuyển',
      active: true,
    });
    db.prepare("UPDATE booking_requests SET status = 'job_created', jobId = ?, companyId = ? WHERE id = ?").run(job.id, company.id, bookingId);
    addNotification({
      role: 'company',
      targetEmail: booking.email,
      type: 'booking_job_created',
      title: 'Tin tuyển dụng đã được đăng',
      body: `Admin đã tạo tin "${job.title}" từ yêu cầu booking #${bookingId}.`,
      jobId: job.id,
      companyId: company.id,
      userEmail: booking.email,
    });
    return { booking: db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId), job };
  }

  function shareApplicationWithCompany(appId, note = '') {
    const id = Number(appId);
    const current = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    if (!current) throw new Error('Không tìm thấy hồ sơ ứng tuyển.');
    const sharedAt = new Date().toLocaleString('vi-VN');
    db.prepare(`
      UPDATE applications
      SET sharedToCompany = 1, sharedAt = ?, companyShareNote = ?
      WHERE id = ?
    `).run(sharedAt, String(note || '').trim(), id);
    const companyUser = current.companyId
      ? db.prepare("SELECT email FROM users WHERE role = 'company' AND companyId = ? LIMIT 1").get(current.companyId)
      : null;
    addNotification({
      role: 'company',
      targetEmail: companyUser?.email || null,
      type: 'candidate_shortlist',
      title: 'Admin đã gửi ứng viên phù hợp',
      body: `${current.userName || current.userEmail} đã được gửi sang doanh nghiệp cho vị trí "${current.jobTitle}".`,
      appId: id,
      companyId: current.companyId || null,
      jobTitle: current.jobTitle,
      userEmail: current.userEmail,
    });
    return normalizeApplication(db.prepare('SELECT * FROM applications WHERE id = ?').get(id));
  }

  function updateCompanyApplicationFeedback(appId, user, feedback = '') {
    const id = Number(appId);
    const current = db.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    if (!current) throw new Error('Không tìm thấy hồ sơ ứng viên.');
    if (Number(user.companyId || 0) && Number(current.companyId || 0) !== Number(user.companyId)) {
      throw new Error('Doanh nghiệp không có quyền phản hồi hồ sơ này.');
    }
    const companyFeedbackAt = new Date().toLocaleString('vi-VN');
    db.prepare('UPDATE applications SET companyFeedback = ?, companyFeedbackAt = ? WHERE id = ?')
      .run(String(feedback || '').trim(), companyFeedbackAt, id);
    addNotification({
      role: 'admin',
      type: 'company_candidate_feedback',
      title: 'Doanh nghiệp phản hồi ứng viên',
      body: `${user.name || user.email} phản hồi hồ sơ "${current.userName || current.userEmail}": ${feedback || 'Đã xem hồ sơ'}`,
      appId: id,
      companyId: current.companyId || null,
      jobTitle: current.jobTitle,
      userEmail: current.userEmail,
    });
    return normalizeApplication(db.prepare('SELECT * FROM applications WHERE id = ?').get(id));
  }

  function getCompanyDashboard(user) {
    const companyId = Number(user.companyId || 0);
    const byEmail = db.prepare('SELECT * FROM booking_requests WHERE email = ? ORDER BY id DESC').all(user.email || '');
    const byCompany = companyId
      ? db.prepare('SELECT * FROM booking_requests WHERE companyId = ? ORDER BY id DESC').all(companyId)
      : [];
    const bookings = mergeById([...byEmail, ...byCompany]);
    const jobs = companyId
      ? db.prepare('SELECT * FROM jobs WHERE companyId = ? ORDER BY id DESC').all(companyId).map(normalizeJob)
      : [];
    const shortlisted = companyId
      ? db.prepare('SELECT * FROM applications WHERE companyId = ? AND sharedToCompany = 1 ORDER BY dateTs DESC').all(companyId).map(normalizeApplication)
      : [];
    return { user: attachCompany(user), companyId: companyId || null, bookings, jobs, shortlisted };
  }

  function confirmBookingPayment(id, email = '') {
    const bookingId = Number(id);
    const current = db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
    if (!current) throw new Error('Không tìm thấy yêu cầu booking.');
    const suppliedEmail = String(email || '').trim().toLowerCase();
    if (suppliedEmail && String(current.email || '').trim().toLowerCase() !== suppliedEmail) {
      throw new Error('Email xác nhận không khớp với yêu cầu booking.');
    }
    const paymentConfirmedAt = new Date().toLocaleString('vi-VN');
    db.prepare(`
      UPDATE booking_requests
      SET status = 'waiting_admin_confirm', paymentStatus = 'customer_confirmed', paymentConfirmedAt = ?
      WHERE id = ?
    `).run(paymentConfirmedAt, bookingId);
    const booking = db.prepare('SELECT * FROM booking_requests WHERE id = ?').get(bookingId);
    addNotification({
      role: 'admin',
      type: 'company_booking_payment',
      title: '💳 Doanh nghiệp đã xác nhận chuyển khoản',
      body: `${booking.companyName || current.companyName} đã xác nhận chuyển khoản cho booking #${booking.id || bookingId}.`,
      userEmail: booking.email || current.email,
    });
    return booking;
  }

  function getNotifications(role, email, companyId = null) {
    if (role === 'admin') return db.prepare("SELECT * FROM notifications WHERE role = 'admin' ORDER BY id DESC LIMIT 50").all().map(normalizeNotification);
    if (role === 'company') return db.prepare("SELECT * FROM notifications WHERE role = 'company' AND (targetEmail IS NULL OR targetEmail = ?) ORDER BY id DESC LIMIT 100").all(email || '').map(normalizeNotification);
    return db.prepare("SELECT * FROM notifications WHERE role = 'user' AND (targetEmail IS NULL OR targetEmail = ?) ORDER BY id DESC LIMIT 100").all(email || '').map(normalizeNotification);
  }

  function markNotificationsRead(role, email) {
    if (role === 'admin') db.prepare("UPDATE notifications SET read = 1 WHERE role = 'admin'").run();
    else if (role === 'company') db.prepare("UPDATE notifications SET read = 1 WHERE role = 'company' AND (targetEmail IS NULL OR targetEmail = ?)").run(email || '');
    else db.prepare("UPDATE notifications SET read = 1 WHERE role = 'user' AND (targetEmail IS NULL OR targetEmail = ?)").run(email || '');
  }

  function getCvIndex() {
    const rows = db.prepare('SELECT email, name, ext, size, uploadedAt, industries FROM cvs ORDER BY uploadedAt DESC').all();
    return Object.fromEntries(rows.map((row) => [row.email, normalizeCv(row)]));
  }

  function getCv(email) {
    return normalizeCv(db.prepare('SELECT * FROM cvs WHERE email = ?').get(email) || null);
  }

  function saveCv(email, cv) {
    db.prepare(`
      INSERT INTO cvs (email, name, type, ext, size, base64, uploadedAt, industries)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET name=excluded.name, type=excluded.type, ext=excluded.ext, size=excluded.size, base64=excluded.base64, uploadedAt=excluded.uploadedAt, industries=excluded.industries
    `).run(email, cv.name, cv.type, cv.ext, cv.size, cv.base64, cv.uploadedAt, JSON.stringify(normalizeIndustries(cv.industries)));
    return getCv(email);
  }

  function deleteCv(email) {
    db.prepare('DELETE FROM cvs WHERE email = ?').run(email);
  }

  function saveApplicationAssessment(appId, assessment) {
    const score = Number.isFinite(Number(assessment.aiScore)) ? Math.max(0, Math.min(100, Math.round(Number(assessment.aiScore)))) : null;
    const evaluatedAt = assessment.aiEvaluatedAt || new Date().toLocaleString('vi-VN');
    db.prepare(`
      UPDATE applications
      SET aiScore = ?, aiFitLevel = ?, aiEvaluation = ?, aiEvaluatedAt = ?
      WHERE id = ?
    `).run(score, assessment.aiFitLevel || '', JSON.stringify(assessment.aiEvaluation || {}), evaluatedAt, appId);
    return normalizeApplication(db.prepare('SELECT * FROM applications WHERE id = ?').get(appId));
  }

  function getSavedJobs(email) {
    return db.prepare('SELECT jobId, savedAt FROM saved_jobs WHERE userEmail = ? ORDER BY savedAt DESC').all(email || '');
  }

  function toggleSavedJob(email, jobId) {
    const current = db.prepare('SELECT jobId FROM saved_jobs WHERE userEmail = ? AND jobId = ?').get(email, jobId);
    if (current) {
      db.prepare('DELETE FROM saved_jobs WHERE userEmail = ? AND jobId = ?').run(email, jobId);
      return { saved: false, jobId };
    }
    db.prepare('INSERT INTO saved_jobs (userEmail, jobId, savedAt) VALUES (?, ?, ?)').run(email, jobId, new Date().toLocaleString('vi-VN'));
    return { saved: true, jobId };
  }

  function attachCompany(user) {
    if (!user) return user;
    const company = user.companyId ? getCompany(user.companyId) : null;
    return {
      ...user,
      companyId: user.companyId || null,
      companyName: company?.name || '',
      companySlug: company?.slug || '',
      companyIndustry: company?.industry || '',
      companyPlan: company?.plan || '',
      platformRole: user.role === 'admin' ? 'Quản trị nền tảng' : user.role === 'company' ? 'Đối tác doanh nghiệp' : user.platformRole || '',
    };
  }

  return {
    provider: 'sqlite',
    dbPath,
    init,
    getCompanies,
    getCompany,
    addCompany,
    updateCompany,
    getJobs,
    addJob,
    updateJob,
    closeJob,
    getApplications,
    applyJob,
    updateApplicationStatus,
    updatePipelineStage,
    register,
    login,
    getUserByEmail,
    oauthLogin,
    updateProfile,
    getNotifications,
    markNotificationsRead,
    addBookingRequest,
    getBookingRequests,
    confirmBookingPayment,
    adminConfirmBookingPayment,
    rejectBookingRequest,
    createJobFromBooking,
    shareApplicationWithCompany,
    updateCompanyApplicationFeedback,
    getCompanyDashboard,
    getCvIndex,
    getCv,
    saveCv,
    deleteCv,
    saveApplicationAssessment,
    getSavedJobs,
    toggleSavedJob,
  };
}

function statusMessages(app, adminNote = '') {
  return {
    'Đang xem xét': `Hồ sơ của bạn đang được xem xét cho vị trí "${app.jobTitle}"`,
    'Phỏng vấn': `🎉 Chúc mừng! Bạn được mời phỏng vấn vị trí "${app.jobTitle}" tại ${app.company}`,
    'Đã offer': `🏆 Chúc mừng! Bạn nhận được offer cho vị trí "${app.jobTitle}"${adminNote ? ' — ' + adminNote : ''}`,
    'Từ chối': `Rất tiếc, hồ sơ của bạn cho vị trí "${app.jobTitle}" không phù hợp lúc này.`,
  };
}

function statusToStage(status) {
  return {
    'Mới nộp': 'new',
    'Đang xem xét': 'screening',
    'Phỏng vấn': 'interview',
    'Đã offer': 'offer',
    'Từ chối': 'rejected',
  }[status] || 'new';
}

function buildNotification({ role, targetEmail = null, type = null, title, body, appId = null, jobId = null, companyId = null, jobTitle = null, userEmail = null }) {
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    role,
    targetEmail,
    type,
    title,
    body,
    appId,
    jobId,
    companyId,
    jobTitle,
    userEmail,
    time: new Date().toLocaleString('vi-VN'),
    read: false,
  };
}

function serializeJob(job) {
  return {
    ...job,
    tags: Array.isArray(job.tags) ? job.tags : JSON.parse(job.tags || '[]'),
    active: job.active !== false && job.active !== 0,
  };
}

function normalizeJob(row) {
  if (!row) return null;
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : JSON.parse(row.tags || '[]'),
    active: row.active !== 0 && row.active !== false,
  };
}

function normalizeNotification(row) {
  return { ...row, read: row.read === 1 || row.read === true };
}

function normalizeBookingRequestInput(payload = {}) {
  const packageKey = String(payload.packageKey || payload.package || 'basic').trim().toLowerCase();
  const packageLabels = { basic: 'Basic', standard: 'Standard', priority: 'Priority' };
  const quantity = Math.max(1, Number(payload.quantity || payload.postCount || 1));
  const duration = Math.max(7, Number(payload.duration || 30));
  const priceMap = { basic: 1500000, standard: 3500000, priority: 5900000 };
  const totalAmount = Number.isFinite(Number(payload.totalAmount))
    ? Math.max(0, Number(payload.totalAmount))
    : priceMap[packageKey] ? priceMap[packageKey] * quantity : 0;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    role: payload.submittedRole === 'company' ? 'company' : 'company',
    companyName: String(payload.companyName || '').trim() || 'Doanh nghiệp chưa đặt tên',
    contactName: String(payload.contactName || payload.name || '').trim() || 'Người liên hệ',
    email: String(payload.email || payload.contactEmail || '').trim().toLowerCase(),
    phone: String(payload.phone || '').trim(),
    industry: String(payload.industry || '').trim(),
    packageKey,
    packageLabel: packageLabels[packageKey] || String(payload.packageLabel || 'Basic').trim(),
    jobTitle: String(payload.jobTitle || '').trim(),
    quantity,
    duration,
    totalAmount,
    note: String(payload.note || '').trim(),
    status: 'pending_payment',
    paymentStatus: 'waiting_transfer',
    paymentConfirmedAt: '',
    adminConfirmedAt: '',
    rejectedReason: '',
    companyId: Number(payload.companyId || 0) || null,
    jobId: Number(payload.jobId || 0) || null,
    createdAt: new Date().toLocaleString('vi-VN'),
    source: String(payload.source || 'public').trim(),
  };
}

function packageToPlan(packageKey) {
  return {
    basic: 'Starter',
    standard: 'Growth',
    priority: 'Enterprise',
  }[String(packageKey || '').toLowerCase()] || 'Starter';
}

function extractSalaryNumber(salary) {
  const nums = String(salary || '').match(/\d+/g);
  return nums ? Number(nums[0]) : 0;
}

function normalizeTags(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function defaultDeadline(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + Math.max(7, Number(days || 30)));
  return date.toLocaleDateString('vi-VN');
}

function mergeById(items = []) {
  const map = new Map();
  for (const item of items) {
    if (!item || item.id === undefined || item.id === null) continue;
    map.set(Number(item.id), item);
  }
  return [...map.values()].sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
}

function normalizeCompany(row) {
  if (!row) return null;
  return {
    ...row,
    id: Number(row.id),
    status: row.status || 'active',
  };
}

function normalizeCompanyInput(company = {}, id = Date.now(), partial = false) {
  const next = {};
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'id')) next.id = Number(company.id || id);
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'name')) {
    next.name = String(company.name || '').trim() || 'Doanh nghiệp chưa đặt tên';
  }
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'slug') || Object.prototype.hasOwnProperty.call(company, 'name')) {
    next.slug = String(company.slug || slugify(next.name || company.name || '')).trim();
  }
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'industry')) next.industry = String(company.industry || '').trim();
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'location')) next.location = String(company.location || '').trim();
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'plan')) next.plan = String(company.plan || 'Starter').trim();
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'status')) next.status = String(company.status || 'active').trim();
  if (!partial || Object.prototype.hasOwnProperty.call(company, 'createdAt')) next.createdAt = company.createdAt || new Date().toLocaleString('vi-VN');
  return next;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `company-${Date.now()}`;
}

function normalizeApplication(row) {
  if (!row) return null;
  let aiEvaluation = null;
  if (row.aiEvaluation) {
    try { aiEvaluation = JSON.parse(row.aiEvaluation); } catch { aiEvaluation = row.aiEvaluation; }
  }
  return {
    ...row,
    aiScore: row.aiScore === null || row.aiScore === undefined ? null : Number(row.aiScore),
    aiEvaluation,
    sharedToCompany: row.sharedToCompany === 1 || row.sharedToCompany === true,
  };
}

function normalizeIndustries(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return normalizeIndustries(parsed);
    } catch {}
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

function normalizeCv(row) {
  if (!row) return null;
  return { ...row, industries: normalizeIndustries(row.industries) };
}

function buildProfilePatch(patch) {
  return {
    name: patch.name || '',
    phone: patch.phone || '',
    address: patch.address || '',
    bio: patch.bio || '',
    targetPosition: patch.targetPosition || '',
    experienceLevel: patch.experienceLevel || '',
    education: patch.education || '',
    skills: patch.skills || '',
    expectedSalary: patch.expectedSalary || '',
    desiredLocations: patch.desiredLocations || '',
    workType: patch.workType || '',
    portfolio: patch.portfolio || '',
    linkedin: patch.linkedin || '',
  };
}

function encodeFilter(value) {
  return encodeURIComponent(value);
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `pbkdf2$120000$${salt}$${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (!String(stored).startsWith('pbkdf2$')) return password === stored;
  const [, roundsText, salt, hash] = stored.split('$');
  const actual = pbkdf2Sync(password, salt, Number(roundsText), 32, 'sha256');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
