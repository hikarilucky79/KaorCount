// ───────────────────────────────────────────────────────────────
// src/api/historicoProgressoApi.js
// Endpoints de histórico de progresso (peso e altura).
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F332] Solicita à API as medições de progresso associadas ao usuário.
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

// [F333] Cria um novo registro de histórico de progresso pela API.
/**
 * Criar registro de progresso.
 * POST /historico-progresso/
 * @param {{ id_usuario, data_registro, peso_atual, altura_atual }} dados
 */
export const criar = async (dados, config = {}) => {
  const response = await api.post('/historico-progresso/', dados, config);
  return response.data;
};

// [F334] Solicita à API a medição de progresso associada ao identificador informado.
/**
 * Buscar histórico por ID.
 * GET /historico-progresso/{id_progresso}
 */
export const buscarPorId = async (idProgresso) => {
  const response = await api.get(`/historico-progresso/${idProgresso}`);
  return response.data;
};
