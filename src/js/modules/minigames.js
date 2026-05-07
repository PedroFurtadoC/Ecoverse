import { Modulo1 } from './minigames/andre/modulo1.js';
import { Modulo2 } from './minigames/andre/modulo2.js';
import { Modulo3 } from './minigames/felipe/modulo3.js';
import { Modulo4 } from './minigames/felipe/modulo4.js';
import { Modulo5 } from './minigames/pedro_borges/modulo5.js';
import { Modulo6 } from './minigames/pedro_borges/modulo6.js';
import { Modulo7 } from './minigames/thiago/modulo7.js';
import { Modulo8 } from './minigames/thiago/modulo8.js';
import { TriagemDemo } from './minigames/_demo/triagem-demo.js';

const ROUTES = {
  andre_1:    { Cls: Modulo1, owner: 'André',         label: 'Amazônia' },
  andre_2:    { Cls: Modulo2, owner: 'André',         label: 'Bacia do Congo' },
  felipe_1:   { Cls: Modulo3, owner: 'Felipe',        label: 'Mata Atlântica' },
  felipe_2:   { Cls: Modulo4, owner: 'Felipe',        label: 'Bornéu' },
  pedro_b_1:  { Cls: Modulo5, owner: 'Pedro Borges',  label: 'Madagascar' },
  pedro_b_2:  { Cls: Modulo6, owner: 'Pedro Borges',  label: 'Pantanal' },
  thiago_1:   { Cls: Modulo7, owner: 'Thiago',        label: 'Grande Barreira de Coral' },
  thiago_2:   { Cls: Modulo8, owner: 'Thiago',        label: 'Cordilheira dos Andes' },
  demo_triagem: { Cls: TriagemDemo, owner: 'Demo',    label: 'Triagem de resíduos' }
};

let callback = null;
let dom = null;

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
    result:    document.getElementById('mg-result')
  };
  return dom;
}

function setupShell(route) {
  const d = getDom();
  d.title.textContent = `${route.label} — minigame de ${route.owner}`;
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
