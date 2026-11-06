// ───────────────────────────────────────────────────────────────
// src/api/authApi.js
// Endpoints de autenticação: login, registro e perfil atual.
// ───────────────────────────────────────────────────────────────
import api from './client';
import { configIdempotente } from './idempotencia';

/**
 * Registrar um novo usuário.
 * POST /auth/registrar
 * @param {{ nome: string, email: string, senha: string, token_verificacao?: string }} dados
 */
export const registrar = async (dados) => {
  const response = await api.post('/auth/registrar', dados);
  return response.data;
};

/**
 * Envia um código de 6 dígitos para o e-mail informado.
 * POST /auth/email/enviar-codigo
 */
export const enviarCodigoEmail = async (email) => {
  await api.post('/auth/email/enviar-codigo', { email: email.trim() });
};

/**
 * Confirma o código recebido por e-mail.
 * POST /auth/email/confirmar
 * @returns {string} token_verificacao, exigido no cadastro da conta.
 */
export const confirmarCodigoEmail = async (email, codigo) => {
  const response = await api.post('/auth/email/confirmar', { email: email.trim(), codigo });
  return response.data.token_verificacao;
};

export const registrarComQuiz = async (cadastro, quiz, chave) => {
  const response = await api.post('/auth/registrar-com-quiz', { cadastro, quiz }, configIdempotente(chave));
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
 * GET /auth/me — usa o token salvo no AsyncStorage via interceptor.
 */
export const getPerfilAtual = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
