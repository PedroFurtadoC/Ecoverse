// Orquestra a UI de autenticação:
// - menu hambúrguer reage ao estado de login
// - modal de magic link (entrar) + tela de "link enviado"
// - leaderboard com filtros mensal/total
// - exportação dos dados do usuário em JSON
// - exclusão dos próprios dados (RLS + cascade do schema)
//
// As dependências vêm do main.js via init() pra evitar dependência circular
// com showToast / openModal / closeModal e a serialização do save local.

import * as Auth from '../services/auth.js';
import * as Sync from '../services/sync.js';
import { isConfigured } from '../services/supabase.js';

let deps = {
  showToast: () => {},
  openModal: () => {},
  closeModal: () => {},
  buildExportPayload: () => ({})
};

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

export function init(injected) {
  deps = { ...deps, ...injected };

  if (!isConfigured()) {
    // Sem Supabase configurado o jogo segue em modo anônimo. Esconde os
    // itens de login pra não confundir quem está rodando em dev sem .env.
    document.body.classList.add('auth-disabled');
    return;
  }

  syncMenuByAuth(Auth.getUser());
  Auth.onAuthChange(syncMenuByAuth);

  bindAuthForm();
  bindLeaderboardTabs();
}

function syncMenuByAuth(user) {
  const isIn = !!user;
  document.body.classList.toggle('is-signed-in', isIn);
  document.body.classList.toggle('is-signed-out', !isIn);

  $$('[data-auth-state]').forEach((el) => {
    const wantState = el.dataset.authState;
    let visible = true;
    if (wantState === 'signed-in') visible = isIn;
    else if (wantState === 'signed-out') visible = !isIn;
    el.hidden = !visible;
  });

  const nameEl = $('#menu-user-name');
  const emailEl = $('#menu-user-email');
  const profile = Auth.getProfile();
  if (nameEl) nameEl.textContent = profile?.display_name || user?.email?.split('@')[0] || '';
  if (emailEl) emailEl.textContent = user?.email || '';
}

function bindAuthForm() {
  const form = $('#auth-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.elements.email.value.trim();
    const displayName = form.elements.displayName?.value?.trim() ?? '';
    const consent = form.elements.consent.checked;
    if (!consent) {
      deps.showToast('Aceite os termos pra continuar.', 'info');
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Enviando…';

    try {
      await Auth.signInWithMagicLink(email, displayName);
      $('#auth-form-wrap').hidden = true;
      $('#auth-sent').hidden = false;
      $('#auth-sent-email').textContent = email;
    } catch (err) {
      const msg = err?.message?.includes('rate') || err?.status === 429
        ? 'Aguarde um minuto antes de pedir outro link.'
        : 'Não foi possível enviar agora. Tente novamente em alguns segundos.';
      deps.showToast(msg, 'info');
      button.disabled = false;
      button.textContent = original;
    }
  });

  // Botão "Pedir outro link" volta pra etapa do email.
  $('#auth-sent-back')?.addEventListener('click', () => {
    $('#auth-sent').hidden = true;
    $('#auth-form-wrap').hidden = false;
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = false;
    btn.textContent = 'Receber link no email';
  });
}

export function openAuth() {
  deps.openModal('modal-auth');
}

export async function signOut() {
  await Auth.signOut();
  deps.showToast('Você saiu. Seu progresso continua salvo neste dispositivo.', 'info');
}

export async function editNickname() {
  const user = Auth.getUser();
  if (!user) return;
  const current = Auth.getProfile()?.display_name ?? '';
  const next = window.prompt(
    'Como você prefere aparecer no ranking?\n\nMáximo 60 caracteres. Em branco, mantém o atual.',
    current
  );
  if (next === null) return; // cancelou
  const cleaned = next.trim().slice(0, 60);
  if (!cleaned || cleaned === current) return;

  try {
    await Auth.updateDisplayName(cleaned);
    deps.showToast('Apelido atualizado!', 'reward');
    // Atualiza o nome no card do menu sem esperar o próximo render.
    const nameEl = document.getElementById('menu-user-name');
    if (nameEl) nameEl.textContent = cleaned;
  } catch (err) {
    deps.showToast('Não consegui salvar agora. Tente daqui a pouco.', 'info');
    console.warn('[auth-ui] update display name falhou:', err);
  }
}

export async function exportData() {
  const user = Auth.getUser();
  if (!user) return;
  deps.showToast('Preparando seu pacote de dados…', 'info');

  const [cloudState, pomodoros] = await Promise.all([
    Sync.pullState(),
    Sync.pullPomodoroHistory()
  ]);

  const payload = {
    generated_at: new Date().toISOString(),
    note: 'Pacote de dados pessoais conforme Art. 18 da LGPD. Contém perfil, progresso e histórico de sessões.',
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    },
    profile: Auth.getProfile(),
    progress_cloud: cloudState,
    progress_local: deps.buildExportPayload(),
    pomodoro_sessions: pomodoros
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ecoverse-meus-dados-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function deleteAccount() {
  const confirm1 = window.confirm(
    'Tem certeza? Vamos apagar seu perfil, progresso e histórico de Pomodoros do servidor.\n\nO save local deste navegador continua intacto — você pode continuar jogando anônimo.'
  );
  if (!confirm1) return;

  const confirm2 = window.prompt('Pra confirmar, digite EXCLUIR:');
  if (confirm2 !== 'EXCLUIR') {
    deps.showToast('Exclusão cancelada.', 'info');
    return;
  }

  try {
    await Auth.deleteOwnData();
    deps.showToast('Seus dados foram apagados. Boas memórias!', 'info');
  } catch (err) {
    deps.showToast('Algo falhou na exclusão. Fale com a equipe.', 'info');
    console.warn('[auth-ui] delete falhou:', err);
  }
}

// =============================================================
// Leaderboard
// =============================================================
let currentLbPeriod = 'total';

function bindLeaderboardTabs() {
  $$('#modal-leaderboard .lb-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.lbTab;
      if (period === currentLbPeriod) return;
      currentLbPeriod = period;
      $$('#modal-leaderboard .lb-tab').forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      renderLeaderboard();
    });
  });
}

export async function openLeaderboard() {
  deps.openModal('modal-leaderboard');
  renderLeaderboard();
}

async function renderLeaderboard() {
  const body = $('#lb-body');
  if (!body) return;
  body.innerHTML = '<p class="lb-msg">Carregando ranking…</p>';

  try {
    const rows = await Sync.getLeaderboard({ period: currentLbPeriod, limit: 50 });

    if (!rows.length) {
      body.innerHTML = currentLbPeriod === 'month'
        ? '<p class="lb-msg">Ninguém ativo no mês ainda. Seja o primeiro!</p>'
        : '<p class="lb-msg">O ranking abre quando o primeiro jogador da turma criar conta.</p>';
      return;
    }

    const me = Auth.getUser()?.id;
    body.innerHTML = `
      <ol class="lb-list">
        ${rows.map((r, i) => `
          <li class="lb-row${r.user_id === me ? ' lb-row--me' : ''}">
            <span class="lb-rank">${i + 1}</span>
            <span class="lb-name">${escapeHtml(r.display_name || 'Sem nome')}</span>
            <span class="lb-stat" title="Moedas">🪙 ${r.coins ?? 0}</span>
            <span class="lb-stat" title="Missões">🌍 ${r.missions_count ?? 0}</span>
            <span class="lb-stat" title="Pomodoros">🍅 ${r.pomodoros_completed ?? 0}</span>
          </li>
        `).join('')}
      </ol>
    `;
  } catch (err) {
    body.innerHTML = '<p class="lb-msg">Não consegui carregar o ranking. Tente daqui a pouco.</p>';
    console.warn('[auth-ui] leaderboard falhou:', err);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
