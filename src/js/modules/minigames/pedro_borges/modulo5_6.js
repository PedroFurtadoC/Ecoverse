// ==========================================
// MÓDULO 5 e 6 - RESPONSÁVEL: PEDRO BORGES
// ==========================================

export class MinigamePedroBorges {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Minigame do Pedro Borges (Em Construção)</h3>
                <p>Módulo 5 de Madagascar e Módulo 6 do Pantanal.</p>
                <button id="btn-mock-win-pb" style="padding: 10px; background: #FF7043; color: white;">Simular Vitória (+80pts)</button>
            </div>
        `;

        this.container.querySelector('#btn-mock-win-pb').addEventListener('click', () => {
            this.finishGame(true, 80);
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
