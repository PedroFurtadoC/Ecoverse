# Sprites com fundo removido

Os PNGs nesta pasta são as versões **sem fundo** (com canal alfa real) dos sprites em `../originals/`. Cada arquivo aqui mantém **o mesmo nome** do correspondente em `originals/`.

## Como gerar

1. Abra o original em `../originals/<nome>.png` no GIMP (ou Photoshop, Figma, etc.).
2. Use **Color → Color to Alpha** (GIMP) ou **Magic Wand + Delete** com tolerância adequada para remover o fundo branco/cinza.
3. Refine bordas se necessário (Selection → Feather, ou Layer → Mask → Refine).
4. Exporte como PNG mantendo a transparência.
5. Salve aqui em `cutouts/` com **exatamente o mesmo nome** do original.

## Convenção de nomenclatura

```
originals/bin-paper.png   →   cutouts/bin-paper.png
originals/waste-pet.png   →   cutouts/waste-pet.png
```

## Por que duas pastas

- **`originals/`** preserva a versão completa com fundo, útil para reprocessar caso a remoção precise ser refeita.
- **`cutouts/`** é o que o jogo realmente importa (são esses PNGs que aparecem nos minigames sobre o fundo do tema).
