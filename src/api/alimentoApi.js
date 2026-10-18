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

// O catálogo de alimentos é compartilhado: a API aceita apenas inclusão, nunca
// edição ou remoção de um alimento já usado nas refeições de outros usuários.
