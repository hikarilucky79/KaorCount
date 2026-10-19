import api from './client';
import { configIdempotente } from './idempotencia';

export const salvar = async (idUsuario, dados, chave) => {
  await api.put(`/quiz/${idUsuario}`, dados, configIdempotente(chave));
};
