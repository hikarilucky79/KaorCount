import { Platform } from 'react-native';
import api from './client';
import { salvarArquivo } from '../util/arquivos';
// [F373] Solicita à API os dados necessários para montar o relatório.
export const obterDadosRelatorio = async (id, inicio, fim) => (await api.get(`/relatorios/usuario/${id}/dados`, { params: { data_inicio: inicio, data_fim: fim } })).data;
// [F374] Solicita à API um relatório em PDF e prepara seu download.
export async function baixarRelatorioPdf(id, inicio, fim) {
  const { data } = await api.get(`/relatorios/usuario/${id}/pdf`, {
    params: { data_inicio: inicio, data_fim: fim },
    responseType: Platform.OS === 'web' ? 'blob' : 'arraybuffer',
  });
  await salvarArquivo(data, `relatorio_kaorcount_${inicio}_${fim}.pdf`, 'application/pdf');
}
