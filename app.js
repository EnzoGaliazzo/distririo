// ===== Utilitario de busca: ignora maiusculas/minusculas e acentos =====
// Assim "marata"/"agua"/"acucar" encontram "Maratá"/"água"/"açúcar".
function normalizeSearch(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

// ===== Animacao de entrada ao rolar a tela =====
// So aplicada em ".section" (paginas institucionais, poucas secoes por pagina).
// Fora de proposito em ".category-section" (loja.html tem 30+ delas, com centenas
// de produtos) - la o risco de alguma secao ficar presa invisivel supera o ganho.
// A propria ".section" que envolve o catalogo inteiro em loja.html (marcada com
// ".section-catalog") tambem fica de fora pelo mesmo motivo: ela sozinha passou a
// abranger 600+ produtos, ficando alta demais pra o threshold do observer disparar
// de forma confiavel - deixava a loja inteira em branco ao entrar na pagina.
document.addEventListener('DOMContentLoaded', function () {
    var targets = document.querySelectorAll('.section:not(.section-catalog)');
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
        targets.forEach(function (el) { el.classList.add('is-visible'); });
        return;
    }

    targets.forEach(function (el) { el.classList.add('reveal'); });

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    targets.forEach(function (el) { observer.observe(el); });

    // Rede de seguranca: se por algum motivo o observer nao disparar pra alguma
    // secao (dispositivo/navegador especifico, timing, etc.), garante que nada
    // fique preso invisivel para sempre.
    setTimeout(function () {
        targets.forEach(function (el) { el.classList.add('is-visible'); });
    }, 2500);
});

// ===== Analytics: mede cliques em links do WhatsApp (pedido/contato) =====
document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href*="wa.me/"]');
    if (!link || typeof gtag !== 'function') return;
    gtag('event', 'whatsapp_click', {
        link_id: link.id || null,
        link_text: link.textContent.trim(),
        page_path: window.location.pathname
    });
});

// ===== Carrossel do banner do hero (home) =====
document.addEventListener('DOMContentLoaded', function () {
    var carousel = document.getElementById('heroCarousel');
    if (!carousel) return;

    var slides = carousel.querySelectorAll('img');
    if (slides.length < 2) return;

    var current = 0;
    var timer = null;

    function goTo(index) {
        slides[current].classList.remove('is-active');
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('is-active');
    }

    function startAutoplay() {
        timer = setInterval(function () { goTo(current + 1); }, 4000);
    }

    function restartAutoplay() {
        clearInterval(timer);
        startAutoplay();
    }

    startAutoplay();

    var prevBtn = carousel.querySelector('.hero-carousel-prev');
    var nextBtn = carousel.querySelector('.hero-carousel-next');

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            goTo(current - 1);
            restartAutoplay();
        });
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            goTo(current + 1);
            restartAutoplay();
        });
    }
});

// ===== Parallax sutil no banner do hero (home) =====
// Aplica um leve deslocamento vertical na imagem ativa do carrossel conforme
// rola a pagina. Desligado se o usuario prefere menos movimento.
document.addEventListener('DOMContentLoaded', function () {
    var carousel = document.getElementById('heroCarousel');
    if (!carousel) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var slides = carousel.querySelectorAll('img');
    var ticking = false;

    function updateParallax() {
        var rect = carousel.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
            var offset = Math.max(-24, Math.min(24, rect.top * -0.06));
            slides.forEach(function (img) {
                img.style.transform = 'translateY(' + offset + 'px) scale(1.06)';
            });
        }
        ticking = false;
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }, { passive: true });

    updateParallax();
});

// ===== Seletor de marcas com troca de foto (home) =====
document.addEventListener('DOMContentLoaded', function () {
    var selector = document.querySelector('.brand-selector');
    if (!selector) return;

    var buttons = selector.querySelectorAll('.brand-select-btn');
    var images = selector.querySelectorAll('.brand-preview-img');

    buttons.forEach(function (btn) {
        btn.addEventListener('click', function () {
            var brand = btn.getAttribute('data-brand');
            buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
            images.forEach(function (img) {
                img.classList.toggle('is-active', img.getAttribute('data-brand') === brand);
            });
        });
    });
});

// ===== Contadores animados (home) =====
document.addEventListener('DOMContentLoaded', function () {
    var counters = document.querySelectorAll('.stat-number[data-count-to]');
    if (!counters.length) return;

    function animateCounter(el) {
        var target = parseInt(el.getAttribute('data-count-to'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var duration = 1200;
        var start = null;

        function step(timestamp) {
            if (!start) start = timestamp;
            var progress = Math.min((timestamp - start) / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(eased * target) + suffix;
            if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    if (!('IntersectionObserver' in window)) {
        counters.forEach(animateCounter);
        return;
    }

    var counterObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { counterObserver.observe(el); });
});

// ===== "Como funciona": desenha a linha e revela os icones ao rolar (home) =====
document.addEventListener('DOMContentLoaded', function () {
    var steps = document.querySelector('.how-steps');
    if (!steps) return;

    var line = steps.querySelector('.how-steps-line');

    if (!('IntersectionObserver' in window)) {
        steps.classList.add('is-visible');
        if (line) line.classList.add('is-visible');
        return;
    }

    var stepsObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                steps.classList.add('is-visible');
                if (line) line.classList.add('is-visible');
                stepsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.3 });

    stepsObserver.observe(steps);
});

// ===== Botao flutuante do WhatsApp: aparece depois que rola a hero =====
document.addEventListener('DOMContentLoaded', function () {
    var floatBtn = document.getElementById('whatsappFloat');
    if (!floatBtn) return;

    function toggleFloatVisibility() {
        floatBtn.classList.toggle('is-visible', window.scrollY > 400);
    }

    window.addEventListener('scroll', toggleFloatVisibility, { passive: true });
    toggleFloatVisibility();
});

// ===== FAQ (acordeao) na pagina "Trabalhe conosco" =====
document.addEventListener('DOMContentLoaded', function () {
    var faqItems = document.querySelectorAll('.faq-item');
    if (!faqItems.length) return;

    faqItems.forEach(function (item) {
        var question = item.querySelector('.faq-question');
        var answer = item.querySelector('.faq-answer');
        if (!question || !answer) return;

        question.addEventListener('click', function () {
            var isOpen = item.classList.contains('is-open');

            faqItems.forEach(function (other) {
                other.classList.remove('is-open');
                other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                other.querySelector('.faq-answer').style.maxHeight = '';
            });

            if (!isOpen) {
                item.classList.add('is-open');
                question.setAttribute('aria-expanded', 'true');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });
});

// ===== Formulario "Trabalhe conosco" (envia via Web3Forms) =====
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('jobForm');
    if (!form) return;

    var statusEl = document.getElementById('jobFormStatus');
    var submitBtn = form.querySelector('.job-submit');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var formData = new FormData(form);
        var originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enviando...';
        statusEl.hidden = true;
        statusEl.classList.remove('is-success', 'is-error');

        fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData,
            headers: { Accept: 'application/json' }
        })
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data.success) {
                    statusEl.textContent = 'Candidatura enviada! Vamos analisar seu perfil e entrar em contato.';
                    statusEl.classList.add('is-success');
                    form.reset();
                    if (typeof gtag === 'function') {
                        gtag('event', 'job_application_submit', { page_path: window.location.pathname });
                    }
                } else {
                    statusEl.textContent = 'Não deu pra enviar agora. Tenta de novo em instantes ou chama a gente no WhatsApp.';
                    statusEl.classList.add('is-error');
                }
                statusEl.hidden = false;
            })
            .catch(function () {
                statusEl.textContent = 'Não deu pra enviar agora. Tenta de novo em instantes ou chama a gente no WhatsApp.';
                statusEl.classList.add('is-error');
                statusEl.hidden = false;
            })
            .finally(function () {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            });
    });
});

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

// ===== Catálogo de produtos (usado nas sugestões de busca) =====
var PRODUCTS = [
    { name: 'Trident 5S - Menta', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-5s.jpg', keywords: 'trident 5s menta trident mondelez' },
    { name: 'Trident 5S - Hortelã', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-5s.jpg', keywords: 'trident 5s hortela trident mondelez' },
    { name: 'Trident 5S - Tutti-Frutti', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-5s.jpg', keywords: 'trident 5s tutti frutti trident mondelez' },
    { name: 'Trident 5S - Melancia', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-5s.jpg', keywords: 'trident 5s melancia trident mondelez' },
    { name: 'Trident 5S - Morango', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-5s.jpg', keywords: 'trident 5s morango trident mondelez' },
    { name: 'Trident 5S - Canela', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-5s.jpg', keywords: 'trident 5s canela trident mondelez' },
    { name: 'Trident 14S - Melancia', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-14s.jpg', keywords: 'trident 14s melancia trident mondelez' },
    { name: 'Trident 14S - Hortelã', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-14s.jpg', keywords: 'trident 14s hortela trident mondelez' },
    { name: 'Trident 14S - Intense', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-14s.jpg', keywords: 'trident 14s intense trident mondelez' },
    { name: 'Trident 14S - Blueberry', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-14s.jpg', keywords: 'trident 14s blueberry trident mondelez' },
    { name: 'Trident 14S - Menta', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-14s.jpg', keywords: 'trident 14s menta trident mondelez' },
    { name: 'Trident 14S - Tutti-Frutti', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-14s.jpg', keywords: 'trident 14s tutti frutti trident mondelez' },
    { name: 'Trident Bag - Hortelã', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-bag.jpg', keywords: 'trident bag hortela trident mondelez' },
    { name: 'Trident Bag - Menta', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-bag.jpg', keywords: 'trident bag menta trident mondelez' },
    { name: 'Trident Bag - Tutti-Frutti', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-bag.jpg', keywords: 'trident bag tutti frutti trident mondelez' },
    { name: 'Trident Bag - Morango', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-bag.jpg', keywords: 'trident bag morango trident mondelez' },
    { name: 'Trident Bag - Melancia', category: 'Trident', img: 'assets/produtos/mondelez-novo/mondelez__trident-bag.jpg', keywords: 'trident bag melancia trident mondelez' },
    { name: 'Trident Xsenses Garrafa - Morango Lime', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-garrafa.jpg', keywords: 'trident xsenses garrafa morango lime trident xsenses mondelez' },
    { name: 'Trident Xsenses Garrafa - Melancia Mint', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-garrafa.jpg', keywords: 'trident xsenses garrafa melancia mint trident xsenses mondelez' },
    { name: 'Trident Xsenses Garrafa - Citrus', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-garrafa.jpg', keywords: 'trident xsenses garrafa citrus trident xsenses mondelez' },
    { name: 'Trident Xsenses Garrafa - Spearmint', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-garrafa.jpg', keywords: 'trident xsenses garrafa spearmint trident xsenses mondelez' },
    { name: 'Trident Xsenses Garrafa - Peppermint', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-garrafa.jpg', keywords: 'trident xsenses garrafa peppermint trident xsenses mondelez' },
    { name: 'Trident Xsenses Garrafa - Blueberry', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-garrafa.jpg', keywords: 'trident xsenses garrafa blueberry trident xsenses mondelez' },
    { name: 'Trident Xsenses 5S - Cereja Ice', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-5s.jpg', keywords: 'trident xsenses 5s cereja ice trident xsenses mondelez' },
    { name: 'Trident Xsenses 5S - Acid Blueberry', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-5s.jpg', keywords: 'trident xsenses 5s acid blueberry trident xsenses mondelez' },
    { name: 'Trident Xsenses 5S - Intense', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-5s.jpg', keywords: 'trident xsenses 5s intense trident xsenses mondelez' },
    { name: 'Trident Xsenses 5S - Herbal', category: 'Trident Xsenses', img: 'assets/produtos/mondelez-novo/mondelez__trident-xsenses-5s.jpg', keywords: 'trident xsenses 5s herbal trident xsenses mondelez' },
    { name: 'Chiclets Hortelã 100/2S', category: 'Chiclets (Adams)', img: 'assets/produtos/mondelez-novo/mondelez__chiclets.jpg', keywords: 'chiclets hortela 100 2s chiclets adams mondelez' },
    { name: 'Chiclets Tutti-Frutti 100/2S', category: 'Chiclets (Adams)', img: 'assets/produtos/mondelez-novo/mondelez__chiclets.jpg', keywords: 'chiclets tutti frutti 100 2s chiclets adams mondelez' },
    { name: 'Trident Max - Hortelã Fresca', category: 'Trident Max', img: 'assets/produtos/mondelez-novo/mondelez__trident-max.jpg', keywords: 'trident max hortela fresca trident max mondelez' },
    { name: 'Trident Max - Menta Blueberry', category: 'Trident Max', img: 'assets/produtos/mondelez-novo/mondelez__trident-max.jpg', keywords: 'trident max menta blueberry trident max mondelez' },
    { name: 'Trident Max - Cool Raspberry', category: 'Trident Max', img: 'assets/produtos/mondelez-novo/mondelez__trident-max-2.jpg', keywords: 'trident max cool raspberry trident max mondelez' },
    { name: 'Bubbaloo Gum DSP Hortelã/Menta', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo.jpg', keywords: 'bubbaloo gum dsp hortela menta bubbaloo mondelez' },
    { name: 'Bubbaloo Gum DSP Morango', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo.jpg', keywords: 'bubbaloo gum dsp morango bubbaloo mondelez' },
    { name: 'Bubbaloo Gum DSP Tutti-Frutti', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo.jpg', keywords: 'bubbaloo gum dsp tutti frutti bubbaloo mondelez' },
    { name: 'Bubbaloo Gum DSP Uva', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo.jpg', keywords: 'bubbaloo gum dsp uva bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Mix 15G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas.jpg', keywords: 'bubbaloo bala mix 15g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Morango 15G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas.jpg', keywords: 'bubbaloo bala morango 15g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Tutti-Frutti 15G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas.jpg', keywords: 'bubbaloo bala tutti frutti 15g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Tutti-Frutti 75G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas-2.jpg', keywords: 'bubbaloo bala tutti frutti 75g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Morango Azedinha 82.5G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas-2.jpg', keywords: 'bubbaloo bala morango azedinha 82 5g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Mix Azedinha 82.5G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas-2.jpg', keywords: 'bubbaloo bala mix azedinha 82 5g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Morango 75G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas-2.jpg', keywords: 'bubbaloo bala morango 75g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Citric Blueberry 82.5G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas-2.jpg', keywords: 'bubbaloo bala citric blueberry 82 5g bubbaloo mondelez' },
    { name: 'Bubbaloo Bala Mix 75G', category: 'Bubbaloo', img: 'assets/produtos/mondelez-novo/mondelez__bubbaloo-balas-2.jpg', keywords: 'bubbaloo bala mix 75g bubbaloo mondelez' },
    { name: 'Halls Base DSP Uva Verde', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp uva verde halls mondelez' },
    { name: 'Halls Base DSP Extra Forte', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp extra forte halls mondelez' },
    { name: 'Halls Base DSP Menta', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp menta halls mondelez' },
    { name: 'Halls Base DSP Morango', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp morango halls mondelez' },
    { name: 'Halls Base DSP Cereja', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp cereja halls mondelez' },
    { name: 'Halls Blueberry', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls blueberry halls mondelez' },
    { name: 'Halls Base DSP Melancia', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp melancia halls mondelez' },
    { name: 'Halls Base DSP Mentol', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls.jpg', keywords: 'halls base dsp mentol halls mondelez' },
    { name: 'Halls Bag - Menta', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls-bag.jpg', keywords: 'halls bag menta halls mondelez' },
    { name: 'Halls Bag - Cereja', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls-bag.jpg', keywords: 'halls bag cereja halls mondelez' },
    { name: 'Halls Bag - Morango', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls-bag.jpg', keywords: 'halls bag morango halls mondelez' },
    { name: 'Halls Bag - Extra Forte', category: 'Halls', img: 'assets/produtos/mondelez-novo/mondelez__halls-bag.jpg', keywords: 'halls bag extra forte halls mondelez' },
    { name: 'Tang - Uva', category: 'Tang', img: 'assets/produtos/mondelez-novo/mondelez__tang.jpg', keywords: 'tang uva tang mondelez' },
    { name: 'Tang - Tangerina', category: 'Tang', img: 'assets/produtos/mondelez-novo/mondelez__tang.jpg', keywords: 'tang tangerina tang mondelez' },
    { name: 'Tang - Joia da Ilha', category: 'Tang', img: 'assets/produtos/mondelez-novo/mondelez__tang.jpg', keywords: 'tang joia da ilha tang mondelez' },
    { name: 'Tang - Maracujá (Edição Limitada)', category: 'Tang', img: 'assets/produtos/mondelez-novo/mondelez__tang-edicao-limitada.jpg', keywords: 'tang maracuja edicao limitada tang mondelez' },
    { name: 'Tang - Guaraná (Edição Limitada)', category: 'Tang', img: 'assets/produtos/mondelez-novo/mondelez__tang-edicao-limitada.jpg', keywords: 'tang guarana edicao limitada tang mondelez' },
    { name: 'Tang - Laranja com Mamão (Edição Limitada)', category: 'Tang', img: 'assets/produtos/mondelez-novo/mondelez__tang-edicao-limitada.jpg', keywords: 'tang laranja com mamao edicao limitada tang mondelez' },
    { name: 'Oreo 18G - Original', category: 'Oreo', img: 'assets/produtos/mondelez-novo/mondelez__oreo-18g.jpg', keywords: 'oreo 18g original oreo mondelez' },
    { name: 'Mini Oreo 35G', category: 'Oreo', img: 'assets/produtos/mondelez-novo/mondelez__mini-oreo-35g.jpg', keywords: 'mini oreo 35g oreo mondelez' },
    { name: 'Oreo Original 90G', category: 'Oreo', img: 'assets/produtos/mondelez-novo/mondelez__oreo-original-90g.jpg', keywords: 'oreo original 90g oreo mondelez' },
    { name: 'Oreo Chocolate 90G', category: 'Oreo', img: 'assets/produtos/mondelez-novo/mondelez__oreo-chocolate-90g.jpg', keywords: 'oreo chocolate 90g oreo mondelez' },
    { name: 'Club Social Snack - Parmesão 115G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack parmesao 115g club social mondelez' },
    { name: 'Club Social Snack - Parmesão 68G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack parmesao 68g club social mondelez' },
    { name: 'Club Social Snack - Marguerita 68G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack marguerita 68g club social mondelez' },
    { name: 'Club Social Snack - American Barbecue 68G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack american barbecue 68g club social mondelez' },
    { name: 'Club Social Snack - Cebola e Salsa 68G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack cebola e salsa 68g club social mondelez' },
    { name: 'Club Social Snack - Cebola e Salsa 115G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack cebola e salsa 115g club social mondelez' },
    { name: 'Club Social Snack - Churras na Brasa 68G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack churras na brasa 68g club social mondelez' },
    { name: 'Club Social Snack - Churras na Brasa 115G', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack.jpg', keywords: 'club social snack churras na brasa 115g club social mondelez' },
    { name: 'Club Social Regular - Original', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-regular.jpg', keywords: 'club social regular original club social mondelez' },
    { name: 'Club Social Regular - Pizza', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-regular.jpg', keywords: 'club social regular pizza club social mondelez' },
    { name: 'Club Social Regular - Pão de Alho', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-regular.jpg', keywords: 'club social regular pao de alho club social mondelez' },
    { name: 'Club Social Regular - Presunto', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-regular.jpg', keywords: 'club social regular presunto club social mondelez' },
    { name: 'Club Social Regular - Cebola Caramelizada', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-regular.jpg', keywords: 'club social regular cebola caramelizada club social mondelez' },
    { name: 'Club Social Integral - Integral Tradicional', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-integral.jpg', keywords: 'club social integral integral tradicional club social mondelez' },
    { name: 'Club Social Snack - Cebola e Salsa 68G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack cebola e salsa 68g sul sp club social mondelez' },
    { name: 'Club Social Snack - Cebola e Salsa 115G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack cebola e salsa 115g sul sp club social mondelez' },
    { name: 'Club Social Snack - Churras na Brasa 68G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack churras na brasa 68g sul sp club social mondelez' },
    { name: 'Club Social Snack - Churras na Brasa 115G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack churras na brasa 115g sul sp club social mondelez' },
    { name: 'Club Social Snack - Parmesão 115G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack parmesao 115g sul sp club social mondelez' },
    { name: 'Club Social Snack - Parmesão 68G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack parmesao 68g sul sp club social mondelez' },
    { name: 'Club Social Snack - Marguerita 68G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack marguerita 68g sul sp club social mondelez' },
    { name: 'Club Social Snack - American Barbecue 68G (Sul/SP)', category: 'Club Social', img: 'assets/produtos/mondelez-novo/mondelez__club-social-snack-sul-sp.jpg', keywords: 'club social snack american barbecue 68g sul sp club social mondelez' },
    { name: '5Star', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__5star.jpg', keywords: '5star lacta mondelez' },
    { name: 'Wafer Lacta Oreo', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__wafer-lacta-oreo.jpg', keywords: 'wafer lacta oreo lacta mondelez' },
    { name: 'Sonho de Valsa Unitário', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__sonho-de-valsa-e-ouro-branco.jpg', keywords: 'sonho de valsa unitario lacta mondelez' },
    { name: 'Ouro Branco Unitário', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__sonho-de-valsa-e-ouro-branco.jpg', keywords: 'ouro branco unitario lacta mondelez' },
    { name: 'Wafer Recheado Sonho de Valsa', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__sonho-de-valsa-e-ouro-branco.jpg', keywords: 'wafer recheado sonho de valsa lacta mondelez' },
    { name: 'Wafer Recheado Ouro Branco', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__sonho-de-valsa-e-ouro-branco.jpg', keywords: 'wafer recheado ouro branco lacta mondelez' },
    { name: 'Lacta Obrigado', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-obrigado.jpg', keywords: 'lacta obrigado lacta mondelez' },
    { name: 'Lacta 80G - Ao Leite', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-80g.jpg', keywords: 'lacta 80g ao leite lacta mondelez' },
    { name: 'Lacta 80G - Laka', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-80g.jpg', keywords: 'lacta 80g laka lacta mondelez' },
    { name: 'Lacta 80G - Diamante Negro', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-80g.jpg', keywords: 'lacta 80g diamante negro lacta mondelez' },
    { name: 'Lacta 80G - Shot', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-80g.jpg', keywords: 'lacta 80g shot lacta mondelez' },
    { name: 'Lacta 80G - Diamante Negro/Laka', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-80g.jpg', keywords: 'lacta 80g diamante negro laka lacta mondelez' },
    { name: 'Lacta 80G - Amaro', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-80g.jpg', keywords: 'lacta 80g amaro lacta mondelez' },
    { name: 'Lacta Recheados - Lacta Oreo', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-recheados.jpg', keywords: 'lacta recheados lacta oreo lacta mondelez' },
    { name: 'Lacta Recheados - Lacta Ouro Branco', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-recheados.jpg', keywords: 'lacta recheados lacta ouro branco lacta mondelez' },
    { name: 'Lacta Recheados - Lacta Sonho de Valsa', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-recheados.jpg', keywords: 'lacta recheados lacta sonho de valsa lacta mondelez' },
    { name: 'Lacta Recheados - Laka Caramelo', category: 'Lacta', img: 'assets/produtos/mondelez-novo/mondelez__lacta-recheados.jpg', keywords: 'lacta recheados laka caramelo lacta mondelez' },
    { name: 'Bis Original', category: 'Bis', img: 'assets/produtos/mondelez-novo/mondelez__bis-2.jpg', keywords: 'bis original bis mondelez' },
    { name: 'Bis Branco', category: 'Bis', img: 'assets/produtos/mondelez-novo/mondelez__bis-2.jpg', keywords: 'bis branco bis mondelez' },
    { name: 'Bis 10 ao Leite', category: 'Bis', img: 'assets/produtos/mondelez-novo/mondelez__bis.jpg', keywords: 'bis 10 ao leite bis mondelez' },
    { name: 'Bis 10 Laka', category: 'Bis', img: 'assets/produtos/mondelez-novo/mondelez__bis.jpg', keywords: 'bis 10 laka bis mondelez' },
    { name: 'Bis Xtra Original', category: 'Bis Xtra', img: 'assets/produtos/mondelez-novo/mondelez__bis-xtra.jpg', keywords: 'bis xtra original bis xtra mondelez' },
    { name: 'Bis Xtra Oreo', category: 'Bis Xtra', img: 'assets/produtos/mondelez-novo/mondelez__bis-xtra.jpg', keywords: 'bis xtra oreo bis xtra mondelez' },
    { name: 'Bis Xtra Black', category: 'Bis Xtra', img: 'assets/produtos/mondelez-novo/mondelez__bis-xtra.jpg', keywords: 'bis xtra black bis xtra mondelez' },
    { name: 'Bis Xtra Branco', category: 'Bis Xtra', img: 'assets/produtos/mondelez-novo/mondelez__bis-xtra.jpg', keywords: 'bis xtra branco bis xtra mondelez' },
    { name: 'Tábuas Intense - 70% Cacau Original', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense 70 cacau original lacta intense mondelez' },
    { name: 'Tábuas Intense - 60% Cacau Original', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense 60 cacau original lacta intense mondelez' },
    { name: 'Tábuas Intense - 40% Cacau Original', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense 40 cacau original lacta intense mondelez' },
    { name: 'Tábuas Intense - 60% Cacau Mix Nuts', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense 60 cacau mix nuts lacta intense mondelez' },
    { name: 'Tábuas Intense - 60% Cacau Café', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense 60 cacau cafe lacta intense mondelez' },
    { name: 'Tábuas Intense Nuts - 40% Cacau Avelã & Crocante de Cacau', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense nuts 40 cacau avela crocante de cacau lacta intense mondelez' },
    { name: 'Tábuas Intense Nuts - 40% Cacau Amêndoas & Caramelo Salgado', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense nuts 40 cacau amendoas caramelo salgado lacta intense mondelez' },
    { name: 'Tábuas Intense Nuts - 40% Cacau Amêndoas & Framboesa', category: 'Lacta Intense', img: 'assets/produtos/mondelez-novo/mondelez__tabuas-intense.jpg', keywords: 'tabuas intense nuts 40 cacau amendoas framboesa lacta intense mondelez' },
    { name: 'Água de Coco', category: 'Aqua Coco', img: 'assets/produtos/distririo/aqua-coco__agua-de-coco-300ml.jpg', keywords: 'agua de coco aqua coco aqua coco' },
    { name: 'Água de Coco', category: 'Aqua Coco', img: 'assets/produtos/distririo/aqua-coco__agua-de-coco-300ml.jpg', keywords: 'agua de coco aqua coco aqua coco' },
    { name: 'Água de Coco Garrafa Turma da Mônica', category: 'Aqua Coco', img: 'assets/produtos/distririo/aqua-coco__agua-de-coco-garrafa-turma-da-monica.jpg', keywords: 'agua de coco garrafa turma da monica aqua coco aqua coco' },
    { name: 'Suco de Acerola', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-acerola-1l.jpg', keywords: 'suco de acerola sumo sumo' },
    { name: 'Suco de Cajá', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-caja-1l.jpg', keywords: 'suco de caja sumo sumo' },
    { name: 'Suco de Caju', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-caju-1l.jpg', keywords: 'suco de caju sumo sumo' },
    { name: 'Suco de Goiaba', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-goiaba.jpg', keywords: 'suco de goiaba sumo sumo' },
    { name: 'Suco de Graviola', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-graviola-1l.jpg', keywords: 'suco de graviola sumo sumo' },
    { name: 'Suco de Uva', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-uva.jpg', keywords: 'suco de uva sumo sumo' },
    { name: 'Suco Sumo Açaí', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-sumo-acai.jpg', keywords: 'suco sumo acai sumo sumo' },
    { name: 'Suco de Acerola', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-acerola-1l.jpg', keywords: 'suco de acerola sumo sumo' },
    { name: 'Suco de Cajá', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-caja-1l.jpg', keywords: 'suco de caja sumo sumo' },
    { name: 'Suco de Caju', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-caju-1l.jpg', keywords: 'suco de caju sumo sumo' },
    { name: 'Suco de Graviola', category: 'Sumo', img: 'assets/produtos/distririo/sumo__suco-de-graviola-1l.jpg', keywords: 'suco de graviola sumo sumo' },
    { name: 'Néctar Maratá Caju', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-caju.jpg', keywords: 'nectar marata caju marata marata' },
    { name: 'Néctar Maratá Laranja', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-laranja-200ml.jpg', keywords: 'nectar marata laranja marata marata' },
    { name: 'Néctar Maratá Pêssego', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-pessego.jpg', keywords: 'nectar marata pessego marata marata' },
    { name: 'Néctar Maratá Uva', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-uva-200ml.jpg', keywords: 'nectar marata uva marata marata' },
    { name: 'Néctar Maratá Caju', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-caju.jpg', keywords: 'nectar marata caju marata marata' },
    { name: 'Néctar Maratá Laranja', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-laranja-200ml.jpg', keywords: 'nectar marata laranja marata marata' },
    { name: 'Néctar Maratá Maracujá', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-maracuja.jpg', keywords: 'nectar marata maracuja marata marata' },
    { name: 'Néctar Maratá Pêssego', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-pessego.jpg', keywords: 'nectar marata pessego marata marata' },
    { name: 'Néctar Maratá Uva', category: 'Maratá', img: 'assets/produtos/distririo/marata__nectar-marata-uva-200ml.jpg', keywords: 'nectar marata uva marata marata' },
    { name: 'Flocão de Milho Maratá', category: 'Maratá', img: 'assets/produtos/distririo/marata__flocao-de-milho-marata.jpg', keywords: 'flocao de milho marata marata marata' },
    { name: 'Refresco Mara-tinho Abacaxi', category: 'Mara-tinho', img: 'assets/produtos/distririo/mara-tinho__refresco-mara-tinho-abacaxi.jpg', keywords: 'refresco mara tinho abacaxi mara tinho mara tinho' },
    { name: 'Refresco Mara-tinho Laranja', category: 'Mara-tinho', img: 'assets/produtos/distririo/mara-tinho__refresco-mara-tinho-laranja.jpg', keywords: 'refresco mara tinho laranja mara tinho mara tinho' },
    { name: 'Refresco Mara-tinho Maracujá', category: 'Mara-tinho', img: 'assets/produtos/distririo/mara-tinho__refresco-mara-tinho-maracuja.jpg', keywords: 'refresco mara tinho maracuja mara tinho mara tinho' },
    { name: 'Refresco Mara-tinho Morango', category: 'Mara-tinho', img: 'assets/produtos/distririo/mara-tinho__refresco-mara-tinho-morango.jpg', keywords: 'refresco mara tinho morango mara tinho mara tinho' },
    { name: 'Refresco Mara-tinho Uva', category: 'Mara-tinho', img: 'assets/produtos/distririo/mara-tinho__refresco-mara-tinho-uva.jpg', keywords: 'refresco mara tinho uva mara tinho mara tinho' },
    { name: 'Molho Gota Alho', category: 'Gota', img: 'assets/produtos/distririo/gota__molho-gota-alho.jpg', keywords: 'molho gota alho gota gota' },
    { name: 'Molho Gota Inglês', category: 'Gota', img: 'assets/produtos/distririo/gota__molho-gota-ingles.jpg', keywords: 'molho gota ingles gota gota' },
    { name: 'Molho Gota Pimenta', category: 'Gota', img: 'assets/produtos/distririo/gota__molho-gota-pimenta.jpg', keywords: 'molho gota pimenta gota gota' },
    { name: 'Molho Gota Pimenta Verde', category: 'Gota', img: 'assets/produtos/distririo/gota__molho-gota-pimenta-verde.jpg', keywords: 'molho gota pimenta verde gota gota' },
    { name: 'Azeitona Verde Sachê Fatiada', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-sache-fatiada-80g.jpg', keywords: 'azeitona verde sache fatiada rivoli rivoli' },
    { name: 'Azeitona Verde Sachê Fatiada', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-sache-fatiada-80g.jpg', keywords: 'azeitona verde sache fatiada rivoli rivoli' },
    { name: 'Azeitona Preta Sachê Fatiada', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-preta-sache-fatiada.jpg', keywords: 'azeitona preta sache fatiada rivoli rivoli' },
    { name: 'Azeitona Verde Gordal Vidro c/ Caroço', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-gordal-vidro-c-caroco.jpg', keywords: 'azeitona verde gordal vidro c caroco rivoli rivoli' },
    { name: 'Azeitonas Verde Fatiadas Balde', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitonas-verde-fatiadas-balde.jpg', keywords: 'azeitonas verde fatiadas balde rivoli rivoli' },
    { name: 'Azeitonas Verde Sem Caroço Balde', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitonas-verde-sem-caroco-balde.jpg', keywords: 'azeitonas verde sem caroco balde rivoli rivoli' },
    { name: 'Azeitonas Verde Média Balde', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitonas-verde-media-balde.jpg', keywords: 'azeitonas verde media balde rivoli rivoli' },
    { name: 'Azeitona Verde Sachê c/ Caroço', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-sache-c-caroco-80g.jpg', keywords: 'azeitona verde sache c caroco rivoli rivoli' },
    { name: 'Azeitona Verde Sachê c/ Caroço', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-sache-c-caroco-80g.jpg', keywords: 'azeitona verde sache c caroco rivoli rivoli' },
    { name: 'Azeitona Verde Sachê s/ Caroço', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-sache-s-caroco-80g.jpg', keywords: 'azeitona verde sache s caroco rivoli rivoli' },
    { name: 'Azeitona Verde Sachê s/ Caroço', category: 'Rivoli', img: 'assets/produtos/distririo/rivoli__azeitona-verde-sache-s-caroco-80g.jpg', keywords: 'azeitona verde sache s caroco rivoli rivoli' },
    { name: 'Trio Avelã e Castanha com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-avela-e-castanha-com-chocolate.jpg', keywords: 'trio avela e castanha com chocolate trio trio' },
    { name: 'Trio Banana Aveia e Mel', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-banana-aveia-e-mel.jpg', keywords: 'trio banana aveia e mel trio trio' },
    { name: 'Trio Brigadeiro', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-brigadeiro.jpg', keywords: 'trio brigadeiro trio trio' },
    { name: 'Trio Côco com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-coco-com-chocolate.jpg', keywords: 'trio coco com chocolate trio trio' },
    { name: 'Trio Morango com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-morango-com-chocolate.jpg', keywords: 'trio morango com chocolate trio trio' },
    { name: 'Trio Original Avelã e Castanha com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-original-avela-e-castanha-com-chocolate.jpg', keywords: 'trio original avela e castanha com chocolate trio trio' },
    { name: 'Trio Original Banana Aveia e Mel', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-original-banana-aveia-e-mel.jpg', keywords: 'trio original banana aveia e mel trio trio' },
    { name: 'Trio Original Brigadeiro', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-original-brigadeiro.jpg', keywords: 'trio original brigadeiro trio trio' },
    { name: 'Trio Original Morango com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-original-morango-com-chocolate.jpg', keywords: 'trio original morango com chocolate trio trio' },
    { name: 'Trio Côco Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-coco-chocolate.jpg', keywords: 'trio coco chocolate trio trio' },
    { name: 'Trio Zero Banana com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-zero-banana-com-chocolate.jpg', keywords: 'trio zero banana com chocolate trio trio' },
    { name: 'Trio Zero Morango com Chocolate', category: 'Trio', img: 'assets/produtos/distririo/trio__trio-zero-morango-com-chocolate.jpg', keywords: 'trio zero morango com chocolate trio trio' },
    { name: 'Granola Tradicional', category: 'Kobber', img: 'assets/produtos/distririo/kobber__granola-tradicional.jpg', keywords: 'granola tradicional kobber kobber' },
    { name: 'Granola Frutas e Mel', category: 'Kobber', img: 'assets/produtos/distririo/kobber__granola-frutas-e-mel.jpg', keywords: 'granola frutas e mel kobber kobber' },
    { name: 'Granola Banana e Mel', category: 'Kobber', img: 'assets/produtos/distririo/kobber__granola-banana-e-mel.jpg', keywords: 'granola banana e mel kobber kobber' },
    { name: 'Granola Chocolate e Amendoim', category: 'Kobber', img: 'assets/produtos/distririo/kobber__granola-chocolate-e-amendoim.jpg', keywords: 'granola chocolate e amendoim kobber kobber' },
    { name: 'Granola Castanha', category: 'Kobber', img: 'assets/produtos/distririo/kobber__granola-castanha.jpg', keywords: 'granola castanha kobber kobber' },
    { name: 'Granola Zero', category: 'Kobber', img: 'assets/produtos/distririo/kobber__granola-zero.jpg', keywords: 'granola zero kobber kobber' },
    { name: 'Geleia Baldoni Abacaxi c/ Pimenta', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__geleia-baldoni-abacaxi-c-pimenta.jpg', keywords: 'geleia baldoni abacaxi c pimenta baldoni baldoni' },
    { name: 'Geleia Baldoni Frutas Amarelas', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__geleia-baldoni-frutas-amarelas.jpg', keywords: 'geleia baldoni frutas amarelas baldoni baldoni' },
    { name: 'Geleia Baldoni Frutas Vermelhas', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__geleia-baldoni-frutas-vermelhas.jpg', keywords: 'geleia baldoni frutas vermelhas baldoni baldoni' },
    { name: 'Geleia Baldoni Morango', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__geleia-baldoni-morango.jpg', keywords: 'geleia baldoni morango baldoni baldoni' },
    { name: 'Mel Turma da Mônica Orgânico', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__mel-turma-da-monica-organico.jpg', keywords: 'mel turma da monica organico baldoni baldoni' },
    { name: 'Mel Turma da Mônica Laranjeira', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__mel-turma-da-monica-laranjeira.jpg', keywords: 'mel turma da monica laranjeira baldoni baldoni' },
    { name: 'Mel Chef Bisnaga (Chefão)', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__mel-chef-bisnaga-chefao.jpg', keywords: 'mel chef bisnaga chefao baldoni baldoni' },
    { name: 'Mel Chef Bisnaga', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__mel-chef-bisnaga.jpg', keywords: 'mel chef bisnaga baldoni baldoni' },
    { name: 'Mel Orgânico Bisnaga', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__mel-organico-bisnaga.jpg', keywords: 'mel organico bisnaga baldoni baldoni' },
    { name: 'Mel Holanda Bisnaga', category: 'Baldoni', img: 'assets/produtos/distririo/baldoni__mel-holanda-bisnaga.jpg', keywords: 'mel holanda bisnaga baldoni baldoni' },
    { name: 'Detergente em Pó Ace Sachê', category: 'Ace', img: 'assets/produtos/distririo/ace__detergente-em-po-ace-sache-2-4kg.jpg', keywords: 'detergente em po ace sache ace ace' },
    { name: 'Detergente em Pó Ace Sachê', category: 'Ace', img: 'assets/produtos/distririo/ace__detergente-em-po-ace-sache-2-4kg.jpg', keywords: 'detergente em po ace sache ace ace' },
    { name: 'Detergente em Pó Ace Sachê', category: 'Ace', img: 'assets/produtos/distririo/ace__detergente-em-po-ace-sache-2-4kg.jpg', keywords: 'detergente em po ace sache ace ace' },
    { name: 'Detergente em Pó Ace Cartucho', category: 'Ace', img: 'assets/produtos/distririo/ace__detergente-em-po-ace-cartucho-2-2kg.jpg', keywords: 'detergente em po ace cartucho ace ace' },
    { name: 'Detergente em Pó Ace Cartucho', category: 'Ace', img: 'assets/produtos/distririo/ace__detergente-em-po-ace-cartucho-2-2kg.jpg', keywords: 'detergente em po ace cartucho ace ace' },
    { name: 'Detergente em Pó Espumil Premium Cartucho', category: 'Espumil', img: 'assets/produtos/distririo/espumil__detergente-em-po-espumil-premium-cartucho.jpg', keywords: 'detergente em po espumil premium cartucho espumil espumil' },
    { name: 'Lava Roupas Líquido Espumil', category: 'Espumil', img: 'assets/produtos/distririo/espumil__lava-roupas-liquido-espumil-1l.jpg', keywords: 'lava roupas liquido espumil espumil espumil' },
    { name: 'Lava Roupas Líquido Espumil', category: 'Espumil', img: 'assets/produtos/distririo/espumil__lava-roupas-liquido-espumil-1l.jpg', keywords: 'lava roupas liquido espumil espumil espumil' },
    { name: 'Sabão em Pedra Espumil Côco', category: 'Espumil', img: 'assets/produtos/distririo/espumil__sabao-em-pedra-espumil-coco.jpg', keywords: 'sabao em pedra espumil coco espumil espumil' },
    { name: 'Sabão em Pedra Espumil Glicerinado Neutro', category: 'Espumil', img: 'assets/produtos/distririo/espumil__sabao-em-pedra-espumil-glicerinado-neutro.jpg', keywords: 'sabao em pedra espumil glicerinado neutro espumil espumil' },
    { name: 'Supino - Barra de Banana com Cobertura de Chocolate ao Leite', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-com-cobertura-de-chocolate-ao-leite.jpg', keywords: 'supino barra de banana com cobertura de chocolate ao leite supino banana brasil' },
    { name: 'Supino - Barra de Banana com Cobertura de Chocolate Branco', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-com-cobertura-de-chocolate-branco.jpg', keywords: 'supino barra de banana com cobertura de chocolate branco supino banana brasil' },
    { name: 'Supino Zero - Barra de Banana com Cobertura de Chocolate ao Leite', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-zero-barra-de-banana-com-cobertura-de-chocolate-ao-leite.jpg', keywords: 'supino zero barra de banana com cobertura de chocolate ao leite supino banana brasil' },
    { name: 'Supino Zero - Barra de Banana com Cobertura de Chocolate Branco', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-zero-barra-de-banana-com-cobertura-de-chocolate-branco.jpg', keywords: 'supino zero barra de banana com cobertura de chocolate branco supino banana brasil' },
    { name: 'Supino - Barra de Banana e Ameixa', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-e-ameixa.jpg', keywords: 'supino barra de banana e ameixa supino banana brasil' },
    { name: 'Supino - Barra de Banana, Nozes e Damasco', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-nozes-e-damasco.jpg', keywords: 'supino barra de banana nozes e damasco supino banana brasil' },
    { name: 'Supino - Barra de Banana, Maçã e Canela', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-maca-e-canela.jpg', keywords: 'supino barra de banana maca e canela supino banana brasil' },
    { name: 'Supino - Barra de Banana e Açaí', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-e-acai.jpg', keywords: 'supino barra de banana e acai supino banana brasil' },
    { name: 'Supino - Barra de Banana e Morango', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-e-morango.jpg', keywords: 'supino barra de banana e morango supino banana brasil' },
    { name: 'Supino - Barra de Banana e Abacaxi', category: 'Supino', img: 'assets/produtos/banana-brasil/supino__supino-barra-de-banana-e-abacaxi.jpg', keywords: 'supino barra de banana e abacaxi supino banana brasil' },
    { name: 'Nuts - Barra de Castanhas, Amendoim e Abacaxi', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-amendoim-e-abacaxi.jpg', keywords: 'nuts barra de castanhas amendoim e abacaxi nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas, Amendoim e Frutas Vermelhas', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-amendoim-e-frutas-vermelhas.jpg', keywords: 'nuts barra de castanhas amendoim e frutas vermelhas nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas, Amendoim, Banana e Canela', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-amendoim-banana-e-canela.jpg', keywords: 'nuts barra de castanhas amendoim banana e canela nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas, Amendoim e Sementes', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-amendoim-e-sementes.jpg', keywords: 'nuts barra de castanhas amendoim e sementes nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas, Amendoim e Frutas', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-amendoim-e-frutas.jpg', keywords: 'nuts barra de castanhas amendoim e frutas nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas e Amendoim com Cobertura de Chocolate', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-e-amendoim-com-cobertura-de-chocolate.jpg', keywords: 'nuts barra de castanhas e amendoim com cobertura de chocolate nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas, Amendoim e Coco com Cobertura de Chocolate', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-amendoim-e-coco-com-cobertura-de-chocolate.jpg', keywords: 'nuts barra de castanhas amendoim e coco com cobertura de chocolate nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas e Amendoim com Cobertura de Morango', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-e-amendoim-com-cobertura-de-morango.jpg', keywords: 'nuts barra de castanhas e amendoim com cobertura de morango nuts banana brasil' },
    { name: 'Nuts - Barra de Castanhas e Pasta de Amendoim com Cobertura de Chocolate', category: 'Nuts', img: 'assets/produtos/banana-brasil/nuts__nuts-barra-de-castanhas-e-pasta-de-amendoim-com-cobertura-de-chocolate.jpg', keywords: 'nuts barra de castanhas e pasta de amendoim com cobertura de chocolate nuts banana brasil' },
    { name: 'Pé de Moleque - Barra Crocante de Amendoim Tradicional', category: 'Pé de Moleque', img: 'assets/produtos/banana-brasil/pe-de-moleque__pe-de-moleque-barra-crocante-de-amendoim-tradicional.jpg', keywords: 'pe de moleque barra crocante de amendoim tradicional pe de moleque banana brasil' },
    { name: 'Pé de Moleque - Barra Crocante de Amendoim Caramelo Salgado', category: 'Pé de Moleque', img: 'assets/produtos/banana-brasil/pe-de-moleque__pe-de-moleque-barra-crocante-de-amendoim-caramelo-salgado.jpg', keywords: 'pe de moleque barra crocante de amendoim caramelo salgado pe de moleque banana brasil' },
    { name: 'Protein+ - Napolitano', category: 'Protein+', img: 'assets/produtos/banana-brasil/protein__protein-napolitano.jpg', keywords: 'protein napolitano protein banana brasil' },
    { name: 'Protein+ - Torta de Limão', category: 'Protein+', img: 'assets/produtos/banana-brasil/protein__protein-torta-de-limao.jpg', keywords: 'protein torta de limao protein banana brasil' },
    { name: 'Protein+ - Cookies & Cream', category: 'Protein+', img: 'assets/produtos/banana-brasil/protein__protein-cookies-cream.jpg', keywords: 'protein cookies cream protein banana brasil' },
    { name: 'Protein+ - Banoffee', category: 'Protein+', img: 'assets/produtos/banana-brasil/protein__protein-banoffee.jpg', keywords: 'protein banoffee protein banana brasil' },
    { name: 'Protein+ Vegano - Pasta de Amendoim e Caramelo Salgado', category: 'Protein+', img: 'assets/produtos/banana-brasil/protein__protein-vegano-pasta-de-amendoim-e-caramelo-salgado.jpg', keywords: 'protein vegano pasta de amendoim e caramelo salgado protein banana brasil' },
    { name: 'Supino Protein - Baunilha com Crispies', category: 'Supino Protein', img: 'assets/produtos/banana-brasil/supino-protein__supino-protein-baunilha-com-crispies.jpg', keywords: 'supino protein baunilha com crispies supino protein banana brasil' },
    { name: 'Supino Protein - Coco', category: 'Supino Protein', img: 'assets/produtos/banana-brasil/supino-protein__supino-protein-coco.jpg', keywords: 'supino protein coco supino protein banana brasil' },
    { name: 'Supino Protein - Cappuccino', category: 'Supino Protein', img: 'assets/produtos/banana-brasil/supino-protein__supino-protein-cappuccino.jpg', keywords: 'supino protein cappuccino supino protein banana brasil' },
    { name: 'Supino Protein - Chocolate', category: 'Supino Protein', img: 'assets/produtos/banana-brasil/supino-protein__supino-protein-chocolate.jpg', keywords: 'supino protein chocolate supino protein banana brasil' },
    { name: 'Supino Protein Max - Amendoim e Caramelo', category: 'Supino Protein', img: 'assets/produtos/banana-brasil/supino-protein__supino-protein-max-amendoim-e-caramelo.jpg', keywords: 'supino protein max amendoim e caramelo supino protein banana brasil' },
    { name: 'Levittá - Barra Crocante de Gergelim e Linhaça', category: 'Levittá', img: 'assets/produtos/banana-brasil/levitta__levitta-barra-crocante-de-gergelim-e-linhaca.jpg', keywords: 'levitta barra crocante de gergelim e linhaca levitta banana brasil' },
    { name: 'Levittá - Barra Crocante de Gergelim, Quinoa e Cacau', category: 'Levittá', img: 'assets/produtos/banana-brasil/levitta__levitta-barra-crocante-de-gergelim-quinoa-e-cacau.jpg', keywords: 'levitta barra crocante de gergelim quinoa e cacau levitta banana brasil' },
    { name: 'Levittá - Barra Crocante de Gergelim e Chia', category: 'Levittá', img: 'assets/produtos/banana-brasil/levitta__levitta-barra-crocante-de-gergelim-e-chia.jpg', keywords: 'levitta barra crocante de gergelim e chia levitta banana brasil' },
    { name: 'Levittá - Barra Crocante de Gergelim e Castanha-de-Caju', category: 'Levittá', img: 'assets/produtos/banana-brasil/levitta__levitta-barra-crocante-de-gergelim-e-castanha-de-caju.jpg', keywords: 'levitta barra crocante de gergelim e castanha de caju levitta banana brasil' },
    { name: 'Só Frutas - Original', category: 'Só Frutas', img: 'assets/produtos/banana-brasil/so-frutas__so-frutas-original.jpg', keywords: 'so frutas original so frutas banana brasil' },
    { name: 'Só Frutas + Coco', category: 'Só Frutas', img: 'assets/produtos/banana-brasil/so-frutas__so-frutas-coco.jpg', keywords: 'so frutas coco so frutas banana brasil' },
    { name: 'Só Frutas + Cacau e Especiarias', category: 'Só Frutas', img: 'assets/produtos/banana-brasil/so-frutas__so-frutas-cacau-e-especiarias.jpg', keywords: 'so frutas cacau e especiarias so frutas banana brasil' },
    { name: 'Banana Passa', category: 'Banana Passa', img: 'assets/produtos/banana-brasil/banana-passa__banana-passa.jpg', keywords: 'banana passa banana passa banana brasil' },
    { name: 'NutsBITES - Bombom de Castanhas, Pasta de Amendoim e Caramelo com Cobertura de Chocolate ao Leite', category: 'NutsBITES', img: 'assets/produtos/banana-brasil/nutsbites__nutsbites-bombom-de-castanhas-pasta-de-amendoim-e-caramelo-com-cobertura-de-chocolate-ao-leite.jpg', keywords: 'nutsbites bombom de castanhas pasta de amendoim e caramelo com cobertura de chocolate ao leite nutsbites banana brasil' },
    { name: 'NutsBITES - Bombom de Castanhas, Amendoim e Frutas com Cobertura de Chocolate Branco', category: 'NutsBITES', img: 'assets/produtos/banana-brasil/nutsbites__nutsbites-bombom-de-castanhas-amendoim-e-frutas-com-cobertura-de-chocolate-branco.jpg', keywords: 'nutsbites bombom de castanhas amendoim e frutas com cobertura de chocolate branco nutsbites banana brasil' },
    { name: 'NutsBITES Vegano - Bombom de Castanhas, Amendoim, Nibs de Cacau e Canela com Cobertura de Chocolate Meio Amargo', category: 'NutsBITES', img: 'assets/produtos/banana-brasil/nutsbites__nutsbites-vegano-bombom-de-castanhas-amendoim-nibs-de-cacau-e-canela-com-cobertura-de-chocolate-meio-amargo.jpg', keywords: 'nutsbites vegano bombom de castanhas amendoim nibs de cacau e canela com cobertura de chocolate meio amargo nutsbites banana brasil' },
    { name: 'Banana Brasil Kids - Barra de Banana e Melancia com Cobertura de Melancia', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__banana-brasil-kids-barra-de-banana-e-melancia-com-cobertura-de-melancia.jpg', keywords: 'banana brasil kids barra de banana e melancia com cobertura de melancia kids banana brasil' },
    { name: 'Banana Brasil Kids - Barra de Banana com Cobertura de Chocolate ao Leite', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__banana-brasil-kids-barra-de-banana-com-cobertura-de-chocolate-ao-leite.jpg', keywords: 'banana brasil kids barra de banana com cobertura de chocolate ao leite kids banana brasil' },
    { name: 'Banana Brasil Kids - Barra de Banana com Cobertura de Chocolate Branco', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__banana-brasil-kids-barra-de-banana-com-cobertura-de-chocolate-branco.jpg', keywords: 'banana brasil kids barra de banana com cobertura de chocolate branco kids banana brasil' },
    { name: 'Banana Brasil Kids - Barra de Banana e Uva com Cobertura de Uva', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__banana-brasil-kids-barra-de-banana-e-uva-com-cobertura-de-uva.jpg', keywords: 'banana brasil kids barra de banana e uva com cobertura de uva kids banana brasil' },
    { name: 'Banana Brasil Kids - Barra de Banana e Morango com Cobertura de Morango', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__banana-brasil-kids-barra-de-banana-e-morango-com-cobertura-de-morango.jpg', keywords: 'banana brasil kids barra de banana e morango com cobertura de morango kids banana brasil' },
    { name: 'Frutalalá - Barra de Frutas Maçã e Morango', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__frutalala-barra-de-frutas-maca-e-morango.jpg', keywords: 'frutalala barra de frutas maca e morango kids banana brasil' },
    { name: 'Frutalalá - Barra de Frutas Banana e Maçã', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__frutalala-barra-de-frutas-banana-e-maca.jpg', keywords: 'frutalala barra de frutas banana e maca kids banana brasil' },
    { name: 'Frutalalá - Barra de Frutas Salada de Frutas', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__frutalala-barra-de-frutas-salada-de-frutas.jpg', keywords: 'frutalala barra de frutas salada de frutas kids banana brasil' },
    { name: 'Granobá - Barra de Granola e Morango com Cobertura de Iogurte', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__granoba-barra-de-granola-e-morango-com-cobertura-de-iogurte.jpg', keywords: 'granoba barra de granola e morango com cobertura de iogurte kids banana brasil' },
    { name: 'Granobá - Barra de Granola com Cobertura de Chocolate', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__granoba-barra-de-granola-com-cobertura-de-chocolate.jpg', keywords: 'granoba barra de granola com cobertura de chocolate kids banana brasil' },
    { name: 'Granobá - Barra de Granola, Banana e Maçã com Cobertura de Iogurte', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__granoba-barra-de-granola-banana-e-maca-com-cobertura-de-iogurte.jpg', keywords: 'granoba barra de granola banana e maca com cobertura de iogurte kids banana brasil' },
    { name: 'Proteyá - Barra de Proteína Leitinho com Cookies', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__proteya-barra-de-proteina-leitinho-com-cookies.jpg', keywords: 'proteya barra de proteina leitinho com cookies kids banana brasil' },
    { name: 'Proteyá - Barra de Proteína Chocolate', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__proteya-barra-de-proteina-chocolate.jpg', keywords: 'proteya barra de proteina chocolate kids banana brasil' },
    { name: 'Proteyá - Barra de Proteína Iogurte de Morango', category: 'Kids', img: 'assets/produtos/banana-brasil/kids__proteya-barra-de-proteina-iogurte-de-morango.jpg', keywords: 'proteya barra de proteina iogurte de morango kids banana brasil' },
    { name: 'Cafeína Performance', category: 'Performance', img: 'assets/produtos/lauton/performance__cafeina-performance.jpg', keywords: 'cafeina performance performance lauton' },
    { name: 'Powerdrol', category: 'Performance', img: 'assets/produtos/lauton/saude-integral__powerdrol.jpg', keywords: 'powerdrol performance lauton' },
    { name: 'L-Arginina Plus', category: 'Performance', img: 'assets/produtos/lauton/performance__l-arginina-plus.jpg', keywords: 'l arginina plus performance lauton' },
    { name: 'Cúrcuma Premium', category: 'Performance', img: 'assets/produtos/lauton/saude-integral__curcuma-premium.jpg', keywords: 'curcuma premium performance lauton' },
    { name: 'Colágeno Tipo II', category: 'Performance', img: 'assets/produtos/lauton/performance__colageno-tipo-ii.jpg', keywords: 'colageno tipo ii performance lauton' },
    { name: 'Feno Grego Premium', category: 'Performance', img: 'assets/produtos/lauton/performance__feno-grego-premium.jpg', keywords: 'feno grego premium performance lauton' },
    { name: 'Maca Peruana Premium', category: 'Performance', img: 'assets/produtos/lauton/performance__maca-peruana-premium.jpg', keywords: 'maca peruana premium performance lauton' },
    { name: 'Extrato de Laranja Moro Premium', category: 'Performance', img: 'assets/produtos/lauton/performance__extrato-de-laranja-moro-premium.jpg', keywords: 'extrato de laranja moro premium performance lauton' },
    { name: 'Multi Vitamínico Hemovital A-Z', category: 'Performance', img: 'assets/produtos/lauton/performance__multi-vitaminico-hemovital-a-z.jpg', keywords: 'multi vitaminico hemovital a z performance lauton' },
    { name: 'Boro Decahidratado', category: 'Performance', img: 'assets/produtos/lauton/performance__boro-decahidratado.jpg', keywords: 'boro decahidratado performance lauton' },
    { name: 'Complexo B Max', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__complexo-b-max.jpg', keywords: 'complexo b max corpo e beleza lauton' },
    { name: 'Biotina Plus', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__biotina-plus.jpg', keywords: 'biotina plus corpo e beleza lauton' },
    { name: 'Coenzima Q10 PRO', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__coenzima-q10-pro.jpg', keywords: 'coenzima q10 pro corpo e beleza lauton' },
    { name: 'Hialux Skincare', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__hialux-skincare.jpg', keywords: 'hialux skincare corpo e beleza lauton' },
    { name: 'Procran Cranberry', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__procran-cranberry.jpg', keywords: 'procran cranberry corpo e beleza lauton' },
    { name: 'Colágeno Hidrolisado', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__colageno-hidrolisado.jpg', keywords: 'colageno hidrolisado corpo e beleza lauton' },
    { name: 'Coenzima Q10 ULTRA', category: 'Corpo e beleza', img: 'assets/produtos/lauton/mente-e-bem-estar__coenzima-q10-ultra.jpg', keywords: 'coenzima q10 ultra corpo e beleza lauton' },
    { name: 'Cromo Picolinato', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__cromo-picolinato.jpg', keywords: 'cromo picolinato corpo e beleza lauton' },
    { name: 'Luteína + Zeaxantina', category: 'Corpo e beleza', img: 'assets/produtos/lauton/corpo-e-beleza__luteina-zeaxantina.jpg', keywords: 'luteina zeaxantina corpo e beleza lauton' },
    { name: 'Triptoflex', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__triptoflex.jpg', keywords: 'triptoflex mente e bem estar lauton' },
    { name: 'Melatonina Líquida', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__melatonina-liquida.jpg', keywords: 'melatonina liquida mente e bem estar lauton' },
    { name: 'Melatonina Premium', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__melatonina-premium.jpg', keywords: 'melatonina premium mente e bem estar lauton' },
    { name: 'Amora Miúra Amorine', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__amora-miura-amorine.jpg', keywords: 'amora miura amorine mente e bem estar lauton' },
    { name: 'Óleo de Prímula', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__oleo-de-primula.jpg', keywords: 'oleo de primula mente e bem estar lauton' },
    { name: 'Magnésio Dimalato', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__magnesio-dimalato.jpg', keywords: 'magnesio dimalato mente e bem estar lauton' },
    { name: 'Ômega 3 Ultra', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__omega-3-ultra.jpg', keywords: 'omega 3 ultra mente e bem estar lauton' },
    { name: 'Ômega 3 Pro', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__omega-3-pro.jpg', keywords: 'omega 3 pro mente e bem estar lauton' },
    { name: 'Coenzima Q10 ULTRA', category: 'Mente e bem estar', img: 'assets/produtos/lauton/mente-e-bem-estar__coenzima-q10-ultra.jpg', keywords: 'coenzima q10 ultra mente e bem estar lauton' },
    { name: 'Própolis Defense', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__propolis-defense.jpg', keywords: 'propolis defense saude integral lauton' },
    { name: 'Vitamina C 500', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-c-500.jpg', keywords: 'vitamina c 500 saude integral lauton' },
    { name: 'Vitamina K2-MK7', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-k2-mk7.jpg', keywords: 'vitamina k2 mk7 saude integral lauton' },
    { name: 'MSM - Enxofre Orgânico', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__msm-enxofre-organico.jpg', keywords: 'msm enxofre organico saude integral lauton' },
    { name: 'Vitamina B12', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-b12.jpg', keywords: 'vitamina b12 saude integral lauton' },
    { name: 'Cobre Quelato Bisglicinato', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__cobre-quelato-bisglicinato.jpg', keywords: 'cobre quelato bisglicinato saude integral lauton' },
    { name: 'Vitamina D3+K2', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-d3-k2.jpg', keywords: 'vitamina d3 k2 saude integral lauton' },
    { name: 'Vitamina D3 2.000 UI', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-d3-2-000-ui.jpg', keywords: 'vitamina d3 2 000 ui saude integral lauton' },
    { name: 'Ferro Quelato Bisglicinato', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__ferro-quelato-bisglicinato.jpg', keywords: 'ferro quelato bisglicinato saude integral lauton' },
    { name: 'Ora Pro Nóbis', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__ora-pro-nobis.jpg', keywords: 'ora pro nobis saude integral lauton' },
    { name: 'Cúrcuma Premium', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__curcuma-premium.jpg', keywords: 'curcuma premium saude integral lauton' },
    { name: 'Metilfolax 600mcg', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__metilfolax-600mcg.jpg', keywords: 'metilfolax 600mcg saude integral lauton' },
    { name: 'Óleo de Alho Cru', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__oleo-de-alho-cru.jpg', keywords: 'oleo de alho cru saude integral lauton' },
    { name: 'Zinco Quelato Bisglicinato', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__zinco-quelato-bisglicinato.jpg', keywords: 'zinco quelato bisglicinato saude integral lauton' },
    { name: 'Resveratrol', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__resveratrol.jpg', keywords: 'resveratrol saude integral lauton' },
    { name: 'Beta Glucana Premium', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__beta-glucana-premium.jpg', keywords: 'beta glucana premium saude integral lauton' },
    { name: 'Magnésio Inositol', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__magnesio-inositol.jpg', keywords: 'magnesio inositol saude integral lauton' },
    { name: 'Cálcio Citrato Malato', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__calcio-citrato-malato.jpg', keywords: 'calcio citrato malato saude integral lauton' },
    { name: 'Cloreto de Magnésio P.A.', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__cloreto-de-magnesio-p-a.jpg', keywords: 'cloreto de magnesio p a saude integral lauton' },
    { name: 'Vitamina A', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-a.jpg', keywords: 'vitamina a saude integral lauton' },
    { name: 'Licopeno de Tomate', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__licopeno-de-tomate.jpg', keywords: 'licopeno de tomate saude integral lauton' },
    { name: 'Vitamina B12 Líquida', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-b12-liquida.jpg', keywords: 'vitamina b12 liquida saude integral lauton' },
    { name: 'NAC - N-Acetil L-Cisteína', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__nac-n-acetil-l-cisteina.jpg', keywords: 'nac n acetil l cisteina saude integral lauton' },
    { name: 'Vitamina D3 Líquida', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-d3-liquida.jpg', keywords: 'vitamina d3 liquida saude integral lauton' },
    { name: 'Vitamina B12 Líquida', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__vitamina-b12-liquida.jpg', keywords: 'vitamina b12 liquida saude integral lauton' },
    { name: 'Quadrimag Quadri4Tech', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__quadrimag-quadri4tech.jpg', keywords: 'quadrimag quadri4tech saude integral lauton' },
    { name: 'Treonato Treotech', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__treonato-treotech.jpg', keywords: 'treonato treotech saude integral lauton' },
    { name: 'Powerdrol', category: 'Saúde integral', img: 'assets/produtos/lauton/saude-integral__powerdrol.jpg', keywords: 'powerdrol saude integral lauton' },
    { name: 'FiberLiv - 7 Fontes de Fibra', category: 'Performance series', img: 'assets/produtos/lauton/performance-series__fiberliv-7-fontes-de-fibra.jpg', keywords: 'fiberliv 7 fontes de fibra performance series lauton' },
    { name: 'Cafeína - Caffeine Performance', category: 'Performance series', img: 'assets/produtos/lauton/performance-series__cafeina-caffeine-performance.jpg', keywords: 'cafeina caffeine performance performance series lauton' },
    { name: 'Creatina - Monohidratada', category: 'Performance series / Creatina e Glutamina', img: 'assets/produtos/lauton/performance-series-creatina-e-glutamina__creatina-monohidratada.jpg', keywords: 'creatina monohidratada performance series creatina e glutamina lauton' },
    { name: 'Glutamina - 100% Pura', category: 'Performance series / Creatina e Glutamina', img: 'assets/produtos/lauton/performance-series-creatina-e-glutamina__glutamina-100-pura.jpg', keywords: 'glutamina 100 pura performance series creatina e glutamina lauton' },
    { name: 'Kit Scudo P.', category: 'Lançamentos - Antipiolhos', img: 'assets/produtos/abelha-rainha/lancamentos-antipiolhos__kit-scudo-p.jpg', keywords: 'kit scudo p lancamentos antipiolhos abelha rainha' },
    { name: 'Body Splash Vanilla', category: 'Lançamentos - Body Splash / Perfumaria', img: 'assets/produtos/abelha-rainha/lancamentos-body-splash-perfumaria__body-splash-vanilla.jpg', keywords: 'body splash vanilla lancamentos body splash perfumaria abelha rainha' },
    { name: 'Body Splash Melancia', category: 'Lançamentos - Body Splash / Perfumaria', img: 'assets/produtos/abelha-rainha/lancamentos-body-splash-perfumaria__body-splash-melancia.jpg', keywords: 'body splash melancia lancamentos body splash perfumaria abelha rainha' },
    { name: 'Body Splash Maracujá', category: 'Lançamentos - Body Splash / Perfumaria', img: 'assets/produtos/abelha-rainha/lancamentos-body-splash-perfumaria__body-splash-maracuja.jpg', keywords: 'body splash maracuja lancamentos body splash perfumaria abelha rainha' },
    { name: 'Body Splash Pitaya', category: 'Lançamentos - Body Splash / Perfumaria', img: 'assets/produtos/abelha-rainha/lancamentos-body-splash-perfumaria__body-splash-pitaya.jpg', keywords: 'body splash pitaya lancamentos body splash perfumaria abelha rainha' },
    { name: 'Esfoliante Corporal Vanilla', category: 'Lançamentos - Esfoliantes Corporais', img: 'assets/produtos/abelha-rainha/lancamentos-esfoliantes-corporais__esfoliante-corporal-vanilla.jpg', keywords: 'esfoliante corporal vanilla lancamentos esfoliantes corporais abelha rainha' },
    { name: 'Esfoliante Corporal Melancia', category: 'Lançamentos - Esfoliantes Corporais', img: 'assets/produtos/abelha-rainha/lancamentos-esfoliantes-corporais__esfoliante-corporal-melancia.jpg', keywords: 'esfoliante corporal melancia lancamentos esfoliantes corporais abelha rainha' },
    { name: 'Esfoliante Corporal Maracujá', category: 'Lançamentos - Esfoliantes Corporais', img: 'assets/produtos/abelha-rainha/lancamentos-esfoliantes-corporais__esfoliante-corporal-maracuja.jpg', keywords: 'esfoliante corporal maracuja lancamentos esfoliantes corporais abelha rainha' },
    { name: 'Esfoliante Corporal Pitaya', category: 'Lançamentos - Esfoliantes Corporais', img: 'assets/produtos/abelha-rainha/lancamentos-esfoliantes-corporais__esfoliante-corporal-pitaya.jpg', keywords: 'esfoliante corporal pitaya lancamentos esfoliantes corporais abelha rainha' },
    { name: 'Hidratante Facial e Corporal para Pele Extrasseca', category: 'Hidratantes', img: 'assets/produtos/abelha-rainha/hidratantes__hidratante-facial-e-corporal-para-pele-extrasseca.jpg', keywords: 'hidratante facial e corporal para pele extrasseca hidratantes abelha rainha' },
    { name: 'Hidratante Corporal para Pele Extrasseca', category: 'Hidratantes', img: 'assets/produtos/abelha-rainha/hidratantes__hidratante-corporal-para-pele-extrasseca.jpg', keywords: 'hidratante corporal para pele extrasseca hidratantes abelha rainha' },
    { name: 'Hidratante Corporal para Pele Seca', category: 'Hidratantes', img: 'assets/produtos/abelha-rainha/hidratantes__hidratante-corporal-para-pele-seca.jpg', keywords: 'hidratante corporal para pele seca hidratantes abelha rainha' },
    { name: 'Hidratante Corporal Q10 e Vitamina C', category: 'Hidratantes', img: 'assets/produtos/abelha-rainha/hidratantes__hidratante-corporal-q10-e-vitamina-c.jpg', keywords: 'hidratante corporal q10 e vitamina c hidratantes abelha rainha' },
    { name: 'Hidratante Corporal Rosa Mosqueta', category: 'Hidratantes', img: 'assets/produtos/abelha-rainha/hidratantes__hidratante-corporal-rosa-mosqueta.jpg', keywords: 'hidratante corporal rosa mosqueta hidratantes abelha rainha' },
    { name: 'Óleo de Rosa Mosqueta Puro', category: 'Rosa Mosqueta', img: 'assets/produtos/abelha-rainha/rosa-mosqueta__oleo-de-rosa-mosqueta-puro.jpg', keywords: 'oleo de rosa mosqueta puro rosa mosqueta abelha rainha' },
    { name: 'Óleo de Rosa Mosqueta', category: 'Rosa Mosqueta', img: 'assets/produtos/abelha-rainha/rosa-mosqueta__oleo-de-rosa-mosqueta.jpg', keywords: 'oleo de rosa mosqueta rosa mosqueta abelha rainha' },
    { name: 'Creme Facial Clareador de Rosa Mosqueta', category: 'Rosa Mosqueta', img: 'assets/produtos/abelha-rainha/rosa-mosqueta__creme-facial-clareador-de-rosa-mosqueta.jpg', keywords: 'creme facial clareador de rosa mosqueta rosa mosqueta abelha rainha' },
    { name: 'Creme Facial Preventivo às Rugas de Rosa Mosqueta', category: 'Rosa Mosqueta', img: 'assets/produtos/abelha-rainha/rosa-mosqueta__creme-facial-preventivo-as-rugas-de-rosa-mosqueta.jpg', keywords: 'creme facial preventivo as rugas de rosa mosqueta rosa mosqueta abelha rainha' },
    { name: 'Sabonete Facial Vitamina C e Ácido Hialurônico', category: 'Vitamina C', img: 'assets/produtos/abelha-rainha/vitamina-c__sabonete-facial-vitamina-c-e-acido-hialuronico.jpg', keywords: 'sabonete facial vitamina c e acido hialuronico vitamina c abelha rainha' },
    { name: 'Sérum Facial Vitamina C', category: 'Vitamina C', img: 'assets/produtos/abelha-rainha/vitamina-c__serum-facial-vitamina-c.jpg', keywords: 'serum facial vitamina c vitamina c abelha rainha' },
    { name: 'Protetor Solar Facial Vitamina C', category: 'Vitamina C / Proteção Solar', img: 'assets/produtos/abelha-rainha/vitamina-c-protecao-solar__protetor-solar-facial-vitamina-c.jpg', keywords: 'protetor solar facial vitamina c vitamina c protecao solar abelha rainha' },
    { name: 'Protetor Solar Facial em Creme', category: 'Proteção Solar', img: 'assets/produtos/abelha-rainha/protecao-solar__protetor-solar-facial-em-creme.jpg', keywords: 'protetor solar facial em creme protecao solar abelha rainha' },
    { name: 'Protetor Solar Corporal em Spray', category: 'Proteção Solar', img: 'assets/produtos/abelha-rainha/protecao-solar__protetor-solar-corporal-em-spray.jpg', keywords: 'protetor solar corporal em spray protecao solar abelha rainha' },
    { name: 'Protetor Solar Facial FPS 80 - Cor de Base Bege Natural', category: 'Proteção Solar', img: 'assets/produtos/abelha-rainha/protecao-solar__protetor-solar-facial-fps-80-cor-de-base-bege-natural.jpg', keywords: 'protetor solar facial fps 80 cor de base bege natural protecao solar abelha rainha' },
    { name: 'Protetor Solar Facial FPS 80 - Cor de Base Bege Médio', category: 'Proteção Solar', img: 'assets/produtos/abelha-rainha/protecao-solar__protetor-solar-facial-fps-80-cor-de-base-bege-medio.jpg', keywords: 'protetor solar facial fps 80 cor de base bege medio protecao solar abelha rainha' },
    { name: 'Gel Refrescante Pós-sol', category: 'Proteção Solar', img: 'assets/produtos/abelha-rainha/protecao-solar__gel-refrescante-pos-sol.jpg', keywords: 'gel refrescante pos sol protecao solar abelha rainha' },
    { name: 'Sabonete Facial Antibacteriano', category: 'Acne', img: 'assets/produtos/abelha-rainha/acne__sabonete-facial-antibacteriano.jpg', keywords: 'sabonete facial antibacteriano acne abelha rainha' },
    { name: 'Loção Tônica Adstringente', category: 'Acne', img: 'assets/produtos/abelha-rainha/acne__locao-tonica-adstringente.jpg', keywords: 'locao tonica adstringente acne abelha rainha' },
    { name: 'Gel Secativo para Espinhas Roll-On', category: 'Acne', img: 'assets/produtos/abelha-rainha/acne__gel-secativo-para-espinhas-roll-on.jpg', keywords: 'gel secativo para espinhas roll on acne abelha rainha' },
    { name: 'Bastão Secativo para Espinhas', category: 'Acne', img: 'assets/produtos/abelha-rainha/acne__bastao-secativo-para-espinhas.jpg', keywords: 'bastao secativo para espinhas acne abelha rainha' },
    { name: 'Kit Antiacne', category: 'Acne', img: 'assets/produtos/abelha-rainha/acne__kit-antiacne.jpg', keywords: 'kit antiacne acne abelha rainha' },
    { name: 'Loção para Afinar os Pés - Milagre dos Pés', category: 'Dermopés', img: 'assets/produtos/abelha-rainha/dermopes__locao-para-afinar-os-pes-milagre-dos-pes.jpg', keywords: 'locao para afinar os pes milagre dos pes dermopes abelha rainha' },
    { name: 'Creme Ultra-Hidratante para os Pés', category: 'Dermopés', img: 'assets/produtos/abelha-rainha/dermopes__creme-ultra-hidratante-para-os-pes.jpg', keywords: 'creme ultra hidratante para os pes dermopes abelha rainha' },
    { name: 'Creme para Hidratar e Afinar os Pés', category: 'Dermopés', img: 'assets/produtos/abelha-rainha/dermopes__creme-para-hidratar-e-afinar-os-pes.jpg', keywords: 'creme para hidratar e afinar os pes dermopes abelha rainha' },
    { name: 'Gel Esfoliante para os Pés', category: 'Dermopés', img: 'assets/produtos/abelha-rainha/dermopes__gel-esfoliante-para-os-pes.jpg', keywords: 'gel esfoliante para os pes dermopes abelha rainha' },
    { name: 'Nanoprópolis Própolis Verde', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__nanopropolis-propolis-verde.jpg', keywords: 'nanopropolis propolis verde apisvida apisvida' },
    { name: 'Mel Tradicional Bisnaga Tampa Cone', category: 'Apisvida', img: 'assets/produtos/apisvida/mel__mel-tradicional-bisnaga-tampa-cone.jpg', keywords: 'mel tradicional bisnaga tampa cone apisvida apisvida' },
    { name: 'Própolis 2000 Extrato de Própolis Verde em Cápsulas', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__propolis-2000-extrato-de-propolis-verde-em-capsulas.jpg', keywords: 'propolis 2000 extrato de propolis verde em capsulas apisvida apisvida' },
    { name: 'Propoflex AP60 Extrato de Própolis Verde', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__propoflex-ap60-extrato-de-propolis-verde.jpg', keywords: 'propoflex ap60 extrato de propolis verde apisvida apisvida' },
    { name: 'Propoflex Extrato de Própolis Verde', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__propoflex-extrato-de-propolis-verde.jpg', keywords: 'propoflex extrato de propolis verde apisvida apisvida' },
    { name: 'Nanoprópolis Própolis Verde em Gotas', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__nanopropolis-propolis-verde-em-gotas.jpg', keywords: 'nanopropolis propolis verde em gotas apisvida apisvida' },
    { name: 'Nanoprópolis Própolis Blend em Gotas', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__nanopropolis-propolis-blend-em-gotas.jpg', keywords: 'nanopropolis propolis blend em gotas apisvida apisvida' },
    { name: 'Relâmpago Energético', category: 'Apisvida', img: 'assets/produtos/apisvida/energeticos__relampago-energetico.jpg', keywords: 'relampago energetico apisvida apisvida' },
    { name: 'Protetor Labial Manteiga de Cacau com Própolis', category: 'Apisvida', img: 'assets/produtos/apisvida/cuidado-pessoal__protetor-labial-manteiga-de-cacau-com-propolis.jpg', keywords: 'protetor labial manteiga de cacau com propolis apisvida apisvida' },
    { name: 'Mantex Manteiga de Cacau com Ácido Hialurônico', category: 'Apisvida', img: 'assets/produtos/apisvida/cuidado-pessoal__mantex-manteiga-de-cacau-com-acido-hialuronico.jpg', keywords: 'mantex manteiga de cacau com acido hialuronico apisvida apisvida' },
    { name: 'Spray para Garganta Extrato de Própolis (Mel, Menta, Malva e Gengibre)', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__spray-para-garganta-extrato-de-propolis-mel-menta-malva-e-gengibre.jpg', keywords: 'spray para garganta extrato de propolis mel menta malva e gengibre apisvida apisvida' },
    { name: 'Spray para Garganta Extrato de Própolis (Mel, Menta, Malva e Romã)', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis__spray-para-garganta-extrato-de-propolis-mel-menta-malva-e-roma.jpg', keywords: 'spray para garganta extrato de propolis mel menta malva e roma apisvida apisvida' },
    { name: 'Propoflex Kids Spray para Garganta (Mel, Malva e Romã)', category: 'Apisvida', img: 'assets/produtos/apisvida/propolis-kids__propoflex-kids-spray-para-garganta-mel-malva-e-roma.jpg', keywords: 'propoflex kids spray para garganta mel malva e roma apisvida apisvida' },
    { name: 'Balas Diet Halfresh Morango com Nanoprópolis', category: 'Apisvida', img: 'assets/produtos/apisvida/balas-diet__balas-diet-halfresh-morango-com-nanopropolis.jpg', keywords: 'balas diet halfresh morango com nanopropolis apisvida apisvida' },
    { name: 'Balas Diet Halfresh Mentol com Nanoprópolis', category: 'Apisvida', img: 'assets/produtos/apisvida/balas-diet__balas-diet-halfresh-mentol-com-nanopropolis.jpg', keywords: 'balas diet halfresh mentol com nanopropolis apisvida apisvida' },
    { name: 'Balas Diet Halfresh Gengibre com Nanoprópolis', category: 'Apisvida', img: 'assets/produtos/apisvida/balas-diet__balas-diet-halfresh-gengibre-com-nanopropolis.jpg', keywords: 'balas diet halfresh gengibre com nanopropolis apisvida apisvida' },
    { name: 'Propoflex Extrato Aquoso de Própolis', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__propoflex-extrato-aquoso-de-propolis.jpg', keywords: 'propoflex extrato aquoso de propolis apisvida apisvida' },
    { name: 'Propoflex Extrato de Própolis', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__propoflex-extrato-de-propolis.jpg', keywords: 'propoflex extrato de propolis apisvida apisvida' },
    { name: 'Nanoprópolis Extrato de Própolis Vermelho', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__nanopropolis-extrato-de-propolis-vermelho.jpg', keywords: 'nanopropolis extrato de propolis vermelho apisvida apisvida' },
    { name: 'Propoflex Kids Xarope Mel + Própolis', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__propoflex-kids-xarope-mel-propolis.jpg', keywords: 'propoflex kids xarope mel propolis apisvida apisvida' },
    { name: 'Propoflex Kids Própolis', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__propoflex-kids-propolis.jpg', keywords: 'propoflex kids propolis apisvida apisvida' },
    { name: 'Propoflex Kids Própolis + Morango', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__propoflex-kids-propolis-morango.jpg', keywords: 'propoflex kids propolis morango apisvida apisvida' },
    { name: 'Mel Apisvida', category: 'Apisvida', img: 'assets/produtos/apisvida/apisvida__mel-apisvida.jpg', keywords: 'mel apisvida apisvida apisvida' },
    { name: '1896 Nac N-acetil L-cisteina 60X550MG', category: '60X550MG', img: '', keywords: '1896 nac n acetil l cisteina 60x550mg 60x550mg farma' },
    { name: 'Barra Supino Zero Nozes e Damasco24g', category: '20X24G', img: '', keywords: 'barra supino zero nozes e damasco24g 20x24g farma' },
    { name: 'Barra Supino Zero Banana e Ameixa 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana e ameixa 24g 20x24g farma' },
    { name: 'Barra Supino Zero Banana ao Leite 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana ao leite 24g 20x24g farma' },
    { name: '1735 Treonato Magn + Treonina 60X650MG', category: '60X650MG', img: '', keywords: '1735 treonato magn treonina 60x650mg 60x650mg farma' },
    { name: 'Barra Supino Zero Banana e Açaí 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana e acai 24g 20x24g farma' },
    { name: 'Barra Nuts e Chocolate 25G', category: '12X25G', img: '', keywords: 'barra nuts e chocolate 25g 12x25g farma' },
    { name: 'Barra Supino Zero Banana Branco 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana branco 24g 20x24g farma' },
    { name: 'Barra Supino Zero Banana Maçã Canela 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana maca canela 24g 20x24g farma' },
    { name: 'Barra Protein + Banoffee 50G', category: '9X50G', img: '', keywords: 'barra protein banoffee 50g 9x50g farma' },
    { name: 'Barra Supino Orig. Banana ao Leite 24G', category: '20X24G', img: '', keywords: 'barra supino orig banana ao leite 24g 20x24g farma' },
    { name: 'Barra Nuts e Sementes 25G', category: '12X25G', img: '', keywords: 'barra nuts e sementes 25g 12x25g farma' },
    { name: 'Barra Protein + Napolitano 50G', category: '9X50G', img: '', keywords: 'barra protein napolitano 50g 9x50g farma' },
    { name: 'Supino Protein Morango 30G', category: '12X30G', img: '', keywords: 'supino protein morango 30g 12x30g farma' },
    { name: 'Barra Supino Zero Banana e Abacaxi 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana e abacaxi 24g 20x24g farma' },
    { name: 'Barra Nuts Frutas 25G', category: '12X25G', img: '', keywords: 'barra nuts frutas 25g 12x25g farma' },
    { name: 'Banana Passa 86G', category: '9X86G', img: '', keywords: 'banana passa 86g 9x86g farma' },
    { name: 'Barra Protein + Torta de Limao 50G', category: '9X50G', img: '', keywords: 'barra protein torta de limao 50g 9x50g farma' },
    { name: 'Barra Nuts e Morango 25G', category: '12X25G', img: '', keywords: 'barra nuts e morango 25g 12x25g farma' },
    { name: 'Supino Protein Chocolate 30G', category: '12X30G', img: '', keywords: 'supino protein chocolate 30g 12x30g farma' },
    { name: 'Barra Nuts Banana e Canela 25G', category: '12X25G', img: '', keywords: 'barra nuts banana e canela 25g 12x25g farma' },
    { name: 'Barra de Frutas Kids Choc Branco 22G', category: '20X22G', img: '', keywords: 'barra de frutas kids choc branco 22g 20x22g farma' },
    { name: 'Barra Supino Zero Banana e Morango 24G', category: '20X24G', img: '', keywords: 'barra supino zero banana e morango 24g 20x24g farma' },
    { name: 'Supino Protein Cookies 30G', category: '12X30G', img: '', keywords: 'supino protein cookies 30g 12x30g farma' },
    { name: 'Supino Protein Max Amend e Caramelo 46G', category: '9X46G', img: '', keywords: 'supino protein max amend e caramelo 46g 9x46g farma' },
    { name: 'Barra Protein + Cookies N\' Cream 50G', category: '9X50G', img: '', keywords: 'barra protein cookies n cream 50g 9x50g farma' },
    { name: 'Barra de Frutas Kids Morango 22G', category: '20X22G', img: '', keywords: 'barra de frutas kids morango 22g 20x22g farma' },
    { name: 'Barra de Frutas Kids Choc ao Leite 22G', category: '20X22G', img: '', keywords: 'barra de frutas kids choc ao leite 22g 20x22g farma' },
    { name: '1728 Quadrimag 4 60X700MG', category: '60X700MG', img: '', keywords: '1728 quadrimag 4 60x700mg 60x700mg farma' },
    { name: 'Energ Baly Tadaly 473ML', category: '473 ML', img: '', keywords: 'energ baly tadaly 473ml 473 ml farma' },
    { name: 'Creatina 100% 300G - Mix Nutri', category: '300G', img: '', keywords: 'creatina 100 300g mix nutri 300g farma' },
    { name: 'Supino Protein Coco C/choc. Branco 30G', category: '12X30G', img: '', keywords: 'supino protein coco c choc branco 30g 12x30g farma' },
    { name: '6669 Amora Miura Amorine 60X1000MG', category: '60X1000MG', img: '', keywords: '6669 amora miura amorine 60x1000mg 60x1000mg farma' },
    { name: 'Trio Avela e Castanha C Chocolate 12X20G', category: '12UNX20G', img: '', keywords: 'trio avela e castanha c chocolate 12x20g 12unx20g farma' },
    { name: '7574 Luteina C/ Zeaxantina 60X500MG', category: '60X500MG', img: '', keywords: '7574 luteina c zeaxantina 60x500mg 60x500mg farma' },
    { name: '0479 Vitam K2 Mk7 Menaquinona 60X500MG', category: '60X500MG', img: '', keywords: '0479 vitam k2 mk7 menaquinona 60x500mg 60x500mg farma' },
    { name: '6539 Biotina Plus 60X500MG', category: '60X500MG', img: '', keywords: '6539 biotina plus 60x500mg 60x500mg farma' },
    { name: 'Barra Mini Pouch Nuts Meio Amargo 60G', category: '60G', img: '', keywords: 'barra mini pouch nuts meio amargo 60g 60g farma' },
    { name: 'Barra de Frutas Kids Uva 22G', category: '20X22G', img: '', keywords: 'barra de frutas kids uva 22g 20x22g farma' },
    { name: '1377 Trimaca Peruana em Pó 100G', category: '100G', img: '', keywords: '1377 trimaca peruana em po 100g 100g farma' },
    { name: 'Barra Protein + Caramelo Salgado 50G', category: '9X50G', img: '', keywords: 'barra protein caramelo salgado 50g 9x50g farma' },
    { name: 'Energ Baly Frutas Tropicais 473ML', category: '473 ML', img: '', keywords: 'energ baly frutas tropicais 473ml 473 ml farma' },
    { name: 'Energ Baly Melancia 473ML', category: '473 ML', img: '', keywords: 'energ baly melancia 473ml 473 ml farma' },
    { name: '1797 Coenzima Q10 Pro 60 Comp 100MG', category: '60X500MG', img: '', keywords: '1797 coenzima q10 pro 60 comp 100mg 60x500mg farma' },
    { name: 'Hidratante Corp Rosa Mosqueta 400ML', category: '400ML', img: '', keywords: 'hidratante corp rosa mosqueta 400ml 400ml farma' },
    { name: 'Oleo de Rosa Mosqueta 20ML', category: '20ML', img: '', keywords: 'oleo de rosa mosqueta 20ml 20ml farma' },
    { name: 'Barra Supino Original Banana Branco 24G', category: '20X24G', img: '', keywords: 'barra supino original banana branco 24g 20x24g farma' },
    { name: '1292 Vitamina B12 Gotas Sabor Uva 20ML', category: '20ML', img: '', keywords: '1292 vitamina b12 gotas sabor uva 20ml 20ml farma' },
    { name: 'Balas Diet Halfresh Sabor Gengibre 192G', category: '192G', img: '', keywords: 'balas diet halfresh sabor gengibre 192g 192g farma' },
    { name: 'Energ Baly Maçã Verde sem Açucar 473ML', category: '473 ML', img: '', keywords: 'energ baly maca verde sem acucar 473ml 473 ml farma' },
    { name: 'Hidratante Corp Q10 Vitamina C 400ML', category: '400ML', img: '', keywords: 'hidratante corp q10 vitamina c 400ml 400ml farma' },
    { name: 'Energ Baly Melancia sem Açucar 473ML', category: '473 ML', img: '', keywords: 'energ baly melancia sem acucar 473ml 473 ml farma' },
    { name: '7093 Ferro Quelato Bisglicinato 60X500MG', category: '60X500MG', img: '', keywords: '7093 ferro quelato bisglicinato 60x500mg 60x500mg farma' },
    { name: 'Spray Propolis C/ Gengibre 30ML', category: '30ML', img: '', keywords: 'spray propolis c gengibre 30ml 30ml farma' },
    { name: 'Spray Propolis C/ Menta e Roma 30ML', category: '30ML', img: '', keywords: 'spray propolis c menta e roma 30ml 30ml farma' },
    { name: 'Hidratante Corp Pele Extrasseca 400ML', category: '400ML', img: '', keywords: 'hidratante corp pele extrasseca 400ml 400ml farma' },
    { name: 'Energ Baly Tradicional sem Açucar 473ML', category: '473 ML', img: '', keywords: 'energ baly tradicional sem acucar 473ml 473 ml farma' },
    { name: 'Energ Baly 473ML', category: '473 ML', img: '', keywords: 'energ baly 473ml 473 ml farma' },
    { name: 'Barra Mini Pouch Nuts ao Leite 60G', category: '60G', img: '', keywords: 'barra mini pouch nuts ao leite 60g 60g farma' },
    { name: 'Fitas de Clar Dental Roxa - 5 Aplicaçoes', category: '5G', img: '', keywords: 'fitas de clar dental roxa 5 aplicacoes 5g farma' },
    { name: 'Propoflex Ap60-ext. de Próp. 15% 30ML', category: '30ML', img: '', keywords: 'propoflex ap60 ext de prop 15 30ml 30ml farma' },
    { name: '0882 Creatina 300G', category: '300G', img: '', keywords: '0882 creatina 300g 300g farma' },
    { name: 'Energ Baly Maçã Verde 473ML', category: '473 ML', img: '', keywords: 'energ baly maca verde 473ml 473 ml farma' },
    { name: 'Supino Protein Cappuccino 30G', category: '12X30G', img: '', keywords: 'supino protein cappuccino 30g 12x30g farma' },
    { name: 'Oleo de Rosa Mosqueta 30ML', category: '30ML', img: '', keywords: 'oleo de rosa mosqueta 30ml 30ml farma' },
    { name: 'Nanopropolis Ext. Propolis Verde 20ML', category: '20ML', img: '', keywords: 'nanopropolis ext propolis verde 20ml 20ml farma' },
    { name: '8007 Vitamina B12 60X500MG', category: '60X500MG', img: '', keywords: '8007 vitamina b12 60x500mg 60x500mg farma' },
    { name: 'Creatina 100% Monohidra 300G - Pronabol', category: '300G', img: '', keywords: 'creatina 100 monohidra 300g pronabol 300g farma' },
    { name: '4832 Propolis Defense 60X550MG', category: '60X550MG', img: '', keywords: '4832 propolis defense 60x550mg 60x550mg farma' },
    { name: 'Barra Nuts e Abacaxi 25G', category: '12X25G', img: '', keywords: 'barra nuts e abacaxi 25g 12x25g farma' },
    { name: 'Hidratante Corp Pele Seca 400ML', category: '400ML', img: '', keywords: 'hidratante corp pele seca 400ml 400ml farma' },
    { name: 'Barra Nuts e Frutas Vermelhas 25G', category: '12X25G', img: '', keywords: 'barra nuts e frutas vermelhas 25g 12x25g farma' },
    { name: 'Diet Shake Baunilha Nutrilatina 420G', category: '420G', img: '', keywords: 'diet shake baunilha nutrilatina 420g 420g farma' },
    { name: 'Barra Nuts e Pasta de Amendoim 25G', category: '12X25G', img: '', keywords: 'barra nuts e pasta de amendoim 25g 12x25g farma' },
    { name: 'Barra Pe de Moleque Caramelo Salgado 20G', category: '16X20G', img: '', keywords: 'barra pe de moleque caramelo salgado 20g 16x20g farma' },
    { name: 'Mel Holanda Bisnaga 200G', category: '200G', img: '', keywords: 'mel holanda bisnaga 200g 200g farma' },
    { name: 'Barra Nuts Coco e Chocolate 25G', category: '12X25G', img: '', keywords: 'barra nuts coco e chocolate 25g 12x25g farma' },
    { name: '6126 Magnesio Dimalato 60X650MG', category: '60X650MG', img: '', keywords: '6126 magnesio dimalato 60x650mg 60x650mg farma' },
    { name: '8106 Zinco Quelato Bisglicinato 60X500MG', category: '60X500MG', img: '', keywords: '8106 zinco quelato bisglicinato 60x500mg 60x500mg farma' },
    { name: '6553 Moviflex Colageno Tipo 2 60X650MG', category: '60X650MG', img: '', keywords: '6553 moviflex colageno tipo 2 60x650mg 60x650mg farma' },
    { name: 'Energ Baly Mor e Pêss S/ Açucar 473ML', category: '473 ML', img: '', keywords: 'energ baly mor e pess s acucar 473ml 473 ml farma' },
    { name: '6607 Vitamina a 60X500MG', category: '60X500MG', img: '', keywords: '6607 vitamina a 60x500mg 60x500mg farma' },
    { name: 'Barra Pe de Moleque 20G', category: '16X20G', img: '', keywords: 'barra pe de moleque 20g 16x20g farma' },
    { name: '0806 Resveratrol Trans 30X500MG', category: '30X500MG', img: '', keywords: '0806 resveratrol trans 30x500mg 30x500mg farma' },
    { name: '5075 Curcuma 30 Caps 30X500MG', category: '30X500MG', img: '', keywords: '5075 curcuma 30 caps 30x500mg 30x500mg farma' },
    { name: 'Creme Para Os Pes Ultra-hidratante 100G', category: '100G', img: '', keywords: 'creme para os pes ultra hidratante 100g 100g farma' },
    { name: '6331 Colageno Hidrolisado 60X1100MG', category: '60X1100MG', img: '', keywords: '6331 colageno hidrolisado 60x1100mg 60x1100mg farma' },
    { name: '0776 Laranja Moro 60X500MG', category: '60X500MG', img: '', keywords: '0776 laranja moro 60x500mg 60x500mg farma' },
    { name: 'Creme Para Os Pes Hidratar e Afinar 100G', category: '100G', img: '', keywords: 'creme para os pes hidratar e afinar 100g 100g farma' },
    { name: '6102 Triptoflex 60X600MG', category: '60X600MG', img: '', keywords: '6102 triptoflex 60x600mg 60x600mg farma' },
    { name: 'Diet Shake Chocolate Nutrilatina 420G', category: '420G', img: '', keywords: 'diet shake chocolate nutrilatina 420g 420g farma' },
    { name: 'Propoflex Kids Spray Tutti-frutti 35ML', category: '35ML', img: '', keywords: 'propoflex kids spray tutti frutti 35ml 35ml farma' },
    { name: 'Energ Baly Tropical S/ Açucar 473ML', category: '473 ML', img: '', keywords: 'energ baly tropical s acucar 473ml 473 ml farma' },
    { name: 'Fitas de Clar Dental Roxa - 7 Aplicaçoes', category: '2G', img: '', keywords: 'fitas de clar dental roxa 7 aplicacoes 2g farma' },
    { name: 'Diet Shake Banana Nutrilatina 420G', category: '420G', img: '', keywords: 'diet shake banana nutrilatina 420g 420g farma' },
    { name: 'Energ Baly Morango e Pessego 473ML', category: '473 ML', img: '', keywords: 'energ baly morango e pessego 473ml 473 ml farma' },
    { name: 'Trio Morango com Chocolate 12X20G', category: '12UNX20G', img: '', keywords: 'trio morango com chocolate 12x20g 12unx20g farma' },
    { name: 'Protetor Sol Facial Fps 80 - sem Cor 60G', category: '60G', img: '', keywords: 'protetor sol facial fps 80 sem cor 60g 60g farma' },
    { name: 'Choklers Crisp Caramelo C Cho 12X33G', category: '12X33G', img: '', keywords: 'choklers crisp caramelo c cho 12x33g 12x33g farma' },
    { name: '6690 Cromo Picolinato 60X500MG', category: '60X500MG', img: '', keywords: '6690 cromo picolinato 60x500mg 60x500mg farma' },
    { name: 'Energ Baly Coco e Açai 473ML', category: '473 ML', img: '', keywords: 'energ baly coco e acai 473ml 473 ml farma' },
    { name: '3255 Coenzima Q10 Ultra 60 Comp 500MG', category: '60X500MG', img: '', keywords: '3255 coenzima q10 ultra 60 comp 500mg 60x500mg farma' },
    { name: 'B. Proteica Pistache C Choco Branco 70G', category: '9UNX70G', img: '', keywords: 'b proteica pistache c choco branco 70g 9unx70g farma' },
    { name: 'Energ Baly Melancia 2L', category: '2 LITROS', img: '', keywords: 'energ baly melancia 2l 2 litros farma' },
    { name: '1308 Magnesio Inositol 330G', category: '330G', img: '', keywords: '1308 magnesio inositol 330g 330g farma' },
    { name: '9172 Curcuma Curcumina 60X500MG', category: '60X500MG', img: '', keywords: '9172 curcuma curcumina 60x500mg 60x500mg farma' },
    { name: '0820 Melatonina Gotas Sab Maracuja 20ML', category: '30ML', img: '', keywords: '0820 melatonina gotas sab maracuja 20ml 30ml farma' },
    { name: 'Diet Shake Morango Nutrilatina 420G', category: '420G', img: '', keywords: 'diet shake morango nutrilatina 420g 420g farma' },
    { name: '6522 Multi Vitaminico Hemovital 60X750MG', category: '60X750MG', img: '', keywords: '6522 multi vitaminico hemovital 60x750mg 60x750mg farma' },
    { name: 'Vitamina C 20% Serum Face e Olhos 30ML', category: '30ML', img: '', keywords: 'vitamina c 20 serum face e olhos 30ml 30ml farma' },
    { name: '6744 Total Efa 60X1350MG', category: '60X1350MG', img: '', keywords: '6744 total efa 60x1350mg 60x1350mg farma' },
    { name: 'Trio Banana Aveia e Mel 12X20G', category: '12UNX20G', img: '', keywords: 'trio banana aveia e mel 12x20g 12unx20g farma' },
    { name: '6546 Complexo B Max 60X500MG', category: '60X500MG', img: '', keywords: '6546 complexo b max 60x500mg 60x500mg farma' },
    { name: 'Energ Baly 250ML Lata', category: '250ML', img: '', keywords: 'energ baly 250ml lata 250ml farma' },
    { name: '6720 Omega 3 Pro 18/12 60X1350MG', category: '60X1350MG', img: '', keywords: '6720 omega 3 pro 18 12 60x1350mg 60x1350mg farma' },
    { name: 'Loçao P/ Afinar Os Pes 30ML', category: '30ML', img: '', keywords: 'locao p afinar os pes 30ml 30ml farma' },
    { name: 'Manteiga de Cacau C/ Propolis 12UN', category: '42G', img: '', keywords: 'manteiga de cacau c propolis 12un 42g farma' },
    { name: 'Trio Brigadeiro 12X20G', category: '12UNX20G', img: '', keywords: 'trio brigadeiro 12x20g 12unx20g farma' },
    { name: '6676 Calcio Citrato Malato 60X1200MG', category: '60X1200MG', img: '', keywords: '6676 calcio citrato malato 60x1200mg 60x1200mg farma' },
    { name: '9554 Omega 3 Ultra 50/20 60X1350MG', category: '60X1350MG', img: '', keywords: '9554 omega 3 ultra 50 20 60x1350mg 60x1350mg farma' },
    { name: 'Energ Baly Tadaly 2L', category: '2 LITROS', img: '', keywords: 'energ baly tadaly 2l 2 litros farma' },
    { name: 'Choklers Crisp Cookies 12X33G', category: '12X33G', img: '', keywords: 'choklers crisp cookies 12x33g 12x33g farma' },
    { name: 'L - Arginina Performance 60X625MG', category: '60X625MG', img: '', keywords: 'l arginina performance 60x625mg 60x625mg farma' },
    { name: 'Kit Scudo P/ Piolho - Arruda e Citronela', category: '437ML', img: '', keywords: 'kit scudo p piolho arruda e citronela 437ml farma' },
    { name: '6713 Oleo de Primula 60X1340MG', category: '60X1340MG', img: '', keywords: '6713 oleo de primula 60x1340mg 60x1340mg farma' },
    { name: '9424 Oleo de Alho Desodorizado 60X500MG', category: '60X500MG', img: '', keywords: '9424 oleo de alho desodorizado 60x500mg 60x500mg farma' },
    { name: '0998 Fiberliv 7 Fibras 250G', category: '250G', img: '', keywords: '0998 fiberliv 7 fibras 250g 250g farma' },
    { name: 'Whey Sache Baunilha Nutrilatina 300G', category: '10UNX30G', img: '', keywords: 'whey sache baunilha nutrilatina 300g 10unx30g farma' },
    { name: '9158 Melatonina 120X500MG', category: '120X500MG', img: '', keywords: '9158 melatonina 120x500mg 120x500mg farma' },
    { name: 'Creme Facial Clareador Para Marcas 50G', category: '50G', img: '', keywords: 'creme facial clareador para marcas 50g 50g farma' },
    { name: 'Relampago Energetico 10ML Display C/ 24U', category: '240ML', img: '', keywords: 'relampago energetico 10ml display c 24u 240ml farma' },
    { name: '1391 Ora Pro Nobis Sabor Limao 150G', category: '150G', img: '', keywords: '1391 ora pro nobis sabor limao 150g 150g farma' },
    { name: 'Nanopropolis Ext. Propolis Vermelha 20ML', category: '20ML', img: '', keywords: 'nanopropolis ext propolis vermelha 20ml 20ml farma' },
    { name: 'Manteiga de Cacau C/ Propolis 50UN', category: '175G', img: '', keywords: 'manteiga de cacau c propolis 50un 175g farma' },
    { name: 'Choklers Morango C/ Nibs de Cacau 12X40G', category: '12X40G', img: '', keywords: 'choklers morango c nibs de cacau 12x40g 12x40g farma' },
    { name: 'Choklers Banoffe 12X40G', category: '12X40G', img: '', keywords: 'choklers banoffe 12x40g 12x40g farma' },
    { name: 'Balas Diet Halfresh Sabor Mentol 192G', category: '192G', img: '', keywords: 'balas diet halfresh sabor mentol 192g 192g farma' },
    { name: 'Manteiga de Cacau C/ Propolis 3,5G', category: '3,5G', img: '', keywords: 'manteiga de cacau c propolis 3 5g 3 5g farma' },
    { name: 'Detergente Pó Ace Cartucho 2,2KG', category: '2,2KG', img: '', keywords: 'detergente po ace cartucho 2 2kg 2 2kg farma' },
    { name: 'Bastao Acne Secativo 5G', category: '5G', img: '', keywords: 'bastao acne secativo 5g 5g farma' },
    { name: 'Whey Sache Choco Belga Nutrilatina 310G', category: '10UNX31G', img: '', keywords: 'whey sache choco belga nutrilatina 310g 10unx31g farma' },
    { name: '6560 Cloreto de Magnesio 60X650MG', category: '60X650MG', img: '', keywords: '6560 cloreto de magnesio 60x650mg 60x650mg farma' },
    { name: 'Mix Nutri Snack Bacon 50G', category: '50G', img: '', keywords: 'mix nutri snack bacon 50g 50g farma' },
    { name: 'Mix Nutri Snack 4 Queijos 50G', category: '50G', img: '', keywords: 'mix nutri snack 4 queijos 50g 50g farma' },
    { name: 'Mix Nutri Snack Requeijão 50G', category: '50G', img: '', keywords: 'mix nutri snack requeijao 50g 50g farma' },
    { name: 'Hidra Facial e Corp Pele Extrasseca 60G', category: '60G', img: '', keywords: 'hidra facial e corp pele extrasseca 60g 60g farma' },
    { name: 'Trio Coco com Chocolate 12X20G', category: '12UNX20G', img: '', keywords: 'trio coco com chocolate 12x20g 12unx20g farma' },
    { name: 'Energ Baly 2L', category: '2 LITROS', img: '', keywords: 'energ baly 2l 2 litros farma' },
    { name: 'Vitamina C + Zinco Quelato 60X750MG', category: '60X750MG', img: '', keywords: 'vitamina c zinco quelato 60x750mg 60x750mg farma' },
    { name: '1773 Vitamina D3 + K2 em Gotas', category: '20ML', img: '', keywords: '1773 vitamina d3 k2 em gotas 20ml farma' },
    { name: '0813 Cafeina 60X500MG', category: '60X500MG', img: '', keywords: '0813 cafeina 60x500mg 60x500mg farma' },
    { name: '100% Whey Banoffe 900G', category: '900G', img: '', keywords: '100 whey banoffe 900g 900g farma' },
    { name: '7031 Cobre Quelato Bisglicinato 60X500MG', category: '60X500MG', img: '', keywords: '7031 cobre quelato bisglicinato 60x500mg 60x500mg farma' },
    { name: 'Gel Esfoliante Para Os Pes 100G', category: '100G', img: '', keywords: 'gel esfoliante para os pes 100g 100g farma' },
    { name: '2644 Oleo de Semente de Abobora 1400MG', category: '60X1400MG', img: '', keywords: '2644 oleo de semente de abobora 1400mg 60x1400mg farma' },
    { name: 'Mel Organico 300G', category: '300G', img: '', keywords: 'mel organico 300g 300g farma' },
    { name: 'Mel Puro Bisnaga 250G - Apis Vida', category: '250G', img: '', keywords: 'mel puro bisnaga 250g apis vida 250g farma' },
    { name: '0790 Beta Glucana 30 Caps 30X500MG', category: '30X500MG', img: '', keywords: '0790 beta glucana 30 caps 30x500mg 30x500mg farma' },
    { name: 'Fitas de Clar Dental Roxa 12 Aplicaçoes', category: '12G', img: '', keywords: 'fitas de clar dental roxa 12 aplicacoes 12g farma' },
    { name: '8014 Licopeno de Tomate 60X500MG', category: '60X500MG', img: '', keywords: '8014 licopeno de tomate 60x500mg 60x500mg farma' },
    { name: '1780 Vitamina D3 20ML', category: '20ML', img: '', keywords: '1780 vitamina d3 20ml 20ml farma' },
    { name: 'Balas Diet Halfresh Sabor Morango192g', category: '192G', img: '', keywords: 'balas diet halfresh sabor morango192g 192g farma' },
    { name: '6324 Extrato de Propolis 60X550MG', category: '60X550MG', img: '', keywords: '6324 extrato de propolis 60x550mg 60x550mg farma' },
    { name: '6348 Cranberry 60X1100MG', category: '60X1100MG', img: '', keywords: '6348 cranberry 60x1100mg 60x1100mg farma' },
    { name: 'Choklers Chocrante 12X40G', category: '12X40G', img: '', keywords: 'choklers chocrante 12x40g 12x40g farma' },
    { name: 'Creme Facial Preventivo As Rugas 50G', category: '50G', img: '', keywords: 'creme facial preventivo as rugas 50g 50g farma' },
    { name: 'Energ Baly Floripa Spritz 250ML Lata', category: '250ML', img: '', keywords: 'energ baly floripa spritz 250ml lata 250ml farma' },
    { name: 'Nectar Marata Laranja 1L', category: '1L', img: '', keywords: 'nectar marata laranja 1l 1l farma' },
    { name: 'Mel T Monica Organico 300G', category: '300G', img: '', keywords: 'mel t monica organico 300g 300g farma' },
    { name: 'Kit Acne Tratamento em Casa 230ML / 5G', category: '230ML / 5G', img: '', keywords: 'kit acne tratamento em casa 230ml 5g 230ml 5g farma' },
    { name: 'Mel T Monica Laranjeira 300G', category: '300G', img: '', keywords: 'mel t monica laranjeira 300g 300g farma' },
    { name: '100% Whey Cookies And Cream 900G\'', category: '900G', img: '', keywords: '100 whey cookies and cream 900g 900g farma' },
    { name: '6157 Vitamina D3 Colecalciferol 60X500MG', category: '60X500MG', img: '', keywords: '6157 vitamina d3 colecalciferol 60x500mg 60x500mg farma' },
    { name: '0721 Metil Folax 60X500MG', category: '60X500MG', img: '', keywords: '0721 metil folax 60x500mg 60x500mg farma' },
    { name: 'Energ Baly Morango e Pessego 2L', category: '2 LITROS', img: '', keywords: 'energ baly morango e pessego 2l 2 litros farma' },
    { name: 'Energ Cereja Baly sem Açucar 2L', category: '2 LITROS', img: '', keywords: 'energ cereja baly sem acucar 2l 2 litros farma' },
    { name: 'Energ Maçã Verde 2L', category: '2 LITROS', img: '', keywords: 'energ maca verde 2l 2 litros farma' },
    { name: 'Protetor Sol Facial Fps 80 -bege Med 40G', category: '40G', img: '', keywords: 'protetor sol facial fps 80 bege med 40g 40g farma' },
    { name: 'Protetor Sol Facial Fps 80 -bege Nat 40G', category: '40G', img: '', keywords: 'protetor sol facial fps 80 bege nat 40g 40g farma' },
    { name: 'Relampago Energetico 10ML Display C/ 48', category: '480ML', img: '', keywords: 'relampago energetico 10ml display c 48 480ml farma' },
    { name: 'Nectar Marata Maracuja 200ML', category: '200ML', img: '', keywords: 'nectar marata maracuja 200ml 200ml farma' },
    { name: '5082 Procran Cranberry 30X500MG', category: '30X500MG', img: '', keywords: '5082 procran cranberry 30x500mg 30x500mg farma' },
    { name: 'Choklers Cookies 12X40G', category: '12X40G', img: '', keywords: 'choklers cookies 12x40g 12x40g farma' },
    { name: 'Choklers Cheesecake 12X40G', category: '12X40G', img: '', keywords: 'choklers cheesecake 12x40g 12x40g farma' },
    { name: 'Choklers Pistache 12X40G', category: '12X40G', img: '', keywords: 'choklers pistache 12x40g 12x40g farma' },
    { name: '6058 Msm Enxofre Organico 60X600MG', category: '60X600MG', img: '', keywords: '6058 msm enxofre organico 60x600mg 60x600mg farma' },
    { name: 'Nectar Marata Uva 1L', category: '1L', img: '', keywords: 'nectar marata uva 1l 1l farma' },
    { name: 'Nectar Marata Maracuja 1L', category: '1L', img: '', keywords: 'nectar marata maracuja 1l 1l farma' },
    { name: 'Nectar Marata Pessego 1L', category: '1L', img: '', keywords: 'nectar marata pessego 1l 1l farma' },
    { name: 'Sup. Alim. Baly Kids Tutti Frutti 220ML', category: '220ML', img: '', keywords: 'sup alim baly kids tutti frutti 220ml 220ml farma' },
    { name: '100% Whey Chocolate e Avela 900G', category: '900G', img: '', keywords: '100 whey chocolate e avela 900g 900g farma' },
    { name: 'Sup. Alim. Baly Kids Morango 220ML', category: '220ML', img: '', keywords: 'sup alim baly kids morango 220ml 220ml farma' },
    { name: 'Geleia Baldoni Morango Pote 270G', category: '270G', img: '', keywords: 'geleia baldoni morango pote 270g 270g farma' },
    { name: 'Geleia Baldoni Frutas Vermelhas Pote 270', category: '270G', img: '', keywords: 'geleia baldoni frutas vermelhas pote 270 270g farma' },
    { name: 'Geleia Baldoni Abacaxi Pote 270G', category: '270G', img: '', keywords: 'geleia baldoni abacaxi pote 270g 270g farma' },
    { name: 'Geleia Baldoni Frutas Amarelas Pote 270G', category: '270G', img: '', keywords: 'geleia baldoni frutas amarelas pote 270g 270g farma' },
    { name: 'Energ Frutas Tropicais 2L', category: '2 LITROS', img: '', keywords: 'energ frutas tropicais 2l 2 litros farma' },
    { name: 'Nectar Marata Uva 200ML', category: '200ML', img: '', keywords: 'nectar marata uva 200ml 200ml farma' },
    { name: 'Nectar Marata Laranja 200ML', category: '200ML', img: '', keywords: 'nectar marata laranja 200ml 200ml farma' },
    { name: 'Nectar Marata Caju 200ML', category: '200ML', img: '', keywords: 'nectar marata caju 200ml 200ml farma' },
    { name: 'Sabonete Acne Liquido Facial 110ML', category: '110ML', img: '', keywords: 'sabonete acne liquido facial 110ml 110ml farma' },
    { name: 'Mel Organica Sache 80G - Apis Vida', category: '80G', img: '', keywords: 'mel organica sache 80g apis vida 80g farma' },
    { name: 'Azeitona Verde Sache C/ Caroço 100G', category: '160G', img: '', keywords: 'azeitona verde sache c caroco 100g 160g farma' },
    { name: 'Energ Baly Cereja 473ML', category: '473 ML', img: '', keywords: 'energ baly cereja 473ml 473 ml farma' },
    { name: 'Energ Baly Champanhe 250ML Lata', category: '250ML', img: '', keywords: 'energ baly champanhe 250ml lata 250ml farma' },
    { name: 'Sup. Alim. Baly Kids Laranja 220ML', category: '220ML', img: '', keywords: 'sup alim baly kids laranja 220ml 220ml farma' },
    { name: 'Suco Sumo Acai 300 Ml', category: '6UNX300ML', img: '', keywords: 'suco sumo acai 300 ml 6unx300ml farma' },
    { name: 'Esfoliante Corporal Melancia 200G', category: '200G', img: '', keywords: 'esfoliante corporal melancia 200g 200g farma' },
    { name: 'Mix Nutri Snack Barbecue 50G', category: '50G', img: '', keywords: 'mix nutri snack barbecue 50g 50g farma' },
    { name: 'Sup. Alim. Baly Kids Melancia 220ML', category: '220ML', img: '', keywords: 'sup alim baly kids melancia 220ml 220ml farma' },
    { name: 'Baly Tradicional', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__tradicional.jpg', keywords: 'baly tradicional baly brasil baly brasil' },
    { name: 'Baly Tropical', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__tropical.jpg', keywords: 'baly tropical baly brasil baly brasil' },
    { name: 'Baly Maçã Verde', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__maca-verde.jpg', keywords: 'baly maca verde baly brasil baly brasil' },
    { name: 'Baly Melancia', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__melancia.jpg', keywords: 'baly melancia baly brasil baly brasil' },
    { name: 'Baly Morango e Pêssego', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__morango-e-pessego.jpg', keywords: 'baly morango e pessego baly brasil baly brasil' },
    { name: 'Baly Coco e Açaí', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__coco-e-acai.jpg', keywords: 'baly coco e acai baly brasil baly brasil' },
    { name: 'Baly Tadaly', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__tadaly.webp', keywords: 'baly tadaly baly brasil baly brasil' },
    { name: 'Baly Uva Verde', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__uva-verde.webp', keywords: 'baly uva verde baly brasil baly brasil' },
    { name: 'Baly Abacaxi com Hortelã', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__abacaxi-com-hortela.jpg', keywords: 'baly abacaxi com hortela baly brasil baly brasil' },
    { name: 'Baly Amora com Hortelã', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__amora-com-hortela.webp', keywords: 'baly amora com hortela baly brasil baly brasil' },
    { name: 'Baly Freegells', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__freegells.jpg', keywords: 'baly freegells baly brasil baly brasil' },
    { name: 'Baly Summer Loko', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__summer-loko.jpg', keywords: 'baly summer loko baly brasil baly brasil' },
    { name: 'Baly Celebre Champagne', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__celebre-champagne.jpg', keywords: 'baly celebre champagne baly brasil baly brasil' },
    { name: 'Baly Celebre Floripa', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__celebre-floripa.webp', keywords: 'baly celebre floripa baly brasil baly brasil' },
    { name: 'Baly Celebre Caipirinha', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__celebre-caipirinha.webp', keywords: 'baly celebre caipirinha baly brasil baly brasil' },
    { name: 'Baly Tradicional Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__tradicional-sem-acucar.jpg', keywords: 'baly tradicional sem acucar baly brasil baly brasil' },
    { name: 'Baly Tropical Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__tropical-sem-acucar.jpg', keywords: 'baly tropical sem acucar baly brasil baly brasil' },
    { name: 'Baly Maçã Verde Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__maca-verde-sem-acucar.jpg', keywords: 'baly maca verde sem acucar baly brasil baly brasil' },
    { name: 'Baly Uva Verde Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__uva-verde-sem-acucar.webp', keywords: 'baly uva verde sem acucar baly brasil baly brasil' },
    { name: 'Baly Melancia Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__melancia-sem-acucar.jpg', keywords: 'baly melancia sem acucar baly brasil baly brasil' },
    { name: 'Baly Morango e Pêssego Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__morango-e-pessego-sem-acucar.jpg', keywords: 'baly morango e pessego sem acucar baly brasil baly brasil' },
    { name: 'Baly Amora com Hortelã Sem Açúcar', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__amora-com-hortela-sem-acucar.webp', keywords: 'baly amora com hortela sem acucar baly brasil baly brasil' },
    { name: 'Baly Redragon', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__redragon.jpg', keywords: 'baly redragon baly brasil baly brasil' },
    { name: 'Baly Pro Tropical', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__pro-tropical.webp', keywords: 'baly pro tropical baly brasil baly brasil' },
    { name: 'Baly Pro Morango e Pêssego', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__pro-morango-e-pessego.webp', keywords: 'baly pro morango e pessego baly brasil baly brasil' },
    { name: 'Baly Pro Banana', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__pro-banana.webp', keywords: 'baly pro banana baly brasil baly brasil' },
    { name: 'Baly Free Tradicional', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__free-tradicional.webp', keywords: 'baly free tradicional baly brasil baly brasil' },
    { name: 'Baly Free Maçã Verde', category: 'Baly Brasil', img: 'assets/produtos/baly/energy__free-maca-verde.webp', keywords: 'baly free maca verde baly brasil baly brasil' },
    { name: 'Baly Kids Tutti Frutti', category: 'Baly Brasil', img: 'assets/produtos/baly/kids__tutti-frutti.webp', keywords: 'baly kids tutti frutti baly brasil baly brasil' },
    { name: 'Baly Kids Laranja', category: 'Baly Brasil', img: 'assets/produtos/baly/kids__laranja.webp', keywords: 'baly kids laranja baly brasil baly brasil' },
    { name: 'Baly Kids Melancia', category: 'Baly Brasil', img: 'assets/produtos/baly/kids__melancia.webp', keywords: 'baly kids melancia baly brasil baly brasil' },
    { name: 'Baly Kids Morango', category: 'Baly Brasil', img: 'assets/produtos/baly/kids__morango.webp', keywords: 'baly kids morango baly brasil baly brasil' },
    { name: 'Baly Kids Uva', category: 'Baly Brasil', img: 'assets/produtos/baly/kids__uva.webp', keywords: 'baly kids uva baly brasil baly brasil' },
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

// ===== Formulario "Quero ser cliente" (monta mensagem e abre o WhatsApp) =====
document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('clientForm');
    if (!form) return;

    var WHATSAPP_NUMBER = '5521992111843';

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var company = form.company.value.trim();
        var cnpj = form.cnpj.value.trim();
        var segmento = form.segmento.value;
        var name = form.name.value.trim();
        var phone = form.phone.value.trim();
        var city = form.city.value.trim();
        var message = form.message.value.trim();

        var lines = [
            'Olá! Gostaria de me tornar cliente da Distri Rio.',
            '',
            '*Empresa:* ' + company,
            '*CNPJ:* ' + cnpj,
            '*Ramo:* ' + segmento,
            '*Responsável:* ' + name,
            '*Telefone:* ' + phone
        ];
        if (city) lines.push('*Cidade:* ' + city);
        if (message) lines.push('', message);

        var text = lines.join('\n');

        if (typeof gtag === 'function') {
            gtag('event', 'client_signup_submit', { page_path: window.location.pathname });
        }

        window.open('https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
    });
});
