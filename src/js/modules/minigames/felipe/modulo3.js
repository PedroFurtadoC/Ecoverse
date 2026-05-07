// Missão 3 — Mata Atlântica. Implementação a cargo de Felipe.
// Contrato e exemplos: src/js/modules/minigames/README.md
// Sprites disponíveis em: public/assets/generated/cutouts/

export class Modulo3 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
  }

  start() {
    // Stub temporário — substituir pela mecânica do minigame.
    this.container.innerHTML = `
      <div class="minigame-stub felipe-3">
        <h3>Mata Atlântica — minigame em desenvolvimento</h3>
        <p>Tema: descarte irregular em encostas e nascentes.</p>
        <button class="minigame-stub__finish" data-score="70">Finalizar (teste)</button>
      </div>
    `;
    this.container.querySelector('.minigame-stub__finish').addEventListener('click', (e) => {
      const score = Number(e.currentTarget.dataset.score) || 0;
      this.finishGame(true, score);
    });
  }

  finishGame(success, score) {
    this.onGameEnd({ success, finalScore: score, perfect: false });
  }
}
