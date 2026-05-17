// Missão 5 — Madagascar · Pesca-fantasma no Canal de Moçambique
import {
    PlatformMinigame,
    PersistenceStore,
    HUDController,
    ScoreSystem,
    LivesSystem,
    ParticleSystem,
    GameTimer,
    GameOverlay,
    InputController,
    emojiSprite,
} from '../felipe/gamekit.js';

/* ═══════════════════════════════════════════════════════════
   Constantes
   ═══════════════════════════════════════════════════════════ */
const WORLD_W           = 1600;
const CANVAS_RATIO      = 0.58;
const TOTAL_ANIMALS     = 8;
const TOTAL_TRASH       = 12;
const FREE_RADIUS       = 42;
const TRASH_RADIUS      = 32;
const HIT_COOLDOWN      = 90;   // frames de invencibilidade (unificado)
const GRAVITY           = 0.22;
const PLAYER_SPEED      = 5.5;  // acelerado
const SWIM_FORCE        = 0.72;
const MAX_SWIM_VY       = -5.5;
const TERMINAL_VY       = 4.5;
const OXYGEN_MAX        = 100;
const OXYGEN_DRAIN      = OXYGEN_MAX / (22 * 60); // esgota em ~22 s
const OXYGEN_REFILL     = OXYGEN_MAX / (6  * 60);
const TIMER_SECS        = 90;
const SHARK_SPEED_BASE  = 3.2;
const JELLY_CHASE_RANGE = 190;
const JELLY_GIVE_UP     = 320; // frames para desistir da perseguição
const JELLY_SPEED       = 0.85;
const TRASH_EMOJIS      = ['🧴', '🥤', '🛍️', '🍶', '🥫', '🧃', '🪣'];

/* ═══════════════════════════════════════════════════════════
   Modulo5 — "Mergulho nas Redes"
   ═══════════════════════════════════════════════════════════ */
export class Modulo5 extends PlatformMinigame {
    constructor(containerElement, onGameEnd, options = {}) {
        super(containerElement, onGameEnd, {
            ...options,
            gravity:       GRAVITY,
            playerSpeed:   PLAYER_SPEED,
            jumpVelocity:  -5,
            playerW:       26,
            playerH:       36,
            worldWidth:    WORLD_W,
            fallThreshold: 99999,
        });

        this._store = new PersistenceStore('m5');

        // estado reiniciável
        this.oxygen          = OXYGEN_MAX;
        this._hitCooldown    = 0;
        this._oxygenDepleted = false;
        this.freedCount      = 0;
        this.trashCollected  = 0;
        this._gameOverShown  = false;
        this._frame          = 0;
        this._swimming       = false;
        this.animals         = [];
        this._trash          = [];
        this._spikes         = [];
        this._enemies        = [];
        this._decorations    = [];
        this._fish           = [];
        this._bubbles        = [];

        this.hud       = null;
        this.lives     = null;
        this.score     = null;
        this.particles = null;
        this.timer     = null;

        // Cache de gradiente de fundo
        this._bgGrad  = null;
        this._bgGradH = -1;

        // Cache de plataformas estáticas + coral (baked)
        this._platCache = null;
    }

    /* ── Ciclo de vida ────────────────────────────────── */

    start() {
        const best = this._store.getInt('best_score', 0);

        this.container.innerHTML = `
        <style>
            .m5-wrap {
                position:relative; width:100%; display:flex;
                flex-direction:column; align-items:center;
                background:#061c2e; border-radius:12px;
                overflow:hidden; user-select:none; font-family:sans-serif;
            }
            .m5-hud {
                display:flex; justify-content:space-between; align-items:center;
                width:100%; padding:0.42rem 1rem; box-sizing:border-box;
                background:rgba(0,0,0,0.60); color:#e0f4ff;
                font-size:0.82rem; gap:0.4rem; flex-wrap:wrap;
            }
            .m5-hud strong { color:#38bdf8; }
            .m5-hud-g      { display:flex; align-items:center; gap:0.3rem; }
            .m5-timer-warn { color:#ef4444 !important; }
            #m5-canvas     { display:block; max-width:100%; cursor:default; }
            .m5-tip {
                color:#1e4d6b; font-size:0.70rem; padding:0.22rem 0;
                text-align:center; margin:0;
            }
            .m5-tip strong { color:#38bdf8; }
        </style>
        <div class="m5-wrap">
            <div class="m5-hud">
                <div class="m5-hud-g">❤️ <span id="m5-hearts">❤️❤️❤️</span></div>
                <div class="m5-hud-g">⏱️ <strong id="m5-timer">${TIMER_SECS}</strong>s</div>
                <div class="m5-hud-g">🐢 <strong id="m5-freed">0</strong>/${TOTAL_ANIMALS}</div>
                <div class="m5-hud-g">🗑️ <strong id="m5-trash">0</strong>/${TOTAL_TRASH}</div>
                <div class="m5-hud-g">Pts: <strong id="m5-score">0</strong></div>
                <div class="m5-hud-g" id="m5-best-wrap" style="${best > 0 ? '' : 'display:none'}">
                    🏆 <strong id="m5-best">${best}</strong>
                </div>
                <span id="m5-fps" style="margin-left:auto;font-size:0.66rem;font-family:monospace;opacity:0.4;letter-spacing:-0.02em">FPS:--</span>
            </div>
            <div style="position:relative;width:100%;">
                <canvas id="m5-canvas"></canvas>
            </div>
            <p class="m5-tip">
                <strong>← →</strong> nadar ·
                <strong>↑ / Espaço</strong> subir ·
                <strong>superfície</strong> = oxigênio ·
                <strong>aproxime-se</strong> de 🐢🐬 para libertar · colete 🗑️ lixo
            </p>
        </div>`;

        const canvasEl = this.container.querySelector('#m5-canvas');
        this._setupCanvas(canvasEl, CANVAS_RATIO);
        this._fpsEl = this.container.querySelector('#m5-fps');

        this.hud = new HUDController(this.container, {
            hearts:   '#m5-hearts',
            score:    '#m5-score',
            freed:    '#m5-freed',
            trash:    '#m5-trash',
            timer:    '#m5-timer',
            best:     '#m5-best',
            bestWrap: '#m5-best-wrap',
        });

        this.lives     = new LivesSystem(3, this.hud, 'hearts');
        this.score     = new ScoreSystem(this._store, 'best_score');
        this.particles = new ParticleSystem(0.025, 0.018);
        this.timer     = new GameTimer(TIMER_SECS, this.hud, 'timer');

        this.score.on('changed', (val) => this.hud.setText('score', val));
        this.lives.on('depleted', () => this._endWithResult(false, 'lives'));
        this.timer.on('expired',  () => this._endWithResult(false, 'timeout'));

        this.input = new InputController(this.canvas);
        this.player.reset(45, 25);

        this._genDecorations();
        this.spawnPlatforms();
        this._spawnInitialEnemies();

        this.gameActive = true;
        this.timer.start();
        this.gameLoop();
    }

    /* ── Decorações procedurais ───────────────────────── */

    _genDecorations() {
        const W = WORLD_W;
        const H = this.canvas.height;
        this._decorations = [];

        for (let i = 0; i < 30; i++)
            this._decorations.push({
                type: 'seaweed', x: 40 + Math.random() * (W - 80),
                y: H - 15, height: 18 + Math.random() * 55,
                phase: Math.random() * Math.PI * 2,
                color: Math.random() < 0.55 ? '#1a6b3a' : '#2d8b55',
            });

        for (let i = 0; i < 20; i++)
            this._decorations.push({
                type: 'coral', x: 30 + Math.random() * (W - 60),
                y: H - 15, scale: 0.45 + Math.random() * 0.9,
                phase: Math.random() * Math.PI * 2,
                color: `hsl(${330 + Math.random() * 50},65%,52%)`,
            });

        this._fish = Array.from({ length: 12 }, () => ({
            x: Math.random() * W, y: 18 + Math.random() * (H * 0.82),
            speed: 0.35 + Math.random() * 1.1,
            dir: Math.random() < 0.5 ? 1 : -1,
            phase: Math.random() * Math.PI * 2,
            color: `hsl(${Math.floor(Math.random() * 360)},60%,56%)`,
            size: 5 + Math.random() * 11,
        }));
    }

    /* ── Spawn do mundo ───────────────────────────────── */

    spawnPlatforms() {
        const W = WORLD_W;
        const H = this.canvas.height;

        // Chão do mar
        this.world.spawnPlatform({ x: 0, y: H - 15, w: W, h: 15,
            type: 'solid', data: { kind: 'floor' } });

        // Plataformas principais (com animais)
        const solidDefs = [
            { x: 78,   y: H * 0.68, w: 185, h: 14, data: { kind: 'coral' } },
            { x: 345,  y: H * 0.50, w: 162, h: 14, data: { kind: 'rock'  } },
            { x: 558,  y: H * 0.73, w: 172, h: 14, data: { kind: 'hull'  } },
            { x: 800,  y: H * 0.38, w: 198, h: 14, data: { kind: 'coral' } },
            { x: 1055, y: H * 0.60, w: 162, h: 14, data: { kind: 'rock'  } },
            { x: 1278, y: H * 0.33, w: 184, h: 14, data: { kind: 'coral' } },
            { x: 1412, y: H * 0.66, w: 172, h: 14, data: { kind: 'rock'  } },
        ];
        for (const d of solidDefs)
            this.world.spawnPlatform({ ...d, type: 'solid' });

        // Plataformas quebráveis (sem animais — degraus intermediários)
        const breakDefs = [
            { x: 198,  y: H * 0.58, w: 115, h: 12, data: { kind: 'hull', breakable: true, hits: 2 } },
            { x: 672,  y: H * 0.47, w: 110, h: 12, data: { kind: 'hull', breakable: true, hits: 2 } },
            { x: 1162, y: H * 0.45, w: 112, h: 12, data: { kind: 'hull', breakable: true, hits: 2 } },
        ];
        for (const d of breakDefs)
            this.world.spawnPlatform({ ...d, type: 'solid' });

        // Redes-fantasma — 3 estáticas, 3 em movimento
        const netDefs = [
            { x: 256,  y: H * 0.35, w: 68, h: 70,  moving: false },
            { x: 706,  y: H * 0.54, w: 82, h: 48,  moving: false },
            { x: 1188, y: H * 0.49, w: 72, h: 58,  moving: false },
            { x: 492,  y: H * 0.24, w: 58, h: 105, moving: true, oscAmp: 55, oscSpeed: 0.020, oscPhase: 0     },
            { x: 962,  y: H * 0.37, w: 62, h: 78,  moving: true, oscAmp: 45, oscSpeed: 0.025, oscPhase: 1.8  },
            { x: 1372, y: H * 0.22, w: 58, h: 92,  moving: true, oscAmp: 60, oscSpeed: 0.018, oscPhase: 3.5  },
        ];
        for (const d of netDefs) {
            const { moving, oscAmp, oscSpeed, oscPhase, ...rest } = d;
            this.world.spawnPlatform({
                ...rest, type: 'hazard',
                data: { kind: 'net', moving: !!moving, baseX: rest.x,
                        oscAmp: oscAmp ?? 0, oscSpeed: oscSpeed ?? 0, oscPhase: oscPhase ?? 0 },
            });
        }

        // Animais nas plataformas principais
        const solidPlats = this.world.platforms
            .filter(p => p.type === 'solid' && p.data?.kind !== 'floor' && !p.data?.breakable);

        this.animals = [];
        [
            { platIdx: 0, offset: 0.50, type: 'turtle'  },
            { platIdx: 1, offset: 0.38, type: 'dugong'  },
            { platIdx: 2, offset: 0.55, type: 'turtle'  },
            { platIdx: 3, offset: 0.44, type: 'dugong'  },
            { platIdx: 4, offset: 0.50, type: 'turtle'  },
            { platIdx: 5, offset: 0.56, type: 'dugong'  },
            { platIdx: 6, offset: 0.42, type: 'turtle'  },
        ].forEach(a => {
            const plat = solidPlats[a.platIdx];
            if (!plat) return;
            this.animals.push({ x: plat.x + plat.w * a.offset, y: plat.y - 22,
                type: a.type, freed: false, phase: Math.random() * Math.PI * 2 });
        });
        this.animals.push({ x: W - 110, y: H - 15 - 22,
            type: 'dugong', freed: false, phase: Math.random() * Math.PI * 2 });

        // Lixo no leito e perto de plataformas
        this._trash = [];
        const trashPositions = [
            120, 280, 430, 600, 750, 880, 1010, 1150, 1260, 1380, 1480, 1560,
        ];
        for (const tx of trashPositions) {
            this._trash.push({
                x: tx + (Math.random() - 0.5) * 40,
                y: H - 15 - 12 - Math.random() * 8,
                emoji: TRASH_EMOJIS[Math.floor(Math.random() * TRASH_EMOJIS.length)],
                collected: false,
                phase: Math.random() * Math.PI * 2,
            });
        }

        // Corais espinhosos no leito (hazard de contato)
        this._spikes = [];
        const spikeXs = [170, 390, 580, 760, 940, 1100, 1320, 1520];
        for (const sx of spikeXs)
            this._spikes.push({ x: sx, y: H - 15 - 18, w: 28, h: 18 });

        this._buildPlatCache();
    }

    _buildPlatCache() {
        const H = this.canvas.height;
        if (!this._platCache || this._platCache.height !== H)
            this._platCache = new OffscreenCanvas(WORLD_W, H);
        const oc = this._platCache.getContext('2d');
        oc.clearRect(0, 0, WORLD_W, H);
        for (const def of this.world.platforms) {
            if (def.type === 'hazard' && def.data?.moving) continue;
            this._drawPlatform(oc, def);
        }
        // Coral estático: baked aqui pra eliminar 60 arc() por frame em _drawDecorations
        oc.save();
        oc.globalAlpha = 0.58;
        for (const d of this._decorations) {
            if (d.type !== 'coral') continue;
            oc.fillStyle = d.color;
            oc.beginPath();
            oc.arc(d.x,               d.y - d.scale * 10, d.scale * 8, Math.PI, Math.PI * 2);
            oc.arc(d.x - d.scale * 8, d.y - d.scale * 18, d.scale * 5, Math.PI, Math.PI * 2);
            oc.arc(d.x + d.scale * 7, d.y - d.scale * 14, d.scale * 6, Math.PI, Math.PI * 2);
            oc.fill();
        }
        oc.restore();
        // Espinhos estáticos: todos num único path → 1 GPU fill, elimina 24 fill() por frame
        oc.save();
        oc.fillStyle = '#dc2626'; oc.globalAlpha = 0.88;
        oc.beginPath();
        for (const s of this._spikes) {
            const count = Math.floor(s.w / 9);
            const sw = s.w / count;
            for (let i = 0; i < count; i++) {
                const sx = s.x + i * sw + sw / 2;
                oc.moveTo(sx, s.y + s.h);
                oc.lineTo(sx - sw * 0.38, s.y + s.h);
                oc.lineTo(sx, s.y);
                oc.closePath();
            }
        }
        oc.fill();
        oc.restore();
    }


    /* ── Inimigos iniciais ────────────────────────────── */

    _spawnInitialEnemies() {
        const H = this.canvas.height;
        // 3 tubarões
        for (let i = 0; i < 3; i++)
            this._addShark(WORLD_W * 0.5 + i * 300, H * (0.25 + i * 0.18));
        // 4 águas-vivas em grupos
        for (let i = 0; i < 4; i++)
            this._addJelly(200 + i * 350, H * (0.3 + (i % 2) * 0.25));
    }

    _addShark(x, y) {
        const H = this.canvas.height;
        this._enemies.push({
            type:   'shark',
            x:      x ?? WORLD_W + 80,
            y:      y ?? (H * 0.2 + Math.random() * H * 0.6),
            baseY:  y ?? (H * 0.2 + Math.random() * H * 0.6),
            w:      58, h: 24,
            speed:  SHARK_SPEED_BASE + Math.random() * 1.5 + this._frame / 3600,
            phase:  Math.random() * Math.PI * 2,
        });
    }

    _addJelly(x, y) {
        const H = this.canvas.height;
        this._enemies.push({
            type:       'jelly',
            x:          x ?? (Math.random() * WORLD_W),
            y:          y ?? (H * 0.2 + Math.random() * H * 0.5),
            w:          24, h: 34,
            vx:         (Math.random() - 0.5) * 0.4,
            vy:         (Math.random() - 0.5) * 0.3,
            chaseTimer: 0,
            phase:      Math.random() * Math.PI * 2,
        });
    }

    /* ── Loop: update ─────────────────────────────────── */

    update() {
        if (!this.gameActive) return;
        this._frame++;

        const p = this.player;
        const W = this.canvas.width;

        // ─ Input ─
        const swimHeld = this.input.isDown('Space')   || this.input.isDown('ArrowUp') ||
                         this.input.isDown('KeyW')     || this.input.touchActive;
        this._swimming = swimHeld;

        if (this.input.left)       p.vx = Math.max(p.vx - PLAYER_SPEED * 0.40, -PLAYER_SPEED);
        else if (this.input.right) p.vx = Math.min(p.vx + PLAYER_SPEED * 0.40,  PLAYER_SPEED);
        else                       p.vx *= 0.86;

        if (swimHeld) p.vy = Math.max(p.vy - SWIM_FORCE, MAX_SWIM_VY);
        p.vy = Math.min(p.vy + GRAVITY, TERMINAL_VY);

        const wasOnGround = p.onGround;
        p.onGround = false;
        p.applyVelocity();
        p.x = Math.max(0, Math.min(p.x, WORLD_W - p.w));

        if (p.y < 0) { p.y = 0; p.vy = Math.max(0, p.vy); }

        // Colisão — descobre qual plataforma foi aterrizda para breakable
        const landed = this.world.resolveCollision(p);
        if (landed && !wasOnGround) {
            const plat = this.world.platforms.find(pl =>
                pl.type === 'solid' && p.intersects(pl)) ?? null;
            this.onPlayerLand(plat);
        }

        this.world.updateCamera(p.x + p.w / 2, W);

        // ─ Redes em movimento ─
        for (const pl of this.world.platforms) {
            if (pl.type === 'hazard' && pl.data?.moving) {
                pl.x = pl.data.baseX +
                    Math.sin(this._frame * pl.data.oscSpeed + pl.data.oscPhase) * pl.data.oscAmp;
            }
        }

        // ─ Oxigênio ─
        const atSurface = p.y <= 6;
        if (atSurface) {
            this.oxygen = Math.min(OXYGEN_MAX, this.oxygen + OXYGEN_REFILL);
        } else {
            this.oxygen = Math.max(0, this.oxygen - OXYGEN_DRAIN);
            if (this.oxygen <= 0 && !this._oxygenDepleted) {
                this._oxygenDepleted = true;
                this._endWithResult(false, 'oxygen');
            }
        }

        // ─ Cooldown de dano ─
        if (this._hitCooldown > 0) this._hitCooldown--;

        // ─ Redes estáticas/móveis — colisão ─
        if (this._hitCooldown === 0) {
            for (const pl of this.world.platforms) {
                if (pl.type === 'hazard' && p.intersects(pl)) {
                    this._onDamage(pl.x + pl.w / 2, pl.y + pl.h / 2, '🕸️ Rede! −1❤️');
                    break;
                }
            }
        }

        // ─ Espinhos ─
        if (this._hitCooldown === 0) {
            for (const s of this._spikes) {
                if (p.intersects(s)) {
                    this._onDamage(s.x + s.w / 2, s.y, '🌵 Espinho! −1❤️');
                    break;
                }
            }
        }

        // ─ Inimigos ─
        this._updateEnemies();
        if (this._hitCooldown === 0) this._checkEnemyCollision();

        // ─ Progresso ─
        this._checkAnimalProximity();
        this._checkTrashProximity();

        // ─ Novos inimigos escalados por tempo ─
        if (this._frame === 15 * 60) this._addShark();
        if (this._frame === 30 * 60) { this._addShark(); this._addJelly(); }
        if (this._frame === 50 * 60) this._addShark();

        // ─ Bolhas ─
        if (swimHeld && this._frame % 7 === 0 && this._bubbles.length < 40)
            this._bubbles.push({
                x: p.x + p.w / 2 + (Math.random() - 0.5) * 8,
                y: p.y + p.h * 0.65,
                r: 2 + Math.random() * 2.5, alpha: 0.65,
                vy: -(0.7 + Math.random() * 0.55),
                vx: (Math.random() - 0.5) * 0.35,
            });
        let bi = 0;
        for (const b of this._bubbles) {
            b.y += b.vy; b.x += b.vx + Math.sin(b.y * 0.09) * 0.22; b.alpha -= 0.009;
            if (b.alpha > 0) this._bubbles[bi++] = b;
        }
        this._bubbles.length = bi;

        // ─ Peixes decorativos ─
        for (const fish of this._fish) {
            fish.x += fish.speed * fish.dir; fish.phase += 0.04;
            if (fish.x >  WORLD_W + 60) fish.x = -60;
            if (fish.x < -60)           fish.x =  WORLD_W + 60;
        }

        this.particles.update();
    }

    _updateEnemies() {
        const H = this.canvas.height;
        const px = this.player.x + this.player.w / 2;
        const py = this.player.y + this.player.h / 2;

        for (const e of this._enemies) {
            if (e.type === 'shark') {
                // Move para a esquerda com oscilação vertical
                e.x -= e.speed;
                e.y = e.baseY + Math.sin(this._frame * 0.052 + e.phase) * 14;
                // Respawna pela direita quando sai da tela
                if (e.x < -e.w - 20) {
                    e.x     = WORLD_W + 80 + Math.random() * 200;
                    e.baseY = H * 0.15 + Math.random() * H * 0.65;
                    e.speed = SHARK_SPEED_BASE + Math.random() * 1.5 + this._frame / 3600;
                    e.phase = Math.random() * Math.PI * 2;
                }

            } else if (e.type === 'jelly') {
                const dx = px - (e.x + e.w / 2);
                const dy = py - (e.y + e.h / 2);
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < JELLY_CHASE_RANGE && e.chaseTimer < JELLY_GIVE_UP) {
                    // Perseguição
                    e.chaseTimer++;
                    const norm = Math.max(dist, 1);
                    e.vx += (dx / norm) * JELLY_SPEED * 0.08;
                    e.vy += (dy / norm) * JELLY_SPEED * 0.08;
                } else if (dist > JELLY_CHASE_RANGE * 1.4) {
                    // Reset timer quando player vai longe
                    e.chaseTimer = 0;
                }

                // Arrasto + oscilação
                e.vx *= 0.94;
                e.vy *= 0.94;
                e.vx += Math.sin(this._frame * 0.03 + e.phase) * 0.06;
                e.vy += Math.sin(this._frame * 0.04 + e.phase + 1) * 0.04;

                e.x += e.vx;
                e.y += e.vy;

                // Mantém na água
                e.x = Math.max(-e.w, Math.min(e.x, WORLD_W));
                e.y = Math.max(10,   Math.min(e.y, H - e.h - 20));
            }
        }
    }

    _checkEnemyCollision() {
        const p = this.player;
        for (const e of this._enemies) {
            if (p.intersects(e)) {
                const msg = e.type === 'shark' ? '🦈 Tubarão! −1❤️' : '🪼 Água-viva! −1❤️';
                this._onDamage(e.x + e.w / 2, e.y + e.h / 2, msg);
                return;
            }
        }
    }

    /* ── Dano unificado ───────────────────────────────── */

    _onDamage(worldX, worldY, msg) {
        this._hitCooldown = HIT_COOLDOWN;
        const sx = worldX - this.world.cameraX;
        this.particles.spawnRadial(sx, worldY, '#e67e22', 8, 2, 4);
        this.particles.spawnFloat(sx, worldY - 22, msg, '#ff6b6b', 14);
        const dir = (this.player.x + this.player.w / 2) > worldX ? 1 : -1;
        this.player.vx = dir * 5;
        this.player.vy = -3;
        this.lives.lose();
    }

    /* ── Progressão ───────────────────────────────────── */

    _checkAnimalProximity() {
        const px = this.player.x + this.player.w / 2;
        const py = this.player.y + this.player.h / 2;
        for (const a of this.animals) {
            if (a.freed) continue;
            const dx = px - a.x, dy = py - a.y;
            if (dx * dx + dy * dy > FREE_RADIUS * FREE_RADIUS) continue;
            a.freed = true;
            this.freedCount++;
            const sx = a.x - this.world.cameraX;
            this.score.add(100);
            this.particles.spawnRadial(sx, a.y, a.type === 'turtle' ? '#2ecc71' : '#3498db', 10, 2, 5);
            this.particles.spawnFloat(sx, a.y - 28,
                `${a.type === 'turtle' ? '🐢' : '🐬'} Livre! +100`, '#ffd600', 16);
            this.hud.setText('freed', this.freedCount);
            if (this.freedCount >= TOTAL_ANIMALS)
                this._setTimeout(() => this._endWithResult(true, 'win'), 700);
        }
    }

    _checkTrashProximity() {
        const px = this.player.x + this.player.w / 2;
        const py = this.player.y + this.player.h / 2;
        for (const tr of this._trash) {
            if (tr.collected) continue;
            const dx = px - tr.x, dy = py - tr.y;
            if (dx * dx + dy * dy > TRASH_RADIUS * TRASH_RADIUS) continue;
            tr.collected = true;
            this.trashCollected++;
            const sx = tr.x - this.world.cameraX;
            this.score.add(15);
            this.particles.spawnRadial(sx, tr.y, '#fbbf24', 6, 1.5, 3);
            this.particles.spawnFloat(sx, tr.y - 20, `♻️ +15`, '#fbbf24', 13);
            this.hud.setText('trash', this.trashCollected);
        }
    }

    /* ── Loop: draw ───────────────────────────────────── */

    draw() {
        const ctx = this.ctx;
        const W   = this.canvas.width;
        ctx.clearRect(0, 0, W, this.canvas.height);
        this.drawBackground(ctx);

        ctx.save();
        ctx.translate(-Math.round(this.world.cameraX), 0);
        this._drawDecorations(ctx);
        // Plataformas estáticas + coral + espinhos (baked): 1 drawImage por frame
        if (this._platCache) ctx.drawImage(this._platCache, 0, 0);
        // Plataformas dinâmicas: apenas redes em movimento
        for (const def of this.world.getVisiblePlatforms(W))
            if (def.type === 'hazard' && def.data?.moving) this._drawPlatform(ctx, def);
        this._drawTrash(ctx);
        this._drawAnimals(ctx);
        this._drawEnemies(ctx);
        this._drawPlayer(ctx, this.player);
        ctx.restore();

        this.drawForeground(ctx);
    }

    /* ── Hooks obrigatórios ───────────────────────────── */

    onPlayerLand(platform) {
        if (this.player.vy > 2.5)
            this.particles.spawnBurst(
                this.player.x + this.player.w / 2 - this.world.cameraX,
                this.player.getBottom(), 'rgba(100,185,255,0.65)', 6, 0.018);

        if (platform?.data?.breakable && platform.data.hits > 0) {
            platform.data.hits--;
            if (platform.data.hits <= 0) {
                const sx = platform.x + platform.w / 2 - this.world.cameraX;
                this.particles.spawnBurst(sx, platform.y, '#f59e0b', 10, 0.06);
                this.particles.spawnFloat(sx, platform.y - 14, '💥 Plataforma destruída!', '#fbbf24', 12);
                this._setTimeout(() => { this.world.removePlatform(platform); this._buildPlatCache(); }, 200);
            }
        }
    }

    onPlayerFall() { this.player.reset(45, 25); }

    /* ── Fundo ────────────────────────────────────────── */

    drawBackground(ctx) {
        const W = this.canvas.width, H = this.canvas.height;
        const t = this._frame * 0.009;

        // Gradiente cacheado — recriado apenas se o canvas mudar de tamanho
        if (this._bgGradH !== H) {
            this._bgGrad  = ctx.createLinearGradient(0, 0, 0, H);
            this._bgGrad.addColorStop(0,   '#0a3d5c');
            this._bgGrad.addColorStop(0.3, '#0d4f6e');
            this._bgGrad.addColorStop(1,   '#061c2e');
            this._bgGradH = H;
        }
        ctx.fillStyle = this._bgGrad;
        ctx.fillRect(0, 0, W, H);

        // Raios de luz: todos num único path → 1 fill() em vez de 3
        ctx.save();
        ctx.globalAlpha = 0.044; ctx.fillStyle = '#7dd3fc';
        ctx.beginPath();
        for (let i = 0; i < 3; i++) {
            const rx = W * (0.15 + i * 0.35) + Math.sin(t + i * 1.2) * 18;
            ctx.moveTo(rx - 14, 0); ctx.lineTo(rx + 14, 0);
            ctx.lineTo(rx + 65, H); ctx.lineTo(rx - 65, H);
            ctx.closePath();
        }
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = 0.55; ctx.strokeStyle = '#7dd3fc';
        ctx.lineWidth = 2; ctx.setLineDash([9, 7]);
        ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(W, 2); ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Bolhas: ctx.rect() acumula geometria → 1 ctx.fill() em vez de 40 fillRect()
        if (this._bubbles.length) {
            ctx.save();
            ctx.fillStyle = 'rgba(180,222,255,0.72)';
            ctx.beginPath();
            for (const b of this._bubbles) {
                const sx = b.x - this.world.cameraX;
                if (sx < -10 || sx > W + 10) continue;
                const d = b.r * 2 | 0;
                ctx.rect(Math.round(sx - b.r), Math.round(b.y - b.r), d || 1, d || 1);
            }
            ctx.fill();
            ctx.restore();
        }
    }

    /* ── HUD / Foreground ─────────────────────────────── */

    drawForeground(ctx) {
        const W = this.canvas.width, H = this.canvas.height;
        const t = this._frame * 0.016;
        const frac = this.oxygen / OXYGEN_MAX;
        const timeLeft = this.timer?.timeLeft ?? 0;

        // Barra de oxigênio
        const bx = 10, by = 10, bw = Math.min(W * 0.28, 180), bh = 13;
        const oxyColor = frac > 0.5 ? '#38bdf8' : frac > 0.25 ? '#fbbf24' : '#ef4444';
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.50)';
        ctx.beginPath(); ctx.roundRect(bx - 2, by - 2, bw + 4, bh + 4, 6); ctx.fill();
        if (frac > 0) {
            ctx.fillStyle = oxyColor; ctx.globalAlpha = 0.88;
            ctx.beginPath(); ctx.roundRect(bx, by, bw * frac, bh, 4); ctx.fill();
        }
        ctx.globalAlpha = 1; ctx.fillStyle = '#e0f4ff';
        ctx.font = `bold ${Math.round(bh * 0.80)}px sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`🌬️ ${Math.round(this.oxygen)}%`, bx + 4, by + 1);
        ctx.restore();

        // Aviso de oxigênio baixo
        if (frac < 0.25) {
            ctx.save();
            ctx.globalAlpha = 0.20 + Math.sin(t * 6) * 0.16;
            ctx.fillStyle = '#ef4444'; ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 0.92; ctx.fillStyle = '#fff1f0';
            ctx.font = `bold ${Math.round(W * 0.026)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('⚠️ OXIGÊNIO BAIXO! Vá à superfície!', W / 2, by + bh + 6);
            ctx.restore();
        }

        // Aviso de tempo baixo
        if (timeLeft <= 15 && timeLeft > 0) {
            ctx.save();
            ctx.globalAlpha = 0.18 + Math.sin(t * 8) * 0.14;
            ctx.fillStyle = '#f59e0b'; ctx.fillRect(0, 0, W, H);
            ctx.globalAlpha = 0.95; ctx.fillStyle = '#fef3c7';
            ctx.font = `bold ${Math.round(W * 0.026)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText(`⏳ ${timeLeft}s restantes!`, W / 2, H - 6);
            ctx.restore();
        }

        // Borda de hit
        if (this._hitCooldown > 0 && Math.floor(this._hitCooldown / 6) % 2 === 0) {
            ctx.save();
            ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 6; ctx.globalAlpha = 0.75;
            ctx.strokeRect(0, 0, W, H);
            ctx.restore();
        }

        // Indicador de superfície
        if (this.player.y <= 6 && this.oxygen < OXYGEN_MAX) {
            ctx.save();
            ctx.globalAlpha = 0.85; ctx.fillStyle = '#38bdf8';
            ctx.font = `bold ${Math.round(W * 0.022)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'top';
            ctx.fillText('💨 Recarregando oxigênio…', W / 2, by + bh + 6);
            ctx.restore();
        }

        // Dica inicial
        if (this._frame < 280) {
            ctx.save();
            ctx.globalAlpha = Math.min(1, (280 - this._frame) / 60);
            ctx.fillStyle = '#7dd3fc'; ctx.font = `${Math.round(W * 0.018)}px sans-serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
            ctx.fillText('🐢🐬 aproxime-se para libertar · 🗑️ colete lixo · 🦈🪼 fuja dos inimigos!', W / 2, H - 4);
            ctx.restore();
        }

        this.particles.draw(ctx);
    }

    /* ── Renderização: plataformas ────────────────────── */

    _drawPlatform(ctx, def) {
        const { x, y, w, h, type, data } = def;

        if (type === 'hazard') {
            // Textura da rede cacheada por (w×h) — evita N² lineTo por frame
            const netKey = `${w}x${h}`;
            if (!this._netCache) this._netCache = new Map();
            if (!this._netCache.has(netKey)) {
                const oc  = new OffscreenCanvas(w, h);
                const oc2 = oc.getContext('2d');
                oc2.fillStyle = 'rgba(175,95,18,0.22)';
                oc2.fillRect(0, 0, w, h);
                oc2.strokeStyle = '#b5651d'; oc2.lineWidth = 1.2; oc2.globalAlpha = 0.68;
                const step = 18;
                // Grade diagonal simples (sem sin — estática, pré-renderizada)
                for (let lx = 0; lx <= w; lx += step) {
                    oc2.beginPath(); oc2.moveTo(lx, 0); oc2.lineTo(lx, h); oc2.stroke();
                }
                for (let ly = 0; ly <= h; ly += step) {
                    oc2.beginPath(); oc2.moveTo(0, ly); oc2.lineTo(w, ly); oc2.stroke();
                }
                // Diagonais
                oc2.globalAlpha = 0.35;
                for (let lx = -h; lx <= w; lx += step) {
                    oc2.beginPath(); oc2.moveTo(lx, 0); oc2.lineTo(lx + h, h); oc2.stroke();
                }
                this._netCache.set(netKey, oc);
            }
            ctx.save();
            ctx.drawImage(this._netCache.get(netKey), x, y);
            ctx.globalAlpha = 0.65 + Math.sin(this._frame * 0.05) * 0.22;
            { const sp = emojiSprite('🕸️', 13); ctx.drawImage(sp, Math.round(x + w / 2 - sp.width / 2), Math.round(y + h / 2 - sp.height / 2)); }
            if (data?.moving) {
                ctx.globalAlpha = 0.55; ctx.fillStyle = '#fbbf24';
                ctx.font = '10px sans-serif'; ctx.fillText('↔', x + w / 2, y - 7);
            }
            ctx.restore();
            return;
        }

        const kind = data?.kind ?? 'rock';

        if (kind === 'floor') {
            ctx.fillStyle = '#1e3a14'; ctx.fillRect(x, y, w, h);
            ctx.fillStyle = '#2d5a20';
            for (let i = 0; i < w; i += 14) {
                ctx.beginPath(); ctx.arc(x + i + 6, y + 4, 3, 0, Math.PI * 2); ctx.fill();
            }
            return;
        }

        const palettes = {
            coral: { base: '#7b3b12', top: '#c06030' },
            rock:  { base: '#3a4556', top: '#5c6e84' },
            hull:  { base: '#252e3c', top: '#3c4e62' },
        };
        const c = palettes[kind] ?? palettes.rock;

        ctx.save();
        // Plataforma quebrável: trinca visual quando hits = 1
        if (data?.breakable && data.hits <= 1) {
            ctx.fillStyle = 'rgba(239,68,68,0.18)'; ctx.fillRect(x, y, w, h);
        }
        ctx.fillStyle = c.base;
        ctx.beginPath(); ctx.roundRect(x, y + 4, w, h - 4, 3); ctx.fill();
        ctx.fillStyle = c.top;
        ctx.beginPath(); ctx.roundRect(x + 2, y, w - 4, 8, 3); ctx.fill();
        if (data?.breakable) {
            // Linhas de trinca
            ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + w * 0.3, y); ctx.lineTo(x + w * 0.4, y + h); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x + w * 0.65, y); ctx.lineTo(x + w * 0.55, y + h); ctx.stroke();
        }
        ctx.restore();
    }

    /* ── Renderização: player ─────────────────────────── */

    _drawPlayer(ctx, body) {
        const { x, y, w, h } = body;
        const hit = this._hitCooldown > 0 && Math.floor(this._hitCooldown / 5) % 2 === 0;
        const sp  = emojiSprite('🤿', Math.round(h * 1.12));
        ctx.save();
        if (hit) ctx.globalAlpha = 0.28;
        ctx.translate(x + w / 2, y + h / 2);
        if (this._swimming) ctx.rotate(Math.sin(this._frame * 0.28) * 0.10);
        ctx.drawImage(sp, -sp.width / 2, -sp.height / 2);
        ctx.restore();
    }

    /* ── Renderização: animais ────────────────────────── */

    _drawAnimals(ctx) {
        const t  = this._frame;
        const spTurtle = emojiSprite('🐢', 22);
        const spDugong = emojiSprite('🐬', 22);
        ctx.save();
        // Halos: todos num único path → 1 fill() em vez de 8 fillRect()
        ctx.fillStyle = '#fbbf24'; ctx.globalAlpha = 0.30;
        ctx.beginPath();
        for (const a of this.animals) {
            if (a.freed) continue;
            const bob = Math.sin(t * 0.052 + a.phase) * 3;
            ctx.rect(Math.round(a.x - 17), Math.round(a.y + bob - 17), 34, 34);
        }
        ctx.fill();
        // Sprites (drawImage não é batchable)
        ctx.globalAlpha = 1;
        for (const a of this.animals) {
            if (a.freed) continue;
            const bob = Math.sin(t * 0.052 + a.phase) * 3;
            const sp  = a.type === 'turtle' ? spTurtle : spDugong;
            ctx.drawImage(sp, Math.round(a.x - sp.width / 2), Math.round(a.y + bob - sp.height / 2));
        }
        ctx.restore();
    }

    /* ── Renderização: lixo ───────────────────────────── */

    _drawTrash(ctx) {
        const t = this._frame;
        ctx.save();
        for (const tr of this._trash) {
            if (tr.collected) continue;
            const bob = Math.sin(t * 0.045 + tr.phase) * 2;
            const sp  = emojiSprite(tr.emoji, 17);
            ctx.globalAlpha = 0.88;
            ctx.drawImage(sp, Math.round(tr.x - sp.width / 2), Math.round(tr.y + bob - sp.height / 2));
        }
        ctx.restore();
    }

    /* ── Renderização: espinhos ───────────────────────── */

    _drawSpikes(ctx) {
        ctx.save();
        for (const s of this._spikes) {
            const count = Math.floor(s.w / 9);
            const sw = s.w / count;
            ctx.fillStyle = '#dc2626'; ctx.globalAlpha = 0.88;
            for (let i = 0; i < count; i++) {
                const sx = s.x + i * sw + sw / 2;
                ctx.beginPath();
                ctx.moveTo(sx,            s.y + s.h);
                ctx.lineTo(sx - sw * 0.38, s.y + s.h);
                ctx.lineTo(sx,            s.y);
                ctx.closePath(); ctx.fill();
            }
        }
        ctx.restore();
    }

    /* ── Renderização: inimigos ───────────────────────── */

    _drawEnemies(ctx) {
        const t = this._frame;
        for (const e of this._enemies) {
            ctx.save();

            if (e.type === 'shark') {
                // Cache permanente: tubarão não anima forma, só posição
                if (!e._sharkOc) {
                    const pad = 5;
                    const cy  = Math.ceil(e.h * 1.2 + pad);
                    e._sharkOc = new OffscreenCanvas(e.w + pad * 2, Math.ceil(e.h * 2 + pad * 2));
                    e._sharkCx = e.w / 2 + pad;
                    e._sharkCy = cy;
                    const oc = e._sharkOc.getContext('2d');
                    oc.translate(e._sharkCx, e._sharkCy);
                    oc.scale(-1, 1);
                    oc.fillStyle = '#64748b';
                    oc.beginPath(); oc.ellipse(0, 0, e.w / 2, e.h / 2, 0, 0, Math.PI * 2); oc.fill();
                    oc.beginPath();
                    oc.moveTo(-e.w * 0.48, 0);
                    oc.lineTo(-e.w * 0.78, -e.h * 0.70);
                    oc.lineTo(-e.w * 0.78,  e.h * 0.70);
                    oc.closePath(); oc.fill();
                    oc.fillStyle = '#475569';
                    oc.beginPath();
                    oc.moveTo(e.w * 0.05, -e.h * 0.45);
                    oc.lineTo(e.w * 0.28, -e.h * 1.18);
                    oc.lineTo(e.w * 0.50, -e.h * 0.45);
                    oc.closePath(); oc.fill();
                    oc.fillStyle = '#fff';
                    oc.beginPath(); oc.arc(e.w * 0.30, -e.h * 0.08, 3.5, 0, Math.PI * 2); oc.fill();
                    oc.fillStyle = '#000';
                    oc.beginPath(); oc.arc(e.w * 0.30, -e.h * 0.08, 2,   0, Math.PI * 2); oc.fill();
                }
                ctx.drawImage(e._sharkOc,
                    e.x + e.w / 2 - e._sharkCx,
                    e.y + e.h / 2 - e._sharkCy);

            } else if (e.type === 'jelly') {
                // Cache temporal por medusa: 1 arc + 5 bezier → 1 drawImage por frame
                if (!e._jellyOc) {
                    const pad = 10;
                    e._jellyOc  = new OffscreenCanvas(e.w + pad * 2, e.h + pad);
                    e._jellyCx  = e.w / 2 + pad;
                    e._jellyCy  = Math.round(e.h * 0.3) + pad;
                    e._jellyTick = -99;
                }
                if (this._frame - e._jellyTick >= 3) {
                    e._jellyTick = this._frame;
                    const oc = e._jellyOc.getContext('2d');
                    oc.clearRect(0, 0, e._jellyOc.width, e._jellyOc.height);
                    oc.save(); oc.translate(e._jellyCx, e._jellyCy);
                    oc.globalAlpha = 0.72;
                    oc.fillStyle = 'rgba(192,132,252,0.80)';
                    oc.beginPath();
                    oc.arc(0, 0, e.w / 2, Math.PI, 0); oc.closePath(); oc.fill();
                    oc.strokeStyle = 'rgba(192,132,252,0.60)'; oc.lineWidth = 1.4;
                    for (let i = 0; i < 5; i++) {
                        const tx  = -e.w * 0.38 + i * (e.w * 0.19);
                        const mid = Math.sin(t * 0.14 + i) * 5;
                        oc.beginPath(); oc.moveTo(tx, 3);
                        oc.lineTo(tx + mid, e.h * 0.45);
                        oc.lineTo(tx + Math.sin(t * 0.09 + i * 0.8) * 4, e.h * 0.85);
                        oc.stroke();
                    }
                    oc.restore();
                }
                const bob = Math.sin(t * 0.10 + e.phase) * 4;
                ctx.drawImage(e._jellyOc,
                    e.x + e.w / 2 - e._jellyCx,
                    e.y + e.h * 0.3 + bob - e._jellyCy);
            }

            ctx.restore();
        }
    }

    /* ── Decorações ───────────────────────────────────── */

    _drawDecorations(ctx) {
        // Algas: batched por cor → 2 stroke() em vez de 30 (cada stroke() = 1 GPU flush)
        const t   = this._frame;
        const cam = this.world.cameraX;
        const vW  = this.canvas.width;
        ctx.save();
        ctx.globalAlpha = 0.58;
        ctx.lineWidth = 2.8; ctx.lineCap = 'round';
        for (const color of ['#1a6b3a', '#2d8b55']) {
            ctx.strokeStyle = color;
            ctx.beginPath();
            for (const d of this._decorations) {
                if (d.type !== 'seaweed' || d.color !== color) continue;
                if (d.x < cam - 80 || d.x > cam + vW + 80) continue;
                const sway = Math.sin(t * 0.042 + d.phase) * 7;
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x + sway * 0.5, d.y - d.height * 0.5);
                ctx.lineTo(d.x + sway * 0.5, d.y - d.height);
            }
            ctx.stroke();
        }
        ctx.restore();
        // Corais: baked no _platCache (estáticos), não renderizados aqui

        // Peixes decorativos: sprite por objeto (elimina ellipse+fill por frame)
        ctx.save();
        ctx.globalAlpha = 0.40;
        for (const fish of this._fish) {
            if (!fish._sprite) {
                const ox = fish.size * 1.45 + 1;
                const sw = Math.ceil(ox + fish.size + 2);
                const sh = Math.ceil(fish.size * 1.2 + 4);
                const oc = new OffscreenCanvas(sw, sh);
                const o  = oc.getContext('2d');
                const oy = sh / 2;
                o.fillStyle = fish.color;
                o.beginPath();
                o.ellipse(ox, oy, fish.size, fish.size * 0.54, 0, 0, Math.PI * 2);
                o.fill();
                o.beginPath();
                o.moveTo(ox - fish.size * 0.8,  oy);
                o.lineTo(ox - fish.size * 1.45, oy - fish.size * 0.52);
                o.lineTo(ox - fish.size * 1.45, oy + fish.size * 0.52);
                o.closePath(); o.fill();
                fish._sprite = oc;
                fish._ox = ox; fish._oy = oy;
            }
            ctx.save();
            ctx.translate(fish.x, fish.y + Math.sin(fish.phase) * 2);
            if (fish.dir < 0) ctx.scale(-1, 1);
            ctx.drawImage(fish._sprite, -fish._ox, -fish._oy);
            ctx.restore();
        }
        ctx.restore();
    }

    /* ── Fim de jogo ──────────────────────────────────── */

    _endWithResult(success, reason) {
        if (this._gameOverShown || !this.gameActive) return;
        this._gameOverShown = true;

        this.timer?.stop();

        let oxyBonus = 0, timeBonus = 0;
        if (success) {
            oxyBonus  = Math.round(this.oxygen * 2);
            timeBonus = Math.round((this.timer?.timeLeft ?? 0) * 3);
            this.score.add(oxyBonus + timeBonus);
            if (this.trashCollected >= TOTAL_TRASH) this.score.add(300); // bônus perfeito
        }

        super.endGame();

        const isNewRecord = this.score.saveRecord();
        if (success && !this.isReplay) this._store.setBool('completed', true);
        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        const titles = { win:'🐢 Missão Cumprida!', oxygen:'💨 Sem Oxigênio!',
                         lives:'🕸️ Enredado...', timeout:'⏰ Tempo Esgotado!' };

        const bonusRows = [];
        if (oxyBonus  > 0) bonusRows.push({ html: `<div style="color:#7dd3fc;font-size:0.83rem;">🌬️ Bônus oxigênio: +${oxyBonus}</div>` });
        if (timeBonus > 0) bonusRows.push({ html: `<div style="color:#a3e635;font-size:0.83rem;">⏱️ Bônus de tempo: +${timeBonus}</div>` });
        if (this.trashCollected >= TOTAL_TRASH && success)
            bonusRows.push({ html: `<div style="color:#fbbf24;font-size:0.83rem;">♻️ Limpeza total! +300</div>` });

        const wrapper = this.container.querySelector('.m5-wrap');
        const overlay = GameOverlay.show(wrapper, {
            title:      titles[reason] ?? (success ? '🐢 Vitória!' : '❌ Fim'),
            titleColor: success ? '#2ecc71' : '#ff6b6b',
            rows: [
                GameOverlay.scoreRow(this.score.score),
                { html: `<div style="color:#e0f4ff;">Animais soltos: <strong style="color:#fbbf24">${this.freedCount}/${TOTAL_ANIMALS}</strong></div>` },
                { html: `<div style="color:#e0f4ff;">Lixo coletado: <strong style="color:#fbbf24">${this.trashCollected}/${TOTAL_TRASH}</strong></div>` },
                ...bonusRows,
            ],
            badges: [
                GameOverlay.recordBadge(isNewRecord),
                GameOverlay.prevRecordBadge(this.score.bestScore, isNewRecord),
            ],
            buttons: [
                GameOverlay.replayButton('m5-btn-replay', '🔄 Jogar Novamente',
                    () => { GameOverlay.dismiss(overlay); this._restart(); }),
                GameOverlay.continueButton('m5-btn-continue',
                    success ? '✅ Continuar' : '🗺️ Voltar ao Mapa',
                    success && !this.isReplay,
                    () => { GameOverlay.dismiss(overlay); this.finishGame(success && !this.isReplay, this.score.score); }),
            ],
            footer: 'Canal de Moçambique · +640 mil ton. de redes-fantasma no oceano por ano',
        });
    }

    _restart() {
        this.oxygen          = OXYGEN_MAX;
        this._hitCooldown    = 0;
        this._oxygenDepleted = false;
        this.freedCount      = 0;
        this.trashCollected  = 0;
        this._gameOverShown  = false;
        this._frame          = 0;
        this._swimming       = false;
        this._bubbles        = [];
        this._enemies        = [];
        this.isReplay        = true;

        this.lives.reset();
        this.score.reset();
        this.particles.clear();
        this._netCache  = null; // nets são recriados com novas posições
        this._platCache = null;
        this._bgGradH   = -1;

        this.hud.setText('score', 0);
        this.hud.setText('freed',  0);
        this.hud.setText('trash',  0);
        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        this.world.clearPlatforms();
        this._genDecorations();
        this.spawnPlatforms();
        this._spawnInitialEnemies();

        this.player.reset(45, 25);
        this.world.cameraX = 0;

        this.timer.reset(TIMER_SECS);
        this.timer.start();

        this.input = new InputController(this.canvas);

        this.gameActive = true;
        this.gameLoop();
    }
}
