// Teste de fumaça do site: sobe um servidor estático, abre o Chrome sem
// interface e confere os caminhos que dão dinheiro. Sem dependência nenhuma —
// servidor com o http do Node, navegador pelo protocolo de depuração dele.
//
//     npm run testar
//
// Chrome em outro lugar? CHROME_PATH=/caminho/do/chrome npm run testar
//
// O que ele NÃO faz: não envia formulário de verdade (o de currículo é
// interceptado dentro do navegador) e não acessa nada fora da máquina.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { setMaxListeners } from 'node:events';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTA = 4181;
const TIPOS = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
    '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.avif': 'image/avif',
    '.ico': 'image/x-icon', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- servidor
function subirServidor() {
    const servidor = createServer((req, res) => {
        const limpo = decodeURIComponent(req.url.split('?')[0]);
        let arquivo = path.join(RAIZ, limpo === '/' ? 'index.html' : limpo.replace(/^\/+/, ''));
        if (!arquivo.startsWith(RAIZ)) { res.writeHead(403).end(); return; }
        if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
        if (!fs.existsSync(arquivo)) {
            const erro = path.join(RAIZ, '404.html');
            res.writeHead(404, { 'Content-Type': TIPOS['.html'] }).end(fs.existsSync(erro) ? fs.readFileSync(erro) : 'nao encontrado');
            return;
        }
        res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
        fs.createReadStream(arquivo).pipe(res);
    });
    return new Promise((ok) => servidor.listen(PORTA, '127.0.0.1', () => ok(servidor)));
}

// ---------------------------------------------------------------- navegador
function acharChrome() {
    const candidatos = [
        process.env.CHROME_PATH,
        'C:/Program Files/Google/Chrome/Application/chrome.exe',
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
        '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ].filter(Boolean);
    return candidatos.find(c => fs.existsSync(c));
}

class Navegador {
    constructor(ws, proc, perfil) { this.ws = ws; this.proc = proc; this.perfil = perfil; this.id = 0; this.pend = new Map(); this.eventos = [];
        ws.addEventListener('message', (ev) => {
            const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString());
            if (msg.id && this.pend.has(msg.id)) {
                const { ok, falhou } = this.pend.get(msg.id);
                this.pend.delete(msg.id);
                msg.error ? falhou(new Error(msg.error.message)) : ok(msg.result);
            } else if (msg.method) this.eventos.push(msg);
        });
    }
    envia(metodo, params = {}, sessao) {
        const id = ++this.id;
        this.ws.send(JSON.stringify(sessao ? { id, method: metodo, params, sessionId: sessao } : { id, method: metodo, params }));
        return new Promise((ok, falhou) => this.pend.set(id, { ok, falhou }));
    }
    async fechar() {
        try { await this.envia('Browser.close'); } catch (e) { /* já foi */ }
        await espera(300);
        try { this.proc.kill(); } catch (e) { /* ok */ }
        // O Windows às vezes ainda segura o perfil por um instante; é temporário
        // e o sistema limpa depois, então não vale derrubar o teste por isso.
        try { fs.rmSync(this.perfil, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch (e) { /* ok */ }
    }
}

async function abrirNavegador() {
    const chrome = acharChrome();
    if (!chrome) {
        const aviso = 'Não achei o Chrome. Instale ou aponte: CHROME_PATH=/caminho/do/chrome npm run testar';
        console.error(aviso);
        if (process.env.GITHUB_ACTIONS) console.log(`::error title=Chrome não encontrado::${aviso}`);
        process.exit(2);
    }
    if (typeof WebSocket === 'undefined') {
        const aviso = `Este Node (${process.version}) não tem WebSocket: precisa da versão 22 ou mais nova.`;
        console.error(aviso);
        if (process.env.GITHUB_ACTIONS) console.log(`::error title=Node sem WebSocket::${aviso}`);
        process.exit(2);
    }
    // Abrir o Chrome é a parte frágil numa máquina de CI carregada. Tentar de
    // novo a ABERTURA não esconde teste quebrado: os testes rodam uma vez só.
    let ultimoErro;
    for (let tentativa = 1; tentativa <= 3; tentativa++) {
        try {
            return await abrirChromeUmaVez(chrome);
        } catch (e) {
            ultimoErro = e;
            console.log(`  (abertura do Chrome, tentativa ${tentativa} de 3: ${e.message})`);
            await espera(1000 * tentativa);
        }
    }
    throw new Error('Não consegui abrir o Chrome em 3 tentativas. Último erro: ' + ultimoErro.message);
}

async function abrirChromeUmaVez(chrome) {
    const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'distririo-teste-'));
    const flags = ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + perfil,
        '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
        '--disable-background-networking', '--disable-component-update'];
    // Em servidor de integração o sandbox do Chrome costuma não ter permissão,
    // e /dev/shm é pequeno demais para ele.
    if (process.env.CI) flags.push('--no-sandbox', '--disable-dev-shm-usage');
    const proc = spawn(chrome, [...flags, 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });

    // Guarda o fim do stderr e percebe se o Chrome morreu: sem isso, uma queda
    // na abertura virava só "exit code 1".
    let stderr = '';
    let saiu = null;
    proc.stderr.on('data', (b) => { stderr = (stderr + b.toString()).slice(-800); });
    proc.on('exit', (codigo, sinal) => { saiu = { codigo, sinal }; });
    const matar = () => {
        try { proc.kill(); } catch (e) { /* já foi */ }
        try { fs.rmSync(perfil, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 }); } catch (e) { /* ok */ }
    };

    // Espera o arquivo ter as DUAS linhas (porta e caminho), e não só existir:
    // o Chrome cria o arquivo antes de terminar de escrever nele.
    const arq = path.join(perfil, 'DevToolsActivePort');
    let porta = '', caminho = '';
    for (let i = 0; i < 200; i++) {
        if (saiu) {
            matar();
            throw new Error(`o Chrome fechou na abertura (código ${saiu.codigo}, sinal ${saiu.sinal}). stderr: ${stderr.trim().slice(-300) || '(vazio)'}`);
        }
        if (fs.existsSync(arq)) {
            const [p1, p2] = fs.readFileSync(arq, 'utf8').trim().split(/\r?\n/);
            if (p1 && /^\d+$/.test(p1) && p2) { porta = p1; caminho = p2; break; }
        }
        await espera(100);
    }
    if (!porta) {
        matar();
        throw new Error(`o Chrome não publicou a porta de depuração em 20 s. stderr: ${stderr.trim().slice(-300) || '(vazio)'}`);
    }

    const ws = new WebSocket('ws://127.0.0.1:' + porta + caminho);
    try {
        await new Promise((ok, falhou) => {
            const limite = setTimeout(() => falhou(new Error('a conexão com o Chrome não abriu em 10 s')), 10000);
            ws.addEventListener('open', () => { clearTimeout(limite); ok(); });
            ws.addEventListener('error', () => { clearTimeout(limite); falhou(new Error('a conexão com o Chrome deu erro (porta ' + porta + ')')); });
        });
    } catch (e) {
        matar();
        throw e;
    }
    return new Navegador(ws, proc, perfil);
}

// ---------------------------------------------------------------- aba
async function novaAba(nav, { largura = 1280, altura = 860, celular = false } = {}) {
    const { browserContextId } = await nav.envia('Target.createBrowserContext', { disposeOnDetach: true });
    const { targetId } = await nav.envia('Target.createTarget', { url: 'about:blank', browserContextId });
    const { sessionId } = await nav.envia('Target.attachToTarget', { targetId, flatten: true });
    const aba = { sessionId, targetId, browserContextId, erros: [] };
    aba.cmd = (m, p) => nav.envia(m, p || {}, sessionId);
    // Uma aba por teste, um ouvinte por aba: sem isto o Node avisa de vazamento
    // a partir da décima. O WebSocket global é um EventTarget, que não tem
    // setMaxListeners próprio — quem tira o teto é o módulo events.
    setMaxListeners(0, nav.ws);
    nav.ws.addEventListener('message', (ev) => {
        const msg = JSON.parse(typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString());
        if (msg.sessionId !== sessionId) return;
        if (msg.method === 'Runtime.exceptionThrown') aba.erros.push(msg.params.exceptionDetails.text || 'exceção');
        if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
            aba.erros.push(msg.params.args.map(a => a.value ?? a.description ?? '').join(' ').slice(0, 200));
        }
    });
    await aba.cmd('Page.enable');
    await aba.cmd('Runtime.enable');
    await aba.cmd('Emulation.setDeviceMetricsOverride', { width: largura, height: altura, deviceScaleFactor: 1, mobile: celular });
    return aba;
}

async function ir(aba, caminho) {
    await aba.cmd('Page.navigate', { url: `http://127.0.0.1:${PORTA}${caminho}` });
    for (let i = 0; i < 100; i++) {
        const pronto = await avaliar(aba, 'document.readyState === "complete"').catch(() => false);
        if (pronto) break;
        await espera(100);
    }
    await espera(500);
}

async function avaliar(aba, expressao) {
    const r = await aba.cmd('Runtime.evaluate', { expression: expressao, awaitPromise: true, returnByValue: true, userGesture: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
}

// ---------------------------------------------------------------- testes
const testes = [];
const teste = (nome, fn) => testes.push({ nome, fn });

teste('home abre sem erro no console e sem rolagem lateral no celular', async (nav) => {
    const aba = await novaAba(nav, { largura: 375, altura: 812, celular: true });
    await ir(aba, '/');
    const r = await avaliar(aba, `({ titulo: document.title, rolagem: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        cta: !!document.querySelector('.header-cta'), slides: document.querySelectorAll('.hero-carousel img').length })`);
    if (!r.titulo.includes('Distri Rio')) throw new Error('título inesperado: ' + r.titulo);
    if (r.rolagem) throw new Error('a home rola de lado em 375 px');
    if (!r.cta) throw new Error('sumiu o botão "Quero ser cliente" do cabeçalho');
    if (r.slides < 2) throw new Error('carrossel com menos de 2 banners');
    if (aba.erros.length) throw new Error('console com erro: ' + aba.erros[0]);
});

teste('banner do topo leva para o catálogo e só o visível é clicável', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/');
    const r = await avaliar(aba, `(() => { const l = [...document.querySelectorAll('.hero-slide')];
        return { total: l.length, comLink: l.filter(a => (a.getAttribute('href') || '').length > 3).length,
                 clicaveis: l.filter(a => getComputedStyle(a).pointerEvents !== 'none').length }; })()`);
    if (r.total < 2 || r.comLink !== r.total) throw new Error('banner sem link: ' + JSON.stringify(r));
    if (r.clicaveis !== 1) throw new Error('mais de um banner clicável ao mesmo tempo: ' + r.clicaveis);
});

teste('busca da loja escapa HTML e mostra o estado de nada encontrado', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    await avaliar(aba, `(() => { const i = document.querySelector('.header-search input'); i.value = '<img src=x onerror=alert(1)>';
        i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await espera(900);
    const r = await avaliar(aba, `({ injetou: !!document.querySelector('img[src="x"]'),
        status: (document.getElementById('searchStatus') || {}).textContent || '',
        semResultado: !(document.getElementById('noResults') || {}).hidden })`);
    if (r.injetou) throw new Error('a busca injetou HTML na página');
    if (!r.semResultado) throw new Error('não apareceu o estado de "nenhum produto"');
    if (!r.status.includes('Nenhum produto')) throw new Error('aviso de busca sem texto');
});

teste('funil: cada seção mostra só os tipos e as marcas dela, e as contagens batem com a grade', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    const r = await avaliar(aba, `(() => {
        const visiveis = () => document.querySelectorAll('.product-card:not([hidden])').length;
        const soma = (sel) => [...document.querySelectorAll(sel)].filter((b) => !b.hidden)
            .reduce((n, b) => n + Number(b.querySelector('.funil-n-valor').textContent), 0);
        const total = visiveis();
        const erros = [];
        const secoes = [...document.querySelectorAll('.funil-opcao[data-secao]')];
        let somaSecoes = 0;
        secoes.forEach((b) => {
            const id = b.getAttribute('data-secao');
            const n = Number(b.querySelector('.funil-n-valor').textContent);
            somaSecoes += n;
            b.click();
            const v = visiveis();
            if (v !== n) erros.push(id + ': a opção dizia ' + n + ' e a grade mostrou ' + v);
            if (b.getAttribute('aria-pressed') !== 'true') erros.push(id + ': não ficou marcada');
            if (secoes.some((o) => o !== b && !o.hidden)) erros.push(id + ': outras seções continuaram à vista');
            if (document.querySelector('.funil-tipo').hidden) erros.push(id + ': a etapa de tipo não apareceu');
            const tiposForaDaSecao = [...document.querySelectorAll('.funil-opcao[data-tipo]')]
                .filter((t) => !t.hidden && t.getAttribute('data-secao-do-tipo') !== id);
            if (tiposForaDaSecao.length) erros.push(id + ': apareceu tipo de outra seção');
            if (soma('.funil-opcao[data-tipo]') !== v) erros.push(id + ': soma dos tipos ' + soma('.funil-opcao[data-tipo]') + ' ≠ ' + v);
            if (soma('.funil-opcao[data-marca]') !== v) erros.push(id + ': soma das marcas ' + soma('.funil-opcao[data-marca]') + ' ≠ ' + v);
            const cartaoDeFora = [...document.querySelectorAll('.product-card:not([hidden])')].find((c) => c.getAttribute('data-secao') !== id);
            if (cartaoDeFora) erros.push(id + ': ficou na tela ' + cartaoDeFora.getAttribute('data-name'));
            b.click();
            if (visiveis() !== total) erros.push(id + ': desmarcar não devolveu o catálogo');
        });
        if (somaSecoes !== total) erros.push('as seções somam ' + somaSecoes + ' e o catálogo tem ' + total);
        return { erros, total };
    })()`);
    if (r.erros.length) throw new Error(r.erros.slice(0, 3).join(' | '));
    if (aba.erros.length) throw new Error('console com erro: ' + aba.erros[0]);
});

teste('funil vai para o endereço, volta ao abrir o link e o limpar desfaz', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    await avaliar(aba, `(() => { document.querySelector('.funil-opcao[data-secao="bebidas"]').click();
        document.querySelector('.funil-opcao[data-tipo="sucos"]').click();
        document.querySelector('.funil-opcao[data-marca="Maratá"]').click(); })()`);
    await espera(400);
    const url = await avaliar(aba, 'location.search');
    for (const trecho of ['secao=bebidas', 'tipo=sucos', 'marca=Marat']) {
        if (!url.includes(trecho)) throw new Error('faltou ' + trecho + ' no endereço: ' + url);
    }
    const aba2 = await novaAba(nav);
    await ir(aba2, '/loja.html' + url);
    await espera(700);
    const r = await avaliar(aba2, `(() => {
        const marcado = (sel) => document.querySelector(sel).getAttribute('aria-pressed') === 'true';
        return { secao: marcado('.funil-opcao[data-secao="bebidas"]'), tipo: marcado('.funil-opcao[data-tipo="sucos"]'),
                 marca: marcado('.funil-opcao[data-marca="Maratá"]'),
                 nomes: [...document.querySelectorAll('.product-card:not([hidden])')].map((c) => c.getAttribute('data-name')),
                 total: document.getElementById('filtrosTotal').textContent,
                 falado: document.getElementById('searchStatus').textContent };
    })()`);
    if (!r.secao || !r.tipo || !r.marca) throw new Error('o link não restaurou o funil: ' + JSON.stringify(r));
    if (!r.nomes.length || r.nomes.some((n) => !/Néctar Maratá/.test(n))) throw new Error('o link filtrou errado: ' + r.nomes.join(', '));
    if (r.total !== String(r.nomes.length)) throw new Error('o número do topo não bate: ' + r.total);
    if (!/Sucos e néctares/.test(r.falado)) throw new Error('o aviso falado não descreve o filtro: ' + r.falado);

    const v = await avaliar(aba2, `(() => { document.getElementById('limparFiltros').click();
        return { visiveis: document.querySelectorAll('.product-card:not([hidden])').length,
                 total: document.querySelectorAll('.product-card').length, endereco: location.search,
                 tipoEscondido: document.querySelector('.funil-tipo').hidden }; })()`);
    if (v.visiveis !== v.total || v.endereco || !v.tipoEscondido) throw new Error('o limpar não desfez o funil: ' + JSON.stringify(v));
    if (aba2.erros.length) throw new Error('console com erro: ' + aba2.erros[0]);
});

teste('links da home e o endereço antigo (?cat=) abrem a loja já no funil, sem a página pular no celular', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/');
    const hrefs = await avaliar(aba, `[...document.querySelectorAll('.service-item[href*="loja.html"]')].map((a) => a.getAttribute('href'))`);
    if (!hrefs.length || hrefs.some((h) => !/[?&]secao=/.test(h))) throw new Error('cartão da home fora do funil: ' + hrefs.join(', '));

    for (const [caminho, esperado] of [['/loja.html?secao=doces', { secao: 'doces' }], ['/loja.html?cat=lauton', { marca: 'Lauton' }],
                                       ['/loja.html?tipo=sucos', { secao: 'bebidas', tipo: 'sucos' }]]) {
        const cel = await novaAba(nav, { largura: 375, altura: 812, celular: true });
        await cel.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cls = 0;
            new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; }))
                .observe({ type: 'layout-shift', buffered: true });` });
        await ir(cel, caminho);
        await espera(900);
        const r = await avaliar(cel, `(() => {
            const marcado = (atr, v) => { const b = document.querySelector('.funil-opcao[' + atr + '="' + v + '"]'); return !!b && b.getAttribute('aria-pressed') === 'true'; };
            const fora = (atr, v) => [...document.querySelectorAll('.product-card:not([hidden])')].some((c) => c.getAttribute(atr) !== v);
            return { cls: window.__cls, ${Object.entries(esperado).map(([k, v]) => `${k}: marcado('data-${k}', ${JSON.stringify(v)}) && !fora('data-${k}', ${JSON.stringify(v)})`).join(', ')} };
        })()`);
        for (const k of Object.keys(esperado)) {
            if (!r[k]) throw new Error(caminho + ': ' + k + ' não ficou aplicado');
        }
        if (r.cls > 0.02) throw new Error(caminho + ': a página pulou ao abrir (CLS ' + r.cls.toFixed(3) + ')');
        if (cel.erros.length) throw new Error(caminho + ': console com erro: ' + cel.erros[0]);
    }
});

teste('ordem alfabética junta o catálogo numa grade só e o limpar desfaz', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html?ordem=az');
    const r = await avaliar(aba, `(() => { const g = [...document.querySelectorAll('#gradeOrdenada .product-card')];
        const nomes = g.map(c => c.getAttribute('data-name'));
        const ordenado = nomes.slice().sort((a, b) => a.localeCompare(b, 'pt', { sensitivity: 'base' }));
        return { naGrade: g.length, total: document.querySelectorAll('.product-card').length,
                 emOrdem: JSON.stringify(nomes) === JSON.stringify(ordenado),
                 secoesVisiveis: document.querySelectorAll('.category-section:not(.catalogo-ordenado):not([hidden])').length,
                 caixaVisivel: !document.getElementById('catalogoOrdenado').hidden,
                 primeiroCatalogo: (document.querySelector('.category-section:not(.catalogo-ordenado) .product-card') || {}).id }; })()`);
    if (r.naGrade !== r.total) throw new Error('nem todo cartão foi para a grade: ' + JSON.stringify(r));
    if (!r.emOrdem) throw new Error('a grade não saiu em ordem alfabética');
    if (!r.caixaVisivel || r.secoesVisiveis !== 0) throw new Error('as seções por linha continuaram na tela: ' + JSON.stringify(r));

    // O "Limpar filtros" devolve cada cartão para a seção de onde saiu.
    const nomesOriginais = await avaliar(aba, `(() => { document.getElementById('limparFiltros').click();
        return [...document.querySelectorAll('.category-section:not(.catalogo-ordenado) .product-card')].slice(0, 3).map(c => c.getAttribute('data-name')); })()`);
    await espera(400);
    const v = await avaliar(aba, `({ naGrade: document.querySelectorAll('#gradeOrdenada .product-card').length,
        caixaVisivel: !document.getElementById('catalogoOrdenado').hidden,
        visiveis: document.querySelectorAll('.product-card:not([hidden])').length,
        endereco: location.search })`);
    if (v.naGrade !== 0 || v.caixaVisivel) throw new Error('a grade alfabética não saiu de cena: ' + JSON.stringify(v));
    if (v.visiveis !== r.total) throw new Error('sumiu produto ao voltar para a ordem do catálogo: ' + JSON.stringify(v));
    if (v.endereco.includes('ordem=')) throw new Error('a ordem ficou presa no endereço: ' + v.endereco);
    if (nomesOriginais.length !== 3) throw new Error('catálogo voltou vazio');
    if (aba.erros.length) throw new Error('console com erro: ' + aba.erros[0]);
});

teste('"pular para os resultados" leva o foco para o catálogo', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    const r = await avaliar(aba, `(() => { const a = document.querySelector('.filtros-pular');
        if (!a) return { falta: true };
        a.focus();
        const cx = a.getBoundingClientRect();
        a.click();
        return { destino: a.getAttribute('href'), visivelComFoco: cx.width > 20 && cx.height > 10,
                 focado: document.activeElement ? document.activeElement.id : '' }; })()`);
    if (r.falta) throw new Error('o link de pular sumiu do painel de filtros');
    if (r.destino !== '#resultados') throw new Error('o link aponta para ' + r.destino);
    if (!r.visivelComFoco) throw new Error('o link não aparece quando recebe o foco');
    if (r.focado !== 'resultados') throw new Error('o foco não foi para os resultados: ' + r.focado);
});

// Nada sai da máquina: Web3Forms e BrasilAPI respondem dentro da página e o
// window.open só anota o endereço do WhatsApp.
const FALSOS_PEDIDO = `(() => {
    const real = window.fetch;
    window.__enviado = null;
    window.fetch = function (url, opc) {
        const u = String(url);
        if (u.includes('web3forms')) {
            const d = {};
            if (opc && opc.body && opc.body.forEach) opc.body.forEach((v, k) => { d[k] = String(v); });
            window.__enviado = d;
            return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
        }
        if (u.includes('brasilapi')) {
            return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ razao_social: 'MERCADINHO TESTE LTDA', descricao_situacao_cadastral: 'ATIVA' }) });
        }
        return real.apply(this, arguments);
    };
    window.__aberto = null;
    window.open = function (url) { window.__aberto = String(url); return {}; };
})()`;

// Preenche e envia o formulário do pedido (a lista já tem de estar montada).
const ENVIAR_PEDIDO = `(() => {
    document.getElementById('listaFlutuante').click();
    document.getElementById('listaContinuar').click();
    const f = document.getElementById('pedidoForm');
    if (!document.getElementById('pedidoCampos').hidden) {
        f.cnpj.value = '11222333000181'; f.cnpj.dispatchEvent(new Event('input', { bubbles: true }));
        f.name.value = 'Joana Teste';
        f.phone.value = '21992111843'; f.phone.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.getElementById('pedidoEnviar').click();
    return { aberto: window.__aberto ? decodeURIComponent(window.__aberto.split('text=')[1] || '') : '', enviado: window.__enviado };
})()`;

teste('lista de pedido soma item e leva ao formulário do pedido', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    await avaliar(aba, `document.querySelector('[data-add]').click()`);
    await espera(400);
    await avaliar(aba, `document.getElementById('listaFlutuante').click()`);
    await espera(400);
    const r = await avaliar(aba, `(() => { const c = document.getElementById('listaContinuar');
        const antes = { contador: document.getElementById('listaContador').textContent, itens: document.querySelectorAll('.lista-item').length,
                        continuar: !!c && !c.hidden, linkDireto: !!document.querySelector('#listaPainel a[href*="wa.me"]:not([hidden])') };
        c.click();
        return { ...antes, formulario: !document.getElementById('pedidoForm').hidden, foco: document.activeElement.id }; })()`);
    if (r.contador !== '1' || r.itens !== 1) throw new Error('lista não registrou o item: ' + JSON.stringify(r));
    if (!r.continuar) throw new Error('sumiu o "Continuar para o pedido"');
    if (r.linkDireto) throw new Error('a lista ainda tem link direto para o WhatsApp, sem passar pelo formulário');
    if (!r.formulario || r.foco !== 'pedidoCnpj') throw new Error('o formulário do pedido não abriu no CNPJ: ' + JSON.stringify(r));
});

teste('busca sem resultado oferece o "avise-me" e manda o termo junto', async (nav) => {
    const aba = await novaAba(nav);
    // O envio é capturado dentro da página: nenhum teste sai da máquina.
    await aba.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
        const real = window.fetch;
        window.__enviado = null;
        window.fetch = function (url, opc) {
            if (String(url).includes('web3forms')) {
                const d = {};
                if (opc && opc.body && opc.body.forEach) opc.body.forEach((v, k) => { d[k] = String(v); });
                window.__enviado = d;
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
            }
            return real.apply(this, arguments);
        };
    })()` });
    await ir(aba, '/loja.html');
    if (!await avaliar(aba, `document.getElementById('aviseMe').hidden`)) throw new Error('o avise-me apareceu antes de qualquer busca');

    await avaliar(aba, `(() => { const i = document.querySelector('.header-search input');
        i.value = 'guarana jesus lata'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await espera(900);
    if (await avaliar(aba, `document.getElementById('aviseMe').hidden`)) throw new Error('o avise-me não apareceu na busca sem resultado');

    // Telefone sem DDD não sai do lugar.
    const curto = await avaliar(aba, `(() => { const f = document.getElementById('aviseMe');
        f.telefone.value = '9211'; f.telefone.dispatchEvent(new Event('input', { bubbles: true }));
        f.consentimento.checked = true;
        f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return { aviso: f.querySelector('.avise-me-aviso').textContent, enviado: !!window.__enviado }; })()`);
    if (curto.enviado) throw new Error('telefone curto foi enviado');
    if (!curto.aviso) throw new Error('telefone curto passou sem aviso nenhum');

    const r = await avaliar(aba, `(() => { const f = document.getElementById('aviseMe');
        f.telefone.value = '21992111843'; f.telefone.dispatchEvent(new Event('input', { bubbles: true }));
        const mascarado = f.telefone.value;
        f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        return { mascarado, enviado: window.__enviado,
                 pronto: document.querySelector('.avise-me-pronto').textContent,
                 camposEscondidos: document.querySelector('.avise-me-campos').hidden }; })()`);
    if (r.mascarado !== '(21) 99211-1843') throw new Error('máscara do telefone: ' + r.mascarado);
    if (!r.enviado) throw new Error('o pedido não foi enviado');
    if (r.enviado.procurou !== 'guarana jesus lata') throw new Error('foi sem o termo procurado: ' + JSON.stringify(r.enviado));
    if (r.enviado.consentimento !== 'sim') throw new Error('foi sem o consentimento marcado');
    if (!r.camposEscondidos || !/Anotado/.test(r.pronto)) throw new Error('não confirmou para quem pediu: ' + JSON.stringify(r));

    // Outro termo sem resultado traz o formulário de volta: pode ser mais de um produto.
    await avaliar(aba, `(() => { const i = document.querySelector('.header-search input');
        i.value = 'cerveja artesanal'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await espera(900);
    const v = await avaliar(aba, `({ campos: !document.querySelector('.avise-me-campos').hidden,
        pronto: document.querySelector('.avise-me-pronto').hidden,
        telefone: document.getElementById('aviseMeTelefone').value })`);
    if (!v.campos || !v.pronto) throw new Error('o formulário não voltou para o termo novo: ' + JSON.stringify(v));
    if (!v.telefone) throw new Error('fez a pessoa digitar o telefone de novo');
    if (aba.erros.length) throw new Error('console com erro: ' + aba.erros[0]);
});

teste('quantidade digitada na lista entra no total e na mensagem do pedido', async (nav) => {
    const aba = await novaAba(nav);
    await aba.cmd('Page.addScriptToEvaluateOnNewDocument', { source: FALSOS_PEDIDO });
    await ir(aba, '/loja.html');
    await avaliar(aba, `document.querySelector('[data-add]').click()`);
    await espera(300);
    await avaliar(aba, `document.getElementById('listaFlutuante').click()`);
    await espera(300);
    const r = await avaliar(aba, `(() => { const c = document.querySelector('input.lista-qtd-valor');
        c.value = '12'; c.dispatchEvent(new Event('change', { bubbles: true }));
        return { contador: document.getElementById('listaContador').textContent,
                 campo: document.querySelector('input.lista-qtd-valor').value }; })()`);
    if (r.contador !== '12' || r.campo !== '12') throw new Error('a quantidade digitada não valeu: ' + JSON.stringify(r));

    // Quantidade sem sentido volta para o que estava.
    const v = await avaliar(aba, `(() => { const c = document.querySelector('input.lista-qtd-valor');
        c.value = '0'; c.dispatchEvent(new Event('change', { bubbles: true }));
        return document.querySelector('input.lista-qtd-valor').value; })()`);
    if (v !== '12') throw new Error('quantidade zero passou: ' + v);

    await avaliar(aba, `document.querySelector('.lista-fechar').click()`);
    const envio = await avaliar(aba, ENVIAR_PEDIDO);
    if (!/•\s*12x /.test(envio.aberto)) throw new Error('a mensagem não levou a quantidade: ' + envio.aberto);
    if (!envio.enviado || !/^12x /.test(envio.enviado.itens)) throw new Error('a cópia por e-mail não levou a quantidade: ' + JSON.stringify(envio.enviado));
});

teste('pedido passa pelo formulário: barra CNPJ inválido, manda cópia completa, abre o WhatsApp e lembra o cliente', async (nav) => {
    const aba = await novaAba(nav);
    await aba.cmd('Page.addScriptToEvaluateOnNewDocument', { source: FALSOS_PEDIDO });
    await ir(aba, '/loja.html');
    await avaliar(aba, `(() => { const b = [...document.querySelectorAll('[data-add]')]; b[0].click(); b[0].click(); b[3].click(); })()`);
    await espera(300);

    // CNPJ que não fecha os dígitos: nada sai.
    const barrado = await avaliar(aba, `(() => {
        document.getElementById('listaFlutuante').click();
        document.getElementById('listaContinuar').click();
        const f = document.getElementById('pedidoForm');
        f.cnpj.value = '11.111.111/1111-11'; f.cnpj.dispatchEvent(new Event('input', { bubbles: true }));
        f.name.value = 'Joana Teste';
        f.phone.value = '21992111843'; f.phone.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('pedidoEnviar').click();
        return { abriu: !!window.__aberto, enviou: !!window.__enviado, aindaNoFormulario: !f.hidden };
    })()`);
    if (barrado.abriu || barrado.enviou || !barrado.aindaNoFormulario) throw new Error('CNPJ inválido passou: ' + JSON.stringify(barrado));
    await avaliar(aba, `document.querySelector('.lista-fechar').click()`);

    const r = await avaliar(aba, ENVIAR_PEDIDO);
    await espera(300);
    const depois = await avaliar(aba, `({
        codigo: document.getElementById('pedidoCodigo').textContent,
        pronto: !document.querySelector('[data-etapa="enviado"]').hidden,
        copia: document.getElementById('pedidoCopia').textContent,
        zap: document.getElementById('pedidoZap').getAttribute('href') || '',
        lista: JSON.parse(localStorage.getItem('dr-lista-pedido') || '[]').length,
        historico: JSON.parse(localStorage.getItem('dr-pedidos-enviados') || '[]'),
        cliente: JSON.parse(localStorage.getItem('dr-cliente-pedido') || 'null') })`);
    if (!/^DR-\d{4}-\d{2}$/.test(depois.codigo) || !depois.pronto) throw new Error('não mostrou o pedido pronto com código: ' + JSON.stringify(depois));
    for (const trecho of [depois.codigo, '11.222.333/0001-81', 'Joana Teste', '(21) 99211-1843', '2x ']) {
        if (!r.aberto.includes(trecho)) throw new Error('a mensagem do WhatsApp saiu sem "' + trecho + '": ' + r.aberto);
    }
    if (!r.enviado || r.enviado.pedido !== depois.codigo || r.enviado.cnpj !== '11.222.333/0001-81'
        || r.enviado.total_de_itens !== '2' || r.enviado.itens.split('\n').length !== 2) {
        throw new Error('a cópia por e-mail saiu incompleta: ' + JSON.stringify(r.enviado));
    }
    if (!r.enviado.access_key || r.enviado.botcheck) throw new Error('a cópia saiu sem chave ou com o honeypot marcado');
    if (!/registrada/.test(depois.copia)) throw new Error('não confirmou a cópia: ' + depois.copia);
    if (!depois.zap.includes('wa.me') || !depois.zap.includes('text=')) throw new Error('sem link de reserva para o WhatsApp');
    if (depois.lista !== 0) throw new Error('a lista não esvaziou depois do pedido');
    if (depois.historico.length !== 1 || depois.historico[0].codigo !== depois.codigo) throw new Error('o pedido não entrou no histórico');
    if (!depois.cliente || depois.cliente.cnpj !== '11.222.333/0001-81' || depois.cliente.observacao !== undefined) {
        throw new Error('o cliente não foi lembrado (ou levou a observação junto): ' + JSON.stringify(depois.cliente));
    }

    // Repetir o pedido e mandar de novo: os dados vêm lembrados.
    const v = await avaliar(aba, `(() => {
        document.getElementById('pedidoNovo').click();
        const b = document.querySelector('.lista-repetir');
        if (!b) return { falta: true };
        b.click();
        const itens = document.querySelectorAll('.lista-item').length;
        document.getElementById('listaContinuar').click();
        return { itens, cartao: !document.getElementById('pedidoQuem').hidden, campos: document.getElementById('pedidoCampos').hidden,
                 empresa: document.getElementById('pedidoQuemEmpresa').textContent, foco: document.activeElement.id };
    })()`);
    if (v.falta) throw new Error('não apareceu o botão de repetir pedido');
    if (v.itens !== 2) throw new Error('o repetir não devolveu a lista: ' + JSON.stringify(v));
    if (!v.cartao || !v.campos || v.foco !== 'pedidoEnviar') throw new Error('o segundo pedido não veio com o cliente lembrado: ' + JSON.stringify(v));
    if (aba.erros.length) throw new Error('console com erro: ' + aba.erros[0]);
});

teste('botão de mandar copia o link quando o aparelho não tem menu de compartilhar', async (nav) => {
    const aba = await novaAba(nav);
    // Sem Web Share o caminho é a área de transferência; aqui ela é de mentira
    // para o teste não depender de permissão do sistema.
    await aba.cmd('Page.addScriptToEvaluateOnNewDocument', { source: `delete Navigator.prototype.share; delete navigator.share;
        window.__copiado = null;
        Object.defineProperty(navigator, 'clipboard', { configurable: true,
            value: { writeText: (t) => { window.__copiado = t; return Promise.resolve(); } } });` });
    await ir(aba, '/produto/bis-10.html');
    const r = await avaliar(aba, `(() => { const b = document.querySelector('[data-compartilhar]');
        if (!b) return { falta: true };
        b.click();
        return { url: b.getAttribute('data-url'), origem: b.getAttribute('data-origem') }; })()`);
    if (r.falta) throw new Error('a página de produto não tem botão de mandar');
    await espera(400);
    const v = await avaliar(aba, `({ copiado: window.__copiado, rotulo: document.querySelector('.btn-compartilhar-rotulo').textContent })`);
    if (!v.copiado || !v.copiado.includes(r.url)) throw new Error('não copiou o endereço da página: ' + JSON.stringify(v));
    if (!/copiado/i.test(v.rotulo)) throw new Error('o botão não avisou que copiou: ' + v.rotulo);
});

teste('faixa de ofertas na home segue o que está escrito em data/ofertas.json', async (nav) => {
    const arq = path.join(RAIZ, 'data', 'ofertas.json');
    const ofertas = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : { produtos: [] };
    const esperados = (ofertas.produtos || []).length;
    const aba = await novaAba(nav);
    await ir(aba, '/');
    const r = await avaliar(aba, `({ existe: !!document.querySelector('.section-ofertas'),
        cartoes: document.querySelectorAll('.section-ofertas .product-card').length,
        marcador: document.documentElement.innerHTML.includes('ofertas:inicio') })`);
    if (!r.marcador) throw new Error('sumiu o marcador da faixa de ofertas da home');
    if (esperados === 0 && r.existe) throw new Error('faixa de ofertas no ar com data/ofertas.json vazio');
    if (esperados > 0 && r.cartoes !== esperados) throw new Error(`ofertas escritas: ${esperados}, na home: ${r.cartoes}`);
});

// Contraste é a regra que mais silenciosamente quebra: ninguém vê um texto
// cinza sobre cinza até alguém reclamar. Mede o que o navegador realmente
// pinta, nos dois temas, nas superfícies que mudam de cor entre eles.
const SONDA_CONTRASTE = `(() => {
  const nums = (c) => (c.match(/[0-9.]+/g) || []).map(Number);
  const lum = (c) => {
    const [r, g, b] = nums(c).slice(0, 3).map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  // Sobe até achar um fundo opaco. Quem não achar (faixa com foto atrás) fica
  // de fora: ali o fundo é imagem e a conta pediria amostragem de pixel.
  const fundoDe = (el) => {
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      const v = nums(bg);
      if (bg && bg !== 'transparent' && v.length >= 3 && v[3] !== 0) return bg;
      n = n.parentElement;
    }
    return null;
  };
  const razao = (a, b) => { const l = [lum(a), lum(b)].sort((x, y) => y - x); return (l[0] + 0.05) / (l[1] + 0.05); };
  const alvos = ['.footer a', '.footer p', '.header-info span', '.header-cta', '.header-nav a',
                 '.marquee-item', '.hero-sub', '.hero-nota', '.section-lead', '.stat-label',
                 '.product-card p', '.category-count', '.migalhas a', '.form-consent span'];
  const ruins = [];
  let medidos = 0;
  for (const sel of alvos) {
    for (const el of [...document.querySelectorAll(sel)].slice(0, 2)) {
      if (!el.textContent.trim() || !el.getClientRects().length) continue;
      const fundo = fundoDe(el);
      if (!fundo) continue;
      const cs = getComputedStyle(el);
      // Texto semitransparente sobre fundo que a sonda não enxerga daria número
      // falso; fica de fora, como a faixa do armazém.
      if (nums(cs.color)[3] !== undefined && nums(cs.color)[3] < 1) continue;
      const px = parseFloat(cs.fontSize);
      const minimo = (px >= 24 || (px >= 18.66 && Number(cs.fontWeight) >= 700)) ? 3 : 4.5;
      const r = razao(cs.color, fundo);
      medidos++;
      if (r < minimo) ruins.push(sel + ' ' + Math.round(px) + 'px ' + (Math.round(r * 100) / 100) + ':1 (minimo ' + minimo + ')');
    }
  }
  return { medidos, ruins };
})()`;

// O site é sempre claro, por decisão do dono. Com o sistema no tema escuro ele
// tem de continuar claro e legível — e se alguém religar um tema escuro por
// engano, este teste reprova antes de chegar ao ar.
teste('site continua claro e com contraste AA mesmo com o sistema no escuro', async (nav) => {
    for (const tema of ['light', 'dark']) {
        for (const pag of ['/', '/loja.html', '/quero-ser-cliente.html']) {
            const aba = await novaAba(nav);
            await aba.cmd('Emulation.setEmulatedMedia', {
                features: [{ name: 'prefers-color-scheme', value: tema }],
            });
            await ir(aba, pag);
            const fundo = await avaliar(aba, `(() => {
                const c = (getComputedStyle(document.body).backgroundColor.match(/[0-9.]+/g) || []).map(Number);
                return (c[0] + c[1] + c[2]) / 3;
            })()`);
            if (fundo < 200) throw new Error(`${pag} com o sistema ${tema === 'dark' ? 'escuro' : 'claro'}: o fundo da página escureceu (média ${Math.round(fundo)}). O site é sempre claro.`);
            const r = await avaliar(aba, SONDA_CONTRASTE);
            if (r.medidos < 4) throw new Error(`${pag} ${tema}: só ${r.medidos} elementos medidos — a sonda perdeu o alvo`);
            if (r.ruins.length) throw new Error(`${pag} ${tema}: ` + r.ruins.join(' | '));
        }
    }
});

teste('com a faixa de cookies na tela, "Minha lista" e WhatsApp continuam tocáveis', async (nav) => {
    // .click() por código ignora o que está por cima; um dedo não. Então a
    // pergunta é ao navegador: o que está no ponto exato do toque?
    for (const [rotulo, perfil] of [['celular', { largura: 375, altura: 812, celular: true }], ['desktop', {}]]) {
        const aba = await novaAba(nav, perfil);
        await ir(aba, '/loja.html');
        await avaliar(aba, `document.querySelector('[data-add]').click()`);
        await avaliar(aba, `window.scrollTo(0, 900)`);   // rolar faz a faixa aparecer
        await espera(1300);
        const r = await avaliar(aba, `(() => {
            const faixa = document.querySelector('.cookie-banner');
            const noPonto = (el) => {
                if (!el) return 'ausente';
                const b = el.getBoundingClientRect();
                const alvo = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
                return alvo === el || el.contains(alvo) ? 'livre' : 'coberto por ' + (alvo ? (alvo.className || alvo.tagName) : 'nada');
            };
            return { faixa: !!faixa, lista: noPonto(document.getElementById('listaFlutuante')),
                     zap: noPonto(document.getElementById('whatsappFloat')) };
        })()`);
        if (!r.faixa) throw new Error(`${rotulo}: a faixa de cookies não apareceu depois de rolar — o teste não mediu nada`);
        if (r.lista !== 'livre') throw new Error(`${rotulo}: "Minha lista" ${r.lista}`);
        if (r.zap !== 'livre') throw new Error(`${rotulo}: WhatsApp ${r.zap}`);
    }
});

// Rola até `destino` (expressão), `passo` px por quadro, sem a rolagem suave do
// CSS no caminho. O destino é limitado ao fim da página para não girar à toa.
const rolarAos = (destino, passo = 40) => `new Promise((ok) => {
    const alvo = Math.max(0, Math.min(${destino}, document.documentElement.scrollHeight - innerHeight));
    const anda = () => {
        const falta = alvo - scrollY;
        if (Math.abs(falta) <= ${passo}) { scrollTo({ top: alvo, behavior: 'instant' }); setTimeout(ok, 150); return; }
        scrollTo({ top: scrollY + Math.sign(falta) * ${passo}, behavior: 'instant' });
        requestAnimationFrame(anda);
    };
    requestAnimationFrame(anda);
})`;

// Nada preso: nenhum bloco descarregado acima da tela ou na metade de cima
// dela, nenhuma troca sem transição pela metade, nenhum estado duplo.
const BLOCOS_PRESOS = `(() => {
    const erros = [];
    if (document.querySelector('.sem-transicao')) erros.push('sobrou .sem-transicao na página');
    document.querySelectorAll('.section.reveal').forEach((s) => {
        const r = s.getBoundingClientRect();
        const nome = ((s.querySelector('h2') || {}).textContent || s.className).trim().slice(0, 40);
        const carregado = s.classList.contains('is-visible');
        if (carregado && s.classList.contains('descarregado')) erros.push(nome + ': carregado e descarregado ao mesmo tempo');
        if (!carregado && r.bottom <= 0) erros.push(nome + ': acima da tela e descarregado');
        if (!carregado && r.bottom > 0 && r.top < innerHeight * 0.5) erros.push(nome + ': descarregado no meio da tela');
    });
    return erros;
})()`;

teste('subindo, o bloco que sai por baixo descarrega; descendo, carrega de novo e nada fica preso', async (nav) => {
    for (const movimento of ['no-preference', 'reduce']) {
        const aba = await novaAba(nav);
        await aba.cmd('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: movimento }] });
        await ir(aba, '/sobre.html');
        await avaliar(aba, `(() => {
            window.__trocas = { carrega: 0, descarrega: 0 };
            new MutationObserver((ms) => ms.forEach((m) => {
                if (!m.target.classList.contains('reveal')) return;
                const antes = (m.oldValue || '').split(/\\s+/).includes('is-visible');
                const agora = m.target.classList.contains('is-visible');
                if (antes !== agora) __trocas[agora ? 'carrega' : 'descarrega']++;
            })).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });
        })()`);
        for (const [rotulo, destino] of [['descendo', 'document.documentElement.scrollHeight'], ['subindo', '0'], ['descendo de novo', 'document.documentElement.scrollHeight']]) {
            await avaliar(aba, rolarAos(destino));
            await espera(900);
            const erros = await avaliar(aba, BLOCOS_PRESOS);
            if (erros.length) throw new Error(`${movimento === 'reduce' ? '(movimento reduzido) ' : ''}${rotulo}: ${erros[0]}`);
            if (rotulo === 'subindo') {
                const d = await avaliar(aba, '__trocas.descarrega');
                if (movimento === 'reduce' && d) throw new Error(`com movimento reduzido, subir descarregou ${d} bloco(s)`);
                if (movimento !== 'reduce' && !d) throw new Error('subir a página inteira não descarregou nenhum bloco');
            }
        }
        if (aba.erros.length) throw new Error('console com erro: ' + aba.erros[0]);
    }
});

teste('grade da marca com mais produtos aparece no celular, mesmo alta demais para "10% à vista"', async (nav) => {
    const dir = path.join(RAIZ, 'marca');
    const [maior] = fs.readdirSync(dir).filter((f) => f.endsWith('.html'))
        .map((f) => [f, fs.statSync(path.join(dir, f)).size]).sort((a, b) => b[1] - a[1])[0];
    const aba = await novaAba(nav, { largura: 375, altura: 812, celular: true });
    await ir(aba, '/marca/' + maior);
    await avaliar(aba, rolarAos('1600'));
    await espera(900);
    const r = await avaliar(aba, `(() => {
        const s = document.querySelector('.product-card').closest('.section');
        return { alt: Math.round(s.getBoundingClientRect().height), visivel: s.classList.contains('is-visible'), op: getComputedStyle(s).opacity };
    })()`);
    if (!r.visivel || r.op !== '1') throw new Error(`a grade de ${r.alt}px de marca/${maior} ficou invisível (opacidade ${r.op})`);
});

teste('cadastro barra CNPJ inválido e telefone sem DDD', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/quero-ser-cliente.html');
    const r = await avaliar(aba, `(() => { const f = document.getElementById('clientForm');
        f.cnpj.value = '11.111.111/1111-11'; f.cnpj.dispatchEvent(new Event('input', { bubbles: true })); f.cnpj.dispatchEvent(new Event('blur'));
        f.phone.value = '2199'; f.phone.dispatchEvent(new Event('input', { bubbles: true })); f.phone.dispatchEvent(new Event('blur'));
        return { cnpj: f.cnpj.validationMessage, telefone: f.phone.validationMessage, dica: !!f.querySelector('.form-dica-telefone') }; })()`);
    if (!r.cnpj) throw new Error('CNPJ inválido passou');
    if (!r.telefone) throw new Error('telefone sem DDD passou');
    if (!r.dica) throw new Error('telefone incompleto não avisou embaixo do campo');
});

teste('faixa de cookies não aparece de cara, aparece ao rolar e a recusa vale', async (nav) => {
    const aba = await novaAba(nav, { largura: 375, altura: 812, celular: true });
    await ir(aba, '/');
    const inicio = await avaliar(aba, `({ faixa: !!document.querySelector('.cookie-banner'), ga: !!window.DR_GA_CARREGADO })`);
    if (inicio.faixa) throw new Error('a faixa de cookies cobriu a primeira tela');
    if (inicio.ga) throw new Error('o Analytics carregou antes do aceite');
    await avaliar(aba, `window.scrollTo(0, 400); window.dispatchEvent(new Event('scroll'))`);
    await espera(600);
    const depois = await avaliar(aba, `(() => { const b = document.querySelector('.cookie-banner'); if (!b) return { apareceu: false };
        const bot = [...b.querySelectorAll('button')].map(x => ({ t: x.textContent.trim(), h: Math.round(x.getBoundingClientRect().height) }));
        b.querySelector('.cookie-recusar').click();
        return { apareceu: true, botoes: bot, escolha: localStorage.getItem('dr-consentimento-medicao'), ga: !!window.DR_GA_CARREGADO }; })()`);
    if (!depois.apareceu) throw new Error('a faixa de cookies não apareceu ao rolar');
    if (depois.escolha !== 'nao' || depois.ga) throw new Error('recusar não desligou a medição');
    if (depois.botoes.some(b => b.h < 44)) throw new Error('botão de cookie menor que 44 px: ' + JSON.stringify(depois.botoes));
});

teste('página de produto tem foto, ficha e os dois caminhos de pedido', async (nav) => {
    const aba = await novaAba(nav);
    const id = JSON.parse(fs.readFileSync(path.join(RAIZ, 'data', 'produtos.json'), 'utf8')).produtos.find(p => p.img).id;
    await ir(aba, '/produto/' + id + '.html');
    const r = await avaliar(aba, `({ h1: !!document.querySelector('h1'), foto: !!document.querySelector('.produto-foto img'),
        lista: !!document.querySelector('[data-add]'), zap: !!document.querySelector('a[href*="wa.me"]'),
        jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => JSON.parse(s.textContent)['@type']) })`);
    for (const [chave, valor] of Object.entries(r)) {
        if (chave !== 'jsonld' && !valor) throw new Error('faltou na página de produto: ' + chave);
    }
    if (!r.jsonld.includes('Product')) throw new Error('página de produto sem dado estruturado');
});

teste('endereço antigo de produto redireciona em vez de dar erro', async (nav) => {
    const redir = path.join(RAIZ, 'data', 'redirecionamentos.json');
    if (!fs.existsSync(redir)) return;
    const [antigo, novo] = Object.entries(JSON.parse(fs.readFileSync(redir, 'utf8')))[0];
    const aba = await novaAba(nav);
    await ir(aba, '/produto/' + antigo + '.html');
    await espera(800);
    const url = await avaliar(aba, 'location.pathname');
    const esperado = novo.includes('/') || novo.endsWith('.html') ? '/' + novo : '/produto/' + novo + '.html';
    if (url !== esperado) throw new Error(`redirecionamento de ${antigo} foi para ${url}, esperava ${esperado}`);
});

// ------------------------------------------------------------- relatório CI
// O GitHub exige login para ver log de Actions, mas anotação sai pela API sem
// conta nenhuma. Então toda falha vira anotação, e o resumo vai para a aba
// Summary da execução.
const noGitHub = !!process.env.GITHUB_ACTIONS;

function anotar(titulo, mensagem) {
    if (!noGitHub) return;
    const limpo = String(mensagem).replace(/\r?\n/g, '%0A').replace(/::/g, ':︓');
    console.log(`::error title=${String(titulo).replace(/[\r\n]/g, ' ')}::${limpo}`);
}

function resumir(linhas) {
    const arquivo = process.env.GITHUB_STEP_SUMMARY;
    if (!arquivo) return;
    try { fs.appendFileSync(arquivo, linhas.join('\n') + '\n'); } catch (e) { /* summary é bônus */ }
}

// ---------------------------------------------------------------- execução
// Qualquer queda fora do laço dos testes (servidor, abertura do Chrome) vira
// anotação com o motivo — foi a falta disto que deixou duas reprovações do CI
// sem explicação.
process.on('unhandledRejection', (e) => {
    const msg = e && e.message ? e.message : String(e);
    console.error('Erro não tratado:', msg);
    anotar('Teste de fumaça: erro fora dos testes', msg);
    process.exit(1);
});

let servidor, nav;
try {
    servidor = await subirServidor();
    nav = await abrirNavegador();
} catch (e) {
    console.error('Não deu para começar os testes: ' + e.message);
    anotar('Teste de fumaça: não deu para começar', e.message);
    resumir([`### Testes de fumaça — não começaram`, '', `\`${e.message}\``]);
    if (servidor) servidor.close();
    process.exit(1);
}
let falhas = 0;
const resultados = ['| | Teste | Motivo |', '|---|---|---|'];
try {
    for (const t of testes) {
        const t0 = Date.now();
        try {
            await t.fn(nav);
            console.log(`  ok   ${t.nome} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
        } catch (e) {
            falhas++;
            console.log(`  FALHOU ${t.nome}\n         ${e.message}`);
            anotar(`Teste de fumaça: ${t.nome}`, e.message);
            resultados.push(`| ❌ | ${t.nome} | ${String(e.message).slice(0, 300).replace(/\|/g, '/')} |`);
            continue;
        }
        resultados.push(`| ✅ | ${t.nome} | |`);
    }
} finally {
    await nav.fechar();
    servidor.close();
}
console.log(falhas ? `\n${falhas} de ${testes.length} testes falharam.` : `\n${testes.length} testes passaram.`);
resumir([
    `### Testes de fumaça — ${falhas ? `${falhas} de ${testes.length} falharam` : `${testes.length} passaram`}`,
    '',
    `Chrome: \`${acharChrome() || '(não achei)'}\` · Node ${process.version}`,
    '',
    ...resultados,
]);
process.exit(falhas ? 1 : 0);
