import api from './client';
export const buscarConfig = async id => (await api.get(`/lembretes/config/${id}`)).data;
export const configurarAgua = async (id, intervaloMin, metaDiariaMl) => (await api.put(`/lembretes/config/${id}/agua`, null, { params: { intervalo_min: intervaloMin, meta_diaria_ml: metaDiariaMl } })).data;
export const configurarRefeicoes = async (id, horariosArray) => (await api.put(`/lembretes/config/${id}/refeicoes`, null, { params: { horarios: horariosArray.join(',') } })).data;
export const ativar = async id => (await api.post(`/lembretes/config/${id}/ativar`)).data;
export const desativar = async id => (await api.post(`/lembretes/config/${id}/desativar`)).data;
