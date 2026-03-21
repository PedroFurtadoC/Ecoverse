import { POMODORO_CONFIG } from '../config/data.js';
import { addReward, showToast, onPomodoroComplete } from '../main.js'; // To be exported from main.js

let timer = null;
let remaining = POMODORO_CONFIG.workDuration;
let total = POMODORO_CONFIG.workDuration;
let isRunning = false;
let isBreak = false;
let sessionCount = 0;
let currentStreak = 0;
let taskName = '';

// DOM
let overlay, ring, timeText, phaseText, sessionText, taskInput;
let btnStart, btnPause, btnReset, btnSkip, streakText;
const CIRCUMFERENCE = 2 * Math.PI * 54; // r=54

export function init() {
  overlay  = document.getElementById('modal-pomodoro');
  ring     = document.getElementById('pomo-ring');
  timeText = document.getElementById('pomo-time');
  phaseText = document.getElementById('pomo-phase');
  sessionText = document.getElementById('pomo-sessions');
  taskInput = document.getElementById('pomo-task-input');
  btnStart = document.getElementById('pomo-btn-start');
  btnPause = document.getElementById('pomo-btn-pause');
  btnReset = document.getElementById('pomo-btn-reset');
  btnSkip  = document.getElementById('pomo-btn-skip');
  streakText = document.getElementById('pomo-streak');

  if (!ring) return; // safeguard

  ring.style.strokeDasharray = CIRCUMFERENCE;
  ring.style.strokeDashoffset = 0;

  btnStart.addEventListener('click', start);
  btnPause.addEventListener('click', pause);
  btnReset.addEventListener('click', reset);
  btnSkip.addEventListener('click', skip);
  taskInput.addEventListener('input', (e) => { taskName = e.target.value; });

  updateDisplay();
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function updateDisplay() {
  if (!timeText) return;
  timeText.textContent = formatTime(remaining);
  const progress = 1 - (remaining / total);
  ring.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  phaseText.textContent = isBreak ? '☕ Pausa' : '🍅 Foco';
  phaseText.className = 'pomo-phase ' + (isBreak ? 'break' : 'work');
  sessionText.textContent = `Sessão ${sessionCount + 1}`;
  streakText.textContent = `🔥 Sequência: ${currentStreak}`;

  ring.style.stroke = isBreak ? '#26C6DA' : '#FF7043';

  btnStart.style.display = isRunning ? 'none' : '';
  btnPause.style.display = isRunning ? '' : 'none';
  btnSkip.style.display  = isBreak ? '' : 'none';
}

export function start() {
  if (isRunning) return;
  isRunning = true;

  timer = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(timer);
      timer = null;
      isRunning = false;
      onPhaseComplete();
    }
    updateDisplay();
  }, 1000);

  updateDisplay();
}

export function pause() {
  if (!isRunning) return;
  clearInterval(timer);
  timer = null;
  isRunning = false;
  updateDisplay();
}

export function reset() {
  clearInterval(timer);
  timer = null;
  isRunning = false;
  isBreak = false;
  remaining = POMODORO_CONFIG.workDuration;
  total = POMODORO_CONFIG.workDuration;
  currentStreak = 0;
  updateDisplay();
}

export function skip() {
  if (!isBreak) return;
  clearInterval(timer);
  timer = null;
  isRunning = false;
  startWorkPhase();
}

function onPhaseComplete() {
  playBeep();

  if (!isBreak) {
    sessionCount++;
    currentStreak++;

    addReward(POMODORO_CONFIG.rewardEnergy, POMODORO_CONFIG.rewardCoins);
    showToast(`🍅 Pomodoro completo! +${POMODORO_CONFIG.rewardEnergy} energia, +${POMODORO_CONFIG.rewardCoins} moedas`, 'success');
    onPomodoroComplete(currentStreak);

    const isLongBreak = sessionCount % POMODORO_CONFIG.longBreakInterval === 0;
    isBreak = true;
    remaining = isLongBreak ? POMODORO_CONFIG.longBreakDuration : POMODORO_CONFIG.breakDuration;
    total = remaining;
    updateDisplay();

    setTimeout(start, 1500);
  } else {
    startWorkPhase();
    showToast('☕ Pausa encerrada! Hora de focar.', 'info');
  }
}

function startWorkPhase() {
  isBreak = false;
  remaining = POMODORO_CONFIG.workDuration;
  total = POMODORO_CONFIG.workDuration;
  updateDisplay();
}

function playBeep() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
    frequencies.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime + i * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.15 + 0.4);
      osc.start(audioCtx.currentTime + i * 0.15);
      osc.stop(audioCtx.currentTime + i * 0.15 + 0.4);
    });
  } catch (e) { /* silent */ }
}

export function getStats() {
  return { sessionCount, currentStreak };
}

export const Pomodoro = { init, start, pause, reset, getStats };
