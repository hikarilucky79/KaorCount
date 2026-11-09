// ───────────────────────────────────────────────────────────────
// src/api/perfilNutriApi.js
// Endpoints do perfil nutricional do usuário.
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F349] Solicita à API os dados do perfil nutricional do usuário.
/**
 * Buscar perfil nutricional por ID do usuário.
 * GET /perfil-nutri/{id_usuario}
 */
export const buscarPerfil = async (idUsuario) => {
  const response = await api.get(`/perfil-nutri/${idUsuario}`);
  return response.data;
};

// [F350] Solicita à API a criação do perfil nutricional.
/**
 * Criar perfil nutricional.
 * POST /perfil-nutri/
 * @param {{ id_usuario, data_nascimento, sexo, altura_cm, peso_kg, nivel_atividade, objetivo }} dados
 */
export const criarPerfil = async (dados) => {
  const response = await api.post('/perfil-nutri/', dados);
  return response.data;
};

// [F351] Solicita à API a atualização do perfil nutricional.
/**
 * Atualizar perfil nutricional.
 * PUT /perfil-nutri/{id_usuario}
 */
export const atualizarPerfil = async (idUsuario, dados) => {
  const response = await api.put(`/perfil-nutri/${idUsuario}`, dados);
  return response.data;
};

// [F352] Solicita à API a remoção do perfil nutricional.
/**
 * Deletar perfil nutricional.
 * DELETE /perfil-nutri/{id_usuario}
 */
export const deletarPerfil = async (idUsuario) => {
  await api.delete(`/perfil-nutri/${idUsuario}`);
};

// [F353] Cria ou atualiza pela API o perfil nutricional.
/**
 * Salvar ou atualizar perfil nutricional (cria se não existir, atualiza se existir).
 */
export const salvarOuAtualizar = async (idUsuario, dados) => {
  try {
    const response = await api.put(`/perfil-nutri/${idUsuario}`, dados);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      const response = await api.post('/perfil-nutri/', { id_usuario: idUsuario, ...dados });
      return response.data;
    }
    throw error;
  }
};

