// ───────────────────────────────────────────────────────────────
// src/util/data.js
// Data de calendário no fuso do aparelho, no formato YYYY-MM-DD que a API espera.
// ───────────────────────────────────────────────────────────────
// new Date().toISOString() é UTC: depois das 21h (horário de Brasília) ele já
// devolve o dia seguinte, e a API guarda a refeição num dia que o usuário não
// viu. Todo envio de data passa por aqui.

// [F520] Converte uma data para o formato aceito pela API.
export const formatarDataAPI = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

// [F521] Retorna a data atual no formato aceito pela API.
export const dataDeHoje = () => formatarDataAPI(new Date());
