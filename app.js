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

    // Rolagem suave feita na mão.
    // A nativa (scroll-behavior: smooth) morre na loja: com content-visibility
    // em 33 seções numa página de 50 mil pixels, as seções materializam durante
    // a animação, o layout muda e o navegador aborta a rolagem no meio — o
    // "voltar ao topo" simplesmente não saía do lugar. Aqui cada quadro fixa a
    // posição com 'instant' e o alvo é recalculado, então mudança de layout no
    // caminho não quebra nada.
    // Até quando a rolagem em curso é do próprio site (voltar ao topo, âncora,
    // filtros), e não da mão de quem lê: a descarga não anima nesse trajeto.
    var rolagemAutomaticaAte = 0;

    function rolarAte(alvo, aoTerminar) {
        var destino = function () {
            if (typeof alvo === 'number') return alvo;
            var r = alvo.getBoundingClientRect();
            var recuo = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
            return window.scrollY + r.top - recuo;
        };

        var limite = function (y) {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            return Math.max(0, Math.min(y, max));
        };

        if (menosMovimento()) {
            window.scrollTo({ top: limite(destino()), behavior: 'instant' });
            if (aoTerminar) aoTerminar();
            return;
        }

        var inicio = window.scrollY;
        var t0 = null;
        var DURACAO = 520;
        rolagemAutomaticaAte = performance.now() + DURACAO + 150;

        function passo(t) {
            if (t0 === null) t0 = t;
            var p = Math.min((t - t0) / DURACAO, 1);
            var suave = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
            var fim = limite(destino());
            window.scrollTo({ top: inicio + (fim - inicio) * suave, behavior: 'instant' });
            if (p < 1) {
                requestAnimationFrame(passo);
            } else if (aoTerminar) {
                aoTerminar();
            }
        }
        requestAnimationFrame(passo);
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

    // Recusar depois de ter aceitado precisa valer na hora: a LGPD fala em
    // revogação por procedimento facilitado, e guardar "nao" sem desligar nada
    // deixaria a medição rodando até a próxima página.
    function desligarMedicao() {
        if (typeof gtag === 'function') gtag('consent', 'update', { analytics_storage: 'denied' });
        window['ga-disable-' + window.DR_GA_ID] = true;
        var dominio = location.hostname.replace(/^www\./, '');
        document.cookie.split(';').forEach(function (c) {
            var nome = c.split('=')[0].trim();
            if (!/^_ga/.test(nome)) return;
            ['/', location.pathname].forEach(function (caminho) {
                ['', '.' + dominio, dominio].forEach(function (d) {
                    document.cookie = nome + '=; Max-Age=0; path=' + caminho + (d ? '; domain=' + d : '');
                });
            });
        });
    }

    function decidirMedicao(aceitou) {
        guardar(CHAVE_CONSENTIMENTO, aceitou ? 'sim' : 'nao');
        if (aceitou) carregarAnalytics(); else desligarMedicao();
    }

    // Faixa curta no rodapé, não caixa no meio da tela: a versão anterior
    // cobria 27% da primeira tela no celular, justamente onde ficam os botões
    // "Quero ser cliente" e "Ver o catálogo". Aceitar e Recusar têm o mesmo
    // peso visual e o foco não é roubado de quem está navegando pelo teclado.
    function montarBannerCookies(reabertoPeloRodape) {
        var banner = document.createElement('div');
        banner.className = 'cookie-banner';
        banner.setAttribute('role', 'region');
        banner.setAttribute('aria-label', 'Aviso de cookies de medição');
        banner.innerHTML =
            '<p id="cookieTexto">Cookies de medição: nada carrega antes de você escolher. ' +
            '<a href="' + (document.body.getAttribute('data-base') || '') + 'politica-de-privacidade.html">Política de privacidade</a>.</p>' +
            '<div class="cookie-acoes">' +
            '<button type="button" class="cookie-botao cookie-aceitar">Aceitar</button>' +
            '<button type="button" class="cookie-botao cookie-recusar">Recusar</button>' +
            '</div>';
        document.body.appendChild(banner);

        // Os botões flutuantes (Minha lista, WhatsApp, voltar ao topo) ficam
        // no pé da tela, que é justamente onde a faixa entra. Publica a altura
        // dela para eles subirem — senão o toque em "Minha lista" caía no
        // "Aceitar" e virava consentimento sem querer.
        function publicarAltura() {
            var altura = banner.isConnected ? banner.offsetHeight : 0;
            document.documentElement.style.setProperty('--altura-cookie', altura + 'px');
        }
        window.addEventListener('resize', publicarAltura);

        function fechar(aceitou) {
            decidirMedicao(aceitou);
            banner.remove();
            document.body.classList.remove('com-cookie-banner');
            window.removeEventListener('resize', publicarAltura);
            document.documentElement.style.setProperty('--altura-cookie', '0px');
            // Quem reabriu pelo rodapé volta para lá; quem só respondeu a faixa
            // continua onde estava, sem a página pular para o fim.
            if (reabertoPeloRodape) {
                var reabrir = document.getElementById('abrirPreferenciasCookies');
                if (reabrir) reabrir.focus();
            }
        }
        document.body.classList.add('com-cookie-banner');
        publicarAltura();
        if (reabertoPeloRodape) banner.querySelector('.cookie-aceitar').focus();
        banner.querySelector('.cookie-aceitar').addEventListener('click', function () { fechar(true); });
        banner.querySelector('.cookie-recusar').addEventListener('click', function () { fechar(false); });
        return banner;
    }

    // A faixa entra depois da primeira rolagem (ou de 8 segundos parado). Mesmo
    // com 137 px ela cobria os botões "Quero ser cliente" e "Ver o catálogo" no
    // celular, e os primeiros segundos da visita são para o negócio, não para
    // cookies. Nada de medição carrega enquanto ela não aparece e é respondida.
    function quandoFizerSentido(mostrar) {
        var jaFoi = false;
        function disparar() {
            if (jaFoi) return;
            jaFoi = true;
            window.removeEventListener('scroll', aoRolar);
            clearTimeout(relogio);
            mostrar();
        }
        function aoRolar() {
            if (window.scrollY > 120) disparar();
        }
        var relogio = setTimeout(disparar, 8000);
        window.addEventListener('scroll', aoRolar, { passive: true });
        aoRolar();
    }

    aoCarregar(function () {
        var escolha = recuperar(CHAVE_CONSENTIMENTO);
        if (escolha === 'sim') {
            carregarAnalytics();
        } else if (escolha !== 'nao') {
            quandoFizerSentido(function () { montarBannerCookies(); });
        }

        var reabrir = document.getElementById('abrirPreferenciasCookies');
        if (reabrir) {
            reabrir.addEventListener('click', function () {
                if (!document.querySelector('.cookie-banner')) montarBannerCookies(true);
            });
        }
    });

    // Registra um evento no GA4. Só dispara com consentimento: se o visitante
    // recusou, o gtag.js nem foi carregado e a chamada morre aqui.
    var ZAP = '5521992111843';

    function medir(evento, dados) {
        if (!window.DR_GA_CARREGADO || typeof gtag !== 'function') return;
        var carga = dados || {};
        carga.page_path = window.location.pathname;
        gtag('event', evento, carga);
    }

    // Mede cliques em links do WhatsApp (só reporta se o gtag existir de fato).
    document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('a[href*="wa.me/"]');
        if (!link) return;
        medir('whatsapp_click', {
            link_id: link.id || null,
            link_text: (link.textContent || '').trim().slice(0, 60),
            origem: link.className.indexOf('whatsapp-float') !== -1 ? 'botao_flutuante'
                : link.className.indexOf('lista') !== -1 ? 'lista_de_pedido'
                : link.closest('.footer') ? 'rodape'
                : link.closest('.cta-band') ? 'faixa_final'
                : link.closest('.produto-acoes') ? 'pagina_de_produto'
                : 'conteudo'
        });
    });

    // Clique em cartão de produto: qual produto e de onde.
    document.addEventListener('click', function (e) {
        var link = e.target.closest && e.target.closest('.product-card-link');
        if (!link) return;
        var cartao = link.closest('.product-card');
        medir('produto_clique', {
            item_name: cartao ? cartao.getAttribute('data-name') : null,
            item_brand: cartao ? cartao.getAttribute('data-marca') : null,
            item_category: cartao ? cartao.getAttribute('data-cat') : null
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
    // Revelação reversível ao rolar
    // Descendo, cada bloco carrega exatamente onde sempre carregou. Subindo,
    // o bloco que sai pela faixa de baixo da tela descarrega: volta ao estado
    // de antes da entrada, mais rápido, acelerando e na ordem inversa. Descer
    // de novo carrega de novo, quantas vezes for.
    //
    // A direção vem de quanto a página andou, com folga: um tremor do dedo não
    // liga e desliga nada. Rolagem rápida, âncora e "voltar ao topo" trocam o
    // estado sem animar, para não virar cascata.
    //
    // Ajustes num lugar só, no :root do style.css (--descarga-*): a linha, a
    // folga e a velocidade são lidas aqui; durações, curva e escalonamento
    // ficam nas próprias regras de saída.
    //
    // A rede de segurança antiga revelava TODAS as seções depois de 2,5s,
    // o que matava a animação em qualquer página com mais de duas dobras.
    // Agora ela só destrava o que já está na tela.
    // =================================================================
    aoCarregar(function () {
        var alvos = [];
        document.querySelectorAll('.section:not(.section-catalog)').forEach(function (el) {
            alvos.push({ el: el, pecas: [el] });
        });
        var passos = document.querySelector('.how-steps');
        if (passos) {
            var linhaPassos = passos.querySelector('.how-steps-line');
            alvos.push({ el: passos, pecas: linhaPassos ? [passos, linhaPassos] : [passos], passos: true });
        }
        if (!alvos.length) return;

        if (!('IntersectionObserver' in window)) {
            alvos.forEach(function (a) {
                a.pecas.forEach(function (p) { p.classList.add('is-visible'); });
            });
            return;
        }

        alvos.forEach(function (a) {
            if (!a.passos) a.el.classList.add('reveal');
        });

        var raiz = getComputedStyle(document.documentElement);
        function ajuste(nome, padrao) {
            var v = parseFloat(raiz.getPropertyValue(nome));
            return isNaN(v) ? padrao : v;
        }
        var LINHA = ajuste('--descarga-linha', 80);    // % da altura da tela
        var FOLGA = ajuste('--descarga-folga', 40);    // px no sentido novo
        var RAPIDA = ajuste('--descarga-rapida', 2.5); // px por ms

        var sentido = 'desce';
        var ancora = window.scrollY;
        var ultimoY = window.scrollY;
        var ultimoT = performance.now();
        var velocidade = 0;
        var viradaTravadaAte = 0;

        function alvoDe(el) {
            for (var i = 0; i < alvos.length; i++) {
                if (alvos[i].el === el) return alvos[i];
            }
            return null;
        }

        // Sem animação, o estado novo entra com as transições desligadas e o
        // estilo é lido na hora: ao religá-las não sobra transição pendente.
        function trocar(a, carregar, animar) {
            if (a.carregado === carregar) return;
            a.carregado = carregar;
            if (carregar) a.jaCarregou = true;
            a.trocouEm = animar ? performance.now() : 0;
            a.pecas.forEach(function (p) {
                if (!animar) p.classList.add('sem-transicao');
                p.classList.toggle('is-visible', carregar);
                p.classList.toggle('descarregado', !carregar);
            });
            if (!animar) {
                void a.el.offsetWidth;
                a.pecas.forEach(function (p) { p.classList.remove('sem-transicao'); });
            }
        }

        // Um salto (restauração da rolagem, âncora) que joga para cima da tela
        // um bloco no meio da entrada: a entrada termina na hora.
        function concluir(a) {
            if (!a.trocouEm || performance.now() - a.trocouEm > 1400) return;
            a.trocouEm = 0;
            a.pecas.forEach(function (p) { p.classList.add('sem-transicao'); });
            void a.el.offsetWidth;
            a.pecas.forEach(function (p) { p.classList.remove('sem-transicao'); });
        }

        // Foco de teclado dentro segura o bloco: ninguém perde o que está
        // preenchendo ou navegando. Clique de mouse não conta.
        function comFoco(a) {
            try {
                return !!a.el.querySelector(':focus-visible');
            } catch (e) {
                return a.el.contains(document.activeElement) && document.activeElement !== document.body;
            }
        }

        // Descarga só com a página em movimento: uma imagem que carrega acima e
        // empurra o conteúdo com a tela parada não apaga nada.
        function rolandoAgora() {
            return performance.now() - ultimoT < 300;
        }

        function rapido() {
            return velocidade > RAPIDA || performance.now() < rolagemAutomaticaAte;
        }

        // O que aparece na primeira tela não descarrega: voltar ao topo é
        // voltar à página de quando se chegou, e descarregar para carregar de
        // novo ali só faria o bloco piscar. offsetTop, e não o retângulo, para
        // o deslocamento da própria entrada não entrar na conta.
        function naChegada(a) {
            var topo = 0;
            for (var el = a.el; el; el = el.offsetParent) topo += el.offsetTop;
            return topo < window.innerHeight;
        }

        function decidir(a) {
            if (a.carregado) {
                if (sentido === 'sobe' && a.abaixo && rolandoAgora() && !menosMovimento() && !comFoco(a) && !naChegada(a)) {
                    trocar(a, false, !rapido() && noViewport(a.el));
                }
                return;
            }
            if (a.acima) {
                trocar(a, true, false);
            } else if (a.entrou && (sentido === 'desce' || !a.abaixo)) {
                trocar(a, true, true);
            }
        }

        // Seção alta demais (a grade de uma marca com 120 produtos passa de
        // 25 mil px no celular) nunca chega a 10% à vista: para ela, a entrada
        // é o topo cruzar a linha de descarga.
        function acertarEntrada(a) {
            a.entrou = a.alto ? !!a.naFaixa : !!a.entrouPelaRazao;
        }

        // Entrada: os mesmos pontos de antes de existir a saída.
        function aoEntrar(entradas) {
            entradas.forEach(function (e) {
                var a = alvoDe(e.target);
                if (!a) return;
                a.entrouPelaRazao = e.isIntersecting;
                acertarEntrada(a);
                decidir(a);
            });
        }

        // Linha de descarga: onde o bloco está em relação a ela.
        function aoCruzarLinha(entradas) {
            entradas.forEach(function (e) {
                var a = alvoDe(e.target);
                if (!a) return;
                var r = e.boundingClientRect;
                var fundo = e.rootBounds ? e.rootBounds.bottom : window.innerHeight * LINHA / 100;
                a.naFaixa = e.isIntersecting;
                a.abaixo = !e.isIntersecting && r.top >= fundo - 1;
                // Topo acima da tela é bloco já passado, mesmo que a ponta de
                // baixo ainda apareça: a entrada por "10% à vista" é para quem
                // chega por baixo, não para quem sobra em cima depois de um salto.
                a.acima = r.top < 0;
                a.alto = r.height > 4 * window.innerHeight;
                if (a.carregado && r.bottom <= 1 && rapido()) concluir(a);
                acertarEntrada(a);
                decidir(a);
            });
        }

        var obsSecao = new IntersectionObserver(aoEntrar, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
        var obsPassos = new IntersectionObserver(aoEntrar, { threshold: 0.3 });
        var obsLinha = new IntersectionObserver(aoCruzarLinha, {
            threshold: 0,
            rootMargin: '0px 0px -' + (100 - LINHA) + '% 0px'
        });
        alvos.forEach(function (a) {
            (a.passos ? obsPassos : obsSecao).observe(a.el);
            obsLinha.observe(a.el);
        });

        function virar(novo) {
            sentido = novo;
            alvos.forEach(decidir);
        }

        function aoRolar() {
            var y = window.scrollY;
            var t = performance.now();
            var passou = t - ultimoT;
            var instantanea = Math.abs(y - ultimoY) / Math.min(Math.max(passou, 8), 100);
            velocidade = passou > 100 ? instantanea : velocidade * 0.5 + instantanea * 0.5;
            ultimoY = y;
            ultimoT = t;

            if (t < viradaTravadaAte) { ancora = y; return; }

            // No topo não há mais o que rebobinar: a página volta a ser a
            // da chegada.
            if (y <= 0) {
                ancora = 0;
                if (sentido !== 'desce') virar('desce');
                return;
            }
            if (sentido === 'desce') {
                if (y > ancora) ancora = y;
                else if (ancora - y > FOLGA) { ancora = y; virar('sobe'); }
            } else if (y < ancora) {
                ancora = y;
            } else if (y - ancora > FOLGA) {
                ancora = y;
                virar('desce');
            }
        }

        window.addEventListener('scroll', aoRolar, { passive: true });

        // Girar a tela reflui a página e mexe na rolagem sem ninguém rolar.
        // Só a largura conta: no celular a barra do navegador muda a altura
        // a toda hora durante a própria rolagem.
        var largura = window.innerWidth;
        window.addEventListener('resize', function () {
            if (window.innerWidth === largura) return;
            largura = window.innerWidth;
            viradaTravadaAte = performance.now() + 400;
        });

        // Âncora nativa (rolagem suave do CSS) também é trajeto do site.
        function marcarTrajeto() {
            rolagemAutomaticaAte = Math.max(rolagemAutomaticaAte, performance.now() + 900);
        }
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('a[href^="#"]')) marcarTrajeto();
        });
        window.addEventListener('hashchange', marcarTrajeto);

        // Foco nunca fica num bloco invisível: quem chega pelo Tab vê na hora.
        document.addEventListener('focusin', function (e) {
            alvos.forEach(function (a) {
                if (!a.carregado && a.el.contains(e.target)) trocar(a, true, false);
            });
        });

        // Voltando pelo histórico (bfcache), a página reaparece como foi
        // deixada: o que está na tela ou acima fica carregado.
        window.addEventListener('pageshow', function (e) {
            if (!e.persisted) return;
            sentido = 'desce';
            ancora = ultimoY = window.scrollY;
            velocidade = 0;
            alvos.forEach(function (a) {
                if (!a.carregado && (a.acima || noViewport(a.el))) trocar(a, true, false);
            });
        });

        // Quem liga "reduzir movimento" no meio da visita não fica com buraco
        // na tela: com ele ligado nada mais descarrega.
        if (window.matchMedia) {
            var consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
            var aoMudar = function () {
                if (!consulta.matches) return;
                alvos.forEach(function (a) {
                    if (!a.carregado && (a.acima || noViewport(a.el))) trocar(a, true, false);
                });
            };
            if (consulta.addEventListener) consulta.addEventListener('change', aoMudar);
            else if (consulta.addListener) consulta.addListener(aoMudar);
        }

        setTimeout(function () {
            alvos.forEach(function (a) {
                if (!a.jaCarregou && noViewport(a.el)) trocar(a, true, true);
            });
        }, 2500);
    });

    // =================================================================
    // Contadores
    // =================================================================
    aoCarregar(function () {
        var contadores = document.querySelectorAll('.stat-number[data-count-to]');
        if (!contadores.length) return;

        // O número real vem escrito no HTML, para o Google e para quem tem JS
        // bloqueado lerem "426 Produtos no catálogo" e não "0".
        //
        // Não zeramos nada aqui de propósito: se o observador não disparar por
        // qualquer motivo, o visitante continua vendo o número certo em vez de
        // um zero. Quem zera é a própria animação, no quadro em que começa.

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
        // Rede de segurança: se o observador não disparar para quem já está na
        // tela, anima na marra. Quem está fora da tela fica com o número que já
        // está escrito no HTML — que é o certo.
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

        // Botões comuns, não "abas": role="tab" sem painel promete ao leitor de
        // tela uma navegação por setas que não existe.
        var indicadores = document.createElement('div');
        indicadores.className = 'hero-dots';
        indicadores.setAttribute('role', 'group');
        indicadores.setAttribute('aria-label', 'Escolher banner');

        var pontos = slides.map(function (_, i) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'hero-dot';
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

        // Slide empilhado conta como "dentro da tela", então loading="lazy" não
        // segurava nada: os três banners seguintes desciam junto com a home.
        // Agora o endereço mora em data-src e entra quando o slide vai aparecer.
        function garantirImagem(img) {
            if (!img || img.dataset.pronta) return;
            img.dataset.pronta = '1';
            var pai = img.parentElement;
            if (pai && pai.tagName === 'PICTURE') {
                pai.querySelectorAll('source[data-srcset]').forEach(function (s) {
                    s.srcset = s.getAttribute('data-srcset');
                    s.removeAttribute('data-srcset');
                });
            }
            if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            }
        }

        // Só o slide visível é clicável e alcançável pelo Tab: os outros ficam
        // empilhados em cima e roubariam o clique.
        function aplicarEstadoDosLinks() {
            slides.forEach(function (img, i) {
                var link = img.closest ? img.closest('.hero-slide') : null;
                if (!link) return;
                var ativo = i === atual;
                link.classList.toggle('is-active', ativo);
                link.tabIndex = ativo ? 0 : -1;
                link.setAttribute('aria-hidden', ativo ? 'false' : 'true');
            });
        }

        function irPara(i) {
            slides[atual].classList.remove('is-active');
            pontos[atual].setAttribute('aria-current', 'false');
            atual = (i + slides.length) % slides.length;
            garantirImagem(slides[atual]);
            slides[atual].classList.add('is-active');
            pontos[atual].setAttribute('aria-current', 'true');
            aplicarEstadoDosLinks();
            // Carrega o próximo só quando ele passa a fazer sentido.
            garantirImagem(slides[(atual + 1) % slides.length]);
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
        var arrastou = false;
        carrossel.addEventListener('pointerdown', function (e) { x0 = e.clientX; arrastou = false; parar(); });
        carrossel.addEventListener('pointerup', function (e) {
            if (x0 === null) return;
            var d = e.clientX - x0;
            x0 = null;
            if (Math.abs(d) > 40) { arrastou = true; irPara(atual + (d < 0 ? 1 : -1)); }
            if (!pausado) comecar();
        });
        carrossel.addEventListener('pointercancel', function () { x0 = null; if (!pausado) comecar(); });
        // Quem arrastou para trocar de banner não queria abrir o link do banner.
        carrossel.addEventListener('click', function (e) {
            if (!arrastou) return;
            arrastou = false;
            e.preventDefault();
        }, true);

        // O segundo slide entra quando o navegador estiver ocioso: assim ele já
        // está pronto na primeira troca, sem disputar banda com a abertura.
        var prepararSegundo = function () { garantirImagem(slides[1]); };
        if ('requestIdleCallback' in window) {
            requestIdleCallback(prepararSegundo, { timeout: 3000 });
        } else {
            setTimeout(prepararSegundo, 2000);
        }

        aplicarEstadoDosLinks();
        pontos[0].setAttribute('aria-current', 'true');
        comecar();
    });

    // =================================================================
    // Movimento do hero — parallax ao rolar + zoom lento no slide ativo
    // Os dois escrevem no mesmo transform, então moram na mesma função:
    // separados, um sobrescreveria o outro a cada quadro.
    // =================================================================
    // O zoom lento do slide agora é do CSS (uma animação por troca de banner).
    // Aqui fica só o parallax, e só enquanto a pessoa rola: antes este laço
    // desenhava a cada quadro com a home parada na tela — 307 mudanças de
    // estilo em 3 segundos, esquentando celular à toa.
    aoCarregar(function () {
        var carrossel = document.getElementById('heroCarousel');
        if (!carrossel || menosMovimento()) return;

        var pendente = false;

        function aplicar() {
            pendente = false;
            var r = carrossel.getBoundingClientRect();
            if (r.bottom <= 0 || r.top >= window.innerHeight) return;
            var deslocamento = Math.max(-24, Math.min(24, r.top * -0.06));
            carrossel.style.setProperty('--hero-deslocamento', deslocamento.toFixed(1) + 'px');
        }

        function aoRolar() {
            if (pendente) return;
            pendente = true;
            requestAnimationFrame(aplicar);
        }

        window.addEventListener('scroll', aoRolar, { passive: true });
        window.addEventListener('resize', aoRolar);
        aplicar();
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
                rolarAte(0);
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
                        medir('formulario_enviado', { formulario: 'trabalhe_conosco' });
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
    // Atalho de teclado para a busca
    // Quem monta pedido grande no computador passa a tarde procurando produto.
    // Ctrl+K (ou "/") põe o cursor na busca de qualquer página.
    // =================================================================
    aoCarregar(function () {
        var campo = document.querySelector('.header-search input');
        if (!campo) return;

        document.addEventListener('keydown', function (e) {
            var atalhoK = (e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K');
            var barra = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey;
            if (!atalhoK && !barra) return;

            var alvo = e.target;
            var digitando = alvo && (alvo.tagName === 'INPUT' || alvo.tagName === 'TEXTAREA' || alvo.tagName === 'SELECT' || alvo.isContentEditable);
            if (barra && digitando) return;     // "/" dentro de um campo é barra mesmo

            e.preventDefault();
            var wrap = document.querySelector('.header-search-wrap');
            var botao = document.querySelector('.search-toggle');
            // No celular a busca fica escondida atrás do ícone.
            if (wrap && botao && getComputedStyle(botao).display !== 'none' && !wrap.classList.contains('is-open')) {
                botao.click();
            }
            campo.focus();
            campo.select();
        });

        // Dica discreta do atalho, só onde existe teclado de verdade.
        if (window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
            var atalho = /Mac|iPhone|iPad/.test(navigator.platform || '') ? '⌘K' : 'Ctrl+K';
            campo.setAttribute('placeholder', campo.getAttribute('placeholder') + '  (' + atalho + ')');
        }
    });

    // =================================================================
    // Mandar no WhatsApp (produto, marca e lista)
    // O site também é ferramenta de quem vende: em vez de digitar produto
    // por produto na conversa, manda a página. No celular abre o menu do
    // sistema; no computador copia o link e avisa.
    // =================================================================
    function compartilhar(botao) {
        var texto = botao.getAttribute('data-texto') || document.title;
        var url = botao.getAttribute('data-url') || window.location.href;
        var titulo = botao.getAttribute('data-titulo') || document.title;
        var rotulo = botao.querySelector('.btn-compartilhar-rotulo');

        function avisar(msg) {
            if (!rotulo) return;
            if (!botao.dataset.rotuloOriginal) botao.dataset.rotuloOriginal = rotulo.textContent;
            rotulo.textContent = msg;
            setTimeout(function () { rotulo.textContent = botao.dataset.rotuloOriginal; }, 2500);
        }

        medir('compartilhou', { origem: botao.getAttribute('data-origem') || 'pagina' });

        if (navigator.share) {
            navigator.share({ title: titulo, text: texto, url: url }).catch(function () { /* cancelou */ });
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(texto + ' ' + url).then(function () {
                avisar('Link copiado!');
            }).catch(function () {
                window.open('https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url), '_blank', 'noopener');
            });
            return;
        }
        window.open('https://wa.me/?text=' + encodeURIComponent(texto + ' ' + url), '_blank', 'noopener');
    }

    document.addEventListener('click', function (e) {
        var botao = e.target.closest && e.target.closest('[data-compartilhar]');
        if (!botao) return;
        e.preventDefault();
        compartilhar(botao);
    });

    // =================================================================
    // Índice de busca — baixado sob demanda, não embutido em toda página
    // =================================================================
    var indicePromessa = null;

    // A falha não pode virar resposta: guardar uma promessa resolvida com lista
    // vazia fazia a busca responder "nenhum produto encontrado" até recarregar a
    // página, mesmo depois da internet voltar. No balcão, com sinal oscilando,
    // isso faz o comerciante concluir que a Distri Rio não tem o produto.
    function carregarIndice() {
        if (indicePromessa) return indicePromessa;
        var base = document.body.getAttribute('data-base') || '';
        indicePromessa = fetch(base + 'assets/data/produtos.json')
            .then(function (r) {
                if (!r.ok) throw new Error('resposta ' + r.status);
                return r.json();
            })
            .then(function (d) { return d.produtos || []; })
            .catch(function (e) {
                indicePromessa = null;   // a próxima digitação tenta de novo
                throw e;
            });
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

        campo.addEventListener('focus', function () {
            carregarIndice().catch(function () { /* a busca avisa quando o visitante digitar */ });
        }, { once: true });

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

        // Linhas-fantasma no formato da sugestão, para a espera do índice não
        // ser uma lista em branco. Só entram se a espera passar de 150 ms.
        var esperaEsqueleto = null;

        function mostrarEsqueleto() {
            lista.innerHTML = '';
            for (var k = 0; k < 3; k++) {
                var li = document.createElement('li');
                li.className = 'search-suggestion-fantasma';
                li.setAttribute('aria-hidden', 'true');
                li.innerHTML = '<span class="fantasma-foto"></span>' +
                    '<span class="fantasma-texto"><span></span><span></span></span>';
                lista.appendChild(li);
            }
            lista.setAttribute('aria-busy', 'true');
            lista.hidden = false;
        }

        function desenhar(termo) {
            var t = normalizar(termo.trim());
            clearTimeout(esperaEsqueleto);
            lista.innerHTML = '';
            ativo = -1;

            if (!t) { fechar(); return; }

            esperaEsqueleto = setTimeout(function () {
                if (normalizar(campo.value.trim()) === t) mostrarEsqueleto();
            }, 150);

            carregarIndice().then(function (produtos) {
                clearTimeout(esperaEsqueleto);
                lista.removeAttribute('aria-busy');
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
            }).catch(function () {
                clearTimeout(esperaEsqueleto);
                lista.removeAttribute('aria-busy');
                if (normalizar(campo.value.trim()) !== t) return;
                lista.innerHTML = '';
                var erro = document.createElement('li');
                erro.className = 'search-suggestion-empty';
                erro.textContent = 'Não deu para carregar a busca agora. Confira a conexão e digite de novo.';
                lista.appendChild(erro);
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
        var aviseMe = document.getElementById('aviseMe');
        var aviseCampos = aviseMe && aviseMe.querySelector('.avise-me-campos');
        var avisePronto = aviseMe && aviseMe.querySelector('.avise-me-pronto');

        // Depois de enviado, o formulário vira recado. Se a pessoa procurar
        // outra coisa que também não existe, ele volta — pode ser mais de um
        // produto, e o recado da busca anterior não serve para a nova.
        function aviseRestaurar() {
            if (!aviseMe || !aviseCampos) return;
            aviseMe.removeAttribute('data-enviado-para');
            aviseCampos.hidden = false;
            if (avisePronto) avisePronto.hidden = true;
            var aviso = aviseMe.querySelector('.avise-me-aviso');
            if (aviso) aviso.textContent = '';
        }
        var secoes = Array.prototype.slice.call(document.querySelectorAll('.category-section:not(.catalogo-ordenado)'));

        // O texto de busca já vem normalizado do build: nada de reprocessar
        // 400 produtos a cada tecla digitada. Seção, tipo e marca também já
        // vêm escritos no cartão.
        var itens = Array.prototype.map.call(cartoes, function (c) {
            return {
                el: c,
                texto: (c.getAttribute('data-name') + ' ' + c.getAttribute('data-desc') + ' ' + (c.getAttribute('data-sku') || '')).toLowerCase(),
                secao: c.getAttribute('data-secao') || '',
                tipo: c.getAttribute('data-tipo') || '',
                marca: c.getAttribute('data-marca') || '',
                cat: c.getAttribute('data-cat') || '',
                semAcucar: c.getAttribute('data-sem-acucar') === '1'
            };
        });

        // Ordem alfabética: o catálogo nasce agrupado por linha de produto,
        // que é como o depósito pensa. Quem procura um nome específico pensa
        // em A-Z — então a ordem alfabética junta tudo numa grade só e as
        // seções por linha saem da frente.
        var selOrdem = document.getElementById('filtroOrdem');
        var caixaOrdenada = document.getElementById('catalogoOrdenado');
        var gradeOrdenada = document.getElementById('gradeOrdenada');
        var tituloOrdenada = caixaOrdenada && caixaOrdenada.querySelector('h2');
        var contagemOrdenada = caixaOrdenada && caixaOrdenada.querySelector('.category-count');
        // De onde cada cartão saiu, para devolver na ordem do catálogo depois.
        var bercos = Array.prototype.map.call(cartoes, function (c) {
            return { el: c, pai: c.parentNode };
        });

        function ordemAtual() {
            return selOrdem && gradeOrdenada ? selOrdem.value : '';
        }

        function aplicarOrdem() {
            if (!gradeOrdenada) return;
            var ordem = ordemAtual();
            if (!ordem) {
                // Cada cartão volta para a grade de onde saiu, na ordem original.
                bercos.forEach(function (b) { b.pai.appendChild(b.el); });
                if (caixaOrdenada) caixaOrdenada.hidden = true;
                return;
            }
            var lista = bercos.map(function (b) { return b.el; }).sort(function (a, b) {
                var r = (a.getAttribute('data-name') || '')
                    .localeCompare(b.getAttribute('data-name') || '', 'pt', { sensitivity: 'base' });
                return ordem === 'za' ? -r : r;
            });
            var fragmento = document.createDocumentFragment();
            lista.forEach(function (el) { fragmento.appendChild(el); });
            gradeOrdenada.appendChild(fragmento);
            if (tituloOrdenada) {
                tituloOrdenada.textContent = ordem === 'za'
                    ? 'Todos os produtos, de Z a A'
                    : 'Todos os produtos, de A a Z';
            }
        }

        // ---- Funil: seção → tipo, marca e "sem açúcar adicionado" ----
        // Uma escolha por etapa. Escolhida, a etapa encolhe para a opção marcada
        // (tocar nela de novo desfaz) e as outras mostram só o que ainda tem
        // produto, com a contagem refeita. Marca não depende de seção: quem
        // pensa "quero Baly" começa por ela.
        var funil = document.getElementById('funil');
        var etapaTipo = funil && funil.querySelector('.funil-tipo');
        var maisMarcas = document.getElementById('funilMaisMarcas');
        var chkSemAcucar = document.getElementById('filtroSemAcucar');
        var nSemAcucar = document.getElementById('semAcucarN');
        var totalNaTela = document.getElementById('filtrosTotal');
        var btnLimpar = document.getElementById('limparFiltros');
        var MARCAS_FECHADO = 6;

        var ETAPAS = {};
        [['secao', 'data-secao'], ['tipo', 'data-tipo'], ['marca', 'data-marca']].forEach(function (par) {
            var lista = funil ? Array.prototype.slice.call(funil.querySelectorAll('.funil-opcao[' + par[1] + ']')) : [];
            var porValor = new Map();
            lista.forEach(function (b) { porValor.set(b.getAttribute(par[1]), b); });
            ETAPAS[par[0]] = { atributo: par[1], botoes: lista, porValor: porValor, visiveis: 0 };
        });

        var estado = { secao: '', tipo: '', marca: '', semAcucar: false };
        var marcasAbertas = false;

        // Só vale valor que existe num botão gerado pelo build. O que vem do
        // endereço é comparado com esta lista e nada mais: nunca vira seletor,
        // classe nem HTML.
        function valido(etapa, valor) {
            return !!valor && ETAPAS[etapa].porValor.has(valor);
        }

        function nomeDe(etapa, valor) {
            var b = ETAPAS[etapa].porValor.get(valor);
            var n = b && b.querySelector('.funil-nome');
            return n ? n.textContent : valor;
        }

        // Um item atravessa o funil ignorando uma das etapas: é assim que cada
        // etapa sabe quantos produtos cada opção dela traria. O tipo mora dentro
        // da seção, então quem ignora a seção ignora o tipo junto.
        function passa(item, t, ignorar) {
            if (t && item.texto.indexOf(t) === -1) return false;
            if (ignorar !== 'secao') {
                if (estado.secao && item.secao !== estado.secao) return false;
                if (ignorar !== 'tipo' && estado.tipo && item.tipo !== estado.tipo) return false;
            }
            if (ignorar !== 'marca' && estado.marca && item.marca !== estado.marca) return false;
            if (ignorar !== 'semAcucar' && estado.semAcucar && !item.semAcucar) return false;
            return true;
        }

        function somar(mapa, chave) {
            mapa.set(chave, (mapa.get(chave) || 0) + 1);
        }

        function desenharFunil(t) {
            if (!funil) return;
            var c = { secao: new Map(), tipo: new Map(), marca: new Map() };
            var semAcucar = 0;
            itens.forEach(function (item) {
                if (passa(item, t, 'secao')) somar(c.secao, item.secao);
                if (passa(item, t, 'tipo')) somar(c.tipo, item.tipo);
                if (passa(item, t, 'marca')) somar(c.marca, item.marca);
                if (item.semAcucar && passa(item, t, 'semAcucar')) semAcucar++;
            });

            Object.keys(ETAPAS).forEach(function (k) {
                var etapa = ETAPAS[k];
                var escolhido = estado[k];
                var aparecem = [];
                etapa.botoes.forEach(function (b) {
                    var valor = b.getAttribute(etapa.atributo);
                    var n = c[k].get(valor) || 0;
                    var marcado = valor === escolhido;
                    var mostra = escolhido ? marcado : n > 0;
                    if (k === 'tipo') mostra = mostra && b.getAttribute('data-secao-do-tipo') === estado.secao;
                    b.setAttribute('aria-pressed', marcado ? 'true' : 'false');
                    var numero = b.querySelector('.funil-n-valor');
                    if (numero) numero.textContent = String(n);
                    var unidade = b.querySelector('.funil-n .so-leitor');
                    if (unidade) unidade.textContent = n === 1 ? ' produto' : ' produtos';
                    b.hidden = !mostra;
                    b.classList.remove('funil-extra');
                    if (mostra) aparecem.push(b);
                });
                etapa.visiveis = aparecem.length;
                // Marcas: fechado, ficam as seis primeiras. Só esconde se sobrar
                // mais de uma — esconder uma só atrás de um botão é pior que mostrar.
                if (k === 'marca' && !escolhido && aparecem.length > MARCAS_FECHADO + 1) {
                    aparecem.slice(MARCAS_FECHADO).forEach(function (b) { b.classList.add('funil-extra'); });
                }
            });

            if (etapaTipo) etapaTipo.hidden = !estado.secao;
            funil.classList.toggle('tem-secao', !!estado.secao);
            funil.classList.toggle('marcas-abertas', marcasAbertas);
            if (maisMarcas) {
                maisMarcas.hidden = !!estado.marca || ETAPAS.marca.visiveis <= MARCAS_FECHADO + 1;
                maisMarcas.setAttribute('aria-expanded', marcasAbertas ? 'true' : 'false');
                maisMarcas.textContent = marcasAbertas ? 'Ver menos marcas' : 'Ver as ' + ETAPAS.marca.visiveis + ' marcas';
            }
            // Zerado, desabilita em vez de sumir: no celular sumir encolheria o
            // painel e empurraria a grade.
            if (chkSemAcucar) {
                chkSemAcucar.checked = estado.semAcucar;
                chkSemAcucar.disabled = !estado.semAcucar && semAcucar === 0;
                if (nSemAcucar) {
                    nSemAcucar.textContent = String(semAcucar);
                    var unidadeSemAcucar = nSemAcucar.parentNode.querySelector('.so-leitor');
                    if (unidadeSemAcucar) unidadeSemAcucar.textContent = semAcucar === 1 ? ' produto' : ' produtos';
                }
            }
        }

        function temFunil() {
            return !!(estado.secao || estado.tipo || estado.marca || estado.semAcucar);
        }

        function descreverFiltros(termo) {
            var partes = [];
            if (termo) partes.push('"' + termo + '"');
            if (estado.secao) partes.push(nomeDe('secao', estado.secao));
            if (estado.tipo) partes.push(nomeDe('tipo', estado.tipo));
            if (estado.marca) partes.push('marca ' + estado.marca);
            if (estado.semAcucar) partes.push('sem açúcar adicionado');
            return partes.join(' · ');
        }

        // rolar: 'sempre' leva aos resultados (busca enviada); 'se-passou' só
        // rola se os resultados ficaram para cima da tela. No celular o funil
        // mora no topo, e rolar a cada toque tirava a próxima etapa da vista.
        function filtrar(termo, rolar) {
            var t = normalizar(termo.trim());
            var ordem = ordemAtual();
            var temFiltro = !!t || temFunil();
            // A ordem também é estado do catálogo: conta para o "Limpar" e
            // para o aviso falado, mas não esconde produto nenhum.
            var temEstado = temFiltro || !!ordem;
            var visiveis = 0;
            var primeiraSecao = null;

            if (btnLimpar) btnLimpar.hidden = !temEstado;

            // O cartão é testado onde quer que esteja: na seção da linha dele
            // ou já movido para a grade em ordem alfabética.
            itens.forEach(function (item) {
                var bate = passa(item, t, '');
                item.el.hidden = !bate;
                if (bate) visiveis++;
            });

            desenharFunil(t);
            if (totalNaTela) totalNaTela.textContent = String(visiveis);

            secoes.forEach(function (secao) {
                var achou = !!secao.querySelector('.product-card[data-name]:not([hidden])');
                secao.hidden = !achou || !!ordem;
                if (achou && !primeiraSecao) primeiraSecao = secao;

                // A contagem da seção é do catálogo inteiro; durante a busca
                // ela mentiria ("56 produtos" com 2 na tela).
                var contagem = secao.querySelector('.category-count');
                if (contagem) {
                    if (!contagem.dataset.total) contagem.dataset.total = contagem.textContent;
                    if (temFiltro) {
                        var n = secao.querySelectorAll('.product-card:not([hidden])').length;
                        contagem.textContent = n + (n === 1 ? ' produto encontrado' : ' produtos encontrados');
                    } else {
                        contagem.textContent = contagem.dataset.total;
                    }
                }
            });

            if (caixaOrdenada) {
                caixaOrdenada.hidden = !ordem || visiveis === 0;
                if (contagemOrdenada && ordem) {
                    contagemOrdenada.textContent = visiveis + (visiveis === 1 ? ' produto' : ' produtos');
                }
            }

            if (semResultado) semResultado.hidden = visiveis !== 0;
            // O "avise-me" acompanha o estado de nada encontrado.
            if (aviseMe) {
                if (aviseMe.dataset.enviadoPara && aviseMe.dataset.enviadoPara !== termo.trim()) aviseRestaurar();
                aviseMe.hidden = visiveis !== 0 || !temFiltro;
            }
            if (status) {
                var descricao = descreverFiltros(termo.trim());
                var emOrdem = !ordem ? '' : ordem === 'za' ? ' em ordem alfabética (Z–A)' : ' em ordem alfabética (A–Z)';
                status.textContent = !temEstado
                    ? ''
                    : visiveis === 0
                        ? 'Nenhum produto encontrado para ' + descricao + '.'
                        : visiveis + (visiveis === 1 ? ' produto' : ' produtos')
                            + (descricao ? ' para ' + descricao : '') + emOrdem + '.';
            }

            var destino = ordem ? caixaOrdenada : primeiraSecao;
            if (rolar && temEstado && destino
                && (rolar === 'sempre' || destino.getBoundingClientRect().top < 0)) {
                rolarAte(destino);
            }
            return visiveis;
        }

        // O endereço guarda a busca e o funil, então dá para mandar
        // "loja.html?secao=bebidas&tipo=sucos" para um cliente e ele abrir a
        // loja já filtrada.
        function sincronizarEndereco() {
            var p = new URLSearchParams();
            var termo = campo ? campo.value.trim() : '';
            if (termo) p.set('q', termo);
            if (estado.secao) p.set('secao', estado.secao);
            if (estado.tipo) p.set('tipo', estado.tipo);
            if (estado.marca) p.set('marca', estado.marca);
            if (estado.semAcucar) p.set('sem-acucar', '1');
            if (ordemAtual()) p.set('ordem', ordemAtual());
            var busca = p.toString();
            history.replaceState(null, '', 'loja.html' + (busca ? '?' + busca : '') + window.location.hash);
        }

        // Trilho do celular: depois de uma escolha, volta para o começo, onde
        // estão a etiqueta escolhida e as opções da etapa seguinte.
        function voltarTrilhos() {
            if (!funil) return;
            funil.querySelectorAll('.funil-trilho, .funil-marca').forEach(function (t) { t.scrollLeft = 0; });
        }

        function medirFiltro(filtro, valor) {
            medir('filtro_usado', {
                filtro: filtro,
                valor: valor || 'nenhum',
                resultados: document.querySelectorAll('.product-card:not([hidden])').length,
                secao: estado.secao || null,
                tipo: estado.tipo || null,
                marca: estado.marca || null
            });
        }

        function escolher(etapa, valor) {
            if (etapa === 'secao') {
                estado.secao = estado.secao === valor ? '' : valor;
                estado.tipo = '';
            } else {
                estado[etapa] = estado[etapa] === valor ? '' : valor;
            }
            filtrar(campo ? campo.value : '', 'se-passou');
            sincronizarEndereco();
            voltarTrilhos();
            medirFiltro(etapa, estado[etapa]);
        }

        // Estado inicial vindo do endereço.
        var parametros = new URLSearchParams(window.location.search);
        var consulta = (parametros.get('q') || '').trim();
        if (campo && consulta) campo.value = consulta;
        var tipoInicial = parametros.get('tipo') || '';
        var secaoInicial = parametros.get('secao') || '';
        if (valido('tipo', tipoInicial)) {
            estado.tipo = tipoInicial;
            estado.secao = ETAPAS.tipo.porValor.get(tipoInicial).getAttribute('data-secao-do-tipo');
        } else if (valido('secao', secaoInicial)) {
            estado.secao = secaoInicial;
        }
        if (valido('marca', parametros.get('marca'))) estado.marca = parametros.get('marca');
        if (parametros.get('sem-acucar') === '1') estado.semAcucar = true;
        // Endereço do tempo do filtro de categoria (?cat=lauton): vira a marca da
        // categoria ou, se ela mistura marcas, a seção dela.
        var catAntiga = parametros.get('cat') || '';
        if (catAntiga && !estado.marca && !estado.secao) {
            var marcasDaCat = new Set();
            var secoesDaCat = new Set();
            itens.forEach(function (i) {
                if (i.cat !== catAntiga) return;
                marcasDaCat.add(i.marca);
                secoesDaCat.add(i.secao);
            });
            var unica = function (conjunto) { return conjunto.size === 1 ? conjunto.values().next().value : ''; };
            if (valido('marca', unica(marcasDaCat))) estado.marca = unica(marcasDaCat);
            else if (valido('secao', unica(secoesDaCat))) estado.secao = unica(secoesDaCat);
        }
        var ordemInicial = parametros.get('ordem') || '';
        if (selOrdem && (ordemInicial === 'az' || ordemInicial === 'za')) {
            selOrdem.value = ordemInicial;
            aplicarOrdem();
        }
        // Sempre desenha: é o que esconde os tipos e acerta as contagens. No
        // computador o funil só aparece depois disso (ver .funil-pronto no CSS).
        filtrar(consulta, false);
        var painelFiltros = document.querySelector('.filtros');
        if (painelFiltros) painelFiltros.classList.add('funil-pronto');
        if (consulta || temFunil() || ordemAtual()) {
            if (catAntiga) sincronizarEndereco();
            // Chegando filtrado (link da home, link mandado por alguém), a página
            // abre no catálogo: no celular o funil fica à vista, com os produtos
            // logo abaixo.
            rolarAte(document.querySelector('.catalogo-layout') || 0);
        }

        var form = document.querySelector('.header-search');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                filtrar(campo.value, 'sempre');
                sincronizarEndereco();
            });
        }
        if (campo) {
            campo.addEventListener('input', debounce(function () { filtrar(campo.value, false); sincronizarEndereco(); }, 140));

            // Mede o termo depois que a pessoa para de digitar, não a cada
            // tecla — senão "propolis" viraria oito eventos.
            campo.addEventListener('input', debounce(function () {
                var termo = campo.value.trim();
                if (termo.length < 3) return;
                // Alguém digita CNPJ ou telefone no campo de busca de vez em
                // quando. Dado pessoal não pode ir para o GA4 (é regra do
                // próprio Google), então sequência longa de dígitos não sobe.
                var termoMedido = /\d{6,}/.test(termo.replace(/\D/g, '')) ? '(número)' : termo.toLowerCase();
                medir('busca', {
                    search_term: termoMedido,
                    resultados: document.querySelectorAll('.product-card:not([hidden])').length
                });
            }, 1200));
        }

        if (funil) {
            funil.addEventListener('click', function (e) {
                var botao = e.target.closest && e.target.closest('.funil-opcao, .funil-mais');
                if (!botao || !funil.contains(botao)) return;
                if (botao === maisMarcas) {
                    marcasAbertas = !marcasAbertas;
                    desenharFunil(normalizar((campo ? campo.value : '').trim()));
                    return;
                }
                var etapa = botao.hasAttribute('data-secao') ? 'secao'
                    : botao.hasAttribute('data-tipo') ? 'tipo' : 'marca';
                escolher(etapa, botao.getAttribute(ETAPAS[etapa].atributo));
            });
        }

        if (chkSemAcucar) {
            chkSemAcucar.addEventListener('change', function () {
                estado.semAcucar = chkSemAcucar.checked;
                filtrar(campo ? campo.value : '', 'se-passou');
                sincronizarEndereco();
                voltarTrilhos();
                medirFiltro('sem_acucar', String(estado.semAcucar));
            });
        }

        if (selOrdem) {
            selOrdem.addEventListener('change', function () {
                aplicarOrdem();
                filtrar(campo ? campo.value : '', 'se-passou');
                sincronizarEndereco();
                medirFiltro('ordem', selOrdem.value || 'catalogo');
            });
        }

        if (btnLimpar) {
            btnLimpar.addEventListener('click', function () {
                estado.secao = estado.tipo = estado.marca = '';
                estado.semAcucar = false;
                marcasAbertas = false;
                if (selOrdem) { selOrdem.value = ''; aplicarOrdem(); }
                if (campo) campo.value = '';
                filtrar('', false);
                sincronizarEndereco();
                voltarTrilhos();
                // O botão some quando não há mais o que limpar; o foco não pode
                // sumir junto com ele.
                var primeira = ETAPAS.secao.botoes[0];
                if (primeira) primeira.focus({ preventScroll: true });
                rolarAte(document.querySelector('.filtros') || 0);
            });
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

        // "Avise-me": busca sem resultado é pedido de produto que não está no
        // catálogo. Vai pelo mesmo caminho da cópia do cadastro por e-mail,
        // levando junto o termo procurado — é o dado que interessa.
        if (aviseMe) {
            var aviseTermo = document.getElementById('aviseMeTermo');
            var aviseAviso = aviseMe.querySelector('.avise-me-aviso');
            var aviseTelefone = aviseMe.querySelector('#aviseMeTelefone');
            if (aviseTelefone) {
                aviseTelefone.addEventListener('input', function () {
                    aviseTelefone.value = mascararTelefone(aviseTelefone.value);
                });
            }
            aviseMe.addEventListener('submit', function (e) {
                e.preventDefault();
                if (aviseMe.botcheck && aviseMe.botcheck.checked) return;
                var digitos = (aviseTelefone.value || '').replace(/\D/g, '');
                if (digitos.length < 10) {
                    if (aviseAviso) aviseAviso.textContent = 'Falta o DDD ou um número. Exemplo: (21) 90000-0000.';
                    aviseTelefone.focus();
                    return;
                }
                var termo = campo ? campo.value.trim() : '';
                if (aviseTermo) aviseTermo.value = termo || '(sem termo)';
                enviarCopiaPorEmail(aviseMe);
                aviseMe.dataset.enviadoPara = termo;
                // A confirmação fica no lugar dos campos. Nada de prometer
                // prazo: o site não sabe quando, nem se, o produto entra.
                if (aviseCampos) aviseCampos.hidden = true;
                if (avisePronto) {
                    avisePronto.textContent = 'Anotado'
                        + (termo ? ' — você procurou por "' + termo + '".' : '.')
                        + ' Se este produto entrar no catálogo, a gente chama você no WhatsApp.';
                    avisePronto.hidden = false;
                }
                medir('avise_me', { termo: /\d{6,}/.test(termo.replace(/\D/g, '')) ? '(número)' : termo.toLowerCase() });
            });
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
            // altura da página. Repete até a posição parar de se mexer — mas
            // desiste na hora se o visitante mexer na rolagem, senão o laço
            // briga com ele e a página parece voltar sozinha.
            var tentativas = 0;
            var abortado = false;
            var desistir = function () { abortado = true; };
            var eventos = ['wheel', 'touchstart', 'keydown', 'pointerdown'];
            eventos.forEach(function (ev) {
                window.addEventListener(ev, desistir, { passive: true, once: true });
            });

            (function estabilizar() {
                if (abortado) return soltar();
                var antes = Math.round(alvo.getBoundingClientRect().top);
                alvo.scrollIntoView({ behavior: 'instant', block: 'start' });
                var depois = Math.round(alvo.getBoundingClientRect().top);
                if (++tentativas < 30 && Math.abs(depois - antes) > 2) {
                    requestAnimationFrame(estabilizar);
                } else {
                    soltar();
                }
            })();

            function soltar() {
                eventos.forEach(function (ev) { window.removeEventListener(ev, desistir); });
            }
        }

        window.addEventListener('hashchange', corrigirAncora);
        window.addEventListener('load', corrigirAncora);
        corrigirAncora();
    });

    // =================================================================
    // Lista de pedido
    // O site inteiro promete "você manda a lista e a gente confirma na
    // conversa", mas até aqui o comerciante tinha que abrir produto por
    // produto e digitar tudo à mão no WhatsApp. Agora ele monta a lista
    // navegando, e o site escreve a mensagem por ele.
    //
    // A lista fica no localStorage do próprio aparelho e sobrevive a fechar o
    // navegador — o comerciante monta hoje e manda amanhã. Ela só sai dali
    // quando ele envia o pedido: aí passa pelo formulário de quem está
    // pedindo, que registra uma cópia por e-mail e abre o WhatsApp.
    // =================================================================
    var CHAVE_LISTA = 'dr-lista-pedido';
    var CHAVE_HISTORICO = 'dr-pedidos-enviados';
    var CHAVE_CLIENTE = 'dr-cliente-pedido';
    var LIMITE_URL = 1800; // wa.me quebra por volta de 2000 caracteres

    // Pedido enviado vira histórico no próprio aparelho: reposição é o que mais
    // acontece numa distribuidora, e remontar 14 itens do zero toda semana era o
    // maior atrito de quem já é cliente. Guarda os 5 últimos, nada sai daqui.
    function lerHistorico() {
        try {
            var bruto = recuperar(CHAVE_HISTORICO);
            var lista = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            return [];
        }
    }

    // Código curto para os dois lados falarem do mesmo pedido na conversa.
    function codigoDoPedido(quando) {
        var d = quando || new Date();
        var dois = function (n) { return (n < 10 ? '0' : '') + n; };
        var doDia = lerHistorico().filter(function (p) {
            return (p.codigo || '').indexOf('DR-' + dois(d.getDate()) + dois(d.getMonth() + 1)) === 0;
        }).length;
        return 'DR-' + dois(d.getDate()) + dois(d.getMonth() + 1) + '-' + dois(doDia + 1);
    }

    function guardarPedidoEnviado(lista) {
        if (!lista.length) return null;
        var agora = new Date();
        var registro = { em: agora.toISOString(), codigo: codigoDoPedido(agora), itens: lista.map(function (i) {
            return { id: i.id, nome: i.nome, marca: i.marca, qtd: i.qtd };
        }) };
        var anteriores = lerHistorico();
        anteriores.unshift(registro);
        guardar(CHAVE_HISTORICO, JSON.stringify(anteriores.slice(0, 5)));
        return registro;
    }

    function lerLista() {
        try {
            var bruto = recuperar(CHAVE_LISTA);
            var lista = bruto ? JSON.parse(bruto) : [];
            return Array.isArray(lista) ? lista : [];
        } catch (e) {
            return [];
        }
    }

    function gravarLista(lista) {
        guardar(CHAVE_LISTA, JSON.stringify(lista));
        atualizarTudo(lista);
    }

    function totalItens(lista) {
        return lista.reduce(function (n, i) { return n + i.qtd; }, 0);
    }

    // ---- mensagem do WhatsApp ----
    // Corta pelo número de caracteres da URL final, não do texto: acento vira
    // três caracteres depois do encode e a conta erra feio sem isso.
    function linhaDoItem(i) {
        return i.qtd + 'x ' + i.nome + (i.marca ? ' (' + i.marca + ')' : '');
    }

    // Lista para mandar a alguém (sócio, gerente): sem dados de quem pede.
    function montarMensagem(lista) {
        return cortarMensagem('Olá! Montei uma lista pelo site:\n\n', lista,
            '\n\nPode confirmar disponibilidade e as condições?');
    }

    // O pedido que vai para o WhatsApp: quem pede, os itens e o código.
    function montarMensagemPedido(lista, codigo, d) {
        var topo = ['Olá! Pedido ' + codigo + ' pelo site.', ''];
        if (d.company) topo.push('*Empresa:* ' + d.company);
        topo.push('*CNPJ:* ' + d.cnpj, '*Responsável:* ' + d.name, '*WhatsApp:* ' + d.phone);
        if (d.bairro) topo.push('*Entrega:* ' + d.bairro);
        var fim = (d.observacao ? '\n\n*Observação:* ' + d.observacao : '') +
            '\n\nPode confirmar disponibilidade e as condições?';
        return cortarMensagem(topo.join('\n') + '\n\n', lista, fim);
    }

    function cortarMensagem(cabecalho, lista, rodape) {
        var linhas = lista.map(function (i) { return '• ' + linhaDoItem(i); });

        var cabem = linhas.length;
        while (cabem > 0) {
            var corpo = linhas.slice(0, cabem).join('\n');
            var sobra = cabem < linhas.length
                ? '\n\n... e mais ' + (linhas.length - cabem) + ' ' +
                  (linhas.length - cabem === 1 ? 'item' : 'itens') +
                  '. Mando o resto aqui na conversa.'
                : '';
            var texto = cabecalho + corpo + sobra + rodape;
            if (encodeURIComponent(texto).length <= LIMITE_URL) {
                return { texto: texto, cortou: cabem < linhas.length, cabem: cabem };
            }
            cabem--;
        }
        return { texto: cabecalho + rodape, cortou: true, cabem: 0 };
    }

    // ---- painel ----
    // Três etapas na mesma gaveta: a lista, quem está pedindo e o pedido
    // pronto. Todo o HTML daqui é fixo; dado digitado ou guardado entra só
    // por .value e .textContent.
    function montarPainel() {
        var base = document.body.getAttribute('data-base') || '';
        var painel = document.createElement('div');
        painel.className = 'lista-painel';
        painel.id = 'listaPainel';
        painel.setAttribute('role', 'dialog');
        painel.setAttribute('aria-modal', 'false');
        painel.setAttribute('aria-labelledby', 'listaTitulo');
        painel.hidden = true;
        painel.innerHTML =
            '<div class="lista-topo">' +
            '<h2 id="listaTitulo">Sua lista</h2>' +
            '<button type="button" class="lista-fechar" aria-label="Fechar a lista">&times;</button>' +
            '</div>' +

            '<div class="lista-etapa" data-etapa="lista">' +
            '<div class="lista-itens" id="listaItens"></div>' +
            '<div class="lista-rodape">' +
            '<button type="button" class="btn lista-continuar" id="listaContinuar">Continuar para o pedido</button>' +
            '<div class="lista-rodape-secundario">' +
            // Mandar a lista para o sócio, o gerente ou outro comerciante.
            '<button type="button" class="link-botao lista-mandar" id="listaMandar" data-compartilhar data-origem="lista" ' +
            'data-titulo="Lista de pedido - Distri Rio">' +
            '<span class="btn-compartilhar-rotulo">Mandar para alguém</span></button>' +
            '<button type="button" class="link-botao lista-limpar" id="listaLimpar">Esvaziar lista</button>' +
            '</div>' +
            '</div>' +
            '</div>' +

            '<form class="lista-etapa pedido-form" data-etapa="dados" id="pedidoForm" hidden>' +
            '<div class="pedido-corpo">' +
            '<div class="pedido-resumo">' +
            '<p class="pedido-resumo-texto" id="pedidoResumo"></p>' +
            '<button type="button" class="link-botao pedido-link" id="pedidoVoltar">Mudar os itens</button>' +
            '</div>' +
            '<input type="checkbox" name="botcheck" class="job-form-honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<input type="hidden" name="access_key" value="7e36d83f-e2b1-45cd-a948-b94cd71fa7ec">' +
            '<input type="hidden" name="subject" value="">' +
            '<input type="hidden" name="from_name" value="Site Distri Rio">' +
            '<input type="hidden" name="pedido" value="">' +
            '<input type="hidden" name="itens" value="">' +
            '<input type="hidden" name="total_de_itens" value="">' +
            '<input type="hidden" name="total_de_unidades" value="">' +
            '<input type="hidden" name="pagina" value="">' +

            // Quem já pediu neste aparelho só confere e envia.
            '<div class="pedido-quem" id="pedidoQuem" hidden>' +
            '<p class="pedido-quem-rotulo">Pedido para</p>' +
            '<p class="pedido-quem-empresa" id="pedidoQuemEmpresa"></p>' +
            '<p class="pedido-quem-detalhe" id="pedidoQuemDetalhe"></p>' +
            '<button type="button" class="link-botao pedido-link" id="pedidoAlterar">Alterar dados</button>' +
            '</div>' +

            '<fieldset class="pedido-campos" id="pedidoCampos">' +
            '<legend class="pedido-legenda">Quem está pedindo</legend>' +
            '<div class="form-field">' +
            '<label for="pedidoCnpj">CNPJ</label>' +
            '<input type="text" id="pedidoCnpj" name="cnpj" placeholder="00.000.000/0000-00" inputmode="numeric" ' +
            'autocomplete="off" maxlength="18" aria-describedby="pedidoCnpjRetorno" required>' +
            '<p class="form-dica" id="pedidoCnpjRetorno" role="status" aria-live="polite"></p>' +
            '</div>' +
            '<div class="form-field">' +
            '<label for="pedidoEmpresa">Razão social <span class="form-opcional">(vem do CNPJ)</span></label>' +
            '<input type="text" id="pedidoEmpresa" name="company" autocomplete="organization" maxlength="120">' +
            '</div>' +
            '<div class="form-field">' +
            '<label for="pedidoNome">Seu nome</label>' +
            '<input type="text" id="pedidoNome" name="name" autocomplete="name" maxlength="80" required>' +
            '</div>' +
            '<div class="form-field">' +
            '<label for="pedidoTelefone">WhatsApp</label>' +
            '<input type="tel" id="pedidoTelefone" name="phone" placeholder="(21) 90000-0000" inputmode="numeric" ' +
            'autocomplete="tel-national" maxlength="15" required>' +
            '</div>' +
            '<div class="form-field">' +
            '<label for="pedidoBairro">Bairro ou cidade da entrega <span class="form-opcional">(opcional)</span></label>' +
            '<input type="text" id="pedidoBairro" name="bairro" autocomplete="address-level2" maxlength="80">' +
            '</div>' +
            '</fieldset>' +

            '<div class="form-field">' +
            '<label for="pedidoObs">Observação <span class="form-opcional">(opcional)</span></label>' +
            '<textarea id="pedidoObs" name="observacao" rows="2" maxlength="500"></textarea>' +
            '</div>' +
            '<label class="form-consent pedido-lembrar">' +
            '<input type="checkbox" id="pedidoLembrar" checked>' +
            '<span>Guardar meus dados neste aparelho para o próximo pedido</span>' +
            '</label>' +
            '</div>' +
            '<div class="lista-rodape">' +
            '<button type="submit" class="btn" id="pedidoEnviar">Enviar pedido</button>' +
            '<p class="pedido-lgpd">Seus dados e o pedido chegam à Distri Rio por e-mail e pelo WhatsApp, como explica a ' +
            '<a href="' + base + 'politica-de-privacidade.html">Política de Privacidade</a>.</p>' +
            '</div>' +
            '</form>' +

            '<div class="lista-etapa pedido-pronto" data-etapa="enviado" hidden>' +
            '<div class="pedido-corpo">' +
            '<p class="pedido-codigo" id="pedidoCodigo"></p>' +
            '<h3 class="pedido-pronto-titulo" id="pedidoProntoTitulo" tabindex="-1"></h3>' +
            '<p class="pedido-pronto-texto" id="pedidoProntoTexto"></p>' +
            '<p class="pedido-copia" id="pedidoCopia" role="status" aria-live="polite"></p>' +
            '<ul class="pedido-pronto-itens" id="pedidoProntoItens"></ul>' +
            '</div>' +
            '<div class="lista-rodape">' +
            '<a class="btn btn-zap" id="pedidoZap" target="_blank" rel="noopener">Abrir o pedido no WhatsApp</a>' +
            '<div class="lista-rodape-secundario">' +
            '<button type="button" class="link-botao pedido-link" id="pedidoNovo">Começar outra lista</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        document.body.appendChild(painel);
        return painel;
    }

    function montarBotaoFlutuante() {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'lista-flutuante';
        b.id = 'listaFlutuante';
        b.hidden = true;
        b.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
            '<path d="M4 6h16M4 12h16M4 18h10"/></svg>' +
            '<span class="lista-flutuante-texto">Minha lista</span>' +
            '<span class="lista-contador" id="listaContador">0</span>';
        document.body.appendChild(b);
        return b;
    }

    var painel, flutuante;

    function atualizarTudo(lista) {
        if (!flutuante) return;
        var total = totalItens(lista);

        flutuante.hidden = total === 0;
        var contador = document.getElementById('listaContador');
        if (contador) contador.textContent = String(total);
        flutuante.setAttribute('aria-label',
            total === 1 ? 'Abrir a lista, 1 item' : 'Abrir a lista, ' + total + ' itens');

        // marca os botões dos produtos que já estão na lista
        var dentro = {};
        lista.forEach(function (i) { dentro[i.id] = i.qtd; });
        document.querySelectorAll('[data-add]').forEach(function (btn) {
            var qtd = dentro[btn.getAttribute('data-add')];
            btn.classList.toggle('na-lista', !!qtd);
            var rotulo = btn.querySelector('.btn-lista-rotulo');
            if (!rotulo) return;
            rotulo.textContent = qtd ? qtd + ' na lista' : 'Adicionar à lista';
        });

        if (!painel || painel.hidden) return;
        desenharItens(lista);
    }

    function desenharItens(lista) {
        var caixa = document.getElementById('listaItens');
        var enviar = document.getElementById('listaContinuar');
        if (!caixa) return;

        if (!lista.length) {
            caixa.innerHTML = '<p class="lista-vazia">Sua lista está vazia. ' +
                'Vá ao catálogo e toque em "Adicionar à lista" nos produtos que quiser.</p>';
            desenharHistorico(caixa);
            if (enviar) enviar.hidden = true;
            var mandarVazio = document.getElementById('listaMandar');
            if (mandarVazio) mandarVazio.hidden = true;
            var limpar = document.getElementById('listaLimpar');
            if (limpar) limpar.hidden = true;
            return;
        }

        caixa.innerHTML = '';
        lista.forEach(function (item) {
            var li = document.createElement('div');
            li.className = 'lista-item' + (item.id === recemEntrou ? ' acabou-de-entrar' : '');
            li.innerHTML =
                '<div class="lista-item-texto">' +
                '<strong>' + escapar(item.nome) + '</strong>' +
                (item.marca ? '<span>' + escapar(item.marca) + '</span>' : '') +
                '</div>' +
                '<div class="lista-qtd">' +
                '<button type="button" class="lista-menos" aria-label="Diminuir a quantidade de ' + escapar(item.nome) + '">&minus;</button>' +
                // Campo digitável: quem pede 12 caixas tocava 12 vezes no "+".
                '<input type="number" class="lista-qtd-valor" inputmode="numeric" min="1" max="999" step="1" ' +
                'value="' + item.qtd + '" aria-label="Quantidade de ' + escapar(item.nome) + '">' +
                '<button type="button" class="lista-mais" aria-label="Aumentar a quantidade de ' + escapar(item.nome) + '">+</button>' +
                '</div>' +
                '<button type="button" class="lista-remover" aria-label="Tirar ' + escapar(item.nome) + ' da lista">&times;</button>';

            li.querySelector('.lista-menos').addEventListener('click', function () { mudarQtd(item.id, -1); });
            li.querySelector('.lista-mais').addEventListener('click', function () { mudarQtd(item.id, 1); });
            li.querySelector('.lista-remover').addEventListener('click', function () { remover(item.id); });
            var campo = li.querySelector('input.lista-qtd-valor');
            campo.addEventListener('change', function () {
                var n = Math.round(Number(campo.value));
                if (!isFinite(n) || n < 1) { campo.value = item.qtd; return; }
                definirQtd(item.id, Math.min(n, 999));
            });
            // Enter fecha o teclado do celular sem enviar nada.
            campo.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); campo.blur(); } });
            caixa.appendChild(li);
        });
        recemEntrou = null;

        var msg = montarMensagem(lista);
        if (enviar) enviar.hidden = false;
        var mandar = document.getElementById('listaMandar');
        if (mandar) {
            mandar.hidden = false;
            mandar.setAttribute('data-texto', msg.texto);
            mandar.setAttribute('data-url', (document.body.getAttribute('data-base') || '') === '../'
                ? 'https://distririo.com.br/loja.html' : window.location.origin + '/loja.html');
        }
        var limparBtn = document.getElementById('listaLimpar');
        if (limparBtn) limparBtn.hidden = false;
    }

    function escapar(t) {
        var d = document.createElement('div');
        d.textContent = t == null ? '' : t;
        return d.innerHTML;
    }

    // Qual item acabou de entrar. Serve só para a linha dele nascer carimbada
    // na próxima desenhada do painel; é limpo logo depois de usar.
    var recemEntrou = null;

    function adicionar(id, nome, marca) {
        recemEntrou = id;
        var lista = lerLista();
        var achou = lista.find(function (i) { return i.id === id; });
        if (achou) {
            achou.qtd++;
        } else {
            lista.push({ id: id, nome: nome, marca: marca, qtd: 1 });
        }
        gravarLista(lista);
        medir('lista_adicionar', { item_id: id, item_name: nome });
        return lista;
    }

    function mudarQtd(id, delta) {
        var lista = lerLista();
        var item = lista.find(function (i) { return i.id === id; });
        if (!item) return;
        item.qtd += delta;
        if (item.qtd < 1) return remover(id);
        gravarLista(lista);
    }

    function definirQtd(id, quantidade) {
        var lista = lerLista();
        var item = lista.find(function (i) { return i.id === id; });
        if (!item) return;
        if (quantidade < 1) return remover(id);
        item.qtd = quantidade;
        gravarLista(lista);
        medir('lista_quantidade', { item_id: id, quantidade: quantidade });
    }

    // Pedidos anteriores, para repetir com dois toques.
    function desenharHistorico(caixa) {
        var anteriores = lerHistorico();
        if (!anteriores.length) return;

        var bloco = document.createElement('div');
        bloco.className = 'lista-historico';
        var titulo = document.createElement('h3');
        titulo.textContent = 'Pedidos que você já mandou';
        bloco.appendChild(titulo);

        anteriores.forEach(function (pedido, i) {
            var quando = new Date(pedido.em);
            var data = isNaN(quando) ? '' : quando.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
            var itens = pedido.itens.reduce(function (n, it) { return n + it.qtd; }, 0);
            var botao = document.createElement('button');
            botao.type = 'button';
            botao.className = 'lista-repetir';
            botao.innerHTML = '<span class="lista-repetir-acao">Repetir</span> ' +
                '<span class="lista-repetir-quando">' + escapar(data) + '</span> ' +
                '<span class="lista-repetir-itens">' + itens + (itens === 1 ? ' item' : ' itens') + '</span>' +
                (pedido.codigo ? '<span class="lista-repetir-codigo">' + escapar(pedido.codigo) + '</span>' : '');
            botao.addEventListener('click', function () {
                gravarLista(pedido.itens.map(function (it) { return { id: it.id, nome: it.nome, marca: it.marca, qtd: it.qtd }; }));
                medir('repetiu_pedido', { posicao: i, itens: itens });
            });
            bloco.appendChild(botao);
        });

        caixa.appendChild(bloco);
    }

    function remover(id) {
        var lista = lerLista().filter(function (i) { return i.id !== id; });
        gravarLista(lista);
        medir('lista_remover', { item_id: id });
        if (!lista.length && painel && !painel.hidden) abrirPainel(false);
    }

    function abrirPainel(abrir) {
        if (!painel) return;
        painel.hidden = !abrir;
        document.body.classList.toggle('lista-aberta', abrir);
        if (abrir) {
            mostrarEtapa('lista');
            desenharItens(lerLista());
            var fechar = painel.querySelector('.lista-fechar');
            if (fechar) fechar.focus();
            medir('lista_abrir', { itens: totalItens(lerLista()) });
        } else if (flutuante && !flutuante.hidden) {
            flutuante.focus();
        }
    }

    function mostrarEtapa(nome) {
        if (!painel) return;
        painel.querySelectorAll('.lista-etapa').forEach(function (etapa) {
            etapa.hidden = etapa.getAttribute('data-etapa') !== nome;
        });
        var titulo = document.getElementById('listaTitulo');
        if (titulo) titulo.textContent = nome === 'lista' ? 'Sua lista' : nome === 'dados' ? 'Dados do pedido' : 'Pedido';
    }

    // Quem já pediu neste aparelho. Lido com desconfiança: é texto que qualquer
    // extensão ou pessoa pode ter mexido, então só volta o que tem forma de
    // dado e com tamanho limitado.
    function lerCliente() {
        try {
            var c = JSON.parse(recuperar(CHAVE_CLIENTE) || 'null');
            if (!c || typeof c !== 'object') return null;
            var texto = function (v, max) { return typeof v === 'string' ? v.slice(0, max) : ''; };
            var limpo = {
                cnpj: texto(c.cnpj, 18), company: texto(c.company, 120), name: texto(c.name, 80),
                phone: texto(c.phone, 15), bairro: texto(c.bairro, 80)
            };
            var completo = cnpjValido(limpo.cnpj) && limpo.name.trim() && limpo.phone.replace(/\D/g, '').length >= 10;
            return completo ? limpo : null;
        } catch (e) {
            return null;
        }
    }

    function esquecerCliente() {
        try { localStorage.removeItem(CHAVE_CLIENTE); } catch (e) { /* modo privado */ }
    }

    function plural(n, um, varios) {
        return n + ' ' + (n === 1 ? um : varios);
    }

    function prepararPedido(lista) {
        var form = document.getElementById('pedidoForm');
        var resumo = document.getElementById('pedidoResumo');
        if (resumo) resumo.textContent = plural(lista.length, 'item', 'itens') + ' · ' + plural(totalItens(lista), 'unidade', 'unidades');

        var cliente = lerCliente();
        var quem = document.getElementById('pedidoQuem');
        var campos = document.getElementById('pedidoCampos');
        if (cliente) {
            ['cnpj', 'company', 'name', 'phone', 'bairro'].forEach(function (k) { form[k].value = cliente[k]; });
            document.getElementById('pedidoQuemEmpresa').textContent = cliente.company || 'CNPJ ' + cliente.cnpj;
            document.getElementById('pedidoQuemDetalhe').textContent =
                [cliente.company ? 'CNPJ ' + cliente.cnpj : '', cliente.name, cliente.phone, cliente.bairro].filter(Boolean).join(' · ');
        }
        if (quem) quem.hidden = !cliente;
        if (campos) campos.hidden = !!cliente;
        var lembrar = document.getElementById('pedidoLembrar');
        if (lembrar && cliente) lembrar.checked = true;
        return cliente;
    }

    function mostrarCamposDoPedido() {
        var quem = document.getElementById('pedidoQuem');
        var campos = document.getElementById('pedidoCampos');
        if (quem) quem.hidden = true;
        if (campos) campos.hidden = false;
    }

    // O WhatsApp abre no mesmo toque do envio: fora dele o navegador bloqueia
    // a janela. 'noopener' faria o window.open devolver null mesmo abrindo, e
    // aí não daria para saber se abriu; o opener é cortado à mão logo depois.
    function abrirJanelaWhatsApp(url) {
        var janela = null;
        try {
            janela = window.open(url, '_blank');
            if (janela) janela.opener = null;
        } catch (e) {
            janela = null;
        }
        return !!janela;
    }

    // Desta vez a cópia por e-mail é o registro do pedido, então o resultado
    // aparece para quem pediu — sem travar nada se o serviço cair.
    function enviarPedidoPorEmail(form) {
        try {
            return fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' },
                keepalive: true
            }).then(function (r) {
                return r.json().then(function (j) { return !!(r.ok && j && j.success); }, function () { return r.ok; });
            }).catch(function () { return false; });
        } catch (e) {
            return Promise.resolve(false);
        }
    }

    function ligarPedido() {
        var form = document.getElementById('pedidoForm');
        if (!form) return;
        ligarMascaras(form);
        var enviando = false;

        var val = function (campo) {
            return form[campo] && form[campo].value ? String(form[campo].value).trim() : '';
        };

        document.getElementById('listaContinuar').addEventListener('click', function () {
            var lista = lerLista();
            if (!lista.length) return;
            var cliente = prepararPedido(lista);
            mostrarEtapa('dados');
            var foco = cliente ? document.getElementById('pedidoEnviar') : form.cnpj;
            if (foco) foco.focus();
            medir('pedido_formulario', { itens: lista.length, unidades: totalItens(lista), cliente_lembrado: !!cliente });
        });

        document.getElementById('pedidoVoltar').addEventListener('click', function () {
            mostrarEtapa('lista');
            desenharItens(lerLista());
            var continuar = document.getElementById('listaContinuar');
            if (continuar) continuar.focus();
        });

        document.getElementById('pedidoAlterar').addEventListener('click', function () {
            mostrarCamposDoPedido();
            form.cnpj.focus();
        });

        document.getElementById('pedidoNovo').addEventListener('click', function () {
            mostrarEtapa('lista');
            desenharItens(lerLista());
            var fechar = painel.querySelector('.lista-fechar');
            if (fechar) fechar.focus();
        });

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (enviando) return;
            // Honeypot: só robô marca. Não abre WhatsApp nem manda e-mail.
            if (form.botcheck && form.botcheck.checked) return;
            if (!form.checkValidity()) {
                // Dado lembrado que deixou de valer fica escondido no cartão:
                // mostra os campos para a pessoa ver o que corrigir.
                mostrarCamposDoPedido();
                form.reportValidity();
                return;
            }
            var lista = lerLista();
            if (!lista.length) {
                mostrarEtapa('lista');
                return;
            }
            enviando = true;

            var dados = {
                cnpj: val('cnpj'), company: val('company'), name: val('name'),
                phone: val('phone'), bairro: val('bairro'), observacao: val('observacao')
            };
            var registro = guardarPedidoEnviado(lista);
            var codigo = registro ? registro.codigo : codigoDoPedido();
            var msg = montarMensagemPedido(lista, codigo, dados);
            var url = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(msg.texto);
            var abriu = abrirJanelaWhatsApp(url);

            // A cópia leva a lista inteira, sem o corte de tamanho da mensagem.
            form.subject.value = 'Pedido ' + codigo + ' pelo site - ' + (dados.company || dados.cnpj) +
                ' (' + plural(lista.length, 'item', 'itens') + ')';
            form.pedido.value = codigo;
            form.itens.value = lista.map(linhaDoItem).join('\n');
            form.total_de_itens.value = String(lista.length);
            form.total_de_unidades.value = String(totalItens(lista));
            form.pagina.value = window.location.origin + window.location.pathname;

            var copia = document.getElementById('pedidoCopia');
            copia.className = 'pedido-copia';
            copia.textContent = 'Registrando a cópia do pedido…';
            enviarPedidoPorEmail(form).then(function (ok) {
                copia.className = 'pedido-copia ' + (ok ? 'pedido-copia-ok' : 'pedido-copia-erro');
                copia.textContent = ok
                    ? 'Cópia do pedido registrada com a Distri Rio.'
                    : 'A cópia por e-mail não foi. Envie a mensagem no WhatsApp para o pedido chegar.';
                medir('pedido_copia_email', { ok: ok });
            });

            var lembrar = document.getElementById('pedidoLembrar');
            if (lembrar && lembrar.checked) {
                guardar(CHAVE_CLIENTE, JSON.stringify({
                    cnpj: dados.cnpj, company: dados.company, name: dados.name, phone: dados.phone, bairro: dados.bairro
                }));
            } else {
                esquecerCliente();
            }

            // Tela de pedido pronto: código, o que foi e o caminho do WhatsApp.
            document.getElementById('pedidoCodigo').textContent = codigo;
            document.getElementById('pedidoProntoTitulo').textContent = abriu
                ? 'Pedido aberto no WhatsApp'
                : 'Pedido pronto para enviar';
            document.getElementById('pedidoProntoTexto').textContent = (abriu
                ? 'Confira a mensagem e toque em enviar no WhatsApp.'
                : 'Toque no botão abaixo para abrir o WhatsApp com o pedido.') +
                ' A gente confirma disponibilidade e condições na conversa.' +
                (msg.cortou ? ' A mensagem leva os ' + msg.cabem + ' primeiros itens e avisa que o resto segue na conversa.' : '');
            var itensPronto = document.getElementById('pedidoProntoItens');
            itensPronto.textContent = '';
            lista.forEach(function (i) {
                var li = document.createElement('li');
                li.textContent = linhaDoItem(i);
                itensPronto.appendChild(li);
            });
            var zap = document.getElementById('pedidoZap');
            zap.href = url;
            zap.textContent = abriu ? 'Não abriu? Abrir no WhatsApp' : 'Abrir o pedido no WhatsApp';

            gravarLista([]);
            form.observacao.value = '';
            mostrarEtapa('enviado');
            document.getElementById('pedidoProntoTitulo').focus();
            enviando = false;

            medir('pedido_enviado', {
                itens: lista.length, unidades: totalItens(lista), codigo: codigo,
                whatsapp_abriu: abriu, dados_guardados: !!(lembrar && lembrar.checked)
            });
        });
    }

    aoCarregar(function () {
        // Só monta onde há algo para adicionar, ou onde já existe lista guardada.
        var temBotao = document.querySelector('[data-add]');
        if (!temBotao && !lerLista().length) return;

        painel = montarPainel();
        flutuante = montarBotaoFlutuante();

        flutuante.addEventListener('click', function () { abrirPainel(painel.hidden); });
        painel.querySelector('.lista-fechar').addEventListener('click', function () { abrirPainel(false); });
        document.getElementById('listaLimpar').addEventListener('click', function () {
            gravarLista([]);
            abrirPainel(false);
        });

        // O código do pedido entra na mensagem, na cópia por e-mail e no
        // histórico: serve para os dois lados falarem do mesmo pedido.
        ligarPedido();

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && painel && !painel.hidden) abrirPainel(false);
        });

        // Um ouvinte só, delegado: a loja tem 426 botões.
        document.addEventListener('click', function (e) {
            var btn = e.target.closest && e.target.closest('[data-add]');
            if (!btn) return;
            e.preventDefault();
            adicionar(btn.getAttribute('data-add'), btn.getAttribute('data-nome'), btn.getAttribute('data-marca'));
            btn.classList.add('acabou-de-entrar');
            setTimeout(function () { btn.classList.remove('acabou-de-entrar'); }, 600);
        });

        // Lista alterada em outra aba do mesmo navegador.
        window.addEventListener('storage', function (e) {
            if (e.key === CHAVE_LISTA) atualizarTudo(lerLista());
        });

        atualizarTudo(lerLista());
    });

    // =================================================================
    // Formulários que abrem o WhatsApp
    // =================================================================
    // O pop-up pode ser engolido em silêncio (bloqueador, navegador in-app do
    // Instagram, Safari restrito). Nesse caso o visitante preenchia tudo e não
    // acontecia nada — agora ele sempre recebe uma confirmação com o link.
    function abrirWhatsApp(form, texto) {
        var url = 'https://wa.me/' + ZAP + '?text=' + encodeURIComponent(texto);
        // Com 'noopener' o window.open devolve null mesmo quando abre, e a tela
        // dizia "Sua mensagem está pronta" com o WhatsApp já aberto do lado.
        var janela = abrirJanelaWhatsApp(url);

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
        if (caixa.getBoundingClientRect().bottom > window.innerHeight) rolarAte(caixa);
        if (!janela) link.focus();
    }

    // Cópia do cadastro por e-mail, em paralelo ao WhatsApp.
    // O formulário continua terminando no WhatsApp; isto é só a rede de
    // segurança para quem preenche tudo e desiste na tela do WhatsApp — antes,
    // esse lead sumia sem deixar CNPJ nem telefone. Falha em silêncio de
    // propósito: o visitante não pode ser barrado porque um serviço caiu.
    // keepalive mantém o envio vivo mesmo quando a aba vai para o WhatsApp.
    function enviarCopiaPorEmail(form) {
        if (!form.querySelector('input[name="access_key"]')) return;
        try {
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                body: new FormData(form),
                headers: { Accept: 'application/json' },
                keepalive: true
            }).catch(function () { /* o WhatsApp continua sendo o caminho principal */ });
        } catch (e) { /* ok */ }
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

    // Confere se o CNPJ existe de verdade, e nao so se os digitos fecham.
    // A BrasilAPI le o cadastro publico da Receita. Se a consulta falhar (rede,
    // limite, servico fora), o formulario segue valendo com a checagem local:
    // e melhor deixar passar do que travar um cliente por causa de uma API.
    var cacheCnpj = {};

    // Guarda a consulta em andamento, não só a resposta: sair do campo duas
    // vezes seguidas não pode disparar duas idas à Receita.
    function consultarCnpj(numero) {
        if (cacheCnpj[numero]) return cacheCnpj[numero];
        cacheCnpj[numero] = fetch('https://brasilapi.com.br/api/cnpj/v1/' + numero)
            .then(function (r) {
                if (r.status === 404) return { achou: false };
                if (!r.ok) return { indisponivel: true };
                return r.json().then(function (d) {
                    return {
                        achou: true,
                        razao: d.razao_social || d.nome_fantasia || '',
                        situacao: (d.descricao_situacao_cadastral || '').toUpperCase(),
                        municipio: d.municipio || ''
                    };
                });
            })
            .catch(function () { return { indisponivel: true }; })
            .then(function (r) {
                // Falha de rede não fica guardada: a próxima saída do campo tenta de novo.
                if (r.indisponivel) delete cacheCnpj[numero];
                return r;
            });
        return cacheCnpj[numero];
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
            // Tecla que nao e numero nem sai na tela.
            cnpj.addEventListener('keypress', function (e) {
                if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
            });
            cnpj.addEventListener('paste', function (e) {
                var texto = (e.clipboardData || window.clipboardData).getData('text');
                if (!/^[\d.\/\s-]+$/.test(texto)) e.preventDefault();
            });

            // Cada formulário diz onde fica o retorno da Receita pelo
            // aria-describedby do campo (cadastro e pedido convivem no site).
            var retorno = document.getElementById(cnpj.getAttribute('aria-describedby') || 'cnpjRetorno');
            function dizer(msg, tipo) {
                if (!retorno) return;
                retorno.textContent = msg || '';
                retorno.className = 'form-dica' + (tipo ? ' form-dica-' + tipo : '');
            }

            cnpj.addEventListener('blur', function () {
                var digitos = cnpj.value.replace(/\D/g, '');
                if (!cnpj.value) { cnpj.setCustomValidity(''); dizer(''); return; }
                if (!cnpjValido(cnpj.value)) {
                    cnpj.setCustomValidity('CNPJ inválido — confira os números.');
                    dizer('CNPJ inválido — confira os números.', 'erro');
                    return;
                }
                cnpj.setCustomValidity('');
                dizer('Conferindo na Receita', 'carregando');
                consultarCnpj(digitos).then(function (r) {
                    if (cnpj.value.replace(/\D/g, '') !== digitos) return;
                    if (r.indisponivel) { dizer(''); return; }
                    if (!r.achou) {
                        cnpj.setCustomValidity('Não encontramos esse CNPJ no cadastro da Receita.');
                        dizer('Não encontramos esse CNPJ no cadastro da Receita.', 'erro');
                        return;
                    }
                    if (r.situacao && r.situacao !== 'ATIVA') {
                        cnpj.setCustomValidity('Esse CNPJ consta como ' + r.situacao.toLowerCase() + '. Vendemos só para CNPJ ativo.');
                        dizer('Esse CNPJ consta como ' + r.situacao.toLowerCase() + '. Vendemos só para CNPJ ativo.', 'erro');
                        return;
                    }
                    cnpj.setCustomValidity('');
                    dizer(r.razao ? r.razao + ' — ativo' : 'CNPJ ativo', 'ok');
                    // Preenche a razao social se a pessoa ainda nao escreveu.
                    var empresa = form.querySelector('input[name="company"]');
                    if (empresa && !empresa.value.trim() && r.razao) empresa.value = r.razao;
                });
            });
        }

        form.querySelectorAll('input[name="phone"], input[type="tel"]').forEach(function (tel) {
            tel.setAttribute('inputmode', 'numeric');
            tel.addEventListener('keypress', function (e) {
                if (e.key.length === 1 && !/[0-9]/.test(e.key)) e.preventDefault();
            });
            tel.addEventListener('input', function () {
                var fim = tel.selectionStart === tel.value.length;
                tel.value = mascararTelefone(tel.value);
                if (fim) tel.setSelectionRange(tel.value.length, tel.value.length);
                var digitos = tel.value.replace(/\D/g, '').length;
                tel.setCustomValidity(!tel.value || digitos >= 10 ? '' : 'Telefone incompleto — inclua o DDD.');
                var dica = tel.parentElement.querySelector('.form-dica-telefone');
                if (dica && digitos >= 10) dica.remove();
            });
            // O CNPJ avisava na hora e o telefone só no envio, com a borda
            // vermelha e nenhuma explicação.
            tel.addEventListener('blur', function () {
                var digitos = tel.value.replace(/\D/g, '').length;
                var incompleto = !!tel.value && digitos < 10;
                var dica = tel.parentElement.querySelector('.form-dica-telefone');
                if (incompleto && !dica) {
                    dica = document.createElement('p');
                    dica.className = 'form-dica form-dica-erro form-dica-telefone';
                    dica.textContent = 'Telefone incompleto — inclua o DDD.';
                    tel.insertAdjacentElement('afterend', dica);
                } else if (!incompleto && dica) {
                    dica.remove();
                }
            });
        });
    }

    // --- "Quero ser cliente" ---
    aoCarregar(function () {
        var form = document.getElementById('clientForm');
        if (!form) return;
        ligarMascaras(form);

        // Duas etapas. A primeira pede quatro coisas e é a única obrigatória;
        // a segunda ajuda a gente a chegar preparado na conversa, mas quem
        // parar na primeira já vira lead com CNPJ conferido na Receita.
        var etapa1 = form.querySelector('[data-etapa="1"]');
        var etapa2 = form.querySelector('[data-etapa="2"]');
        var proximo = document.getElementById('clientProximo');
        var voltar = document.getElementById('clientVoltar');

        function mostrarEtapa(n) {
            if (!etapa1 || !etapa2) return;
            etapa1.hidden = n !== 1;
            etapa2.hidden = n !== 2;
            var visivel = n === 1 ? etapa1 : etapa2;
            var primeiro = visivel.querySelector('input:not([type=hidden]), select, textarea');
            if (primeiro) primeiro.focus();
        }

        if (proximo) {
            proximo.addEventListener('click', function () {
                var campos = etapa1.querySelectorAll('input, select, textarea');
                for (var i = 0; i < campos.length; i++) {
                    if (!campos[i].checkValidity()) { campos[i].reportValidity(); return; }
                }
                medir('cadastro_etapa1_ok', { formulario: 'quero_ser_cliente' });
                mostrarEtapa(2);
            });
        }
        if (voltar) voltar.addEventListener('click', function () { mostrarEtapa(1); });

        var val = function (campo) {
            return form[campo] && form[campo].value ? String(form[campo].value).trim() : '';
        };

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            if (!form.reportValidity()) return;
            // Honeypot: campo escondido que só um robô preenche. Não há o que
            // proteger no envio (a mensagem só abre o WhatsApp de quem clicou),
            // mas sem isso o robô dispara um formulario_enviado no GA4 e suja a
            // conversão que o Enzo usa para decidir.
            if (form.botcheck && form.botcheck.checked) return;

            var linhas = [
                'Olá! Gostaria de me tornar cliente da Distri Rio.',
                '',
                '*CNPJ:* ' + val('cnpj'),
                '*Responsável:* ' + val('name'),
                '*Telefone:* ' + val('phone')
            ];
            // Tudo daqui para baixo é opcional: só entra na mensagem se a
            // pessoa tiver preenchido a segunda etapa.
            if (val('company')) linhas.splice(2, 0, '*Empresa:* ' + val('company'));
            if (val('segmento')) linhas.push('*Ramo:* ' + val('segmento'));
            if (val('bairro')) linhas.push('*Bairro:* ' + val('bairro'));
            if (val('message')) linhas.push('', val('message'));

            // "formulario_enviado" media o clique, não o lead: o pedido só existe
            // depois que a pessoa aperta enviar dentro do WhatsApp. O nome agora
            // diz o que aconteceu de verdade.
            medir('whatsapp_aberto', {
                formulario: 'quero_ser_cliente',
                ramo: val('segmento') || null,
                bairro: val('bairro') || null,
                completou_etapa2: !etapa2 || !etapa2.hidden
            });
            enviarCopiaPorEmail(form);
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
            // Honeypot: campo escondido que só um robô preenche. Não há o que
            // proteger no envio (a mensagem só abre o WhatsApp de quem clicou),
            // mas sem isso o robô dispara um formulario_enviado no GA4 e suja a
            // conversão que o Enzo usa para decidir.
            if (form.botcheck && form.botcheck.checked) return;
            if (!rotulo || !form.reportValidity()) return;

            var linhas = [
                'Olá! Assunto: ' + rotulo,
                '',
                '*Nome:* ' + form.name.value.trim(),
                '*Telefone:* ' + form.phone.value.trim()
            ];
            if (form.company.value.trim()) linhas.push('*Empresa:* ' + form.company.value.trim());
            linhas.push('', form.message.value.trim());

            medir('whatsapp_aberto', { formulario: 'contato', assunto: assunto.value });
            abrirWhatsApp(form, linhas.join('\n'));
        });
    });
})();
