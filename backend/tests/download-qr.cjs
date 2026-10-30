// Extra QA dependencies: Playwright, jsqr@1.4.0 and pngjs@7.0.0.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const url = process.env.DOWNLOAD_PAGE_URL || 'http://127.0.0.1:8765/html/download.html';
    const results = [];
    const output = path.resolve('.impeccable/review');
    fs.mkdirSync(output, { recursive: true });
    try {
        // This URL is synthetic test data, never shipped as a production link.
        const publicURL = 'https://keenko.example.test/html/download.html';
        const ready = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
        await ready.route('**/html/download.html', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, body: (await response.text()).replace('data-public-url=""', `data-public-url="${publicURL}"`) });
        });
        await ready.goto(url);
        await ready.waitForFunction(() => document.querySelector('#qr-download').dataset.qrState === 'ready');
        const png = PNG.sync.read(await ready.locator('#qr-code').screenshot());
        const decoded = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
        assert.equal(decoded?.data, publicURL, 'Generated QR must decode to the intended download page');
        assert.equal(await ready.locator('#qr-download').getAttribute('data-qr-url'), publicURL);
        await ready.locator('body').screenshot({ path: path.join(output, 'download-qr-test.png') });
        results.push({ publicURL: 'synthetic test fixture', generatedQR: 'decoded and matched target URL' });

        const broken = await browser.newPage();
        await broken.route('**/html/download.html', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, body: (await response.text()).replace('data-public-url=""', 'data-public-url="javascript:alert(1)"') });
        });
        await broken.goto(url);
        await broken.waitForFunction(() => document.querySelector('#qr-download').dataset.qrState === 'unavailable');
        assert.equal(await broken.locator('#qr-code svg[role="img"]').count(), 0);
        assert.equal(await broken.getByRole('link', { name: 'Baixar para Android' }).isVisible(), true);
        results.push({ unsafeConfiguredURL: 'rejected; APK link preserved' });

        const fallback = await browser.newPage();
        await fallback.route('**/html/download.html', async route => {
            const response = await route.fetch();
            await route.fulfill({ response, body: (await response.text()).replace('data-public-url=""', `data-public-url="${publicURL}"`) });
        });
        await fallback.route('**/js/vendor/qrcode.js', route => route.abort());
        await fallback.goto(url);
        await fallback.waitForFunction(() => document.querySelector('#qr-download').dataset.qrState === 'unavailable');
        assert.equal(await fallback.getByRole('link', { name: 'Baixar para Android' }).isVisible(), true);
        results.push({ encoderUnavailable: 'graceful fallback; APK link preserved' });
        fs.writeFileSync(path.join(output, 'download-qr-results.json'), JSON.stringify(results, null, 2));
        console.log(JSON.stringify(results, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
