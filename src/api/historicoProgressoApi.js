// ───────────────────────────────────────────────────────────────
// src/api/historicoProgressoApi.js
// Endpoints de histórico de progresso (peso e altura).
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Listar histórico por usuário.
 * GET /historico-progresso/usuario/{id_usuario}
 */
export const listarPorUsuario = async (idUsuario, skip = 0, limit = 100) => {
  const response = await api.get(`/historico-progresso/usuario/${idUsuario}`, {
    params: { skip, limit },
  });
  return response.data;
};

/**
 * Criar registro de progresso.
 * POST /historico-progresso/
 * @param {{ id_usuario, data_registro, peso_atual, altura_atual }} dados
 */
export const criar = async (dados) => {
  const response = await api.post('/historico-progresso/', dados);
  return response.data;
};

/**
 * Buscar histórico por ID.
 * GET /historico-progresso/{id_progresso}
 */
export const buscarPorId = async (idProgresso) => {
  const response = await api.get(`/historico-progresso/${idProgresso}`);
  return response.data;
};
