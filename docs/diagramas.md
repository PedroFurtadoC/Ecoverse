# Diagramas

Seis diagramas, cada um na notação adequada ao que representa. Escritos em Mermaid e versionados como texto, o que permite revisar mudança por mudança no histórico. O GitHub renderiza direto na tela.

Para anexar em documentos, as versões em SVG estão em [`diagramas/`](./diagramas/). Ao alterar um diagrama aqui, regere a imagem correspondente para as duas não divergirem.

| Nº | Nome | Notação |
| --- | --- | --- |
| 1 | Diagrama Entidade-Relacionamento | DER, notação pé de galinha |
| 2 | Fluxograma de inicialização | Fluxograma, ISO 5807 |
| 3 | Fluxograma do ciclo de missão | Fluxograma, ISO 5807 |
| 4 | Diagrama de implantação e componentes | UML, adaptado |
| 5 | Diagrama de sequência | UML 2.5 |
| 6 | Fluxograma de consolidação de progresso | Fluxograma, ISO 5807 |

## 1. Diagrama Entidade-Relacionamento

Modelo extraído do banco em produção, não do arquivo de criação, então reflete o que existe de fato.

São quatro entidades no diagrama, mas apenas **três tabelas são do projeto**: `profiles`, `progress` e `pomodoro_sessions`, todas no schema `public`. A quarta, `auth.users`, pertence ao schema gerenciado pela plataforma de autenticação e aparece porque é a origem das chaves estrangeiras. Sem ela o diagrama ficaria com relacionamentos soltos.

Todas as chaves estrangeiras usam exclusão em cascata. Apagar o usuário elimina perfil, progresso e histórico no mesmo instante, que é o que sustenta na prática o direito de eliminação previsto na LGPD.

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "possui"
    AUTH_USERS ||--|| PROGRESS : "possui"
    AUTH_USERS ||--o{ POMODORO_SESSIONS : "registra"

    AUTH_USERS {
        uuid id PK "gerenciado pelo schema auth"
        text email "nunca exposto na API pública"
    }

    PROFILES {
        uuid id PK "FK para auth.users, on delete cascade"
        text display_name "obrigatório, 1 a 60 caracteres"
        text avatar_url "opcional"
        text school "padrão UNAERP"
        timestamptz created_at "default now()"
        timestamptz updated_at "atualizado por trigger"
    }

    PROGRESS {
        uuid user_id PK "FK para auth.users, on delete cascade"
        int energy "default 3"
        int coins "default 0"
        numeric impact "CO2 evitado, default 0"
        jsonb completed "ids das missões concluídas"
        jsonb achievements "ids das conquistas"
        jsonb planted_trees "coordenadas no globo"
        int pomodoros_completed "default 0"
        int best_streak "default 0"
        int perfect_minigames "default 0"
        jsonb quizzes "score por ODS, chave 1 a 17"
        timestamptz updated_at "atualizado por trigger"
    }

    POMODORO_SESSIONS {
        uuid id PK "default gen_random_uuid()"
        uuid user_id FK "on delete cascade"
        timestamptz started_at "default now()"
        int duration_seconds "obrigatório"
        text task_name "opcional"
        boolean was_break "default false"
    }
```

Duas decisões de modelagem merecem registro. Primeira: coleções como missões concluídas e conquistas ficam em `jsonb` em vez de tabelas associativas, porque são sempre lidas junto com o restante do progresso e nunca consultadas isoladamente. Segunda: `profiles` e `progress` têm chave primária igual à chave estrangeira, o que garante no nível do banco que existe no máximo uma linha por usuário, sem precisar de restrição adicional.

## 2. Fluxograma de inicialização

Da abertura da página até a aplicação ficar pronta para uso.

```mermaid
flowchart TD
    INI(["Início"]) --> P1["Carregar progresso salvo<br/>no navegador"]
    P1 --> D1{"Existe sessão<br/>autenticada?"}
    D1 -->|"Não"| P5["Montar o globo 3D<br/>com as 8 missões"]
    D1 -->|"Sim"| P2["Ler o progresso<br/>na nuvem"]
    P2 --> P3["Comparar a pontuação de avanço<br/>dos dois lados"]
    P3 --> P4["Mesclar e gravar<br/>o resultado"]
    P4 --> P5
    P5 --> FIM(["Aplicação pronta<br/>para o ciclo de missão"])
```

## 3. Fluxograma do ciclo de missão

O laço principal do jogo. Foi separado da inicialização de propósito: reunir os dois em um único fluxograma produzia um diagrama com quatro retornos cruzando a página, ilegível.

```mermaid
flowchart TD
    INI(["Início do ciclo"]) --> P1["Selecionar uma missão<br/>no globo"]
    P1 --> D1{"Missão anterior<br/>concluída?"}
    D1 -->|"Não"| P2["Sinalizar missão bloqueada"]
    D1 -->|"Sim"| D2{"Energia<br/>suficiente?"}
    D2 -->|"Não"| P3["Executar sessão de Pomodoro<br/>e creditar energia"]
    D2 -->|"Sim"| P4["Descontar energia e<br/>executar o minigame"]
    P4 --> D3{"Missão<br/>concluída?"}
    D3 -->|"Não"| P5["Devolver a energia<br/>descontada"]
    D3 -->|"Sim"| P6["Creditar moedas e<br/>impacto de CO2"]
    P6 --> P7["Gravar progresso e<br/>avaliar conquistas"]
    P7 --> D4{"As 8 missões<br/>foram concluídas?"}
    D4 -->|"Sim"| FIM(["Fim do ciclo"])

    P2 --> RET
    P3 --> RET
    P5 --> RET
    D4 -->|"Não"| RET(["Retornar ao globo"])
```

## 4. Diagrama de implantação e componentes

Agrupa os componentes pelo ambiente em que executam. O cliente é estático e a fronteira de segurança fica no banco, não no navegador: como o código do cliente é público por natureza, ele nunca é tratado como confiável.

```mermaid
flowchart TB
    subgraph NAV["Navegador do usuário"]
        direction TB
        APR["Apresentação<br/>main.js e CSS componentizado"]
        DOM["Módulos de domínio<br/>Pomodoro, conquistas, quizzes, minigames"]
        EST["Estado global<br/>state.js como fonte única, events.js como barramento"]
        SER["Serviços<br/>cliente, autenticação e sincronização"]
        LS[("localStorage<br/>fonte primária")]

        APR --> DOM
        DOM --> EST
        EST --> LS
        EST --> SER
    end

    subgraph CDN["Borda"]
        EST_ARQ["Arquivos estáticos servidos por CDN"]
        CRON["Tarefa agendada diária"]
    end

    subgraph BAAS["Plataforma gerenciada"]
        API["API REST gerada a partir do schema"]
        AUTH["Autenticação por link de uso único"]
        RT["Canal de tempo real"]
        RLS{{"Row Level Security<br/>fronteira real de segurança"}}
        PG[("PostgreSQL 17")]

        API --> RLS
        AUTH --> RLS
        RT --> RLS
        RLS --> PG
    end

    subgraph EMAIL["Entrega de email"]
        SMTP["Serviço de envio<br/>domínio próprio verificado"]
    end

    APR -.->|"carrega"| EST_ARQ
    SER -->|"HTTPS"| API
    SER -->|"HTTPS"| AUTH
    SER -->|"WebSocket"| RT
    CRON -->|"consulta de leitura diária"| API
    AUTH -->|"SMTP"| SMTP
```

## 5. Diagrama de sequência

Do primeiro acesso até o progresso aparecer em um segundo aparelho.

```mermaid
sequenceDiagram
    actor U as Jogador
    participant A as Aplicação
    participant AU as Autenticação
    participant EM as Serviço de email
    participant DB as Banco

    U->>A: Informa email e aceita os termos
    A->>AU: Solicita link de acesso
    AU->>EM: Envia mensagem com link de uso único
    EM-->>U: Entrega o email
    U->>A: Clica no link
    A->>AU: Valida o link
    AU-->>A: Devolve sessão assinada

    Note over AU,DB: No primeiro acesso, um gatilho cria as linhas de perfil e progresso

    A->>DB: Lê o progresso da nuvem
    DB-->>A: Devolve a linha do próprio usuário
    A->>A: Mescla com o progresso local
    A->>DB: Grava o resultado da mesclagem

    U->>A: Conclui uma missão
    A->>A: Grava no localStorage
    A->>DB: Envia agrupado em 2 segundos
    DB-->>A: Confirma

    Note over A,DB: Outro aparelho do mesmo usuário recebe a mudança pelo canal de tempo real
```

## 6. Fluxograma de consolidação de progresso

O ponto mais delicado da sincronização é decidir qual versão vale quando o jogador avançou em dois aparelhos. A decisão não usa horário, porque relógio de dispositivo e carimbo de banco divergem com facilidade. Em vez disso, o sistema calcula uma pontuação de avanço que só cresce, atribuindo peso maior ao que é difícil de obter.

```mermaid
flowchart TD
    INI(["Progresso local e progresso da nuvem"]) --> P1["Calcular a pontuação de avanço<br/>de cada lado"]
    P1 --> P2["Listas de missões e conquistas:<br/>unir os dois lados"]
    P2 --> P3["Contadores acumulativos:<br/>manter o maior valor"]
    P3 --> P4["Quizzes:<br/>manter a melhor nota por ODS"]
    P4 --> P5["Energia:<br/>adotar o lado de maior pontuação"]
    P5 --> FIM(["Estado consolidado"])
```

A pontuação pesa missão concluída acima de sessão de foco, que pesa acima de quiz respondido, e por último conquistas, moedas e árvores. O resultado é determinístico: dois aparelhos que recebem os mesmos dados chegam ao mesmo estado, independentemente da ordem em que sincronizam.
