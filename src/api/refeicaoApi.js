// ───────────────────────────────────────────────────────────────
// src/api/refeicaoApi.js
// Endpoints de refeições e itens de refeição.
// ───────────────────────────────────────────────────────────────
import api from './client';

/**
 * Listar refeições do dia.
 * GET /refeicoes/usuario/{id}/dia/{data}
 */
export const listarPorDia = async (idUsuario, data) => {
  const response = await api.get(`/refeicoes/usuario/${idUsuario}/dia/${data}`);
  return response.data;
};

/**
 * Listar refeições por período.
 * GET /refeicoes/usuario/{id}/periodo?data_inicio=...&data_fim=...
 */
export const listarPorPeriodo = async (idUsuario, dataInicio, dataFim) => {
  const response = await api.get(`/refeicoes/usuario/${idUsuario}/periodo`, {
    params: { data_inicio: dataInicio, data_fim: dataFim },
  });
  return response.data;
};

/**
 * Resumo de macros do dia.
 * GET /refeicoes/usuario/{id}/dia/{data}/macros
 */
export const resumoMacrosDia = async (idUsuario, data) => {
  const response = await api.get(`/refeicoes/usuario/${idUsuario}/dia/${data}/macros`);
  return response.data;
};

/**
 * Buscar refeição por ID.
 * GET /refeicoes/{id_refeicao}
 */
export const buscarPorId = async (idRefeicao) => {
  const response = await api.get(`/refeicoes/${idRefeicao}`);
  return response.data;
};

/**
 * Criar nova refeição.
 * POST /refeicoes/
 * @param {{ id_usuario: string, tipo_refeicao: string, data_refeicao: string }} dados
 */
export const criar = async (dados) => {
  const response = await api.post('/refeicoes/', dados);
  return response.data;
};

/**
 * Atualizar refeição.
 * PUT /refeicoes/{id_refeicao}
 */
export const atualizar = async (idRefeicao, dados) => {
  const response = await api.put(`/refeicoes/${idRefeicao}`, dados);
  return response.data;
};

/**
 * Deletar refeição.
 * DELETE /refeicoes/{id_refeicao}
 */
export const deletar = async (idRefeicao) => {
  await api.delete(`/refeicoes/${idRefeicao}`);
};

/**
 * Listar itens de uma refeição.
 * GET /refeicoes/{id_refeicao}/itens
 */
export const listarItens = async (idRefeicao) => {
  const response = await api.get(`/refeicoes/${idRefeicao}/itens`);
  return response.data;
};

/**
 * Adicionar item a uma refeição.
 * POST /refeicoes/{id_refeicao}/itens
 */
export const adicionarItem = async (idRefeicao, dados) => {
  const response = await api.post(`/refeicoes/${idRefeicao}/itens`, dados);
  return response.data;
};

/**
 * Atualizar item de refeição.
 * PUT /refeicoes/itens/{id_item}
 */
export const atualizarItem = async (idItem, dados) => {
  const response = await api.put(`/refeicoes/itens/${idItem}`, dados);
  return response.data;
};

/**
 * Remover item de refeição.
 * DELETE /refeicoes/itens/{id_item}
 */
export const removerItem = async (idItem) => {
  await api.delete(`/refeicoes/itens/${idItem}`);
};
