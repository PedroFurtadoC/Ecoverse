// Minigame demo de triagem de resíduos.
// Pasta isolada (_demo) — não afeta o trabalho dos colegas.
// Uso: abre via ?demo=triagem na URL ou pelo roteador com gameType "demo_triagem".

const CATEGORIAS = {
  paper:    { bin: 'bin-paper.png',    nome: 'Papel',     cor: '#1976D2' },
  plastic:  { bin: 'bin-plastic.png',  nome: 'Plástico',  cor: '#D32F2F' },
  metal:    { bin: 'bin-metal.png',    nome: 'Metal',     cor: '#F1C40F' },
  glass:    { bin: 'bin-glass.png',    nome: 'Vidro',     cor: '#388E3C' },
  organic:  { bin: 'bin-organic.png',  nome: 'Orgânico',  cor: '#8D6E63' },
  trash:    { bin: 'bin-trash.png',    nome: 'Rejeito',   cor: '#9E9E9E' }
};

const ITENS = [
  { sprite: 'waste-paper-newspaper.png',  nome: 'Jornal',         categoria: 'paper'   },
  { sprite: 'waste-cardboard.png',        nome: 'Papelão',        categoria: 'paper'   },
  { sprite: 'waste-plastic-pet.png',      nome: 'Garrafa PET',    categoria: 'plastic' },
  { sprite: 'waste-metal-can.png',        nome: 'Lata',           categoria: 'metal'   },
  { sprite: 'waste-glass-jar.png',        nome: 'Pote de vidro',  categoria: 'glass'   },
  { sprite: 'waste-banana-peel.png',      nome: 'Casca de banana',categoria: 'organic' },
  { sprite: 'waste-apple-core.png',       nome: 'Caroço de maçã', categoria: 'organic' },
  { sprite: 'waste-coffee-grounds.png',   nome: 'Borra de café',  categoria: 'organic' },
  { sprite: 'waste-eggshell.png',         nome: 'Casca de ovo',   categoria: 'organic' },
  { sprite: 'waste-battery.png',          nome: 'Pilha',          categoria: 'trash'   },
  { sprite: 'waste-smartphone.png',       nome: 'Smartphone',     categoria: 'trash'   },
  { sprite: 'waste-circuit-board.png',    nome: 'Placa eletrônica',categoria:'trash'   },
  { sprite: 'waste-blister.png',          nome: 'Blíster',        categoria: 'trash'   },
  { sprite: 'waste-sponge.png',           nome: 'Esponja',        categoria: 'trash'   }
];

const RODADAS = 8;
const TEMPO_TOTAL = 60;

export class TriagemDemo {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
    this.itemAtual = null;
    this.acertos = 0;
    this.erros = 0;
    this.rodada = 0;
    this.tempoRestante = TEMPO_TOTAL;
    this.timerId = null;
    this.fila = [];
  }

  start() {
    this.fila = this.embaralhar([...ITENS]).slice(0, RODADAS);
    this.renderShell();
    this.proximaRodada();
    this.iniciarTimer();
  }

  embaralhar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  renderShell() {
    this.container.innerHTML = `
      <section class="demo-tri">
        <header class="demo-tri__header">
          <div class="demo-tri__stat">
            <span class="demo-tri__stat-label">Tempo</span>
            <span class="demo-tri__timer" id="demo-timer">${TEMPO_TOTAL}s</span>
          </div>
          <div class="demo-tri__stat">
            <span class="demo-tri__stat-label">Acertos</span>
            <span class="demo-tri__score" id="demo-score">0/${RODADAS}</span>
          </div>
        </header>

        <div class="demo-tri__stage">
          <div class="demo-tri__item-wrap">
            <img class="demo-tri__item" id="demo-item" alt="" />
            <p class="demo-tri__item-name" id="demo-item-name"></p>
            <p class="demo-tri__hint">Onde este resíduo deve ir?</p>
          </div>
        </div>

        <div class="demo-tri__bins" id="demo-bins"></div>

        <p class="demo-tri__feedback" id="demo-feedback" aria-live="polite"></p>
      </section>
    `;

    const bins = this.container.querySelector('#demo-bins');
    Object.entries(CATEGORIAS).forEach(([key, cat]) => {
      const btn = document.createElement('button');
      btn.className = 'demo-tri__bin';
      btn.dataset.categoria = key;
      btn.style.setProperty('--demo-bin-color', cat.cor);
      btn.innerHTML = `
        <img src="assets/generated/cutouts/${cat.bin}" alt="" aria-hidden="true" />
        <span>${cat.nome}</span>
      `;
      btn.addEventListener('click', () => this.escolher(key));
      bins.appendChild(btn);
    });
  }

  proximaRodada() {
    if (this.rodada >= RODADAS) {
      this.terminar();
      return;
    }
    this.itemAtual = this.fila[this.rodada];
    const img = this.container.querySelector('#demo-item');
    const name = this.container.querySelector('#demo-item-name');
    img.src = `assets/generated/cutouts/${this.itemAtual.sprite}`;
    img.classList.remove('demo-tri__item--enter');
    void img.offsetWidth;
    img.classList.add('demo-tri__item--enter');
    name.textContent = this.itemAtual.nome;
    this.feedback('');
  }

  escolher(categoria) {
    if (!this.itemAtual) return;
    const correto = categoria === this.itemAtual.categoria;
    if (correto) {
      this.acertos++;
      this.feedback('Correto!', 'sucesso');
    } else {
      this.erros++;
      const certo = CATEGORIAS[this.itemAtual.categoria].nome;
      this.feedback(`Vai pro ${certo}`, 'erro');
    }
    this.atualizarScore();
    this.rodada++;
    setTimeout(() => this.proximaRodada(), 700);
  }

  feedback(msg, tipo) {
    const el = this.container.querySelector('#demo-feedback');
    if (!el) return;
    el.textContent = msg;
    el.className = 'demo-tri__feedback';
    if (tipo) el.classList.add(`demo-tri__feedback--${tipo}`);
  }

  atualizarScore() {
    const el = this.container.querySelector('#demo-score');
    if (el) el.textContent = `${this.acertos}/${RODADAS}`;
  }

  iniciarTimer() {
    this.timerId = setInterval(() => {
      this.tempoRestante--;
      const el = this.container.querySelector('#demo-timer');
      if (el) el.textContent = `${this.tempoRestante}s`;
      if (this.tempoRestante <= 0) this.terminar();
    }, 1000);
  }

  terminar() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = null;
    const taxa = this.acertos / RODADAS;
    const success = taxa >= 0.6;
    const perfect = this.acertos === RODADAS;
    this.mostrarResultado(success, perfect);
    setTimeout(() => this.finishGame(success, this.acertos, perfect), 2400);
  }

  mostrarResultado(success, perfect) {
    const stage = this.container.querySelector('.demo-tri__stage');
    if (!stage) return;
    const titulo = perfect ? 'Triagem perfeita!' : success ? 'Bom trabalho!' : 'Não foi dessa vez';
    const subtitulo = perfect
      ? `Você acertou todas as ${RODADAS} categorias.`
      : `${this.acertos} de ${RODADAS} corretas.`;
    stage.innerHTML = `
      <div class="demo-tri__result">
        <h3>${titulo}</h3>
        <p>${subtitulo}</p>
      </div>
    `;
  }

  finishGame(success, score, perfect) {
    this.onGameEnd({ success, finalScore: score, perfect: perfect === true });
  }
}
