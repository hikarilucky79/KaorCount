// [F552] Retorna o marco de sequência correspondente ao número de dias informado.
export const marcoOfensiva = dias => dias > 0 ? [200, 100, 70, 50, 30, 20, 10, 5].find(marco => dias >= marco) || 3 : 0;
// [F553] Calcula os dias que compõem o período selecionado no histórico.
export const historicoPeriodo = (dias, periodo) => {
  const registros = [...(dias || [])].sort((a, b) => a.data.localeCompare(b.data)).slice(-periodo);
  return { dias: registros, media: registros.length ? Math.round(registros.reduce((s, d) => s + (Number(d.calorias) || 0), 0) / registros.length) : 0 };
};
// [F554] Valida e converte uma data para o formato ISO.
export const dataISO = texto => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!match) throw new Error('Informe as datas no formato DD/MM/AAAA.');
  const [, dia, mes, ano] = match;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  if (data.getFullYear() !== Number(ano) || data.getMonth() !== Number(mes) - 1 || data.getDate() !== Number(dia)) throw new Error('Informe uma data válida.');
  return ano + '-' + mes + '-' + dia;
};
// [F555] Confere se o intervalo de datas informado é válido.
export const validarPeriodo = (inicio, fim) => {
  const datas = [dataISO(inicio), dataISO(fim)];
  if (datas[0] > datas[1]) throw new Error('A data inicial deve ser anterior ou igual à final.');
  return datas;
};
// [F556] Valida os campos obrigatórios de um alimento.
export const validarAlimento = campos => {
  const dados = { nome_alimento: campos.nome_alimento.trim(), origem_dados: 'caseiro' };
  if (dados.nome_alimento.length < 2 || dados.nome_alimento.length > 150) throw new Error('O nome deve ter entre 2 e 150 caracteres.');
  for (const campo of ['porcao_padrao_g', 'calorias', 'proteinas', 'carboidratos', 'gorduras']) {
    const texto = String(campos[campo]).trim();
    const numero = Number(texto.replace(',', '.'));
    if (!texto || !Number.isFinite(numero) || numero < 0 || (campo === 'porcao_padrao_g' && numero === 0)) throw new Error('Preencha os valores nutricionais com números válidos e uma porção maior que zero.');
    dados[campo] = numero;
  }
  return dados;
};
// [F557] Converte o tipo de refeição para o padrão aceito pelo aplicativo.
export const tipoRefeicao = tipo => {
  const normalizado = String(tipo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, '_');
  if (normalizado === 'cafe_da_manha') return 'cafe_manha';
  return normalizado === 'jantar' ? 'janta' : normalizado;
};

// [F558] Prepara os pontos do gráfico a partir dos registros de peso.
export const pontosPeso = registros => {
  const validos = (registros || []).filter(r => Number.isFinite(Number(r.peso_kg)) && Number(r.peso_kg) > 0);
  if (!validos.length) return { pontos: [], minimo: 0, maximo: 0 };
  const pesos = validos.map(r => Number(r.peso_kg));
  const menor = Math.min(...pesos), maior = Math.max(...pesos);
  const margem = Math.max((maior - menor) * 0.15, 0.5);
  const minimo = menor - margem, maximo = maior + margem;
  return { minimo, maximo, pontos: validos.map((r, i) => ({
    ...r, x: validos.length === 1 ? 64 : 64 + i * 532 / (validos.length - 1),
    y: 22 + (maximo - Number(r.peso_kg)) / (maximo - minimo) * 120,
  })) };
};

// [F559] Verifica se a refeição registrada é a primeira do dia e se pode gerar celebração.
export const primeiraComidaDoDia = (dataRegistro, hoje, refeicoes, celebrada) =>
  dataRegistro === hoje && !celebrada && Array.isArray(refeicoes) && !refeicoes.some(r => Array.isArray(r.itens) && r.itens.length > 0);

// [F560] Escolhe a categoria de refeição correspondente ao horário.
export const refeicaoDoHorario = hora => hora >= 5 && hora < 11 ? 'cafe_manha' : hora >= 11 && hora < 14 ? 'almoco' : hora >= 14 && hora < 18 ? 'lanche' : 'janta';

// [F561] Formata o nome do alimento para apresentação na interface.
export const nomeAlimentoExibicao = (nome, origem) => {
  if (/^(?:milho fubá cru|fubá de milho(?:, cru)?)$/i.test(nome || '')) return 'Fubá de milho';
  if (!/taco/i.test(origem || '') || !nome) return nome;
  const texto = nome.replace(/(?:,\s*|\s+)(?:cru|crua|crus|cruas)(?=,|\s|$)/gi, '').replace(/\s*,\s*/g, ' ').replace(/\s+/g, ' ').trim();
  const minusculo = texto.toLocaleLowerCase('pt-BR').replace(/^frango peito(?=\s|$)/, 'peito de frango');
  return minusculo.charAt(0).toLocaleUpperCase('pt-BR') + minusculo.slice(1);
};
