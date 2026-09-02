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
    { name: 'Chocolate 5 Star', category: '5Star', img: 'assets/produtos/mondelez/5star__chocolate-5-star.jpg', keywords: 'chocolate 5 star 5star mondelez' },
    { name: 'Wafer Recheado Amandita Sabor Chocolate', category: 'Amandita', img: 'assets/produtos/mondelez/amandita__wafer-recheado-amandita-sabor-chocolate.jpg', keywords: 'wafer recheado amandita sabor chocolate amandita mondelez' },
    { name: 'Biscoito BelVita Cacau e Cereais Multipack', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-cacau-e-cereais-multipack.jpg', keywords: 'biscoito belvita cacau e cereais multipack belvita mondelez' },
    { name: 'Biscoito BelVita Leite e Aveia Embalagem Econômica', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-leite-e-aveia-embalagem-economica.jpg', keywords: 'biscoito belvita leite e aveia embalagem econômica belvita mondelez' },
    { name: 'Biscoito BelVita Leite e Aveia Multipack', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-leite-e-aveia-multipack.jpg', keywords: 'biscoito belvita leite e aveia multipack belvita mondelez' },
    { name: 'Biscoito BelVita Maçã e Canela Multipack', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-maca-e-canela-multipack.jpg', keywords: 'biscoito belvita maçã e canela multipack belvita mondelez' },
    { name: 'Biscoito BelVita Mel e Cacau', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-mel-e-cacau.jpg', keywords: 'biscoito belvita mel e cacau belvita mondelez' },
    { name: 'Biscoito BelVita Mel e Cacau Embalagem Econômica', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-mel-e-cacau-embalagem-economica.jpg', keywords: 'biscoito belvita mel e cacau embalagem econômica belvita mondelez' },
    { name: 'Biscoito BelVita Mel e Cacau Multipack', category: 'belVita', img: 'assets/produtos/mondelez/belvita__biscoito-belvita-mel-e-cacau-multipack.jpg', keywords: 'biscoito belvita mel e cacau multipack belvita mondelez' },
    { name: 'Bis Xtra ao Leite', category: 'Bis', img: 'assets/produtos/mondelez/bis__bis-xtra-ao-leite.jpg', keywords: 'bis xtra ao leite bis mondelez' },
    { name: 'Bis Xtra Black', category: 'Bis', img: 'assets/produtos/mondelez/bis__bis-xtra-black.jpg', keywords: 'bis xtra black bis mondelez' },
    { name: 'Bis Xtra Oreo', category: 'Bis', img: 'assets/produtos/mondelez/bis__bis-xtra-oreo.jpg', keywords: 'bis xtra oreo bis mondelez' },
    { name: 'Chocolate Bis Black', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-black.jpg', keywords: 'chocolate bis black bis mondelez' },
    { name: 'Chocolate Bis Branco Laka', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-branco-laka.jpg', keywords: 'chocolate bis branco laka bis mondelez' },
    { name: 'Chocolate Bis Limão', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-limao.jpg', keywords: 'chocolate bis limão bis mondelez' },
    { name: 'Chocolate Bis Original ao Leite', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-original-ao-leite.jpg', keywords: 'chocolate bis original ao leite bis mondelez' },
    { name: 'Chocolate Bis Sortidos Pacote', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-sortidos-pacote.jpg', keywords: 'chocolate bis sortidos pacote bis mondelez' },
    { name: 'Chocolate Bis Xtra ao Leite', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-xtra-ao-leite.jpg', keywords: 'chocolate bis xtra ao leite bis mondelez' },
    { name: 'Chocolate Bis Xtra Black', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-xtra-black.jpg', keywords: 'chocolate bis xtra black bis mondelez' },
    { name: 'Chocolate Bis Xtra Branco', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-xtra-branco.jpg', keywords: 'chocolate bis xtra branco bis mondelez' },
    { name: 'Chocolate Bis Xtra Oreo', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bis-xtra-oreo.jpg', keywords: 'chocolate bis xtra oreo bis mondelez' },
    { name: 'Chocolate Bisão Branco Laka', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bisao-branco-laka.jpg', keywords: 'chocolate bisão branco laka bis mondelez' },
    { name: 'Chocolate Bisão Original ao Leite', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-bisao-original-ao-leite.jpg', keywords: 'chocolate bisão original ao leite bis mondelez' },
    { name: 'Chocolate Branco Bis Oreo', category: 'Bis', img: 'assets/produtos/mondelez/bis__chocolate-branco-bis-oreo.jpg', keywords: 'chocolate branco bis oreo bis mondelez' },
    { name: 'Bala Macia Bubbaloo Citric Blueberry Mix', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__bala-macia-bubbaloo-citric-blueberry-mix.jpg', keywords: 'bala macia bubbaloo citric blueberry mix bubbaloo mondelez' },
    { name: 'Bala Macia Bubbaloo Mix', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__bala-macia-bubbaloo-mix.jpg', keywords: 'bala macia bubbaloo mix bubbaloo mondelez' },
    { name: 'Bala Macia Bubbaloo Mix Azedinha', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__bala-macia-bubbaloo-mix-azedinha.jpg', keywords: 'bala macia bubbaloo mix azedinha bubbaloo mondelez' },
    { name: 'Bala Macia Bubbaloo Morango', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__bala-macia-bubbaloo-morango.jpg', keywords: 'bala macia bubbaloo morango bubbaloo mondelez' },
    { name: 'Bala Macia Bubbaloo Morango Azedinha', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__bala-macia-bubbaloo-morango-azedinha.jpg', keywords: 'bala macia bubbaloo morango azedinha bubbaloo mondelez' },
    { name: 'Bala Macia Bubbaloo Tutti-Frutti', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__bala-macia-bubbaloo-tutti-frutti.jpg', keywords: 'bala macia bubbaloo tutti-frutti bubbaloo mondelez' },
    { name: 'Chiclete Bubbalo Tutti-Frutti', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__chiclete-bubbalo-tutti-frutti.jpg', keywords: 'chiclete bubbalo tutti-frutti bubbaloo mondelez' },
    { name: 'Chiclete Bubbaloo Hortelã', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__chiclete-bubbaloo-hortela.jpg', keywords: 'chiclete bubbaloo hortelã bubbaloo mondelez' },
    { name: 'Chiclete Bubbaloo Morango', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__chiclete-bubbaloo-morango.jpg', keywords: 'chiclete bubbaloo morango bubbaloo mondelez' },
    { name: 'Chiclete Bubbaloo Tutti-Frutti', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__chiclete-bubbaloo-tutti-frutti.jpg', keywords: 'chiclete bubbaloo tutti-frutti bubbaloo mondelez' },
    { name: 'Chiclete Bubbaloo Uva', category: 'Bubbaloo', img: 'assets/produtos/mondelez/bubbaloo__chiclete-bubbaloo-uva.jpg', keywords: 'chiclete bubbaloo uva bubbaloo mondelez' },
    { name: 'Goma de mascar Chiclets Hortelã', category: 'Chiclets', img: 'assets/produtos/mondelez/chiclets__goma-de-mascar-chiclets-hortela.jpg', keywords: 'goma de mascar chiclets hortelã chiclets mondelez' },
    { name: 'Goma de mascar Chiclets Tutti-Frutti', category: 'Chiclets', img: 'assets/produtos/mondelez/chiclets__goma-de-mascar-chiclets-tutti-frutti.jpg', keywords: 'goma de mascar chiclets tutti-frutti chiclets mondelez' },
    { name: 'Biscoito Recheado Chocolícia', category: 'Chocolícia', img: 'assets/produtos/mondelez/chocolicia__biscoito-recheado-chocolicia.jpg', keywords: 'biscoito recheado chocolícia chocolícia mondelez' },
    { name: 'Refresco em Pó Clight sabor Abacaxi', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-abacaxi.jpg', keywords: 'refresco em pó clight sabor abacaxi clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Laranja', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-laranja.jpg', keywords: 'refresco em pó clight sabor laranja clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Limonada', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-limonada.jpg', keywords: 'refresco em pó clight sabor limonada clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Maracujá', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-maracuja.jpg', keywords: 'refresco em pó clight sabor maracujá clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Morango', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-morango.jpg', keywords: 'refresco em pó clight sabor morango clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Pink Lemonade', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-pink-lemonade.jpg', keywords: 'refresco em pó clight sabor pink lemonade clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Tangerina', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-tangerina.jpg', keywords: 'refresco em pó clight sabor tangerina clight mondelez' },
    { name: 'Refresco em Pó Clight sabor Uva', category: 'Clight', img: 'assets/produtos/mondelez/clight__refresco-em-po-clight-sabor-uva.jpg', keywords: 'refresco em pó clight sabor uva clight mondelez' },
    { name: 'Biscoito Salgado Club Social Recheado Queijo, Tomate e Manjericão Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salago-club-social-recheado-queijo-tomate-e-manjericao-multipack.jpg', keywords: 'biscoito salgado club social recheado queijo, tomate e manjericão multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Bacon e Provolone', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-bacon-e-provolone.jpg', keywords: 'biscoito salgado club social bacon e provolone club social mondelez' },
    { name: 'Biscoito Salgado Club Social Cebola Caramelizada Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-cebola-caramelizada-multipack.jpg', keywords: 'biscoito salgado club social cebola caramelizada multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Cebola com Sour Cream Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-cebola-com-sour-cream-multipack.jpg', keywords: 'biscoito salgado club social cebola com sour cream multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Crostini Original', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-crostini-original.jpg', keywords: 'biscoito salgado club social crostini original club social mondelez' },
    { name: 'Biscoito Salgado Club Social Crostini Queijo Parmesão e Vegetais', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-crostini-queijo-parmesao-e-vegetais.jpg', keywords: 'biscoito salgado club social crostini queijo parmesão e vegetais club social mondelez' },
    { name: 'Biscoito Salgado Club Social Crostini Tomate Seco e Salsinha', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-crostini-tomate-seco-e-salsinha.jpg', keywords: 'biscoito salgado club social crostini tomate seco e salsinha club social mondelez' },
    { name: 'Biscoito Salgado Club Social Integral Tradicional - Embalagem Econômica', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-integral-tradicional-embalagem-economica.jpg', keywords: 'biscoito salgado club social integral tradicional - embalagem econômica club social mondelez' },
    { name: 'Biscoito Salgado Club Social Integral Tradicional Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-integral-tradicional-multipack.jpg', keywords: 'biscoito salgado club social integral tradicional multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Mix de Queijos Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-mix-de-queijos-multipack.jpg', keywords: 'biscoito salgado club social mix de queijos multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Original Embalagem Econômica', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-original-embalagem-economica.jpg', keywords: 'biscoito salgado club social original embalagem econômica club social mondelez' },
    { name: 'Biscoito Salgado Club Social Original Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-original-multipack.jpg', keywords: 'biscoito salgado club social original multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Pão de Alho Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-pao-de-alho-multipack.jpg', keywords: 'biscoito salgado club social pão de alho multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Pizza Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-pizza-multipack.jpg', keywords: 'biscoito salgado club social pizza multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Presunto', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-presunto.jpg', keywords: 'biscoito salgado club social presunto club social mondelez' },
    { name: 'Biscoito Salgado Club Social Presunto - Embalagem Econômica', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-presunto-embalagem-economica.jpg', keywords: 'biscoito salgado club social presunto - embalagem econômica club social mondelez' },
    { name: 'Biscoito Salgado Club Social Presunto Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-presunto-multipack.jpg', keywords: 'biscoito salgado club social presunto multipack club social mondelez' },
    { name: 'Biscoito Salgado Club Social Recheado Requeijão Multipack', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__biscoito-salgado-club-social-recheado-requeijao-multipack.jpg', keywords: 'biscoito salgado club social recheado requeijão multipack club social mondelez' },
    { name: 'Salgadinho Club Social Snack Barbecue', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__salgadinho-club-social-snack-barbecue.webp', keywords: 'salgadinho club social snack barbecue club social mondelez' },
    { name: 'Salgadinho Club Social Snack Cebola e Salsa', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__salgadinho-club-social-snack-cebola-e-salsa.jpg', keywords: 'salgadinho club social snack cebola e salsa club social mondelez' },
    { name: 'Salgadinho Club Social Snack Churras na Brasa', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__salgadinho-club-social-snack-churras-na-brasa.jpg', keywords: 'salgadinho club social snack churras na brasa club social mondelez' },
    { name: 'Salgadinho Club Social Snack Pizza', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__salgadinho-club-social-snack-pizza.jpg', keywords: 'salgadinho club social snack pizza club social mondelez' },
    { name: 'Salgadinho Club Social Snack Queijo Parmesão', category: 'Club Social', img: 'assets/produtos/mondelez/club-social__salgadinho-club-social-snack-queijo-parmesao.jpg', keywords: 'salgadinho club social snack queijo parmesão club social mondelez' },
    { name: 'Chocolate Lacta ao Leite Diamante Negro', category: 'Diamante Negro', img: 'assets/produtos/mondelez/diamante-negro__chocolate-lacta-ao-leite-diamante-negro.jpg', keywords: 'chocolate lacta ao leite diamante negro diamante negro mondelez' },
    { name: 'Chocolate Lacta ao Leite Diamante Negro Laka', category: 'Diamante Negro', img: 'assets/produtos/mondelez/diamante-negro__chocolate-lacta-ao-leite-diamante-negro-laka.jpg', keywords: 'chocolate lacta ao leite diamante negro laka diamante negro mondelez' },
    { name: 'Ovo de Páscoa Diamante Negro', category: 'Diamante Negro', img: 'assets/produtos/mondelez/diamante-negro__ovo-de-pascoa-diamante-negro.jpg', keywords: 'ovo de páscoa diamante negro diamante negro mondelez' },
    { name: 'Refresco em Pó Fresh sabor Abacaxi', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-abacaxi.jpg', keywords: 'refresco em pó fresh sabor abacaxi fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Caju', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-caju.jpg', keywords: 'refresco em pó fresh sabor caju fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Carambola', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-carambola.jpg', keywords: 'refresco em pó fresh sabor carambola fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Guaraná', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-guarana.jpg', keywords: 'refresco em pó fresh sabor guaraná fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Laranja', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-laranja.jpg', keywords: 'refresco em pó fresh sabor laranja fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Limão', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-limao.jpg', keywords: 'refresco em pó fresh sabor limão fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Limonada Suiça', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-limonada-suica.jpg', keywords: 'refresco em pó fresh sabor limonada suiça fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Manga', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-manga.jpg', keywords: 'refresco em pó fresh sabor manga fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Maracujá', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-maracuja.jpg', keywords: 'refresco em pó fresh sabor maracujá fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Mate Limão', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-mate-limao.jpg', keywords: 'refresco em pó fresh sabor mate limão fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Morango', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-morango.jpg', keywords: 'refresco em pó fresh sabor morango fresh mondelez' },
    { name: 'Refresco em Pó Fresh sabor Uva', category: 'Fresh', img: 'assets/produtos/mondelez/fresh__refresco-em-po-fresh-sabor-uva.jpg', keywords: 'refresco em pó fresh sabor uva fresh mondelez' },
    { name: 'Bala Halls Blueberry', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-blueberry.jpg', keywords: 'bala halls blueberry halls mondelez' },
    { name: 'Bala Halls Cereja', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-cereja.jpg', keywords: 'bala halls cereja halls mondelez' },
    { name: 'Bala Halls Extra Forte', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-extra-forte.jpg', keywords: 'bala halls extra forte halls mondelez' },
    { name: 'Bala Halls Melancia', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-melancia.jpg', keywords: 'bala halls melancia halls mondelez' },
    { name: 'Bala Halls Menta', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-menta.jpg', keywords: 'bala halls menta halls mondelez' },
    { name: 'Bala Halls Menta Prata', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-menta-prata.jpg', keywords: 'bala halls menta prata halls mondelez' },
    { name: 'Bala Halls Mentol', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-mentol.jpg', keywords: 'bala halls mentol halls mondelez' },
    { name: 'Bala Halls Morango', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-morango.jpg', keywords: 'bala halls morango halls mondelez' },
    { name: 'Bala Halls Uva Verde', category: 'Halls', img: 'assets/produtos/mondelez/halls__bala-halls-uva-verde.jpg', keywords: 'bala halls uva verde halls mondelez' },
    { name: 'Biscoito Lacta Cookie ao Leite', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__biscoito-lacta-cookie-ao-leite.jpg', keywords: 'biscoito lacta cookie ao leite lacta mondelez' },
    { name: 'Biscoito Lacta Cookie Laka', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__biscoito-lacta-cookie-laka.jpg', keywords: 'biscoito lacta cookie laka lacta mondelez' },
    { name: 'Caixa de Variedades Favoritos Lacta', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__caixa-de-variedades-favoritos-lacta.jpg', keywords: 'caixa de variedades favoritos lacta lacta mondelez' },
    { name: 'Chocolate Ao Leite E Chocolate Branco Milka Bubbly', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-ao-leite-e-chocolate-branco-milka-bubbly.jpg', keywords: 'chocolate ao leite e chocolate branco milka bubbly lacta mondelez' },
    { name: 'Chocolate Ao Leite Milka Bubbly', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-ao-leite-milka-bubbly.jpg', keywords: 'chocolate ao leite milka bubbly lacta mondelez' },
    { name: 'Chocolate ao Leite Recheio Caramelo Lacta Recheados', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-ao-leite-recheio-caramelo-lacta-recheados.jpg', keywords: 'chocolate ao leite recheio caramelo lacta recheados lacta mondelez' },
    { name: 'Chocolate branco Lacta Laka Oreo', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-branco-lacta-laka-oreo.jpg', keywords: 'chocolate branco lacta laka oreo lacta mondelez' },
    { name: 'Chocolate Branco Recheio Caramelo Lacta Laka Recheados', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-branco-recheio-caramelo-lacta-laka-recheados.jpg', keywords: 'chocolate branco recheio caramelo lacta laka recheados lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite.jpg', keywords: 'chocolate lacta ao leite lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite com Amendoim Shot', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite-com-amendoim-shot.jpg', keywords: 'chocolate lacta ao leite com amendoim shot lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite com Recheio de Oreo', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite-com-recheio-de-oreo.jpg', keywords: 'chocolate lacta ao leite com recheio de oreo lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite com Recheio Sonho de Valsa', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite-com-recheio-sonho-de-valsa.jpg', keywords: 'chocolate lacta ao leite com recheio sonho de valsa lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite Diamante Negro', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite-diamante-negro.jpg', keywords: 'chocolate lacta ao leite diamante negro lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite Diamante Negro Laka', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite-diamante-negro-laka.jpg', keywords: 'chocolate lacta ao leite diamante negro laka lacta mondelez' },
    { name: 'Chocolate Lacta ao Leite Oreo Cookies', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-ao-leite-oreo-cookies.jpg', keywords: 'chocolate lacta ao leite oreo cookies lacta mondelez' },
    { name: 'Chocolate Lacta Branco com Amendoim Shot', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-branco-com-amendoim-shot.jpg', keywords: 'chocolate lacta branco com amendoim shot lacta mondelez' },
    { name: 'Chocolate Lacta Branco Laka', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-branco-laka.jpg', keywords: 'chocolate lacta branco laka lacta mondelez' },
    { name: 'Chocolate Lacta Diamante Negro Recheado', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-diamante-negro-recheado.jpg', keywords: 'chocolate lacta diamante negro recheado lacta mondelez' },
    { name: 'Chocolate Lacta Intense Amargo 60% Cacau Café', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-amargo-60-cacau-cafe.jpg', keywords: 'chocolate lacta intense amargo 60% cacau café lacta mondelez' },
    { name: 'Chocolate Lacta Intense Amargo 60% Cacau Mix de Nuts', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-amargo-60-cacau-mix-de-nuts.jpg', keywords: 'chocolate lacta intense amargo 60% cacau mix de nuts lacta mondelez' },
    { name: 'Chocolate Lacta Intense Amargo 60% Cacau Original', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-amargo-60-cacau-original.jpg', keywords: 'chocolate lacta intense amargo 60% cacau original lacta mondelez' },
    { name: 'Chocolate Lacta Intense Amargo 70% Cacau Original', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-amargo-70-cacau-original.jpg', keywords: 'chocolate lacta intense amargo 70% cacau original lacta mondelez' },
    { name: 'Chocolate Lacta Intense Meio Amargo 40% Cacau Amêndoas e Caramelo Salgado', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-meio-amargo-40-cacau-amendoas-e-caramelo-salgado.jpg', keywords: 'chocolate lacta intense meio amargo 40% cacau amêndoas e caramelo salgado lacta mondelez' },
    { name: 'Chocolate Lacta Intense Meio Amargo 40% Cacau Amêndoas e Framboesa', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-meio-amargo-40-cacau-amendoas-e-framboesa.jpg', keywords: 'chocolate lacta intense meio amargo 40% cacau amêndoas e framboesa lacta mondelez' },
    { name: 'Chocolate Lacta Intense Meio Amargo 40% Cacau Avelã e Crocante de Cacau', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-meio-amargo-40-cacau-avela-e-crocante-de-cacau.jpg', keywords: 'chocolate lacta intense meio amargo 40% cacau avelã e crocante de cacau lacta mondelez' },
    { name: 'Chocolate Lacta Intense Meio Amargo 40% Cacau Original', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-intense-meio-amargo-40-cacau-original.jpg', keywords: 'chocolate lacta intense meio amargo 40% cacau original lacta mondelez' },
    { name: 'Chocolate Lacta Laka Oreo', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-laka-oreo.jpg', keywords: 'chocolate lacta laka oreo lacta mondelez' },
    { name: 'Chocolate Lacta Meio Amargo Amaro 40% Cacau', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-meio-amargo-amaro-40-cacau.jpg', keywords: 'chocolate lacta meio amargo amaro 40% cacau lacta mondelez' },
    { name: 'Chocolate Lacta Shot Branco', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__chocolate-lacta-shot-branco.jpg', keywords: 'chocolate lacta shot branco lacta mondelez' },
    { name: 'Ovo de Páscoa Bis Ao Leite', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-bis-ao-leite.jpg', keywords: 'ovo de páscoa bis ao leite lacta mondelez' },
    { name: 'Ovo de Páscoa Bis Branco', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-bis-branco.jpg', keywords: 'ovo de páscoa bis branco lacta mondelez' },
    { name: 'Ovo de Páscoa Lacta Barbie', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-lacta-barbie.jpg', keywords: 'ovo de páscoa lacta barbie lacta mondelez' },
    { name: 'Ovo de Páscoa Lacta Diamante Negro', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-lacta-diamante-negro.jpg', keywords: 'ovo de páscoa lacta diamante negro lacta mondelez' },
    { name: 'Ovo de Páscoa Lacta Hotwheels', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-lacta-hotwheels.jpg', keywords: 'ovo de páscoa lacta hotwheels lacta mondelez' },
    { name: 'Ovo de Páscoa Lacta Laka Chocolate Branco', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-lacta-laka-chocolate-branco.jpg', keywords: 'ovo de páscoa lacta laka chocolate branco lacta mondelez' },
    { name: 'Ovo de Páscoa Lacta Oreo', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-lacta-oreo.jpg', keywords: 'ovo de páscoa lacta oreo lacta mondelez' },
    { name: 'Ovo de Páscoa Ouro Branco', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-ouro-branco.jpg', keywords: 'ovo de páscoa ouro branco lacta mondelez' },
    { name: 'Ovo de Páscoa Trakinas', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-trakinas.jpg', keywords: 'ovo de páscoa trakinas lacta mondelez' },
    { name: 'Ovo de Páscoa Tripla Camada Oreo', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__ovo-de-pascoa-tripla-camada-oreo.jpg', keywords: 'ovo de páscoa tripla camada oreo lacta mondelez' },
    { name: 'Stick Wafer Recheado Ouro Branco sabor Chocolate Branco', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__stick-wafer-recheado-ouro-branco-sabor-chocolate-branco.jpg', keywords: 'stick wafer recheado ouro branco sabor chocolate branco lacta mondelez' },
    { name: 'Stick Wafer Recheado Sonho de Valsa sabor Chocolate', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__stick-wafer-recheado-sonho-de-valsa-sabor-chocolate.jpg', keywords: 'stick wafer recheado sonho de valsa sabor chocolate lacta mondelez' },
    { name: 'Wafer Lacta com Recheio de Oreo', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__wafer-lacta-com-recheio-de-oreo.jpg', keywords: 'wafer lacta com recheio de oreo lacta mondelez' },
    { name: 'Wafer Recheado Ouro Branco sabor Chocolate Branco', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__wafer-recheado-ouro-branco-sabor-chocolate-branco.jpg', keywords: 'wafer recheado ouro branco sabor chocolate branco lacta mondelez' },
    { name: 'Wafer Recheado Sonho de Valsa sabor Chocolate', category: 'Lacta', img: 'assets/produtos/mondelez/lacta__wafer-recheado-sonho-de-valsa-sabor-chocolate.jpg', keywords: 'wafer recheado sonho de valsa sabor chocolate lacta mondelez' },
    { name: 'Chocolate Lacta Branco Laka', category: 'Laka', img: 'assets/produtos/mondelez/laka__chocolate-lacta-branco-laka.jpg', keywords: 'chocolate lacta branco laka laka mondelez' },
    { name: 'Chocolate Lacta Laka Oreo', category: 'Laka', img: 'assets/produtos/mondelez/laka__chocolate-lacta-laka-oreo.jpg', keywords: 'chocolate lacta laka oreo laka mondelez' },
    { name: 'Biscoito Milka Choco e Biscuit', category: 'Milka', img: 'assets/produtos/mondelez/milka__biscoito-milka-choco-e-biscuit.jpg', keywords: 'biscoito milka choco e biscuit milka mondelez' },
    { name: 'Biscoito Milka Choco Moo', category: 'Milka', img: 'assets/produtos/mondelez/milka__biscoito-milka-choco-moo.jpg', keywords: 'biscoito milka choco moo milka mondelez' },
    { name: 'Biscoito Milka Choco Wafer', category: 'Milka', img: 'assets/produtos/mondelez/milka__biscoito-milka-choco-wafer.jpg', keywords: 'biscoito milka choco wafer milka mondelez' },
    { name: 'Biscoito Milka Chocoebiscuit', category: 'Milka', img: 'assets/produtos/mondelez/milka__biscoito-milka-chocoebiscuit.jpg', keywords: 'biscoito milka chocoebiscuit milka mondelez' },
    { name: 'Biscoito Milka Palito de Chocolate', category: 'Milka', img: 'assets/produtos/mondelez/milka__biscoito-milka-palito-de-chocolate.jpg', keywords: 'biscoito milka palito de chocolate milka mondelez' },
    { name: 'Caixa de Chocolate I Love Milka Creme de Avelã', category: 'Milka', img: 'assets/produtos/mondelez/milka__caixa-de-chocolate-i-love-milka-creme-de-avela.jpg', keywords: 'caixa de chocolate i love milka creme de avelã milka mondelez' },
    { name: 'Chocolate Ao Leite Milka', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-ao-leite-milka.jpg', keywords: 'chocolate ao leite milka milka mondelez' },
    { name: 'Chocolate ao Leite Milka Bubbly', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-ao-leite-milka-bubbly.jpg', keywords: 'chocolate ao leite milka bubbly milka mondelez' },
    { name: 'Chocolate Milka Avelã', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-avela.jpg', keywords: 'chocolate milka avelã milka mondelez' },
    { name: 'Chocolate Milka Caramelo', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-caramelo.jpg', keywords: 'chocolate milka caramelo milka mondelez' },
    { name: 'Chocolate Milka Caramelo e Nuts', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-caramelo-e-nuts.jpg', keywords: 'chocolate milka caramelo e nuts milka mondelez' },
    { name: 'Chocolate Milka Chips Ahoy', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-chips-ahoy.jpg', keywords: 'chocolate milka chips ahoy milka mondelez' },
    { name: 'Chocolate Milka Choco Biscuit', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-choco-biscuit.jpg', keywords: 'chocolate milka choco biscuit milka mondelez' },
    { name: 'Chocolate Milka com Biscoito Oreo', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-com-biscoito-oreo.jpg', keywords: 'chocolate milka com biscoito oreo milka mondelez' },
    { name: 'Chocolate Milka Lu', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-lu.jpg', keywords: 'chocolate milka lu milka mondelez' },
    { name: 'Chocolate Milka Morango', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-morango.jpg', keywords: 'chocolate milka morango milka mondelez' },
    { name: 'Chocolate Milka Oreo', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-oreo.jpg', keywords: 'chocolate milka oreo milka mondelez' },
    { name: 'Chocolate Milka Oreo Brownie', category: 'Milka', img: 'assets/produtos/mondelez/milka__chocolate-milka-oreo-brownie.jpg', keywords: 'chocolate milka oreo brownie milka mondelez' },
    { name: 'Biscoito Recheado Mini Oreo Original', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-mini-oreo-original.jpg', keywords: 'biscoito recheado mini oreo original oreo mondelez' },
    { name: 'Biscoito Recheado Oreo', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo.jpg', keywords: 'biscoito recheado oreo oreo mondelez' },
    { name: 'Biscoito Recheado Oreo BTS Sabor Hotteok', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-bts-sabor-hotteok.jpg', keywords: 'biscoito recheado oreo bts sabor hotteok oreo mondelez' },
    { name: 'Biscoito Recheado Oreo Chocolate', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-chocolate.jpg', keywords: 'biscoito recheado oreo chocolate oreo mondelez' },
    { name: 'Biscoito Recheado Oreo Golden', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-golden.jpg', keywords: 'biscoito recheado oreo golden oreo mondelez' },
    { name: 'Biscoito Recheado Oreo Golden - Embalagem Econômica Multipack', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-golden-embalagem-economica-multipack.jpg', keywords: 'biscoito recheado oreo golden - embalagem econômica multipack oreo mondelez' },
    { name: 'Biscoito Recheado Oreo Original', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-original.jpg', keywords: 'biscoito recheado oreo original oreo mondelez' },
    { name: 'Biscoito Recheado Oreo Original - Embalagem Econômica Multipack', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-original-embalagem-economica-multipack.jpg', keywords: 'biscoito recheado oreo original - embalagem econômica multipack oreo mondelez' },
    { name: 'Biscoito Recheado Oreo sabor Chocolate', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-sabor-chocolate.jpg', keywords: 'biscoito recheado oreo sabor chocolate oreo mondelez' },
    { name: 'Biscoito Recheado Oreo sabor Chocolate - Embalagem Econômica Multipack', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-sabor-chocolate-embalagem-economica-multipack.jpg', keywords: 'biscoito recheado oreo sabor chocolate - embalagem econômica multipack oreo mondelez' },
    { name: 'Biscoito Recheado Oreo sabor Chocolate Multipack', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-sabor-chocolate-multipack.jpg', keywords: 'biscoito recheado oreo sabor chocolate multipack oreo mondelez' },
    { name: 'Biscoito Recheado Oreo sabor Milkshake de Morango', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-sabor-milkshake-de-morango.jpg', keywords: 'biscoito recheado oreo sabor milkshake de morango oreo mondelez' },
    { name: 'Biscoito Recheado Oreo sabor Original Multipack', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-sabor-original-multipack.jpg', keywords: 'biscoito recheado oreo sabor original multipack oreo mondelez' },
    { name: 'Biscoito Recheado Oreo sabor sabor Milkshake de Morango Multipack', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-sabor-sabor-milkshake-de-morango-multipack.jpg', keywords: 'biscoito recheado oreo sabor sabor milkshake de morango multipack oreo mondelez' },
    { name: 'Biscoito Recheado Oreo Selena Gomez sabor Canela e Leite Condensado', category: 'Oreo', img: 'assets/produtos/mondelez/oreo__biscoito-recheado-oreo-selena-gomez-sabor-canela-e-leite-condensado.jpg', keywords: 'biscoito recheado oreo selena gomez sabor canela e leite condensado oreo mondelez' },
    { name: 'Chocolate Lacta Branco com Recheio Ouro Branco', category: 'Ouro Branco', img: 'assets/produtos/mondelez/ouro-branco__chocolate-lacta-branco-com-recheio-ouro-branco.jpg', keywords: 'chocolate lacta branco com recheio ouro branco ouro branco mondelez' },
    { name: 'Stick Wafer Recheado Ouro Branco sabor Chocolate Branco', category: 'Ouro Branco', img: 'assets/produtos/mondelez/ouro-branco__stick-wafer-recheado-ouro-branco-sabor-chocolate-branco.jpg', keywords: 'stick wafer recheado ouro branco sabor chocolate branco ouro branco mondelez' },
    { name: 'Wafer Recheado Ouro Branco sabor Chocolate Branco - Pacote', category: 'Ouro Branco', img: 'assets/produtos/mondelez/ouro-branco__wafer-recheado-ouro-branco-sabor-chocolate-branco-pacote.jpg', keywords: 'wafer recheado ouro branco sabor chocolate branco - pacote ouro branco mondelez' },
    { name: 'Wafer Recheado Ouro Branco sabor Chocolate Branco - Pacote de 1kg', category: 'Ouro Branco', img: 'assets/produtos/mondelez/ouro-branco__wafer-recheado-ouro-branco-sabor-chocolate-branco-pacote-de-1kg.jpg', keywords: 'wafer recheado ouro branco sabor chocolate branco - pacote de 1kg ouro branco mondelez' },
    { name: 'Chocolate ao Leite com Amendoim Shot', category: 'Shot', img: 'assets/produtos/mondelez/shot__chocolate-ao-leite-com-amendoim-shot.jpg', keywords: 'chocolate ao leite com amendoim shot shot mondelez' },
    { name: 'Chocolate Lacta ao Leite com Amendoim Shot', category: 'Shot', img: 'assets/produtos/mondelez/shot__chocolate-lacta-ao-leite-com-amendoim-shot.jpg', keywords: 'chocolate lacta ao leite com amendoim shot shot mondelez' },
    { name: 'Caixa Sonho de Valsa e Ouro Branco Sortidos sabor Chocolate', category: 'Sonho de Valsa', img: 'assets/produtos/mondelez/sonho-de-valsa__caixa-sonho-de-valsa-e-ouro-branco-sortidos-sabor-chocolate.jpg', keywords: 'caixa sonho de valsa e ouro branco sortidos sabor chocolate sonho de valsa mondelez' },
    { name: 'Chocolate Lacta ao Leite com Recheio Sonho de Valsa', category: 'Sonho de Valsa', img: 'assets/produtos/mondelez/sonho-de-valsa__chocolate-lacta-ao-leite-com-recheio-sonho-de-valsa.jpg', keywords: 'chocolate lacta ao leite com recheio sonho de valsa sonho de valsa mondelez' },
    { name: 'Ovo de Páscoa Sonho de Valsa', category: 'Sonho de Valsa', img: 'assets/produtos/mondelez/sonho-de-valsa__ovo-de-pascoa-sonho-de-valsa.jpg', keywords: 'ovo de páscoa sonho de valsa sonho de valsa mondelez' },
    { name: 'Stick Wafer Recheado Sonho de Valsa sabor Chocolate', category: 'Sonho de Valsa', img: 'assets/produtos/mondelez/sonho-de-valsa__stick-wafer-recheado-sonho-de-valsa-sabor-chocolate.jpg', keywords: 'stick wafer recheado sonho de valsa sabor chocolate sonho de valsa mondelez' },
    { name: 'Wafer Recheado Sonho de Valsa sabor Chocolate', category: 'Sonho de Valsa', img: 'assets/produtos/mondelez/sonho-de-valsa__wafer-recheado-sonho-de-valsa-sabor-chocolate-pacote-de.jpg', keywords: 'wafer recheado sonho de valsa sabor chocolate sonho de valsa mondelez' },
    { name: 'Wafer Recheado Sonho de Valsa sabor Chocolate - Pacote de 1kg', category: 'Sonho de Valsa', img: 'assets/produtos/mondelez/sonho-de-valsa__wafer-recheado-sonho-de-valsa-sabor-chocolate-pacote-de-1kg.jpg', keywords: 'wafer recheado sonho de valsa sabor chocolate - pacote de 1kg sonho de valsa mondelez' },
    { name: 'Refresco em Pó Tang Azul Espacial', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-azul-espacial.jpg', keywords: 'refresco em pó tang azul espacial tang mondelez' },
    { name: 'Refresco em Pó Tang Joia da Ilha', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-joia-da-ilha.jpg', keywords: 'refresco em pó tang joia da ilha tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Abacaxi', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-abacaxi.jpg', keywords: 'refresco em pó tang sabor abacaxi tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Goiaba', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-goiaba.jpg', keywords: 'refresco em pó tang sabor goiaba tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Guaraná', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-guarana.jpg', keywords: 'refresco em pó tang sabor guaraná tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Laranja', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-laranja.jpg', keywords: 'refresco em pó tang sabor laranja tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Laranja Docinha', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-laranja-docinha.jpg', keywords: 'refresco em pó tang sabor laranja docinha tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Laranja Mamão', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-laranja-mamao.jpg', keywords: 'refresco em pó tang sabor laranja mamão tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Laranja Preço Especial', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-laranja-preco-especial.jpg', keywords: 'refresco em pó tang sabor laranja preço especial tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Limão', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-limao.jpg', keywords: 'refresco em pó tang sabor limão tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Manga', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-manga.jpg', keywords: 'refresco em pó tang sabor manga tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Maracujá', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-maracuja.jpg', keywords: 'refresco em pó tang sabor maracujá tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Morango', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-morango.jpg', keywords: 'refresco em pó tang sabor morango tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Tangerina', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-tangerina.jpg', keywords: 'refresco em pó tang sabor tangerina tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Uva', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-uva.jpg', keywords: 'refresco em pó tang sabor uva tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Uva Intensa', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-uva-intensa.jpg', keywords: 'refresco em pó tang sabor uva intensa tang mondelez' },
    { name: 'Refresco em Pó Tang sabor Uva Preço Especial', category: 'Tang', img: 'assets/produtos/mondelez/tang__refresco-em-po-tang-sabor-uva-preco-especial.jpg', keywords: 'refresco em pó tang sabor uva preço especial tang mondelez' },
    { name: 'Chocolate Toblerone ao Leite', category: 'Toblerone', img: 'assets/produtos/mondelez/toblerone__chocolate-toblerone-ao-leite.jpg', keywords: 'chocolate toblerone ao leite toblerone mondelez' },
    { name: 'Biscoito Recheado Trakinas Meio a Meio sabor Chocolate ao Leite e Branco', category: 'Trakinas', img: 'assets/produtos/mondelez/trakinas__biscoito-recheado-trakinas-meio-a-meio-sabor-chocolate-ao-leite-e-branco.jpg', keywords: 'biscoito recheado trakinas meio a meio sabor chocolate ao leite e branco trakinas mondelez' },
    { name: 'Biscoito Recheado Trakinas Meio a Meio sabor Chocolate e Morango', category: 'Trakinas', img: 'assets/produtos/mondelez/trakinas__biscoito-recheado-trakinas-meio-a-meio-sabor-chocolate-e-morango.jpg', keywords: 'biscoito recheado trakinas meio a meio sabor chocolate e morango trakinas mondelez' },
    { name: 'Biscoito Recheado Trakinas sabor Chocolate', category: 'Trakinas', img: 'assets/produtos/mondelez/trakinas__biscoito-recheado-trakinas-sabor-chocolate.jpg', keywords: 'biscoito recheado trakinas sabor chocolate trakinas mondelez' },
    { name: 'Biscoito Recheado Trakinas sabor Morango', category: 'Trakinas', img: 'assets/produtos/mondelez/trakinas__biscoito-recheado-trakinas-sabor-morango.jpg', keywords: 'biscoito recheado trakinas sabor morango trakinas mondelez' },
    { name: 'Biscoito Recheado Trakinas sabor Tortinha de Limão', category: 'Trakinas', img: 'assets/produtos/mondelez/trakinas__biscoito-recheado-trakinas-sabor-tortinha-de-limao.jpg', keywords: 'biscoito recheado trakinas sabor tortinha de limão trakinas mondelez' },
    { name: 'Biscoito Recheado Trakinas sabor Tutti-Frutti Bubbaloo', category: 'Trakinas', img: 'assets/produtos/mondelez/trakinas__biscoito-recheado-trakinas-sabor-tutti-frutti-bubbaloo.jpg', keywords: 'biscoito recheado trakinas sabor tutti-frutti bubbaloo trakinas mondelez' },
    { name: 'Chiclete Trident Blueberry', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-blueberry.jpg', keywords: 'chiclete trident blueberry trident mondelez' },
    { name: 'Chiclete Trident Canela', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-canela.jpg', keywords: 'chiclete trident canela trident mondelez' },
    { name: 'Chiclete Trident Hortelã', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-hortela.jpg', keywords: 'chiclete trident hortelã trident mondelez' },
    { name: 'Chiclete Trident Max Cool Raspberry', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-max-cool-raspberry.jpg', keywords: 'chiclete trident max cool raspberry trident mondelez' },
    { name: 'Chiclete Trident Max Hortelã Fresca', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-max-hortela-fresca.jpg', keywords: 'chiclete trident max hortelã fresca trident mondelez' },
    { name: 'Chiclete Trident Max Menta Blueberry', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-max-menta-blueberry.jpg', keywords: 'chiclete trident max menta blueberry trident mondelez' },
    { name: 'Chiclete Trident Melancia', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-melancia.jpg', keywords: 'chiclete trident melancia trident mondelez' },
    { name: 'Chiclete Trident Menta', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-menta.jpg', keywords: 'chiclete trident menta trident mondelez' },
    { name: 'Chiclete Trident Morango', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-morango.jpg', keywords: 'chiclete trident morango trident mondelez' },
    { name: 'Chiclete Trident Tutti-frutti', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-tutti-frutti.jpg', keywords: 'chiclete trident tutti-frutti trident mondelez' },
    { name: 'Chiclete Trident X Gamers Acid Berry', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-x-gamers-acid-berry.jpg', keywords: 'chiclete trident x gamers acid berry trident mondelez' },
    { name: 'Chiclete Trident X Gamers Citrus Mix', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-x-gamers-citrus-mix.jpg', keywords: 'chiclete trident x gamers citrus mix trident mondelez' },
    { name: 'Chiclete Trident XSenses Acid Blueberry', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-acid-blueberry.jpg', keywords: 'chiclete trident xsenses acid blueberry trident mondelez' },
    { name: 'Chiclete Trident XSenses Cereja', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-cereja.jpg', keywords: 'chiclete trident xsenses cereja trident mondelez' },
    { name: 'Chiclete Trident XSenses Herbal', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-herbal.jpg', keywords: 'chiclete trident xsenses herbal trident mondelez' },
    { name: 'Chiclete Trident XSenses Intense', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-intense.jpg', keywords: 'chiclete trident xsenses intense trident mondelez' },
    { name: 'Chiclete Trident XSenses Melancia Mint', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-melancia-mint.jpg', keywords: 'chiclete trident xsenses melancia mint trident mondelez' },
    { name: 'Chiclete Trident XSenses Morango Lime', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-morango-lime.jpg', keywords: 'chiclete trident xsenses morango lime trident mondelez' },
    { name: 'Chiclete Trident XSenses Peppermint', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-peppermint.jpg', keywords: 'chiclete trident xsenses peppermint trident mondelez' },
    { name: 'Chiclete Trident XSenses Spearmint', category: 'Trident', img: 'assets/produtos/mondelez/trident__chiclete-trident-xsenses-spearmint.jpg', keywords: 'chiclete trident xsenses spearmint trident mondelez' },
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
