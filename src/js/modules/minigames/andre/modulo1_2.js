// ==========================================
// MÓDULO 1 e 2 - RESPONSÁVEL: ANDRÉ
// ==========================================

export class MinigameAndre {
    /**
     * @param {HTMLElement} containerElement - O elemento DIV onde você deve desenhar o seu jogo.
     * @param {Function} onGameEnd - Chamar esta função passando { score: X, success: true/false } quando acabar.
     */
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // Escreva seu HTML dinâmico ou Canvas aqui
        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Minigame do André (Em Construção)</h3>
                <p>Nesta área, você construirá o Módulo 1 da Floresta Amazônica e Módulo 2 da Bacia do Congo.</p>
                <button id="btn-mock-win" style="padding: 10px; background: green; color: white;">Simular Vitória (+50pts)</button>
            </div>
        `;

        // Lógica e eventos
        this.container.querySelector('#btn-mock-win').addEventListener('click', () => {
            this.finishGame(true, 50);
        });
    }

    finishGame(isSuccess, score) {
        // Limpe seus intervalos (setInterval) se houver!
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
