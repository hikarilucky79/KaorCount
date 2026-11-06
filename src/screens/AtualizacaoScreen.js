// ───────────────────────────────────────────────────────────────
// src/screens/AtualizacaoScreen.js
// Tela exibida na abertura quando há uma versão mais nova do app.
// Quando a versão instalada é anterior à mínima aceita pelo servidor, a tela
// não pode ser dispensada.
// ───────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Download, AlertCircle } from 'lucide-react-native';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';

export default function AtualizacaoScreen({ atualizacao, aoDispensar }) {
  const { cores, isDark } = useTheme();
  const { rf, getContainer, maxAuthWidth } = useResponsive();
  const [erro, setErro] = useState('');
  const instalada = Constants.expoConfig?.version;

  const atualizar = async () => {
    setErro('');
    try {
      if (!atualizacao.url) throw new Error('sem link');
      await Linking.openURL(atualizacao.url);
    } catch (e) {
      setErro('Não foi possível abrir o link de download. Tente novamente mais tarde.');
    }
  };

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.conteudo, getContainer(maxAuthWidth)]}>
          <View style={[styles.icone, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
            <Download size={34} color={cores.primaria} />
          </View>

          <Text accessibilityRole="header" style={[styles.titulo, { color: cores.textoEscuro, fontSize: rf(26, 22, 32) }]}>
            {atualizacao.obrigatoria ? 'Atualização necessária' : 'Nova versão disponível'}
          </Text>
          <Text style={[styles.descricao, { color: cores.textoSuave, fontSize: rf(15, 13, 17) }]}>
            {atualizacao.obrigatoria
              ? 'Esta versão do KaorCount não é mais compatível. Atualize para continuar usando o app.'
              : 'Há uma versão mais nova do KaorCount com melhorias e correções. Recomendamos atualizar.'}
          </Text>

          <View style={[styles.versoes, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            <View style={styles.linhaVersao}>
              <Text style={[styles.rotulo, { color: cores.textoSuave }]}>Sua versão</Text>
              <Text style={[styles.valor, { color: cores.textoEscuro }]}>{instalada || '—'}</Text>
            </View>
            <View style={[styles.divisor, { backgroundColor: cores.borda }]} />
            <View style={styles.linhaVersao}>
              <Text style={[styles.rotulo, { color: cores.textoSuave }]}>Versão mais nova</Text>
              <Text style={[styles.valor, { color: cores.primaria }]}>{atualizacao.versaoAtual}</Text>
            </View>
          </View>

          {erro ? (
            <View style={styles.bannerErro} accessibilityRole="alert">
              <AlertCircle size={16} color="#EB5757" style={{ marginRight: 6, flexShrink: 0 }} />
              <Text style={styles.textoErro}>{erro}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btnPrincipal, { backgroundColor: cores.primaria }]}
            onPress={atualizar}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={[styles.txtBtnPrincipal, { fontSize: rf(16, 14, 18) }]}>Atualizar agora</Text>
          </TouchableOpacity>

          {!atualizacao.obrigatoria ? (
            <TouchableOpacity
              style={styles.btnDepois}
              onPress={aoDispensar}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <Text style={[styles.txtDepois, { color: cores.textoSuave, fontSize: rf(15, 13, 17) }]}>Agora não</Text>
            </TouchableOpacity>
          ) : null}

          <Text style={[styles.dica, { color: cores.textoSuave, fontSize: rf(12, 11, 14) }]}>
            O download abre no navegador. Depois, abra o arquivo baixado para instalar por cima da versão atual; seus dados são mantidos.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 24 },
  conteudo: { width: '100%', alignItems: 'stretch' },
  icone: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 22,
  },
  titulo: { fontWeight: '800', textAlign: 'center', marginBottom: 10 },
  descricao: { textAlign: 'center', lineHeight: 22, marginBottom: 26 },
  versoes: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 18, marginBottom: 22 },
  linhaVersao: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  divisor: { height: 1 },
  rotulo: { fontSize: 14 },
  valor: { fontSize: 15, fontWeight: '800' },
  bannerErro: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5F5', borderColor: '#FEB2B2', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  textoErro: { fontSize: 12, color: '#E53E3E', fontWeight: '600', flex: 1 },
  btnPrincipal: {
    borderRadius: 20, minHeight: 58, paddingVertical: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  txtBtnPrincipal: { color: '#FFFFFF', fontWeight: 'bold' },
  btnDepois: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  txtDepois: { fontWeight: '600' },
  dica: { textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
