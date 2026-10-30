// ───────────────────────────────────────────────────────────────
// src/contexts/AuthContext.js
// Context global de autenticação do KaorCount.
//
// Autenticação 100% local: o backend valida e-mail/senha (bcrypt)
// e emite um token JWT HS256, que fica salvo no AsyncStorage.
// As telas usam useAuth(): usuario, token, carregando, logado,
// login, registrar, logout, atualizarUsuario.
// ───────────────────────────────────────────────────────────────
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/authApi';
import * as usuarioApi from '../api/usuarioApi';

// ↓ Chaves usadas no AsyncStorage.
const TOKEN_KEY = '@kaorcount_token';
const USUARIO_KEY = '@kaorcount_usuario';

export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const usuarioRef = useRef(null);
  const sessaoRef = useRef(0);
  const filaPreferencias = useRef(Promise.resolve());
  const [token, setToken] = useState(null);
  const [carregando, setCarregando] = useState(true);
  // Credenciais do cadastro ficam apenas em memória até o quiz ser concluído.
  const [cadastroPendente, setCadastroPendente] = useState(null);

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
          usuarioRef.current = perfil;
    setUsuario(perfil);
          await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(perfil));
        } catch (errorPerfil) {
          // Token rejeitado pelo servidor: encerra a sessão local. Se a rede
          // estiver indisponível, mantém o cache para não pedir login à toa.
          const credenciaisRejeitadas = [401, 403].includes(errorPerfil?.response?.status);
          if (credenciaisRejeitadas) {
            await limparSessao();
          } else if (usuarioSalvo) {
            usuarioRef.current = JSON.parse(usuarioSalvo);
            setUsuario(usuarioRef.current);
          } else {
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
    sessaoRef.current += 1;
    const respToken = await authApi.login(email, senha);
    const novoToken = respToken.access_token;

    // ↓ 2. Salvar o token para que as próximas chamadas usem ele.
    await AsyncStorage.setItem(TOKEN_KEY, novoToken);
    setToken(novoToken);

    // ↓ 3. Buscar os dados completos do usuário autenticado.
    const perfil = await authApi.getPerfilAtual();
    usuarioRef.current = perfil;
          setUsuario(perfil);
    await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(perfil));
    setCadastroPendente(null);

    return perfil;
  }, []);

  // Guarda o cadastro temporariamente; nenhum dado é enviado ao backend ainda.
  const iniciarCadastro = useCallback((dados) => {
    setCadastroPendente(dados);
  }, []);

  // Só é chamado ao concluir o quiz: cria a conta e autentica a pessoa.
  const registrar = useCallback(async (dados) => {
    await authApi.registrar(dados);
    const perfil = await login(dados.email, dados.senha);
    setCadastroPendente(null);
    return perfil;
  }, [login]);

  // ↓ Logout: limpa toda a sessão.
  const logout = useCallback(async () => {
    await limparSessao();
    setCadastroPendente(null);
  }, []);

  const limparSessao = async () => {
    sessaoRef.current += 1;
    usuarioRef.current = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, USUARIO_KEY]);
    setToken(null);
    setUsuario(null);
  };

  // ↓ Atualizar dados do usuário no contexto (sem re-login).
  const atualizarUsuario = useCallback(async () => {
    try {
      const perfil = await authApi.getPerfilAtual();
      usuarioRef.current = perfil;
      setUsuario(perfil);
      await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(perfil));
      return perfil;
    } catch (error) {
      console.error('[AuthContext] Erro ao atualizar usuário:', error);
      throw error;
    }
  }, []);

  const salvarPreferencias = useCallback((alteracoes) => {
    const id = usuarioRef.current?.id_usuario;
    const sessao = sessaoRef.current;
    if (!id) return Promise.reject(new Error('Faça login para salvar suas preferências.'));
    const operacao = filaPreferencias.current.catch(() => {}).then(async () => {
      if (usuarioRef.current?.id_usuario !== id || sessaoRef.current !== sessao) throw new Error('A sessão foi alterada.');
      const resposta = await usuarioApi.atualizar(id, { preferencias: alteracoes });
      if (usuarioRef.current?.id_usuario === id && sessaoRef.current === sessao) {
        const proximo = { ...usuarioRef.current, preferencias: resposta.preferencias };
        usuarioRef.current = proximo;
        setUsuario(proximo);
        try { await AsyncStorage.setItem(USUARIO_KEY, JSON.stringify(proximo)); } catch { /* A conta já foi salva no servidor. */ }
      }
      return resposta.preferencias;
    });
    filaPreferencias.current = operacao;
    return operacao;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        carregando,
        logado: !!token,
        login,
        iniciarCadastro,
        registrar,
        cadastroPendente,
        logout,
        atualizarUsuario,
        salvarPreferencias,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ↓ Hook para as telas.
export function useAuth() {
  return React.useContext(AuthContext);
}
