// ───────────────────────────────────────────────────────────────
// src/api/dashboardApi.js
// Endpoints do dashboard: resumos diário, semanal, mensal.
// ───────────────────────────────────────────────────────────────
import api from './client';
import { dataDeHoje } from '../util/data';

/**
 * Resumo nutricional do dia.
 * GET /dashboard/usuario/{id_usuario}?data=YYYY-MM-DD
 * A data vai sempre explícita: sem ela o servidor usa o próprio "hoje", que na
 * hospedagem é UTC e divergia do dia que o usuário está vendo.
 */
export const resumoDia = async (idUsuario, data = dataDeHoje()) => {
  const response = await api.get(`/dashboard/usuario/${idUsuario}`, { params: { data } });
  return response.data;
};

/**
 * Resumo semanal (últimos 7 dias).
 * GET /dashboard/usuario/{id_usuario}/semana?data_fim=YYYY-MM-DD
 */
export const resumoSemana = async (idUsuario, dataFim = dataDeHoje()) => {
  const response = await api.get(`/dashboard/usuario/${idUsuario}/semana`, { params: { data_fim: dataFim } });
  return response.data;
};

/**
 * Resumo mensal (últimos 31 dias).
 * GET /dashboard/usuario/{id_usuario}/mes?data_fim=YYYY-MM-DD
 */
export const resumoMes = async (idUsuario, dataFim = dataDeHoje()) => {
  const response = await api.get(`/dashboard/usuario/${idUsuario}/mes`, { params: { data_fim: dataFim } });
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
