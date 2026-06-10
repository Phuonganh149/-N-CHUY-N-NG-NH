/* ═══════════════════════════════════════
   settings.js
═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Toggle switches
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => t.classList.toggle('off'));
  });

  // Edit template buttons
  document.querySelectorAll('[data-template]').forEach(btn => {
    btn.addEventListener('click', () => {
      alert(`Chỉnh sửa template: "${btn.dataset.template}"`);
    });
  });
});
