export const UNIDADES_PADRAO = { peso: 'kg', altura: 'cm', agua: 'ml' };

// [F522] Completa e padroniza as preferências de unidade de medida.
export const normalizarUnidades = (unidades = {}) => ({
  peso: ['kg', 'lb'].includes(unidades.peso) ? unidades.peso : 'kg',
  altura: ['cm', 'in'].includes(unidades.altura) ? unidades.altura : 'cm',
  agua: ['ml', 'L', 'fl oz'].includes(unidades.agua) ? unidades.agua : 'ml',
});

// [F523] Converte o peso informado para quilogramas.
export const pesoParaKg = (valor, unidade = 'kg') => Number(valor) / (unidade === 'lb' ? 2.2046226218 : 1);
// [F524] Converte quilogramas para a unidade de peso escolhida.
export const pesoDeKg = (kg, unidade = 'kg') => Number(kg) * (unidade === 'lb' ? 2.2046226218 : 1);
// [F525] Converte a altura informada para centímetros.
export const alturaParaCm = (valor, unidade = 'cm') => Number(valor) * (unidade === 'in' ? 2.54 : 1);
// [F526] Converte centímetros para a unidade de altura escolhida.
export const alturaDeCm = (cm, unidade = 'cm') => Number(cm) / (unidade === 'in' ? 2.54 : 1);

// [F527] Formata um número para exibição com vírgula decimal.
const formatarNumero = (valor, casas) => Number(Number(valor).toFixed(casas)).toString().replace('.', ',');

// [F528] Formata o peso na unidade escolhida para exibição.
export const formatarPeso = (kg, unidade = 'kg') => `${formatarNumero(pesoDeKg(kg, unidade), 1)} ${unidade}`;
// [F529] Formata a altura na unidade escolhida para exibição.
export const formatarAltura = (cm, unidade = 'cm') => `${formatarNumero(alturaDeCm(cm, unidade), unidade === 'cm' ? 0 : 1)} ${unidade}`;
// [F530] Formata o consumo de água na unidade escolhida para exibição.
export const formatarAgua = (ml, unidade = 'ml') => {
  const valor = unidade === 'L' ? Number(ml) / 1000 : unidade === 'fl oz' ? Number(ml) / 29.5735295625 : Number(ml);
  return `${formatarNumero(valor, unidade === 'ml' ? 0 : unidade === 'L' ? 2 : 1)} ${unidade}`;
};

// [F531] Prepara o número para ser exibido em um campo de entrada.
export const formatarValorInput = (valor) => String(Number(Number(valor).toFixed(1)));

// [F532] Obtém as preferências de unidade salvas na conta e padroniza seus valores.
export const unidadesDaConta = preferencias => normalizarUnidades({ peso: preferencias?.unidade_peso, altura: preferencias?.unidade_altura, agua: preferencias?.unidade_agua });
