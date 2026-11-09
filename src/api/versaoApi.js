// ───────────────────────────────────────────────────────────────
// src/api/versaoApi.js
// Consulta a versão mais recente do app publicada no servidor.
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F384] Consulta à API a versão atual e as exigências de atualização.
/**
 * GET /app/versao — pública, não exige login.
 * Timeout curto: a checagem acontece na abertura e não pode segurar o app.
 * @returns {{ versao_atual: string, versao_minima: string, url_download: string }}
 */
export const buscarVersao = async () => {
  const response = await api.get('/app/versao', { timeout: 3000 });
  return response.data;
};
