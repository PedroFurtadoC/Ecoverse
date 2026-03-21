// André - Módulo 1 (Floresta Amazônica)
// O arquivo principal (minigames.js) já está apontando pra cá!

export class Modulo1 {
    /**
     * @param {HTMLElement} containerElement - Div vazia para você injetar seu jogo.
     * @param {Function} onGameEnd - Callback de finalização: onGameEnd({ success: boolean, finalScore: number }).
     */
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 1] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 1 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 1: Floresta Amazônica</h3>
                <button id="btn-win-1" style="padding: 10px; background: #2ECC71; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-1').addEventListener('click', () => {
            this.finishGame(true, 50); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
