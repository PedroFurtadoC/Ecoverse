/* ========================================
   ECOVERSE - data.js  (v5 — Globe)
   Missions at real-world natural landmarks,
   pomodoro, achievements, mini-games
======================================== */

const GAME_CONFIG = {
  initialEnergy: 3,
  initialCoins: 0,
  initialImpact: 0,
  version: '5.0',
  storageKey: 'ecoverse_save_v5'
};

/* ===== POMODORO CONFIG ===== */
const POMODORO_CONFIG = {
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  rewardEnergy: 2,
  rewardCoins: 5
};

/* ===== MISSIONS — Real-world natural landmarks ===== */
const MISSIONS = [
  {
    id: 1, title: 'Floresta Amazônica',
    desc: 'Plante sementes no coração da maior floresta tropical do mundo. A Amazônia produz 20% do oxigênio da Terra.',
    location: 'Amazônia, Brasil',
    photo: 'assets/photo-amazon.jpg',
    costEnergy: 1, rewardCoins: 10, impactCO2: 0.5,
    lat: -3.4653, lng: -62.2159,
    prereqId: null, minigame: 'memory'
  },
  {
    id: 2, title: 'Bacia do Congo',
    desc: 'Irrigue mudas na segunda maior floresta tropical — lar dos gorilas-de-montanha e okapis.',
    location: 'República Dem. do Congo',
    photo: 'assets/photo-congo.jpg',
    costEnergy: 2, rewardCoins: 15, impactCO2: 0.8,
    lat: -0.7893, lng: 23.6566,
    prereqId: 1, minigame: 'quiz'
  },
  {
    id: 3, title: 'Mata Atlântica',
    desc: 'Monte um viveiro para proteger espécies endêmicas da Mata Atlântica, que já perdeu 88% de sua cobertura.',
    location: 'Mata Atlântica, Brasil',
    photo: 'assets/photo-atlantic.jpg',
    costEnergy: 2, rewardCoins: 25, impactCO2: 1.2,
    lat: -22.9519, lng: -43.2106,
    prereqId: 2, minigame: 'sorting'
  },
  {
    id: 4, title: 'Florestas de Bornéu',
    desc: 'Crie composteiras em Bornéu para restaurar solos degradados e proteger os orangotangos.',
    location: 'Bornéu, Indonésia',
    photo: 'assets/photo-borneo.jpg',
    costEnergy: 3, rewardCoins: 20, impactCO2: 1.5,
    lat: 1.8166, lng: 109.9767,
    prereqId: 3, minigame: 'memory'
  },
  {
    id: 5, title: 'Madagascar',
    desc: 'Conecte fragmentos de floresta em Madagascar para salvar lêmures e baobás únicos no mundo.',
    location: 'Madagascar',
    photo: 'assets/photo-madagascar.jpg',
    costEnergy: 3, rewardCoins: 35, impactCO2: 2.0,
    lat: -18.7669, lng: 46.8691,
    prereqId: 4, minigame: 'quiz'
  },
  {
    id: 6, title: 'Pantanal',
    desc: 'Instale câmeras no Pantanal — a maior planície alagável do planeta — para monitorar onças e araras.',
    location: 'Pantanal, Brasil',
    photo: 'assets/photo-pantanal.jpg',
    costEnergy: 4, rewardCoins: 40, impactCO2: 1.8,
    lat: -19.0907, lng: -57.6534,
    prereqId: 5, minigame: 'sorting'
  },
  {
    id: 7, title: 'Grande Barreira de Coral',
    desc: 'Estabeleça proteção permanente no ecossistema marinho mais extraordinário do planeta.',
    location: 'Queensland, Austrália',
    photo: 'assets/photo-coral.jpg',
    costEnergy: 5, rewardCoins: 60, impactCO2: 3.0,
    lat: -18.2871, lng: 147.6992,
    prereqId: 6, minigame: 'memory'
  }
];

/* ===== ACHIEVEMENTS ===== */
const ACHIEVEMENTS = [
  { id: 'first_pomodoro',   icon: '🍅', title: 'Primeiro Foco',       desc: 'Complete seu primeiro Pomodoro.',                  condition: (s) => s.pomodorosCompleted >= 1 },
  { id: 'pomo_5',           icon: '⏱️', title: 'Foco Consistente',    desc: 'Complete 5 sessões Pomodoro.',                     condition: (s) => s.pomodorosCompleted >= 5 },
  { id: 'pomo_10',          icon: '🔥', title: 'Máquina de Foco',     desc: 'Complete 10 sessões Pomodoro.',                    condition: (s) => s.pomodorosCompleted >= 10 },
  { id: 'pomo_25',          icon: '💎', title: 'Mestre do Tempo',     desc: 'Complete 25 sessões Pomodoro.',                    condition: (s) => s.pomodorosCompleted >= 25 },
  { id: 'first_mission',    icon: '🌱', title: 'Primeira Semente',    desc: 'Complete sua primeira missão.',                    condition: (s) => s.completed.length >= 1 },
  { id: 'missions_3',       icon: '🌿', title: 'Guardião Verde',      desc: 'Complete 3 missões.',                              condition: (s) => s.completed.length >= 3 },
  { id: 'all_missions',     icon: '🌍', title: 'Protetor da Terra',   desc: 'Complete todas as 7 missões ao redor do mundo.',   condition: (s) => s.completed.length >= 7 },
  { id: 'coins_50',         icon: '💰', title: 'Cofre Verde',         desc: 'Acumule 50 moedas.',                               condition: (s) => s.coins >= 50 },
  { id: 'coins_200',        icon: '🏦', title: 'Banco Ecológico',     desc: 'Acumule 200 moedas.',                              condition: (s) => s.coins >= 200 },
  { id: 'impact_5',         icon: '🌬️', title: 'Ar Mais Puro',        desc: 'Evite 5 kg de CO₂.',                              condition: (s) => s.impact >= 5 },
  { id: 'impact_10',        icon: '🏔️', title: 'Impacto Real',        desc: 'Evite 10 kg de CO₂.',                             condition: (s) => s.impact >= 10 },
  { id: 'minigame_perfect', icon: '⭐', title: 'Perfeição',           desc: 'Consiga pontuação máxima em um mini-game.',        condition: (s) => s.perfectMinigames >= 1 },
  { id: 'streak_3',         icon: '🔗', title: 'Sequência Tripla',    desc: 'Complete 3 Pomodoros sem pausa.',                  condition: (s) => s.bestStreak >= 3 }
];

/* ===== MINI-GAME CONFIG ===== */
const MINIGAME_CONFIG = {
  memory: {
    name: 'Jogo da Memória Ecológico',
    desc: 'Encontre todos os pares de espécies ameaçadas!',
    pairs: 8,
    maxMoves: 24,
    perfectMoves: 16,
    icons: [
      { emoji: '🐆', name: 'Onça-pintada' },
      { emoji: '🦜', name: 'Arara-azul' },
      { emoji: '🐢', name: 'Tartaruga-marinha' },
      { emoji: '🦋', name: 'Borboleta-monarca' },
      { emoji: '🐋', name: 'Baleia-jubarte' },
      { emoji: '🦧', name: 'Orangotango' },
      { emoji: '🐘', name: 'Elefante-africano' },
      { emoji: '🐼', name: 'Panda-gigante' },
      { emoji: '🦁', name: 'Leão-africano' },
      { emoji: '🐧', name: 'Pinguim-imperador' },
      { emoji: '🦒', name: 'Girafa' },
      { emoji: '🐊', name: 'Jacaré-do-pantanal' }
    ]
  },
  quiz: {
    name: 'Quiz Ambiental',
    desc: 'Teste seus conhecimentos sobre o meio ambiente!',
    questionsPerRound: 8,
    targetScore: 5,
    perfectScore: 8,
    timePerQuestion: 20,
    questions: [
      { q: 'Qual gás as árvores absorvem da atmosfera?', opts: ['Oxigênio', 'CO₂', 'Nitrogênio', 'Hélio'], correct: 1 },
      { q: 'Quanto % da água do planeta é doce e acessível?', opts: ['30%', '10%', '1%', '50%'], correct: 2 },
      { q: 'O que significa "biodiversidade"?', opts: ['Só plantas', 'Variedade de vida', 'Poluição', 'Clima'], correct: 1 },
      { q: 'Quantos anos um saco plástico leva para se decompor?', opts: ['5 anos', '50 anos', '200 anos', '400 anos'], correct: 3 },
      { q: 'A Amazônia ocupa quantos países?', opts: ['3', '5', '9', '2'], correct: 2 },
      { q: 'Qual é o maior recife de coral do mundo?', opts: ['Caribe', 'Mar Vermelho', 'Grande Barreira', 'Fernando de Noronha'], correct: 2 },
      { q: 'Quanto CO₂ uma árvore adulta absorve por ano?', opts: ['2 kg', '10 kg', '22 kg', '50 kg'], correct: 2 },
      { q: 'Qual bioma é a maior planície alagável do planeta?', opts: ['Cerrado', 'Pantanal', 'Caatinga', 'Pampas'], correct: 1 },
      { q: 'O desmatamento é responsável por quanto % das emissões globais?', opts: ['2%', '5%', '10%', '25%'], correct: 2 },
      { q: 'Qual animal é o maior polinizador das florestas?', opts: ['Borboleta', 'Beija-flor', 'Abelha', 'Morcego'], correct: 3 },
      { q: 'A Mata Atlântica já perdeu quantos % de sua cobertura?', opts: ['30%', '50%', '70%', '88%'], correct: 3 },
      { q: 'Quanto tempo leva para reciclar uma lata de alumínio?', opts: ['1 ano', '60 dias', '6 meses', '2 semanas'], correct: 1 },
      { q: 'Qual o principal gás do efeito estufa?', opts: ['Metano', 'CO₂', 'Ozônio', 'Nitrogênio'], correct: 1 },
      { q: 'Uma torneira pingando desperdiça quantos litros/dia?', opts: ['5L', '20L', '46L', '100L'], correct: 2 },
      { q: 'Madagascar tem quantas % de espécies endêmicas?', opts: ['30%', '50%', '70%', '90%'], correct: 3 }
    ]
  },
  sorting: {
    name: 'Reciclagem Consciente',
    desc: 'Arraste cada item para a lixeira correta!',
    duration: 45,
    targetScore: 10,
    perfectScore: 15,
    bins: [
      { id: 'organic', label: '🟤 Orgânico', color: '#8D6E63' },
      { id: 'recycle', label: '🔵 Reciclável', color: '#42A5F5' },
      { id: 'trash', label: '🔴 Rejeito', color: '#EF5350' }
    ],
    items: [
      { emoji: '🍌', name: 'Casca de banana', bin: 'organic' },
      { emoji: '🥚', name: 'Casca de ovo', bin: 'organic' },
      { emoji: '☕', name: 'Borra de café', bin: 'organic' },
      { emoji: '🥬', name: 'Folha de alface', bin: 'organic' },
      { emoji: '🍎', name: 'Caroço de maçã', bin: 'organic' },
      { emoji: '🥤', name: 'Garrafa PET', bin: 'recycle' },
      { emoji: '📦', name: 'Caixa de papelão', bin: 'recycle' },
      { emoji: '🥫', name: 'Lata de alumínio', bin: 'recycle' },
      { emoji: '📰', name: 'Jornal velho', bin: 'recycle' },
      { emoji: '🍶', name: 'Pote de vidro', bin: 'recycle' },
      { emoji: '🧴', name: 'Frasco plástico', bin: 'recycle' },
      { emoji: '🩹', name: 'Curativo usado', bin: 'trash' },
      { emoji: '🧷', name: 'Fralda descartável', bin: 'trash' },
      { emoji: '🪥', name: 'Escova de dente', bin: 'trash' },
      { emoji: '🧽', name: 'Esponja usada', bin: 'trash' },
      { emoji: '💊', name: 'Embalagem de remédio', bin: 'trash' }
    ]
  }
};

/* ===== QUIZ ODS — 17 Sustainable Development Goals ===== */
const QUIZ_ODS_DATA = [
  {
    id: 1, title: 'Erradicação da Pobreza', icon: '🏚️',
    color: '#E5243B', unlockPhase: 1, reward: 15,
    desc: 'Acabar com a pobreza em todas as suas formas, em todos os lugares.',
    questions: [
      { q: 'Quantas pessoas vivem em extrema pobreza no mundo (menos de US$ 2,15/dia)?', opts: ['100 milhões', '350 milhões', '700 milhões', '2 bilhões'], correct: 2 },
      { q: 'Qual região concentra a maior parte da pobreza extrema mundial?', opts: ['Ásia', 'América Latina', 'África Subsaariana', 'Oriente Médio'], correct: 2 },
      { q: 'O Bolsa Família é um programa de:', opts: ['Transferência de renda', 'Empréstimo bancário', 'Doação de alimentos', 'Seguro-desemprego'], correct: 0 },
      { q: 'A linha internacional de pobreza extrema é de quanto por dia?', opts: ['US$ 1,00', 'US$ 2,15', 'US$ 5,00', 'US$ 10,00'], correct: 1 },
      { q: 'Que porcentagem da população brasileira vivia abaixo da linha de pobreza em 2022?', opts: ['5%', '15%', '31%', '50%'], correct: 2 }
    ]
  },
  {
    id: 2, title: 'Fome Zero', icon: '🌾',
    color: '#DDA63A', unlockPhase: 1, reward: 15,
    desc: 'Acabar com a fome, alcançar a segurança alimentar e promover a agricultura sustentável.',
    questions: [
      { q: 'Quantas pessoas passam fome no mundo atualmente?', opts: ['100 milhões', '350 milhões', '735 milhões', '1 bilhão'], correct: 2 },
      { q: 'Quanto % dos alimentos produzidos no mundo são desperdiçados?', opts: ['10%', '20%', '30%', '50%'], correct: 2 },
      { q: 'A agricultura familiar produz quanto da comida consumida no Brasil?', opts: ['20%', '50%', '70%', '90%'], correct: 2 },
      { q: 'O que é insegurança alimentar?', opts: ['Falta de geladeira', 'Acesso limitado a alimentos', 'Comer fast food', 'Alergia alimentar'], correct: 1 },
      { q: 'Qual nutriente mais falta na dieta de crianças em situação de fome?', opts: ['Carboidrato', 'Gordura', 'Ferro e vitamina A', 'Açúcar'], correct: 2 }
    ]
  },
  {
    id: 3, title: 'Saúde e Bem-Estar', icon: '💊',
    color: '#4C9F38', unlockPhase: 1, reward: 15,
    desc: 'Assegurar uma vida saudável e promover o bem-estar para todos.',
    questions: [
      { q: 'As vacinas previnem quantas mortes por ano no mundo?', opts: ['500 mil', '2–3 milhões', '10 milhões', '20 milhões'], correct: 1 },
      { q: 'A vacina BCG protege contra qual doença?', opts: ['Gripe', 'Tuberculose', 'Sarampo', 'Poliomielite'], correct: 1 },
      { q: 'Qual doença foi erradicada graças à vacinação em massa?', opts: ['Malária', 'Tuberculose', 'Varíola', 'Dengue'], correct: 2 },
      { q: 'O SUS (Sistema Único de Saúde) do Brasil é considerado:', opts: ['Privado', 'O maior sistema público de saúde do mundo', 'Apenas para crianças', 'Regional'], correct: 1 },
      { q: 'Qual a principal causa de morte evitável em crianças menores de 5 anos?', opts: ['Acidentes', 'Pneumonia e diarreia', 'Câncer', 'Dengue'], correct: 1 }
    ]
  },
  {
    id: 4, title: 'Educação de Qualidade', icon: '📚',
    color: '#C5192D', unlockPhase: 1, reward: 15,
    desc: 'Assegurar educação inclusiva, equitativa e de qualidade para todos.',
    questions: [
      { q: 'Quantas crianças no mundo estão fora da escola?', opts: ['10 milhões', '60 milhões', '244 milhões', '500 milhões'], correct: 2 },
      { q: 'Qual país tem a maior taxa de analfabetismo do mundo?', opts: ['Brasil', 'Índia', 'Chade', 'China'], correct: 2 },
      { q: 'A educação de meninas pode reduzir a pobreza em até:', opts: ['5%', '12%', '25%', '50%'], correct: 2 },
      { q: 'Quantos anos de educação básica a ONU recomenda como mínimo?', opts: ['6 anos', '9 anos', '12 anos', '15 anos'], correct: 2 },
      { q: 'Investir em educação gera retorno econômico de quanto por dólar investido?', opts: ['US$ 2', 'US$ 5', 'US$ 10', 'US$ 15'], correct: 2 }
    ]
  },
  {
    id: 5, title: 'Igualdade de Gênero', icon: '⚧️',
    color: '#FF3A21', unlockPhase: 1, reward: 15,
    desc: 'Alcançar a igualdade de gênero e empoderar todas as mulheres e meninas.',
    questions: [
      { q: 'Mulheres ganham em média quanto a menos que homens no mundo?', opts: ['5%', '10%', '20%', '40%'], correct: 2 },
      { q: 'Em quantos países do mundo as mulheres têm direitos legais iguais aos homens?', opts: ['Todos', 'Cerca de metade', 'Menos de 10', 'Nenhum'], correct: 2 },
      { q: 'Qual o nome do movimento pela igualdade salarial entre gêneros?', opts: ['Equal Pay', 'Fair Trade', 'Green Work', 'Blue Economy'], correct: 0 },
      { q: 'Que % das cadeiras em parlamentos do mundo são ocupadas por mulheres?', opts: ['10%', '26%', '50%', '65%'], correct: 1 },
      { q: 'O casamento infantil afeta anualmente quantas meninas?', opts: ['1 milhão', '5 milhões', '12 milhões', '20 milhões'], correct: 2 }
    ]
  },
  {
    id: 6, title: 'Água Potável e Saneamento', icon: '💧',
    color: '#26BDE2', unlockPhase: 1, reward: 15,
    desc: 'Garantir disponibilidade e gestão sustentável da água e saneamento.',
    questions: [
      { q: 'Quantas pessoas não têm acesso a água potável segura?', opts: ['500 milhões', '1 bilhão', '2 bilhões', '4 bilhões'], correct: 2 },
      { q: 'Quanto % da água do planeta é doce e acessível?', opts: ['30%', '10%', '1%', '50%'], correct: 2 },
      { q: 'A falta de saneamento causa quantas mortes por ano?', opts: ['50 mil', '200 mil', '432 mil', '1 milhão'], correct: 2 },
      { q: 'O Brasil tem saneamento básico para qual % da população?', opts: ['50%', '65%', '84%', '95%'], correct: 0 },
      { q: 'Quanto litros de água uma pessoa precisa por dia no mínimo?', opts: ['5L', '20L', '50L–100L', '200L'], correct: 2 }
    ]
  },
  {
    id: 7, title: 'Energia Limpa e Acessível', icon: '⚡',
    color: '#FCC30B', unlockPhase: 2, reward: 20,
    desc: 'Assegurar acesso confiável, sustentável e moderno à energia para todos.',
    questions: [
      { q: 'Quantas pessoas no mundo não têm acesso à eletricidade?', opts: ['100 milhões', '400 milhões', '675 milhões', '1 bilhão'], correct: 2 },
      { q: 'Qual fonte de energia renovável cresce mais rápido no mundo?', opts: ['Hidrelétrica', 'Solar', 'Nuclear', 'Carvão'], correct: 1 },
      { q: 'O Brasil gera que % da sua energia de fontes renováveis?', opts: ['30%', '50%', '83%', '95%'], correct: 2 },
      { q: 'Qual combustível fóssil é o mais poluente?', opts: ['Gás natural', 'Petróleo', 'Carvão mineral', 'Etanol'], correct: 2 },
      { q: 'A energia eólica usa qual recurso natural?', opts: ['Sol', 'Água', 'Vento', 'Calor da Terra'], correct: 2 }
    ]
  },
  {
    id: 8, title: 'Trabalho Decente', icon: '💼',
    color: '#A21942', unlockPhase: 2, reward: 20,
    desc: 'Promover crescimento econômico sustentado, inclusivo e emprego para todos.',
    questions: [
      { q: 'Quantos jovens no mundo estão desempregados?', opts: ['30 milhões', '70 milhões', '160 milhões', '300 milhões'], correct: 2 },
      { q: 'O que é trabalho infantil?', opts: ['Ajudar na escola', 'Trabalho que prejudica o desenvolvimento da criança', 'Estágio remunerado', 'Voluntariado'], correct: 1 },
      { q: 'Quantas crianças são vítimas de trabalho infantil no mundo?', opts: ['10 milhões', '50 milhões', '160 milhões', '300 milhões'], correct: 2 },
      { q: 'A economia verde pode criar quantos empregos até 2030?', opts: ['5 milhões', '24 milhões', '60 milhões', '100 milhões'], correct: 2 },
      { q: 'O que significa PIB?', opts: ['Programa de Investimento Brasileiro', 'Produto Interno Bruto', 'Plano Internacional Bancário', 'Projeto de Inclusão Básica'], correct: 1 }
    ]
  },
  {
    id: 9, title: 'Indústria e Inovação', icon: '🏭',
    color: '#FD6925', unlockPhase: 2, reward: 20,
    desc: 'Construir infraestruturas resilientes, promover a industrialização inclusiva e fomentar a inovação.',
    questions: [
      { q: 'Que % da população mundial tem acesso à internet?', opts: ['30%', '50%', '63%', '90%'], correct: 2 },
      { q: 'Qual setor mais investe em pesquisa e desenvolvimento?', opts: ['Agricultura', 'Tecnologia', 'Turismo', 'Moda'], correct: 1 },
      { q: 'A infraestrutura de transporte impacta diretamente:', opts: ['Apenas o turismo', 'O acesso a saúde e educação', 'Nada relevante', 'Apenas as empresas'], correct: 1 },
      { q: 'Países de baixa renda investem quanto do PIB em pesquisa?', opts: ['Menos de 1%', '3%', '5%', '10%'], correct: 0 },
      { q: 'O 5G pode aumentar a produtividade industrial em até:', opts: ['5%', '15%', '30%', '50%'], correct: 2 }
    ]
  },
  {
    id: 10, title: 'Redução das Desigualdades', icon: '⚖️',
    color: '#DD1367', unlockPhase: 2, reward: 20,
    desc: 'Reduzir a desigualdade dentro dos países e entre eles.',
    questions: [
      { q: 'Os 1% mais ricos do mundo possuem que % da riqueza global?', opts: ['15%', '30%', '46%', '70%'], correct: 2 },
      { q: 'O Índice de Gini mede:', opts: ['Poluição', 'Desigualdade', 'Educação', 'Saúde'], correct: 1 },
      { q: 'O Brasil está em qual posição no ranking de desigualdade?', opts: ['Entre os 20 mais iguais', 'Média mundial', 'Entre os 10 mais desiguais', 'O mais desigual'], correct: 2 },
      { q: 'As desigualdades raciais no Brasil afetam mais:', opts: ['População branca', 'População negra e indígena', 'Imigrantes europeus', 'Não existem'], correct: 1 },
      { q: 'Quantos refugiados existem no mundo?', opts: ['10 milhões', '36 milhões', '50 milhões', '100 milhões'], correct: 1 }
    ]
  },
  {
    id: 11, title: 'Cidades Sustentáveis', icon: '🏙️',
    color: '#FD9D24', unlockPhase: 2, reward: 20,
    desc: 'Tornar as cidades e os assentamentos humanos inclusivos, seguros e sustentáveis.',
    questions: [
      { q: 'Que porcentagem da população mundial vive em cidades?', opts: ['30%', '45%', '56%', '75%'], correct: 2 },
      { q: 'As cidades são responsáveis por quanto % das emissões de CO₂?', opts: ['20%', '40%', '70%', '90%'], correct: 2 },
      { q: 'O que é mobilidade urbana sustentável?', opts: ['Mais carros', 'Transporte eficiente e limpo', 'Sem transporte', 'Apenas avião'], correct: 1 },
      { q: 'Quantas pessoas vivem em favelas no mundo?', opts: ['100 milhões', '500 milhões', '1 bilhão', '2 bilhões'], correct: 2 },
      { q: 'Áreas verdes nas cidades ajudam a reduzir a temperatura em até:', opts: ['1°C', '3°C', '5°C', '10°C'], correct: 2 }
    ]
  },
  {
    id: 12, title: 'Consumo Responsável', icon: '♻️',
    color: '#BF8B2E', unlockPhase: 2, reward: 20,
    desc: 'Assegurar padrões de produção e de consumo sustentáveis.',
    questions: [
      { q: 'A indústria da moda é a 2ª mais poluidora do mundo. Quanto % da água industrial ela consome?', opts: ['5%', '10%', '20%', '30%'], correct: 2 },
      { q: 'O que é economia circular?', opts: ['Gastar em círculos', 'Reutilizar e reciclar ao máximo', 'Comprar muito barato', 'Investir em ações'], correct: 1 },
      { q: 'Cada brasileiro gera em média quantos kg de lixo por dia?', opts: ['0,3 kg', '1 kg', '3 kg', '5 kg'], correct: 1 },
      { q: 'Quanto tempo um plástico leva para se decompor?', opts: ['10 anos', '50 anos', '200 anos', '400+ anos'], correct: 3 },
      { q: 'A obsolescência programada significa:', opts: ['Produtos feitos para durar', 'Produtos projetados para quebrar', 'Reciclagem obrigatória', 'Consumo consciente'], correct: 1 }
    ]
  },
  {
    id: 13, title: 'Ação Contra a Mudança do Clima', icon: '🌡️',
    color: '#3F7E44', unlockPhase: 3, reward: 25,
    desc: 'Tomar medidas urgentes para combater a mudança do clima e seus impactos.',
    questions: [
      { q: 'Qual o principal gás causador do efeito estufa?', opts: ['Oxigênio', 'CO₂', 'Hélio', 'Hidrogênio'], correct: 1 },
      { q: 'O Acordo de Paris visa limitar o aquecimento global a:', opts: ['0,5°C', '1,5°C', '3°C', '5°C'], correct: 1 },
      { q: 'A temperatura média da Terra já subiu quanto desde a era pré-industrial?', opts: ['0,3°C', '0,7°C', '1,1°C', '2°C'], correct: 2 },
      { q: 'Qual setor mais emite gases de efeito estufa?', opts: ['Transporte', 'Energia e eletricidade', 'Agricultura', 'Indústria têxtil'], correct: 1 },
      { q: 'O derretimento das calotas polares pode elevar o nível do mar em até:', opts: ['10 cm', '50 cm', '1 metro', '65 metros'], correct: 3 }
    ]
  },
  {
    id: 14, title: 'Vida na Água', icon: '🐟',
    color: '#0A97D9', unlockPhase: 3, reward: 25,
    desc: 'Conservar e usar de forma sustentável os oceanos, mares e recursos marinhos.',
    questions: [
      { q: 'Quanto % do oxigênio que respiramos vem dos oceanos?', opts: ['10%', '30%', '50%', '70%'], correct: 2 },
      { q: 'Quantas toneladas de plástico vão para os oceanos por ano?', opts: ['100 mil', '1 milhão', '8 milhões', '50 milhões'], correct: 2 },
      { q: 'Até que ano os oceanos podem ter mais plástico que peixes?', opts: ['2030', '2040', '2050', '2100'], correct: 2 },
      { q: 'Os corais abrigam que porcentagem da vida marinha?', opts: ['5%', '10%', '25%', '50%'], correct: 2 },
      { q: 'A sobrepesca já ameaça quantas % das espécies de peixes?', opts: ['10%', '20%', '34%', '50%'], correct: 2 }
    ]
  },
  {
    id: 15, title: 'Vida Terrestre', icon: '🌳',
    color: '#56C02B', unlockPhase: 3, reward: 25,
    desc: 'Proteger, recuperar e promover o uso sustentável dos ecossistemas terrestres.',
    questions: [
      { q: 'Quantas espécies estão ameaçadas de extinção no mundo?', opts: ['5 mil', '15 mil', '28 mil', '44 mil'], correct: 3 },
      { q: 'A cada minuto, quanto de floresta tropical é derrubada?', opts: ['1 campo de futebol', '5 campos', '27 campos', '50 campos'], correct: 2 },
      { q: 'A Amazônia contém que porcentagem da biodiversidade do planeta?', opts: ['5%', '10%', '20%', '30%'], correct: 1 },
      { q: 'O desmatamento contribui com quanto % das emissões globais?', opts: ['2%', '5%', '10%', '20%'], correct: 2 },
      { q: 'Quantas árvores são cortadas por ano no mundo?', opts: ['1 bilhão', '5 bilhões', '15 bilhões', '30 bilhões'], correct: 2 }
    ]
  },
  {
    id: 16, title: 'Paz, Justiça e Instituições', icon: '🕊️',
    color: '#00689D', unlockPhase: 3, reward: 25,
    desc: 'Promover sociedades pacíficas e inclusivas com acesso à justiça para todos.',
    questions: [
      { q: 'Quantas pessoas no mundo não possuem registro de nascimento?', opts: ['50 milhões', '250 milhões', '1 bilhão', '2 bilhões'], correct: 2 },
      { q: 'A corrupção custa à economia global quanto por ano?', opts: ['US$ 100 bilhões', 'US$ 500 bilhões', 'US$ 2,6 trilhões', 'US$ 10 trilhões'], correct: 2 },
      { q: 'O que é a Declaração Universal dos Direitos Humanos?', opts: ['Lei brasileira', 'Documento da ONU de 1948', 'Constituição americana', 'Tratado comercial'], correct: 1 },
      { q: 'Quantos conflitos armados ativos existem no mundo?', opts: ['5', '15', '30+', '100+'], correct: 2 },
      { q: 'O acesso à justiça é negado a que % da população mundial?', opts: ['10%', '25%', '40%', '55%'], correct: 2 }
    ]
  },
  {
    id: 17, title: 'Parcerias pelos Objetivos', icon: '🤝',
    color: '#19486A', unlockPhase: 3, reward: 25,
    desc: 'Fortalecer os meios de implementação e revitalizar a parceria global para o desenvolvimento sustentável.',
    questions: [
      { q: 'Quantos países adotaram os ODS da ONU?', opts: ['50', '100', '150', '193'], correct: 3 },
      { q: 'Em que ano os ODS devem ser alcançados?', opts: ['2025', '2030', '2040', '2050'], correct: 1 },
      { q: 'Quantos Objetivos de Desenvolvimento Sustentável existem?', opts: ['10', '15', '17', '20'], correct: 2 },
      { q: 'Qual organização criou os ODS?', opts: ['OMS', 'UNESCO', 'ONU', 'Greenpeace'], correct: 2 },
      { q: 'A cooperação internacional ajuda países em desenvolvimento através de:', opts: ['Apenas dinheiro', 'Tecnologia e conhecimento', 'Armas', 'Nada relevante'], correct: 1 }
    ]
  }
];

const TIPS = [
  '🍅 Use o Pomodoro para ganhar energia e desbloquear missões!',
  '🌍 Viaje pelo mundo e proteja ecossistemas reais.',
  '💧 A água é o recurso mais precioso.',
  '🌳 Uma árvore absorve ~22kg de CO₂/ano.',
  '🦋 Biodiversidade é sinônimo de saúde ambiental.',
  '♻️ Reciclar 1 tonelada de papel salva 17 árvores.',
  '🐝 Abelhas polinizam 75% das nossas culturas.',
  '🏆 Complete Pomodoros para desbloquear conquistas!',
  '🗺️ Arraste o globo para explorar os pontos de missão.'
];

const ASSET_LIST = [
  'assets/loading-bg.svg','assets/logo.svg',
  'assets/node-locked.svg','assets/node-available.svg','assets/node-complete.svg',
  'assets/pin-shadow.svg','assets/cloud-1.svg','assets/cloud-2.svg',
  'assets/leaf-particle.svg','assets/icon-seed.svg','assets/icon-coin.svg',
  'assets/icon-impact.svg','assets/icon-menu.svg','assets/icon-donate.svg',
  'assets/icon-timer.svg','assets/icon-trophy.svg',
  'assets/earth-texture.jpg'
];

export { GAME_CONFIG, POMODORO_CONFIG, MISSIONS, ACHIEVEMENTS, MINIGAME_CONFIG, QUIZ_ODS_DATA, TIPS, ASSET_LIST };
