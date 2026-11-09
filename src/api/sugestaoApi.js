import api from './client';
import { dataDeHoje } from '../util/data';
// [F375] Solicita à API novas sugestões de refeição.
export const gerarSugestoes = async idUsuario => (await api.post(`/sugestoes/gerar/${idUsuario}`)).data;
// [F376] Solicita à API as sugestões existentes para o usuário.
export const listarSugestoes = async (idUsuario, skip = 0, limit = 50) => (await api.get(`/sugestoes/${idUsuario}`, { params: { skip, limit } })).data;
// [F377] Envia à API a escolha de uma sugestão de refeição.
export const aceitarSugestao = async idSugestao => (await api.post(`/sugestoes/aceitar/${idSugestao}`, null, { params: { data: dataDeHoje() } })).data;

// [F378] Solicita à API o cancelamento da sugestão aceita.
export const desfazerSugestao = async idSugestao => (await api.post(`/sugestoes/aceitar/${idSugestao}`, null, { params: { data: dataDeHoje(), desfazer: true } })).data;
