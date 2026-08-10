# Documentação

Seis documentos, cada um com um leitor em mente.

## Para quem vai assumir o projeto

**[Ecoverse - Transferência do projeto.docx](./Ecoverse%20-%20Transferencia%20do%20projeto.docx)**

O que muda de mãos, como transferir cada serviço, quanto custa manter, o que roda sozinho e o que precisa de gente. A seção de pontos de atenção lista as limitações conhecidas com o caminho de solução de cada uma.

**[Ecoverse - Bateria de testes.docx](./Ecoverse%20-%20Bateria%20de%20testes.docx)**

Roteiro de 27 testes para confirmar que a plataforma está funcionando por inteiro. Leva cerca de quarenta minutos e não exige ter participado do desenvolvimento. Vale rodar antes de cada semestre novo.

**[Ecoverse - Anexo de diagramas.docx](./Ecoverse%20-%20Anexo%20de%20diagramas.docx)**

As seis figuras do sistema em formato pronto para anexar, cada uma numerada, com título e fonte. Gerado a partir de [diagramas.md](./diagramas.md), então regere quando algum diagrama mudar.

## Para quem vai mexer no código

**[arquitetura.md](./arquitetura.md)**

Como o sistema é organizado por dentro, o caminho que os dados percorrem e as decisões que explicam por que está assim.

**[diagramas.md](./diagramas.md)**

Modelo entidade-relacionamento extraído do banco em produção, fluxo principal da aplicação, arquitetura em camadas, sequência de autenticação e sincronização, e a lógica de resolução de conflito entre dois aparelhos. Escritos em Mermaid, que o GitHub renderiza direto. As versões em SVG, para anexar em outros documentos, estão em [`diagramas/`](./diagramas/).

**[contribuindo.md](./contribuindo.md)**

Setup local, padrão de branch e de commit, como abrir um Pull Request.

## Onde está o resto

Configuração do banco passo a passo: [`supabase/README.md`](../supabase/README.md).

Contrato técnico dos minigames: [`src/js/modules/minigames/README.md`](../src/js/modules/minigames/README.md).

Autoria e bibliotecas de terceiros: [`NOTICE.md`](../NOTICE.md). Termos de licença: [`LICENSE`](../LICENSE).
