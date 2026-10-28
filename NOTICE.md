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

As fotos das missões (`public/assets/photo-*`) e a textura do globo (`public/assets/earth-texture.webp`) são de terceiros e não entram na licença MIT. Todas têm licença livre e mostram o lugar real de cada missão. O jogo exibe o crédito no canto da foto e reúne todos na janela Sobre; o registro completo fica aqui.

| Missão | Lugar da foto | Autor | Licença |
|---|---|---|---|
| 1. Amazônia | Floresta amazônica perto de Manaus (AM) | [Neil Palmer (CIAT)](https://commons.wikimedia.org/wiki/File:Amazon_CIAT_(3).jpg) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/deed.pt-br) |
| 2. Bacia do Congo | Kivu do Norte, RD Congo | [Abel Kavanagh (MONUSCO)](https://commons.wikimedia.org/wiki/File:River_in_rainforest_-_North_Kivu_(21062578875).jpg) | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0/deed.pt-br) |
| 3. Mata Atlântica | Cascatinha Taunay, Floresta da Tijuca, Rio de Janeiro | [Ricardo Wagner e Silva](https://commons.wikimedia.org/wiki/File:Cascatinha_Taunay_do_Rio_Cachoeira_01.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br) |
| 4. Bornéu | Manguezal de Mentawir, Kalimantan Oriental | [Exagren](https://commons.wikimedia.org/wiki/File:Fisherman_in_Mangrove_Areas.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br) |
| 5. Madagascar | Tartaruga-de-pente em Nosy Tanikely | [Diego Delso](https://commons.wikimedia.org/wiki/File:Tortuga_carey_(Eretmochelys_imbricata),_Nosy_Tanikely,_Madagascar,_2025-09-19,_DD_95.jpg) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br) |
| 6. Pantanal | Poconé, Mato Grosso | [Flavio André (MTur)](https://commons.wikimedia.org/wiki/File:Flavio_Andre_Pantanal_Vista_aerea_Pocone_MT_(40064777855).jpg) | Domínio público |
| 7. Grande Barreira | Recife Flynn, perto de Cairns | [Toby Hudson](https://commons.wikimedia.org/wiki/File:Coral_Outcrop_Flynn_Reef.jpg) | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/deed.pt-br) |
| 8. Andes | Machu Picchu e Huayna Picchu, Peru | [Diego Delso](https://commons.wikimedia.org/wiki/File:Machu_Picchu,_Per%C3%BA,_2015-07-30,_DD_47.JPG) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br) |
| Globo | Blue Marble Next Generation, outubro de 2004, com relevo e batimetria | [Reto Stöckli, NASA Earth Observatory](https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/) | Domínio público |

As fotos do Commons foram recortadas para 840 × 480 pixels, sem outra alteração. As versões recortadas seguem a mesma licença do original: quem reaproveitar uma delas precisa manter o crédito e a licença. A textura é a mesma que acompanha os exemplos do three-globe, reduzida para 4096 × 2048, e a NASA pede o crédito ao NASA Earth Observatory.

Os sprites e as ilustrações de `public/assets/generated/` e de `design/` foram feitos para o projeto.

## Forks

A licença [MIT](./LICENSE) deixa qualquer pessoa usar, modificar e redistribuir o Ecoverse, inclusive comercialmente. A obrigação que ela impõe é levar junto o aviso de copyright e o texto da licença, o que já garante o crédito aos cinco autores e à UNAERP.

Fora da licença fica a marca. O nome "Ecoverse", o logotipo e o símbolo da folha pertencem aos autores e à Universidade, e a seção de marcas do [`LICENSE`](./LICENSE) registra isso por escrito. Um fork precisa entrar com identidade própria no lugar deles. Citar o nome para dizer de onde o código veio continua permitido, e é o esperado; o que não vale é usar a marca de um jeito que sugira que o projeto derivado é o oficial, ou que tem aval da UNAERP.

Manter este `NOTICE.md` no fork é um pedido, não uma exigência da licença: é aqui que ficam registradas a origem acadêmica do projeto e a parceria com a Universidade. Para contribuir com o repositório oficial, ver [`docs/contribuindo.md`](./docs/contribuindo.md).
