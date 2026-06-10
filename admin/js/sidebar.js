/* ═══════════════════════════════════════
   sidebar.js — Highlight active nav link
   based on current page filename
═══════════════════════════════════════ */
(function () {
  const page = location.pathname.split('/').pop(); // e.g. "jobs.html"
  document.querySelectorAll('.nav-item[data-page]').forEach(el => {
    if (el.dataset.page === page) el.classList.add('active');
  });
})();
