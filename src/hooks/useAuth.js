// ───────────────────────────────────────────────────────────────
// src/hooks/useAuth.js
// Hook de conveniência para acessar o AuthContext.
// ───────────────────────────────────────────────────────────────
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Hook para acessar os dados e funções de autenticação.
 *
 * @returns {{
 *   usuario: object | null,
 *   token: string | null,
 *   carregando: boolean,
 *   logado: boolean,
 *   login: (email: string, senha: string) => Promise<object>,
 *   registrar: (dados: object) => Promise<object>,
 *   logout: () => Promise<void>,
 *   atualizarUsuario: () => Promise<object>,
 * }}
 */
export default function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider.');
  }

  return context;
}
