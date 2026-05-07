# Minigames do Pedro Borges — missões 5 e 6

> Setup, contrato técnico e como testar: [`../README.md`](../README.md).

## Missão 5 — Pesca-fantasma em Madagascar (`modulo5.js`)

**O problema (real):** estimativas da Global Ghost Gear Initiative apontam ~640 mil toneladas de redes de pesca abandonadas no oceano por ano. No Canal de Moçambique, tartarugas, dugongos e tubarões em estado crítico ficam presos.

**Mecânica sugerida:**

- **Resgate com tempo** — vista subaquática. Animais aparecem presos em redes; jogador toca para libertar (mantém pressionado por X segundos por animal). Em paralelo, novas redes aparecem — ele precisa também coletá-las antes que prendam outros animais.
- **Quick-time event** — cada animal preso é uma sequência de toques rápidos para libertar.

**Pontuação:**
- Sucesso: ≥ 70% dos animais libertados.
- Perfeito: 100% libertados + 100% das redes coletadas.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-fishing-net.png`, `waste-microplastic.png`, `waste-plastic-pet.png`
- `bin-plastic.png`, `bin-trash.png`

Para tartaruga, dugongo, peixes — use emojis temporariamente (🐢 🐬 🐟) e fale com o Pedro Furtado para gerar sprites próprios.

## Missão 6 — Resíduos e fogo no Pantanal (`modulo6.js`)

**O problema (real):** em 2020, ~30% do Pantanal queimou (MapBiomas / WWF-Brasil). Embalagens de agrotóxico, palhada agrícola e descarte irregular viram combustível das queimadas na estação seca. O bioma é o maior alagado contínuo do planeta.

**Mecânica sugerida:**

- **Gerenciamento de tempo** — mapa do Pantanal com pontos críticos. Jogador escolhe a ordem de "coleta + descarte correto" antes que cada ponto pegue fogo. Cronômetro pressiona.
- **Card-drafting** — 5 cartas/turno (tipo de descarte), jogador escolhe 2 para aplicar; objetivo é manter o índice de risco abaixo de X.

**Pontuação:**
- Sucesso: nenhuma área crítica queimou.
- Perfeito: nenhuma queimada + tempo sobrando.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-pesticide-bottle.png`, `waste-cardboard.png`, `waste-coffee-grounds.png`, `waste-banana-peel.png`
- `bin-organic.png`, `bin-trash.png`
