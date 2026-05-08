# Arquitetura

Aplicação single-page sem framework. Vite empacota em ESM. O código é dividido em três camadas:

1. **Estado global** (`src/js/store/`) — `state.js` é a única fonte de verdade do progresso do jogador; `events.js` é um event bus simples para desacoplar módulos.
2. **Módulos de domínio** (`src/js/modules/`) — Pomodoro, conquistas, quizzes ODS, roteador de minigames. Cada um expõe um objeto público (ex.: `Pomodoro.init()`, `MiniGames.open(...)`).
3. **Apresentação** (`src/js/main.js` + `src/css/`) — orquestra DOM, anima HUD, controla o globo, encadeia ações entre módulos via event bus.

## Fluxo principal

```
[loading]  → pré-carrega assets, baixa Globe.GL em paralelo
   ↓
[startGame]  → carrega estado salvo, init Pomodoro, monta globo
   ↓
[globo]  → marcadores HTML por missão; clicar abre modal
   ↓
[modal-mission]  → "Iniciar" gasta energia, dispara minigame
   ↓
[MiniGames.open(gameType, callback)]  → instancia ModuloN do dev
   ↓
[ModuloN.start()]  → joga, chama onGameEnd({success, perfect})
   ↓
[completeMission]  → credita moedas+CO₂, salva, planta árvores, atualiza globo
   ↓
[checkAchievements]  → desbloqueia conquistas se aplicável
```

Em paralelo, o Pomodoro emite `EVENTS.REWARD` e `EVENTS.POMODORO_COMPLETE` — `main.js` escuta para atualizar HUD e plantar uma árvore aleatória.

## Convenções

- **ESM** em todo lugar, paths relativos com extensão `.js`.
- **Português** para domínio (`plantTree`, `flyToMission`); **inglês** para técnico-genérico (`init`, `update`, `open`).
- **Event bus** para acoplamento de "notificação" (módulo A avisa, módulo B reage). Imports diretos só para contratos síncronos (`MiniGames.open()` chamado direto).
- **localStorage** é a fonte primária (chaves `ecoverse_save_v5` e `ecoverse_quiz_ods_v1`). Quando o Supabase está configurado, `services/sync.js` faz upsert com debounce de 2s sem alterar o localStorage.

## Build

`vite.config.js` separa `globe.gl` em chunk próprio (lazy-load via `import('globe.gl')` em `main.js`). Resultado típico:

- `index.js` — ~18 KB gzip (app)
- `globe.js` — ~519 KB gzip (Three.js + Globe.GL, lazy)
- `index.css` — ~7.5 KB gzip
- chunk Supabase — ~53 KB gzip (lazy quando o usuário loga)

Target ES2020. Cobre 95%+ dos navegadores atuais.
