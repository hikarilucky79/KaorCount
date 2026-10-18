export const UNIDADES_PADRAO = { peso: 'kg', altura: 'cm', agua: 'ml' };

export const normalizarUnidades = (unidades = {}) => ({
  peso: ['kg', 'lb'].includes(unidades.peso) ? unidades.peso : 'kg',
  altura: ['cm', 'in'].includes(unidades.altura) ? unidades.altura : 'cm',
  agua: ['ml', 'L', 'fl oz'].includes(unidades.agua) ? unidades.agua : 'ml',
});

export const pesoParaKg = (valor, unidade = 'kg') => Number(valor) / (unidade === 'lb' ? 2.2046226218 : 1);
export const pesoDeKg = (kg, unidade = 'kg') => Number(kg) * (unidade === 'lb' ? 2.2046226218 : 1);
export const alturaParaCm = (valor, unidade = 'cm') => Number(valor) * (unidade === 'in' ? 2.54 : 1);
export const alturaDeCm = (cm, unidade = 'cm') => Number(cm) / (unidade === 'in' ? 2.54 : 1);

const formatarNumero = (valor, casas) => Number(Number(valor).toFixed(casas)).toString().replace('.', ',');

export const formatarPeso = (kg, unidade = 'kg') => `${formatarNumero(pesoDeKg(kg, unidade), 1)} ${unidade}`;
export const formatarAltura = (cm, unidade = 'cm') => `${formatarNumero(alturaDeCm(cm, unidade), unidade === 'cm' ? 0 : 1)} ${unidade}`;
export const formatarAgua = (ml, unidade = 'ml') => {
  const valor = unidade === 'L' ? Number(ml) / 1000 : unidade === 'fl oz' ? Number(ml) / 29.5735295625 : Number(ml);
  return `${formatarNumero(valor, unidade === 'ml' ? 0 : unidade === 'L' ? 2 : 1)} ${unidade}`;
};

export const formatarValorInput = (valor) => String(Number(Number(valor).toFixed(1)));
