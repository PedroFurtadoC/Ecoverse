// Missão 2 — Bacia do Congo. Implementação a cargo de André.
// Contrato e exemplos: src/js/modules/minigames/README.md



import {
    CanvasMinigame,
    PersistenceStore,
    HUDController,
    ScoreSystem,
    ComboSystem,
    LivesSystem,
    ParticleSystem,
    GameTimer,
    GameOverlay,
    WaveSystem,
    MissionSystem,
    emojiSprite,
} from '../felipe/gamekit.js';

/* ═══════════════════════════════════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════════════════════════════════ */
const ASSETS_PATH   = '/assets/generated/cutouts/';
const TOTAL_SECONDS = 80;
const WIN_SCORE     = 60;
const FLY_FRAMES    = 50;   // frames da animação Bézier até a lixeira
const RESULT_FRAMES = 55;   // pausa pós-avaliação

/* ── Ondas — velocidade reduzida para dar mais tempo ao jogador ─────────
   Onda 1 começa MUITO devagar (0.22 px/frame ≈ cai ~8% do canvas por segundo).
   Onda 5 chega a 1.05 — mais fácil que a versão anterior (era 1.70).
   ─────────────────────────────────────────────────────────────────────── */
const WAVE_DEFS = [
    { fallSpeed: 0.20, pickFrames: 400, label: 'Devagar'   },
    { fallSpeed: 0.35, pickFrames: 320, label: 'Moderado'  },
    { fallSpeed: 0.53, pickFrames: 255, label: 'Rápido'    },
    { fallSpeed: 0.75, pickFrames: 195, label: 'Urgente'   },
    { fallSpeed: 1.00, pickFrames: 148, label: 'CRÍTICO!'  },
];

/* ── 8 tipos de e-waste ─────────────────────────────────────────────────
   Sprites existentes: waste-smartphone, waste-circuit-board, waste-battery.
   Demais itens usam src de fallback (são sobrescritos pelo emoji via _drawSprite
   quando o sprite não é o "certo" para aquele id).
   ─────────────────────────────────────────────────────────────────────── */
/** @type {Array<{id:string, src:string, label:string, correctBin:string, emoji:string, toxicAlert:string}>} */
const EWASTE_DEFS = [
    // ── Eletrônico ────────────────────────────────────────────────
    {
        id: 'smartphone', src: 'waste-smartphone.png',
        label: 'Smartphone',       correctBin: 'eletronic',
        emoji: '📱',
        toxicAlert: '⚠️ Contém ouro, cobre e cobalto — muito valiosos para reciclar!',
    },
    {
        id: 'circuit-board', src: 'waste-circuit-board.png',
        label: 'Placa de Circuito', correctBin: 'eletronic',
        emoji: '🔌',
        toxicAlert: '☣️ Queimar libera mercúrio e chumbo — risco de saúde pública!',
    },
    {
        id: 'laptop', src: 'waste-circuit-board.png',   // fallback — emoji 💻
        label: 'Notebook',          correctBin: 'eletronic',
        emoji: '💻',
        toxicAlert: '♻️ Notebooks contêm alumínio, cobre e terras-raras recicláveis.',
    },
    {
        id: 'monitor', src: 'waste-circuit-board.png',  // fallback — emoji 🖥️
        label: 'Monitor',           correctBin: 'eletronic',
        emoji: '🖥️',
        toxicAlert: '🔵 Telas antigas contêm chumbo — jamais quebre ou incinere!',
    },
    {
        id: 'headphones', src: 'waste-circuit-board.png', // fallback — emoji 🎧
        label: 'Fone de Ouvido',    correctBin: 'eletronic',
        emoji: '🎧',
        toxicAlert: '🔩 Metais raros nos ímãs — reciclagem recupera neodímio.',
    },
    {
        id: 'charger', src: 'waste-plastic-pet.png',    // fallback — emoji ⚡
        label: 'Carregador/Cabo',   correctBin: 'eletronic',
        emoji: '⚡',
        toxicAlert: '♻️ Carcaça plástica → separar do fio metálico antes de reciclar.',
    },
    {
        id: 'keyboard', src: 'waste-plastic-pet.png',   // fallback — emoji ⌨️
        label: 'Teclado',           correctBin: 'eletronic',
        emoji: '⌨️',
        toxicAlert: '🛍️ Plástico ABS do teclado é reciclável — não jogue no lixo!',
    },
    // ── Resíduo Perigoso ────────────────────────────────────────────────
    {
        id: 'battery', src: 'waste-battery.png',
        label: 'Bateria',           correctBin: 'trash',
        emoji: '🔋',
        toxicAlert: '🔴 Cádmio e lítio contaminam o solo por séculos — descarte especial!',
    },
    {
        id: 'pesticide', src: 'waste-pesticide-bottle.png',
        label: 'Pesticida',           correctBin: 'trash',
        emoji: '🧪',
        toxicAlert: '🔴 Pesticidas contaminam o solo e a água — descarte especial!',
    },
    // ── Metal ────────────────────────────────────────────────
    {
        id: 'can', src: 'waste-metal-can.png',
        label: 'Lata de Metal',           correctBin: 'metal',
        emoji: '🥫',
        toxicAlert: '♻️ Latas de metal são altamente recicláveis — descarte na lixeira certa!',
    },
    {
        id: 'nail', src: 'waste-nail.png',
        label: 'Prego',           correctBin: 'metal',
        emoji: '🔩',
        toxicAlert: '♻️ Pregos são feitos de aço — altamente recicláveis!',
    },
];

/* ── 3 Lixeiras ─────────────────────────────────────────────────────── */
/** @type {Array<{id:string, src:string, label:string, emoji:string, color:string, hoverColor:string}>} */
const BIN_DEFS = [
    { id: 'metal',   src: 'bin-metal.png',   label: 'Metal',  emoji: '🔩', color: '#37474f', hoverColor: '#78909c' },
    { id: 'eletronic',   src: 'bin-trash.png',   label: 'Resíduo Eletrônico',   emoji: '🪫', color: '#1a6e36', hoverColor: '#8abd9b' },
    { id: 'trash',   src: 'bin-trash.png',   label: 'Resíduo Perigoso',   emoji: '☣️', color: '#ffa622', hoverColor: '#ecc07e' },
];

/* ── Fatos educativos (exibidos entre ondas) ──────────────────────────── */
const EWASTE_FACTS = [
    '62 milhões de toneladas de e-waste em 2023 — o dobro do peso da Grande Muralha da China.',
    'Apenas 22% do lixo eletrônico global é formalmente reciclado (GEM 2024).',
    'Baterias descartadas no lixo comum liberam cádmio e lítio em lençóis freáticos.',
    'Placas de circuito queimadas a céu aberto liberam mercúrio e dioxinas no ar.',
    'Um smartphone tem mais de 60 elementos químicos: ouro, prata, cobalto e mais.',
    'A Bacia do Congo absorve ilegalmente toneladas de e-waste da Europa e dos EUA todo ano.',
    'Reciclar 1 tonelada de celulares recupera ~340 g de ouro — 40× mais que minério bruto.',
    'O chumbo de monitores antigos pode intoxicar crianças que brincam em terrenos contaminados.',
];

/* ── Missões ─────────────────────────────────────────────────────────── */
const MISSION_DEFS = [
    { id: 'catch5',  text: 'Triaje 5 seguidos',    type: 'consecutive_catch', target: 5,  reward: { pts: 20 } },
    { id: 'catch10', text: 'Triaje 10 itens',       type: 'total_catch',       target: 10, reward: { pts: 25 } },
    { id: 'combo4',  text: 'Alcance combo ×4',      type: 'reach_combo',       target: 4,  reward: { pts: 30 } },
    { id: 'survive', text: 'Sobreviva 25 segundos', type: 'survive_frames',    target: 1500, reward: { pts: 35 } },
];

/* ═══════════════════════════════════════════════════════════════════════
   Utilitário: Bézier quadrática
   ═══════════════════════════════════════════════════════════════════════ */
function bezier2(t, p0, p1, p2) {
    const mt = 1 - t;
    return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
    };
}

/* ═══════════════════════════════════════════════════════════════════════
   Classe principal
   ═══════════════════════════════════════════════════════════════════════ */
export class Modulo2 extends CanvasMinigame {
    /**
     * @param {HTMLElement} containerElement
     * @param {Function} onGameEnd  callback({ success: boolean, finalScore: number })
     * @param {Object} [options]
     */
    constructor(containerElement, onGameEnd, options = {}) {
        super(containerElement, onGameEnd, options);

        /** @type {'idle'|'flying'|'result'|'missed'} */
        this.state          = 'idle';
        /** @type {{ def: Object, x: number, y: number, pickTimer: number }|null} */
        this.currentItem    = null;
        this.flyProgress    = 0;
        this.resultFrames   = 0;
        this.lastCorrect    = false;
        this.flyTarget      = null;
        /** ID do bin correto do último item (salvo antes de nullar currentItem) */
        this.lastCorrectBinId = null;

        // Parâmetros da onda atual
        this.fallSpeed   = WAVE_DEFS[0].fallSpeed;
        this.pickFrames  = WAVE_DEFS[0].pickFrames;
        this.inWaveBreak = false;
        this.factIndex   = 0;

        this.hoveredBin     = -1;
        this.mouseX         = 0;
        this.mouseY         = 0;
        this.bgCache        = null;
        this.bgCacheW       = 0;
        this.smokeParticles = [];

        this.totalItems  = 0;
        this.wrongCount  = 0;
        this.missedCount = 0;

        this._store = new PersistenceStore('m2');
        /** @type {Record<string, HTMLImageElement>} */
        this._imgs  = {};
    }

    /* ── Assets ─────────────────────────────────────────────────────── */
    _loadImage(src) {
        if (!this._imgs[src]) {
            const img = new Image();
            img.src   = ASSETS_PATH + src;
            this._imgs[src] = img;
        }
        return this._imgs[src];
    }

    _preloadAssets() {
        const srcs = new Set([...EWASTE_DEFS.map(t => t.src), ...BIN_DEFS.map(b => b.src)]);
        for (const s of srcs) this._loadImage(s);
    }

    /**
     * Desenha sprite carregado OU fallback emoji.
     * Se o src for de outro item (reutilizado como fallback de arquivo),
     * prefere sempre o emoji para não confundir o jogador.
     */
    _drawSprite(ctx, itemDef, cx, cy, w, h) {
        // Só usa o sprite real se o src for o arquivo "canônico" do item
        const isCanonical = itemDef.src.includes(itemDef.id.replace('-', '-'));
        const img = this._imgs[itemDef.src];
        const useImg = isCanonical && img && img.complete && img.naturalWidth > 0;

        if (useImg) {
            ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
        } else {
            const size = Math.min(w, h) * 0.72;
            ctx.drawImage(emojiSprite(itemDef.emoji, size),
                Math.round(cx - size), Math.round(cy - size));
        }
    }

    /** Versão para lixeiras (sem lógica de canonical). */
    _drawBinSprite(ctx, binDef, cx, cy, w, h) {
        const img = this._imgs[binDef.src];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
        } else {
            const size = Math.min(w, h) * 0.72;
            ctx.drawImage(emojiSprite(binDef.emoji, size),
                Math.round(cx - size), Math.round(cy - size));
        }
    }

    /* ── Posicionamento ─────────────────────────────────────────────── */

    /** 3 lixeiras no fundo, distribuídas em 18 % · 50 % · 82 %. */
    _getBinPositions() {
        const W  = this.canvas.width;
        const H  = this.canvas.height;
        const BW = Math.round(W * 0.14);
        const BH = Math.round(BW * 1.25);
        const yBase = H - BH - Math.round(H * 0.08);
        return BIN_DEFS.map((def, i) => ({
            def,
            x:  Math.round(W * (0.18 + i * 0.32)),
            y:  yBase,
            w:  BW,
            h:  BH,
        }));
    }

    /** Y inicial dos itens (topo). */
    _getItemSpawnY() { return Math.round(this.canvas.height * 0.10); }

    /** Y do "solo" — se o item passar daqui sem triagem, perde vida. */
    _getMissThreshold() {
        const bins = this._getBinPositions();
        return bins[0].y - 20;
    }

    /* ── Start ──────────────────────────────────────────────────────── */
    start() {
        const best = this._store.getInt('best_score', 0);

        this.container.innerHTML = `
        <style>
            .m2-wrap {
                position: relative; width: 100%;
                display: flex; flex-direction: column; align-items: center;
                background: #060e06; border-radius: 12px;
                overflow: hidden; user-select: none; font-family: sans-serif;
            }
            .m2-hud {
                display: flex; justify-content: space-between; align-items: center;
                width: 100%; padding: 0.45rem 1.2rem; box-sizing: border-box;
                background: rgba(0,0,0,0.60); color: #d0f0d0;
                font-size: 0.88rem; gap: 0.4rem; flex-wrap: wrap;
            }
            .m2-hud strong  { color: #7df0c8; }
            .m2-hud-item    { display: flex; align-items: center; gap: 0.3rem; }
            .m2-combo {
                font-size: 0.95rem; font-weight: 900; color: #ffd600;
                min-width: 64px; text-align: center; transition: transform 0.1s;
            }
            .m2-combo.bump  { transform: scale(1.45); }
            .m2-wave-badge  {
                padding: 2px 10px; border-radius: 12px;
                background: rgba(77,208,225,0.18);
                color: #4dd0e1; font-weight: 700; font-size: 0.80rem;
            }
            .m2-mission-bar {
                width: 100%; padding: 0.22rem 1.2rem; box-sizing: border-box;
                background: rgba(0,0,0,0.40); display: flex; align-items: center;
                gap: 0.55rem; font-size: 0.76rem; color: #80c8a0;
            }
            .m2-mission-track {
                flex: 1; height: 5px; background: rgba(255,255,255,0.08);
                border-radius: 3px; overflow: hidden;
            }
            .m2-mission-fill {
                height: 100%; background: #ffd600;
                border-radius: 3px; transition: width 0.3s;
            }
            /* Barra de tempo do item — fica entre HUD e canvas */
            .m2-pick-bar-wrap { width: 100%; height: 6px; background: rgba(255,255,255,0.06); }
            #m2-pick-bar      { height: 100%; width: 100%; background: #7df0c8; transition: background 0.3s; }
            #m2-canvas        { cursor: crosshair; display: block; max-width: 100%; }
            .m2-tip {
                color: #3a6a4a; font-size: 0.74rem;
                padding: 0.26rem 0.8rem; text-align: center;
            }
            .m2-tip strong { color: #7dc898; }
        </style>
        <div class="m2-wrap">
            <div class="m2-hud">
                <div class="m2-hud-item">Pontos: <strong id="m2-score">0</strong></div>
                <div class="m2-hud-item">Combo: <span class="m2-combo" id="m2-combo">—</span></div>
                <div class="m2-hud-item" id="m2-hearts">❤️❤️❤️❤️❤️</div>
                <div class="m2-hud-item"><span class="m2-wave-badge" id="m2-wave">Onda 1</span></div>
                <div class="m2-hud-item">Tempo: <strong id="m2-timer">${TOTAL_SECONDS}</strong>s</div>
                <div class="m2-hud-item" id="m2-best-wrap" style="${best > 0 ? '' : 'display:none'}">
                    🏆 <strong id="m2-best">${best}</strong>
                </div>
            </div>
            <div class="m2-mission-bar">
                <span>🎯 <span id="m2-mission-text">—</span></span>
                <div class="m2-mission-track">
                    <div class="m2-mission-fill" id="m2-mission-fill" style="width:0%"></div>
                </div>
                <span id="m2-mission-prog">—</span>
            </div>
            <div class="m2-pick-bar-wrap"><div id="m2-pick-bar"></div></div>
            <canvas id="m2-canvas"></canvas>
            <p class="m2-tip">
                Clique na <strong>lixeira certa</strong> antes do e-waste tocar o solo!
                ☣️ Descarte correto evita mercúrio e chumbo no Congo.
            </p>
        </div>
        `;

        this._setupCanvas(this.container.querySelector('#m2-canvas'), 0.52);
        this._preloadAssets();

        this.hud = new HUDController(this.container, {
            score:       '#m2-score',
            combo:       '#m2-combo',
            hearts:      '#m2-hearts',
            timer:       '#m2-timer',
            wave:        '#m2-wave',
            best:        '#m2-best',
            bestWrap:    '#m2-best-wrap',
            missionText: '#m2-mission-text',
            missionFill: '#m2-mission-fill',
            missionProg: '#m2-mission-prog',
            pickBar:     '#m2-pick-bar',
        });

        this.lives    = new LivesSystem(5, this.hud, 'hearts');
        this.combo    = new ComboSystem(
            [{ min: 6, multiplier: 3 }, { min: 3, multiplier: 2 }, { min: 0, multiplier: 1 }],
            200,
        );
        this.score    = new ScoreSystem(this._store, 'best_score', this.combo);
        this.parts    = new ParticleSystem();
        this.timer    = new GameTimer(TOTAL_SECONDS, this.hud, 'timer');
        this.waves    = new WaveSystem(WAVE_DEFS, { waveDuration: 11000, breakDuration: 3500 });
        this.missions = new MissionSystem(MISSION_DEFS);

        this._wireEvents();

        this.canvas.addEventListener('mousemove', e => {
            const { x, y } = this._canvasCoords(e);
            this.mouseX = x; this.mouseY = y;
            this._updateHoveredBin();
        });
        this.canvas.addEventListener('click', e => {
            const { x, y } = this._canvasCoords(e);
            this.mouseX = x; this.mouseY = y;
            this._handleClick();
        });
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const { x, y } = this._canvasCoords(e.touches[0]);
            this.mouseX = x; this.mouseY = y;
            this._updateHoveredBin();
        }, { passive: false });
        this.canvas.addEventListener('touchend', e => {
            e.preventDefault();
            const { x, y } = this._canvasCoords(e.changedTouches[0]);
            this.mouseX = x; this.mouseY = y;
            this._handleClick();
        }, { passive: false });

        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);
        this.fallSpeed   = WAVE_DEFS[0].fallSpeed;
        this.pickFrames  = WAVE_DEFS[0].pickFrames;
        this.factIndex   = Math.floor(Math.random() * EWASTE_FACTS.length);
        this.gameActive  = true;

        this._spawnNextItem();
        this.timer.start();
        this.missions.start();
        this.waves.start();
        this.gameLoop();
    }

    /* ── Eventos ────────────────────────────────────────────────────── */
    _wireEvents() {
        this.score.on('changed', val => this.hud.setText('score', val));
        this.combo.on('increment', () => {
            this._syncComboHUD();
            this.missions.notifyCombo(this.combo.combo);
        });
        this.combo.on('broken', () => this._syncComboHUD());
        this.timer.on('expired', () => this.endGame(false));

        this.waves.on('waveStart', (num, def) => {
            this.fallSpeed   = def.fallSpeed;
            this.pickFrames  = def.pickFrames;
            this.inWaveBreak = false;
            this.hud.setText('wave', `Onda ${num} — ${def.label}`);
            this.parts.spawnFloat(this.canvas.width / 2, 55,
                `🌊 Onda ${num}!`, '#4dd0e1', 15);
        });
        this.waves.on('breakStart', () => {
            this.inWaveBreak = true;
            this.factIndex++;
        });

        this.missions.on('new', (m) => {
            this.hud.setText('missionText', m.text);
            this.hud.setStyle('missionFill', 'width', '0%');
            this.hud.setText('missionProg', `0/${m.target}`);
        });
        this.missions.on('progress', (_m, cur, target) => {
            this.hud.setStyle('missionFill', 'width',
                `${Math.min(100, Math.round((cur / target) * 100))}%`);
            this.hud.setText('missionProg', `${cur}/${target}`);
        });
        this.missions.on('completed', (m) => {
            if (m.reward?.pts) {
                this.score.add(m.reward.pts);
                this.parts.spawnFloat(this.canvas.width / 2, 60,
                    `🎯 Missão! +${m.reward.pts} pts`, '#ffd600', 15);
            }
        });
    }

    _syncComboHUD() {
        if (this.combo.isActive()) {
            const mult  = this.combo.getMultiplier();
            const color = mult >= 3 ? '#ff6b35' : mult >= 2 ? '#ffd600' : '#7df0c8';
            this.hud.setText('combo', `×${this.combo.combo} (×${mult})`);
            this.hud.setStyle('combo', 'color', color);
            this.hud.flashClass('combo', 'bump', 150);
        } else {
            this.hud.setText('combo', '—');
            this.hud.setStyle('combo', 'color', '#ffd600');
        }
    }

    /* ── Spawn e interação ──────────────────────────────────────────── */
    _spawnNextItem() {
        const def        = EWASTE_DEFS[Math.floor(Math.random() * EWASTE_DEFS.length)];
        this.currentItem = {
            def,
            x:         Math.round(this.canvas.width / 2),
            y:         this._getItemSpawnY(),
            pickTimer: this.pickFrames,
        };
        this.state       = 'idle';
        this.flyProgress = 0;
        this.flyTarget   = null;
    }

    _updateHoveredBin() {
        if (this.state !== 'idle') { this.hoveredBin = -1; return; }
        const bins = this._getBinPositions();
        this.hoveredBin = -1;
        for (let i = 0; i < bins.length; i++) {
            const b = bins[i];
            if (Math.abs(this.mouseX - b.x) < b.w / 2 + 16 &&
                Math.abs(this.mouseY - (b.y + b.h / 2)) < b.h / 2 + 16) {
                this.hoveredBin = i;
                break;
            }
        }
    }

    _handleClick() {
        if (!this.gameActive || this.state !== 'idle' || this.hoveredBin < 0) return;
        const bins   = this._getBinPositions();
        const bin    = bins[this.hoveredBin];
        const item   = this.currentItem;
        const endY   = bin.y + bin.h / 2;
        const ctrlX  = (item.x + bin.x) / 2 + (Math.random() - 0.5) * this.canvas.width * 0.12;
        const ctrlY  = (item.y + endY)   / 2 - this.canvas.height * 0.12;

        this.flyTarget = {
            binIdx: this.hoveredBin,
            binDef: bin.def,
            startX: item.x,
            startY: item.y,
            endX:   bin.x,
            endY,   ctrlX, ctrlY,
        };
        this.state       = 'flying';
        this.flyProgress = 0;
        this.totalItems++;
    }

    /* ── Update ─────────────────────────────────────────────────────── */
    update() {
        this.parts.update();
        this.combo.tick();
        this.missions.tick();
        this._updateSmoke();

        if (this.state === 'idle') {
            if (!this.currentItem) return;
            const item = this.currentItem;

            // Queda gradual durante o estado idle
            if (!this.inWaveBreak) {
                item.y        += this.fallSpeed;
                item.pickTimer--;
            }

            // Atualiza barra de pick-timer
            const pct   = Math.max(0, item.pickTimer / this.pickFrames);
            const color = pct > 0.5 ? '#7df0c8' : pct > 0.25 ? '#ffd600' : '#ff5252';
            this.hud.setStyle('pickBar', 'width',      `${Math.round(pct * 100)}%`);
            this.hud.setStyle('pickBar', 'background', color);

            // Item chegou ao solo → miss
            if (item.y >= this._getMissThreshold() || item.pickTimer <= 0) {
                this._handleMiss();
            }

        } else if (this.state === 'flying') {
            this.flyProgress += 1 / FLY_FRAMES;
            if (this.flyProgress >= 1) {
                this.flyProgress = 1;
                this._evaluateThrow();
            } else {
                const t  = this.flyTarget;
                const pt = bezier2(this.flyProgress,
                    { x: t.startX, y: t.startY },
                    { x: t.ctrlX,  y: t.ctrlY  },
                    { x: t.endX,   y: t.endY   },
                );
                if (this.currentItem) { this.currentItem.x = pt.x; this.currentItem.y = pt.y; }
            }

        } else if (this.state === 'result' || this.state === 'missed') {
            this.resultFrames--;
            if (this.resultFrames <= 0) {
                if (this.lives.isDepleted()) this.endGame(true);
                else this._spawnNextItem();
            }
        }
    }

    /* ── Avaliação ──────────────────────────────────────────────────── */
    _evaluateThrow() {
        const correct = this.currentItem.def.correctBin === this.flyTarget.binDef.id;
        const bx      = this.flyTarget.endX;
        const by      = this.flyTarget.endY;

        // Salva o bin correto antes de nullar currentItem
        this.lastCorrectBinId = this.currentItem.def.correctBin;
        const alert           = this.currentItem.def.toxicAlert;

        if (correct) {
            this.combo.increment();
            const pts = this.score.add(10, true);
            this.parts.spawnRadial(bx, by, '#7df0c8', 10, 2, 5, 3, 7);
            this.parts.spawnFloat(bx, by, `+${pts} ✓`, '#7df0c8', 18);
            if (alert) {
                this.parts.spawnFloat(
                    this.canvas.width / 2, this.canvas.height * 0.42,
                    alert, '#a0d8ef', 11, -0.7,
                );
            }
            this.missions.notifyCatch(true);
            this.lastCorrect = true;
        } else {
            const prev = this.combo.combo;
            this.combo.breakCombo();
            this.wrongCount++;
            const dead = this.lives.lose();
            this.missions.notifyCatch(false);
            this.missions.notifyLifeLost();
            this.parts.spawnRadial(bx, by, '#ff5252', 8, 2, 4, 3, 6);
            const correctLabel = BIN_DEFS.find(b => b.id === this.lastCorrectBinId)?.label ?? '?';
            this.parts.spawnFloat(bx, by,
                prev > 1 ? '✗ combo perdido!' : `✗ vai em "${correctLabel}"!`,
                '#ff5252', 15,
            );
            this.lastCorrect = false;
            if (dead) {
                this.state = 'result'; this.resultFrames = 20;
                this.currentItem = null; return;
            }
        }

        this.state        = 'result';
        this.resultFrames = RESULT_FRAMES;
        this.currentItem  = null;
        this.hud.setStyle('pickBar', 'width', '100%');
        this.hud.setStyle('pickBar', 'background', '#7df0c8');
    }

    /** Item tocou o solo sem triagem. */
    _handleMiss() {
        const item = this.currentItem;
        const cx   = item.x;
        const cy   = this._getMissThreshold();

        this.combo.breakCombo();
        this.missedCount++;
        this.wrongCount++;
        this.score.subtract(3);
        const dead = this.lives.lose();
        this.missions.notifyCatch(false);
        this.missions.notifyLifeLost();
        this.parts.spawnBurst(cx, cy, '#ff9800', 12, 0.15);
        this.parts.spawnFloat(cx, cy, '💀 Item perdido! −vida', '#ff9800', 14);

        this.state        = 'missed';
        this.resultFrames = dead ? 20 : RESULT_FRAMES;
        this.currentItem  = null;
        this.hud.setStyle('pickBar', 'width', '0%');
    }

    /* ── Fumaça industrial (fundo animado) ──────────────────────────── */
    _updateSmoke() {
        if (Math.random() < 0.15) {
            this.smokeParticles.push({
                x:     this.canvas.width * (0.20 + Math.random() * 0.60),
                y:     this.canvas.height * 0.36,
                vx:    (Math.random() - 0.5) * 0.5,
                vy:    -(0.35 + Math.random() * 0.5),
                r:     4 + Math.random() * 6,
                alpha: 0.30 + Math.random() * 0.20,
            });
        }
        for (const p of this.smokeParticles) {
            p.x += p.vx; p.y += p.vy; p.r += 0.18; p.alpha -= 0.005;
        }
        this.smokeParticles = this.smokeParticles.filter(p => p.alpha > 0 && p.y > 0);
    }

    /* ── Draw: fundo industrial cacheado ────────────────────────────── */
    _drawBackground(ctx) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        if (!this.bgCache || this.bgCacheW !== W) {
            const oc = new OffscreenCanvas(W, H);
            const c  = oc.getContext('2d');

            // Céu noturno poluído
            const sky = c.createLinearGradient(0, 0, 0, H * 0.55);
            sky.addColorStop(0, '#060e06');
            sky.addColorStop(0.6, '#0a1a0a');
            sky.addColorStop(1, '#122212');
            c.fillStyle = sky; c.fillRect(0, 0, W, H);

            // Chaminés industriais
            c.fillStyle = '#1a1a1a';
            for (const [px, pw, ph] of [
                [W*0.20, W*0.040, H*0.25],
                [W*0.35, W*0.030, H*0.20],
                [W*0.60, W*0.040, H*0.22],
                [W*0.76, W*0.032, H*0.28],
            ]) {
                c.fillRect(px - pw / 2, H * 0.38 - ph, pw, ph);
            }

            // Floresta da Bacia do Congo (silhueta escura)
            c.fillStyle = '#0d1f0d';
            for (let tx = 0; tx < W; tx += Math.round(W * 0.042)) {
                const th = H * (0.08 + Math.random() * 0.10);
                const tw = W * (0.026 + Math.random() * 0.018);
                c.beginPath();
                c.moveTo(tx + tw / 2, H * 0.38 - th);
                c.lineTo(tx,          H * 0.38);
                c.lineTo(tx + tw,     H * 0.38);
                c.closePath(); c.fill();
            }

            // Solo / lama
            const ground = c.createLinearGradient(0, H * 0.38, 0, H);
            ground.addColorStop(0, '#1a2f1a');
            ground.addColorStop(1, '#0d1a0d');
            c.fillStyle = ground; c.fillRect(0, H * 0.38, W, H * 0.62);

            // Reflexo alaranjado do lixo eletrônico
            c.globalAlpha = 0.07; c.fillStyle = '#ff6600';
            c.fillRect(0, H * 0.55, W, H * 0.45); c.globalAlpha = 1;

            this.bgCache = oc; this.bgCacheW = W;
        }
        ctx.drawImage(this.bgCache, 0, 0);

        // Fumaça animada
        for (const p of this.smokeParticles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle   = '#3d4a3d';
            ctx.beginPath();
            ctx.arc(Math.round(p.x), Math.round(p.y), Math.round(p.r), 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /* ── Draw: lixeiras ─────────────────────────────────────────────── */
    _drawBins(ctx) {
        const bins = this._getBinPositions();
        for (let i = 0; i < bins.length; i++) {
            const b       = bins[i];
            const hovered = this.hoveredBin === i && this.state === 'idle';
            const scale   = hovered ? 1.10 : 1;

            ctx.save();
            ctx.translate(b.x, b.y + b.h / 2);
            ctx.scale(scale, scale);
            if (hovered) { ctx.shadowColor = b.def.hoverColor; ctx.shadowBlur = 22; }

            this._drawBinSprite(ctx, b.def, 0, 0, b.w, b.h);

            ctx.shadowBlur   = 0;
            ctx.globalAlpha  = hovered ? 1 : 0.72;
            ctx.fillStyle    = hovered ? '#ffffff' : '#88c8a0';
            ctx.font         = `bold ${Math.round(this.canvas.width * 0.021)}px sans-serif`;
            ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(b.def.label, 0, b.h / 2 + 4);
            ctx.restore();
        }
    }

    /* ── Draw: item de e-waste ──────────────────────────────────────── */
    _drawCurrentItem(ctx) {
        if (!this.currentItem) return;
        const it  = this.currentItem;
        const SZ  = Math.round(this.canvas.width * 0.10);

        ctx.save();
        ctx.translate(Math.round(it.x), Math.round(it.y));

        // Rotação leve durante a queda
        if (this.state === 'idle') {
            ctx.rotate(Math.sin(Date.now() * 0.0012) * 0.10);
        } else if (this.state === 'flying') {
            ctx.rotate(this.flyProgress * Math.PI * 4);
        }

        // Pulso vermelho quando tempo quase acabou
        if (this.state === 'idle' && it.pickTimer < this.pickFrames * 0.25) {
            ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.014) * 0.4;
        }

        this._drawSprite(ctx, it.def, 0, 0, SZ, SZ);
        ctx.restore();

        // Seta de urgência
        if (this.state === 'idle' && it.pickTimer < this.pickFrames * 0.25) {
            ctx.save();
            ctx.globalAlpha  = 0.55 + Math.sin(Date.now() * 0.020) * 0.4;
            ctx.fillStyle    = '#ff5252';
            ctx.font         = `${Math.round(this.canvas.width * 0.032)}px sans-serif`;
            ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText('⬇', it.x, it.y + SZ / 2 + 14);
            ctx.restore();
        }

        // Label do item
        if (this.state === 'idle') {
            ctx.save();
            ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
            ctx.fillStyle   = '#c8f0c8';
            ctx.font        = `bold ${Math.round(this.canvas.width * 0.026)}px sans-serif`;
            ctx.textAlign   = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(it.def.label, it.x, Math.round(it.y + SZ / 2 + 6));
            ctx.restore();
        }
    }

    /* ── Draw: marca ✓ / ✗ ─────────────────────────────────────────── */
    _drawResultMark(ctx) {
        if ((this.state !== 'result' && this.state !== 'missed') || !this.flyTarget) return;
        ctx.save();
        ctx.globalAlpha  = Math.min(1, this.resultFrames / 20);
        ctx.font         = `bold ${Math.round(this.canvas.width * 0.07)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle    = this.lastCorrect ? '#7df0c8' : '#ff5252';
        ctx.fillText(this.lastCorrect ? '✓' : '✗', this.flyTarget.endX, this.flyTarget.endY);
        ctx.restore();
    }

    /* ── Draw: highlight na lixeira CORRETA após erro ───────────────── */
    _drawCorrectBinHint(ctx) {
        if ((this.state !== 'result' && this.state !== 'missed') || this.lastCorrect || !this.lastCorrectBinId) return;
        const bins       = this._getBinPositions();
        const correctBin = bins.find(b => b.def.id === this.lastCorrectBinId);
        if (!correctBin) return;

        const alpha = (this.resultFrames / RESULT_FRAMES) * 0.85;
        const pulse  = 1 + Math.sin(Date.now() * 0.015) * 0.06;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#7df0c8';
        ctx.lineWidth   = 3;
        ctx.shadowColor = '#7df0c8';
        ctx.shadowBlur  = 12;
        ctx.beginPath();
        ctx.roundRect(
            correctBin.x - (correctBin.w * pulse) / 2 - 6,
            correctBin.y - 6,
            correctBin.w * pulse + 12,
            correctBin.h + 12,
            8,
        );
        ctx.stroke();
        ctx.shadowBlur   = 0;
        ctx.fillStyle    = '#7df0c8';
        ctx.font         = `bold ${Math.round(this.canvas.width * 0.030)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('👆', correctBin.x, correctBin.y - 2);
        ctx.font         = `${Math.round(this.canvas.width * 0.019)}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(`→ "${correctBin.def.label}"`, correctBin.x, correctBin.y + correctBin.h + 14);
        ctx.restore();
    }

    /* ── Draw: pausa entre ondas + fato educativo ───────────────────── */
    _drawWaveBreakOverlay(ctx) {
        if (!this.inWaveBreak) return;
        const W    = this.canvas.width;
        const H    = this.canvas.height;
        const prog = this.waves.breakProgress;
        const secs = this.waves.breakSecondsLeft;
        const fact = EWASTE_FACTS[this.factIndex % EWASTE_FACTS.length];

        ctx.save();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle   = '#000';
        ctx.fillRect(0, H * 0.25, W, H * 0.50);
        ctx.globalAlpha = 1;

        ctx.fillStyle    = '#4dd0e1';
        ctx.font         = `bold ${Math.round(W * 0.034)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(`⏳ Próxima onda em ${secs}s…`, W / 2, H * 0.35);

        // Fato educativo com quebra de linha automática
        ctx.fillStyle    = '#a8e0c8';
        ctx.font         = `${Math.round(W * 0.021)}px sans-serif`;
        const words = fact.split(' ');
        let line  = '';
        let lineY = H * 0.43;
        const maxW = W * 0.80;
        for (const word of words) {
            const test = line + (line ? ' ' : '') + word;
            if (ctx.measureText(test).width > maxW && line) {
                ctx.fillText(line, W / 2, lineY);
                line  = word;
                lineY += Math.round(W * 0.028);
            } else {
                line = test;
            }
        }
        if (line) ctx.fillText(line, W / 2, lineY);

        // Barra de progresso da pausa
        const bw = W * 0.42, bh = 6;
        const bx = (W - bw) / 2, by = H * 0.62;
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 3); ctx.fill();
        ctx.fillStyle = '#4dd0e1';
        ctx.beginPath(); ctx.roundRect(bx, by, bw * prog, bh, 3); ctx.fill();
        ctx.restore();
    }

    /* ── Draw: frame completo ───────────────────────────────────────── */
    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this._drawBackground(ctx);
        this._drawBins(ctx);
        this._drawCurrentItem(ctx);
        this._drawResultMark(ctx);
        this._drawCorrectBinHint(ctx);
        this._drawWaveBreakOverlay(ctx);
        this.parts.draw(ctx);
    }

    /* ── Fim de jogo ────────────────────────────────────────────────── */
    endGame(byHearts = false) {
        if (!this.gameActive) return;
        this.gameActive = false;
        this.timer.stop();
        this.waves.stop();
        this.stopLoop();
        this._clearAllTimers();
        this._dimCanvas(0.72);

        const sorted      = this.totalItems - this.wrongCount;
        const accuracy    = this.totalItems > 0
            ? Math.round((sorted / this.totalItems) * 100) : 0;
        const success     = !byHearts && this.score.score >= WIN_SCORE;
        const isNewRecord = this.score.saveRecord();
        if (success && !this.isReplay) this._store.setBool('completed', true);

        const wrapper = this.container.querySelector('.m2-wrap');
        const overlay = GameOverlay.show(wrapper, {
            title:      byHearts ? '💀 E-waste venceu desta vez!' : success ? '♻️ Congo mais seguro!' : '☣️ Contaminação ainda em curso...',
            titleColor: success ? '#7df0c8' : '#ff6b6b',
            rows: [
                GameOverlay.scoreRow(this.score.score),
                GameOverlay.comboRow(this.combo.maxCombo),
                { html: `<div style="color:#c0e8c0;font-size:0.88rem;">Triados corretamente: <strong style="color:#ffd600">${accuracy}% (${sorted}/${this.totalItems})</strong></div>` },
                { html: success
                    ? `<div style="color:#7df0c8;font-size:0.82rem;">🌿 Boa triagem evita mercúrio e chumbo no Congo!</div>`
                    : `<div style="color:#ff9080;font-size:0.82rem;">☣️ 62 mi t de e-waste geradas em 2023 (GEM 2024).</div>` },
            ],
            badges: [
                GameOverlay.recordBadge(isNewRecord && this.score.score > 0),
                GameOverlay.prevRecordBadge(this.score.bestScore, isNewRecord),
            ],
            buttons: [
                GameOverlay.replayButton('m2-btn-replay',
                    byHearts ? '🔁 Tentar Novamente' : '🔄 Jogar Novamente',
                    () => { GameOverlay.dismiss(overlay); this.restartGame(); },
                ),
                GameOverlay.continueButton('m2-btn-continue',
                    this.isReplay ? 'Voltar ao Mapa' : success ? 'Continuar' : 'Voltar ao Mapa',
                    success && !this.isReplay,
                    () => {
                        GameOverlay.dismiss(overlay);
                        this.finishGame(this.isReplay ? true : success, this.score.score);
                    },
                ),
            ],
            footer: !success && !this._store.getBool('completed')
                ? `Atinja ${WIN_SCORE} pts para desbloquear a próxima missão` : '',
        });
    }

    /* ── Reinício ───────────────────────────────────────────────────── */
    restartGame() {
        this._clearAllTimers();
        this.timer.stop();
        this.waves.stop();
        this.stopLoop();

        this.state            = 'idle';
        this.currentItem      = null;
        this.flyProgress      = 0;
        this.resultFrames     = 0;
        this.flyTarget        = null;
        this.lastCorrectBinId = null;
        this.hoveredBin       = -1;
        this.totalItems       = 0;
        this.wrongCount       = 0;
        this.missedCount      = 0;
        this.fallSpeed        = WAVE_DEFS[0].fallSpeed;
        this.pickFrames       = WAVE_DEFS[0].pickFrames;
        this.inWaveBreak      = false;
        this.smokeParticles   = [];
        this.bgCache          = null;
        this.factIndex        = Math.floor(Math.random() * EWASTE_FACTS.length);
        this.isReplay         = true;

        this.score.reset();
        this.combo.reset();
        this.lives.reset();
        this.parts.clear();
        this.timer.reset();
        this.waves.reset();
        this.missions.reset();

        this.hud.setText('score', 0);
        this.hud.setText('combo', '—');
        this.hud.setStyle('combo', 'color', '#ffd600');
        this.hud.setText('wave', 'Onda 1 — Devagar');
        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);
        this.hud.setStyle('pickBar', 'width', '100%');
        this.hud.setStyle('pickBar', 'background', '#7df0c8');

        this.gameActive = true;
        this._spawnNextItem();
        this.timer.start();
        this.missions.start();
        this.waves.start();
        this.gameLoop();
    }
}