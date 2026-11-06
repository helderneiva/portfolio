// Resolve a preferência antes do CSS.
// A media query cobre acessos sem JavaScript.

(() => {
    'use strict';

    const chave = 'portfolio-tema';

    const migracao = {
        claro: 'light',
        escuro: 'dark'
    };

    let preferencia = null;

    try {
        const salva = localStorage.getItem(chave);
        preferencia = migracao[salva] || salva;

        if (migracao[salva]) {
            localStorage.setItem(chave, preferencia);
        }
    } catch {
        // A preferência do sistema funciona sem armazenamento.
    }

    try {
        document.documentElement.classList.toggle(
            'animacoes-pausadas',
            localStorage.getItem('portfolio-animacoes-pausadas') === 'true'
        );
    } catch {
        // A preferência do sistema permanece disponível.
    }

    const sistemaEscuro = matchMedia('(prefers-color-scheme: dark)').matches;

    document.documentElement.dataset.theme = ['light', 'dark'].includes(preferencia)
        ? preferencia
        : (sistemaEscuro ? 'dark' : 'light');
})();