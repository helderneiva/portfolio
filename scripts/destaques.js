(() => {
    'use strict';

    const configuracao = window.portfolioConfiguracao || {};
    const bloco = document.getElementById('destaque');
    const copiar = document.getElementById('copiar-email');
    const retorno = document.getElementById('retorno-copia');

    let ultimoProjeto = null;
    let temporizador = null;

    function endereco(valor, local = false) {
        if (typeof valor !== 'string' || !valor.trim()) {
            return null;
        }

        try {
            const url = new URL(valor, location.href);

            if (url.username || url.password) {
                return null;
            }

            if (url.protocol === 'https:') {
                return url.href;
            }

            if (
                local &&
                url.origin === location.origin &&
                ['http:', 'file:'].includes(url.protocol)
            ) {
                return url.href;
            }
        } catch {
            return null;
        }

        return null;
    }

    function diaAtual(data = new Date()) {
        const partes = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(data);

        const valor = tipo => {
            return Number(partes.find(parte => parte.type === tipo).value);
        };

        return Math.floor(
            Date.UTC(
                valor('year'),
                valor('month') - 1,
                valor('day')
            ) / 86400000
        );
    }

    function criarLink(texto, url) {
        const link = document.createElement('a');

        link.className = 'link-texto';
        link.textContent = texto;
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${texto}: abre em nova aba`);

        return link;
    }

    function atualizarDestaque() {
        if (!bloco) {
            return;
        }

        const projetos = Array.isArray(configuracao.projetosDestaque)
            ? configuracao.projetosDestaque.filter(projeto => {
                return (
                    projeto &&
                    projeto.publicado === true &&
                    typeof projeto.id === 'string' &&
                    projeto.id.trim() &&
                    typeof projeto.nome === 'string' &&
                    projeto.nome.trim() &&
                    typeof projeto.descricao === 'string' &&
                    projeto.descricao.trim() &&
                    endereco(projeto.url)
                );
            })
            : [];

        if (!projetos.length) {
            return;
        }

        const projeto = projetos[diaAtual() % projetos.length];

        if (ultimoProjeto === projeto.id) {
            return;
        }

        // Evita substituir um link enquanto o visitante interage com o card.
        if (
            bloco.contains(document.activeElement) ||
            bloco.matches(':hover')
        ) {
            return;
        }

        ultimoProjeto = projeto.id;

        document.getElementById('destaque-nome').textContent = projeto.nome;
        document.getElementById('destaque-descricao').textContent = projeto.descricao;
        document.getElementById('destaque-alternativa').hidden = true;

        const tecnologias = document.getElementById('destaque-tecnologias');

        tecnologias.replaceChildren();

        const lista = Array.isArray(projeto.tecnologias)
            ? projeto.tecnologias
            : [];

        lista
            .filter(item => typeof item === 'string' && item.trim())
            .forEach(item => {
                const etiqueta = document.createElement('li');

                etiqueta.textContent = item;
                tecnologias.append(etiqueta);
            });

        tecnologias.hidden = tecnologias.children.length === 0;

        const acoes = document.getElementById('destaque-acoes');

        acoes.replaceChildren(
            criarLink('Visualizar projeto', endereco(projeto.url))
        );

        const repositorio = endereco(projeto.repositorio);

        if (repositorio) {
            acoes.append(criarLink('Ver repositório', repositorio));
        }

        acoes.hidden = false;

        const visual = document.getElementById('destaque-visual');
        const imagem = endereco(projeto.imagem, true);

        visual.classList.toggle('com-imagem', Boolean(imagem));
        visual.replaceChildren();

        if (imagem) {
            const capa = document.createElement('img');

            capa.src = imagem;
            capa.alt = '';
            capa.decoding = 'async';

            capa.addEventListener('error', () => {
                visual.classList.remove('com-imagem');
                visual.textContent = 'APLICAÇÕES INTEGRADAS';
            }, { once: true });

            visual.append(capa);
        } else {
            visual.textContent = 'APLICAÇÕES INTEGRADAS';
        }
    }

    function agendarDestaque() {
        clearTimeout(temporizador);

        if (document.hidden || !bloco) {
            return;
        }

        atualizarDestaque();
        temporizador = setTimeout(agendarDestaque, 60000);
    }

    agendarDestaque();

    document.addEventListener('visibilitychange', agendarDestaque);
    window.addEventListener('pageshow', agendarDestaque);

    window.addEventListener('pagehide', () => {
        clearTimeout(temporizador);
    });

    bloco?.addEventListener('pointerleave', atualizarDestaque);

    bloco?.addEventListener('focusout', () => {
        requestAnimationFrame(atualizarDestaque);
    });

    if (
        copiar &&
        retorno &&
        typeof configuracao.email === 'string'
    ) {
        const email = configuracao.email.trim();

        copiar.hidden = !email;

        copiar.addEventListener('click', async () => {
            try {
                if (!navigator.clipboard?.writeText) {
                    throw new Error('Cópia indisponível');
                }

                await navigator.clipboard.writeText(email);
                retorno.textContent = 'E-mail copiado.';
            } catch {
                retorno.textContent =
                    'Selecione o endereço de e-mail e copie com Ctrl+C ou pelo menu do dispositivo.';
            }
        });
    }
})();