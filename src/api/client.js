// ───────────────────────────────────────────────────────────────
// src/api/client.js
// Instância centralizada do Axios com interceptors e SHA-256 puro JS.
// ───────────────────────────────────────────────────────────────
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ↓ URL base da API dinâmica conforme o ambiente:
//   - Web / Navegador: http://localhost:8000/api/v1
//   - Dispositivo Físico (Expo Go): Detecta IP dinâmico da rede local (ex: http://192.168.x.x:8000/api/v1)
//   - Emulador Android: http://10.0.2.2:8000/api/v1
const getBaseUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:8000/api/v1';
  }
  const debuggerHost = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;
  const ip = debuggerHost ? debuggerHost.split(':')[0] : null;
  if (ip) {
    return `http://${ip}:8000/api/v1`;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000/api/v1';
  }
  return 'http://localhost:8000/api/v1';
};

const BASE_URL = getBaseUrl();

// ↓ Implementação pura de SHA-256 em JavaScript (sem dependência nativa que possa quebrar no Expo Go)
function gerarSHA256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i, j;
  let result = '';
  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;
  let hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;
  for (i = 0; i < ascii[lengthProperty]; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }
  for (j = 0; j < words[lengthProperty]; j += 16) {
    const w = words.slice(j, j + 16);
    const oldHash = hash;
    hash = hash.slice(0, 8);
    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 =
        (hash[7] || 0) +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? (w[i] || 0)
            : (w[i - 16] +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                w[i - 7] +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ───────────────────────────────────────────────────────────────
// ↓ INTERCEPTOR DE REQUEST
//   1. Injeta o token JWT no header Authorization.
//   2. Gera uma assinatura SHA-256 para integridade da requisição.
// ───────────────────────────────────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    // ↓ 1. Injetar o token de autenticação (se existir).
    try {
      const token = await AsyncStorage.getItem('@kaorcount_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // Ignore storage read error
    }

    // ↓ 2. Gerar assinatura SHA-256 para integridade da requisição.
    try {
      const timestamp = Date.now().toString();
      const method = (config.method || 'GET').toUpperCase();
      const path = config.url || '';
      const body = typeof config.data === 'string' ? config.data : config.data ? JSON.stringify(config.data) : '';

      // ↓ Payload de assinatura: METHOD:PATH:TIMESTAMP:BODY
      const payload = `${method}:${path}:${timestamp}:${body}`;
      const hash = gerarSHA256(payload);

      config.headers['X-Signature'] = hash;
      config.headers['X-Timestamp'] = timestamp;
    } catch (error) {
      console.warn('[SHA-256] Erro ao gerar assinatura:', error?.message);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ───────────────────────────────────────────────────────────────
// ↓ INTERCEPTOR DE RESPONSE
//   Trata erros comuns (401 = sessão expirada).
// ───────────────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      // ↓ Token expirado ou inválido → limpar sessão.
      if (status === 401) {
        try {
          await AsyncStorage.removeItem('@kaorcount_token');
          await AsyncStorage.removeItem('@kaorcount_usuario');
        } catch (e) {
          // Ignore storage error
        }
      }

      // ↓ Retornar a mensagem de erro do back-end quando disponível.
      const mensagem = data?.detail || data?.message || 'Erro inesperado no servidor.';
      return Promise.reject(new Error(mensagem));
    }

    // ↓ Erro de rede / sem conexão.
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Tempo de conexão esgotado. Tente novamente.'));
    }

    return Promise.reject(new Error('Sem conexão com o servidor. Verifique sua internet.'));
  }
);

export default api;
export { gerarSHA256 };
