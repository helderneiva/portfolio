(() => {
    'use strict';

    const filtro = document.getElementById('filtro-tecnologia');
    const contagem = document.getElementById('contagem-projetos');
    const projetos = [...document.querySelectorAll('[data-tecnologias]')];
    const permitidos = [...filtro.options].map(opcao => opcao.value);

    function aplicar(valor, atualizarEndereco = false) {
        const tecnologia = permitidos.includes(valor) ? valor : 'todos';
        filtro.value = tecnologia;

        let total = 0;

        projetos.forEach(projeto => {
            const visivel = tecnologia === 'todos' ||
                projeto.dataset.tecnologias.split(' ').includes(tecnologia);

            projeto.hidden = !visivel;

            if (visivel) {
                total += 1;
            }

            projeto.querySelectorAll('[data-evidencia]').forEach(evidencia => {
                evidencia.hidden = tecnologia !== 'todos' &&
                    evidencia.dataset.evidencia !== tecnologia;
            });
        });

        contagem.textContent = `${total} ${total === 1 ? 'projeto nesta seleção' : 'projetos nesta seleção'}.`;

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