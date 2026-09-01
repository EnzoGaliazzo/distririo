document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.submenu-toggle').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var item = btn.closest('.has-submenu');
            if (!item) return;
            var isOpen = item.classList.toggle('is-open');
            btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    });

    var toggle = document.querySelector('.nav-toggle');
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.sidebar-overlay');

    if (!toggle || !sidebar) return;

    function closeSidebar() {
        sidebar.classList.remove('is-open');
        toggle.classList.remove('is-open');
        overlay.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    }

    function openSidebar() {
        sidebar.classList.add('is-open');
        toggle.classList.add('is-open');
        overlay.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
    }

    toggle.addEventListener('click', function () {
        if (sidebar.classList.contains('is-open')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }

    sidebar.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeSidebar);
    });
});
