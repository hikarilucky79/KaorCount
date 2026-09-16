// ───────────────────────────────────────────────────────────────
// src/api/auth0Api.js
// Autenticação EMBUTIDA no Auth0 (tela do próprio app):
//   - login: POST /oauth/token (grant password-realm)
// A conexão "Username-Password-Authentication" do Auth0 é uma Custom
// Database: ela valida a credencial chamando o backend local. O Auth0
// emite os tokens; os usuários vivem só no banco do app.
// ───────────────────────────────────────────────────────────────
import { AUTH0_DOMINIO, AUTH0_CLIENT_ID } from '../auth/auth0Config';

const BASE = `https://${AUTH0_DOMINIO}`;

function mensagemErroLogin(status, dados) {
  const code = dados?.error;
  if (code === 'unauthorized_client') {
    return 'Login embutido não habilitado no Auth0. Habilite o Grant Type "Password" na aplicação (Advanced Settings → Grant Types).';
  }
  if (
    code === 'invalid_grant' ||
    code === 'unauthorized' ||
    code === 'invalid_password' ||
    code === 'invalid_user_credentials' ||
    code === 'access_denied'
  ) {
    return 'E-mail ou senha incorretos.';
  }
  if (dados?.error_description) return dados.error_description;
  return 'Falha ao autenticar com o Auth0. Tente novamente.';
}

/**
 * Autentica com e-mail e senha no Auth0.
 * Usa o grant "password-realm" com a conexão explicitada, o que dispensa
 * configurar "Default Directory" no tenant.
 * @returns {Promise<{access_token: string, id_token: string, token_type: string}>}
 */
export async function autenticarComSenha(email, senha) {
  const resp = await fetch(`${BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      realm: 'Username-Password-Authentication',
      client_id: AUTH0_CLIENT_ID,
      username: (email || '').trim(),
      password: senha,
      scope: 'openid profile email',
    }),
  });
  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok || !dados.id_token) {
    throw new Error(mensagemErroLogin(resp.status, dados));
  }
  return dados;
}