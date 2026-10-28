# Como contribuir

Guia para quem for alterar o código do Ecoverse.

## Setup

Precisa do Node.js 22, a mesma versão do CI e da Vercel.

```bash
git clone https://github.com/PedroFurtadoC/Ecoverse.git
cd Ecoverse
npm install
cp .env.example .env.local   # opcional; só preenche se for usar Supabase
npm run dev
```

Abre em `http://localhost:3000`. Use `?dev=free` na URL durante o desenvolvimento: todas as missões ficam liberadas, não gastam energia e não contam como concluídas. Quizzes e Pomodoro salvam normalmente.

O `npm run preview` serve o build em `http://localhost:4173`. É o único modo local com o cache offline ligado, mas o login não volta para esse endereço, que não está nos Redirect URLs do Supabase.

## Antes de codar

1. Leia o contrato dos minigames em `src/js/modules/minigames/README.md`. O README da pasta de cada autor guarda o briefing original do jogo; a lista de sprites dele pode não bater com o que o código usa hoje.
2. Confira os sprites prontos em `public/assets/generated/cutouts/`.
3. (Opcional) Veja o minigame de exemplo em `src/js/modules/minigames/_demo/`. Ele virou o easter egg Triagem relâmpago e vai para produção escondido: abre digitando ECO fora de um campo de texto ou com três toques rápidos no contador de missões. Serve de referência de estrutura.

## Branches e commits

- `main`: branch principal, sempre deployável.
- `feat/<assunto>` ou `fix/<assunto>`: uma branch por mudança (ex.: `fix/teclado-minigame-1`).
- PR direto para `main` quando estiver pronto.

[Conventional Commits](https://www.conventionalcommits.org) em português:

```
feat(minigame-andre-1): coleta de plásticos no rio Amazonas
fix(pomodoro): beep não tocava em Safari iOS
docs(readme): adiciona seção de parceria UNAERP
```

Tipos comuns: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

## Padrão de código

- **Formatação**: 2 espaços, LF, UTF-8, newline no fim do arquivo. Está no `.editorconfig` da raiz; no VS Code, instale a extensão EditorConfig (o próprio projeto recomenda) e o editor aplica sozinho. O `.gitattributes` força LF no repositório mesmo em quem usa Windows.
- **Aspas simples** em JS; aspas duplas só dentro de HTML em template string.
- **ESM** com extensão `.js` nos imports.
- **Nomes**: a maior parte das funções e variáveis está em inglês (`plantTree`, `completeMission`); trechos mais novos usam português (`devolverFoco`). Interface e comentários, sempre em português. Ver [`arquitetura.md`](./arquitetura.md).
- **Utilitários compartilhados** ficam em `src/js/utils/` (ex.: `escapeHtml`). Antes de escrever um helper, veja se já existe lá; se for usar em dois lugares, mova para lá.
- **Timers e listeners globais sempre têm dono**: quem cria é quem limpa. Nos minigames isso é feito pela base (`_setTimeout`, `_own`, `_listen`, ver [`src/js/modules/minigames/README.md`](../src/js/modules/minigames/README.md)).
- **Laços de animação só rodam enquanto há o que animar.** Um `requestAnimationFrame` que se reagenda para sempre custa bateria mesmo com a tela parada.
- **Sem código de debug em produção**: contador de FPS, `console.log` de teste, medições de tempo por frame.

## Antes de abrir PR

Use o checklist do `.github/PULL_REQUEST_TEMPLATE.md` que aparece automaticamente quando você cria o PR.

## Code review

Quem mantém o projeto revisa os PRs. Foco da revisão:

1. **Tema certo**: resíduos NAQUELE bioma, não genérico?
2. **Mecânica funciona**: joga do início ao fim sem bugs?
3. **Mobile-first**: funciona em 320px?
4. **Acessibilidade**: teclado e leitor de tela?

## Onde pedir ajuda

- Arquitetura: [`docs/arquitetura.md`](./arquitetura.md) e o código de um módulo já feito (ex.: `src/js/modules/pomodoro.js`).
- Mecânica, tema, assets: o README da pasta do minigame e quem mantém o projeto.
- CSS/UI mobile: tokens em `src/css/variables.css` e breakpoints em `src/css/components/responsive.css`.

## Não faça

- Ao mexer num minigame, não altere os arquivos de outro sem alinhar antes.
- Não use `window.<algo>` para compartilhar dados com outros módulos.
- Não importe assets de URLs externas em runtime. Use `public/assets/`.
- Não coloque API keys no código. Sempre via `.env.local`.
