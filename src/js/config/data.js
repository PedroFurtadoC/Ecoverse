// Configuração base, missões, conquistas e quizzes do Ecoverse.
// Toda alteração de conteúdo factual precisa de fonte oficial citada
// em comentário inline (ONU, IBGE, MMA, IPCC, OMS, FAO, MapBiomas).

// Estado inicial do jogador. A energia começa pequena de propósito: o jogador
// ganha mais energia completando sessões de Pomodoro, o que conecta a mecânica
// de foco real à progressão das missões.
const GAME_CONFIG = {
  initialEnergy: 3,
  initialCoins: 0,
  initialImpact: 0,
  version: '6.0',
  storageKey: 'ecoverse_save_v6'
};

// Pomodoro: ciclos de 25 min foco / 5 min pausa, longa de 15 min a cada 4 sessões.
const POMODORO_CONFIG = {
  workDuration: 25 * 60,
  breakDuration: 5 * 60,
  longBreakDuration: 15 * 60,
  longBreakInterval: 4,
  rewardEnergy: 2,
  rewardCoins: 5
};

// Missões no globo. Cada uma referencia um local real e um problema concreto
// de resíduos naquele bioma. Estatísticas com fonte oficial citada inline.
const MISSIONS = [
  {
    id: 1, title: 'Plásticos no rio Amazonas',
    // Resíduo flutuante na bacia amazônica: estudo Reis et al. (2021) e UNEP
    // Litter Outlook documentaram acúmulo significativo de plástico em
    // igarapés próximos a centros urbanos como Manaus.
    desc: 'Comunidades ribeirinhas convivem com resíduos plásticos que descem com as cheias e ameaçam botos, pirarucus e a pesca artesanal. Recolha o lixo antes que ele chegue ao igarapé.',
    location: 'Amazônia, Brasil',
    photo: 'assets/photo-amazon-river.png',
    costEnergy: 1, rewardCoins: 10, impactCO2: 0.5,
    lat: -3.4653, lng: -62.2159,
    prereqId: null, minigame: 'andre_1'
  },
  {
    id: 2, title: 'Lixo eletrônico na África Central',
    // Global E-waste Monitor 2024 (UNU/ITU): 62 milhões de toneladas de e-waste
    // por ano no mundo, apenas 22% formalmente recicladas; parte é exportada
    // ilegalmente para países da África Central.
    desc: 'Contêineres de eletrônicos descartados da Europa e da Ásia chegam à Bacia do Congo e contaminam o solo com mercúrio e chumbo. Separe o que tem valor reciclável do que exige descarte especial.',
    location: 'República Dem. do Congo',
    photo: 'assets/photo-congo.jpg',
    costEnergy: 2, rewardCoins: 15, impactCO2: 0.8,
    lat: -0.7893, lng: 23.6566,
    prereqId: 1, minigame: 'andre_2'
  },
  {
    id: 3, title: 'Encostas e nascentes da Mata Atlântica',
    // SOS Mata Atlântica: bioma já perdeu ~88% da cobertura original e
    // abastece de água ~70% da população brasileira. Descarte irregular
    // em encostas urbanas é principal fonte de contaminação de nascentes.
    desc: 'A Mata Atlântica fornece água para 7 em cada 10 brasileiros, mas suas encostas viraram lixões irregulares. Limpe as nascentes antes que o resíduo chegue ao rio.',
    location: 'Mata Atlântica, Brasil',
    photo: 'assets/photo-waterfall.jpg',
    costEnergy: 2, rewardCoins: 25, impactCO2: 1.2,
    lat: -22.9519, lng: -43.2106,
    prereqId: 2, minigame: 'felipe_1'
  },
  {
    id: 4, title: 'Manguezais de Bornéu sufocados',
    // WWF Indonesia / UNEP Mangrove Forest Outlook: manguezais filtram
    // poluição costeira, mas estão entre os ecossistemas mais ameaçados
    // por plástico urbano e efluentes da indústria de óleo de palma.
    desc: 'Os manguezais de Bornéu filtram poluentes e protegem a costa, mas estão sufocados por plástico vindo da indústria de óleo de palma. Identifique a cadeia de descarte e proteja os mangues.',
    location: 'Bornéu, Indonésia',
    photo: 'assets/photo-borneo.jpg',
    costEnergy: 3, rewardCoins: 28, impactCO2: 1.5,
    lat: 1.8166, lng: 109.9767,
    prereqId: 3, minigame: 'felipe_2'
  },
  {
    id: 5, title: 'Pesca-fantasma em Madagascar',
    // World Animal Protection / Global Ghost Gear Initiative: ~640 mil
    // toneladas de redes de pesca abandonadas no oceano por ano matam
    // tartarugas, dugongos e tubarões em estado crítico no canal de Moçambique.
    desc: 'Tartarugas-marinhas e dugongos morrem presos em redes de pesca abandonadas no Canal de Moçambique. Solte os animais e recolha o equipamento-fantasma.',
    location: 'Madagascar',
    photo: 'assets/photo-madagascar.jpg',
    costEnergy: 3, rewardCoins: 35, impactCO2: 2.0,
    lat: -18.7669, lng: 46.8691,
    prereqId: 4, minigame: 'pedro_b_1'
  },
  {
    id: 6, title: 'Resíduos e fogo no Pantanal',
    // MapBiomas / WWF-Brasil (2020): 30% do Pantanal queimou em 2020.
    // Embalagens de agrotóxico e palhada acumulada são combustível recorrente
    // para incêndios na estação seca.
    desc: 'Em 2020, 30% do Pantanal queimou. Embalagens de agrotóxico e palhada acumulada viram combustível das queimadas — organize o descarte antes do fogo.',
    location: 'Pantanal, Brasil',
    photo: 'assets/photo-pantanal.jpg',
    costEnergy: 4, rewardCoins: 40, impactCO2: 2.4,
    lat: -19.0907, lng: -57.6534,
    prereqId: 5, minigame: 'pedro_b_2'
  },
  {
    id: 7, title: 'Microplástico na Grande Barreira',
    // AIMS (Australian Institute of Marine Science): cerca de 50% da
    // cobertura de coral foi perdida nas últimas três décadas; microplástico
    // de cidades costeiras se infiltra nos pólipos e bloqueia o crescimento.
    desc: 'Microplásticos vindos de cidades costeiras entram nos pólipos de coral e travam o crescimento do recife. Distinga partícula de plâncton real e proteja o que sobrou.',
    location: 'Queensland, Austrália',
    photo: 'assets/photo-coral.jpg',
    costEnergy: 5, rewardCoins: 60, impactCO2: 3.0,
    lat: -18.2871, lng: 147.6992,
    prereqId: 6, minigame: 'thiago_1'
  },
  {
    id: 8, title: 'Trilhas e mineração nos Andes',
    // ICIMOD e estudos de turismo de altitude: trilhas como Inca e Huayna
    // Picchu acumulam toneladas de resíduos por temporada; mineração na
    // cordilheira deixa rejeitos que contaminam nascentes do rio Amazonas.
    desc: 'Trilhas turísticas e atividade mineira deixam rejeitos que contaminam as nascentes do rio Amazonas. Recolha o lixo da rota sem sair do caminho marcado.',
    location: 'Andes, Peru',
    photo: 'assets/photo-andes.jpg',
    costEnergy: 5, rewardCoins: 75, impactCO2: 3.5,
    lat: -13.1631, lng: -72.5450,
    prereqId: 7, minigame: 'thiago_2'
  }
];

// Conquistas: nomes que ensinam um conceito enquanto recompensam.
const ACHIEVEMENTS = [
  { id: 'first_pomodoro',   icon: '🍅', title: 'Primeira Sessão',     desc: 'Complete seu primeiro Pomodoro.',                              condition: (s) => s.pomodorosCompleted >= 1 },
  { id: 'pomo_5',           icon: '⏱️', title: 'Foco Consistente',    desc: 'Complete 5 sessões de Pomodoro.',                              condition: (s) => s.pomodorosCompleted >= 5 },
  { id: 'pomo_10',          icon: '🔥', title: 'Máquina de Foco',     desc: 'Complete 10 sessões de Pomodoro.',                             condition: (s) => s.pomodorosCompleted >= 10 },
  { id: 'pomo_25',          icon: '💎', title: 'Mestre do Tempo',     desc: 'Complete 25 sessões de Pomodoro.',                             condition: (s) => s.pomodorosCompleted >= 25 },
  { id: 'streak_3',         icon: '🔗', title: 'Sequência Tripla',    desc: 'Complete 3 Pomodoros consecutivos sem reset.',                 condition: (s) => s.bestStreak >= 3 },
  { id: 'first_mission',    icon: '🌱', title: 'Primeiro Passo',      desc: 'Complete sua primeira missão.',                                condition: (s) => s.completed.length >= 1 },
  { id: 'missions_3',       icon: '🌿', title: 'Mão na Massa',        desc: 'Complete 3 missões de combate aos resíduos.',                  condition: (s) => s.completed.length >= 3 },
  { id: 'logistics_5',      icon: '🔄', title: 'Logística Reversa',   desc: 'Complete 5 missões — feche o ciclo dos resíduos.',             condition: (s) => s.completed.length >= 5 },
  { id: 'all_missions',     icon: '🌍', title: 'Mundo em Equilíbrio', desc: 'Complete todas as 8 missões ao redor do mundo.',               condition: (s) => s.completed.length >= 8 },
  { id: 'minigame_perfect', icon: '⭐', title: 'Triagem Perfeita',    desc: 'Atinja pontuação máxima em um minigame.',                      condition: (s) => s.perfectMinigames >= 1 },
  { id: 'separates_3',      icon: '♻️', title: 'Triagem Mestre',     desc: 'Faça pontuação máxima em 3 minigames de triagem.',             condition: (s) => s.perfectMinigames >= 3 },
  { id: 'coins_50',         icon: '💰', title: 'Cofre Verde',         desc: 'Acumule 50 moedas.',                                           condition: (s) => s.coins >= 50 },
  { id: 'coins_200',        icon: '🏦', title: 'Banco Ecológico',     desc: 'Acumule 200 moedas.',                                          condition: (s) => s.coins >= 200 },
  { id: 'impact_5',         icon: '🌬️', title: 'Ar Mais Puro',        desc: 'Evite 5 kg de CO₂ pelas suas missões.',                       condition: (s) => s.impact >= 5 },
  { id: 'impact_10',        icon: '🏔️', title: 'Impacto Real',        desc: 'Evite 10 kg de CO₂ pelas suas missões.',                      condition: (s) => s.impact >= 10 },
  { id: 'egg_triagem',      icon: '🥚', title: 'Caçador de Easter Egg', desc: 'Você achou o minigame escondido — triagem relâmpago em 60 segundos. Bem-vindo ao clube.', hint: 'Três letras escondidas no nome do jogo (digite no teclado), ou três toques rápidos no contador de missões.', condition: (s) => s.eggCompleted === true, secret: true }
];

// Quizzes ODS — 17 Objetivos de Desenvolvimento Sustentável (ONU, Agenda 2030).
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

// Dicas exibidas durante o loading. Estatísticas com fonte oficial.
const TIPS = [
  '🍅 Cada Pomodoro completo gera energia para enfrentar uma nova missão.',
  '♻️ Reciclar uma tonelada de papel poupa 17 árvores e milhares de litros de água. (CEMPRE)',
  '🛒 Cada brasileiro produz cerca de 1 kg de resíduo por dia. (ABRELPE 2023)',
  '🥤 Uma garrafa PET leva mais de 400 anos para se decompor no ambiente. (UNEP)',
  '📱 O mundo gera 62 milhões de toneladas de lixo eletrônico por ano — só 22% são formalmente reciclados. (UN E-waste Monitor 2024)',
  '🌊 Cerca de 8 milhões de toneladas de plástico chegam aos oceanos a cada ano. (UNEP)',
  '🥫 Reciclar uma lata de alumínio economiza 95% da energia de produzir uma nova. (CEMPRE)',
  '🍎 Aproximadamente 1/3 dos alimentos produzidos no mundo viram desperdício. (FAO)',
  '🗺️ Arraste o globo para explorar os locais e iniciar uma missão.'
];

const ASSET_LIST = [
  'assets/logo.svg',
  'assets/icon-seed.svg','assets/icon-coin.svg',
  'assets/icon-impact.svg','assets/icon-menu.svg','assets/icon-donate.svg',
  'assets/icon-timer.svg','assets/icon-trophy.svg',
  'assets/earth-texture.jpg'
];

// Equipe que fez o projeto. As fotos vivem em `public/assets/team/`.
// `github`, `linkedin` e `portfolio` são opcionais — campos `null` simplesmente
// não renderizam o link na card.
const TEAM = [
  {
    name: 'Pedro Furtado Cunha',
    role: 'Arquitetura, integração e UX',
    photo: 'assets/team/pedro.jpg',
    github: 'https://github.com/PedroFurtadoC',
    linkedin: null,
    portfolio: null
  },
  {
    name: 'André Fernando Machado',
    role: 'Missões 1 e 2: Amazônia e Congo',
    photo: 'assets/team/andre.jpg',
    github: 'https://github.com/AndreFernandoM',
    linkedin: null,
    portfolio: null
  },
  {
    name: 'Felipe Pegoraro',
    role: 'Missões 3 e 4: Mata Atlântica e Bornéu',
    photo: 'assets/team/felipe.jpg',
    github: 'https://github.com/felipepegoraro',
    linkedin: null,
    portfolio: null
  },
  {
    name: 'Pedro Casaroti',
    role: 'Missões 5 e 6: Madagascar e Pantanal',
    photo: 'assets/team/pedro_borges.jpg',
    github: 'https://github.com/pbcz1k4',
    linkedin: null,
    portfolio: null
  },
  {
    name: 'Thiago Siena',
    role: 'Missões 7 e 8: Grande Barreira e Andes',
    photo: 'assets/team/thiago.jpg',
    github: 'https://github.com/thiagosiena',
    linkedin: null,
    portfolio: null
  }
];

export { GAME_CONFIG, POMODORO_CONFIG, MISSIONS, ACHIEVEMENTS, QUIZ_ODS_DATA, TIPS, ASSET_LIST, TEAM };
