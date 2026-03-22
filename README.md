# Ecoverse — Floresta do Futuro

O Ecoverse é um projeto desenvolvido para a disciplina de Sustentabilidade Ambiental. O objetivo da plataforma é integrar a técnica de Pomodoro com mini-games interativos para conscientizar sobre a preservação de ecossistemas reais, fundamentado nos Objetivos de Desenvolvimento Sustentável (ODS) da ONU.

## Como executar o projeto localmente

1. Instalar as dependências:
   `npm install`
2. Iniciar o servidor de desenvolvimento:
   `npm run dev`
3. Gerar a versão final para produção:
   `npm run build`

---

## Guia para a Professora Isadora (Manutenção e Deploy)

Professora Isadora, este projeto foi estruturado para ser uma ferramenta educacional contínua e de fácil gerenciamento pela senhora ou por futuras turmas:

### 1. Publicação do site (Deploy)
Utilizamos a plataforma Vercel para a hospedagem. O processo é simplificado:
- Realizar login na Vercel utilizando a conta do GitHub.
- Importar este repositório (Ecoverse).
- O sistema reconhecerá as configurações do Vite automaticamente. Basta clicar em "Deploy".
- Após a configuração inicial, qualquer atualização realizada aqui no GitHub será refletida no site oficial de forma automática.

### 2. Configuração de Domínio
Caso deseje utilizar um domínio personalizado (como www.ecoverse.com.br), a configuração pode ser feita sem custos adicionais de servidor na aba Settings > Domains dentro do painel da Vercel.

### 3. Gestão Colaborativa
Cada aluno foi adicionado como colaborador no repositório do GitHub. Isso permite que a equipe implemente as missões e mini-games de forma independente, garantindo que o site oficial permaneça atualizado sem a necessidade de intervenções manuais constantes.

---

## Arquitetura e Tecnologias

- Desenvolvedor Geral: Pedro Furtado
- Tecnologias Base: HTML5, CSS3 e JavaScript (ES6+).
- Visualização 3D: Biblioteca Globe.GL baseada em Three.js.
- Persistência de Dados: O progresso e as estatísticas de energia e moedas são armazenados via localStorage no navegador do usuário.

## Organização da Equipe e Módulos
O projeto utiliza uma estrutura modular localizada em `src/js/modules/minigames/`, onde cada desenvolvedor possui um arquivo isolado para implementar suas missões específicas:

- André: Missões 1 e 2
- Felipe: Missões 3 e 4
- Pedro Borges: Missões 5 e 6
- Thiago: Missões 7 e 8

Essa estrutura, concebida por Pedro Furtado, garante o isolamento do código e a integridade do sistema global durante o desenvolvimento colaborativo.

---
Projeto acadêmico de Sustentabilidade Ambiental - 2026.
