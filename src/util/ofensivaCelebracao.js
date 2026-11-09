import AsyncStorage from '@react-native-async-storage/async-storage';
import * as refeicaoApi from '../api/refeicaoApi';
import * as dashboardApi from '../api/dashboardApi';
import { dataDeHoje, formatarDataAPI } from './data';
import { primeiraComidaDoDia } from './rotina';

// [F540] Monta a chave usada para registrar a celebração de uma data.
const chave = (id, data) => `@kaorcount_ofensiva_${id}_${data}`;
// [F541] Verifica se a sequência de uso atingiu um marco e prepara sua celebração.
export async function prepararCelebracao(id, data, refeicoesConhecidas) {
  if (!id || data !== dataDeHoje()) return null;
  try {
    const [refeicoes, celebrada] = await Promise.all([
      refeicoesConhecidas ? Promise.resolve(refeicoesConhecidas) : refeicaoApi.listarPorDia(id, data),
      AsyncStorage.getItem(chave(id, data)).catch(() => null),
    ]);
    if (!primeiraComidaDoDia(data, dataDeHoje(), refeicoes, celebrada)) return null;
    const partes = data.split('-').map(Number);
    const ontem = new Date(partes[0], partes[1] - 1, partes[2]);
    ontem.setDate(ontem.getDate() - 1);
    const resumo = await dashboardApi.resumoDia(id, formatarDataAPI(ontem)).catch(() => null);
    return { id, data, anterior: resumo?.streak_dias ?? null };
  } catch {
    return null;
  }
}
// [F542] Registra que a celebração preparada foi exibida ao usuário.
export async function concluirCelebracao(preparada) {
  if (!preparada || preparada.data !== dataDeHoje()) return null;
  let anterior = preparada.anterior;
  if (anterior == null) {
    const resumo = await dashboardApi.resumoDia(preparada.id, preparada.data).catch(() => null);
    if (!resumo?.streak_dias) return null;
    anterior = Math.max(0, resumo.streak_dias - 1);
  }
  return { anterior, atual: anterior + 1 };
}
// [F543] Marca a celebração como concluída para evitar repetições.
export async function marcarCelebracao(id, data) {
  try { await AsyncStorage.setItem(chave(id, data), '1'); } catch { /* Não impede o registro da refeição. */ }
}
