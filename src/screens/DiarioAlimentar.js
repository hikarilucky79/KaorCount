import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput, 
  FlatList,
  RefreshControl,
  Platform,
  Animated,
  Easing
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Coffee, Sandwich, UtensilsCrossed, Cookie, Droplets, Plus, Trash2, X, Search, Check, ChevronLeft, ChevronRight, Scale, Apple, Sun, Moon } from 'lucide-react-native';
import { CORES } from '../constants/Cores';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import * as refeicaoApi from '../api/refeicaoApi';
import * as registroAguaApi from '../api/registroAguaApi';
import * as metaNutriApi from '../api/metaNutriApi';
import * as alimentoApi from '../api/alimentoApi';
import * as fatsecretApi from '../api/fatsecretApi';

const formatarDataAPI = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

const normalizarTexto = (txt) => 
  (txt || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

export default function DiarioAlimentar({ navigation }) {
  const { usuario } = useAuth();
  const { cores, isDark } = useTheme();

  // ↓ Estados da Tela
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [refeicoes, setRefeicoes] = useState([]);
  const [macros, setMacros] = useState(null);
  const [metaAtual, setMetaAtual] = useState(null);
  const [agua, setAgua] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [adicionandoAgua, setAdicionandoAgua] = useState(false);

  // ↓ Estados do Modal de Adicionar Alimento
  const [modalVisivel, setModalVisivel] = useState(false);
  const [tipoRefeicaoAtual, setTipoRefeicaoAtual] = useState('cafe_manha');
  const [tabModal, setTabModal] = useState('search'); // 'search' | 'barcode'
  const [busca, setBusca] = useState('');
  const [alimentosBuscados, setAlimentosBuscados] = useState([]);
  const [buscandoExterna, setBuscandoExterna] = useState(false);
  const [alimentoSelecionado, setAlimentoSelecionado] = useState(null);
  const [quantidadeG, setQuantidadeG] = useState('100');
  const [salvandoItem, setSalvandoItem] = useState(false);

  // ↓ Nomes de calendário
  const diasDaSemanaNome = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Maio", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const diaDaSemana = diasDaSemanaNome[dataSelecionada.getDay()];
  const diaDoMes = dataSelecionada.getDate();
  const mes = mesesNomes[dataSelecionada.getMonth()];
  const ano = dataSelecionada.getFullYear();

  const hoje = new Date();
  const ehHoje = 
    dataSelecionada.getDate() === hoje.getDate() &&
    dataSelecionada.getMonth() === hoje.getMonth() &&
    dataSelecionada.getFullYear() === hoje.getFullYear();

  // ↓ Metas
  const metaCalorias = metaAtual?.calorias_diarias || metaAtual?.calorias_meta || 1800;
  const metaProteina = metaAtual?.proteina_g || metaAtual?.proteina_meta_g || 140;
  const metaCarboidrato = metaAtual?.carboidrato_g || metaAtual?.carboidrato_meta_g || 180;
  const metaGordura = metaAtual?.gordura_g || metaAtual?.gordura_meta_g || 55;
  const metaAgua = 2500;

  // ↓ Totais de macros (calculados a partir das refeições e itens carregados)
  const calcularTotaisDoDia = () => {
    let cal = 0, prot = 0, carb = 0, gord = 0;

    // Se a API retornou o resumo de macros:
    if (macros && (macros.calorias || macros.macros?.calorias)) {
      const m = macros.macros || macros;
      return {
        calorias: Math.round(m.calorias || 0),
        proteina: Math.round(m.proteinas || 0),
        carboidrato: Math.round(m.carboidratos || 0),
        gordura: Math.round(m.gorduras || 0),
      };
    }

    // Fallback: calcular somando diretamente os itens das refeições
    (refeicoes || []).forEach(r => {
      (r.itens || []).forEach(item => {
        if (item.alimento) {
          const fator = (item.quantidade_alimento_g || 100) / (item.alimento.porcao_padrao_g || 100);
          cal += (item.alimento.calorias || 0) * fator;
          prot += (item.alimento.proteinas || 0) * fator;
          carb += (item.alimento.carboidratos || 0) * fator;
          gord += (item.alimento.gorduras || 0) * fator;
        } else if (item.calorias) {
          cal += item.calorias || 0;
          prot += item.proteina_g || 0;
          carb += item.carboidrato_g || 0;
          gord += item.gordura_g || 0;
        }
      });
    });

    return {
      calorias: Math.round(cal),
      proteina: Math.round(prot),
      carboidrato: Math.round(carb),
      gordura: Math.round(gord),
    };
  };

  const totais = calcularTotaisDoDia();
  const pctProteina = metaProteina > 0 ? Math.min((totais.proteina / metaProteina) * 100, 100) : 0;
  const pctCarboidrato = metaCarboidrato > 0 ? Math.min((totais.carboidrato / metaCarboidrato) * 100, 100) : 0;
  const pctGordura = metaGordura > 0 ? Math.min((totais.gordura / metaGordura) * 100, 100) : 0;
  const pctAgua = Math.min((agua / metaAgua) * 100, 100);

  // ↓ Animação das barras de progresso (aumentam suavemente a partir do valor atual sem resetar para 0)
  const animBarraProteina = useRef(new Animated.Value(0)).current;
  const animBarraCarboidrato = useRef(new Animated.Value(0)).current;
  const animBarraGordura = useRef(new Animated.Value(0)).current;
  const animBarraAgua = useRef(new Animated.Value(0)).current;

  // Animação dos macros (2 segundos)
  useEffect(() => {
    Animated.parallel([
      Animated.timing(animBarraProteina, { toValue: pctProteina, duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false }),
      Animated.timing(animBarraCarboidrato, { toValue: pctCarboidrato, duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false }),
      Animated.timing(animBarraGordura, { toValue: pctGordura, duration: 1500, easing: Easing.bezier(0.16, 1, 0.3, 1), useNativeDriver: false }),
    ]).start();
  }, [pctProteina, pctCarboidrato, pctGordura]);

  // Animação da água (2 segundos): apenas aumenta/ajusta suavemente sem voltar ao início
  useEffect(() => {
    Animated.timing(animBarraAgua, {
      toValue: pctAgua,
      duration: 1500,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
      useNativeDriver: false,
    }).start();
  }, [pctAgua]);

  const larguraBarraProteina = animBarraProteina.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const larguraBarraCarboidrato = animBarraCarboidrato.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const larguraBarraGordura = animBarraGordura.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const larguraBarraAgua = animBarraAgua.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });

  // ↓ Agrupar refeições por tipo
  const refeicoesPorTipo = {
    cafe_manha: (refeicoes || []).filter(r => r.tipo_refeicao === 'cafe_manha'),
    almoco: (refeicoes || []).filter(r => r.tipo_refeicao === 'almoco'),
    janta: (refeicoes || []).filter(r => r.tipo_refeicao === 'janta'),
    lanche: (refeicoes || []).filter(r => r.tipo_refeicao === 'lanche'),
  };

  const tiposConfig = {
    cafe_manha: { icone: Coffee, titulo: 'Café da Manhã', metaCal: 450 },
    almoco: { icone: Sandwich, titulo: 'Almoço', metaCal: 650 },
    janta: { icone: UtensilsCrossed, titulo: 'Jantar', metaCal: 500 },
    lanche: { icone: Cookie, titulo: 'Lanches', metaCal: 200 },
  };

  const calcularCaloriasRefeicoes = (lista) => {
    let total = 0;
    (lista || []).forEach(r => {
      (r.itens || []).forEach(item => {
        if (item.alimento) {
          const fator = (item.quantidade_alimento_g || 100) / (item.alimento.porcao_padrao_g || 100);
          total += (item.alimento.calorias || 0) * fator;
        } else if (item.calorias) {
          total += item.calorias || 0;
        }
      });
    });
    return Math.round(total);
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Carregar dados da API
  // ───────────────────────────────────────────────────────────
  const carregarDados = useCallback(async (isRefresh = false) => {
    if (!usuario?.id_usuario) {
      setCarregando(false);
      setAtualizando(false);
      return;
    }

    try {
      if (isRefresh) {
        setAtualizando(true);
      } else if (!refeicoes || refeicoes.length === 0) {
        setCarregando(true);
      }

      const dataStr = formatarDataAPI(dataSelecionada);

      const [resRefeicoes, resMacros, resMeta, resAgua] = await Promise.allSettled([
        refeicaoApi.listarPorDia(usuario.id_usuario, dataStr),
        refeicaoApi.resumoMacrosDia(usuario.id_usuario, dataStr),
        metaNutriApi.metaAtual(usuario.id_usuario),
        registroAguaApi.totalDia(usuario.id_usuario, dataStr),
      ]);

      if (resRefeicoes.status === 'fulfilled') setRefeicoes(resRefeicoes.value || []);
      if (resMacros.status === 'fulfilled') setMacros(resMacros.value);
      if (resMeta.status === 'fulfilled') setMetaAtual(resMeta.value);
      if (resAgua.status === 'fulfilled') setAgua(resAgua.value?.total_ml || 0);
    } catch (error) {
      console.warn('[Diário] Erro ao carregar:', error?.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario?.id_usuario, dataSelecionada]);

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
  // ↓ Animação Direcional ao Mudar de Dia (< e >)
  // ───────────────────────────────────────────────────────────
  const animSlideDia = useRef(new Animated.Value(0)).current;
  const animFadeDia = useRef(new Animated.Value(1)).current;
  const [animandoDia, setAnimandoDia] = useState(false);

  const mudarData = (diasOffset) => {
    if (animandoDia) return;
    if (diasOffset > 0 && ehHoje) return;

    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + diasOffset);

    const hojeZero = new Date();
    hojeZero.setHours(0, 0, 0, 0);
    const novaDataZero = new Date(novaData);
    novaDataZero.setHours(0, 0, 0, 0);

    if (novaDataZero > hojeZero) return;

    setAnimandoDia(true);

    // Se clicar na seta esquerda (<), sai para a ESQUERDA (-50) e entra pela DIREITA (+50)
    // Se clicar na seta direita (>), sai para a DIREITA (+50) e entra pela ESQUERDA (-50)
    const direcaoSaida = diasOffset < 0 ? -50 : 50;
    const direcaoEntrada = diasOffset < 0 ? 50 : -50;

    Animated.parallel([
      Animated.timing(animSlideDia, {
        toValue: direcaoSaida,
        duration: 160,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(animFadeDia, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDataSelecionada(novaData);

      animSlideDia.setValue(direcaoEntrada);
      Animated.parallel([
        Animated.timing(animSlideDia, {
          toValue: 0,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(animFadeDia, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setAnimandoDia(false);
      });
    });
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Busca dinâmica integrada com FatSecret API
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const q = busca.trim();

    if (!q) {
      setAlimentosBuscados([]);
      setBuscandoExterna(false);
      return;
    }

    setBuscandoExterna(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fatsecretApi.buscarAlimentos(q, 0, 30);
        if (res?.alimentos && res.alimentos.length > 0) {
          setAlimentosBuscados(res.alimentos);
        } else {
          setAlimentosBuscados([]);
        }
      } catch (err) {
        try {
          const resLocal = await alimentoApi.buscarPorNome(q, 30);
          setAlimentosBuscados(resLocal || []);
        } catch (e2) {
          console.warn('[Diário] Erro ao buscar alimentos:', err?.message);
          setAlimentosBuscados([]);
        }
      } finally {
        setBuscandoExterna(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [busca]);

  // ───────────────────────────────────────────────────────────
  // ↓ Hidratação (+150, +250, +350)
  // ───────────────────────────────────────────────────────────
  const adicionarAgua = async (quantidade) => {
    if (!usuario?.id_usuario) {
      setAgua(prev => prev + quantidade);
      return;
    }

    setAdicionandoAgua(true);
    try {
      await registroAguaApi.criar({
        id_usuario: usuario.id_usuario,
        quantidade_ml: quantidade,
        data_registro: formatarDataAPI(dataSelecionada),
      });
      setAgua(prev => prev + quantidade);
    } catch (error) {
      // Fallback local se offline
      setAgua(prev => prev + quantidade);
    } finally {
      setAdicionandoAgua(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Abrir modal para adicionar alimento
  // ───────────────────────────────────────────────────────────
  const abrirModalAdicionar = (tipo) => {
    setTipoRefeicaoAtual(tipo);
    setAlimentoSelecionado(null);
    setQuantidadeG('100');
    setBusca('');
    setAlimentosBuscados([]);
    setTabModal('search');
    setModalVisivel(true);
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Salvar alimento na refeição
  // ───────────────────────────────────────────────────────────
  const confirmarAdicionarAlimento = async () => {
    if (!alimentoSelecionado) {
      Alert.alert('Atenção', 'Selecione um alimento para adicionar.');
      return;
    }

    const qtd = parseFloat(quantidadeG.replace(',', '.'));
    if (isNaN(qtd) || qtd <= 0) {
      Alert.alert('Atenção', 'Informe uma quantidade válida em gramas.');
      return;
    }

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Você precisa estar conectado para adicionar alimentos.');
      } else {
        Alert.alert('Atenção', 'Você precisa estar conectado para adicionar alimentos.');
      }
      return;
    }

    setSalvandoItem(true);
    try {
      const dataStr = formatarDataAPI(dataSelecionada);

      // 1. Garantir que o alimento exista no backend (se for do FatSecret ou Mock)
      let idAlimentoReal = alimentoSelecionado.id_alimento || alimentoSelecionado.id;
      
      const precisaCriar = 
        alimentoSelecionado.origem_dados === 'FatSecret' ||
        alimentoSelecionado.origem_dados === 'Catálogo Brasileiro' ||
        alimentoSelecionado.origem_dados === 'Tabela Brasileira' ||
        alimentoSelecionado.origem_dados === 'Tabela TACO' ||
        typeof idAlimentoReal === 'string' && (idAlimentoReal.startsWith('taco_') || idAlimentoReal.startsWith('br_') || idAlimentoReal.startsWith('p') || idAlimentoReal.startsWith('fallback_') || !idAlimentoReal.includes('-'));

      if (precisaCriar) {
        try {
          const novoAlimento = await alimentoApi.criar({
            nome_alimento: alimentoSelecionado.nome_alimento,
            porcao_padrao_g: alimentoSelecionado.porcao_padrao_g || 100,
            calorias: alimentoSelecionado.calorias || 0,
            proteinas: alimentoSelecionado.proteinas || 0,
            carboidratos: alimentoSelecionado.carboidratos || 0,
            gorduras: alimentoSelecionado.gorduras || 0,
            origem_dados: alimentoSelecionado.origem_dados || 'FatSecret',
          });
          idAlimentoReal = novoAlimento.id_alimento;
        } catch (e) {
          // Se já existir ou falhar, buscar por nome no banco
          try {
            const buscados = await alimentoApi.buscarPorNome(alimentoSelecionado.nome_alimento, 1);
            if (buscados && buscados.length > 0) {
              idAlimentoReal = buscados[0].id_alimento;
            }
          } catch (bErr) {
            console.warn('[Diário] Erro ao buscar alimento existente:', bErr?.message);
          }
        }
      }

      // 2. Localizar ou criar a refeição deste tipo para o dia
      let refeicaoAlvo = (refeicoesPorTipo[tipoRefeicaoAtual] || [])[0];

      if (!refeicaoAlvo) {
        refeicaoAlvo = await refeicaoApi.criar({
          id_usuario: idUsuario,
          data_refeicao: dataStr,
          tipo_refeicao: tipoRefeicaoAtual,
        });
      }

      // 3. Adicionar o item à refeição
      await refeicaoApi.adicionarItem(refeicaoAlvo.id_refeicao, {
        id_alimento: idAlimentoReal,
        quantidade_alimento_g: qtd,
      });

      // Fechar modal e recarregar os dados atualizados
      setModalVisivel(false);
      await carregarDados(true);
    } catch (error) {
      console.error('[Diário] Erro ao adicionar item:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert(error?.message || 'Não foi possível salvar o alimento.');
      } else {
        Alert.alert('Erro', error?.message || 'Não foi possível salvar o alimento.');
      }
    } finally {
      setSalvandoItem(false);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Remover alimento da refeição
  // ───────────────────────────────────────────────────────────
  const removerItem = (idItem) => {
    const executarRemocao = async () => {
      try {
        await refeicaoApi.removerItem(idItem);
        await carregarDados(true);
      } catch (error) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert('Não foi possível remover o item.');
        } else {
          Alert.alert('Erro', 'Não foi possível remover o item.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmado = typeof window !== 'undefined' ? window.confirm('Deseja remover este item da refeição?') : true;
      if (confirmado) {
        executarRemocao();
      }
    } else {
      Alert.alert(
        'Remover alimento',
        'Deseja remover este item da refeição?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Remover',
            style: 'destructive',
            onPress: executarRemocao,
          },
        ]
      );
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Calcular calorias de um tipo de refeição
  // ───────────────────────────────────────────────────────────
  const calcularCaloriasTipo = (listaRefeicoes) => {
    let total = 0;
    listaRefeicoes.forEach(ref => {
      (ref.itens || []).forEach(item => {
        if (item.alimento) {
          const fator = (item.quantidade_alimento_g || 100) / (item.alimento.porcao_padrao_g || 100);
          total += (item.alimento.calorias || 0) * fator;
        } else if (item.calorias) {
          total += item.calorias;
        }
      });
    });
    return Math.round(total);
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Renderizar bloco de refeição com botão + e lista de itens
  // ───────────────────────────────────────────────────────────
  const renderBlocoRefeicao = (tipo) => {
    const config = tiposConfig[tipo];
    const lista = refeicoesPorTipo[tipo] || [];
    const calsTipo = calcularCaloriasTipo(lista);
    const IconeComp = config.icone;

    const todosItens = lista.flatMap(ref => ref.itens || []);

    return (
      <View style={[styles.cardRefeicao, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]} key={tipo}>
        <View style={styles.headerRefeicao}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconeComp size={20} color={cores.textoEscuro} />
            <Text style={[styles.refeicaoTituloTexto, { marginLeft: 10, color: cores.textoEscuro }]}>
              {config.titulo}  •  <Text style={{ fontWeight: 'normal', fontSize: 13, color: cores.textoSuave }}>{calsTipo} kcal</Text>
            </Text>
          </View>
          
          {/* Botão + funcional para abrir modal */}
          <TouchableOpacity 
            style={[
              styles.botaoAddRefeicao, 
              { 
                borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#EADCC9',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FDF8F2',
              }
            ]}
            onPress={() => abrirModalAdicionar(tipo)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={16} color={cores.primaria} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
        
        {todosItens.length > 0 ? (
          todosItens.map((item, idx) => {
            const alimentoNome = item.alimento?.nome_alimento || item.nome_alimento || 'Alimento';
            const qtdG = item.quantidade_alimento_g || 100;
            const fator = item.alimento ? (qtdG / (item.alimento.porcao_padrao_g || 100)) : 1;
            
            const cal = Math.round((item.alimento?.calorias || item.calorias || 0) * (item.alimento ? fator : 1));
            const prot = Math.round((item.alimento?.proteinas || item.proteina_g || 0) * (item.alimento ? fator : 1));
            const carb = Math.round((item.alimento?.carboidratos || item.carboidrato_g || 0) * (item.alimento ? fator : 1));
            const gord = Math.round((item.alimento?.gorduras || item.gordura_g || 0) * (item.alimento ? fator : 1));

            return (
              <View 
                key={item.id_refeicao_item || item.id_item_refeicao || idx} 
                style={[styles.linhaAlimento, { borderBottomColor: cores.borda }, idx === todosItens.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nomeAlimento, { color: cores.textoEscuro }]}>{alimentoNome}</Text>
                  <Text style={[styles.detalheAlimento, { color: cores.textoSuave }]}>
                    {qtdG}g  •  P{prot}g  C{carb}g  G{gord}g
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.caloriaAlimento, { color: cores.textoEscuro }]}>{cal} <Text style={styles.kcalMini}>kcal</Text></Text>
                  
                  {/* Botão de remover item */}
                  <TouchableOpacity 
                    style={[
                      styles.btnRemoverItem,
                      {
                        borderColor: isDark ? 'rgba(255, 255, 255, 0.35)' : '#FEB2B2',
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#FFF5F5',
                      }
                    ]}
                    onPress={() => removerItem(item.id_refeicao_item || item.id_item_refeicao)}
                    activeOpacity={0.6}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={15} color="#FF5C5C" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={[styles.textoVazioRefeicao, { color: cores.textoSuave }]}>
            Nenhum alimento registrado.
          </Text>
        )}
      </View>
    );
  };

  // Cálculo prévio dos macros do alimento selecionado no modal com base na quantidade
  const fatorModal = alimentoSelecionado ? (parseFloat(quantidadeG.replace(',', '.')) || 100) / (alimentoSelecionado.porcao_padrao_g || 100) : 1;
  const calModal = alimentoSelecionado ? Math.round((alimentoSelecionado.calorias || 0) * fatorModal) : 0;
  const protModal = alimentoSelecionado ? Math.round((alimentoSelecionado.proteinas || 0) * fatorModal) : 0;
  const carbModal = alimentoSelecionado ? Math.round((alimentoSelecionado.carboidratos || 0) * fatorModal) : 0;
  const gordModal = alimentoSelecionado ? Math.round((alimentoSelecionado.gorduras || 0) * fatorModal) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl 
            refreshing={atualizando} 
            onRefresh={() => carregarDados(true)}
            colors={[cores.primaria]}
            tintColor={cores.primaria}
          />
        }
      >
        {/* Cabeçalho Seletor de Data TOTALMENTE FIXO / ESTÁTICO */}
        <View style={[styles.seletorDataContainer, { backgroundColor: '#85461e' }]}>
          <TouchableOpacity 
            style={[
              styles.setaData, 
              { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' }
            ]} 
            onPress={() => mudarData(-1)} 
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
          
          <View style={{ alignItems: 'center' }}>
            <Text style={[styles.textoHoje, { color: '#FFFFFF' }]}>{ehHoje ? 'Hoje' : `${diaDoMes} ${mes}`}</Text>
            <Text style={[styles.textoDataDetalhe, { color: '#FFE8D6' }]}>{`${diaDaSemana}, ${diaDoMes} de ${mes} de ${ano}`}</Text>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.setaData, 
              { backgroundColor: 'rgba(255, 255, 255, 0.2)', borderColor: 'rgba(255, 255, 255, 0.35)' },
              ehHoje && { backgroundColor: 'rgba(255, 255, 255, 0.08)', borderColor: 'transparent' }
            ]} 
            onPress={() => mudarData(1)} 
            disabled={ehHoje}
            activeOpacity={ehHoje ? 1 : 0.7}
          >
            <ChevronRight 
              size={18} 
              color={ehHoje ? 'rgba(255, 255, 255, 0.35)' : '#FFFFFF'} 
              strokeWidth={2.5} 
            />
          </TouchableOpacity>
        </View>

        {/* Animação de Entrada Geral da Aba Diário (Apenas para o conteúdo abaixo da barra fixa) */}
        <Animated.View style={{ opacity: fadeConteudo, transform: [{ translateX: slideConteudo }] }}>
          {/* ↓ Conteúdo Diário Completo com Animação Direcional ao Mudar de Dia */}
          <Animated.View style={{ opacity: animFadeDia, transform: [{ translateX: animSlideDia }] }}>
            {/* Resumo Superior Expandido */}
            <View style={[styles.cardResumo, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={[styles.tituloResumo, { color: cores.textoSuave }]}>RESUMO</Text>
                <Text style={[styles.caloriasResumoValor, { color: cores.textoEscuro }]}>{totais.calorias} <Text style={{fontSize:12, fontWeight:'normal', color: cores.textoSuave}}>kcal</Text></Text>
              </View>
              
              <Text style={[styles.macroTextoDiario, { color: cores.textoEscuro }]}>PROTEÍNA <Text style={{color: cores.primaria}}>{totais.proteina}/{metaProteina}g</Text></Text>
              <View style={[styles.barraFundo, { backgroundColor: isDark ? '#2C2C2C' : '#F0E4D4' }]}><Animated.View style={[styles.barraPreenchida, { width: larguraBarraProteina, backgroundColor: cores.primaria }]} /></View>

              <Text style={[styles.macroTextoDiario, { color: cores.carboidrato }]}>CARBOS <Text style={{color: cores.carboidrato}}>{totais.carboidrato}/{metaCarboidrato}g</Text></Text>
              <View style={[styles.barraFundo, { backgroundColor: isDark ? '#2C2C2C' : '#F0E4D4' }]}><Animated.View style={[styles.barraPreenchida, { width: larguraBarraCarboidrato, backgroundColor: cores.carboidrato }]} /></View>

              <Text style={[styles.macroTextoDiario, { color: cores.gordura }]}>GORDURA <Text style={{color: cores.gordura}}>{totais.gordura}/{metaGordura}g</Text></Text>
              <View style={[styles.barraFundo, { backgroundColor: isDark ? '#2C2C2C' : '#F0E4D4' }]}><Animated.View style={[styles.barraPreenchida, { width: larguraBarraGordura, backgroundColor: cores.gordura }]} /></View>
            </View>

            {/* Blocos de refeição com botão + e itens */}
            <View>
              {renderBlocoRefeicao('cafe_manha')}
              {renderBlocoRefeicao('almoco')}
              {renderBlocoRefeicao('janta')}
              {renderBlocoRefeicao('lanche')}
            </View>

            {/* Bloco Hidratação com botões funcionais */}
            <View style={[styles.cardConfig, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Droplets size={20} color="#2F80ED" />
                  <Text style={[styles.tituloCardInterno, { marginLeft: 8, color: cores.textoEscuro }]}>Hidratação</Text>
                </View>
                <Text style={[styles.volAguaText, { color: '#2F80ED' }]}>
                  {agua} <Text style={{ fontSize: 13, fontWeight: 'normal', color: cores.textoSuave }}>/ {metaAgua} ml</Text>
                </Text>
              </View>
              
              <View style={[styles.barraFundoAgua, { backgroundColor: isDark ? '#262626' : '#EADCC9' }]}>
                <Animated.View style={[styles.barraPreenchidaAgua, { width: larguraBarraAgua }]} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 6 }}>
                {[150, 250, 350, 500].map((qtd) => (
                  <TouchableOpacity 
                    key={qtd}
                    style={[
                      styles.btnQuickAgua, 
                      { 
                        backgroundColor: isDark ? '#16222F' : '#F0F6FF', 
                        borderColor: isDark ? '#223B5A' : '#D0E4FF' 
                      }
                    ]} 
                    onPress={() => adicionarAgua(qtd)} 
                    disabled={adicionandoAgua}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.txtBtnAgua, { color: isDark ? '#6BA4FF' : '#2F80ED' }]}>+{qtd}ml</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </Animated.View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {/* ↓ MODAL: ADICIONAR ALIMENTO (FULL SCREEN TOTAL FIGMA)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Modal 
        visible={modalVisivel} 
        animationType="slide" 
        presentationStyle="fullScreen"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisivel(false)}
      >
        <View style={[styles.fundoModal, isDark && { backgroundColor: '#121212' }]}>
          <View style={[styles.cardModal, { backgroundColor: cores.fundo }]}>
            
            {/* Header Colorido Marrom #85461E do Modal */}
            <View style={[styles.headerModalBrown, isDark && { backgroundColor: '#1F140E', borderBottomWidth: 1, borderBottomColor: cores.borda }]}>
              {alimentoSelecionado ? (
                <View style={styles.headerBrownRowDetail}>
                  <TouchableOpacity 
                    onPress={() => setAlimentoSelecionado(null)} 
                    style={styles.btnHeaderBrownCircular}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.headerBrownTitulo} numberOfLines={1}>
                    {alimentoSelecionado.nome_alimento}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => setModalVisivel(false)} 
                    style={styles.btnHeaderBrownCircular}
                    activeOpacity={0.7}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.headerBrownRow}>
                    <View style={styles.iconeRefeicaoCircle}>
                      {React.createElement(tiposConfig[tipoRefeicaoAtual]?.icone || UtensilsCrossed, { size: 20, color: '#FFFFFF' })}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.headerBrownMealTitulo}>
                        {tiposConfig[tipoRefeicaoAtual]?.titulo}
                      </Text>
                      <Text style={[styles.headerBrownMealCalorias, isDark && { color: '#D6C7B8' }]}>
                        {calcularCaloriasRefeicoes(refeicoesPorTipo[tipoRefeicaoAtual] || [])} / {tiposConfig[tipoRefeicaoAtual]?.metaCal || Math.round(metaCalorias / 4)} kcal
                      </Text>
                    </View>
                    <TouchableOpacity 
                      onPress={() => setModalVisivel(false)} 
                      style={styles.btnHeaderBrownCircular}
                      activeOpacity={0.7}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Barra de Progresso da Refeição */}
                  <View style={styles.progressoHeaderTrack}>
                    <View 
                      style={[
                        styles.progressoHeaderFill, 
                        { 
                          width: `${Math.min(
                            (calcularCaloriasRefeicoes(refeicoesPorTipo[tipoRefeicaoAtual] || []) / 
                            (tiposConfig[tipoRefeicaoAtual]?.metaCal || Math.round(metaCalorias / 4) || 1)) * 100, 
                            100
                          )}%` 
                        }
                      ]} 
                    />
                  </View>
                </>
              )}
            </View>

            {/* ETAPA 1: Busca, Abas e Seleção de Alimento */}
            {!alimentoSelecionado ? (
              <View style={{ flex: 1, backgroundColor: cores.fundo }}>
                {/* Abas Superiores (Código de barras | Buscar) */}
                <View style={[styles.containerAbasModal, { backgroundColor: cores.branco, borderBottomColor: cores.borda }]}>
                  <TouchableOpacity 
                    style={styles.btnAbaModal}
                    onPress={() => setTabModal('barcode')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.circuloAbaModal, { backgroundColor: isDark ? '#262626' : '#FDF8F2', borderColor: isDark ? '#3A3A3A' : cores.borda }, tabModal === 'barcode' && { backgroundColor: isDark ? '#3D2817' : 'rgba(200, 130, 66, 0.15)', borderColor: cores.primaria }]}>
                      <Scale size={18} color={tabModal === 'barcode' ? cores.primaria : (isDark ? '#B8A89A' : cores.textoSuave)} />
                    </View>
                    <Text style={[styles.txtAbaModal, { color: isDark ? '#B8A89A' : cores.textoSuave }, tabModal === 'barcode' && [styles.txtAbaModalAtiva, { color: cores.primaria }]]}>
                      Código de{"\n"}barras
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.btnAbaModal}
                    onPress={() => setTabModal('search')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.circuloAbaModal, { backgroundColor: isDark ? '#262626' : '#FDF8F2', borderColor: isDark ? '#3A3A3A' : cores.borda }, tabModal === 'search' && { backgroundColor: isDark ? '#3D2817' : 'rgba(200, 130, 66, 0.15)', borderColor: cores.primaria }]}>
                      <Search size={18} color={tabModal === 'search' ? cores.primaria : (isDark ? '#B8A89A' : cores.textoSuave)} />
                    </View>
                    <Text style={[styles.txtAbaModal, { color: isDark ? '#B8A89A' : cores.textoSuave }, tabModal === 'search' && [styles.txtAbaModalAtiva, { color: cores.primaria }]]}>
                      Buscar
                    </Text>
                  </TouchableOpacity>
                </View>

                {tabModal === 'barcode' ? (
                  <View style={styles.containerEmBreve}>
                    <View style={[styles.circuloIconeEmBreve, { backgroundColor: isDark ? '#2A1D13' : '#FDF3E7' }]}>
                      <Scale size={24} color={cores.primaria} />
                    </View>
                    <Text style={[styles.txtEmBreve, { color: isDark ? '#B8A89A' : cores.textoSuave }]}>Leitor de código de barras em breve</Text>
                  </View>
                ) : (
                  <>
                    {/* Barra de Pesquisa Redonda */}
                    <View style={[styles.inputBuscaWrapper, { backgroundColor: cores.branco, borderBottomColor: cores.borda }]}>
                      <View style={[styles.inputBuscaContainer, { backgroundColor: isDark ? '#2A2A2A' : cores.fundoInput, borderColor: isDark ? '#3E3E3E' : cores.borda }]}>
                        <Search size={16} color={isDark ? '#B8A89A' : cores.textoSuave} style={{ marginRight: 8 }} />
                        <TextInput 
                          style={[styles.inputBusca, { color: cores.textoEscuro }]}
                          placeholder="Buscar alimento (ex: biscoito, arroz, frango)..."
                          placeholderTextColor={isDark ? '#8A7E74' : cores.textoSuave}
                          value={busca}
                          onChangeText={setBusca}
                          autoFocus
                        />
                        {buscandoExterna && (
                          <ActivityIndicator size="small" color={cores.primaria} style={{ marginRight: 8 }} />
                        )}
                        {busca.length > 0 && !buscandoExterna && (
                          <TouchableOpacity onPress={() => setBusca('')}>
                            <X size={16} color={isDark ? '#B8A89A' : cores.textoSuave} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Lista de Alimentos */}
                    {alimentosBuscados.length === 0 && !buscandoExterna ? (
                      <View style={styles.containerBuscaVazia}>
                        <Search size={48} color={isDark ? '#3D3126' : '#EDD9C3'} style={{ marginBottom: 14 }} />
                        <Text style={[styles.txtInstrucaoBusca, { color: isDark ? '#B8A89A' : cores.textoSuave }]}>
                          {busca.trim() ? `Nenhum alimento encontrado para "${busca}"` : 'Digite o nome do alimento para buscar no FatSecret'}
                        </Text>
                      </View>
                    ) : (
                      <FlatList 
                        data={alimentosBuscados}
                        keyExtractor={(item, index) => String(item.id || item.id_alimento || item.food_id || index)}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 30 }}
                        ListHeaderComponent={
                          buscandoExterna ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, gap: 6 }}>
                              <ActivityIndicator size="small" color={cores.primaria} />
                              <Text style={{ fontSize: 12, color: cores.textoSuave }}>Buscando alimentos...</Text>
                            </View>
                          ) : null
                        }
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={[styles.cardItemAlimento, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}
                            onPress={() => {
                              setAlimentoSelecionado(item);
                              setQuantidadeG(String(item.porcao_padrao_g || 100));
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                                <Text style={[styles.itemNomeTexto, { color: cores.textoEscuro }]} numberOfLines={1}>{item.nome_alimento || item.nome}</Text>
                                {item.marca ? (
                                  <Text style={[styles.badgeMarcaTexto, { color: cores.textoSuave }]} numberOfLines={1}> · {item.marca}</Text>
                                ) : null}
                              </View>
                              <Text style={[styles.itemSubTexto, { color: cores.textoSuave }]}>{item.calorias || 0} kcal · por {item.porcao_padrao_g || 100}g</Text>
                            </View>
                            <View style={styles.colunaMacroBadges}>
                              <Text style={[styles.macroBadgeTexto, { color: cores.proteina }]}>P {item.proteinas || 0}g</Text>
                              <Text style={[styles.macroBadgeTexto, { color: cores.carboidrato }]}>C {item.carboidratos || 0}g</Text>
                              <Text style={[styles.macroBadgeTexto, { color: cores.gordura }]}>G {item.gorduras || 0}g</Text>
                            </View>
                          </TouchableOpacity>
                        )}
                      />
                    )}
                  </>
                )}
              </View>
            ) : (
              /* ETAPA 2: Quantidade & Valores Nutricionais */
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 16, paddingBottom: 25, flexGrow: 1, backgroundColor: cores.fundo }}
              >
                {/* Card 1: Informações do Alimento Selecionado */}
                <View style={[styles.cardAlimentoSelecionado, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  <Text style={[styles.tituloAlimentoSelecionado, { color: cores.textoEscuro }]}>{alimentoSelecionado.nome_alimento}</Text>
                  <Text style={[styles.subAlimentoSelecionado, { color: cores.textoSuave }]}>
                    {alimentoSelecionado.calorias} kcal · por {alimentoSelecionado.porcao_padrao_g || 100}g
                  </Text>
                </View>

                {/* Card 2: Entrada da Quantidade */}
                <View style={[styles.cardSecaoModal, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  <Text style={[styles.labelSecaoModal, { color: cores.textoSuave }]}>QUANTIDADE</Text>
                  <View style={styles.rowInputGrande}>
                    <TextInput 
                      style={[
                        styles.inputGrandeQtd, 
                        { 
                          backgroundColor: isDark ? '#242424' : '#FDF8F2', 
                          borderColor: isDark ? '#3E3E3E' : cores.borda,
                          color: cores.textoEscuro 
                        }
                      ]}
                      value={quantidadeG}
                      onChangeText={setQuantidadeG}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text style={[styles.unidadeGrandeTexto, { color: cores.textoSuave }]}>g</Text>
                  </View>
                </View>

                {/* Card 3: 4 Colunas de Valores Nutricionais */}
                <View style={[styles.cardSecaoModal, { backgroundColor: cores.branco, borderColor: cores.borda, borderWidth: 1 }]}>
                  <Text style={[styles.labelSecaoModal, { color: cores.textoSuave }]}>VALORES NUTRICIONAIS</Text>
                  <View style={styles.gridQuatroColunas}>
                    <View style={[styles.colunaMacroBox, { backgroundColor: isDark ? '#242424' : '#FDF8F2' }]}>
                      <Text style={[styles.colunaMacroValor, { color: cores.primaria }]}>{calModal}</Text>
                      <Text style={[styles.colunaMacroUnidade, { color: cores.textoSuave }]}>kcal</Text>
                      <Text style={[styles.colunaMacroLabel, { color: cores.textoSuave }]}>Calorias</Text>
                    </View>
                    <View style={[styles.colunaMacroBox, { backgroundColor: isDark ? '#242424' : '#FDF8F2' }]}>
                      <Text style={[styles.colunaMacroValor, { color: cores.proteina }]}>{protModal}g</Text>
                      <Text style={[styles.colunaMacroUnidade, { color: cores.textoSuave }]}>g</Text>
                      <Text style={[styles.colunaMacroLabel, { color: cores.textoSuave }]}>Proteína</Text>
                    </View>
                    <View style={[styles.colunaMacroBox, { backgroundColor: isDark ? '#242424' : '#FDF8F2' }]}>
                      <Text style={[styles.colunaMacroValor, { color: cores.carboidrato }]}>{carbModal}g</Text>
                      <Text style={[styles.colunaMacroUnidade, { color: cores.textoSuave }]}>g</Text>
                      <Text style={[styles.colunaMacroLabel, { color: cores.textoSuave }]}>Carbos</Text>
                    </View>
                    <View style={[styles.colunaMacroBox, { backgroundColor: isDark ? '#242424' : '#FDF8F2' }]}>
                      <Text style={[styles.colunaMacroValor, { color: cores.gordura }]}>{gordModal}g</Text>
                      <Text style={[styles.colunaMacroUnidade, { color: cores.textoSuave }]}>g</Text>
                      <Text style={[styles.colunaMacroLabel, { color: cores.textoSuave }]}>Gordura</Text>
                    </View>
                  </View>
                </View>

                {/* Botão de Adicionar à Refeição */}
                <TouchableOpacity 
                  style={[styles.btnConfirmarAdicionar, salvandoItem && { opacity: 0.6 }]}
                  onPress={confirmarAdicionarAlimento}
                  disabled={salvandoItem}
                  activeOpacity={0.8}
                >
                  {salvandoItem ? (
                    <ActivityIndicator color={cores.branco} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Check size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.btnConfirmarTexto}>
                        Adicionar ao {tiposConfig[tipoRefeicaoAtual]?.titulo}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}

          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seletorDataContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    marginTop: 10, 
    backgroundColor: '#85461e', 
    borderRadius: 25, 
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  setaData: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: CORES.branco, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 1, 
    borderColor: CORES.borda
  },
  setaDataDesabilitada: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'transparent',
  },
  textoHoje: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: CORES.branco, 
  },
  textoDataDetalhe: { 
    fontSize: 12, 
    color: '#FFF2E6', 
    marginTop: 2,
  },
  cardResumo: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 20 
  },
  tituloResumo: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: CORES.textoSuave, 
    letterSpacing: 0.5 
  },
  caloriasResumoValor: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  macroTextoDiario: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro, 
    marginTop: 10, 
    marginBottom: 4 
  },
  barraFundo: { 
    height: 6, 
    backgroundColor: '#F0E4D4', 
    borderRadius: 3 
  },
  barraPreenchida: { 
    height: '100%', 
    borderRadius: 3 
  },
  cardRefeicao: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16 
  },
  headerRefeicao: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#FDF8F2', 
    paddingBottom: 8 
  },
  refeicaoTituloTexto: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  botaoAddRefeicao: { 
    width: 30, 
    height: 30, 
    borderRadius: 15,
    borderWidth: 1,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  linhaAlimento: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#F5EAE0' 
  },
  nomeAlimento: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: CORES.textoEscuro 
  },
  detalheAlimento: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginTop: 2 
  },
  caloriaAlimento: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro,
    marginRight: 10,
  },
  kcalMini: { 
    fontSize: 11, 
    fontWeight: 'normal', 
    color: CORES.textoSuave 
  },
  btnRemoverItem: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoVazioRefeicao: {
    color: CORES.textoSuave, 
    fontSize: 13, 
    fontStyle: 'italic', 
    paddingVertical: 8,
  },
  volAguaText: { 
    fontSize: 26, 
    fontWeight: 'bold', 
    color: '#2F80ED', 
    marginVertical: 8 
  },
  barraFundoAgua: { 
    height: 10, 
    backgroundColor: '#EADCC9', 
    borderRadius: 5, 
    overflow: 'hidden' 
  },
  barraPreenchidaAgua: { 
    height: '100%', 
    backgroundColor: '#2F80ED', 
    borderRadius: 5 
  },
  btnQuickAgua: { 
    flex: 1,
    backgroundColor: '#F0F6FF', 
    paddingVertical: 10, 
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D0E4FF',
  },
  txtBtnAgua: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2F80ED',
  },
  cardConfig: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 20 
  },
  tituloCardInterno: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },

  // Estilos do Modal (Figma Full Screen)
  fundoModal: {
    flex: 1,
    backgroundColor: '#85461e',
  },
  cardModal: {
    flex: 1,
    backgroundColor: CORES.fundo,
  },
  headerModalBrown: {
    backgroundColor: '#85461e',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 52 : (Platform.OS === 'web' ? 20 : 42),
    paddingBottom: 18,
  },
  headerBrownRowDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBrownTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerBrownRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconeRefeicaoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrownMealTitulo: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerBrownMealCalorias: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  btnHeaderBrownCircular: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressoHeaderTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressoHeaderFill: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 3,
  },

  // Abas
  containerAbasModal: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: CORES.branco,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  btnAbaModal: {
    alignItems: 'center',
    minWidth: 70,
  },
  circuloAbaModal: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: CORES.fundo,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  circuloAbaModalAtiva: {
    backgroundColor: 'rgba(200, 130, 66, 0.15)',
    borderColor: CORES.primaria,
  },
  txtAbaModal: {
    fontSize: 10,
    color: CORES.textoSuave,
    textAlign: 'center',
    lineHeight: 12,
  },
  txtAbaModalAtiva: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },

  // Busca e Lista
  inputBuscaWrapper: {
    backgroundColor: CORES.branco,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: CORES.borda,
  },
  inputBuscaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CORES.fundoInput,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    paddingHorizontal: 14,
    height: 44,
  },
  inputBusca: {
    flex: 1,
    fontSize: 14,
    color: CORES.textoEscuro,
  },
  containerBuscaVazia: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 25,
  },
  txtInstrucaoBusca: {
    fontSize: 14,
    color: CORES.textoSuave,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 240,
  },
  containerEmBreve: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  circuloIconeEmBreve: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(200, 130, 66, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  txtEmBreve: {
    fontSize: 14,
    fontWeight: '500',
    color: CORES.textoSuave,
    textAlign: 'center',
  },
  listaVaziaTexto: {
    textAlign: 'center',
    fontSize: 13,
    color: CORES.textoSuave,
    marginTop: 10,
  },
  containerFiltrosBR: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  chipFiltroBR: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtChipFiltroBR: {
    fontSize: 12,
  },
  badgeBRTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  txtBadgeBR: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  cardItemAlimento: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: CORES.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  itemNomeTexto: {
    fontSize: 14,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
  },
  badgeMarcaTexto: {
    fontSize: 12,
    color: CORES.primaria,
    fontWeight: '600',
  },
  itemSubTexto: {
    fontSize: 12,
    color: CORES.textoSuave,
    marginTop: 3,
  },
  colunaMacroBadges: {
    alignItems: 'flex-end',
    gap: 2,
  },
  macroBadgeTexto: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Etapa 2: Alimento Selecionado & Quantidade
  cardAlimentoSelecionado: {
    backgroundColor: CORES.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 16,
    marginBottom: 12,
  },
  tituloAlimentoSelecionado: {
    fontSize: 16,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
    marginBottom: 2,
  },
  subAlimentoSelecionado: {
    fontSize: 12,
    color: CORES.textoSuave,
  },
  cardSecaoModal: {
    backgroundColor: CORES.branco,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CORES.borda,
    padding: 16,
    marginBottom: 12,
  },
  labelSecaoModal: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: CORES.textoSuave,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  rowInputGrande: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGrandeQtd: {
    backgroundColor: CORES.fundoInput,
    borderWidth: 1.5,
    borderColor: CORES.borda,
    borderRadius: 16,
    width: 120,
    height: 50,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: CORES.textoEscuro,
  },
  unidadeGrandeTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: CORES.textoSuave,
    marginLeft: 12,
  },
  gridQuatroColunas: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  colunaMacroBox: {
    flex: 1,
    backgroundColor: CORES.fundoInput,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colunaMacroValor: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  colunaMacroUnidade: {
    fontSize: 10,
    color: CORES.textoSuave,
    marginTop: 2,
  },
  colunaMacroLabel: {
    fontSize: 10,
    color: CORES.textoSuave,
    marginTop: 2,
  },
  btnConfirmarAdicionar: {
    backgroundColor: CORES.primaria,
    borderRadius: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(133, 70, 30, 0.25)',
      },
      default: {
        shadowColor: CORES.primaria,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  btnConfirmarTexto: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
});