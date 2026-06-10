**CENTRO ESTADUAL DE EDUCAÇÃO PROFISSIONAL DE CURITIBA**

**DESENVOLVIMENTO DE SISTEMAS**

Eduardo Luiz Campos dos Santos

João Vitor Ferreira da Silva

Leonardo Rodrigues Karpinski

Kauã de Oliveira Júlio

**PROJETO INTEGRADOR: APP MOBILE DE NUTRIÇÃO**

Projeto Integrador apresentado ao Curso Técnico em Desenvolvimento de Sistemas do Centro Estadual de Educação Profissional de Curitiba, como requisito parcial para integração das disciplinas.

**Curitiba — 2026**

# **Sumário**

1\. Contextualização da Empresa

   1.1 Histórico

   1.2 Setores

   1.3 Diagnóstico Tecnológico

   1.4 Restrições e Impactos

2\. Definição de Requisitos

   2.1 Oportunidade

   2.2 Problema

   2.3 Requisitos Funcionais

   2.4 Requisitos Não Funcionais

3\. Gestão de Pessoas (RH)

   3.1 Estrutura Organizacional

   3.2 Perfis e Funções

   3.3 Cultura e Valores

4\. Estratégia e Planejamento

   4.1 Análise de Mercado

   4.2 Análise SWOT

   4.3 Roadmap de Produto

5\. Marketing

   5.1 Posicionamento

   5.2 Público-Alvo

   5.3 Estratégia de Aquisição

6\. Alimentação e Saúde

   6.1 Embasamento Científico

   6.2 Funcionalidades Nutricionais

# **1\. Contextualização da Empresa**

## **1.1 Histórico**

A Keenko é uma startup brasileira de tecnologia para a saúde (HealthTech), fundada em 27 de fevereiro de 2025\. Com 16 meses de trajetória em pesquisa e desenvolvimento, a companhia consolidou-se a partir da identificação de uma lacuna crítica no mercado de bem-estar: a ausência de autonomia do indivíduo sobre seus dados e rotina nutricional.

A empresa opera na intersecção entre ciência da nutrição e inovação digital, buscando transformar hábitos complexos em fluxos de dados gerenciáveis e intuitivos. Seu modelo de negócio está fundamentado na democratização do acesso à educação alimentar personalizada, utilizando tecnologia mobile como principal vetor de entrega de valor.

A Keenko projeta-se rumo a tornar-se a principal referência nacional no setor de alimentação saudável mediada pela tecnologia. Sua estratégia de crescimento está dividida em duas fases fundamentais:

* Consolidação Digital — Estabelecimento de uma base de usuários sólida por meio de aplicações mobile de alta performance, priorizando experiência do usuário e retenção orgânica.

* Expansão do Ecossistema — Evolução de uma ferramenta de software para um hub completo de saúde, integrando serviços de alimentação personalizada, parcerias com profissionais de saúde e análise de dados preditiva via Machine Learning.

## **1.2 Setores**

A Keenko é estruturada nos seguintes setores operacionais:

* Desenvolvimento: Mobile, Back-End, Front-End e Banco de Dados

* Tecnologia da Informação (TI)

* Logística

* Segurança da Informação

* Marketing

* Pesquisa Nutricional (especializada)

* Financeiro

## **1.3 Diagnóstico Tecnológico**

Atualmente, a Keenko utiliza um conjunto de ferramentas digitais para o desenvolvimento do produto e a comunicação entre equipes:

| Visual Studio Code | Desenvolvimento back-end e front-end da aplicação |
| :---- | :---- |
| **Figma** | Design de interface (UI/UX) do aplicativo mobile |
| **MySQL Workbench** | Modelagem e gestão do banco de dados relacional |
| **Pacote Office / Google** | Documentação, planilhas e controle de dados corporativos |
| **WhatsApp** | Comunicação formal com o Product Owner e stakeholders |
| **Discord** | Comunicação interna da equipe e daily scrums (canais de texto e voz) |

## **1.4 Restrições e Impactos**

O sistema apresenta limitações relacionadas ao uso de Inteligência Artificial: a implementação de Machine Learning requer grande volume de dados históricos dos usuários, o que torna essa funcionalidade uma meta de médio prazo, a ser incorporada em versões futuras da plataforma.

Os principais setores impactados pelo projeto são:

* Tecnologia da Informação — pelo uso intensivo de infraestrutura digital, APIs externas e arquitetura de dados em nuvem.

* Financeiro — pelo custo de desenvolvimento, manutenção de servidores e pela geração de receita por meio de assinaturas e parcerias.

# **2\. Definição de Requisitos**

## **2.1 Oportunidade**

A Keenko identificou uma dor real no mercado: indivíduos que buscam um estilo de vida saudável não possuem autonomia plena para adotar ações planejadas em sua evolução nutricional de acordo com seus objetivos pessoais — seja perda de peso, ganho de massa muscular ou simplesmente manutenção da saúde. Com base nessa dor, foi concebido um aplicativo mobile que centraliza e simplifica o controle nutricional na palma da mão do usuário.

## **2.2 Problema**

O ritmo acelerado da vida moderna dificulta o acompanhamento alimentar adequado. As pessoas buscam cada vez mais por nutrição de qualidade para fins atléticos, estéticos ou de saúde preventiva, mas encontram barreiras como a falta de tempo para planejamento de refeições, ausência de orientação personalizada acessível e dificuldade em manter consistência nos hábitos alimentares.

Além disso, as soluções existentes no mercado são frequentemente fragmentadas: aplicativos de contagem calórica sem contexto, plataformas nutricionais caras e sem experiência mobile satisfatória, e conteúdo genérico que não considera os objetivos individuais do usuário.

## **2.3 Requisitos Funcionais**

Os requisitos funcionais definem as funcionalidades que o sistema deve oferecer ao usuário:

* RF01 — Cadastro e autenticação de usuários com perfil personalizado (idade, peso, altura, objetivo nutricional)

* RF02 — Registro diário de refeições com busca em base de dados de alimentos

* RF03 — Cálculo automático de macronutrientes (proteínas, carboidratos, gorduras) e calorias

* RF04 — Definição de metas nutricionais diárias personalizadas

* RF05 — Dashboard com visualização de progresso em gráficos e resumos

* RF06 — Histórico alimentar com filtros por período

* RF07 — Sugestões de refeições baseadas no perfil e metas do usuário

* RF08 — Notificações e lembretes para registro de refeições e ingestão de água

## **2.4 Requisitos Não Funcionais**

Os requisitos não funcionais dizem respeito à qualidade e às restrições técnicas do sistema:

* RNF01 — Desempenho: tempo de resposta inferior a 2 segundos para operações de busca e registro

* RNF02 — Segurança: criptografia de dados sensíveis e conformidade com a LGPD

* RNF03 — Disponibilidade: uptime mínimo de 99% nos servidores

* RNF04 — Usabilidade: interface intuitiva, acessível e compatível com iOS e Android

* RNF05 — Escalabilidade: arquitetura preparada para suportar crescimento de base de usuários

# **3\. Gestão de Pessoas (RH)**

## **3.1 Estrutura Organizacional**

A Keenko adota uma estrutura organizacional horizontal, típica de startups em fase inicial, que favorece a agilidade na tomada de decisão e a colaboração entre equipes. A empresa é organizada em núcleos funcionais com papéis bem definidos e metodologia ágil (Scrum) como base de gestão.

| Product Owner | Responsável pela visão do produto, priorização do backlog e alinhamento com stakeholders |
| :---- | :---- |
| **Dev Mobile** | Desenvolvimento da aplicação iOS e Android (React Native / Flutter) |
| **Dev Back-End** | APIs, regras de negócio, integrações externas e segurança |
| **Dev Front-End** | Interface web e componentes reutilizáveis do sistema |
| **DBA** | Modelagem, otimização e manutenção do banco de dados MySQL |
| **Designer UX/UI** | Prototipação no Figma, testes de usabilidade e identidade visual |
| **Especialista em Nutrição** | Curadoria científica do banco de dados alimentar e validação das funcionalidades |
| **Marketing** | Aquisição de usuários, redes sociais, branding e parcerias estratégicas |

## **3.2 Perfis e Funções**

A equipe é composta por profissionais e estudantes de Desenvolvimento de Sistemas, com formação técnica em andamento no Centro Estadual de Educação Profissional de Curitiba. O perfil da equipe reflete competências técnicas em programação, banco de dados e design, combinadas com interesse em tecnologia aplicada à saúde.

A gestão do projeto segue o framework Scrum, com sprints semanais, daily scrums via Discord e revisões periódicas com o Product Owner via WhatsApp. Isso garante ciclos curtos de entrega e adaptação contínua às necessidades do produto.

## **3.3 Cultura e Valores**

A cultura organizacional da Keenko é orientada por três pilares:

* Autonomia com responsabilidade — cada membro da equipe possui domínio claro sobre sua área e responde pelos seus entregáveis.

* Aprendizado contínuo — o contexto acadêmico-profissional da equipe incentiva a experimentação, o erro controlado e a evolução técnica constante.

* Impacto social — a missão de democratizar o acesso à nutrição de qualidade orienta as decisões de produto e tecnologia.

# **4\. Estratégia e Planejamento**

## **4.1 Análise de Mercado**

O mercado de aplicativos de saúde e bem-estar no Brasil movimenta bilhões de reais anualmente e cresce em ritmo acelerado, impulsionado pela maior conscientização sobre saúde preventiva e pelo aumento do uso de smartphones. Segundo dados do setor HealthTech, o Brasil é o maior mercado de healthtechs da América Latina.

Os principais concorrentes diretos da Keenko incluem plataformas como MyFitnessPal, Tecnonutri e Nau. No entanto, a Keenko se diferencia ao unir ciência nutricional com personalização inteligente e uma proposta de autonomia de dados — algo que os concorrentes não entregam de forma integrada.

## **4.2 Análise SWOT**

| FORÇAS | FRAQUEZAS |
| ----- | ----- |
| Proposta de valor clara e dor real identificada Equipe técnica multidisciplinar Curadoria científica especializada Stack tecnológica moderna e escalável | Base de dados de alimentos ainda em construção Limitação de ML por volume insuficiente de dados Equipe em fase de formação técnica Recursos financeiros limitados no estágio inicial |
| **OPORTUNIDADES** | **AMEAÇAS** |
| Crescimento do mercado HealthTech no Brasil Parcerias B2B com clínicas, academias e planos de saúde Integração com wearables e dispositivos IoT Tendência crescente de autocuidado e nutrição preventiva | Concorrentes consolidados com maior base de usuários Resistência do usuário brasileiro a pagar por apps de saúde Big techs (Apple, Google) expandindo funcionalidades de saúde Exigências regulatórias de privacidade (LGPD) |

## **4.3 Roadmap de Produto**

O desenvolvimento da Keenko está organizado em fases progressivas:

| Fase 1 — MVP (2025) | Lançamento do app com cadastro, registro de refeições, cálculo de macros e dashboard básico |
| :---- | :---- |
| **Fase 2 — Crescimento (2025–2026)** | Ampliação do banco de dados alimentar, notificações inteligentes e integração com wearables |
| **Fase 3 — IA & Parcerias (2026+)** | Machine Learning para sugestões preditivas, parcerias B2B e expansão para hub de saúde completo |

# **5\. Marketing**

## **5.1 Posicionamento**

A Keenko posiciona-se como a plataforma de nutrição que devolve ao usuário o controle total sobre seus dados e sua evolução alimentar. Diferentemente de concorrentes que entregam apenas contagem calórica, a Keenko combina personalização, ciência e tecnologia em uma experiência mobile fluida e humanizada.

O slogan orientador da marca é: "Sua nutrição, seu ritmo, seus dados."

## **5.2 Público-Alvo**

O público principal da Keenko é composto por:

* Jovens adultos entre 18 e 35 anos, com interesse em saúde, fitness e qualidade de vida

* Praticantes de atividade física que buscam otimizar sua nutrição para performance

* Pessoas em processo de reeducação alimentar, com ou sem acompanhamento profissional

* Profissionais de saúde (nutricionistas e personal trainers) que desejam ferramentas digitais para acompanhamento de clientes

## **5.3 Estratégia de Aquisição**

A estratégia de marketing da Keenko baseia-se em três canais principais:

* Marketing de Conteúdo — Produção de conteúdo educativo sobre nutrição nas redes sociais (Instagram, TikTok, YouTube), construindo autoridade e atraindo usuários organicamente.

* Parcerias Estratégicas — Colaborações com nutricionistas, influenciadores de saúde e academias para ampliar o alcance e validar a proposta de valor junto ao público.

* Crescimento Orgânico (Product-Led Growth) — Funcionalidades virais dentro do app, como compartilhamento de progresso e indicação de amigos, incentivando o crescimento boca a boca.

# **6\. Alimentação e Saúde**

## **6.1 Embasamento Científico**

A Keenko fundamenta suas funcionalidades em princípios consolidados da ciência da nutrição. O aplicativo trabalha com os conceitos de necessidade energética diária, balanço de macronutrientes e micronutrientes, e respeita as diretrizes estabelecidas pelo Ministério da Saúde e pelo Conselho Federal de Nutricionistas (CFN).

A curadoria do banco de dados de alimentos é realizada com supervisão de especialista em nutrição, garantindo precisão nos valores nutricionais e coerência científica nas sugestões oferecidas ao usuário.

A plataforma deixa claro que não substitui o acompanhamento profissional de um nutricionista, posicionando-se como ferramenta complementar de autoconhecimento e monitoramento alimentar.

## **6.2 Funcionalidades Nutricionais**

As principais funcionalidades da Keenko relacionadas à saúde alimentar incluem:

* Cálculo de Taxa Metabólica Basal (TMB) e necessidade calórica diária com base em dados antropométricos e nível de atividade física

* Distribuição personalizada de macronutrientes (proteínas, carboidratos e gorduras) conforme o objetivo declarado pelo usuário

* Banco de dados com mais de 10.000 alimentos catalogados, incluindo opções da culinária brasileira

* Controle de ingestão de água e micronutrientes essenciais

* Indicadores de progresso baseados em evidências: peso, medidas corporais e consistência alimentar

* Alertas inteligentes para desvios significativos do plano alimentar

A integração futura com Machine Learning permitirá que o sistema aprenda com os padrões de cada usuário e ofereça sugestões cada vez mais precisas e personalizadas, elevando a experiência de um simples registro para um verdadeiro assistente nutricional inteligente.

*— Fim do Documento —*