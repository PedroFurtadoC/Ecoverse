# Aviso de autoria e parceria

O Ecoverse é o trabalho final da disciplina de Sustentabilidade Ambiental da **Universidade de Ribeirão Preto (UNAERP)**, sob orientação da professora **Isadora**, em 2026.

## Autores

- **Pedro Furtado Cunha**: liderança técnica e arquitetura geral.
- **André Fernando Machado**: minigames das missões 1 (Amazônia) e 2 (Bacia do Congo).
- **Felipe de Sousa Pegoraro**: minigames das missões 3 (Mata Atlântica) e 4 (Bornéu), e a biblioteca interna de jogo reaproveitada pelos demais módulos.
- **Pedro Borges Casaroti**: minigames das missões 5 (Madagascar) e 6 (Pantanal).
- **Thiago Salata Siena**: minigames das missões 7 (Grande Barreira) e 8 (Andes).

## Colaboração

- **Ígor Polegato**: revisão do código em setembro de 2026, com limpeza de eventos e timers dos minigames, utilitários compartilhados e padronização dos estilos.

## Bibliotecas

- [Globe.GL](https://github.com/vasturiano/globe.gl) e [Three.js](https://threejs.org): visualização 3D do globo (MIT).
- [Vite](https://vitejs.dev): bundler (MIT).
- [Supabase JS](https://github.com/supabase/supabase-js): Auth e banco (MIT).
- [Outfit (Google Fonts)](https://fonts.google.com/specimen/Outfit): tipografia (OFL 1.1).

As estatísticas das missões e das dicas da tela de carregamento citam a fonte em comentário no código (UNEP, MapBiomas, SOS Mata Atlântica, AIMS, FAO e outras). As perguntas dos quizzes e parte dos fatos dos minigames ainda não têm fonte registrada item a item.

## Imagens

As fotos das missões (`public/assets/photo-*`) e a textura do globo (`public/assets/earth-texture.webp`) são de terceiros: continuam dos seus autores e não entram na licença MIT. A foto do Pantanal (`photo-pantanal-pocone.jpg`) é de Flavio André para o Ministério do Turismo, em domínio público, via [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Flavio_Andre_Pantanal_Vista_aerea_Pocone_MT_(40064777855).jpg). A origem das outras ainda precisa ser registrada aqui. Os sprites e as ilustrações de `public/assets/generated/` e de `design/` foram feitos para o projeto.

## Forks

A licença [MIT](./LICENSE) deixa qualquer pessoa usar, modificar e redistribuir o Ecoverse, inclusive comercialmente. A obrigação que ela impõe é levar junto o aviso de copyright e o texto da licença, o que já garante o crédito aos cinco autores e à UNAERP.

Fora da licença fica a marca. O nome "Ecoverse", o logotipo e o símbolo da folha pertencem aos autores e à Universidade, e a seção de marcas do [`LICENSE`](./LICENSE) registra isso por escrito. Um fork precisa entrar com identidade própria no lugar deles. Citar o nome para dizer de onde o código veio continua permitido, e é o esperado; o que não vale é usar a marca de um jeito que sugira que o projeto derivado é o oficial, ou que tem aval da UNAERP.

Manter este `NOTICE.md` no fork é um pedido, não uma exigência da licença: é aqui que ficam registradas a origem acadêmica do projeto e a parceria com a Universidade. Para contribuir com o repositório oficial, ver [`docs/contribuindo.md`](./docs/contribuindo.md).
