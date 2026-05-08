/**
 * gamekit.js — Infraestrutura compartilhada para os minigames Felipe
 *
 * Hierarquia de classes:
 *   EventEmitter
 *   PersistenceStore
 *   HUDController
 *   LivesSystem       extends EventEmitter
 *   ComboSystem       extends EventEmitter
 *   ScoreSystem       extends EventEmitter
 *   ParticleSystem
 *   GameTimer         extends EventEmitter
 *   GameOverlay       (métodos estáticos)
 *   MinigameBase      [ABSTRATA]
 *   CanvasMinigame    [ABSTRATA] extends MinigameBase
 *   GridCanvasGame    [ABSTRATA] extends CanvasMinigame
 *
 * Uso: importar as classes necessárias em modulo3.js / modulo4.js
 *   import { ScoreSystem, ComboSystem, ... } from './gamekit.js';
 */

/* ═══════════════════════════════════════════════════════════════════════════
   EventEmitter — base de eventos para classes que emitem notificações
   ═══════════════════════════════════════════════════════════════════════════ */
export class EventEmitter {
    constructor() {
        /** @type {Record<string, Function[]>} */
        this._listeners = {};
    }

    /**
     * Registra um listener para o evento.
     * @param {string} event
     * @param {Function} fn
     * @returns {this}  fluent API
     */
    on(event, fn) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(fn);
        return this;
    }

    /**
     * Remove um listener previamente registrado.
     * @param {string} event
     * @param {Function} fn
     */
    off(event, fn) {
        if (!this._listeners[event]) return;
        this._listeners[event] = this._listeners[event].filter(f => f !== fn);
    }

    /**
     * Remove todos os listeners de um evento (ou de todos os eventos).
     * @param {string} [event]
     */
    offAll(event) {
        if (event) delete this._listeners[event];
        else this._listeners = {};
    }

    /**
     * Dispara um evento para todos os listeners registrados.
     * @protected
     */
    _emit(event, ...args) {
        (this._listeners[event] || []).forEach(fn => fn(...args));
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   PersistenceStore — wrapper tipado para localStorage com namespace
   ═══════════════════════════════════════════════════════════════════════════ */
export class PersistenceStore {
    /**
     * @param {string} namespace  prefixo adicionado a todas as chaves (ex: 'm3')
     */
    constructor(namespace = '') {
        this._prefix = namespace ? `${namespace}_` : '';
    }

    /** @private */
    _key(k) { return `${this._prefix}${k}`; }

    /**
     * Lê um inteiro. Retorna `fallback` se ausente ou inválido.
     * @param {string} key
     * @param {number} [fallback=0]
     */
    getInt(key, fallback = 0) {
        const raw = localStorage.getItem(this._key(key));
        const n = parseInt(raw);
        return (raw !== null && !isNaN(n)) ? n : fallback;
    }

    /**
     * Lê um booleano (armazenado como string 'true'/'false').
     * @param {string} key
     * @param {boolean} [fallback=false]
     */
    getBool(key, fallback = false) {
        const raw = localStorage.getItem(this._key(key));
        return raw === null ? fallback : raw === 'true';
    }

    /**
     * Salva um inteiro.
     * @param {string} key
     * @param {number} value
     */
    setInt(key, value) {
        localStorage.setItem(this._key(key), String(Math.floor(value)));
    }

    /**
     * Salva um booleano.
     * @param {string} key
     * @param {boolean} value
     */
    setBool(key, value) {
        localStorage.setItem(this._key(key), value ? 'true' : 'false');
    }

    /** Remove uma chave do store. */
    remove(key) {
        localStorage.removeItem(this._key(key));
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   HUDController — gerencia referências a elementos do DOM do HUD
   e expõe métodos de atualização com cache para evitar query repetida.
   ═══════════════════════════════════════════════════════════════════════════ */
export class HUDController {
    /**
     * @param {HTMLElement} container
     * @param {Record<string, string>} bindings  { nomeLogico: '#css-selector' }
     */
    constructor(container, bindings = {}) {
        this._container = container;
        this._bindings = bindings;
        /** @type {Record<string, HTMLElement|null>} */
        this._cache = {};
    }

    /**
     * Resolve e cacheia o elemento associado a um nome lógico.
     * @param {string} name
     * @returns {HTMLElement|null}
     * @private
     */
    _el(name) {
        if (!(name in this._cache)) {
            const sel = this._bindings[name];
            this._cache[name] = sel ? (this._container.querySelector(sel) ?? null) : null;
        }
        return this._cache[name];
    }

    /**
     * Invalida o cache de elementos (chamar após reconstrução do DOM).
     */
    invalidate() {
        this._cache = {};
    }

    /**
     * Define o textContent de um elemento vinculado.
     * @param {string} name
     * @param {string|number} value
     */
    setText(name, value) {
        const el = this._el(name);
        if (el) el.textContent = String(value);
    }

    /**
     * Define o innerHTML de um elemento vinculado.
     * @param {string} name
     * @param {string} html
     */
    setHTML(name, html) {
        const el = this._el(name);
        if (el) el.innerHTML = html;
    }

    /**
     * Define uma propriedade de estilo inline.
     * @param {string} name
     * @param {string} prop  camelCase
     * @param {string} value
     */
    setStyle(name, prop, value) {
        const el = this._el(name);
        if (el) el.style[prop] = value;
    }

    /**
     * Alterna uma classe CSS com comportamento opcional de force.
     * @param {string} name
     * @param {string} className
     * @param {boolean} [force]
     */
    toggleClass(name, className, force) {
        const el = this._el(name);
        if (el) el.classList.toggle(className, force);
    }

    /**
     * Mostra ou oculta um elemento (display: '' | 'none').
     * @param {string} name
     * @param {boolean} visible
     */
    setVisible(name, visible) {
        const el = this._el(name);
        if (el) el.style.display = visible ? '' : 'none';
    }

    /**
     * Adiciona uma classe temporariamente, removendo após `durationMs`.
     * Útil para animações de "bump"/pulso no HUD.
     * @param {string} name
     * @param {string} className
     * @param {number} [durationMs=150]
     */
    flashClass(name, className, durationMs = 150) {
        const el = this._el(name);
        if (!el) return;
        el.classList.add(className);
        setTimeout(() => el.classList.remove(className), durationMs);
    }

    /**
     * Renderiza vidas como string de emojis (cheios + vazios).
     * @param {string} name
     * @param {number} lives
     * @param {number} maxLives
     * @param {string} [filled='❤️']
     * @param {string} [empty='🖤']
     */
    renderHearts(name, lives, maxLives, filled = '❤️', empty = '🖤') {
        this.setText(name, filled.repeat(Math.max(0, lives)) + empty.repeat(Math.max(0, maxLives - lives)));
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   LivesSystem — gerencia vidas/corações com eventos e sincronização com HUD
   Eventos: 'changed'(lives, prev) | 'depleted'()
   ═══════════════════════════════════════════════════════════════════════════ */
export class LivesSystem extends EventEmitter {
    /**
     * @param {number} [maxLives=5]
     * @param {HUDController|null} [hud=null]
     * @param {string} [hudKey='hearts']  chave no HUDController
     */
    constructor(maxLives = 5, hud = null, hudKey = 'hearts') {
        super();
        this.maxLives = maxLives;
        this.lives = maxLives;
        this._hud = hud;
        this._hudKey = hudKey;
    }

    /**
     * Remove `count` vidas. Emite 'changed' e, se chegar a zero, 'depleted'.
     * @param {number} [count=1]
     * @returns {boolean}  true se não restam vidas
     */
    lose(count = 1) {
        const prev = this.lives;
        this.lives = Math.max(0, this.lives - count);
        this._syncHUD();
        this._emit('changed', this.lives, prev);
        if (this.lives <= 0) this._emit('depleted');
        return this.lives <= 0;
    }

    /**
     * Restaura `count` vidas, respeitando o máximo.
     * @param {number} [count=1]
     */
    restore(count = 1) {
        this.lives = Math.min(this.maxLives, this.lives + count);
        this._syncHUD();
    }

    /** Restaura todas as vidas ao máximo. */
    reset() {
        this.lives = this.maxLives;
        this._syncHUD();
    }

    /** @returns {boolean} */
    isDepleted() { return this.lives <= 0; }

    /**
     * Retorna a string de emojis representando o estado atual das vidas.
     * @param {string} [filled='❤️']
     * @param {string} [empty='🖤']
     */
    toEmojiString(filled = '❤️', empty = '🖤') {
        return filled.repeat(this.lives) + empty.repeat(this.maxLives - this.lives);
    }

    /** @private */
    _syncHUD() {
        this._hud?.renderHearts(this._hudKey, this.lives, this.maxLives);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ComboSystem — rastreia acertos consecutivos com multiplicador configurável
   por limiares, decaimento por frames e eventos de mudança de tier.
   Eventos: 'increment'(combo, multiplier) | 'broken'(prevCombo) | 'tierChange'(newMult, prevMult)
   ═══════════════════════════════════════════════════════════════════════════ */
export class ComboSystem extends EventEmitter {
    /**
     * @param {Array<{min: number, multiplier: number}>} tiers
     *   Limiares para multiplicador — ordenados do maior para o menor.
     *   Padrão compatível com Modulo3: x1 base, x2 a partir de 3, x3 a partir de 6.
     * @param {number} [decayFrames=180]
     *   Frames até o combo ser zerado por inatividade (0 = sem decaimento).
     */
    constructor(
        tiers = [
            { min: 6, multiplier: 3 },
            { min: 3, multiplier: 2 },
            { min: 0, multiplier: 1 },
        ],
        decayFrames = 180,
    ) {
        super();
        this._tiers = tiers.slice().sort((a, b) => b.min - a.min);
        this.decayFrames = decayFrames;
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
    }

    /**
     * Registra um acerto — incrementa o combo e reseta o timer de decaimento.
     * Emite 'increment' e, quando o multiplicador muda, 'tierChange'.
     */
    increment() {
        const prevMult = this.getMultiplier();
        this.combo++;
        if (this.combo > this.maxCombo) this.maxCombo = this.combo;
        if (this.decayFrames > 0) this.comboTimer = this.decayFrames;
        const newMult = this.getMultiplier();
        this._emit('increment', this.combo, newMult);
        if (newMult !== prevMult) this._emit('tierChange', newMult, prevMult);
    }

    /**
     * Quebra o combo mid-game (erro do jogador).
     * Zera combo e timer, mantém maxCombo. Emite 'broken'.
     */
    breakCombo() {
        const prev = this.combo;
        this.combo = 0;
        this.comboTimer = 0;
        if (prev > 0) this._emit('broken', prev);
    }

    /**
     * Avança o timer de decaimento em 1 frame.
     * Deve ser chamado uma vez por frame no loop de update.
     */
    tick() {
        if (this.decayFrames <= 0 || this.comboTimer <= 0) return;
        this.comboTimer--;
        if (this.comboTimer === 0 && this.combo > 0) this.breakCombo();
    }

    /**
     * Retorna o multiplicador correspondente ao combo atual.
     * @returns {number}
     */
    getMultiplier() {
        for (const tier of this._tiers)
            if (this.combo >= tier.min) return tier.multiplier;
        return 1;
    }

    /** @returns {boolean}  true se o combo está ativo (≥ 2) */
    isActive() { return this.combo >= 2; }

    /**
     * Progresso do timer de decaimento normalizado (0–1).
     * 1 = timer cheio, 0 = prestes a expirar.
     */
    getTimerProgress() {
        if (this.decayFrames <= 0 || this.comboTimer <= 0) return 0;
        return this.comboTimer / this.decayFrames;
    }

    /** Reset completo — usado no reinício do jogo. */
    reset() {
        this.combo = 0;
        this.maxCombo = 0;
        this.comboTimer = 0;
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ScoreSystem — pontuação com suporte a multiplicador de combo,
   subtração com piso em 0 e persistência automática do recorde.
   Eventos: 'changed'(score, delta) | 'record'(score)
   ═══════════════════════════════════════════════════════════════════════════ */
export class ScoreSystem extends EventEmitter {
    /**
     * @param {PersistenceStore} store
     * @param {string} [scoreKey='best_score']
     * @param {ComboSystem|null} [combo=null]
     *   Se fornecido, add() pode aplicar o multiplicador automaticamente.
     */
    constructor(store, scoreKey = 'best_score', combo = null) {
        super();
        this._store = store;
        this._scoreKey = scoreKey;
        this._combo = combo;
        this.score = 0;
        this.bestScore = store.getInt(scoreKey, 0);
    }

    /**
     * Adiciona pontos, opcionalmente multiplicados pelo combo atual.
     * @param {number} base  pontos base
     * @param {boolean} [applyCombo=false]
     * @returns {number}  pontos efetivamente adicionados
     */
    add(base, applyCombo = false) {
        const mult = (applyCombo && this._combo) ? this._combo.getMultiplier() : 1;
        const pts = base * mult;
        this.score += pts;
        this._emit('changed', this.score, pts);
        return pts;
    }

    /**
     * Subtrai pontos com piso em 0.
     * @param {number} amount
     * @returns {number}  valor efetivamente subtraído
     */
    subtract(amount) {
        const actual = Math.min(amount, this.score);
        this.score = Math.max(0, this.score - amount);
        this._emit('changed', this.score, -actual);
        return actual;
    }

    /** @returns {boolean}  true se o score atual supera o recorde salvo */
    isNewRecord() { return this.score > this.bestScore; }

    /**
     * Persiste o recorde se o score atual for maior.
     * @returns {boolean}  true se um novo recorde foi salvo
     */
    saveRecord() {
        if (!this.isNewRecord()) return false;
        this.bestScore = this.score;
        this._store.setInt(this._scoreKey, this.score);
        this._emit('record', this.score);
        return true;
    }

    /** Reset do score para reinício — não altera o recorde. */
    reset() {
        this.score = 0;
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ParticleSystem — gerencia partículas de efeito e textos flutuantes.
   Suporta bursts radiais, bursts com gravidade e mensagens de pontuação.
   ═══════════════════════════════════════════════════════════════════════════ */
export class ParticleSystem {
    /**
     * @param {number} [particleFadeRate=0.04]  alpha decrementado por frame nas partículas
     * @param {number} [textFadeRate=0.022]      alpha decrementado por frame nos textos flutuantes
     */
    constructor(particleFadeRate = 0.04, textFadeRate = 0.022) {
        this._particleFadeRate = particleFadeRate;
        this._textFadeRate     = textFadeRate;
        /** @type {Array<{x,y,vx,vy,alpha,color,r,gravity}>} */
        this._particles = [];
        /** @type {Array<{x,y,vy,text,color,alpha,size}>} */
        this._floatingTexts = [];
    }

    /* ── Emissores ───────────────────────────── */

    /**
     * Burst radial uniforme (ex: coleta de lixo).
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {number} [count=8]
     * @param {number} [speedMin=2]
     * @param {number} [speedMax=4]
     * @param {number} [rMin=3]
     * @param {number} [rMax=6]
     */
    spawnRadial(x, y, color, count = 8, speedMin = 2, speedMax = 4, rMin = 3, rMax = 6) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i;
            const speed = speedMin + Math.random() * (speedMax - speedMin);
            this._particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                alpha: 1,
                color,
                r: rMin + Math.random() * (rMax - rMin),
                gravity: 0,
            });
        }
    }

    /**
     * Burst com gravidade (ex: respingo de balde de água).
     * @param {number} x
     * @param {number} y
     * @param {string} color
     * @param {number} [count=14]
     * @param {number} [gravity=0.1]
     */
    spawnBurst(x, y, color, count = 14, gravity = 0.1) {
        for (let i = 0; i < count; i++) {
            const a = (Math.PI * 2 / count) * i;
            this._particles.push({
                x, y,
                vx: Math.cos(a) * (2 + Math.random() * 2),
                vy: Math.sin(a) * (2 + Math.random() * 2),
                alpha: 1,
                color,
                r: 3 + Math.random() * 3,
                gravity,
            });
        }
    }

    /**
     * Texto flutuante de pontuação ou mensagem.
     * @param {number} x
     * @param {number} y
     * @param {string} text
     * @param {string} color
     * @param {number} [size=13]
     * @param {number} [vy=-1.5]
     */
    spawnFloat(x, y, text, color, size = 13, vy = -1.5) {
        this._floatingTexts.push({ x, y, vy, text, color, alpha: 1, size });
    }

    /* ── Update & Draw ───────────────────────── */

    /**
     * Atualiza física de partículas e fade de textos.
     * Deve ser chamado uma vez por frame.
     */
    update() {
        for (const p of this._particles) {
            p.x  += p.vx;
            p.y  += p.vy;
            p.vy += p.gravity;
            p.alpha -= this._particleFadeRate;
        }
        this._particles = this._particles.filter(p => p.alpha > 0);

        for (const ft of this._floatingTexts) {
            ft.y     += ft.vy;
            ft.alpha -= this._textFadeRate;
        }
        this._floatingTexts = this._floatingTexts.filter(ft => ft.alpha > 0);
    }

    /**
     * Renderiza partículas e textos flutuantes no contexto fornecido.
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        for (const p of this._particles) {
            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle   = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        for (const ft of this._floatingTexts) {
            ctx.save();
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle   = ft.color;
            ctx.font        = `bold ${ft.size}px sans-serif`;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    /** Remove todas as partículas e textos ativos (ex: reinício). */
    clear() {
        this._particles    = [];
        this._floatingTexts = [];
    }

    /** Número de partículas ativas. */
    get particleCount() { return this._particles.length; }

    /** Número de textos flutuantes ativos. */
    get textCount() { return this._floatingTexts.length; }
}


/* ═══════════════════════════════════════════════════════════════════════════
   GameTimer — contador regressivo com rampa de dificuldade e sync com HUD.
   Eventos: 'tick'(timeLeft, difficulty) | 'expired'()
   ═══════════════════════════════════════════════════════════════════════════ */
export class GameTimer extends EventEmitter {
    /**
     * @param {number} totalSeconds
     * @param {HUDController|null} [hud=null]
     * @param {string} [hudKey='timer']
     */
    constructor(totalSeconds, hud = null, hudKey = 'timer') {
        super();
        this.totalSeconds = totalSeconds;
        this.timeLeft     = totalSeconds;
        this._hud         = hud;
        this._hudKey      = hudKey;
        this._intervalId  = null;
        this._paused      = false;
    }

    /** Inicia o contador. Reinicia se já estiver rodando. */
    start() {
        this.stop();
        this._intervalId = setInterval(() => {
            if (this._paused) return;
            this.timeLeft--;
            this._syncHUD();
            this._emit('tick', this.timeLeft, this.getDifficulty());
            if (this.timeLeft <= 0) {
                this.stop();
                this._emit('expired');
            }
        }, 1000);
    }

    /** Para e descarta o intervalo interno. */
    stop() {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    pause()  { this._paused = true;  }
    resume() { this._paused = false; }

    /**
     * Reinicia o timer (sem iniciar automaticamente).
     * @param {number|null} [newTotal]  novo tempo total (mantém o original se null)
     */
    reset(newTotal = null) {
        this.stop();
        if (newTotal !== null) this.totalSeconds = newTotal;
        this.timeLeft = this.totalSeconds;
        this._paused  = false;
        this._syncHUD();
    }

    /**
     * Dificuldade normalizada: 0 no início, 1 no fim.
     * @returns {number}
     */
    getDifficulty() {
        return 1 - (this.timeLeft / this.totalSeconds);
    }

    /**
     * Multiplicador de velocidade: 1 no início, (1 + scale) no fim.
     * Compatível com o padrão speedMultiplier do Modulo3.
     * @param {number} [scale=1.2]
     */
    getSpeedMultiplier(scale = 1.2) {
        return 1 + this.getDifficulty() * scale;
    }

    /** @returns {boolean} */
    get isRunning() { return this._intervalId !== null; }

    /** Segundos decorridos desde o início. */
    get elapsed() { return this.totalSeconds - this.timeLeft; }

    /** @private */
    _syncHUD() {
        this._hud?.setText(this._hudKey, this.timeLeft);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   GameOverlay — construtor estático de overlays de fim de jogo.
   Recebe configuração declarativa e gera o HTML/botões automaticamente.
   ═══════════════════════════════════════════════════════════════════════════ */
export class GameOverlay {
    /**
     * Cria e adiciona um overlay ao elemento wrapper informado.
     *
     * @param {HTMLElement} wrapperEl  container pai do overlay
     * @param {{
     *   title:      string,
     *   titleColor: string,
     *   rows?:      Array<{ html: string }>,
     *   badges?:    Array<{ html: string }>,
     *   buttons:    Array<{
     *     id:      string,
     *     label:   string,
     *     style:   string,
     *     onClick: Function,
     *   }>,
     *   footer?: string,
     * }} config
     * @returns {HTMLElement}  o elemento overlay criado
     */
    static show(wrapperEl, config) {
        const overlay = document.createElement('div');
        overlay.style.cssText = [
            'position:absolute', 'inset:0',
            'display:flex', 'flex-direction:column',
            'align-items:center', 'justify-content:center',
            'gap:10px',
            'background:rgba(0,0,0,0.80)',
            'font-family:sans-serif',
            'pointer-events:auto',
            'border-radius:12px',
        ].join(';');

        const rowsHTML   = (config.rows   || []).map(r => r.html).join('');
        const badgesHTML = (config.badges || []).map(b => b.html).join('');
        const btnsHTML   = (config.buttons || []).map(b =>
            `<button id="${b.id}" style="${b.style}">${b.label}</button>`
        ).join('');

        overlay.innerHTML = `
            <div style="color:${config.titleColor || '#e0f4ff'};font-size:1.5rem;font-weight:900;text-align:center;">
                ${config.title}
            </div>
            ${rowsHTML}
            ${badgesHTML}
            <div style="display:flex;gap:12px;margin-top:8px;flex-wrap:wrap;justify-content:center;">
                ${btnsHTML}
            </div>
            ${config.footer ? `<div style="color:#6a9fb5;font-size:0.78rem;margin-top:4px;text-align:center;">${config.footer}</div>` : ''}
        `;

        for (const btn of config.buttons || []) {
            overlay.querySelector(`#${btn.id}`)?.addEventListener('click', btn.onClick);
        }

        wrapperEl.appendChild(overlay);
        return overlay;
    }

    /**
     * Remove um overlay do DOM.
     * @param {HTMLElement|null} overlay
     */
    static dismiss(overlay) {
        overlay?.remove();
    }

    /* ── Helpers para blocos HTML reutilizáveis ── */

    /**
     * Badge de "NOVO RECORDE" (amarela).
     * @param {boolean} condition  só gera se true
     */
    static recordBadge(condition) {
        if (!condition) return { html: '' };
        return { html: `<div style="background:#ffd600;color:#000;font-weight:900;font-size:0.8rem;padding:3px 12px;border-radius:20px;letter-spacing:1px;">🏆 NOVO RECORDE!</div>` };
    }

    /**
     * Badge de recorde anterior.
     * @param {number} best
     * @param {boolean} isNew  não exibe se for novo recorde
     */
    static prevRecordBadge(best, isNew) {
        if (isNew || best <= 0) return { html: '' };
        return { html: `<div style="color:#6a9fb5;font-size:0.82rem;">Recorde: ${best} pts</div>` };
    }

    /** Linha simples de pontuação. */
    static scoreRow(score, label = 'Pontuação') {
        return { html: `<div style="color:#e0f4ff;font-size:1.15rem;">${label}: <strong>${score}</strong></div>` };
    }

    /** Linha de combo máximo (exibe apenas se combo ≥ 3). */
    static comboRow(maxCombo) {
        if (maxCombo < 3) return { html: '' };
        return { html: `<div style="color:#ffd600;font-size:0.9rem;">Melhor combo: x${maxCombo}</div>` };
    }

    /** Botão padrão "Jogar Novamente". */
    static replayButton(id, label, onClick) {
        return {
            id, label, onClick,
            style: 'padding:10px 28px;background:#1b6fa0;color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;',
        };
    }

    /** Botão padrão "Continuar/Voltar". */
    static continueButton(id, label, success, onClick) {
        return {
            id, label, onClick,
            style: `padding:10px 28px;background:${success ? '#2ECC71' : '#444'};color:#fff;border:none;border-radius:8px;font-size:1rem;font-weight:700;cursor:pointer;`,
        };
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   MinigameBase — classe BASE ABSTRATA para todos os minigames Ecoverse.
   Gerencia o ciclo de vida, timers controlados e o callback de resultado.
   ═══════════════════════════════════════════════════════════════════════════ */
export class MinigameBase {
    /**
     * @param {HTMLElement} containerElement
     * @param {Function} onGameEnd  callback({ success: boolean, finalScore: number })
     * @param {Object} [options]
     * @param {boolean} [options.replay=false]
     */
    constructor(containerElement, onGameEnd, options = {}) {
        if (new.target === MinigameBase) {
            throw new TypeError('MinigameBase é abstrata e não pode ser instanciada diretamente.');
        }
        this.container  = containerElement;
        this.onGameEnd  = onGameEnd;
        this.gameActive = false;
        this.isReplay   = options.replay === true;

        // Rastreamento de timers para limpeza centralizada
        /** @private @type {Set<number>} */
        this._intervals = new Set();
        /** @private @type {Set<number>} */
        this._timeouts  = new Set();
    }

    /* ── Interface abstrata ───────────────────── */

    /**
     * Inicializa o DOM e inicia o jogo. Deve ser implementado pela subclasse.
     * @abstract
     */
    start() {
        throw new Error(`${this.constructor.name} deve implementar start()`);
    }

    /**
     * Encerra o jogo e exibe o resultado. Deve ser implementado pela subclasse.
     * @abstract
     */
    endGame() {
        throw new Error(`${this.constructor.name} deve implementar endGame()`);
    }

    /* ── Gerenciamento de timers ──────────────── */

    /**
     * Cria um setInterval rastreado — limpo automaticamente por _clearAllTimers().
     * @param {Function} fn
     * @param {number} delay
     * @returns {number}  ID do interval
     */
    _setInterval(fn, delay) {
        const id = setInterval(fn, delay);
        this._intervals.add(id);
        return id;
    }

    /**
     * Cancela um interval rastreado.
     * @param {number} id
     */
    _clearInterval(id) {
        clearInterval(id);
        this._intervals.delete(id);
    }

    /**
     * Cria um setTimeout rastreado — limpo automaticamente por _clearAllTimers().
     * @param {Function} fn
     * @param {number} delay
     * @returns {number}  ID do timeout
     */
    _setTimeout(fn, delay) {
        const id = setTimeout(() => {
            this._timeouts.delete(id);
            fn();
        }, delay);
        this._timeouts.add(id);
        return id;
    }

    /**
     * Cancela um timeout rastreado.
     * @param {number} id
     */
    _clearTimeout(id) {
        clearTimeout(id);
        this._timeouts.delete(id);
    }

    /**
     * Cancela todos os intervals e timeouts rastreados.
     * Deve ser chamado em endGame() antes de limpar o estado.
     */
    _clearAllTimers() {
        this._intervals.forEach(id => clearInterval(id));
        this._timeouts.forEach(id => clearTimeout(id));
        this._intervals.clear();
        this._timeouts.clear();
    }

    /* ── Resultado ────────────────────────────── */

    /**
     * Reporta o resultado do jogo ao orquestrador externo.
     * @param {boolean} isSuccess
     * @param {number}  score
     */
    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   CanvasMinigame — ABSTRATA — estende MinigameBase com loop rAF, setup de
   canvas, utilitários de input/coordenadas e escurecimento de tela.
   ═══════════════════════════════════════════════════════════════════════════ */
export class CanvasMinigame extends MinigameBase {
    /**
     * @param {HTMLElement} containerElement
     * @param {Function} onGameEnd
     * @param {Object} [options]
     */
    constructor(containerElement, onGameEnd, options = {}) {
        if (new.target === CanvasMinigame) {
            throw new TypeError('CanvasMinigame é abstrata e não pode ser instanciada diretamente.');
        }
        super(containerElement, onGameEnd, options);
        /** @type {HTMLCanvasElement|null} */
        this.canvas   = null;
        /** @type {CanvasRenderingContext2D|null} */
        this.ctx      = null;
        /** @type {number|null} */
        this.animFrame = null;
    }

    /* ── Interface abstrata ───────────────────── */

    /**
     * Atualiza o estado do jogo (lógica, física, etc.) — chamado por frame.
     * @abstract
     */
    update() {
        throw new Error(`${this.constructor.name} deve implementar update()`);
    }

    /**
     * Renderiza o frame no canvas — chamado por frame.
     * @abstract
     */
    draw() {
        throw new Error(`${this.constructor.name} deve implementar draw()`);
    }

    /* ── Setup do canvas ──────────────────────── */

    /**
     * Configura dimensões do canvas com base no container.
     * @param {HTMLCanvasElement} canvasEl
     * @param {number} [heightRatio=0.52]  altura = largura × heightRatio
     * @param {number} [maxWidth=860]
     * @returns {{ width: number, height: number }}
     */
    _setupCanvas(canvasEl, heightRatio = 0.52, maxWidth = 860) {
        this.canvas = canvasEl;
        this.ctx    = canvasEl.getContext('2d');
        const w = Math.min(this.container.clientWidth || maxWidth, maxWidth);
        this.canvas.width  = w;
        this.canvas.height = Math.round(w * heightRatio);
        return { width: this.canvas.width, height: this.canvas.height };
    }

    /* ── Loop de jogo ─────────────────────────── */

    /** Inicia o loop rAF: update() → draw() → requestAnimationFrame. */
    gameLoop() {
        if (!this.gameActive) return;
        this.update();
        this.draw();
        this.animFrame = requestAnimationFrame(() => this.gameLoop());
    }

    /** Cancela o frame de animação pendente. */
    stopLoop() {
        if (this.animFrame !== null) {
            cancelAnimationFrame(this.animFrame);
            this.animFrame = null;
        }
    }

    /* ── Utilitários visuais ──────────────────── */

    /**
     * Sobrepõe um retângulo semitransparente sobre o canvas inteiro.
     * Útil para escurecer a tela antes de exibir o overlay de fim de jogo.
     * @param {number} [alpha=0.72]
     * @param {string} [color='#000000']
     */
    _dimCanvas(alpha = 0.72, color = '#000000') {
        if (!this.ctx || !this.canvas) return;
        this.ctx.save();
        this.ctx.globalAlpha = alpha;
        this.ctx.fillStyle   = color;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
    }

    /* ── Utilitários de input ─────────────────── */

    /**
     * Converte coordenadas de evento mouse/touch para espaço do canvas,
     * levando em conta escala CSS (canvas pode ser menor que o exibido).
     * @param {MouseEvent|Touch} e
     * @returns {{ x: number, y: number }}
     */
    _canvasCoords(e) {
        const rect   = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width  / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top)  * scaleY,
        };
    }

    /**
     * Distância euclidiana entre dois pontos.
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number}
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   GridCanvasGame — ABSTRATA — estende CanvasMinigame para jogos baseados em
   grade 2D. Fornece inicialização de grid, iteração, contagem por estado,
   conversão de coordenadas e consulta de vizinhos.
   Usada como base para Modulo4 (floresta de células).
   ═══════════════════════════════════════════════════════════════════════════ */
export class GridCanvasGame extends CanvasMinigame {
    /**
     * @param {HTMLElement} containerElement
     * @param {Function} onGameEnd
     * @param {Object} [options]
     */
    constructor(containerElement, onGameEnd, options = {}) {
        if (new.target === GridCanvasGame) {
            throw new TypeError('GridCanvasGame é abstrata e não pode ser instanciada diretamente.');
        }
        super(containerElement, onGameEnd, options);
        /** @type {any[][]} */
        this.grid  = [];
        this.rows  = 0;
        this.cols  = 0;
        this.cellW = 0;
        this.cellH = 0;
    }

    /* ── Inicialização da grade ───────────────── */

    /**
     * Constrói a grade com `rows` × `cols` células usando `cellFactory`.
     * @param {number} rows
     * @param {number} cols
     * @param {(row: number, col: number) => any} cellFactory
     */
    _initGrid(rows, cols, cellFactory) {
        this.rows = rows;
        this.cols = cols;
        this.grid = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => cellFactory(r, c))
        );
        this._syncCellSize();
    }

    /**
     * Recalcula cellW/cellH a partir das dimensões atuais do canvas.
     * Deve ser chamado após _setupCanvas().
     */
    _syncCellSize() {
        if (!this.canvas || !this.cols || !this.rows) return;
        this.cellW = this.canvas.width  / this.cols;
        this.cellH = this.canvas.height / this.rows;
    }

    /* ── Conversão de coordenadas ─────────────── */

    /**
     * Converte coordenadas no canvas para índices de célula.
     * @param {number} canvasX
     * @param {number} canvasY
     * @returns {{ row: number, col: number }}
     */
    _gridCoordsFromCanvas(canvasX, canvasY) {
        return {
            row: Math.floor(canvasY / this.cellH),
            col: Math.floor(canvasX / this.cellW),
        };
    }

    /**
     * Verifica se (row, col) está dentro dos limites da grade.
     * @param {number} row
     * @param {number} col
     * @returns {boolean}
     */
    _isValidCell(row, col) {
        return row >= 0 && row < this.rows && col >= 0 && col < this.cols;
    }

    /**
     * Retorna as coordenadas do centro de uma célula no canvas.
     * @param {number} row
     * @param {number} col
     * @returns {{ x: number, y: number }}
     */
    _getCellCenter(row, col) {
        return {
            x: (col + 0.5) * this.cellW,
            y: (row + 0.5) * this.cellH,
        };
    }

    /* ── Consultas na grade ───────────────────── */

    /**
     * Conta células que satisfazem um predicado ou têm um estado específico.
     * @param {string|((cell: any) => boolean)} stateOrFn
     * @returns {number}
     */
    countCells(stateOrFn) {
        const test = typeof stateOrFn === 'function'
            ? stateOrFn
            : cell => cell.state === stateOrFn;
        let count = 0;
        for (const row of this.grid)
            for (const cell of row)
                if (test(cell)) count++;
        return count;
    }

    /**
     * Itera todas as células passando (célula, row, col) para `fn`.
     * @param {(cell: any, row: number, col: number) => void} fn
     */
    forEachCell(fn) {
        for (let r = 0; r < this.rows; r++)
            for (let c = 0; c < this.cols; c++)
                fn(this.grid[r][c], r, c);
    }

    /**
     * Retorna os vizinhos válidos de uma célula.
     * @param {number} row
     * @param {number} col
     * @param {Array<{dr: number, dc: number}>} [dirs]  direções a considerar
     * @returns {Array<{ cell: any, r: number, c: number }>}
     */
    getNeighbors(row, col, dirs = [
        { dr: -1, dc:  0 },
        { dr:  1, dc:  0 },
        { dr:  0, dc: -1 },
        { dr:  0, dc:  1 },
    ]) {
        return dirs
            .map(d => ({ r: row + d.dr, c: col + d.dc }))
            .filter(n => this._isValidCell(n.r, n.c))
            .map(n => ({ cell: this.grid[n.r][n.c], r: n.r, c: n.c }));
    }

    /**
     * Verifica se algum vizinho satisfaz o predicado.
     * @param {number} row
     * @param {number} col
     * @param {string|((cell: any) => boolean)} stateOrFn
     * @param {Array<{dr: number, dc: number}>} [dirs]
     * @returns {boolean}
     */
    hasNeighborMatching(row, col, stateOrFn, dirs = undefined) {
        const test = typeof stateOrFn === 'function'
            ? stateOrFn
            : cell => cell.state === stateOrFn;
        return this.getNeighbors(row, col, dirs).some(n => test(n.cell));
    }

    /**
     * Retorna fração de células em determinado estado (0–1).
     * @param {string|((cell: any) => boolean)} stateOrFn
     * @returns {number}
     */
    getCellFraction(stateOrFn) {
        return this.countCells(stateOrFn) / (this.rows * this.cols);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   MissionSystem — rastreia objetivos rotativos com recompensas.
   Suporta: captura consecutiva, sobrevivência por frames, combo, total coletado
   e ações genéricas (extinção, resgate, etc).
   Eventos: 'progress'(mission, current, target) | 'completed'(mission) | 'new'(mission)
   ═══════════════════════════════════════════════════════════════════════════ */
export class MissionSystem extends EventEmitter {
    /**
     * @param {Array<{
     *   id: string,
     *   text: string,
     *   type: 'consecutive_catch'|'survive_frames'|'reach_combo'|'total_catch'|string,
     *   target: number,
     *   reward: { pts?: number, powerup?: string, water?: number, tool?: string },
     * }>} definitions
     */
    constructor(definitions) {
        super();
        this._definitions  = definitions;
        this._current      = null;
        this._progress     = 0;
        this._streak       = 0;
        this._frameCount   = 0;
    }

    /** Inicia o sistema e sorteia a primeira missão. */
    start() { this._selectNext(); }

    /**
     * Deve ser chamado uma vez por frame no update().
     * Avança missões do tipo 'survive_frames'.
     */
    tick() {
        if (!this._current || this._current.type !== 'survive_frames') return;
        this._frameCount++;
        this._progress = this._frameCount;
        this._emit('progress', this._current, this._progress, this._current.target);
        if (this._frameCount >= this._current.target) this._complete();
    }

    /**
     * Notifica captura de item.
     * @param {boolean} [success=true]  false = erro (animal, miss)
     */
    notifyCatch(success = true) {
        if (!this._current) return;
        const t = this._current.type;
        if (t === 'consecutive_catch') {
            if (success) {
                this._streak++;
                this._setProgress(this._streak);
                if (this._streak >= this._current.target) this._complete();
            } else {
                this._streak = 0;
                this._setProgress(0);
            }
        } else if (t === 'total_catch' && success) {
            this._progress++;
            this._setProgress(this._progress);
            if (this._progress >= this._current.target) this._complete();
        }
    }

    /**
     * Notifica mudança de combo (para missões 'reach_combo').
     * @param {number} combo
     */
    notifyCombo(combo) {
        if (!this._current || this._current.type !== 'reach_combo') return;
        this._setProgress(combo);
        if (combo >= this._current.target) this._complete();
    }

    /**
     * Notifica uma ação genérica (extinção, resgate, etc.).
     * @param {string} type  deve corresponder ao mission.type
     */
    notifyAction(type) {
        if (!this._current || this._current.type !== type) return;
        this._progress++;
        this._setProgress(this._progress);
        if (this._progress >= this._current.target) this._complete();
    }

    /**
     * Notifica perda de vida — reinicia missões de sobrevivência.
     */
    notifyLifeLost() {
        if (!this._current) return;
        if (this._current.type === 'survive_frames') {
            this._frameCount = 0;
            this._setProgress(0);
        }
    }

    getCurrent()          { return this._current; }
    getProgress()         { return this._progress; }
    getProgressFraction() {
        if (!this._current || this._current.target === 0) return 0;
        return Math.min(1, this._progress / this._current.target);
    }

    /** Reset completo (restart do jogo). */
    reset() {
        this._current    = null;
        this._progress   = 0;
        this._streak     = 0;
        this._frameCount = 0;
        this._selectNext();
    }

    /** @private */
    _setProgress(val) {
        this._progress = val;
        this._emit('progress', this._current, val, this._current.target);
    }

    /** @private */
    _complete() {
        const done = this._current;
        this._emit('completed', done);
        this._streak     = 0;
        this._frameCount = 0;
        this._progress   = 0;
        this._selectNext();
    }

    /** @private */
    _selectNext() {
        const pool = this._definitions.filter(d => d !== this._current);
        this._current = pool[Math.floor(Math.random() * pool.length)] ?? this._definitions[0];
        this._progress = 0;
        this._emit('new', this._current);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   PowerUpSystem — gerencia buffs ativos com duração em frames.
   Ativações empilham (estendem a duração). Chama tick() uma vez por frame.
   Eventos: 'activated'(id, frames) | 'expired'(id)
   ═══════════════════════════════════════════════════════════════════════════ */
export class PowerUpSystem extends EventEmitter {
    constructor() {
        super();
        /** @type {Record<string, number>}  id → frames restantes */
        this._active = {};
    }

    /**
     * Ativa (ou estende) um power-up.
     * @param {string} id
     * @param {number} durationFrames
     */
    activate(id, durationFrames) {
        this._active[id] = (this._active[id] || 0) + durationFrames;
        this._emit('activated', id, this._active[id]);
    }

    /** @returns {boolean} */
    isActive(id) { return (this._active[id] ?? 0) > 0; }

    /** Frames restantes (0 se inativo). */
    remaining(id) { return this._active[id] ?? 0; }

    /**
     * Avança todos os power-ups ativos em 1 frame.
     * Chame uma vez por frame no update().
     */
    tick() {
        for (const id of Object.keys(this._active)) {
            this._active[id]--;
            if (this._active[id] <= 0) {
                delete this._active[id];
                this._emit('expired', id);
            }
        }
    }

    /** IDs dos power-ups atualmente ativos. */
    getActiveIds() { return Object.keys(this._active); }

    /** Zera todos (restart). */
    clear() { this._active = {}; }
}


/* ═══════════════════════════════════════════════════════════════════════════
   EcosystemMeter — medidor de saúde do ecossistema com renderização embutida.
   Cor muda de verde → amarelo → vermelho conforme a saúde cai.
   ═══════════════════════════════════════════════════════════════════════════ */
export class EcosystemMeter {
    /**
     * @param {number} [initial=60]
     * @param {number} [min=0]
     * @param {number} [max=100]
     */
    constructor(initial = 60, min = 0, max = 100) {
        this._min  = min;
        this._max  = max;
        this.health = Math.min(max, Math.max(min, initial));
    }

    /** @param {number} amount */
    gain(amount) { this.health = Math.min(this._max, this.health + amount); }

    /** @param {number} amount */
    lose(amount) { this.health = Math.max(this._min, this.health - amount); }

    /** Reinicia para o valor inicial ou para `val`. */
    reset(val = 60) { this.health = Math.min(this._max, Math.max(this._min, val)); }

    /** Fração normalizada 0–1. */
    get fraction() { return (this.health - this._min) / (this._max - this._min); }

    /** Cor CSS baseada na saúde atual. */
    get color() {
        const f = this.fraction;
        if (f > 0.6) return '#4cde7f';
        if (f > 0.3) return '#ffd600';
        return '#ff4444';
    }

    /**
     * Renderiza a barra de saúde no canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     * @param {string} [label='Ecossistema']
     */
    draw(ctx, x, y, w, h, label = 'Ecossistema') {
        ctx.save();
        // Fundo
        ctx.fillStyle   = 'rgba(0,0,0,0.45)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, h / 2);
        ctx.fill();
        // Preenchimento
        const fw = Math.max(0, w * this.fraction);
        if (fw > 0) {
            ctx.fillStyle   = this.color;
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.roundRect(x, y, fw, h, h / 2);
            ctx.fill();
        }
        // Texto
        ctx.globalAlpha  = 0.95;
        ctx.fillStyle    = '#fff';
        ctx.font         = `bold ${Math.round(h * 0.75)}px sans-serif`;
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${label} ${Math.round(this.health)}%`, x + w / 2, y + h / 2);
        ctx.restore();
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   EventScheduler — agenda eventos aleatórios recorrentes (chuva, tempestade…).
   Cada evento tem um delay aleatório, duração opcional e se reagenda sozinho.
   Eventos: 'start'(id) | 'end'(id)
   ═══════════════════════════════════════════════════════════════════════════ */
export class EventScheduler extends EventEmitter {
    /**
     * @param {Array<{
     *   id: string,
     *   minDelay: number,   ms até o próximo disparo
     *   maxDelay: number,
     *   duration: number,   ms de duração (0 = evento instantâneo)
     * }>} eventDefs
     */
    constructor(eventDefs) {
        super();
        this._defs    = eventDefs;
        this._handles = new Set();
        this._running = false;
    }

    /** Inicia o agendamento de todos os eventos. */
    start() {
        this._running = true;
        for (const def of this._defs) this._schedule(def);
    }

    /** Para todos os timers pendentes. */
    stop() {
        this._running = false;
        this._handles.forEach(id => clearTimeout(id));
        this._handles.clear();
    }

    /** @private */
    _schedule(def) {
        if (!this._running) return;
        const delay = def.minDelay + Math.random() * (def.maxDelay - def.minDelay);
        const t1 = setTimeout(() => {
            this._handles.delete(t1);
            if (!this._running) return;
            this._emit('start', def.id);
            if (def.duration > 0) {
                const t2 = setTimeout(() => {
                    this._handles.delete(t2);
                    if (!this._running) return;
                    this._emit('end', def.id);
                    this._schedule(def);
                }, def.duration);
                this._handles.add(t2);
            } else {
                this._schedule(def);
            }
        }, delay);
        this._handles.add(t1);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   WaveSystem — progressão por ondas com pausa entre elas.
   Cada onda tem duração fixa; ao fim, dispara uma pausa antes da próxima.
   Eventos: 'waveStart'(waveNumber, def) | 'breakStart'(waveNumber, nextDef)
   ═══════════════════════════════════════════════════════════════════════════ */
export class WaveSystem extends EventEmitter {
    /**
     * @param {Array<Object>} waveDefs  array de parâmetros por onda (definidos pelo jogo)
     * @param {{ waveDuration?: number, breakDuration?: number }} [options]
     */
    constructor(waveDefs, { waveDuration = 12000, breakDuration = 3500 } = {}) {
        super();
        this._defs          = waveDefs;
        this._waveDuration  = waveDuration;
        this._breakDuration = breakDuration;
        this._index         = -1;
        this._inBreak       = false;
        this._handle        = null;
        this._breakStart    = 0;
        this._running       = false;
    }

    /** Inicia a partir da onda 1. */
    start() {
        this._running = true;
        this._index   = -1;
        this._inBreak = false;
        this._nextWave();
    }

    /** Para todos os timers pendentes. */
    stop() {
        this._running = false;
        clearTimeout(this._handle);
        this._handle = null;
    }

    /** Reset completo (restart do jogo). */
    reset() {
        this.stop();
        this._index   = -1;
        this._inBreak = false;
    }

    /** @private */
    _nextWave() {
        if (!this._running) return;
        this._index++;
        this._inBreak = false;
        this._emit('waveStart', this.waveNumber, this.currentDef);
        this._handle = setTimeout(() => this._startBreak(), this._waveDuration);
    }

    /** @private */
    _startBreak() {
        if (!this._running) return;
        this._inBreak    = true;
        this._breakStart = Date.now();
        const next = this._defs[Math.min(this._index + 1, this._defs.length - 1)];
        this._emit('breakStart', this.waveNumber, next);
        this._handle = setTimeout(() => this._nextWave(), this._breakDuration);
    }

    /** Definição da onda atual (repete a última se passou do array). */
    get currentDef() {
        return this._defs[Math.min(Math.max(this._index, 0), this._defs.length - 1)];
    }

    /** Número da onda atual (1-based). */
    get waveNumber() { return this._index + 1; }

    /** true durante a pausa entre ondas. */
    get isInBreak() { return this._inBreak; }

    /** Fração da pausa decorrida (0–1). */
    get breakProgress() {
        if (!this._inBreak) return 0;
        return Math.min(1, (Date.now() - this._breakStart) / this._breakDuration);
    }

    /** Segundos inteiros restantes na pausa. */
    get breakSecondsLeft() {
        if (!this._inBreak) return 0;
        return Math.ceil((this._breakDuration - (Date.now() - this._breakStart)) / 1000);
    }
}


/* ═══════════════════════════════════════════════════════════════════════════
   ToolSystem — gerencia múltiplas ferramentas com quantidade e teclas de atalho.
   Quantidade -1 = ilimitada. Reagenda cooldowns por frame se necessário.
   Eventos: 'changed'(tool) | 'used'(tool) | 'depleted'(id) | 'refilled'(tool)
   ═══════════════════════════════════════════════════════════════════════════ */
export class ToolSystem extends EventEmitter {
    /**
     * @param {Array<{
     *   id: string,
     *   emoji: string,
     *   label: string,
     *   key: string,
     *   quantity: number,      -1 = ilimitado
     *   maxQuantity: number,
     * }>} toolDefs
     */
    constructor(toolDefs) {
        super();
        this._tools    = toolDefs.map(t => ({ ...t, _qty: t.quantity }));
        this._activeId = toolDefs[0]?.id ?? null;
    }

    /** Seleciona ferramenta pelo ID. */
    select(id) {
        const tool = this._tools.find(t => t.id === id);
        if (!tool) return;
        this._activeId = id;
        this._emit('changed', tool);
    }

    /** Seleciona ferramenta pela tecla de atalho. */
    selectByKey(key) {
        const tool = this._tools.find(t => t.key === key);
        if (tool) this.select(tool.id);
    }

    /** Ferramenta ativa atual. */
    getActive() { return this._tools.find(t => t.id === this._activeId) ?? null; }

    /** Ferramenta por ID. */
    getById(id) { return this._tools.find(t => t.id === id) ?? null; }

    /** @returns {boolean}  a ferramenta ativa pode ser usada agora */
    canUse() {
        const t = this.getActive();
        return t !== null && (t._qty === -1 || t._qty > 0);
    }

    /**
     * Usa a ferramenta ativa uma vez.
     * @returns {string|null}  ID usado ou null se indisponível
     */
    use() {
        const t = this.getActive();
        if (!t || (t._qty !== -1 && t._qty <= 0)) return null;
        if (t._qty !== -1) t._qty--;
        this._emit('used', t);
        if (t._qty === 0) this._emit('depleted', t.id);
        return t.id;
    }

    /**
     * Adiciona quantidade a uma ferramenta.
     * @param {string} id
     * @param {number} amount
     */
    addQuantity(id, amount) {
        const t = this._tools.find(t => t.id === id);
        if (!t || t._qty === -1) return;
        t._qty = Math.min(t.maxQuantity, t._qty + amount);
        this._emit('refilled', t);
    }

    /** Quantidade atual de uma ferramenta. */
    getQuantity(id) {
        const t = this._tools.find(t => t.id === id);
        return t ? t._qty : 0;
    }

    /** Todas as ferramentas com seus estados. */
    getAll() { return [...this._tools]; }

    /** Reset para quantidades iniciais (restart). */
    reset() {
        for (const t of this._tools) t._qty = t.quantity;
        this._activeId = this._tools[0]?.id ?? null;
    }
}
