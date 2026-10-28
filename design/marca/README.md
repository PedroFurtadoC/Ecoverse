# Marca

A folha e o nome saem do mesmo desenho. A folha é vetor puro. O nome é a
Outfit 800, a mesma tipografia da interface, já convertida em curvas, de
modo que nenhum arquivo aqui depende de ter a fonte instalada.

As cores são os tokens de `src/css/variables.css`, não valores soltos:

| Uso | Token | Valor |
| --- | --- | --- |
| Base da folha | `--c-green-dark` | `#1A5632` |
| Ponta da folha | `--c-green` | `#2ECC71` |
| Nervuras | `--c-green-light` | `#A8D5BA` |
| Nome em fundo claro | `--c-bg-dark` | `#0B2E1A` |
| Nome em fundo escuro | `--c-text` | `#E8F5E9` |

## Qual arquivo usar

Os `.svg` são os originais. Tudo o mais nesta pasta sai deles.

| Arquivo | Quando usar |
| --- | --- |
| `ecoverse-logo.svg` | Assinatura deitada em fundo claro |
| `ecoverse-logo-escuro.svg` | Assinatura deitada em fundo escuro. É a que roda na tela de carregamento |
| `ecoverse-logo-mono.svg` | Uma cor só, para impressão sem cor e para carimbo |
| `ecoverse-vertical.svg` | Assinatura empilhada, quando o espaço é quadrado ou vertical |
| `ecoverse-vertical-mono.svg` | Empilhada em uma cor só |
| `ecoverse-simbolo.svg` | Só a folha, quando o nome já aparece do lado |
| `ecoverse-simbolo-mono.svg` | Só a folha, em uma cor só |

Em `png/` ficam os sete rasterizados a 2000 px de largura, com fundo
transparente, para onde SVG não entra: slide, documento de texto, rede
social.

O material entregue à universidade usa nome descritivo em vez do nome de
arquivo daqui. São os mesmos desenhos, byte a byte:

| Aqui | Na entrega |
| --- | --- |
| `ecoverse-logo.svg` | `deitada-fundo-claro.svg` |
| `ecoverse-logo-escuro.svg` | `deitada-fundo-escuro.svg` |
| `ecoverse-logo-mono.svg` | `deitada-monocromatica.svg` |
| `ecoverse-vertical.svg` | `empilhada-fundo-claro.svg` |
| `ecoverse-vertical-mono.svg` | `empilhada-monocromatica.svg` |
| `ecoverse-simbolo.svg` | `simbolo.svg` |
| `ecoverse-simbolo-mono.svg` | `simbolo-monocromatico.svg` |

## Depósito no INPI

Os arquivos prontos para o formulário e-Marcas não ficam nesta pasta. O
material de registro é processo interno e vive fora do repositório, em
`registro-inpi/marca/`, junto do resto da documentação do depósito.

São quatro JPG, todos RGB e dentro da moldura de 8 cm × 8 cm que o INPI
exige: um colorido e um em preto e branco a 945 × 945 px e 300 dpi, mais
os mesmos dois a 1890 × 1890 px e 600 dpi. Os de 600 dpi existem porque
os valores do formulário são mínimos, não máximos. A escolha entre cor e
preto e branco não é estética, porque **depositar a versão colorida
equivale a reivindicar as cores**, e o verde passa a integrar o registro.
O critério completo está no `README.md` daquela pasta.

O nome e o logotipo **não** entram na licença MIT do projeto. A ressalva
está no [`LICENSE`](../../LICENSE), na seção de marcas.

## Regras de uso

Respiro mínimo em volta: a altura do "E" do logotipo. Tamanho mínimo da
versão deitada: 24 mm de largura no impresso, 120 px na tela. Abaixo
disso as nervuras somem e o símbolo sozinho funciona melhor.

Não recolorir, não esticar, não aplicar sombra, não inserir dentro de
caixa ou moldura, e não recompor o nome em outra fonte.

## Ao alterar o desenho

A folha aparece nos sete SVG, e o nome em cinco deles. Mexeu num, mexa
nos outros, senão a marca passa a existir em duas versões ao mesmo tempo.
Depois refaça as exportações de `png/` e as de `registro-inpi/marca/` a
partir dos SVG atualizados, e troque também os sete arquivos que a aplicação usa:
`public/assets/logo.svg`, `public/favicon.svg`, `public/favicon.png`,
`public/icon-maskable.png`, `public/apple-touch-icon.png`, `public/og-image.png`
e `public/email-logo.png`.

O ícone mascarável do PWA é o `icon-maskable.png`, que precisa de fundo
cheio. O `favicon.png` entra no manifesto como ícone comum (`any`).
