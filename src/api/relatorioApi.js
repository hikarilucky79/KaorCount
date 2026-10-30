import { Platform } from 'react-native';
import api from './client';
import { salvarArquivo } from '../util/arquivos';
export const obterDadosRelatorio = async (id, inicio, fim) => (await api.get(`/relatorios/usuario/${id}/dados`, { params: { data_inicio: inicio, data_fim: fim } })).data;
export async function baixarRelatorioPdf(id, inicio, fim) {
  const { data } = await api.get(`/relatorios/usuario/${id}/pdf`, {
    params: { data_inicio: inicio, data_fim: fim },
    responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
  });
  await salvarArquivo(data, `relatorio_kaorcount_${inicio}_${fim}.pdf`, 'application/pdf');
}
