// Thiago - Módulo 8 (Cordilheira dos Andes)

export class Modulo8 {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 8] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 8 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 8: Cordilheira dos Andes</h3>
                <button id="btn-win-8" style="padding: 10px; background: #9C27B0; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-8').addEventListener('click', () => {
            this.finishGame(true, 100); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
