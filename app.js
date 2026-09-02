// ===== Mobile nav toggle =====
document.addEventListener('DOMContentLoaded', function () {
    var navToggle = document.querySelector('.nav-toggle');
    var headerNav = document.querySelector('.header-nav');

    if (navToggle && headerNav) {
        navToggle.addEventListener('click', function () {
            var isOpen = headerNav.classList.toggle('is-open');
            navToggle.classList.toggle('is-open', isOpen);
            navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });

        headerNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                headerNav.classList.remove('is-open');
                navToggle.classList.remove('is-open');
                navToggle.setAttribute('aria-expanded', 'false');
            });
        });
    }
});

// ===== Cart =====
(function () {
    var CART_KEY = 'distririo_cart';
    var WHATSAPP_NUMBER = '5521992111843';

    function getCart() {
        try {
            var raw = localStorage.getItem(CART_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch (e) {
            return [];
        }
    }

    function saveCart(cart) {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch (e) {
            /* localStorage unavailable, cart stays in-memory for this page view */
        }
    }

    function addToCart(name) {
        var cart = getCart();
        var item = cart.find(function (i) { return i.name === name; });
        if (item) {
            item.qty += 1;
        } else {
            cart.push({ name: name, qty: 1 });
        }
        saveCart(cart);
        renderCart();
    }

    function changeQty(name, delta) {
        var cart = getCart();
        var item = cart.find(function (i) { return i.name === name; });
        if (!item) return;
        item.qty += delta;
        if (item.qty <= 0) {
            cart = cart.filter(function (i) { return i.name !== name; });
        }
        saveCart(cart);
        renderCart();
    }

    function removeItem(name) {
        var cart = getCart().filter(function (i) { return i.name !== name; });
        saveCart(cart);
        renderCart();
    }

    function renderCart() {
        var cart = getCart();
        var total = cart.reduce(function (sum, i) { return sum + i.qty; }, 0);

        document.querySelectorAll('.cart-count').forEach(function (el) {
            el.textContent = String(total);
            el.hidden = total === 0;
        });

        var list = document.getElementById('cartItems');
        var empty = document.getElementById('cartEmpty');
        if (list && empty) {
            list.innerHTML = '';
            if (cart.length === 0) {
                list.hidden = true;
                empty.hidden = false;
            } else {
                list.hidden = false;
                empty.hidden = true;
                cart.forEach(function (item) {
                    var li = document.createElement('li');
                    li.className = 'cart-item';

                    var nameSpan = document.createElement('span');
                    nameSpan.className = 'cart-item-name';
                    nameSpan.textContent = item.name;

                    var controls = document.createElement('div');
                    controls.className = 'cart-item-controls';

                    var decBtn = document.createElement('button');
                    decBtn.type = 'button';
                    decBtn.className = 'qty-btn';
                    decBtn.textContent = '-';
                    decBtn.setAttribute('aria-label', 'Diminuir quantidade de ' + item.name);
                    decBtn.addEventListener('click', function () { changeQty(item.name, -1); });

                    var qtySpan = document.createElement('span');
                    qtySpan.className = 'cart-item-qty';
                    qtySpan.textContent = String(item.qty);

                    var incBtn = document.createElement('button');
                    incBtn.type = 'button';
                    incBtn.className = 'qty-btn';
                    incBtn.textContent = '+';
                    incBtn.setAttribute('aria-label', 'Aumentar quantidade de ' + item.name);
                    incBtn.addEventListener('click', function () { changeQty(item.name, 1); });

                    var removeBtn = document.createElement('button');
                    removeBtn.type = 'button';
                    removeBtn.className = 'cart-item-remove';
                    removeBtn.innerHTML = '&times;';
                    removeBtn.setAttribute('aria-label', 'Remover ' + item.name);
                    removeBtn.addEventListener('click', function () { removeItem(item.name); });

                    controls.appendChild(decBtn);
                    controls.appendChild(qtySpan);
                    controls.appendChild(incBtn);
                    controls.appendChild(removeBtn);

                    li.appendChild(nameSpan);
                    li.appendChild(controls);
                    list.appendChild(li);
                });
            }
        }

        var checkoutBtn = document.getElementById('cartCheckout');
        if (checkoutBtn) {
            if (cart.length === 0) {
                checkoutBtn.setAttribute('aria-disabled', 'true');
                checkoutBtn.removeAttribute('href');
            } else {
                checkoutBtn.removeAttribute('aria-disabled');
                var lines = cart.map(function (i) { return '- ' + i.qty + 'x ' + i.name; }).join('\n');
                var msg = 'Olá! Gostaria de fazer o seguinte pedido:\n' + lines + '\n\nAguardo o retorno, obrigado!';
                checkoutBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
            }
        }
    }

    function openCart() {
        var drawer = document.getElementById('cartDrawer');
        var overlay = document.getElementById('cartOverlay');
        if (drawer) drawer.classList.add('is-open');
        if (overlay) overlay.classList.add('is-open');
    }

    function closeCart() {
        var drawer = document.getElementById('cartDrawer');
        var overlay = document.getElementById('cartOverlay');
        if (drawer) drawer.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-open');
    }

    document.addEventListener('DOMContentLoaded', function () {
        renderCart();

        document.querySelectorAll('.cart-toggle').forEach(function (btn) {
            btn.addEventListener('click', openCart);
        });

        var closeBtn = document.getElementById('cartClose');
        if (closeBtn) closeBtn.addEventListener('click', closeCart);

        var overlay = document.getElementById('cartOverlay');
        if (overlay) overlay.addEventListener('click', closeCart);

        document.querySelectorAll('.add-to-cart').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var name = btn.getAttribute('data-name');
                if (!name) return;
                addToCart(name);
                openCart();
                btn.classList.add('is-added');
                var original = btn.textContent;
                btn.textContent = 'Adicionado!';
                setTimeout(function () {
                    btn.classList.remove('is-added');
                    btn.textContent = original;
                }, 1200);
            });
        });
    });
})();

// ===== Loja: busca e filtro por categoria =====
document.addEventListener('DOMContentLoaded', function () {
    var searchInput = document.querySelector('.header-search input');
    var params = new URLSearchParams(window.location.search);
    var query = (params.get('q') || '').trim().toLowerCase();

    if (searchInput && query) {
        searchInput.value = query;
    }

    var cards = document.querySelectorAll('.product-card[data-name]');
    if (cards.length === 0) return;

    function applyFilter(term) {
        var t = term.trim().toLowerCase();
        var visibleCount = 0;

        document.querySelectorAll('.category-section').forEach(function (section) {
            var sectionHasMatch = false;
            section.querySelectorAll('.product-card[data-name]').forEach(function (card) {
                var haystack = (card.getAttribute('data-name') + ' ' + card.getAttribute('data-desc')).toLowerCase();
                var match = !t || haystack.indexOf(t) !== -1;
                card.hidden = !match;
                if (match) {
                    sectionHasMatch = true;
                    visibleCount++;
                }
            });
            section.hidden = !sectionHasMatch;
        });

        var noResults = document.getElementById('noResults');
        if (noResults) noResults.hidden = visibleCount !== 0;
    }

    if (query) {
        applyFilter(query);
    }

    // From here on we know we're on loja.html (it's the only page with product cards)
    var form = document.querySelector('.header-search');
    if (form) {
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            applyFilter(searchInput.value);
            history.replaceState(null, '', 'loja.html' + (searchInput.value ? '?q=' + encodeURIComponent(searchInput.value) : ''));
        });
    }
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            applyFilter(searchInput.value);
        });
    }
});
