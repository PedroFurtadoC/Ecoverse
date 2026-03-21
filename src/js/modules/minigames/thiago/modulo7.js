// Thiago - Módulo 7 (Grande Barreira de Coral)

export class Modulo7 {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 7] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 7 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 7: Grande Barreira de Coral</h3>
                <button id="btn-win-7" style="padding: 10px; background: #9C27B0; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-7').addEventListener('click', () => {
            this.finishGame(true, 100); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
