// André - Módulo 2 (Bacia do Congo)

export class Modulo2 {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 2] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 2 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 2: Bacia do Congo</h3>
                <button id="btn-win-2" style="padding: 10px; background: #2ECC71; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-2').addEventListener('click', () => {
            this.finishGame(true, 50); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
