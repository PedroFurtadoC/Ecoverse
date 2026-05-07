// Missão 1 — Amazônia. Implementação a cargo de André.
// Contrato e exemplos: src/js/modules/minigames/README.md
// Sprites disponíveis em: public/assets/generated/cutouts/

export class Modulo1 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
  }

  start() {
    // Stub temporário — substituir pela mecânica do minigame.
    this.container.innerHTML = `
      <div class="minigame-stub andre-1">
        <h3>Amazônia — minigame em desenvolvimento</h3>
        <p>Tema: pesca de resíduos no rio.</p>
        <button class="minigame-stub__finish" data-score="50">Finalizar (teste)</button>
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
