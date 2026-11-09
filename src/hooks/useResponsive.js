// ───────────────────────────────────────────────────────────────
// src/hooks/useResponsive.js
// Hook para reatividade a mudanças de tela (rotação, resizing, tablets)
// ───────────────────────────────────────────────────────────────
import { useWindowDimensions } from 'react-native';
import { 
  scale as scaleUtil, 
  verticalScale as vScaleUtil, 
  moderateScale as modScaleUtil, 
  responsiveFontSize as rfUtil,
  getDeviceInfo,
  getContainerStyle,
  MAX_CONTENT_WIDTH,
  MAX_AUTH_WIDTH
} from '../util/responsive';

// [F430] Disponibiliza funções de escala e medidas adaptadas às dimensões da tela.
export default function useResponsive() {
  const { width, height } = useWindowDimensions();
  const info = getDeviceInfo(width, height);

  // [F431] Ajusta um tamanho horizontal de acordo com a largura da tela.
  const scale = (size) => scaleUtil(size, width);
  // [F432] Ajusta um tamanho vertical de acordo com a altura da tela.
  const verticalScale = (size) => vScaleUtil(size, height);
  // [F433] Aplica uma escala moderada a um tamanho para diferentes telas.
  const moderateScale = (size, factor = 0.5) => modScaleUtil(size, width, factor);
  // [F434] Calcula um tamanho de fonte adaptado à largura da tela.
  const rf = (size, minSize, maxSize) => rfUtil(size, width, minSize, maxSize);
  // [F435] Calcula uma medida horizontal adaptada à largura da tela.
  const rw = (percentage) => (width * percentage) / 100;
  // [F436] Calcula uma medida vertical adaptada à altura da tela.
  const rh = (percentage) => (height * percentage) / 100;
  
  // [F437] Monta o estilo do contêiner de acordo com as dimensões da tela.
  const getContainer = (maxWidth = MAX_CONTENT_WIDTH) => getContainerStyle(width, maxWidth);

  return {
    width,
    height,
    isLandscape: info.isLandscape,
    isSmallScreen: info.isSmallScreen,
    isMediumScreen: info.isMediumScreen,
    isTablet: info.isTablet,
    isDesktop: info.isDesktop,
    scale,
    verticalScale,
    moderateScale,
    rf,
    rw,
    rh,
    getContainer,
    maxContentWidth: MAX_CONTENT_WIDTH,
    maxAuthWidth: MAX_AUTH_WIDTH,
  };
}
