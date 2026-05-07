# Minigames do Felipe — missões 3 e 4

> Setup, contrato técnico e como testar: [`../README.md`](../README.md).

## Missão 3 — Encostas da Mata Atlântica (`modulo3.js`)

**O problema (real):** a Mata Atlântica perdeu cerca de 88% da cobertura original (SOS Mata Atlântica) e abastece de água ~70% da população brasileira. Encostas urbanas com descarte irregular contaminam nascentes e provocam deslizamentos na temporada de chuva.

**Mecânica sugerida:**

- **Limpeza com timer** — vista lateral de uma encosta com nascente. Resíduos descem com a chuva; o jogador clica/toca para coletá-los antes de chegarem na água. Conforme o tempo passa, a chuva fica mais forte.
- **Puzzle de drenagem** — posicionar barreiras (lixo coletado) em pontos certos para conter o escoamento; ensina sobre prevenção de deslizamento.

**Pontuação:**
- Sucesso: > 70% dos resíduos coletados antes de tocar a nascente.
- Perfeito: 100% coletados, nenhum chegou na água.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-plastic-pet.png`, `waste-cardboard.png`, `waste-glass-jar.png`, `waste-banana-peel.png`
- `bin-paper.png`, `bin-plastic.png`, `bin-glass.png`, `bin-organic.png`, `bin-trash.png`

Para sprites adicionais (encosta, nascente, indicador de chuva), fale com o Pedro Furtado.

## Missão 4 — Manguezais de Bornéu sufocados (`modulo4.js`)

**O problema (real):** os manguezais filtram poluição costeira e absorvem 4× mais carbono que florestas terrestres por hectare. Em Bornéu, a indústria de óleo de palma e descarte urbano descontrolado os sufocam com plástico e efluentes.

**Mecânica sugerida:**

- **Puzzle de cadeia causal** — jogador conecta nós num diagrama (consumidor → embalagem → coleta → reciclagem) para "quebrar" a cadeia que leva ao manguezal. Cada nó conectado certo = ponto.
- **Defesa do mangue** — ondas trazem plástico em direção ao mangue; jogador desvia/coleta antes do impacto. Estilo tower defense simplificado.

**Pontuação:**
- Sucesso: ≥ 60% da cadeia conectada / ≥ 60% do plástico bloqueado.
- Perfeito: 100% certo / 0 plástico passou.

**Sprites em `public/assets/generated/cutouts/`:**
- `waste-plastic-pet.png`, `waste-microplastic.png`, `waste-pesticide-bottle.png`
- `bin-plastic.png`, `bin-trash.png`
