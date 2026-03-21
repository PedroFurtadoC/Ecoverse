import '../css/main.css';
import { GAME_CONFIG, MISSIONS, MINIGAME_CONFIG, TIPS, ASSET_LIST } from './config/data.js';
import { state, saveState, loadState } from './store/state.js';
import { Pomodoro } from './modules/pomodoro.js';
import { MiniGames } from './modules/minigames.js';
import { QuizODS } from './modules/quizzes.js';
import { AchievementSystem } from './modules/achievements.js';

/* ---------- DOM refs ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loadScreen     = $('#loading-screen');
const progressFill   = $('#progress-fill');
const progressText   = $('#progress-text');
const tipEl          = $('#loading-tip');
const gameContainer  = $('#game-container');
const globeWrapper   = $('#globe-wrapper');
const particleCanvas = $('#particle-canvas');
const ctx            = particleCanvas ? particleCanvas.getContext('2d') : null;
const celebOverlay   = $('#celebration-overlay');

const hudEnergy       = $('#hud-energy');
const hudCoins        = $('#hud-coins');
const hudImpact       = $('#hud-impact');
const hudProgress     = $('#hud-progress-fill');
const hudProgressText = $('#hud-progress-text');

const missionTitle    = $('#mission-title');
const missionDesc     = $('#mission-desc');
const missionLocation = $('#mission-location');
const missionCost     = $('#mission-cost');
const missionReward   = $('#mission-reward');
const missionImpact   = $('#mission-impact');
const missionGame     = $('#mission-game');
const missionPhoto    = $('#mission-photo');
const btnStartMission = $('#btn-start-mission');

const toastContainer = $('#toast-container');

let globe = null; // Globe.GL instance

/* ---------- Animated HUD ---------- */
let displayEnergy = 0, displayCoins = 0, displayImpact = 0;
let hudAnimFrame = null;

function animateHUD() {
  let done = true;
  if (displayEnergy !== state.energy) { displayEnergy += Math.sign(state.energy - displayEnergy); done = false; }
  hudEnergy.textContent = displayEnergy;
  if (displayCoins !== state.coins) {
    const step = Math.max(1, Math.ceil(Math.abs(state.coins - displayCoins) / 10));
    displayCoins = displayCoins < state.coins ? Math.min(displayCoins + step, state.coins) : Math.max(displayCoins - step, state.coins);
    done = false;
  }
  hudCoins.textContent = displayCoins;
  const diff = state.impact - displayImpact;
  if (Math.abs(diff) > 0.02) { displayImpact += diff * 0.12; done = false; }
  else displayImpact = state.impact;
  hudImpact.textContent = displayImpact.toFixed(1);
  const prog = state.completed.length;
  hudProgress.style.width = ((prog / MISSIONS.length) * 100) + '%';
  hudProgressText.textContent = `${prog}/${MISSIONS.length}`;
  hudAnimFrame = done ? null : requestAnimationFrame(animateHUD);
}

function updateHUD() { if (!hudAnimFrame) hudAnimFrame = requestAnimationFrame(animateHUD); }

function syncHUDImmediate() {
  displayEnergy = state.energy; displayCoins = state.coins; displayImpact = state.impact;
  hudEnergy.textContent = state.energy; hudCoins.textContent = state.coins;
  hudImpact.textContent = state.impact.toFixed(1);
  hudProgress.style.width = ((state.completed.length / MISSIONS.length) * 100) + '%';
  hudProgressText.textContent = `${state.completed.length}/${MISSIONS.length}`;
}

/* ---------- Toast ---------- */
export function showToast(msg, type = 'info') {
  if (!toastContainer) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  toastContainer.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 450); }, 3200);
}

/* ---------- Modals ---------- */
function openModal(id) { const el = document.getElementById(id); if (el) el.classList.add('active'); }
function closeModal(id) { const el = document.getElementById(id); if (el) el.classList.remove('active'); }

document.addEventListener('click', (e) => {
  const closeBtn = e.target.closest('[data-close]');
  if (closeBtn) { closeModal(closeBtn.dataset.close); return; }
  if (e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) e.target.classList.remove('active');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') $$('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
});

if ($('#btn-menu')) $('#btn-menu').addEventListener('click', () => openModal('modal-menu'));
if ($('#btn-donate')) $('#btn-donate').addEventListener('click', () => openModal('modal-donate'));
if ($('#btn-pomodoro')) $('#btn-pomodoro').addEventListener('click', () => openModal('modal-pomodoro'));
if ($('#btn-achievements')) $('#btn-achievements').addEventListener('click', () => {
  AchievementSystem.renderGallery();
  openModal('modal-achievements');
});
$$('.donate-option').forEach((btn) => {
  btn.addEventListener('click', () => { showToast('Obrigado pelo interesse! Em breve.', 'info'); closeModal('modal-donate'); });
});
const btnQuiz = $('#btn-quiz-ods');
if (btnQuiz) btnQuiz.addEventListener('click', () => {
  QuizODS.open();
});

/* ---------- Node state ---------- */
function getNodeState(mission) {
  if (state.completed.includes(mission.id)) return 'complete';
  if (mission.prereqId === null || state.completed.includes(mission.prereqId)) return 'available';
  return 'locked';
}

/* ---------- Globe.GL Setup ---------- */
function initGlobe() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  if (typeof Globe === 'undefined') return;

  globe = Globe()
    .globeImageUrl('assets/earth-texture.jpg')
    .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
    .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
    .showAtmosphere(true)
    .atmosphereColor('#4dd0e1')
    .atmosphereAltitude(0.18)
    .width(width)
    .height(height)
    // HTML markers for missions
    .htmlElementsData(getMissionMarkers())
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude(0.025)
    .htmlElement(d => {
      const st = getNodeState(d.mission);
      const el = document.createElement('div');
      el.className = `globe-marker ${st}`;
      el.innerHTML = `
        <div class="gm-pin">
          <div class="gm-icon">${d.mission.id}</div>
        </div>
        <div class="gm-label">${d.mission.title}</div>
        <div class="gm-location">${d.mission.location}</div>
      `;

      if (st === 'available') {
        el.classList.add('gm-pulse');
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          flyToMission(d.mission);
          setTimeout(() => openMissionCard(d.mission), 1200);
        });
        el.style.cursor = 'pointer';
      } else if (st === 'locked') {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          showToast('Complete a missão anterior para desbloquear!', 'info');
        });
        el.style.cursor = 'not-allowed';
      } else {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          flyToMission(d.mission);
          showToast(`✅ "${d.mission.title}" já completada!`, 'info');
        });
        el.style.cursor = 'pointer';
      }

      return el;
    })
    (globeWrapper);

  // Auto-rotate
  globe.controls().autoRotate = true;
  globe.controls().autoRotateSpeed = 0.5;
  globe.controls().enableDamping = true;
  globe.controls().dampingFactor = 0.1;

  // Offset for header: shift camera slightly down
  const renderer = globe.renderer();
  if (renderer && renderer.domElement) {
    renderer.domElement.style.marginTop = '30px';
  }

  // Start looking at first available mission
  const firstAvailable = MISSIONS.find(m => getNodeState(m) === 'available');
  if (firstAvailable) {
    globe.pointOfView({ lat: firstAvailable.lat, lng: firstAvailable.lng, altitude: 2.2 }, 0);
  } else {
    globe.pointOfView({ lat: -3.4653, lng: -62.2159, altitude: 2.2 }, 0);
  }

  // Arcs between sequential missions (connections)
  const arcData = [];
  for (let i = 1; i < MISSIONS.length; i++) {
    const from = MISSIONS[i - 1];
    const to = MISSIONS[i];
    const bothDone = state.completed.includes(from.id) && state.completed.includes(to.id);
    const nextAvail = state.completed.includes(from.id) && !state.completed.includes(to.id);
    arcData.push({
      startLat: from.lat, startLng: from.lng,
      endLat: to.lat, endLng: to.lng,
      color: bothDone ? ['#F1C40F', '#2ECC71'] : nextAvail ? ['#2ECC71', '#26C6DA'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
      stroke: bothDone ? 1.2 : nextAvail ? 0.8 : 0.4,
      dashGap: bothDone ? 0 : 2,
      dashLen: bothDone ? 0 : 4
    });
  }

  globe
    .arcsData(arcData)
    .arcColor('color')
    .arcStroke('stroke')
    .arcDashLength('dashLen')
    .arcDashGap('dashGap')
    .arcDashAnimateTime(3000);

  // Planted trees as points on globe
  renderPlantedTreesOnGlobe();

  // Handle resize
  window.addEventListener('resize', () => {
    globe.width(window.innerWidth).height(window.innerHeight);
    if (particleCanvas && ctx) resizeCanvas();
  });
}

function getMissionMarkers() {
  return MISSIONS.map(m => ({
    lat: m.lat,
    lng: m.lng,
    mission: m
  }));
}

function refreshGlobeMarkers() {
  if (!globe) return;
  globe.htmlElementsData(getMissionMarkers());
  // Refresh arcs
  const arcData = [];
  for (let i = 1; i < MISSIONS.length; i++) {
    const from = MISSIONS[i - 1];
    const to = MISSIONS[i];
    const bothDone = state.completed.includes(from.id) && state.completed.includes(to.id);
    const nextAvail = state.completed.includes(from.id) && !state.completed.includes(to.id);
    arcData.push({
      startLat: from.lat, startLng: from.lng,
      endLat: to.lat, endLng: to.lng,
      color: bothDone ? ['#F1C40F', '#2ECC71'] : nextAvail ? ['#2ECC71', '#26C6DA'] : ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)'],
      stroke: bothDone ? 1.2 : nextAvail ? 0.8 : 0.4,
      dashGap: bothDone ? 0 : 2,
      dashLen: bothDone ? 0 : 4
    });
  }
  globe.arcsData(arcData);
  renderPlantedTreesOnGlobe();
}

function flyToMission(mission) {
  if (!globe) return;
  globe.controls().autoRotate = false;
  globe.pointOfView({ lat: mission.lat, lng: mission.lng, altitude: 1.8 }, 1000);
  setTimeout(() => { globe.controls().autoRotate = true; globe.controls().autoRotateSpeed = 0.15; }, 5000);
}

/* ---------- Planted trees on globe ---------- */
function renderPlantedTreesOnGlobe() {
  if (!globe) return;
  const treePoints = state.plantedTrees.map(t => ({
    lat: t.lat, lng: t.lng, size: 0.3, color: t.color || '#2ECC71'
  }));
  globe
    .pointsData(treePoints)
    .pointLat('lat')
    .pointLng('lng')
    .pointRadius('size')
    .pointColor('color')
    .pointAltitude(0.01);
}

function plantTree(nearLat, nearLng, count) {
  count = count || 1;
  const colors = ['#2ECC71', '#27AE60', '#1ABC9C', '#16A085', '#4CAF50'];
  for (let i = 0; i < count; i++) {
    const tree = {
      lat: nearLat + (Math.random() - 0.5) * 5,
      lng: nearLng + (Math.random() - 0.5) * 5,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    state.plantedTrees.push(tree);
  }
  saveState();
  renderPlantedTreesOnGlobe();
}

/* ---------- Mission Card ---------- */
function openMissionCard(mission) {
  state.currentMission = mission;
  missionTitle.textContent = mission.title;
  missionDesc.textContent = mission.desc;
  if (missionLocation) missionLocation.textContent = `📍 ${mission.location}`;
  missionCost.textContent = `-${mission.costEnergy} energia`;
  missionReward.textContent = `+${mission.rewardCoins} moedas`;
  missionImpact.textContent = `−${mission.impactCO2} kg CO₂`;

  // Show mission photo
  if (missionPhoto && mission.photo) {
    missionPhoto.src = mission.photo;
    missionPhoto.style.display = '';
  }

  const gameConfig = MINIGAME_CONFIG[mission.minigame];
  if (gameConfig && missionGame) {
    missionGame.textContent = `🎮 Mini-game: ${gameConfig.name}`;
    missionGame.style.display = '';
  }

  btnStartMission.disabled = state.energy < mission.costEnergy;
  btnStartMission.textContent = state.energy < mission.costEnergy ? 'Energia insuficiente' : 'Iniciar Missão';
  openModal('modal-mission');
}

/* ---------- Start Mission ---------- */
if (btnStartMission) {
  btnStartMission.addEventListener('click', () => {
    if (!state.currentMission) return;
    const m = state.currentMission;
    if (state.energy < m.costEnergy) { showToast('Energia insuficiente! Use o Pomodoro.', 'info'); return; }
    state.energy -= m.costEnergy;
    updateHUD();
    closeModal('modal-mission');
    if (m.minigame) {
      MiniGames.open(m.minigame, (success, perfect) => {
        if (success) {
          completeMission(m, perfect);
        } else {
          state.energy += m.costEnergy;
          updateHUD(); saveState();
          showToast('Missão falhou. Energia devolvida. Tente novamente!', 'info');
        }
      });
    } else {
      completeMission(m, false);
    }
  });
}

function completeMission(mission, perfect) {
  state.coins += mission.rewardCoins;
  state.impact += mission.impactCO2;
  state.completed.push(mission.id);
  if (perfect) state.perfectMinigames++;
  saveState(); updateHUD(); celebrate();

  // Show completion photo modal
  showCompletionPhoto(mission);

  // Plant trees near the mission location
  const treeCount = perfect ? 3 : 2;
  setTimeout(() => {
    plantTree(mission.lat, mission.lng, treeCount);
    showToast(`🌳 +${treeCount} árvores plantadas em ${mission.location}!`, 'success');
  }, 3500);

  showToast(`✦ Missão "${mission.title}" completa!`, 'success');
  setTimeout(() => showToast(`+${mission.rewardCoins} moedas  •  −${mission.impactCO2} kg CO₂`, 'reward'), 700);

  if (state.completed.length === MISSIONS.length) {
    setTimeout(() => showToast('🌍 Parabéns! Você protegeu ecossistemas ao redor do mundo!', 'success'), 4500);
  }

  refreshGlobeMarkers();
  const next = MISSIONS.find(m => getNodeState(m) === 'available');
  if (next) setTimeout(() => flyToMission(next), 5000);
  exportCheckAchievements();
}

/* ---------- Completion Photo Modal ---------- */
function showCompletionPhoto(mission) {
  if (!mission.photo) return;
  const overlay = document.createElement('div');
  overlay.className = 'completion-overlay';
  overlay.innerHTML = `
    <div class="completion-card">
      <div class="completion-img-wrap">
        <img src="${mission.photo}" alt="${mission.location}" class="completion-img"/>
        <div class="completion-badge">✅ MISSÃO COMPLETA</div>
      </div>
      <div class="completion-info">
        <h3>🌍 ${mission.title}</h3>
        <p class="completion-loc">📍 ${mission.location}</p>
        <p class="completion-impact">−${mission.impactCO2} kg CO₂ evitados</p>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('active'));
  setTimeout(() => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 600);
  }, 4000);
  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    setTimeout(() => overlay.remove(), 600);
  });
}

/* ---------- Pomodoro Integration ---------- */
export function addReward(energy, coins) {
  state.energy += energy;
  state.coins += coins;
  saveState(); updateHUD();
}

export function onPomodoroComplete(streak) {
  state.pomodorosCompleted++;
  if (streak > state.bestStreak) state.bestStreak = streak;
  saveState(); exportCheckAchievements();
  // Plant a tree at a random location in a important biome
  const biomes = [
    { lat: -3.47, lng: -62.22 }, { lat: -0.79, lng: 23.66 },
    { lat: -22.95, lng: -43.21 }, { lat: 1.82, lng: 109.98 },
    { lat: -18.77, lng: 46.87 }, { lat: -19.09, lng: -57.65 },
    { lat: -18.29, lng: 147.70 }
  ];
  const biome = biomes[Math.floor(Math.random() * biomes.length)];
  plantTree(biome.lat, biome.lng, 1);
  showToast('🌳 Uma nova árvore foi plantada no planeta!', 'success');
}

/* ---------- Achievement Integration ---------- */
export function exportCheckAchievements() {
  const newUnlocks = AchievementSystem.check(state);
  newUnlocks.forEach((a) => {
    state.achievements.push(a.id);
    AchievementSystem.showUnlockNotification(a);
  });
  if (newUnlocks.length > 0) saveState();
}

/* ---------- Celebration ---------- */
const celebParticles = [];
function celebrate() {
  if (!celebOverlay) return;
  celebOverlay.classList.add('active');
  setTimeout(() => celebOverlay.classList.remove('active'), 800);
  for (let i = 0; i < 24; i++) {
    celebParticles.push({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 250,
      y: window.innerHeight / 2 + (Math.random() - 0.5) * 120,
      vx: (Math.random() - 0.5) * 7, vy: -2.5 - Math.random() * 5,
      size: 3 + Math.random() * 6,
      color: ['#F1C40F','#2ECC71','#FFD700','#26C6DA','#FF9E3D','#E91E63'][Math.floor(Math.random()*6)],
      life: 1.0, decay: 0.01 + Math.random() * 0.008
    });
  }
}

/* ---------- Particles ---------- */
function resizeCanvas() {
  if (!particleCanvas || !ctx) return;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}

let running = false;
function renderParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  for (let i = celebParticles.length - 1; i >= 0; i--) {
    const p = celebParticles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= p.decay;
    if (p.life <= 0) { celebParticles.splice(i, 1); continue; }
    ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill(); ctx.restore();
  }
}

function gameLoop() {
  if (!running) return;
  renderParticles();
  requestAnimationFrame(gameLoop);
}

/* ---------- Loading ---------- */
let tipInterval = null, tipIndex = 0;
function showTip() {
  if (!tipEl) return;
  tipEl.textContent = TIPS[tipIndex % TIPS.length];
  tipEl.style.animation = 'none'; void tipEl.offsetWidth;
  tipEl.style.animation = 'tipFade 2.5s ease-in-out'; tipIndex++;
}

async function loadAssets() {
  showTip(); tipInterval = setInterval(showTip, 2500);
  let loaded = 0; const total = ASSET_LIST.length;
  const promises = ASSET_LIST.map((url) =>
    fetch(url).then((r) => { if (!r.ok) throw new Error(); return r.blob(); })
      .then(() => { loaded++; const pct = Math.round((loaded / total) * 100);
        if (progressFill) progressFill.style.width = pct + '%'; 
        if (progressText) progressText.textContent = pct + '%'; })
      .catch(() => { loaded++; const pct = Math.round((loaded / total) * 100);
        if (progressFill) progressFill.style.width = pct + '%'; 
        if (progressText) progressText.textContent = pct + '%'; })
  );
  await Promise.all(promises);
  clearInterval(tipInterval); 
  if (progressText) progressText.textContent = '100%'; 
  if (progressFill) progressFill.style.width = '100%';
  if (tipEl) {
    tipEl.style.animation = 'none'; tipEl.textContent = '';
    const completeEl = document.createElement('span');
    completeEl.className = 'loading-complete-text'; completeEl.textContent = '✦ PRONTO ✦';
    tipEl.parentElement.appendChild(completeEl);
  }
  await delay(1200); 
  if (loadScreen) loadScreen.classList.add('fade-out'); 
  if (gameContainer) gameContainer.classList.add('visible');
  await delay(900); 
  if (loadScreen) loadScreen.style.display = 'none'; 
  startGame();
}

function startGame() {
  loadState();
  AchievementSystem.init(state.achievements);
  Pomodoro.init();
  syncHUDImmediate();
  resizeCanvas();
  initGlobe();
  running = true;
  requestAnimationFrame(gameLoop);
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

// Initialize
loadAssets();
