import AsyncStorage from '@react-native-async-storage/async-storage';
const CHAVE = '@kaorcount_periodo_grafico';
// [F544] Carrega a preferência salva para o período do gráfico.
export async function carregarPeriodoGrafico() {
  try { return (await AsyncStorage.getItem(CHAVE)) === '30' ? 30 : 7; }
  catch { return 7; }
}
// [F545] Salva a preferência de período do gráfico.
export async function salvarPeriodoGrafico(periodo) {
  if (![7, 30].includes(periodo)) throw new Error('Período inválido.');
  await AsyncStorage.setItem(CHAVE, String(periodo));
}
