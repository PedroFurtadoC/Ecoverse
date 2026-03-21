# 🎮 Guia de Integração de Minigames (Ecoverse)

Temos uma arquitetura modularizada, baseada em "Single Responsibility" (Responsabilidade Única) e puramente orientada a objetos usando classes ES6.

Para garantir ZERO conflitos no GitHub (os chamados Merge Conflicts), adotamos a infraestrutura onde **1 Missão = 1 Arquivo JS**.

## 📁 Estrutura da Equipe
- `/andre/` -> `modulo1.js` e `modulo2.js`
- `/felipe/` -> `modulo3.js` e `modulo4.js`
- `/pedro_borges/` -> `modulo5.js` e `modulo6.js`
- `/thiago/` -> `modulo7.js` e `modulo8.js`

---

## 🛠️ Como criar o seu Minigame

Vocês NÃO precisam saber como o Roteador Principal (`minigames.js`) ou o Controle de Moedas (`state.js`) funcionam. Nós, da Liderança Técnica, já conectamos os dois mundos.

Basta você abrir o seu arquivo correspondente (ex: `modulo1.js`) e criar a sua tela e a sua lógica livremente dentro do escopo da Função Principal.

### O Ciclo (Mastigado)

Quando o jogador clica na Amazônia no Globo 3D, a arquitetura injeta a classe respectiva e chama automaticamente o método \`start()\`. Olhe dentro do arquivo \`modulo1.js\` para entender onde o seu código deve ser alocado (procure a etiqueta \`[IMPLEMENTE AQUI]\`).

### Exemplo (O que você precisa fazer)
```javascript
    start() {
        // Abaixo da etiqueta [IMPLEMENTE AQUI], coloque algo como:
        this.container.innerHTML = \`<div class="meu-jogo">
            <h1>Meu Jogo Incrível</h1>
            <button id="btn-ganhar">Ganhar 100 pontos!</button>
        </div>\`;
        
        document.getElementById('btn-ganhar').addEventListener('click', () => {
            // Avise a Plataforma que o jogo acabou enviando true/false e a Pontuação!
            this.finishGame(true, 100);
        });
    }
```

### Regras de Ouro
1. NUNCA crie variáveis soltas fora da Classe (`var x = 1;`). Use `this` dentro do construtor ou `let` locais.
2. Todo o CSS do seu jogo deve ter classes com NOME ÚNICO pra sua área, ex: `.andre-cenario-1 { ... }`.
3. Não altere e não comite nas pastas dos seus colegas.

O sistema base está 100% pronto. Começem o show!
