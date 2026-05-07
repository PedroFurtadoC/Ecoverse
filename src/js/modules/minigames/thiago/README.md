# Minigames do Thiago — missões 7 e 8

> Setup, contrato técnico e como testar: [`../README.md`](../README.md).

## Missão 7 — Microplástico na Grande Barreira (`modulo7.js`)

**O problema (real):** o AIMS (Australian Institute of Marine Science) registra perda de ~50% da cobertura de coral nas últimas três décadas. Microplásticos vindos de cidades costeiras se infiltram nos pólipos e bloqueiam o crescimento.

**Mecânica sugerida:**

- **Atenção e percepção** — vista microscópica. Partículas brancas e coloridas se movem na tela; algumas são plâncton (alimento dos corais), outras são microplástico. Jogador toca apenas no microplástico; tocar em plâncton perde ponto. Velocidade aumenta com o tempo.
- **Find the difference** — zoom em pólipos de coral; o jogador identifica fragmentos de plástico escondidos.

**Pontuação:**
- Sucesso: ≥ 70% de microplásticos identificados, < 3 erros em plâncton.
- Perfeito: ≥ 95% de identificação + 0 erros.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-microplastic.png`, `waste-plastic-pet.png`
- `bin-plastic.png`, `bin-trash.png`

Para sprites adicionais (corais, plâncton, fundo submarino), fale com o Pedro Furtado.

## Missão 8 — Trilhas e mineração nos Andes (`modulo8.js`)

**O problema (real):** trilhas de altitude (Inca, Huayna Picchu) acumulam toneladas de resíduo turístico por temporada. Mineração na cordilheira deixa rejeitos que contaminam nascentes — incluindo as cabeceiras do rio Amazonas.

**Mecânica sugerida:**

- **Precisão e rota** — trilha estreita (linha) por uma montanha. Jogador caminha na rota e coleta lixo dos lados sem sair da trilha (sair = ponto perdido + dano à vegetação). Tempo limite e altitude aumentam dificuldade (vento balança a trilha).
- **Cadeia de descarte** — organize o que recolheu; entregue para o ponto de coleta correto na base da montanha.

**Pontuação:**
- Sucesso: ≥ 60% do lixo coletado sem sair mais de 2× da trilha.
- Perfeito: 100% coletado, 0 saídas, tudo entregue no ponto certo.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-plastic-pet.png`, `waste-metal-can.png`, `waste-banana-peel.png`, `waste-blister.png`, `waste-glass-jar.png`
- `bin-paper.png`, `bin-plastic.png`, `bin-glass.png`, `bin-trash.png`
