// ───────────────────────────────────────────────────────────────
// src/api/dashboardApi.js
// Endpoints do dashboard: resumos diário, semanal, mensal.
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Resumo nutricional do dia.
 * GET /dashboard/usuario/{id_usuario}?data=YYYY-MM-DD
 */
export const resumoDia = async (idUsuario, data = null) => {
  const params = data ? { data } : {};
  const response = await api.get(`/dashboard/usuario/${idUsuario}`, { params });
  return response.data;
};

/**
 * Resumo semanal (últimos 7 dias).
 * GET /dashboard/usuario/{id_usuario}/semana?data_fim=YYYY-MM-DD
 */
export const resumoSemana = async (idUsuario, dataFim = null) => {
  const params = dataFim ? { data_fim: dataFim } : {};
  const response = await api.get(`/dashboard/usuario/${idUsuario}/semana`, { params });
  return response.data;
};

/**
 * Resumo mensal (últimos 31 dias).
 * GET /dashboard/usuario/{id_usuario}/mes?data_fim=YYYY-MM-DD
 */
export const resumoMes = async (idUsuario, dataFim = null) => {
  const params = dataFim ? { data_fim: dataFim } : {};
  const response = await api.get(`/dashboard/usuario/${idUsuario}/mes`, { params });
  return response.data;
};

/**
 * Evolução de peso do usuário.
 * GET /dashboard/usuario/{id_usuario}/evolucao-peso?limit=30
 */
export const evolucaoPeso = async (idUsuario, limit = 30) => {
  const response = await api.get(`/dashboard/usuario/${idUsuario}/evolucao-peso`, {
    params: { limit },
  });
  return response.data;
};
