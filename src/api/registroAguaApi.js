// ───────────────────────────────────────────────────────────────
// src/api/registroAguaApi.js
// Endpoints de registro de hidratação (água).
// ───────────────────────────────────────────────────────────────
import api from './client';

// [F367] Solicita à API os registros de água associados ao usuário.
/**
 * Listar registros de água do usuário.
 * GET /registro-agua/usuario/{id_usuario}
 */
export const listarPorUsuario = async (idUsuario, skip = 0, limit = 100) => {
  const response = await api.get(`/registro-agua/usuario/${idUsuario}`, {
    params: { skip, limit },
  });
  return response.data;
};

// [F368] Solicita à API o total de água consumido na data informada.
/**
 * Total de água consumida no dia.
 * GET /registro-agua/usuario/{id_usuario}/total/{data}
 */
export const totalDia = async (idUsuario, data) => {
  const response = await api.get(`/registro-agua/usuario/${idUsuario}/total/${data}`);
  return response.data;
};

// [F369] Solicita à API os registros de água dentro do período informado.
/**
 * Registros de água por período.
 * GET /registro-agua/usuario/{id_usuario}/periodo?data_inicio=...&data_fim=...
 */
export const listarPorPeriodo = async (idUsuario, dataInicio, dataFim) => {
  const response = await api.get(`/registro-agua/usuario/${idUsuario}/periodo`, {
    params: { data_inicio: dataInicio, data_fim: dataFim },
  });
  return response.data;
};

// [F370] Solicita à API o registro de um novo consumo de água.
/**
 * Criar novo registro de água.
 * POST /registro-agua/
 * @param {{ id_usuario: string, quantidade_ml: number, data_registro: string }} dados
 */
export const criar = async (dados, config = {}) => {
  const response = await api.post('/registro-agua/', dados, config);
  return response.data;
};

// [F371] Solicita à API a atualização de um registro de consumo de água.
/**
 * Atualizar registro de água.
 * PUT /registro-agua/{id_registro}
 */
export const atualizar = async (idRegistro, dados) => {
  const response = await api.put(`/registro-agua/${idRegistro}`, dados);
  return response.data;
};

// [F372] Solicita à API a remoção de um registro de consumo de água.
/**
 * Deletar registro de água.
 * DELETE /registro-agua/{id_registro}
 */
export const deletar = async (idRegistro) => {
  await api.delete(`/registro-agua/${idRegistro}`);
};
