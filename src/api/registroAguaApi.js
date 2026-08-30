// ───────────────────────────────────────────────────────────────
// src/api/registroAguaApi.js
// Endpoints de registro de hidratação (água).
// ───────────────────────────────────────────────────────────────
import api from './client';

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

/**
 * Total de água consumida no dia.
 * GET /registro-agua/usuario/{id_usuario}/total/{data}
 */
export const totalDia = async (idUsuario, data) => {
  const response = await api.get(`/registro-agua/usuario/${idUsuario}/total/${data}`);
  return response.data;
};

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

/**
 * Criar novo registro de água.
 * POST /registro-agua/
 * @param {{ id_usuario: string, quantidade_ml: number, data_registro: string }} dados
 */
export const criar = async (dados) => {
  const response = await api.post('/registro-agua/', dados);
  return response.data;
};

/**
 * Atualizar registro de água.
 * PUT /registro-agua/{id_registro}
 */
export const atualizar = async (idRegistro, dados) => {
  const response = await api.put(`/registro-agua/${idRegistro}`, dados);
  return response.data;
};

/**
 * Deletar registro de água.
 * DELETE /registro-agua/{id_registro}
 */
export const deletar = async (idRegistro) => {
  await api.delete(`/registro-agua/${idRegistro}`);
};
