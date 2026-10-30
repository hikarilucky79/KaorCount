import api from './client';
import { dataDeHoje } from '../util/data';
export const gerarSugestoes = async idUsuario => (await api.post(`/sugestoes/gerar/${idUsuario}`)).data;
export const listarSugestoes = async (idUsuario, skip = 0, limit = 50) => (await api.get(`/sugestoes/${idUsuario}`, { params: { skip, limit } })).data;
export const aceitarSugestao = async idSugestao => (await api.post(`/sugestoes/aceitar/${idSugestao}`, null, { params: { data: dataDeHoje() } })).data;

export const desfazerSugestao = async idSugestao => (await api.post(`/sugestoes/aceitar/${idSugestao}`, null, { params: { data: dataDeHoje(), desfazer: true } })).data;
