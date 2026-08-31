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
  Platform,
  Dimensions
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
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import * as metaNutriApi from '../api/metaNutriApi';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BANNER_WELCOME_ALTURA = 135;
const BANNER_EXPANDIDO_ALTURA = (SCREEN_HEIGHT || 850) + 120;

export default function AuthScreen({ navigation }) {
  const { login, registrar, loginDemo } = useAuth();
  const { cores, isDark } = useTheme();

  // ↓ Estado para controlar a tela ativa: 'welcome' | 'login' | 'register'
  const [modo, setModo] = useState('welcome');
  const [carregandoReq, setCarregandoReq] = useState(false);
  const [erroMsg, setErroMsg] = useState('');
  const [animando, setAnimando] = useState(false);

  const handleEntrarDemo = async () => {
    try {
      if (loginDemo) {
        await loginDemo();
      }
    } catch (e) {
      console.warn('[AuthScreen] Erro ao carregar demo:', e?.message);
    }
    transicionarPara('app');
  };

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

    setCarregandoReq(true);
    try {
      // 1. Criar conta no backend
      const novoUsuario = await registrar({
        nome: nome.trim(),
        email: email.trim(),
        senha: senha,
      });

      // 2. Tentar criar perfil nutricional inicial padrão
      const idUser = novoUsuario?.id_usuario || novoUsuario?.id;
      if (idUser) {
        try {
          await perfilNutriApi.salvarOuAtualizar(idUser, {
            data_nascimento: '2000-01-01',
            genero: 'masculino',
            objetivo_nutricional: 'manter_peso',
            nivel_atividade: 'moderado',
          });

          await historicoProgressoApi.criar({
            id_usuario: idUser,
            data_registro: new Date().toISOString().split('T')[0],
            peso_atual: 70,
            altura_atual: 175,
          });

          await metaNutriApi.criar({
            id_usuario: idUser,
            calorias_diarias: 2000,
            proteina_g: 150,
            carboidrato_g: 225,
            gordura_g: 55,
            data_inicio: new Date().toISOString().split('T')[0],
          });
        } catch (setupErr) {
          console.warn('[Cadastro] Configuração inicial pendente:', setupErr?.message);
        }
      }

      // 3. Fazer login automático com as novas credenciais
      try {
        await login(email.trim(), senha);
      } catch (loginErr) {
        console.warn('[Cadastro] Login automático pós-registro falhou:', loginErr?.message);
      }

      transicionarPara('app');
    } catch (error) {
      console.error('[Cadastro] Erro:', error);
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível criar a conta. Tente novamente.';
      setErroMsg(typeof msg === 'string' ? msg : 'Erro ao cadastrar.');
    } finally {
      setCarregandoReq(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Interpolação de Altura do Banner (único elemento animado)
  // ───────────────────────────────────────────────────────────
  const alturaBanner = animCortina.interpolate({
    inputRange: [0, 1],
    outputRange: [modo === 'welcome' ? BANNER_WELCOME_ALTURA : 0, BANNER_EXPANDIDO_ALTURA],
  });

  const escalaLogoCentral = animCortina.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  const opacidadeCorpo = animCortina.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0.2, 0],
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
            overflow: 'hidden',
          }
        ]}
      >
        <Animated.View 
          style={[
            styles.conteudoBanner,
            {
              transform: [{ scale: escalaLogoCentral }]
            }
          ]}
        >
          <Image 
            source={require('../../assets/kaorcount1-removebg-preview.png')} 
            style={styles.logoWelcome}
            resizeMode="contain"
          />
          <Text style={styles.subtituloBanner}>Seu companheiro de nutrição</Text>
        </Animated.View>
      </Animated.View>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. TELA: WELCOME / BOAS-VINDAS                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modo === 'welcome' && (
        <Animated.View style={[styles.areaCorpoFlex, { opacity: opacidadeCorpo }]}>
          <ScrollView contentContainerStyle={styles.scrollWelcome} showsVerticalScrollIndicator={false}>
            
            {/* Conteúdo Central */}
            <View style={styles.corpoWelcome}>
              <View style={styles.centroHeader}>
                <Text style={[styles.tituloBoasVindas, { color: cores.textoEscuro }]}>Bem-vindo ao KaorCount!</Text>
                <Text style={[styles.subBoasVindas, { color: cores.textoSuave }]}>Controle suas calorias e macronutrientes com facilidade</Text>
              </View>

              {/* Destaques de Funcionalidades */}
              <View style={styles.listaFeatures}>
                <View style={[styles.cardFeature, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  <View style={[styles.iconeFeatureBox, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
                    <Flame size={18} color={cores.primaria} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitulo, { color: cores.textoEscuro }]}>Contagem de Calorias</Text>
                    <Text style={[styles.featureDesc, { color: cores.textoSuave }]}>Registre refeições e acompanhe seu consumo diário</Text>
                  </View>
                </View>

                <View style={[styles.cardFeature, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  <View style={[styles.iconeFeatureBox, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
                    <Zap size={18} color={cores.primaria} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitulo, { color: cores.textoEscuro }]}>Macronutrientes</Text>
                    <Text style={[styles.featureDesc, { color: cores.textoSuave }]}>Proteínas, carbos e gorduras em tempo real</Text>
                  </View>
                </View>

                <View style={[styles.cardFeature, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  <View style={[styles.iconeFeatureBox, { backgroundColor: isDark ? '#14253D' : '#EBF4FE' }]}>
                    <Droplets size={18} color="#2F80ED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitulo, { color: cores.textoEscuro }]}>Hidratação</Text>
                    <Text style={[styles.featureDesc, { color: cores.textoSuave }]}>Monitore sua ingestão de água diária</Text>
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
                <Text style={styles.txtBtnPrincipal}>Entrar na conta</Text>
                <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.btnSecundario, { backgroundColor: cores.branco, borderColor: cores.primaria }]}
                onPress={() => transicionarPara('register')}
                activeOpacity={0.8}
              >
                <Text style={[styles.txtBtnSecundario, { color: cores.primaria }]}>Criar conta grátis</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.btnDemo}
                onPress={handleEntrarDemo}
                activeOpacity={0.7}
              >
                <Text style={[styles.txtBtnDemo, { color: cores.textoSuave }]}>Entrar como convidado (demo)</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </Animated.View>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. TELA: LOGIN                                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      {modo === 'login' && (
        <Animated.View style={[styles.areaCorpoFlex, { opacity: opacidadeCorpo }]}>
          <ScrollView contentContainerStyle={styles.scrollForm} showsVerticalScrollIndicator={false}>
            
            {/* Header de Voltar */}
            <View style={styles.navBarTop}>
              <TouchableOpacity 
                style={[styles.btnVoltarCircular, { backgroundColor: cores.branco, borderColor: cores.borda }]}
                onPress={() => transicionarPara('welcome')}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={cores.textoEscuro} />
              </TouchableOpacity>
              <Text style={[styles.navBarTitulo, { color: cores.textoEscuro }]}>Entrar</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Bloco Central do Formulário (Perfeitamente Centralizado) */}
            <View style={styles.corpoFormCentro}>
              
              {/* Logo e Títulos */}
              <View style={styles.headerCentro}>
                <Image 
                  source={require('../../assets/kaorcount1-removebg-preview.png')} 
                  style={styles.logoForm}
                  resizeMode="contain"
                />
                <Text style={[styles.tituloForm, { color: cores.textoEscuro }]}>Bem-vindo de volta!</Text>
                <Text style={[styles.subtituloForm, { color: cores.textoSuave }]}>Entre com suas credenciais</Text>
              </View>

              {/* Card do Formulário */}
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
                    style={[styles.inputText, { color: cores.textoEscuro }]}
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
                    style={[styles.inputText, { color: cores.textoEscuro }]}
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
                      <Text style={styles.txtBtnPrincipal}>Entrar</Text>
                      <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                <View style={[styles.divisorLinha, { backgroundColor: cores.borda }]} />

                {/* Botão Demo */}
                <TouchableOpacity 
                  style={[styles.btnDemoCard, { backgroundColor: isDark ? '#262626' : '#FDF8F2', borderColor: cores.borda }]}
                  onPress={handleEntrarDemo}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.txtBtnDemoCard, { color: cores.primaria }]}>Entrar com conta de demonstração</Text>
                </TouchableOpacity>
              </View>

              {/* Link para Cadastro */}
              <View style={styles.rodapeLink}>
                <Text style={[styles.txtRodapeLink, { color: cores.textoSuave }]}>Não tem conta? </Text>
                <TouchableOpacity onPress={() => transicionarPara('register')}>
                  <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria }]}>Cadastre-se</Text>
                </TouchableOpacity>
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
          <ScrollView contentContainerStyle={styles.scrollForm} showsVerticalScrollIndicator={false}>
            
            {/* Header de Voltar */}
            <View style={styles.navBarTop}>
              <TouchableOpacity 
                style={[styles.btnVoltarCircular, { backgroundColor: cores.branco, borderColor: cores.borda }]}
                onPress={() => transicionarPara('welcome')}
                activeOpacity={0.7}
              >
                <ChevronLeft size={20} color={cores.textoEscuro} />
              </TouchableOpacity>
              <Text style={[styles.navBarTitulo, { color: cores.textoEscuro }]}>Criar conta</Text>
              <View style={{ width: 36 }} />
            </View>

            {/* Bloco Central do Formulário (Perfeitamente Centralizado) */}
            <View style={styles.corpoFormCentro}>
              
              {/* Logo e Títulos */}
              <View style={styles.headerCentro}>
                <Image 
                  source={require('../../assets/kaorcount1-removebg-preview.png')} 
                  style={styles.logoForm}
                  resizeMode="contain"
                />
                <Text style={[styles.tituloForm, { color: cores.textoEscuro }]}>Crie sua conta</Text>
                <Text style={[styles.subtituloForm, { color: cores.textoSuave }]}>Comece sua jornada nutricional</Text>
              </View>

              {/* Card do Formulário */}
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
                    style={[styles.inputText, { color: cores.textoEscuro }]}
                    placeholder="Seu nome completo"
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
                    style={[styles.inputText, { color: cores.textoEscuro }]}
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
                    style={[styles.inputText, { color: cores.textoEscuro }]}
                    placeholder="Senha (mínimo 6 caracteres)"
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
                    style={[styles.inputText, { color: cores.textoEscuro }]}
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
                      <Text style={styles.txtBtnPrincipal}>Criar conta</Text>
                      <ArrowRight size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </>
                  )}
                </TouchableOpacity>

                {/* Link para Login */}
                <View style={styles.rodapeLink}>
                  <Text style={[styles.txtRodapeLink, { color: cores.textoSuave }]}>Já tem uma conta? </Text>
                  <TouchableOpacity onPress={() => transicionarPara('login')}>
                    <Text style={[styles.txtRodapeLinkDestaque, { color: cores.primaria }]}>Entrar</Text>
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
  areaCorpoFlex: {
    flex: 1,
  },
  scrollWelcome: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: 25,
  },
  scrollForm: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 25,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  corpoFormCentro: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 10,
  },

  // Banner Topo (Único Elemento)
  bannerSuperior: {
    backgroundColor: '#85461e',
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
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
    gap: 10,
  },
  btnPrincipal: {
    backgroundColor: CORES.primaria,
    borderRadius: 18,
    paddingVertical: 14,
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
    borderRadius: 18,
    paddingVertical: 14,
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
  btnDemo: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtBtnDemo: {
    color: CORES.textoSuave,
    fontSize: 12,
    fontWeight: '600',
  },

  // Estilos de Navegação Superior nos Formulários
  navBarTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 5,
  },
  btnVoltarCircular: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: CORES.branco,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBarTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
  },

  // Header Formulários
  headerCentro: {
    alignItems: 'center',
    marginVertical: 12,
  },
  logoForm: {
    width: 140,
    height: 60,
    marginBottom: 8,
  },
  tituloForm: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
    marginBottom: 2,
  },
  subtituloForm: {
    fontSize: 13,
    color: CORES.textoSuave,
  },

  // Card do Formulário
  cardFormulario: {
    backgroundColor: CORES.branco,
    borderRadius: 24,
    padding: 18,
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
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.borda,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 14,
    color: CORES.textoEscuro,
  },
  divisorLinha: {
    height: 1,
    backgroundColor: CORES.borda,
    marginVertical: 14,
  },
  btnDemoCard: {
    backgroundColor: '#F7EFE6',
    borderRadius: 14,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtBtnDemoCard: {
    color: CORES.textoSuave,
    fontSize: 12,
    fontWeight: '600',
  },
  rodapeLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
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