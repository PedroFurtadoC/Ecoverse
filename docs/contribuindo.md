# Como contribuir

Guia para os 4 colegas que vão implementar os minigames e para quem pegar o projeto depois.

## Setup

```bash
git clone https://github.com/PedroFurtadoC/Ecoverse.git
cd Ecoverse
npm install
cp .env.example .env   # opcional; só preenche se for usar Supabase
npm run dev
```

Abre em `http://localhost:3000`. Use `?dev=free` na URL durante o desenvolvimento para liberar energia infinita e testar missões sem fazer Pomodoro a cada vez.

## Antes de codar

1. Leia `src/js/modules/minigames/<seu-nome>/README.md` (tema, mecânicas, sprites disponíveis).
2. Confira os sprites prontos em `public/assets/generated/cutouts/`.

## Branches e commits

- `main` — branch principal, sempre deployável.
- `feat/<dev>-modulo-N` — sua branch (ex.: `feat/andre-modulo-1`).
- PR direto para `main` quando estiver pronto.

[Conventional Commits](https://www.conventionalcommits.org) em português:

```
feat(minigame-andre-1): coleta de plásticos no rio Amazonas
fix(pomodoro): beep não tocava em Safari iOS
docs(readme): adiciona seção de parceria UNAERP
```

Tipos comuns: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Antes de abrir PR

Use o checklist do `.github/PULL_REQUEST_TEMPLATE.md` que aparece automaticamente quando você cria o PR.

## Code review

PRs são revisados pelo Pedro Furtado. Se quiser segunda opinião, marque o colega da pasta vizinha. Foco da revisão:

1. **Tema certo** — resíduos NAQUELE bioma, não genérico?
2. **Mecânica funciona** — joga do início ao fim sem bugs?
3. **Mobile-first** — funciona em 320px?
4. **Acessibilidade** — teclado e leitor de tela?

## Onde pedir ajuda

- Arquitetura: [`docs/arquitetura.md`](./arquitetura.md) e o código de um módulo já feito (ex.: `src/js/modules/pomodoro.js`).
- Mecânica, tema, assets: Pedro Furtado.
- CSS/UI mobile: tokens em `src/css/variables.css` e breakpoints em `src/css/components/responsive.css`.

## Não faça

- Não mexa em arquivos fora da sua pasta sem alinhar antes.
- Não use `window.<algo>` para compartilhar dados com outros módulos.
- Não importe assets de URLs externas em runtime — use `public/assets/`.
- Não coloque API keys no código. Sempre via `.env`.
