// ───────────────────────────────────────────────────────────────
// src/util/nutricao.js
// Cálculos nutricionais no frontend, ESPELHADOS do backend
// (backend/app/services/nutricao_service.py — Mifflin-St Jeor).
//
// Esses cálculos são usados pelo Quiz de Cadastro para mostrar
// uma prévia das metas antes de salvar. Se o backend recalcular,
// os valores exibidos continuam consistentes.
// ───────────────────────────────────────────────────────────────

// ↓ Fator de atividade física (igual ao backend).
const FATOR_ATIVIDADE = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
};

// ↓ Ajuste calórico por objetivo (igual ao backend).
const OBJETIVO_CALORIAS = {
  perder_peso: 0.8,
  manter_peso: 1.0,
  ganhar_peso: 1.15,
  ganhar_massa: 1.2,
};

// ↓ Proporção de macros por objetivo: (carboidrato, proteína, gordura).
const MACROS_POR_OBJETIVO = {
  ganhar_massa: [0.5, 0.3, 0.2],
  perder_peso: [0.35, 0.4, 0.25],
};
const MACROS_PADRAO = [0.45, 0.3, 0.25];

// ↓ Ajuste calórico diário por ritmo (déficit p/ perder, superávit p/ ganhar).
//   Referência: ~0,25 / ~0,5 / ~0,75–1 kg de mudança de peso por semana.
//   NOTA (backend): quando o endpoint do quiz persistir 'ritmo', o
//   NutricaoService pode adotar os mesmos deltas para manter paridade.
const DELTA_POR_RITMO = {
  perder_peso: { sustentavel: 250, moderado: 500, acelerado: 750 },
  ganhar_massa: { sustentavel: 200, moderado: 350, acelerado: 500 },
};

// ↓ Piso mínimo de calorias diárias (segurança) para qualquer objetivo.
const CALORIAS_MINIMAS = 1200;

// ↓ Calcula idade a partir da data de nascimento (Date ou 'YYYY-MM-DD').
export function calcularIdade(dataNascimento) {
  if (!dataNascimento) return 0;
  const nasc = typeof dataNascimento === 'string' ? new Date(`${dataNascimento}T00:00:00`) : dataNascimento;
  if (isNaN(nasc.getTime())) return 0;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const aindaNaoFezAniversario =
    hoje.getMonth() < nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() < nasc.getDate());
  if (aindaNaoFezAniversario) idade -= 1;
  return idade;
}

// ↓ TMB pela fórmula Mifflin-St Jeor (igual ao backend).
export function calcularTMB(dataNascimento, genero, pesoKg = 70, alturaCm = 170) {
  const idade = calcularIdade(dataNascimento);
  const g = String(genero || '').toLowerCase();
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idade;
  const ajuste = g === 'masculino' || g === 'm' ? 5 : g === 'feminino' || g === 'f' ? -161 : 0;
  return base + ajuste;
}

// ↓ Calorias diárias = TMB × fator de atividade × ajuste do objetivo.
export function calcularCaloriasDiarias(tmb, nivelAtividade = 'sedentario', objetivo = 'manter_peso') {
  const fator = FATOR_ATIVIDADE[String(nivelAtividade).toLowerCase()] || 1.2;
  const ajuste = OBJETIVO_CALORIAS[String(objetivo).toLowerCase()] || 1.0;
  return Math.round(tmb * fator * ajuste);
}

// ↓ Macros em gramas a partir das calorias (carb/prot ÷4 kcal, gord ÷9 kcal).
export function calcularMacros(caloriasDiarias, objetivo = 'manter_peso') {
  const [pctCarb, pctProt, pctGord] =
    MACROS_POR_OBJETIVO[String(objetivo).toLowerCase()] || MACROS_PADRAO;
  return {
    calorias_diarias: Math.round(caloriasDiarias),
    carboidrato_g: Math.round((caloriasDiarias * pctCarb) / 4),
    proteina_g: Math.round((caloriasDiarias * pctProt) / 4),
    gordura_g: Math.round((caloriasDiarias * pctGord) / 9),
  };
}

// ↓ Atalho: devolve tudo calculado a partir das respostas do quiz.
//   'ritmo' (sustentavel | moderado | acelerado) ajusta a meta calórica
//   quando o objetivo é perder peso ou ganhar massa. Quando omitido
//   (ou objetivo = manter_peso), permanece o comportamento legado do
//   backend (multiplicadores por objetivo).
export function calcularPlanoNutricional({ dataNascimento, genero, pesoKg, alturaCm, nivelAtividade, objetivo, ritmo }) {
  const tmb = calcularTMB(dataNascimento, genero, pesoKg, alturaCm);
  const fator = FATOR_ATIVIDADE[String(nivelAtividade).toLowerCase()] || 1.2;
  const tdee = tmb * fator;

  let calorias;
  const chave = String(objetivo).toLowerCase();
  const deltas = DELTA_POR_RITMO[chave];
  if (ritmo && deltas && deltas[ritmo]) {
    calorias = chave === 'perder_peso' ? tdee - deltas[ritmo] : tdee + deltas[ritmo];
  } else {
    calorias = calcularCaloriasDiarias(tmb, nivelAtividade, objetivo);
  }
  // Déficits não caem abaixo da própria TMB; e nenhuma meta cai abaixo do piso
  // geral. Vale para as duas rotas — quem edita o perfil fora do quiz chega aqui
  // sem 'ritmo' e precisa receber a mesma trava de segurança.
  if (chave === 'perder_peso') calorias = Math.max(calorias, tmb);
  calorias = Math.max(calorias, CALORIAS_MINIMAS);

  return { tmb, ...calcularMacros(Math.round(calorias), objetivo) };
}

// ↓ Distribuição do que foi consumido em % das CALORIAS (proteína/carbo ×4,
//   gordura ×9). É a mesma unidade em que MACROS_POR_OBJETIVO define a meta;
//   medir em gramas trataria 1 g de gordura igual a 1 g de carboidrato.
export function distribuicaoCalorica(proteinaG = 0, carboidratoG = 0, gorduraG = 0) {
  const kcalProteina = (proteinaG || 0) * 4;
  const kcalCarboidrato = (carboidratoG || 0) * 4;
  const kcalGordura = (gorduraG || 0) * 9;
  const total = kcalProteina + kcalCarboidrato + kcalGordura;
  if (total <= 0) return { proteina: 0, carboidratos: 0, gorduras: 0 };
  return {
    proteina: Math.round((kcalProteina / total) * 100),
    carboidratos: Math.round((kcalCarboidrato / total) * 100),
    gorduras: Math.round((kcalGordura / total) * 100),
  };
}

// ↓ Conversões aceitando vírgula ou ponto (pt-BR) para altura e peso.
export function parseNumeroBr(valor) {
  if (valor === null || valor === undefined) return NaN;
  return parseFloat(String(valor).replace(',', '.'));
}
