const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
// Importa as funções puras sem adicionar um executor de testes ao app.
const regras = import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync(path.join(__dirname, '../src/util/rotina.js'), 'utf8')).toString('base64'));
test('Ofensiva usa todos os marcos e conserva a última arte', async () => {
  const { marcoOfensiva } = await regras;
  for (const [dias, esperado] of [[0,0],[1,3],[4,3],[5,5],[9,5],[10,10],[20,20],[30,30],[50,50],[70,70],[99,70],[100,100],[199,100],[200,200],[350,200]]) assert.equal(marcoOfensiva(dias), esperado);
});
test('mensal ordena, recorta 31 para 30 e inclui zeros na média', async () => {
  const { historicoPeriodo } = await regras;
  const dias = Array.from({ length: 31 }, (_, i) => ({ data: '2026-01-' + String(i+1).padStart(2,'0'), calorias: i === 0 ? 9999 : i === 30 ? 300 : 0 })).reverse();
  const resultado = historicoPeriodo(dias, 30);
  assert.equal(resultado.dias.length, 30);
  assert.equal(resultado.dias[0].data, '2026-01-02');
  assert.equal(resultado.media, 10);
  assert.equal(dias[0].data, '2026-01-31');
  assert.deepEqual(historicoPeriodo([], 7), { dias: [], media: 0 });
});
test('datas reais, ano bissexto e ordem do intervalo', async () => {
  const { dataISO, validarPeriodo } = await regras;
  assert.equal(dataISO('29/02/2024'), '2024-02-29');
  for (const data of ['29/02/2025','31/04/2026','00/01/2026','2026-01-01','01/13/2026']) assert.throws(() => dataISO(data));
  assert.throws(() => validarPeriodo('02/01/2026', '01/01/2026'));
  assert.deepEqual(validarPeriodo('01/01/2026','01/01/2026'), ['2026-01-01','2026-01-01']);
});
test('cadastro aceita vírgula, zero e rejeita valores inválidos', async () => {
  const { validarAlimento, tipoRefeicao } = await regras;
  const alimento = { nome_alimento: ' Arroz ', porcao_padrao_g: '100', calorias: '120,5', proteinas: '2', carboidratos: '25', gorduras: '0' };
  const dados = validarAlimento(alimento);
  assert.equal(dados.calorias, 120.5);
  assert.equal(dados.nome_alimento, 'Arroz');
  assert.equal(dados.origem_dados, 'caseiro');
  for (const valores of [{nome_alimento:'a'}, {nome_alimento:'a'.repeat(151)}, {porcao_padrao_g:'0'}, {calorias:''}, {proteinas:'-1'}, {gorduras:'Infinity'}, {calorias:'12abc'}]) assert.throws(() => validarAlimento({...alimento,...valores}));
  for (const [origem, destino] of [['jantar', 'janta'], ['Jantar', 'janta'], ['Café da manhã', 'cafe_manha'], ['Almoço', 'almoco'], ['Lanche', 'lanche'], ['cafe_manha', 'cafe_manha']]) assert.equal(tipoRefeicao(origem), destino);
});

test('gráfico de peso trata lista vazia, um ponto e variações', async () => {
  const { pontosPeso } = await regras;
  assert.deepEqual(pontosPeso([]).pontos, []);
  const unico = pontosPeso([{data:'2026-10-27', peso_kg:50}]);
  assert.equal(unico.pontos[0].x, 64);
  assert.ok(Number.isFinite(unico.pontos[0].y));
  const dois = pontosPeso([{data:'2026-10-20',peso_kg:50},{data:'2026-10-27',peso_kg:52}]);
  assert.ok(dois.pontos[1].y < dois.pontos[0].y);
  assert.equal(dois.pontos[0].x, 64);
  assert.equal(dois.pontos[1].x, 596);
});

test('celebra apenas o primeiro alimento de hoje uma vez', async () => {
  const { primeiraComidaDoDia } = await regras;
  const hoje = '2026-10-27';
  assert.equal(primeiraComidaDoDia(hoje, hoje, [], null), true);
  assert.equal(primeiraComidaDoDia(hoje, hoje, [{ itens: [] }], null), true);
  assert.equal(primeiraComidaDoDia(hoje, hoje, [{ itens: [{ id: 1 }] }], null), false);
  assert.equal(primeiraComidaDoDia(hoje, hoje, [], '1'), false);
  assert.equal(primeiraComidaDoDia('2026-10-26', hoje, [], null), false);
  assert.equal(primeiraComidaDoDia(hoje, hoje, null, null), false);
});

test('refeição acompanha o horário local do dia', async () => {
  const { refeicaoDoHorario } = await regras;
  for (const [hora, esperado] of [[0,'janta'],[4,'janta'],[5,'cafe_manha'],[10,'cafe_manha'],[11,'almoco'],[13,'almoco'],[14,'lanche'],[17,'lanche'],[18,'janta'],[23,'janta']]) assert.equal(refeicaoDoHorario(hora), esperado);
});

test('exibe o nome natural do fubá já registrado', async () => {
  const { nomeAlimentoExibicao } = await regras;
  assert.equal(nomeAlimentoExibicao('Milho Fubá Cru'), 'Fubá de milho');
  assert.equal(nomeAlimentoExibicao('Fubá de milho, cru'), 'Fubá de milho');
  assert.equal(nomeAlimentoExibicao('Milho cozido'), 'Milho cozido');
});

test('simplifica somente nomes da TACO mantendo outras preparações', async () => {
  const { nomeAlimentoExibicao } = await regras;
  assert.equal(nomeAlimentoExibicao('Aveia Flocos Crua', 'Tabela TACO'), 'Aveia flocos');
  assert.equal(nomeAlimentoExibicao('Arroz, integral, cozido', 'Tabela TACO'), 'Arroz integral cozido');
  assert.equal(nomeAlimentoExibicao('Banana, da terra', 'Tabela TACO'), 'Banana da terra');
  assert.equal(nomeAlimentoExibicao('Arroz Cru', 'caseiro'), 'Arroz Cru');
});

test('apresenta peito de frango da TACO em ordem natural', async () => {
  const { nomeAlimentoExibicao } = await regras;
  assert.equal(nomeAlimentoExibicao('Frango Peito sem Pele Grelhado', 'Tabela TACO'), 'Peito de frango sem pele grelhado');
  assert.equal(nomeAlimentoExibicao('Frango, peito, com pele, assado', 'Tabela TACO'), 'Peito de frango com pele assado');
});
