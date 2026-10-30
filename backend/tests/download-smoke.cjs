const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

(async () => {
    const browser = await chromium.launch({ channel: 'msedge', headless: true });
    const baseURL = process.env.DOWNLOAD_PAGE_URL || 'http://127.0.0.1:8765/html/download.html';
    const output = path.resolve('.impeccable/review');
    const results = [];
    fs.mkdirSync(output, { recursive: true });
    try {
        for (const width of [320, 390, 768, 1024, 1440]) {
            const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
            const errors = [];
            page.on('pageerror', error => errors.push(error.message));
            page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
            await page.goto(baseURL);
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.locator('h1').count(), 1);
            assert.equal(await page.locator('.download-feature').count(), 3);
            assert.equal(await page.getByRole('img', { name: 'Keenko', exact: true }).getAttribute('src'), '../img/logo_keenko.svg');
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px overflow`);
            await page.locator('.questions summary').last().focus();
            await page.keyboard.press('Enter');
            assert.equal(await page.locator('.questions details').last().getAttribute('open'), '');
            await page.keyboard.press('Enter');
            const checksum = page.locator('.questions details').nth(3);
            await checksum.locator('summary').click();
            if (width < 1024) {
                await page.locator('#mobile-menu summary').click();
                await page.keyboard.press('Escape');
                assert.equal(await page.locator('#mobile-menu').getAttribute('open'), null);
            }
            assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `${width}px checksum overflow`);
            await checksum.locator('summary').click();
            if (width === 390) {
                const [download] = await Promise.all([
                    page.waitForEvent('download'),
                    page.getByRole('link', { name: 'Baixar para Android' }).click(),
                ]);
                assert.equal(download.suggestedFilename(), 'KaorCount-android.apk');
                assert.equal(await download.failure(), null);
                const file = fs.readFileSync(await download.path());
                assert.equal(file.length, 90423942);
                assert.equal(crypto.createHash('sha256').update(file).digest('hex'), '236bea526ec8d338f8bcf444537ddea76b6cdce8c2a588ba0ec7fa0e2686de08');
                results.push({ download: 'passed', bytes: file.length, sha256: 'matched current APK' });
            }
            await page.evaluate(() => { document.activeElement.blur(); scrollTo(0, 0); });
            if (width === 390 || width === 1440) {
                await page.screenshot({ path: path.join(output, `download-${width === 390 ? 'mobile' : 'desktop'}.png`), fullPage: true });
            }
            assert.deepEqual(errors, []);
            results.push({ width, overflow: false, keyboardFAQ: 'passed', errors });
            await page.close();
        }
        const noJS = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
        await noJS.goto(baseURL);
        assert.equal(await noJS.getByRole('link', { name: 'Baixar para Android' }).isVisible(), true);
        await noJS.getByRole('link', { name: 'Veja como instalar' }).click();
        assert.equal(new URL(noJS.url()).hash, '#como-instalar');
        results.push({ noJS: 'download link and instructions available' });
        fs.writeFileSync(path.join(output, 'download-results.json'), JSON.stringify(results, null, 2));
        console.log(JSON.stringify(results, null, 2));
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
