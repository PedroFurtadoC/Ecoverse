# 🌍 Ecoverse — Floresta do Futuro

O **Ecoverse** é uma plataforma educacional interativa que utiliza a técnica de Pomodoro e mini-games para engajar estudantes na preservação de ecossistemas reais e no aprendizado sobre os **Objetivos de Desenvolvimento Sustentável (ODS)** da ONU.

## 🚀 Como Iniciar (Desenvolvimento)

1. **Instale as dependências:**  
   `npm install`
2. **Inicie o servidor local:**  
   `npm run dev`
3. **Build para produção:**  
   `npm run build`

---

## 👩‍🏫 Guia para a Professora (Manutenção e Deploy)

Este projeto foi construído para ser **perpétuo, gratuito e de fácil manutenção**. Abaixo, os passos para garantir que o Ecoverse continue online e funcional para futuras turmas:

### 1. Como manter o site no ar (Deploy)
Recomendamos o uso da **Vercel** (ou Netlify). 
- Faça login na Vercel com sua conta GitHub.
- Clique em "Add New" -> "Project".
- Selecione este repositório (`Ecoverse`).
- A Vercel detectará automaticamente as configurações do **Vite**. Clique em "Deploy".
- **Pronto!** A partir de agora, qualquer alteração no código feita pelos alunos colaboradores atualizará o site automaticamente.

### 2. Domínio Próprio
Se desejar comprar um domínio (ex: `www.ecoverse.com.br`), você pode adicioná-lo gratuitamente na aba **Settings > Domains** dentro do painel da Vercel. Não há custos de hospedagem no plano Hobby.

### 3. Colaboração
Os alunos devem ser adicionados como "Collaborators" no repositório do GitHub. Isso permite que eles enviem suas atualizações de mini-games diretamente para a branch principal, mantendo o site sempre atualizado sem intervenção manual.

---

## 🛠️ Arquitetura do Projeto

- **Frontend:** HTML5, CSS3 (Vanilla), JavaScript (ES6+).
- **Globo 3D:** [Globe.GL](https://globe.gl/) (Three.js).
- **Build Tool:** Vite.
- **Estado:** Gerenciado via `localStorage` (o progresso do aluno é salvo no próprio navegador).

## 👥 Equipe e Módulos
O projeto está dividido de forma que cada desenvolvedor possui seu próprio arquivo isolado em `src/js/modules/minigames/`, evitando conflitos de código.

---
*Projeto acadêmico focado em Sustentabilidade Ambiental.*
