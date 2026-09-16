// ───────────────────────────────────────────────────────────────
// src/auth/tokenBridge.js
// Ponte central de tokens para o interceptor do axios.
// O SDK do Auth0 registra aqui o provedor do Access Token; enquanto
// não houver provedor, o interceptor usa o token legado do AsyncStorage.
// ───────────────────────────────────────────────────────────────
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@kaorcount_token';
const USUARIO_KEY = '@kaorcount_usuario';

let provedorExterno = null;

export function registrarProvedorToken(provedor) {
  provedorExterno = provedor || null;
}

export async function obterTokenAutorizacao() {
  if (provedorExterno) {
    try {
      const token = await provedorExterno();
      if (token) return token;
    } catch (erro) {
      console.warn('[tokenBridge] Falha ao obter token do Auth0:', erro?.message);
    }
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function limparSessaoGlobal() {
  // ↓ Limpa as chaves legadas do AsyncStorage SEM desativar o provedor
  //   externo: no modo Auth0 o SDK consegue renovar o Access Token sozinho.
  await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
}