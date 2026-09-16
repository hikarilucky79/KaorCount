// ───────────────────────────────────────────────────────────────
// src/contexts/AuthContext.js
// Context global de autenticação do KaorCount.
//
// Modo duplo (híbrido):
//   1) Auth0 ativo  - somente quando AUTH0_CONFIGURADO (variáveis
//      EXPO_PUBLIC_AUTH0_* preenchidas) E plataforma web. A tela de login
//      é a do próprio app; as credenciais vão ao /oauth/token do Auth0
//      (password grant) e o /auth/me do backend faz o provisionamento JIT
//      (cria/vincula o usuário local pelo "sub" do ID Token).
//   2) Legado        - comportamento anterior: token HS256 no AsyncStorage
//      com login/registro locais.
// As telas continuam usando useAuth() (mesmo shape: usuario, token,
// carregando, logado, login, registrar, loginDemo, logout, atualizarUsuario).
// ───────────────────────────────────────────────────────────────
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/authApi';
import * as auth0Api from '../api/auth0Api';
import { AUTH0_CONFIGURADO } from '../auth/auth0Config';
import { registrarProvedorToken } from '../auth/tokenBridge';

// ↓ Chaves usadas no AsyncStorage (apenas no modo legado).
const TOKEN_KEY = '@kaorcount_token';
const USUARIO_KEY = '@kaorcount_usuario';

export const AuthContext = createContext({});

// ───────────────────────────────────────────────────────────────
// ↓ Bridge Auth0 EMBUTIDO: tela do app + autenticação no Auth0.
//   E-mail/senha vão direto ao /oauth/token do Auth0 (password grant);
//   o /auth/me faz o provisionamento JIT no backend usando o ID Token;
//   a sessão fica salva no AsyncStorage local.
// ───────────────────────────────────────────────────────────────
const SESSAO_AUTH0_KEY = '@kaorcount_auth0_sessao';

function AuthProviderEmbutido({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // ↓ Ao montar o app: tenta restaurar a sessão Auth0 salva.
  useEffect(() => {
    let ativo = true;
    const recuperarSessao = async () => {
      try {
        const salvo = await AsyncStorage.getItem(SESSAO_AUTH0_KEY);
        if (!salvo) return;
        const { id_token } = JSON.parse(salvo);
        if (!id_token) return;
        registrarProvedorToken(() => Promise.resolve(id_token));
        const perfil = await authApi.getPerfilAtual(id_token);
        if (!ativo) return;
        setToken(id_token);
        setUsuario(perfil);
      } catch (e) {
        console.warn('[Auth0] Sessão inválida:', e?.message);
        registrarProvedorToken(null);
        await AsyncStorage.removeItem(SESSAO_AUTH0_KEY);
      } finally {
        if (ativo) setCarregando(false);
      }
    };
    recuperarSessao();
    return () => {
      ativo = false;
    };
  }, []);

  const login = useCallback(async (email, senha) => {
    const { id_token } = await auth0Api.autenticarComSenha(email, senha);
    registrarProvedorToken(() => Promise.resolve(id_token));
    const perfil = await authApi.getPerfilAtual(id_token);
    await AsyncStorage.setItem(SESSAO_AUTH0_KEY, JSON.stringify({ id_token }));
    setToken(id_token);
    setUsuario(perfil);
    return perfil;
  }, []);

  const registrar = useCallback(async (dados) => {
    // ↓ Cria a conta direto no BANCO LOCAL (POST /auth/registrar com bcrypt);
    //   o Auth0 entra só depois, para autenticar e emitir os tokens.
    await authApi.registrar({
      nome: dados?.nome,
      email: dados?.email,
      senha: dados?.senha,
    });
    return login(dados.email, dados.senha);
  }, [login]);

  const loginDemo = useCallback(async () => {
    const emailDemo = 'demo@kaorcount.com';
    const senhaDemo = 'demo123456';
    try {
      try {
        return await login(emailDemo, senhaDemo);
      } catch (loginErr) {
        return await registrar({
          nome: 'Reginaldo (Demo)',
          email: emailDemo,
          senha: senhaDemo,
        });
      }
    } catch (e) {
      console.warn('[Auth0] Demo indisponível:', e?.message);
      throw e;
    }
  }, [login, registrar]);

  const logout = useCallback(async () => {
    registrarProvedorToken(null);
    await AsyncStorage.multiRemove([SESSAO_AUTH0_KEY]);
    setToken(null);
    setUsuario(null);
  }, []);

  const atualizarUsuario = useCallback(async () => {
    const perfil = await authApi.getPerfilAtual();
    setUsuario(perfil);
    return perfil;
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
        auth0: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────
// ↓ Provider legado (comportamento original, inalterado)
// ───────────────────────────────────────────────────────────────
function AuthProviderLegado({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // ↓ Ao montar o app: tenta recuperar a sessão salva.
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

  // ↓ Login: autentica e persiste o token + dados do usuário.
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

  // ↓ Registrar: cria a conta e faz login automático.
  const registrar = useCallback(async (dados) => {
    // ↓ 1. Criar a conta no backend.
    await authApi.registrar(dados);

    // ↓ 2. Fazer login automático com as credenciais recém-criadas.
    const perfil = await login(dados.email, dados.senha);
    return perfil;
  }, [login]);

  // ↓ Login Demo / Convidado: autentica com conta de demonstração
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

  // ↓ Logout: limpa toda a sessão.
  const logout = useCallback(async () => {
    await limparSessao();
  }, []);

  const limparSessao = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
    setToken(null);
    setUsuario(null);
  };

  // ↓ Atualizar dados do usuário no contexto (sem re-login).
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
        auth0: false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ───────────────────────────────────────────────────────────────
// ↓ Provider público: escolhe Auth0 embutido (web configurado) ou legado.
// ───────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const auth0Ativo = AUTH0_CONFIGURADO && Platform.OS === 'web';
  if (auth0Ativo) {
    return <AuthProviderEmbutido>{children}</AuthProviderEmbutido>;
  }
  return <AuthProviderLegado>{children}</AuthProviderLegado>;
}

// ↓ Mesmo hook para as telas (shape idêntico nos dois modos).
export function useAuth() {
  return React.useContext(AuthContext);
}