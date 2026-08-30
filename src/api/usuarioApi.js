// ───────────────────────────────────────────────────────────────
// src/api/usuarioApi.js
// Endpoints de gerenciamento de usuários.
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Listar todos os usuários.
 * GET /usuarios/
 */
export const listarTodos = async (skip = 0, limit = 100) => {
  const response = await api.get('/usuarios/', { params: { skip, limit } });
  return response.data;
};

/**
 * Buscar usuário por ID.
 * GET /usuarios/{id_usuario}
 */
export const buscarPorId = async (idUsuario) => {
  const response = await api.get(`/usuarios/${idUsuario}`);
  return response.data;
};

/**
 * Atualizar dados do usuário.
 * PUT /usuarios/{id_usuario}
 */
export const atualizar = async (idUsuario, dados) => {
  const response = await api.put(`/usuarios/${idUsuario}`, dados);
  return response.data;
};

/**
 * Desativar conta do usuário.
 * PATCH /usuarios/{id_usuario}/status
 */
export const desativar = async (idUsuario) => {
  const response = await api.patch(`/usuarios/${idUsuario}/status`);
  return response.data;
};

/**
 * Deletar usuário.
 * DELETE /usuarios/{id_usuario}
 */
export const deletar = async (idUsuario) => {
  await api.delete(`/usuarios/${idUsuario}`);
};
