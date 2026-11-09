import api from './client';
import { configIdempotente } from './idempotencia';

// [F355] Envia à API as respostas do questionário de cadastro.
export const salvar = async (idUsuario, dados, chave) => {
  await api.put(`/quiz/${idUsuario}`, dados, configIdempotente(chave));
};
