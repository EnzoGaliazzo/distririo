// ===== Utilitario de busca: ignora maiusculas/minusculas e acentos =====
// Assim "marata"/"agua"/"acucar" encontram "Maratá"/"água"/"açúcar".
function normalizeSearch(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

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

// ===== Catálogo de produtos (usado nas sugestões de busca) =====
var PRODUCTS = [
    { name: "Trident & Chiclets", category: "Doces & Chocolates", img: "assets/produtos/trident.jpg", keywords: "trident chiclets gomas de mascar 5s 14s max xsenses mondelez" },
    { name: "Halls", category: "Doces & Chocolates", img: "assets/produtos/halls.jpg", keywords: "halls balas extra forte mondelez" },
    { name: "Bubbaloo", category: "Doces & Chocolates", img: "assets/produtos/bubbaloo.jpg", keywords: "bubbaloo chicletes balas tutti-frutti mondelez" },
    { name: "Tang", category: "Doces & Chocolates", img: "assets/produtos/tang.jpg", keywords: "tang refresco em po uva tangerina maracuja guarana mondelez" },
    { name: "Oreo", category: "Doces & Chocolates", img: "assets/produtos/oreo.jpg", keywords: "oreo biscoitos original chocolate mini mondelez" },
    { name: "Club Social", category: "Doces & Chocolates", img: "assets/produtos/clubsocial.jpg", keywords: "club social biscoitos snacks mondelez" },
    { name: "Lacta", category: "Doces & Chocolates", img: "assets/produtos/lacta.jpg", keywords: "lacta chocolates bis 5star sonho de valsa ouro branco mondelez" },
    { name: "BALY Brasil", category: "Bebidas & Isotônicos", img: "assets/produtos/baly.jpg", keywords: "baly energetico isotonico zero acucar sonic" },
    { name: "Aqua Coco", category: "Água de Coco", img: "assets/produtos/aquacoco.jpg", keywords: "aqua coco agua de coco integral turma da monica" },
    { name: "Sucos Sumo", category: "Sucos & Néctares", img: "assets/produtos/sumo.jpg", keywords: "sucos sumo frutas norte nordeste" },
    { name: "Maratá Néctar", category: "Sucos & Néctares", img: "assets/produtos/marata-nectar.jpg", keywords: "marata nectar mara-tinho fruta" },
    { name: "Maratá Molhos", category: "Molhos & Temperos", img: "assets/produtos/marata-molhos.jpg", keywords: "marata gota flocao de milho molho" },
    { name: "Rivoli", category: "Azeitonas", img: "assets/produtos/rivoli.jpg", keywords: "rivoli azeitonas verdes pretas saches potes baldes" },
    { name: "Trio", category: "Barras & Snacks", img: "assets/produtos/trio.jpg", keywords: "trio barras de cereais display flowpack zero acucar" },
    { name: "Banana Brasil", category: "Barras & Snacks", img: "assets/produtos/bananabrasil.jpg", keywords: "banana brasil passa supino protein nuts minions" },
    { name: "Kobber", category: "Cereais & Granola", img: "assets/produtos/kobber.jpg", keywords: "kobber granola cereais integrais fibras" },
    { name: "Baldoni", category: "Geleias & Mel", img: "assets/produtos/baldoni.jpg", keywords: "baldoni geleias de frutas mel" },
    { name: "ACE", category: "Produtos de Limpeza", img: "assets/produtos/ace.jpg", keywords: "ace detergente em po p&g" },
    { name: "Espumil", category: "Produtos de Limpeza", img: "assets/produtos/espumil.jpg", keywords: "espumil detergentes liquidos sabao roupas" }
];

// ===== Sugestões de busca (dropdown no cabeçalho) =====
(function () {
    // Na loja.html a busca já filtra a grade de produtos em tempo real,
    // então o dropdown de sugestões só faz sentido nas outras páginas.
    if (document.querySelector('.product-card[data-name]')) return;

    document.addEventListener('DOMContentLoaded', function () {
        var wrap = document.querySelector('.header-search-wrap');
        if (!wrap) return;

        var input = wrap.querySelector('input');
        var list = wrap.querySelector('.search-suggestions');
        if (!input || !list) return;

        var activeIndex = -1;

        function updateActive(items) {
            items.forEach(function (el, i) {
                el.classList.toggle('is-highlighted', i === activeIndex);
            });
            if (activeIndex >= 0) {
                items[activeIndex].scrollIntoView({ block: 'nearest' });
            }
        }

        function renderSuggestions(term) {
            var t = normalizeSearch(term.trim());
            list.innerHTML = '';
            activeIndex = -1;

            if (!t) {
                list.hidden = true;
                return;
            }

            var allMatches = PRODUCTS.filter(function (p) {
                return normalizeSearch(p.name + ' ' + p.category + ' ' + p.keywords).indexOf(t) !== -1;
            });
            var matches = allMatches.slice(0, 6);

            if (matches.length === 0) {
                var empty = document.createElement('li');
                empty.className = 'search-suggestion-empty';
                empty.textContent = 'Nenhum produto encontrado para "' + term.trim() + '"';
                list.appendChild(empty);
                list.hidden = false;
                return;
            }

            matches.forEach(function (p) {
                var li = document.createElement('li');
                var a = document.createElement('a');
                a.className = 'search-suggestion';
                a.href = 'loja.html?q=' + encodeURIComponent(p.name);

                var img = document.createElement('img');
                img.src = p.img;
                img.alt = '';

                var info = document.createElement('div');
                info.className = 'search-suggestion-info';

                var nameEl = document.createElement('div');
                nameEl.className = 'search-suggestion-name';
                nameEl.textContent = p.name;

                var catEl = document.createElement('div');
                catEl.className = 'search-suggestion-category';
                catEl.textContent = p.category;

                info.appendChild(nameEl);
                info.appendChild(catEl);
                a.appendChild(img);
                a.appendChild(info);
                li.appendChild(a);
                list.appendChild(li);
            });

            if (allMatches.length > matches.length) {
                var moreLi = document.createElement('li');
                var moreA = document.createElement('a');
                moreA.className = 'search-suggestion search-suggestion-more';
                moreA.href = 'loja.html?q=' + encodeURIComponent(term.trim());
                moreA.textContent = 'Ver todos os ' + allMatches.length + ' resultados para "' + term.trim() + '"';
                moreLi.appendChild(moreA);
                list.appendChild(moreLi);
            }

            list.hidden = false;
        }

        input.addEventListener('input', function () {
            renderSuggestions(input.value);
        });

        input.addEventListener('focus', function () {
            if (input.value.trim()) renderSuggestions(input.value);
        });

        input.addEventListener('keydown', function (e) {
            var items = list.querySelectorAll('.search-suggestion');
            if (list.hidden || items.length === 0) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = Math.min(activeIndex + 1, items.length - 1);
                updateActive(items);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = Math.max(activeIndex - 1, 0);
                updateActive(items);
            } else if (e.key === 'Enter' && activeIndex >= 0) {
                e.preventDefault();
                items[activeIndex].click();
            } else if (e.key === 'Escape') {
                list.hidden = true;
            }
        });

        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) {
                list.hidden = true;
            }
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
        var t = normalizeSearch(term.trim());
        var visibleCount = 0;

        document.querySelectorAll('.category-section').forEach(function (section) {
            var sectionHasMatch = false;
            section.querySelectorAll('.product-card[data-name]').forEach(function (card) {
                var haystack = normalizeSearch(card.getAttribute('data-name') + ' ' + card.getAttribute('data-desc'));
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
