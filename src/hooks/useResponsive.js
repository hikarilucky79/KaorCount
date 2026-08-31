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

export default function useResponsive() {
  const { width, height } = useWindowDimensions();
  const info = getDeviceInfo(width, height);

  const scale = (size) => scaleUtil(size, width);
  const verticalScale = (size) => vScaleUtil(size, height);
  const moderateScale = (size, factor = 0.5) => modScaleUtil(size, width, factor);
  const rf = (size, minSize, maxSize) => rfUtil(size, width, minSize, maxSize);
  const rw = (percentage) => (width * percentage) / 100;
  const rh = (percentage) => (height * percentage) / 100;
  
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
