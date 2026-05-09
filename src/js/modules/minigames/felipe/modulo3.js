// Felipe - Módulo 3 (Mata Atlântica)
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
    PowerUpSystem,
    EcosystemMeter,
    EventScheduler,
    WaveSystem,
    emojiSprite,
} from './gamekit.js';

/* ── Definições de ondas ────────────────────────── */
// speedMult:   multiplicador da velocidade dos itens
// extraSpawns: itens extras por ciclo de spawn (além do 1 base)
const WAVE_DEFS = [
    { speedMult: 0.80, extraSpawns: 0 },
    { speedMult: 1.00, extraSpawns: 0 },
    { speedMult: 1.25, extraSpawns: 1 },
    { speedMult: 1.55, extraSpawns: 1 },
    { speedMult: 1.90, extraSpawns: 2 },
];

/* ── Definições de missões ──────────────────────── */
const MISSION_DEFS = [
    { id: 'consec5',  text: 'Capture 5 seguidos',    type: 'consecutive_catch', target: 5,    reward: { powerup: 'big_net'    } },
    { id: 'catch10',  text: 'Capture 10 itens',      type: 'total_catch',       target: 10,   reward: { powerup: 'extra_time' } },
    { id: 'combo3',   text: 'Alcance combo ×3',       type: 'reach_combo',       target: 3,    reward: { pts: 25               } },
    { id: 'survive20',text: 'Sobreviva 20s inteiros', type: 'survive_frames',    target: 1200, reward: { pts: 40               } },
];

/* ── Definições de power-ups ────────────────────── */
const POWERUP_DEFS = {
    big_net:    { emoji: '🌀', label: 'Rede Gigante', frames: 480  },  // 8s
    slow_mo:    { emoji: '🔵', label: 'Slow Motion',  frames: 360  },  // 6s
    extra_time: { emoji: '⏰', label: 'Tempo Extra',  frames: 0    },  // instant
    magnet:     { emoji: '🧲', label: 'Ímã',          frames: 0    },  // instant
};

export class Modulo3 extends CanvasMinigame {
    constructor(containerElement, onGameEnd, options = {}) {
        super(containerElement, onGameEnd, options);

        this.items            = [];
        this.netRadius        = 36;
        this.netPulse         = 0;
        this.mouseX           = 0;
        this.mouseY           = 0;
        this.speedMultiplier  = WAVE_DEFS[0].speedMult;
        this.legendarySpawned = false;
        this.rainDrops        = [];
        this.isRaining        = false;
        this._waveBreak       = false;

        this._store          = new PersistenceStore('m3');
        this._bgCache        = null;
        this._bgCacheRaining = undefined;
        this._bgCacheW       = 0;
    }

    start() {
        const bestScore = this._store.getInt('best_score', 0);

        this.container.innerHTML = `
            <style>
                .m3-wrapper {
                    position: relative; width: 100%; display: flex;
                    flex-direction: column; align-items: center;
                    background: #0d1f2d; border-radius: 12px;
                    overflow: hidden; user-select: none; font-family: sans-serif;
                }
                .m3-hud {
                    display: flex; justify-content: space-between; align-items: center;
                    width: 100%; padding: 0.5rem 1.2rem; box-sizing: border-box;
                    background: rgba(0,0,0,0.5); color: #e0f4ff;
                    font-size: 0.9rem; gap: 0.5rem; flex-wrap: wrap;
                }
                .m3-hud strong { color: #7df0c8; }
                .m3-hud-item  { display: flex; align-items: center; gap: 0.35rem; }
                .m3-combo {
                    font-size: 1rem; font-weight: 900; color: #ffd600;
                    transition: transform 0.1s; min-width: 60px; text-align: center;
                }
                .m3-combo.bump { transform: scale(1.4); }
                .m3-mission-bar {
                    width: 100%; padding: 0.25rem 1.2rem; box-sizing: border-box;
                    background: rgba(0,0,0,0.35); display: flex;
                    align-items: center; gap: 0.6rem; font-size: 0.78rem; color: #aee0f5;
                }
                .m3-mission-track {
                    flex: 1; height: 6px; background: rgba(255,255,255,0.12);
                    border-radius: 3px; overflow: hidden;
                }
                .m3-mission-fill {
                    height: 100%; background: #ffd600; border-radius: 3px;
                    transition: width 0.3s;
                }
                .m3-powerup-row {
                    width: 100%; min-height: 22px; padding: 0.1rem 1.2rem;
                    box-sizing: border-box; display: flex; gap: 0.5rem;
                    font-size: 0.82rem; color: #e0f4ff;
                }
                #m3-canvas { cursor: none; display: block; max-width: 100%; }
                .m3-tip {
                    color: #6a9fb5; font-size: 0.78rem;
                    padding: 0.3rem 0.8rem; text-align: center;
                }
                .m3-tip strong { color: #aee0f5; }
            </style>
            <div class="m3-wrapper">
                <div class="m3-hud">
                    <div class="m3-hud-item">Pontos: <strong id="m3-score">0</strong></div>
                    <div class="m3-hud-item">Combo: <span class="m3-combo" id="m3-combo">—</span></div>
                    <div class="m3-hud-item" id="m3-hearts">❤️❤️❤️❤️❤️</div>
                    <div class="m3-hud-item">🌊 Onda: <strong id="m3-wave">1</strong></div>
                    <div class="m3-hud-item">Tempo: <strong id="m3-timer">45</strong>s</div>
                    <div class="m3-hud-item" id="m3-best-wrap" style="${bestScore > 0 ? '' : 'display:none'}">🏆 <strong id="m3-best">${bestScore}</strong></div>
                </div>
                <div class="m3-mission-bar">
                    <span>🎯 <span id="m3-mission-text">—</span></span>
                    <div class="m3-mission-track"><div class="m3-mission-fill" id="m3-mission-fill" style="width:0%"></div></div>
                    <span id="m3-mission-prog">0</span>
                </div>
                <div class="m3-powerup-row" id="m3-powerup-row"></div>
                <canvas id="m3-canvas"></canvas>
                <p class="m3-tip">Mova a rede e <strong>clique</strong> para capturar resíduos · Cuidado com os animais · Power-ups caem no rio!</p>
            </div>
        `;

        this._setupCanvas(this.container.querySelector('#m3-canvas'), 0.52);

        this.hud = new HUDController(this.container, {
            score:       '#m3-score',
            combo:       '#m3-combo',
            hearts:      '#m3-hearts',
            wave:        '#m3-wave',
            timer:       '#m3-timer',
            best:        '#m3-best',
            bestWrap:    '#m3-best-wrap',
            missionText: '#m3-mission-text',
            missionFill: '#m3-mission-fill',
            missionProg: '#m3-mission-prog',
            powerupRow:  '#m3-powerup-row',
        });

        // Sistemas
        this.lives     = new LivesSystem(5, this.hud, 'hearts');
        this.combo     = new ComboSystem(
            [{ min: 6, multiplier: 3 }, { min: 3, multiplier: 2 }, { min: 0, multiplier: 1 }],
            180,
        );
        this.score     = new ScoreSystem(this._store, 'best_score', this.combo);
        this.particles = new ParticleSystem();
        this.timer     = new GameTimer(45, this.hud, 'timer');
        this.powerups  = new PowerUpSystem();
        this.ecosystem = new EcosystemMeter(60);
        this.missions  = new MissionSystem(MISSION_DEFS);

        // Evento de chuva: 15–30s de intervalo, dura 9s
        this.events = new EventScheduler([
            { id: 'rain', minDelay: 15000, maxDelay: 30000, duration: 9000 },
        ]);

        // Ondas: 10s de ação + 3s de pausa
        this.waves = new WaveSystem(WAVE_DEFS, { waveDuration: 10000, breakDuration: 3000 });

        this._wireEvents();

        // Input
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });
        this.canvas.addEventListener('click', () => this.castNet());
        this.canvas.addEventListener('touchmove', e => {
            e.preventDefault();
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.touches[0].clientX - rect.left;
            this.mouseY = e.touches[0].clientY - rect.top;
        }, { passive: false });
        this.canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.castNet();
        }, { passive: false });

        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        this.gameActive = true;
        this.timer.start();
        this.missions.start();
        this.events.start();
        this.startSpawning();
        this.gameLoop();
    }

    _wireEvents() {
        this.score.on('changed', (val) => this.hud.setText('score', val));

        this.combo.on('increment', () => {
            this._syncComboHUD();
            this.missions.notifyCombo(this.combo.combo);
        });
        this.combo.on('broken', () => this._syncComboHUD());

        this.timer.on('expired', () => this.endGame());

        this.waves.on('waveStart', (num, def) => {
            this.speedMultiplier = def.speedMult;
            this._waveBreak = false;
            this.hud.setText('wave', num);
            this.particles.spawnFloat(this.canvas.width / 2, 50,
                `🌊 Onda ${num}!`, '#4dd0e1', 18);
        });
        this.waves.on('breakStart', (num) => {
            this._waveBreak = true;
            this.particles.spawnFloat(this.canvas.width / 2, 50,
                `✅ Onda ${num} superada! Prepare-se…`, '#7df0c8', 15);
        });

        this.powerups.on('activated', () => this._syncPowerupHUD());
        this.powerups.on('expired',   () => this._syncPowerupHUD());

        this.missions.on('new', (m) => {
            this.hud.setText('missionText', m.text);
            this.hud.setStyle('missionFill', 'width', '0%');
            this.hud.setText('missionProg', `0/${m.target}`);
        });
        this.missions.on('progress', (_m, cur, target) => {
            const pct = Math.min(100, Math.round((cur / target) * 100));
            this.hud.setStyle('missionFill', 'width', `${pct}%`);
            this.hud.setText('missionProg', `${cur}/${target}`);
        });
        this.missions.on('completed', (m) => this._applyMissionReward(m));

        this.events.on('start', (id) => {
            if (id === 'rain') {
                this.isRaining = true;
                this.particles.spawnFloat(this.canvas.width / 2, 40, '🌧️ Chuva! Mais poluição!', '#a0d8ef', 15);
            }
        });
        this.events.on('end', (id) => {
            if (id === 'rain') {
                this.isRaining = false;
                this.rainDrops = [];
            }
        });
    }

    /* ── Recompensa de missão ─────────────────── */
    _applyMissionReward(mission) {
        const r = mission.reward;
        this.particles.spawnFloat(this.canvas.width / 2, 55, `🎯 Missão: ${mission.text}!`, '#ffd600', 14);

        if (r.pts)     { this.score.add(r.pts); }
        if (r.powerup) { this._activatePowerup(r.powerup); }
    }

    _activatePowerup(id) {
        const def = POWERUP_DEFS[id];
        if (!def) return;

        if (id === 'magnet') {
            // Ímã: captura instantânea de todos os itens de lixo na tela
            let caught = 0;
            for (const item of this.items) {
                if (item.caught || item.fadeOut) continue;
                if (item.type === 'trash' || item.type === 'special') {
                    item.caught = item.fadeOut = true;
                    this.combo.increment();
                    const pts = this.score.add(item.type === 'special' ? 25 : 10, true);
                    this.particles.spawnRadial(item.x, item.y, '#ffd600', 8, 2, 4, 4, 7);
                    this.particles.spawnFloat(item.x, item.y, `+${pts}`, '#ffd600', 14);
                    this.ecosystem.gain(3);
                    caught++;
                }
            }
            this.particles.spawnFloat(this.canvas.width / 2, 60,
                `🧲 Ímã! ${caught} itens coletados`, '#ffd600', 15);
        } else if (id === 'extra_time') {
            // Acrescenta 10s ao timer
            this.timer.timeLeft = Math.min(this.timer.totalSeconds, this.timer.timeLeft + 10);
            this.hud.setText('timer', this.timer.timeLeft);
            this.particles.spawnFloat(this.canvas.width / 2, 60, '⏰ +10 segundos!', '#7df0c8', 15);
        } else if (def.frames > 0) {
            this.powerups.activate(id, def.frames);
            this.particles.spawnFloat(this.canvas.width / 2, 60,
                `${def.emoji} ${def.label} ativado!`, '#a78bfa', 15);
        }
        this._syncPowerupHUD();
    }

    _syncPowerupHUD() {
        const ids = this.powerups.getActiveIds();
        const row = this.container.querySelector('#m3-powerup-row');
        if (!row) return;
        if (ids.length === 0) { row.textContent = ''; return; }
        row.innerHTML = ids.map(id => {
            const def = POWERUP_DEFS[id];
            const secs = Math.ceil(this.powerups.remaining(id) / 60);
            return `<span style="background:rgba(167,139,250,0.25);padding:1px 8px;border-radius:10px;">${def.emoji} ${def.label} ${secs}s</span>`;
        }).join('');
    }

    /* ── Spawning ─────────────────────────────── */
    startSpawning() {
        for (let i = 0; i < 4; i++) this._setTimeout(() => this.spawnItem(), i * 450);
        this._setInterval(() => {
            if (this._waveBreak) return;  // pausa entre ondas: sem spawn
            const def    = this.waves.currentDef;
            const extras = (def?.extraSpawns ?? 0) + (this.isRaining ? 1 : 0);
            for (let i = 0; i <= extras; i++) this.spawnItem();
        }, 1000);

        // Legendary: uma vez, entre 8s–35s
        this._setTimeout(() => this.spawnLegendary(), (8 + Math.random() * 27) * 1000);

        // Power-ups: surgem a cada 18–28s
        this._setTimeout(() => this._schedulePowerupSpawn(), (18 + Math.random() * 10) * 1000);
    }

    _schedulePowerupSpawn() {
        if (!this.gameActive) return;
        this.spawnPowerup();
        this._setTimeout(() => this._schedulePowerupSpawn(), (18 + Math.random() * 10) * 1000);
    }

    spawnPowerup() {
        if (!this.gameActive) return;
        const h    = this.canvas.height;
        const keys = Object.keys(POWERUP_DEFS);
        const id   = keys[Math.floor(Math.random() * keys.length)];
        const def  = POWERUP_DEFS[id];
        this.items.push({
            x: this.canvas.width + 40,
            y: 25 + Math.random() * (h - 50),
            emoji: def.emoji,
            type: 'powerup',
            powerupId: id,
            speed: 2.5 + Math.random() * 1.5,
            size: 30,
            bobPhase: Math.random() * Math.PI * 2,
            alpha: 1,
            caught: false,
            fadeOut: false,
        });
    }

    spawnLegendary() {
        if (!this.gameActive || this.legendarySpawned) return;
        this.legendarySpawned = true;
        const h = this.canvas.height;
        this.items.push({
            x: this.canvas.width + 40,
            y: 25 + Math.random() * (h - 50),
            emoji: '☄️',
            type: 'legendary',
            speed: 9 + Math.random() * 3,
            size: 32,
            bobPhase: Math.random() * Math.PI * 2,
            alpha: 1,
            caught: false,
            fadeOut: false,
        });
    }

    spawnItem() {
        if (!this.gameActive) return;
        const h    = this.canvas.height;
        const roll = Math.random();
        let type, emoji;

        if (roll < 0.10) {
            type = 'special'; emoji = '🛢️';
        } else if (roll < 0.65) {
            type  = 'trash';
            const trashTypes = ['🍶', '🥤', '🛍️', '🥫', '👟', '🧴'];
            emoji = trashTypes[Math.floor(Math.random() * trashTypes.length)];
        } else {
            type  = 'wild';
            const wildTypes = ['🐟', '🐸', '🦆', '🦦', '🐊'];
            emoji = wildTypes[Math.floor(Math.random() * wildTypes.length)];
        }

        this.items.push({
            x: this.canvas.width + 40,
            y: 25 + Math.random() * (h - 50),
            emoji, type,
            speed: 1.4 + Math.random() * 1.6,
            size: type === 'special' ? 36 : 26 + Math.random() * 10,
            bobPhase: Math.random() * Math.PI * 2,
            alpha: 1,
            caught: false,
            fadeOut: false,
        });
    }

    /* ── Net / interação ──────────────────────── */
    castNet() {
        if (!this.gameActive) return;
        this.netPulse = 1;

        // Raio efetivo leva big_net em conta
        const r = this.netRadius * (this.powerups.isActive('big_net') ? 2 : 1);

        for (const item of this.items) {
            if (item.caught || item.fadeOut) continue;
            if (CanvasMinigame.distance(item.x, item.y, this.mouseX, this.mouseY) >= r) continue;

            item.caught = item.fadeOut = true;

            if (item.type === 'powerup') {
                this._activatePowerup(item.powerupId);
                this.particles.spawnRadial(item.x, item.y, '#a78bfa', 10, 2, 5, 3, 6);

            } else if (item.type === 'legendary') {
                this.combo.increment();
                const pts = this.score.add(100, true);
                this.particles.spawnRadial(item.x, item.y, '#fff',    8, 2, 4, 4, 7);
                this.particles.spawnRadial(item.x, item.y, '#a78bfa', 8, 2, 4, 4, 7);
                this.particles.spawnFloat(item.x, item.y, `+${pts} ☄️ LENDÁRIO!`, '#a78bfa', 16);
                this.ecosystem.gain(10);
                this.missions.notifyCatch(true);

            } else if (item.type === 'special') {
                this.combo.increment();
                const pts = this.score.add(25, true);
                this.particles.spawnRadial(item.x, item.y, '#ff9800', 8, 2, 4, 4, 7);
                this.particles.spawnFloat(item.x, item.y, `+${pts} 🛢️`, '#ff9800', 16);
                this.ecosystem.gain(5);
                this.missions.notifyCatch(true);

            } else if (item.type === 'trash') {
                this.combo.increment();
                const pts = this.score.add(10, true);
                this.particles.spawnRadial(item.x, item.y, '#7df0c8', 8, 2, 4, 4, 7);
                this.particles.spawnFloat(item.x, item.y, `+${pts}`, '#7df0c8', 16);
                this.ecosystem.gain(5);
                this.missions.notifyCatch(true);

            } else {
                // Animal selvagem
                const prevCombo = this.combo.combo;
                this.combo.breakCombo();
                this.score.subtract(5);
                this.ecosystem.lose(8);
                this.particles.spawnRadial(item.x, item.y, '#ff6b6b', 8, 2, 4, 4, 7);
                this.particles.spawnFloat(item.x, item.y,
                    prevCombo > 1 ? `−5 💔 combo perdido!` : '−5', '#ff6b6b', 16);
                this.missions.notifyCatch(false);
            }
        }
    }

    /* ── Game loop ────────────────────────────── */
    update() {
        const t = Date.now() / 1000;

        this.combo.tick();
        this.powerups.tick();
        this.missions.tick();

        // Gotas de chuva
        if (this.isRaining) {
            const w = this.canvas.width, h = this.canvas.height;
            if (Math.random() < 0.4) {
                this.rainDrops.push({
                    x: Math.random() * w,
                    y: -10,
                    len: 12 + Math.random() * 18,
                    speed: 9 + Math.random() * 6,
                });
            }
            for (const d of this.rainDrops) d.y += d.speed;
            this.rainDrops = this.rainDrops.filter(d => d.y < h + 20);
        }

        const waveMult  = this._waveBreak ? 0.5 : this.speedMultiplier;
        const speedMult = this.powerups.isActive('slow_mo') ? waveMult * 0.4 : waveMult;

        for (const item of this.items) {
            if (item.fadeOut) {
                item.alpha -= 0.09;
            } else {
                item.x -= item.speed * speedMult;
                item.y += Math.sin(t * 2 + item.bobPhase) * 0.35;
            }
        }

        this.items = this.items.filter(item => {
            if (item.alpha <= 0) return false;
            if (!item.fadeOut && item.x < -50) {
                if (item.type === 'trash' || item.type === 'special') {
                    this.score.subtract(2);
                    this.combo.breakCombo();
                    this.ecosystem.lose(3);
                    this.missions.notifyCatch(false);
                    const dead = this.lives.lose();
                    if (dead) { this.endGame(true); return false; }
                }
                return false;
            }
            return true;
        });

        this.particles.update();
        if (this.netPulse > 0) this.netPulse -= 0.06;
    }

    draw() {
        const ctx = this.ctx;
        const w   = this.canvas.width;
        const h   = this.canvas.height;
        const t   = Date.now() / 1000;

        const bankH = h * 0.12;

        // ── Background cacheado (gradiente + margens + árvores) ────────────
        // Recria apenas quando o estado de chuva muda ou o canvas muda de tamanho
        if (this._bgCacheRaining !== this.isRaining || this._bgCacheW !== w) {
            const oc  = new OffscreenCanvas(w, h);
            const oc2 = oc.getContext('2d');

            const grad = oc2.createLinearGradient(0, 0, 0, h);
            grad.addColorStop(0,    '#1a6b3c');
            grad.addColorStop(0.12, '#1a6b3c');
            grad.addColorStop(0.12, this.isRaining ? '#1a5080' : '#1b6fa0');
            grad.addColorStop(0.88, this.isRaining ? '#0d2a60' : '#1040a0');
            grad.addColorStop(0.88, '#1a6b3c');
            grad.addColorStop(1,    '#1a6b3c');
            oc2.fillStyle = grad;
            oc2.fillRect(0, 0, w, h);

            // Margens
            oc2.fillStyle = '#14532d';
            oc2.fillRect(0, 0, w, bankH);
            oc2.fillRect(0, h - bankH, w, bankH);

            // Árvores
            oc2.fillStyle = '#0f4023';
            for (const tx of [0.04,0.12,0.21,0.32,0.43,0.54,0.65,0.76,0.87,0.95]) {
                const px = tx * w;
                oc2.beginPath(); oc2.moveTo(px, bankH); oc2.lineTo(px-14,0); oc2.lineTo(px+14,0); oc2.closePath(); oc2.fill();
                oc2.beginPath(); oc2.moveTo(px, h-bankH); oc2.lineTo(px-14,h); oc2.lineTo(px+14,h); oc2.closePath(); oc2.fill();
            }

            this._bgCache        = oc;
            this._bgCacheRaining = this.isRaining;
            this._bgCacheW       = w;
        }
        ctx.drawImage(this._bgCache, 0, 0);

        // ── Shimmer da água (reduzido: 4 ondas, passo=12 → 7× menos lineTo) ──
        ctx.save();
        ctx.beginPath(); ctx.rect(0, bankH, w, h - bankH * 2); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.lineWidth = 1.5;
        for (let i = 0; i < 4; i++) {
            const yw = bankH + ((h - bankH * 2) / 4) * i + 10;
            ctx.beginPath();
            ctx.moveTo(0, yw + Math.sin(t * 1.8 + i * 0.9) * 3);
            for (let x = 12; x <= w; x += 12) {
                ctx.lineTo(x, yw + Math.sin(x * 0.025 + t * 1.8 + i * 0.9) * 3);
            }
            ctx.stroke();
        }
        ctx.restore();

        // Gotas de chuva
        if (this.isRaining && this.rainDrops.length > 0) {
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.strokeStyle = '#a0d8ef';
            ctx.lineWidth   = 1;
            for (const d of this.rainDrops) {
                ctx.beginPath();
                ctx.moveTo(d.x, d.y);
                ctx.lineTo(d.x - 2, d.y + d.len);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Hard-mode label — desenhado abaixo da barra do ecossistema (bankH + 4 + 14 + 6)
        if (this.combo.combo >= 3) {
            const mult  = this.combo.getMultiplier();
            const label = mult >= 3 ? '🔥 MODO DIFÍCIL' : '⚡ MODO DIFÍCIL';
            ctx.save();
            ctx.globalAlpha  = 0.85;
            ctx.fillStyle    = mult >= 3 ? '#ff6b35' : '#ffd600';
            ctx.font         = `bold ${Math.round(w * 0.022)}px sans-serif`;
            ctx.textAlign    = 'center';
            ctx.textBaseline = 'top';
            ctx.fillText(label, w / 2, bankH + 24);
            ctx.restore();
        }

        // Itens
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const hardMode     = this.combo.combo >= 3;
        const bigNetActive = this.powerups.isActive('big_net');
        for (const item of this.items) {
            const baseAlpha = item.type === 'legendary' ? 0.15
                : item.type === 'powerup' ? 1
                : hardMode ? 0.35 : 1;
            const drawAlpha = item.fadeOut ? item.alpha : baseAlpha;

            // Brilho sem shadowBlur — anel de alpha simples (GPU-friendly)
            if ((item.type === 'special' || item.type === 'powerup') && drawAlpha > 0) {
                const glowColor  = item.type === 'special' ? '#ff9800' : '#a78bfa';
                const glowAlpha  = (0.22 + Math.sin(t * (item.type === 'special' ? 4 : 5)) * 0.08) * drawAlpha;
                const glowRadius = item.size * 0.75;
                ctx.save();
                ctx.globalAlpha = glowAlpha;
                ctx.fillStyle   = glowColor;
                ctx.beginPath();
                ctx.arc(Math.round(item.x), Math.round(item.y), glowRadius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            ctx.save();
            ctx.globalAlpha = drawAlpha;
            const sp3 = emojiSprite(item.emoji, item.size);
            ctx.drawImage(sp3, Math.round(item.x - sp3.width / 2), Math.round(item.y - sp3.height / 2));
            ctx.restore();
        }

        // Partículas + textos flutuantes
        this.particles.draw(ctx);

        // Barra de ecossistema (sobre a água)
        const barW = w * 0.30;
        const barH = 14;
        this.ecosystem.draw(ctx, w / 2 - barW / 2, bankH + 4, barW, barH, '🌿');

        // Power-up slow-mo: tint azul suave
        if (this.powerups.isActive('slow_mo')) {
            ctx.save();
            ctx.globalAlpha = 0.10;
            ctx.fillStyle   = '#4dd0e1';
            ctx.fillRect(0, bankH, w, h - bankH * 2);
            ctx.restore();
        }

        // Cursor (rede)
        const nx = this.mouseX, ny = this.mouseY;
        const effectiveR = this.netRadius * (bigNetActive ? 2 : 1);
        const pulse      = Math.max(0, this.netPulse);
        const netR       = effectiveR + pulse * 10;
        const netAlpha   = 0.55 + pulse * 0.45;
        const mult       = this.combo.getMultiplier();
        const netColor   = bigNetActive ? '#a78bfa'
            : mult >= 3 ? '#ff6b35' : mult >= 2 ? '#ffd600' : '#d4f04a';

        ctx.save();
        ctx.globalAlpha = netAlpha;
        ctx.strokeStyle = netColor; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(nx, ny, netR, 0, Math.PI * 2); ctx.stroke();

        ctx.strokeStyle = `${netColor}55`; ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const a = (Math.PI / 5) * i;
            ctx.beginPath();
            ctx.moveTo(nx + Math.cos(a) * netR, ny + Math.sin(a) * netR);
            ctx.lineTo(nx - Math.cos(a) * netR, ny - Math.sin(a) * netR);
            ctx.stroke();
        }
        for (let rr = netR * 0.33; rr < netR; rr += netR * 0.33) {
            ctx.beginPath(); ctx.arc(nx, ny, rr, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = netColor; ctx.globalAlpha = netAlpha;
        ctx.beginPath(); ctx.arc(nx, ny, 3, 0, Math.PI * 2); ctx.fill();

        if (this.combo.isActive() && this.combo.comboTimer > 0) {
            const progress = this.combo.getTimerProgress();
            ctx.globalAlpha = 0.35 * progress;
            ctx.strokeStyle = netColor; ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(nx, ny, netR + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
            ctx.stroke();
        }
        ctx.restore();

        // Pausa entre ondas
        if (this._waveBreak) {
            const secs = this.waves.breakSecondsLeft;
            const prog = this.waves.breakProgress;
            ctx.save();
            ctx.globalAlpha = 0.45;
            ctx.fillStyle   = '#000';
            ctx.fillRect(0, bankH, w, h - bankH * 2);
            ctx.globalAlpha = 1;
            ctx.fillStyle   = '#7df0c8';
            ctx.font        = `bold ${Math.round(w * 0.040)}px sans-serif`;
            ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`Próxima onda em ${secs}s…`, w / 2, h / 2 - 14);
            const bw = w * 0.45, bh = 7;
            const bx = (w - bw) / 2, by = h / 2 + 8;
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
            ctx.fillStyle = '#7df0c8';
            ctx.beginPath(); ctx.roundRect(bx, by, bw * prog, bh, 4); ctx.fill();
            ctx.restore();
        }

        // Aviso de velocidade alta
        if (this.speedMultiplier > 1.8) {
            ctx.save();
            ctx.globalAlpha = (this.speedMultiplier - 1.8) * 0.4;
            ctx.fillStyle   = '#ff4444';
            ctx.fillRect(0, 0, w, 4);
            ctx.fillRect(0, h - 4, w, 4);
            ctx.restore();
        }
    }

    /* ── HUD helpers ──────────────────────────── */
    _syncComboHUD() {
        if (this.combo.isActive()) {
            const mult = this.combo.getMultiplier();
            this.hud.setText('combo', `x${this.combo.combo} (×${mult})`);
            this.hud.setStyle('combo', 'color', mult >= 3 ? '#ff6b35' : mult >= 2 ? '#ffd600' : '#7df0c8');
            this.hud.flashClass('combo', 'bump', 150);
        } else {
            this.hud.setText('combo', '—');
            this.hud.setStyle('combo', 'color', '#ffd600');
        }
    }

    /* ── End / restart ────────────────────────── */
    endGame(lostByHearts = false) {
        this.gameActive = false;
        this.timer.stop();
        this.events.stop();
        this.waves.stop();
        this._clearAllTimers();
        this.stopLoop();

        // Bônus de ecossistema no score final
        const ecoBonus = Math.round(this.ecosystem.health * 0.5);
        if (ecoBonus > 0) this.score.add(ecoBonus);

        const success     = !lostByHearts && this.score.score >= 60;
        const isNewRecord = this.score.saveRecord();
        if (success && !this.isReplay) this._store.setBool('completed', true);

        this._dimCanvas(0.72);

        const wrapper = this.container.querySelector('.m3-wrapper');
        const overlay = GameOverlay.show(wrapper, {
            title:      lostByHearts ? '💀 Você Perdeu!' : success ? '🌿 Rio Limpo!' : '😔 O rio ainda está poluído...',
            titleColor: success ? '#7df0c8' : '#ff6b6b',
            rows: [
                GameOverlay.scoreRow(this.score.score),
                GameOverlay.comboRow(this.combo.maxCombo),
                { html: `<div style="color:#e0f4ff;font-size:0.9rem;">🌿 Ecossistema: <strong style="color:${this.ecosystem.color}">${Math.round(this.ecosystem.health)}%</strong>${ecoBonus > 0 ? ` (+${ecoBonus} bônus)` : ''}</div>` },
            ],
            badges: [
                GameOverlay.recordBadge(isNewRecord && this.score.score > 0),
                GameOverlay.prevRecordBadge(this.score.bestScore, isNewRecord),
            ],
            buttons: [
                ...(this._store.getBool('completed') || this.isReplay || lostByHearts ? [
                    GameOverlay.replayButton(
                        'm3-btn-replay',
                        lostByHearts ? '🔁 Tentar Novamente' : '🔄 Jogar Novamente',
                        () => { GameOverlay.dismiss(overlay); this.restartGame(); },
                    ),
                ] : []),
                GameOverlay.continueButton(
                    'm3-btn-continue',
                    this.isReplay ? 'Voltar ao Mapa' : success ? 'Continuar' : 'Voltar ao Mapa',
                    success && !this.isReplay,
                    () => {
                        GameOverlay.dismiss(overlay);
                        this.finishGame(this.isReplay ? true : success, this.isReplay ? 0 : this.score.score);
                    },
                ),
            ],
            footer: !success && !this._store.getBool('completed')
                ? 'Complete a missão para desbloquear o modo livre' : '',
        });
    }

    restartGame() {
        this.events.stop();
        this.waves.reset();
        this._clearAllTimers();
        this.timer.stop();
        this.stopLoop();

        this.items            = [];
        this.rainDrops        = [];
        this.isRaining        = false;
        this.netPulse         = 0;
        this.speedMultiplier  = WAVE_DEFS[0].speedMult;
        this._waveBreak       = false;
        this.legendarySpawned = false;
        this.isReplay         = true;
        this._bgCacheRaining  = undefined; // invalida cache do fundo

        this.score.reset();
        this.combo.reset();
        this.lives.reset();
        this.particles.clear();
        this.powerups.clear();
        this.ecosystem.reset(60);
        this.timer.reset();
        this.missions.reset();

        this.hud.setText('score', 0);
        this.hud.setText('wave', 1);
        this._syncComboHUD();
        this._syncPowerupHUD();
        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        this.gameActive = true;
        this.timer.start();
        this.missions.start();
        this.events.start();
        this.waves.start();
        this.startSpawning();
        this.gameLoop();
    }
}
