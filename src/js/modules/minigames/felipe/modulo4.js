// Felipe - Módulo 4 (Florestas de Bornéu)

export class Modulo4 {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 4] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 4 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 4: Florestas de Bornéu</h3>
                <button id="btn-win-4" style="padding: 10px; background: #0A97D9; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-4').addEventListener('click', () => {
            this.finishGame(true, 70); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
