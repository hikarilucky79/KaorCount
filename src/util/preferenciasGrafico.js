import AsyncStorage from '@react-native-async-storage/async-storage';
const CHAVE = '@kaorcount_periodo_grafico';
export async function carregarPeriodoGrafico() {
  try { return (await AsyncStorage.getItem(CHAVE)) === '30' ? 30 : 7; }
  catch { return 7; }
}
export async function salvarPeriodoGrafico(periodo) {
  if (![7, 30].includes(periodo)) throw new Error('Período inválido.');
  await AsyncStorage.setItem(CHAVE, String(periodo));
}
