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

// ───────────────────────────────────────────────────────────────
// O Auth0 responde { error, error_description }.
// Cuidado: "invalid_grant" cobre DOIS casos muito diferentes —
//   (a) e-mail/senha realmente inválidos;
//   (b) o script da Custom Database Connection lançou exceção
//       (ex.: backend fora do ar). Nesse caso a descrição vem
//       com um "diag=<erro real>".
// Sem separar os dois, toda falha de infraestrutura aparecia
// na tela como "E-mail ou senha incorretos".
// ───────────────────────────────────────────────────────────────
const ERROS_ESPECIFICOS = {
  unauthorized_client:
    'Login embutido não habilitado no Auth0. Habilite o Grant Type "Password" em Advanced Settings → Grant Types.',
  unsupported_grant_type:
    'Grant não suportado. Confira EXPO_PUBLIC_AUTH0_DOMAIN e o tipo da aplicação no Auth0.',
  invalid_client: 'Client ID do Auth0 inválido. Confira EXPO_PUBLIC_AUTH0_CLIENT_ID no .env.',
  access_denied:
    'Acesso negado pelo Auth0. A conta pode estar bloqueada ou sob proteção contra força bruta.',
  too_many_requests: 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.',
  mfa_required:
    'Esta conta exige verificação em duas etapas (MFA), ainda não suportada pelo login embutido.',
};

function mensagemErroLogin(status, dados) {
  const code = dados?.error;
  const descricao = dados?.error_description || '';

  // ↓ Falha de infraestrutura no script do Auth0 → não é erro de senha.
  const diag = descricao.match(/diag=(.*)$/);
  if (diag) {
    return (
      'O Auth0 não conseguiu consultar o servidor de usuários: ' +
      `${diag[1]}. Verifique a URL no script da conexão ` +
      '"Username-Password-Authentication" — ela precisa apontar para uma API pública e ativa.'
    );
  }

  if (ERROS_ESPECIFICOS[code]) return ERROS_ESPECIFICOS[code];

  if (code === 'invalid_grant') return 'E-mail ou senha incorretos.';

  return descricao
    ? `${descricao} (HTTP ${status})`
    : `Falha ao autenticar com o Auth0 (HTTP ${status}). Tente novamente.`;
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