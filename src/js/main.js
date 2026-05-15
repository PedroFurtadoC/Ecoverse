import '../css/main.css';
import { MISSIONS, TIPS, ASSET_LIST, POMODORO_CONFIG, TEAM } from './config/data.js';
import { state, saveState, loadState } from './store/state.js';
import { on, EVENTS } from './store/events.js';
import { Pomodoro } from './modules/pomodoro.js';
import { MiniGames } from './modules/minigames.js';
import { QuizODS } from './modules/quizzes.js';
import { AchievementSystem } from './modules/achievements.js';
import * as Auth from './services/auth.js';
import * as Sync from './services/sync.js';
import * as AuthUI from './modules/auth-ui.js';

// Modo de teste — `?dev=free` na URL destrava tudo pra revisar o jogo:
// todas as missões liberadas, sem custo de energia, sem persistir progresso
// (nenhuma jogada credita conquistas ou marca missão como concluída).
// Ex.: http://localhost:3000/?dev=free
const DEV_FREE = new URLSearchParams(location.search).get('dev') === 'free';
if (DEV_FREE) console.info('[ecoverse] modo dev: tudo liberado, progresso não é salvo');

// Refs do DOM
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const loadScreen     = $('#loading-screen');
const progressRing   = $('#progress-ring-fill');
const progressText   = $('#progress-text');
const RING_CIRCUMFERENCE = 326.73; // 2π × r(52)
const setProgress = (pct) => {
  if (progressRing) progressRing.style.strokeDashoffset = RING_CIRCUMFERENCE * (1 - pct / 100);
  if (progressText) progressText.textContent = pct + '%';
};
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

// HUD animado (energia, moedas, impacto)
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

function showToast(msg, type = 'info') {
  if (!toastContainer) return;
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  toastContainer.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 450); }, 3200);
}

// Modais
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

// Easter egg: digitar "ECO" fora de um input abre um minigame escondido.
// Está disponível desde o primeiro boot — sem pré-requisito. O timer entre
// teclas é generoso pra cobrir digitação tranquila.
let eggSeq = '';
let eggResetTimer = null;
document.addEventListener('keydown', (e) => {
  const tag = (e.target?.tagName || '').toLowerCase();
  if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
  if (e.ctrlKey || e.altKey || e.metaKey) return;
  if (document.getElementById('minigame-container')?.classList.contains('active')) return;
  if (!/^[a-z]$/i.test(e.key)) return;

  eggSeq = (eggSeq + e.key.toLowerCase()).slice(-3);
  clearTimeout(eggResetTimer);
  eggResetTimer = setTimeout(() => { eggSeq = ''; }, 2000);

  if (eggSeq === 'eco') {
    eggSeq = '';
    openEasterEgg();
  }
});

// Trigger touch do easter egg: 3 cliques/toques rápidos no contador de missões.
// Cobre celular e tablet onde não há teclado físico.
let eggTapCount = 0;
let eggTapTimer = null;
const hudProgressEl = $('.hud-progress');
if (hudProgressEl) {
  hudProgressEl.style.cursor = 'pointer';
  hudProgressEl.addEventListener('click', () => {
    if (document.getElementById('minigame-container')?.classList.contains('active')) return;
    eggTapCount++;
    clearTimeout(eggTapTimer);
    eggTapTimer = setTimeout(() => { eggTapCount = 0; }, 800);
    if (eggTapCount >= 3) {
      eggTapCount = 0;
      openEasterEgg();
    }
  });
}

function openEasterEgg() {
  // Fecha qualquer modal aberto pra não ficar empilhado por cima.
  $$('.modal-overlay.active').forEach((m) => m.classList.remove('active'));
  showToast('🥚 Easter egg encontrado! Triagem relâmpago.', 'success');
  MiniGames.open('egg_triagem', (success) => {
    if (success && !state.eggCompleted) {
      // Em dev mode, o easter egg roda só como teste — não credita conquista.
      if (DEV_FREE) {
        showToast('Easter egg testado em dev. Nada foi salvo.', 'success');
        return;
      }
      state.eggCompleted = true;
      persist();
      checkAchievements();
      showToast('Conquista desbloqueada: Caçador de Easter Egg', 'reward');
    } else if (!success) {
      showToast('Quase! Tente "ECO" de novo pra repetir.', 'info');
    }
  });
}

if ($('#btn-menu')) $('#btn-menu').addEventListener('click', () => openModal('modal-menu'));
if ($('#btn-donate')) $('#btn-donate').addEventListener('click', () => openModal('modal-donate'));
if ($('#btn-pomodoro')) $('#btn-pomodoro').addEventListener('click', () => openModal('modal-pomodoro'));
if ($('#btn-achievements')) $('#btn-achievements').addEventListener('click', () => {
  AchievementSystem.renderGallery();
  openModal('modal-achievements');
});
$$('.donate-option').forEach((btn) => {
  btn.addEventListener('click', () => {
    showToast('Obrigado pelo gesto! Esta versão é demonstrativa.', 'info');
    closeModal('modal-donate');
  });
});

// Atalho do Menu: itens com data-menu-action abrem outros modais ou
// disparam ações de conta. O timeout de 220ms acompanha a animação
// de fechamento do menu pra não cortar o frame.
$$('[data-menu-action]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.menuAction;
    // Privacy/terms podem ser abertos de dentro do próprio modal-auth
    // (links na checkbox de consentimento) — nesses casos não há menu aberto.
    closeModal('modal-menu');
    const open = (id) => setTimeout(() => openModal(id), 220);
    if (action === 'donate')      open('modal-donate');
    if (action === 'about')       setTimeout(() => { renderTeam(); openModal('modal-about'); }, 220);
    if (action === 'auth')        open('modal-auth');
    if (action === 'leaderboard') setTimeout(() => AuthUI.openLeaderboard(), 220);
    if (action === 'privacy')     open('modal-privacy');
    if (action === 'terms')       open('modal-terms');
    if (action === 'signout')      AuthUI.signOut();
    if (action === 'export')       AuthUI.exportData();
    if (action === 'delete')       AuthUI.deleteAccount();
    if (action === 'edit-nickname') AuthUI.editNickname();
  });
});

// Inicializa a UI de auth depois que os listeners do menu já estão registrados.
AuthUI.init({
  showToast,
  openModal,
  closeModal,
  buildExportPayload: () => ({
    energy: state.energy,
    coins: state.coins,
    impact: state.impact,
    completed: state.completed,
    achievements: state.achievements,
    planted_trees: state.plantedTrees,
    pomodoros_completed: state.pomodorosCompleted,
    best_streak: state.bestStreak,
    perfect_minigames: state.perfectMinigames,
    last_saved_at: state.lastSavedAt ?? null
  })
});

// Preenche o grid de devs do modal "Sobre". A primeira card é destacada
// como lead pra dar protagonismo a quem liderou tecnicamente o projeto.
// Links (github/linkedin/portfolio) só aparecem se preenchidos em data.js.
function renderTeam() {
  const grid = $('#about-team-grid');
  if (!grid) return;
  const safe = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ICON = {
    github: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.05c-3.2.7-3.87-1.37-3.87-1.37-.52-1.34-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.74-1.55-2.56-.29-5.25-1.28-5.25-5.71 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.44-2.7 5.41-5.27 5.7.41.35.78 1.05.78 2.11v3.13c0 .31.21.67.79.55C20.21 21.38 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.73v20.54C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .78 23.2 0 22.22 0z"/></svg>',
    portfolio: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 0a14.5 14.5 0 0 1 0 20m0-20a14.5 14.5 0 0 0 0 20M2 12h20"/></svg>'
  };

  const linkBtn = (kind, url, label) => url
    ? `<a class="team-card__link" href="${safe(url)}" target="_blank" rel="noopener" aria-label="${label}">${ICON[kind]}</a>`
    : '';

  grid.innerHTML = TEAM.map((m, i) => `
    <article class="team-card${i === 0 ? ' team-card--lead' : ''}">
      <img class="team-card__avatar" src="${safe(m.photo)}" alt="Foto de ${safe(m.name)}" loading="lazy" />
      <div class="team-card__info">
        <h4 class="team-card__name">${safe(m.name)}</h4>
        <p class="team-card__role">${safe(m.role)}</p>
        <div class="team-card__links">
          ${linkBtn('github', m.github, `GitHub de ${safe(m.name)}`)}
          ${linkBtn('linkedin', m.linkedin, `LinkedIn de ${safe(m.name)}`)}
          ${linkBtn('portfolio', m.portfolio, `Portfólio de ${safe(m.name)}`)}
        </div>
      </div>
    </article>
  `).join('');
}
const btnQuiz = $('#btn-quiz-ods');
if (btnQuiz) btnQuiz.addEventListener('click', () => {
  QuizODS.open();
});

// Estado de cada nó da trilha (bloqueado, disponível, completo)
function getNodeState(mission) {
  if (state.completed.includes(mission.id)) return 'complete';
  if (DEV_FREE) return 'available';
  if (mission.prereqId === null || state.completed.includes(mission.prereqId)) return 'available';
  return 'locked';
}

// Setup do globo (Globe.GL + Three.js)
// Pré-carrega o módulo Globe.GL em paralelo com a tela de carregamento.
const globePromise = import('globe.gl');

async function initGlobe() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  const { default: Globe } = await globePromise;

  globe = new Globe(globeWrapper)
    .globeImageUrl('assets/earth-texture.jpg')
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
          setTimeout(() => openMissionCard(d.mission), 1200);
        });
        el.style.cursor = 'pointer';
      }

      return el;
    });

  // Auto-rotate respeitando preferência de movimento reduzido.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  globe.controls().autoRotate = !prefersReducedMotion;
  globe.controls().autoRotateSpeed = 0.5;
  globe.controls().enableDamping = true;
  globe.controls().dampingFactor = 0.1;

  // Offset visual do canvas pra dar respiro ao HUD fixo no topo.
  const renderer = globe.renderer();
  if (renderer && renderer.domElement) {
    renderer.domElement.style.marginTop = 'calc(env(safe-area-inset-top, 0px) + clamp(1rem, 4vh, 2rem))';
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
    .arcDashAnimateTime(prefersReducedMotion ? 0 : 3000);

  // Plota as árvores já plantadas como pontos no globo
  renderPlantedTreesOnGlobe();

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
  // Reconstrói os arcos entre missões adjacentes
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

// Árvores plantadas no globo (pontos verdes acumulados a cada missão)
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
  persist();
  renderPlantedTreesOnGlobe();
}

// Card da missão (modal que abre ao clicar num marcador)
function openMissionCard(mission) {
  state.currentMission = mission;
  const isReplay = state.completed.includes(mission.id);
  // Em dev, qualquer jogada é "treino": não cobra energia nem credita progresso.
  const isPractice = isReplay || DEV_FREE;

  missionTitle.textContent = mission.title;
  missionDesc.textContent = mission.desc;
  if (missionLocation) missionLocation.textContent = `📍 ${mission.location}`;

  if (isPractice) {
    missionCost.textContent = DEV_FREE && !isReplay ? 'Grátis (modo dev)' : 'Grátis (já completada)';
    missionReward.textContent = 'Sem nova recompensa';
    missionImpact.textContent = 'Modo treino';
  } else {
    missionCost.textContent = `-${mission.costEnergy} energia`;
    missionReward.textContent = `+${mission.rewardCoins} moedas`;
    missionImpact.textContent = `−${mission.impactCO2} kg CO₂`;
  }

  if (missionPhoto && mission.photo) {
    missionPhoto.src = mission.photo;
    missionPhoto.style.display = '';
  }

  if (mission.minigame && missionGame) {
    missionGame.textContent = `🎮 Mini-game disponível`;
    missionGame.style.display = '';
  }

  const podeIniciar = isPractice || state.energy >= mission.costEnergy;
  btnStartMission.disabled = !podeIniciar;
  btnStartMission.textContent = isReplay
    ? 'Jogar novamente'
    : (DEV_FREE ? 'Testar missão' : (podeIniciar ? 'Iniciar Missão' : 'Energia insuficiente'));
  openModal('modal-mission');
}

// Botão "Iniciar missão" / "Jogar novamente"
if (btnStartMission) {
  btnStartMission.addEventListener('click', () => {
    if (!state.currentMission) return;
    const m = state.currentMission;
    const isReplay = state.completed.includes(m.id);
    const isPractice = isReplay || DEV_FREE;
    const willCharge = !isPractice;

    if (willCharge && state.energy < m.costEnergy) {
      showToast('Energia insuficiente! Use o Pomodoro.', 'info');
      return;
    }
    if (willCharge) state.energy -= m.costEnergy;
    updateHUD();
    closeModal('modal-mission');

    if (m.minigame) {
      MiniGames.open(m.minigame, (success, perfect) => {
        if (isPractice) {
          // Treino (replay ou dev mode): nenhum efeito no save, só feedback.
          if (success) {
            const msg = DEV_FREE && !isReplay
              ? 'Teste concluído. Nada foi salvo.'
              : (perfect ? 'Mandou bem! Pontuação máxima de novo.' : 'Missão revisitada. Boa prática!');
            showToast(msg, 'success');
          }
          return;
        }
        if (success) {
          completeMission(m, perfect);
        } else {
          if (willCharge) state.energy += m.costEnergy;
          updateHUD(); persist();
          showToast('Missão falhou. Energia devolvida. Tente novamente!', 'info');
        }
      });
    } else if (!isPractice) {
      completeMission(m, false);
    }
  });
}

function completeMission(mission, perfect) {
  state.coins += mission.rewardCoins;
  state.impact += mission.impactCO2;
  state.completed.push(mission.id);
  if (perfect) state.perfectMinigames++;
  persist(); updateHUD(); celebrate();

  // Show completion photo modal
  showCompletionPhoto(mission);

  // Plant trees near the mission location
  const treeCount = perfect ? 3 : 2;
  setTimeout(() => {
    plantTree(mission.lat, mission.lng, treeCount);
    showToast(`🌳 +${treeCount} árvores plantadas em ${mission.location}!`, 'success');
  }, 3500);

  showToast(`Missão "${mission.title}" completa!`, 'success');
  setTimeout(() => showToast(`+${mission.rewardCoins} moedas  •  −${mission.impactCO2} kg CO₂`, 'reward'), 700);

  if (state.completed.length === MISSIONS.length) {
    setTimeout(() => showToast('Você combateu resíduos em 8 biomas. Parabéns!', 'success'), 4500);
  }

  refreshGlobeMarkers();
  const next = MISSIONS.find(m => getNodeState(m) === 'available');
  if (next) setTimeout(() => flyToMission(next), 5000);
  checkAchievements();
}

// Overlay com a foto do bioma após missão completa
function showCompletionPhoto(mission) {
  if (!mission.photo) return;
  const overlay = document.createElement('div');
  overlay.className = 'completion-overlay';
  overlay.innerHTML = `
    <div class="completion-card">
      <div class="completion-img-wrap">
        <img src="${mission.photo}" alt="${mission.location}" class="completion-img"/>
        <div class="completion-badge">Missão completa</div>
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

function addReward(energy, coins) {
  state.energy += energy;
  state.coins += coins;
  persist(); updateHUD();
}

// Centraliza saveState + sync na nuvem. Antes vários caminhos chamavam
// só saveState() e o Supabase ficava sem receber o progresso (missão
// concluída, conquistas, árvores plantadas). Sempre que mutamos state,
// passamos por aqui — debounce de 2s no Sync agrupa as mutações.
function persist() {
  saveState();
  Sync.scheduleSync();
}

function onPomodoroComplete(streak) {
  state.pomodorosCompleted++;
  if (streak > state.bestStreak) state.bestStreak = streak;
  persist(); checkAchievements();
  const biome = MISSIONS[Math.floor(Math.random() * MISSIONS.length)];
  plantTree(biome.lat, biome.lng, 1);
  showToast('🌳 Uma nova árvore foi plantada no planeta!', 'success');
}

function checkAchievements() {
  const newUnlocks = AchievementSystem.check(state);
  newUnlocks.forEach((a) => {
    if (!state.achievements.includes(a.id)) state.achievements.push(a.id);
    AchievementSystem.showUnlockNotification(a);
  });
  if (newUnlocks.length > 0) persist();
}

on(EVENTS.REWARD, ({ energy = 0, coins = 0 }) => { addReward(energy, coins); Sync.scheduleSync(); });
on(EVENTS.TOAST, ({ message, type = 'info' }) => showToast(message, type));
on(EVENTS.POMODORO_COMPLETE, ({ streak, taskName }) => {
  onPomodoroComplete(streak);
  Sync.recordPomodoro({ durationSeconds: POMODORO_CONFIG.workDuration, taskName });
  Sync.scheduleSync();
});
on(EVENTS.ACHIEVEMENT_CHECK, () => checkAchievements());

// Animação de confete ao completar missão
const celebParticles = [];
function celebrate() {
  if (!celebOverlay) return;
  celebOverlay.classList.add('active');
  setTimeout(() => celebOverlay.classList.remove('active'), 800);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

// Sistema de partículas (fundo decorativo do globo)
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

// Tela de loading (anel SVG + tip educativa)
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
  const tick = () => { loaded++; setProgress(Math.round((loaded / total) * 100)); };
  // Pré-carga via Image() — entra no cache HTTP normal e os <img> reusam sem refetch.
  const promises = ASSET_LIST.map((url) => new Promise((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => { tick(); resolve(); };
    img.src = url;
  }));
  await Promise.all(promises);
  clearInterval(tipInterval);
  setProgress(100);
  if (tipEl) {
    tipEl.style.animation = 'none'; tipEl.textContent = '';
    const completeEl = document.createElement('span');
    completeEl.className = 'loading-complete-text'; completeEl.textContent = 'Pronto';
    tipEl.parentElement.appendChild(completeEl);
  }
  await delay(1200); 
  if (loadScreen) loadScreen.classList.add('fade-out'); 
  if (gameContainer) gameContainer.classList.add('visible');
  await delay(900);
  if (loadScreen) loadScreen.style.display = 'none';
  await startGame();
}

// Considera "progresso real" qualquer coisa que indique que o jogador
// realmente avançou — moedas, missão concluída, pomodoro, conquista ou
// quiz feito. Usado pra decidir quem vence no merge nuvem ↔ local.
function hasMeaningfulProgress(s) {
  if (!s) return false;
  return (s.coins ?? 0) > 0
      || (s.completed?.length ?? 0) > 0
      || (s.pomodoros_completed ?? s.pomodorosCompleted ?? 0) > 0
      || (s.achievements?.length ?? 0) > 0
      || Object.keys(s.quizzes ?? {}).length > 0;
}

async function startGame() {
  loadState();
  AchievementSystem.init(state.achievements);
  QuizODS.init({ onChange: persist });
  Pomodoro.init();
  syncHUDImmediate();
  resizeCanvas();
  Auth.init().then(async (user) => {
    if (!user) return;
    const cloudState = await Sync.pullState();
    if (!cloudState) {
      // Sem linha na nuvem ainda — manda o local pra cima.
      Sync.scheduleSync();
      return;
    }

    const cloudIsNewer = new Date(cloudState.updated_at) > new Date(state.lastSavedAt ?? 0);
    const cloudHasProgress = hasMeaningfulProgress(cloudState);
    const localHasProgress = hasMeaningfulProgress(state);

    // Adota a nuvem quando ela tem mais coisa que o local OU é genuinamente
    // mais recente E tem algum progresso. Se o local tem progresso e a nuvem
    // está zerada (caso típico do primeiro signup após jogar anônimo),
    // preserva o local e manda pra cima.
    const adoptCloud = cloudHasProgress && (!localHasProgress || cloudIsNewer);

    if (adoptCloud) {
      state.energy = cloudState.energy ?? state.energy;
      state.coins = cloudState.coins ?? state.coins;
      state.impact = Number(cloudState.impact ?? state.impact);
      state.completed = cloudState.completed ?? state.completed;
      state.achievements = cloudState.achievements ?? state.achievements;
      state.plantedTrees = cloudState.planted_trees ?? state.plantedTrees;
      state.pomodorosCompleted = cloudState.pomodoros_completed ?? state.pomodorosCompleted;
      state.bestStreak = cloudState.best_streak ?? state.bestStreak;
      state.perfectMinigames = cloudState.perfect_minigames ?? state.perfectMinigames;
      state.quizzes = cloudState.quizzes ?? state.quizzes ?? {};
      AchievementSystem.init(state.achievements);
      saveState();
      syncHUDImmediate();
      refreshGlobeMarkers();
    } else {
      Sync.scheduleSync();
    }
  });
  await initGlobe();
  running = true;
  requestAnimationFrame(gameLoop);
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => { /* ignore */ });
  });
}

loadAssets();
