import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { dirname, extname, isAbsolute, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createStore } from './db-adapter.mjs';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
await loadEnv();

const port = Number(process.env.PORT || 4173);
const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const sessions = new Map();
const oauthStates = new Map();

// Điền API/OAuth key trực tiếp tại đây nếu bạn không muốn dùng .env.
// Khuyến nghị thật: vẫn nên để key trong .env để tránh lộ khi share code.
const CODE_KEYS = {
  GROQ_API_KEY: '',
  ANTHROPIC_API_KEY: '',
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
  GITHUB_CLIENT_ID: '',
  GITHUB_CLIENT_SECRET: '',
  FACEBOOK_CLIENT_ID: '',
  FACEBOOK_CLIENT_SECRET: '',
};

const secretConfig = {
  groqApiKey: process.env.GROQ_API_KEY || CODE_KEYS.GROQ_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || CODE_KEYS.ANTHROPIC_API_KEY,
  googleClientId: process.env.GOOGLE_CLIENT_ID || CODE_KEYS.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || CODE_KEYS.GOOGLE_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID || CODE_KEYS.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET || CODE_KEYS.GITHUB_CLIENT_SECRET,
  facebookClientId: process.env.FACEBOOK_CLIENT_ID || CODE_KEYS.FACEBOOK_CLIENT_ID,
  facebookClientSecret: process.env.FACEBOOK_CLIENT_SECRET || CODE_KEYS.FACEBOOK_CLIENT_SECRET,
};

const defaultCompanies = [
  { id: 1, name: 'CVMS Technology', slug: 'cvms-technology', industry: 'Công nghệ & Dịch vụ số', location: 'Hà Nội', plan: 'Enterprise', status: 'active' },
  { id: 2, name: 'Nova Retail', slug: 'nova-retail', industry: 'Bán lẻ & Thương mại', location: 'Hồ Chí Minh', plan: 'Growth', status: 'active' },
  { id: 3, name: 'Mekong Logistics', slug: 'mekong-logistics', industry: 'Vận hành & Logistics', location: 'Cần Thơ', plan: 'Growth', status: 'active' },
  { id: 4, name: 'Bright EduCare', slug: 'bright-educare', industry: 'Giáo dục & Đào tạo', location: 'Đà Nẵng', plan: 'Starter', status: 'active' },
  { id: 5, name: 'Aster Finance', slug: 'aster-finance', industry: 'Tài chính & Kế toán', location: 'Hà Nội', plan: 'Starter', status: 'active' },
];

const defaultJobs = [
  { id: 1, title: 'Chuyên viên Marketing Nội dung', company: 'CVMS Marketing', location: 'Hà Nội', salary: '12-16 tr', salaryNum: 12, deadline: '25/07/2026', tags: ['Marketing', 'Content', 'SEO', 'Toàn thời gian'], dept: 'Marketing', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 2, title: 'Nhân viên Kinh doanh B2B', company: 'CVMS Commercial', location: 'Hồ Chí Minh', salary: '10-18 tr + hoa hồng', salaryNum: 10, deadline: '30/07/2026', tags: ['Kinh doanh', 'Sales', 'CRM', 'Toàn thời gian'], dept: 'Kinh doanh', qty: 5, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 3, title: 'Kế toán Tổng hợp', company: 'CVMS Finance', location: 'Hà Nội', salary: '13-18 tr', salaryNum: 13, deadline: '18/07/2026', tags: ['Tài chính', 'Kế toán', 'Excel', 'Thuế'], dept: 'Tài chính - Kế toán', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 4, title: 'Chuyên viên Tuyển dụng', company: 'CVMS Human Resources', location: 'Đà Nẵng', salary: '11-15 tr', salaryNum: 11, deadline: '22/07/2026', tags: ['Nhân sự', 'Tuyển dụng', 'Phỏng vấn'], dept: 'Nhân sự', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 5, title: 'Nhân viên Chăm sóc Khách hàng', company: 'CVMS Service Center', location: 'Cần Thơ', salary: '8-12 tr', salaryNum: 8, deadline: '20/07/2026', tags: ['Dịch vụ khách hàng', 'CSKH', 'Giao tiếp', 'Ca xoay'], dept: 'Dịch vụ khách hàng', qty: 6, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 6, title: 'Chuyên viên Logistics', company: 'CVMS Supply Chain', location: 'Hồ Chí Minh', salary: '12-17 tr', salaryNum: 12, deadline: '28/07/2026', tags: ['Logistics', 'Vận hành', 'Kho vận', 'Excel'], dept: 'Vận hành - Logistics', qty: 3, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 7, title: 'UI/UX Designer', company: 'CVMS Digital', location: 'Đà Nẵng', salary: '14-20 tr', salaryNum: 14, deadline: '24/07/2026', tags: ['Thiết kế', 'Figma', 'UX Research', 'Product'], dept: 'Thiết kế - Sáng tạo', qty: 1, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 8, title: 'Pháp chế Doanh nghiệp', company: 'CVMS Legal', location: 'Hà Nội', salary: '16-24 tr', salaryNum: 16, deadline: '05/08/2026', tags: ['Pháp lý', 'Hợp đồng', 'Compliance'], dept: 'Pháp lý - Tuân thủ', qty: 1, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 9, title: 'Nhân viên Hành chính Văn phòng', company: 'CVMS Operations', location: 'Hà Nội', salary: '8-11 tr', salaryNum: 8, deadline: '17/07/2026', tags: ['Hành chính', 'Văn phòng', 'Mua sắm'], dept: 'Hành chính', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 10, title: 'Chuyên viên Đào tạo Nội bộ', company: 'CVMS Academy', location: 'Hồ Chí Minh', salary: '12-18 tr', salaryNum: 12, deadline: '26/07/2026', tags: ['Giáo dục', 'Đào tạo', 'L&D', 'Thuyết trình'], dept: 'Giáo dục - Đào tạo', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 11, title: 'Nhân viên QA/QC Sản xuất', company: 'CVMS Manufacturing', location: 'Bình Dương', salary: '10-14 tr', salaryNum: 10, deadline: '02/08/2026', tags: ['Sản xuất', 'QA/QC', 'Quy trình', 'ISO'], dept: 'Sản xuất - Kỹ thuật', qty: 4, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 12, title: 'Chuyên viên Truyền thông Nội bộ', company: 'CVMS Communications', location: 'Hà Nội', salary: '11-16 tr', salaryNum: 11, deadline: '29/07/2026', tags: ['Truyền thông', 'Sự kiện', 'Content'], dept: 'Marketing', qty: 1, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 13, title: 'Business Analyst', company: 'CVMS Business Solutions', location: 'Hồ Chí Minh', salary: '18-28 tr', salaryNum: 18, deadline: '08/08/2026', tags: ['Phân tích nghiệp vụ', 'Quy trình', 'Stakeholder'], dept: 'Phân tích nghiệp vụ', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 14, title: 'Data Analyst', company: 'CVMS Analytics', location: 'Hà Nội', salary: '16-24 tr', salaryNum: 16, deadline: '31/07/2026', tags: ['Dữ liệu', 'SQL', 'Power BI', 'Dashboard'], dept: 'Dữ liệu - Phân tích', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 15, title: 'Frontend Developer', company: 'CVMS Technology', location: 'Hà Nội', salary: '18-26 tr', salaryNum: 18, deadline: '27/07/2026', tags: ['Công nghệ thông tin', 'React', 'TypeScript'], dept: 'Công nghệ thông tin', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 16, title: 'Điều phối Dự án', company: 'CVMS PMO', location: 'Đà Nẵng', salary: '12-18 tr', salaryNum: 12, deadline: '03/08/2026', tags: ['Quản lý dự án', 'PMO', 'Điều phối'], dept: 'Quản lý dự án', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 17, title: 'Chuyên viên Mua hàng', company: 'CVMS Procurement', location: 'Hồ Chí Minh', salary: '11-16 tr', salaryNum: 11, deadline: '06/08/2026', tags: ['Mua hàng', 'Đàm phán', 'Nhà cung cấp'], dept: 'Mua hàng', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 18, title: 'Nhân viên Thiết kế Đồ họa', company: 'CVMS Creative', location: 'Hà Nội', salary: '10-15 tr', salaryNum: 10, deadline: '23/07/2026', tags: ['Thiết kế', 'Photoshop', 'Illustrator', 'Branding'], dept: 'Thiết kế - Sáng tạo', qty: 2, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 19, title: 'Chuyên viên Kiểm soát Nội bộ', company: 'CVMS Finance', location: 'Hà Nội', salary: '15-22 tr', salaryNum: 15, deadline: '10/08/2026', tags: ['Kiểm soát nội bộ', 'Rủi ro', 'Quy trình'], dept: 'Tài chính - Kế toán', qty: 1, applicants: 0, status: 'Đang tuyển', active: true },
  { id: 20, title: 'Thực tập sinh Nhân sự', company: 'CVMS Human Resources', location: 'Hồ Chí Minh', salary: '3-5 tr', salaryNum: 3, deadline: '15/08/2026', tags: ['Nhân sự', 'Thực tập', 'Tuyển dụng'], dept: 'Nhân sự', qty: 4, applicants: 0, status: 'Đang tuyển', active: true },
];

applyDemoCompanyOwnership(defaultJobs, defaultCompanies);

const store = await createStore(root, defaultJobs, defaultCompanies);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

createServer(async (req, res) => {
  try {
    if ((req.url || '').startsWith('/api/')) {
      await handleApi(req, res);
      return;
    }
    await serveStatic(req, res);
  } catch (error) {
    console.error(error);
    sendJson(res, 500, { error: 'Internal server error', detail: error.message });
  }
}).listen(port, () => {
  console.log(`CVMS backend + web: http://localhost:${port}`);
  console.log(`Database provider: ${store.provider}${store.dbPath ? ` (${store.dbPath})` : ''}`);
});

async function loadEnv() {
  try {
    const raw = await readFile(join(root, '.env'), 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const [key, ...parts] = trimmed.split('=');
      if (!process.env[key]) process.env[key] = parts.join('=').trim();
    }
  } catch {
    // .env is optional
  }
}

function applyDemoCompanyOwnership(jobs, companies) {
  const byId = Object.fromEntries(companies.map((company) => [company.id, company]));
  const deptCompanyMap = {
    'Công nghệ thông tin': 1,
    'Dữ liệu - Phân tích': 1,
    'Phân tích nghiệp vụ': 1,
    'Quản lý dự án': 1,
    'Marketing': 2,
    'Kinh doanh': 2,
    'Thiết kế - Sáng tạo': 2,
    'Dịch vụ khách hàng': 2,
    'Vận hành - Logistics': 3,
    'Sản xuất - Kỹ thuật': 3,
    'Mua hàng': 3,
    'Hành chính': 3,
    'Giáo dục - Đào tạo': 4,
    'Nhân sự': 4,
    'Tài chính - Kế toán': 5,
    'Pháp lý - Tuân thủ': 5,
  };
  for (const job of jobs) {
    const companyId = deptCompanyMap[job.dept] || 1;
    const company = byId[companyId] || byId[1];
    job.companyId = company.id;
    job.company = company.name;
  }
}

async function normalizeJobPayloadForPlatform(res, body = {}, partial = false) {
  const payload = { ...body };
  const rawCompanyId = payload.companyId === undefined || payload.companyId === null || payload.companyId === ''
    ? 0
    : Number(payload.companyId);
  if (rawCompanyId) {
    const company = await store.getCompany(rawCompanyId);
    if (!company) {
      sendJson(res, 400, { error: 'Doanh nghiệp tuyển dụng không tồn tại.' });
      return null;
    }
    payload.companyId = company.id;
    payload.company = company.name;
    return payload;
  }
  if (!partial) {
    sendJson(res, 400, { error: 'Vui lòng chọn doanh nghiệp tuyển dụng.' });
    return null;
  }
  return payload;
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;
  const method = req.method || 'GET';
  const body = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) ? await readJson(req) : {};
  const authUser = await getAuthUser(req);

  if (method === 'GET' && path === '/api/health') return sendJson(res, 200, { ok: true, database: store.provider });
  if (method === 'POST' && path === '/api/chat') return chatWithAi(res, body);

  if (method === 'GET' && path === '/api/companies') return sendJson(res, 200, { companies: await store.getCompanies() });
  if (method === 'POST' && path === '/api/companies') {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { company: await store.addCompany(body) });
  }
  const companyPatch = path.match(/^\/api\/companies\/(\d+)$/);
  if (method === 'PATCH' && companyPatch) {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { company: await store.updateCompany(Number(companyPatch[1]), body) });
  }

  if (method === 'GET' && path === '/api/jobs') {
    const companyId = Number(url.searchParams.get('companyId') || 0);
    const jobs = await store.getJobs();
    return sendJson(res, 200, { jobs: companyId ? jobs.filter((job) => Number(job.companyId) === companyId) : jobs });
  }
  if (method === 'POST' && path === '/api/jobs') {
    if (!requireRole(res, authUser, 'admin')) return;
    const payload = await normalizeJobPayloadForPlatform(res, body);
    if (!payload) return;
    return sendJson(res, 200, { job: await store.addJob(payload) });
  }

  const jobClose = path.match(/^\/api\/jobs\/(\d+)\/close$/);
  if (method === 'POST' && jobClose) {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { job: await store.closeJob(Number(jobClose[1])) });
  }

  const jobPatch = path.match(/^\/api\/jobs\/(\d+)$/);
  if (method === 'PATCH' && jobPatch) {
    if (!requireRole(res, authUser, 'admin')) return;
    const payload = await normalizeJobPayloadForPlatform(res, body, true);
    if (!payload) return;
    return sendJson(res, 200, { job: await store.updateJob(Number(jobPatch[1]), payload) });
  }

  if (method === 'GET' && path === '/api/applications') {
    if (!requireUser(res, authUser)) return;
    const applications = await store.getApplications();
    return sendJson(res, 200, {
      applications: authUser.role === 'admin'
        ? applications
        : applications.filter((app) => app.userEmail === authUser.email),
    });
  }
  if (method === 'POST' && path === '/api/applications') {
    if (!requireUser(res, authUser)) return;
    return sendJson(res, 200, await store.applyJob({ ...body, userEmail: authUser.email, userName: authUser.name }));
  }

  if (method === 'GET' && path === '/api/saved-jobs') {
    if (!requireUser(res, authUser)) return;
    return sendJson(res, 200, { savedJobs: await store.getSavedJobs(authUser.email) });
  }

  const savedJobToggle = path.match(/^\/api\/saved-jobs\/(\d+)\/toggle$/);
  if (method === 'POST' && savedJobToggle) {
    if (!requireUser(res, authUser)) return;
    return sendJson(res, 200, await store.toggleSavedJob(authUser.email, Number(savedJobToggle[1])));
  }

  const appStatus = path.match(/^\/api\/applications\/(\d+)\/status$/);
  if (method === 'PATCH' && appStatus) {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { application: await store.updateApplicationStatus(Number(appStatus[1]), body.status, body.adminNote || '') });
  }

  const appPipeline = path.match(/^\/api\/applications\/(\d+)\/pipeline$/);
  if (method === 'PATCH' && appPipeline) {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { application: await store.updatePipelineStage(Number(appPipeline[1]), body.stage) });
  }

  const appShareCompany = path.match(/^\/api\/applications\/(\d+)\/share-company$/);
  if (method === 'POST' && appShareCompany) {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { ok: true, application: await store.shareApplicationWithCompany(Number(appShareCompany[1]), body.note || '') });
  }

  const appCompanyFeedback = path.match(/^\/api\/applications\/(\d+)\/company-feedback$/);
  if (method === 'PATCH' && appCompanyFeedback) {
    if (!requireRole(res, authUser, 'company')) return;
    try {
      return sendJson(res, 200, { ok: true, application: await store.updateCompanyApplicationFeedback(Number(appCompanyFeedback[1]), authUser, body.feedback || '') });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (method === 'POST' && path === '/api/applications/ai-assess-batch') {
    if (!requireRole(res, authUser, 'admin')) return;
    return assessApplicationsBatch(res, body);
  }

  if (method === 'POST' && path === '/api/company-bookings') {
    const booking = await store.addBookingRequest({
      ...body,
      submittedBy: authUser?.email || body.submittedBy || '',
      submittedRole: authUser?.role || body.submittedRole || 'company',
    });
    return sendJson(res, 200, { ok: true, booking });
  }

  const bookingPayment = path.match(/^\/api\/company-bookings\/(\d+)\/payment$/);
  if (method === 'PATCH' && bookingPayment) {
    const email = authUser?.email || body.email || '';
    if (!email) return sendJson(res, 400, { error: 'Vui lòng gửi email để xác nhận thanh toán.' });
    try {
      const booking = await store.confirmBookingPayment(Number(bookingPayment[1]), email);
      return sendJson(res, 200, { ok: true, booking });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const bookingAdminConfirm = path.match(/^\/api\/company-bookings\/(\d+)\/admin-confirm$/);
  if (method === 'PATCH' && bookingAdminConfirm) {
    if (!requireRole(res, authUser, 'admin')) return;
    try {
      const booking = await store.adminConfirmBookingPayment(Number(bookingAdminConfirm[1]));
      return sendJson(res, 200, { ok: true, booking });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const bookingCreateJob = path.match(/^\/api\/company-bookings\/(\d+)\/create-job$/);
  if (method === 'POST' && bookingCreateJob) {
    if (!requireRole(res, authUser, 'admin')) return;
    try {
      const result = await store.createJobFromBooking(Number(bookingCreateJob[1]), body || {});
      return sendJson(res, 200, { ok: true, ...result });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  const bookingReject = path.match(/^\/api\/company-bookings\/(\d+)\/reject$/);
  if (method === 'PATCH' && bookingReject) {
    if (!requireRole(res, authUser, 'admin')) return;
    try {
      const booking = await store.rejectBookingRequest(Number(bookingReject[1]), body.reason || '');
      return sendJson(res, 200, { ok: true, booking });
    } catch (error) {
      return sendJson(res, 400, { error: error.message });
    }
  }

  if (method === 'GET' && path === '/api/company-bookings') {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { bookings: await store.getBookingRequests() });
  }

  if (method === 'GET' && path === '/api/company/dashboard') {
    if (!requireRole(res, authUser, 'company')) return;
    return sendJson(res, 200, await store.getCompanyDashboard(authUser));
  }

  if (method === 'GET' && path === '/api/notifications') {
    if (!requireUser(res, authUser)) return;
    return sendJson(res, 200, { notifications: await store.getNotifications(authUser.role, authUser.email) });
  }
  if (method === 'POST' && path === '/api/notifications/read') {
    if (!requireUser(res, authUser)) return;
    await store.markNotificationsRead(authUser.role, authUser.email);
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'POST' && path === '/api/auth/register') return sendJson(res, 200, await store.register(body));
  if (method === 'POST' && path === '/api/auth/login') {
    const result = await store.login(body);
    if (result.ok) result.token = createSession(result.user);
    return sendJson(res, 200, result);
  }
  const oauthStart = path.match(/^\/api\/auth\/oauth\/(google|github|facebook)\/start$/);
  if (method === 'GET' && oauthStart) return startOAuth(req, res, oauthStart[1]);
  const oauthCallback = path.match(/^\/api\/auth\/oauth\/(google|github|facebook)\/callback$/);
  if (method === 'GET' && oauthCallback) return finishOAuth(req, res, url, oauthCallback[1]);
  if (method === 'POST' && path === '/api/auth/logout') {
    destroySession(req);
    return sendJson(res, 200, { ok: true });
  }
  if (method === 'GET' && path === '/api/auth/me') {
    if (!requireUser(res, authUser)) return;
    return sendJson(res, 200, { ok: true, user: authUser });
  }
  if (method === 'PATCH' && path === '/api/users/profile') {
    if (!requireUser(res, authUser)) return;
    return sendJson(res, 200, { user: await store.updateProfile(authUser.email, { ...body, email: authUser.email }) });
  }

  if (method === 'GET' && path === '/api/cvs') {
    if (!requireRole(res, authUser, 'admin')) return;
    return sendJson(res, 200, { cvs: await store.getCvIndex() });
  }
  const cvPath = path.match(/^\/api\/cvs\/(.+)$/);
  if (cvPath && method === 'GET') {
    if (!requireUser(res, authUser)) return;
    const email = decodeURIComponent(cvPath[1]);
    if (!canAccessEmail(authUser, email)) return sendJson(res, 403, { error: 'Forbidden' });
    return sendJson(res, 200, { cv: await store.getCv(email) });
  }
  if (cvPath && method === 'PUT') {
    if (!requireUser(res, authUser)) return;
    const email = decodeURIComponent(cvPath[1]);
    if (!canAccessEmail(authUser, email)) return sendJson(res, 403, { error: 'Forbidden' });
    return sendJson(res, 200, { cv: await store.saveCv(email, body) });
  }
  if (cvPath && method === 'DELETE') {
    if (!requireUser(res, authUser)) return;
    const email = decodeURIComponent(cvPath[1]);
    if (!canAccessEmail(authUser, email)) return sendJson(res, 403, { error: 'Forbidden' });
    await store.deleteCv(email);
    return sendJson(res, 200, { ok: true });
  }

  if (method === 'POST' && path === '/api/analyze-cv') {
    if (!requireUser(res, authUser)) return;
    return analyzeCv(res, body);
  }

  sendJson(res, 404, { error: 'API route not found' });
}

function getOrigin(req) {
  return `http://${req.headers.host}`;
}

function getOAuthConfig(provider) {
  if (provider === 'google') {
    return {
      clientId: secretConfig.googleClientId,
      clientSecret: secretConfig.googleClientSecret,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scope: 'openid email profile',
    };
  }
  if (provider === 'facebook') {
    return {
      clientId: secretConfig.facebookClientId,
      clientSecret: secretConfig.facebookClientSecret,
      authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
      scope: 'email,public_profile',
    };
  }
  return {
    clientId: secretConfig.githubClientId,
    clientSecret: secretConfig.githubClientSecret,
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scope: 'user:email',
  };
}

function startOAuth(req, res, provider) {
  const config = getOAuthConfig(provider);
  if (!config.clientId || !config.clientSecret) {
    return sendHtml(res, 500, oauthErrorHtml(`${provider} OAuth chưa cấu hình Client ID/Secret trong serve.mjs hoặc .env.`));
  }
  const role = new URL(req.url, getOrigin(req)).searchParams.get('role') === 'company' ? 'company' : 'user';
  const state = randomBytes(16).toString('hex');
  oauthStates.set(state, { provider, createdAt: Date.now(), role });
  const redirectUri = `${getOrigin(req)}/api/auth/oauth/${provider}/callback`;
  const target = new URL(config.authUrl);
  target.searchParams.set('client_id', config.clientId);
  target.searchParams.set('redirect_uri', redirectUri);
  target.searchParams.set('response_type', 'code');
  target.searchParams.set('scope', config.scope);
  target.searchParams.set('state', state);
  if (provider === 'google') target.searchParams.set('prompt', 'select_account');
  res.writeHead(302, { Location: target.toString() });
  res.end();
}

async function finishOAuth(req, res, url, provider) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const saved = state ? oauthStates.get(state) : null;
  if (!code || !saved || saved.provider !== provider) {
    return sendHtml(res, 400, oauthErrorHtml('Phiên OAuth không hợp lệ hoặc đã hết hạn.'));
  }
  oauthStates.delete(state);

  try {
    const profile = provider === 'google'
      ? await fetchGoogleProfile(req, code)
      : provider === 'facebook'
        ? await fetchFacebookProfile(req, code)
        : await fetchGithubProfile(req, code);
    if (!profile.email) return sendHtml(res, 400, oauthErrorHtml('Không lấy được email từ nhà cung cấp OAuth.'));
    const result = await store.oauthLogin({ ...profile, role: saved.role || 'user' });
    result.token = createSession(result.user);
    return sendHtml(res, 200, oauthSuccessHtml(result.user, result.token));
  } catch (error) {
    return sendHtml(res, 500, oauthErrorHtml(`OAuth lỗi: ${error.message}`));
  }
}

async function fetchFacebookProfile(req, code) {
  const redirectUri = `${getOrigin(req)}/api/auth/oauth/facebook/callback`;
  const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
  tokenUrl.searchParams.set('client_id', secretConfig.facebookClientId);
  tokenUrl.searchParams.set('client_secret', secretConfig.facebookClientSecret);
  tokenUrl.searchParams.set('redirect_uri', redirectUri);
  tokenUrl.searchParams.set('code', code);
  const tokenRes = await fetch(tokenUrl);
  const token = await tokenRes.json();
  if (!tokenRes.ok || token.error) throw new Error(token.error?.message || 'Facebook token error');
  const profileUrl = new URL('https://graph.facebook.com/me');
  profileUrl.searchParams.set('fields', 'id,name,email');
  profileUrl.searchParams.set('access_token', token.access_token);
  const infoRes = await fetch(profileUrl);
  const info = await infoRes.json();
  if (!infoRes.ok || info.error) throw new Error(info.error?.message || 'Facebook profile error');
  return { email: String(info.email || '').toLowerCase(), name: info.name || info.email || 'Facebook User', provider: 'facebook' };
}

async function fetchGoogleProfile(req, code) {
  const redirectUri = `${getOrigin(req)}/api/auth/oauth/google/callback`;
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: secretConfig.googleClientId,
      client_secret: secretConfig.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(token.error_description || token.error || 'Google token error');
  const infoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  const info = await infoRes.json();
  if (!infoRes.ok) throw new Error(info.error_description || info.error || 'Google profile error');
  return { email: String(info.email || '').toLowerCase(), name: info.name || info.email, provider: 'google' };
}

async function fetchGithubProfile(req, code) {
  const redirectUri = `${getOrigin(req)}/api/auth/oauth/github/callback`;
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      code,
      client_id: secretConfig.githubClientId,
      client_secret: secretConfig.githubClientSecret,
      redirect_uri: redirectUri,
    }),
  });
  const token = await tokenRes.json();
  if (!tokenRes.ok || token.error) throw new Error(token.error_description || token.error || 'GitHub token error');
  const headers = { Authorization: `Bearer ${token.access_token}`, Accept: 'application/vnd.github+json' };
  const [userRes, emailsRes] = await Promise.all([
    fetch('https://api.github.com/user', { headers }),
    fetch('https://api.github.com/user/emails', { headers }),
  ]);
  const user = await userRes.json();
  const emails = await emailsRes.json();
  if (!userRes.ok) throw new Error(user.message || 'GitHub profile error');
  const primary = Array.isArray(emails) ? emails.find((item) => item.primary && item.verified) || emails.find((item) => item.verified) : null;
  return {
    email: String(primary?.email || user.email || '').toLowerCase(),
    name: user.name || user.login || primary?.email || 'GitHub User',
    provider: 'github',
  };
}

function oauthSuccessHtml(user, token) {
  return `<!doctype html><meta charset="utf-8"><script>
    localStorage.setItem('cvms_user', ${JSON.stringify(JSON.stringify(user))});
    localStorage.setItem('cvms_token', ${JSON.stringify(token)});
    location.replace(${JSON.stringify(user.role === 'admin' ? '/admin/pages/dashboard.html' : user.role === 'company' ? '/company/pages/dashboard.html' : '/user/pages/dashboard.html')});
  </script><p>Đăng nhập thành công, đang chuyển trang...</p>`;
}

function oauthErrorHtml(message) {
  return `<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:32px"><h2>OAuth chưa sẵn sàng</h2><p>${escapeHtml(message)}</p><a href="/login.html">Quay lại đăng nhập</a></body>`;
}

function createSession(user) {
  const token = randomBytes(32).toString('hex');
  sessions.set(token, { user, createdAt: Date.now() });
  return token;
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : '';
}

async function getAuthUser(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session?.user) return null;
  const freshUser = typeof store.getUserByEmail === 'function'
    ? await store.getUserByEmail(session.user.email)
    : session.user;
  if (freshUser) {
    sessions.set(token, { user: freshUser, createdAt: session.createdAt || Date.now() });
    return freshUser;
  }
  return session.user;
}

function destroySession(req) {
  const token = getBearerToken(req);
  if (token) sessions.delete(token);
}

function requireUser(res, user) {
  if (user) return true;
  sendJson(res, 401, { error: 'Authentication required' });
  return false;
}

function requireRole(res, user, role) {
  if (!requireUser(res, user)) return false;
  if (user.role === role) return true;
  sendJson(res, 403, { error: 'Forbidden' });
  return false;
}

function canAccessEmail(user, email) {
  return user.role === 'admin' || user.email === email;
}

async function chatWithAi(res, body) {
  const message = String(body.message || '').trim();
  const apiKey = String(secretConfig.groqApiKey || '').trim();
  const history = Array.isArray(body.history) ? body.history : [];
  const mode = body.mode === 'admin_cv_manage' ? 'admin_cv_manage' : 'user_career';

  if (!message) return sendJson(res, 400, { error: 'Tin nhắn trống' });
  if (!apiKey) return sendJson(res, 400, { error: 'Thiếu GROQ_API_KEY trong serve.mjs CODE_KEYS hoặc .env' });

  const jobs = await store.getJobs();
  const applications = await store.getApplications();
  const companies = await store.getCompanies();
  const intent = detectIntent(message);
  const category = detectCategory(message);
  const context = buildChatContext(jobs, applications, companies, intent, category, mode);
  const systemPrompt = mode === 'admin_cv_manage'
    ? `Bạn là AI quản lý CV cho Admin nền tảng CVMS. Nhiệm vụ chính: hỗ trợ lọc, so sánh, đánh giá, chấm điểm CV/ứng viên theo vị trí tuyển dụng, tiêu chí tuyển dụng và dữ liệu toàn hệ thống nhiều doanh nghiệp.
Trả lời bằng tiếng Việt, thực tế, có cấu trúc rõ:
- Điểm phù hợp: 0-100
- Mức phù hợp: Rất phù hợp / Phù hợp / Cân nhắc / Chưa phù hợp
- Lý do chính
- Điểm mạnh liên quan vị trí
- Rủi ro hoặc thông tin cần làm rõ
- Câu hỏi phỏng vấn gợi ý
- Đề xuất bước tiếp theo
Nếu thiếu CV hoặc thiếu mô tả vị trí, hãy yêu cầu admin cung cấp thêm, nhưng vẫn đưa checklist đánh giá cần có.`
    : `Bạn là chatbot tư vấn nghề nghiệp cho ứng viên CVMS. Trả lời bằng tiếng Việt, thân thiện, thực tế và đa ngành.
Bạn có thể tư vấn mọi ngành nghề: công nghệ, marketing, kinh doanh, tài chính, kế toán, nhân sự, thiết kế, vận hành, logistics, giáo dục, y tế, pháp lý, sản xuất, dịch vụ và các lĩnh vực khác.
Phạm vi hỗ trợ gồm: chọn ngành, tìm việc, so sánh nghề, kỹ năng cần học, mức lương tham khảo, chuẩn bị phỏng vấn, lộ trình phát triển, chuyển ngành, và góp ý CV/hồ sơ ứng tuyển.
Không trả lời như admin nội bộ, không tiết lộ dữ liệu ứng viên khác, không tự quyết định tuyển/loại ứng viên.`;
  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    ...history.slice(-8).map((item) => ({
      role: item.role === 'model' ? 'assistant' : 'user',
      content: item.parts?.[0]?.text || item.content || ''
    })).filter((item) => item.content),
    {
      role: 'user',
      content: `[DỮ LIỆU HỆ THỐNG CVMS]\n${context}\n\n[CÂU HỎI]\n${message}`
    }
  ];

  try {
    const upstream = await fetch(groqUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: groqModel,
        messages,
        temperature: 0.6,
        max_tokens: 900
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) return sendJson(res, upstream.status, { error: data.error?.message || data.error || 'Groq API error' });
    return sendJson(res, 200, {
      reply: data.choices?.[0]?.message?.content || 'Không có phản hồi.',
      intent,
      category,
      mode,
      confidence: { intent: 88, category: 84 },
      rag_used: true,
      model_info: { chat_model: groqModel, database: store.provider }
    });
  } catch (error) {
    return sendJson(res, 500, { error: `Lỗi gọi AI: ${error.message}` });
  }
}

function detectIntent(text) {
  const value = text.toLowerCase();
  if (/(lương|salary|thu nhập|mức lương)/i.test(value)) return 'hoi_luong';
  if (/(cv|hồ sơ|resume|phân tích|sửa cv)/i.test(value)) return 'hoi_cv';
  if (/(phỏng vấn|interview|câu hỏi)/i.test(value)) return 'hoi_phongvan';
  if (/(kỹ năng|skill|cần học|yêu cầu)/i.test(value)) return 'hoi_kynang';
  if (/(xu hướng|hot|ngành nào)/i.test(value)) return 'hoi_xhuong';
  return 'tim_viec';
}

function detectCategory(text) {
  const value = text.toLowerCase();
  if (/(dev|developer|lập trình|frontend|backend|data|ai|python|node|react|it|công nghệ)/i.test(value)) return 'cong_nghe';
  if (/(kế toán|kiểm toán|tài chính|ngân hàng|finance)/i.test(value)) return 'tai_chinh';
  if (/(marketing|sales|kinh doanh|e-commerce|thương mại)/i.test(value)) return 'kinh_doanh';
  if (/(nhân sự|hr|tuyển dụng)/i.test(value)) return 'nhan_su';
  if (/(thiết kế|design|ui|ux|figma|sáng tạo|creative)/i.test(value)) return 'thiet_ke';
  if (/(logistics|chuỗi cung ứng|supply|vận hành|operation|ops|kho|vận tải)/i.test(value)) return 'van_hanh_logistics';
  if (/(giáo dục|teacher|giảng viên|đào tạo|training)/i.test(value)) return 'giao_duc';
  if (/(y tế|bác sĩ|dược|điều dưỡng|health|medical)/i.test(value)) return 'y_te';
  if (/(pháp lý|luật|legal|compliance)/i.test(value)) return 'phap_ly';
  if (/(sản xuất|manufacturing|qa|qc|bảo trì|cơ khí|điện)/i.test(value)) return 'san_xuat_ky_thuat';
  return 'chung';
}

function buildChatContext(jobs, applications, companies, intent, category, mode = 'user_career') {
  const activeJobs = jobs.filter((job) => job.active !== false).slice(0, 8);
  const jobLines = activeJobs.map((job) => `- ${job.title} | ${job.company} | ${job.location} | ${job.salary || 'Thỏa thuận'} | ${job.applicants || 0} ứng viên`).join('\n');
  const companyLines = companies.slice(0, 8).map((company) => `- ${company.name} | ${company.industry || 'Chưa rõ ngành'} | ${company.location || 'Chưa rõ địa điểm'} | ${company.status || 'active'}`).join('\n');
  const totalApps = applications.length;
  const interviewCount = applications.filter((app) => ['Phỏng vấn', 'Đã offer'].includes(app.status)).length;
  const base = [
    `Chế độ chatbot: ${mode === 'admin_cv_manage' ? 'Admin quản lý CV' : 'Ứng viên tư vấn nghề nghiệp đa ngành'}`,
    `Intent dự đoán: ${intent}`,
    `Nhóm ngành dự đoán: ${category}`,
    `Tổng doanh nghiệp trên nền tảng: ${companies.length}`,
    `Doanh nghiệp tiêu biểu:\n${companyLines || 'Chưa có doanh nghiệp'}`,
    `Tổng vị trí đang hiển thị: ${activeJobs.length}`,
    `Danh sách việc làm:\n${jobLines || 'Chưa có việc làm'}`
  ];
  if (mode === 'admin_cv_manage') {
    base.splice(4, 0, `Tổng đơn ứng tuyển: ${totalApps}`, `Đơn đã vào phỏng vấn/offer: ${interviewCount}`);
  }
  return base.join('\n');
}

async function assessApplicationsBatch(res, body = {}) {
  const force = body.force === true;
  const limit = Math.max(1, Math.min(50, Number(body.limit || 25)));
  const [applications, jobs] = await Promise.all([store.getApplications(), store.getJobs()]);
  const targets = [];

  for (const app of applications) {
    if (!force && app.aiEvaluatedAt) continue;
    const cv = await store.getCv(app.userEmail);
    if (!cv) continue;
    targets.push({ app, cv });
    if (targets.length >= limit) break;
  }

  const assessed = [];
  const errors = [];
  for (const item of targets) {
    try {
      const assessment = await assessCandidateApplication(item.app, item.cv, jobs);
      const saved = await store.saveApplicationAssessment(item.app.id, assessment);
      assessed.push(saved);
    } catch (error) {
      errors.push({ appId: item.app.id, userEmail: item.app.userEmail, error: error.message });
    }
  }

  return sendJson(res, 200, {
    ok: true,
    assessedCount: assessed.length,
    skippedCount: applications.length - targets.length,
    assessed,
    errors,
  });
}

async function assessCandidateApplication(app, cv, jobs) {
  const fallback = buildFallbackAssessment(app, cv, jobs);
  if (!secretConfig.anthropicApiKey) return fallback;

  const ext = String(cv.ext || '').toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png'].includes(ext);
  const isPDF = ext === 'pdf';
  if (!isImage && !isPDF) return fallback;

  const job = jobs.find((item) => Number(item.id) === Number(app.jobId)) || {};
  const targetIndustries = (cv.industries || []).join(', ') || 'chưa chọn';
  const jobContext = [
    `Vị trí: ${app.jobTitle || job.title || ''}`,
    `Phòng ban/ngành: ${job.dept || ''}`,
    `Công ty: ${app.company || job.company || ''}`,
    `Địa điểm: ${app.location || job.location || ''}`,
    `Tags/yêu cầu: ${(job.tags || []).join(', ')}`,
  ].join('\n');
  const base64Data = String(cv.base64 || '').split(',')[1] || '';
  if (!base64Data) return fallback;

  const content = isImage
    ? [
      { type: 'image', source: { type: 'base64', media_type: cv.type || 'image/jpeg', data: base64Data } },
      { type: 'text', text: `Hãy chấm CV ứng viên theo bối cảnh tuyển dụng:\n${jobContext}\nNgành CV chọn: ${targetIndustries}` },
    ]
    : [
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64Data } },
      { type: 'text', text: `Hãy chấm CV ứng viên theo bối cảnh tuyển dụng:\n${jobContext}\nNgành CV chọn: ${targetIndustries}` },
    ];

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': secretConfig.anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 900,
        system: `Bạn là AI quản lý CV cho admin tuyển dụng. Trả về JSON thuần:
{
  "aiScore": 0,
  "aiFitLevel": "Rất phù hợp|Phù hợp|Cân nhắc|Chưa phù hợp",
  "summary": "",
  "strengths": [],
  "risks": [],
  "questions": [],
  "nextStep": ""
}
Chấm dựa trên mức khớp giữa CV và vị trí, không thiên vị ngành CNTT.`,
        messages: [{ role: 'user', content }],
      }),
    });
    const data = await upstream.json();
    if (!upstream.ok) return fallback;
    const text = (data.content || []).map((part) => part.text || '').join('\n').replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(text);
    return normalizeAssessment(parsed, fallback);
  } catch {
    return fallback;
  }
}

function buildFallbackAssessment(app, cv, jobs) {
  const job = jobs.find((item) => Number(item.id) === Number(app.jobId)) || {};
  const industries = normalizeIndustries(cv.industries || []);
  const jobText = `${job.dept || ''} ${app.jobTitle || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
  const exactIndustry = industries.some((item) => jobText.includes(String(item).toLowerCase().split('/')[0].trim()));
  const tokenMatches = industries.reduce((count, item) => {
    const tokens = String(item).toLowerCase().split(/[\\/,-\s]+/).filter((token) => token.length >= 4);
    return count + (tokens.some((token) => jobText.includes(token)) ? 1 : 0);
  }, 0);
  const score = Math.max(35, Math.min(92, 52 + (exactIndustry ? 24 : 0) + tokenMatches * 8 + (cv.name ? 4 : 0)));
  const level = score >= 80 ? 'Rất phù hợp' : score >= 65 ? 'Phù hợp' : score >= 50 ? 'Cân nhắc' : 'Chưa phù hợp';
  return {
    aiScore: score,
    aiFitLevel: level,
    aiEvaluatedAt: new Date().toLocaleString('vi-VN'),
    aiEvaluation: {
      source: secretConfig.anthropicApiKey ? 'fallback_after_ai_error' : 'fallback_no_ai_key',
      summary: `Chấm nhanh dựa trên ngành CV đã chọn và vị trí "${app.jobTitle}".`,
      strengths: exactIndustry ? ['Ngành CV đã chọn khớp với vị trí ứng tuyển.'] : ['Ứng viên đã có CV để nhà tuyển dụng xem xét.'],
      risks: exactIndustry ? ['Cần đọc nội dung CV để xác nhận kinh nghiệm thực tế.'] : ['Ngành CV chọn chưa khớp rõ với vị trí, cần kiểm tra kỹ nội dung CV.'],
      questions: ['Kinh nghiệm gần nhất có liên quan trực tiếp tới vị trí này không?', 'Ứng viên có thể chứng minh kỹ năng chính qua dự án/kết quả nào?'],
      nextStep: score >= 65 ? 'Đưa vào danh sách xem xét/phỏng vấn sơ bộ.' : 'Cần HR đọc CV chi tiết trước khi chuyển vòng.',
      cvIndustries: industries,
    },
  };
}

function normalizeAssessment(parsed, fallback) {
  const score = Number.isFinite(Number(parsed.aiScore)) ? Number(parsed.aiScore) : fallback.aiScore;
  return {
    aiScore: Math.max(0, Math.min(100, Math.round(score))),
    aiFitLevel: parsed.aiFitLevel || fallback.aiFitLevel,
    aiEvaluatedAt: new Date().toLocaleString('vi-VN'),
    aiEvaluation: {
      source: 'anthropic',
      summary: parsed.summary || fallback.aiEvaluation.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallback.aiEvaluation.strengths,
      risks: Array.isArray(parsed.risks) ? parsed.risks : fallback.aiEvaluation.risks,
      questions: Array.isArray(parsed.questions) ? parsed.questions : fallback.aiEvaluation.questions,
      nextStep: parsed.nextStep || fallback.aiEvaluation.nextStep,
    },
  };
}

async function analyzeCv(res, body) {
  if (!secretConfig.anthropicApiKey) {
    return sendJson(res, 200, {
      content: [{ type: 'text', text: JSON.stringify(buildAnalyzeCvFallback(body), null, 2) }],
      fallback: true,
      note: 'ANTHROPIC_API_KEY chưa cấu hình nên hệ thống trả về đánh giá sơ bộ thay vì đọc nội dung file trực tiếp.',
    });
  }
  const nextBody = {
    ...body,
    system: body.system || `Bạn là chuyên gia HR đa ngành. Phân tích CV cho nhiều lĩnh vực, không chỉ CNTT. Hãy nhận diện ngành phù hợp, kỹ năng chuyển đổi, kinh nghiệm, học vấn, điểm mạnh/yếu, mức độ phù hợp theo từng ngành mục tiêu và gợi ý cải thiện cụ thể.`,
  };
  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': secretConfig.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(nextBody),
  });
  const data = await upstream.json();
  sendJson(res, upstream.status, data);
}

function buildAnalyzeCvFallback(body = {}) {
  const messageText = JSON.stringify(body.messages || '').toLowerCase();
  const isAdminPrompt = /đánh giá|chấm|tuyển dụng|admin|phỏng vấn|vị trí/.test(messageText);
  if (isAdminPrompt) {
    return {
      ho_ten: null,
      sdt: null,
      email: null,
      ngay_sinh: null,
      dia_chi: null,
      ky_nang_chinh: [],
      diem_manh: ['Đã có CV/file hồ sơ để HR xem xét.'],
      diem_yeu: ['Chưa đọc được nội dung CV trực tiếp vì thiếu ANTHROPIC_API_KEY.'],
      kinh_nghiem_lam_viec: [],
      hoc_van: [],
      nam_kinh_nghiem: null,
      linh_vuc_chinh: null,
      diem_phu_hop_cv_job: 55,
      muc_do_phu_hop: 'Cân nhắc',
      ket_luan_tuyen_dung: 'Đây là đánh giá sơ bộ. Cần cấu hình ANTHROPIC_API_KEY để AI đọc PDF/ảnh CV và chấm chính xác hơn.',
      ly_do_phu_hop: ['Ứng viên đã nộp CV và có thể được đưa vào danh sách đọc thủ công.'],
      diem_can_lam_ro: ['Kinh nghiệm gần nhất có liên quan tới vị trí không?', 'Kỹ năng chính có bằng chứng qua dự án/kết quả không?'],
      cau_hoi_phong_van_goi_y: ['Bạn hãy mô tả kinh nghiệm phù hợp nhất với vị trí này.', 'Kết quả nổi bật nhất bạn từng đạt được là gì?'],
      de_xuat_vong_tiep_theo: 'HR nên mở CV để đọc chi tiết hoặc bổ sung ANTHROPIC_API_KEY để AI phân tích file tự động.',
      nganh_phu_hop: [],
      ky_nang_chuyen_nganh: [],
      tom_tat: 'Chưa thể trích xuất nội dung CV trực tiếp, chỉ có thể đánh giá sơ bộ.',
      muc_luong_de_xuat: null,
    };
  }
  return {
    tom_tat: 'Đã nhận file CV. Vì chưa có ANTHROPIC_API_KEY, hệ thống chưa đọc được nội dung file trực tiếp.',
    goi_y_cai_thien: [
      'Đưa phần mục tiêu nghề nghiệp và vị trí mong muốn lên đầu CV.',
      'Viết kinh nghiệm theo công thức: nhiệm vụ - công cụ/kỹ năng - kết quả đo được.',
      'Thêm 5-8 kỹ năng chính liên quan tới ngành muốn ứng tuyển.',
      'Bổ sung thành tích có số liệu nếu có.',
    ],
    diem_can_kiem_tra: [
      'Thông tin liên hệ có đầy đủ không?',
      'CV có khớp với ngành/vị trí ứng tuyển không?',
      'Kinh nghiệm gần nhất có được mô tả rõ không?',
    ],
  };
}

async function serveStatic(req, res) {
  const file = resolvePath(req.url || '/');
  if (!file) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }
  try {
    const info = await stat(file);
    const finalFile = info.isDirectory() ? join(file, 'index.html') : file;
    const type = types[extname(finalFile).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type });
    createReadStream(finalFile).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

function resolvePath(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const relativePath = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
  const full = normalize(join(root, relativePath));
  const rel = relative(root, full);
  if (rel === '..' || rel.startsWith(`..${separator()}`) || isAbsolute(rel)) return null;
  return full;
}

function separator() {
  return process.platform === 'win32' ? '\\' : '/';
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 12 * 1024 * 1024) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function sendHtml(res, status, html) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
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
