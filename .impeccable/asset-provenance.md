# Proveniência de recursos visuais

Registro dos recursos mantidos em `backend/public`. As páginas `html/index.html` e `html/download.html` compartilham a identidade Keenko atual e `css/keenko.css`; arquivos visuais legados permanecem preservados.

| Recurso | Uso | Origem registrada |
|---|---|---|
| `img/logo_keenko.svg` | Logo oficial original no cabeçalho e favicon da página principal | Arquivo preexistente do projeto, solicitado pelo usuário. Usado sem alterar o desenho ou as cores; somente o espaço vazio da imagem é ajustado no layout. |
| `img/keenko-alimentos.jpg` | Fotografia ilustrativa do hero; prato de salada com legumes | Unsplash, https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=85&fm=jpg. Escolhida em substituição à fotografia de pessoas, conforme pedido do usuário. Fotógrafo e licença específica não registrados. |
| `css/fonts/inter-latin-variable.woff2` | Tipografia da página principal | Google Fonts, https://fonts.gstatic.com/s/inter/v20/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7. Licença incluída em `css/fonts/Inter-OFL.txt`. |
| `img/imgem_empresa.jfif` | Recurso legado | Já existente; origem e licença desconhecidas. Preservado, não atribuir ou remover sem confirmação. |
| `img/logo_keenko.svg`, `img/logo_KaorCount.svg` | Logos da Keenko e do aplicativo, usados também na página de download | Já existentes; origem/licença não documentadas. Preservados. |
| `img/icone_agua.svg`, `icone_conta.svg`, `icone_grafico.svg`, `icone_historico.svg`, `icone_intuitivo.svg`, `icone_refeicao.svg` | Ícones legados do app/download | Já existentes; origem/licença não documentadas. Preservados. |
| `css/fonts/sora-latin-variable.woff2` | Fonte da página de download | Já existente; licença fornecida em `css/fonts/OFL.txt`. |
| SVGs inline orgânicos | Decoração da página de download | Formas autorais declaradas no HTML; não são imagens raster nem assets externos. |
| `js/vendor/qrcode.js` | Geração local do QR da URL pública na página de download | `qrcode-generator` 2.0.4, dependência de desenvolvimento fixada; licença MIT em `backend/site/qrcode-LICENSE.txt`. QR é gerado em runtime, não é asset predefinido. |

O logo Keenko original é usado na página de download. Logos/ícones legados, foto legada e Sora permanecem no repositório sem remoção; a página atual usa Inter e não depende desses estilos legados. A foto é ilustrativa e não identifica pessoas como integrantes da Keenko. Confirmar licenças e atribuições necessárias antes de redistribuir recursos cuja origem não esteja estabelecida.
