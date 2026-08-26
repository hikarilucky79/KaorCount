export const validarFormulario = (dados) => {
  const erros = {};

  // ↓ Nome e Sobrenome (Apenas letras e espaços).
  const regexApenasLetras = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/;
  if (!dados.nome || !regexApenasLetras.test(dados.nome.trim())) {
    erros.nome = 'O nome deve conter apenas letras.';
  }
  if (!dados.sobrenome || !regexApenasLetras.test(dados.sobrenome.trim())) {
    erros.sobrenome = 'O sobrenome deve conter apenas letras.';
  }

  // ↓ E-mail.
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!dados.email || !regexEmail.test(dados.email.trim())) {
    erros.email = 'Insira um e-mail válido (ex: usuario@email.com).';
  }

  // ↓ Senha (Mínimo de 8 caracteres).
  if (!dados.senha || dados.senha.length < 8) {
    erros.senha = 'A senha deve ter pelo menos 8 caracteres.';
  }

  // ↓ Altura (Em metros, aceita vírgula ou ponto: ex: 1.75).
  const alturaNumero = parseFloat(dados.altura?.replace(',', '.'));
  if (isNaN(alturaNumero) || alturaNumero < 0.5 || alturaNumero > 2.5) {
    erros.altura = 'Informe uma altura válida em metros (ex: 1.75).';
  }

  // ↓ Peso (Em kg, aceita vírgula ou ponto: ex: 70.5 ou 80).
  const pesoNumero = parseFloat(dados.peso?.replace(',', '.'));
  if (isNaN(pesoNumero) || pesoNumero < 20 || pesoNumero > 350) {
    erros.peso = 'Informe um peso válido em kg (ex: 75.5).';
  }

  // ↓ Data de Nascimento (Valida o formato DD/MM/AAAA e se a data existe).
  const regexData = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  if (!dados.dataNascimento || !regexData.test(dados.dataNascimento)) {
    erros.dataNascimento = 'Informe a data no formato DD/MM/AAAA.';
  } else {
    const [, dia, mes, ano] = dados.dataNascimento.match(regexData);
    const dataObj = new Date(ano, mes - 1, dia);
    const hoje = new Date();

    // ↓ Checa se a data é real no calendário e se não é no futuro/anterior a 1900.
    const dataValida = 
      dataObj.getFullYear() === parseInt(ano, 10) &&
      dataObj.getMonth() === parseInt(mes, 10) - 1 &&
      dataObj.getDate() === parseInt(dia, 10);

    if (!dataValida || parseInt(ano, 10) < 1900 || dataObj > hoje) {
      erros.dataNascimento = 'Insira uma data de nascimento válida.';
    }
  }

  // ↓ Sexo.
  if (!dados.sexo) {
    erros.sexo = 'Informe ou selecione o sexo.';
  }

  // ↓ Nível de Atividade Física.
  if (!dados.nivelAtividade) {
    erros.nivelAtividade = 'Selecione o nível de atividade física.';
  }

  // ↓ Objetivo Principal.
  if (!dados.objetivo) {
    erros.objetivo = 'Selecione um objetivo.';
  }

  return {
    valido: Object.keys(erros).length === 0,
    erros,
  };
};