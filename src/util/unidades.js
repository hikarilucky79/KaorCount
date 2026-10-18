import AsyncStorage from '@react-native-async-storage/async-storage';
import { normalizarUnidades, UNIDADES_PADRAO } from './medidas';

const CHAVE_UNIDADES = '@kaorcount_unidades';

export const carregarUnidades = async () => {
  try {
    const salvo = await AsyncStorage.getItem(CHAVE_UNIDADES);
    return normalizarUnidades(salvo ? JSON.parse(salvo) : UNIDADES_PADRAO);
  } catch {
    return { ...UNIDADES_PADRAO };
  }
};

export const salvarUnidades = async (unidades) => {
  await AsyncStorage.setItem(CHAVE_UNIDADES, JSON.stringify(normalizarUnidades(unidades)));
};
