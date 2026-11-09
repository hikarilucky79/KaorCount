import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizarUnidades, UNIDADES_PADRAO } from './medidas';

const CHAVE_UNIDADES = '@kaorcount_unidades';

// [F564] Carrega do armazenamento local as preferências de unidades.
export const carregarUnidades = async () => {
  try {
    const salvo = await AsyncStorage.getItem(CHAVE_UNIDADES);
    return normalizarUnidades(salvo ? JSON.parse(salvo) : UNIDADES_PADRAO);
  } catch {
    return { ...UNIDADES_PADRAO };
  }
};

// [F565] Persiste no armazenamento local as preferências de unidades.
export const salvarUnidades = async (unidades) => {
  await AsyncStorage.setItem(CHAVE_UNIDADES, JSON.stringify(normalizarUnidades(unidades)));
};
