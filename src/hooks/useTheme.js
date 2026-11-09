// ───────────────────────────────────────────────────────────────
// src/hooks/useTheme.js
// Hook de conveniência para acessar o ThemeContext.
// ───────────────────────────────────────────────────────────────
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

// [F439] Disponibiliza o tema ativo para os componentes.
export default function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider.');
  }
  return context;
}
