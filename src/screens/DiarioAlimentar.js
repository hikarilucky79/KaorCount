import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  ActivityIndicator, 
  Alert, 
  Modal, 
  TextInput, 
  FlatList,
  RefreshControl,
  Platform
} from 'react-native';
import { Coffee, Sandwich, UtensilsCrossed, Cookie, Droplets, Plus, Trash2, X, Search, Check, ChevronLeft, ChevronRight, Scale, Apple } from 'lucide-react-native';
import { CORES } from '../constants/Cores';
import useAuth from '../hooks/useAuth';
import * as refeicaoApi from '../api/refeicaoApi';
import * as registroAguaApi from '../api/registroAguaApi';
import * as metaNutriApi from '../api/metaNutriApi';
import * as alimentoApi from '../api/alimentoApi';
import * as fatsecretApi from '../api/fatsecretApi';

// ↓ Alimentos comuns pré-cadastrados da biblioteca do KaorCount
const ALIMENTOS_PREDEFINIDOS = [
  { id: 'p1', nome_alimento: 'Peito de Frango (grelhado)', porcao_padrao_g: 100, calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6 },
  { id: 'p2', nome_alimento: 'Arroz Branco (cozido)', porcao_padrao_g: 100, calorias: 130, proteinas: 2.7, carboidratos: 28, gorduras: 0.3 },
  { id: 'p3', nome_alimento: 'Feijão Preto (cozido)', porcao_padrao_g: 100, calorias: 132, proteinas: 8.9, carboidratos: 24, gorduras: 0.5 },
  { id: 'p4', nome_alimento: 'Ovo Cozido', porcao_padrao_g: 100, calorias: 155, proteinas: 13, carboidratos: 1.1, gorduras: 11 },
  { id: 'p5', nome_alimento: 'Banana Prata', porcao_padrao_g: 100, calorias: 89, proteinas: 1.1, carboidratos: 23, gorduras: 0.3 },
  { id: 'p6', nome_alimento: 'Aveia em Flocos', porcao_padrao_g: 100, calorias: 389, proteinas: 17, carboidratos: 66, gorduras: 7 },
  { id: 'p7', nome_alimento: 'Iogurte Grego (0%)', porcao_padrao_g: 100, calorias: 59, proteinas: 10, carboidratos: 3.6, gorduras: 0.4 },
  { id: 'p8', nome_alimento: 'Salmão (assado)', porcao_padrao_g: 100, calorias: 208, proteinas: 20, carboidratos: 0, gorduras: 13 },
  { id: 'p9', nome_alimento: 'Batata Doce (assada)', porcao_padrao_g: 100, calorias: 90, proteinas: 2, carboidratos: 20, gorduras: 0.1 },
  { id: 'p10', nome_alimento: 'Whey Protein', porcao_padrao_g: 30, calorias: 120, proteinas: 24, carboidratos: 3, gorduras: 1.5 },
  { id: 'p11', nome_alimento: 'Amêndoas', porcao_padrao_g: 100, calorias: 579, proteinas: 21, carboidratos: 22, gorduras: 50 },
  { id: 'p12', nome_alimento: 'Leite Integral', porcao_padrao_g: 100, calorias: 61, proteinas: 3.2, carboidratos: 4.8, gorduras: 3.3 },
  { id: 'p13', nome_alimento: 'Maçã Fuji', porcao_padrao_g: 100, calorias: 52, proteinas: 0.3, carboidratos: 14, gorduras: 0.2 },
  { id: 'p14', nome_alimento: 'Brócolis (cozido)', porcao_padrao_g: 100, calorias: 35, proteinas: 2.4, carboidratos: 7.2, gorduras: 0.4 },
  { id: 'p15', nome_alimento: 'Azeite de Oliva', porcao_padrao_g: 13, calorias: 119, proteinas: 0, carboidratos: 0, gorduras: 13.5 },
  { id: 'p16', nome_alimento: 'Pão Integral', porcao_padrao_g: 50, calorias: 124, proteinas: 6.5, carboidratos: 20.5, gorduras: 1.7 },
  { id: 'p17', nome_alimento: 'Queijo Minas', porcao_padrao_g: 30, calorias: 79, proteinas: 5.2, carboidratos: 1, gorduras: 6 },
  { id: 'p18', nome_alimento: 'Carne Moída (Patinho)', porcao_padrao_g: 100, calorias: 133, proteinas: 21.5, carboidratos: 0, gorduras: 4.5 },
];

const formatarDataAPI = (data) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
};

export default function DiarioAlimentar({ navigation }) {
  const { usuario } = useAuth();
  
  // ↓ Estados locais
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
  const metaCalorias = metaAtual?.calorias_meta || 1800;
  const metaProteina = metaAtual?.proteina_meta_g || 140;
  const metaCarboidrato = metaAtual?.carboidrato_meta_g || 180;
  const metaGordura = metaAtual?.gordura_meta_g || 55;
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
      if (isRefresh) setAtualizando(true);
      else setCarregando(true);

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

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ───────────────────────────────────────────────────────────
  // ↓ Busca dinâmica integrada com FatSecret e Catálogo Local
  // ───────────────────────────────────────────────────────────
  useEffect(() => {
    const q = busca.trim().toLowerCase();
    if (!q) {
      setAlimentosBuscados([]);
      setBuscandoExterna(false);
      return;
    }

    // 1. Filtrar catálogo local imediatamente para feedback instantâneo
    const locais = ALIMENTOS_PREDEFINIDOS.filter(a =>
      a.nome_alimento.toLowerCase().includes(q)
    );
    setAlimentosBuscados(locais);

    // 2. Debounce de 350ms para chamar a API externa do FatSecret
    const timer = setTimeout(async () => {
      if (q.length >= 2) {
        setBuscandoExterna(true);
        try {
          const res = await fatsecretApi.buscarAlimentos(busca.trim(), 0, 25);
          if (res?.alimentos && res.alimentos.length > 0) {
            const nomesExistentes = new Set(locais.map(l => l.nome_alimento.toLowerCase()));
            const novos = res.alimentos.filter(a => !nomesExistentes.has(a.nome_alimento.toLowerCase()));
            setAlimentosBuscados([...locais, ...novos]);
          }
        } catch (err) {
          // Fallback se FatSecret falhar: buscar no backend local
          try {
            const resLocal = await alimentoApi.buscarPorNome(busca.trim(), 25);
            if (resLocal && resLocal.length > 0) {
              const nomesExistentes = new Set(locais.map(l => l.nome_alimento.toLowerCase()));
              const novos = resLocal.filter(a => !nomesExistentes.has(a.nome_alimento.toLowerCase()));
              setAlimentosBuscados([...locais, ...novos]);
            }
          } catch (e2) {
            console.warn('[Diário] Erro ao buscar alimentos externamente:', err?.message);
          }
        } finally {
          setBuscandoExterna(false);
        }
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [busca]);

  // ───────────────────────────────────────────────────────────
  // ↓ Navegação de data (bloqueada para dias futuros)
  // ───────────────────────────────────────────────────────────
  const mudarData = (dias) => {
    if (dias > 0 && ehHoje) return;

    const novaData = new Date(dataSelecionada);
    novaData.setDate(novaData.getDate() + dias);

    const hojeZero = new Date();
    hojeZero.setHours(0, 0, 0, 0);
    const novaDataZero = new Date(novaData);
    novaDataZero.setHours(0, 0, 0, 0);

    if (novaDataZero > hojeZero) return;

    setDataSelecionada(novaData);
  };

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
        typeof idAlimentoReal === 'string' && (idAlimentoReal.startsWith('p') || !idAlimentoReal.includes('-'));

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
      <View style={styles.cardRefeicao} key={tipo}>
        <View style={styles.headerRefeicao}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <IconeComp size={20} color={CORES.textoEscuro} />
            <Text style={[styles.refeicaoTituloTexto, { marginLeft: 10 }]}>
              {config.titulo}  •  <Text style={{ fontWeight: 'normal', fontSize: 13, color: CORES.textoSuave }}>{calsTipo} kcal</Text>
            </Text>
          </View>
          
          {/* Botão + funcional para abrir modal */}
          <TouchableOpacity 
            style={styles.botaoAddRefeicao}
            onPress={() => abrirModalAdicionar(tipo)}
            activeOpacity={0.7}
          >
            <Plus size={16} color={CORES.primaria} />
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
                style={[styles.linhaAlimento, idx === todosItens.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.nomeAlimento}>{alimentoNome}</Text>
                  <Text style={styles.detalheAlimento}>
                    {qtdG}g  •  P{prot}g  C{carb}g  G{gord}g
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.caloriaAlimento}>{cal} <Text style={styles.kcalMini}>kcal</Text></Text>
                  
                  {/* Botão de remover item */}
                  <TouchableOpacity 
                    style={styles.btnRemoverItem}
                    onPress={() => removerItem(item.id_refeicao_item || item.id_item_refeicao)}
                  >
                    <Trash2 size={15} color="#EB5757" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.textoVazioRefeicao}>
            Nenhum alimento registrado.
          </Text>
        )}
      </View>
    );
  };

  // Filtragem dos alimentos na busca do modal
  const alimentosFiltrados = ALIMENTOS_PREDEFINIDOS.filter(a => 
    a.nome_alimento.toLowerCase().includes(busca.toLowerCase())
  );

  // Cálculo prévio dos macros do alimento selecionado no modal com base na quantidade
  const fatorModal = alimentoSelecionado ? (parseFloat(quantidadeG.replace(',', '.')) || 100) / (alimentoSelecionado.porcao_padrao_g || 100) : 1;
  const calModal = alimentoSelecionado ? Math.round((alimentoSelecionado.calorias || 0) * fatorModal) : 0;
  const protModal = alimentoSelecionado ? Math.round((alimentoSelecionado.proteinas || 0) * fatorModal) : 0;
  const carbModal = alimentoSelecionado ? Math.round((alimentoSelecionado.carboidratos || 0) * fatorModal) : 0;
  const gordModal = alimentoSelecionado ? Math.round((alimentoSelecionado.gorduras || 0) * fatorModal) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        refreshControl={
          <RefreshControl 
            refreshing={atualizando} 
            onRefresh={() => carregarDados(true)}
            colors={[CORES.primaria]}
            tintColor={CORES.primaria}
          />
        }
      >
        
        {/* Cabeçalho Seletor de Data */}
        <View style={styles.seletorDataContainer}>
          <TouchableOpacity 
            style={styles.setaData} 
            onPress={() => mudarData(-1)} 
            activeOpacity={0.7}
          >
            <ChevronLeft size={18} color={CORES.textoEscuro} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.textoHoje}>{ehHoje ? 'Hoje' : `${diaDoMes} ${mes}`}</Text>
            <Text style={styles.textoDataDetalhe}>{`${diaDaSemana}, ${diaDoMes} de ${mes} de ${ano}`}</Text>
          </View>
          <TouchableOpacity 
            style={[styles.setaData, ehHoje && styles.setaDataDesabilitada]} 
            onPress={() => mudarData(1)} 
            disabled={ehHoje}
            activeOpacity={ehHoje ? 1 : 0.7}
          >
            <ChevronRight 
              size={18} 
              color={ehHoje ? 'rgba(0, 0, 0, 0.25)' : CORES.textoEscuro} 
              strokeWidth={2.5} 
            />
          </TouchableOpacity>
        </View>

        {/* Loading */}
        {carregando && (
          <View style={{ alignItems: 'center', padding: 12 }}>
            <ActivityIndicator size="small" color={CORES.primaria} />
          </View>
        )}

        {/* Resumo Superior Expandido */}
        <View style={styles.cardResumo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.tituloResumo}>RESUMO</Text>
            <Text style={styles.caloriasResumoValor}>{totais.calorias} <Text style={{fontSize:12, fontWeight:'normal'}}>kcal</Text></Text>
          </View>
          
          <Text style={styles.macroTextoDiario}>PROTEÍNA <Text style={{color: CORES.primaria}}>{totais.proteina}/{metaProteina}g</Text></Text>
          <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: `${pctProteina}%`, backgroundColor: CORES.primaria }]} /></View>

          <Text style={styles.macroTextoDiario}>CARBOS <Text style={{color: CORES.carboidrato}}>{totais.carboidrato}/{metaCarboidrato}g</Text></Text>
          <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: `${pctCarboidrato}%`, backgroundColor: CORES.carboidrato }]} /></View>

          <Text style={styles.macroTextoDiario}>GORDURA <Text style={{color: CORES.gordura}}>{totais.gordura}/{metaGordura}g</Text></Text>
          <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: `${pctGordura}%`, backgroundColor: CORES.gordura }]} /></View>
        </View>

        {/* Blocos de refeição com botão + e itens */}
        {renderBlocoRefeicao('cafe_manha')}
        {renderBlocoRefeicao('almoco')}
        {renderBlocoRefeicao('janta')}
        {renderBlocoRefeicao('lanche')}

        {/* Bloco Hidratação com botões funcionais */}
        <View style={styles.cardConfig}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Droplets size={20} color="#2F80ED" />
              <Text style={[styles.tituloCardInterno, { marginLeft: 8 }]}>Hidratação</Text>
            </View>
            <Text style={styles.volAguaText}>
              {agua} <Text style={{ fontSize: 13, fontWeight: 'normal', color: CORES.textoSuave }}>/ {metaAgua} ml</Text>
            </Text>
          </View>
          
          <View style={styles.barraFundoAgua}>
            <View style={[styles.barraPreenchidaAgua, { width: `${Math.min((agua / metaAgua) * 100, 100)}%` }]} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 6 }}>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => adicionarAgua(150)} disabled={adicionandoAgua}>
              <Text style={styles.txtBtnAgua}>+150ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => adicionarAgua(250)} disabled={adicionandoAgua}>
              <Text style={styles.txtBtnAgua}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => adicionarAgua(350)} disabled={adicionandoAgua}>
              <Text style={styles.txtBtnAgua}>+350ml</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => adicionarAgua(500)} disabled={adicionandoAgua}>
              <Text style={styles.txtBtnAgua}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </View>

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
        <View style={styles.fundoModal}>
          <View style={styles.cardModal}>
            
            {/* Header Colorido Marrom #85461E do Modal */}
            <View style={styles.headerModalBrown}>
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
                      <Text style={styles.headerBrownMealCalorias}>
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
              <View style={{ flex: 1, backgroundColor: CORES.fundo }}>
                {/* Abas Superiores (Código de barras | Buscar) */}
                <View style={styles.containerAbasModal}>
                  <TouchableOpacity 
                    style={styles.btnAbaModal}
                    onPress={() => setTabModal('barcode')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.circuloAbaModal, tabModal === 'barcode' && styles.circuloAbaModalAtiva]}>
                      <Scale size={18} color={tabModal === 'barcode' ? CORES.primaria : CORES.textoSuave} />
                    </View>
                    <Text style={[styles.txtAbaModal, tabModal === 'barcode' && styles.txtAbaModalAtiva]}>
                      Código de{"\n"}barras
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.btnAbaModal}
                    onPress={() => setTabModal('search')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.circuloAbaModal, tabModal === 'search' && styles.circuloAbaModalAtiva]}>
                      <Search size={18} color={tabModal === 'search' ? CORES.primaria : CORES.textoSuave} />
                    </View>
                    <Text style={[styles.txtAbaModal, tabModal === 'search' && styles.txtAbaModalAtiva]}>
                      Buscar
                    </Text>
                  </TouchableOpacity>
                </View>

                {tabModal === 'barcode' ? (
                  <View style={styles.containerEmBreve}>
                    <View style={styles.circuloIconeEmBreve}>
                      <Scale size={24} color={CORES.primaria} />
                    </View>
                    <Text style={styles.txtEmBreve}>Leitor de código de barras em breve</Text>
                  </View>
                ) : (
                  <>
                    {/* Barra de Pesquisa Redonda */}
                    <View style={styles.inputBuscaWrapper}>
                      <View style={styles.inputBuscaContainer}>
                        <Search size={16} color={CORES.textoSuave} style={{ marginRight: 8 }} />
                        <TextInput 
                          style={styles.inputBusca}
                          placeholder="Buscar alimento..."
                          placeholderTextColor={CORES.textoSuave}
                          value={busca}
                          onChangeText={setBusca}
                          autoFocus
                        />
                        {buscandoExterna && (
                          <ActivityIndicator size="small" color={CORES.primaria} style={{ marginRight: 8 }} />
                        )}
                        {busca.length > 0 && !buscandoExterna && (
                          <TouchableOpacity onPress={() => setBusca('')}>
                            <X size={16} color={CORES.textoSuave} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>

                    {/* Lista de Alimentos / Estado Inicial de Busca */}
                    {busca.trim() === '' ? (
                      <View style={styles.containerBuscaVazia}>
                        <Search size={54} color="#EDD9C3" style={{ marginBottom: 16 }} />
                        <Text style={styles.txtInstrucaoBusca}>
                          Digite o nome de um alimento para buscar
                        </Text>
                      </View>
                    ) : (
                      <FlatList 
                        data={alimentosBuscados}
                        keyExtractor={(item, index) => String(item.id || item.id_alimento || item.food_id || index)}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
                        ListEmptyComponent={
                          !buscandoExterna ? (
                            <View style={styles.containerBuscaVazia}>
                              <Apple size={40} color={CORES.borda} style={{ marginBottom: 12 }} />
                              <Text style={styles.listaVaziaTexto}>
                                Nenhum alimento encontrado para "{busca}"
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.containerBuscaVazia}>
                              <ActivityIndicator size="large" color={CORES.primaria} style={{ marginBottom: 12 }} />
                              <Text style={styles.txtInstrucaoBusca}>Buscando no catálogo FatSecret...</Text>
                            </View>
                          )
                        }
                        renderItem={({ item }) => (
                          <TouchableOpacity 
                            style={styles.cardItemAlimento}
                            onPress={() => {
                              setAlimentoSelecionado(item);
                              setQuantidadeG(String(item.porcao_padrao_g || 100));
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={{ flex: 1, marginRight: 8 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Text style={styles.itemNomeTexto} numberOfLines={1}>{item.nome_alimento || item.nome}</Text>
                                {item.marca ? (
                                  <Text style={styles.badgeMarcaTexto} numberOfLines={1}> · {item.marca}</Text>
                                ) : null}
                              </View>
                              <Text style={styles.itemSubTexto}>{item.calorias || 0} kcal · por {item.porcao_padrao_g || 100}g</Text>
                            </View>
                            <View style={styles.colunaMacroBadges}>
                              <Text style={[styles.macroBadgeTexto, { color: CORES.proteina }]}>P {item.proteinas || 0}g</Text>
                              <Text style={[styles.macroBadgeTexto, { color: CORES.carboidrato }]}>C {item.carboidratos || 0}g</Text>
                              <Text style={[styles.macroBadgeTexto, { color: CORES.gordura }]}>G {item.gorduras || 0}g</Text>
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
                contentContainerStyle={{ padding: 16, paddingBottom: 25, flexGrow: 1, backgroundColor: CORES.fundo }}
              >
                {/* Card 1: Informações do Alimento Selecionado */}
                <View style={styles.cardAlimentoSelecionado}>
                  <Text style={styles.tituloAlimentoSelecionado}>{alimentoSelecionado.nome_alimento}</Text>
                  <Text style={styles.subAlimentoSelecionado}>
                    {alimentoSelecionado.calorias} kcal · por {alimentoSelecionado.porcao_padrao_g || 100}g
                  </Text>
                </View>

                {/* Card 2: Entrada da Quantidade */}
                <View style={styles.cardSecaoModal}>
                  <Text style={styles.labelSecaoModal}>QUANTIDADE</Text>
                  <View style={styles.rowInputGrande}>
                    <TextInput 
                      style={styles.inputGrandeQtd}
                      value={quantidadeG}
                      onChangeText={setQuantidadeG}
                      keyboardType="numeric"
                      autoFocus
                    />
                    <Text style={styles.unidadeGrandeTexto}>g</Text>
                  </View>
                </View>

                {/* Card 3: 4 Colunas de Valores Nutricionais */}
                <View style={styles.cardSecaoModal}>
                  <Text style={styles.labelSecaoModal}>VALORES NUTRICIONAIS</Text>
                  <View style={styles.gridQuatroColunas}>
                    <View style={styles.colunaMacroBox}>
                      <Text style={[styles.colunaMacroValor, { color: CORES.primaria }]}>{calModal}</Text>
                      <Text style={styles.colunaMacroUnidade}>kcal</Text>
                      <Text style={styles.colunaMacroLabel}>Calorias</Text>
                    </View>
                    <View style={styles.colunaMacroBox}>
                      <Text style={[styles.colunaMacroValor, { color: CORES.proteina }]}>{protModal}g</Text>
                      <Text style={styles.colunaMacroUnidade}>g</Text>
                      <Text style={styles.colunaMacroLabel}>Proteína</Text>
                    </View>
                    <View style={styles.colunaMacroBox}>
                      <Text style={[styles.colunaMacroValor, { color: CORES.carboidrato }]}>{carbModal}g</Text>
                      <Text style={styles.colunaMacroUnidade}>g</Text>
                      <Text style={styles.colunaMacroLabel}>Carbos</Text>
                    </View>
                    <View style={styles.colunaMacroBox}>
                      <Text style={[styles.colunaMacroValor, { color: CORES.gordura }]}>{gordModal}g</Text>
                      <Text style={styles.colunaMacroUnidade}>g</Text>
                      <Text style={styles.colunaMacroLabel}>Gordura</Text>
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
                    <ActivityIndicator color={CORES.branco} />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Check size={18} color={CORES.branco} style={{ marginRight: 8 }} />
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
    backgroundColor: CORES.primaria, 
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
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: '#FDF8F2', 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EADCC9',
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
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
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
    shadowColor: CORES.primaria,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnConfirmarTexto: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
});