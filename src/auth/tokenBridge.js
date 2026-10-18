// ───────────────────────────────────────────────────────────────
// src/auth/tokenBridge.js
// Fornece o token JWT local ao interceptor do axios.
// A sessão fica salva no AsyncStorage sob as chaves abaixo.
// ───────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@kaorcount_token';
const USUARIO_KEY = '@kaorcount_usuario';

export async function obterTokenAutorizacao() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function limparSessaoGlobal() {
  await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
}