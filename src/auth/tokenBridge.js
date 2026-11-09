// ───────────────────────────────────────────────────────────────
// src/auth/tokenBridge.js
// Fornece o token JWT local ao interceptor do axios.
// A sessão fica salva no AsyncStorage sob as chaves abaixo.
// ───────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@kaorcount_token';
const USUARIO_KEY = '@kaorcount_usuario';

// [F385] Obtém o token de autenticação compartilhado entre módulos do aplicativo.
export async function obterTokenAutorizacao() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// [F386] Remove os dados de sessão armazenados globalmente.
export async function limparSessaoGlobal() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
}