import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Platform, Animated, Easing, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CORES } from '../constants/Cores';
import { DoorOpen, Check, Flame, Scale, Dumbbell, Info, Moon, Sun, LockKeyhole, UserRound, Flag, BookMarked, BellRing, Ruler, Database, CircleHelp, X } from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as metaNutriApi from '../api/metaNutriApi';

function BotaoObjetivoAnimado({ obj, ativo, cores, isDark, onPress, rf, moderateScale }) {
  const animScale = useRef(new Animated.Value(ativo ? 1.05 : 1)).current;
  const IconeComp = obj.icone;

  useEffect(() => {
    Animated.spring(animScale, {
      toValue: ativo ? 1.05 : 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [ativo]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        Animated.sequence([
          Animated.timing(animScale, { toValue: 0.93, duration: 75, useNativeDriver: true }),
          Animated.spring(animScale, { toValue: 1.05, friction: 4, tension: 160, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      style={{ flex: 1, marginHorizontal: 2 }}
    >
      <Animated.View
        style={[
          styles.cardObjetivo,
          {
            backgroundColor: ativo ? (isDark ? '#2A1D13' : '#FDF3E7') : cores.branco,
            borderColor: ativo ? cores.primaria : cores.borda,
            borderWidth: ativo ? 1.5 : 1,
            transform: [{ scale: animScale }],
          },
        ]}
      >
        <IconeComp size={moderateScale ? moderateScale(20, 0.3) : 20} color={ativo ? cores.primaria : cores.textoSuave} />
        <Text style={[styles.txtObjetivo, { color: cores.textoSuave, fontSize: rf ? rf(12, 10, 14) : 12 }, ativo && [styles.txtObjetivoAtivo, { color: cores.primaria }]]}>
          {obj.nome}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function BotaoAtividadeAnimado({ nivel, ativo, cores, isDark, onPress, rf }) {
  const animScale = useRef(new Animated.Value(ativo ? 1.02 : 1)).current;

  useEffect(() => {
    Animated.spring(animScale, {
      toValue: ativo ? 1.02 : 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [ativo]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        Animated.sequence([
          Animated.timing(animScale, { toValue: 0.96, duration: 75, useNativeDriver: true }),
          Animated.spring(animScale, { toValue: 1.02, friction: 4, tension: 160, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      style={{ marginBottom: 10 }}
    >
      <Animated.View
        style={[
          styles.boxAtividadeInativa,
          {
            backgroundColor: ativo ? (isDark ? '#2A1D13' : '#FDF3E7') : cores.branco,
            borderColor: ativo ? cores.primaria : cores.borda,
            borderWidth: ativo ? 1.5 : 1,
            marginBottom: 0,
            transform: [{ scale: animScale }],
          },
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.txtAtividadeNome, { color: cores.textoEscuro, fontSize: rf ? rf(14, 12, 16) : 14 }, ativo && { color: cores.primaria, fontWeight: 'bold' }]}>
            {nivel.nome}
          </Text>
          {ativo ? <Check size={18} color={cores.primaria} /> : null}
        </View>
        <Text style={[styles.txtAtividadeSub, { color: cores.textoSuave, fontSize: rf ? rf(11, 10, 13) : 11 }]}>{nivel.descricao}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ConfiguracaoScreen({ navigation }) {
  const { usuario, logout } = useAuth();
  const { cores, isDark, toggleTema } = useTheme();
  const { width, height, isLandscape, isSmallScreen, isTablet, isDesktop, rf, moderateScale, getContainer, maxContentWidth } = useResponsive();

  const [pushAtivo, setPushAtivo] = useState(true);
  const [lembreteAtivo, setLembreteAtivo] = useState(true);
  const [nivelAtividade, setNivelAtividade] = useState('moderado');
  const [objetivo, setObjetivo] = useState('manter_peso');
  const [perfilCompleto, setPerfilCompleto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [deslogando, setDeslogando] = useState(false);
  const [secaoSelecionada, setSecaoSelecionada] = useState(null);

  // ↓ Lista de níveis de atividade
  const niveisAtividade = [
    { id: 'sedentario', nome: 'Sedentário', descricao: 'pouco ou nenhum exercício' },
    { id: 'leve', nome: 'Levemente ativo', descricao: '1-3x por semana' },
    { id: 'moderado', nome: 'Moderado', descricao: '3-5x por semana' },
    { id: 'muito_ativo', nome: 'Muito ativo', descricao: '6-7x por semana' },
  ];

  // ↓ Lista de objetivos
  const objetivos = [
    { id: 'perder_peso', nome: 'Perder', icone: Flame },
    { id: 'manter_peso', nome: 'Manter', icone: Scale },
    { id: 'ganhar_massa', nome: 'Ganhar', icone: Dumbbell },
  ];

  // ───────────────────────────────────────────────────────────
  // ↓ Carregar dados do perfil nutricional
  // ───────────────────────────────────────────────────────────
  const carregarDados = useCallback(async () => {
    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) {
      setCarregando(false);
      return;
    }

    try {
      const perfil = await perfilNutriApi.buscarPerfil(idUsuario);
      if (perfil) {
        setPerfilCompleto(perfil);
        if (perfil.nivel_atividade) setNivelAtividade(perfil.nivel_atividade === 'intenso' ? 'muito_ativo' : perfil.nivel_atividade);
        if (perfil.objetivo_nutricional) setObjetivo(perfil.objetivo_nutricional);
      }
    } catch (error) {
      console.warn('[Config] Perfil nutricional não encontrado:', error.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  // ───────────────────────────────────────────────────────────
  // ↓ Animação de Entrada Lateral Fluida ao focar na aba (900ms Suave)
  // ───────────────────────────────────────────────────────────
  const animEntrada = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      carregarDados();
      animEntrada.setValue(0);
      Animated.timing(animEntrada, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [carregarDados])
  );

  const offsetSlide = Math.round(moderateScale(35, 0.3));
  const fadeConteudo = animEntrada.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1] });
  const slideConteudo = animEntrada.interpolate({ inputRange: [0, 1], outputRange: [offsetSlide, 0], extrapolate: 'clamp' });

  // ───────────────────────────────────────────────────────────
  // ↓ Atualizar nível de atividade via API
  // ───────────────────────────────────────────────────────────
  const alterarNivelAtividade = async (novoNivel) => {
    const nivelAnterior = nivelAtividade;
    setNivelAtividade(novoNivel);

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) return;

    try {
      await perfilNutriApi.salvarOuAtualizar(idUsuario, {
        nivel_atividade: novoNivel,
        objetivo_nutricional: objetivo,
        data_nascimento: perfilCompleto?.data_nascimento || '2000-01-01',
        genero: perfilCompleto?.genero || 'masculino',
      });
    } catch (error) {
      setNivelAtividade(nivelAnterior);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Não foi possível atualizar o nível de atividade.');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o nível de atividade.');
      }
      console.error('[Config] Erro ao atualizar atividade:', error);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Atualizar objetivo via API
  // ───────────────────────────────────────────────────────────
  const alterarObjetivo = async (novoObj) => {
    const objAnterior = objetivo;
    setObjetivo(novoObj);

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) return;

    try {
      await perfilNutriApi.salvarOuAtualizar(idUsuario, {
        objetivo_nutricional: novoObj,
        nivel_atividade: nivelAtividade,
        data_nascimento: perfilCompleto?.data_nascimento || '2000-01-01',
        genero: perfilCompleto?.genero || 'masculino',
      });
    } catch (error) {
      setObjetivo(objAnterior);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Não foi possível atualizar o objetivo.');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o objetivo.');
      }
      console.error('[Config] Erro ao atualizar objetivo:', error);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Logout real: limpar token e navegar para Auth
  // ───────────────────────────────────────────────────────────
  const executarLogout = async () => {
    setDeslogando(true);
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (error) {
      console.error('[Config] Erro ao desconectar:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Não foi possível desconectar.');
      } else {
        Alert.alert('Erro', 'Não foi possível desconectar.');
      }
      setDeslogando(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmado = typeof window !== 'undefined' ? window.confirm('Tem certeza que deseja desconectar da sua conta?') : true;
      if (confirmado) {
        executarLogout();
      }
    } else {
      Alert.alert(
        'Sair da conta',
        'Tem certeza que deseja desconectar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: executarLogout,
          },
        ]
      );
    }
  };

  const itensMenu = [
    { id: 'conta', titulo: 'Conta', Icone: LockKeyhole },
    { id: 'perfil', titulo: 'Perfil', Icone: UserRound },
    { id: 'objetivos', titulo: 'Meus objetivos', Icone: Flag },
    { id: 'diario', titulo: 'Diário & Monitor de água', Icone: BookMarked },
    { id: 'lembretes', titulo: 'Lembretes', Icone: BellRing },
    { id: 'unidades', titulo: 'Unidades', Icone: Ruler },
    { id: 'pais', titulo: 'País da base de dados dos alimentos', Icone: Database },
    { id: 'ajuda', titulo: 'Ajuda & Perguntas frequentes', Icone: CircleHelp },
    { id: 'sobre', titulo: 'Sobre o KaorCount', Icone: Info },
  ];

  const selecionarItem = (id) => {
    if (id === 'perfil' || id === 'diario') {
      navigation.navigate('AppTabs', { screen: id === 'perfil' ? 'Perfil' : 'Diário' });
      return;
    }
    setSecaoSelecionada(id);
  };

  const corFundoMenu = isDark ? '#111A27' : cores.fundo;
  const corTextoMenu = isDark ? '#F5F7FA' : cores.textoEscuro;
  const tituloSecao = itensMenu.find((item) => item.id === secaoSelecionada)?.titulo;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: corFundoMenu }}>
      <View style={[styles.menuHeader, { borderBottomColor: isDark ? '#263243' : cores.borda }]}>
        <TouchableOpacity
          onPress={() => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('AppTabs', { screen: 'Perfil' })}
          accessibilityRole="button"
          accessibilityLabel="Fechar configurações"
          style={styles.menuFechar}
        >
          <X size={26} color={corTextoMenu} />
        </TouchableOpacity>
        <Text style={[styles.menuTitulo, { color: corTextoMenu, fontSize: rf(22, 20, 26) }]}>Configurações</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.menuLista, getContainer(maxContentWidth)]} showsVerticalScrollIndicator={false}>
        {itensMenu.map(({ id, titulo, Icone }) => (
          <TouchableOpacity
            key={id}
            style={styles.menuLinha}
            onPress={() => selecionarItem(id)}
            activeOpacity={0.7}
            accessibilityRole="button"
          >
            <Icone size={29} color={corTextoMenu} fill={['conta', 'perfil', 'objetivos', 'lembretes'].includes(id) ? corTextoMenu : 'none'} strokeWidth={2.6} />
            <Text style={[styles.menuLinhaTexto, { color: corTextoMenu, fontSize: rf(18, 16, 21) }]}>{titulo}</Text>
            <ChevronRight size={17} color={isDark ? '#718096' : cores.textoSuave} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal transparent visible={!!secaoSelecionada} animationType="slide" onRequestClose={() => setSecaoSelecionada(null)}>
        <View style={styles.modalFundo}>
          <View style={[styles.modalConfig, { backgroundColor: isDark ? '#1B2635' : cores.branco, borderColor: cores.borda }]}>
            <View style={styles.modalHeaderConfig}>
              <Text style={[styles.modalTituloConfig, { color: corTextoMenu }]}>{tituloSecao}</Text>
              <TouchableOpacity onPress={() => setSecaoSelecionada(null)} accessibilityLabel="Fechar">
                <X size={22} color={corTextoMenu} />
              </TouchableOpacity>
            </View>

            {secaoSelecionada === 'conta' ? (
              <View>
                <Text style={[styles.modalDescricao, { color: cores.textoSuave }]}>{usuario?.email || 'Conta KaorCount'}</Text>
                <TouchableOpacity style={styles.acaoLogout} onPress={() => { setSecaoSelecionada(null); handleLogout(); }} disabled={deslogando}>
                  {deslogando ? <ActivityIndicator color="#EB5757" /> : <><DoorOpen color="#EB5757" size={20} /><Text style={styles.botaoLogoutTexto}>Sair da conta</Text></>}
                </TouchableOpacity>
              </View>
            ) : null}

            {secaoSelecionada === 'objetivos' ? (
              <ScrollView style={{ maxHeight: 430 }}>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSuave }]}>OBJETIVO</Text>
                <View style={styles.rowObjetivos}>
                  {objetivos.map((obj) => (
                    <BotaoObjetivoAnimado key={obj.id} obj={obj} ativo={objetivo === obj.id} cores={cores} isDark={isDark} onPress={() => alterarObjetivo(obj.id)} rf={rf} moderateScale={moderateScale} />
                  ))}
                </View>
                <Text style={[styles.modalSubtitulo, { color: cores.textoSuave }]}>NÍVEL DE ATIVIDADE</Text>
                {niveisAtividade.map((nivel) => (
                  <BotaoAtividadeAnimado key={nivel.id} nivel={nivel} ativo={nivelAtividade === nivel.id} cores={cores} isDark={isDark} onPress={() => alterarNivelAtividade(nivel.id)} rf={rf} />
                ))}
              </ScrollView>
            ) : null}

            {secaoSelecionada === 'lembretes' ? (
              <View>
                <View style={styles.modalLinhaSwitch}><Text style={[styles.modalDescricao, { color: corTextoMenu }]}>Notificações push</Text><Switch value={pushAtivo} onValueChange={setPushAtivo} trackColor={{ true: cores.primaria }} /></View>
                <View style={styles.modalLinhaSwitch}><Text style={[styles.modalDescricao, { color: corTextoMenu }]}>Lembrete de refeição</Text><Switch value={lembreteAtivo} onValueChange={setLembreteAtivo} trackColor={{ true: cores.primaria }} /></View>
                <View style={styles.modalLinhaSwitch}><Text style={[styles.modalDescricao, { color: corTextoMenu }]}>Tema escuro</Text><Switch value={isDark} onValueChange={toggleTema} trackColor={{ true: cores.primaria }} /></View>
              </View>
            ) : null}

            {secaoSelecionada === 'unidades' ? <Text style={[styles.modalDescricao, { color: cores.textoSuave }]}>Unidades métricas: peso em kg, altura em cm e água em ml.</Text> : null}
            {secaoSelecionada === 'pais' ? <Text style={[styles.modalDescricao, { color: cores.textoSuave }]}>Base de alimentos atual: Brasil (TACO).</Text> : null}
            {secaoSelecionada === 'ajuda' ? <Text style={[styles.modalDescricao, { color: cores.textoSuave }]}>Acompanhe suas calorias, macronutrientes e hidratação pelo Diário. Você pode editar seus dados e objetivos nas opções Perfil e Meus objetivos.</Text> : null}
            {secaoSelecionada === 'sobre' ? <Text style={[styles.modalDescricao, { color: cores.textoSuave }]}>KaorCount · Seu companheiro de nutrição · versão 1.0</Text> : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menuHeader: {
    minHeight: 68,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuFechar: {
    width: 38,
    height: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitulo: { fontWeight: '700', letterSpacing: 0.1 },
  menuLista: {
    width: '100%',
    paddingTop: 8,
    paddingBottom: 28,
    alignSelf: 'center',
  },
  menuLinha: {
    minHeight: 76,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 34,
  },
  menuLinhaTexto: {
    flex: 1,
    fontWeight: '400',
    lineHeight: 23,
  },
  modalFundo: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.52)',
  },
  modalConfig: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 30,
  },
  modalHeaderConfig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTituloConfig: { fontSize: 20, fontWeight: '700', flex: 1 },
  modalSubtitulo: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  modalDescricao: { fontSize: 15, lineHeight: 22, marginBottom: 16 },
  modalLinhaSwitch: {
    minHeight: 58,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.25)',
  },
  acaoLogout: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(235,87,87,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(235,87,87,0.35)',
  },
  responsivoWrapper: {
    width: '100%',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40
  },
  headerConfig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10
  },
  btnVoltar: {
    backgroundColor: CORES.branco,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderColor: CORES.borda,
    borderWidth: 1
  },
  txtVoltar: {
    color: CORES.textoEscuro,
    fontWeight: 'bold',
    fontSize: 14
  },
  tituloTela: {
    fontSize: 20,
    fontWeight: 'bold',
    color: CORES.textoEscuro
  },
  cardConfig: {
    backgroundColor: CORES.branco,
    borderRadius: 24,
    padding: 16,
    marginBottom: 20
  },
  secaoTitulo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CORES.textoSuave,
    marginBottom: 12,
    letterSpacing: 1
  },
  linhaSwitch: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tituloItemSwitch: {
    fontSize: 14,
    fontWeight: '600',
    color: CORES.textoEscuro
  },
  subItemSwitch: {
    fontSize: 11,
    color: CORES.textoSuave,
    marginTop: 2
  },
  rowObjetivos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  cardObjetivo: {
    flex: 1,
    backgroundColor: CORES.branco,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  cardObjetivoAtivo: {
    backgroundColor: '#FDF3E7',
    borderColor: CORES.primaria,
    borderWidth: 1.5,
  },
  txtObjetivo: {
    fontSize: 12,
    fontWeight: '600',
    color: CORES.textoSuave,
    marginTop: 6,
  },
  txtObjetivoAtivo: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },
  containerAtividades: { marginBottom: 15 },
  boxAtividadeInativa: {
    backgroundColor: CORES.branco,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  boxAtividadeAtiva: {
    backgroundColor: '#FDF3E7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: CORES.primaria
  },
  txtAtividadeNome: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoEscuro
  },
  txtAtividadeSub: {
    fontSize: 11,
    color: CORES.textoSuave,
    marginTop: 2
  },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txtInfoLabel: {
    fontSize: 13,
    color: CORES.textoSuave,
  },
  txtInfoValor: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.textoEscuro,
  },
  botaoLogoutCard: {
    backgroundColor: '#FFF5F5',
    borderColor: '#EB5757',
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    flexDirection: 'row'
  },
  botaoLogoutTexto: {
    color: '#EB5757',
    fontWeight: 'bold',
    fontSize: 15
  }
});
