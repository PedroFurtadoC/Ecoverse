# 🎮 Guia de Desenvolvimento de Minigames (Ecoverse)

Bem-vindos ao coração interativo do Ecoverse! Este repositório foi arquitetado para ser escalável, modular e à prova de conflitos. Para garantir que o código de vocês não entre em conflito (Merge Conflicts) no GitHub, cada desenvolvedor tem a sua própria pasta isolada.

## 📁 Estrutura da Equipe
- `/andre/` -> Módulos 1 e 2
- `/felipe/` -> Módulos 3 e 4
- `/pedro_borges/` -> Módulos 5 e 6
- `/thiago/` -> Módulos 7 e 8

---

## 🛠️ Como criar o seu Minigame (Padrão Profissional)

Vocês não precisam (nem devem) alterar arquivos globais como `state.js` ou `main.js` para criar a lógica do jogo de vocês. A plataforma fornece uma interface onde vocês só precisam construir a tela e disparar um evento quando o jogo acabar.

### 1. O Arquivo Base (O seu Módulo)
Dentro da sua pasta, crie a lógica do seu minigame seguindo o padrão de "Exportação de Classe ou Função". Veja o exemplo estruturado nos arquivos `.js` já deixados na sua pasta.

### 2. Ciclo de Vida do Minigame
Um minigame perfeito no Ecoverse precisa de 3 coisas:
1. **init(containerId):** Uma função que recebe o ID de uma `<div>` vazia onde você vai injetar o HTML, botões e Canvas do seu jogo.
2. **start():** A função que inicia os cronômetros e a lógica.
3. **onFinish(pontuacao):** A função callback (que nós da arquitetura base vamos te passar) que você chama quando o jogador "Ganhar" ou "Perder".

### Exemplo de Integração Segura
```javascript
export function iniciarMeuMinigame(containerId, aoFinalizar) {
    const container = document.getElementById(containerId);
    
    // 1. Crie seu HTML
    container.innerHTML = \`<div class="meu-jogo">
        <h1>Meu Jogo Incrível</h1>
        <button id="btn-ganhar">Ganhar 100 pontos!</button>
    </div>\`;
    
    // 2. Coloque seus Eventos
    document.getElementById('btn-ganhar').addEventListener('click', () => {
        // 3. Avise a Plataforma que o jogo acabou passando o Score!
        aoFinalizar({ 
            sucesso: true, 
            pontos: 100 
        });
    });
}
```

### 3. Regras de Ouro ⚠️
- **NÃO use variáveis globais soltas** (como `var meusPontos`). Use let/const dentro das suas funções ou classes.
- **NÃO mude arquivos dos colegas**.
- **CSS Isolado:** Para estilizar o jogo de vocês, criem um arquivo `.css` dentro da sua pasta e avisem o Tech Lead (Pedro Furtado) para importá-lo no `main.css` oficial. Nomeiem suas classes com prefixos únicos, ex: `.andre-botao-pulo` para evitar colidir estilos com o do Felipe.

Bom código! A arquitetura base está 100% pronta para receber as inovações de vocês.
