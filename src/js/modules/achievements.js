import { ACHIEVEMENTS } from '../config/data.js';

let unlocked = [];

export function init(unlockedIds) {
  unlocked = unlockedIds || [];
}

export function check(gameState) {
  const newUnlocks = [];
  ACHIEVEMENTS.forEach((a) => {
    if (unlocked.includes(a.id)) return;
    try {
      if (a.condition(gameState)) {
        unlocked.push(a.id);
        newUnlocks.push(a);
      }
    } catch (e) { /* skip */ }
  });
  return newUnlocks;
}

export function getUnlocked() { return [...unlocked]; }

export function renderGallery() {
  const container = document.getElementById('achievements-list');
  if (!container) return;
  container.innerHTML = '';

  ACHIEVEMENTS.forEach((a) => {
    const isUnlocked = unlocked.includes(a.id);
    const card = document.createElement('div');
    card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;

    card.innerHTML = `
      <span class="ach-icon">${isUnlocked ? a.icon : '🔒'}</span>
      <div class="ach-info">
        <span class="ach-title">${isUnlocked ? a.title : '???'}</span>
        <span class="ach-desc">${isUnlocked ? a.desc : 'Continue jogando para descobrir!'}</span>
      </div>
    `;
    container.appendChild(card);
  });

  const counter = document.getElementById('achievements-counter');
  if (counter) {
    counter.textContent = `${unlocked.length}/${ACHIEVEMENTS.length}`;
  }
}

export function showUnlockNotification(achievement) {
  const notif = document.createElement('div');
  notif.className = 'achievement-notification';
  notif.innerHTML = `
    <div class="ach-notif-icon">${achievement.icon}</div>
    <div class="ach-notif-text">
      <span class="ach-notif-label">Conquista Desbloqueada!</span>
      <span class="ach-notif-title">${achievement.title}</span>
    </div>
  `;
  document.body.appendChild(notif);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => notif.classList.add('show'));
  });

  setTimeout(() => {
    notif.classList.remove('show');
    setTimeout(() => notif.remove(), 600);
  }, 4000);
}

export const AchievementSystem = { init, check, getUnlocked, renderGallery, showUnlockNotification };
