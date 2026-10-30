---
name: Keenko
description: Tecnologia que aproxima; bem-estar que faz parte.
colors:
  cream: "#F5F5EF"
  olive: "#4A5D23"
  terracotta: "#D9824B"
  ink: "#1A1A1A"
  white: "#FFFFFF"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(2.6rem, 5vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  heading:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.625
rounded:
  control: "9999px"
  card: "24px"
spacing:
  compact: "12px"
  small: "24px"
  medium: "40px"
  large: "64px"
components:
  primary-action:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.ink}"
    rounded: "9999px"
    padding: "16px 28px"
  feature-card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "24px"
    padding: "40px 28px"
---

# Design System: Keenko

A marca usa o logo original `backend/public/img/logo_keenko.svg`, com as cores originais, no cabeçalho e no favicon. Não substituir por ícones ou texto recriados.

## Contexto do produto

A Keenko é uma HealthTech brasileira fundada em 27 de fevereiro de 2025. O KaorCount é seu primeiro aplicativo, voltado a organizar refeições, hidratação e progresso nutricional. A página comunica o produto e a missão institucional; não oferece consultas ou resultados clínicos.

## Direção visual — página principal

Uma experiência clara, calorosa e acessível, com creme como superfície principal, oliva para navegação e ações, terracota para destaque, e texto escuro. Inter é servida localmente. Ondas suaves em oliva e terracota claros aparecem ao fundo dos heroes da landing e da página de download. A fotografia mostra preparo de alimentos e é ilustrativa, não retrata uma equipe identificada da Keenko.

- Cabeçalho fixo com identidade Keenko e navegação; recolhe ao rolar para baixo e reaparece ao rolar para cima ou receber foco.
- Hero em duas colunas: autonomia alimentar, contexto da HealthTech, CTA para o APK Android e fotografia quadrada. Em telas estreitas, conteúdo empilhado e menu nativo `details`.
- Conteúdo: três recursos reais do KaorCount (refeições, hidratação e progresso), apresentação da empresa, missão/visão/valores e FAQ. Há apenas um botão de download, no hero; o menu destaca “Conheça a Keenko”, e o FAQ mantém um link textual de ajuda para baixar.
- Cartões brancos de cantos amplos; botões arredondados; superfícies limpas e sombras discretas.
- Foco de teclado visível, link para pular ao conteúdo, FAQ sem dependência de JavaScript e suporte a movimento reduzido.

## Tokens e implementação

Os tokens e estilos das páginas principal e de download são definidos em `backend/site/styles.css` e compilados para `backend/public/css/keenko.css`. Tailwind CSS 4.3.3 é dependência de desenvolvimento fixada; o CSS compilado é versionado e usado diretamente pelo HTML. Não há CDN nem compilação no navegador. O build também copia `qrcode-generator` 2.0.4 para `backend/public/js/vendor/qrcode.js`; licença MIT em `backend/site/qrcode-LICENSE.txt`.

| Token | Valor | Uso |
|---|---|---|
| Creme | `#F5F5EF` | Fundo do cabeçalho e hero |
| Oliva | `#4A5D23` | Navegação, foco e ações secundárias |
| Terracota | `#D9824B` | CTA principal do hero |
| Tinta | `#1A1A1A` | Texto principal |
| Branco | `#FFFFFF` | Fundo de conteúdo e cartões |
| Inter | Local, variável | Tipografia das páginas principal e de download |

## Página de download

`backend/public/html/download.html` compartilha `backend/public/css/keenko.css` e Inter com a página principal. A página segue a composição da landing: cabeçalho e navegação compartilhados, hero creme centralizado e botão terracota para o APK. O título é “Sua jornada de nutrição, agora no seu bolso.”; há três cartões sobre metas, refeições e hidratação/progresso reais. Não sugere chat nem receitas.

O único download funcional é o APK Android preservado em `backend/public/downloads/KaorCount-android.apk`. `style.css` e `download.css` são arquivos legados não carregados pela página atual e permanecem preservados. Ícones decorativos são SVG inline; nenhuma imagem raster nova foi criada.

## Regras de conteúdo

- Descrever o KaorCount como ferramenta de organização e acompanhamento; não como substituto de nutricionista ou atendimento médico.
- Não inventar consultas, preços, planos, blog, avaliações, equipe clínica, contatos ou links de lojas. O destino disponível é a página de download Android.
- Não apresentar imagens ilustrativas como telas reais do aplicativo ou como retratos de pessoas da equipe.
- Preservar navegação por teclado, foco evidente, responsividade e preferência por movimento reduzido.
