
(() => {
    'use strict';

    const filtro = document.getElementById('filtro-tecnologia');
    const contagem = document.getElementById('contagem-projetos');
    const projetos = [...document.querySelectorAll('[data-tecnologias]')];
    const permitidos = [...filtro.options].map(opcao => opcao.value);

    function aplicar(valor, atualizarEndereco = false) {
        const tecnologia = permitidos.includes(valor) ? valor : 'todos';
        filtro.value = tecnologia;

        let disponiveis = 0;
        let emDesenvolvimento = 0;

        projetos.forEach(projeto => {
            const visivel = tecnologia === 'todos' || projeto.dataset.tecnologias.split(' ').includes(tecnologia);

            projeto.hidden = !visivel;

            if (visivel && projeto.dataset.situacao === 'disponivel') {
                disponiveis += 1;
            } else if (visivel && projeto.dataset.situacao === 'desenvolvimento') {
                emDesenvolvimento += 1;
            }

            projeto.querySelectorAll('[data-evidencia]').forEach(evidencia => {
                evidencia.hidden = tecnologia !== 'todos' && evidencia.dataset.evidencia !== tecnologia;
            });
        });

        const total = disponiveis + emDesenvolvimento;

        if (total === 0) {
            contagem.textContent = 'Nenhum projeto nesta seleção.';
        } else {
            const partes = [];

            if (disponiveis > 0) {
                partes.push(`${disponiveis} ${disponiveis === 1 ? 'projeto disponível' : 'projetos disponíveis'}`);
            }

            if (emDesenvolvimento > 0) {
                partes.push(`${emDesenvolvimento} em desenvolvimento`);
            }

            contagem.textContent = `${partes.join(' e ')} nesta seleção.`;
        }

        if (atualizarEndereco) {
            const url = new URL(location.href);

            if (tecnologia === 'todos') {
                url.searchParams.delete('tecnologia');
            } else {
                url.searchParams.set('tecnologia', tecnologia);
            }

            try {
                history.pushState(null, '', url);
            } catch {
                // O filtro continua funcionando se o histórico estiver indisponível.
            }
        }
    }

    function lerEndereco() {
        const tecnologia = new URLSearchParams(location.search).get('tecnologia');
        aplicar(tecnologia || 'todos');
    }

    filtro.addEventListener('change', () => {
        aplicar(filtro.value, true);
    });

    window.addEventListener('popstate', lerEndereco);

    lerEndereco();
})();