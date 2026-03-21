// Felipe - Módulo 3 (Mata Atlântica)

export class Modulo3 {
    constructor(containerElement, onGameEnd) {
        this.container = containerElement;
        this.onGameEnd = onGameEnd;
    }

    start() {
        // 👇 ========================================================= 👇
        // 🚀 [IMPLEMENTE AQUI - MÓDULO 3] 
        // Apague este HTML de teste e crie a lógica (Canvas/HTML) do Módulo 3 abaixo.
        // 👆 ========================================================= 👆

        this.container.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <h3>Módulo 3: Mata Atlântica</h3>
                <button id="btn-win-3" style="padding: 10px; background: #0A97D9; color: white;"> Finalizar Partida (Teste) </button>
            </div>
        `;
        this.container.querySelector('#btn-win-3').addEventListener('click', () => {
            this.finishGame(true, 70); 
        });
    }

    finishGame(isSuccess, score) {
        this.onGameEnd({ success: isSuccess, finalScore: score });
    }
}
