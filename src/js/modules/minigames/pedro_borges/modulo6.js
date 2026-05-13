// Módulo 6 — Limpeza do Pantanal
import {
    CanvasMinigame,
    PhysicsBody,
    PersistenceStore,
    HUDController,
    ScoreSystem,
    LivesSystem,
    GameTimer,
    ParticleSystem,
    GameOverlay,
    emojiSprite,
    InputController,
} from '../felipe/gamekit.js';

/* ═══════════════════════════════════════════════════════════════════════════
   Constantes de física e jogo
   ═══════════════════════════════════════════════════════════════════════════ */
const CANVAS_RATIO  = 0.56;
const GRAVITY       = 0.58;
const JUMP_VY       = -13;
const PLAYER_SPEED  = 4.5;
const PLAYER_W      = 36;
const PLAYER_H      = 32;
const ITEM_SIZE     = 30;
const MAX_LIVES     = 3;
const INVINCIBLE_MS = 90;   // frames de invencibilidade após dano

/* ═══════════════════════════════════════════════════════════════════════════
   Definição dos 5 níveis
   Coordenadas em fração do canvas (0-1).
   platforms: [xf, yf, wf, type]  type = 'ground' | 'log' | 'stone'
   trash:     [xf, platIdx, emoji]
   hazards:   [xf, platIdx, emoji]
   ═══════════════════════════════════════════════════════════════════════════ */
const LEVELS = [
    {
        name:      'Primeiros Passos',
        tip:       '↑ Espaço = pular  ·  ←→ = mover  ·  Colete todo o lixo! ♻️',
        timeLimit: 45,
        platforms: [
            [0.00, 0.82, 1.00, 'ground'],
            [0.08, 0.64, 0.24, 'log'],
            [0.42, 0.54, 0.24, 'log'],
            [0.72, 0.66, 0.24, 'log'],
        ],
        trash: [
            [0.16, 1, '🥤'],
            [0.51, 2, '🛍️'],
            [0.81, 3, '🧴'],
        ],
        hazards: [],
    },
    {
        name:      'Óleo na Água',
        tip:       '🛢️ Tambores de óleo queimam! Pegue só o lixo.',
        timeLimit: 45,
        platforms: [
            [0.00, 0.82, 1.00, 'ground'],
            [0.06, 0.65, 0.20, 'log'],
            [0.32, 0.54, 0.22, 'log'],
            [0.60, 0.44, 0.20, 'log'],
            [0.82, 0.62, 0.16, 'stone'],
        ],
        trash: [
            [0.12, 1, '🥤'],
            [0.40, 2, '🛍️'],
            [0.66, 3, '🧻'],
            [0.88, 4, '🧴'],
        ],
        hazards: [
            [0.35, 2, '🛢️'],
        ],
    },
    {
        name:      'Tempestade de Lixo',
        tip:       '🔥 Fogo no tronco! Cinco itens para coletar.',
        timeLimit: 50,
        platforms: [
            [0.00, 0.82, 1.00, 'ground'],
            [0.06, 0.67, 0.18, 'stone'],
            [0.28, 0.56, 0.20, 'log'],
            [0.52, 0.44, 0.20, 'log'],
            [0.74, 0.57, 0.22, 'stone'],
        ],
        trash: [
            [0.11, 1, '🥤'],
            [0.34, 2, '🛍️'],
            [0.57, 3, '🧴'],
            [0.79, 4, '🧻'],
            [0.87, 4, '🥤'],
        ],
        hazards: [
            [0.31, 2, '🔥'],
            [0.75, 4, '🛢️'],
        ],
    },
    {
        name:      'Poluição Severa',
        tip:       'Seis itens! Cuidado: cada plataforma tem um perigo.',
        timeLimit: 55,
        platforms: [
            [0.00, 0.82, 1.00, 'ground'],
            [0.05, 0.67, 0.16, 'log'],
            [0.24, 0.56, 0.18, 'stone'],
            [0.46, 0.44, 0.18, 'log'],
            [0.67, 0.55, 0.16, 'stone'],
            [0.86, 0.43, 0.12, 'log'],
        ],
        trash: [
            [0.10, 1, '🥤'],
            [0.29, 2, '🛍️'],
            [0.50, 3, '🧴'],
            [0.54, 3, '🧻'],
            [0.72, 4, '🥤'],
            [0.90, 5, '🛍️'],
        ],
        hazards: [
            [0.26, 2, '🛢️'],
            [0.71, 4, '🔥'],
            [0.89, 5, '🛢️'],
        ],
    },
    {
        name:      'Resgate do Pantanal',
        tip:       'Missão final! 8 itens · Cada pulo conta! 🦦',
        timeLimit: 60,
        platforms: [
            [0.00, 0.82, 1.00, 'ground'],
            [0.04, 0.68, 0.14, 'stone'],
            [0.21, 0.57, 0.16, 'log'],
            [0.40, 0.45, 0.16, 'stone'],
            [0.57, 0.57, 0.14, 'log'],
            [0.73, 0.44, 0.16, 'stone'],
            [0.90, 0.57, 0.09, 'log'],
        ],
        trash: [
            [0.08, 1, '🥤'],
            [0.25, 2, '🛍️'],
            [0.44, 3, '🧴'],
            [0.61, 4, '🧻'],
            [0.66, 4, '🥤'],
            [0.77, 5, '🛍️'],
            [0.82, 5, '🧴'],
            [0.93, 6, '🧻'],
        ],
        hazards: [
            [0.22, 2, '🛢️'],
            [0.43, 3, '🔥'],
            [0.60, 4, '🛢️'],
            [0.76, 5, '🔥'],
        ],
    },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Modulo6 — Limpeza do Pantanal (plataformer simples)
   ═══════════════════════════════════════════════════════════════════════════ */
export class Modulo6 extends CanvasMinigame {
    constructor(containerElement, onGameEnd, options = {}) {
        super(containerElement, onGameEnd, options);
        this._store = new PersistenceStore('m6v2');

        this.hud       = null;
        this.score     = null;
        this.lives     = null;
        this.particles = null;
        this._timer    = null;
        this._input    = null;

        this._levelIdx       = 0;
        this._platforms      = [];
        this._items          = [];
        this._player         = null;
        this._frame          = 0;
        this._facing         = 1;
        this._invincible     = 0;
        this._gameOver       = false;
        this._levelComplete  = false;
        this._totalCollected = 0;
        this._touchBtns      = { left: false, right: false, jump: false };

        // Cache de gradientes de fundo
        this._skyGrad      = null;
        this._waterGrad    = null;
        this._gradH        = -1;
        this._gradGroundY  = -1;
    }

    /* ── start ─────────────────────────────────── */

    start() {
        const best = this._store.getInt('best', 0);

        this.container.innerHTML = `
        <style>
            .m6-wrap {
                position: relative; width: 100%; display: flex;
                flex-direction: column; align-items: center;
                background: #0d2b1a; border-radius: 12px;
                overflow: hidden; user-select: none; font-family: sans-serif;
            }
            .m6-hud {
                display: flex; align-items: center; gap: 0.5rem;
                width: 100%; padding: 0.3rem 0.7rem; box-sizing: border-box;
                background: rgba(0,0,0,0.75); color: #d4f5d4; font-size: 0.78rem;
                flex-wrap: wrap;
            }
            .m6-hud strong { color: #6ee78e; }
            .m6-hud-sep { margin-left: auto; }
            .m6-tip {
                width: 100%; padding: 0.15rem 0.7rem; box-sizing: border-box;
                background: rgba(0,0,0,0.50); color: #86efac;
                font-size: 0.66rem; text-align: center; margin: 0;
            }
            #m6-canvas { display: block; max-width: 100%; touch-action: none; }
            .m6-ctrl {
                display: flex; gap: 8px; padding: 6px 0; width: 100%;
                justify-content: center; background: rgba(0,0,0,0.6);
            }
            .m6-btn {
                width: 52px; height: 44px; border: 2px solid rgba(110,231,142,0.5);
                border-radius: 8px; background: rgba(110,231,142,0.12);
                color: #6ee78e; font-size: 1.3rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                -webkit-tap-highlight-color: transparent;
            }
            .m6-btn:active { background: rgba(110,231,142,0.3); }
        </style>
        <div class="m6-wrap">
            <div class="m6-hud">
                <span>🗺️ Nível <strong id="m6-lv">1</strong>/5</span>
                <span>♻️ <strong id="m6-col">0</strong>/<strong id="m6-tot">0</strong></span>
                <span>⏱️ <strong id="m6-timer">45</strong>s</span>
                <span>Pts: <strong id="m6-score">0</strong></span>
                <span class="m6-hud-sep"></span>
                <span id="m6-hearts">❤️❤️❤️</span>
                <span id="m6-best-wrap" style="${best > 0 ? '' : 'display:none'}">🏆 <strong id="m6-best">${best}</strong></span>
            </div>
            <p class="m6-tip" id="m6-tip">…</p>
            <div style="position:relative;width:100%">
                <canvas id="m6-canvas"></canvas>
            </div>
            <div class="m6-ctrl">
                <button class="m6-btn" id="m6-left">◀</button>
                <button class="m6-btn" id="m6-jump">▲</button>
                <button class="m6-btn" id="m6-right">▶</button>
            </div>
        </div>`;

        const canvasEl = this.container.querySelector('#m6-canvas');
        this._setupCanvas(canvasEl, CANVAS_RATIO);

        this.hud = new HUDController(this.container, {
            level:    '#m6-lv',
            col:      '#m6-col',
            tot:      '#m6-tot',
            timer:    '#m6-timer',
            score:    '#m6-score',
            hearts:   '#m6-hearts',
            best:     '#m6-best',
            bestWrap: '#m6-best-wrap',
        });

        this.score     = new ScoreSystem(this._store, 'best');
        this.lives     = new LivesSystem(MAX_LIVES, this.hud, 'hearts');
        this.particles = new ParticleSystem(0.038, 0.022, 100);
        this.score.on('changed', v => this.hud.setText('score', v));

        this._input = new InputController(this.canvas);
        this._setupTouchButtons();

        this._initLevel(0);
        this.gameActive = true;
        this.gameLoop();
    }

    _setupTouchButtons() {
        const addBtn = (id, flag) => {
            const el = this.container.querySelector(id);
            if (!el) return;
            el.addEventListener('pointerdown', e => { e.preventDefault(); this._touchBtns[flag] = true; });
            el.addEventListener('pointerup',   e => { e.preventDefault(); this._touchBtns[flag] = false; });
            el.addEventListener('pointerleave',() => { this._touchBtns[flag] = false; });
        };
        addBtn('#m6-left',  'left');
        addBtn('#m6-jump',  'jump');
        addBtn('#m6-right', 'right');
    }

    /* ── Inicializa nível ──────────────────────── */

    _initLevel(idx) {
        this._levelIdx      = idx;
        this._levelComplete = false;
        this._frame         = 0;
        this._invincible    = 0;

        if (this._timer) this._timer.stop();
        this._clearAllTimers();

        const W = this.canvas.width, H = this.canvas.height;
        const lv = LEVELS[idx];

        this._platforms = lv.platforms.map(([xf, yf, wf, type]) => ({
            x: xf * W, y: yf * H, w: wf * W, h: 16, type,
        }));

        this._items = [];
        for (const [xf, pi, emoji] of lv.trash) {
            const plat = this._platforms[pi];
            this._items.push({
                x: xf * W - ITEM_SIZE / 2,
                y: plat.y - ITEM_SIZE,
                w: ITEM_SIZE, h: ITEM_SIZE,
                emoji, isHazard: false, collected: false,
                phase: Math.random() * Math.PI * 2,
            });
        }
        for (const [xf, pi, emoji] of lv.hazards) {
            const plat = this._platforms[pi];
            this._items.push({
                x: xf * W - ITEM_SIZE / 2,
                y: plat.y - ITEM_SIZE,
                w: ITEM_SIZE, h: ITEM_SIZE,
                emoji, isHazard: true, collected: false,
                phase: Math.random() * Math.PI * 2,
            });
        }

        const ground = this._platforms[0];
        this._player = new PhysicsBody({
            x: W * 0.04,
            y: ground.y - PLAYER_H,
            w: PLAYER_W,
            h: PLAYER_H,
            gravity: GRAVITY,
            maxVY: 16,
        });

        this._timer = new GameTimer(lv.timeLimit, this.hud, 'timer');
        this._timer.on('expired', () => {
            if (this.gameActive && !this._gameOver) this._endGame(false);
        });
        this._timer.start();

        const trashCount = this._items.filter(i => !i.isHazard).length;
        this.hud.setText('level', idx + 1);
        this.hud.setText('col',   0);
        this.hud.setText('tot',   trashCount);
        const tip = this.container.querySelector('#m6-tip');
        if (tip) tip.textContent = lv.tip;
    }

    /* ── Update ────────────────────────────────── */

    update() {
        if (!this.gameActive || this._gameOver || this._levelComplete) return;
        this._frame++;

        const p  = this._player;
        const W  = this.canvas.width;
        const H  = this.canvas.height;

        // Input (teclado ou toques)
        const goLeft  = this._input.left  || this._touchBtns.left;
        const goRight = this._input.right || this._touchBtns.right;
        const doJump  = this._input.consumeJump() || this._consumeTouchJump();

        const acc      = PLAYER_SPEED * 0.35;
        const friction = 0.80;
        if      (goLeft)  p.vx = Math.max(p.vx - acc, -PLAYER_SPEED);
        else if (goRight) p.vx = Math.min(p.vx + acc,  PLAYER_SPEED);
        else              p.vx *= friction;

        if (p.vx >  0.1) this._facing =  1;
        if (p.vx < -0.1) this._facing = -1;

        // Pulo
        if (doJump && p.onGround) {
            p.vy = JUMP_VY;
            p.onGround = false;
        }

        // Física: gravidade e velocidade
        p.applyGravity();
        const prevBottom = p._prevY + p.h;
        p.onGround = false;
        p.applyVelocity();

        // Clamp horizontal
        p.x = Math.max(0, Math.min(W - p.w, p.x));

        // Colisão com plataformas
        for (const plat of this._platforms) {
            if (!p.intersects(plat)) continue;
            const overlapTop    = (p.y + p.h) - plat.y;
            const overlapBottom = (plat.y + plat.h) - p.y;
            if (overlapTop < overlapBottom && p.vy >= 0 && prevBottom <= plat.y + 3) {
                p.y        = plat.y - p.h;
                p.vy       = 0;
                p.onGround = true;
            }
        }

        // Caiu na água: falha
        if (p.y > H + 40) {
            this._onFall();
            return;
        }

        // Colisão com itens e fogo
        if (this._invincible > 0) {
            this._invincible--;
        } else {
            for (const item of this._items) {
                if (item.collected) continue;
                if (p.intersects(item)) {
                    if (item.isHazard) this._onHazardHit();
                    else               this._onCollect(item);
                }
            }
        }

        this.particles.update();
    }

    _consumeTouchJump() {
        if (this._touchBtns.jump && !this._touchBtns._jumpConsumed) {
            this._touchBtns._jumpConsumed = true;
            return true;
        }
        if (!this._touchBtns.jump) {
            this._touchBtns._jumpConsumed = false;
        }
        return false;
    }

    /* ── Draw ──────────────────────────────────── */

    draw() {
        if (!this.canvas) return;
        const ctx = this.ctx;
        const W = this.canvas.width, H = this.canvas.height;

        this._drawBackground(ctx, W, H);
        this._drawPlatforms(ctx);
        this._drawItems(ctx);
        this._drawPlayer(ctx);
        this.particles.draw(ctx);
    }

    _drawBackground(ctx, W, H) {
        const groundY = this._platforms[0]?.y ?? H * 0.82;

        // Gradiente do céu — cacheado, recriado apenas se o canvas mudar
        if (this._gradH !== H) {
            this._skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
            this._skyGrad.addColorStop(0, '#1a5276');
            this._skyGrad.addColorStop(1, '#76b8d4');
            this._gradH = H;
        }
        ctx.fillStyle = this._skyGrad;
        ctx.fillRect(0, 0, W, H);

        // Árvores e vegetação de fundo (estáticas, semitransparentes)
        const bgVeg = ['🌴', '🌿', '🎋', '🌿', '🌴'];
        const bgPos  = [0.05, 0.22, 0.50, 0.72, 0.92];
        for (let i = 0; i < bgVeg.length; i++) {
            const sp = emojiSprite(bgVeg[i], 36);
            ctx.globalAlpha = 0.28;
            ctx.drawImage(sp, bgPos[i] * W - sp.width / 2, groundY - sp.height * 0.7);
            ctx.globalAlpha = 1;
        }

        // Gradiente da água — cacheado, recriado apenas se groundY mudar
        if (this._gradGroundY !== groundY) {
            this._waterGrad = ctx.createLinearGradient(0, groundY, 0, H);
            this._waterGrad.addColorStop(0, '#117a65');
            this._waterGrad.addColorStop(1, '#0b4a3c');
            this._gradGroundY = groundY;
        }
        ctx.fillStyle = this._waterGrad;
        ctx.fillRect(0, groundY, W, H - groundY);

        // Ondas animadas
        ctx.strokeStyle = 'rgba(144,238,144,0.25)';
        ctx.lineWidth   = 1.5;
        for (let i = 0; i < 5; i++) {
            const rx = ((this._frame * 0.7 + i * 110) % (W + 60)) - 30;
            const ry = groundY + 6 + i * 5;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.bezierCurveTo(rx + 12, ry - 3, rx + 22, ry + 3, rx + 35, ry);
            ctx.stroke();
        }

        // Nenúfares decorativos na água
        const lilyPos = [0.12, 0.38, 0.60, 0.84];
        for (const lp of lilyPos) {
            const sp = emojiSprite('🪷', 20);
            ctx.globalAlpha = 0.55;
            ctx.drawImage(sp, lp * W - sp.width / 2, groundY + 4);
            ctx.globalAlpha = 1;
        }
    }

    _drawPlatforms(ctx) {
        for (const plat of this._platforms) {
            if (plat.type === 'ground') continue; // chão = borda da água

            const { x, y, w, h, type } = plat;
            const isLog = type === 'log';

            // Corpo da plataforma
            ctx.fillStyle = isLog ? '#6b3a1f' : '#5a5a5a';
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, 5);
            ctx.fill();

            // Reflexo superior
            ctx.fillStyle = isLog ? '#8b5e3c' : '#777';
            ctx.fillRect(x + 3, y + 2, w - 6, 4);

            // Emoji de textura no centro (pequeno)
            const emoji = isLog ? '🪵' : '🪨';
            const sp = emojiSprite(emoji, 14);
            ctx.globalAlpha = 0.65;
            ctx.drawImage(sp, x + w / 2 - sp.width / 2, y - sp.height * 0.35);
            ctx.globalAlpha = 1;
        }
    }

    _drawItems(ctx) {
        for (const item of this._items) {
            if (item.collected) continue;
            const bob = Math.sin(this._frame * 0.09 + item.phase) * 4;
            const cx  = item.x + item.w / 2;
            const cy  = item.y + item.h / 2 + bob;

            if (item.isHazard) {
                // Brilho vermelho-laranja pulsante
                const pulse = 0.25 + Math.sin(this._frame * 0.14 + item.phase) * 0.12;
                ctx.fillStyle = `rgba(220,60,20,${pulse})`;
                ctx.beginPath();
                ctx.arc(cx, cy, item.w * 0.72, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Brilho verde suave
                ctx.fillStyle = 'rgba(100,220,120,0.22)';
                ctx.beginPath();
                ctx.arc(cx, cy, item.w * 0.65, 0, Math.PI * 2);
                ctx.fill();
            }

            const sp = emojiSprite(item.emoji, item.w * 0.88);
            ctx.drawImage(sp, cx - sp.width / 2, cy - sp.height / 2);
        }
    }

    _drawPlayer(ctx) {
        const p  = this._player;
        const cx = p.x + p.w / 2;
        const cy = p.y + p.h / 2;

        // Flash de invencibilidade
        if (this._invincible > 0 && this._frame % 7 < 3) return;

        // Sombra no chão
        if (p.onGround) {
            ctx.fillStyle = 'rgba(0,0,0,0.28)';
            ctx.beginPath();
            ctx.ellipse(cx, p.y + p.h + 2, p.w * 0.4, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // Capivara-lontra (🦦) espelhada conforme direção
        const sp = emojiSprite('🦦', Math.max(p.w, p.h) * 1.0);
        ctx.save();
        ctx.translate(cx, cy);
        if (this._facing < 0) ctx.scale(-1, 1);
        ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
        ctx.restore();
    }

    /* ── Eventos do jogo ───────────────────────── */

    _onCollect(item) {
        item.collected = true;
        this._totalCollected++;
        this.score.add(50);

        const cx = item.x + item.w / 2, cy = item.y + item.h / 2;
        this.particles.spawnRadial(cx, cy, '#4ade80', 8, 1.5, 3.5);
        this.particles.spawnFloat(cx, cy - 22, '+50 ♻️', '#4ade80', 13);

        const trash    = this._items.filter(i => !i.isHazard);
        const colCount = trash.filter(i => i.collected).length;
        this.hud.setText('col', colCount);

        if (colCount === trash.length) {
            this._levelComplete = true;
            this.score.add(100);
            this._setTimeout(() => this._onLevelComplete(), 700);
        }
    }

    _onHazardHit() {
        this._invincible = INVINCIBLE_MS;
        const depleted = this.lives.lose();

        const cx = this._player.x + this._player.w / 2;
        const cy = this._player.y + this._player.h / 2;
        this.particles.spawnRadial(cx, cy, '#f87171', 8, 2, 4);
        this.particles.spawnFloat(cx, cy - 22, '💥 -1 vida', '#f87171', 13);

        if (depleted) this._setTimeout(() => this._endGame(false), 600);
    }

    _onFall() {
        const depleted = this.lives.lose();
        const W = this.canvas.width;
        const ground = this._platforms[0];

        this.particles.spawnBurst(
            this._player.x + this._player.w / 2,
            ground.y + 8,
            '#38bdf8', 10, 0.08,
        );
        this.particles.spawnFloat(
            this._player.x + this._player.w / 2,
            ground.y - 10,
            '💧 caiu na água', '#38bdf8', 12,
        );

        if (depleted) {
            this._setTimeout(() => this._endGame(false), 600);
            return;
        }

        // Respawn na margem esquerda
        this._player.reset(W * 0.04, ground.y - PLAYER_H);
        this._invincible = 60;
    }

    /* ── Transição de nível ────────────────────── */

    _onLevelComplete() {
        if (this._gameOver) return;
        this._timer?.stop();

        const isLast = this._levelIdx >= LEVELS.length - 1;
        if (isLast) {
            this._endGame(true);
        } else {
            this._showLevelOverlay(true, () => {
                this._initLevel(this._levelIdx + 1);
            });
        }
    }

    _showLevelOverlay(success, onContinue) {
        const wrapper = this.container.querySelector('.m6-wrap');
        const lv      = LEVELS[this._levelIdx];
        const trash   = this._items.filter(i => !i.isHazard);
        const colN    = trash.filter(i => i.collected).length;

        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:absolute', 'inset:0', 'display:flex', 'flex-direction:column',
            'align-items:center', 'justify-content:center', 'gap:10px',
            'background:rgba(0,0,0,0.82)', 'font-family:sans-serif',
            'border-radius:12px', 'z-index:10',
        ].join(';');

        overlay.innerHTML = `
            <div style="font-size:1.6rem;font-weight:900;color:${success ? '#4ade80' : '#f87171'}">
                ${success ? '✅ Nível Concluído!' : '❌ Tente Novamente'}
            </div>
            <div style="color:#d4f5d4;font-size:1rem">
                ${lv.name} — ♻️ <strong>${colN}/${trash.length}</strong> coletados
            </div>
            <button id="m6-next-btn" style="
                margin-top:8px; padding:10px 36px;
                background:${success ? '#16a34a' : '#dc2626'};
                color:#fff; border:none; border-radius:8px;
                font-size:1rem; font-weight:700; cursor:pointer;
            ">${success ? 'Próximo Nível →' : '🔄 Tentar Novamente'}</button>
        `;

        wrapper.appendChild(overlay);
        overlay.querySelector('#m6-next-btn').addEventListener('click', () => {
            overlay.remove();
            onContinue();
        });
    }

    /* ── Fim de jogo ───────────────────────────── */

    _endGame(success) {
        if (this._gameOver) return;
        this._gameOver  = true;
        this.gameActive = false;

        this._timer?.stop();
        this.stopLoop();
        this._input?.dispose();
        this._clearAllTimers();

        const isNew = this.score.saveRecord();
        if (success && !this.isReplay) this._store.setBool('completed', true);

        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        this._dimCanvas(0.62);
        const wrapper = this.container.querySelector('.m6-wrap');
        const overlay = GameOverlay.show(wrapper, {
            title:      success ? '🌿 Pantanal Salvo!' : '💧 O Pantanal Precisa de Você',
            titleColor: success ? '#4ade80' : '#60a5fa',
            rows: [
                GameOverlay.scoreRow(this.score.score),
                { html: `<div style="color:#d4f5d4">Lixo coletado: ♻️ <strong style="color:#4ade80">${this._totalCollected}</strong></div>` },
                { html: `<div style="color:#d4f5d4">Nível alcançado: <strong style="color:#fbbf24">${this._levelIdx + 1}/5</strong></div>` },
            ],
            badges: [
                GameOverlay.recordBadge(isNew),
                GameOverlay.prevRecordBadge(this.score.bestScore, isNew),
            ],
            buttons: [
                GameOverlay.replayButton('m6-btn-replay', '🔄 Jogar Novamente',
                    () => { GameOverlay.dismiss(overlay); this._restart(); }),
                GameOverlay.continueButton('m6-btn-continue',
                    success ? '✅ Continuar' : '🗺️ Voltar ao Mapa',
                    success && !this.isReplay,
                    () => { GameOverlay.dismiss(overlay); this.finishGame(success, this.score.score); }),
            ],
            footer: 'O Pantanal abriga 3.500 espécies. Lixo na natureza mata animais e contamina rios.',
        });
    }

    /* ── Restart ───────────────────────────────── */

    _restart() {
        this._gameOver       = false;
        this._frame          = 0;
        this._levelIdx       = 0;
        this._totalCollected = 0;
        this._invincible     = 0;
        this._touchBtns      = { left: false, right: false, jump: false };
        this.isReplay        = true;
        // Invalida cache de gradientes para forçar recriação
        this._gradH       = -1;
        this._gradGroundY = -1;

        this.score.reset();
        this.lives.reset();
        this.particles.clear();

        this._initLevel(0);
        this.gameActive = true;
        this.gameLoop();
    }

    /* ── Cleanup ───────────────────────────────── */

    endGame() {
        this.gameActive = false;
        this._timer?.stop();
        this.stopLoop();
        this._input?.dispose();
        this._clearAllTimers();
    }
}
