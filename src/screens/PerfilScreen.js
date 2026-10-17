import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CORES } from '../constants/Cores';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import { 
  BookOpenText, 
  Flame, 
  Target, 
  ChartNoAxesCombined,
  Check,
  User,
  Calendar,
  Ruler,
  Weight,
  Scale,
  Dumbbell,
  Footprints,
  Bike,
  Zap,
  Armchair,
  ChevronRight,
  AlertCircle,
  Settings,
  ChevronLeft,
} from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as metaNutriApi from '../api/metaNutriApi';
import * as dashboardApi from '../api/dashboardApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import * as usuarioApi from '../api/usuarioApi';
import { calcularIdade, calcularPlanoNutricional } from '../util/nutricao';
import { dataDeHoje } from '../util/data';
import { UNIDADES_PADRAO, alturaDeCm, alturaParaCm, formatarAltura, formatarPeso, formatarValorInput, pesoDeKg, pesoParaKg } from '../util/medidas';
import { carregarUnidades } from '../util/unidades';

export default function PerfilScreen({ navigation, route }) {
  const { usuario, atualizarUsuario } = useAuth();
  const { cores, isDark } = useTheme();
  const { width, height, isLandscape, isSmallScreen, isTablet, isDesktop, rf, moderateScale, getContainer, maxContentWidth } = useResponsive();

  // ↓ Estados para dados da API
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [perfilNutri, setPerfilNutri] = useState(null);
  const [ultimoProgresso, setUltimoProgresso] = useState(null);
  const [metaAtual, setMetaAtual] = useState(null);
  const [resumo, setResumo] = useState(null);
  const [unidades, setUnidades] = useState({ ...UNIDADES_PADRAO });
  const [unidadesCarregadas, setUnidadesCarregadas] = useState(false);
  const formularioInicializado = useRef(false);
  const modoEdicao = Boolean(route?.params?.abrirEdicao);

  // ↓ Estados do formulário de perfil
  const [salvando, setSalvando] = useState(false);
  const [erroFormulario, setErroFormulario] = useState('');
  const [nomeEdit, setNomeEdit] = useState('');
  const [pesoEdit, setPesoEdit] = useState('');
  const [alturaEdit, setAlturaEdit] = useState('');
  const [dataNascEdit, setDataNascEdit] = useState('');
  const [generoEdit, setGeneroEdit] = useState('masculino');
  const [nivelAtividadeEdit, setNivelAtividadeEdit] = useState('moderado');
  const [objetivoEdit, setObjetivoEdit] = useState('manter_peso');

  // ↓ Valores derivados com fallbacks
  const nomeCompleto = usuario?.nome || 'Usuário';
  const emailUsuario = usuario?.email || 'email@exemplo.com';
  const inicialNome = nomeCompleto.charAt(0).toUpperCase();

  const pesoKg = ultimoProgresso?.peso_atual || perfilNutri?.peso_kg || 0;
  const alturaCm = ultimoProgresso?.altura_atual || perfilNutri?.altura_cm || 0;
  const alturaM = alturaCm / 100;
  const imc = alturaM > 0 && pesoKg > 0 ? (pesoKg / (alturaM * alturaM)).toFixed(1) : 0;

  // ↓ Verifica se o perfil está com todas as informações preenchidas
  const perfilCompleto = Boolean(
    pesoKg > 0 && 
    alturaCm > 0 && 
    perfilNutri?.data_nascimento && 
    (perfilNutri?.objetivo_nutricional || perfilNutri?.objetivo)
  );

  // ↓ Classificação do IMC
  const classificarIMC = (valor) => {
    const v = parseFloat(valor);
    if (!v || v <= 0) return { texto: '', cor: CORES.primaria };
    if (v < 18.5) return { texto: 'Abaixo do peso', cor: '#E07A2F' };
    if (v < 25) return { texto: 'Peso normal', cor: CORES.sucesso };
    if (v < 30) return { texto: 'Sobrepeso', cor: '#E07A2F' };
    return { texto: 'Obesidade', cor: '#EB5757' };
  };

  const statusIMC = classificarIMC(imc);

  // ↓ Objetivo traduzido
  const objetivoMap = {
    perder_peso: 'Perder peso',
    manter_peso: 'Manter peso',
    ganhar_massa: 'Ganhar massa',
    ganhar_peso: 'Ganhar massa',
    pp: 'Perder peso',
    mp: 'Manter peso',
    gm: 'Ganhar massa',
  };
  const objetivoTexto = objetivoMap[perfilNutri?.objetivo_nutricional] || objetivoMap[perfilNutri?.objetivo] || '—';

  // ↓ Idade a partir da data de nascimento (mesma função do quiz e do backend)
  const idade = calcularIdade(perfilNutri?.data_nascimento);
  const idadeTexto = idade > 0 ? `${idade} anos` : '—';

  // ↓ Estatísticas
  const diasRegistrados = resumo?.dias_registrados || resumo?.streak_dias || 0;
  const mediaCalorica = resumo?.calorias_consumidas || 0;
  const metaCalorica = metaAtual?.calorias_diarias || metaAtual?.calorias_meta || 0;

  // ───────────────────────────────────────────────────────────
  // ↓ Carregar dados da API
  // ───────────────────────────────────────────────────────────
  const carregarDados = useCallback(async (isRefresh = false) => {
    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) {
      setCarregando(false);
      setAtualizando(false);
      return;
    }

    try {
      if (isRefresh) {
        setAtualizando(true);
      } else if (!perfilNutri) {
        setCarregando(true);
      }

      const [resPerfil, resProgresso, resMeta, resResumo] = await Promise.allSettled([
        perfilNutriApi.buscarPerfil(idUsuario),
        historicoProgressoApi.listarPorUsuario(idUsuario, 0, 1),
        metaNutriApi.metaAtual(idUsuario),
        dashboardApi.resumoDia(idUsuario),
      ]);

      if (resPerfil.status === 'fulfilled') {
        setPerfilNutri(resPerfil.value);
        setErroCarregamento('');
      } else if (resPerfil.reason?.response?.status === 404) {
        // Perfil inexistente é válido para quem ainda está completando o cadastro.
        setPerfilNutri(null);
        setErroCarregamento('');
      } else {
        setErroCarregamento('Não foi possível carregar seus dados do perfil. Tente novamente.');
        console.warn('[Perfil] Erro ao carregar dados do perfil:', resPerfil.reason?.message);
      }
      if (resProgresso.status === 'fulfilled' && resProgresso.value?.length > 0) {
        setUltimoProgresso(resProgresso.value[0]);
      }
      if (resMeta.status === 'fulfilled') setMetaAtual(resMeta.value);
      if (resResumo.status === 'fulfilled') setResumo(resResumo.value);
    } catch (error) {
      console.error('[Perfil] Erro ao carregar:', error);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario]);

  // ───────────────────────────────────────────────────────────
  // ↓ Animação de Entrada Lateral Fluida ao focar na aba (900ms Suave)
  // ───────────────────────────────────────────────────────────
  const animEntrada = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      carregarDados();
      carregarUnidades().then((preferencias) => {
        setUnidades(preferencias);
      }).catch((error) => {
        console.warn('[Perfil] Não foi possível carregar unidades:', error?.message);
      }).finally(() => setUnidadesCarregadas(true));
      if (!modoEdicao) {
        animEntrada.setValue(0);
        Animated.timing(animEntrada, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }
    }, [carregarDados, modoEdicao])
  );

  const offsetSlide = Math.round(moderateScale(35, 0.3));
  const fadeConteudo = animEntrada.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1] });
  const slideConteudo = animEntrada.interpolate({ inputRange: [0, 1], outputRange: [-offsetSlide, 0], extrapolate: 'clamp' });

  // ───────────────────────────────────────────────────────────
  // ↓ Formatação de máscara simples para data DD/MM/AAAA
  // ───────────────────────────────────────────────────────────
  const formatarDataInput = (texto) => {
    const limpo = texto.replace(/\D/g, '').slice(0, 8);
    if (limpo.length <= 2) return limpo;
    if (limpo.length <= 4) return `${limpo.slice(0, 2)}/${limpo.slice(2)}`;
    return `${limpo.slice(0, 2)}/${limpo.slice(2, 4)}/${limpo.slice(4, 8)}`;
  };

  // ───────────────────────────────────────────────────────────
  // Preencher o formulário da rota Perfil quando os dados estiverem carregados.
  // ───────────────────────────────────────────────────────────
  const preencherFormulario = useCallback(() => {
    setErroFormulario('');
    setNomeEdit(usuario?.nome || '');
    setPesoEdit(pesoKg > 0 ? formatarValorInput(pesoDeKg(pesoKg, unidades.peso)) : '');
    setAlturaEdit(alturaCm > 0 ? formatarValorInput(alturaDeCm(alturaCm, unidades.altura)) : '');

    if (perfilNutri?.data_nascimento) {
      const partes = String(perfilNutri.data_nascimento).split('-');
      if (partes.length === 3) {
        setDataNascEdit(`${partes[2]}/${partes[1]}/${partes[0]}`);
      } else {
        setDataNascEdit('');
      }
    } else {
      setDataNascEdit('');
    }

    setGeneroEdit(perfilNutri?.genero || 'masculino');
    setNivelAtividadeEdit(perfilNutri?.nivel_atividade || 'moderado');
    setObjetivoEdit(perfilNutri?.objetivo_nutricional || 'manter_peso');
  }, [usuario, pesoKg, alturaCm, perfilNutri, unidades]);

  useEffect(() => {
    if (modoEdicao && !carregando && unidadesCarregadas && !erroCarregamento && !formularioInicializado.current) {
      formularioInicializado.current = true;
      preencherFormulario();
    }
  }, [modoEdicao, carregando, unidadesCarregadas, erroCarregamento, preencherFormulario]);

  const voltarDoEditor = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('AppTabs', { screen: 'Perfil' });
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Salvar Perfil e Recalcular Metas
  // ───────────────────────────────────────────────────────────
  const handleSalvarPerfil = async () => {
    setErroFormulario('');

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) {
      setErroFormulario('Sessão não encontrada. Faça login novamente.');
      return;
    }

    const nomeFinal = nomeEdit.trim() || usuario?.nome || 'Usuário';

    const pesoInformado = parseFloat(String(pesoEdit).replace(',', '.'));
    const pesoNum = Number(pesoParaKg(pesoInformado, unidades.peso).toFixed(1));
    if (!pesoEdit || isNaN(pesoInformado) || !Number.isFinite(pesoNum) || pesoNum <= 0) {
      setErroFormulario(`Por favor, informe seu peso em ${unidades.peso}.`);
      return;
    }

    const alturaInformada = parseFloat(String(alturaEdit).replace(',', '.'));
    if (!alturaEdit || isNaN(alturaInformada) || alturaInformada <= 0) {
      setErroFormulario(`Por favor, informe sua altura em ${unidades.altura}.`);
      return;
    }

    let alturaFinalCm = alturaParaCm(alturaInformada, unidades.altura);
    // Em centímetros, também aceita metros (ex.: 1,75).
    if (unidades.altura === 'cm' && alturaInformada < 3) {
      alturaFinalCm = Math.round(alturaInformada * 100);
    } else {
      alturaFinalCm = Number(alturaFinalCm.toFixed(1));
    }

    if (!Number.isFinite(alturaFinalCm) || alturaFinalCm < 50 || alturaFinalCm > 250) {
      setErroFormulario('Informe uma altura válida entre 50 e 250 cm.');
      return;
    }

    // Tratar data de nascimento
    let dataNascimentoISO = '2000-01-01';
    let anoNasc = 2000, mesNasc = 1, diaNasc = 1;
    if (dataNascEdit && dataNascEdit.includes('/')) {
      const partes = dataNascEdit.split('/');
      if (partes.length === 3 && partes[2].length === 4) {
        diaNasc = parseInt(partes[0], 10) || 1;
        mesNasc = parseInt(partes[1], 10) || 1;
        anoNasc = parseInt(partes[2], 10) || 2000;
        dataNascimentoISO = `${anoNasc}-${String(mesNasc).padStart(2, '0')}-${String(diaNasc).padStart(2, '0')}`;
      }
    } else if (perfilNutri?.data_nascimento) {
      dataNascimentoISO = perfilNutri.data_nascimento;
      const partes = String(dataNascimentoISO).split('-');
      if (partes.length === 3) {
        anoNasc = parseInt(partes[0], 10) || 2000;
        mesNasc = parseInt(partes[1], 10) || 1;
        diaNasc = parseInt(partes[2], 10) || 1;
      }
    }

    setSalvando(true);
    let voltarAposSalvar = false;
    try {
      // 1. Atualizar nome do usuário se alterado
      if (nomeFinal !== usuario?.nome) {
        try {
          await usuarioApi.atualizar(idUsuario, { nome: nomeFinal });
          if (atualizarUsuario) await atualizarUsuario();
        } catch (uErr) {
          console.warn('[Perfil] Erro ao atualizar nome:', uErr?.message);
        }
      }

      // 2. Atualizar ou Criar Perfil Nutricional
      await perfilNutriApi.salvarOuAtualizar(idUsuario, {
        data_nascimento: dataNascimentoISO,
        genero: generoEdit || 'masculino',
        objetivo_nutricional: objetivoEdit || 'manter_peso',
        nivel_atividade: nivelAtividadeEdit || 'moderado',
      });

      // 3. Registrar novo Histórico de Progresso
      const dataHojeStr = dataDeHoje();
      try {
        await historicoProgressoApi.criar({
          id_usuario: idUsuario,
          data_registro: dataHojeStr,
          peso_atual: pesoNum,
          altura_atual: alturaFinalCm,
        });
      } catch (hErr) {
        console.warn('[Perfil] Erro ao criar progresso:', hErr?.message);
      }

      // 4. Calcular e Criar Nova Meta Nutricional
      //   Tudo sai de util/nutricao — a mesma fonte do quiz e o espelho do
      //   backend (nutricao_service.py). Antes esta tela refazia as fórmulas e
      //   chegava a números diferentes do resto do app.
      const plano = calcularPlanoNutricional({
        dataNascimento: dataNascimentoISO,
        // Mesmo valor persistido no perfil em (2): a meta tem que nascer do
        // gênero que ficou gravado, não do que estava no formulário.
        genero: generoEdit || 'masculino',
        pesoKg: pesoNum,
        alturaCm: alturaFinalCm,
        nivelAtividade: nivelAtividadeEdit,
        objetivo: objetivoEdit,
      });

      try {
        const dataHoje = dataDeHoje();
        const payloadMeta = {
          calorias_diarias: plano.calorias_diarias,
          proteina_g: plano.proteina_g,
          carboidrato_g: plano.carboidrato_g,
          gordura_g: plano.gordura_g,
          data_inicio: dataHoje,
        };
        // Atualiza a meta atual no lugar (evita linhas duplicadas no mesmo dia,
        // que faziam a meta em kcal não acompanhar o perfil na Home/Perfil).
        const metaExistente = await metaNutriApi.metaAtual(idUsuario);
        if (metaExistente?.id_meta) {
          await metaNutriApi.atualizar(metaExistente.id_meta, payloadMeta);
        } else {
          await metaNutriApi.criar({ id_usuario: idUsuario, ...payloadMeta });
        }
      } catch (errMeta) {
        console.warn('[Perfil] Erro ao atualizar meta:', errMeta?.message);
        setErroFormulario('Perfil salvo, mas não foi possível atualizar sua meta calórica. Tente novamente.');
        return;
      }

      await carregarDados(true);
      voltarAposSalvar = modoEdicao;
    } catch (error) {
      console.error('[Perfil] Erro ao salvar:', error);
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível salvar o perfil.';
      setErroFormulario(typeof msg === 'string' ? msg : 'Erro ao salvar alterações.');
    } finally {
      setSalvando(false);
      if (voltarAposSalvar) voltarDoEditor();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      {!modoEdicao ? <ScrollView
        style={{ backgroundColor: cores.fundo }}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={() => carregarDados(true)}
            colors={[cores.primaria]}
            tintColor={cores.primaria}
          />
        }
      >
        <View style={[styles.responsivoWrapper, getContainer(maxContentWidth)]}>
          {/* ↓ Cabeçalho do Perfil */}
          <Animated.View style={{ opacity: fadeConteudo, transform: [{ translateX: slideConteudo }] }}>
          <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginHorizontal: -20, marginTop: -20, marginBottom: 20, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, minHeight: 92, backgroundColor: cores.fundo }]}>
            <Text style={[styles.tituloSecaoTop, { color: cores.textoEscuro, fontFamily: 'PoppinsBlack', fontSize: rf(46, 36, 58), fontWeight: '900', letterSpacing: 1.5 }]}>Perfil</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Configuracao')}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Abrir configurações"
              style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}
            >
              <Settings size={26} color={cores.textoEscuro} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* ↓ Loading (apenas no carregamento inicial) */}
          {carregando && !perfilNutri ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <ActivityIndicator size="large" color={cores.primaria} />
            </View>
          ) : null}

          {/* ↓ Bloco do Usuário */}
          <View style={[styles.cardPerfilSuperior, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.avatarLetra, { width: moderateScale(64, 0.3), height: moderateScale(64, 0.3), borderRadius: moderateScale(16, 0.3) }]}>
                <Text style={[styles.textoLetra, { fontSize: rf(26, 20, 30) }]}>{inicialNome}</Text>
              </View>
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={[styles.nomePerfil, { color: cores.textoEscuro, fontSize: rf(20, 16, 24) }]}>{nomeCompleto}</Text>
                <Text style={[styles.emailPerfil, { color: cores.textoSuave, fontSize: rf(13, 11, 15) }]}>{emailUsuario}</Text>
                <Text style={[styles.subInfoPerfil, { color: cores.textoSuave, fontSize: rf(12, 10, 14) }]}>{idadeTexto}  •  {objetivoTexto}</Text>
              </View>
              
            </View>

            {/* Medidas informativas; edição disponível nas Configurações. */}
            <View style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}>
              <View style={[styles.blocoMedida, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <Text style={[styles.medidaValor, { color: cores.textoEscuro, fontSize: rf(18, 14, 22) }]}>{pesoKg > 0 ? formatarPeso(pesoKg, unidades.peso) : '—'}</Text>
                <Text style={[styles.medidaRotulo, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Peso</Text>
              </View>
              <View style={[styles.blocoMedida, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <Text style={[styles.medidaValor, { color: '#2D9CDB', fontSize: rf(18, 14, 22) }]}>{alturaCm > 0 ? formatarAltura(alturaCm, unidades.altura) : '—'}</Text>
                <Text style={[styles.medidaRotulo, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Altura</Text>
              </View>
              <View style={[styles.blocoMedida, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <Text style={[styles.medidaValor, { color: statusIMC.cor, fontSize: rf(18, 14, 22) }]}>{alturaM > 0 && pesoKg > 0 ? imc : '—'}</Text>
                <Text style={[styles.medidaRotulo, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>IMC</Text>
              </View>
            </View>

            {/* ↓ Se o perfil estiver incompleto, exibe o botão/link de ação */}
            {!perfilCompleto ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('ConfiguracaoPerfil', { secao: 'perfil', abrirEdicao: true })}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel="Completar perfil"
                style={[styles.btnCompletarPerfil, { backgroundColor: cores.mutado, borderColor: cores.borda }]}
              >
                <Text style={[styles.txtCompletarPerfil, { color: cores.primaria, fontSize: rf(13, 11, 15) }]}>Completar perfil</Text>
                <ChevronRight size={16} color={cores.primaria} />
              </TouchableOpacity>
            ) : null}

            {/* ↓ Se o perfil estiver completo, exibe a classificação do IMC */}
            {perfilCompleto && statusIMC.texto ? (
              <View style={styles.containerStatusImc}>
                <View style={[styles.dotStatus, { backgroundColor: statusIMC.cor }]} />
                <Text style={[styles.statusImc, { color: statusIMC.cor, fontSize: rf(12, 11, 14) }]}>
                  {statusIMC.texto}
                </Text>
              </View>
            ) : null}
          </View>

          {/* ↓ Seção Estatísticas */}
          <Text style={[styles.secaoTitulo, { color: cores.textoSuave, fontSize: rf(12, 10, 14) }]}>ESTATÍSTICAS</Text>
          <View style={[styles.cardEstatisticaContainer, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
            <View style={styles.rowGrid}>
              <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <BookOpenText color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.estatisticaIcone, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Dias registrados</Text>
                </View>
                <Text style={[styles.estatisticaNumero, { color: cores.sucesso, fontSize: rf(18, 15, 22) }]}>{diasRegistrados}</Text>
              </View>
              <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Flame color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.estatisticaIcone, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Média calórica</Text>
                </View>
                <Text style={[styles.estatisticaNumero, { color: cores.primaria, fontSize: rf(18, 15, 22) }]}>{Math.round(mediaCalorica)} kcal</Text>
              </View>
            </View>

            <View style={styles.rowGrid}>
              <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Target color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.estatisticaIcone, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Meta calórica</Text>
                </View>
                <Text style={[styles.estatisticaNumero, { color: '#2D9CDB', fontSize: rf(18, 15, 22) }]}>{metaCalorica > 0 ? `${metaCalorica} kcal` : '—'}</Text>
              </View>
              <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <ChartNoAxesCombined color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                  <Text style={[styles.estatisticaIcone, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>Objetivo</Text>
                </View>
                <Text style={[styles.estatisticaNumero, { color: cores.primaria, fontSize: rf(15, 12, 18) }]}>{objetivoTexto}</Text>
              </View>
            </View>
          </View>
          </Animated.View>
        </View>

      </ScrollView> : null}

      {modoEdicao ? (
        <View style={[styles.editorScreen, { backgroundColor: cores.fundo }]}>
          <View style={[styles.editorHeader, { borderBottomColor: cores.borda }]}>
            <TouchableOpacity
              onPress={voltarDoEditor}
              style={[styles.editorVoltar, { backgroundColor: cores.branco }]}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <ChevronLeft size={22} color={cores.textoEscuro} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text accessibilityRole="header" style={[styles.editorTitulo, { color: cores.textoEscuro }]}>Perfil</Text>
              <Text style={[styles.editorSubtitulo, { color: cores.textoSuave }]}>Dados pessoais, medidas e objetivos</Text>
            </View>
          </View>

          {carregando || !unidadesCarregadas || (atualizando && erroCarregamento) ? (
            <View style={styles.carregandoEditor}>
              <ActivityIndicator size="large" color={cores.primaria} />
              <Text style={{ color: cores.textoSuave, marginTop: 12 }}>Carregando seus dados…</Text>
            </View>
          ) : erroCarregamento ? (
            <View style={styles.erroCarregamentoEditor}>
              <AlertCircle size={24} color={cores.erro} />
              <Text style={[styles.erroCarregamentoTexto, { color: cores.textoEscuro }]}>{erroCarregamento}</Text>
              <TouchableOpacity
                onPress={() => carregarDados(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Tentar carregar o perfil novamente"
                style={[styles.tentarNovamente, { borderColor: cores.borda }]}
              >
                <Text style={[styles.tentarNovamenteTexto, { color: cores.primaria }]}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
            {erroFormulario ? (
              <View style={[styles.bannerErroFormulario, { backgroundColor: cores.mutado, borderColor: cores.erro }]}>
                <AlertCircle size={18} color={cores.erro} style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={[styles.textoErroFormulario, { color: cores.erro }]}>{erroFormulario}</Text>
              </View>
            ) : null}
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[styles.editorFormContainer, getContainer(620)]}
            >
              <View style={[styles.editorGrupo, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
                <Text style={[styles.editorGrupoTitulo, { color: cores.textoSuave }]}>DADOS PESSOAIS E MEDIDAS</Text>
              {/* Campo Nome Completo */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Nome Completo</Text>
              <View style={[styles.inputContainer, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
                <User size={18} color={cores.textoSuave} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.inputPerfil, { color: cores.textoEscuro }]}
                  accessibilityLabel="Nome completo"
                  placeholder="Seu nome completo"
                  placeholderTextColor={cores.textoSuave}
                  value={nomeEdit}
                  onChangeText={(t) => { setNomeEdit(t); setErroFormulario(''); }}
                />
              </View>

              {/* Linha Peso e Altura */}
              <View style={styles.rowForm}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Peso ({unidades.peso})</Text>
                  <View style={[styles.inputContainer, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
                    <Weight size={18} color={cores.textoSuave} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputPerfil, { color: cores.textoEscuro }]}
                      accessibilityLabel={`Peso em ${unidades.peso}`}
                      placeholder="Ex.: 75,5"
                      placeholderTextColor={cores.textoSuave}
                      keyboardType="decimal-pad"
                      value={pesoEdit}
                      onChangeText={(t) => { setPesoEdit(t); setErroFormulario(''); }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Altura ({unidades.altura})</Text>
                  <View style={[styles.inputContainer, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
                    <Ruler size={18} color={cores.textoSuave} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputPerfil, { color: cores.textoEscuro }]}
                      accessibilityLabel={`Altura em ${unidades.altura}`}
                      placeholder={unidades.altura === 'cm' ? 'Ex.: 175' : 'Ex.: 68'}
                      placeholderTextColor={cores.textoSuave}
                      keyboardType="decimal-pad"
                      value={alturaEdit}
                      onChangeText={(t) => { setAlturaEdit(t); setErroFormulario(''); }}
                    />
                  </View>
                </View>
              </View>

              {/* Data de Nascimento */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Data de Nascimento (DD/MM/AAAA)</Text>
              <View style={[styles.inputContainer, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
                <Calendar size={18} color={cores.textoSuave} style={{ marginRight: 8 }} />
                <TextInput
                  value={dataNascEdit}
                  accessibilityLabel="Data de nascimento"
                  onChangeText={(t) => { setDataNascEdit(formatarDataInput(t)); setErroFormulario(''); }}
                  placeholder="Ex: 15/08/1998"
                  placeholderTextColor={cores.textoSuave}
                  style={[styles.inputPerfil, { color: cores.textoEscuro }]}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              {/* Seleção de Gênero */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Gênero</Text>
              <View style={styles.selectorRow} accessibilityRole="radiogroup" accessibilityLabel="Gênero">
                {[
                  { id: 'masculino', label: 'Masculino' },
                  { id: 'feminino', label: 'Feminino' },
                ].map((item) => {
                  const selecionado = generoEdit === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityLabel={item.label}
                      accessibilityState={{ checked: selecionado }}
                      style={[
                        styles.chipOpcao, 
                        { backgroundColor: cores.fundoInput, borderColor: cores.borda },
                        selecionado && [styles.chipOpcaoAtiva, { backgroundColor: cores.mutado, borderColor: cores.primaria }]
                      ]}
                      onPress={() => setGeneroEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.chipTexto, 
                        { color: cores.textoSuave },
                        selecionado && [styles.chipTextoAtivo, { color: cores.primaria }]
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              </View>
              <View style={[styles.editorGrupo, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
                <Text style={[styles.editorGrupoTitulo, { color: cores.textoSuave }]}>OBJETIVOS E ATIVIDADE</Text>
              {/* Seleção de Objetivo */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Objetivo Nutricional</Text>
              <View style={styles.selectorCol} accessibilityRole="radiogroup" accessibilityLabel="Objetivo nutricional">
                {[
                  { id: 'perder_peso', label: 'Perder peso (Déficit calórico)', icone: Flame },
                  { id: 'manter_peso', label: 'Manter peso (Equilíbrio)', icone: Scale },
                  { id: 'ganhar_massa', label: 'Ganhar massa muscular (Superávit)', icone: Dumbbell },
                ].map((item) => {
                  const IconeComp = item.icone;
                  const selecionado = objetivoEdit === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityLabel={item.label}
                      accessibilityState={{ checked: selecionado }}
                      style={[
                        styles.opcaoCard, 
                        { backgroundColor: cores.fundoInput, borderColor: cores.borda },
                        selecionado && [styles.opcaoCardAtiva, { backgroundColor: cores.mutado, borderColor: cores.primaria }]
                      ]}
                      onPress={() => setObjetivoEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <IconeComp 
                          size={18} 
                          color={selecionado ? cores.primaria : cores.textoSuave}
                          style={{ marginRight: 10 }} 
                        />
                        <Text style={[
                          styles.opcaoTexto, 
                          { color: cores.textoEscuro },
                          selecionado && [styles.opcaoTextoAtiva, { color: cores.primaria }]
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                      {selecionado ? <Check size={18} color={cores.primaria} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Nível de Atividade */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Nível de Atividade</Text>
              <View style={styles.selectorCol} accessibilityRole="radiogroup" accessibilityLabel="Nível de atividade">
                {[
                  { id: 'sedentario', label: 'Sedentário (pouco ou nenhum exercício)', icone: Armchair },
                  { id: 'leve', label: 'Levemente ativo (1-3x por semana)', icone: Footprints },
                  { id: 'moderado', label: 'Moderadamente ativo (3-5x por semana)', icone: Bike },
                  { id: 'muito_ativo', label: 'Muito ativo (6-7x por semana)', icone: Zap },
                ].map((item) => {
                  const IconeComp = item.icone;
                  const selecionado = nivelAtividadeEdit === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      accessibilityRole="radio"
                      accessibilityLabel={item.label}
                      accessibilityState={{ checked: selecionado }}
                      style={[
                        styles.opcaoCard, 
                        { backgroundColor: cores.fundoInput, borderColor: cores.borda },
                        selecionado && [styles.opcaoCardAtiva, { backgroundColor: cores.mutado, borderColor: cores.primaria }]
                      ]}
                      onPress={() => setNivelAtividadeEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <IconeComp 
                          size={18} 
                          color={selecionado ? cores.primaria : cores.textoSuave}
                          style={{ marginRight: 10 }} 
                        />
                        <Text style={[
                          styles.opcaoTexto, 
                          { color: cores.textoEscuro },
                          selecionado && [styles.opcaoTextoAtiva, { color: cores.primaria }]
                        ]}>
                          {item.label}
                        </Text>
                      </View>
                      {selecionado ? <Check size={18} color={cores.primaria} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              </View>
            </ScrollView>
            <View style={[styles.editorFooter, { backgroundColor: cores.fundo, borderTopColor: cores.borda }]}>
              <TouchableOpacity
                style={[styles.btnSalvar, salvando && { opacity: 0.6 }]}
                onPress={handleSalvarPerfil}
                disabled={salvando}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Salvar alterações do perfil"
                accessibilityState={{ disabled: salvando, busy: salvando }}
              >
                {salvando ? <ActivityIndicator color={cores.branco} /> : <Text style={[styles.btnSalvarTexto, { color: cores.branco }]}>Salvar alterações</Text>}
              </TouchableOpacity>
            </View>
            </>
          )}
        </View>
      ) : null}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  responsivoWrapper: {
    width: '100%',
  },
  row: { flexDirection: 'row' },
  tituloSecaoTop: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  cardPerfilSuperior: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 20 
  },
  avatarLetra: { 
    width: 64, 
    height: 64, 
    borderRadius: 16, 
    backgroundColor: CORES.primaria, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  textoLetra: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: CORES.branco 
  },
  nomePerfil: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  emailPerfil: { 
    fontSize: 13, 
    color: CORES.textoSuave 
  },
  subInfoPerfil: { 
    fontSize: 12, 
    color: CORES.textoSuave, 
    marginTop: 2 
  },
  blocoMedida: { 
    flex: 1, 
    backgroundColor: '#FDF8F2', 
    padding: 12, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#F0E4D4'
  },
  medidaValor: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: CORES.primaria 
  },
  medidaRotulo: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginTop: 2 
  },
  txtCompletarPerfil: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.primaria,
  },
  btnCompletarPerfil: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12, alignSelf: 'center', borderWidth: 1 },
  containerStatusImc: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  dotStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusImc: { 
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 13, 
  },
  secaoTitulo: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: CORES.textoSuave, 
    marginBottom: 12, 
    letterSpacing: 1 
  },
  cardEstatisticaContainer: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 12, 
    marginBottom: 20 
  },
  rowGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginVertical: 4 
  },
  miniCardEstatistica: { 
    width: '48%', 
    backgroundColor: '#FDF8F2', 
    padding: 14, 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F0E4D4'
  },
  estatisticaIcone: { 
    fontSize: 12, 
    color: CORES.textoSuave, 
    fontWeight: '500' 
  },
  estatisticaNumero: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 6, 
    color: CORES.textoEscuro 
  },

  editorScreen: { flex: 1 },
  editorHeader: {
    minHeight: 86,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  editorVoltar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  editorTitulo: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  editorSubtitulo: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  carregandoEditor: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  erroCarregamentoEditor: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  erroCarregamentoTexto: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 12, maxWidth: 360 },
  tentarNovamente: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 18, borderRadius: 12, borderWidth: 1, marginTop: 16 },
  tentarNovamenteTexto: { fontSize: 14, fontWeight: '700' },
  editorFormContainer: { width: '100%', paddingHorizontal: 18, paddingTop: 20, paddingBottom: 24 },
  editorGrupo: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  editorGrupoTitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 0.9, marginBottom: 8 },
  editorFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  bannerErroFormulario: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 18,
    marginTop: 16,
  },
  textoErroFormulario: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  labelForm: {
    fontSize: 12,
    fontWeight: 'bold',
    color: CORES.textoSuave,
    marginBottom: 6,
    marginTop: 10,
  },
  rowForm: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    marginBottom: 4,
  },
  inputPerfil: {
    flex: 1,
    fontSize: 14,
    color: CORES.textoEscuro,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  chipOpcao: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: CORES.fundoInput,
    borderWidth: 1,
    borderColor: CORES.borda,
    alignItems: 'center',
  },
  chipOpcaoAtiva: {
    borderColor: CORES.primaria,
    borderWidth: 1.5,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.textoSuave,
  },
  chipTextoAtivo: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },
  selectorCol: {
    marginBottom: 8,
  },
  opcaoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: CORES.fundoInput,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: CORES.borda,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  opcaoCardAtiva: {
    borderColor: CORES.primaria,
    borderWidth: 1.5,
  },
  opcaoTexto: {
    fontSize: 13,
    color: CORES.textoEscuro,
    fontWeight: '500',
    flex: 1,
  },
  opcaoTextoAtiva: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },
  btnSalvar: {
    backgroundColor: CORES.primaria,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 0,
    marginBottom: 0,
  },
  btnSalvarTexto: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
