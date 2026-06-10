/* ═══════════════════════════════════════════════════════════════
   admin/js/pipeline.js — Kanban (đồng bộ với cvms_applications)
═══════════════════════════════════════════════════════════════ */

const colMeta = {
    new:       { label:'🆕 Mới nộp',    color:'' },
    screening: { label:'🔍 Screening',  color:'' },
    interview: { label:'🗣 Phỏng vấn',  color:'' },
    review:    { label:'📊 Đánh giá',   color:'' },
    offer:     { label:'🎁 Offer',      color:'' },
    hired:     { label:'✅ Nhận việc',  color:'' },
    rejected:  { label:'❌ Từ chối',    color:'' },
};

let dragSrc = null;

// Chuyển applications thành pipelineData
function buildPipelineData() {
    const apps  = CVMS.getApplications();
    const cols  = Object.fromEntries(Object.keys(colMeta).map(k => [k, []]));
    apps.forEach(a => {
        const stage = a.pipelineStage || 'new';
        if (cols[stage]) {
            cols[stage].push({
                appId:   a.id,
                name:    a.userName || a.userEmail,
                pos:     a.jobTitle,
                company: a.company,
                status:  a.status,
                days:    a.date,
                email:   a.userEmail,
            });
        }
    });
    return cols;
}

let pipelineData = {};

function cardHTML(card, stage, idx) {
    return `
        <div class="kanban-card" draggable="true"
             data-stage="${stage}" data-idx="${idx}" data-appid="${card.appId}"
             ondragstart="onDragStart(event)"
             ondragover="onDragOver(event)"
             ondrop="onDrop(event,this)">
          <div class="kc-name">${card.name}</div>
          <div class="kc-pos">${card.pos}</div>
          <div style="font-size:11px;color:var(--text-secondary);margin-top:2px">${card.company || ''}</div>
          <div class="kc-days">${card.days}</div>
          <div style="font-size:10px;color:var(--text-secondary);margin-top:4px">${card.email}</div>
        </div>`;
}

function renderKanban() {
    pipelineData = buildPipelineData();
    const wrap = document.getElementById('kanbanWrap');
    if (!wrap) return;
    wrap.innerHTML = Object.keys(colMeta).map(stage => {
        const cards = pipelineData[stage] || [];
        return `
          <div class="kanban-col" data-stage="${stage}"
               ondragover="onDragOver(event)" ondrop="onDropCol(event,this)">
            <div class="kanban-col-header">
              ${colMeta[stage].label}
              <span class="kanban-count">${cards.length}</span>
            </div>
            ${cards.map((c,i) => cardHTML(c, stage, i)).join('')}
          </div>`;
    }).join('');
}

function onDragStart(e) {
    dragSrc = {
        stage: e.currentTarget.dataset.stage,
        idx:   +e.currentTarget.dataset.idx,
        appId: +e.currentTarget.dataset.appid,
    };
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}
function onDragOver(e) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }

function onDropCol(e, col) {
    e.preventDefault();
    if (!dragSrc) return;
    const targetStage = col.dataset.stage;
    if (targetStage === dragSrc.stage) return;
    // Lưu vào CVMS
    CVMS.updatePipelineStage(dragSrc.appId, targetStage);
    dragSrc = null;
    renderKanban();
    showAdminToast(`✅ Đã chuyển sang: ${colMeta[targetStage].label}`);
}

function onDrop(e, card) {
    e.preventDefault(); e.stopPropagation();
    if (!dragSrc) return;
    const targetStage = card.dataset.stage;
    if (targetStage !== dragSrc.stage) {
        CVMS.updatePipelineStage(dragSrc.appId, targetStage);
    }
    dragSrc = null;
    renderKanban();
}

function showAdminToast(msg) {
    let t = document.getElementById('admin-toast');
    if (!t) { t=document.createElement('div'); t.id='admin-toast'; t.style.cssText='position:fixed;bottom:24px;right:24px;background:var(--accent);color:#fff;padding:10px 18px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;opacity:0;transition:opacity .3s'; document.body.appendChild(t); }
    t.textContent=msg; t.style.opacity='1';
    setTimeout(()=>t.style.opacity='0', 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    renderKanban();
    if (typeof initNotifUI === 'function') initNotifUI('admin');
});
