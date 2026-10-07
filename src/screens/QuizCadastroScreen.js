// ───────────────────────────────────────────────────────────────
// src/screens/QuizCadastroScreen.js
// Quiz de Cadastro (onboarding) do KaorCount.
//
// Exibido logo após o cadastro (AuthScreen → QuizCadastro).
// Coleta, em etapas, gênero, data de nascimento, altura/peso,
// nível de atividade e objetivo. Ao final, mostra uma prévia das
// metas calculadas (TMB Mifflin-St Jeor, espelhada do backend),
// salva nos endpoints existentes e termina na tela "plano pronto".
// Quando o backend dedicado do quiz for criado por outro agente, o
// ponto de integração é a função salvarTudo().
// ───────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, Calendar, Ruler, Scale, Armchair, Footprints, Zap, Bike,
  Dumbbell, TrendingDown, Minus, TrendingUp, ChevronLeft, Check,
  AlertCircle, Flame, Gauge, Clock, Target, Trophy, ArrowRight,
} from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import * as metaNutriApi from '../api/metaNutriApi';
import { calcularPlanoNutricional, parseNumeroBr } from '../util/nutricao';
import { dataDeHoje } from '../util/data';

// ↓ Etapas que contam nos marcadores de progresso (boas-vindas não conta).
//   1=gênero 2=nascimento 3=medidas 4=atividade 5=objetivo 6=ritmo 7=revisão.
const TOTAL_ETAPAS = 7;

// ↓ Ritmo em que a pessoa quer chegar à meta (só exibida p/ perder/ganhar massa).
const OPCOES_RITMO = [
  { id: 'sustentavel', label: 'Suave e sustentável', descricao: '~0,25 kg por semana · ajuste leve', Icone: Footprints },
  { id: 'moderado', label: 'Moderado', descricao: '~0,5 kg por semana · equilíbrio recomendado', Icone: Minus },
  { id: 'acelerado', label: 'Acelerado', descricao: '~0,75–1 kg por semana · exige mais disciplina', Icone: Zap },
];

const OPCOES_GENERO = [
  { id: 'masculino', label: 'Masculino' },
  { id: 'feminino', label: 'Feminino' },
  { id: 'outro', label: 'Prefiro não informar' },
];

const OPCOES_ATIVIDADE = [
  { id: 'sedentario', label: 'Sedentário', descricao: 'Pouco ou nenhum exercício, trabalho sentado', Icone: Armchair },
  { id: 'leve', label: 'Levemente ativo', descricao: 'Exercício leve 1–3x por semana', Icone: Footprints },
  { id: 'moderado', label: 'Moderadamente ativo', descricao: 'Exercício moderado 3–5x por semana', Icone: Zap },
  { id: 'ativo', label: 'Bastante ativo', descricao: 'Exercício intenso 6–7x por semana', Icone: Bike },
  { id: 'muito_ativo', label: 'Muito ativo', descricao: 'Treino pesado diário ou trabalho físico', Icone: Dumbbell },
];

const OPCOES_OBJETIVO = [
  { id: 'perder_peso', label: 'Perder peso', descricao: 'Déficit calórico para reduzir gordura', Icone: TrendingDown },
  { id: 'manter_peso', label: 'Manter peso', descricao: 'Equilíbrio calórico para o dia a dia', Icone: Minus },
  { id: 'ganhar_massa', label: 'Ganhar massa', descricao: 'Superávit calórico para hipertrofia', Icone: TrendingUp },
];

// ↓ O que o quiz vai perguntar, mostrado na tela de boas-vindas.
const ROTA_QUIZ = [
  { rotulo: 'Gênero', Icone: User },
  { rotulo: 'Nascimento', Icone: Calendar },
  { rotulo: 'Medidas', Icone: Ruler },
  { rotulo: 'Rotina', Icone: Footprints },
  { rotulo: 'Objetivo', Icone: Target },
  { rotulo: 'Ritmo', Icone: Gauge },
];

// ↓ Sombra discreta para cards de superfície.
const SombraCartao = Platform.select({
  web: { boxShadow: '0 6px 18px rgba(133, 70, 30, 0.10)' },
  default: {
    shadowColor: '#85461E', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.10, shadowRadius: 14, elevation: 3,
  },
});

const SombraBotao = Platform.select({
  web: { boxShadow: '0 10px 22px rgba(133, 70, 30, 0.28)' },
  default: {
    shadowColor: '#85461E', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28, shadowRadius: 18, elevation: 6,
  },
});

// ───────────────────────────────────────────────────────────────
// ↓ Peças visuais do wizard. Componentes de módulo (não criados
//   dentro da tela) para que o estado de animação não se perca a
//   cada render.
// ───────────────────────────────────────────────────────────────

// ↓ Número que sobe de 0 até o valor final.
function NumeroAnimado({ valor, estilo }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [exibido, setExibido] = useState(0);

  useEffect(() => {
    const listener = anim.addListener(({ value }) => setExibido(Math.round(value)));
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: valor, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
    return () => anim.removeListener(listener);
  }, [valor, anim]);

  return <Text style={estilo}>{exibido}</Text>;
}

// ↓ Cartão de opção com seleção animada (acento, borda e check).
function CartaoOpcao({ label, descricao, Icone, selecionado, aoSelecionar, cores, tom, rf }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: selecionado ? 1 : 0, useNativeDriver: true, friction: 6, tension: 140,
    }).start();
  }, [selecionado, pop]);

  return (
    <TouchableOpacity
      onPress={aoSelecionar}
      activeOpacity={0.9}
      accessibilityRole="radiobutton"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={descricao ? `${label}. ${descricao}` : label}
    >
      <Animated.View
        style={[
          styles.cartaoOpcao,
          SombraCartao,
          {
            backgroundColor: selecionado ? tom.cartaoSel : cores.branco,
            borderColor: selecionado ? cores.primaria : cores.borda,
          },
          { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.012] }) }] },
        ]}
      >
        <Animated.View
          style={[styles.cartaoAcento, { backgroundColor: cores.primaria, opacity: pop }]}
        />

        <View style={[styles.iconeOpcaoBox, { backgroundColor: selecionado ? tom.suave : cores.mutado }]}>
          <Icone size={rf(18, 16, 21)} color={selecionado ? cores.primaria : cores.textoSuave} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.cartaoOpcaoRotulo, { color: cores.textoEscuro, fontSize: rf(15, 13, 17) }]}>
            {label}
          </Text>
          {descricao ? (
            <Text style={[styles.cartaoOpcaoDesc, { color: cores.textoSuave, fontSize: rf(12, 11, 13) }]}>
              {descricao}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.radio,
            {
              borderColor: selecionado ? cores.primaria : cores.borda,
              backgroundColor: selecionado ? cores.primaria : 'transparent',
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: pop,
              transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
            }}
          >
            <Check size={13} color="#FFFFFF" strokeWidth={3.5} />
          </Animated.View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ↓ Pílula de opção (usada no gênero, onde a descrição não cabe).
function PilulaOpcao({ label, selecionado, aoSelecionar, cores, rf }) {
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, {
      toValue: selecionado ? 1 : 0, useNativeDriver: true, friction: 7, tension: 160,
    }).start();
  }, [selecionado, pop]);

  return (
    <TouchableOpacity
      onPress={aoSelecionar}
      activeOpacity={0.9}
      accessibilityRole="radiobutton"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={label}
    >
      <Animated.View
        style={[
          styles.pilula,
          {
            borderColor: selecionado ? cores.primaria : cores.borda,
            backgroundColor: selecionado ? cores.primaria : cores.branco,
          },
          { transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }] },
        ]}
      >
        <Text
          style={[
            styles.pilulaTexto,
            { color: selecionado ? '#FFFFFF' : cores.textoEscuro, fontSize: rf(13, 12, 15) },
          ]}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ↓ Campo numérico/data com anel de foco e sufixo de unidade.
function CampoMedida({ rotulo, unidade, placeholder, valor, aoMudar, Icone, cores, tom, rf, teclado, maxLength }) {
  const [focado, setFocado] = useState(false);

  return (
    <View>
      <View style={styles.linhaRotuloCampo}>
        <Text style={[styles.rotuloInput, { color: cores.textoEscuro, fontSize: rf(13, 12, 15) }]}>{rotulo}</Text>
        {unidade ? (
          <View style={[styles.chipUnidade, { backgroundColor: tom.suave }]}>
            <Text style={[styles.chipUnidadeTexto, { color: cores.primaria }]}>{unidade}</Text>
          </View>
        ) : null}
      </View>
      <View
        style={[
          styles.inputGrande,
          {
            backgroundColor: focado ? cores.branco : cores.fundoInput,
            borderColor: focado ? cores.primaria : cores.borda,
          },
        ]}
      >
        <Icone size={18} color={focado ? cores.primaria : cores.textoSuave} />
        <TextInput
          style={[styles.inputGrandeTexto, { color: cores.textoEscuro, fontSize: rf(18, 16, 22) }]}
          placeholder={placeholder}
          placeholderTextColor={cores.textoSuave}
          keyboardType={teclado}
          value={valor}
          onChangeText={aoMudar}
          maxLength={maxLength}
          onFocus={() => setFocado(true)}
          onBlur={() => setFocado(false)}
        />
      </View>
    </View>
  );
}

// ↓ Barra horizontal de participação de um macronutriente.
function BarraMacro({ rotulo, gramas, pct, cor, cores, textoSuave, rf }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: pct, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: false,
    }).start();
  }, [pct, anim]);

  return (
    <View style={styles.blocoBarraMacro}>
      <View style={styles.linhaBarraMacroTopo}>
        <View style={styles.linhaBarraMacroRotulo}>
          <View style={[styles.pontoMacro, { backgroundColor: cor }]} />
          <Text style={[styles.rotuloMacroBarra, { color: textoSuave }]}>{rotulo}</Text>
        </View>
        <Text style={[styles.valorMacroBarra, { color: cores.textoEscuro, fontSize: rf(13, 12, 15) }]}>
          {gramas}g · {pct}%
        </Text>
      </View>
      <View style={[styles.trilhoMacro, { backgroundColor: cor === cores.primaria ? cores.mutado : `${cor}22` }]}>
        <Animated.View
          style={{
            height: '100%',
            width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' }),
            backgroundColor: cor,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  );
}

export default function QuizCadastroScreen({ navigation }) {
  // ↓ Dados do usuário já autenticado no cadastro.
  const { usuario } = useAuth();
  const { cores, isDark } = useTheme();
  const { rf, getContainer, maxAuthWidth } = useResponsive();

  // ↓ Tons derivados do tema que não têm token próprio na paleta.
  const tom = isDark
    ? { suave: '#2A1D13', cartaoSel: '#241B14', trilho: '#3A3230', aviso: '#241C0E', avisoBorda: '#6B5A32', erro: 'rgba(231,76,60,0.14)' }
    : { suave: '#FDF3E7', cartaoSel: '#FFF9F3', trilho: 'rgba(133,70,30,0.22)', aviso: '#FFF8E7', avisoBorda: '#F0C36D', erro: '#FFF5F5' };

  // ↓ Etapa atual do wizard (0 = boas-vindas; 1..6 = perguntas; 7 = revisão).
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [erroEtapa, setErroEtapa] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // ↓ Tela de conclusão depois de salvar com sucesso.
  const [concluido, setConcluido] = useState(false);
  const [resumoFinal, setResumoFinal] = useState(null);

  // ↓ Respostas coletadas.
  const [genero, setGenero] = useState('');
  const [dataNascimento, setDataNascimento] = useState(''); // DD/MM/AAAA
  const [alturaStr, setAlturaStr] = useState('');
  const [pesoStr, setPesoStr] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [objetivo, setObjetivo] = useState('');
  // ↓ Ritmo em que a pessoa quer chegar à meta (só p/ perder/ganhar).
  const [ritmo, setRitmo] = useState('');

  // ↓ Animação de transição suave entre etapas.
  const animEtapa = useRef(new Animated.Value(1)).current;
  const animFim = useRef(new Animated.Value(0)).current;
  const refScroll = useRef(null);
  // ↓ Sentido do slide: avança para a esquerda, volta para a direita.
  const [direcao, setDirecao] = useState(1);

  const primeiroNome = usuario?.nome ? usuario.nome.split(' ')[0] : '';

  // ───────────────────────────────────────────────────────────
  // ↓ Helpers de máscara/parsing
  // ───────────────────────────────────────────────────────────

  // ↓ Aplica máscara DD/MM/AAAA enquanto o usuário digita.
  const mascararData = (texto) => {
    const digitos = texto.replace(/\D/g, '').slice(0, 8);
    if (digitos.length <= 2) return digitos;
    if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
    return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
  };

  // ↓ Valida a data DD/MM/AAAA (calendário real, ano ≥ 1900, não futura).
  const validarDataNascimento = (valor) => {
    const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor);
    if (!match) return null;
    const [, dia, mes, ano] = match;
    const dataObj = new Date(parseInt(ano, 10), parseInt(mes, 10) - 1, parseInt(dia, 10));
    const validaCalendario =
      dataObj.getFullYear() === parseInt(ano, 10) &&
      dataObj.getMonth() === parseInt(mes, 10) - 1 &&
      dataObj.getDate() === parseInt(dia, 10);
    if (!validaCalendario || parseInt(ano, 10) < 1900 || dataObj > new Date()) return null;
    return dataObj;
  };

  // ↓ Converte 'DD/MM/AAAA' → 'YYYY-MM-DD' (formato aceito pelo backend).
  const dataParaISO = (valor) => {
    const dataObj = validarDataNascimento(valor);
    if (!dataObj) return null;
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dataObj.getDate()).padStart(2, '0');
    return `${dataObj.getFullYear()}-${mes}-${dia}`;
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Validação da etapa corrente antes de avançar
  // ───────────────────────────────────────────────────────────
  const validarEtapa = () => {
    switch (etapaAtual) {
      case 1:
        return genero ? '' : 'Selecione uma opção para continuar.';
      case 2:
        if (!dataNascimento || dataNascimento.length < 10) return 'Informe a data no formato DD/MM/AAAA.';
        if (!validarDataNascimento(dataNascimento)) return 'Insira uma data de nascimento válida.';
        return '';
      case 3: {
        const altura = parseNumeroBr(alturaStr);
        if (isNaN(altura) || altura < 100 || altura > 260) return 'Informe uma altura válida em cm (ex: 175).';
        const peso = parseNumeroBr(pesoStr);
        if (isNaN(peso) || peso < 20 || peso > 350) return 'Informe um peso válido em kg (ex: 70.5).';
        return '';
      }
      case 4:
        return nivelAtividade ? '' : 'Selecione seu nível de atividade.';
      case 5:
        return objetivo ? '' : 'Selecione o seu objetivo.';
      case 6:
        // ↓ Ritmo só se aplica a perder/ganhar (etapa pulada p/ manter).
        if (objetivo === 'manter_peso') return '';
        return ritmo ? '' : 'Selecione o ritmo que combina com você.';
      default:
        return '';
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Navegação entre as etapas (com transição animada)
  // ───────────────────────────────────────────────────────────
  const transicionarEtapa = (novaEtapa, sentido = 1) => {
    setErroEtapa('');
    setErroGeral('');
    setDirecao(sentido);
    animEtapa.stopAnimation();
    // ↓ Esvazia a etapa atual primeiro; o conteúdo só troca quando ela some,
    //   senão o slide de saída animaria a etapa que acabou de chegar.
    Animated.timing(animEtapa, {
      toValue: 0, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(() => {
      setEtapaAtual(novaEtapa);
      // ↓ A etapa nova começa do topo, sem herdar o scroll da anterior.
      refScroll.current?.scrollTo({ x: 0, y: 0, animated: false });
      Animated.timing(animEtapa, {
        toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    });
  };

  const avancar = () => {
    const erro = validarEtapa();
    if (erro) {
      setErroEtapa(erro);
      animEtapa.stopAnimation();
      Animated.sequence([
        Animated.timing(animEtapa, { toValue: 0.55, duration: 70, useNativeDriver: true }),
        Animated.timing(animEtapa, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
      return;
    }
    if (etapaAtual < TOTAL_ETAPAS) {
      // ↓ Objetivo "manter peso" pula a etapa de ritmo.
      if (etapaAtual === 5 && objetivo === 'manter_peso') {
        transicionarEtapa(7, 1); // direto para a revisão
        return;
      }
      transicionarEtapa(etapaAtual + 1, 1);
    }
  };

  const voltar = () => {
    if (!enviando && etapaAtual > 0) {
      // ↓ Voltando da revisão, "manter peso" retorna p/ objetivo (pula ritmo).
      if (etapaAtual === TOTAL_ETAPAS && objetivo === 'manter_peso') {
        transicionarEtapa(5, -1);
        return;
      }
      transicionarEtapa(etapaAtual - 1, -1);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Salvamento no backend
  //   PONTO DE INTEGRAÇÃO: quando existir um endpoint dedicado
  //   do quiz (ex.: POST /quiz-cadastro/), concentre aqui a troca.
  //   Hoje usa os endpoints já existentes:
  //     • perfilNutriApi.salvarOuAtualizar → perfil nutricional
  //     • historicoProgressoApi.criar      → peso/altura iniciais
  //     • metaNutriApi.criar               → meta de kcal e macros
  // ───────────────────────────────────────────────────────────
  const salvarTudo = async ({ pulando = false } = {}) => {
    setErroGeral('');
    setEnviando(true);
    try {
      const idUser = usuario?.id_usuario || usuario?.id;
      const hoje = dataDeHoje();

      // ↓ Se pulou: mantém o comportamento anterior do cadastro (defaults).
      const nascISO = pulando ? '2000-01-01' : dataParaISO(dataNascimento);
      const generoSel = pulando ? 'masculino' : genero;
      const nivelSel = pulando ? 'moderado' : nivelAtividade;
      const objetivoSel = pulando ? 'manter_peso' : objetivo;
      const pesoKg = pulando ? 70 : parseNumeroBr(pesoStr);
      const alturaCm = pulando ? 175 : parseNumeroBr(alturaStr);
      const ritmoSel = pulando || objetivoSel === 'manter_peso' ? undefined : ritmo;

      // ↓ Calcula o plano (TMB, calorias e macros) espelhando o backend,
      //   já considerando o ritmo escolhido (quando aplicável).
      const plano = pulando
        ? { calorias_diarias: 2000, proteina_g: 150, carboidrato_g: 225, gordura_g: 55 }
        : calcularPlanoNutricional({
            dataNascimento: nascISO, genero: generoSel, pesoKg, alturaCm,
            nivelAtividade: nivelSel, objetivo: objetivoSel, ritmo: ritmoSel,
          });

      if (idUser) {
        await perfilNutriApi.salvarOuAtualizar(idUser, {
          data_nascimento: nascISO,
          genero: generoSel,
          objetivo_nutricional: objetivoSel,
          nivel_atividade: nivelSel,
          ...(plano.tmb ? { tmb_calculo: plano.tmb } : {}),
        });

        await historicoProgressoApi.criar({
          id_usuario: idUser,
          data_registro: hoje,
          peso_atual: pesoKg,
          altura_atual: alturaCm,
        });

        await metaNutriApi.criar({
          id_usuario: idUser,
          data_inicio: hoje,
          calorias_diarias: plano.calorias_diarias,
          proteina_g: plano.proteina_g,
          carboidrato_g: plano.carboidrato_g,
          gordura_g: plano.gordura_g,
        });
      }

      // ↓ Quem pulou entra direto no app; quem respondeu vê a conclusão.
      if (pulando) {
        navigation.replace('AppTabs');
        return;
      }

      setResumoFinal({
        plano,
        objetivoLabel: OPCOES_OBJETIVO.find((o) => o.id === objetivoSel)?.label || '',
        ritmoLabel: OPCOES_RITMO.find((r) => r.id === ritmoSel)?.label || '',
      });
      setConcluido(true);
    } catch (error) {
      console.error('[QuizCadastro] Erro ao salvar:', error);
      setErroGeral(error?.message || 'Não foi possível salvar suas respostas. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handlePular = () => salvarTudo({ pulando: true });
  const handleFinalizar = () => salvarTudo({ pulando: false });

  useEffect(() => {
    if (!concluido) return;
    animFim.setValue(0);
    Animated.timing(animFim, {
      toValue: 1, duration: 640, easing: Easing.out(Easing.cubic), useNativeDriver: true,
    }).start();
  }, [concluido, animFim]);

  // ───────────────────────────────────────────────────────────
  // ↓ Helpers de renderização
  // ───────────────────────────────────────────────────────────

  // ↓ Cabeçalho de cada etapa: ícone em círculo + título + pergunta.
  const renderCabecalhoEtapa = (IconeEtapa, titulo, pergunta) => (
    <View style={styles.headerEtapa}>
      <View style={[styles.iconeEtapaBox, { backgroundColor: tom.suave, borderColor: cores.borda }]}>
        <IconeEtapa size={rf(21, 19, 25)} color={cores.primaria} />
      </View>
      <Text style={[styles.tituloEtapa, { color: cores.textoEscuro, fontSize: rf(21, 19, 26) }]}>{titulo}</Text>
      <Text style={[styles.perguntaEtapa, { color: cores.textoSuave, fontSize: rf(14, 13, 16) }]}>{pergunta}</Text>
    </View>
  );

  // ↓ Etapa 0 — Boas-vindas da personalização.
  const renderBoasVindas = () => (
    <View>
      <View style={[styles.hero, SombraBotao, { backgroundColor: cores.marcaEscura }]}>
        {/* ↓ O logo é escuro, então vive numa placa clara para ler sobre o marrom. */}
        <View style={styles.heroLogoChip}>
          <Image
            source={require('../../assets/kaorcount1-removebg-preview.png')}
            style={styles.heroLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.heroTitulo}>
          {primeiroNome ? `${primeiroNome}, vamos montar o seu plano` : 'Vamos montar o seu plano'}
        </Text>
        <Text style={styles.heroSub}>
          São poucas perguntas e no final você já vê suas metas de calorias e macros calculadas para o seu corpo.
        </Text>
      </View>

      <View style={[styles.cardInfo, SombraCartao, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
        <View style={styles.cardInfoLinha}>
          <View style={[styles.cardInfoIcone, { backgroundColor: tom.suave }]}>
            <Flame size={15} color={cores.primaria} />
          </View>
          <Text style={[styles.cardInfoTxt, { color: cores.textoEscuro }]}>Metas calculadas pelo seu perfil</Text>
        </View>
        <View style={styles.cardInfoLinha}>
          <View style={[styles.cardInfoIcone, { backgroundColor: tom.suave }]}>
            <Clock size={15} color={cores.primaria} />
          </View>
          <Text style={[styles.cardInfoTxt, { color: cores.textoEscuro }]}>Leva menos de 1 minuto</Text>
        </View>
        <View style={[styles.cardInfoLinha, { marginBottom: 0 }]}>
          <View style={[styles.cardInfoIcone, { backgroundColor: tom.suave }]}>
            <Check size={15} color={cores.sucesso} />
          </View>
          <Text style={[styles.cardInfoTxt, { color: cores.textoEscuro }]}>Você pode mudar tudo depois em Perfil</Text>
        </View>
      </View>

      <Text style={[styles.rotuloRota, { color: cores.textoSuave }]}>O QUE VAMOS PERGUNTAR</Text>
      <View style={styles.linhaChips}>
        {ROTA_QUIZ.map(({ rotulo, Icone }) => (
          <View key={rotulo} style={[styles.chipRota, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            <Icone size={12} color={cores.primaria} />
            <Text style={[styles.chipRotaTexto, { color: cores.textoEscuro }]}>{rotulo}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  // ↓ Etapa 1 — Gênero.
  const renderGenero = () => (
    <View>
      {renderCabecalhoEtapa(User, 'Sobre você', 'Qual é o seu gênero?')}
      <View style={styles.blocoPilulas}>
        {OPCOES_GENERO.map((opt) => (
          <PilulaOpcao
            key={opt.id}
            label={opt.label}
            selecionado={genero === opt.id}
            aoSelecionar={() => { setGenero(opt.id); setErroEtapa(''); }}
            cores={cores}
            rf={rf}
          />
        ))}
      </View>
      <Text style={[styles.dicaEtapa, { color: cores.textoSuave, textAlign: 'left' }]}>
        Usamos isso apenas na fórmula que estima o seu gasto energético.
      </Text>
    </View>
  );

  // ↓ Etapa 2 — Data de nascimento com máscara DD/MM/AAAA.
  const renderNascimento = () => (
    <View>
      {renderCabecalhoEtapa(Calendar, 'Sobre você', 'Qual é a sua data de nascimento?')}
      <CampoMedida
        rotulo="Data de nascimento"
        placeholder="DD/MM/AAAA"
        valor={dataNascimento}
        aoMudar={(txt) => { setDataNascimento(mascararData(txt)); setErroEtapa(''); }}
        Icone={Calendar}
        cores={cores}
        tom={tom}
        rf={rf}
        teclado={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
        maxLength={10}
      />
      <Text style={[styles.dicaEtapa, { color: cores.textoSuave, textAlign: 'left' }]}>
        Usada para calcular seu gasto metabólico.
      </Text>
    </View>
  );

  // ↓ Etapa 3 — Altura e peso (guardados no histórico de progresso).
  const renderMedidas = () => (
    <View>
      {renderCabecalhoEtapa(Ruler, 'Suas medidas', 'Qual é a sua altura e o seu peso atual?')}
      <CampoMedida
        rotulo="Altura"
        unidade="cm"
        placeholder="Ex: 175"
        valor={alturaStr}
        aoMudar={(txt) => { setAlturaStr(txt); setErroEtapa(''); }}
        Icone={Ruler}
        cores={cores}
        tom={tom}
        rf={rf}
        teclado="decimal-pad"
        maxLength={5}
      />
      <CampoMedida
        rotulo="Peso atual"
        unidade="kg"
        placeholder="Ex: 70,5"
        valor={pesoStr}
        aoMudar={(txt) => { setPesoStr(txt); setErroEtapa(''); }}
        Icone={Scale}
        cores={cores}
        tom={tom}
        rf={rf}
        teclado="decimal-pad"
        maxLength={6}
      />
      <Text style={[styles.dicaEtapa, { color: cores.textoSuave, textAlign: 'left' }]}>
        Você poderá atualizar esses dados depois.
      </Text>
    </View>
  );

  // ↓ Etapa 4 — Nível de atividade física.
  const renderAtividade = () => (
    <View>
      {renderCabecalhoEtapa(Zap, 'Sua rotina', 'Com que frequência você se exercita?')}
      {OPCOES_ATIVIDADE.map((opt) => (
        <CartaoOpcao
          key={opt.id}
          label={opt.label}
          descricao={opt.descricao}
          Icone={opt.Icone}
          selecionado={nivelAtividade === opt.id}
          aoSelecionar={() => { setNivelAtividade(opt.id); setErroEtapa(''); }}
          cores={cores}
          tom={tom}
          rf={rf}
        />
      ))}
    </View>
  );

  // ↓ Etapa 5 — Objetivo principal.
  const renderObjetivo = () => (
    <View>
      {renderCabecalhoEtapa(TrendingUp, 'Seu objetivo', 'O que você quer alcançar com o KaorCount?')}
      {OPCOES_OBJETIVO.map((opt) => (
        <CartaoOpcao
          key={opt.id}
          label={opt.label}
          descricao={opt.descricao}
          Icone={opt.Icone}
          selecionado={objetivo === opt.id}
          aoSelecionar={() => { setObjetivo(opt.id); setErroEtapa(''); }}
          cores={cores}
          tom={tom}
          rf={rf}
        />
      ))}
    </View>
  );

  // ↓ Etapa 6 — Ritmo para alcançar a meta (só p/ perder/ganhar massa).
  const renderRitmo = () => (
    <View>
      {renderCabecalhoEtapa(Gauge, 'Em quanto tempo quer chegar lá?', 'Escolha um ritmo que você consiga manter no dia a dia.')}
      {OPCOES_RITMO.map((opt) => (
        <CartaoOpcao
          key={opt.id}
          label={opt.label}
          descricao={opt.descricao}
          Icone={opt.Icone}
          selecionado={ritmo === opt.id}
          aoSelecionar={() => { setRitmo(opt.id); setErroEtapa(''); }}
          cores={cores}
          tom={tom}
          rf={rf}
        />
      ))}
      {ritmo === 'acelerado' ? (
        <View style={[styles.avisoRitmo, { backgroundColor: tom.aviso, borderColor: tom.avisoBorda }]}>
          <AlertCircle size={15} color={cores.textoEscuro} style={{ flexShrink: 0 }} />
          <Text style={[styles.avisoRitmoTxt, { color: cores.textoEscuro }]}>
            Ritmo acelerado exige déficit/superávit maior — combine com sua rotina e, se possível, com um profissional.
          </Text>
        </View>
      ) : null}
    </View>
  );

  // ↓ Etapa 7 — Revisão com a prévia das metas calculadas.
  const renderRevisao = () => {
    const pesoKg = parseNumeroBr(pesoStr);
    const alturaCm = parseNumeroBr(alturaStr);
    const nascISO = dataParaISO(dataNascimento);
    // ↓ Mesmo critério do salvamento: com "manter peso" o ritmo não se aplica
    //   (a resposta pode ter ficado de uma escolha anterior de objetivo).
    const plano = nascISO
      ? calcularPlanoNutricional({
          dataNascimento: nascISO, genero, pesoKg, alturaCm, nivelAtividade, objetivo,
          ritmo: objetivo === 'manter_peso' ? undefined : ritmo,
        })
      : null;
    const calorias = plano?.calorias_diarias || 0;
    const imc = alturaCm > 0 ? (pesoKg / Math.pow(alturaCm / 100, 2)).toFixed(1).replace('.', ',') : '—';
    const objetivoLabel = OPCOES_OBJETIVO.find((o) => o.id === objetivo)?.label || '—';
    const ritmoLabel = objetivo === 'manter_peso' ? '' : OPCOES_RITMO.find((r) => r.id === ritmo)?.label || '';

    // ↓ Participação de cada macro em kcal (4 kcal/g para carbos e proteínas,
    //   9 kcal/g para gorduras), conferindo com o cálculo de util/nutricao.
    const macros = [
      { rotulo: 'Carboidratos', rotuloCurto: 'Carbos', gramas: plano?.carboidrato_g || 0, cor: cores.carboidrato, kcalPorGrama: 4 },
      { rotulo: 'Proteínas', rotuloCurto: 'Proteínas', gramas: plano?.proteina_g || 0, cor: cores.proteina, kcalPorGrama: 4 },
      { rotulo: 'Gorduras', rotuloCurto: 'Gorduras', gramas: plano?.gordura_g || 0, cor: cores.gordura, kcalPorGrama: 9 },
    ].map((m) => ({ ...m, pct: calorias > 0 ? Math.round((m.gramas * m.kcalPorGrama / calorias) * 100) : 0 }));

    const informações = [
      { rotulo: 'Objetivo', valor: objetivoLabel },
      ritmoLabel ? { rotulo: 'Ritmo', valor: ritmoLabel } : null,
      { rotulo: 'Peso / altura', valor: `${String(pesoStr).replace('.', ',')} kg · ${alturaStr} cm` },
      { rotulo: 'IMC estimado', valor: imc },
      plano?.tmb ? { rotulo: 'Metabolismo basal', valor: `${Math.round(plano.tmb)} kcal` } : null,
    ].filter(Boolean);

    return (
      <View>
        {renderCabecalhoEtapa(Check, 'Tudo certo!', 'Este é o plano personalizado calculado para você:')}

        <View style={[styles.heroPlano, SombraBotao, { backgroundColor: cores.marcaEscura }]}>
          <Text style={styles.heroPlanoRotulo}>SUA META DIÁRIA</Text>
          <View style={styles.heroPlanoLinha}>
            {plano ? (
              <NumeroAnimado valor={calorias} estilo={styles.heroPlanoValor} />
            ) : (
              <Text style={styles.heroPlanoValor}>—</Text>
            )}
            <Text style={styles.heroPlanoUnidade}>kcal</Text>
          </View>
          <View style={styles.heroPlanoPills}>
            {macros.map((m) => (
              <View key={m.rotulo} style={styles.heroPlanoPill}>
                <Text style={styles.heroPlanoPillValor}>{m.gramas}g</Text>
                <Text style={styles.heroPlanoPillRotulo} numberOfLines={1}>{m.rotuloCurto}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.cardSuperficie, SombraCartao, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
          <Text style={[styles.rotuloCard, { color: cores.textoEscuro }]}>Distribuição dos macros</Text>
          {macros.map((m) => (
            <BarraMacro
              key={m.rotulo}
              rotulo={m.rotulo}
              gramas={m.gramas}
              pct={m.pct}
              cor={m.cor}
              cores={cores}
              textoSuave={cores.textoSuave}
              rf={rf}
            />
          ))}
        </View>

        <View style={[styles.cardSuperficie, SombraCartao, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
          <Text style={[styles.rotuloCard, { color: cores.textoEscuro }]}>Resumo das respostas</Text>
          {informações.map((item, indice) => (
            <View
              key={item.rotulo}
              style={[
                styles.linhaInfo,
                indice > 0 && { borderTopWidth: 1, borderTopColor: cores.borda },
              ]}
            >
              <Text style={[styles.linhaInfoRotulo, { color: cores.textoSuave }]}>{item.rotulo}</Text>
              <Text style={[styles.linhaInfoValor, { color: cores.textoEscuro }]}>{item.valor}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.dicaEtapa, { color: cores.textoSuave, textAlign: 'left', marginTop: 12 }]}>
          Nada disso é travado: você ajusta peso, objetivo e metas quando quiser em Perfil.
        </Text>
      </View>
    );
  };

  // ↓ Tela de conclusão — aparece depois que as respostas são salvas.
  const renderConclusao = () => {
    const plano = resumoFinal?.plano;
    const proximosPassos = [
      { Icone: Flame, texto: 'Registre sua primeira refeição no Diário' },
      { Icone: Target, texto: `Fique de olho na meta de ${plano?.calorias_diarias || 0} kcal por dia` },
      { Icone: User, texto: 'Confira seu perfil e ajuste o que quiser' },
    ];

    return (
      <SafeAreaView style={[styles.containerTela, { backgroundColor: cores.fundo }]}>
        <View style={[styles.responsivoWrapper, styles.conclusaoWrapper, getContainer(maxAuthWidth)]}>
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={styles.conclusaoScroll}
            showsVerticalScrollIndicator={false}
          >
          <Animated.View
            style={{
              width: '100%',
              alignItems: 'center',
              opacity: animFim,
              transform: [{ translateY: animFim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }],
            }}
          >
            <View style={styles.seloConclusao}>
              <View style={[styles.seloConclusaoHalo, { backgroundColor: tom.suave, borderColor: cores.borda }]} />
              <View style={[styles.seloConclusaoNucleo, SombraBotao, { backgroundColor: cores.primaria }]}>
                <Trophy size={rf(30, 26, 36)} color="#FFFFFF" />
              </View>
            </View>

            <Text style={[styles.conclusaoTitulo, { color: cores.textoEscuro, fontSize: rf(25, 22, 30) }]}>
              {primeiroNome ? `Plano pronto, ${primeiroNome}!` : 'Plano pronto!'}
            </Text>
            <Text style={[styles.conclusaoSub, { color: cores.textoSuave, fontSize: rf(14, 13, 16) }]}>
              Suas metas já estão salvas na sua conta.
            </Text>

            <View style={[styles.heroPlano, SombraBotao, { backgroundColor: cores.marcaEscura, marginTop: 22, alignSelf: 'stretch' }]}>
              <Text style={styles.heroPlanoRotulo}>META DIÁRIA</Text>
              <View style={styles.heroPlanoLinha}>
                <NumeroAnimado valor={plano?.calorias_diarias || 0} estilo={styles.heroPlanoValor} />
                <Text style={styles.heroPlanoUnidade}>kcal</Text>
              </View>
              <View style={styles.heroPlanoPills}>
                {[
                  { rotulo: 'Carbos', gramas: plano?.carboidrato_g },
                  { rotulo: 'Proteínas', gramas: plano?.proteina_g },
                  { rotulo: 'Gorduras', gramas: plano?.gordura_g },
                ].map((m) => (
                  <View key={m.rotulo} style={styles.heroPlanoPill}>
                    <Text style={styles.heroPlanoPillValor}>{m.gramas || 0}g</Text>
                    <Text style={styles.heroPlanoPillRotulo} numberOfLines={1}>{m.rotulo}</Text>
                  </View>
                ))}
              </View>
              {resumoFinal?.objetivoLabel ? (
                <Text style={styles.conclusaoObjetivo}>
                  Objetivo: {resumoFinal.objetivoLabel}
                  {resumoFinal.ritmoLabel ? ` · ritmo ${resumoFinal.ritmoLabel.toLowerCase()}` : ''}
                </Text>
              ) : null}
            </View>

            <View style={[styles.cardSuperficie, SombraCartao, { backgroundColor: cores.branco, borderColor: cores.borda, marginTop: 16, alignSelf: 'stretch' }]}>
              {proximosPassos.map((passo) => (
                <View key={passo.texto} style={styles.linhaPasso}>
                  <View style={[styles.cardInfoIcone, { backgroundColor: tom.suave }]}>
                    <passo.Icone size={15} color={cores.primaria} />
                  </View>
                  <Text style={[styles.textoPasso, { color: cores.textoEscuro }]}>{passo.texto}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
          </ScrollView>

          <View style={styles.rodapeQuiz}>
            <TouchableOpacity
              style={[styles.btnPrincipal, SombraBotao, { backgroundColor: cores.primaria }]}
              onPress={() => navigation.replace('AppTabs')}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={[styles.txtBtnPrincipal, { fontSize: rf(15, 14, 17) }]}>Começar a usar o KaorCount</Text>
              <ArrowRight size={17} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // ↓ Despacha a etapa corrente para a função de renderização certa.
  const ETAPAS = [renderBoasVindas, renderGenero, renderNascimento, renderMedidas, renderAtividade, renderObjetivo, renderRitmo, renderRevisao];

  // ───────────────────────────────────────────────────────────
  // ↓ Layout principal do wizard
  // ───────────────────────────────────────────────────────────
  if (concluido) return renderConclusao();

  const ehUltimaEtapa = etapaAtual === TOTAL_ETAPAS;
  // ↓ "Manter peso" pula a etapa do ritmo: o marcador correspondente fica
  //   esmaecido em vez de encolher a fileira no meio do fluxo.
  const ritmoPulado = objetivo === 'manter_peso';
  const deslize = animEtapa.interpolate({
    inputRange: [0, 1],
    outputRange: [direcao >= 0 ? 26 : -26, 0],
  });

  return (
    <SafeAreaView style={[styles.containerTela, { backgroundColor: cores.fundo }]}>
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.responsivoWrapper, getContainer(maxAuthWidth)]}>
          {/* ↓ Header: voltar + marcadores de progresso + botão "Pular" */}
          <View style={styles.headerQuiz}>
            {etapaAtual > 0 && !enviando ? (
              <TouchableOpacity
                onPress={voltar}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Voltar etapa"
                style={[styles.btnVoltarCircular, { backgroundColor: cores.branco, borderColor: cores.borda }]}
              >
                <ChevronLeft size={18} color={cores.textoEscuro} />
              </TouchableOpacity>
            ) : (
              <View style={styles.btnVoltarPlaceholder} />
            )}

            <View style={styles.progressoContainer}>
              {etapaAtual > 0 && (
                <View style={styles.pips}>
                  {Array.from({ length: TOTAL_ETAPAS }, (_, i) => {
                    const n = i + 1;
                    const pulado = n === 6 && ritmoPulado;
                    return (
                      <View
                        key={n}
                        style={[
                          styles.pip,
                          {
                            backgroundColor: etapaAtual >= n && !pulado ? cores.primaria : tom.trilho,
                            opacity: pulado ? 0.45 : 1,
                          },
                        ]}
                      />
                    );
                  })}
                </View>
              )}
            </View>

            {/* ↓ Na revisão pular jogaria os valores padrão por cima do plano
                recém-calculado, então o link só aparece antes dela. */}
            {ehUltimaEtapa ? (
              <View style={styles.txtPularPlaceholder} />
            ) : (
              <TouchableOpacity onPress={handlePular} disabled={enviando} activeOpacity={0.7}>
                <Text style={[styles.txtPular, { color: cores.textoSuave }]}>Pular</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ↓ Legenda em linha própria: dentro do header ela empurrava a
              barra de progresso para cima do centro dos ícones. */}
          {etapaAtual > 0 && (
            <Text style={[styles.progressoTexto, { color: cores.textoSuave }]}>
              Etapa {etapaAtual} de {TOTAL_ETAPAS}
            </Text>
          )}

          {/* ↓ Conteúdo da etapa com transição animada */}
          <Animated.View
            style={{
              flex: 1,
              // ↓ Sem isso o web não encolhe o item abaixo do conteúdo
              //   (min-height: auto) e o rodapé sai da tela.
              minHeight: 0,
              opacity: animEtapa,
              transform: [{ translateX: deslize }],
            }}
          >
            <ScrollView
              ref={refScroll}
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={styles.scrollConteudo}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {ETAPAS[etapaAtual]?.()}
            </ScrollView>
          </Animated.View>

          {/* ↓ Erros de validação da etapa / erros de envio. Fica fora do
              ScrollView para continuar visível mesmo em etapas longas. */}
          {(erroEtapa || erroGeral) ? (
            <View style={[styles.bannerErro, { backgroundColor: tom.erro, borderColor: cores.erro }]}>
              <AlertCircle size={15} color={cores.erro} style={{ flexShrink: 0 }} />
              <Text style={[styles.textoErro, { color: cores.erro }]}>{erroEtapa || erroGeral}</Text>
            </View>
          ) : null}

          {/* ↓ Rodapé com o botão principal da etapa */}
          <View style={styles.rodapeQuiz}>
            <TouchableOpacity
              style={[styles.btnPrincipal, SombraBotao, { backgroundColor: cores.primaria, opacity: enviando ? 0.7 : 1 }]}
              onPress={ehUltimaEtapa ? handleFinalizar : avancar}
              disabled={enviando}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={[styles.txtBtnPrincipal, { fontSize: rf(15, 14, 17) }]}>
                    {etapaAtual === 0 ? 'Vamos começar' : ehUltimaEtapa ? 'Gerar meu plano' : 'Continuar'}
                  </Text>
                  <ArrowRight size={17} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerTela: { flex: 1 },
  responsivoWrapper: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 20,
  },
  conclusaoWrapper: { justifyContent: 'space-between', paddingVertical: 12 },
  conclusaoScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 16 },

  // Header do wizard
  headerQuiz: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  btnVoltarCircular: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  btnVoltarPlaceholder: { width: 36, height: 36 },
  progressoContainer: { flex: 1 },
  pips: { flexDirection: 'row', gap: 4 },
  pip: { flex: 1, height: 4, borderRadius: 2 },
  progressoTexto: { fontSize: 11, fontWeight: '600', marginTop: 7, textAlign: 'center' },
  txtPular: { fontSize: 13, fontWeight: '600' },
  txtPularPlaceholder: { width: 40 },

  scrollConteudo: { paddingBottom: 24, paddingTop: 10 },

  // Etapas
  headerEtapa: { alignItems: 'flex-start', marginBottom: 20, marginTop: 4 },
  iconeEtapaBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 1, borderColor: 'transparent',
  },
  tituloEtapa: { fontWeight: '800', textAlign: 'left', marginBottom: 4, letterSpacing: -0.3 },
  perguntaEtapa: { textAlign: 'left', lineHeight: 21 },
  dicaEtapa: { fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 17 },

  // Herói (boas-vindas e prévia do plano)
  hero: {
    borderRadius: 24,
    padding: 20,
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroLogoChip: {
    backgroundColor: '#FDFBF7', borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 6, marginBottom: 14,
  },
  heroLogo: { width: 116, height: 58 },
  heroTitulo: { color: '#FFFFFF', fontSize: 21, fontWeight: '800', lineHeight: 27 },
  heroSub: { color: 'rgba(255,255,255,0.82)', fontSize: 13, lineHeight: 19, marginTop: 6 },

  // Card de informação (boas-vindas)
  cardInfo: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 8,
    marginTop: 4,
  },
  cardInfoLinha: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 8 },
  cardInfoIcone: {
    width: 30, height: 30, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfoTxt: { fontSize: 13, fontWeight: '600', flex: 1 },

  rotuloRota: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.1,
    marginTop: 18, marginBottom: 8,
  },
  linhaChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipRota: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 7,
  },
  chipRotaTexto: { fontSize: 12, fontWeight: '600' },

  // Cartões de opção
  cartaoOpcao: {
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cartaoAcento: {
    position: 'absolute', left: 0, top: 12, bottom: 12,
    width: 3, borderRadius: 2,
  },
  iconeOpcaoBox: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12, marginLeft: 4,
  },
  cartaoOpcaoRotulo: { fontWeight: '700' },
  cartaoOpcaoDesc: { marginTop: 2, lineHeight: 17 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
    marginLeft: 10,
  },

  // Pílulas de opção
  blocoPilulas: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pilula: {
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  pilulaTexto: { fontWeight: '700' },

  // Inputs grandes (data, altura, peso)
  linhaRotuloCampo: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6, marginTop: 4,
  },
  rotuloInput: { fontWeight: '700' },
  chipUnidade: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 3 },
  chipUnidadeTexto: { fontSize: 11, fontWeight: '700' },
  inputGrande: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 56,
    marginBottom: 14,
    gap: 10,
  },
  inputGrandeTexto: { flex: 1, fontWeight: '700', paddingVertical: 6 },

  // Revisão (prévia das metas)
  heroPlano: {
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  heroPlanoRotulo: {
    color: 'rgba(255,255,255,0.72)', fontSize: 10.5, fontWeight: '700',
    letterSpacing: 1.2, textAlign: 'center',
  },
  heroPlanoLinha: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', marginTop: 4 },
  heroPlanoValor: { color: '#FFFFFF', fontSize: 44, fontWeight: '800', letterSpacing: -1 },
  heroPlanoUnidade: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '700', marginLeft: 6 },
  heroPlanoPills: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14 },
  heroPlanoPill: {
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 14,
    paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', flex: 1,
  },
  heroPlanoPillValor: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  heroPlanoPillRotulo: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '600', marginTop: 2 },

  cardSuperficie: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  rotuloCard: { fontSize: 13, fontWeight: '800', marginBottom: 12 },
  blocoBarraMacro: { marginBottom: 12 },
  linhaBarraMacroTopo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  linhaBarraMacroRotulo: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pontoMacro: { width: 8, height: 8, borderRadius: 4 },
  rotuloMacroBarra: { fontSize: 12, fontWeight: '600' },
  valorMacroBarra: { fontWeight: '700' },
  trilhoMacro: { height: 8, borderRadius: 4, overflow: 'hidden', width: '100%' },

  linhaInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  linhaInfoRotulo: { fontSize: 12, fontWeight: '600' },
  linhaInfoValor: { fontSize: 13, fontWeight: '800' },

  // Conclusão
  seloConclusao: { width: 108, height: 108, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  seloConclusaoHalo: {
    position: 'absolute', width: 108, height: 108, borderRadius: 54,
    borderWidth: 1, alignItems: 'center', justifyContent: 'center',
  },
  seloConclusaoNucleo: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  conclusaoTitulo: { fontWeight: '800', textAlign: 'center', marginTop: 18, letterSpacing: -0.4 },
  conclusaoSub: { textAlign: 'center', marginTop: 6, lineHeight: 20 },
  conclusaoObjetivo: {
    color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600',
    textAlign: 'center', marginTop: 12,
  },
  linhaPasso: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  textoPasso: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 18 },

  // Erros
  bannerErro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
  },
  textoErro: { fontSize: 12, fontWeight: '600', flex: 1 },

  // Aviso leve na etapa de ritmo acelerado
  avisoRitmo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 4,
  },
  avisoRitmoTxt: { fontSize: 12, lineHeight: 17, flex: 1 },

  // Rodapé do wizard
  rodapeQuiz: { paddingBottom: Platform.OS === 'ios' ? 0 : 8, paddingTop: 8, gap: 10 },
  btnPrincipal: {
    borderRadius: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  txtBtnPrincipal: { color: '#FFFFFF', fontWeight: '800' },
});
