// ───────────────────────────────────────────────────────────────
// src/api/usuarioApi.js
// Endpoints de gerenciamento de usuários.
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F379] Solicita à API a lista de contas de usuário.
/**
 * Listar todos os usuários.
 * GET /usuarios/
 */
export const listarTodos = async (skip = 0, limit = 100) => {
  const response = await api.get('/usuarios/', { params: { skip, limit } });
  return response.data;
};

// [F380] Solicita à API a conta associada ao identificador informado.
/**
 * Buscar usuário por ID.
 * GET /usuarios/{id_usuario}
 */
export const buscarPorId = async (idUsuario) => {
  const response = await api.get(`/usuarios/${idUsuario}`);
  return response.data;
};

// [F381] Solicita à API a atualização dos dados da conta do usuário.
/**
 * Atualizar dados do usuário.
 * PUT /usuarios/{id_usuario}
 */
export const atualizar = async (idUsuario, dados) => {
  const response = await api.put(`/usuarios/${idUsuario}`, dados);
  return response.data;
};

// [F382] Solicita à API a desativação da conta do usuário.
/**
 * Desativar conta do usuário.
 * PATCH /usuarios/{id_usuario}/status
 */
export const desativar = async (idUsuario) => {
  const response = await api.patch(`/usuarios/${idUsuario}/status`);
  return response.data;
};

// [F383] Solicita à API a remoção da conta do usuário.
/**
 * Deletar usuário.
 * DELETE /usuarios/{id_usuario}
 */
export const deletar = async (idUsuario) => {
  await api.delete(`/usuarios/${idUsuario}`);
};
