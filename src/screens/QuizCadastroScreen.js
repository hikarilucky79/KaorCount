// ───────────────────────────────────────────────────────────────
// src/screens/QuizCadastroScreen.js
// Quiz de Cadastro (onboarding) do KaorCount.
//
// Exibido logo após o cadastro (AuthScreen → QuizCadastro).
// Coleta, em etapas, gênero, data de nascimento, altura/peso,
// nível de atividade e objetivo. Ao final, salva as respostas e mostra
// o resultado personalizado do plano nutricional.
// Quando o backend dedicado do quiz for criado por outro agente, o
// ponto de integração é a função salvarTudo().
// ───────────────────────────────────────────────────────────────
import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, ScrollView, PanResponder,
  ActivityIndicator, Animated, Easing, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  User, Calendar, Ruler, Scale, Armchair, Footprints, Zap, Bike,
  Dumbbell, TrendingDown, Minus, TrendingUp, ChevronLeft, Check,
  AlertCircle, Flame, Gauge, Target, Utensils, Salad, Search,
} from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import * as metaNutriApi from '../api/metaNutriApi';
import * as pesquisaInicialApi from '../api/pesquisaInicialApi';
import { calcularPlanoNutricional, parseNumeroBr } from '../util/nutricao';
import { dataDeHoje } from '../util/data';

// ↓ Etapas que contam nos marcadores de progresso (boas-vindas não conta).
//   1=gênero 2=nascimento 3=altura 4=peso 5=atividade 6=objetivo 7=ritmo,
//   8=origem 9=experiência com calorias 10=meta de peso.
const TOTAL_ETAPAS = 10;

const OPCOES_ORIGEM_APP = ['Instagram', 'TikTok', 'Indicação', 'Busca na internet', 'Outro'];

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

function caminhoArcoRosquinha(inicio, fim, raioExterno, raioInterno, centro = 150) {
  const ponto = (raio, angulo) => {
    const radianos = (angulo * Math.PI) / 180;
    return { x: centro + raio * Math.cos(radianos), y: centro + raio * Math.sin(radianos) };
  };
  const externoInicio = ponto(raioExterno, inicio);
  const externoFim = ponto(raioExterno, fim);
  const internoFim = ponto(raioInterno, fim);
  const internoInicio = ponto(raioInterno, inicio);
  const arcoMaior = fim - inicio > 180 ? 1 : 0;
  return [
    `M ${externoInicio.x} ${externoInicio.y}`,
    `A ${raioExterno} ${raioExterno} 0 ${arcoMaior} 1 ${externoFim.x} ${externoFim.y}`,
    `L ${internoFim.x} ${internoFim.y}`,
    `A ${raioInterno} ${raioInterno} 0 ${arcoMaior} 0 ${internoInicio.x} ${internoInicio.y}`,
    'Z',
  ].join(' ');
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
      style={styles.opcaoToque}
      onPress={aoSelecionar}
      activeOpacity={0.9}
      accessibilityRole="radio"
      accessibilityState={{ selected: selecionado }}
      accessibilityLabel={descricao ? `${label}. ${descricao}` : label}
    >
      <Animated.View
        style={[
          styles.cartaoOpcao,
          SombraCartao,
          {
            backgroundColor: selecionado ? cores.primaria : cores.branco,
            borderColor: selecionado ? cores.primaria : cores.borda,
          },
        ]}
      >
        <View style={[styles.iconeOpcaoBox, { backgroundColor: selecionado ? 'rgba(255,255,255,0.18)' : cores.mutado }]}>
          <Icone size={rf(18, 16, 21)} color={selecionado ? '#FFFFFF' : cores.textoSuave} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.cartaoOpcaoRotulo, { color: selecionado ? '#FFFFFF' : cores.textoEscuro, fontSize: rf(15, 13, 17) }]}>
            {label}
          </Text>
          {descricao ? (
            <Text style={[styles.cartaoOpcaoDesc, { color: selecionado ? 'rgba(255,255,255,0.88)' : cores.textoSuave, fontSize: rf(12, 11, 13) }]}>
              {descricao}
            </Text>
          ) : null}
        </View>

        <View style={styles.indicadorOpcao}>
          {selecionado ? (
            <Animated.View
              style={{
                opacity: pop,
                transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }],
              }}
            >
              <Check size={22} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          ) : null}
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ↓ Pílula de opção (usada no gênero, onde a descrição não cabe).
function PilulaOpcao({ label, selecionado, aoSelecionar, cores, rf }) {
  return (
    <TouchableOpacity
      style={styles.opcaoToque}
      onPress={aoSelecionar}
      activeOpacity={0.9}
      accessibilityRole="radio"
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
// Seletor vertical no estilo de roda, usado nas medidas do corpo.
function SeletorRoda({ valor, aoMudar, minimo, maximo, passo, unidade = '', cores, estilo, formatarValor }) {
  const ITEM_ALTURA = 48;
  const QUANTIDADE_LINHAS = 5;
  const ALTURA_LISTA = ITEM_ALTURA * QUANTIDADE_LINHAS;
  const casas = passo < 1 ? 1 : 0;
  const deslocamentoVertical = useRef(new Animated.Value(0)).current;
  const indiceInicial = useRef(Math.round((valor - minimo) / passo));
  const valorAtual = useRef(valor);
  const parametrosAtuais = useRef({ minimo, maximo, passo, casas, aoMudar });
  valorAtual.current = valor;
  parametrosAtuais.current = { minimo, maximo, passo, casas, aoMudar };
  const responder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponderCapture: (_, gesto) => Math.abs(gesto.dy) > 4 && Math.abs(gesto.dy) > Math.abs(gesto.dx),
    onPanResponderGrant: () => {
      deslocamentoVertical.stopAnimation();
      deslocamentoVertical.setValue(0);
      indiceInicial.current = Math.round((valorAtual.current - parametrosAtuais.current.minimo) / parametrosAtuais.current.passo);
    },
    onPanResponderMove: (_, gesto) => {
      const parametros = parametrosAtuais.current;
      const indiceMaximo = Math.round((parametros.maximo - parametros.minimo) / parametros.passo);
      const deslocamentoMinimo = -(indiceMaximo - indiceInicial.current) * ITEM_ALTURA;
      const deslocamentoMaximo = indiceInicial.current * ITEM_ALTURA;
      deslocamentoVertical.setValue(Math.max(deslocamentoMinimo, Math.min(deslocamentoMaximo, gesto.dy)));
    },
    onPanResponderRelease: (_, gesto) => {
      const parametros = parametrosAtuais.current;
      const indiceMaximo = Math.round((parametros.maximo - parametros.minimo) / parametros.passo);
      // Projeta um pouco a velocidade do gesto para a roda continuar deslizando após um toque rápido.
      const deslocamentoProjetado = gesto.dy + gesto.vy * 220;
      const passos = Math.round(-deslocamentoProjetado / ITEM_ALTURA);
      const indiceSelecionado = Math.max(0, Math.min(indiceMaximo, indiceInicial.current + passos));
      const novoValor = Number((parametros.minimo + indiceSelecionado * parametros.passo).toFixed(parametros.casas));
      Animated.timing(deslocamentoVertical, {
        toValue: -(indiceSelecionado - indiceInicial.current) * ITEM_ALTURA,
        duration: Math.min(420, 150 + Math.abs(indiceSelecionado - indiceInicial.current) * 35),
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        parametros.aoMudar(novoValor);
        deslocamentoVertical.setValue(0);
      });
    },
    onPanResponderTerminate: () => {
      Animated.spring(deslocamentoVertical, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
    },
  })).current;

  const linhas = Array.from({ length: QUANTIDADE_LINHAS }, (_, i) => {
    const deslocamento = i - Math.floor(QUANTIDADE_LINHAS / 2);
    const item = Number((valor + deslocamento * passo).toFixed(casas));
    const selecionada = deslocamento === 0;
    const distancia = Math.abs(deslocamento);
    const dentroDosLimites = item >= minimo && item <= maximo;
    const texto = formatarValor
      ? formatarValor(item)
      : passo < 1 ? item.toFixed(1).replace('.', ',') : String(item);
    return (
      <View key={deslocamento} style={[
        styles.itemRoda,
        {
          height: ITEM_ALTURA,
          opacity: dentroDosLimites ? 1 : 0,
          transform: [
            { perspective: 350 },
            { rotateX: `${-deslocamento * 22}deg` },
            { scale: Math.max(0.78, 1 - distancia * 0.1) },
          ],
        },
        selecionada && { backgroundColor: cores.mutado, borderColor: cores.borda, borderWidth: 1 },
      ]}>
        <Text style={[
          styles.textoRoda,
          {
            color: selecionada ? cores.textoEscuro : cores.textoSuave,
            opacity: selecionada ? 1 : Math.max(0.06, 0.74 - distancia * 0.28),
            fontWeight: selecionada ? '800' : '500',
            fontSize: selecionada ? 27 : Math.max(17, 24 - distancia * 3),
          },
        ]}>
          {texto}
        </Text>
        {selecionada && unidade ? (
          <View style={styles.unidadeRoda}>
            <Text style={{ color: cores.textoSuave, fontSize: 15, fontWeight: '600' }}>{unidade}</Text>
          </View>
        ) : null}
      </View>
    );
  });

  return (
    <View style={[styles.rodaContainer, { height: ALTURA_LISTA }, estilo]} {...responder.panHandlers}>
      <Animated.View style={{ transform: [{ translateY: deslocamentoVertical }] }}>
        {linhas}
      </Animated.View>
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

  // O quiz começa diretamente na primeira pergunta.
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [erroEtapa, setErroEtapa] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

  // ↓ Tela de conclusão depois de salvar com sucesso.
  const [concluido, setConcluido] = useState(false);
  const [resumoFinal, setResumoFinal] = useState(null);

  // ↓ Respostas coletadas.
  const [genero, setGenero] = useState('');
  const [dataNascimento, setDataNascimento] = useState('2000'); // ano de nascimento
  const [alturaStr, setAlturaStr] = useState('170');
  const [pesoStr, setPesoStr] = useState('70,0');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [objetivo, setObjetivo] = useState('');
  // ↓ Ritmo em que a pessoa quer chegar à meta (só p/ perder/ganhar).
  const [ritmo, setRitmo] = useState('');
  const [origemApp, setOrigemApp] = useState('');
  const [jaContouCalorias, setJaContouCalorias] = useState(null);
  const [pesoObjetivoStr, setPesoObjetivoStr] = useState(pesoStr);

  // ↓ Animação de transição suave entre etapas.
  const animEtapa = useRef(new Animated.Value(1)).current;
  const animProgresso = useRef(new Animated.Value(1 / TOTAL_ETAPAS)).current;
  const animFim = useRef(new Animated.Value(0)).current;
  const refScroll = useRef(null);
  // ↓ Sentido do slide: avança para a esquerda, volta para a direita.
  const [direcao, setDirecao] = useState(1);

  const primeiroNome = usuario?.nome ? usuario.nome.split(' ')[0] : '';

  useEffect(() => {
    Animated.timing(animProgresso, {
      toValue: etapaAtual / TOTAL_ETAPAS,
      duration: 360,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [etapaAtual, animProgresso]);

  // ───────────────────────────────────────────────────────────
  // ↓ Helpers de máscara/parsing
  // ───────────────────────────────────────────────────────────

  // ↓ Valida o ano de nascimento (1900 até o ano atual).
  const validarDataNascimento = (valor) => {
    if (!/^\d{4}$/.test(valor)) return null;
    const ano = Number(valor);
    const anoAtual = new Date().getFullYear();
    if (ano < 1900 || ano > anoAtual) return null;
    return new Date(ano, 0, 1);
  };

  // ↓ Usa 1º de janeiro como data aproximada, já que só coletamos o ano.
  const dataParaISO = (valor) => {
    const dataObj = validarDataNascimento(valor);
    if (!dataObj) return null;
    return `${dataObj.getFullYear()}-01-01`;
  };

  const atualizarAnoNascimento = (ano) => {
    setDataNascimento(String(ano));
    setErroEtapa('');
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Validação da etapa corrente antes de avançar
  // ───────────────────────────────────────────────────────────
  const validarEtapa = () => {
    switch (etapaAtual) {
      case 1:
        return genero ? '' : 'Selecione uma opção para continuar.';
      case 2:
        if (!validarDataNascimento(dataNascimento)) return 'Selecione um ano de nascimento válido.';
        return '';
      case 3: {
        const altura = parseNumeroBr(alturaStr);
        if (isNaN(altura) || altura < 100 || altura > 260) return 'Informe uma altura válida em cm (ex: 175).';
        return '';
      }
      case 4: {
        const peso = parseNumeroBr(pesoStr);
        if (isNaN(peso) || peso < 20 || peso > 350) return 'Informe um peso válido em kg (ex: 70.5).';
        return '';
      }
      case 5:
        return nivelAtividade ? '' : 'Selecione seu nível de atividade.';
      case 6:
        return objetivo ? '' : 'Selecione o seu objetivo.';
      case 7:
        // ↓ Ritmo só se aplica a perder/ganhar (etapa pulada p/ manter).
        if (objetivo === 'manter_peso') return '';
        return ritmo ? '' : 'Selecione o ritmo que combina com você.';
      case 8:
        return origemApp ? '' : 'Selecione onde conheceu o KaorCount.';
      case 9:
        return jaContouCalorias === null ? 'Informe se você já contou calorias antes.' : '';
      case 10: {
        const pesoObjetivo = parseNumeroBr(pesoObjetivoStr);
        if (isNaN(pesoObjetivo) || pesoObjetivo < 20 || pesoObjetivo > 350) {
          return 'Informe um peso objetivo entre 20 e 350 kg.';
        }
        return '';
      }
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
      // ↓ Objetivo "manter peso" pula o ritmo, mas segue para as perguntas finais.
      if (etapaAtual === 6 && objetivo === 'manter_peso') {
        transicionarEtapa(8, 1);
        return;
      }
      transicionarEtapa(etapaAtual + 1, 1);
    }
  };

  const voltar = () => {
    if (enviando) return;
    if (etapaAtual > 1) {
      const etapaAnterior = etapaAtual === 8 && objetivo === 'manter_peso' ? 6 : etapaAtual - 1;
      transicionarEtapa(etapaAnterior, -1);
    } else if (navigation?.canGoBack?.()) {
      navigation.goBack();
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
  const salvarTudo = async () => {
    setErroGeral('');
    setEnviando(true);
    try {
      const idUser = usuario?.id_usuario || usuario?.id;
      const hoje = dataDeHoje();

      const nascISO = dataParaISO(dataNascimento);
      const generoSel = genero;
      const nivelSel = nivelAtividade;
      const objetivoSel = objetivo;
      const pesoKg = parseNumeroBr(pesoStr);
      const alturaCm = parseNumeroBr(alturaStr);
      const ritmoSel = objetivoSel === 'manter_peso' ? undefined : ritmo;

      // ↓ Calcula o plano (TMB, calorias e macros) espelhando o backend,
      //   já considerando o ritmo escolhido (quando aplicável).
      const plano = calcularPlanoNutricional({
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

        await pesquisaInicialApi.salvarOuAtualizar(idUser, {
          origem_app: origemApp,
          ja_contou_calorias: jaContouCalorias,
          peso_objetivo_kg: parseNumeroBr(pesoObjetivoStr),
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

      setResumoFinal({
        plano,
        objetivoLabel: OPCOES_OBJETIVO.find((o) => o.id === objetivoSel)?.label || '',
        ritmoLabel: OPCOES_RITMO.find((r) => r.id === ritmoSel)?.label || '',
        origemApp,
        jaContouCalorias,
        pesoObjetivoKg: parseNumeroBr(pesoObjetivoStr),
      });
      setConcluido(true);
    } catch (error) {
      console.error('[QuizCadastro] Erro ao salvar:', error);
      setErroGeral(error?.message || 'Não foi possível salvar suas respostas. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handleFinalizar = () => salvarTudo();

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
  const renderCabecalhoEtapa = (_IconeEtapa, titulo, pergunta) => (
    <View style={styles.headerEtapa}>
      <Text style={[styles.tituloEtapa, { color: cores.textoEscuro, fontSize: rf(21, 19, 26) }]}>{titulo}</Text>
      <Text style={[styles.perguntaEtapa, { color: cores.textoSuave, fontSize: rf(14, 13, 16) }]}>{pergunta}</Text>
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
    </View>
  );

  // ↓ Etapa 2 — Ano de nascimento.
  const renderNascimento = () => {
    const ano = Number(dataNascimento) || 2000;
    const anoAtual = new Date().getFullYear();

    return (
      <View style={styles.etapaRoda}>
        {renderCabecalhoEtapa(Calendar, 'Em que ano você nasceu?', 'Só precisamos saber o ano.')}
        <View style={styles.seletorEtapaCentralizado}>
          <SeletorRoda
            valor={ano} aoMudar={atualizarAnoNascimento}
            minimo={1900} maximo={anoAtual} passo={1}
            cores={cores}
          />
        </View>
      </View>
    );
  };

  // ↓ Etapa 3 — Altura.
  const renderAltura = () => (
    <View style={styles.etapaRoda}>
      {renderCabecalhoEtapa(Ruler, 'Qual é a sua altura?', 'Um valor aproximado está ótimo.')}
      <View style={styles.seletorEtapaCentralizado}>
        <SeletorRoda
          valor={parseNumeroBr(alturaStr) || 170}
          aoMudar={(valor) => { setAlturaStr(String(valor)); setErroEtapa(''); }}
          minimo={100} maximo={260} passo={1} unidade="cm"
          cores={cores}
        />
      </View>
    </View>
  );

  // ↓ Etapa 4 — Peso atual.
  const renderPeso = () => (
    <View style={styles.etapaRoda}>
      {renderCabecalhoEtapa(Scale, 'Qual é o seu peso?', 'Um valor aproximado está ótimo.')}
      <View style={styles.seletorEtapaCentralizado}>
        <SeletorRoda
          valor={parseNumeroBr(pesoStr) || 70}
          aoMudar={(valor) => { setPesoStr(Number(valor).toFixed(1).replace('.', ',')); setErroEtapa(''); }}
          minimo={20} maximo={350} passo={0.1} unidade="kg"
          cores={cores}
        />
      </View>
    </View>
  );

  // ↓ Etapa 5 — Nível de atividade física.
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

  // ↓ Etapa 6 — Objetivo principal.
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

  // ↓ Etapa 7 — Ritmo para alcançar a meta (só p/ perder/ganhar massa).
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

  // ↓ Etapas 8 a 10 — origem, experiência prévia e peso desejado.
  const renderOrigemApp = () => (
    <View>
      {renderCabecalhoEtapa(Search, 'Onde conheceu o KaorCount?', 'Selecione a opção que mais combina.')}
      {OPCOES_ORIGEM_APP.map((origem) => (
        <PilulaOpcao
          key={origem}
          label={origem}
          selecionado={origemApp === origem}
          aoSelecionar={() => { setOrigemApp(origem); setErroEtapa(''); }}
          cores={cores}
          rf={rf}
        />
      ))}
    </View>
  );

  const renderExperienciaCalorias = () => (
    <View>
      {renderCabecalhoEtapa(Flame, 'Você já contou calorias?', 'Queremos entender sua experiência anterior.')}
      {[{ valor: true, label: 'Sim' }, { valor: false, label: 'Não' }].map((opcao) => (
        <PilulaOpcao
          key={opcao.label}
          label={opcao.label}
          selecionado={jaContouCalorias === opcao.valor}
          aoSelecionar={() => { setJaContouCalorias(opcao.valor); setErroEtapa(''); }}
          cores={cores}
          rf={rf}
        />
      ))}
    </View>
  );

  const renderPesoObjetivo = () => (
    <View style={styles.etapaRoda}>
      {renderCabecalhoEtapa(Scale, 'Qual é seu peso objetivo?', 'Escolha o peso que quer alcançar.')}
      <View style={styles.seletorEtapaCentralizado}>
        <SeletorRoda
          valor={parseNumeroBr(pesoObjetivoStr) || parseNumeroBr(pesoStr) || 70}
          aoMudar={(valor) => { setPesoObjetivoStr(Number(valor).toFixed(1).replace('.', ',')); setErroEtapa(''); }}
          minimo={20} maximo={350} passo={0.1} unidade="kg"
          cores={cores}
        />
      </View>
    </View>
  );

  // ↓ Tela de conclusão — aparece depois que as respostas são salvas.
  const renderConclusao = () => {
    const plano = resumoFinal?.plano;
    const macrosResultado = [
      { rotulo: 'Carboidratos', rotuloCurto: 'Carbos', gramas: plano?.carboidrato_g || 0, kcal: (plano?.carboidrato_g || 0) * 4, cor: cores.carboidrato },
      { rotulo: 'Proteínas', rotuloCurto: 'Proteínas', gramas: plano?.proteina_g || 0, kcal: (plano?.proteina_g || 0) * 4, cor: cores.proteina },
      { rotulo: 'Gorduras', rotuloCurto: 'Gorduras', gramas: plano?.gordura_g || 0, kcal: (plano?.gordura_g || 0) * 9, cor: cores.gordura },
    ];
    const kcalMacros = macrosResultado.reduce((total, macro) => total + macro.kcal, 0) || 1;
    let anguloAtual = -90;
    const macrosComArcos = macrosResultado.map((macro) => {
      const percentual = Math.round((macro.kcal / kcalMacros) * 100);
      const anguloFim = anguloAtual + (macro.kcal / kcalMacros) * 360;
      // Sobrepõe levemente as fatias para evitar frestas de antialiasing no SVG.
      const arco = caminhoArcoRosquinha(anguloAtual - 0.7, anguloFim + 0.7, 139, 91);
      anguloAtual = anguloFim;
      return { ...macro, percentual, arco };
    });
    const proximosPassos = [
      { Icone: Utensils, texto: 'Registre sua alimentação — crie um hábito saudável!' },
      { Icone: Flame, destaque: true, texto: 'Siga sua recomendação diária de calorias' },
      { Icone: Salad, texto: 'Equilibre carboidratos, proteínas e gorduras' },
    ];

    return (
      <SafeAreaView style={[styles.containerTela, { backgroundColor: cores.fundo }]}>
        <View style={[styles.responsivoWrapper, styles.conclusaoWrapper, getContainer(maxAuthWidth)]}>
          <ScrollView
            style={{ flex: 1, minHeight: 0 }}
            contentContainerStyle={[styles.conclusaoScroll, { justifyContent: 'flex-start' }]}
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
            <View style={[styles.conclusaoProgresso, { backgroundColor: tom.trilho }]}>
              <View style={[styles.conclusaoProgressoCheio, { backgroundColor: cores.primaria }]} />
            </View>

            <Text style={[styles.conclusaoTitulo, { color: cores.textoEscuro, fontSize: rf(25, 22, 30) }]}>
              {primeiroNome ? `Parabéns, ${primeiroNome}!` : 'Parabéns!'}
            </Text>
            <Text style={[styles.conclusaoSub, { color: cores.textoSuave, fontSize: rf(14, 13, 16) }]}>
              Seu plano de saúde personalizado está pronto!
            </Text>

            <View style={styles.graficoConclusao}>
              <Svg width={300} height={300} viewBox="0 0 300 300" style={styles.svgGraficoConclusao}>
                {macrosComArcos.map((macro) => (
                  <Path key={macro.rotulo} d={macro.arco} fill={macro.cor} />
                ))}
              </Svg>
              <View style={[styles.centroGrafico, { backgroundColor: cores.branco }, SombraCartao]}>
                <NumeroAnimado
                  valor={plano?.calorias_diarias || 0}
                  estilo={[styles.kcalConclusao, { color: cores.textoEscuro }]}
                />
                <Text style={[styles.unidadeKcalConclusao, { color: cores.textoSuave }]}>kcal / dia</Text>
              </View>
              {macrosComArcos.map((macro, indice) => (
                <View
                  key={macro.rotulo}
                  style={[styles.bolhaMacroConclusao, indice === 0 ? styles.bolhaCarboidrato : indice === 1 ? styles.bolhaProteina : styles.bolhaGordura, { backgroundColor: cores.branco, borderColor: macro.cor, borderWidth: 2 }, SombraCartao]}
                >
                  <Text style={[styles.valorBolhaMacro, { color: cores.textoEscuro }]}>{macro.gramas} g</Text>
                </View>
              ))}
            </View>

            <View style={styles.legendaMacrosConclusao}>
              {macrosComArcos.map((macro) => (
                <View key={macro.rotulo} style={styles.itemLegendaMacro}>
                  <View style={[styles.pontoLegendaMacro, { backgroundColor: macro.cor }]} />
                  <Text style={[styles.textoLegendaMacro, { color: cores.textoEscuro }]}>
                    {macro.rotuloCurto} ({macro.percentual}%)
                  </Text>
                </View>
              ))}
            </View>
            <Text style={[styles.dicaConclusao, { color: cores.textoSuave }]}>Você pode editar suas metas quando quiser.</Text>

            <Text style={[styles.tituloProximosPassos, { color: cores.textoEscuro }]}>Como alcançar seus objetivos</Text>
            <View style={styles.listaProximosPassos}>
              {proximosPassos.map((passo) => (
                <View
                  key={passo.texto}
                  style={[
                    styles.cardProximoPasso,
                    passo.destaque && styles.cardProximoPassoDestaque,
                    { backgroundColor: cores.branco, borderColor: passo.destaque ? cores.primaria : cores.borda },
                    passo.destaque ? SombraBotao : SombraCartao,
                  ]}
                >
                  <View style={[styles.iconeProximoPasso, { backgroundColor: tom.suave }]}>
                    <passo.Icone size={20} color={cores.primaria} />
                  </View>
                  <Text style={[styles.textoPasso, { color: cores.textoEscuro }]}>{passo.texto}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.tituloBeneficios, { color: cores.textoEscuro }]}>Em breve você verá benefícios na sua saúde</Text>
            <Text style={[styles.textoBeneficios, { color: cores.textoSuave }]}>Menor risco de diabetes, pressão mais baixa e melhora do colesterol.</Text>
          </Animated.View>
          </ScrollView>

          <View style={[styles.rodapeQuiz, styles.rodapeConclusao, { borderTopColor: cores.borda }]}>
            <TouchableOpacity
              style={[styles.btnPrincipal, SombraBotao, { backgroundColor: cores.primaria }]}
              onPress={() => navigation.replace('AppTabs')}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={[styles.txtBtnPrincipal, { fontSize: rf(17, 16, 19) }]}>Vamos começar!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  };

  // ↓ Despacha a etapa corrente para a função de renderização certa.
  const ETAPAS = [
    null,
    renderGenero,
    renderNascimento,
    renderAltura,
    renderPeso,
    renderAtividade,
    renderObjetivo,
    renderRitmo,
    renderOrigemApp,
    renderExperienciaCalorias,
    renderPesoObjetivo,
  ];

  // ───────────────────────────────────────────────────────────
  // ↓ Layout principal do wizard
  // ───────────────────────────────────────────────────────────
  if (concluido) return renderConclusao();

  const ehUltimaEtapa = etapaAtual === TOTAL_ETAPAS;
  const vaiFinalizar = ehUltimaEtapa;
  // ↓ "Manter peso" pula a etapa do ritmo: o marcador correspondente fica
  //   esmaecido em vez de encolher a fileira no meio do fluxo.
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
          {/* ↓ Header: voltar + progresso */}
          <View style={styles.headerQuiz}>
            {etapaAtual > 0 && !enviando ? (
              <TouchableOpacity
                onPress={voltar}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Voltar etapa"
                style={styles.btnVoltarCircular}
              >
                <ChevronLeft size={18} color={cores.textoEscuro} />
              </TouchableOpacity>
            ) : (
              <View style={styles.btnVoltarPlaceholder} />
            )}

            <View style={styles.progressoContainer}>
              {etapaAtual > 0 ? (
                <View style={[styles.progressoTrilho, { backgroundColor: tom.trilho }]}>
                  <Animated.View style={[styles.progressoPreenchimento, { backgroundColor: cores.primaria, width: animProgresso.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                </View>
              ) : null}
            </View>

            <View style={styles.btnVoltarPlaceholder} />
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
              transform: [
                { translateX: deslize },
                { scale: animEtapa.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
              ],
            }}
          >
            <ScrollView
              ref={refScroll}
              style={{ flex: 1, minHeight: 0 }}
              contentContainerStyle={[
                styles.scrollConteudo,
                [2, 3, 4].includes(etapaAtual) && styles.scrollConteudoRodas,
              ]}
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
              onPress={vaiFinalizar ? handleFinalizar : avancar}
              disabled={enviando}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={[styles.txtBtnPrincipal, { fontSize: rf(17, 16, 18) }]}>
                    {vaiFinalizar ? 'Gerar meu plano' : 'Seguinte'}
                  </Text>
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
    marginTop: 16,
    gap: 12,
  },
  btnVoltarCircular: {
    width: 36, height: 36, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent', borderWidth: 0,
  },
  btnVoltarPlaceholder: { width: 36, height: 36 },
  progressoContainer: { flex: 1, alignItems: 'center' },
  progressoTrilho: { width: '70%', maxWidth: 180, height: 4, borderRadius: 2, overflow: 'hidden' },
  progressoPreenchimento: { height: '100%', borderRadius: 2 },
  progressoTexto: { fontSize: 11, fontWeight: '600', marginTop: 10, textAlign: 'center' },

  scrollConteudo: { paddingBottom: 24, paddingTop: 14 },
  scrollConteudoRodas: { flexGrow: 1 },
  etapaRoda: { flex: 1 },

  // Etapas
  headerEtapa: { alignItems: 'center', marginBottom: 20, marginTop: 4 },
  iconeEtapaBox: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12, borderWidth: 1, borderColor: 'transparent',
  },
  tituloEtapa: { fontWeight: '800', textAlign: 'center', marginBottom: 6, letterSpacing: -0.3 },
  perguntaEtapa: { textAlign: 'center', lineHeight: 21 },
  dicaEtapa: { fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 17 },
  rodaContainer: { position: 'relative', width: '90%', alignSelf: 'center', overflow: 'hidden', marginTop: 18, marginBottom: 8 },
  seletorEtapaCentralizado: { flex: 1, justifyContent: 'center' },
  rotulosRodasData: { width: '90%', alignSelf: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7, marginTop: 8 },
  rotuloRodaData: { width: '31%', textAlign: 'center', fontSize: 12, fontWeight: '700' },
  linhaRodasData: { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 7 },
  rodaDataColuna: { width: '31%', alignSelf: 'auto', marginTop: 0, marginBottom: 8 },
  itemRoda: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, borderRadius: 14 },
  textoRoda: { fontSize: 24, lineHeight: 30, textAlign: 'center' },
  unidadeRoda: { position: 'absolute', left: '65%', top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
  reservaRotuloRegua: { height: 19 },
  instrucaoRegua: { fontSize: 12, fontWeight: '600', marginTop: 18 },

  // Cartões de opção
  opcaoToque: { width: '100%', alignSelf: 'stretch' },
  cartaoOpcao: {
    width: '100%',
    minHeight: 68,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 12,
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
  indicadorOpcao: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },

  // Pílulas de opção
  blocoPilulas: { flexDirection: 'column', alignItems: 'stretch', gap: 12 },
  pilula: {
    width: '100%', minHeight: 68, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  pilulaTexto: { fontWeight: '700', textAlign: 'center' },

  // Conclusão
  conclusaoTitulo: { fontWeight: '800', textAlign: 'center', marginTop: 18, letterSpacing: -0.4 },
  conclusaoSub: { textAlign: 'center', marginTop: 6, lineHeight: 21, maxWidth: 340 },
  conclusaoProgresso: { width: '70%', maxWidth: 230, height: 4, borderRadius: 3, overflow: 'hidden', marginTop: 8, marginBottom: 30 },
  conclusaoProgressoCheio: { width: '88%', height: '100%', borderRadius: 3 },
  graficoConclusao: { width: '100%', maxWidth: 340, height: 330, alignItems: 'center', justifyContent: 'center', position: 'relative', marginTop: 22 },
  svgGraficoConclusao: { position: 'absolute', top: 12, alignSelf: 'center' },
  centroGrafico: { position: 'absolute', top: 67, width: 190, height: 190, borderRadius: 95, alignItems: 'center', justifyContent: 'center' },
  kcalConclusao: { color: '#27211D', fontSize: 48, fontWeight: '800', letterSpacing: -1 },
  unidadeKcalConclusao: { fontSize: 15, marginTop: -2 },
  bolhaMacroConclusao: { position: 'absolute', width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center' },
  bolhaCarboidrato: { top: 42, left: 0 },
  bolhaProteina: { top: 52, right: 0 },
  bolhaGordura: { bottom: 0, left: 38 },
  valorBolhaMacro: { fontSize: 17, fontWeight: '700' },
  legendaMacrosConclusao: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 5, marginTop: 14 },
  itemLegendaMacro: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  pontoLegendaMacro: { width: 10, height: 10, borderRadius: 5 },
  textoLegendaMacro: { fontSize: 11, fontWeight: '600', flexShrink: 1 },
  dicaConclusao: { textAlign: 'center', fontSize: 13, marginTop: 14 },
  tituloProximosPassos: { width: '100%', textAlign: 'center', fontSize: 21, fontWeight: '800', marginTop: 30, marginBottom: 24 },
  listaProximosPassos: { width: '92%', alignSelf: 'center', gap: 8 },
  cardProximoPasso: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 18, paddingHorizontal: 13, paddingVertical: 12 },
  cardProximoPassoDestaque: { minHeight: 84, marginVertical: 2, paddingVertical: 15, borderWidth: 1.5, transform: [{ scaleX: 1.06 }, { scaleY: 1.03 }], zIndex: 1 },
  iconeProximoPasso: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tituloBeneficios: { width: '100%', textAlign: 'center', fontSize: 21, lineHeight: 27, fontWeight: '800', marginTop: 30 },
  textoBeneficios: { textAlign: 'center', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 18, maxWidth: 340 },
  rodapeConclusao: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 12 },
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
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  txtBtnPrincipal: { color: '#FFFFFF', fontWeight: '800' },
});
