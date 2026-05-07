# Demo de inspiração — Triagem de resíduos

> Este demo **não entra em produção**. Ele vive só nesta branch (`demo/triagem-inspiracao`) como referência pra equipe estudar como um minigame pode ser estruturado dentro do contrato do projeto.

## O que é

Um minigame jogável de triagem de resíduos:

- 8 rodadas em 60 segundos
- A cada rodada, um sprite de resíduo aparece no centro
- O jogador clica numa das 6 lixeiras CONAMA (Papel, Plástico, Metal, Vidro, Orgânico, Rejeito)
- Feedback imediato (correto/errado) + score final

Acessível via `http://localhost:3000/?demo=triagem`.

## Por que existe

Servir de referência viva pra André, Felipe, Pedro Borges e Thiago. Olhem o código pra entender:

- Como respeitar o contrato `class ModuloN { start(); finishGame() }`
- Como receber `container` e `onGameEnd` e usar
- Como construir UI dinâmica sem framework, só com `innerHTML` + listeners
- Como gerenciar estado interno (timer, rodada, score) numa instância
- Como usar os sprites de `public/assets/generated/cutouts/` direto via `<img>`
- Como aplicar CSS com prefixo (`demo-tri__`) pra evitar colisão
- Como dar feedback acessível com `aria-live`
- Como respeitar `prefers-reduced-motion` (a animação `demoTriItemIn` é desligada via `base.css`)

## Como reaproveitar a estrutura no seu minigame

1. Copie o esqueleto da classe (`triagem-demo.js`) pro seu `moduloN.js`.
2. Renomeie o CSS pra `minigame-<seudev>-<n>.css` e troque o prefixo das classes.
3. Substitua a mecânica de triagem pela mecânica do seu bioma.
4. **Não copie a rota `demo_triagem`** — ela não existe no `main` e seu minigame já tem rota própria (`andre_1`, `felipe_1`, etc.).

## Por que está numa branch separada

Pra manter o `main` limpo:

- O jogo "real" tem 8 missões, cada uma com seu próprio minigame da equipe.
- Esse demo é apenas educacional. Se ficasse no `main`, poderia confundir banca e UNAERP futura.
- Branch fica viva indefinidamente como referência. Não vai ser merged.

## Se quiser transformar em easter egg

Depois que os 8 minigames reais estiverem prontos, dá pra trazer este demo de volta como easter egg secreto, por exemplo, adicionar uma última conquista que apenas clicando nela libera o minigame e ao completar a conquista é liberada:

1. `git cherry-pick` os commits desta branch pro `main`.
2. Adicionar uma conquista oculta tipo `easter_egg_triagem` no `data.js`.
3. Quando o jogador completar o demo (`?demo=triagem`), desbloqueia.

Decisão pra fase final do projeto, não bloqueia o trabalho da equipe agora.
