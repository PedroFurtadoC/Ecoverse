// Felipe - Módulo 4 (Florestas de Bornéu)
import {
    GridCanvasGame,
    PersistenceStore,
    HUDController,
    ScoreSystem,
    LivesSystem,
    ParticleSystem,
    GameTimer,
    GameOverlay,
    MissionSystem,
    ToolSystem,
    EventScheduler,
    WaveSystem,
    emojiSprite,
} from './gamekit.js';

const COLS = 13;
const ROWS = 7;
const CANVAS_RATIO    = 0.50;
const WET_DURATION    = 4000;
const SEED_REGEN_TIME = 12000;
const WIND_INTERVAL   = 9000;
const ORANG_INTERVAL  = 4500;

const WIND_DIRS = [
    { dx:1, dy:0, label:'→' }, { dx:-1, dy:0, label:'←' },
    { dx:0, dy:1, label:'↓' }, { dx:0, dy:-1, label:'↑' },
    { dx:1, dy:1, label:'↘' }, { dx:-1, dy:1, label:'↙' },
];
const TRASH_EMOJIS = ['🛍️','🥫','🍶','🧴','🥤','👟'];

const DIRS_8 = [
    {dr:-1,dc:-1},{dr:-1,dc:0},{dr:-1,dc:1},
    {dr:0, dc:-1},              {dr:0, dc:1},
    {dr:1, dc:-1},{dr:1, dc:0},{dr:1, dc:1},
];

/* ── Definições de ondas ────────────────────────── */
// spreadChance: probabilidade base de propagação do fogo por onda
// spawnCount:   quantos focos novos surgem por ciclo de spawn
const WAVE_DEFS = [
    { fireInterval: 2000, spawnInterval: 3500, trashInterval: 3000, spreadChance: 0.20, spawnCount: 1 },
    { fireInterval: 1600, spawnInterval: 2800, trashInterval: 2400, spreadChance: 0.30, spawnCount: 1 },
    { fireInterval: 1200, spawnInterval: 2200, trashInterval: 2000, spreadChance: 0.42, spawnCount: 2 },
    { fireInterval:  900, spawnInterval: 1700, trashInterval: 1600, spreadChance: 0.54, spawnCount: 2 },
    { fireInterval:  700, spawnInterval: 1300, trashInterval: 1200, spreadChance: 0.65, spawnCount: 3 },
];

/* ── Definições de ferramentas ──────────────────── */
const TOOL_DEFS = [
    { id:'normal',     emoji:'🖐️', label:'Normal',        key:'1', quantity:-1, maxQuantity:-1 },
    { id:'bucket',     emoji:'🪣', label:'Balde 3×3',     key:'2', quantity: 3, maxQuantity: 6 },
    { id:'firebreak',  emoji:'🧱', label:'Barreira',       key:'3', quantity:-1, maxQuantity:-1 },
    { id:'fertilizer', emoji:'🌱', label:'Fertilizante',   key:'4', quantity: 2, maxQuantity: 5 },
];

/* ── Definições de missões ──────────────────────── */
const MISSION_DEFS = [
    { id:'ext5',    text:'Apague 5 fogos',        type:'total_extinguish', target:5,    reward:{ water:2 }  },
    { id:'rescue3', text:'Salve 3 orangotangos',  type:'rescue_orang',     target:3,    reward:{ pts:50 }   },
    { id:'trash5',  text:'Colete 5 lixos',        type:'total_catch',      target:5,    reward:{ pts:30 }   },
    { id:'surv30',  text:'Sobreviva 30 segundos', type:'survive_frames',   target:1800, reward:{ pts:40, tool:'fertilizer' } },
];

export class Modulo4 extends GridCanvasGame {
    constructor(containerElement, onGameEnd, options = {}) {
        super(containerElement, onGameEnd, options);

        this.windDir      = WIND_DIRS[0];
        this.orangList    = [];
        this.trashCombo   = 0;
        this.stormWarning = false;
        this.showHeatmap  = false;

        this._fireInterval       = null;
        this._fireSpawnInterval  = null;
        this._trashSpawnInterval = null;
        this._windInterval       = null;
        this._orangInterval      = null;
        this._keyHandler         = null;
        this._bucketEl           = null;

        this._store          = new PersistenceStore('m4');
        this._gridLineCanvas = null;
    }

    /* ─── START ──────────────────────────────────────── */
    start() {
        const bestScore = this._store.getInt('best_score', 0);

        this.container.innerHTML = `
        <style>
            .m4-wrap {
                position:relative; width:100%; display:flex; flex-direction:column;
                align-items:center; background:#0a1a0a; border-radius:12px;
                overflow:hidden; user-select:none; font-family:sans-serif;
            }
            .m4-hud {
                display:flex; justify-content:space-between; align-items:center;
                width:100%; padding:0.45rem 1rem; box-sizing:border-box;
                background:rgba(0,0,0,0.55); color:#e0f4e0; font-size:0.85rem;
                flex-wrap:wrap; gap:0.4rem;
            }
            .m4-hud strong { color:#7df0c8; }
            .m4-hud-group  { display:flex; align-items:center; gap:0.4rem; }
            .m4-toolbar {
                width:100%; display:flex; gap:0.4rem; padding:0.3rem 1rem;
                box-sizing:border-box; background:rgba(0,0,0,0.4);
                align-items:center; flex-wrap:wrap;
            }
            .m4-tool-btn {
                padding:3px 10px; border:2px solid rgba(255,255,255,0.2);
                border-radius:6px; background:rgba(255,255,255,0.05);
                color:#e0f4e0; font-size:0.78rem; cursor:pointer;
                transition:all 0.15s; white-space:nowrap;
            }
            .m4-tool-btn.active {
                border-color:#7df0c8; background:rgba(125,240,200,0.15);
                color:#7df0c8; font-weight:700;
            }
            .m4-tool-btn.disabled { opacity:0.35; cursor:not-allowed; }
            .m4-mission-bar {
                width:100%; padding:0.2rem 1rem; box-sizing:border-box;
                background:rgba(0,0,0,0.3); display:flex; align-items:center;
                gap:0.5rem; font-size:0.75rem; color:#aee0d0;
            }
            .m4-mission-track {
                flex:1; height:5px; background:rgba(255,255,255,0.1);
                border-radius:3px; overflow:hidden;
            }
            .m4-mission-fill {
                height:100%; background:#7df0c8; border-radius:3px; transition:width 0.3s;
            }
            #m4-canvas { cursor:crosshair; display:block; max-width:100%; }
            #m4-bucket-cursor {
                position:absolute; pointer-events:none; font-size:26px;
                transform:translate(-4px,-24px); display:none; z-index:10;
                filter:drop-shadow(0 0 4px #4dd0e1);
            }
            .m4-tip { color:#4a7a5a; font-size:0.73rem; padding:0.25rem; text-align:center; }
            .m4-tip strong { color:#7df0c8; }
        </style>
        <div class="m4-wrap">
            <div class="m4-hud">
                <div class="m4-hud-group">Vidas: <span id="m4-hearts">❤️❤️❤️❤️❤️</span></div>
                <div class="m4-hud-group">Pontos: <strong id="m4-score">0</strong></div>
                <div class="m4-hud-group">🌊 Onda: <strong id="m4-wave">1</strong></div>
                <div class="m4-hud-group">Vento: <strong id="m4-wind">→</strong></div>
                <div class="m4-hud-group">Tempo: <strong id="m4-timer">60</strong>s</div>
                <div class="m4-hud-group" id="m4-best-wrap" style="${bestScore > 0 ? '' : 'display:none'}">
                    🏆 <strong id="m4-best">${bestScore}</strong>
                </div>
            </div>
            <div class="m4-toolbar" id="m4-toolbar">
                ${TOOL_DEFS.map(t => `
                    <button class="m4-tool-btn${t.id==='normal'?' active':''}" id="m4-tool-${t.id}"
                        title="${t.id==='normal'?'Clica em fogo p/ apagar, lixo p/ coletar':t.id==='bucket'?'Apaga área 3×3 de fogo':t.id==='firebreak'?'Cria barreira no chão — o fogo não passa':' Aplica em terra queimada (cinza) para revitalizar'}">
                        <span style="font-size:0.65rem;opacity:0.6;margin-right:2px;">[${t.key}]</span>${t.emoji} ${t.label}${t.quantity !== -1 ? ` <span id="m4-qty-${t.id}">(${t.quantity})</span>` : ''}
                    </button>
                `).join('')}
                <span style="margin-left:auto;font-size:0.72rem;color:#4a7a5a;">H = mapa de risco</span>
            </div>
            <div class="m4-mission-bar">
                <span>🎯 <span id="m4-mission-text">—</span></span>
                <div class="m4-mission-track"><div class="m4-mission-fill" id="m4-mission-fill" style="width:0%"></div></div>
                <span id="m4-mission-prog">0</span>
            </div>
            <div style="position:relative;width:100%;">
                <canvas id="m4-canvas"></canvas>
                <div id="m4-bucket-cursor">🪣</div>
            </div>
            <p class="m4-tip">
                <strong>[1]</strong> clique fogo→apaga, lixo→coleta ·
                <strong>[2]</strong> 🪣 balde: apaga fogo 3×3 (limitado) ·
                <strong>[3]</strong> 🧱 barreira: clique no chão — fogo não passa ·
                <strong>[4]</strong> 🌱 fertilizante: clique em terra queimada (cinza) ·
                🦧 clique no orangotango piscando p/ resgatar
            </p>
        </div>`;

        this._setupCanvas(this.container.querySelector('#m4-canvas'), CANVAS_RATIO);

        this.hud = new HUDController(this.container, {
            hearts:      '#m4-hearts',
            score:       '#m4-score',
            wave:        '#m4-wave',
            wind:        '#m4-wind',
            timer:       '#m4-timer',
            best:        '#m4-best',
            bestWrap:    '#m4-best-wrap',
            missionText: '#m4-mission-text',
            missionFill: '#m4-mission-fill',
            missionProg: '#m4-mission-prog',
        });

        // Sistemas
        this.lives     = new LivesSystem(5, this.hud, 'hearts');
        this.score     = new ScoreSystem(this._store, 'best_score');
        this.particles = new ParticleSystem(0.03, 0.020);
        this.timer     = new GameTimer(60, this.hud, 'timer');
        this.tools     = new ToolSystem(TOOL_DEFS);
        this.missions  = new MissionSystem(MISSION_DEFS);

        // Tempestade: a cada 25–45s, dura 5s (efeito de extinção + células alagadas)
        this.events = new EventScheduler([
            { id: 'storm_warn',  minDelay: 22000, maxDelay: 42000, duration: 3000 },
        ]);

        // Ondas: 12s de combate + 3.5s de pausa entre elas
        this.waves = new WaveSystem(WAVE_DEFS, { waveDuration: 12000, breakDuration: 3500 });

        this._bucketEl = this.container.querySelector('#m4-bucket-cursor');

        this._wireEvents();
        this._initToolbarClicks();

        this.canvas.addEventListener('click', e => this.onCanvasClick(e));
        this.canvas.addEventListener('touchend', e => {
            e.preventDefault();
            this.onCanvasClick(e.changedTouches[0]);
        }, { passive: false });

        this.canvas.addEventListener('mousemove', e => {
            if (!this._bucketEl) return;
            const rect = this.canvas.getBoundingClientRect();
            this._bucketEl.style.left = (e.clientX - rect.left) + 'px';
            this._bucketEl.style.top  = (e.clientY - rect.top)  + 'px';
        });
        this.canvas.addEventListener('mouseleave', () => {
            if (this._bucketEl) this._bucketEl.style.display = 'none';
        });
        this.canvas.addEventListener('mouseenter', () => {
            if (this._bucketEl && this.tools.getActive()?.id === 'bucket')
                this._bucketEl.style.display = 'block';
        });

        this._keyHandler = (e) => {
            if (!this.gameActive) return;
            if (['1','2','3','4'].includes(e.key)) {
                e.preventDefault();
                this.tools.selectByKey(e.key);
            }
            if (e.key === 'h' || e.key === 'H') {
                this.showHeatmap = !this.showHeatmap;
            }
        };
        window.addEventListener('keydown', this._keyHandler, { capture: true });

        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);

        this.initGrid();
        this.gameActive = true;
        this.timer.start();
        this.missions.start();
        this.events.start();
        this.waves.start();
        this.startTimers();
        this.gameLoop();
    }

    _wireEvents() {
        this.score.on('changed', (val) => this.hud.setText('score', val));

        this.timer.on('expired', () => this.endGame(true));

        this.waves.on('waveStart', (num) => {
            this.hud.setText('wave', num);
            this._spawnFloat(this.canvas.width / 2, this.canvas.height / 2 - 30,
                `🌊 Onda ${num}!`, '#4dd0e1', 20);
            this.startTimers();
        });
        this.waves.on('breakStart', (num) => {
            this._spawnFloat(this.canvas.width / 2, this.canvas.height / 2 - 30,
                `✅ Onda ${num} superada! Prepare-se…`, '#7df0c8', 16);
            this._stopTimers();
        });

        this.tools.on('changed', (tool) => this._syncToolbar(tool));
        this.tools.on('used',    (tool) => this._syncToolbarQty(tool));
        this.tools.on('refilled',(tool) => this._syncToolbarQty(tool));

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

        // Tempestade: aviso → efeito
        this.events.on('start', (id) => {
            if (id === 'storm_warn') {
                this.stormWarning = true;
                this._spawnFloat(this.canvas.width / 2, 30, '⚡ Tempestade chegando!', '#ffd600', 16);
            }
        });
        this.events.on('end', (id) => {
            if (id === 'storm_warn') {
                this.stormWarning = false;
                this._triggerStorm();
            }
        });
    }

    _initToolbarClicks() {
        for (const def of TOOL_DEFS) {
            const btn = this.container.querySelector(`#m4-tool-${def.id}`);
            if (btn) btn.addEventListener('click', () => this.tools.select(def.id));
        }
    }

    _syncToolbar(activeTool) {
        for (const def of TOOL_DEFS) {
            const btn = this.container.querySelector(`#m4-tool-${def.id}`);
            if (!btn) continue;
            btn.classList.toggle('active', def.id === activeTool.id);
        }
        const isBucket = activeTool.id === 'bucket';
        if (this._bucketEl) this._bucketEl.style.display = isBucket ? 'block' : 'none';
        this.canvas.style.cursor = isBucket ? 'none' : 'crosshair';
    }

    _syncToolbarQty(tool) {
        const el = this.container.querySelector(`#m4-qty-${tool.id}`);
        if (el) el.textContent = tool._qty;
        const btn = this.container.querySelector(`#m4-tool-${tool.id}`);
        if (btn) btn.classList.toggle('disabled', tool._qty === 0 && tool.quantity !== -1);
    }

    _applyMissionReward(mission) {
        const r = mission.reward;
        this._spawnFloat(this.canvas.width / 2, 30, `🎯 Missão: ${mission.text}!`, '#ffd600', 14);
        if (r.pts)  { this.score.add(r.pts); }
        if (r.water){ this.tools.addQuantity('bucket', r.water); }
        if (r.tool) { this.tools.addQuantity(r.tool, 2); }
    }

    /* ─── GRID INIT ──────────────────────────────────── */
    initGrid() {
        this._initGrid(ROWS, COLS, () => ({
            state:       'forest',
            hasOrang:    false,
            trashEmoji:  '',
            wetUntil:    0,
            seedUntil:   0,
            floodUntil:  0,
            fireAnim:    Math.random() * Math.PI * 2,
        }));

        for (let r = 0; r < ROWS; r++)
            for (let c = 2; c < COLS; c++)
                if (Math.random() < 0.14) {
                    this.grid[r][c].state      = 'trash';
                    this.grid[r][c].trashEmoji = TRASH_EMOJIS[Math.floor(Math.random() * TRASH_EMOJIS.length)];
                }

        let seeds = 0;
        while (seeds < 2) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(COLS * 0.55) + Math.floor(Math.random() * Math.floor(COLS * 0.45));
            if (this.grid[r][c].state === 'forest') {
                this.grid[r][c].state     = 'seed';
                this.grid[r][c].seedUntil = Date.now() + SEED_REGEN_TIME;
                seeds++;
            }
        }

        this.grid[Math.floor(ROWS / 2)][0].state = 'burning';
        this.grid[0][0].state = 'burning';

        this.orangList = [];
        let attempts = 0;
        while (this.orangList.length < 5 && attempts < 200) {
            attempts++;
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(COLS * 0.40) + Math.floor(Math.random() * Math.ceil(COLS * 0.60));
            if (this.grid[r][c].state === 'forest' && !this.grid[r][c].hasOrang) {
                this.grid[r][c].hasOrang = true;
                this.orangList.push({ r, c, warning: false });
            }
        }
    }

    /* ─── TIMERS ─────────────────────────────────────── */
    startTimers() {
        // Inicia/reinicia os timers de fogo e lixo com os params da onda atual
        this._applyWaveTimers();

        // Vento e orangotango são globais (não param durante a pausa)
        if (!this._windInterval) {
            this._windInterval = setInterval(() => {
                if (!this.gameActive) return;
                this.windDir = WIND_DIRS[Math.floor(Math.random() * WIND_DIRS.length)];
                this.hud.setText('wind', this.windDir.label);
                this._spawnFloat(this.canvas.width / 2, 28, `🌬️ Vento ${this.windDir.label}`, '#4dd0e1', 13);
            }, WIND_INTERVAL);
        }
        if (!this._orangInterval) {
            this._orangInterval = setInterval(() => {
                if (!this.gameActive) return;
                this.moveOrang();
            }, ORANG_INTERVAL);
        }
    }

    _applyWaveTimers() {
        const def = this.waves.currentDef;
        this._startFireSpread(def.fireInterval);
        this._startFireSpawn(def.spawnInterval, def.spawnCount);
        this._startTrashSpawn(def.trashInterval);
    }

    _stopTimers() {
        clearInterval(this._fireInterval);
        clearInterval(this._fireSpawnInterval);
        clearInterval(this._trashSpawnInterval);
        this._fireInterval = this._fireSpawnInterval = this._trashSpawnInterval = null;
    }

    _startFireSpread(interval) {
        clearInterval(this._fireInterval);
        this._fireInterval = setInterval(() => {
            if (!this.gameActive) return;
            this.spreadFire();
            this.checkSeedRegen();
            this.checkFloodExpiry();
        }, interval);
    }

    _startFireSpawn(interval, count) {
        clearInterval(this._fireSpawnInterval);
        this._fireSpawnInterval = setInterval(() => {
            if (!this.gameActive) return;
            const candidates = [];
            for (let r = 0; r < ROWS; r++)
                for (let c = 0; c < Math.ceil(COLS * 0.45); c++)
                    if (this.grid[r][c].state === 'forest' || this.grid[r][c].state === 'trash')
                        candidates.push({ r, c });
            for (let i = 0; i < count && candidates.length; i++) {
                const idx = Math.floor(Math.random() * candidates.length);
                const { r, c } = candidates.splice(idx, 1)[0];
                this.grid[r][c].state = 'burning';
            }
        }, interval);
    }

    _startTrashSpawn(interval) {
        clearInterval(this._trashSpawnInterval);
        this._trashSpawnInterval = setInterval(() => {
            if (!this.gameActive) return;
            const r = Math.floor(Math.random() * ROWS);
            const c = 1 + Math.floor(Math.random() * (COLS - 1));
            if (this.grid[r][c].state === 'forest') {
                this.grid[r][c].state      = 'trash';
                this.grid[r][c].trashEmoji = TRASH_EMOJIS[Math.floor(Math.random() * TRASH_EMOJIS.length)];
            }
        }, interval);
    }

    /* ─── TEMPESTADE ─────────────────────────────────── */
    _triggerStorm() {
        // Centro aleatório da tempestade
        const cr = Math.floor(Math.random() * ROWS);
        const cc = Math.floor(Math.random() * COLS);
        let extinguished = 0;

        for (let dr = -2; dr <= 2; dr++) {
            for (let dc = -2; dc <= 2; dc++) {
                const nr = cr + dr, nc = cc + dc;
                if (!this._isValidCell(nr, nc)) continue;
                const cell = this.grid[nr][nc];
                if (cell.state === 'burning') {
                    cell.state     = 'wet';
                    cell.wetUntil  = Date.now() + WET_DURATION;
                    extinguished++;
                }
                // Alagamento: bloqueia fogo por 8s
                if (cell.state !== 'burned') {
                    cell.floodUntil = Date.now() + 8000;
                }
            }
        }

        const { x, y } = this._getCellCenter(cr, cc);
        this._spawnFloat(x, y - 20, `⚡ Tempestade! −${extinguished} fogos`, '#4dd0e1', 16);
        this.particles.spawnBurst(x, y, '#4dd0e1', 20, 0.05);
    }

    checkFloodExpiry() {
        const now = Date.now();
        this.forEachCell((cell) => {
            if (cell.floodUntil > 0 && now >= cell.floodUntil) {
                cell.floodUntil = 0;
                // se saiu do alagamento e estava molhado, vira floresta
                if (cell.state === 'wet' && now >= cell.wetUntil) cell.state = 'forest';
            }
        });
    }

    /* ─── FIRE ───────────────────────────────────────── */
    spawnFireWave() {
        let ignited = 0;
        for (let i = 0; i < 2; i++) {
            const r    = Math.floor(Math.random() * ROWS);
            const cell = this.grid[r][0];
            if (cell.state !== 'burning' && cell.state !== 'burned' && cell.state !== 'firebreak') {
                cell.state = 'burning';
                ignited++;
            }
        }
        if (ignited === 0)
            this._spawnFloat(this.canvas.width / 2, this.canvas.height / 2 - 20,
                '🔥 Novo incêndio!', '#ff6b35', 15);
    }

    spreadFire() {
        const now      = Date.now();
        const toIgnite = [];
        const nbs      = [{ dx:-1,dy:0 },{ dx:1,dy:0 },{ dx:0,dy:-1 },{ dx:0,dy:1 }];

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (this.grid[r][c].state !== 'burning') continue;
                for (const nb of nbs) {
                    const nr = r + nb.dy, nc = c + nb.dx;
                    if (!this._isValidCell(nr, nc)) continue;
                    const target = this.grid[nr][nc];
                    if (['burned','burning','firebreak'].includes(target.state)) continue;
                    if (target.floodUntil > now) continue;
                    if (target.state === 'wet' && now < target.wetUntil) continue;

                    const base = this.waves.currentDef?.spreadChance ?? 0.20;
                    let chance = base;
                    if (target.state === 'trash') chance += 0.15;
                    if (this.hasNeighborMatching(nr, nc, 'trash', DIRS_8)) chance += 0.10;
                    if (nb.dx === this.windDir.dx || nb.dy === this.windDir.dy) chance += 0.20;

                    if (Math.random() < Math.min(chance, 0.92))
                        toIgnite.push({ r: nr, c: nc });
                }
            }
        }

        for (const { r, c } of toIgnite) {
            const cell = this.grid[r][c];
            if (cell.hasOrang) { this.orangHit(r, c); return; }
            cell.state = 'burning';
        }

        for (let r = 0; r < ROWS; r++)
            for (let c = 0; c < COLS; c++)
                if (this.grid[r][c].state === 'burning' && Math.random() < 0.10)
                    this.grid[r][c].state = 'burned';

        if (this.countCells('burning') === 0) this.spawnFireWave();
        if (this.getCellFraction('burned') >= 0.80) this.endGame(false);
    }

    /* ─── SEED REGEN ─────────────────────────────────── */
    checkSeedRegen() {
        const now = Date.now();
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                if (cell.state !== 'seed' || now < cell.seedUntil) continue;
                const burned = this.getNeighbors(r, c).filter(n => n.cell.state === 'burned');
                if (burned.length > 0) {
                    const pick = burned[Math.floor(Math.random() * burned.length)];
                    this.grid[pick.r][pick.c].state = 'forest';
                    this.score.add(15);
                    const { x, y } = this._getCellCenter(pick.r, pick.c);
                    this._spawnFloat(x, y, '+15 🌱 Regenerou!', '#7df0c8');
                }
                cell.seedUntil = now + SEED_REGEN_TIME;
            }
        }
    }

    /* ─── ORANGUTANS ─────────────────────────────────── */
    moveOrang() {
        const dirs = [{dr:-1,dc:0},{dr:1,dc:0},{dr:0,dc:-1},{dr:0,dc:1}];
        for (const orang of this.orangList) {
            const { r, c } = orang;
            const safe = dirs
                .map(d => ({ r:r+d.dr, c:c+d.dc }))
                .filter(n => this._isValidCell(n.r, n.c))
                .filter(n => ['forest','seed','wet','trash'].includes(this.grid[n.r][n.c].state)
                    && !this.grid[n.r][n.c].hasOrang);
            if (!safe.length) continue;
            const next = safe[Math.floor(Math.random() * safe.length)];
            this.grid[r][c].hasOrang            = false;
            this.grid[next.r][next.c].hasOrang  = true;
            orang.r = next.r; orang.c = next.c;
            orang.warning = dirs.some(d => {
                const nr = next.r+d.dr, nc = next.c+d.dc;
                return this._isValidCell(nr, nc) && this.grid[nr][nc].state === 'burning';
            });
        }
    }

    orangHit(r, c) {
        this.orangList = this.orangList.filter(o => !(o.r === r && o.c === c));
        this.grid[r][c].hasOrang = false;
        const dead = this.lives.lose();
        this.missions.notifyLifeLost();
        const { x, y } = this._getCellCenter(r, c);
        this._spawnFloat(x, y, '🦧 Nooo! −1 ❤️', '#ff6b6b', 15);
        if (dead) this.endGame(false, true);
    }

    /* Resgate ativo: clica no orang em perigo e move para segurança */
    rescueOrang(r, c) {
        const orang = this.orangList.find(o => o.r === r && o.c === c && o.warning);
        if (!orang) return false;

        const dirs = [{dr:-1,dc:0},{dr:1,dc:0},{dr:0,dc:-1},{dr:0,dc:1},
                      {dr:-2,dc:0},{dr:2,dc:0},{dr:0,dc:-2},{dr:0,dc:2}];
        const safe = dirs
            .map(d => ({ r:r+d.dr, c:c+d.dc }))
            .filter(n => this._isValidCell(n.r, n.c))
            .filter(n => ['forest','seed'].includes(this.grid[n.r][n.c].state)
                && !this.grid[n.r][n.c].hasOrang);

        if (!safe.length) return false;

        const dest = safe[0];
        this.grid[r][c].hasOrang           = false;
        this.grid[dest.r][dest.c].hasOrang = true;
        orang.r = dest.r; orang.c = dest.c; orang.warning = false;

        this.score.add(20);
        const { x, y } = this._getCellCenter(r, c);
        this._spawnFloat(x, y, '🦧 Resgatado! +20', '#7df0c8', 15);
        this.missions.notifyAction('rescue_orang');
        return true;
    }

    /* ─── CLICK ──────────────────────────────────────── */
    onCanvasClick(e) {
        if (!this.gameActive) return;
        const { x, y }      = this._canvasCoords(e);
        const { row, col }  = this._gridCoordsFromCanvas(x, y);
        if (!this._isValidCell(row, col)) return;

        const activeId = this.tools.getActive()?.id;

        if (activeId === 'bucket') {
            this.useBucket(row, col);
        } else if (activeId === 'firebreak') {
            this.useFirebreak(row, col);
        } else if (activeId === 'fertilizer') {
            this.useFertilizer(row, col);
        } else {
            this.clickCell(row, col);
        }
    }

    clickCell(r, c) {
        const cell = this.grid[r][c];
        const { x, y } = this._getCellCenter(r, c);

        // Resgate ativo tem prioridade
        if (cell.hasOrang) {
            if (this.rescueOrang(r, c)) return;
        }

        if (cell.state === 'burning') {
            cell.state    = 'wet';
            cell.wetUntil = Date.now() + WET_DURATION;
            this.score.add(10);
            this.trashCombo = 0;
            this._spawnFloat(x, y, '+10 💧', '#4dd0e1');
            this.missions.notifyAction('total_extinguish');
        } else if (cell.state === 'trash') {
            cell.state = 'forest';
            this.score.add(5);
            this.trashCombo++;
            this._spawnFloat(x, y, '+5 🗑️', '#7df0c8');
            this.missions.notifyCatch(true);
            if (this.trashCombo >= 3) {
                this.tools.addQuantity('bucket', 1);
                this.trashCombo = 0;
                this._spawnFloat(this.canvas.width / 2, 40, '💧 +1 Balde!', '#4dd0e1', 16);
            }
        }
    }

    useBucket(r, c) {
        const { x, y } = this._getCellCenter(r, c);
        if (!this.tools.canUse()) {
            this._spawnFloat(x, y, '🪣 Sem água!', '#ff6b6b', 13);
            return;
        }

        // Coleta as células em chamas na área 3×3 ANTES de gastar o balde
        const toWet = [];
        for (let dr = -1; dr <= 1; dr++)
            for (let dc = -1; dc <= 1; dc++) {
                const nr = r+dr, nc = c+dc;
                if (!this._isValidCell(nr, nc)) continue;
                if (this.grid[nr][nc].state === 'burning') toWet.push({ r: nr, c: nc });
            }

        if (toWet.length === 0) {
            this._spawnFloat(x, y, '💧 Nenhum fogo aqui!', '#4dd0e1', 13);
            return;
        }

        this.tools.use();
        for (const { r: nr, c: nc } of toWet) {
            this.grid[nr][nc].state    = 'wet';
            this.grid[nr][nc].wetUntil = Date.now() + WET_DURATION + 2000;
        }
        const pts = toWet.length * 12;
        this.score.add(pts);
        this._spawnFloat(x, y, `💧 −${toWet.length} fogos +${pts}`, '#4dd0e1', 15);
        this.particles.spawnBurst(x, y, '#4dd0e1', 14, 0.1);

        for (let i = 0; i < toWet.length; i++) this.missions.notifyAction('total_extinguish');

        if (this.tools.getQuantity('bucket') <= 0) this.tools.select('normal');
    }

    /* Barreira: torna a célula imune a propagação de fogo */
    useFirebreak(r, c) {
        const cell = this.grid[r][c];
        const { x, y } = this._getCellCenter(r, c);
        if (cell.state === 'burning') {
            this._spawnFloat(x, y, '🧱 Apague o fogo primeiro!', '#ff9944', 13);
            return;
        }
        if (cell.state === 'firebreak') {
            this._spawnFloat(x, y, '🧱 Já é barreira!', '#a78bfa', 13);
            return;
        }
        const prev = cell.state;
        cell.state = 'firebreak';
        this._spawnFloat(x, y, '🧱 Barreira criada!', '#a78bfa', 14);
        if (prev === 'forest' || prev === 'trash') this.score.add(3);
    }

    /* Fertilizante: acelera regeneração de semente ou converte burned → seed */
    useFertilizer(r, c) {
        const { x, y } = this._getCellCenter(r, c);
        if (!this.tools.canUse()) {
            this._spawnFloat(x, y, '🌱 Sem fertilizante!', '#ff6b6b', 13);
            return;
        }
        const cell = this.grid[r][c];
        if (!['burned', 'seed'].includes(cell.state)) {
            this._spawnFloat(x, y, '🌱 Use em terra queimada!', '#7df0c8', 13);
            return;
        }
        this.tools.use();

        if (cell.state === 'burned') {
            cell.state     = 'seed';
            cell.seedUntil = Date.now() + Math.round(SEED_REGEN_TIME * 0.4);
        } else {
            cell.seedUntil = Date.now() + 2000;
        }
        this._spawnFloat(x, y, '🌱 Fertilizado!', '#4cde7f', 14);
        this.score.add(8);

        if (this.tools.getQuantity('fertilizer') <= 0) this.tools.select('normal');
    }

    /* ─── GAME LOOP ──────────────────────────────────── */
    update() {
        this.missions.tick();
        this.particles.update();
    }

    /* ─── DRAW ───────────────────────────────────────── */
    draw() {
        const ctx = this.ctx;
        const now = Date.now();
        const t   = now / 1000;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Heatmap de risco de fogo (toggle H)
        const heatmap = this.showHeatmap ? this._computeHeatmap() : null;

        // Cor da célula em chamas calculada uma única vez por frame (não por célula)
        const burningHue  = (20 + Math.sin(t * 4) * 10) | 0;
        const burningLit  = (35 + Math.sin(t * 3) * 8)  | 0;
        const burningBase = `hsl(${burningHue},90%,${burningLit}%)`;

        const BG = {
            forest:    '#1a5c2a',
            trash:     '#5a4a1a',
            burned:    '#1a1208',
            wet:       '#1a3a5c',
            seed:      '#1a6b3c',
            firebreak: '#2a1a0a',
            flooded:   '#0d2a40',
        };

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                const x    = c * this.cellW, y = r * this.cellH;
                const cx   = x + this.cellW / 2, cy = y + this.cellH / 2;

                // Burning usa cor base; variação por célula vem do fireAnim no overlay
                ctx.fillStyle = cell.state === 'burning' ? burningBase : (BG[cell.state] || '#1a5c2a');
                ctx.fillRect(x, y, this.cellW, this.cellH);

                const fs = Math.min(this.cellW, this.cellH) * 0.50;
                ctx.globalAlpha = 1;

                // Helper: drawImage centralizado usando cache de sprite
                const di = (g, s, dx, dy) => {
                    const sp = emojiSprite(g, s);
                    ctx.drawImage(sp, Math.round(dx - sp.width / 2), Math.round(dy - sp.height / 2));
                };

                if      (cell.state === 'forest')    { ctx.globalAlpha=0.85; di('🌳', fs, cx, cy); }
                else if (cell.state === 'seed')      {
                    di('🌱', fs, cx, cy);
                    ctx.globalAlpha=0.25+Math.sin(t*3)*0.15;
                    ctx.strokeStyle='#7df0c8'; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.arc(cx,cy,fs*0.7,0,Math.PI*2); ctx.stroke();
                }
                else if (cell.state === 'trash')     { di(cell.trashEmoji, fs, cx, cy); }
                else if (cell.state === 'burning')   {
                    di('🔥', fs, cx, cy);
                    // Flicker determinístico — sem Math.random() no draw path
                    ctx.globalAlpha = 0.12 + (Math.sin(t * 23.7 + cell.fireAnim * 7.3) * 0.5 + 0.5) * 0.08;
                    ctx.fillStyle='#ff6b00';
                    ctx.fillRect(x, y, this.cellW, this.cellH);
                }
                else if (cell.state === 'burned')    { ctx.globalAlpha=0.45; di('🪨', fs, cx, cy); }
                else if (cell.state === 'wet')       { di('💧', fs, cx, cy); }
                else if (cell.state === 'firebreak') {
                    ctx.globalAlpha=0.9; di('🧱', fs, cx, cy);
                    ctx.strokeStyle='#a78bfa'; ctx.lineWidth=2; ctx.globalAlpha=0.6;
                    ctx.strokeRect(x+2,y+2,this.cellW-4,this.cellH-4);
                }
                else if (cell.state === 'flooded' || cell.floodUntil > Date.now()) {
                    di('🌊', fs, cx, cy);
                }
                ctx.globalAlpha = 1;

                // Heatmap overlay
                if (heatmap && heatmap[r]?.[c] > 0) {
                    ctx.save();
                    ctx.globalAlpha = Math.min(0.55, heatmap[r][c] * 0.18);
                    ctx.fillStyle   = '#ff2200';
                    ctx.fillRect(x, y, this.cellW, this.cellH);
                    ctx.restore();
                }

                // Orangotango
                if (cell.hasOrang) {
                    const orang = this.orangList.find(o => o.r===r && o.c===c);
                    const warn  = orang?.warning ?? false;
                    ctx.globalAlpha = warn ? (Math.sin(t*8)>0 ? 1 : 0.35) : 1;
                    di('🦧', fs * 0.65, cx + fs*0.28, cy - fs*0.22);
                    if (warn) {
                        ctx.strokeStyle='#ff4444'; ctx.lineWidth=2; ctx.globalAlpha=0.7;
                        ctx.strokeRect(x+2,y+2,this.cellW-4,this.cellH-4);
                        // hint de resgate
                        ctx.font = `${fs*0.28}px sans-serif`; ctx.globalAlpha=0.8;
                        ctx.fillStyle='#fff'; ctx.fillText('clique', cx, cy+fs*0.42);
                    }
                    ctx.globalAlpha = 1;
                }
            }
        }

        // Grade de células pré-renderizada (uma chamada drawImage vs 91 strokeRects)
        if (!this._gridLineCanvas) this._preRenderGrid();
        ctx.drawImage(this._gridLineCanvas, 0, 0);

        // Pausa entre ondas
        if (this.waves.isInBreak) {
            const secs = this.waves.breakSecondsLeft;
            const prog = this.waves.breakProgress;
            ctx.save();
            ctx.globalAlpha = 0.55;
            ctx.fillStyle   = '#000';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.globalAlpha = 1;
            ctx.fillStyle   = '#7df0c8';
            ctx.font        = `bold ${Math.round(this.canvas.width * 0.042)}px sans-serif`;
            ctx.textAlign   = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(`Próxima onda em ${secs}s…`, this.canvas.width / 2, this.canvas.height / 2 - 18);
            // Barra de progresso da pausa
            const bw = this.canvas.width * 0.5, bh = 8;
            const bx = (this.canvas.width - bw) / 2, by = this.canvas.height / 2 + 14;
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 4); ctx.fill();
            ctx.fillStyle = '#7df0c8';
            ctx.beginPath(); ctx.roundRect(bx, by, bw * prog, bh, 4); ctx.fill();
            ctx.restore();
        }

        // Aviso de tempestade
        if (this.stormWarning) {
            ctx.save();
            ctx.globalAlpha = 0.5 + Math.sin(t * 8) * 0.3;
            ctx.fillStyle   = '#ffd600';
            ctx.fillRect(0, 0, this.canvas.width, 4);
            ctx.fillRect(0, this.canvas.height - 4, this.canvas.width, 4);
            ctx.fillStyle    = '#ffd600';
            ctx.font         = `bold ${Math.round(this.canvas.width * 0.022)}px sans-serif`;
            ctx.textAlign    = 'center'; ctx.textBaseline = 'top'; ctx.globalAlpha = 0.9;
            ctx.fillText('⚡ TEMPESTADE SE APROXIMANDO!', this.canvas.width / 2, 8);
            ctx.restore();
        }

        // Dificuldade: borda vermelha
        const burnedPct = this.getCellFraction('burned');
        const waveIntensity = (this.waves.waveNumber - 1) / Math.max(1, WAVE_DEFS.length - 1);
        if (burnedPct > 0.35 || waveIntensity > 0.5) {
            const intensity = Math.max(burnedPct / 0.8, (waveIntensity - 0.5) / 0.5);
            ctx.save();
            ctx.globalAlpha = 0.12 + intensity * 0.28; ctx.fillStyle = '#ff2200';
            ctx.fillRect(0, 0, this.canvas.width, 5);
            ctx.fillRect(0, this.canvas.height - 5, this.canvas.width, 5);
            ctx.restore();
            ctx.save(); ctx.globalAlpha = 0.75; ctx.fillStyle = '#ff4400';
            ctx.font = `bold ${Math.round(this.canvas.width * 0.020)}px sans-serif`;
            ctx.textAlign = 'right'; ctx.textBaseline = 'top';
            ctx.fillText('🔥 MODO DIFÍCIL', this.canvas.width - 8, 8);
            ctx.restore();
        }

        // Label de vento
        ctx.save(); ctx.globalAlpha = 0.65; ctx.fillStyle = '#4dd0e1';
        ctx.font = `bold ${Math.round(this.canvas.width * 0.022)}px sans-serif`;
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`🌬️ ${this.windDir.label}`, 8, 8);
        ctx.restore();

        // Label heatmap ativo
        if (this.showHeatmap) {
            ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#ff6b35';
            ctx.font = `bold ${Math.round(this.canvas.width * 0.018)}px sans-serif`;
            ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
            ctx.fillText('🌡️ RISCO DE FOGO', this.canvas.width - 8, this.canvas.height - 8);
            ctx.restore();
        }

        this.particles.draw(ctx);
    }

    /* Calcula risco de fogo por célula (0 = seguro, alto = perigoso) */
    _computeHeatmap() {
        const map = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
        const nbs = [{ dx:-1,dy:0 },{ dx:1,dy:0 },{ dx:0,dy:-1 },{ dx:0,dy:1 }];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = this.grid[r][c];
                if (['burned','burning','firebreak'].includes(cell.state)) continue;
                let risk = 0;
                for (const nb of nbs) {
                    const nr = r + nb.dy, nc = c + nb.dx;
                    if (!this._isValidCell(nr, nc)) continue;
                    if (this.grid[nr][nc].state === 'burning') {
                        risk += 2;
                        if (nb.dx === this.windDir.dx || nb.dy === this.windDir.dy) risk += 1.5;
                    }
                }
                if (cell.state === 'trash') risk *= 1.5;
                map[r][c] = risk;
            }
        }
        return map;
    }

    /* ─── END GAME ───────────────────────────────────── */
    endGame(_byTimeout = false, byHearts = false) {
        if (!this.gameActive) return;
        this.gameActive = false;

        this.timer.stop();
        this.events.stop();
        this.waves.stop();
        this._stopTimers();
        clearInterval(this._windInterval);
        clearInterval(this._orangInterval);
        if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler, { capture: true });

        const total     = ROWS * COLS;
        const alive     = this.countCells('forest') + this.countCells('seed')
                        + this.countCells('wet')    + this.countCells('firebreak');
        const forestPct = Math.round((alive / total) * 100);
        const bonus     = Math.round(forestPct * 1.5);
        this.score.add(bonus);

        let medal = '';
        if      (forestPct >= 80) medal = '🥇 Ouro';
        else if (forestPct >= 60) medal = '🥈 Prata';
        else if (forestPct >= 40) medal = '🥉 Bronze';

        const success     = forestPct >= 40 && !byHearts;
        const isNewRecord = this.score.saveRecord();
        if (success && !this.isReplay) this._store.setBool('completed', true);

        const titleText   = byHearts ? '💀 Você Perdeu!' : success ? `🌿 Floresta Salva! ${medal}` : '🔥 A floresta queimou...';
        const showReplay  = this._store.getBool('completed') || this.isReplay || byHearts;
        const replayLabel = byHearts ? '🔁 Tentar Novamente' : '🔄 Jogar Novamente';

        const wrapper = this.container.querySelector('.m4-wrap');
        const overlay = GameOverlay.show(wrapper, {
            title:      titleText,
            titleColor: success ? '#7df0c8' : '#ff6b6b',
            rows: [
                { html: `<div style="color:#e0f4e0;">Floresta restante: <strong style="color:#7df0c8">${forestPct}%</strong></div>` },
                { html: `<div style="color:#e0f4e0;">Pontuação: <strong style="color:#ffd600">${this.score.score}</strong></div>` },
            ],
            badges: [ GameOverlay.recordBadge(isNewRecord) ],
            buttons: [
                ...(showReplay ? [
                    GameOverlay.replayButton('m4-btn-replay', replayLabel,
                        () => { GameOverlay.dismiss(overlay); this.stopLoop(); this.resetAndRestart(); },
                    ),
                ] : []),
                GameOverlay.continueButton('m4-btn-continue',
                    this.isReplay ? 'Voltar ao Mapa' : success ? 'Continuar' : 'Voltar ao Mapa',
                    success && !this.isReplay,
                    () => {
                        GameOverlay.dismiss(overlay);
                        this.stopLoop();
                        this.finishGame(success && !this.isReplay, this.score.score);
                    },
                ),
            ],
        });
    }

    resetAndRestart() {
        this.events.stop();
        this.waves.reset();
        this._stopTimers();
        clearInterval(this._windInterval);
        clearInterval(this._orangInterval);
        this._windInterval = this._orangInterval = null;

        this.trashCombo      = 0;
        this.orangList       = [];
        this.stormWarning    = false;
        this.showHeatmap     = false;
        this.isReplay        = true;
        this._gridLineCanvas = null; // invalida para recriar com dimensões corretas

        this.score.reset();
        this.lives.reset();
        this.particles.clear();
        this.timer.reset();
        this.tools.reset();
        this.missions.reset();

        this.hud.setText('score', 0);
        this.hud.setVisible('bestWrap', this.score.bestScore > 0);
        this.hud.setText('best', this.score.bestScore);
        this.canvas.style.cursor = 'crosshair';
        if (this._bucketEl) this._bucketEl.style.display = 'none';

        // Sincroniza toolbar
        for (const t of TOOL_DEFS) {
            const btn = this.container.querySelector(`#m4-tool-${t.id}`);
            if (btn) btn.classList.toggle('active', t.id === 'normal');
            const qty = this.container.querySelector(`#m4-qty-${t.id}`);
            if (qty) qty.textContent = t.quantity;
        }

        this.initGrid();
        this.gameActive = true;
        this.hud.setText('wave', 1);
        this.timer.start();
        this.missions.start();
        this.events.start();
        this.waves.start();
        this.startTimers();
        this.gameLoop();
    }

    /* ─── Grid overlay pré-renderizado ──────────────── */
    _preRenderGrid() {
        const oc  = new OffscreenCanvas(this.canvas.width, this.canvas.height);
        const c   = oc.getContext('2d');
        c.strokeStyle = 'rgba(0,0,0,0.18)';
        c.lineWidth   = 1;
        for (let r = 0; r < ROWS; r++)
            for (let col = 0; col < COLS; col++)
                c.strokeRect(col * this.cellW, r * this.cellH, this.cellW, this.cellH);
        this._gridLineCanvas = oc;
    }

    /* ─── Utils ──────────────────────────────────────── */
    _spawnFloat(x, y, text, color, size = 13) {
        this.particles.spawnFloat(x, y, text, color, size, -1.3);
    }
}
