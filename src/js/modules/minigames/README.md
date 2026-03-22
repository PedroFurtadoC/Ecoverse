# Guia de Desenvolvimento de Mini-games (Equipe Ecoverse)

Este documento orienta a implementação das missões de forma organizada, garantindo que o desenvolvimento individual não gere conflitos no repositório principal do GitHub. A regra fundamental é: uma missão corresponde a um arquivo JavaScript isolado.

## Divisão de Arquivos por Desenvolvedor

- André: modulo1.js e modulo2.js
- Felipe: modulo3.js e modulo4.js
- Pedro Borges: modulo5.js e modulo6.js
- Thiago: modulo7.js e modulo8.js

---

## Instruções de Implementação

O sistema de integração já está configurado. O desenvolvedor deve focar apenas na lógica interna do seu mini-game dentro da classe correspondente.

### Passo a Passo

1. Localize o seu arquivo em `src/js/modules/minigames/`.
2. Implemente a lógica do jogo (HTML, Canvas ou lógica JS) dentro do método `start()`.
3. Utilize o marcador [IMPLEMENTE AQUI] dentro do código como referência.

### Exemplo de Estrutura:

```javascript
    start() {
        // Injeção de interface ou inicialização de Canvas:
        this.container.innerHTML = `
            <div class="interface-jogo">
                <h3>Título da Missão</h3>
                <button id="finalizar-teste">Finalizar Missão</button>
            </div>
        `;
        
        document.getElementById('finalizar-teste').addEventListener('click', () => {
            // Obrigatório: Notificar o sistema sobre o fim da partida
            // Parâmetros: Sucesso (boolean) e Pontuação Final (number)
            this.finishGame(true, 100);
        });
    }
```

### Regras de Conduta no Código:

1. Escopo Local: Evite o uso de variáveis globais (window). Utilize propriedades da própria classe ou declarações locais (let/const).
2. Estilização: Utilize prefixos em classes CSS (ex: .andre-game-button) para evitar que o seu estilo interfira nos outros módulos ou na interface global do site.
3. Fluxo de Git: Mantenha as alterações estritamente nos arquivos designados a você.

O ambiente está configurado para que cada módulo funcione de forma independente assim que o código for enviado ao repositório.
