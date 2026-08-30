// ───────────────────────────────────────────────────────────────
// src/api/authApi.js
// Endpoints de autenticação: login, registro e perfil atual.
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Registrar um novo usuário.
 * POST /auth/registrar
 * @param {{ nome: string, email: string, senha: string }} dados
 */
export const registrar = async (dados) => {
  const response = await api.post('/auth/registrar', dados);
  return response.data;
};

/**
 * Fazer login com e-mail e senha.
 * POST /auth/login
 * @param {string} email
 * @param {string} senha
 * @returns {{ access_token: string, token_type: string }}
 */
export const login = async (email, senha) => {
  const response = await api.post('/auth/login', {
    email: email.trim(),
    senha: senha,
  });
  return response.data;
};

/**
 * Buscar o perfil do usuário autenticado.
 * GET /auth/me
 */
export const getPerfilAtual = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
