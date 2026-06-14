/* ═══════════════════════════════════════
   sidebar.js — Highlight active nav link
   based on current page filename
═══════════════════════════════════════ */
(function () {
  const removedAdminPages = new Set(['jobs.html', 'candidates.html', 'pipeline.html']);
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (removedAdminPages.has(el.dataset.page)) el.remove();
  });

  const page = location.pathname.split('/').pop(); // e.g. "jobs.html"
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (el.dataset.page === page) el.classList.add('active');
  });
})();
