const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Importa as funções puras sem adicionar um executor de testes ao app.
const versao = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(__dirname, '../src/util/versao.js'), 'utf8')).toString('base64'));

test('compara versões numericamente, não como texto', async () => {
  const { compararVersoes } = await versao;
  assert.equal(compararVersoes('1.0.0', '1.0.0'), 0);
  assert.equal(compararVersoes('1.0.0', '1.0.1'), -1);
  assert.equal(compararVersoes('1.10.0', '1.9.0'), 1);
  assert.equal(compararVersoes('2', '1.9.9'), 1);
  assert.equal(compararVersoes('1.2', '1.2.0'), 0);
  assert.equal(compararVersoes('v1.2.3', '1.2.3'), 0);
});

test('versão ilegível não decide nada', async () => {
  const { compararVersoes } = await versao;
  assert.equal(compararVersoes(undefined, '1.0.0'), null);
  assert.equal(compararVersoes('1.0.0', ''), null);
  assert.equal(compararVersoes('1.0.0-beta', '1.0.0'), null);
});

test('só pede atualização quando a instalada é anterior à atual', async () => {
  const { avaliarAtualizacao } = await versao;
  const servidor = { versao_atual: '1.2.0', versao_minima: '1.1.0', url_download: '/downloads/app.apk' };
  assert.equal(avaliarAtualizacao('1.2.0', servidor), null);
  assert.equal(avaliarAtualizacao('1.3.0', servidor), null);
  assert.deepEqual(avaliarAtualizacao('1.1.5', servidor), { versaoAtual: '1.2.0', obrigatoria: false, url: '/downloads/app.apk' });
  assert.equal(avaliarAtualizacao('1.0.9', servidor).obrigatoria, true);
});

test('resposta ou versão instalada inválidas nunca bloqueiam o app', async () => {
  const { avaliarAtualizacao } = await versao;
  assert.equal(avaliarAtualizacao('1.0.0', undefined), null);
  assert.equal(avaliarAtualizacao('1.0.0', { versao_atual: 'abc', versao_minima: '1.0.0' }), null);
  assert.equal(avaliarAtualizacao(undefined, { versao_atual: '2.0.0', versao_minima: '2.0.0' }), null);
});

test('resolve a URL de download contra a origem da API', async () => {
  const { resolverUrl } = await versao;
  assert.equal(resolverUrl('/downloads/app.apk', 'https://keenko.vercel.app/api/v1'), 'https://keenko.vercel.app/downloads/app.apk');
  assert.equal(resolverUrl('downloads/app.apk', 'http://192.168.0.5:8000/api/v1/'), 'http://192.168.0.5:8000/downloads/app.apk');
  assert.equal(resolverUrl('https://cdn.exemplo.com/app.apk', 'https://keenko.vercel.app/api/v1'), 'https://cdn.exemplo.com/app.apk');
  assert.equal(resolverUrl('', 'https://keenko.vercel.app/api/v1'), '');
});
