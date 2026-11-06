(() => {
    'use strict';

    const raiz = document.documentElement;
    const configuracao = window.portfolioConfiguracao || {};
    const sistema = window.matchMedia('(prefers-color-scheme: dark)');
    const reduzirMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
    const botaoTema = document.getElementById('botao-tema');
    const iconeTema = document.getElementById('icone-tema');

    let temaManual = false;

    if (window.lucide?.createIcons) {
        window.lucide.createIcons();
    }

    try {
        temaManual = ['light', 'dark'].includes(
            localStorage.getItem('portfolio-tema')
        );
    } catch {
        // O tema funciona sem armazenamento disponível.
    }

    function atualizarTema() {
        const escuro = raiz.dataset.theme === 'dark';

        botaoTema.setAttribute('aria-pressed', String(escuro));
        botaoTema.setAttribute(
            'aria-label',
            escuro ? 'Ativar tema claro' : 'Ativar tema escuro'
        );

        const desenho = window.lucide?.icons[escuro ? 'Sun' : 'Moon'];

        if (desenho) {
            iconeTema.replaceChildren(
                window.lucide.createElement(desenho, {
                    class: 'icone',
                    'aria-hidden': 'true',
                    focusable: 'false'
                })
            );
        }
    }

    atualizarTema();

    botaoTema.addEventListener('click', () => {
        temaManual = true;

        raiz.dataset.theme = raiz.dataset.theme === 'dark'
            ? 'light'
            : 'dark';

        atualizarTema();

        try {
            localStorage.setItem('portfolio-tema', raiz.dataset.theme);
        } catch {
            // A preferência permanece válida durante esta visita.
        }
    });

    sistema.addEventListener('change', evento => {
        if (temaManual) {
            return;
        }

        raiz.dataset.theme = evento.matches ? 'dark' : 'light';
        atualizarTema();
    });

    window.addEventListener('storage', evento => {
        if (evento.key !== 'portfolio-tema' && evento.key !== null) {
            return;
        }

        const valor = ({
            claro: 'light',
            escuro: 'dark'
        })[evento.newValue] || evento.newValue;

        temaManual = ['light', 'dark'].includes(valor);

        raiz.dataset.theme = temaManual
            ? valor
            : (sistema.matches ? 'dark' : 'light');

        atualizarTema();
    });

    function enderecoSeguro(valor, arquivoLocal = false) {
        if (typeof valor !== 'string' || !valor.trim()) {
            return null;
        }

        try {
            const url = new URL(valor.trim(), location.href);

            if (url.username || url.password) {
                return null;
            }

            if (/^https:\/\//i.test(valor.trim()) && url.protocol === 'https:') {
                return url.href;
            }

            if (
                arquivoLocal &&
                !valor.trim().startsWith('//') &&
                url.origin === location.origin &&
                ['http:', 'https:', 'file:'].includes(url.protocol)
            ) {
                return url.href;
            }
        } catch {
            return null;
        }

        return null;
    }

    document.querySelectorAll('[data-link]').forEach(link => {
        const chave = link.dataset.link;
        let url;

        if (chave === 'email') {
            const email = String(configuracao.email || '').trim();

            url = /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)
                ? `mailto:${email}`
                : null;
        } else {
            url = enderecoSeguro(
                configuracao[chave],
                chave === 'curriculo'
            );

            if (url && chave === 'linkedin') {
                const host = new URL(url).hostname;

                if (host !== 'linkedin.com' && !host.endsWith('.linkedin.com')) {
                    url = null;
                }
            }
        }

        if (!url) {
            return;
        }

        link.href = url;
        link.hidden = false;

        if (chave !== 'email') {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.setAttribute(
                'aria-label',
                `${link.textContent.trim()}: abre em nova aba`
            );
        }

        document.querySelectorAll(`[data-pendente="${chave}"]`).forEach(elemento => {
            elemento.hidden = true;
        });
    });

    const publico = enderecoSeguro(configuracao.urlPublica);

    if (publico) {
        const basePublica = `${publico.replace(/\/$/, '')}/`;
        const base = location.pathname.endsWith('/competencias.html')
            ? new URL('competencias.html', basePublica).href
            : basePublica;

        const canonical = document.createElement('link');
        canonical.rel = 'canonical';
        canonical.href = base;
        document.head.append(canonical);

        const metadados = [
            ['og:url', base],
            ['og:image', new URL('imagens/foto-perfil.jpeg', base).href]
        ];

        for (const [propriedade, conteudo] of metadados) {
            const meta = document.createElement('meta');
            meta.setAttribute('property', propriedade);
            meta.content = conteudo;
            document.head.append(meta);
        }
    }

    const cabecalho = document.querySelector('.cabecalho');

    function medirCabecalho() {
        const altura = Math.ceil(cabecalho.getBoundingClientRect().height);
        raiz.style.setProperty('--altura-menu', `${altura}px`);
    }

    medirCabecalho();

    if ('ResizeObserver' in window) {
        new ResizeObserver(medirCabecalho).observe(cabecalho);
    } else {
        window.addEventListener('resize', medirCabecalho);
    }

    const links = [...document.querySelectorAll('.item-menu')];
    const baseMenu = document.querySelector('.menu-base');
    const indicador = document.getElementById('indicador-menu');

    function moverIndicador() {
        const ativo = links.find(link => link.hasAttribute('aria-current'));

        if (!ativo || !baseMenu || !indicador) {
            return;
        }

        const base = baseMenu.getBoundingClientRect();
        const item = ativo.getBoundingClientRect();
        const recuo = parseFloat(getComputedStyle(indicador).left) || 0;

        indicador.style.width = `${item.width}px`;
        indicador.style.transform = `translateX(${item.left - base.left - recuo}px)`;
        baseMenu.classList.add('menu-pronto');
    }

    const secoes = links
        .map(link => document.getElementById(link.hash.slice(1)))
        .filter(Boolean);

    let quadro = null;

    function atualizarNavegacao() {
        quadro = null;

        if (secoes.length) {
            const limite = cabecalho.getBoundingClientRect().height + 100;
            let atual = secoes[0];

            secoes.forEach(secao => {
                if (secao.getBoundingClientRect().top <= limite) {
                    atual = secao;
                }
            });

            if (
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 4
            ) {
                atual = secoes[secoes.length - 1];
            }

            links.forEach(link => {
                if (link.hash === `#${atual.id}`) {
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }

        moverIndicador();
    }

    function agendarNavegacao() {
        if (quadro === null) {
            quadro = requestAnimationFrame(atualizarNavegacao);
        }
    }

    window.addEventListener('scroll', agendarNavegacao, { passive: true });
    window.addEventListener('resize', agendarNavegacao);

    if ('ResizeObserver' in window && baseMenu) {
        const observadorMenu = new ResizeObserver(moverIndicador);
        observadorMenu.observe(baseMenu);
        links.forEach(link => observadorMenu.observe(link));
    }

    document.fonts?.ready.then(moverIndicador);
    atualizarNavegacao();

    const competencias = document.getElementById('competencias');
    const pausar = document.getElementById('pausar-barras');

    if (competencias && pausar) {
        let efeitosPausados = false;

        function atualizarMovimento() {
            competencias.classList.toggle(
                'barras-pausadas',
                efeitosPausados || reduzirMovimento.matches
            );

            pausar.hidden = reduzirMovimento.matches;
            pausar.setAttribute('aria-pressed', String(efeitosPausados));
            pausar.textContent = efeitosPausados
                ? 'Retomar efeitos das barras'
                : 'Pausar efeitos das barras';
        }

        pausar.addEventListener('click', () => {
            efeitosPausados = !efeitosPausados;
            atualizarMovimento();
        });

        reduzirMovimento.addEventListener('change', atualizarMovimento);
        atualizarMovimento();

        if ('IntersectionObserver' in window && !reduzirMovimento.matches) {
            competencias.classList.add('aguardando');

            const observador = new IntersectionObserver(entradas => {
                if (!entradas.some(entrada => entrada.isIntersecting)) {
                    return;
                }

                competencias.classList.remove('aguardando');
                observador.disconnect();
            }, {
                threshold: 0.1
            });

            observador.observe(competencias);
        }
    }

    const janela = document.getElementById('visualizador');
    const iframe = document.getElementById('iframe-previa');
    const imagem = document.getElementById('imagem-ampliada');
    const titulo = document.getElementById('titulo-visualizador');
    const estado = document.getElementById('estado-visualizador');
    const externo = document.getElementById('abrir-externo');
    const fechar = document.getElementById('fechar-visualizador');

    if (janela) {
        let origem = null;
        let temporizador = null;
        let cliqueNoFundo = false;

        function limparTemporizador() {
            clearTimeout(temporizador);
            temporizador = null;
        }

        function terminarCarregamento() {
            if (!janela.open) {
                return;
            }

            limparTemporizador();
            estado.hidden = true;
        }

        iframe.addEventListener('load', () => {
            if (iframe.hasAttribute('src')) {
                terminarCarregamento();
            }
        });

        imagem.addEventListener('load', terminarCarregamento);

        function falhaCarregamento() {
            if (!janela.open) {
                return;
            }

            limparTemporizador();
            estado.hidden = false;
            estado.textContent = 'Não foi possível carregar a visualização. Utilize a opção de abrir em nova aba.';
        }

        iframe.addEventListener('error', falhaCarregamento);
        imagem.addEventListener('error', falhaCarregamento);

        document.querySelectorAll('[data-previa]').forEach(botao => {
            botao.addEventListener('click', () => {
                const foto = botao.dataset.previa === 'foto';
                const laboratorio = botao.dataset.previa === 'laboratorio';

                const url = foto
                    ? document.getElementById('foto-perfil').src
                    : enderecoSeguro(
                        laboratorio
                            ? configuracao.laboratorioJavaScript
                            : botao.dataset.url
                    );

                if (!url) {
                    return;
                }

                if (typeof janela.showModal !== 'function') {
                    window.open(url, '_blank', 'noopener,noreferrer');
                    return;
                }

                if (janela.open) {
                    return;
                }

                origem = botao;

                titulo.textContent = foto
                    ? 'Helder Neiva'
                    : (laboratorio ? 'Laboratório JavaScript' : botao.dataset.titulo);

                externo.href = url;
                externo.textContent = foto
                    ? 'Abrir imagem em nova aba ↗'
                    : 'Abrir em nova aba ↗';

                estado.textContent = 'Carregando…';
                estado.hidden = false;

                iframe.hidden = foto;
                imagem.hidden = !foto;

                janela.showModal();
                raiz.classList.add('janela-aberta');

                if (foto) {
                    imagem.src = url;
                } else {
                    iframe.title = `Prévia de ${titulo.textContent}`;
                    iframe.src = url;
                }

                fechar.focus({ preventScroll: true });
                limparTemporizador();

                temporizador = setTimeout(() => {
                    if (janela.open) {
                        estado.textContent = 'A visualização pode demorar. Você também pode abrir em nova aba.';
                    }
                }, 12000);
            });
        });

        fechar.addEventListener('click', () => {
            janela.close();
        });

        janela.addEventListener('close', () => {
            limparTemporizador();
            raiz.classList.remove('janela-aberta');

            iframe.removeAttribute('src');
            imagem.removeAttribute('src');

            iframe.hidden = true;
            imagem.hidden = true;
            estado.hidden = true;

            if (origem?.isConnected) {
                origem.focus({ preventScroll: true });
            }

            origem = null;
            cliqueNoFundo = false;
        });

        function foraDaJanela(evento) {
            const limites = janela.getBoundingClientRect();

            return (
                evento.clientX < limites.left ||
                evento.clientX > limites.right ||
                evento.clientY < limites.top ||
                evento.clientY > limites.bottom
            );
        }

        janela.addEventListener('pointerdown', evento => {
            cliqueNoFundo = evento.target === janela && foraDaJanela(evento);
        });

        janela.addEventListener('click', evento => {
            if (cliqueNoFundo && evento.target === janela && foraDaJanela(evento)) {
                janela.close();
            }

            cliqueNoFundo = false;
        });
    }

    document.getElementById('ano').textContent = String(new Date().getFullYear());
})();