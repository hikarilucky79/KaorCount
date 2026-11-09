import api from './client';
// [F338] Solicita à API as configurações de lembrete da conta.
export const buscarConfig = async id => (await api.get(`/lembretes/config/${id}`)).data;
// [F339] Envia à API as preferências de lembretes de água.
export const configurarAgua = async (id, intervaloMin, metaDiariaMl) => (await api.put(`/lembretes/config/${id}/agua`, null, { params: { intervalo_min: intervaloMin, meta_diaria_ml: metaDiariaMl } })).data;
// [F340] Envia à API as preferências de lembretes de refeições.
export const configurarRefeicoes = async (id, horariosArray) => (await api.put(`/lembretes/config/${id}/refeicoes`, null, { params: { horarios: horariosArray.join(',') } })).data;
// [F341] Solicita à API a ativação dos lembretes.
export const ativar = async id => (await api.post(`/lembretes/config/${id}/ativar`)).data;
// [F342] Solicita à API a desativação dos lembretes.
export const desativar = async id => (await api.post(`/lembretes/config/${id}/desativar`)).data;
