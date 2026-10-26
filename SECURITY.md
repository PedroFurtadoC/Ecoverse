# Segurança

## Como relatar uma falha

Use o relato privado do GitHub: aba **Security** do repositório, botão **Report a vulnerability**. A mensagem chega só para quem mantém o projeto e não fica pública enquanto a correção não sai.

Não abra issue pública para falha de segurança e não teste em contas de outras pessoas. Se precisar de uma conta para reproduzir, crie a sua.

Ajuda muito contar o que você fez, o que esperava e o que aconteceu, com o endereço ou o trecho de código envolvido. O Ecoverse é um projeto acadêmico, então a resposta pode levar alguns dias.

## O que está no escopo

- O site em https://ecoverse.dev e o código deste repositório.
- As regras de acesso do banco: `supabase/policies.sql` e as funções de `supabase/schema.sql`.

Os serviços que o projeto usa (Supabase, Vercel, Resend e GitHub) têm canais próprios para falhas deles.

## Versões atendidas

Só a versão em produção, marcada como Latest nas Releases.

## Como o projeto se protege

- Cabeçalhos de segurança e política de conteúdo em `vercel.json`: o navegador só executa scripts do próprio site.
- Proteção por linha no banco: cada conta só lê e grava o que é dela, e quem não entrou numa conta só vê os apelidos do ranking.
- A exclusão de conta passa por uma função que só alcança a conta de quem pediu.
- CodeQL, varredura de segredos com bloqueio de push e alertas do Dependabot ligados no repositório.
- A chave publicável do Supabase que aparece no site é pública por design. Nenhuma chave secreta fica no repositório.
