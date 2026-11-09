// ───────────────────────────────────────────────────────────────
// src/util/responsive.js
// Utilitários de Responsividade para Qualquer Tamanho de Tela
// ───────────────────────────────────────────────────────────────
import { Dimensions, PixelRatio, Platform } from 'react-native';

// Dimensões base de referência (iPhone padrão moderno: 390 x 844)
export const BASE_WIDTH = 390;
export const BASE_HEIGHT = 844;
export const MAX_CONTENT_WIDTH = 640;
export const MAX_AUTH_WIDTH = 480;

// [F546] Ajusta um tamanho horizontal de acordo com a largura da tela.
/**
 * Escala horizontal direta baseada na largura da tela
 */
export const scale = (size, screenWidth) => {
  const w = screenWidth || Dimensions.get('window').width;
  return (w / BASE_WIDTH) * size;
};

// [F547] Ajusta um tamanho vertical de acordo com a altura da tela.
/**
 * Escala vertical direta baseada na altura da tela
 */
export const verticalScale = (size, screenHeight) => {
  const h = screenHeight || Dimensions.get('window').height;
  return (h / BASE_HEIGHT) * size;
};

// [F548] Aplica uma escala moderada a um tamanho para diferentes telas.
/**
 * Escala moderada com fator de amortecimento (ideal para paddings, margens e ícones)
 */
export const moderateScale = (size, screenWidth, factor = 0.5) => {
  const w = screenWidth || Dimensions.get('window').width;
  const s = (w / BASE_WIDTH) * size;
  return size + (s - size) * factor;
};

// [F549] Calcula um tamanho de fonte adaptável às dimensões da tela.
/**
 * Cálculo de tamanho de fonte responsivo com limites seguros (min e max)
 */
export const responsiveFontSize = (size, screenWidth, minSize, maxSize) => {
  const w = screenWidth || Dimensions.get('window').width;
  // Fator moderado para texto: 0.4
  const scaled = size + ((w / BASE_WIDTH) * size - size) * 0.4;
  const min = minSize !== undefined ? minSize : size * 0.82;
  const max = maxSize !== undefined ? maxSize : size * 1.35;
  return Math.round(Math.min(Math.max(scaled, min), max));
};

// [F550] Classifica as dimensões da tela e retorna informações de layout do dispositivo.
/**
 * Detecta características do dispositivo com base nas dimensões
 */
export const getDeviceInfo = (width, height) => {
  const w = width || Dimensions.get('window').width;
  const h = height || Dimensions.get('window').height;
  const isLandscape = w > h;
  const isSmallScreen = w < 365;
  const isMediumScreen = w >= 365 && w < 520;
  const isTablet = w >= 520 && w < 1024;
  const isDesktop = w >= 1024;

  return {
    width: w,
    height: h,
    isLandscape,
    isSmallScreen,
    isMediumScreen,
    isTablet,
    isDesktop,
    contentMaxWidth: MAX_CONTENT_WIDTH,
    authMaxWidth: MAX_AUTH_WIDTH,
  };
};

// [F551] Calcula a largura máxima e o estilo do contêiner para a tela.
/**
 * Estilo de container centralizado responsivo para telas grandes / tablets / web
 */
export const getContainerStyle = (width, maxWidth = MAX_CONTENT_WIDTH) => {
  const w = width || Dimensions.get('window').width;
  if (w > maxWidth) {
    return {
      width: '100%',
      maxWidth: maxWidth,
      alignSelf: 'center',
    };
  }
  return {
    width: '100%',
  };
};

export default {
  scale,
  verticalScale,
  moderateScale,
  responsiveFontSize,
  getDeviceInfo,
  getContainerStyle,
  BASE_WIDTH,
  BASE_HEIGHT,
  MAX_CONTENT_WIDTH,
  MAX_AUTH_WIDTH,
};
