// ───────────────────────────────────────────────────────────────
// src/hooks/useTheme.js
// Hook de conveniência para acessar o ThemeContext.
// ───────────────────────────────────────────────────────────────
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export default function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider.');
  }
  return context;
}
