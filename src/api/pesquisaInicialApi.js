import api from './client';

// [F354] Cria ou atualiza pela API as respostas da pesquisa inicial.
export const salvarOuAtualizar = async (idUsuario, dados) => {
  const response = await api.put(`/pesquisa-inicial/${idUsuario}`, dados);
  return response.data;
};
