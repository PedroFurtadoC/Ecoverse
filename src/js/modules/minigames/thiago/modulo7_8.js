// ==========================================
// MÓDULO 7 e 8 - RESPONSÁVEL: THIAGO
// ==========================================

export class MinigameThiago {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Minigame do Thiago (Em Construção)</h3>
                <p>Módulo 7 da Barreira de Coral e Módulo 8 da Cordilheira dos Andes.</p>
                <button id="btn-mock-win-t" style="padding: 10px; background: #9C27B0; color: white;">Simular Vitória (+100pts)</button>
            </div>
        `;

        this.container.querySelector('#btn-mock-win-t').addEventListener('click', () => {
            this.finishGame(true, 100);
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
