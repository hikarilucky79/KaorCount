// Requires Playwright and Microsoft Edge; see backend/public/README.md.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const baseURL = process.env.SITE_URL || 'http://127.0.0.1:8765/html/index.html';
    const output = path.resolve('.impeccable/review');
    const results = [];
    fs.mkdirSync(output, { recursive: true });
    try {
        for (const width of [320, 390, 768, 1024, 1280, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
            await page.goto(baseURL);
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.getByRole('img', { name: 'Keenko', exact: true }).getAttribute('src'), '../img/logo_keenko.svg');
            assert.equal(await page.locator('.service-card').count(), 3);
            assert.equal(await page.locator('h1').innerText(), 'Mais autonomia para cuidar da sua alimentação.');
            assert.deepEqual(await page.locator('.service-card h3').allTextContents(), ['Registro de Refeições', 'Controle de Hidratação', 'Seu Progresso, Visível']);
            assert.equal(await page.getByText('Agendar Consulta', { exact: true }).count(), 0);
            assert.equal(await page.getByRole('link', { name: /^Baixar/ }).count(), 1, 'Only one primary download CTA');
            assert.deepEqual(await page.locator('a[href^="#"]').evaluateAll(links => links.filter(link => !document.getElementById(link.hash.slice(1))).map(link => link.hash)), []);
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px overflow`);
            assert.equal(await page.locator('#inicio').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(245, 245, 239)');
            const menu = page.locator('#mobile-menu');
            if (width < 1024) {
                await menu.locator('summary').click();
                assert.equal(await menu.getAttribute('open'), '');
                await page.keyboard.press('Escape');
                assert.equal(await menu.getAttribute('open'), null);
                assert.equal(await menu.locator('summary').evaluate(el => el === document.activeElement), true);
                await menu.locator('summary').click();
                await menu.getByRole('link', { name: 'Recursos', exact: true }).click();
                assert.equal(await menu.getAttribute('open'), null);
            }
            await page.getByRole('link', { name: 'Baixar o KaorCount', exact: true }).click();
            assert.equal(new URL(page.url()).pathname.endsWith('/html/download.html'), true);
            await page.goBack();
            await page.locator('#duvidas details summary').last().focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('#duvidas details').last().getAttribute('open'), '');
            await page.keyboard.press('Enter');
            await page.evaluate(() => { document.activeElement.blur(); window.scrollTo(0, 0); });
            await page.waitForFunction(() => window.scrollY === 0);
            await page.evaluate(() => window.scrollTo(0, 500));
            await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('is-hidden'));
            await page.evaluate(() => window.scrollTo(0, 300));
            await page.waitForFunction(() => !document.querySelector('.site-header').classList.contains('is-hidden'));
            await page.evaluate(() => window.scrollTo(0, 500));
            await page.waitForFunction(() => document.querySelector('.site-header').classList.contains('is-hidden'));
            await page.locator('.site-header a').first().focus();
            assert.equal(await page.locator('.site-header').evaluate(el => el.classList.contains('is-hidden')), false);
            await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode())));
            await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 0); });
            if (width === 390 || width === 1440) {
                await page.screenshot({ path: path.join(output, width === 390 ? 'mobile.png' : 'desktop.png'), fullPage: true });
            }
            assert.deepEqual(errors, []);
            results.push({ width, overflow: false, menuKeyboard: width < 1024 ? 'passed' : 'desktop', anchors: 'passed', downloadNavigation: 'passed', faqKeyboard: 'passed', errors });
            await page.close();
        }
        const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
        await noJS.goto(baseURL);
        await noJS.locator('#mobile-menu summary').click();
        await noJS.locator('#mobile-menu').getByRole('link', { name: 'Recursos', exact: true }).click();
        assert.equal(new URL(noJS.url()).hash, '#recursos');
        results.push({ noJS: 'native menu and navigation passed' });
        fs.writeFileSync(path.join(output, 'smoke-results.json'), JSON.stringify(results, null, 2));
        console.log(JSON.stringify(results, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
