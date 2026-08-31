// ───────────────────────────────────────────────────────────────
// src/contexts/ThemeContext.js
// Contexto global de tema com Detecção Automática do Sistema Operacional
// e suporte ao Tema Escuro oficial com fundo #121212
// ───────────────────────────────────────────────────────────────
import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CORES_CLARO, CORES_ESCURO } from '../constants/Cores';

export const ThemeContext = createContext({
  tema: 'claro',
  modoTema: 'sistema', // 'sistema' | 'claro' | 'escuro'
  isDark: false,
  cores: CORES_CLARO,
  toggleTema: () => {},
  setTema: () => {},
  setModoTema: () => {},
  usarTemaSistema: () => {},
});

const THEME_STORAGE_KEY = '@kaorcount_tema_modo';

export const ThemeProvider = ({ children }) => {
  // Captura o esquema de cores do celular (Dark / Light)
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null / undefined
  const [modoTema, setModoTemaState] = useState('sistema'); // 'sistema' | 'claro' | 'escuro'
  const [carregado, setCarregado] = useState(false);

  // Carrega a preferência salva no AsyncStorage
  useEffect(() => {
    const carregarPreferencia = async () => {
      try {
        const salvo = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (salvo === 'escuro' || salvo === 'claro' || salvo === 'sistema') {
          setModoTemaState(salvo);
        } else {
          // Por padrão inicial, usa detecção automática do celular
          setModoTemaState('sistema');
        }
      } catch (e) {
        console.warn('[ThemeContext] Erro ao carregar preferência de tema:', e?.message);
      } finally {
        setCarregado(true);
      }
    };
    carregarPreferencia();
  }, []);

  // Define modo manual ou sistema e persiste
  const setModoTema = useCallback(async (novoModo) => {
    try {
      setModoTemaState(novoModo);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, novoModo);
    } catch (e) {
      console.warn('[ThemeContext] Erro ao salvar modo de tema:', e?.message);
    }
  }, []);

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
  }), [tema, modoTema, isDark, cores, toggleTema, setTema, setModoTema, usarTemaSistema]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
