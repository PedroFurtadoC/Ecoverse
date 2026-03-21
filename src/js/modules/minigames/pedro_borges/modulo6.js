// Pedro Borges - Módulo 6 (Pantanal)

export class Modulo6 {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 6] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 6 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 6: Pantanal</h3>
                <button id="btn-win-6" style="padding: 10px; background: #FF7043; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-6').addEventListener('click', () => {
            this.finishGame(true, 80); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
