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
    const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'distririo-teste-'));
    const flags = ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + perfil,
        '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
        '--disable-background-networking', '--disable-component-update'];
    // Em servidor de integração o sandbox do Chrome costuma não ter permissão,
    // e /dev/shm é pequeno demais para ele.
    if (process.env.CI) flags.push('--no-sandbox', '--disable-dev-shm-usage');
    const proc = spawn(chrome, [...flags, 'about:blank'], { stdio: 'ignore' });
    const arq = path.join(perfil, 'DevToolsActivePort');
    for (let i = 0; i < 150 && !fs.existsSync(arq); i++) await espera(100);
    await espera(200);
    const [porta, caminho] = fs.readFileSync(arq, 'utf8').trim().split(/\r?\n/);
    const ws = new WebSocket('ws://127.0.0.1:' + porta + caminho);
    await new Promise((ok, falhou) => { ws.addEventListener('open', ok); ws.addEventListener('error', falhou); });
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

teste('filtro de marca muda a contagem da loja', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    const r = await avaliar(aba, `(() => { const s = document.getElementById('filtroMarca');
        const antes = document.querySelectorAll('.product-card:not([hidden])').length;
        const op = [...s.options].find(o => o.value && o.value.length > 2);
        s.value = op.value; s.dispatchEvent(new Event('change', { bubbles: true }));
        return { antes, depois: document.querySelectorAll('.product-card:not([hidden])').length, marca: op.value }; })()`);
    if (!(r.depois > 0 && r.depois < r.antes)) throw new Error('filtro não filtrou: ' + JSON.stringify(r));
});

teste('filtro vai para o endereço e volta ao abrir o link', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    const marca = await avaliar(aba, `(() => { const s = document.getElementById('filtroMarca');
        const op = [...s.options].find(o => o.value && o.value.length > 2);
        s.value = op.value; s.dispatchEvent(new Event('change', { bubbles: true })); return op.value; })()`);
    await espera(700);
    const url = await avaliar(aba, 'location.search');
    if (!url.includes('marca=')) throw new Error('filtro não foi para o endereço: ' + url);
    const aba2 = await novaAba(nav);
    await ir(aba2, '/loja.html' + url);
    await espera(900);
    const r = await avaliar(aba2, `({ marca: document.getElementById('filtroMarca').value,
        visiveis: document.querySelectorAll('.product-card:not([hidden])').length,
        total: document.querySelectorAll('.product-card').length })`);
    if (r.marca !== marca) throw new Error('o link não restaurou o filtro');
    if (!(r.visiveis > 0 && r.visiveis < r.total)) throw new Error('o link não filtrou: ' + JSON.stringify(r));
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

teste('lista de pedido soma item e monta a mensagem do WhatsApp', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    await avaliar(aba, `document.querySelector('[data-add]').click()`);
    await espera(400);
    await avaliar(aba, `document.getElementById('listaFlutuante').click()`);
    await espera(400);
    const r = await avaliar(aba, `({ contador: document.getElementById('listaContador').textContent,
        itens: document.querySelectorAll('.lista-item').length,
        zap: (document.getElementById('listaEnviar') || {}).href || '' })`);
    if (r.contador !== '1' || r.itens !== 1) throw new Error('lista não registrou o item: ' + JSON.stringify(r));
    if (!r.zap.includes('wa.me') || !r.zap.includes('text=')) throw new Error('link do WhatsApp sem mensagem');
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

teste('quantidade digitada na lista entra no total e na mensagem', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    await avaliar(aba, `document.querySelector('[data-add]').click()`);
    await espera(300);
    await avaliar(aba, `document.getElementById('listaFlutuante').click()`);
    await espera(300);
    const r = await avaliar(aba, `(() => { const c = document.querySelector('input.lista-qtd-valor');
        c.value = '12'; c.dispatchEvent(new Event('change', { bubbles: true }));
        return { contador: document.getElementById('listaContador').textContent,
                 campo: document.querySelector('input.lista-qtd-valor').value,
                 msg: decodeURIComponent((document.getElementById('listaEnviar').href.split('text=')[1] || '')) }; })()`);
    if (r.contador !== '12' || r.campo !== '12') throw new Error('a quantidade digitada não valeu: ' + JSON.stringify(r));
    if (!/•\s*12x /.test(r.msg)) throw new Error('a mensagem não levou a quantidade: ' + r.msg);

    // Quantidade sem sentido volta para o que estava.
    const v = await avaliar(aba, `(() => { const c = document.querySelector('input.lista-qtd-valor');
        c.value = '0'; c.dispatchEvent(new Event('change', { bubbles: true }));
        return document.querySelector('input.lista-qtd-valor').value; })()`);
    if (v !== '12') throw new Error('quantidade zero passou: ' + v);
});

teste('pedido enviado ganha código e volta no "repetir"', async (nav) => {
    const aba = await novaAba(nav);
    await ir(aba, '/loja.html');
    // O clique no "Enviar" abriria o WhatsApp: aqui ele só não navega.
    await avaliar(aba, `document.addEventListener('click', e => { if (e.target.closest('#listaEnviar')) e.preventDefault(); }, true)`);
    await avaliar(aba, `document.querySelector('[data-add]').click()`);
    await espera(300);
    await avaliar(aba, `document.getElementById('listaFlutuante').click()`);
    await espera(300);
    const r = await avaliar(aba, `(() => { document.getElementById('listaEnviar').click();
        const msg = decodeURIComponent((document.getElementById('listaEnviar').href.split('text=')[1] || ''));
        return { msg, historico: JSON.parse(localStorage.getItem('dr-pedidos-enviados') || '[]') }; })()`);
    if (!/DR-\d{4}-\d{2}/.test(r.msg)) throw new Error('a mensagem saiu sem código de pedido: ' + r.msg);
    if (r.historico.length !== 1 || !r.historico[0].codigo) throw new Error('o pedido não entrou no histórico: ' + JSON.stringify(r.historico));

    // Esvazia a lista e repete o pedido guardado.
    const v = await avaliar(aba, `(() => { document.getElementById('listaLimpar').click();
        document.getElementById('listaFlutuante').click();
        const b = document.querySelector('.lista-repetir');
        if (!b) return { falta: true };
        b.click();
        return { itens: document.querySelectorAll('.lista-item').length,
                 contador: document.getElementById('listaContador').textContent }; })()`);
    if (v.falta) throw new Error('não apareceu o botão de repetir pedido');
    if (v.itens !== 1 || v.contador !== '1') throw new Error('o repetir não devolveu a lista: ' + JSON.stringify(v));
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
const servidor = await subirServidor();
const nav = await abrirNavegador();
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
