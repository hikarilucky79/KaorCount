// ───────────────────────────────────────────────────────────────
// src/api/alimentoApi.js
// Endpoints de alimentos (base local).
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Listar alimentos da base local.
 * GET /alimentos/
 */
export const listarTodos = async (skip = 0, limit = 100) => {
  const response = await api.get('/alimentos/', { params: { skip, limit } });
  return response.data;
};

/**
 * Buscar alimento por ID.
 * GET /alimentos/{id_alimento}
 */
export const buscarPorId = async (idAlimento) => {
  const response = await api.get(`/alimentos/${idAlimento}`);
  return response.data;
};

/**
 * Buscar alimentos por nome.
 * GET /alimentos/buscar?nome=...
 */
export const buscarPorNome = async (nome, limit = 20) => {
  const response = await api.get('/alimentos/buscar', {
    params: { nome, limit },
  });
  return response.data;
};

/**
 * Criar novo alimento na base local.
 * POST /alimentos/
 */
export const criar = async (dados) => {
  const response = await api.post('/alimentos/', dados);
  return response.data;
};

/**
 * Atualizar alimento.
 * PUT /alimentos/{id_alimento}
 */
export const atualizar = async (idAlimento, dados) => {
  const response = await api.put(`/alimentos/${idAlimento}`, dados);
  return response.data;
};

/**
 * Deletar alimento.
 * DELETE /alimentos/{id_alimento}
 */
export const deletar = async (idAlimento) => {
  await api.delete(`/alimentos/${idAlimento}`);
};
