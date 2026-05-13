import { Modulo1 } from './minigames/andre/modulo1.js';
import { Modulo2 } from './minigames/andre/modulo2.js';
import { Modulo3 } from './minigames/felipe/modulo3.js';
import { Modulo4 } from './minigames/felipe/modulo4.js';
import { Modulo5 } from './minigames/pedro_borges/modulo5.js';
import { Modulo6 } from './minigames/pedro_borges/modulo6.js';
import { Modulo7 } from './minigames/thiago/modulo7.js';
import { Modulo8 } from './minigames/thiago/modulo8.js';
import { TriagemEasterEgg } from './minigames/_demo/triagem-demo.js';

// Mapa de cada minigame: liga a string `mission.minigame` (em data.js) à classe
// que implementa o jogo e ao rótulo que aparece como título quando o jogo abre.
const ROUTES = {
  andre_1:    { Cls: Modulo1, label: 'Amazônia' },
  andre_2:    { Cls: Modulo2, label: 'Bacia do Congo' },
  felipe_1:   { Cls: Modulo3, label: 'Mata Atlântica' },
  felipe_2:   { Cls: Modulo4, label: 'Bornéu' },
  pedro_b_1:  { Cls: Modulo5, label: 'Madagascar' },
  pedro_b_2:  { Cls: Modulo6, label: 'Pantanal' },
  thiago_1:   { Cls: Modulo7, label: 'Grande Barreira de Coral' },
  thiago_2:   { Cls: Modulo8, label: 'Cordilheira dos Andes' },
  egg_triagem: { Cls: TriagemEasterEgg, label: 'Triagem relâmpago' }
};

let callback = null;
let dom = null;
let bound = false;

function getDom() {
  if (dom) return dom;
  dom = {
    container: document.getElementById('minigame-container'),
    title:     document.getElementById('mg-title'),
    desc:      document.getElementById('mg-desc'),
    timer:     document.getElementById('mg-timer'),
    score:     document.getElementById('mg-score'),
    target:    document.getElementById('mg-target'),
    grid:      document.getElementById('mg-grid'),
    canvas:    document.getElementById('minigame-canvas'),
    result:    document.getElementById('mg-result'),
    exit:      document.getElementById('mg-exit-btn')
  };
  return dom;
}

// Saída universal do shell: clique no botão "Voltar" ou tecla Esc.
// Fechar com success=false faz o fluxo de missão devolver a energia gasta.
function quit() {
  if (!callback) return;
  close({ success: false, perfect: false });
}

function bindShellControls() {
  if (bound) return;
  const d = getDom();
  if (d.exit) d.exit.addEventListener('click', quit);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && d.container.classList.contains('active')) {
      quit();
    }
  });
  bound = true;
}

// Reseta o shell genérico do container do minigame antes de instanciar o jogo:
// limpa título, score, descrição e o grid, e marca o container como ativo.
function setupShell(route) {
  const d = getDom();
  d.title.textContent = route.label;
  d.desc.textContent = '';
  d.score.textContent = '0';
  d.result.style.display = 'none';
  d.canvas.style.display = 'none';
  d.grid.innerHTML = '';
  d.grid.className = 'mg-grid';
  d.grid.style.display = 'block';
  d.container.classList.add('active');
}

function close({ success, perfect }) {
  const d = getDom();
  d.container.classList.remove('active');
  const cb = callback;
  callback = null;
  if (cb) cb(success, perfect === true);
}

export function open(gameType, cb) {
  callback = cb;
  const route = ROUTES[gameType];

  if (!route) {
    console.warn(`[minigames] rota desconhecida: ${gameType}`);
    cb(true, false);
    return;
  }

  bindShellControls();
  setupShell(route);

  const d = getDom();
  const instance = new route.Cls(d.grid, (result) => {
    close({
      success: result?.success === true,
      perfect: result?.perfect === true
    });
  });
  instance.start();
}

export const MiniGames = { open };
