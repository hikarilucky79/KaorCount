// ───────────────────────────────────────────────────────────────
// src/constants/Cores.js
// Paletas de cores oficiais do KaorCount (Claro e Escuro)
// ───────────────────────────────────────────────────────────────

export const CORES_CLARO = {
  primaria: '#C88242',       // Laranja caramelo / marrom quente oficial
  fundo: '#F4E6D6',          // Bege claro suave acolhedor para fundo das telas
  fundoInput: '#FAF3EC',     // Bege ultra claro para caixas de texto e inputs
  textoEscuro: '#2D1E12',    // Marrom café escuro para títulos e textos com alta legibilidade
  textoSuave: '#6C584A',     // Marrom neutro suave para legendas, placeholders e descrições
  branco: '#FFFFFF',         // Branco puro para cards, modais e botões destacados
  sucesso: '#00A86B',        // Verde vibrante para metas atingidas e sucesso
  agua: '#2F80ED',           // Azul água
  carboidrato: '#E07B39',    // Laranja para carboidratos
  proteina: '#C88242',       // Caramelo para proteínas
  gordura: '#9B59B6',        // Roxo suave para gorduras
  borda: '#E1D5C7',          // Borda suave e clara
  mutado: '#EDD9C3',         // Bege claro para botões secundários/demo
  erro: '#D94F4F',           // Vermelho para erros e avisos
};

export const CORES_ESCURO = {
  primaria: '#C88242',       // Laranja caramelo / marrom quente oficial
  fundo: '#121212',          // Fundo oficial do tema escuro (#121212)
  fundoCard: '#1E1E1E',      // Fundo dos cards no tema escuro
  fundoInput: '#262626',     // Fundo das caixas de texto e inputs
  textoEscuro: '#FDFBF7',    // Texto principal claro para alto contraste (quase branco quente)
  textoSuave: '#B8A89A',     // Texto secundário com alto contraste para leitura perfeita
  branco: '#1E1E1E',         // Superfície/cards no tema escuro
  sucesso: '#00C853',        // Verde vibrante com alto contraste
  agua: '#3890F0',           // Azul água vibrante
  carboidrato: '#F08C4A',    // Laranja vibrante para carboidratos
  proteina: '#D49354',       // Caramelo vibrante para proteínas
  gordura: '#AF7AC5',        // Roxo claro para gorduras
  borda: '#2E2E2E',          // Borda com separação nítida
  mutado: '#2A2A2A',         // Elementos secundários escuros
  erro: '#E74C3C',           // Vermelho vibrante para avisos
};

// Export padrão com compatibilidade e acesso às paletas
export const CORES = {
  ...CORES_CLARO,
  temaEscuro: CORES_ESCURO,
  temaClaro: CORES_CLARO,
};

export const TEMA_ESCURO = CORES_ESCURO;
export const TEMA_CLARO = CORES_CLARO;

export default CORES;