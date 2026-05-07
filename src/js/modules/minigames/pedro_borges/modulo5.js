// Missão 5 — Madagascar. Implementação a cargo de Pedro Borges.
// Contrato e exemplos: src/js/modules/minigames/README.md
// Sprites disponíveis em: public/assets/generated/cutouts/

export class Modulo5 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
  }

  start() {
    // Stub temporário — substituir pela mecânica do minigame.
    this.container.innerHTML = `
      <div class="minigame-stub pedro-b-5">
        <h3>Madagascar — minigame em desenvolvimento</h3>
        <p>Tema: pesca-fantasma e redes abandonadas.</p>
        <button class="minigame-stub__finish" data-score="80">Finalizar (teste)</button>
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
