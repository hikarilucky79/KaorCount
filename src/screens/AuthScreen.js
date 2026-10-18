import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Image, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator,
  Animated,
  Easing,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CORES } from '../constants/Cores';
import { 
  Mail, 
  Lock, 
  User, 
  ChevronLeft, 
  Flame, 
  Zap, 
  Droplets, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';

export default function AuthScreen({ navigation }) {
  const { login, iniciarCadastro } = useAuth();
  const { cores, isDark } = useTheme();
  const { height, isLandscape, rf, getContainer, maxAuthWidth } = useResponsive();

  const BANNER_WELCOME_ALTURA = isLandscape ? Math.min(160, height * 0.3) : Math.min(235, Math.max(195, height * 0.24));
  const BANNER_FORM_ALTURA = isLandscape ? Math.min(170, height * 0.4) : Math.min(270, Math.max(235, height * 0.3));
  const BANNER_EXPANDIDO_ALTURA = height;

  // ↓ Estado para controlar a tela ativa: 'welcome' | 'login' | 'register'
  const [modo, setModo] = useState('welcome');
  const [carregandoReq, setCarregandoReq] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [animando, setAnimando] = useState(false);

  // ↓ Valor animado (0 = repouso da tela atual, 1 = banner totalmente estendido cobrindo a tela)
  const animCortina = useRef(new Animated.Value(0)).current;

  // ↓ Estados do formulário de Login
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [mostrarSenhaLogin, setMostrarSenhaLogin] = useState(false);

  // ↓ Estados do formulário de Cadastro
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenhaCad, setMostrarSenhaCad] = useState(false);

  const renderGoogleButton = (label) => (
    <TouchableOpacity
      style={[styles.googleButton, { backgroundColor: cores.branco, borderColor: cores.borda }]}
      onPress={() => setErroMsg('A autenticação com Google ainda não está configurada.')}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={styles.googleMark}>G</Text>
      <Text style={[styles.googleButtonText, { color: cores.textoEscuro }]}>{label}</Text>
    </TouchableOpacity>
  );

  // ───────────────────────────────────────────────────────────
  // ↓ Transição usando o próprio Banner existente
  // ───────────────────────────────────────────────────────────
  const transicionarPara = (novoModo) => {
    if (animando) return;
    setErroMsg('');
    setAnimando(true);

    // 1. O banner marrom existente expande para baixo mantendo as bordas curvas com transição suave (1s)
    Animated.timing(animCortina, {
      toValue: 1,
      duration: 1000,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: false,
    }).start(() => {
      // 2. Quando a tela está 100% coberta pelo banner, troca o estado
      if (novoModo === 'app') {
        navigation.replace('AppTabs');
        return;
      }

      setModo(novoModo);

      // 3. O banner recolhe suavemente revelando o novo conteúdo (1s)
      Animated.timing(animCortina, {
        toValue: 0,
        duration: 1000,
        easing: Easing.bezier(0.22, 1, 0.36, 1),
        useNativeDriver: false,
      }).start(() => {
        setAnimando(false);
      });
    });
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Handler de Login
  // ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setErroMsg('');
    if (!emailLogin.trim() || !emailLogin.includes('@')) {
      setErroMsg('Por favor, informe um e-mail válido.');
      return;
    }
    if (!senhaLogin) {
      setErroMsg('Por favor, informe sua senha.');
      return;
    }

    setCarregandoReq(true);
    try {
      await login(emailLogin.trim(), senhaLogin);
      transicionarPara('app');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível fazer login. Verifique suas credenciais.';
      setErroMsg(typeof msg === 'string' ? msg : 'Erro ao entrar na conta.');
    } finally {
      setCarregandoReq(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Handler de Cadastro
  // ───────────────────────────────────────────────────────────
  const handleCadastrar = async () => {
    setErroMsg('');

    if (!nome.trim()) {
      setErroMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErroMsg('Por favor, informe um e-mail válido.');
      return;
    }
    if (senha.length < 6) {
      setErroMsg('A senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      setErroMsg('As senhas digitadas não coincidem.');
      return;
    }

    // Mantém as credenciais só em memória até a última etapa do quiz.
    iniciarCadastro({ nome: nome.trim(), email: email.trim(), senha });
    navigation.navigate('QuizCadastro');
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Interpolação de Altura do Banner (único elemento animado)
  // ───────────────────────────────────────────────────────────
  const alturaBanner = animCortina.interpolate({
    inputRange: [0, 1],
    outputRange: [modo === 'welcome' ? BANNER_WELCOME_ALTURA : BANNER_FORM_ALTURA, BANNER_EXPANDIDO_ALTURA],
  });

  const escalaLogoCentral = animCortina.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const opacidadeCorpo = animCortina.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0.2, 0],
  });

  const borderBottomRadius = animCortina.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [42, 20, 0],
  });

  return (
    <SafeAreaView style={[styles.containerTela, { backgroundColor: cores.fundo }]}>
      
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 🌟 BANNER MARROM PRINCIPAL (ÚNICO, ANIMA DIRETAMENTE)       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Animated.View 
        style={[
          styles.bannerSuperior,
          {
            height: alturaBanner,
            borderBottomLeftRadius: borderBottomRadius,
            borderBottomRightRadius: borderBottomRadius,
            overflow: 'hidden',
          }
        ]}
      >
        <View pointerEvents="none" style={styles.formaBannerGrande} />
        <View pointerEvents="none" style={styles.formaBannerPequena} />
        {modo === 'welcome' ? (
          <Animated.View style={[styles.conteudoBanner, { transform: [{ scale: escalaLogoCentral }] }]}>
            <Image
              source={require('../../assets/kaorcount1-removebg-preview.png')}
              style={styles.logoWelcome}
              resizeMode="contain"
            />
            <Text style={styles.subtituloBanner}>Seu companheiro de nutrição</Text>
          </Animated.View>
        ) : (
          <View style={styles.authBannerContent}>
            <TouchableOpacity
              style={styles.btnVoltarBanner}
              onPress={() => transicionarPara('welcome')}
              activeOpacity={0.75}
              accessibilityLabel="Voltar para boas-vindas"
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={[styles.authBannerTitle, { fontSize: rf(29, 25, 34) }]}>
                {modo === 'login' ? 'Bem-vindo de volta!' : 'Crie sua conta'}
              </Text>
              <Text style={[styles.authBannerSubtitle, { fontSize: rf(16, 14, 18) }]}>
                {modo === 'login' ? 'Entre na sua conta para continuar' : 'Comece sua jornada nutricional'}
              </Text>
            </View>
          </View>
        )}
      </Animated.View>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. TELA: WELCOME / BOAS-VINDAS                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modo === 'welcome' && (
        <Animated.View style={[styles.areaCorpoFlex, { opacity: opacidadeCorpo }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollWelcome} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.responsivoWrapper, getContainer(maxAuthWidth)]}>
              {/* Conteúdo Central */}
              <View style={styles.corpoWelcome}>
                <View style={styles.centroHeader}>
                  <Text style={[styles.tituloBoasVindas, { color: cores.textoEscuro, fontSize: rf(20, 17, 24) }]}>Bem-vindo ao KaorCount!</Text>
                  <Text style={[styles.subBoasVindas, { color: cores.textoSuave, fontSize: rf(13, 11, 15) }]}>Controle suas calorias e macronutrientes com facilidade</Text>
                </View>

                {/* Destaques de Funcionalidades */}
                <View style={styles.listaFeatures}>
                  <View style={[styles.cardFeature, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                    <View style={[styles.iconeFeatureBox, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
                      <Flame size={rf(18, 16, 22)} color={cores.primaria} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.featureTitulo, { color: cores.textoEscuro, fontSize: rf(13, 12, 16) }]}>Contagem de Calorias</Text>
                      <Text style={[styles.featureDesc, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Registre refeições e acompanhe seu consumo diário</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFeature, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                    <View style={[styles.iconeFeatureBox, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
                      <Zap size={rf(18, 16, 22)} color={cores.primaria} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.featureTitulo, { color: cores.textoEscuro, fontSize: rf(13, 12, 16) }]}>Macronutrientes</Text>
                      <Text style={[styles.featureDesc, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Proteínas, carbos e gorduras em tempo real</Text>
                    </View>
                  </View>

                  <View style={[styles.cardFeature, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                    <View style={[styles.iconeFeatureBox, { backgroundColor: isDark ? '#14253D' : '#EBF4FE' }]}>
                      <Droplets size={rf(18, 16, 22)} color="#2F80ED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.featureTitulo, { color: cores.textoEscuro, fontSize: rf(13, 12, 16) }]}>Hidratação</Text>
                      <Text style={[styles.featureDesc, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Monitore sua ingestão de água diária</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Botões de Ação Inferiores */}
              <View style={styles.rodapeAcoes}>
                <TouchableOpacity 
                  style={styles.btnPrincipal}
                  onPress={() => transicionarPara('login')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.txtBtnPrincipal, { fontSize: rf(15, 13, 17) }]}>Entrar na conta</Text>
                  <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.btnSecundario, { backgroundColor: cores.branco, borderColor: cores.primaria }]}
                  onPress={() => transicionarPara('register')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.txtBtnSecundario, { color: cores.primaria, fontSize: rf(15, 13, 17) }]}>Criar conta grátis</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.guestLink}
                  onPress={() => setErroMsg('O acesso como convidado ainda não está disponível.')}
                  accessibilityRole="button"
                >
                  <Text style={[styles.guestLinkText, { color: cores.textoSuave }]}>Entrar como convidado (demo)</Text>
                </TouchableOpacity>
                {erroMsg ? <Text style={styles.guestError}>{erroMsg}</Text> : null}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. TELA: LOGIN                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modo === 'login' && (
        <Animated.View style={[styles.areaCorpoFlex, { opacity: opacidadeCorpo }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollForm} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.responsivoWrapper, getContainer(maxAuthWidth)]}>
              <View style={styles.corpoFormCentro}>
                {renderGoogleButton('Entrar com Google')}
                <View style={styles.divisorAuth}>
                  <View style={[styles.linhaDivisor, { backgroundColor: cores.borda }]} />
                  <Text style={[styles.textoDivisor, { color: cores.textoSuave }]}>ou entre com e-mail</Text>
                  <View style={[styles.linhaDivisor, { backgroundColor: cores.borda }]} />
                </View>

                <View style={[styles.cardFormulario, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  {erroMsg ? (
                    <View style={styles.bannerErro}>
                      <AlertCircle size={16} color="#EB5757" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text style={styles.textoErro}>{erroMsg}</Text>
                    </View>
                  ) : null}

                  {/* Input E-mail */}
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Mail size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                      placeholder="E-mail"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      value={emailLogin}
                      onChangeText={(t) => { setEmailLogin(t); setErroMsg(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!carregandoReq}
                    />
                  </View>

                  {/* Input Senha */}
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Lock size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                      placeholder="Senha"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      value={senhaLogin}
                      onChangeText={(t) => { setSenhaLogin(t); setErroMsg(''); }}
                      secureTextEntry={!mostrarSenhaLogin}
                      editable={!carregandoReq}
                    />
                    <TouchableOpacity onPress={() => setMostrarSenhaLogin(!mostrarSenhaLogin)}>
                      {mostrarSenhaLogin ? (
                        <EyeOff size={18} color={isDark ? '#8A7E74' : '#9C8E81'} />
                      ) : (
                        <Eye size={18} color={isDark ? '#8A7E74' : '#9C8E81'} />
                      )}
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.forgotPassword}
                    onPress={() => setErroMsg('A recuperação de senha ainda não está disponível.')}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria, fontSize: rf(13, 11, 15) }]}>Esqueci minha senha</Text>
                  </TouchableOpacity>

                  {/* Botão Entrar */}
                  <TouchableOpacity 
                    style={[styles.btnPrincipal, { marginTop: 10 }, carregandoReq && { opacity: 0.6 }]}
                    onPress={handleLogin}
                    disabled={carregandoReq}
                    activeOpacity={0.8}
                  >
                    {carregandoReq ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={[styles.txtBtnPrincipal, { fontSize: rf(15, 13, 17) }]}>Entrar</Text>
                        <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.demoButton, { backgroundColor: cores.branco, borderColor: cores.borda }]}
                  onPress={() => setErroMsg('O acesso com conta de demonstração ainda não está disponível.')}
                  accessibilityRole="button"
                >
                  <Text style={[styles.demoButtonText, { color: cores.textoSuave }]}>Entrar com conta de demonstração</Text>
                </TouchableOpacity>

                <View style={styles.rodapeLink}>
                  <Text style={[styles.txtRodapeLink, { color: cores.textoSuave, fontSize: rf(15, 13, 17) }]}>Não tem conta? </Text>
                  <TouchableOpacity onPress={() => transicionarPara('register')}>
                    <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria, fontSize: rf(17, 15, 19) }]}>Cadastre-se grátis</Text>
                  </TouchableOpacity>
                </View>

              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. TELA: CADASTRO / REGISTER                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modo === 'register' && (
        <Animated.View style={[styles.areaCorpoFlex, { opacity: opacidadeCorpo }]}>
          <ScrollView 
            contentContainerStyle={styles.scrollForm} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.responsivoWrapper, getContainer(maxAuthWidth)]}>
              <View style={styles.corpoFormCentro}>
                {renderGoogleButton('Cadastrar com Google')}
                <View style={styles.divisorAuth}>
                  <View style={[styles.linhaDivisor, { backgroundColor: cores.borda }]} />
                  <Text style={[styles.textoDivisor, { color: cores.textoSuave }]}>ou cadastre com e-mail</Text>
                  <View style={[styles.linhaDivisor, { backgroundColor: cores.borda }]} />
                </View>

                <View style={[styles.cardFormulario, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  {erroMsg ? (
                    <View style={styles.bannerErro}>
                      <AlertCircle size={16} color="#EB5757" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text style={styles.textoErro}>{erroMsg}</Text>
                    </View>
                  ) : null}

                  {/* Input Nome */}
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <User size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                      placeholder="Nome completo"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      value={nome}
                      onChangeText={(t) => { setNome(t); setErroMsg(''); }}
                      editable={!carregandoReq}
                    />
                  </View>

                  {/* Input E-mail */}
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Mail size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                      placeholder="E-mail"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      value={email}
                      onChangeText={(t) => { setEmail(t); setErroMsg(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      editable={!carregandoReq}
                    />
                  </View>

                  {/* Input Senha */}
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Lock size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                      placeholder="Senha (mín. 6 caracteres)"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      value={senha}
                      onChangeText={(t) => { setSenha(t); setErroMsg(''); }}
                      secureTextEntry={!mostrarSenhaCad}
                      editable={!carregandoReq}
                    />
                    <TouchableOpacity onPress={() => setMostrarSenhaCad(!mostrarSenhaCad)}>
                      {mostrarSenhaCad ? (
                        <EyeOff size={18} color={isDark ? '#8A7E74' : '#9C8E81'} />
                      ) : (
                        <Eye size={18} color={isDark ? '#8A7E74' : '#9C8E81'} />
                      )}
                    </TouchableOpacity>
                  </View>

                  {/* Input Confirmar Senha */}
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Lock size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                    <TextInput 
                      style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                      placeholder="Confirmar senha"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      value={confirmarSenha}
                      onChangeText={(t) => { setConfirmarSenha(t); setErroMsg(''); }}
                      secureTextEntry={!mostrarSenhaCad}
                      editable={!carregandoReq}
                    />
                  </View>

                  {/* Botão Criar Conta */}
                  <TouchableOpacity 
                    style={[styles.btnPrincipal, { marginTop: 10 }, carregandoReq && { opacity: 0.6 }]}
                    onPress={handleCadastrar}
                    disabled={carregandoReq}
                    activeOpacity={0.8}
                  >
                    {carregandoReq ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={[styles.txtBtnPrincipal, { fontSize: rf(15, 13, 17) }]}>Criar conta</Text>
                        <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Link para Login */}
                <View style={styles.rodapeLink}>
                  <Text style={[styles.txtRodapeLink, { color: cores.textoSuave, fontSize: rf(15, 13, 17) }]}>Já tem conta? </Text>
                  <TouchableOpacity onPress={() => transicionarPara('login')}>
                    <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria, fontSize: rf(17, 15, 19) }]}>Fazer login</Text>
                  </TouchableOpacity>
                </View>
                </View>
            </View>
          </ScrollView>
        </Animated.View>      
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerTela: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  responsivoWrapper: {
    width: '100%',
    flex: 1,
    justifyContent: 'space-between',
  },
  areaCorpoFlex: {
    flex: 1,
  },
  scrollWelcome: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 18,
  },
  scrollForm: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
    paddingTop: 20,
    justifyContent: 'space-between',
  },
  corpoFormCentro: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 12,
  },

  // Banner Topo (Único Elemento)
  bannerSuperior: {
    backgroundColor: '#85461E',
    borderBottomLeftRadius: 48,
    borderBottomRightRadius: 48,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 16px rgba(0, 0, 0, 0.22)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.22,
        shadowRadius: 16,
        elevation: 20,
      },
    }),
    zIndex: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conteudoBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  formaBannerGrande: {
    position: 'absolute',
    width: 270,
    height: 270,
    borderRadius: 135,
    right: -88,
    top: -42,
    backgroundColor: 'rgba(255,255,255,0.065)',
  },
  formaBannerPequena: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    left: -47,
    bottom: -32,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  authBannerContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
    zIndex: 1,
  },
  btnVoltarBanner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  authBannerTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 4,
  },
  authBannerSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontWeight: '400',
  },
  logoWelcome: {
    width: 170,
    height: 75,
  },
  subtituloBanner: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  googleButton: {
    minHeight: 58,
    borderRadius: 19,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 18,
  },
  googleMark: {
    color: '#4285F4',
    fontSize: 25,
    fontWeight: '800',
  },
  googleButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  divisorAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  linhaDivisor: {
    height: 1,
    flex: 1,
  },
  textoDivisor: {
    fontSize: 14,
  },

  // Corpo Welcome (Centralizado no espaço vertical)
  corpoWelcome: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 14,
  },
  centroHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  tituloBoasVindas: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
    textAlign: 'center',
    marginBottom: 4,
  },
  subBoasVindas: {
    fontSize: 13,
    color: CORES.textoSuave,
    textAlign: 'center',
  },
  listaFeatures: {
    gap: 12,
  },
  cardFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.branco,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  iconeFeatureBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureTitulo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
  },
  featureDesc: {
    fontSize: 11,
    color: CORES.textoSuave,
    marginTop: 1,
  },

  // Rodapé Welcome
  rodapeAcoes: {
    paddingHorizontal: 22,
    gap: 12,
    paddingTop: 4,
  },
  guestLink: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  guestLinkText: {
    fontSize: 15,
  },
  guestError: {
    color: '#B54747',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  btnPrincipal: {
    backgroundColor: CORES.primaria,
    borderRadius: 20,
    minHeight: 58,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtBtnPrincipal: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnSecundario: {
    backgroundColor: CORES.branco,
    borderRadius: 20,
    minHeight: 58,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: CORES.primaria,
  },
  txtBtnSecundario: {
    color: CORES.primaria,
    fontSize: 15,
    fontWeight: 'bold',
  },

  // Card do Formulário
  cardFormulario: {
    backgroundColor: CORES.branco,
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    marginTop: 8,
  },
  bannerErro: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  textoErro: {
    fontSize: 12,
    color: '#E53E3E',
    fontWeight: '600',
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.fundoInput,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 12,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 10,
  },
  demoButton: {
    minHeight: 56,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  demoButtonText: {
    fontSize: 15,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: CORES.textoEscuro,
  },
  rodapeLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    marginBottom: 4,
  },
  txtRodapeLink: {
    fontSize: 13,
    color: CORES.textoSuave,
  },
  txtRodapeLinkDestaque: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.primaria,
  },
});
