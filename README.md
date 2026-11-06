# Portfólio de Helder Neiva

Portfólio pessoal de desenvolvimento web, feito com HTML5, CSS e JavaScript puro.

## Recursos

- Temas claro e escuro com preferência local.
- Fontes e ícones locais.
- Laboratórios por linguagem, com prévia interna do laboratório JavaScript.
- Competências vinculadas a evidências em projetos.
- Animações com controle de pausa e respeito à preferência por movimento reduzido.
- Formulário integrado ao Web3Forms.

## Executar localmente

Abra a pasta no VS Code e use um servidor local, como o Live Server.

Não há instalação de dependências nem etapa de compilação.

## Configuração

Preserve e edite scripts/configuracao.js.

A chave pública web3formsChave determina o destino das mensagens.

Os campos de e-mail, currículo e laboratórios futuros são opcionais.

Não coloque senhas ou credenciais de banco de dados nesse arquivo.

## Estilos

- estilos/paleta.css: temas, cores, gradientes e medidas compartilhadas.
- estilos/style.css: fontes, base, navegação, componentes e página inicial.
- estilos/contato.css: redes profissionais e formulário.
- estilos/competencias.css: página de projetos por competência.
- estilos/sobre.css: identidade da seção Sobre.
- estilos/formacao.css: formação e estudos complementares.
- estilos/impressao.css: apresentação para impressão, carregada com media="print".

melhorias.css foi incorporado aos estilos definitivos e não é mais carregado.

## Publicação

Mantenha os nomes e caminhos dos arquivos.

O endereço público atual é https://helderneiva.github.io/portfolio/. Se ele mudar, atualize urlPublica e os endereços absolutos de canonical e Open Graph nos dois HTMLs.

Para compartilhamento em redes sociais, acrescente canonical, og:url e og:image diretamente nos HTMLs com os endereços absolutos reais da publicação.

Os metadados já estão no HTML. A imagem de compartilhamento é imagens/compartilhamento.png (1200 × 630). O JavaScript não injeta metadados duplicados.

## Recursos locais

Preserve os três arquivos de fontes, scripts/lucide.js, imagens/foto-perfil.jpeg e favicon.ico.

Mantenha também os avisos de licença que acompanham as fontes e o Lucide.

## Verificação

Teste os dois temas, navegação por teclado, pausa das animações, filtro de competências e uma mensagem real do formulário após configurar a chave.

As prévias externas dependem da disponibilidade e das permissões de incorporação do site de destino.

## Movimento

A pausa dos efeitos é salva em portfolio-animacoes-pausadas e compartilhada entre os controles.

Quando pausados, os níveis permanecem preenchidos e legíveis.

A entrada de competências e formação ocorre na primeira aparição; efeitos contínuos são pausados fora da tela.

A preferência por movimento reduzido tem prioridade.