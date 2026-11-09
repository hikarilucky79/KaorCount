// ───────────────────────────────────────────────────────────────
// src/api/refeicaoApi.js
// Endpoints de refeições e itens de refeição.
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F356] Lista pela API as refeições da data selecionada.
/**
 * Listar refeições do dia.
 * GET /refeicoes/usuario/{id}/dia/{data}
 */
export const listarPorDia = async (idUsuario, data) => {
  const response = await api.get(`/refeicoes/usuario/${idUsuario}/dia/${data}`);
  return response.data;
};

// [F357] Solicita à API as refeições registradas dentro do período informado.
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

// [F358] Solicita à API o resumo diário de calorias e macronutrientes.
/**
 * Resumo de macros do dia.
 * GET /refeicoes/usuario/{id}/dia/{data}/macros
 */
export const resumoMacrosDia = async (idUsuario, data) => {
  const response = await api.get(`/refeicoes/usuario/${idUsuario}/dia/${data}/macros`);
  return response.data;
};

// [F359] Solicita à API a refeição associada ao identificador informado.
/**
 * Buscar refeição por ID.
 * GET /refeicoes/{id_refeicao}
 */
export const buscarPorId = async (idRefeicao) => {
  const response = await api.get(`/refeicoes/${idRefeicao}`);
  return response.data;
};

// [F360] Solicita à API o registro de uma nova refeição.
/**
 * Criar nova refeição.
 * POST /refeicoes/
 * @param {{ id_usuario: string, tipo_refeicao: string, data_refeicao: string }} dados
 */
export const criar = async (dados, config = {}) => {
  const response = await api.post('/refeicoes/', dados, config);
  return response.data;
};

// [F361] Solicita à API a atualização de uma refeição registrada.
/**
 * Atualizar refeição.
 * PUT /refeicoes/{id_refeicao}
 */
export const atualizar = async (idRefeicao, dados) => {
  const response = await api.put(`/refeicoes/${idRefeicao}`, dados);
  return response.data;
};

// [F362] Solicita à API a remoção de uma refeição registrada.
/**
 * Deletar refeição.
 * DELETE /refeicoes/{id_refeicao}
 */
export const deletar = async (idRefeicao) => {
  await api.delete(`/refeicoes/${idRefeicao}`);
};

// [F363] Solicita à API os alimentos de uma refeição.
/**
 * Listar itens de uma refeição.
 * GET /refeicoes/{id_refeicao}/itens
 */
export const listarItens = async (idRefeicao) => {
  const response = await api.get(`/refeicoes/${idRefeicao}/itens`);
  return response.data;
};

// [F364] Solicita à API a inclusão de um alimento em uma refeição.
/**
 * Adicionar item a uma refeição.
 * POST /refeicoes/{id_refeicao}/itens
 */
export const adicionarItem = async (idRefeicao, dados, config = {}) => {
  const response = await api.post(`/refeicoes/${idRefeicao}/itens`, dados, config);
  return response.data;
};

// [F365] Solicita à API a atualização de um alimento da refeição.
/**
 * Atualizar item de refeição.
 * PUT /refeicoes/itens/{id_item}
 */
export const atualizarItem = async (idItem, dados) => {
  const response = await api.put(`/refeicoes/itens/${idItem}`, dados);
  return response.data;
};

// [F366] Solicita à API a remoção de um alimento da refeição.
/**
 * Remover item de refeição.
 * DELETE /refeicoes/itens/{id_item}
 */
export const removerItem = async (idItem) => {
  await api.delete(`/refeicoes/itens/${idItem}`);
};
