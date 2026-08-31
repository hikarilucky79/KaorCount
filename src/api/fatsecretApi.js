// ───────────────────────────────────────────────────────────────
// src/api/fatsecretApi.js
// Endpoints da integração com o FatSecret (base externa).
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Buscar alimentos na base do FatSecret.
 * GET /fatsecret/buscar?nome=...&pagina=0&max_resultados=20
 */
export const buscarAlimentos = async (nome, pagina = 0, maxResultados = 25, categoria = null, somenteBrasil = false) => {
  const params = { nome, pagina, max_resultados: maxResultados };
  if (categoria && categoria !== 'todos') params.categoria = categoria;
  if (somenteBrasil) params.somente_brasil = true;
  const response = await api.get('/fatsecret/buscar', { params });
  return response.data;
};

/**
 * Detalhes de um alimento do FatSecret.
 * GET /fatsecret/alimento/{food_id}
 */
export const detalhesAlimento = async (foodId) => {
  const response = await api.get(`/fatsecret/alimento/${foodId}`);
  return response.data;
};

/**
 * Importar alimento do FatSecret para a base local.
 * POST /fatsecret/importar/{food_id}
 */
export const importarAlimento = async (foodId) => {
  const response = await api.post(`/fatsecret/importar/${foodId}`);
  return response.data;
};
