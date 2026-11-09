// ───────────────────────────────────────────────────────────────
// src/contexts/ThemeContext.js
// Contexto global de tema com Detecção Automática do Sistema Operacional
// e suporte ao Tema Escuro oficial com fundo #121212
// ───────────────────────────────────────────────────────────────
import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useColorScheme, Alert, Platform } from 'react-native';
import useAuth from '../hooks/useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CORES_CLARO, CORES_ESCURO } from '../constants/Cores';

export const ThemeContext = createContext({
  tema: 'claro',
  modoTema: 'claro', // 'sistema' | 'claro' | 'escuro'
  isDark: false,
  cores: CORES_CLARO,
  toggleTema: () => {},
  setTema: () => {},
  setModoTema: () => {},
  usarTemaSistema: () => {},
});

const THEME_STORAGE_KEY = '@kaorcount_tema_modo';

// [F426] Compartilha o tema e as opções de aparência com os componentes.
export const ThemeProvider = ({ children }) => {
  // Captura o esquema de cores do celular (Dark / Light)
  const { usuario, salvarPreferencias } = useAuth();
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null / undefined
  const [modoTema, setModoTemaState] = useState('claro'); // 'sistema' | 'claro' | 'escuro'
  const [carregado, setCarregado] = useState(false);
  const [salvandoTema, setSalvandoTema] = useState(false);
  const travaTema = useRef(false);

  useEffect(() => {
    let ativo = true;
    if (usuario?.id_usuario) {
      setModoTemaState(usuario.preferencias?.tema || 'claro');
      setCarregado(true);
    } else {
      AsyncStorage.getItem(THEME_STORAGE_KEY).then(salvo => {
        if (ativo) setModoTemaState(['claro', 'escuro', 'sistema'].includes(salvo) ? salvo : 'claro');
      }).catch(() => {}).finally(() => { if (ativo) setCarregado(true); });
    }
    return () => { ativo = false; };
  }, [usuario?.id_usuario, usuario?.preferencias?.tema]);

  const setModoTema = useCallback(async novoModo => {
    if (travaTema.current) return;
    travaTema.current = true;
    setSalvandoTema(true);
    try {
      if (usuario?.id_usuario) await salvarPreferencias({ tema: novoModo });
      else { await AsyncStorage.setItem(THEME_STORAGE_KEY, novoModo); setModoTemaState(novoModo); }
    } catch {
      const mensagem = 'Não foi possível salvar o tema na conta. Tente novamente.';
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert(mensagem);
      else Alert.alert('Erro', mensagem);
    } finally { travaTema.current = false; setSalvandoTema(false); }
  }, [usuario?.id_usuario, salvarPreferencias]);

  // Alterna manualmente entre claro e escuro
  const toggleTema = useCallback(async () => {
    const atualIsDark = modoTema === 'sistema' ? (systemScheme === 'dark') : (modoTema === 'escuro');
    const proximo = atualIsDark ? 'claro' : 'escuro';
    await setModoTema(proximo);
  }, [modoTema, systemScheme, setModoTema]);

  // Define tema diretamente ('claro' ou 'escuro')
  const setTema = useCallback(async (novoTema) => {
    await setModoTema(novoTema);
  }, [setModoTema]);

  // Retorna para o modo automático do sistema
  const usarTemaSistema = useCallback(async () => {
    await setModoTema('sistema');
  }, [setModoTema]);

  // Determina se o tema ativo é escuro
  const isDark = useMemo(() => {
    if (modoTema === 'escuro') return true;
    if (modoTema === 'claro') return false;
    // Se for 'sistema', detecta o modo do celular
    return systemScheme === 'dark';
  }, [modoTema, systemScheme]);

  const tema = isDark ? 'escuro' : 'claro';
  const cores = useMemo(() => (isDark ? CORES_ESCURO : CORES_CLARO), [isDark]);

  const contextValue = useMemo(() => ({
    tema,
    modoTema,
    isDark,
    cores,
    toggleTema,
    setTema,
    setModoTema,
    usarTemaSistema,
    salvandoTema,
  }), [tema, modoTema, isDark, cores, toggleTema, setTema, setModoTema, usarTemaSistema, salvandoTema]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
