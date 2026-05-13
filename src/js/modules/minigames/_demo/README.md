# Easter egg — Triagem relâmpago

Minigame escondido. Não aparece no globo nem no menu — só abre se a pessoa
digitar **`ECO`** em qualquer tela da aplicação (fora de um campo de texto).

## Mecânica

- 8 rodadas em até 60 segundos
- A cada rodada, um sprite de resíduo aparece no centro
- O jogador clica numa das 6 lixeiras CONAMA (Papel, Plástico, Metal, Vidro, Orgânico, Rejeito)
- Feedback imediato (`Correto!` ou `Vai pro X`)
- Acertar ≥ 60% conta como sucesso e desbloqueia a conquista `egg_triagem`

## Como o trigger funciona

Em `src/js/main.js` há um `keydown` listener que acumula as últimas 3 letras
digitadas e dispara `openEasterEgg()` quando o buffer fecha em `eco`. O buffer
limpa em 1.2s sem tecla, o listener ignora `input/textarea`, e a sequência
só abre se nenhum outro minigame estiver ativo.

## Como o jogo se integra

Mesma interface dos outros minigames — passa pelo roteador `src/js/modules/minigames.js`
com a rota `egg_triagem`. Recebe `container` e `onGameEnd`, e chama
`onGameEnd({ success, finalScore, perfect })` quando termina. Por isso o botão
"Voltar" universal e o handler de ESC funcionam aqui também.

## Conquista

```js
{ id: 'egg_triagem', icon: '🥚', title: 'Caçador de Easter Egg', secret: true, ... }
```

`secret: true` faz a galeria mostrar `👀 Algo escondido…` em vez de `🔒 ???`
enquanto ela ainda não foi desbloqueada.
