// ───────────────────────────────────────────────────────────────
// src/screens/VerificarEmailScreen.js
// Confirmação do e-mail no cadastro (AuthScreen → VerificarEmail → QuizCadastro).
//
// O backend enviou um código de 6 dígitos para o e-mail informado. Quando a
// pessoa o digita, recebemos um token de verificação, que fica junto das
// credenciais pendentes (só em memória) e é enviado ao criar a conta no fim
// do quiz.
// ───────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, AlertCircle, MailCheck } from 'lucide-react-native';
import * as authApi from '../api/authApi';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';

const TAMANHO_CODIGO = 6;
const INTERVALO_REENVIO_SEGUNDOS = 60;

const mensagemDoErro = (error, padrao) => {
  const detalhe = error?.response?.data?.detail || error?.message;
  return typeof detalhe === 'string' && detalhe ? detalhe : padrao;
};

export default function VerificarEmailScreen({ navigation }) {
  const { cadastroPendente, iniciarCadastro } = useAuth();
  const { cores, isDark } = useTheme();
  const { rf, getContainer, maxAuthWidth } = useResponsive();

  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  // O código acabou de ser enviado pela tela anterior, então a contagem já começa.
  const [espera, setEspera] = useState(INTERVALO_REENVIO_SEGUNDOS);

  const email = cadastroPendente?.email;

  // Sem credenciais pendentes (ex.: recarregou a página), volta ao cadastro.
  useEffect(() => {
    if (!email) navigation.replace('Auth');
  }, [email, navigation]);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  const confirmar = async (valor = codigo) => {
    if (confirmando) return;
    if (valor.length !== TAMANHO_CODIGO) {
      setErro(`Digite os ${TAMANHO_CODIGO} dígitos do código.`);
      return;
    }
    setErro('');
    setAviso('');
    setConfirmando(true);
    try {
      const token = await authApi.confirmarCodigoEmail(email, valor);
      iniciarCadastro({ ...cadastroPendente, token_verificacao: token });
      navigation.navigate('QuizCadastro');
    } catch (e) {
      setErro(mensagemDoErro(e, 'Não foi possível confirmar o código. Tente novamente.'));
    } finally {
      setConfirmando(false);
    }
  };

  const aoDigitar = (texto) => {
    const apenasDigitos = texto.replace(/\D/g, '').slice(0, TAMANHO_CODIGO);
    setCodigo(apenasDigitos);
    setErro('');
    // Confirma sozinho ao completar o código, inclusive quando o teclado o preenche.
    if (apenasDigitos.length === TAMANHO_CODIGO) confirmar(apenasDigitos);
  };

  const reenviar = async () => {
    if (espera > 0 || reenviando) return;
    setErro('');
    setAviso('');
    setReenviando(true);
    try {
      await authApi.enviarCodigoEmail(email);
      setCodigo('');
      setEspera(INTERVALO_REENVIO_SEGUNDOS);
      setAviso('Enviamos um novo código para o seu e-mail.');
    } catch (e) {
      setErro(mensagemDoErro(e, 'Não foi possível reenviar o código agora.'));
    } finally {
      setReenviando(false);
    }
  };

  if (!email) return null;

  const corSuave = isDark ? '#8A7E74' : '#9C8E81';

  return (
    <SafeAreaView style={[styles.tela, { backgroundColor: cores.fundo }]}>
      <KeyboardAvoidingView style={styles.tela} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={[styles.conteudo, getContainer(maxAuthWidth)]}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Voltar e corrigir o e-mail"
              style={[styles.btnVoltar, { backgroundColor: cores.branco, borderColor: cores.borda }]}
            >
              <ArrowLeft size={22} color={cores.textoEscuro} />
            </TouchableOpacity>

            <View style={[styles.icone, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
              <MailCheck size={30} color={cores.primaria} />
            </View>

            <Text style={[styles.titulo, { color: cores.textoEscuro, fontSize: rf(26, 22, 32) }]}>Confirme seu e-mail</Text>
            <Text style={[styles.descricao, { color: cores.textoSuave, fontSize: rf(15, 13, 17) }]}>
              Enviamos um código de {TAMANHO_CODIGO} dígitos para{' '}
              <Text style={{ color: cores.textoEscuro, fontWeight: '700' }}>{email}</Text>. Ele vale por 10 minutos.
            </Text>

            {erro ? (
              <View style={styles.bannerErro} accessibilityRole="alert">
                <AlertCircle size={16} color="#EB5757" style={{ marginRight: 6, flexShrink: 0 }} />
                <Text style={styles.textoErro}>{erro}</Text>
              </View>
            ) : null}
            {aviso && !erro ? (
              <Text style={[styles.aviso, { color: cores.textoSuave }]} accessibilityLiveRegion="polite">{aviso}</Text>
            ) : null}

            <TextInput
              value={codigo}
              onChangeText={aoDigitar}
              onSubmitEditing={() => confirmar()}
              keyboardType="number-pad"
              maxLength={TAMANHO_CODIGO}
              autoFocus
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              placeholder="······"
              placeholderTextColor={corSuave}
              editable={!confirmando}
              accessibilityLabel={`Código de ${TAMANHO_CODIGO} dígitos`}
              underlineColorAndroid="transparent"
              style={[
                styles.campoCodigo,
                {
                  color: cores.textoEscuro,
                  backgroundColor: isDark ? '#262626' : cores.fundoInput,
                  borderColor: erro ? '#EB5757' : (isDark ? '#3A3A3A' : cores.borda),
                  fontSize: rf(32, 28, 38),
                },
                Platform.OS === 'web' ? { outlineStyle: 'none' } : null,
              ]}
            />

            <TouchableOpacity
              style={[styles.btnPrincipal, { backgroundColor: cores.primaria }, (confirmando || codigo.length !== TAMANHO_CODIGO) && { opacity: 0.6 }]}
              onPress={() => confirmar()}
              disabled={confirmando || codigo.length !== TAMANHO_CODIGO}
              activeOpacity={0.8}
              accessibilityRole="button"
            >
              {confirmando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.txtBtnPrincipal, { fontSize: rf(16, 14, 18) }]}>Confirmar e continuar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.rodape}>
              <Text style={[styles.rodapeTexto, { color: cores.textoSuave, fontSize: rf(14, 12, 16) }]}>Não recebeu? </Text>
              <TouchableOpacity onPress={reenviar} disabled={espera > 0 || reenviando} accessibilityRole="button">
                <Text style={[styles.rodapeLink, { color: espera > 0 || reenviando ? corSuave : cores.primaria, fontSize: rf(15, 13, 17) }]}>
                  {reenviando ? 'Enviando…' : espera > 0 ? `Reenviar em ${espera}s` : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.dica, { color: corSuave, fontSize: rf(12, 11, 14) }]}>
              Confira também a caixa de spam. Se o e-mail estiver errado, volte e corrija.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  tela: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 22, paddingVertical: 18 },
  conteudo: { width: '100%', flex: 1 },
  btnVoltar: {
    width: 48, height: 48, borderRadius: 24, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
  },
  icone: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  titulo: { fontWeight: '800', marginBottom: 8 },
  descricao: { lineHeight: 22, marginBottom: 24 },
  bannerErro: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF5F5', borderColor: '#FEB2B2', borderWidth: 1,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14,
  },
  textoErro: { fontSize: 12, color: '#E53E3E', fontWeight: '600', flex: 1 },
  aviso: { fontSize: 13, marginBottom: 14 },
  campoCodigo: {
    height: 72, borderRadius: 20, borderWidth: 1, textAlign: 'center',
    fontWeight: '800', letterSpacing: 12, marginBottom: 18, paddingHorizontal: 16,
  },
  btnPrincipal: {
    borderRadius: 20, minHeight: 58, paddingVertical: 15,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  txtBtnPrincipal: { color: '#FFFFFF', fontWeight: 'bold' },
  rodape: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 22 },
  rodapeTexto: {},
  rodapeLink: { fontWeight: 'bold' },
  dica: { textAlign: 'center', marginTop: 14, lineHeight: 18 },
});
