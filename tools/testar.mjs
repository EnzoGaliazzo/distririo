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
        console.error('Não achei o Chrome. Instale ou aponte: CHROME_PATH=/caminho/do/chrome npm run testar');
        process.exit(2);
    }
    const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'distririo-teste-'));
    const proc = spawn(chrome, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + perfil,
        '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
        '--disable-background-networking', '--disable-component-update', 'about:blank'], { stdio: 'ignore' });
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
    // a partir da décima.
    if (typeof nav.ws.setMaxListeners === 'function') nav.ws.setMaxListeners(0);
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

// ---------------------------------------------------------------- execução
const servidor = await subirServidor();
const nav = await abrirNavegador();
let falhas = 0;
try {
    for (const t of testes) {
        const t0 = Date.now();
        try {
            await t.fn(nav);
            console.log(`  ok   ${t.nome} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
        } catch (e) {
            falhas++;
            console.log(`  FALHOU ${t.nome}\n         ${e.message}`);
        }
    }
} finally {
    await nav.fechar();
    servidor.close();
}
console.log(falhas ? `\n${falhas} de ${testes.length} testes falharam.` : `\n${testes.length} testes passaram.`);
process.exit(falhas ? 1 : 0);
