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
        // O tema funciona sem armazenamento.
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
        raiz.dataset.theme = raiz.dataset.theme === 'dark' ? 'light' : 'dark';

        atualizarTema();

        try {
            localStorage.setItem('portfolio-tema', raiz.dataset.theme);
        } catch {
            // Preferência aplicada nesta página.
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

            if (
                /^https:\/\//i.test(valor.trim()) &&
                url.protocol === 'https:'
            ) {
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

                if (
                    host !== 'linkedin.com' &&
                    !host.endsWith('.linkedin.com')
                ) {
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

        document.querySelectorAll(
            `[data-pendente="${chave}"]`
        ).forEach(elemento => {
            elemento.hidden = true;
        });
    });

    const cabecalho = document.querySelector('.cabecalho');

    function medirCabecalho() {
        const altura = Math.ceil(
            cabecalho.getBoundingClientRect().height
        );

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
        const ativo = links.find(link => {
            return link.hasAttribute('aria-current');
        });

        if (!ativo || !baseMenu || !indicador) {
            return;
        }

        const rotulo = document.getElementById('secao-menu');

        if (rotulo) {
            rotulo.textContent = ativo.getAttribute('aria-label') || '';
        }

        const base = baseMenu.getBoundingClientRect();
        const item = ativo.getBoundingClientRect();
        const recuo = parseFloat(getComputedStyle(indicador).left) || 0;

        indicador.style.width = `${item.width}px`;
        indicador.style.transform =
            `translateX(${item.left - base.left - recuo}px)`;

        baseMenu.classList.add('menu-pronto');
    }

    document.querySelectorAll(
        '.item-menu, .rede-icone'
    ).forEach(elemento => {
        elemento.addEventListener('keydown', evento => {
            if (evento.key === 'Escape') {
                elemento.classList.add('dica-fechada');
            }
        });

        elemento.addEventListener('pointerleave', () => {
            elemento.classList.remove('dica-fechada');
        });

        elemento.addEventListener('blur', () => {
            elemento.classList.remove('dica-fechada');
        });
    });

    const secoes = links
        .map(link => document.getElementById(link.hash.slice(1)))
        .filter(Boolean);

    let quadro = null;
    let secaoEmTransicao = null;
    let animacaoRolagem = null;

    function marcarSecao(atual) {
        links.forEach(link => {
            if (link.hash === `#${atual.id}`) {
                link.setAttribute('aria-current', 'location');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        moverIndicador();
    }

    function atualizarNavegacao() {
        quadro = null;

        if (secaoEmTransicao) {
            marcarSecao(secaoEmTransicao);
            return;
        }

        if (secoes.length) {
            const alturaMenu = cabecalho.getBoundingClientRect().height;

            let atual = secoes[0];
            let maiorAreaVisivel = 0;

            secoes.forEach(secao => {
                const retangulo = secao.getBoundingClientRect();

                const areaVisivel = Math.max(
                    0,
                    Math.min(retangulo.bottom, window.innerHeight) -
                    Math.max(retangulo.top, alturaMenu)
                );

                if (areaVisivel > maiorAreaVisivel) {
                    maiorAreaVisivel = areaVisivel;
                    atual = secao;
                }
            });

            if (
                window.innerHeight + window.scrollY >=
                document.documentElement.scrollHeight - 4
            ) {
                atual = secoes[secoes.length - 1];
            }

            marcarSecao(atual);
        }

        moverIndicador();
    }

    function agendarNavegacao() {
        if (quadro === null) {
            quadro = requestAnimationFrame(atualizarNavegacao);
        }
    }

    function deslocamentoParaSecao(alvo) {
        const alturaCabecalho = cabecalho.getBoundingClientRect().height;
        const estilo = getComputedStyle(alvo);

        const painel = alvo.matches(
            '.sobre, .formacao, .contato, .projeto-destaque'
        );

        const recuo = painel
            ? 0
            : (parseFloat(estilo.paddingTop) || 0) +
              (parseFloat(estilo.borderTopWidth) || 0);

        return (
            alvo.getBoundingClientRect().top +
            recuo -
            alturaCabecalho -
            16
        );
    }

    function cancelarRolagem() {
        cancelAnimationFrame(animacaoRolagem);
        animacaoRolagem = null;
        secaoEmTransicao = null;
        agendarNavegacao();
    }

    function posicionarSecao(alvo, suave = true) {
        cancelarRolagem();

        const inicio = window.scrollY;
        const limite = Math.max(
            0,
            raiz.scrollHeight - window.innerHeight
        );

        const destino = Math.max(
            0,
            Math.min(inicio + deslocamentoParaSecao(alvo), limite)
        );

        const distancia = destino - inicio;
        const duracao = suave && !reduzirMovimento.matches ? 480 : 0;
        const instanteInicial = performance.now();

        secaoEmTransicao = secoes.includes(alvo) ? alvo : null;

        if (secaoEmTransicao) {
            marcarSecao(secaoEmTransicao);
        }

        function rolar(instante) {
            const progresso = duracao
                ? Math.min(1, (instante - instanteInicial) / duracao)
                : 1;

            const suavidade = 1 - Math.pow(1 - progresso, 3);

            window.scrollTo({
                top: inicio + distancia * suavidade,
                behavior: 'instant'
            });

            if (progresso < 1) {
                animacaoRolagem = requestAnimationFrame(rolar);
                return;
            }

            const ajuste = deslocamentoParaSecao(alvo);

            const fim = Math.max(
                0,
                Math.min(
                    window.scrollY + ajuste,
                    Math.max(0, raiz.scrollHeight - window.innerHeight)
                )
            );

            window.scrollTo({
                top: fim,
                behavior: 'instant'
            });

            animacaoRolagem = null;
            secaoEmTransicao = null;
            agendarNavegacao();
        }

        animacaoRolagem = requestAnimationFrame(rolar);
    }

    function alvoDoHash(hash) {
        try {
            return hash.length > 1
                ? document.getElementById(
                    decodeURIComponent(hash.slice(1))
                )
                : null;
        } catch {
            return null;
        }
    }

    document.addEventListener('click', evento => {
        if (
            evento.defaultPrevented ||
            evento.button !== 0 ||
            evento.ctrlKey ||
            evento.metaKey ||
            evento.shiftKey ||
            evento.altKey
        ) {
            return;
        }

        const link = evento.target.closest('a[href]');

        if (
            !link ||
            link.hasAttribute('download') ||
            (link.target && link.target !== '_self')
        ) {
            return;
        }

        const url = new URL(link.href, location.href);

        if (
            url.origin !== location.origin ||
            url.pathname !== location.pathname ||
            url.search !== location.search
        ) {
            return;
        }

        const alvo = alvoDoHash(url.hash);

        if (!alvo) {
            return;
        }

        evento.preventDefault();

        if (location.hash !== url.hash) {
            history.pushState(null, '', url.hash);
        }

        if (!alvo.hasAttribute('tabindex')) {
            alvo.setAttribute('tabindex', '-1');
        }

        alvo.focus({ preventScroll: true });
        posicionarSecao(alvo);
    });

    window.addEventListener(
        'scroll',
        agendarNavegacao,
        { passive: true }
    );

    window.addEventListener(
        'wheel',
        cancelarRolagem,
        { passive: true }
    );

    window.addEventListener(
        'touchstart',
        cancelarRolagem,
        { passive: true }
    );

    window.addEventListener('keydown', evento => {
        const teclas = [
            'ArrowDown',
            'ArrowUp',
            'PageDown',
            'PageUp',
            'Home',
            'End',
            ' '
        ];

        if (teclas.includes(evento.key)) {
            cancelarRolagem();
        }
    });

    function alinharHash() {
        const alvo = alvoDoHash(location.hash);

        if (alvo) {
            posicionarSecao(alvo, false);
        }
    }

    window.addEventListener('hashchange', () => {
        requestAnimationFrame(alinharHash);
    });

    window.addEventListener('resize', agendarNavegacao);

    if ('ResizeObserver' in window && baseMenu) {
        const observadorMenu = new ResizeObserver(moverIndicador);

        observadorMenu.observe(baseMenu);

        links.forEach(link => {
            observadorMenu.observe(link);
        });
    }

    Promise.resolve(document.fonts?.ready).then(() => {
        moverIndicador();
        requestAnimationFrame(alinharHash);
    });

    atualizarNavegacao();

    const competencias = document.getElementById('competencias');
    const pausar = document.getElementById('pausar-animacoes');
    const gradeCompetencias = competencias?.querySelector('.grade-competencias');

    const cartoes = [
        ...(gradeCompetencias?.querySelectorAll('.competencia') || [])
    ];

    const iconesTecnologias = {
        html: 'CodeXml',
        css: 'Palette',
        javascript: 'Braces',
        php: 'Server',
        'node-sql': 'Database',
        git: 'GitBranch'
    };

    cartoes.forEach(cartao => {
        const desenho = window.lucide?.icons[
            iconesTecnologias[cartao.dataset.tecnologia]
        ];

        const icone = cartao.querySelector(
            '.competencia-titulo > .icone'
        );

        if (desenho && icone) {
            const moldura = document.createElement('span');

            moldura.className = 'competencia-icone';
            moldura.setAttribute('aria-hidden', 'true');

            moldura.append(
                window.lucide.createElement(desenho, {
                    class: 'icone',
                    'aria-hidden': 'true',
                    focusable: 'false'
                })
            );

            icone.replaceWith(moldura);
        }

        const seta = cartao.querySelector('.ver-projetos > span');

        if (seta && window.lucide?.icons.ExternalLink) {
            seta.replaceWith(
                window.lucide.createElement(
                    window.lucide.icons.ExternalLink,
                    {
                        class: 'icone',
                        'aria-hidden': 'true',
                        focusable: 'false'
                    }
                )
            );
        }
    });

    const botoesMovimento = [pausar].filter(Boolean);
    const formacao = document.getElementById('formacao');
    const entradasVisuais = [...cartoes, formacao].filter(Boolean);

    const efeitosVisuais = [
        ...entradasVisuais,
        ...document.querySelectorAll('.capa-laboratorio')
    ];

    const chaveMovimento = 'portfolio-animacoes-pausadas';
    const visibilidadeCartoes = new Map();

    let efeitosPausados = false;

    try {
        efeitosPausados = localStorage.getItem(chaveMovimento) === 'true';
    } catch {
        // A pausa funciona sem armazenamento.
    }

    function atualizarBarra(cartao, visivel) {
        const ativo = visivel && !document.hidden;
        const semEfeitos = efeitosPausados || reduzirMovimento.matches;

        cartao.classList.toggle(
            'barra-reiniciada',
            !ativo && !semEfeitos
        );

        cartao.classList.toggle('efeitos-fora', !ativo);
    }

    function restaurarBarras() {
        cartoes.forEach(cartao => {
            const retangulo = cartao.getBoundingClientRect();

            const visivel =
                retangulo.bottom > cabecalho.getBoundingClientRect().bottom &&
                retangulo.top < window.innerHeight;

            visibilidadeCartoes.set(cartao, visivel);
            atualizarBarra(cartao, visivel);
        });
    }

    function atualizarMovimento() {
        const pausado = efeitosPausados || reduzirMovimento.matches;

        raiz.classList.toggle('animacoes-pausadas', pausado);

        cartoes.forEach(cartao => {
            atualizarBarra(
                cartao,
                visibilidadeCartoes.get(cartao) || false
            );
        });

        if (pausado) {
            entradasVisuais.forEach(elemento => {
                elemento.classList.remove('entrada-pendente');
            });
        }

        botoesMovimento.forEach(botao => {
            botao.hidden = reduzirMovimento.matches;
            botao.setAttribute('aria-pressed', String(efeitosPausados));

            botao.textContent = efeitosPausados
                ? 'Retomar animações'
                : 'Pausar animações';

            botao.setAttribute(
                'aria-label',
                efeitosPausados
                    ? 'Retomar animações do portfólio'
                    : 'Pausar animações do portfólio'
            );
        });
    }

    botoesMovimento.forEach(botao => {
        botao.addEventListener('click', () => {
            efeitosPausados = !efeitosPausados;
            atualizarMovimento();

            try {
                localStorage.setItem(
                    chaveMovimento,
                    String(efeitosPausados)
                );
            } catch {
                // Preferência aplicada nesta página.
            }
        });
    });

    reduzirMovimento.addEventListener('change', atualizarMovimento);

    window.addEventListener('storage', evento => {
        if (evento.key === chaveMovimento || evento.key === null) {
            efeitosPausados = evento.newValue === 'true';
            atualizarMovimento();
        }
    });

    atualizarMovimento();

    if ('IntersectionObserver' in window) {
        entradasVisuais.forEach((elemento, indice) => {
            elemento.style.setProperty(
                '--atraso',
                `${elemento === formacao ? 0 : (indice % 3) * 90}ms`
            );

            if (!efeitosPausados && !reduzirMovimento.matches) {
                elemento.classList.add('entrada-pendente');

                if (cartoes.includes(elemento)) {
                    elemento.classList.add('barra-reiniciada');
                }
            }
        });

        const observador = new IntersectionObserver(entradas => {
            entradas.forEach(entrada => {
                entrada.target.classList.toggle(
                    'efeitos-fora',
                    !entrada.isIntersecting
                );

                if (cartoes.includes(entrada.target)) {
                    visibilidadeCartoes.set(
                        entrada.target,
                        entrada.isIntersecting
                    );

                    atualizarBarra(
                        entrada.target,
                        entrada.isIntersecting
                    );
                }

                if (entrada.isIntersecting) {
                    entrada.target.classList.remove('entrada-pendente');
                }
            });
        }, {
            threshold: 0.08
        });

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                efeitosVisuais.forEach(elemento => {
                    observador.observe(elemento);
                });
            });
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            cartoes.forEach(cartao => {
                atualizarBarra(cartao, false);
            });
        } else {
            requestAnimationFrame(() => {
                requestAnimationFrame(restaurarBarras);
            });
        }
    });

    window.addEventListener('pagehide', () => {
        cartoes.forEach(cartao => {
            atualizarBarra(cartao, false);
        });
    });

    window.addEventListener('pageshow', () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(restaurarBarras);
        });
    });

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
            estado.textContent =
                'Não foi possível carregar a visualização. Utilize a opção de abrir em nova aba.';
        }

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
                    : (laboratorio
                        ? 'Laboratório JavaScript'
                        : botao.dataset.titulo);

                externo.href = url;

                document.getElementById('rotulo-externo').textContent = foto
                    ? 'Abrir imagem em nova aba'
                    : 'Abrir em nova aba';

                estado.textContent = foto
                    ? 'Carregando imagem…'
                    : 'Abrindo prévia. Se ela não aparecer, use Abrir em nova aba.';

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
                        estado.textContent =
                            'A visualização pode demorar. Você também pode abrir em nova aba.';
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
            const r = janela.getBoundingClientRect();

            return (
                evento.clientX < r.left ||
                evento.clientX > r.right ||
                evento.clientY < r.top ||
                evento.clientY > r.bottom
            );
        }

        janela.addEventListener('pointerdown', evento => {
            cliqueNoFundo =
                evento.target === janela &&
                foraDaJanela(evento);
        });

        janela.addEventListener('click', evento => {
            if (
                cliqueNoFundo &&
                evento.target === janela &&
                foraDaJanela(evento)
            ) {
                janela.close();
            }

            cliqueNoFundo = false;
        });
    }

    document.getElementById('ano').textContent =
        String(new Date().getFullYear());
})();