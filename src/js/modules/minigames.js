import { MINIGAME_CONFIG } from '../config/data.js';

let callback = null;
let currentGame = null;
let timerInterval = null;

// DOM refs will be initialized on first open or exported init
let container, titleEl, descEl, timerEl, scoreEl, targetEl, gridEl, canvasEl, resultEl, resultTitle, resultScore, resultBtn;

function initDOM() {
  if (container) return;
  container = document.getElementById('minigame-container');
  titleEl   = document.getElementById('mg-title');
  descEl    = document.getElementById('mg-desc');
  timerEl   = document.getElementById('mg-timer');
  scoreEl   = document.getElementById('mg-score');
  targetEl  = document.getElementById('mg-target');
  gridEl    = document.getElementById('mg-grid');
  canvasEl  = document.getElementById('minigame-canvas');
  resultEl  = document.getElementById('mg-result');
  resultTitle = document.getElementById('mg-result-title');
  resultScore = document.getElementById('mg-result-score');
  resultBtn   = document.getElementById('mg-result-btn');
}

export function open(gameType, cb) {
  initDOM();
  callback = cb;
  currentGame = gameType;
  const config = MINIGAME_CONFIG[gameType];
  if (!config) { cb(true, false); return; }

  titleEl.textContent = config.name;
  descEl.textContent = config.desc;
  scoreEl.textContent = '0';
  resultEl.style.display = 'none';
  gridEl.innerHTML = '';
  gridEl.className = 'mg-grid';
  if (canvasEl) canvasEl.style.display = 'none';

  container.classList.add('active');

  switch (gameType) {
    case 'memory': startMemory(config); break;
    case 'quiz':   startQuiz(config);   break;
    case 'sorting': startSorting(config); break;
    default: cb(true, false); break;
  }
}

function closeGame(success, perfect) {
  container.classList.remove('active');
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  if (callback) callback(success, perfect);
  callback = null;
  currentGame = null;
}

function showResult(score, target, perfect) {
  const success = score >= target;
  resultEl.style.display = '';
  resultTitle.textContent = success
    ? (perfect ? '🌟 PERFEITO!' : '✅ Missão Completa!')
    : '❌ Não foi dessa vez...';
  resultScore.textContent = success
    ? `Você acertou ${score} — parabéns!`
    : `Você fez ${score}/${target}. Tente novamente!`;
  resultBtn.onclick = () => closeGame(success, perfect);
}

function startMemory(config) {
  const allIcons = [...config.icons];
  shuffle(allIcons);
  const selected = allIcons.slice(0, config.pairs);
  const cards = [];
  selected.forEach((icon, i) => {
    cards.push({ id: i, ...icon });
    cards.push({ id: i, ...icon });
  });
  shuffle(cards);

  let flipped = [];
  let matchedCount = 0;
  let moves = 0;
  let locked = false;

  timerEl.textContent = `Movimentos: 0/${config.maxMoves}`;
  targetEl.textContent = `Pares: 0/${config.pairs}`;
  scoreEl.textContent = '0';

  gridEl.innerHTML = '';
  gridEl.className = 'mg-grid memory-grid';
  gridEl.style.display = 'grid';

  cards.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = 'memory-card';
    el.dataset.index = idx;
    el.dataset.id = card.id;
    el.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-face memory-card-back">🌿</div>
        <div class="memory-card-face memory-card-front">
          <span class="mc-emoji">${card.emoji}</span>
          <span class="mc-name">${card.name}</span>
        </div>
      </div>
    `;
    el.addEventListener('click', () => onMemoryClick(el, idx));
    gridEl.appendChild(el);
  });

  function onMemoryClick(el, idx) {
    if (locked) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
    if (flipped.length >= 2) return;

    el.classList.add('flipped');
    flipped.push({ el, idx, id: cards[idx].id });

    if (flipped.length === 2) {
      moves++;
      timerEl.textContent = `Movimentos: ${moves}/${config.maxMoves}`;

      if (flipped[0].id === flipped[1].id) {
        matchedCount++;
        scoreEl.textContent = matchedCount;
        targetEl.textContent = `Pares: ${matchedCount}/${config.pairs}`;
        flipped[0].el.classList.add('matched');
        flipped[1].el.classList.add('matched');
        flipped = [];

        if (matchedCount === config.pairs) {
          const perfect = moves <= config.perfectMoves;
          setTimeout(() => showResult(matchedCount, config.pairs, perfect), 600);
        }
      } else {
        locked = true;
        flipped[0].el.classList.add('wrong');
        flipped[1].el.classList.add('wrong');
        setTimeout(() => {
          flipped[0].el.classList.remove('flipped', 'wrong');
          flipped[1].el.classList.remove('flipped', 'wrong');
          flipped = [];
          locked = false;

          if (moves >= config.maxMoves) {
            setTimeout(() => showResult(matchedCount, config.pairs, false), 300);
          }
        }, 900);
      }
    }
  }
}

function startQuiz(config) {
  const allQ = [...config.questions];
  shuffle(allQ);
  const questions = allQ.slice(0, config.questionsPerRound);

  let currentIdx = 0;
  let correctCount = 0;
  let questionTimer = null;
  let timeLeft = config.timePerQuestion;

  gridEl.innerHTML = '';
  gridEl.className = 'mg-grid';
  gridEl.style.display = 'block';

  const quizContainer = document.createElement('div');
  quizContainer.className = 'quiz-container';
  quizContainer.innerHTML = `
    <div class="quiz-timer-bar"><div class="quiz-timer-fill" id="quiz-timer-fill" style="width:100%"></div></div>
    <p class="quiz-question" id="quiz-question"></p>
    <div class="quiz-options" id="quiz-options"></div>
    <div class="quiz-progress" id="quiz-progress"></div>
  `;
  gridEl.appendChild(quizContainer);

  const questionEl = quizContainer.querySelector('#quiz-question');
  const optionsEl  = quizContainer.querySelector('#quiz-options');
  const progressEl = quizContainer.querySelector('#quiz-progress');
  const timerFill  = quizContainer.querySelector('#quiz-timer-fill');

  questions.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'quiz-dot';
    if (i === 0) dot.classList.add('current');
    progressEl.appendChild(dot);
  });

  timerEl.textContent = `${config.timePerQuestion}s`;
  targetEl.textContent = `Meta: ${config.targetScore}/${config.questionsPerRound}`;
  scoreEl.textContent = '0';

  function showQuestion() {
    if (currentIdx >= questions.length) {
      const perfect = correctCount >= config.perfectScore;
      showResult(correctCount, config.targetScore, perfect);
      return;
    }

    const q = questions[currentIdx];
    questionEl.textContent = q.q;
    optionsEl.innerHTML = '';
    timeLeft = config.timePerQuestion;
    timerFill.style.width = '100%';
    timerEl.textContent = `${timeLeft}s`;

    q.opts.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option';
      btn.textContent = opt;
      btn.addEventListener('click', () => onAnswer(i, btn));
      optionsEl.appendChild(btn);
    });

    if (questionTimer) clearInterval(questionTimer);
    questionTimer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `${timeLeft}s`;
      timerFill.style.width = ((timeLeft / config.timePerQuestion) * 100) + '%';
      if (timeLeft <= 0) {
        clearInterval(questionTimer);
        const btns = optionsEl.querySelectorAll('.quiz-option');
        btns.forEach(b => b.classList.add('disabled'));
        btns[q.correct].classList.add('correct');
        progressEl.children[currentIdx].classList.remove('current');
        progressEl.children[currentIdx].classList.add('wrong');
        setTimeout(() => { currentIdx++; nextDot(); showQuestion(); }, 1200);
      }
    }, 1000);
  }

  function onAnswer(idx, btn) {
    if (questionTimer) clearInterval(questionTimer);
    const q = questions[currentIdx];
    const btns = optionsEl.querySelectorAll('.quiz-option');
    btns.forEach(b => b.classList.add('disabled'));

    if (idx === q.correct) {
      btn.classList.add('correct');
      correctCount++;
      scoreEl.textContent = correctCount;
      progressEl.children[currentIdx].classList.remove('current');
      progressEl.children[currentIdx].classList.add('correct');
    } else {
      btn.classList.add('wrong');
      btns[q.correct].classList.add('correct');
      progressEl.children[currentIdx].classList.remove('current');
      progressEl.children[currentIdx].classList.add('wrong');
    }

    setTimeout(() => { currentIdx++; nextDot(); showQuestion(); }, 1200);
  }

  function nextDot() {
    if (currentIdx < questions.length) {
      progressEl.children[currentIdx].classList.add('current');
    }
  }

  showQuestion();
}

function startSorting(config) {
  const allItems = [...config.items];
  shuffle(allItems);
  const itemQueue = allItems.slice(0, config.perfectScore);

  let currentItemIdx = 0;
  let score = 0;
  let timeLeft = config.duration;

  gridEl.innerHTML = '';
  gridEl.className = 'mg-grid';
  gridEl.style.display = 'flex';

  const sortContainer = document.createElement('div');
  sortContainer.className = 'sorting-container';
  sortContainer.innerHTML = `
    <div class="sorting-item" id="sorting-current">
      <span class="si-emoji"></span>
      <span class="si-name"></span>
    </div>
    <div class="sorting-feedback" id="sorting-feedback"></div>
    <div class="sorting-bins" id="sorting-bins"></div>
  `;
  gridEl.appendChild(sortContainer);

  const itemEmoji = sortContainer.querySelector('.si-emoji');
  const itemName  = sortContainer.querySelector('.si-name');
  const feedbackEl = sortContainer.querySelector('#sorting-feedback');
  const binsEl    = sortContainer.querySelector('#sorting-bins');

  config.bins.forEach(bin => {
    const binEl = document.createElement('div');
    binEl.className = 'sorting-bin';
    binEl.dataset.bin = bin.id;
    binEl.style.borderColor = bin.color + '55';
    binEl.innerHTML = `
      <span class="sb-icon">${bin.label.split(' ')[0]}</span>
      <span class="sb-label">${bin.label.split(' ').slice(1).join(' ')}</span>
    `;
    binEl.addEventListener('click', () => onBinClick(bin.id, binEl));
    binsEl.appendChild(binEl);
  });

  timerEl.textContent = `${timeLeft}s`;
  targetEl.textContent = `Meta: ${config.targetScore}`;
  scoreEl.textContent = '0';

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      const perfect = score >= config.perfectScore;
      showResult(score, config.targetScore, perfect);
    }
  }, 1000);

  function showCurrentItem() {
    if (currentItemIdx >= itemQueue.length) {
      if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
      const perfect = score >= config.perfectScore;
      setTimeout(() => showResult(score, config.targetScore, perfect), 400);
      return;
    }
    const item = itemQueue[currentItemIdx];
    itemEmoji.textContent = item.emoji;
    itemName.textContent = item.name;
    feedbackEl.textContent = '';
    feedbackEl.style.color = '';
  }

  function onBinClick(binId, binEl) {
    if (currentItemIdx >= itemQueue.length) return;
    const item = itemQueue[currentItemIdx];

    if (binId === item.bin) {
      score++;
      scoreEl.textContent = score;
      feedbackEl.textContent = '✅ Correto!';
      feedbackEl.style.color = '#2ECC71';
      binEl.classList.add('correct-flash');
      setTimeout(() => binEl.classList.remove('correct-flash'), 500);
    } else {
      feedbackEl.textContent = `❌ Era ${config.bins.find(b => b.id === item.bin).label}`;
      feedbackEl.style.color = '#EF5350';
      binEl.classList.add('wrong-flash');
      setTimeout(() => binEl.classList.remove('wrong-flash'), 500);
    }

    currentItemIdx++;
    setTimeout(showCurrentItem, 600);
  }

  showCurrentItem();
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const MiniGames = { open };
