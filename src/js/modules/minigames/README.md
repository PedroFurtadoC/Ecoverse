# Minigames

Ponto de partida para os 4 colegas. **Regra de ouro:** cada um mexe só nos próprios arquivos, dentro da pasta com o seu nome.

## Divisão

| Dev | Pasta | Missões |
|---|---|---|
| André | `andre/` | 1 (Amazônia) e 2 (Bacia do Congo) |
| Felipe | `felipe/` | 3 (Mata Atlântica) e 4 (Bornéu) |
| Pedro Borges | `pedro_borges/` | 5 (Madagascar) e 6 (Pantanal) |
| Thiago | `thiago/` | 7 (Grande Barreira) e 8 (Andes) |

A spec detalhada de cada par de minigames está no `README.md` dentro da pasta de cada dev.

## Contrato técnico

Toda classe `ModuloN` recebe um `container` (DIV vazia) e um `onGameEnd` (callback). Você implementa `start()` e chama `onGameEnd({ success, finalScore, perfect })` quando o jogo termina.

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

## Estilo do código

- CSS em arquivo próprio: `src/css/components/minigame-<dev>-<n>.css`. Importe no `src/css/main.css`.
- Classes com prefixo do dev: `.andre-1-canvas`, `.felipe-3-bin` — evita colisão entre módulos.
- Sem `window.<algo>` global. Use propriedades da classe ou `let`/`const` locais.
- Pointer events (`pointerdown`/`move`/`up`) cobrem mouse e touch — não use `mouse*`/`touch*` separados.
- Touch targets ≥ 44×44 px.
- Respeite `prefers-reduced-motion: reduce` nas animações.

## Como rodar e testar

1. `npm run dev` na raiz.
2. Abra `http://localhost:3000/?dev=free` (energia liberada, não precisa Pomodoro).
3. Clique no marcador da sua missão no globo → "Iniciar Missão".
4. Sua tela aparece — substitua o stub pela mecânica.
5. Edite o arquivo, recarregue (Vite faz HMR automático).

## Sprites

Versões com fundo transparente (prontas para o jogo) ficam em `public/assets/generated/cutouts/`. Originais com fundo branco ficam em `public/assets/generated/originals/`. A lista específica de sprites recomendados para cada missão está no README de cada dev.

Se precisar de um sprite que não existe, fale com o Pedro Furtado.

## Antes do PR

Veja o checklist em [`.github/PULL_REQUEST_TEMPLATE.md`](../../../.github/PULL_REQUEST_TEMPLATE.md) — aparece automaticamente quando você abre o PR.
