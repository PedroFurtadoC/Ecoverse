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

Em `png/` ficam as mesmas versões rasterizadas, para onde SVG não entra.

## Depósito no INPI

Os arquivos prontos para o formulário e-Marcas não ficam nesta pasta. O
material de registro é processo interno e vive fora do repositório, em
`registro-inpi/marca/`, junto do resto da documentação do depósito.

São dois JPG de 945 × 945 px a 300 dpi, RGB, dentro da moldura de 8 cm ×
8 cm que o INPI exige: um colorido e um em preto e branco. A escolha
entre eles não é estética, porque **depositar a versão colorida equivale
a reivindicar as cores**, e o verde passa a integrar o registro. O
critério completo está no `README.md` daquela pasta.

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
Depois refaça as exportações de `png/` e de `inpi/` a partir dos SVG
atualizados, e troque também os três arquivos que a aplicação carrega:
`public/assets/logo.svg`, `public/favicon.svg` e `public/favicon.png`.

O `favicon.png` leva quadrado branco por baixo de propósito: além de
ícone de aba, ele serve como ícone mascarável do PWA, e ícone mascarável
precisa de fundo cheio.

## Versão anterior

`anterior/` guarda a logo e o favicon que existiam antes desta unificação.
A logo antiga trazia o subtítulo "Future Forest", em inglês e falando de
floresta, o que não corresponde mais ao projeto depois que ele passou a
tratar só de resíduos. O favicon antigo era imagem rasterizada, e a folha
dele não era a mesma da logo: eram duas marcas diferentes convivendo.
