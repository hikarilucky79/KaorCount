// ───────────────────────────────────────────────────────────────
// src/auth/auth0Config.js
// Configuração do Auth0 (híbrido). Só é ativada quando as variáveis
// EXPO_PUBLIC_AUTH0_* estiverem preenchidas no .env.
// AUTH0_CONFIGURADO=false mantém o fluxo de login legado (JWT local).
// ───────────────────────────────────────────────────────────────

const ENV = typeof process !== 'undefined' && process.env ? process.env : {};

export const AUTH0_DOMINIO = ENV.EXPO_PUBLIC_AUTH0_DOMAIN || '';
export const AUTH0_CLIENT_ID = ENV.EXPO_PUBLIC_AUTH0_CLIENT_ID || '';
export const AUTH0_AUDIENCIA = ENV.EXPO_PUBLIC_AUTH0_AUDIENCE || (AUTH0_DOMINIO ? `https://${AUTH0_DOMINIO}/api/v2/` : '');

export const AUTH0_CONFIGURADO = Boolean(AUTH0_DOMINIO && AUTH0_CLIENT_ID);

// URL para onde o Auth0 redireciona após o login (deve estar na lista de
// "Allowed Callback URLs" do tenant). No web usa o origin atual (ex.: localhost:8081).
export const obterRedirectUri = () =>
  typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:8081';