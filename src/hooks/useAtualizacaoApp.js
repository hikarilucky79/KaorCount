import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import api from '../api/client';
import { buscarVersao } from '../api/versaoApi';
import { avaliarAtualizacao, resolverUrl } from '../util/versao';

/**
 * Verifica, uma vez ao abrir o app, se existe uma versão mais nova.
 *
 * Só Android: é a única plataforma com instalador distribuído (APK); na web o
 * navegador já carrega sempre a versão publicada. Qualquer falha (sem internet,
 * servidor fora do ar, resposta estranha) é ignorada: o app abre normalmente.
 *
 * @returns {{ verificando: boolean, atualizacao: null | { versaoAtual: string, obrigatoria: boolean, url: string }, dispensar: () => void }}
 */
export default function useAtualizacaoApp() {
  const habilitado = Platform.OS === 'android';
  const [verificando, setVerificando] = useState(habilitado);
  const [atualizacao, setAtualizacao] = useState(null);

  useEffect(() => {
    if (!habilitado) return undefined;
    let ativo = true;
    (async () => {
      try {
        const instalada = Constants.expoConfig?.version;
        const resposta = await buscarVersao();
        const pendente = avaliarAtualizacao(instalada, resposta);
        if (ativo && pendente) {
          setAtualizacao({ ...pendente, url: resolverUrl(pendente.url, api.defaults.baseURL) });
        }
      } catch (erro) {
        // Sem checagem não há bloqueio: o app segue.
      } finally {
        if (ativo) setVerificando(false);
      }
    })();
    return () => { ativo = false; };
  }, [habilitado]);

  const dispensar = useCallback(() => setAtualizacao(null), []);

  return { verificando, atualizacao, dispensar };
}
