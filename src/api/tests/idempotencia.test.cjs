// Exercita os módulos reais com Axios; apenas recursos nativos são substituídos.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const axios = require('axios');

async function carregar() {
  const context = vm.createContext({ console, process: { env: {} } });
  const cache = new Map();
  const nativos = {
    axios: { default: axios },
    'react-native': { Platform: { OS: 'web' } },
    'expo-constants': { default: {} },
    'expo-crypto': { randomUUID },
    '../auth/tokenBridge': { obterTokenAutorizacao: async () => null, limparSessaoGlobal: async () => {} },
  };
  async function modulo(nome) {
    if (cache.has(nome)) return cache.get(nome);
    let m;
    if (nativos[nome]) {
      const valores = nativos[nome];
      m = new vm.SyntheticModule(Object.keys(valores), function () {
        for (const [k,v] of Object.entries(valores)) this.setExport(k,v);
      }, { context });
    } else {
      const arquivo = nome === './idempotencia' ? 'idempotencia.js' : 'client.js';
      m = new vm.SourceTextModule(await fs.readFile(path.join(__dirname,'..',arquivo),'utf8'), { context });
    }
    cache.set(nome,m);
    await m.link(modulo);
    return m;
  }
  const client = await modulo('./client');
  await client.evaluate();
  return { api: client.namespace.default, helpers: cache.get('./idempotencia').namespace };
}

function resposta(config, dados = { ok: true }) {
  return { data: dados, status: 201, statusText: 'Created', headers: {}, config };
}

test('resposta perdida reenvia o mesmo corpo e a mesma chave apenas uma vez', async () => {
  const { api } = await carregar();
  const chamadas = [];
  api.defaults.adapter = async config => {
    chamadas.push({ chave: config.headers.get('Idempotency-Key'), corpo: config.data });
    if (chamadas.length === 1) throw new axios.AxiosError('Timeout', 'ECONNABORTED', config);
    return resposta(config);
  };
  await api.post('/registro-agua/', { quantidade_ml: 250 });
  assert.equal(chamadas.length, 2);
  assert.ok(chamadas[0].chave);
  assert.deepEqual(chamadas[0], chamadas[1]);
});

test('ações novas com conteúdo igual recebem chaves diferentes', async () => {
  const { api } = await carregar();
  const chaves = [];
  api.defaults.adapter = async config => { chaves.push(config.headers.get('Idempotency-Key'));return resposta(config); };
  await api.post('/registro-agua/', { quantidade_ml: 250 });
  await api.post('/registro-agua/', { quantidade_ml: 250 });
  assert.notEqual(chaves[0], chaves[1]);
});

test('chave explícita não é sobrescrita mesmo em header minúsculo', async () => {
  const { api } = await carregar();
  api.defaults.adapter = async config => {
    assert.equal(config.headers.get('Idempotency-Key'), 'operacao-manual-01');
    return resposta(config);
  };
  await api.post('/refeicoes/', {}, { headers: { 'idempotency-key': 'operacao-manual-01' } });
});

test('conflitos 409 não são repetidos automaticamente', async () => {
  const { api } = await carregar();
  let chamadas = 0;
  api.defaults.adapter = async config => {
    chamadas++;
    throw new axios.AxiosError('Conflito', null, config, null, { status: 409, data: { detail: 'Outra operação' } });
  };
  await assert.rejects(api.post('/refeicoes/', {}), error => error.response.status === 409);
  assert.equal(chamadas, 1);
});

test('falha persistente possui no máximo um reenvio', async () => {
  const { api } = await carregar();
  let chamadas = 0;
  api.defaults.adapter = async config => { chamadas++;throw new axios.AxiosError('Timeout','ECONNABORTED',config); };
  await assert.rejects(api.post('/refeicoes/', {}));
  assert.equal(chamadas, 2);
});

test('login não recebe chave e não é reenviado automaticamente', async () => {
  const { api } = await carregar();
  let chamadas = 0;
  api.defaults.adapter = async config => {
    chamadas++;
    assert.equal(config.headers.get('Idempotency-Key'), undefined);
    throw new axios.AxiosError('Timeout','ECONNABORTED',config);
  };
  await assert.rejects(api.post('/auth/login', {}));
  assert.equal(chamadas, 1);
});

test('tentativa manual mantém a chave e uma nova ação pode renovar a chave', async () => {
  const { helpers } = await carregar();
  const ref = { current: null };
  const primeira = helpers.chaveDaOperacao(ref, { agua: 250 });
  assert.equal(helpers.chaveDaOperacao(ref, { agua: 250 }), primeira);
  ref.current = null;
  assert.notEqual(helpers.chaveDaOperacao(ref, { agua: 250 }), primeira);
});
