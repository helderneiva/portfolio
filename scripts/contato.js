(() => {
    'use strict';

    const form = document.getElementById('form-contato');

    if (!form) {
        return;
    }

    const resultado = document.getElementById('resultado-envio');
    const botao = document.getElementById('enviar-mensagem');
    const chave = String(window.portfolioConfiguracao?.web3formsChave || '').trim();

    const configurado = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(chave);

    const campos = ['nome', 'email', 'mensagem']
        .map(id => document.getElementById(id));

    let enviando = false;

    function informar(texto, estado = '') {
        resultado.textContent = texto;
        resultado.dataset.estado = estado;
    }

    function validar(campo) {
        const valor = campo.value.trim();
        let erro = '';

        if (!valor) {
            erro = 'Preencha este campo.';
        } else if (campo.id === 'nome' && valor.length < 2) {
            erro = 'Informe pelo menos 2 caracteres.';
        } else if (campo.id === 'email' && campo.validity.typeMismatch) {
            erro = 'Informe um e-mail válido.';
        } else if (campo.id === 'mensagem' && valor.length < 10) {
            erro = 'Escreva uma mensagem com pelo menos 10 caracteres.';
        } else if (valor.length > campo.maxLength) {
            erro = 'O texto ultrapassou o limite do campo.';
        }

        document.getElementById(`erro-${campo.id}`).textContent = erro;

        if (erro) {
            campo.setAttribute('aria-invalid', 'true');
        } else {
            campo.removeAttribute('aria-invalid');
        }

        return !erro;
    }

    campos.forEach(campo => {
        campo.addEventListener('blur', () => validar(campo));

        campo.addEventListener('input', () => {
            if (campo.hasAttribute('aria-invalid')) {
                validar(campo);
            }
        });
    });

    botao.disabled = !configurado;

    if (!configurado) {
        informar('O envio pelo formulário está indisponível no momento. Entre em contato pelo LinkedIn.');
    }

    form.addEventListener('submit', async evento => {
        evento.preventDefault();

        if (!configurado || enviando) {
            return;
        }

        const validacoes = campos.map(campo => validar(campo));

        if (validacoes.includes(false)) {
            campos[validacoes.indexOf(false)].focus();
            informar('Revise os campos indicados.', 'erro');
            return;
        }

        if (form.elements.botcheck.checked) {
            return;
        }

        enviando = true;
        botao.disabled = true;
        form.setAttribute('aria-busy', 'true');

        const controles = [...form.querySelectorAll('input, textarea')];

        const dados = {
            access_key: chave,
            name: form.elements.name.value.trim(),
            email: form.elements.email.value.trim(),
            subject: form.elements.subject.value.trim() || 'Contato pelo portfólio — Helder Neiva',
            message: form.elements.message.value.trim(),
            from_name: 'Portfólio de Helder Neiva',
            botcheck: ''
        };

        controles.forEach(campo => {
            campo.disabled = true;
        });

        informar('Enviando mensagem…');

        const controlador = new AbortController();
        const limite = setTimeout(() => controlador.abort(), 20000);

        try {
            const resposta = await fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json'
                },
                body: JSON.stringify(dados),
                signal: controlador.signal
            });

            const retorno = await resposta.json();

            if (!resposta.ok || retorno.success !== true) {
                throw new Error('Envio não confirmado');
            }

            form.reset();
            informar('Mensagem enviada com sucesso. Obrigado pelo contato!', 'sucesso');
        } catch (erro) {
            informar(
                erro.name === 'AbortError'
                    ? 'O envio não foi confirmado a tempo. Seu texto foi preservado; aguarde antes de tentar novamente ou use o LinkedIn.'
                    : 'Não foi possível confirmar o envio. Seu texto foi preservado. Tente novamente ou entre em contato pelo LinkedIn.',
                'erro'
            );
        } finally {
            clearTimeout(limite);

            controles.forEach(campo => {
                campo.disabled = false;
            });

            form.removeAttribute('aria-busy');
            enviando = false;
            botao.disabled = false;
        }
    });
})();