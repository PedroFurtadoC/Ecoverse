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
    MissionSystem,
    emojiSprite,
} from '../felipe/gamekit.js';

/* ═══════════════════════════════════════════════════════════════════════
   Constantes de gameplay
   ═══════════════════════════════════════════════════════════════════════ */
const ASSETS_PATH   = '/assets/generated/cutouts/';
const THROW_FRAMES  = 52;   // frames do voo até a lixeira (~0.87 s a 60 fps)
const RESULT_FRAMES = 58;   // frames de pausa pós-avaliação
const WIN_SCORE     = 60;
const TOTAL_SECONDS = 60;

/* ── 11 Tipos de lixo ───────────────────────────────────────────────────
   correctBin deve corresponder a um id em BIN_DEFS (paper | plastic | metal | trash).
   Itens sem sprite próprio reutilizam outro arquivo e usam emoji como fallback visual.
   ─────────────────────────────────────────────────────────────────────── */
/** @type {Array<{id:string, src:string, label:string, correctBin:string, emoji:string}>} */
const TRASH_DEFS = [
  // ── Plástico ────────────────────────────────────────────────────────
  {
    id: "plastic-pet",
    src: "waste-plastic-pet.png",
    label: "Garrafa PET",
    correctBin: "plastic",
    emoji: "🍶",
  },
  {
    id: "microplastic",
    src: "waste-microplastic.png",
    label: "Microplástico",
    correctBin: "plastic",
    emoji: "🔵",
  },
  {
    id: "plastic-bag",
    src: "waste-plastic-bag.png",
    label: "Sacola Plástica",
    correctBin: "plastic",
    emoji: "🛍️",
  },
  {
    id: "styrofoam",
    src: "waste-styrofoam.png",
    label: "Isopor",
    correctBin: "plastic",
    emoji: "🥤",
  },

  // ── Papel / Papelão ─────────────────────────────────────────────────
  {
    id: "newspaper",
    src: "waste-paper-newspaper.png",
    label: "Jornal",
    correctBin: "paper",
    emoji: "📰",
  },
  {
    id: "cardboard",
    src: "waste-cardboard.png",
    label: "Papelão",
    correctBin: "paper",
    emoji: "📦",
  },

  // ── Metal / Vidro ───────────────────────────────────────────────────
  {
    id: "glass-bottle",
    src: "waste-glass-jar.png",
    label: "Garrafa de Vidro",
    correctBin: "glass",
    emoji: "🍾",
  },
  {
    id: "aluminum-can",
    src: "waste-metal-can.png",
    label: "Lata de Alumínio",
    correctBin: "metal",
    emoji: "🥫",
  },
  {
    id: "oil-can",
    src: "waste-oil-can.png",
    label: "Lata de Óleo",
    correctBin: "metal",
    emoji: "🛢️",
  },

  // ── Lixo Geral / Rejeito ───────────────────────────────────────────
  {
    id: "fishing-net",
    src: "waste-fishing-net.png",
    label: "Rede de Pesca",
    correctBin: "trash",
    emoji: "🪝",
  },
  {
    id: "sponge",
    src: "waste-sponge.png",
    label: "Esponja",
    correctBin: "trash",
    emoji: "🧽",
  },
  {
    id: "banana-peel",
    src: "waste-banana-peel.png",
    label: "Casca de Banana",
    correctBin: "organic",
    emoji: "🍌",
  },
  {
    id: "apple-core",
    src: "waste-apple-core.png",
    label: "Caroço de Maçã",
    correctBin: "organic",
    emoji: "🍎",
  },
  {
    id: "eggshell",
    src: "waste-eggshell.png",
    label: "Casca de Ovo",
    correctBin: "organic",
    emoji: "🥚",
  },
];

/* ── 4 Lixeiras ─────────────────────────────────────────────────────────
   bin-metal.png é compartilhado com modulo2 — já existe nos assets.
   ─────────────────────────────────────────────────────────────────────── */
/** @type {Array<{id:string, src:string, label:string, emoji:string, color:string, hoverColor:string}>} */
const BIN_DEFS = [
    { id: 'paper',   src: 'bin-paper.png',   label: 'Papel',       emoji: '📰', color: '#1565c0', hoverColor: '#42a5f5' },
    { id: 'plastic', src: 'bin-plastic.png', label: 'Plástico',    emoji: '♻️', color: '#c62828', hoverColor: '#ef9a9a' },
    { id: 'metal',   src: 'bin-metal.png',   label: 'Metal',       emoji: '🔩', color: '#424242', hoverColor: '#90a4ae' },
    { id: 'glass',   src: 'bin-glass.png',   label: 'Vidro',       emoji: '🍷', color: '#4dad65', hoverColor: '#78909c' },
    { id: 'trash',   src: 'bin-trash.png',   label: 'Lixo Geral',  emoji: '🗑️', color: '#191c1d', hoverColor: '#78909c' },
    { id: 'organic', src: 'bin-organic.png', label: 'Orgânico',    emoji: '🍒', color: '#ad6200', hoverColor: '#78909c' },
];

/* ── Missões ─────────────────────────────────────────────────────────── */
const MISSION_DEFS = [
    { id: 'catch5',  text: 'Acerte 5 seguidos',  type: 'consecutive_catch', target: 5,  reward: { pts: 20 } },
    { id: 'catch12', text: 'Descarte 12 itens',  type: 'total_catch',       target: 12, reward: { pts: 30 } },
    { id: 'combo3',  text: 'Alcance combo ×3',   type: 'reach_combo',       target: 3,  reward: { pts: 25 } },
    { id: 'catch20', text: 'Descarte 20 itens',  type: 'total_catch',       target: 20, reward: { pts: 40 } },
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
export class Modulo1 extends CanvasMinigame {
    /**
     * @param {HTMLElement} containerElement
     * @param {Function} onGameEnd  callback({ success: boolean, finalScore: number })
     * @param {Object} [options]
     */
    constructor(containerElement, onGameEnd, options = {}) {
        super(containerElement, onGameEnd, options);

        /** @type {'idle'|'throwing'|'result'} */
        this.state            = 'idle';
        /** @type {{ def: Object, x: number, y: number, wobble: number }|null} */
        this.currentTrash     = null;
        this.throwProgress    = 0;
        this.resultFrames     = 0;
        this.lastCorrect      = false;
        this.throwTarget      = null;
        /** ID da lixeira correta do último arremesso — usado na dica de erro */
        this.lastCorrectBinId = null;

        this.hoveredBin  = -1;
        this.mouseX      = 0;
        this.mouseY      = 0;
        this.riverPhase  = 0;
        this.bgCache     = null;
        this.bgCacheW    = 0;

        this.totalThrown = 0;
        this.wrongCount  = 0;

        this._store = new PersistenceStore('m1');
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
        // Deduplica srcs — vários itens podem reutilizar o mesmo arquivo
        const srcs = new Set([...TRASH_DEFS.map(t => t.src), ...BIN_DEFS.map(b => b.src)]);
        for (const s of srcs) this._loadImage(s);
    }

    /**
     * Desenha sprite carregado ou fallback emoji via OffscreenCanvas.
     */
    _drawSprite(ctx, src, emoji, cx, cy, w, h) {
        const img = this._imgs[src];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
        } else {
            const size = Math.min(w, h) * 0.72;
            ctx.drawImage(emojiSprite(emoji, size), Math.round(cx - size), Math.round(cy - size));
        }
    }

    /* ── Posicionamento ─────────────────────────────────────────────── */

    /**
     * 4 lixeiras distribuídas no topo em 12 % · 37 % · 62 % · 87 %.
     * @returns {Array<{def:Object, x:number, y:number, w:number, h:number}>}
     */
    _getBinPositions() {
        const W    = this.canvas.width;
        const H    = this.canvas.height;
        const n    = BIN_DEFS.length;                  // funciona para 4, 5, 6...
        const BW   = Math.round(W / (n + 1) * 0.72);  // largura proporcional
        const BH   = Math.round(BW * 1.30);
        const topY = Math.round(H * 0.06);
        const step = W / (n + 1);                       // espaçamento uniforme

        return BIN_DEFS.map((def, i) => ({
            def,
            x:  Math.round(step * (i + 1)),
            y:  topY,
            w:  BW,
            h:  BH,
        }));
}

    /** Posição do item flutuando no rio (centro-inferior). */
    _getItemSpawnPos() {
        return {
            x: Math.round(this.canvas.width  / 2),
            y: Math.round(this.canvas.height * 0.78),
        };
    }

    /* ── Start ──────────────────────────────────────────────────────── */
    start() {
        const best = this._store.getInt('best_score', 0);

        this.container.innerHTML = `
        <style>
            .m1-wrap {
                position: relative; width: 100%;
                display: flex; flex-direction: column; align-items: center;
                background: #0a1e30; border-radius: 12px;
                overflow: hidden; user-select: none; font-family: sans-serif;
            }
            .m1-hud {
                display: flex; justify-content: space-between; align-items: center;
                width: 100%; padding: 0.45rem 1.2rem; box-sizing: border-box;
                background: rgba(0,0,0,0.55); color: #d0eeff;
                font-size: 0.88rem; gap: 0.4rem; flex-wrap: wrap;
            }
            .m1-hud strong  { color: #7df0c8; }
            .m1-hud-item    { display: flex; align-items: center; gap: 0.3rem; }
            .m1-combo {
                font-size: 0.95rem; font-weight: 900; color: #ffd600;
                min-width: 64px; text-align: center; transition: transform 0.1s;
            }
            .m1-combo.bump  { transform: scale(1.45); }
            .m1-mission-bar {
                width: 100%; padding: 0.22rem 1.2rem; box-sizing: border-box;
                background: rgba(0,0,0,0.35); display: flex; align-items: center;
                gap: 0.55rem; font-size: 0.76rem; color: #9dd8f5;
            }
            .m1-mission-track {
                flex: 1; height: 5px; background: rgba(255,255,255,0.10);
                border-radius: 3px; overflow: hidden;
            }
            .m1-mission-fill {
                height: 100%; background: #ffd600;
                border-radius: 3px; transition: width 0.3s;
            }
            #m1-canvas { cursor: crosshair; display: block; max-width: 100%; }
            .m1-tip {
                color: #4a7fa0; font-size: 0.76rem;
                padding: 0.28rem 0.8rem; text-align: center;
            }
            .m1-tip strong { color: #8ac8e8; }
        </style>
        <div class="m1-wrap">
            <div class="m1-hud">
                <div class="m1-hud-item">Pontos: <strong id="m1-score">0</strong></div>
                <div class="m1-hud-item">Combo: <span class="m1-combo" id="m1-combo">—</span></div>
                <div class="m1-hud-item" id="m1-hearts">❤️❤️❤️❤️❤️</div>
                <div class="m1-hud-item">Tempo: <strong id="m1-timer">${TOTAL_SECONDS}</strong>s</div>
                <div class="m1-hud-item" id="m1-best-wrap" style="${best > 0 ? '' : 'display:none'}">
                    🏆 <strong id="m1-best">${best}</strong>
                </div>
            </div>
            <div class="m1-mission-bar">
                <span>🎯 <span id="m1-mission-text">—</span></span>
                <div class="m1-mission-track">
                    <div class="m1-mission-fill" id="m1-mission-fill" style="width:0%"></div>
                </div>
                <span id="m1-mission-prog">—</span>
            </div>
            <canvas id="m1-canvas"></canvas>
            <p class="m1-tip">
                Clique na <strong>lixeira correta</strong> para arremessar!
                🌊 Salve o Rio Amazonas — proteja botos e pirarucus!
            </p>
        </div>
        `;

        this._setupCanvas(this.container.querySelector('#m1-canvas'), 0.52);
        this._preloadAssets();

        this.hud = new HUDController(this.container, {
            score:       '#m1-score',
            combo:       '#m1-combo',
            hearts:      '#m1-hearts',
            timer:       '#m1-timer',
            best:        '#m1-best',
            bestWrap:    '#m1-best-wrap',
            missionText: '#m1-mission-text',
            missionFill: '#m1-mission-fill',
            missionProg: '#m1-mission-prog',
        });

        this.lives    = new LivesSystem(5, this.hud, 'hearts');
        this.combo    = new ComboSystem(
            [{ min: 6, multiplier: 3 }, { min: 3, multiplier: 2 }, { min: 0, multiplier: 1 }],
            200,
        );
        this.score    = new ScoreSystem(this._store, 'best_score', this.combo);
        this.parts    = new ParticleSystem();
        this.timer    = new GameTimer(TOTAL_SECONDS, this.hud, 'timer');
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
        this.gameActive = true;
        this._spawnNextItem();
        this.timer.start();
        this.missions.start();
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
        const def          = TRASH_DEFS[Math.floor(Math.random() * TRASH_DEFS.length)];
        const pos          = this._getItemSpawnPos();
        this.currentTrash  = { def, x: pos.x, y: pos.y, wobble: 0 };
        this.state         = 'idle';
        this.throwProgress = 0;
        this.throwTarget   = null;
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
        const bins    = this._getBinPositions();
        const bin     = bins[this.hoveredBin];
        const itemPos = this._getItemSpawnPos();
        const endY    = bin.y + bin.h / 2;
        const ctrlX   = (itemPos.x + bin.x) / 2;
        const ctrlY   = Math.min(itemPos.y, endY) - this.canvas.height * 0.30;

        this.throwTarget = {
            binIdx: this.hoveredBin,
            binDef: bin.def,
            startX: itemPos.x,
            startY: itemPos.y,
            endX:   bin.x,
            endY,   ctrlX, ctrlY,
        };
        this.state         = 'throwing';
        this.throwProgress = 0;
        this.totalThrown++;
    }

    /* ── Update ─────────────────────────────────────────────────────── */
    update() {
        this.riverPhase += 0.016;
        this.parts.update();
        this.combo.tick();
        this.missions.tick();

        if (this.currentTrash) this.currentTrash.wobble += 0.055;

        if (this.state === 'throwing') {
            this.throwProgress += 1 / THROW_FRAMES;
            if (this.throwProgress >= 1) {
                this.throwProgress = 1;
                this._evaluateThrow();
            } else {
                const t  = this.throwTarget;
                const pt = bezier2(this.throwProgress,
                    { x: t.startX, y: t.startY },
                    { x: t.ctrlX,  y: t.ctrlY  },
                    { x: t.endX,   y: t.endY   },
                );
                if (this.currentTrash) { this.currentTrash.x = pt.x; this.currentTrash.y = pt.y; }
            }
        } else if (this.state === 'result') {
            this.resultFrames--;
            if (this.resultFrames <= 0) {
                if (this.lives.isDepleted()) this.endGame(true);
                else this._spawnNextItem();
            }
        }
    }

    /* ── Avaliação do arremesso ─────────────────────────────────────── */
    _evaluateThrow() {
        const correct = this.currentTrash.def.correctBin === this.throwTarget.binDef.id;
        const bx      = this.throwTarget.endX;
        const by      = this.throwTarget.endY;

        // Salva o id CORRETO ANTES de nullar currentTrash (necessário para a dica)
        this.lastCorrectBinId = this.currentTrash.def.correctBin;

        if (correct) {
            this.combo.increment();
            const pts = this.score.add(10, true);
            this.parts.spawnRadial(bx, by, '#7df0c8', 10, 2, 5, 3, 7);
            this.parts.spawnFloat(bx, by, `+${pts} ✓`, '#7df0c8', 18);
            this.missions.notifyCatch(true);
            this.lastCorrect = true;
        } else {
            const prevCombo   = this.combo.combo;
            this.combo.breakCombo();
            this.wrongCount++;
            const dead        = this.lives.lose();
            this.missions.notifyCatch(false);
            this.missions.notifyLifeLost();
            this.parts.spawnRadial(bx, by, '#ff5252', 8, 2, 4, 3, 6);
            const correctLabel = BIN_DEFS.find(b => b.id === this.lastCorrectBinId)?.label ?? '?';
            this.parts.spawnFloat(bx, by,
                prevCombo > 1 ? '✗ combo perdido!' : `✗ vai em "${correctLabel}"!`,
                '#ff5252', 15,
            );
            this.lastCorrect = false;
            if (dead) {
                this.state = 'result'; this.resultFrames = 20;
                this.currentTrash = null; return;
            }
        }

        this.state        = 'result';
        this.resultFrames = RESULT_FRAMES;
        this.currentTrash = null;
    }

    /* ── Draw: fundo amazônico cacheado ─────────────────────────────── */
    _drawBackground(ctx) {
        const W = this.canvas.width;
        const H = this.canvas.height;

        if (!this.bgCache || this.bgCacheW !== W) {
            const oc = new OffscreenCanvas(W, H);
            const c  = oc.getContext('2d');

            // Céu
            const sky = c.createLinearGradient(0, 0, 0, H * 0.22);
            sky.addColorStop(0, '#0d2b45'); sky.addColorStop(1, '#1565c0');
            c.fillStyle = sky; c.fillRect(0, 0, W, H * 0.22);

            // Floresta nas margens
            c.fillStyle = '#1b5e20'; c.fillRect(0, H * 0.18, W, H * 0.10);
            c.fillStyle = '#2e7d32'; c.fillRect(0, H * 0.14, W, H * 0.06);

            // Árvores (triângulos)
            c.fillStyle = '#1b5e20';
            for (const [px, s] of [
                [W*0.03,0.85],[W*0.10,1.10],[W*0.18,0.95],[W*0.26,0.80],
                [W*0.74,1.00],[W*0.82,0.90],[W*0.90,1.15],[W*0.97,0.88],
            ]) {
                c.beginPath(); c.moveTo(px,H*0.19); c.lineTo(px-13*s,H*0.25); c.lineTo(px+13*s,H*0.25); c.closePath(); c.fill();
                c.beginPath(); c.moveTo(px,H*0.13); c.lineTo(px-10*s,H*0.20); c.lineTo(px+10*s,H*0.20); c.closePath(); c.fill();
            }

            // Rio
            const river = c.createLinearGradient(0, H*0.26, 0, H);
            river.addColorStop(0, '#0d47a1'); river.addColorStop(1, '#01579b');
            c.fillStyle = river; c.fillRect(0, H*0.26, W, H*0.74);

            this.bgCache = oc; this.bgCacheW = W;
        }
        ctx.drawImage(this.bgCache, 0, 0);

        // Ondas animadas do rio
        const riverTop = this.canvas.height * 0.26;
        ctx.save();
        ctx.beginPath(); ctx.rect(0, riverTop, W, this.canvas.height - riverTop); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5;
        for (let row = 0; row < 5; row++) {
            const wy = riverTop + (this.canvas.height - riverTop) * (0.10 + row * 0.18);
            ctx.beginPath();
            for (let x = 0; x <= W; x += 10) {
                const sy = wy + Math.sin(x * 0.022 + this.riverPhase + row * 1.1) * 3.5;
                x === 0 ? ctx.moveTo(x, sy) : ctx.lineTo(x, sy);
            }
            ctx.stroke();
        }
        ctx.restore();
    }

    /* ── Draw: 4 lixeiras ───────────────────────────────────────────── */
    _drawBins(ctx) {
        const bins = this._getBinPositions();
        for (let i = 0; i < bins.length; i++) {
            const b       = bins[i];
            const hovered = this.hoveredBin === i && this.state === 'idle';
            const scale   = hovered ? 1.10 : 1;

            ctx.save();
            ctx.translate(b.x, b.y + b.h / 2);
            ctx.scale(scale, scale);
            if (hovered) { ctx.shadowColor = b.def.hoverColor; ctx.shadowBlur = 20; }

            this._drawSprite(ctx, b.def.src, b.def.emoji, 0, 0, b.w, b.h);

            ctx.shadowBlur   = 0;
            ctx.globalAlpha  = hovered ? 1 : 0.78;
            ctx.fillStyle    = hovered ? '#ffffff' : '#b3d8f5';
            const labelSize = Math.max(8, Math.round(this.canvas.width / BIN_DEFS.length * 0.12));
            ctx.font = `bold ${labelSize}px sans-serif`;            ctx.textAlign    = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(b.def.label, 0, b.h / 2 + 3);
            ctx.restore();
        }
    }

    /* ── Draw: item de lixo ─────────────────────────────────────────── */
    _drawCurrentItem(ctx) {
        if (!this.currentTrash) return;
        const it  = this.currentTrash;
        const SZ  = Math.round(this.canvas.width * 0.10);
        const bob = this.state === 'idle' ? Math.sin(it.wobble) * 5 : 0;

        ctx.save();
        ctx.translate(Math.round(it.x), Math.round(it.y + bob));
        if (this.state === 'throwing') ctx.rotate(this.throwProgress * Math.PI * 5);
        this._drawSprite(ctx, it.def.src, it.def.emoji, 0, 0, SZ, SZ);
        ctx.restore();

        if (this.state === 'idle') {
            ctx.save();
            ctx.shadowColor = '#000'; ctx.shadowBlur = 5;
            ctx.fillStyle   = '#ffffff';
            ctx.font        = `bold ${Math.round(this.canvas.width * 0.028)}px sans-serif`;
            ctx.textAlign   = 'center'; ctx.textBaseline = 'top';
            ctx.fillText(it.def.label, it.x, Math.round(it.y + SZ / 2 + 6 + bob));
            ctx.restore();
        }
    }

    /* ── Draw: prompt piscante ──────────────────────────────────────── */
    _drawPrompt(ctx) {
        if (this.state !== 'idle' || !this.currentTrash) return;
        const W = this.canvas.width;
        const H = this.canvas.height;
        ctx.save();
        ctx.globalAlpha  = 0.5 + Math.sin(Date.now() * 0.004) * 0.3;
        ctx.fillStyle    = '#a0d8ef';
        ctx.font         = `${Math.round(W * 0.022)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('👆 Clique na lixeira correta para arremessar!', W / 2, H * 0.64);
        ctx.restore();
    }

    /* ── Draw: marca ✓ / ✗ ─────────────────────────────────────────── */
    _drawResultMark(ctx) {
        if (this.state !== 'result' || !this.throwTarget) return;
        ctx.save();
        ctx.globalAlpha  = Math.min(1, this.resultFrames / 20);
        ctx.font         = `bold ${Math.round(this.canvas.width * 0.07)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle    = this.lastCorrect ? '#7df0c8' : '#ff5252';
        ctx.fillText(this.lastCorrect ? '✓' : '✗', this.throwTarget.endX, this.throwTarget.endY);
        ctx.restore();
    }

    /* ── Draw: highlight na lixeira CORRETA após erro (BUG CORRIGIDO) ─
       Usa lastCorrectBinId (salvo antes de nullar currentTrash) para
       mostrar a lixeira que o jogador deveria ter escolhido.
       ─────────────────────────────────────────────────────────────────── */
    _drawCorrectBinHint(ctx) {
        if (this.state !== 'result' || this.lastCorrect || !this.lastCorrectBinId) return;
        const bins       = this._getBinPositions();
        const correctBin = bins.find(b => b.def.id === this.lastCorrectBinId);
        if (!correctBin) return;

        const alpha = (this.resultFrames / RESULT_FRAMES) * 0.85;
        const pulse  = 1 + Math.sin(Date.now() * 0.015) * 0.06;

        // Anel verde pulsante ao redor da lixeira correta
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

        // Seta e label "→ Papel" abaixo da lixeira
        ctx.shadowBlur   = 0;
        ctx.fillStyle    = '#7df0c8';
        ctx.font         = `bold ${Math.round(this.canvas.width * 0.030)}px sans-serif`;
        ctx.textAlign    = 'center'; ctx.textBaseline = 'bottom';
        ctx.fillText('👆', correctBin.x, correctBin.y - 2);

        ctx.font         = `${Math.round(this.canvas.width * 0.019)}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(`→ "${correctBin.def.label}"`, correctBin.x, correctBin.y + correctBin.h + 16);
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
        this._drawPrompt(ctx);
        this.parts.draw(ctx);
    }

    /* ── Fim de jogo ────────────────────────────────────────────────── */
    endGame(byHearts = false) {
        if (!this.gameActive) return;
        this.gameActive = false;
        this.timer.stop();
        this.stopLoop();
        this._clearAllTimers();
        this._dimCanvas(0.72);

        const accuracy    = this.totalThrown > 0
            ? Math.round(((this.totalThrown - this.wrongCount) / this.totalThrown) * 100) : 0;
        const success     = !byHearts && this.score.score >= WIN_SCORE;
        const isNewRecord = this.score.saveRecord();
        if (success && !this.isReplay) this._store.setBool('completed', true);

        const wrapper = this.container.querySelector('.m1-wrap');
        const overlay = GameOverlay.show(wrapper, {
            title:      byHearts ? '💀 Vidas esgotadas!' : success ? '🌊 Rio mais limpo!' : '😔 O rio ainda está poluído...',
            titleColor: success ? '#7df0c8' : '#ff6b6b',
            rows: [
                GameOverlay.scoreRow(this.score.score),
                GameOverlay.comboRow(this.combo.maxCombo),
                { html: `<div style="color:#d0eeff;font-size:0.88rem;">Precisão: <strong style="color:#ffd600">${accuracy}%</strong> (${this.totalThrown} arremessos)</div>` },
                { html: success
                    ? `<div style="color:#7df0c8;font-size:0.82rem;">🐬 Botos e pirarucus agradecem!</div>`
                    : `<div style="color:#ff9080;font-size:0.82rem;">🏭 Manaus gera ~1.000 t/dia de resíduos sólidos.</div>` },
            ],
            badges: [
                GameOverlay.recordBadge(isNewRecord && this.score.score > 0),
                GameOverlay.prevRecordBadge(this.score.bestScore, isNewRecord),
            ],
            buttons: [
                GameOverlay.replayButton('m1-btn-replay',
                    byHearts ? '🔁 Tentar Novamente' : '🔄 Jogar Novamente',
                    () => { GameOverlay.dismiss(overlay); this.restartGame(); },
                ),
                GameOverlay.continueButton('m1-btn-continue',
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
        this.stopLoop();

        this.state            = 'idle';
        this.currentTrash     = null;
        this.throwProgress    = 0;
        this.resultFrames     = 0;
        this.throwTarget      = null;
        this.lastCorrectBinId = null;
        this.hoveredBin       = -1;
        this.totalThrown      = 0;
        this.wrongCount       = 0;
        this.riverPhase       = 0;
        this.bgCache          = null;
        this.isReplay         = true;

        this.score.reset();
        this.combo.reset();
        this.lives.reset();
        this.parts.clear();
        this.timer.reset();
        this.missions.reset();

        this.hud.setText('score', 0);
        this.hud.setText('combo', '—');
        this.hud.setStyle('combo', 'color', '#ffd600');
        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        this.gameActive = true;
        this._spawnNextItem();
        this.timer.start();
        this.missions.start();
        this.gameLoop();
    }
}