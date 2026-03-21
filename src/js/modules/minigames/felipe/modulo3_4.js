// ==========================================
// MÓDULO 3 e 4 - RESPONSÁVEL: FELIPE
// ==========================================

export class MinigameFelipe {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Minigame do Felipe (Em Construção)</h3>
                <p>Módulo 3 da Mata Atlântica e Módulo 4 de Bornéu.</p>
                <button id="btn-mock-win-f" style="padding: 10px; background: #0A97D9; color: white;">Simular Vitória (+70pts)</button>
            </div>
        `;

        this.container.querySelector('#btn-mock-win-f').addEventListener('click', () => {
            this.finishGame(true, 70);
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
