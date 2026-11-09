// ───────────────────────────────────────────────────────────────
// src/api/authApi.js
// Endpoints de autenticação: login, registro e perfil atual.
// ───────────────────────────────────────────────────────────────
import api from './client';
import { configIdempotente } from './idempotencia';

// [F314] Envia à API os dados para criar uma conta de usuário.
/**
 * Registrar um novo usuário.
 * POST /auth/registrar
 * @param {{ nome: string, email: string, senha: string, token_verificacao?: string }} dados
 */
export const registrar = async (dados) => {
  const response = await api.post('/auth/registrar', dados);
  return response.data;
};

// [F315] Solicita à API o envio de um código para o endereço informado.
/**
 * Envia um código de 6 dígitos para o e-mail informado.
 * POST /auth/email/enviar-codigo
 */
export const enviarCodigoEmail = async (email) => {
  await api.post('/auth/email/enviar-codigo', { email: email.trim() });
};

// [F316] Envia à API o código digitado para confirmar o endereço de e-mail.
/**
 * Confirma o código recebido por e-mail.
 * POST /auth/email/confirmar
 * @returns {string} token_verificacao, exigido no cadastro da conta.
 */
export const confirmarCodigoEmail = async (email, codigo) => {
  const response = await api.post('/auth/email/confirmar', { email: email.trim(), codigo });
  return response.data.token_verificacao;
};

// [F317] Solicita à API o envio de um código para recuperação da senha.
/**
 * Pede o código de redefinição de senha. A API responde 204 mesmo que o e-mail
 * não tenha conta, então a tela deve dizer "se o e-mail existir, enviamos um código".
 * POST /auth/senha/esqueci
 */
export const esqueciSenha = async (email) => {
  await api.post('/auth/senha/esqueci', { email: email.trim() });
};

// [F318] Envia à API o código de recuperação e a nova senha.
/**
 * Troca a senha usando o código recebido por e-mail.
 * POST /auth/senha/redefinir
 */
export const redefinirSenha = async (email, codigo, novaSenha) => {
  await api.post('/auth/senha/redefinir', {
    email: email.trim(),
    codigo,
    nova_senha: novaSenha,
  });
};

// [F319] Envia à API os dados da conta e as respostas do quiz em uma operação idempotente.
export const registrarComQuiz = async (cadastro, quiz, chave) => {
  const response = await api.post('/auth/registrar-com-quiz', { cadastro, quiz }, configIdempotente(chave));
  return response.data;
};

// [F320] Envia as credenciais à API e recebe os dados de autenticação.
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

// [F321] Solicita à API os dados do usuário autenticado.
/**
 * Buscar o perfil do usuário autenticado.
 * GET /auth/me — usa o token salvo no AsyncStorage via interceptor.
 */
export const getPerfilAtual = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
