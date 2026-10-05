// ───────────────────────────────────────────────────────────────
// src/screens/QuizCadastroScreen.js
// Quiz de Cadastro (onboarding) do KaorCount.
//
// Exibido logo após o cadastro (AuthScreen → QuizCadastro).
// Coleta, em etapas, gênero, data de nascimento, altura/peso,
// nível de atividade e objetivo. Ao final, mostra uma prévia das
// metas calculadas (TMB Mifflin-St Jeor, espelhada do backend) e
// salva nos endpoints existentes: /perfil-nutri, /historico-progresso
// e /metas-nutri. Quando o backend dedicado do quiz for criado por
// outro agente, o ponto de integração é a função salvarTudo().
// ───────────────────────────────────────────────────────────────
import React, { useState, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView,
  ActivityIndicator, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User, Calendar, Ruler, Scale, Armchair, Footprints, Zap, Bike,
  Dumbbell, TrendingDown, Minus, TrendingUp, ChevronLeft, Check,
  AlertCircle, Sparkles, Flame, Gauge,
} from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import * as metaNutriApi from '../api/metaNutriApi';
import { calcularPlanoNutricional, parseNumeroBr } from '../util/nutricao';

// ↓ Etapas que contam na barra de progresso (boas-vindas não conta).
//   1=gênero 2=nascimento 3=medidas 4=atividade 5=objetivo 6=ritmo 7=revisão.
const TOTAL_ETAPAS = 7;

// ↓ Opções de ritmo para chegar à meta (só exibida p/ perder/ganhar massa).
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

export default function QuizCadastroScreen({ navigation, route }) {
  // ↓ Dados do usuário já autenticado no cadastro.
  const { usuario } = useAuth();
  const { cores, isDark } = useTheme();
  const { rf, moderateScale, getContainer, maxAuthWidth } = useResponsive();

  // ↓ Etapa atual do wizard (0 = boas-vindas; 1..6 = perguntas; 7 = revisão).
  const [etapaAtual, setEtapaAtual] = useState(0);
  const [erroEtapa, setErroEtapa] = useState('');
  const [erroGeral, setErroGeral] = useState('');
  const [enviando, setEnviando] = useState(false);

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
        return ritmo ? '' : 'Selecione o ritmo que combinam com você.';
      default:
        return '';
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Navegação entre as etapas (com transição animada)
  // ───────────────────────────────────────────────────────────
  const transicionarEtapa = (novaEtapa) => {
    setErroEtapa('');
    setErroGeral('');
    Animated.sequence([
      Animated.timing(animEtapa, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(animEtapa, { toValue: 1, duration: 240, useNativeDriver: true }),
    ]).start();
    setEtapaAtual(novaEtapa);
  };

  const avancar = () => {
    const erro = validarEtapa();
    if (erro) { setErroEtapa(erro); return; }
    if (etapaAtual < TOTAL_ETAPAS) {
      // ↓ Objetivo "manter peso" pula a etapa de ritmo.
      if (etapaAtual === 5 && objetivo === 'manter_peso') {
        transicionarEtapa(7); // direto para a revisão
        return;
      }
      transicionarEtapa(etapaAtual + 1);
    }
  };

  const voltar = () => {
    if (!enviando && etapaAtual > 0) {
      // ↓ Voltando da revisão, "manter peso" retorna p/ objetivo (pula ritmo).
      if (etapaAtual === TOTAL_ETAPAS && objetivo === 'manter_peso') {
        transicionarEtapa(5);
        return;
      }
      transicionarEtapa(etapaAtual - 1);
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
      const hoje = new Date().toISOString().split('T')[0];

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

      navigation.replace('AppTabs');
    } catch (error) {
      console.error('[QuizCadastro] Erro ao salvar:', error);
      setErroGeral(error?.message || 'Não foi possível salvar suas respostas. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const handlePular = () => salvarTudo({ pulando: true });
  const handleFinalizar = () => salvarTudo({ pulando: false });

  // ───────────────────────────────────────────────────────────
  // ↓ Helpers de renderização
  // ───────────────────────────────────────────────────────────

  // ↓ Cabeçalho de cada etapa: ícone em círculo + título + pergunta.
  const renderCabecalhoEtapa = (IconeEtapa, titulo, pergunta) => (
    <View style={styles.headerEtapa}>
      <View style={[styles.iconeEtapaBox, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
        <IconeEtapa size={rf(22, 20, 26)} color={cores.primaria} />
      </View>
      <Text style={[styles.tituloEtapa, { color: cores.textoEscuro, fontSize: rf(18, 16, 22) }]}>{titulo}</Text>
      <Text style={[styles.perguntaEtapa, { color: cores.textoSuave, fontSize: rf(13, 12, 15) }]}>{pergunta}</Text>
    </View>
  );

  // ↓ Cartões de opção (gênero, atividade, objetivo).
  const renderCartaoOpcao = ({ id, label, Icone }, selecionado, descricao, aoSelecionar) => (
    <TouchableOpacity
      key={id}
      style={[
        styles.cartaoOpcao,
        { backgroundColor: cores.branco, borderColor: selecionado ? cores.primaria : cores.borda },
        selecionado && { borderWidth: 2, shadowColor: cores.primaria, shadowOpacity: 0.25, shadowRadius: 6, elevation: 3 },
      ]}
      onPress={aoSelecionar}
      activeOpacity={0.85}
    >
      <View style={styles.cartaoOpcaoLinha}>
        <View style={[styles.iconeOpcaoBox, { backgroundColor: selecionado ? (isDark ? '#2A1D13' : '#FDF3E7') : cores.mutado }]}>
          {Icone ? <Icone size={rf(17, 15, 20)} color={selecionado ? cores.primaria : cores.textoSuave} /> : <User size={rf(17, 15, 20)} color={selecionado ? cores.primaria : cores.textoSuave} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cartaoOpcaoRotulo, { color: cores.textoEscuro, fontSize: rf(14, 13, 16) }]}>{label}</Text>
          {descricao ? (
            <Text style={[styles.cartaoOpcaoDesc, { color: cores.textoSuave, fontSize: rf(11, 10, 13) }]}>{descricao}</Text>
          ) : null}
        </View>
        {selecionado && <Check size={18} color={cores.primaria} />}
      </View>
    </TouchableOpacity>
  );

  // ↓ Etapa 0 — Boas-vindas da personalização.
  const renderBoasVindas = () => (
    <View>
      {renderCabecalhoEtapa(
        Sparkles,
        'Vamos personalizar sua jornada!',
        `Olá${usuario?.nome ? `, ${usuario.nome.split(' ')[0]}` : ''}! Responda a 5 perguntinhas rápidas para calcularmos suas metas de calorias e macros sob medida.`
      )}
      <View style={[styles.cardInfo, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
        <View style={styles.cardInfoLinha}>
          <Flame size={16} color={cores.primaria} />
          <Text style={[styles.cardInfoTxt, { color: cores.textoEscuro }]}>Metas calculadas pelo seu perfil</Text>
        </View>
        <View style={styles.cardInfoLinha}>
          <Check size={16} color={cores.sucesso} />
          <Text style={[styles.cardInfoTxt, { color: cores.textoEscuro }]}>Você pode mudar tudo depois em Perfil</Text>
        </View>
        <View style={styles.cardInfoLinha}>
          <Check size={16} color={cores.sucesso} />
          <Text style={[styles.cardInfoTxt, { color: cores.textoEscuro }]}>Leva menos de 1 minuto</Text>
        </View>
      </View>
    </View>
  );

  // ↓ Etapa 1 — Gênero.
  const renderGenero = () => (
    <View>
      {renderCabecalhoEtapa(User, 'Sobre você', 'Qual é o seu gênero?')}
      {OPCOES_GENERO.map((opt) =>
        renderCartaoOpcao(opt, genero === opt.id, null, () => { setGenero(opt.id); setErroEtapa(''); })
      )}
    </View>
  );

  // ↓ Etapa 2 — Data de nascimento com máscara DD/MM/AAAA.
  const renderNascimento = () => (
    <View>
      {renderCabecalhoEtapa(Calendar, 'Sobre você', 'Qual é a sua data de nascimento?')}
      <View style={[styles.inputGrande, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
        <TextInput
          style={[styles.inputGrandeTexto, { color: cores.textoEscuro, fontSize: rf(17, 15, 20) }]}
          placeholder="DD/MM/AAAA"
          placeholderTextColor={cores.textoSuave}
          keyboardType={Platform.OS === 'ios' ? 'number-pad' : 'numeric'}
          value={dataNascimento}
          onChangeText={(txt) => { setDataNascimento(mascararData(txt)); setErroEtapa(''); }}
          maxLength={10}
        />
      </View>
      <Text style={[styles.dicaEtapa, { color: cores.textoSuave }]}>Usada para calcular seu gasto metabólico</Text>
    </View>
  );

  // ↓ Etapa 3 — Altura e peso (guardados no histórico de progresso).
  const renderMedidas = () => (
    <View>
      {renderCabecalhoEtapa(Ruler, 'Suas medidas', 'Qual é a sua altura e o seu peso atual?')}
      <Text style={[styles.rotuloInput, { color: cores.textoEscuro }]}>Altura (cm)</Text>
      <View style={[styles.inputGrande, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
        <Ruler size={16} color={cores.textoSuave} />
        <TextInput
          style={[styles.inputGrandeTexto, { color: cores.textoEscuro, fontSize: rf(16, 14, 18) }]}
          placeholder="Ex: 175"
          placeholderTextColor={cores.textoSuave}
          keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
          value={alturaStr}
          onChangeText={(txt) => { setAlturaStr(txt); setErroEtapa(''); }}
          maxLength={5}
        />
      </View>
      <Text style={[styles.rotuloInput, { color: cores.textoEscuro }]}>Peso (kg)</Text>
      <View style={[styles.inputGrande, { backgroundColor: cores.fundoInput, borderColor: cores.borda }]}>
        <Scale size={16} color={cores.textoSuave} />
        <TextInput
          style={[styles.inputGrandeTexto, { color: cores.textoEscuro, fontSize: rf(16, 14, 18) }]}
          placeholder="Ex: 70.5"
          placeholderTextColor={cores.textoSuave}
          keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
          value={pesoStr}
          onChangeText={(txt) => { setPesoStr(txt); setErroEtapa(''); }}
          maxLength={6}
        />
      </View>
      <Text style={[styles.dicaEtapa, { color: cores.textoSuave }]}>Você poderá atualizar esses dados depois</Text>
    </View>
  );

  // ↓ Etapa 4 — Nível de atividade física.
  const renderAtividade = () => (
    <View>
      {renderCabecalhoEtapa(Zap, 'Sua rotina', 'Com que frequência você se exercita?')}
      {OPCOES_ATIVIDADE.map((opt) =>
        renderCartaoOpcao(opt, nivelAtividade === opt.id, opt.descricao, () => { setNivelAtividade(opt.id); setErroEtapa(''); })
      )}
    </View>
  );

  // ↓ Etapa 5 — Objetivo principal.
  const renderObjetivo = () => (
    <View>
      {renderCabecalhoEtapa(TrendingUp, 'Seu objetivo', 'O que você quer alcançar com o KaorCount?')}
      {OPCOES_OBJETIVO.map((opt) =>
        renderCartaoOpcao(opt, objetivo === opt.id, opt.descricao, () => { setObjetivo(opt.id); setErroEtapa(''); })
      )}
    </View>
  );

  // ↓ Etapa 6 — Ritmo para alcançar a meta (só p/ perder/ganhar massa).
  const renderRitmo = () => (
    <View>
      {renderCabecalhoEtapa(
        Gauge,
        'Em quanto tempo você quer chegar lá?',
        'Escolha um ritmo que você consiga manter no dia a dia.'
      )}
      {OPCOES_RITMO.map((opt) =>
        renderCartaoOpcao(opt, ritmo === opt.id, opt.descricao, () => { setRitmo(opt.id); setErroEtapa(''); })
      )}
      {ritmo === 'acelerado' ? (
        <View style={[styles.avisoRitmo, { backgroundColor: isDark ? '#2A1D13' : '#FFF8E7', borderColor: '#F0C36D' }]}>
          <AlertCircle size={15} color={cores.textoSuave} />
          <Text style={[styles.avisoRitmoTxt, { color: cores.textoSuave }]}>
            Ritmo acelerado exige déficit/superávit maior — combine com sua rotina e, se possível, com um profissional.
          </Text>
        </View>
      ) : null}
    </View>
  );

  // ↓ Etapa 6 — Revisão com a prévia das metas calculadas.
  const renderRevisao = () => {
    const pesoKg = parseNumeroBr(pesoStr);
    const alturaCm = parseNumeroBr(alturaStr);
    const nascISO = dataParaISO(dataNascimento);
    const plano = nascISO
      ? calcularPlanoNutricional({ dataNascimento: nascISO, genero, pesoKg, alturaCm, nivelAtividade, objetivo, ritmo })
      : null;
    const imc = alturaCm > 0 ? (pesoKg / Math.pow(alturaCm / 100, 2)).toFixed(1) : '—';
    const objetivoLabel = OPCOES_OBJETIVO.find((o) => o.id === objetivo)?.label || '—';
    const ritmoLabel = objetivo === 'manter_peso' ? '' : OPCOES_RITMO.find((r) => r.id === ritmo)?.label || '';

    return (
      <View>
        {renderCabecalhoEtapa(Check, 'Tudo certo!', 'Veja o seu plano personalizado calculado:')}
        <View style={[styles.cardResumo, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
          <View style={styles.linhaResumo}>
            <Text style={[styles.rotuloResumo, { color: cores.textoSuave }]}>Sua meta diária</Text>
            <Text style={[styles.valorGrandeResumo, { color: cores.primaria }]}>{plano ? `${plano.calorias_diarias} kcal` : '—'}</Text>
          </View>
          <View style={styles.linhasMacros}>
            <View style={styles.boxMacro}>
              <Text style={[styles.valorMacro, { color: cores.carboidrato }]}>{plano ? `${plano.carboidrato_g}g` : '—'}</Text>
              <Text style={[styles.rotuloMacro, { color: cores.textoSuave }]}>Carbs</Text>
            </View>
            <View style={styles.boxMacro}>
              <Text style={[styles.valorMacro, { color: cores.proteina }]}>{plano ? `${plano.proteina_g}g` : '—'}</Text>
              <Text style={[styles.rotuloMacro, { color: cores.textoSuave }]}>Proteínas</Text>
            </View>
            <View style={styles.boxMacro}>
              <Text style={[styles.valorMacro, { color: cores.gordura }]}>{plano ? `${plano.gordura_g}g` : '—'}</Text>
              <Text style={[styles.rotuloMacro, { color: cores.textoSuave }]}>Gorduras</Text>
            </View>
          </View>
          <View style={styles.divisorResumo} />
          <Text style={[styles.dicaResumo, { color: cores.textoSuave }]}>Objetivo: {objetivoLabel} · IMC estimado: {imc}</Text>
          {ritmoLabel ? (
            <Text style={[styles.dicaResumo, { color: cores.textoSuave }]}>Ritmo escolhido: {ritmoLabel}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  // ↓ Despacha a etapa corrente para a função de renderização certa.
  const ETAPAS = [renderBoasVindas, renderGenero, renderNascimento, renderMedidas, renderAtividade, renderObjetivo, renderRitmo, renderRevisao];
  const renderEtapaAtual = () => ETAPAS[etapaAtual]?.();

  // ───────────────────────────────────────────────────────────
  // ↓ Layout principal do wizard
  // ───────────────────────────────────────────────────────────
  // ↓ "Manter peso" não mostra a etapa de ritmo, então o total cai para 6.
  const totalQuiz = objetivo === 'manter_peso' ? TOTAL_ETAPAS - 1 : TOTAL_ETAPAS;
  const passoAtual = etapaAtual === TOTAL_ETAPAS ? totalQuiz : Math.min(etapaAtual, totalQuiz);
  const progresso = passoAtual / totalQuiz;
  const ehUltimaEtapa = etapaAtual === TOTAL_ETAPAS;

  return (
    <SafeAreaView style={[styles.containerTela, { backgroundColor: cores.fundo }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.responsivoWrapper, getContainer(maxAuthWidth)]}>
          {/* ↓ Header: voltar + barra de progresso + botão "Pular agora" */}
          <View style={styles.headerQuiz}>
            {etapaAtual > 0 && !enviando ? (
              <TouchableOpacity
                style={[styles.btnVoltarCircular, { backgroundColor: cores.branco, borderColor: cores.borda }]}
                onPress={voltar}
                activeOpacity={0.8}
              >
                <ChevronLeft size={18} color={cores.textoEscuro} />
              </TouchableOpacity>
            ) : (
              <View style={styles.btnVoltarPlaceholder} />
            )}

            <View style={styles.progressoContainer}>
              {etapaAtual > 0 && (
                <View style={[styles.progressoTrilha, { backgroundColor: isDark ? '#2E2E2E' : '#EBDCC9' }]}>
                  <Animated.View
                    style={[styles.progressoBarra, { backgroundColor: cores.primaria, width: `${progresso * 100}%` }]}
                  />
                </View>
              )}
              {etapaAtual > 0 && (
                <Text style={[styles.progressoTexto, { color: cores.textoSuave }]}>
                  {passoAtual} de {totalQuiz}
                </Text>
              )}
            </View>

            <TouchableOpacity onPress={handlePular} disabled={enviando} activeOpacity={0.7}>
              <Text style={[styles.txtPular, { color: cores.textoSuave }]}>Pular agora</Text>
            </TouchableOpacity>
          </View>

          {/* ↓ Conteúdo da etapa com transição animada */}
          <Animated.View
            style={{
              flex: 1,
              opacity: animEtapa,
              transform: [{
                translateX: animEtapa.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }),
              }],
            }}
          >
            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={styles.scrollConteudo}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {renderEtapaAtual()}

              {/* ↓ Erros de validação da etapa / erros de envio */}
              {(erroEtapa || erroGeral) ? (
                <View style={styles.bannerErro}>
                  <AlertCircle size={15} color="#E53E3E" />
                  <Text style={styles.textoErro}>{erroEtapa || erroGeral}</Text>
                </View>
              ) : null}
            </ScrollView>
          </Animated.View>

          {/* ↓ Rodapé com o botão principal da etapa */}
          <View style={styles.rodapeQuiz}>
            {ehUltimaEtapa ? (
              <TouchableOpacity
                style={[styles.btnPrincipal, { backgroundColor: cores.primaria, opacity: enviando ? 0.7 : 1 }]}
                onPress={handleFinalizar}
                disabled={enviando}
                activeOpacity={0.85}
              >
                {enviando ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.txtBtnPrincipal}>Começar a usar o KaorCount</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.btnPrincipal, { backgroundColor: cores.primaria }]}
                onPress={avancar}
                activeOpacity={0.85}
              >
                <Text style={styles.txtBtnPrincipal}>{etapaAtual === 0 ? 'Vamos começar' : 'Continuar'}</Text>
              </TouchableOpacity>
            )}
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
    paddingHorizontal: 20,
  },

  // Header do wizard
  headerQuiz: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 6,
    gap: 10,
  },
  btnVoltarCircular: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  btnVoltarPlaceholder: { width: 34, height: 34 },
  progressoContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  progressoTrilha: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressoBarra: { height: 6, borderRadius: 3 },
  progressoTexto: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  txtPular: { fontSize: 12, fontWeight: '600' },

  scrollConteudo: { paddingBottom: 24, paddingTop: 6 },

  // Etapas
  headerEtapa: { alignItems: 'center', marginBottom: 18, marginTop: 6 },
  iconeEtapaBox: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  tituloEtapa: { fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  perguntaEtapa: { textAlign: 'center', lineHeight: 20 },
  dicaEtapa: { fontSize: 11, textAlign: 'center', marginTop: 8 },

  // Card de informação (boas-vindas)
  cardInfo: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 8,
  },
  cardInfoLinha: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  cardInfoTxt: { fontSize: 12, fontWeight: '600' },

  // Cartões de opção
  cartaoOpcao: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 13,
    marginBottom: 10,
  },
  cartaoOpcaoLinha: { flexDirection: 'row', alignItems: 'center' },
  iconeOpcaoBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cartaoOpcaoRotulo: { fontWeight: '700' },
  cartaoOpcaoDesc: { marginTop: 2, lineHeight: 16 },

  // Inputs grandes (data, altura, peso)
  rotuloInput: { fontSize: 13, fontWeight: '700', marginBottom: 6, marginTop: 4 },
  inputGrande: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    minHeight: 52,
    marginBottom: 12,
    gap: 8,
  },
  inputGrandeTexto: { flex: 1, fontWeight: '600' },

  // Revisão (prévia das metas)
  cardResumo: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginTop: 8,
  },
  linhaResumo: { alignItems: 'center', marginBottom: 12 },
  rotuloResumo: { fontSize: 12, fontWeight: '600', marginBottom: 2 },
  valorGrandeResumo: { fontSize: 34, fontWeight: 'bold' },
  linhasMacros: { flexDirection: 'row', justifyContent: 'space-around' },
  boxMacro: { alignItems: 'center', paddingVertical: 8, minWidth: 90 },
  valorMacro: { fontSize: 19, fontWeight: 'bold' },
  rotuloMacro: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  divisorResumo: { height: 1, marginVertical: 12, backgroundColor: '#00000010' },
  dicaResumo: { fontSize: 11, textAlign: 'center' },

  // Erros
  bannerErro: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF5F5',
    borderColor: '#FEB2B2',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginTop: 6,
  },
  textoErro: { color: '#E53E3E', fontSize: 11, fontWeight: '600', flex: 1 },

  // Aviso leve na etapa de ritmo acelerado
  avisoRitmo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  avisoRitmoTxt: { fontSize: 11, lineHeight: 16, flex: 1 },

  // Rodapé do wizard
  rodapeQuiz: { paddingBottom: Platform.OS === 'ios' ? 0 : 8, paddingTop: 4 },
  btnPrincipal: {
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtBtnPrincipal: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});






