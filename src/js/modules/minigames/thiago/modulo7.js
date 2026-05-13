// Missão 7 — Microplástico na Grande Barreira de Coral.
// Contrato e exemplos: src/js/modules/minigames/README.md

export class Modulo7 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
    this.score = 0;
    this.health = 100;
    this.combo = 0;
    this.multiplier = 1;
    this.gameActive = false;
    this.items = [];
    this.spawnTimer = 0;
    this.lastTime = 0;
    this.startTime = 0;
    this.plasticFactor = 0;
    this.boundLoop = this.gameLoop.bind(this);
  }

  start() { this.showStartScreen(); }

  showStartScreen() {
    this.container.innerHTML = `
      <div class="thiago-7-container">
        <div class="thiago-7-overlay">
          <h2>Limpeza dos Corais</h2>
          <p>Remova garrafas, sacolas e galões de plástico clicando neles!</p>
          <p style="font-size: 0.9em; margin: 10px 0;">Use sua lixeira para coletar o plástico.</p>
          <p style="font-size: 0.8em; margin: 5px 0; color: #ffcc33;">Atenção: não assuste os peixes ou eles se tornarão plástico!</p>
          <button class="thiago-7-btn" id="t7-start-btn">Começar Missão</button>
        </div>
      </div>
    `;
    this.container.querySelector('#t7-start-btn').onclick = () => this.initGame();
  }

  initGame() {
    this.score = 0; this.health = 100; this.combo = 0; this.multiplier = 1;
    this.items = []; this.startTime = performance.now();

this.container.innerHTML = `
      <button id="t7-exit-btn" class="thiago-7-btn--exit">Sair da Missão</button>
      
      <div class="thiago-7-container">
        <div class="thiago-7-god-rays"></div>
        <div class="thiago-7-banner"></div>
        <div id="t7-marine-snow-container" style="position: absolute; inset: 0; pointer-events: none; z-index: 2;"></div>
        <div id="t7-bubbles-container" style="position: absolute; inset: 0; pointer-events: none; z-index: 100;"></div>
        <div id="t7-damage-flash" class="thiago-7-damage-flash"></div>
        
        <div class="thiago-7-hud">
          <div class="thiago-7-stat">SCORE: <span id="t7-score">0</span><div id="t7-combo" class="thiago-7-combo" style="display: none;">x1 Combo</div></div>
          <div class="thiago-7-stat">CORAL HEALTH<div id="t7-health-bar" class="thiago-7-health-bar"><div id="t7-health" class="thiago-7-health-fill" style="width: 100%"></div></div></div>
        </div>

        <div id="t7-game-area" style="position: absolute; inset: 0; overflow: hidden; z-index: 50;">
          <div class="thiago-7-corals-zone">
            <div class="thiago-7-coral-art c1"></div>
            <div class="thiago-7-coral-art c2"></div>
            <div class="thiago-7-coral-art c3"></div>
            <div class="thiago-7-coral-art c4"></div>
            <div class="thiago-7-coral-art c5"></div>
          </div>
        </div>
        <div id="t7-overlay" class="thiago-7-overlay" style="display: none;"></div>
      </div>
    `;
    
    // Ação cirúrgica: Mata o loop e força a saída imediata
    this.container.querySelector('#t7-exit-btn').onclick = () => {
      this.gameActive = false;
      this.onGameEnd({ success: false, finalScore: this.score, quit: true });
    };
    // ATENÇÃO: Adicione esta linha logo abaixo para o botão funcionar!
    
    
    this.gameArea = this.container.querySelector('#t7-game-area');
    
    // CORREÇÃO 1: Isolamento restrito de layout para impedir reflow global
    this.gameArea.style.contain = 'strict'; 

    this.scoreEl = this.container.querySelector('#t7-score');
    this.comboEl = this.container.querySelector('#t7-combo');
    this.healthEl = this.container.querySelector('#t7-health');
    this.healthBarEl = this.container.querySelector('#t7-health-bar');
    this.overlayEl = this.container.querySelector('#t7-overlay');
    this.bubblesContainer = this.container.querySelector('#t7-bubbles-container');
    this.marineSnowContainer = this.container.querySelector('#t7-marine-snow-container');
    this.damageFlashEl = this.container.querySelector('#t7-damage-flash');

    for (let i = 0; i < 15; i++) this.createMarineSnow();
    this.gameActive = true; this.lastTime = performance.now(); this.bubbleTimer = 0; this.spawnTimer = 0;
    requestAnimationFrame(this.boundLoop);
  }

  createBubble() {
    if (!this.bubblesContainer) return;
    const bubble = document.createElement('div');
    bubble.className = 'thiago-7-bubble';
    const size = 8 + Math.random() * 20; const xPos = Math.random() * 100;
    const drift = (Math.random() - 0.5) * 100; const duration = 4 + Math.random() * 6;
    bubble.style.width = size + 'px'; bubble.style.height = size + 'px';
    bubble.style.left = xPos + '%'; bubble.style.setProperty('--x', drift + 'px'); bubble.style.setProperty('--d', duration + 's');
    this.bubblesContainer.appendChild(bubble);
    setTimeout(() => { if(bubble.parentNode) bubble.remove(); }, duration * 1000);
  }

  createMarineSnow() {
    if (!this.marineSnowContainer) return;
    const snow = document.createElement('div');
    snow.className = 'thiago-7-marine-snow';
    const duration = 10 + Math.random() * 20;
    snow.style.left = Math.random() * 100 + '%'; snow.style.top = -Math.random() * 20 + '%';
    snow.style.setProperty('--tx', (Math.random() - 0.5) * 200 + 'px'); snow.style.setProperty('--d', duration + 's');
    this.marineSnowContainer.appendChild(snow);
    setTimeout(() => { if(snow.parentNode) snow.remove(); }, duration * 1000);
  }

  gameLoop(now) {
    if (!this.gameActive) return;
    const dt = Math.min(now - this.lastTime, 100); this.lastTime = now;
    this.plasticFactor = Math.min(1.0, (now - this.startTime) / 60000);

    this.bubbleTimer += dt;
    if (this.bubbleTimer > 800) { this.createBubble(); if (Math.random() > 0.4) this.createMarineSnow(); this.bubbleTimer = 0; }

    this.spawnTimer += dt;
    if (this.spawnTimer > Math.max(450, 1200 - (this.score * 1.5))) { this.spawnItem(); this.spawnTimer = 0; }

    this.updateItems(dt, now);
    requestAnimationFrame(this.boundLoop);
  }

  spawnItem() {
    if (!this.gameArea) return;
    const rand = Math.random();
    let type, asset;
    if (rand < 0.25) type = 'fish';
    else if (rand < 0.45) { type = 'pet'; asset = 'waste-plastic-pet.png'; }
    else if (rand < 0.65) { type = 'microplastic'; asset = 'waste-microplastic.png'; }
    else if (rand < 0.8) type = 'bag';
    else if (rand < 0.9) type = 'jug';
    else type = 'straw';
    
    const el = document.createElement('div');
    el.className = `thiago-7-item thiago-7-${type}`;
    if (asset) el.style.backgroundImage = `url('/assets/generated/cutouts/${asset}')`;
    if (type === 'fish') { el.classList.add('is-plastic'); el.style.setProperty('--plastic-mix', this.plasticFactor); }

    const areaH = this.gameArea.clientHeight || 500;
    el.style.top = (Math.random() * (areaH - 180) + 120) + 'px';
    
    // CORREÇÃO 2: Reforça o position e manda pra GPU antes de nascer na tela
    el.style.position = 'absolute';
    el.style.willChange = 'transform';
    el.style.transform = 'translateX(-100px)';

    el.onpointerdown = (e) => { e.preventDefault(); this.collect(el, type, e.clientX, e.clientY); };
    this.gameArea.appendChild(el);
    this.items.push({
      el, type, x: -100, rotation: Math.random() * 360, rotSpeed: (Math.random() - 0.5) * 2,
      speed: 2.5 + Math.random() * 3 + (this.score / 1000),
      collected: false
    });
  }

  updateItems(dt, now) {
    const areaW = this.gameArea?.clientWidth || 900;
    
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      if (item.collected) continue;

      item.x += item.speed * (dt / 16.67);
      
      if (item.type === 'fish') {
        item.el.style.transform = `translate3d(${item.x}px, 0px, 0px)`;
        item.el.style.setProperty('--plastic-mix', this.plasticFactor);
      } else {
        item.rotation += item.rotSpeed * (dt / 16.67);
        item.el.style.transform = `translate3d(${item.x}px, 0px, 0px) rotate(${item.rotation}deg)`;
      }

      // Passou do limite da tela
      if (item.x > areaW - 110) {
        if (item.type !== 'fish') { this.takeDamage(12); this.resetCombo(); }
        
        // CORREÇÃO 3: Remoção assíncrona blindada contra Layout Thrashing
        const elToRemove = item.el;
        elToRemove.style.display = 'none'; // Some da tela instantaneamente sem recalcular layout
        setTimeout(() => {
          if (elToRemove.parentNode) elToRemove.remove();
        }, 0); // O .remove() só acontece quando o navegador terminar de pintar este frame
        
        this.items.splice(i, 1);
      }
    }
  }

  collect(el, type, clickX, clickY) {
    const idx = this.items.findIndex(it => it.el === el);
    if (idx === -1) return;
    
    const item = this.items[idx];
    if (item.collected) return;
    
    item.collected = true;
    el.style.pointerEvents = 'none';

    if (type === 'fish') {
      this.takeDamage(20); this.resetCombo(); this.score = Math.max(0, this.score - 15);
      this.showScorePop('-15', clickX, clickY, false); el.style.filter = 'brightness(3) saturate(0)';
    } else {
      this.combo++; this.multiplier = 1 + Math.floor(this.combo / 5) * 0.5;
      const pts = Math.round(20 * this.multiplier); this.score += pts;
      this.updateComboUI(); this.showScorePop(`+${pts}`, clickX, clickY, true);
      el.style.transform = `translate(${item.x}px, 0px) scale(1.5) rotate(15deg)`;
      el.style.opacity = '0';
    }

    if (this.scoreEl) this.scoreEl.textContent = this.score;
    
    setTimeout(() => {
      const currentIdx = this.items.indexOf(item);
      if (currentIdx !== -1) {
        this.items.splice(currentIdx, 1);
      }
      if (el.parentNode) {
        el.style.display = 'none'; // Prevenção extra
        el.remove();
      }
    }, 200);
  }

  showScorePop(text, x, y, isPos) {
    const pop = document.createElement('div'); pop.className = `thiago-7-score-pop ${isPos ? 'pop-plus' : 'pop-minus'}`;
    pop.textContent = text; const rect = this.container.getBoundingClientRect();
    pop.style.left = (x - rect.left) + 'px'; pop.style.top = (y - rect.top) + 'px';
    this.container.appendChild(pop); setTimeout(() => pop.remove(), 800);
  }

  updateComboUI() {
    if (!this.comboEl) return;
    if (this.combo >= 3) {
      this.comboEl.style.display = 'block'; 
      this.comboEl.textContent = `${this.combo} Combo (x${this.multiplier.toFixed(1)})`;
      this.comboEl.classList.remove('bump'); 
      requestAnimationFrame(() => {
        if (this.comboEl) this.comboEl.classList.add('bump');
      });
    } else { 
      this.comboEl.style.display = 'none'; 
    }
  }

  resetCombo() { this.combo = 0; this.multiplier = 1; this.updateComboUI(); }

  takeDamage(amt) {
    this.health = Math.max(0, this.health - amt);
    if (this.healthEl) this.healthEl.style.width = this.health + '%';
    if (this.health < 30 && this.healthBarEl) this.healthBarEl.classList.add('thiago-7-health-low');
    if (this.damageFlashEl) { this.damageFlashEl.classList.add('active'); setTimeout(() => this.damageFlashEl.classList.remove('active'), 100); }
    if (this.health <= 0) this.endGame();
  }

  endGame() {
    this.gameActive = false; this.items.forEach(it => it.el.remove()); this.items = [];
    if (this.overlayEl) {
      this.overlayEl.innerHTML = `<h2>${this.score >= 50 ? 'Missão Cumprida!' : 'Os corais sofreram!'}</h2><p>Pontos: <strong>${this.score}</strong></p><div class="thiago-7-actions"><button class="thiago-7-btn" id="t7-retry">Tentar Novamente</button><button class="thiago-7-btn thiago-7-btn--secondary" id="t7-finish">Finalizar</button></div>`;
      this.overlayEl.style.display = 'flex';
      this.overlayEl.querySelector('#t7-retry').onclick = () => this.initGame();
      this.overlayEl.querySelector('#t7-finish').onclick = () => this.onGameEnd({ success: this.score >= 50, finalScore: this.score });
    }
  }
}