# Site institucional Keenko

Site estático da HealthTech Keenko e do KaorCount. As páginas principal e de download estão em `html/index.html` e `html/download.html`. A API/FastAPI serve o conteúdo em `/` e disponibiliza `/download`; os arquivos públicos incluem `css`, `img`, `js` e `downloads`.

## Prévia local

Na raiz do repositório, inicie o servidor estático:

```powershell
python -m http.server 8765 --bind 127.0.0.1 --directory backend/public
```

Abra http://127.0.0.1:8765/html/index.html. Para ver o download, abra http://127.0.0.1:8765/html/download.html. O servidor simples não reproduz as rotas `/` e `/download` do FastAPI.

## CSS da página principal

Os dois HTML carregam `css/keenko.css`, CSS Tailwind já compilado e versionado; não há CDN nem compilação Tailwind em tempo de execução. Para regenerá-lo, na raiz:

```powershell
npm ci --prefix backend/site
npm run build --prefix backend/site
```

O CLI e Tailwind estão fixados em `backend/site/package.json` na versão 4.3.3. A fonte de entrada é `backend/site/styles.css`; a saída é `backend/public/css/keenko.css`. O build também instala em `js/vendor/qrcode.js` o encoder `qrcode-generator` 2.0.4; licença MIT em `backend/site/qrcode-LICENSE.txt`. Inter é hospedada localmente, com licença em `css/fonts/Inter-OFL.txt`.

A página de download compartilha `css/keenko.css` e Inter com a principal. Mostra badges App Store/Google Play indisponíveis e oferece apenas o APK Android real em `downloads/KaorCount-android.apk`. Seu QR é gerado para URL pública HTTP(S) válida; em hospedagem local ou URL inválida, mostra fallback de celular, sem QR fictício. `css/style.css`, `css/download.css` e Sora são legados preservados, não usados pelo HTML atual. Consulte `../../DESIGN.md` e `../../.impeccable/asset-provenance.md`.

## Conteúdo e limites

A página apresenta a Keenko como HealthTech brasileira e o KaorCount como app para registro de refeições, hidratação, metas e acompanhamento de progresso. Não oferece consultas, preços ou planos, nem inventa chat ou receitas; App Store e Google Play são explicitamente indisponíveis. O produto não substitui acompanhamento profissional. Domínio de produção não confirmado: não publicar/configurar URL pública até confirmação; URL antiga `https://keenko.vercel.app/download` retornou 404.

## Verificações

Scripts disponíveis incluem `backend/tests/site-smoke.cjs`, `backend/tests/download-smoke.cjs` e `backend/tests/download-qr.cjs` (QR decodificado em fixtures `.example.test`, fallback e URLs inseguras); instruções e dependências ficam no README da raiz. Execute com o servidor local ativo. Este documento não afirma que os testes foram executados após a atualização de conteúdo. Resultados de Lighthouse ou revisão visual anteriores não garantem o estado atual e precisam ser repetidos após mudanças relevantes.
