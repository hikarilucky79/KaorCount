import api from './client';

export const salvarOuAtualizar = async (idUsuario, dados) => {
  const response = await api.put(`/pesquisa-inicial/${idUsuario}`, dados);
  return response.data;
};
