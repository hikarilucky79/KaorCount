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
  AlertCircle,
  Check,
  Circle
} from 'lucide-react-native';
import * as authApi from '../api/authApi';
import { REQUISITOS_SENHA, validarSenha, EMAIL_VALIDO } from '../util/senha';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import useReduceMotion from '../hooks/useReduceMotion';

// [F442] Monta a tela de login, cadastro e recuperação de senha.
export default function AuthScreen({ navigation }) {
  const { login, iniciarCadastro } = useAuth();
  const { cores, isDark } = useTheme();
  const reduzirMovimento = useReduceMotion();
  const { height, isLandscape, rf, getContainer, maxAuthWidth } = useResponsive();

  const BANNER_WELCOME_ALTURA = isLandscape ? Math.min(160, height * 0.3) : Math.min(235, Math.max(195, height * 0.24));
  const BANNER_FORM_ALTURA = isLandscape ? Math.min(170, height * 0.4) : Math.min(270, Math.max(235, height * 0.3));
  const BANNER_EXPANDIDO_ALTURA = height;

  // ↓ Estado para controlar a tela ativa: 'welcome' | 'login' | 'register' | 'forgot'
  const [modo, setModo] = useState('welcome');
  const [carregandoReq, setCarregandoReq] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [avisoMsg, setAvisoMsg] = useState('');
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

  // ↓ Estados das etapas de recuperação da senha
  const [etapaRecuperacao, setEtapaRecuperacao] = useState('email');
  const [codigoRecuperacao, setCodigoRecuperacao] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [mostrarSenhaRecuperacao, setMostrarSenhaRecuperacao] = useState(false);


  // [F443] Troca o fluxo exibido e coordena a transição visual da tela.
  // ───────────────────────────────────────────────────────────
  // ↓ Transição usando o próprio Banner existente
  // ───────────────────────────────────────────────────────────
  const transicionarPara = (novoModo, aviso = '') => {
    if (animando) return;
    setErroMsg('');
    setAvisoMsg(aviso);
    if (reduzirMovimento) {
      if (novoModo === 'app') navigation.replace('AppTabs');
      else setModo(novoModo);
      return;
    }
    setAnimando(true);

    // 1. O banner marrom existente expande para baixo mantendo as bordas curvas com transição suave
    Animated.timing(animCortina, {
      toValue: 1,
      duration: 800,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) { setAnimando(false); return; }
      // 2. Quando a tela está 100% coberta pelo banner, troca o estado
      if (novoModo === 'app') {
        navigation.replace('AppTabs');
        return;
      }

      setModo(novoModo);

      // 3. O banner recolhe suavemente revelando o novo conteúdo
      Animated.timing(animCortina, {
        toValue: 0,
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: false,
      }).start(() => {
        setAnimando(false);
      });
    });
  };

  // [F444] Valida os campos e envia as credenciais para autenticação.
  // ───────────────────────────────────────────────────────────
  // ↓ Handler de Login
  // ───────────────────────────────────────────────────────────
  const handleLogin = async () => {
    setErroMsg('');
    setAvisoMsg('');
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

  // [F445] Abre o fluxo de criação de uma nova conta.
  // ───────────────────────────────────────────────────────────
  // ↓ Handler de Cadastro
  // ───────────────────────────────────────────────────────────
  const handleCadastrar = async () => {
    setErroMsg('');
    setAvisoMsg('');

    if (!nome.trim()) {
      setErroMsg('Por favor, informe seu nome completo.');
      return;
    }
    if (!EMAIL_VALIDO.test(email.trim())) {
      setErroMsg('Por favor, informe um e-mail válido.');
      return;
    }
    const problemaSenha = validarSenha(senha, { email: email.trim(), nome });
    if (problemaSenha) {
      setErroMsg(problemaSenha);
      return;
    }
    if (senha !== confirmarSenha) {
      setErroMsg('As senhas digitadas não coincidem.');
      return;
    }

    // O e-mail precisa ser confirmado com um código antes de seguir para o quiz.
    setCarregandoReq(true);
    try {
      await authApi.enviarCodigoEmail(email.trim());
      // Mantém as credenciais só em memória até a última etapa do quiz.
      iniciarCadastro({ nome: nome.trim(), email: email.trim(), senha });
      navigation.navigate('VerificarEmail');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível enviar o código para o seu e-mail.';
      setErroMsg(typeof msg === 'string' ? msg : 'Não foi possível enviar o código para o seu e-mail.');
    } finally {
      setCarregandoReq(false);
    }
  };

  // [F572] Solicita ou reenvia o código de recuperação sem revelar se a conta existe.
  const handleSolicitarRecuperacao = async () => {
    setErroMsg('');
    setAvisoMsg('');
    const emailNormalizado = emailLogin.trim();
    if (!EMAIL_VALIDO.test(emailNormalizado)) {
      setErroMsg('Por favor, informe um e-mail válido.');
      return;
    }

    setCarregandoReq(true);
    try {
      await authApi.esqueciSenha(emailNormalizado);
      setEtapaRecuperacao('codigo');
      setAvisoMsg('Se houver uma conta ativa associada a este e-mail, enviaremos um código. Verifique também a caixa de spam.');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível solicitar o código agora. Tente novamente mais tarde.';
      setErroMsg(typeof msg === 'string' ? msg : 'Não foi possível solicitar o código agora. Tente novamente mais tarde.');
    } finally {
      setCarregandoReq(false);
    }
  };

  // [F573] Valida o código e a nova senha antes de concluir a recuperação.
  const handleRedefinirSenha = async () => {
    setErroMsg('');
    setAvisoMsg('');
    const emailNormalizado = emailLogin.trim();
    if (!EMAIL_VALIDO.test(emailNormalizado)) {
      setErroMsg('Por favor, informe um e-mail válido.');
      setEtapaRecuperacao('email');
      return;
    }
    if (!/^\d{6}$/.test(codigoRecuperacao)) {
      setErroMsg('Informe o código de 6 dígitos recebido por e-mail.');
      return;
    }
    const problemaSenha = validarSenha(novaSenha, { email: emailNormalizado });
    if (problemaSenha) {
      setErroMsg(problemaSenha);
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErroMsg('As senhas digitadas não coincidem.');
      return;
    }

    setCarregandoReq(true);
    try {
      await authApi.redefinirSenha(emailNormalizado, codigoRecuperacao, novaSenha);
      setSenhaLogin('');
      setCodigoRecuperacao('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
      setEtapaRecuperacao('email');
      transicionarPara('login', 'Senha redefinida com sucesso. Entre com sua nova senha.');
    } catch (error) {
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível redefinir a senha. Confira o código e tente novamente.';
      setErroMsg(typeof msg === 'string' ? msg : 'Não foi possível redefinir a senha. Confira o código e tente novamente.');
    } finally {
      setCarregandoReq(false);
    }
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
              onPress={() => transicionarPara(modo === 'forgot' ? 'login' : 'welcome')}
              activeOpacity={0.75}
              accessibilityLabel={modo === 'forgot' ? 'Voltar para o login' : 'Voltar para boas-vindas'}
            >
              <ChevronLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View>
              <Text style={[styles.authBannerTitle, { fontSize: rf(29, 25, 34) }]}>
                {modo === 'login' ? 'Bem-vindo de volta!' : modo === 'register' ? 'Crie sua conta' : 'Recuperar senha'}
              </Text>
              <Text style={[styles.authBannerSubtitle, { fontSize: rf(16, 14, 18) }]}>
                {modo === 'login'
                  ? 'Entre na sua conta para continuar'
                  : modo === 'register'
                    ? 'Comece sua jornada nutricional'
                    : etapaRecuperacao === 'email'
                      ? 'Informe seu e-mail para receber um código'
                      : 'Digite o código recebido e escolha uma nova senha'}
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

                <View style={[styles.cardFormulario, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  {erroMsg ? (
                    <View style={styles.bannerErro}>
                      <AlertCircle size={16} color="#EB5757" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text style={styles.textoErro}>{erroMsg}</Text>
                    </View>
                  ) : null}
                  {avisoMsg ? (
                    <View style={styles.bannerSucesso} accessibilityLiveRegion="polite">
                      <Check size={16} color="#23834A" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text style={styles.textoSucesso}>{avisoMsg}</Text>
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
                      onChangeText={(t) => { setEmailLogin(t); setErroMsg(''); setAvisoMsg(''); }}
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
                      onChangeText={(t) => { setSenhaLogin(t); setErroMsg(''); setAvisoMsg(''); }}
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
                    onPress={() => {
                      setEtapaRecuperacao('email');
                      setCodigoRecuperacao('');
                      setNovaSenha('');
                      setConfirmarNovaSenha('');
                      setMostrarSenhaRecuperacao(false);
                      transicionarPara('forgot');
                    }}
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
      {/* 3. TELA: RECUPERAÇÃO DE SENHA                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modo === 'forgot' && (
        <Animated.View style={[styles.areaCorpoFlex, { opacity: opacidadeCorpo }]}>
          <ScrollView
            contentContainerStyle={styles.scrollForm}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.responsivoWrapper, getContainer(maxAuthWidth)]}>
              <View style={styles.corpoFormCentro}>
                <View style={[styles.cardFormulario, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  {erroMsg ? (
                    <View style={styles.bannerErro}>
                      <AlertCircle size={16} color="#EB5757" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text style={styles.textoErro}>{erroMsg}</Text>
                    </View>
                  ) : null}
                  {avisoMsg ? (
                    <View style={styles.bannerSucesso} accessibilityLiveRegion="polite">
                      <Check size={16} color="#23834A" style={{ marginRight: 6, flexShrink: 0 }} />
                      <Text style={styles.textoSucesso}>{avisoMsg}</Text>
                    </View>
                  ) : null}

                  {etapaRecuperacao === 'email' ? (
                    <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                      <Mail size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                      <TextInput
                        style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                        placeholder="E-mail cadastrado"
                        placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                        value={emailLogin}
                        onChangeText={(t) => { setEmailLogin(t); setErroMsg(''); setAvisoMsg(''); }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        editable={!carregandoReq}
                      />
                    </View>
                  ) : (
                    <>
                      <Text style={[styles.textoEmailRecuperacao, { color: cores.textoSuave }]}>Se a conta existir, o código foi enviado para {emailLogin.trim()}.</Text>
                      <TouchableOpacity
                        style={styles.linkRecuperacao}
                        onPress={() => {
                          setEtapaRecuperacao('email');
                          setCodigoRecuperacao('');
                          setNovaSenha('');
                          setConfirmarNovaSenha('');
                          setMostrarSenhaRecuperacao(false);
                          setErroMsg('');
                          setAvisoMsg('');
                        }}
                        disabled={carregandoReq}
                      >
                        <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria }]}>Alterar e-mail</Text>
                      </TouchableOpacity>

                      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                        <Mail size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                          placeholder="Código de 6 dígitos"
                          placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                          value={codigoRecuperacao}
                          onChangeText={(t) => { setCodigoRecuperacao(t.replace(/[^0-9]/g, '').slice(0, 6)); setErroMsg(''); }}
                          keyboardType="number-pad"
                          textContentType="oneTimeCode"
                          maxLength={6}
                          editable={!carregandoReq}
                        />
                      </View>

                      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                        <Lock size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                          placeholder="Nova senha"
                          placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                          value={novaSenha}
                          onChangeText={(t) => { setNovaSenha(t); setErroMsg(''); }}
                          secureTextEntry={!mostrarSenhaRecuperacao}
                          autoComplete="new-password"
                          editable={!carregandoReq}
                        />
                        <TouchableOpacity onPress={() => setMostrarSenhaRecuperacao(!mostrarSenhaRecuperacao)} accessibilityLabel={mostrarSenhaRecuperacao ? 'Ocultar nova senha' : 'Mostrar nova senha'}>
                          {mostrarSenhaRecuperacao
                            ? <EyeOff size={18} color={isDark ? '#8A7E74' : '#9C8E81'} />
                            : <Eye size={18} color={isDark ? '#8A7E74' : '#9C8E81'} />}
                        </TouchableOpacity>
                      </View>

                      {novaSenha.length > 0 ? (
                        <View style={styles.requisitosSenha} accessibilityLiveRegion="polite">
                          {REQUISITOS_SENHA.map(({ id, rotulo, atende }) => {
                            const ok = atende(novaSenha);
                            const cor = ok ? '#2E9E5B' : (isDark ? '#8A7E74' : '#9C8E81');
                            return (
                              <View key={id} style={styles.requisitoSenha} accessibilityLabel={rotulo + ': ' + (ok ? 'atendido' : 'pendente')}>
                                {ok ? <Check size={14} color={cor} /> : <Circle size={14} color={cor} />}
                                <Text style={[styles.requisitoSenhaTexto, { color: cor, fontSize: rf(12, 11, 14) }]}>{rotulo}</Text>
                              </View>
                            );
                          })}
                        </View>
                      ) : null}

                      <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                        <Lock size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 10 }} />
                        <TextInput
                          style={[styles.inputText, { color: cores.textoEscuro, fontSize: rf(14, 12, 16) }]}
                          placeholder="Confirmar nova senha"
                          placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                          value={confirmarNovaSenha}
                          onChangeText={(t) => { setConfirmarNovaSenha(t); setErroMsg(''); }}
                          secureTextEntry={!mostrarSenhaRecuperacao}
                          autoComplete="new-password"
                          editable={!carregandoReq}
                        />
                      </View>
                    </>
                  )}

                  <TouchableOpacity
                    style={[styles.btnPrincipal, { marginTop: 10 }, carregandoReq && { opacity: 0.6 }]}
                    onPress={etapaRecuperacao === 'email' ? handleSolicitarRecuperacao : handleRedefinirSenha}
                    disabled={carregandoReq}
                    activeOpacity={0.8}
                  >
                    {carregandoReq ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text style={[styles.txtBtnPrincipal, { fontSize: rf(15, 13, 17) }]}>
                          {etapaRecuperacao === 'email' ? 'Enviar código' : 'Redefinir senha'}
                        </Text>
                        <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                      </>
                    )}
                  </TouchableOpacity>

                  {etapaRecuperacao === 'codigo' ? (
                    <TouchableOpacity
                      style={styles.linkRecuperacao}
                      onPress={handleSolicitarRecuperacao}
                      disabled={carregandoReq}
                      accessibilityRole="button"
                    >
                      <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria }]}>Reenviar código</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 4. TELA: CADASTRO / REGISTER                                */}
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
                      placeholder="Senha (mín. 8 caracteres)"
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

                  {/* Requisitos da senha: aparecem ao digitar e vão sendo marcados */}
                  {senha.length > 0 ? (
                    <View style={styles.requisitosSenha} accessibilityLiveRegion="polite">
                      {REQUISITOS_SENHA.map(({ id, rotulo, atende }) => {
                        const ok = atende(senha);
                        const cor = ok ? '#2E9E5B' : (isDark ? '#8A7E74' : '#9C8E81');
                        return (
                          <View key={id} style={styles.requisitoSenha} accessibilityLabel={`${rotulo}: ${ok ? 'atendido' : 'pendente'}`}>
                            {ok ? <Check size={14} color={cor} /> : <Circle size={14} color={cor} />}
                            <Text style={[styles.requisitoSenhaTexto, { color: cor, fontSize: rf(12, 11, 14) }]}>{rotulo}</Text>
                          </View>
                        );
                      })}
                    </View>
                  ) : null}

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
  bannerSucesso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FFF4',
    borderColor: '#9AE6B4',
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
  textoSucesso: {
    fontSize: 12,
    color: '#276749',
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
  textoEmailRecuperacao: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  linkRecuperacao: {
    alignSelf: 'flex-end',
    marginBottom: 12,
    paddingVertical: 4,
  },

  inputText: {
    flex: 1,
    fontSize: 14,
    color: CORES.textoEscuro,
  },
  requisitosSenha: {
    marginTop: -4,
    marginBottom: 12,
    paddingHorizontal: 6,
    gap: 4,
  },
  requisitoSenha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requisitoSenhaTexto: {
    fontWeight: '500',
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
