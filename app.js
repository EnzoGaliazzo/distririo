/* =====================================================================
   Distri Rio — comportamento do site
   O catálogo NÃO mora mais aqui: é baixado sob demanda de
   assets/data/produtos.json, gerado por tools/gerar.js a partir de
   data/produtos.json. Editar produto é editar aquele arquivo.
   ===================================================================== */
(function () {
    'use strict';

    // =================================================================
    // Utilitários
    // =================================================================

    // Ignora maiúsculas/minúsculas e acentos: "marata" acha "Maratá".
    // O intervalo dos acentos combinantes vai escapado de propósito — escrito
    // literalmente, a busca quebra em silêncio se o arquivo mudar de encoding.
    function normalizar(str) {
        return (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    }

    function aoCarregar(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    function debounce(fn, ms) {
        var t;
        return function () {
            var args = arguments, ctx = this;
            clearTimeout(t);
            t = setTimeout(function () { fn.apply(ctx, args); }, ms);
        };
    }

    function menosMovimento() {
        return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function noViewport(el) {
        var r = el.getBoundingClientRect();
        return r.bottom > 0 && r.top < (window.innerHeight || 0);
    }

    function guardar(chave, valor) {
        try { localStorage.setItem(chave, valor); } catch (e) { /* modo privado */ }
    }

    function recuperar(chave) {
        try { return localStorage.getItem(chave); } catch (e) { return null; }
    }

    // =================================================================
    // Consentimento de cookies e Analytics
    // O gtag.js só entra na página depois do aceite. Antes disso o
    // Consent Mode já está em "denied" pelo stub que roda no <head>.
    // =================================================================
    var CHAVE_CONSENTIMENTO = 'dr-consentimento-medicao';

    function carregarAnalytics() {
        if (window.DR_GA_CARREGADO || !window.DR_GA_ID) return;
        window.DR_GA_CARREGADO = true;
        var s = document.createElement('script');
        s.async = true;
        s.src = 'https://www.googletagmanager.com/gtag/js?id=' + window.DR_GA_ID;
        document.head.appendChild(s);
        if (typeof gtag === 'function') {
            gtag('consent', 'update', { analytics_storage: 'granted' });
            gtag('config', window.DR_GA_ID, { anonymize_ip: true });
        }
    }

    function decidirMedicao(aceitou) {
        guardar(CHAVE_CONSENTIMENTO, aceitou ? 'sim' : 'nao');
        if (aceitou) carregarAnalytics();
    }

    function montarBannerCookies() {
        var banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-labelledby', 'cookieTitulo');
        banner.setAttribute('aria-describedby', 'cookieTexto');
        banner.innerHTML =
            '<h2 id="cookieTitulo">Cookies de medição</h2>' +
            '<p id="cookieTexto">Usamos o Google Analytics só para entender quais páginas as pessoas visitam. ' +
            'Nada é carregado antes de você escolher. Veja a ' +
            '<a href="' + (document.body.getAttribute('data-base') || '') + 'politica-de-privacidade.html">política de privacidade</a>.</p>' +
            '<div class="cookie-acoes">' +
            '<button type="button" class="cookie-aceitar">Aceitar</button>' +
            '<button type="button" class="cookie-recusar">Recusar</button>' +
            '</div>';
        document.body.appendChild(banner);

        function fechar(aceitou) {
            decidirMedicao(aceitou);
            banner.remove();
        }
        banner.querySelector('.cookie-aceitar').addEventListener('click', function () { fechar(true); });
        banner.querySelector('.cookie-recusar').addEventListener('click', function () { fechar(false); });
        banner.querySelector('.cookie-aceitar').focus();
        return banner;
    }

    aoCarregar(function () {
        var escolha = recuperar(CHAVE_CONSENTIMENTO);
        if (escolha === 'sim') {
            carregarAnalytics();
        } else if (escolha !== 'nao') {
            montarBannerCookies();
        }

        var reabrir = document.getElementById('abrirPreferenciasCookies');
        if (reabrir) {
            reabrir.addEventListener('click', function () {
                if (!document.querySelector('.cookie-banner')) montarBannerCookies();
            });
        }
    });

    // Mede cliques em links do WhatsApp (só reporta se o gtag existir de fato).
    document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('a[href*="wa.me/"]');
        if (!link || !window.DR_GA_CARREGADO || typeof gtag !== 'function') return;
        gtag('event', 'whatsapp_click', {
            link_id: link.id || null,
            link_text: (link.textContent || '').trim(),
            page_path: window.location.pathname
        });
    });

    // =================================================================
    // Altura real do cabeçalho
    // O padding do conteúdo era um número fixo (215px) que não batia com a
    // altura real entre 700 e 900px de largura, deixando uma faixa vazia.
    // =================================================================
    aoCarregar(function () {
        var header = document.querySelector('.site-header');
        if (!header) return;

        function medir() {
            var h = Math.round(header.getBoundingClientRect().height);
            document.documentElement.style.setProperty('--header-total', h + 'px');
            document.documentElement.style.scrollPaddingTop = (h + 12) + 'px';
        }

        medir();
        if ('ResizeObserver' in window) {
            new ResizeObserver(medir).observe(header);
        } else {
            window.addEventListener('resize', debounce(medir, 120));
        }
        window.addEventListener('load', medir);
    });

    // =================================================================
    // Ano do rodapé
    // =================================================================
    aoCarregar(function () {
        var ano = document.getElementById('anoAtual');
        if (ano) ano.textContent = String(new Date().getFullYear());
    });

    // =================================================================
    // Menu do celular — fecha no Esc, no clique fora e ao trocar de página
    // =================================================================
    aoCarregar(function () {
        var botao = document.querySelector('.nav-toggle');
        var menu = document.getElementById('menuPrincipal');
        if (!botao || !menu) return;

        function abrir(estado) {
            menu.classList.toggle('is-open', estado);
            botao.classList.toggle('is-open', estado);
            botao.setAttribute('aria-expanded', estado ? 'true' : 'false');
            botao.setAttribute('aria-label', estado ? 'Fechar menu' : 'Abrir menu');
        }

        botao.addEventListener('click', function () {
            abrir(!menu.classList.contains('is-open'));
        });

        menu.querySelectorAll('a').forEach(function (a) {
            a.addEventListener('click', function () { abrir(false); });
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && menu.classList.contains('is-open')) {
                abrir(false);
                botao.focus();
            }
        });

        document.addEventListener('click', function (e) {
            if (!menu.classList.contains('is-open')) return;
            if (menu.contains(e.target) || botao.contains(e.target)) return;
            abrir(false);
        });

        // Enquanto aberto, Tab circula dentro do menu.
        menu.addEventListener('keydown', function (e) {
            if (e.key !== 'Tab' || !menu.classList.contains('is-open')) return;
            var focaveis = [botao].concat(Array.prototype.slice.call(menu.querySelectorAll('a')));
            var primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
            if (e.shiftKey && document.activeElement === primeiro) {
                e.preventDefault(); ultimo.focus();
            } else if (!e.shiftKey && document.activeElement === ultimo) {
                e.preventDefault(); primeiro.focus();
            }
        });
    });

    // =================================================================
    // Busca do cabeçalho no celular (ícone que expande)
    // =================================================================
    aoCarregar(function () {
        var botao = document.querySelector('.search-toggle');
        var wrap = document.querySelector('.header-search-wrap');
        if (!botao || !wrap) return;
        var campo = wrap.querySelector('input');

        botao.addEventListener('click', function () {
            var aberto = wrap.classList.toggle('is-open');
            botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
            botao.setAttribute('aria-label', aberto ? 'Fechar busca' : 'Abrir busca');
            if (aberto && campo) campo.focus();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && wrap.classList.contains('is-open')) {
                wrap.classList.remove('is-open');
                botao.setAttribute('aria-expanded', 'false');
                botao.focus();
            }
        });
    });

    // =================================================================
    // Revelação ao rolar
    // A rede de segurança antiga revelava TODAS as seções depois de 2,5s,
    // o que matava a animação em qualquer página com mais de duas dobras.
    // Agora ela só destrava o que já está na tela.
    // =================================================================
    aoCarregar(function () {
        var alvos = document.querySelectorAll('.section:not(.section-catalog)');
        if (!alvos.length) return;

        if (!('IntersectionObserver' in window)) {
            alvos.forEach(function (el) { el.classList.add('is-visible'); });
            return;
        }

        alvos.forEach(function (el) { el.classList.add('reveal'); });

        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('is-visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        alvos.forEach(function (el) { obs.observe(el); });

        setTimeout(function () {
            alvos.forEach(function (el) {
                if (!el.classList.contains('is-visible') && noViewport(el)) {
                    el.classList.add('is-visible');
                    obs.unobserve(el);
                }
            });
        }, 2500);
    });

    // =================================================================
    // Contadores
    // =================================================================
    aoCarregar(function () {
        var contadores = document.querySelectorAll('.stat-number[data-count-to]');
        if (!contadores.length) return;

        function animar(el) {
            if (el.dataset.pronto) return;
            el.dataset.pronto = '1';
            var alvo = parseInt(el.getAttribute('data-count-to'), 10) || 0;
            var sufixo = el.getAttribute('data-suffix') || '';
            var prefixo = el.getAttribute('data-prefix') || '';

            if (menosMovimento()) {
                el.textContent = prefixo + alvo + sufixo;
                return;
            }
            var inicio = null;
            function passo(t) {
                if (!inicio) inicio = t;
                var p = Math.min((t - inicio) / 1200, 1);
                var suave = 1 - Math.pow(1 - p, 3);
                el.textContent = prefixo + Math.round(suave * alvo) + sufixo;
                if (p < 1) requestAnimationFrame(passo);
            }
            requestAnimationFrame(passo);
        }

        if (!('IntersectionObserver' in window)) {
            contadores.forEach(animar);
            return;
        }

        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) { animar(e.target); obs.unobserve(e.target); }
            });
        }, { threshold: 0.5 });

        contadores.forEach(function (el) { obs.observe(el); });

        // Mesma correção do reveal: o atalho de 2,5s só vale para quem já está
        // na tela; quem está lá embaixo continua ganhando a animação ao chegar.
        setTimeout(function () {
            contadores.forEach(function (el) {
                if (!el.dataset.pronto && noViewport(el)) { obs.unobserve(el); animar(el); }
            });
        }, 2500);
    });

    // =================================================================
    // Carrossel do hero — indicadores, pausa, swipe e barra de progresso
    // =================================================================
    aoCarregar(function () {
        var carrossel = document.getElementById('heroCarousel');
        if (!carrossel) return;

        var slides = Array.prototype.slice.call(carrossel.querySelectorAll('img'));
        if (slides.length < 2) return;

        var INTERVALO = 5000;
        var atual = 0;
        var timer = null;
        var pausado = menosMovimento();

        var indicadores = document.createElement('div');
        indicadores.className = 'hero-dots';
        indicadores.setAttribute('role', 'tablist');
        indicadores.setAttribute('aria-label', 'Escolher banner');

        var pontos = slides.map(function (_, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'hero-dot';
            b.setAttribute('role', 'tab');
            b.setAttribute('aria-label', 'Banner ' + (i + 1) + ' de ' + slides.length);
            b.addEventListener('click', function () { irPara(i); reiniciar(); });
            indicadores.appendChild(b);
            return b;
        });

        var botaoPausa = document.createElement('button');
        botaoPausa.type = 'button';
        botaoPausa.className = 'hero-pausa';
        botaoPausa.setAttribute('aria-label', pausado ? 'Reproduzir banners' : 'Pausar banners');
        botaoPausa.textContent = pausado ? '▶' : '❚❚';

        var progresso = document.createElement('div');
        progresso.className = 'hero-progresso';
        progresso.innerHTML = '<i></i>';
        var barra = progresso.querySelector('i');

        carrossel.appendChild(indicadores);
        carrossel.appendChild(botaoPausa);
        carrossel.appendChild(progresso);

        function irPara(i) {
            slides[atual].classList.remove('is-active');
            pontos[atual].setAttribute('aria-selected', 'false');
            atual = (i + slides.length) % slides.length;
            slides[atual].classList.add('is-active');
            pontos[atual].setAttribute('aria-selected', 'true');
            // Marca a hora da troca: o zoom lento do slide lê esse carimbo.
            window.DR_SLIDE_EM = Date.now();
            // Carrega o próximo só quando ele passa a fazer sentido.
            var proximo = slides[(atual + 1) % slides.length];
            if (proximo.loading === 'lazy') proximo.loading = 'eager';
            animarBarra();
        }

        function animarBarra() {
            if (!barra) return;
            barra.style.transition = 'none';
            barra.style.width = '0%';
            if (pausado) return;
            requestAnimationFrame(function () {
                barra.style.transition = 'width ' + INTERVALO + 'ms linear';
                barra.style.width = '100%';
            });
        }

        function comecar() {
            if (pausado || timer) return;
            timer = setInterval(function () { irPara(atual + 1); }, INTERVALO);
            animarBarra();
        }

        function parar() {
            clearInterval(timer);
            timer = null;
            if (barra) {
                barra.style.transition = 'none';
                barra.style.width = '0%';
            }
        }

        function reiniciar() {
            parar();
            comecar();
        }

        botaoPausa.addEventListener('click', function () {
            pausado = !pausado;
            botaoPausa.textContent = pausado ? '▶' : '❚❚';
            botaoPausa.setAttribute('aria-label', pausado ? 'Reproduzir banners' : 'Pausar banners');
            if (pausado) parar(); else comecar();
        });

        // Autoplay que não respeita hover, foco ou movimento reduzido reprova
        // no WCAG 2.2.2 — aqui ele para nos três casos.
        carrossel.addEventListener('mouseenter', parar);
        carrossel.addEventListener('mouseleave', function () { if (!pausado) comecar(); });
        carrossel.addEventListener('focusin', parar);
        carrossel.addEventListener('focusout', function () { if (!pausado) comecar(); });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) parar(); else if (!pausado) comecar();
        });

        var anterior = carrossel.querySelector('.hero-carousel-prev');
        var proximo = carrossel.querySelector('.hero-carousel-next');
        if (anterior) anterior.addEventListener('click', function () { irPara(atual - 1); reiniciar(); });
        if (proximo) proximo.addEventListener('click', function () { irPara(atual + 1); reiniciar(); });

        // Arrastar com o dedo — no celular ninguém acha setas de 30px.
        var x0 = null;
        carrossel.addEventListener('pointerdown', function (e) { x0 = e.clientX; parar(); });
        carrossel.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var d = e.clientX - x0;
            x0 = null;
            if (Math.abs(d) > 40) irPara(atual + (d < 0 ? 1 : -1));
            if (!pausado) comecar();
        });
        carrossel.addEventListener('pointercancel', function () { x0 = null; if (!pausado) comecar(); });

        pontos[0].setAttribute('aria-selected', 'true');
        window.DR_SLIDE_EM = Date.now();
        window.DR_SLIDE_MS = INTERVALO;
        comecar();
    });

    // =================================================================
    // Movimento do hero — parallax ao rolar + zoom lento no slide ativo
    // Os dois escrevem no mesmo transform, então moram na mesma função:
    // separados, um sobrescreveria o outro a cada quadro.
    // =================================================================
    aoCarregar(function () {
        var carrossel = document.getElementById('heroCarousel');
        if (!carrossel || menosMovimento()) return;

        var rodando = false;

        function desenhar() {
            var r = carrossel.getBoundingClientRect();
            var ativa = carrossel.querySelector('img.is-active');
            var visivel = r.bottom > 0 && r.top < window.innerHeight;

            if (ativa && visivel) {
                var deslocamento = Math.max(-24, Math.min(24, r.top * -0.06));
                var duracao = window.DR_SLIDE_MS || 5000;
                var idade = Math.min(1, (Date.now() - (window.DR_SLIDE_EM || Date.now())) / duracao);
                var escala = 1.06 + 0.05 * idade;
                ativa.style.transform = 'translateY(' + deslocamento + 'px) scale(' + escala.toFixed(4) + ')';
            }

            if (visivel && !document.hidden) {
                requestAnimationFrame(desenhar);
            } else {
                rodando = false;
            }
        }

        function ligar() {
            if (!rodando) { rodando = true; requestAnimationFrame(desenhar); }
        }

        window.addEventListener('scroll', ligar, { passive: true });
        window.addEventListener('resize', ligar);
        document.addEventListener('visibilitychange', function () { if (!document.hidden) ligar(); });
        ligar();
    });

    // =================================================================
    // Seletor de marcas (home)
    // =================================================================
    aoCarregar(function () {
        var seletor = document.querySelector('.brand-selector');
        if (!seletor) return;

        var botoes = seletor.querySelectorAll('.brand-select-btn');
        var imagens = seletor.querySelectorAll('.brand-preview-img');

        botoes.forEach(function (b) {
            b.addEventListener('click', function () {
                var marca = b.getAttribute('data-brand');
                botoes.forEach(function (o) {
                    var ativo = o === b;
                    o.classList.toggle('is-active', ativo);
                    o.setAttribute('aria-pressed', ativo ? 'true' : 'false');
                });
                imagens.forEach(function (img) {
                    img.classList.toggle('is-active', img.getAttribute('data-brand') === marca);
                });
            });
        });
    });

    // =================================================================
    // "Como funciona"
    // =================================================================
    aoCarregar(function () {
        var passos = document.querySelector('.how-steps');
        if (!passos) return;
        var linha = passos.querySelector('.how-steps-line');

        function revelar() {
            passos.classList.add('is-visible');
            if (linha) linha.classList.add('is-visible');
        }

        if (!('IntersectionObserver' in window)) { revelar(); return; }

        var obs = new IntersectionObserver(function (entradas) {
            entradas.forEach(function (e) {
                if (e.isIntersecting) { revelar(); obs.unobserve(e.target); }
            });
        }, { threshold: 0.3 });
        obs.observe(passos);
    });

    // =================================================================
    // Botão do WhatsApp e "voltar ao topo"
    // =================================================================
    aoCarregar(function () {
        var zap = document.getElementById('whatsappFloat');
        var temCatalogo = !!document.querySelector('.category-section');

        var topo = null;
        if (temCatalogo) {
            topo = document.createElement('button');
            topo.type = 'button';
            topo.className = 'voltar-topo';
            topo.setAttribute('aria-label', 'Voltar ao topo da página');
            topo.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m6 15 6-6 6 6"/></svg>';
            topo.addEventListener('click', function () {
                window.scrollTo({ top: 0, behavior: menosMovimento() ? 'instant' : 'smooth' });
            });
            document.body.appendChild(topo);
        }

        function aoRolar() {
            var passou = window.scrollY > 400;
            if (zap) zap.classList.toggle('is-visible', passou);
            if (topo) topo.classList.toggle('is-visible', window.scrollY > window.innerHeight * 1.5);
        }

        window.addEventListener('scroll', aoRolar, { passive: true });
        aoRolar();

        // Um balão, uma vez por sessão: o WhatsApp é a conversão do site e
        // hoje ele só aparece e some.
        if (zap && !sessionStorage.getItem('dr-balao-zap') && !menosMovimento()) {
            setTimeout(function () {
                if (!zap.classList.contains('is-visible')) return;
                var balao = document.createElement('span');
                balao.className = 'zap-balao';
                balao.textContent = 'Fale com a gente';
                zap.appendChild(balao);
                try { sessionStorage.setItem('dr-balao-zap', '1'); } catch (e) { /* ok */ }
                setTimeout(function () { balao.classList.add('sumindo'); }, 5000);
                setTimeout(function () { balao.remove(); }, 5600);
            }, 3500);
        }
    });

    // =================================================================
    // FAQ — recalcula a altura quando a largura da tela muda
    // =================================================================
    aoCarregar(function () {
        var itens = document.querySelectorAll('.faq-item');
        if (!itens.length) return;

        function medirAberto() {
            itens.forEach(function (item) {
                var resposta = item.querySelector('.faq-answer');
                if (!resposta) return;
                resposta.style.maxHeight = item.classList.contains('is-open')
                    ? resposta.scrollHeight + 'px' : '';
            });
        }

        itens.forEach(function (item) {
            var pergunta = item.querySelector('.faq-question');
            var resposta = item.querySelector('.faq-answer');
            if (!pergunta || !resposta) return;

            pergunta.addEventListener('click', function () {
                var estavaAberto = item.classList.contains('is-open');
                itens.forEach(function (o) {
                    o.classList.remove('is-open');
                    var q = o.querySelector('.faq-question');
                    var a = o.querySelector('.faq-answer');
                    if (q) q.setAttribute('aria-expanded', 'false');
                    if (a) a.style.maxHeight = '';
                });
                if (!estavaAberto) {
                    item.classList.add('is-open');
                    pergunta.setAttribute('aria-expanded', 'true');
                    resposta.style.maxHeight = resposta.scrollHeight + 'px';
                }
            });
        });

        window.addEventListener('resize', debounce(medirAberto, 120));
        window.addEventListener('orientationchange', function () { setTimeout(medirAberto, 200); });
    });

    // =================================================================
    // Formulário "Trabalhe conosco" (Web3Forms)
    // =================================================================
    aoCarregar(function () {
        var form = document.getElementById('jobForm');
        if (!form) return;

        var status = document.getElementById('jobFormStatus');
        var botao = form.querySelector('.job-submit');

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var dados = new FormData(form);
            var texto = botao.textContent;
            botao.disabled = true;
            botao.textContent = 'Enviando...';
            status.hidden = true;
            status.classList.remove('is-success', 'is-error');

            fetch('https://api.web3forms.com/submit', {
                method: 'POST', body: dados, headers: { Accept: 'application/json' }
            })
                .then(function (r) { return r.json(); })
                .then(function (d) {
                    if (d.success) {
                        status.textContent = 'Candidatura enviada! Vamos analisar seu perfil e entrar em contato.';
                        status.classList.add('is-success');
                        form.reset();
                        if (window.DR_GA_CARREGADO && typeof gtag === 'function') {
                            gtag('event', 'job_application_submit', { page_path: window.location.pathname });
                        }
                    } else {
                        status.textContent = 'Não deu pra enviar agora. Tenta de novo em instantes ou chama a gente no WhatsApp.';
                        status.classList.add('is-error');
                    }
                    status.hidden = false;
                })
                .catch(function () {
                    status.textContent = 'Não deu pra enviar agora. Tenta de novo em instantes ou chama a gente no WhatsApp.';
                    status.classList.add('is-error');
                    status.hidden = false;
                })
                .then(function () {
                    botao.disabled = false;
                    botao.textContent = texto;
                });
        });
    });

    // =================================================================
    // Índice de busca — baixado sob demanda, não embutido em toda página
    // =================================================================
    var indicePromessa = null;

    function carregarIndice() {
        if (indicePromessa) return indicePromessa;
        var base = document.body.getAttribute('data-base') || '';
        indicePromessa = fetch(base + 'assets/data/produtos.json')
            .then(function (r) { return r.json(); })
            .then(function (d) { return d.produtos || []; })
            .catch(function () { return []; });
        return indicePromessa;
    }

    // =================================================================
    // Sugestões de busca (fora da loja) — padrão combobox do ARIA
    // =================================================================
    aoCarregar(function () {
        if (document.querySelector('.product-card[data-name]')) return;

        var wrap = document.querySelector('.header-search-wrap');
        if (!wrap) return;
        var campo = wrap.querySelector('input');
        var lista = wrap.querySelector('.search-suggestions');
        if (!campo || !lista) return;

        var base = document.body.getAttribute('data-base') || '';
        var ativo = -1;

        campo.addEventListener('focus', carregarIndice, { once: true });

        function marcar(itens) {
            itens.forEach(function (el, i) {
                var sel = i === ativo;
                el.classList.toggle('is-highlighted', sel);
                el.setAttribute('aria-selected', sel ? 'true' : 'false');
                if (sel) {
                    el.id = el.id || 'sugestao-' + i;
                    campo.setAttribute('aria-activedescendant', el.id);
                    el.scrollIntoView({ block: 'nearest' });
                }
            });
            if (ativo < 0) campo.removeAttribute('aria-activedescendant');
        }

        function fechar() {
            lista.hidden = true;
            campo.setAttribute('aria-expanded', 'false');
            campo.removeAttribute('aria-activedescendant');
            ativo = -1;
        }

        function desenhar(termo) {
            var t = normalizar(termo.trim());
            lista.innerHTML = '';
            ativo = -1;

            if (!t) { fechar(); return; }

            carregarIndice().then(function (produtos) {
                if (normalizar(campo.value.trim()) !== t) return;
                var todos = produtos.filter(function (p) { return p.b.indexOf(t) !== -1; });
                var alguns = todos.slice(0, 6);

                lista.innerHTML = '';
                if (!alguns.length) {
                    var vazio = document.createElement('li');
                    vazio.className = 'search-suggestion-empty';
                    vazio.textContent = 'Nenhum produto encontrado para "' + termo.trim() + '"';
                    lista.appendChild(vazio);
                } else {
                    alguns.forEach(function (p, i) {
                        var li = document.createElement('li');
                        var a = document.createElement('a');
                        a.className = 'search-suggestion';
                        a.id = 'sugestao-' + i;
                        a.setAttribute('role', 'option');
                        a.setAttribute('aria-selected', 'false');
                        a.href = base + 'produto/' + p.i + '.html';

                        if (p.g) {
                            var img = document.createElement('img');
                            img.src = base + p.g.replace(/\.jpe?g$/i, '.webp');
                            img.alt = '';
                            img.loading = 'lazy';
                            img.width = 40;
                            img.height = 40;
                            a.appendChild(img);
                        }

                        var info = document.createElement('div');
                        info.className = 'search-suggestion-info';
                        var nome = document.createElement('div');
                        nome.className = 'search-suggestion-name';
                        nome.textContent = p.n;
                        var cat = document.createElement('div');
                        cat.className = 'search-suggestion-category';
                        cat.textContent = p.m || '';
                        info.appendChild(nome);
                        info.appendChild(cat);
                        a.appendChild(info);
                        li.appendChild(a);
                        lista.appendChild(li);
                    });

                    if (todos.length > alguns.length) {
                        var li2 = document.createElement('li');
                        var a2 = document.createElement('a');
                        a2.className = 'search-suggestion search-suggestion-more';
                        a2.setAttribute('role', 'option');
                        a2.href = base + 'loja.html?q=' + encodeURIComponent(termo.trim());
                        a2.textContent = 'Ver todos os ' + todos.length + ' resultados para "' + termo.trim() + '"';
                        li2.appendChild(a2);
                        lista.appendChild(li2);
                    }
                }
                lista.hidden = false;
                campo.setAttribute('aria-expanded', 'true');
            });
        }

        campo.addEventListener('input', debounce(function () { desenhar(campo.value); }, 120));
        campo.addEventListener('focus', function () { if (campo.value.trim()) desenhar(campo.value); });

        campo.addEventListener('keydown', function (e) {
            var itens = lista.querySelectorAll('.search-suggestion');
            if (lista.hidden || !itens.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                ativo = Math.min(ativo + 1, itens.length - 1);
                marcar(itens);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                ativo = Math.max(ativo - 1, 0);
                marcar(itens);
            } else if (e.key === 'Enter' && ativo >= 0) {
                e.preventDefault();
                itens[ativo].click();
            } else if (e.key === 'Escape') {
                fechar();
            }
        });

        document.addEventListener('click', function (e) {
            if (!wrap.contains(e.target)) fechar();
        });
    });

    // =================================================================
    // Loja — filtro, contagem falada, âncoras e categoria atual
    // =================================================================
    aoCarregar(function () {
        var cartoes = document.querySelectorAll('.product-card[data-name]');
        if (!cartoes.length) return;

        var campo = document.querySelector('.header-search input');
        var status = document.getElementById('searchStatus');
        var semResultado = document.getElementById('noResults');
        var secoes = Array.prototype.slice.call(document.querySelectorAll('.category-section'));
        var chips = Array.prototype.slice.call(document.querySelectorAll('.category-chip'));

        // O texto de busca já vem normalizado do build: nada de reprocessar
        // 400 produtos a cada tecla digitada.
        var itens = Array.prototype.map.call(cartoes, function (c) {
            return { el: c, texto: (c.getAttribute('data-name') + ' ' + c.getAttribute('data-desc') + ' ' + (c.getAttribute('data-sku') || '')).toLowerCase() };
        });

        function filtrar(termo, rolar) {
            var t = normalizar(termo.trim());
            var visiveis = 0;
            var primeiraSecao = null;

            secoes.forEach(function (secao) {
                var achou = false;
                secao.querySelectorAll('.product-card[data-name]').forEach(function (card) {
                    var item = itens.find(function (i) { return i.el === card; });
                    var bate = !t || (item && item.texto.indexOf(t) !== -1);
                    card.hidden = !bate;
                    if (bate) { achou = true; visiveis++; }
                });
                secao.hidden = !achou;
                if (achou && !primeiraSecao) primeiraSecao = secao;

                // A contagem da seção é do catálogo inteiro; durante a busca
                // ela mentiria ("56 produtos" com 2 na tela).
                var contagem = secao.querySelector('.category-count');
                if (contagem) {
                    if (!contagem.dataset.total) contagem.dataset.total = contagem.textContent;
                    if (t) {
                        var n = secao.querySelectorAll('.product-card:not([hidden])').length;
                        contagem.textContent = n + (n === 1 ? ' produto encontrado' : ' produtos encontrados');
                    } else {
                        contagem.textContent = contagem.dataset.total;
                    }
                }

                var chip = chips.find(function (c) { return c.getAttribute('href') === '#' + secao.id; });
                if (chip) chip.classList.toggle('sem-resultado', !achou);
            });

            if (semResultado) semResultado.hidden = visiveis !== 0;
            if (status) {
                status.textContent = !t
                    ? ''
                    : visiveis === 0
                        ? 'Nenhum produto encontrado para "' + termo.trim() + '".'
                        : visiveis + (visiveis === 1 ? ' produto encontrado' : ' produtos encontrados') + ' para "' + termo.trim() + '".';
            }

            // Filtrar sem rolar deixava o visitante olhando para a parte da
            // página que acabou de esvaziar.
            if (rolar && t && primeiraSecao) {
                primeiraSecao.scrollIntoView({ behavior: menosMovimento() ? 'instant' : 'smooth', block: 'start' });
            }
            return visiveis;
        }

        var parametros = new URLSearchParams(window.location.search);
        var consulta = (parametros.get('q') || '').trim();
        if (campo && consulta) {
            campo.value = consulta;
            filtrar(consulta, true);
        }

        var form = document.querySelector('.header-search');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                filtrar(campo.value, true);
                history.replaceState(null, '', 'loja.html' + (campo.value ? '?q=' + encodeURIComponent(campo.value) : ''));
            });
        }
        if (campo) {
            campo.addEventListener('input', debounce(function () { filtrar(campo.value, false); }, 140));
        }

        // Estado de "nada encontrado" com saída, em vez de um parágrafo solto.
        if (semResultado && !semResultado.querySelector('.no-results-acoes')) {
            var acoes = document.createElement('div');
            acoes.className = 'no-results-acoes';
            var zap = document.createElement('a');
            zap.className = 'btn';
            zap.target = '_blank';
            zap.rel = 'noopener';
            acoes.appendChild(zap);
            semResultado.appendChild(acoes);

            var atualizarZap = function () {
                var termo = campo ? campo.value.trim() : '';
                zap.textContent = 'Perguntar no WhatsApp se temos';
                zap.href = 'https://wa.me/5521992111843?text=' + encodeURIComponent(
                    'Olá! Procurei por "' + termo + '" no site e não achei. Vocês trabalham com esse produto?');
            };
            if (campo) campo.addEventListener('input', debounce(atualizarZap, 140));
            atualizarZap();
        }

        // As seções usam content-visibility, então na primeira carga o navegador
        // ainda não sabe a altura real e erra a âncora. Corrige depois do layout.
        // Com âncora na URL, a restauração automática de scroll do navegador
        // roda depois do nosso ajuste e joga a página de volta onde estava.
        if (window.location.hash && 'scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        function corrigirAncora() {
            var id = decodeURIComponent(window.location.hash.slice(1));
            if (!id) return;
            var alvo = document.getElementById(id);
            if (!alvo) return;
            // Cada correção materializa as seções pelo caminho, o que muda a
            // altura da página. Repete até a posição parar de se mexer.
            var tentativas = 0;
            (function estabilizar() {
                var antes = Math.round(alvo.getBoundingClientRect().top);
                alvo.scrollIntoView({ behavior: 'instant', block: 'start' });
                var depois = Math.round(alvo.getBoundingClientRect().top);
                if (++tentativas < 30 && Math.abs(depois - antes) > 2) {
                    requestAnimationFrame(estabilizar);
                }
            })();
        }

        window.addEventListener('hashchange', corrigirAncora);
        window.addEventListener('load', corrigirAncora);
        corrigirAncora();

        // Marca no chip a categoria que está passando pela tela.
        if ('IntersectionObserver' in window && chips.length) {
            var espia = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (e) {
                    if (!e.isIntersecting) return;
                    chips.forEach(function (c) {
                        var alvo = c.getAttribute('href') === '#' + e.target.id;
                        c.setAttribute('aria-current', alvo ? 'true' : 'false');
                        if (alvo) c.scrollIntoView({ block: 'nearest', inline: 'center' });
                    });
                });
            }, { rootMargin: '-30% 0px -60% 0px' });
            secoes.forEach(function (s) { espia.observe(s); });
        }
    });

    // =================================================================
    // Formulários que abrem o WhatsApp
    // =================================================================
    var ZAP = '5521992111843';

    // O pop-up pode ser engolido em silêncio (bloqueador, navegador in-app do
    // Instagram, Safari restrito). Nesse caso o visitante preenchia tudo e não
    // acontecia nada — agora ele sempre recebe uma confirmação com o link.
    function abrirWhatsApp(form, texto) {
        var url = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(texto);
        var janela = null;
        try {
            janela = window.open(url, '_blank', 'noopener');
        } catch (e) {
            janela = null;
        }

        var caixa = form.querySelector('.form-enviado');
        if (!caixa) {
            caixa = document.createElement('div');
            caixa.className = 'form-enviado';
            caixa.setAttribute('role', 'status');
            form.appendChild(caixa);
        }
        caixa.innerHTML = '';

        var titulo = document.createElement('p');
        titulo.className = 'form-enviado-titulo';
        titulo.textContent = janela ? 'Pronto! Abrimos o WhatsApp com sua mensagem.' : 'Sua mensagem está pronta.';
        caixa.appendChild(titulo);

        var link = document.createElement('a');
        link.className = 'btn btn-zap';
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = janela ? 'Não abriu? Clique aqui' : 'Abrir no WhatsApp';
        caixa.appendChild(link);

        caixa.hidden = false;
        caixa.scrollIntoView({ behavior: menosMovimento() ? 'instant' : 'smooth', block: 'nearest' });
        if (!janela) link.focus();
    }

    // --- máscaras e validação ---
    function mascararCnpj(v) {
        var d = v.replace(/\D/g, '').slice(0, 14);
        return d
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }

    function mascararTelefone(v) {
        var d = v.replace(/\D/g, '').slice(0, 11);
        if (d.length <= 10) {
            return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
        }
        return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
    }

    function cnpjValido(valor) {
        var c = (valor || '').replace(/\D/g, '');
        if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
        function digito(base, pesos) {
            var soma = 0;
            for (var i = 0; i < pesos.length; i++) soma += parseInt(base[i], 10) * pesos[i];
            var r = soma % 11;
            return r < 2 ? 0 : 11 - r;
        }
        var d1 = digito(c, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        var d2 = digito(c, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
        return d1 === parseInt(c[12], 10) && d2 === parseInt(c[13], 10);
    }

    function ligarMascaras(form) {
        var cnpj = form.querySelector('input[name="cnpj"]');
        if (cnpj) {
            cnpj.setAttribute('inputmode', 'numeric');
            cnpj.addEventListener('input', function () {
                var pos = cnpj.selectionStart === cnpj.value.length;
                cnpj.value = mascararCnpj(cnpj.value);
                if (pos) cnpj.setSelectionRange(cnpj.value.length, cnpj.value.length);
                cnpj.setCustomValidity(!cnpj.value || cnpjValido(cnpj.value) ? '' : 'CNPJ inválido — confira os números.');
            });
            cnpj.addEventListener('blur', function () {
                cnpj.setCustomValidity(!cnpj.value || cnpjValido(cnpj.value) ? '' : 'CNPJ inválido — confira os números.');
            });
        }

        form.querySelectorAll('input[name="phone"], input[type="tel"]').forEach(function (tel) {
            tel.setAttribute('inputmode', 'tel');
            tel.addEventListener('input', function () {
                var fim = tel.selectionStart === tel.value.length;
                tel.value = mascararTelefone(tel.value);
                if (fim) tel.setSelectionRange(tel.value.length, tel.value.length);
                var digitos = tel.value.replace(/\D/g, '').length;
                tel.setCustomValidity(!tel.value || digitos >= 10 ? '' : 'Telefone incompleto — inclua o DDD.');
            });
        });
    }

    // --- "Quero ser cliente" ---
    aoCarregar(function () {
        var form = document.getElementById('clientForm');
        if (!form) return;
        ligarMascaras(form);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.reportValidity()) return;

            var linhas = [
                'Olá! Gostaria de me tornar cliente da Distri Rio.',
                '',
                '*Empresa:* ' + form.company.value.trim(),
                '*CNPJ:* ' + form.cnpj.value.trim(),
                '*Ramo:* ' + form.segmento.value,
                '*Responsável:* ' + form.name.value.trim(),
                '*Telefone:* ' + form.phone.value.trim()
            ];
            if (form.city.value.trim()) linhas.push('*Cidade:* ' + form.city.value.trim());
            if (form.message.value.trim()) linhas.push('', form.message.value.trim());

            if (window.DR_GA_CARREGADO && typeof gtag === 'function') {
                gtag('event', 'client_signup_submit', { page_path: window.location.pathname });
            }
            abrirWhatsApp(form, linhas.join('\n'));
        });
    });

    // --- "Selecione o assunto e fale conosco" ---
    aoCarregar(function () {
        var form = document.getElementById('contactForm');
        if (!form) return;
        ligarMascaras(form);

        var assunto = document.getElementById('contactSubject');
        var campos = document.getElementById('contactFormFields');
        var notaCliente = document.getElementById('contactNoteCliente');
        var notaTrabalhe = document.getElementById('contactNoteTrabalhe');

        var ROTULOS = { pedido: 'Dúvida sobre um pedido', outro: 'Outro assunto' };

        // Campo obrigatório dentro de bloco escondido faz o Chrome recusar o
        // envio com "invalid form control is not focusable" e nada acontecer na
        // tela. Desabilitar junto com o hidden tira o campo da validação.
        function alternarCampos(mostrar) {
            campos.hidden = !mostrar;
            campos.querySelectorAll('input, select, textarea').forEach(function (c) {
                c.disabled = !mostrar;
            });
        }

        assunto.addEventListener('change', function () {
            var v = assunto.value;
            notaCliente.hidden = v !== 'cliente';
            notaTrabalhe.hidden = v !== 'trabalhe';
            alternarCampos(!!ROTULOS[v]);
        });
        alternarCampos(!!ROTULOS[assunto.value]);

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var rotulo = ROTULOS[assunto.value];
            if (!rotulo || !form.reportValidity()) return;

            var linhas = [
                'Olá! Assunto: ' + rotulo,
                '',
                '*Nome:* ' + form.name.value.trim(),
                '*Telefone:* ' + form.phone.value.trim()
            ];
            if (form.company.value.trim()) linhas.push('*Empresa:* ' + form.company.value.trim());
            linhas.push('', form.message.value.trim());

            if (window.DR_GA_CARREGADO && typeof gtag === 'function') {
                gtag('event', 'contact_form_submit', {
                    page_path: window.location.pathname, subject: assunto.value
                });
            }
            abrirWhatsApp(form, linhas.join('\n'));
        });
    });
})();
