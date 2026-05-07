# Minigames do André — missões 1 e 2

> Setup, contrato técnico e como testar: [`../README.md`](../README.md).

## Missão 1 — Plásticos no rio Amazonas (`modulo1.js`)

**O problema (real):** comunidades ribeirinhas convivem com plástico que desce com as cheias e ameaça botos, pirarucus e a pesca artesanal. O rio Amazonas e seus afluentes recebem toneladas de resíduo de centros urbanos como Manaus.

**Mecânica sugerida (escolha o que combinar com o que você gosta de fazer):**

- **Coleta com canoa** — jogador controla uma canoa que desce o rio. Resíduos vêm na correnteza; coleta o lixo, evita peixes nativos. Cronômetro de 45–60 segundos. Score = lixo coletado − peixes machucados.
- **Triagem rápida** — imagens de objetos passam pela tela e o jogador decide "lixo do rio" vs "vida nativa" antes do tempo acabar.

**Pontuação:**
- Sucesso: ≥ 60% de lixo coletado sem machucar mais de 2 peixes.
- Perfeito: 100% de lixo + 0 peixes machucados.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-plastic-pet.png`, `waste-paper-newspaper.png`, `waste-cardboard.png`, `waste-fishing-net.png`, `waste-microplastic.png`
- `bin-paper.png`, `bin-plastic.png`, `bin-trash.png`

Para sprites adicionais (canoa, peixes, fundo do rio), fale com o Pedro Furtado.

## Missão 2 — Lixo eletrônico no Congo (`modulo2.js`)

**O problema (real):** o Global E-waste Monitor 2024 (UNU/ITU) reporta 62 milhões de toneladas de e-waste por ano no mundo, com apenas 22% formalmente reciclados. Parte é exportada ilegalmente para a Bacia do Congo, onde gambiarras de triagem liberam mercúrio e chumbo no solo.

**Mecânica sugerida:**

- **Triagem por categoria** — chega um item eletrônico (smartphone quebrado, placa, bateria). Jogador arrasta para uma de 3 lixeiras: "Reciclável" (metais, cabos), "Tóxico" (baterias, telas) ou "Reuso" (peças funcionais). Tempo limite por item.
- **Linha de produção** — itens aparecem em esteira; o jogador clica/toca rapidamente na lixeira certa antes do item cair fora.

**Pontuação:**
- Sucesso: 70% de acertos.
- Perfeito: 100% de acertos sem timeouts.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-smartphone.png`, `waste-circuit-board.png`, `waste-battery.png`
- `bin-trash.png`, `bin-metal.png`, `bin-plastic.png`
