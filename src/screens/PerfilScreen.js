import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  Platform,
  Alert,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CORES } from '../constants/Cores';
import useTheme from '../hooks/useTheme';
import { 
  PencilLine, 
  BookOpenText, 
  Flame, 
  Target, 
  ChartNoAxesCombined,
  X,
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
  AlertCircle
} from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as metaNutriApi from '../api/metaNutriApi';
import * as dashboardApi from '../api/dashboardApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import * as usuarioApi from '../api/usuarioApi';

export default function PerfilScreen({ navigation }) {
  const { usuario, atualizarUsuario } = useAuth();
  const { cores, isDark, toggleTema } = useTheme();

  // ↓ Estados para dados da API
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [perfilNutri, setPerfilNutri] = useState(null);
  const [ultimoProgresso, setUltimoProgresso] = useState(null);
  const [metaAtual, setMetaAtual] = useState(null);
  const [resumo, setResumo] = useState(null);

  // ↓ Estados do Modal de Edição de Perfil
  const [modalVisivel, setModalVisivel] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState('');
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

  // ↓ Calcular idade a partir da data de nascimento
  const calcularIdade = (dataNasc) => {
    if (!dataNasc) return '—';
    const nasc = new Date(dataNasc);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const mDiff = hoje.getMonth() - nasc.getMonth();
    if (mDiff < 0 || (mDiff === 0 && hoje.getDate() < nasc.getDate())) idade--;
    return `${idade > 0 ? idade : 0} anos`;
  };

  const idadeTexto = calcularIdade(perfilNutri?.data_nascimento);

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

      if (resPerfil.status === 'fulfilled') setPerfilNutri(resPerfil.value);
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
      animEntrada.setValue(0);
      Animated.timing(animEntrada, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [carregarDados])
  );

  const fadeConteudo = animEntrada.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1] });
  const slideConteudo = animEntrada.interpolate({ inputRange: [0, 1], outputRange: [-35, 0], extrapolate: 'clamp' });

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
  // ↓ Abrir Modal de Edição com dados preenchidos
  // ───────────────────────────────────────────────────────────
  const abrirModalEdicao = () => {
    setErroModal('');
    setNomeEdit(usuario?.nome || '');
    setPesoEdit(pesoKg > 0 ? String(pesoKg) : '');
    setAlturaEdit(alturaCm > 0 ? String(alturaCm) : '');

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

    setModalVisivel(true);
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Salvar Perfil e Recalcular Metas
  // ───────────────────────────────────────────────────────────
  const handleSalvarPerfil = async () => {
    setErroModal('');

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) {
      setErroModal('Sessão não encontrada. Faça login novamente.');
      return;
    }

    const nomeFinal = nomeEdit.trim() || usuario?.nome || 'Usuário';

    const pesoNum = parseFloat(String(pesoEdit).replace(',', '.'));
    if (!pesoEdit || isNaN(pesoNum) || pesoNum <= 0) {
      setErroModal('Por favor, informe seu peso em kg (ex: 75.5).');
      return;
    }

    const alturaNum = parseFloat(String(alturaEdit).replace(',', '.'));
    if (!alturaEdit || isNaN(alturaNum) || alturaNum <= 0) {
      setErroModal('Por favor, informe sua altura (ex: 175).');
      return;
    }

    // Se informou em metros (ex: 1.75), converte para cm (175)
    let alturaFinalCm = alturaNum;
    if (alturaNum < 3) {
      alturaFinalCm = Math.round(alturaNum * 100);
    }

    if (isNaN(alturaFinalCm) || alturaFinalCm < 50 || alturaFinalCm > 250) {
      setErroModal('Por favor, informe uma altura válida entre 50 e 250 cm.');
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
      const dataHojeStr = new Date().toISOString().split('T')[0];
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
      const hoje = new Date();
      let idade = hoje.getFullYear() - anoNasc;
      if (hoje.getMonth() < (mesNasc - 1) || (hoje.getMonth() === (mesNasc - 1) && hoje.getDate() < diaNasc)) {
        idade--;
      }
      idade = Math.max(idade, 12);

      const baseTmb = 10 * pesoNum + 6.25 * alturaFinalCm - 5 * idade;
      const ajusteGen = (generoEdit || '').toLowerCase() === 'masculino' ? 5 : -161;
      const tmb = Math.max(baseTmb + ajusteGen, 1000);

      const fatores = { sedentario: 1.2, leve: 1.375, moderado: 1.55, muito_ativo: 1.9, ativo: 1.725 };
      const ajustesObj = { perder_peso: 0.8, manter_peso: 1.0, ganhar_massa: 1.2, ganhar_peso: 1.15 };
      const fator = fatores[nivelAtividadeEdit] || 1.2;
      const ajusteObj = ajustesObj[objetivoEdit] || 1.0;
      const cals = Math.max(Math.round(tmb * fator * ajusteObj), 1200);

      const macrosMap = {
        perder_peso: { carb: 0.35, prot: 0.40, gord: 0.25 },
        ganhar_massa: { carb: 0.50, prot: 0.30, gord: 0.20 },
        manter_peso: { carb: 0.45, prot: 0.30, gord: 0.25 },
      };
      const dist = macrosMap[objetivoEdit] || macrosMap.manter_peso;

      try {
        const dataHoje = new Date().toISOString().split('T')[0];
        await metaNutriApi.criar({
          id_usuario: idUsuario,
          calorias_diarias: cals,
          proteina_g: Math.round((cals * dist.prot) / 4),
          carboidrato_g: Math.round((cals * dist.carb) / 4),
          gordura_g: Math.round((cals * dist.gord) / 9),
          data_inicio: dataHoje,
        });
      } catch (errMeta) {
        console.warn('[Perfil] Erro ao atualizar meta:', errMeta?.message);
      }

      setModalVisivel(false);
      await carregarDados(true);
    } catch (error) {
      console.error('[Perfil] Erro ao salvar:', error);
      const msg = error?.response?.data?.detail || error?.message || 'Não foi possível salvar o perfil.';
      setErroModal(typeof msg === 'string' ? msg : 'Erro ao salvar alterações.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView 
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
        
        {/* ↓ Cabeçalho do Perfil */}
        <Animated.View style={{ opacity: fadeConteudo, transform: [{ translateX: slideConteudo }] }}>
        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10 }]}>
          <Text style={[styles.tituloSecaoTop, { color: cores.textoEscuro }]}>Meu Perfil</Text>
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
            <View style={styles.avatarLetra}><Text style={styles.textoLetra}>{inicialNome}</Text></View>
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={[styles.nomePerfil, { color: cores.textoEscuro }]}>{nomeCompleto}</Text>
              <Text style={[styles.emailPerfil, { color: cores.textoSuave }]}>{emailUsuario}</Text>
              <Text style={[styles.subInfoPerfil, { color: cores.textoSuave }]}>{idadeTexto}  •  {objetivoTexto}</Text>
            </View>
            
            {/* Botão Editar funcional */}
            <TouchableOpacity 
              style={[styles.botaoEditar, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7', borderColor: cores.primaria }]}
              onPress={abrirModalEdicao}
              activeOpacity={0.7}
            >
              <PencilLine color={cores.primaria} size={14} style={{ marginRight: 5 }} />
              <Text style={[styles.textoEditar, { color: cores.primaria }]}>Editar</Text>
            </TouchableOpacity>
          </View>

          {/* ↓ Grid de Medidas (Clicáveis para editar) */}
          <TouchableOpacity 
            style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}
            onPress={abrirModalEdicao}
            activeOpacity={0.8}
          >
            <View style={[styles.blocoMedida, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <Text style={[styles.medidaValor, { color: cores.textoEscuro }]}>{pesoKg > 0 ? `${pesoKg}kg` : '—'}</Text>
              <Text style={[styles.medidaRotulo, { color: cores.textoSuave }]}>Peso</Text>
            </View>
            <View style={[styles.blocoMedida, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <Text style={[styles.medidaValor, { color: '#2D9CDB' }]}>{alturaCm > 0 ? `${alturaCm}cm` : '—'}</Text>
              <Text style={[styles.medidaRotulo, { color: cores.textoSuave }]}>Altura</Text>
            </View>
            <View style={[styles.blocoMedida, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <Text style={[styles.medidaValor, { color: statusIMC.cor }]}>{alturaM > 0 && pesoKg > 0 ? imc : '—'}</Text>
              <Text style={[styles.medidaRotulo, { color: cores.textoSuave }]}>IMC</Text>
            </View>
          </TouchableOpacity>

          {/* ↓ Se o perfil estiver incompleto, exibe o botão/link de ação */}
          {!perfilCompleto ? (
            <TouchableOpacity 
              onPress={abrirModalEdicao} 
              activeOpacity={0.7}
              style={[styles.btnCompletarPerfil, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7', borderColor: cores.primaria }]}
            >
              <Text style={[styles.txtCompletarPerfil, { color: cores.primaria }]}>Complete seu perfil</Text>
              <ChevronRight size={15} color={cores.primaria} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ) : null}

          {/* ↓ Se o perfil estiver completo, exibe a classificação do IMC */}
          {perfilCompleto && statusIMC.texto ? (
            <View style={styles.containerStatusImc}>
              <View style={[styles.dotStatus, { backgroundColor: statusIMC.cor }]} />
              <Text style={[styles.statusImc, { color: statusIMC.cor }]}>
                {statusIMC.texto}
              </Text>
            </View>
          ) : null}
        </View>

        {/* ↓ Seção Estatísticas */}
        <Text style={[styles.secaoTitulo, { color: cores.textoSuave }]}>ESTATÍSTICAS</Text>
        <View style={[styles.cardEstatisticaContainer, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
          <View style={styles.rowGrid}>
            <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <BookOpenText color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                <Text style={[styles.estatisticaIcone, { color: cores.textoSuave }]}>Dias registrados</Text>
              </View>
              <Text style={[styles.estatisticaNumero, { color: cores.sucesso }]}>{diasRegistrados}</Text>
            </View>
            <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Flame color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                <Text style={[styles.estatisticaIcone, { color: cores.textoSuave }]}>Média calórica</Text>
              </View>
              <Text style={[styles.estatisticaNumero, { color: cores.primaria }]}>{Math.round(mediaCalorica)} kcal</Text>
            </View>
          </View>

          <View style={styles.rowGrid}>
            <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Target color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                <Text style={[styles.estatisticaIcone, { color: cores.textoSuave }]}>Meta calórica</Text>
              </View>
              <Text style={[styles.estatisticaNumero, { color: '#2D9CDB' }]}>{metaCalorica > 0 ? `${metaCalorica} kcal` : '—'}</Text>
            </View>
            <View style={[styles.miniCardEstatistica, { backgroundColor: isDark ? '#252525' : '#FDF8F2', borderColor: cores.borda }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ChartNoAxesCombined color={cores.primaria} size={14} style={{ marginRight: 4 }} />
                <Text style={[styles.estatisticaIcone, { color: cores.textoSuave }]}>Objetivo</Text>
              </View>
              <Text style={[styles.estatisticaNumero, { color: cores.primaria }]}>{objetivoTexto}</Text>
            </View>
          </View>
        </View>
        </Animated.View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ↓ MODAL: EDITAR PERFIL                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal
        visible={modalVisivel}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={styles.fundoModal}>
          <View style={[styles.cardModal, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            
            {/* Header do Modal */}
            <View style={[styles.headerModal, { borderBottomColor: cores.borda }]}>
              <Text style={[styles.tituloModal, { color: cores.textoEscuro }]}>Editar Perfil</Text>
              <TouchableOpacity 
                onPress={() => setModalVisivel(false)} 
                style={[styles.btnFecharModal, { backgroundColor: isDark ? '#2E2E2E' : '#FDF8F2', borderColor: isDark ? '#3E3E3E' : '#E8DDD0', borderWidth: 1 }]}
                activeOpacity={0.7}
              >
                <X size={20} color={cores.textoEscuro} />
              </TouchableOpacity>
            </View>

            {/* Banner de Erro em Tempo Real */}
            {erroModal ? (
              <View style={styles.bannerErroModal}>
                <AlertCircle size={16} color="#EB5757" style={{ marginRight: 8, flexShrink: 0 }} />
                <Text style={styles.textoErroModal}>{erroModal}</Text>
              </View>
            ) : null}

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingBottom: 25 }}
            >
              {/* Campo Nome Completo */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Nome Completo</Text>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                <User size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 8 }} />
                <TextInput
                  style={[styles.inputModal, { color: cores.textoEscuro }]}
                  placeholder="Seu nome completo"
                  placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                  value={nomeEdit}
                  onChangeText={(t) => { setNomeEdit(t); setErroModal(''); }}
                />
              </View>

              {/* Linha Peso e Altura */}
              <View style={styles.rowForm}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Peso (kg)</Text>
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Weight size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputModal, { color: cores.textoEscuro }]}
                      placeholder="Ex: 75.5"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      keyboardType="numeric"
                      value={pesoEdit}
                      onChangeText={(t) => { setPesoEdit(t); setErroModal(''); }}
                    />
                  </View>
                </View>

                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Altura (cm)</Text>
                  <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                    <Ruler size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 8 }} />
                    <TextInput
                      style={[styles.inputModal, { color: cores.textoEscuro }]}
                      placeholder="Ex: 175"
                      placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                      keyboardType="numeric"
                      value={alturaEdit}
                      onChangeText={(t) => { setAlturaEdit(t); setErroModal(''); }}
                    />
                  </View>
                </View>
              </View>

              {/* Data de Nascimento */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Data de Nascimento (DD/MM/AAAA)</Text>
              <View style={[styles.inputContainer, { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda }]}>
                <Calendar size={18} color={isDark ? '#8A7E74' : '#9C8E81'} style={{ marginRight: 8 }} />
                <TextInput
                  value={dataNascEdit}
                  onChangeText={(t) => { setDataNascEdit(formatarDataInput(t)); setErroModal(''); }}
                  placeholder="Ex: 15/08/1998"
                  placeholderTextColor={isDark ? '#8A7E74' : '#9C8E81'}
                  style={[styles.inputModal, { color: cores.textoEscuro }]}
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>

              {/* Seleção de Gênero */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Gênero</Text>
              <View style={styles.selectorRow}>
                {[
                  { id: 'masculino', label: 'Masculino' },
                  { id: 'feminino', label: 'Feminino' },
                ].map((item) => {
                  const selecionado = generoEdit === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.chipOpcao, 
                        { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda },
                        selecionado && [styles.chipOpcaoAtiva, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7', borderColor: cores.primaria }]
                      ]}
                      onPress={() => setGeneroEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.chipTexto, 
                        { color: isDark ? '#B8A89A' : cores.textoSuave },
                        selecionado && [styles.chipTextoAtivo, { color: cores.primaria }]
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Seleção de Objetivo */}
              <Text style={[styles.labelForm, { color: cores.textoSuave }]}>Objetivo Nutricional</Text>
              <View style={styles.selectorCol}>
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
                      style={[
                        styles.opcaoCard, 
                        { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda },
                        selecionado && [styles.opcaoCardAtiva, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7', borderColor: cores.primaria }]
                      ]}
                      onPress={() => setObjetivoEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <IconeComp 
                          size={18} 
                          color={selecionado ? cores.primaria : (isDark ? '#8A7E74' : '#9C8E81')} 
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
              <View style={styles.selectorCol}>
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
                      style={[
                        styles.opcaoCard, 
                        { backgroundColor: isDark ? '#262626' : cores.fundoInput, borderColor: isDark ? '#3A3A3A' : cores.borda },
                        selecionado && [styles.opcaoCardAtiva, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7', borderColor: cores.primaria }]
                      ]}
                      onPress={() => setNivelAtividadeEdit(item.id)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <IconeComp 
                          size={18} 
                          color={selecionado ? cores.primaria : (isDark ? '#8A7E74' : '#9C8E81')} 
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

              {/* Botão de Salvar Alterações */}
              <TouchableOpacity
                style={[styles.btnSalvar, salvando && { opacity: 0.6 }]}
                onPress={handleSalvarPerfil}
                disabled={salvando}
                activeOpacity={0.8}
              >
                {salvando ? (
                  <ActivityIndicator color={CORES.branco} />
                ) : (
                  <Text style={styles.btnSalvarTexto}>Salvar Alterações</Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  botaoEditar: { 
    backgroundColor: '#FDF8F2', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EADCC9'
  },
  textoEditar: { 
    fontSize: 12, 
    color: CORES.primaria, 
    fontWeight: 'bold' 
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
  btnCompletarPerfil: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    backgroundColor: '#FDF3E7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#F0D6BE',
  },
  txtCompletarPerfil: {
    fontSize: 13,
    fontWeight: 'bold',
    color: CORES.primaria,
  },
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

  // ───────────────────────────────────────────────────────────
  // Estilos do Modal de Edição
  // ───────────────────────────────────────────────────────────
  fundoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  cardModal: {
    backgroundColor: CORES.branco,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
    maxHeight: '90%',
  },
  headerModal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E4D4',
  },
  tituloModal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
  },
  btnFecharModal: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: '#FDF8F2',
  },
  bannerErroModal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  textoErroModal: {
    fontSize: 13,
    color: '#E53E3E',
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
  inputModal: {
    flex: 1,
    fontSize: 14,
    color: CORES.textoEscuro,
  },
  selectorRow: {
    flexDirection: 'row',
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
    marginRight: 8,
  },
  chipOpcaoAtiva: {
    backgroundColor: '#FDF3E7',
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
    backgroundColor: '#FDF3E7',
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
    marginTop: 18,
    marginBottom: 10,
  },
  btnSalvarTexto: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
});