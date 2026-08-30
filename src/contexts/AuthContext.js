// ───────────────────────────────────────────────────────────────
// src/contexts/AuthContext.js
// Context global de autenticação do KaorCount.
// Gerencia token JWT, dados do usuário e funções de login/logout.
// ───────────────────────────────────────────────────────────────
import React, { createContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/authApi';

// ↓ Chaves usadas no AsyncStorage.
const TOKEN_KEY = '@kaorcount_token';
const USUARIO_KEY = '@kaorcount_usuario';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // ───────────────────────────────────────────────────────────
  // ↓ Ao montar o app: tenta recuperar a sessão salva.
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    recuperarSessao();
  }, []);

  const recuperarSessao = async () => {
    try {
      const tokenSalvo = await AsyncStorage.getItem(TOKEN_KEY);
      const usuarioSalvo = await AsyncStorage.getItem(USUARIO_KEY);

      if (tokenSalvo) {
        setToken(tokenSalvo);

        // ↓ Tenta validar o token buscando o perfil atual do backend.
        try {
          const perfil = await authApi.getPerfilAtual();
          setUsuario(perfil);
          await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(perfil));
        } catch {
          // ↓ Token expirado ou inválido → usar dados do cache se disponível.
          if (usuarioSalvo) {
            setUsuario(JSON.parse(usuarioSalvo));
          } else {
            // ↓ Sem cache → deslogar.
            await limparSessao();
          }
        }
      }
    } catch (error) {
      console.error('[AuthContext] Erro ao recuperar sessão:', error);
    } finally {
      setCarregando(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Login: autentica e persiste o token + dados do usuário.
  // ───────────────────────────────────────────────────────────
  const login = useCallback(async (email, senha) => {
    // ↓ 1. Obter o token.
    const respToken = await authApi.login(email, senha);
    const novoToken = respToken.access_token;

    // ↓ 2. Salvar o token para que as próximas chamadas usem ele.
    await AsyncStorage.setItem(TOKEN_KEY, novoToken);
    setToken(novoToken);

    // ↓ 3. Buscar os dados completos do usuário autenticado.
    const perfil = await authApi.getPerfilAtual();
    setUsuario(perfil);
    await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(perfil));

    return perfil;
  }, []);

  // ───────────────────────────────────────────────────────────
  // ↓ Registrar: cria a conta e faz login automático.
  // ───────────────────────────────────────────────────────────
  const registrar = useCallback(async (dados) => {
    // ↓ 1. Criar a conta no backend.
    await authApi.registrar(dados);

    // ↓ 2. Fazer login automático com as credenciais recém-criadas.
    const perfil = await login(dados.email, dados.senha);
    return perfil;
  }, [login]);

  // ───────────────────────────────────────────────────────────
  // ↓ Login Demo / Convidado: autentica com conta de demonstração
  // ───────────────────────────────────────────────────────────
  const loginDemo = useCallback(async () => {
    const emailDemo = 'demo@kaorcount.com';
    const senhaDemo = 'demo123456';
    try {
      // 1. Tentar login direto
      try {
        const perfil = await login(emailDemo, senhaDemo);
        return perfil;
      } catch (loginErr) {
        // Se não existir, criar usuário demo no backend
        try {
          const perfil = await registrar({
            nome: 'Reginaldo (Demo)',
            email: emailDemo,
            senha: senhaDemo,
          });
          return perfil;
        } catch (regErr) {
          console.warn('[AuthContext] Usando fallback local para demo:', regErr?.message);
        }
      }

      // 2. Fallback de sessão local caso o backend não esteja respondendo
      const usuarioLocal = {
        id_usuario: '00000000-0000-0000-0000-000000000001',
        nome: 'Reginaldo (Demo)',
        email: emailDemo,
      };
      const tokenDemo = 'demo-jwt-token-kaorcount';
      await AsyncStorage.setItem(TOKEN_KEY, tokenDemo);
      await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(usuarioLocal));
      setToken(tokenDemo);
      setUsuario(usuarioLocal);
      return usuarioLocal;
    } catch (e) {
      console.error('[AuthContext] Erro ao iniciar demo:', e);
    }
  }, [login, registrar]);

  // ───────────────────────────────────────────────────────────
  // ↓ Logout: limpa toda a sessão.
  // ───────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    await limparSessao();
  }, []);

  const limparSessao = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
    setToken(null);
    setUsuario(null);
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Atualizar dados do usuário no contexto (sem re-login).
  // ───────────────────────────────────────────────────────────
  const atualizarUsuario = useCallback(async () => {
    try {
      const perfil = await authApi.getPerfilAtual();
      setUsuario(perfil);
      await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(perfil));
      return perfil;
    } catch (error) {
      console.error('[AuthContext] Erro ao atualizar usuário:', error);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        logado: !!token,
        login,
        registrar,
        loginDemo,
        logout,
        atualizarUsuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
