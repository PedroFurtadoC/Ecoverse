# Minigames

Cada missão do globo dispara um minigame temático sobre o problema de resíduos daquele bioma. As classes ficam separadas em pastas só pra evitar colisão de código durante o desenvolvimento. Em tempo de execução o jogo roda como um único produto.

## Divisão por pasta

| Pasta | Missões |
|---|---|
| `andre/` | 1 (Amazônia) e 2 (Bacia do Congo) |
| `felipe/` | 3 (Mata Atlântica) e 4 (Bornéu) |
| `pedro_borges/` | 5 (Madagascar) e 6 (Pantanal) |
| `thiago/` | 7 (Grande Barreira) e 8 (Cordilheira dos Andes) |

Contexto e sprites disponíveis de cada missão estão no `README.md` dentro da pasta correspondente.

A infraestrutura compartilhada (`MinigameBase`, `CanvasMinigame`, sistemas de vidas, pontuação, partículas etc.) fica em `gamekit.js`, na raiz desta pasta, e não na pasta de nenhum dev: é usada pelos módulos 1 a 6. Importe com `from '../gamekit.js'`.

## Contrato técnico

Toda classe `ModuloN` recebe um `container` (DIV vazia) e um `onGameEnd` (callback). Implementa `start()` e `destroy()`, e chama `onGameEnd({ success, finalScore, perfect })` quando o jogo termina.

```js
export class Modulo1 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
  }

  start() {
    // construir UI, configurar listeners, iniciar a mecânica
  }

  destroy() {
    // parar laços e timers: o shell chama isso quando o jogador sai no meio
  }
}
```

- `success: true` → missão completa, jogador ganha as moedas/CO₂.
- `success: false` → missão falhou, energia gasta é devolvida.
- `perfect: true` → partida impecável, conta para as conquistas de triagem.

Quem estende `MinigameBase` não precisa calcular o `perfect`: o `finishGame` do gamekit já preenche sozinho, marcando true quando o jogador vence sem perder nenhuma vida. O critério sai do `LivesSystem` do próprio jogo, então cada minigame define a exigência pela dificuldade que já escolheu. Jogo que não usa `LivesSystem` nunca marca perfeito, o que é proposital: melhor não marcar do que marcar por engano.

As missões 7 e 8 são de sobrevivência: só terminam quando a barra de vida zera, então nunca reportam partida perfeita. Não é esquecimento, é o formato delas. As outras seis e a triagem relâmpago cobrem essas conquistas de sobra.

Se um minigame chamar `onGameEnd` direto, sem passar pelo gamekit, aí sim precisa mandar o campo por conta própria.

### Resultado depois de "Jogar novamente"

O `success` enviado é sempre o da partida que acabou de terminar, mesmo que o jogador tenha usado o "Jogar novamente" antes. Perdeu a revanche: `success: false` e a energia volta. Ganhou a revanche: `success: true` e a missão conclui. Use `GameOverlay.continueButton(id, success, onClick)`: o rótulo ("Continuar" ou "Voltar ao Mapa") sai do resultado, então fica igual em todos os jogos.

## Sair no meio da partida

O jogador pode fechar o minigame a qualquer momento pelo botão Voltar ou pelo Esc. Esse caminho não passa pelo fim de partida do jogo, então o shell chama `destroy()` antes de esconder a tela. Sem isso, o laço de animação continuaria rodando sobre um DOM já descartado e um resultado atrasado poderia encerrar por engano a missão aberta em seguida.

Quem estende `MinigameBase` já herda um `destroy()` que derruba a flag e libera tudo que foi registrado na base. Para isso, registre cada recurso com ciclo de vida pelo caminho da base, nunca direto:

| Recurso | Como criar |
|---|---|
| `setTimeout` / `setInterval` | `this._setTimeout(...)` / `this._setInterval(...)` |
| `GameTimer`, `WaveSystem`, `EventScheduler`, `InputController` | `this.timer = this._own(new GameTimer(...))` |
| Listener em `window` ou `document` | `this._listen(window, 'keydown', handler)` |

Listeners em elementos dentro do `container` não precisam disso: somem junto com o DOM do jogo.

Quem monta o jogo por fora do gamekit precisa escrever o seu `destroy()`, nem que seja só para desligar a flag que o laço consulta.

## Padrão visual

Pra que os 8 minigames tenham coerência entre si:

- Fundo: verde escuro `#0B2E1A`: cor base do app, definida em `src/css/variables.css`.
- Container do jogo: centralizado com `max-width` pra ficar bom em desktop.
- Pode haver textura ou overlay temático sutil sobre o fundo, sem comprometer legibilidade.

## Boas práticas

- CSS em arquivo próprio: `src/css/components/minigame-<pasta>-<n>.css`, importado em `src/css/main.css`. Nada de `<style>` dentro do `innerHTML`: ele é reinserido e reprocessado a cada partida.
- Classes e ids com um prefixo único do módulo, para não colidir entre jogos. Os módulos atuais usam `.m1-` a `.m6-`, `.thiago-7-`/`.thiago-8-` e `.demo-tri__`.
- Sem `window.<algo>` global. Use propriedades da classe ou `let`/`const` locais.
- Pointer events (`pointerdown`/`move`/`up`) cobrem mouse e touch, então não use `mouse*`/`touch*` separados.
- Touch targets ≥ 44×44 px.
- Respeite `prefers-reduced-motion: reduce` nas animações.

## Como rodar e testar

1. `npm run dev` na raiz.
2. Abra `http://localhost:3000/?dev=free` (energia liberada, não precisa Pomodoro).
3. Clique no marcador da missão no globo → "Iniciar Missão".
4. A tela do minigame aparece por cima do globo.
5. Edite o arquivo do módulo e salve. O Vite recarrega sozinho.

Os oito minigames estão implementados. Este guia serve pra quem for dar manutenção ou criar um novo módulo seguindo o mesmo contrato.

## Sprites

Versões com fundo transparente (prontas pra usar) em `public/assets/generated/cutouts/`. A lista específica de sprites já gerados para cada missão está no README dentro da pasta.

Os originais com fundo branco ficam em `design/sprites-originais/`, fora de `public/` de propósito: são material de origem para reeditar um sprite, não são servidos ao navegador. Tudo que está dentro de `public/` vai junto no deploy, então só entra ali o que o jogo realmente carrega.

Se precisar de um sprite que ainda não existe, sinalize no canal do projeto.

## Antes do PR

Veja o checklist em [`.github/PULL_REQUEST_TEMPLATE.md`](../../../../.github/PULL_REQUEST_TEMPLATE.md): aparece automaticamente quando o PR é aberto.
