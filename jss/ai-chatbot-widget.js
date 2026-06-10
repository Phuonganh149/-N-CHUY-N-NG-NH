(function () {
  if (window.__cvmsAiWidget) return;
  window.__cvmsAiWidget = true;

  const state = {
    open: false,
    history: [],
    loading: false,
    scoring: false,
  };
  const isAdmin = location.pathname.includes('/admin/');
  const roleConfig = isAdmin
    ? {
      mode: 'admin_cv_manage',
      title: 'AI Quản lý CV',
      sub: 'Lọc, so sánh và chấm CV ứng viên',
      chatTab: 'Quản lý CV',
      cvTab: 'Chấm CV',
      hello: 'Xin chào Admin! Tôi hỗ trợ quản lý CV: lọc hồ sơ, so sánh ứng viên, chấm điểm theo vị trí, gợi ý câu hỏi phỏng vấn và đề xuất vòng tiếp theo.',
      placeholder: 'Nhập yêu cầu quản lý CV, tiêu chí tuyển dụng, vị trí hoặc hồ sơ ứng viên...',
      cvButton: 'Chấm điểm CV đang chọn',
      cvHint: 'Nhập vị trí tuyển dụng hoặc tiêu chí bắt buộc để AI chấm mức phù hợp CV.',
      quickPrompts: [
        'Tóm tắt các vị trí đang tuyển',
        'Gợi ý câu hỏi phỏng vấn cho Frontend Developer',
        'Checklist chấm CV trong hệ thống CVMS',
      ],
    }
    : {
      mode: 'user_career',
      title: 'AI Tư vấn nghề nghiệp',
      sub: 'Tư vấn đa ngành cho ứng viên',
      chatTab: 'Tư vấn',
      cvTab: 'Sửa CV',
      hello: 'Xin chào! Tôi có thể tư vấn nghề nghiệp đa ngành: chọn ngành, kỹ năng cần học, mức lương tham khảo, tìm việc, phỏng vấn, chuyển ngành và góp ý CV.',
      placeholder: 'Hỏi về ngành nghề, kỹ năng, mức lương, phỏng vấn, tìm việc, chuyển ngành hoặc CV...',
      cvButton: 'Gợi ý cải thiện CV',
      cvHint: 'Tính năng này đọc CV để gợi ý chỉnh sửa nội dung, bố cục và mức độ phù hợp với ngành ứng tuyển.',
      quickPrompts: [
        'Có việc nào đang tuyển ở Hà Nội?',
        'Mức lương Frontend Developer khoảng bao nhiêu?',
        'Tôi cần học kỹ năng gì để phỏng vấn tốt?',
      ],
    };
  const historyKey = `cvms_ai_history_${roleConfig.mode}`;
  state.history = loadHistory();

  const style = document.createElement('style');
  style.textContent = `
    #cvms-ai-launcher{position:fixed;right:22px;bottom:22px;z-index:9998;display:flex;flex-direction:column;align-items:flex-end;gap:10px}
    .cvms-ai-launch-btn{display:inline-flex;align-items:center;gap:8px;border:0;border-radius:999px;background:#4f46e5;color:#fff;font-weight:800;padding:12px 16px;box-shadow:0 18px 40px rgba(79,70,229,.34);cursor:pointer;font-family:inherit}
    .cvms-ai-launch-btn.secondary{background:#0f172a;box-shadow:0 14px 28px rgba(15,23,42,.28)}
    .cvms-ai-launch-btn.small{padding:10px 14px}
    .cvms-ai-launch-btn .ti{font-size:16px}
    #cvms-ai-box{position:fixed;right:22px;bottom:90px;z-index:9998;width:min(390px,calc(100vw - 28px));height:min(620px,calc(100vh - 112px));display:none;flex-direction:column;background:#fff;border:1px solid #e2e8f0;border-radius:16px;box-shadow:0 24px 70px rgba(15,23,42,.22);overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
    #cvms-ai-box.open{display:flex}
    .cvms-ai-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#0f172a;color:#fff}
    .cvms-ai-title{font-size:14px;font-weight:750}.cvms-ai-sub{font-size:11px;color:#cbd5e1;margin-top:2px}
    .cvms-ai-close{border:0;background:rgba(255,255,255,.12);color:#fff;border-radius:8px;width:30px;height:30px;cursor:pointer}
    .cvms-ai-key button,.cvms-ai-send,.cvms-ai-cv-btn{border:0;border-radius:9px;background:#4f46e5;color:#fff;font-weight:700;cursor:pointer}
    .cvms-ai-tabs{display:flex;border-bottom:1px solid #e2e8f0;background:#f8fafc}
    .cvms-ai-tab{flex:1;border:0;background:transparent;padding:10px;font-weight:700;color:#64748b;cursor:pointer}
    .cvms-ai-tab.active{background:#fff;color:#4f46e5}
    .cvms-ai-pane{display:none;flex:1;min-height:0;flex-direction:column}.cvms-ai-pane.active{display:flex}
    .cvms-ai-tools{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid #e2e8f0;background:#fff}
    .cvms-ai-suggestions{display:flex;gap:6px;overflow:auto;flex:1}
    .cvms-ai-chip,.cvms-ai-clear{border:1px solid #cbd5e1;background:#fff;color:#334155;border-radius:999px;font-size:12px;font-weight:700;padding:7px 10px;white-space:nowrap;cursor:pointer}
    .cvms-ai-chip:hover,.cvms-ai-clear:hover{border-color:#4f46e5;color:#4f46e5}
    .cvms-ai-clear{flex:0 0 auto}
    .cvms-ai-msgs{flex:1;overflow:auto;padding:14px;background:#f8fafc}
    .cvms-ai-msg{max-width:86%;margin:0 0 10px;padding:10px 12px;border-radius:14px;font-size:13px;line-height:1.55;white-space:pre-wrap}
    .cvms-ai-user{margin-left:auto;background:#4f46e5;color:#fff;border-bottom-right-radius:4px}
    .cvms-ai-bot{background:#fff;color:#0f172a;border:1px solid #e2e8f0;border-bottom-left-radius:4px}
    .cvms-ai-foot{display:flex;gap:8px;padding:10px;border-top:1px solid #e2e8f0;background:#fff}
    .cvms-ai-foot textarea{flex:1;min-height:42px;max-height:110px;resize:none;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:13px}
    .cvms-ai-send{width:46px}
    .cvms-ai-cv{padding:14px;display:flex;flex-direction:column;gap:10px;background:#fff;height:100%}
    .cvms-ai-cv input,.cvms-ai-cv textarea{border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:13px;font-family:inherit}
    .cvms-ai-cv textarea{min-height:76px;resize:vertical}
    .cvms-ai-cv-btn{padding:11px 14px}
    .cvms-ai-result{flex:1;overflow:auto;background:#0f172a;color:#e2e8f0;border-radius:12px;padding:12px;font-size:12px;white-space:pre-wrap}
    .cvms-ai-toast{position:fixed;right:22px;bottom:94px;z-index:10000;background:#0f172a;color:#fff;padding:10px 14px;border-radius:12px;font-size:12px;font-weight:700;box-shadow:0 16px 34px rgba(15,23,42,.24);opacity:0;transform:translateY(8px);transition:opacity .2s,transform .2s;pointer-events:none}
    .cvms-ai-toast.show{opacity:1;transform:translateY(0)}
    @media(min-width:980px){body.cvms-ai-mounted .main .content{padding-right:124px}}
    @media(max-width:520px){#cvms-ai-box{right:14px;bottom:82px;height:calc(100vh - 104px)}#cvms-ai-launcher{right:14px;bottom:14px}}
  `;
  document.head.appendChild(style);
  document.body.classList.add('cvms-ai-mounted');

  const root = document.createElement('div');
  root.innerHTML = `
    <div id="cvms-ai-launcher">
      <button id="cvms-ai-btn" class="cvms-ai-launch-btn" title="Mở AI chat">${isAdmin ? '<i class="ti ti-message"></i> Chat AI' : '<i class="ti ti-message"></i> AI tư vấn'}</button>
      ${isAdmin ? '<button id="cvms-ai-score-btn" class="cvms-ai-launch-btn secondary small" title="Chấm CV mới"><i class="ti ti-sparkles"></i> Chấm CV mới</button>' : ''}
    </div>
    <section id="cvms-ai-box" aria-label="AI chatbot">
      <header class="cvms-ai-head">
        <div><div class="cvms-ai-title">${roleConfig.title}</div><div class="cvms-ai-sub">${roleConfig.sub}</div></div>
        <button class="cvms-ai-close" title="Đóng">x</button>
      </header>
      <nav class="cvms-ai-tabs">
        <button class="cvms-ai-tab active" data-tab="chat">${roleConfig.chatTab}</button>
        <button class="cvms-ai-tab" data-tab="cv">${roleConfig.cvTab}</button>
      </nav>
      <div class="cvms-ai-pane active" data-pane="chat">
        <div class="cvms-ai-tools">
          <div class="cvms-ai-suggestions">
            ${roleConfig.quickPrompts.map((prompt) => `<button class="cvms-ai-chip" type="button" data-prompt="${prompt}">${prompt}</button>`).join('')}
          </div>
          <button class="cvms-ai-clear" id="cvms-ai-clear" type="button" title="Xóa lịch sử chat">Xóa</button>
        </div>
        <div class="cvms-ai-msgs" id="cvms-ai-msgs">
          <div class="cvms-ai-msg cvms-ai-bot">${roleConfig.hello}</div>
        </div>
        <div class="cvms-ai-foot">
          <textarea id="cvms-ai-input" placeholder="${roleConfig.placeholder}"></textarea>
          <button class="cvms-ai-send" id="cvms-ai-send">Gửi</button>
        </div>
      </div>
      <div class="cvms-ai-pane" data-pane="cv">
        <div class="cvms-ai-cv">
          ${isAdmin ? '<textarea id="cvms-ai-job-context" placeholder="Vị trí tuyển dụng / tiêu chí bắt buộc / mô tả công việc..."></textarea>' : ''}
          <input type="file" id="cvms-ai-cv-file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"/>
          <button class="cvms-ai-cv-btn" id="cvms-ai-cv-analyze">${roleConfig.cvButton}</button>
          <pre class="cvms-ai-result" id="cvms-ai-cv-result">${roleConfig.cvHint}</pre>
        </div>
      </div>
    </section>
  `;
  document.body.appendChild(root);

  const box = document.getElementById('cvms-ai-box');
  const msgs = document.getElementById('cvms-ai-msgs');
  const input = document.getElementById('cvms-ai-input');
  const cvFile = document.getElementById('cvms-ai-cv-file');
  const cvResult = document.getElementById('cvms-ai-cv-result');
  const launcher = document.getElementById('cvms-ai-launcher');

  function openWidget() {
    state.open = !state.open;
    box.classList.toggle('open', state.open);
  }
  function closeWidget() {
    state.open = false;
    box.classList.remove('open');
  }
  function flash(message) {
    let toast = document.getElementById('cvms-ai-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cvms-ai-toast';
      toast.className = 'cvms-ai-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  document.getElementById('cvms-ai-btn').onclick = openWidget;
  document.querySelector('.cvms-ai-close').onclick = closeWidget;
  document.getElementById('cvms-ai-score-btn')?.addEventListener('click', () => runBatchAssessment(true));
  document.querySelectorAll('.cvms-ai-tab').forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll('.cvms-ai-tab').forEach((item) => item.classList.remove('active'));
      document.querySelectorAll('.cvms-ai-pane').forEach((item) => item.classList.remove('active'));
      tab.classList.add('active');
      document.querySelector(`[data-pane="${tab.dataset.tab}"]`).classList.add('active');
    };
  });
  document.getElementById('cvms-ai-send').onclick = sendChat;
  document.getElementById('cvms-ai-clear').onclick = clearHistory;
  document.querySelectorAll('.cvms-ai-chip').forEach((button) => {
    button.addEventListener('click', () => {
      input.value = button.dataset.prompt || '';
      input.focus();
      sendChat();
    });
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendChat();
    }
  });
  document.getElementById('cvms-ai-cv-analyze').onclick = analyzeCv;
  window.CVMS_AI = { open: openWidget, close: closeWidget, score: () => runBatchAssessment(true) };

  renderStoredHistory();

  function addMsg(role, text) {
    const div = document.createElement('div');
    div.className = `cvms-ai-msg cvms-ai-${role === 'user' ? 'user' : 'bot'}`;
    div.textContent = text;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function loadHistory() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(historyKey) || '[]');
      return Array.isArray(saved) ? saved.slice(-12) : [];
    } catch {
      return [];
    }
  }

  function saveHistory() {
    sessionStorage.setItem(historyKey, JSON.stringify(state.history.slice(-12)));
  }

  function renderStoredHistory() {
    state.history.slice(-8).forEach((item) => {
      const text = item.parts?.[0]?.text || item.content || '';
      if (text) addMsg(item.role === 'model' ? 'model' : 'user', text);
    });
  }

  function clearHistory() {
    state.history = [];
    sessionStorage.removeItem(historyKey);
    msgs.innerHTML = '';
    addMsg('model', roleConfig.hello);
    flash('Đã xóa lịch sử hội thoại.');
  }

  async function sendChat() {
    const text = input.value.trim();
    if (!text || state.loading) return;
    input.value = '';
    state.loading = true;
    addMsg('user', text);
    addMsg('bot', 'Đang suy nghĩ...');
    const loadingNode = msgs.lastElementChild;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: state.history.slice(-8), mode: roleConfig.mode }),
      });
      const data = await res.json();
      loadingNode.remove();
      if (!res.ok) {
        addMsg('bot', data.error || 'Chatbot đang gặp lỗi tạm thời. Vui lòng thử lại sau.');
      } else {
        const reply = data.reply || 'Không có phản hồi.';
        addMsg('bot', reply);
        if (data.fallback || data.warning) flash(data.warning || 'Đang dùng phản hồi dự phòng.');
        state.history.push({ role: 'user', parts: [{ text }] });
        state.history.push({ role: 'model', parts: [{ text: reply }] });
        state.history = state.history.slice(-12);
        saveHistory();
      }
    } catch (error) {
      loadingNode.remove();
      addMsg('bot', 'Không kết nối được chatbot. Kiểm tra server local rồi thử lại.');
    } finally {
      state.loading = false;
    }
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function analyzeCv() {
    if (!cvFile.files.length) {
      cvResult.textContent = 'Chọn file CV trước.';
      return;
    }
    const file = cvFile.files[0];
    cvResult.textContent = 'Đang gửi CV để phân tích...';
    try {
      const base64 = await fileToBase64(file);
      const jobContext = String(document.getElementById('cvms-ai-job-context')?.value || '').trim();
      const taskText = isAdmin
        ? `Đánh giá CV này theo vị trí/tiêu chí sau: ${jobContext || 'chưa có tiêu chí cụ thể'}. Trả về nhận xét tuyển dụng, điểm phù hợp 0-100, lý do, rủi ro và đề xuất vòng tiếp theo.`
        : 'Gợi ý cải thiện CV này cho ứng viên: bố cục, câu chữ, kỹ năng nên làm nổi bật, ngành/vị trí phù hợp và checklist sửa CV.';
      const content = file.type.startsWith('image/')
        ? [
          { type: 'image', source: { type: 'base64', media_type: file.type, data: String(base64).split(',')[1] } },
          { type: 'text', text: taskText }
        ]
        : file.type === 'application/pdf'
          ? [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: String(base64).split(',')[1] } },
            { type: 'text', text: taskText }
          ]
          : `File CV: ${file.name}. ${taskText} Nếu hệ thống không đọc được nội dung file trực tiếp, hãy trả về checklist đánh giá/gợi ý dựa trên tên file và thông tin người dùng cung cấp.`;
      const res = await fetch('/api/analyze-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(window.CVMS?.getToken?.() ? { Authorization: `Bearer ${window.CVMS.getToken()}` } : {}),
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: isAdmin
            ? 'Bạn là chuyên gia tuyển dụng đa ngành cho admin CVMS. Nhiệm vụ là đánh giá CV ứng viên theo vị trí tuyển dụng, chấm điểm phù hợp 0-100, nêu lý do, rủi ro, câu hỏi phỏng vấn và đề xuất vòng tiếp theo. Không tư vấn lan man ngoài tuyển dụng.'
            : 'Bạn là cố vấn CV cho ứng viên CVMS. Chỉ góp ý CV, hồ sơ ứng tuyển, bố cục, câu chữ, kỹ năng và cách chỉnh CV theo ngành/vị trí. Không trả lời các chủ đề ngoài cải thiện CV.',
          messages: [{
            role: 'user',
            content
          }]
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        cvResult.textContent = 'Lỗi: ' + (data.error || res.statusText);
        return;
      }
      const text = (data.content || []).map((item) => item.text || '').join('\n') || JSON.stringify(data, null, 2);
      cvResult.textContent = text;
    } catch (error) {
      cvResult.textContent = 'Lỗi phân tích CV: ' + error.message;
    }
  }

  async function runBatchAssessment(force = false) {
    if (!isAdmin || !window.CVMS?.assessApplicationsBatch || state.scoring) return;
    const scoreBtn = document.getElementById('cvms-ai-score-btn');
    state.scoring = true;
    if (scoreBtn) {
      scoreBtn.disabled = true;
      scoreBtn.innerHTML = '<i class="ti ti-loader-2" style="animation:spin 1s linear infinite"></i> Đang chấm...';
    }
    try {
      const result = CVMS.assessApplicationsBatch({ force, limit: 30 });
      const count = Number(result?.assessedCount || 0);
      const skipped = Number(result?.skippedCount || 0);
      flash(count ? `Đã chấm ${count} CV${skipped ? `, bỏ qua ${skipped}` : ''}.` : 'Không có CV mới để chấm.');
      window.dispatchEvent(new CustomEvent('cvms:ai-batch-done', { detail: result }));
      return result;
    } catch (error) {
      flash('Lỗi chấm CV: ' + error.message);
      return null;
    } finally {
      state.scoring = false;
      if (scoreBtn) {
        scoreBtn.disabled = false;
        scoreBtn.innerHTML = '<i class="ti ti-sparkles"></i> Chấm CV mới';
      }
    }
  }

  if (isAdmin && window.CVMS?.assessApplicationsBatch && !sessionStorage.getItem('cvms_admin_ai_autorun_done')) {
    sessionStorage.setItem('cvms_admin_ai_autorun_done', '1');
    setTimeout(() => {
      runBatchAssessment(false);
    }, 1200);
  }
})();
