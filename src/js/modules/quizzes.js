import { QUIZ_ODS_DATA } from '../config/data.js';
import { state, saveState } from '../store/state.js';
import { emit, EVENTS } from '../store/events.js';

let container, gallery, headerCount, headerPhase, closeBtn, playerEl;

// Callback opcional injetado pelo main.js: quando o usuario conclui um quiz
// e mexemos em state.quizzes, queremos disparar tambem o sync na nuvem.
// O main.js passa a sua funcao persist() aqui no init pra evitar dependencia
// circular entre quizzes.js e services/sync.js.
let onChange = () => {};

function initDOM() {
  if (container) return;
  container   = document.getElementById('quiz-ods-container');
  gallery     = document.getElementById('quiz-ods-gallery');
  headerCount = document.getElementById('quiz-ods-count');
  headerPhase = document.getElementById('quiz-ods-phase');
  closeBtn    = document.getElementById('quiz-ods-close');
  playerEl    = document.getElementById('quiz-ods-player');

  if (closeBtn) closeBtn.addEventListener('click', closeQuizGallery);
}

function getCompletedMissions() {
  return state.completed.length;
}

function getCurrentPhase() {
  const missions = getCompletedMissions();
  if (missions >= 5) return 3;
  if (missions >= 3) return 2;
  if (missions >= 1) return 1;
  return 0;
}

function getOdsState(ods) {
  const phase = getCurrentPhase();
  if (phase < ods.unlockPhase) return 'locked';
  const done = state.quizzes?.[ods.id];
  if (done) return done.perfect ? 'perfect' : 'completed';
  return 'available';
}

// Inicialização do módulo. main.js passa a callback de persistência (saveState
// local + scheduleSync na nuvem) pra ser chamada sempre que state.quizzes muda.
export function init({ onChange: handler } = {}) {
  if (typeof handler === 'function') onChange = handler;
}

export function openQuizGallery() {
  initDOM();
  renderGallery();
  if (container) {
    container.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

export function closeQuizGallery() {
  if (container) container.classList.remove('active');
  if (playerEl) playerEl.classList.remove('active');
  document.body.style.overflow = '';
}

export function renderGallery() {
  if (!gallery) return;
  gallery.innerHTML = '';
  playerEl.classList.remove('active');

  const phase = getCurrentPhase();
  const completedCount = Object.keys(state.quizzes || {}).length;

  if (headerCount) headerCount.textContent = `${completedCount}/17`;
  if (headerPhase) {
    const phaseLabels = ['🔒 Nenhuma fase desbloqueada', '🌱 Fase 1 — Fundamentos', '🌿 Fase 2 — Crescimento', '🌳 Fase 3 — Completo'];
    headerPhase.textContent = phaseLabels[phase];
  }

  const phases = [
    { phase: 1, label: 'FASE 1 — Fundamentos', sublabel: 'Complete 1 missão para desbloquear', ids: [1,2,3,4,5,6] },
    { phase: 2, label: 'FASE 2 — Crescimento', sublabel: 'Complete 3 missões para desbloquear', ids: [7,8,9,10,11,12] },
    { phase: 3, label: 'FASE 3 — Transformação', sublabel: 'Complete 5 missões para desbloquear', ids: [13,14,15,16,17] }
  ];

  phases.forEach(ph => {
    const sectionEl = document.createElement('div');
    sectionEl.className = 'quiz-ods-section';

    const isUnlocked = phase >= ph.phase;
    const phaseEl = document.createElement('div');
    phaseEl.className = `quiz-ods-phase-header ${isUnlocked ? 'unlocked' : 'locked'}`;
    phaseEl.innerHTML = `
      <div class="qoph-icon">${isUnlocked ? '🔓' : '🔒'}</div>
      <div class="qoph-text">
        <span class="qoph-label">${ph.label}</span>
        <span class="qoph-sub">${isUnlocked ? 'Desbloqueado!' : ph.sublabel}</span>
      </div>
    `;
    sectionEl.appendChild(phaseEl);

    const gridEl = document.createElement('div');
    gridEl.className = 'quiz-ods-grid';

    ph.ids.forEach(odsId => {
      const ods = QUIZ_ODS_DATA.find(o => o.id === odsId);
      if (!ods) return;
      const state = getOdsState(ods);
      const card = createOdsCard(ods, state);
      gridEl.appendChild(card);
    });

    sectionEl.appendChild(gridEl);
    gallery.appendChild(sectionEl);
  });
}

// Recebe o estado visual do card como `cardState` pra evitar sombrear o
// `state` importado da store — antes esse shadow fazia state.quizzes virar
// undefined dentro desta função e o score não renderizava.
function createOdsCard(ods, cardState) {
  const card = document.createElement('div');
  card.className = `quiz-ods-card ${cardState}`;
  card.style.setProperty('--ods-color', ods.color);

  const starsHtml = getStarsHtml(ods);
  const completionData = state.quizzes?.[ods.id];
  const scoreText = completionData ? `${completionData.score}/5` : '';

  card.innerHTML = `
    <div class="qoc-glow"></div>
    <div class="qoc-number">ODS ${ods.id}</div>
    <div class="qoc-icon">${cardState === 'locked' ? '🔒' : ods.icon}</div>
    <div class="qoc-title">${ods.title}</div>
    <div class="qoc-desc">${cardState === 'locked' ? 'Bloqueado' : ods.desc}</div>
    <div class="qoc-stars">${starsHtml}</div>
    <div class="qoc-score">${scoreText}</div>
    ${cardState === 'completed' || cardState === 'perfect' ? '<div class="qoc-badge">' + (cardState === 'perfect' ? '⭐' : '✅') + '</div>' : ''}
    ${cardState === 'available' ? '<div class="qoc-play">▶ Jogar</div>' : ''}
    ${cardState === 'completed' ? '<div class="qoc-play qoc-replay">↻ Jogar novamente</div>' : ''}
  `;

  if (cardState === 'available' || cardState === 'completed') {
    card.addEventListener('click', () => startQuiz(ods));
    card.style.cursor = 'pointer';
  } else if (cardState === 'locked') {
    card.addEventListener('click', () => {
      card.classList.add('shake');
      setTimeout(() => card.classList.remove('shake'), 600);
    });
  }

  return card;
}

function getStarsHtml(ods) {
  const data = state.quizzes?.[ods.id];
  if (!data) return '<span class="qoc-star empty">☆</span><span class="qoc-star empty">☆</span><span class="qoc-star empty">☆</span>';
  const stars = data.perfect ? 3 : data.score >= 3 ? 2 : 1;
  let html = '';
  for (let i = 0; i < 3; i++) {
    html += i < stars ? '<span class="qoc-star filled">★</span>' : '<span class="qoc-star empty">☆</span>';
  }
  return html;
}

function startQuiz(ods) {
  if (!playerEl) return;
  playerEl.classList.add('active');

  const questions = [...ods.questions];
  shuffle(questions);

  let currentIdx = 0;
  let correctCount = 0;
  let timeLeft = 15;
  let questionTimer = null;

  playerEl.innerHTML = `
    <div class="qop-container" style="--ods-color: ${ods.color}">
      <div class="qop-header">
        <button class="qop-back" id="qop-back">← Voltar</button>
        <div class="qop-ods-badge" style="background: ${ods.color}">${ods.icon} ODS ${ods.id}</div>
        <div class="qop-title">${ods.title}</div>
      </div>
      <div class="qop-progress-bar">
        <div class="qop-progress-fill" id="qop-progress-fill" style="width: 0%"></div>
      </div>
      <div class="qop-timer-wrap">
        <div class="qop-timer-bar">
          <div class="qop-timer-fill" id="qop-timer-fill" style="width: 100%"></div>
        </div>
        <span class="qop-timer-text" id="qop-timer-text">15s</span>
      </div>
      <div class="qop-question-num" id="qop-qnum">Pergunta 1 de 5</div>
      <p class="qop-question" id="qop-question"></p>
      <div class="qop-options" id="qop-options"></div>
      <div class="qop-dots" id="qop-dots"></div>
    </div>
    <div class="qop-result" id="qop-result" style="display:none">
      <div class="qop-result-card" style="--ods-color: ${ods.color}">
        <div class="qop-result-icon" id="qop-result-icon"></div>
        <h3 class="qop-result-title" id="qop-result-title"></h3>
        <p class="qop-result-score" id="qop-result-score"></p>
        <div class="qop-result-stars" id="qop-result-stars"></div>
        <div class="qop-result-reward" id="qop-result-reward"></div>
        <button class="qop-result-btn" id="qop-result-btn">Continuar</button>
      </div>
    </div>
  `;

  const backBtn      = playerEl.querySelector('#qop-back');
  const questionEl   = playerEl.querySelector('#qop-question');
  const optionsEl    = playerEl.querySelector('#qop-options');
  const dotsEl       = playerEl.querySelector('#qop-dots');
  const qnumEl       = playerEl.querySelector('#qop-qnum');
  const timerFill    = playerEl.querySelector('#qop-timer-fill');
  const timerText    = playerEl.querySelector('#qop-timer-text');
  const progressFill = playerEl.querySelector('#qop-progress-fill');
  const resultEl     = playerEl.querySelector('#qop-result');
  const resultIcon   = playerEl.querySelector('#qop-result-icon');
  const resultTitle  = playerEl.querySelector('#qop-result-title');
  const resultScore  = playerEl.querySelector('#qop-result-score');
  const resultStars  = playerEl.querySelector('#qop-result-stars');
  const resultReward = playerEl.querySelector('#qop-result-reward');
  const resultBtn    = playerEl.querySelector('#qop-result-btn');

  backBtn.addEventListener('click', () => {
    if (questionTimer) clearInterval(questionTimer);
    playerEl.classList.remove('active');
  });

  questions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'qop-dot';
    if (i === 0) dot.classList.add('current');
    dotsEl.appendChild(dot);
  });

  function showQuestion() {
    if (currentIdx >= questions.length) {
      showQuizResult(ods, correctCount);
      return;
    }

    const q = questions[currentIdx];
    questionEl.textContent = q.q;
    qnumEl.textContent = `Pergunta ${currentIdx + 1} de ${questions.length}`;
    optionsEl.innerHTML = '';
    timeLeft = 15;
    timerFill.style.width = '100%';
    timerFill.style.background = ods.color;
    timerText.textContent = '15s';
    progressFill.style.width = ((currentIdx / questions.length) * 100) + '%';

    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'qop-option';
      btn.innerHTML = `<span class="qop-opt-letter">${String.fromCharCode(65 + i)}</span><span class="qop-opt-text">${opt}</span>`;
      btn.addEventListener('click', () => onAnswer(i, btn, q));
      optionsEl.appendChild(btn);
    });

    if (questionTimer) clearInterval(questionTimer);
    questionTimer = setInterval(() => {
      timeLeft--;
      timerText.textContent = `${timeLeft}s`;
      timerFill.style.width = ((timeLeft / 15) * 100) + '%';
      if (timeLeft <= 5) timerFill.style.background = '#EF5350';
      if (timeLeft <= 0) {
        clearInterval(questionTimer);
        const btns = optionsEl.querySelectorAll('.qop-option');
        btns.forEach(b => b.classList.add('disabled'));
        btns[q.correct].classList.add('correct');
        dotsEl.children[currentIdx].classList.remove('current');
        dotsEl.children[currentIdx].classList.add('wrong');
        setTimeout(() => { currentIdx++; advanceDot(); showQuestion(); }, 1200);
      }
    }, 1000);
  }

  function onAnswer(idx, btn, q) {
    if (questionTimer) clearInterval(questionTimer);
    const btns = optionsEl.querySelectorAll('.qop-option');
    btns.forEach(b => b.classList.add('disabled'));

    if (idx === q.correct) {
      btn.classList.add('correct');
      correctCount++;
      dotsEl.children[currentIdx].classList.remove('current');
      dotsEl.children[currentIdx].classList.add('correct');
    } else {
      btn.classList.add('wrong');
      btns[q.correct].classList.add('correct');
      dotsEl.children[currentIdx].classList.remove('current');
      dotsEl.children[currentIdx].classList.add('wrong');
    }

    setTimeout(() => { currentIdx++; advanceDot(); showQuestion(); }, 1200);
  }

  function advanceDot() {
    if (currentIdx < questions.length) {
      dotsEl.children[currentIdx].classList.add('current');
    }
  }

  function showQuizResult(ods, score) {
    if (questionTimer) clearInterval(questionTimer);
    progressFill.style.width = '100%';

    const perfect = score === 5;
    const passed = score >= 3;
    const stars = perfect ? 3 : score >= 3 ? 2 : score >= 1 ? 1 : 0;

    // Anti-farming: só credita moedas quando o quiz é uma novidade ou um
    // upgrade real. Refazer um quiz com a mesma ou pior pontuação não dá
    // recompensa de novo — evita inflar o ranking da turma artificialmente.
    if (!state.quizzes) state.quizzes = {};
    const prev = state.quizzes[ods.id];
    const isFirstWin = passed && !prev;
    const isUpgrade  = passed && prev && score > prev.score;
    const reward = (isFirstWin || isUpgrade)
      ? (perfect ? ods.reward * 2 : ods.reward)
      : 0;

    resultEl.style.display = '';
    resultIcon.textContent = perfect ? '🏆' : passed ? '✅' : '❌';
    resultTitle.textContent = perfect ? 'PERFEITO!' : passed ? 'Quiz Completo!' : 'Tente novamente!';
    resultScore.textContent = `Você acertou ${score} de 5 perguntas`;

    let starsHtml = '';
    for (let i = 0; i < 3; i++) {
      starsHtml += `<span class="qop-result-star ${i < stars ? 'filled' : ''}" style="animation-delay: ${i * 0.2}s">${i < stars ? '★' : '☆'}</span>`;
    }
    resultStars.innerHTML = starsHtml;

    if (reward > 0) {
      resultReward.innerHTML = `<span class="qop-reward-coins">🪙 +${reward} moedas</span>`;
      emit(EVENTS.REWARD, { energy: 0, coins: reward });
    } else if (passed) {
      resultReward.innerHTML = '<span class="qop-reward-none">Você já tinha completado este quiz. Treino vale, mas não rende moedas de novo.</span>';
    } else {
      resultReward.innerHTML = '<span class="qop-reward-none">Acerte pelo menos 3 para ganhar recompensa!</span>';
    }

    if (passed) {
      const attempts = (prev?.attempts || 0) + 1;
      if (!prev || score > prev.score) {
        state.quizzes[ods.id] = { score, perfect, attempts };
      } else {
        state.quizzes[ods.id] = { ...prev, attempts };
      }
      onChange();
    }

    resultBtn.onclick = () => {
      resultEl.style.display = 'none';
      playerEl.classList.remove('active');
      renderGallery();
    };
  }

  showQuestion();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const QuizODS = { init, open: openQuizGallery, close: closeQuizGallery, renderGallery };
