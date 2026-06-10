/* sidebar.js — highlight nav link active */
(function () {
    const page = location.pathname.split('/').pop();
    document.querySelectorAll('.nav-item[data-page]').forEach(el => {
        if (el.dataset.page === page) el.classList.add('active');
    });
})();
