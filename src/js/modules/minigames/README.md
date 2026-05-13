# Minigames

Cada missão do globo dispara um minigame temático sobre o problema de resíduos daquele bioma. As classes ficam separadas em pastas só pra evitar colisão de código durante o desenvolvimento — em tempo de execução o jogo roda como um único produto.

## Divisão por pasta

| Pasta | Missões |
|---|---|
| `andre/` | 1 (Amazônia) e 2 (Bacia do Congo) |
| `felipe/` | 3 (Mata Atlântica) e 4 (Bornéu) |
| `pedro_borges/` | 5 (Madagascar) e 6 (Pantanal) |
| `thiago/` | 7 (Grande Barreira) e 8 (Cordilheira dos Andes) |

Contexto e sprites disponíveis de cada missão estão no `README.md` dentro da pasta correspondente.

## Contrato técnico

Toda classe `ModuloN` recebe um `container` (DIV vazia) e um `onGameEnd` (callback). Implementa `start()` e chama `onGameEnd({ success, finalScore, perfect })` quando o jogo termina.

```js
export class Modulo1 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
  }

  start() {
    // construir UI, configurar listeners, iniciar a mecânica
  }
}
```

- `success: true` → missão completa, jogador ganha as moedas/CO₂.
- `success: false` → missão falhou, energia gasta é devolvida.
- `perfect: true` → pontuação máxima, conta para a conquista "Triagem Perfeita".

## Padrão visual

Pra que os 8 minigames tenham coerência entre si:

- Fundo: verde escuro `#0B2E1A` — cor base do app, definida em `src/css/variables.css`.
- Container do jogo: centralizado com `max-width` pra ficar bom em desktop.
- Pode haver textura ou overlay temático sutil sobre o fundo, sem comprometer legibilidade.

## Boas práticas

- CSS em arquivo próprio: `src/css/components/minigame-<pasta>-<n>.css`. Importe em `src/css/main.css`.
- Classes com prefixo da pasta: `.andre-1-canvas`, `.felipe-3-bin` — evita colisão entre módulos.
- Sem `window.<algo>` global. Use propriedades da classe ou `let`/`const` locais.
- Pointer events (`pointerdown`/`move`/`up`) cobrem mouse e touch — não use `mouse*`/`touch*` separados.
- Touch targets ≥ 44×44 px.
- Respeite `prefers-reduced-motion: reduce` nas animações.

## Como rodar e testar

1. `npm run dev` na raiz.
2. Abra `http://localhost:3000/?dev=free` (energia liberada, não precisa Pomodoro).
3. Clique no marcador da missão no globo → "Iniciar Missão".
4. A tela do minigame aparece — substitua o stub pela implementação.
5. Edite o arquivo e recarregue (o Vite faz HMR automático).

## Sprites

Versões com fundo transparente (prontas pra usar) em `public/assets/generated/cutouts/`. Originais com fundo branco em `public/assets/generated/originals/`. A lista específica de sprites já gerados para cada missão está no README dentro da pasta.

Se precisar de um sprite que ainda não existe, sinalize no canal do projeto.

## Antes do PR

Veja o checklist em [`.github/PULL_REQUEST_TEMPLATE.md`](../../../.github/PULL_REQUEST_TEMPLATE.md) — aparece automaticamente quando o PR é aberto.
