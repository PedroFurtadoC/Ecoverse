# Certificados

Aqui ficam os certificados emitidos pelo INPI, em PDF, conforme forem saindo.

São dois processos separados, com formulários e números próprios:

| Processo | Formulário | O que o certificado traz |
| --- | --- | --- |
| Programa de computador | e-RPC | Título, autores, linguagem, tipo de programa, campo de aplicação, algoritmo e resumo digital hash |
| Marca | e-Marcas | Número do processo, titular, classe de Nice, imagem da marca como depositada |

Sugestão de nome de arquivo, para os dois ficarem ordenados e identificáveis
sem precisar abrir: `AAAA-MM-DD-programa-de-computador.pdf` e
`AAAA-MM-DD-marca.pdf`, com a data de expedição.

## Por que esta pasta é versionada e o resto não

O `.gitignore` deixa de fora tudo em `registro-inpi/`, com exceção desta
pasta. O motivo é o peso e a natureza de cada coisa.

O `ecoverse-codigo-fonte.zip` é um arquivo de dezenas de megabytes contendo
uma cópia do próprio repositório: versioná-lo seria guardar o projeto dentro
do projeto, e a cada regeração entraria uma cópia nova no histórico. Ele
precisa é de cópia de segurança fora daqui, em lugar que não mude.

O certificado é o oposto: é um PDF leve, é documento público, é a prova de
que o registro existe, e quem assumir o projeto depois vai querer encontrá-lo
junto do código, não num email perdido.

## Conferência

O certificado do programa de computador traz o resumo digital hash. Para
confirmar que o arquivo guardado continua sendo o mesmo que foi registrado:

```
certutil -hashfile ecoverse-codigo-fonte.zip SHA512
```

O resultado tem que bater, caractere por caractere, com o que está impresso
no certificado. O procedimento completo está em
[`registro-inpi/README.md`](../README.md).
