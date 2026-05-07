// Missão 8 — Cordilheira dos Andes. Implementação a cargo de Thiago.
// Contrato e exemplos: src/js/modules/minigames/README.md
// Sprites disponíveis em: public/assets/generated/cutouts/

export class Modulo8 {
  constructor(container, onGameEnd) {
    this.container = container;
    this.onGameEnd = onGameEnd;
  }

  start() {
    // Stub temporário — substituir pela mecânica do minigame.
    this.container.innerHTML = `
      <div class="minigame-stub thiago-8">
        <h3>Andes — minigame em desenvolvimento</h3>
        <p>Tema: lixo de turismo de altitude e mineração.</p>
        <button class="minigame-stub__finish" data-score="100">Finalizar (teste)</button>
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
