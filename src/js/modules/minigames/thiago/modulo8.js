// Missão 8 — Trilhas e mineração na Cordilheira dos Andes.
// Mecânica: sobrevivência (endurance) com triagem de lixo por arrastar.

export class Modulo8 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
    this.score = 0;
    this.health = 100;
    this.combo = 0;
    this.multiplier = 1;
    this.survivalTime = 0;
    this.gameActive = false;
    this.items = [];
    this.spawnTimer = 0;
    this.lastTime = 0;
    this.startTime = 0;
    this.draggedItem = null;
    
    this.boundLoop = this.gameLoop.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handlePointerUp = this.handlePointerUp.bind(this);
    this.handlePointerCancel = this.handlePointerUp.bind(this);
  }

  start() { this.showStartScreen(); }

  showStartScreen() {
    this.container.innerHTML = `
      <div class="thiago-8-wrapper">
        <button id="t8-exit-btn" class="thiago-8-btn--exit">Sair da Missão</button>
        <div class="thiago-8-container">
          <div class="thiago-8-overlay" style="display: flex;">
            <h2>Andes: Escalada Limpa</h2>
            <p>O turismo de altitude está poluindo a Cordilheira!</p>
            <p style="font-size: 0.9em; margin: 10px 0;"><strong>AGUENTE O MÁXIMO DE TEMPO</strong> classificando o lixo nas lixeiras corretas.</p>
            <div style="display: flex; gap: 15px; justify-content: center; margin: 15px 0;">
               <span style="color: #ef4444; font-weight: bold;">🔴 Plástico</span>
               <span style="color: #f59e0b; font-weight: bold;">🟡 Metal/Vidro</span>
               <span style="color: #22c55e; font-weight: bold;">🟢 Orgânico</span>
            </div>
            <p style="color: #60a5fa; font-weight: bold;">Lixo acumulado na neve polui a montanha rapidamente.</p>
            <button class="thiago-8-btn" id="t8-start-btn">Iniciar escalada</button>
          </div>
        </div>
      </div>
    `;
    this.container.querySelector('#t8-exit-btn').onclick = () => this.onGameEnd({ success: false, finalScore: 0, quit: true });
    this.container.querySelector('#t8-start-btn').onclick = () => this.initGame();
  }

  initGame() {
    this.score = 0; this.health = 100; this.combo = 0; this.multiplier = 1;
    this.items = []; this.draggedItem = null; this.survivalTime = 0;
    this.startTime = performance.now();

    this.container.innerHTML = `
      <div class="thiago-8-wrapper">
        <button id="t8-exit-btn" class="thiago-8-btn--exit">Sair da Missão</button>
        <div class="thiago-8-container" style="touch-action: none;">
          
          <div class="thiago-8-mountains"></div>
          <div id="t8-snow-container" style="position: absolute; inset: 0; pointer-events: none; z-index: 2;"></div>
          <div id="t8-damage-flash" class="thiago-8-damage-flash"></div>
          
          <div class="thiago-8-hud">
            <div class="thiago-8-stat thiago-8-timer">TEMPO: <span id="t8-time">00:00</span></div>
            <div class="thiago-8-stat">PONTOS: <span id="t8-score">0</span><div id="t8-combo" class="thiago-8-combo" style="display: none;">x1 Combo</div></div>
            <div class="thiago-8-stat">ESTADO DA NEVE<div id="t8-health-bar" class="thiago-8-health-bar"><div id="t8-health" class="thiago-8-health-fill" style="width: 100%"></div></div></div>
          </div>

          <div id="t8-game-area" style="position: absolute; inset: 0; overflow: hidden; z-index: 50; contain: strict;">
            <div class="thiago-8-bins-container">
              <div class="thiago-8-bin thiago-8-bin--plastic" data-type="plastic"></div>
              <div class="thiago-8-bin thiago-8-bin--metal" data-type="metal"></div>
              <div class="thiago-8-bin thiago-8-bin--organic" data-type="organic"></div>
            </div>
          </div>
          <div id="t8-overlay" class="thiago-8-overlay" style="display: none;"></div>
        </div>
      </div>
    `;
    
    this.container.querySelector('#t8-exit-btn').onclick = () => {
      this.gameActive = false;
      this.onGameEnd({ success: false, finalScore: this.score, quit: true });
    };

    this.gameArea = this.container.querySelector('#t8-game-area');
    this.scoreEl = this.container.querySelector('#t8-score');
    this.timeEl = this.container.querySelector('#t8-time');
    this.comboEl = this.container.querySelector('#t8-combo');
    this.healthEl = this.container.querySelector('#t8-health');
    this.healthBarEl = this.container.querySelector('#t8-health-bar');
    this.overlayEl = this.container.querySelector('#t8-overlay');
    this.snowContainer = this.container.querySelector('#t8-snow-container');
    this.damageFlashEl = this.container.querySelector('#t8-damage-flash');
    this.bins = Array.from(this.container.querySelectorAll('.thiago-8-bin'));

    const target = this.container.querySelector('.thiago-8-wrapper');
    target.addEventListener('pointermove', this.handlePointerMove);
    target.addEventListener('pointerup', this.handlePointerUp);
    target.addEventListener('pointercancel', this.handlePointerCancel);

    for (let i = 0; i < 20; i++) this.createSnowflake();
    
    this.gameActive = true; 
    this.lastTime = performance.now(); 
    this.spawnTimer = 0;
    requestAnimationFrame(this.boundLoop);
  }

  createSnowflake() {
    if (!this.snowContainer) return;
    const snow = document.createElement('div');
    snow.className = 'thiago-8-snowflake';
    const duration = 5 + Math.random() * 10;
    snow.style.left = Math.random() * 100 + '%'; 
    snow.style.top = -Math.random() * 20 + '%';
    snow.style.width = snow.style.height = (2 + Math.random() * 4) + 'px';
    snow.style.setProperty('--tx', (Math.random() - 0.5) * 100 + 'px'); 
    snow.style.setProperty('--d', duration + 's');
    this.snowContainer.appendChild(snow);
    setTimeout(() => { if(snow.parentNode) snow.remove(); }, duration * 1000);
  }

  gameLoop(now) {
    if (!this.gameActive) return;
    const dt = Math.min(now - this.lastTime, 100); 
    this.lastTime = now;

    this.survivalTime = Math.floor((now - this.startTime) / 1000);
    if (this.timeEl) {
        const mins = Math.floor(this.survivalTime / 60).toString().padStart(2, '0');
        const secs = (this.survivalTime % 60).toString().padStart(2, '0');
        this.timeEl.textContent = `${mins}:${secs}`;
    }

    if (Math.random() > 0.92) this.createSnowflake();

    this.spawnTimer += dt;
    const spawnInterval = Math.max(700, 3000 - (this.survivalTime * 15)); 

    if (this.spawnTimer > spawnInterval) { 
      this.spawnTouristAndTrash(); 
      this.spawnTimer = 0; 
    }

    let trashOnGround = this.items.filter(it => it.onGround && !it.isDragging && (now - it.landedAt > 1000)).length;
    
    if (trashOnGround > 0) {
      const damageMultiplier = 1 + (this.survivalTime / 120); 
      this.takeDamage(trashOnGround * 0.04 * damageMultiplier * (dt / 16.67), true);
    }

    requestAnimationFrame(this.boundLoop);
  }

  spawnTouristAndTrash() {
    if (!this.gameArea) return;
    
    const tourist = document.createElement('div');
    const colors = ['red', 'blue', 'green', 'orange'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    tourist.className = `thiago-8-tourist thiago-8-tourist--${color}`;
    tourist.innerHTML = `
      <div class="t8-backpack"></div>
      <div class="t8-body"></div>
      <div class="t8-head"><div class="t8-goggles"></div></div>
      <div class="t8-pole t8-pole-left"></div>
      <div class="t8-pole t8-pole-right"></div>
    `;
    
    const startLeft = Math.random() > 0.5;
    const duration = Math.max(4.5, 7 - (this.survivalTime / 60)); 
    
    tourist.style.animation = startLeft 
        ? `climbMountainRight ${duration}s linear forwards, walkBob 0.3s infinite alternate` 
        : `climbMountainLeft ${duration}s linear forwards, walkBob 0.3s infinite alternate`;
        
    if (!startLeft) tourist.style.transform = 'scaleX(-1)';
    
    this.gameArea.appendChild(tourist);
    
    const dropDelay = (duration * 1000) * (0.3 + Math.random() * 0.4);
    setTimeout(() => {
      if (!this.gameActive) return;
      this.spawnTrash(tourist.getBoundingClientRect());
    }, dropDelay);

    setTimeout(() => { if(tourist.parentNode) tourist.remove(); }, duration * 1000);
  }

  spawnTrash(touristRect) {
    if (!this.gameArea) return;
    const rand = Math.random();
    let category, type;
    
    if (rand < 0.35) { category = 'plastic'; type = 'bag'; }
    else if (rand < 0.65) { category = 'plastic'; type = 'jug'; }
    else if (rand < 0.85) { category = 'metal'; type = 'can'; } 
    else { category = 'organic'; type = 'apple'; }
    
    const el = document.createElement('div');
    el.className = `thiago-8-item thiago-7-${type}`;
    if (type === 'apple') { el.className = 'thiago-8-item thiago-8-organic thiago-8-apple'; }
    if (type === 'can') { el.className = 'thiago-8-item thiago-8-metal thiago-8-can'; }

    const gameRect = this.gameArea.getBoundingClientRect();
    
    // O left e top base são fixos (nunca mudam durante o jogo)
    let startX = touristRect.left - gameRect.left + 20;
    let startY = touristRect.top - gameRect.top + 35;

    el.style.left = startX + 'px';
    el.style.top = startY + 'px';

    const safeZone = 320; 
    const maxDrop = Math.max(10, gameRect.height - safeZone - startY); 
    const dropY = Math.min(Math.random() * 120 + 60, maxDrop);
    const dropX = Math.random() * 80 - 40;

    // Trackeamos o X e Y dinâmico dentro do objeto para o Translate3D
    const itemData = { 
        el, category, isDragging: false, onGround: false, landedAt: 0, 
        baseX: startX, baseY: startY, x: dropX, y: dropY 
    };
    
    // Otimização de GPU direta no spawn
    el.style.willChange = 'transform';
    el.style.transform = `translate3d(0, -30px, 0) scale(0)`;

    setTimeout(() => {
      el.style.transform = `translate3d(${itemData.x}px, ${itemData.y}px, 0) scale(1) rotate(${Math.random() * 720}deg)`;
      itemData.onGround = true;
      itemData.landedAt = performance.now(); 
    }, 50);

    el.onpointerdown = (e) => this.handlePointerDown(e, itemData);
    this.gameArea.appendChild(el);
    this.items.push(itemData);
  }

  handlePointerDown(e, itemData) {
    e.preventDefault();
    if (itemData.onGround === false) return;

    this.draggedItem = itemData;
    itemData.isDragging = true;
    
    const el = itemData.el;
    el.style.transition = 'none'; 
    el.style.zIndex = 1000;
    
    const gameRect = this.gameArea.getBoundingClientRect();
    const pointerX = e.clientX - gameRect.left;
    const pointerY = e.clientY - gameRect.top;
    
    // Calcula o offset em relação ao transform atual (Evita o pulo inicial)
    this.dragOffsetX = pointerX - (itemData.baseX + itemData.x);
    this.dragOffsetY = pointerY - (itemData.baseY + itemData.y);
    
    el.classList.add('dragging');
  }

  handlePointerMove(e) {
    if (!this.draggedItem) return;
    e.preventDefault();
    
    const itemData = this.draggedItem;
    const gameRect = this.gameArea.getBoundingClientRect();
    const pointerX = e.clientX - gameRect.left;
    const pointerY = e.clientY - gameRect.top;
    
    // Apenas a variável transform X/Y muda. DOM left/top não mudam!
    itemData.x = pointerX - itemData.baseX - this.dragOffsetX;
    itemData.y = pointerY - itemData.baseY - this.dragOffsetY;
    
    itemData.el.style.transform = `translate3d(${itemData.x}px, ${itemData.y}px, 0) scale(1.4) rotate(0deg)`;
  }

  handlePointerUp(e) {
    if (!this.draggedItem) return;
    const itemData = this.draggedItem;
    const el = itemData.el;
    this.draggedItem = null;
    itemData.isDragging = false;
    
    el.classList.remove('dragging');
    el.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    el.style.zIndex = 150;

    const itemRect = el.getBoundingClientRect();
    let sortedBin = null;

    for (let bin of this.bins) {
      const binRect = bin.getBoundingClientRect();
      if (itemRect.left < binRect.right && itemRect.right > binRect.left &&
          itemRect.top < binRect.bottom && itemRect.bottom > binRect.top) {
        sortedBin = bin;
        break;
      }
    }

    if (sortedBin) {
      this.processSort(itemData, sortedBin.dataset.type, e.clientX, e.clientY);
    } else {
      itemData.y += 30; // Cai um pouquinho na neve
      el.style.transform = `translate3d(${itemData.x}px, ${itemData.y}px, 0) scale(1) rotate(${Math.random() * 120}deg)`;
    }
  }

  processSort(itemData, binType, x, y) {
    const isCorrect = itemData.category === binType;
    const el = itemData.el;

    if (isCorrect) {
      this.combo++; 
      this.multiplier = 1 + Math.floor(this.combo / 3) * 0.5;
      const pts = Math.round(50 * this.multiplier); 
      this.score += pts;
      this.updateComboUI(); 
      this.showScorePop(`+${pts}`, x, y, true);
    } else {
      this.takeDamage(12); 
      this.resetCombo(); 
      this.showScorePop('Errou!', x, y, false);
    }

    if (this.scoreEl) this.scoreEl.textContent = this.score;
    
    el.style.pointerEvents = 'none'; 
    itemData.y -= 80; // Efeito de sucção 3D pra lixeira
    el.style.transform = `translate3d(${itemData.x}px, ${itemData.y}px, 0) scale(0.1)`;
    el.style.opacity = '0';
    
    const idx = this.items.indexOf(itemData);
    if (idx > -1) this.items.splice(idx, 1);
    
    // Prevenção de Shift: Tiramos da pintura antes de remover do DOM
    setTimeout(() => { 
        el.style.display = 'none';
        setTimeout(() => { if (el.parentNode) el.remove(); }, 0);
    }, 300);
  }

  showScorePop(text, x, y, isPos) {
    const pop = document.createElement('div'); 
    pop.className = `thiago-8-score-pop ${isPos ? 'pop-plus' : 'pop-minus'}`;
    pop.textContent = text; 
    const rect = this.container.getBoundingClientRect();
    pop.style.left = (x - rect.left) + 'px'; 
    pop.style.top = (y - rect.top) + 'px';
    this.container.appendChild(pop); 
    setTimeout(() => pop.remove(), 800);
  }

  updateComboUI() {
    if (!this.comboEl) return;
    if (this.combo >= 2) {
      this.comboEl.style.display = 'block'; 
      this.comboEl.textContent = `${this.combo} Combo (x${this.multiplier.toFixed(1)})`;
      this.comboEl.classList.remove('bump'); 
      requestAnimationFrame(() => { if (this.comboEl) this.comboEl.classList.add('bump'); });
    } else { 
      this.comboEl.style.display = 'none'; 
    }
  }

  resetCombo() { this.combo = 0; this.multiplier = 1; this.updateComboUI(); }

  takeDamage(amt, isContinuous = false) {
    this.health = Math.max(0, this.health - amt);
    if (this.healthEl) this.healthEl.style.width = this.health + '%';
    
    if (this.health < 30 && this.healthBarEl) {
        this.healthBarEl.classList.add('thiago-8-health-low');
    }
    
    if (!isContinuous && this.damageFlashEl) {
        this.damageFlashEl.classList.add('active'); 
        setTimeout(() => this.damageFlashEl.classList.remove('active'), 120); 
    }
    
    if (this.health <= 0) this.endGame();
  }

  endGame() {
    this.gameActive = false; 
    
    // Limpeza de arrays sem Reflows
    this.items.forEach(it => {
        it.el.style.display = 'none';
        setTimeout(() => { if (it.el.parentNode) it.el.remove(); }, 0);
    });
    this.items = [];
    
    const target = this.container.querySelector('.thiago-8-wrapper');
    target.removeEventListener('pointermove', this.handlePointerMove);
    target.removeEventListener('pointerup', this.handlePointerUp);
    target.removeEventListener('pointercancel', this.handlePointerCancel);

    if (this.overlayEl) {
        const mins = Math.floor(this.survivalTime / 60).toString().padStart(2, '0');
        const secs = (this.survivalTime % 60).toString().padStart(2, '0');
        const success = this.survivalTime >= 60;

      this.overlayEl.innerHTML = `
        <h2>${success ? 'Grande Expedição!' : 'Resgate Acionado!'}</h2>
        <p style="font-size: 1.5em; color: #ffcc33;">Sobreviveu: <strong>${mins}:${secs}</strong></p>
        <p>Pontuação de Limpeza: ${this.score}</p>
        <div style="display: flex; gap: 15px; margin-top: 25px;">
            <button class="thiago-8-btn" id="t8-retry">Tentar Novamente</button>
            <button class="thiago-8-btn" style="background: #334155;" id="t8-finish">Finalizar</button>
        </div>`;
      this.overlayEl.style.display = 'flex';
      
      this.overlayEl.querySelector('#t8-retry').onclick = () => {
          this.overlayEl.style.display = 'none';
          this.initGame();
      };
      
      this.overlayEl.querySelector('#t8-finish').onclick = () => this.onGameEnd({ success, finalScore: this.score });
    }
  }
}