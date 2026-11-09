// ───────────────────────────────────────────────────────────────
// src/api/metaNutriApi.js
// Endpoints das metas nutricionais.
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F343] Solicita à API as metas nutricionais associadas ao usuário.
/**
 * Listar metas nutricionais do usuário.
 * GET /metas-nutri/usuario/{id_usuario}
 */
export const listarPorUsuario = async (idUsuario) => {
  const response = await api.get(`/metas-nutri/usuario/${idUsuario}`);
  return response.data;
};

// [F344] Solicita à API a meta nutricional vigente do usuário.
/**
 * Buscar meta nutricional atual (ativa) do usuário.
 * GET /metas-nutri/usuario/{id_usuario}/atual
 */
export const metaAtual = async (idUsuario) => {
  try {
    const response = await api.get(`/metas-nutri/usuario/${idUsuario}/atual`);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// [F345] Solicita à API a meta nutricional associada ao identificador informado.
/**
 * Buscar meta por ID.
 * GET /metas-nutri/{id_meta}
 */
export const buscarPorId = async (idMeta) => {
  const response = await api.get(`/metas-nutri/${idMeta}`);
  return response.data;
};

// [F346] Solicita à API a criação de uma meta nutricional.
/**
 * Criar nova meta nutricional.
 * POST /metas-nutri/
 * @param {{ id_usuario, calorias_meta, proteina_meta_g, carboidrato_meta_g, gordura_meta_g }} dados
 */
export const criar = async (dados) => {
  const response = await api.post('/metas-nutri/', dados);
  return response.data;
};

// [F347] Solicita à API a atualização de uma meta nutricional.
/**
 * Atualizar meta nutricional.
 * PUT /metas-nutri/{id_meta}
 */
export const atualizar = async (idMeta, dados) => {
  const response = await api.put(`/metas-nutri/${idMeta}`, dados);
  return response.data;
};

// [F348] Solicita à API a remoção de uma meta nutricional.
/**
 * Deletar meta nutricional.
 * DELETE /metas-nutri/{id_meta}
 */
export const deletar = async (idMeta) => {
  await api.delete(`/metas-nutri/${idMeta}`);
};
