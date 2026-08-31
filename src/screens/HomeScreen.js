import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Easing, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { HandMetal, ChevronRight, Utensils, Sun, Moon } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
const SvgCircleWrapper = React.forwardRef(({ collapsable, ...props }, ref) => (
  <Circle ref={ref} {...props} />
));
const AnimatedCircle = Animated.createAnimatedComponent(SvgCircleWrapper);
import { CORES } from '../constants/Cores';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import * as dashboardApi from '../api/dashboardApi';
import * as metaNutriApi from '../api/metaNutriApi';

function BarraSemanalAnimada({ altura, cor, diaNome, corTexto, delay = 0 }) {
  const animAltura = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(animAltura, {
        toValue: altura,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [altura, delay]);

  const heightInterpolada = animAltura.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.colunaDia}>
      <View style={styles.trilhoBarra}>
        <Animated.View
          style={{
            height: heightInterpolada,
            width: 14,
            backgroundColor: cor,
            borderRadius: 4,
          }}
        />
      </View>
      <Text style={[styles.labelDiaSemana, { color: corTexto }]}>{diaNome}</Text>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();
  const { cores, isDark, toggleTema } = useTheme();

  // ↓ Estados para dados vindos da API
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [resumoDia, setResumoDia] = useState(null);
  const [resumoSemana, setResumoSemana] = useState(null);
  const [metaAtual, setMetaAtual] = useState(null);

  // ↓ Valores derivados do usuário
  const nomeUsuario = usuario?.nome?.split(' ')[0] || 'Usuário';

  // ↓ Metas nutricionais
  const metaCalorias = resumoDia?.macros?.meta?.calorias || metaAtual?.calorias_diarias || metaAtual?.calorias_meta || 1800;
  const metaProteina = resumoDia?.macros?.meta?.proteinas || metaAtual?.proteina_g || metaAtual?.proteina_meta_g || 140;
  const metaCarboidrato = resumoDia?.macros?.meta?.carboidratos || metaAtual?.carboidrato_g || metaAtual?.carboidrato_meta_g || 180;
  const metaGordura = resumoDia?.macros?.meta?.gorduras || metaAtual?.gordura_g || metaAtual?.gordura_meta_g || 55;

  // ↓ Consumo do dia (dados reais da API)
  const caloriasConsumidas = Math.round(resumoDia?.macros?.consumido?.calorias || 0);
  const caloriasRestantes = Math.max(metaCalorias - caloriasConsumidas, 0);
  const proteinaConsumida = Math.round(resumoDia?.macros?.consumido?.proteinas || 0);
  const carboidratoConsumido = Math.round(resumoDia?.macros?.consumido?.carboidratos || 0);
  const gorduraConsumida = Math.round(resumoDia?.macros?.consumido?.gorduras || 0);

  // ↓ Porcentagens das barras
  const pctProteina = metaProteina > 0 ? Math.min((proteinaConsumida / metaProteina) * 100, 100) : 0;
  const pctCarboidrato = metaCarboidrato > 0 ? Math.min((carboidratoConsumido / metaCarboidrato) * 100, 100) : 0;
  const pctGordura = metaGordura > 0 ? Math.min((gorduraConsumida / metaGordura) * 100, 100) : 0;

  // ↓ Animação das barras de macros
  const animBarraProteina = useRef(new Animated.Value(0)).current;
  const animBarraCarboidrato = useRef(new Animated.Value(0)).current;
  const animBarraGordura = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animBarraProteina, { toValue: pctProteina, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(animBarraCarboidrato, { toValue: pctCarboidrato, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(animBarraGordura, { toValue: pctGordura, duration: 1500, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [pctProteina, pctCarboidrato, pctGordura]);

  const larguraBarraProteina = animBarraProteina.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const larguraBarraCarboidrato = animBarraCarboidrato.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });
  const larguraBarraGordura = animBarraGordura.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'], extrapolate: 'clamp' });

  // ↓ Anel Circular de Calorias SVG
  const tamanhoAnel = 114;
  const espessuraAnel = 8;
  const raioAnel = (tamanhoAnel - espessuraAnel) / 2;
  const circunferenciaAnel = 2 * Math.PI * raioAnel;
  const progressoCalorias = metaCalorias > 0 ? Math.min(Math.max(caloriasConsumidas / metaCalorias, 0), 1) : 0;

  const animProgressoCalorias = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgressoCalorias, {
      toValue: progressoCalorias,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [progressoCalorias]);

  const offsetAnelAnimado = animProgressoCalorias.interpolate({
    inputRange: [0, 1],
    outputRange: [circunferenciaAnel, 0],
    extrapolate: 'clamp',
  });

  // ↓ Distribuição de macros
  const totalMacrosG = proteinaConsumida + carboidratoConsumido + gorduraConsumida;
  const distProteina = totalMacrosG > 0 ? Math.round((proteinaConsumida / totalMacrosG) * 100) : 0;
  const distCarboidrato = totalMacrosG > 0 ? Math.round((carboidratoConsumido / totalMacrosG) * 100) : 0;
  const distGordura = totalMacrosG > 0 ? Math.round((gorduraConsumida / totalMacrosG) * 100) : 0;

  // ↓ Dados do gráfico semanal
  const diasDaSemanaAbrev = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hoje = new Date();
  const ultimos7DiasPadrao = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(hoje.getDate() - (6 - i));
    const ano = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    return {
      data: `${ano}-${mes}-${dia}`,
      diaNome: diasDaSemanaAbrev[d.getDay()],
      calorias: 0,
      percentual: 0,
    };
  });

  const diasSemana = (resumoSemana?.dias && resumoSemana.dias.length > 0)
    ? resumoSemana.dias.map(d => {
        const partes = d.data.split('-');
        const dataObj = new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
        return {
          ...d,
          diaNome: diasDaSemanaAbrev[dataObj.getDay()] || '—',
          altura: metaCalorias > 0 ? Math.min((d.calorias / metaCalorias) * 100, 100) : 0,
        };
      })
    : ultimos7DiasPadrao.map(d => ({ ...d, altura: 0 }));

  const somaCaloriasSemana = diasSemana.reduce((acc, curr) => acc + (curr.calorias || 0), 0);
  const mediaSemanal = Math.round(somaCaloriasSemana / 7);

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
      } else if (!resumoDia) {
        setCarregando(true);
      }

      const [resDia, resSemana, resMeta] = await Promise.allSettled([
        dashboardApi.resumoDia(usuario.id_usuario),
        dashboardApi.resumoSemana(usuario.id_usuario),
        metaNutriApi.metaAtual(usuario.id_usuario),
      ]);

      if (resDia.status === 'fulfilled') setResumoDia(resDia.value);
      if (resSemana.status === 'fulfilled') setResumoSemana(resSemana.value);
      if (resMeta.status === 'fulfilled') setMetaAtual(resMeta.value);
    } catch (error) {
      console.warn('[HomeScreen] Erro ao carregar dados:', error?.message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [usuario?.id_usuario]);

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

  const fadeHeader = animEntrada.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1] });
  const slideHeader = animEntrada.interpolate({ inputRange: [0, 1], outputRange: [-35, 0], extrapolate: 'clamp' });

  const fadeCard1 = animEntrada.interpolate({ inputRange: [0.1, 0.8], outputRange: [0, 1] });
  const slideCard1 = animEntrada.interpolate({ inputRange: [0.1, 1], outputRange: [35, 0], extrapolate: 'clamp' });

  const fadeCard2 = animEntrada.interpolate({ inputRange: [0.2, 0.9], outputRange: [0, 1] });
  const slideCard2 = animEntrada.interpolate({ inputRange: [0.2, 1], outputRange: [-35, 0], extrapolate: 'clamp' });

  const fadeCard3 = animEntrada.interpolate({ inputRange: [0.3, 1], outputRange: [0, 1] });
  const slideCard3 = animEntrada.interpolate({ inputRange: [0.3, 1], outputRange: [35, 0], extrapolate: 'clamp' });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <ScrollView 
        contentContainerStyle={styles.containerScroll}
        refreshControl={
          <RefreshControl 
            refreshing={atualizando} 
            onRefresh={() => carregarDados(true)}
            colors={[cores.primaria]}
            tintColor={cores.primaria}
          />
        }
      >
        
        {/* Header com Saudação */}
        <Animated.View style={[styles.header, { opacity: fadeHeader, transform: [{ translateX: slideHeader }] }]}>
          <View>
            <Text style={[styles.textoOla, { color: cores.textoEscuro }]}>Olá,</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.textoNome, { color: cores.textoEscuro }]}>{nomeUsuario}</Text>
              <HandMetal color={cores.textoEscuro} size={26} style={{ marginLeft: 8 }} />
            </View>
          </View>
        </Animated.View>

        {/* Loading inicial (apenas quando não há dados em memória) */}
        {carregando && !resumoDia && (
          <View style={{ alignItems: 'center', padding: 16 }}>
            <ActivityIndicator size="small" color={cores.primaria} />
          </View>
        )}

        {/* Card do Resumo de Hoje (clicável -> vai para Diário) */}
        <Animated.View style={{ opacity: fadeCard1, transform: [{ translateX: slideCard1 }] }}>
        <TouchableOpacity 
          style={[styles.cardGeral, { backgroundColor: cores.branco, borderColor: cores.borda }]} 
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('Diário')}
        >
          <View style={styles.rowMeta}>
            <Text style={[styles.subMeta, { color: cores.textoSuave }]}>HOJE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[styles.subMeta, { color: cores.textoSuave }]}>Meta <Text style={{fontWeight:'bold', color: cores.primaria}}>{metaCalorias} kcal</Text></Text>
              <ChevronRight size={14} color={cores.textoSuave} style={{ marginLeft: 4 }} />
            </View>
          </View>

          <View style={[styles.row, { alignItems: 'center', marginTop: 15 }]}>

            {/* ─────────────────────────────────────────────────────────── */}
            {/* ↓ RODA DE CALORIAS REAL (SVG DINÂMICO BASEADO NO CONSUMO) */}
            {/* ─────────────────────────────────────────────────────────── */}
            <View style={[styles.containerAnel, { width: tamanhoAnel, height: tamanhoAnel }]}>
              <Svg width={tamanhoAnel} height={tamanhoAnel} style={styles.svgAnel}>
                {/* Trilho de fundo (mesmo tom suave das barras de macros) */}
                <Circle
                  cx={tamanhoAnel / 2}
                  cy={tamanhoAnel / 2}
                  r={raioAnel}
                  stroke={isDark ? '#2C2C2C' : '#F0E4D4'}
                  strokeWidth={espessuraAnel}
                  fill="none"
                />
                {/* Arco de progresso dinâmico animado */}
                <AnimatedCircle
                  cx={tamanhoAnel / 2}
                  cy={tamanhoAnel / 2}
                  r={raioAnel}
                  stroke={cores.primaria}
                  strokeWidth={espessuraAnel}
                  strokeDasharray={`${circunferenciaAnel} ${circunferenciaAnel}`}
                  strokeDashoffset={offsetAnelAnimado}
                  strokeLinecap="round"
                  fill="none"
                  transform={`rotate(-90 ${tamanhoAnel / 2} ${tamanhoAnel / 2})`}
                />
              </Svg>

              {/* Informações centrais */}
              <Text style={[styles.anelNumero, { color: cores.textoEscuro }]}>{caloriasConsumidas}</Text>
              <Text style={[styles.anelLegenda, { color: cores.textoSuave }]}>kcal</Text>
              <Text style={[styles.anelSubText, { color: cores.textoSuave }]}>{caloriasRestantes} rest.</Text>
            </View>

            {/* Barras de Macro Horizontais */}
            <View style={{ flex: 1, marginLeft: 18 }}>
              <Text style={[styles.macroTitulo, { color: cores.textoEscuro }]}>PROTEÍNA <Text style={{color: cores.primaria}}>{proteinaConsumida}/{metaProteina}g</Text></Text>
              <View style={[styles.barraFundo, { backgroundColor: isDark ? '#2C2C2C' : '#F0E4D4' }]}>
                <Animated.View style={[styles.barraPreenchida, { width: larguraBarraProteina, backgroundColor: cores.primaria }]} />
              </View>

              <Text style={[styles.macroTitulo, { color: cores.textoEscuro }]}>CARBOS <Text style={{color: cores.carboidrato}}>{carboidratoConsumido}/{metaCarboidrato}g</Text></Text>
              <View style={[styles.barraFundo, { backgroundColor: isDark ? '#2C2C2C' : '#F0E4D4' }]}>
                <Animated.View style={[styles.barraPreenchida, { width: larguraBarraCarboidrato, backgroundColor: cores.carboidrato }]} />
              </View>

              <Text style={[styles.macroTitulo, { color: cores.textoEscuro }]}>GORDURA <Text style={{color: cores.gordura}}>{gorduraConsumida}/{metaGordura}g</Text></Text>
              <View style={[styles.barraFundo, { backgroundColor: isDark ? '#2C2C2C' : '#F0E4D4' }]}>
                <Animated.View style={[styles.barraPreenchida, { width: larguraBarraGordura, backgroundColor: cores.gordura }]} />
              </View>
            </View>

          </View>

          {/* Mini Cards Inline */}
          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}>
            <View style={[styles.miniCardInfo, { backgroundColor: isDark ? '#252525' : '#FDF8F2' }]}>
              <Text style={[styles.miniCardNumero, { color: cores.textoEscuro }]}>{metaCalorias}</Text>
              <Text style={[styles.miniCardRotulo, { color: cores.textoSuave }]}>Meta</Text>
            </View>
            <View style={[styles.miniCardInfo, { backgroundColor: isDark ? '#252525' : '#FDF8F2' }]}>
              <Text style={[styles.miniCardNumero, { color: cores.textoEscuro }]}>{caloriasConsumidas}</Text>
              <Text style={[styles.miniCardRotulo, { color: cores.textoSuave }]}>Consumido</Text>
            </View>
            <View style={[styles.miniCardInfo, { backgroundColor: isDark ? '#252525' : '#FDF8F2' }]}>
              <Text style={[styles.miniCardNumero, { color: cores.textoEscuro }]}>{caloriasRestantes}</Text>
              <Text style={[styles.miniCardRotulo, { color: cores.textoSuave }]}>Restante</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botão de Atalho Rápido para o Diário */}
        <TouchableOpacity 
          style={styles.botaoAcaoRapida} 
          onPress={() => navigation?.navigate('Diário')}
          activeOpacity={0.8}
        >
          <Utensils size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.botaoAcaoRapidaTexto}>Registrar no Diário Alimentar</Text>
        </TouchableOpacity>
        </Animated.View>

        {/* Bloco Distribuição de Macros */}
        <Animated.View style={{ opacity: fadeCard2, transform: [{ translateX: slideCard2 }] }}>
        <Text style={[styles.secaoTitulo, { color: cores.textoSuave }]}>DISTRIBUIÇÃO DE MACROS</Text>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={[styles.cardMacroItem, { backgroundColor: cores.branco }]}>
            <View style={[styles.pontoIndicador, { backgroundColor: cores.primaria }]} />
            <Text style={[styles.itemMacroValor, { color: cores.textoEscuro }]}>{proteinaConsumida}g</Text>
            <Text style={[styles.itemMacroNome, { color: cores.textoSuave }]}>Proteína</Text>
            <Text style={[styles.itemMacroPorcentagem, { color: cores.textoSuave }]}>{distProteina}%</Text>
          </View>
          <View style={[styles.cardMacroItem, { backgroundColor: cores.branco }]}>
            <View style={[styles.pontoIndicador, { backgroundColor: cores.carboidrato }]} />
            <Text style={[styles.itemMacroValor, { color: cores.textoEscuro }]}>{carboidratoConsumido}g</Text>
            <Text style={[styles.itemMacroNome, { color: cores.textoSuave }]}>Carbos</Text>
            <Text style={[styles.itemMacroPorcentagem, { color: cores.textoSuave }]}>{distCarboidrato}%</Text>
          </View>
          <View style={[styles.cardMacroItem, { backgroundColor: cores.branco }]}>
            <View style={[styles.pontoIndicador, { backgroundColor: cores.gordura }]} />
            <Text style={[styles.itemMacroValor, { color: cores.textoEscuro }]}>{gorduraConsumida}g</Text>
            <Text style={[styles.itemMacroNome, { color: cores.textoSuave }]}>Gordura</Text>
            <Text style={[styles.itemMacroPorcentagem, { color: cores.textoSuave }]}>{distGordura}%</Text>
          </View>
        </View>
        </Animated.View>

        {/* Bloco Histórico Semanal */}
        <Animated.View style={{ opacity: fadeCard3, transform: [{ translateX: slideCard3 }] }}>
        <Text style={[styles.secaoTitulo, { color: cores.textoSuave }]}>HISTÓRICO SEMANAL</Text>
        <View style={[styles.cardGeral, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
          <View style={styles.containerGrafico}>
            <Text style={{color: cores.textoSuave, fontStyle: 'italic', fontSize: 13}}> Gráfico Evolutivo (últimos 7 dias) </Text>
            
            <View style={styles.areaGraficoBarras}>
              <View style={styles.linhaGraficoBarras}>
                {diasSemana.map((item, index) => {
                  const alturaBarra = item.calorias > 0 
                    ? Math.max(Math.min((item.calorias / metaCalorias) * 100, 100), 10)
                    : 4;
                  
                  const corBarra = item.calorias > 0 ? cores.primaria : (isDark ? '#2C2C2C' : '#F0E4D4');

                  return (
                    <BarraSemanalAnimada
                      key={item.data || index}
                      altura={alturaBarra}
                      cor={corBarra}
                      diaNome={item.diaNome}
                      corTexto={cores.textoSuave}
                      delay={index * 110}
                    />
                  );
                })}
              </View>
            </View>
          </View>

          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 14, borderTopWidth: 1, borderColor: cores.borda, paddingTop: 10 }]}>
            <Text style={[styles.legendaGrafico, { color: cores.textoSuave }]}>Meta: {metaCalorias} kcal/dia</Text>
            <Text style={[styles.legendaGrafico, { color: cores.textoSuave }]}>Média: <Text style={{color: cores.primaria, fontWeight:'bold'}}>{mediaSemanal} kcal</Text></Text>
          </View>
        </View>
        </Animated.View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerScroll: { padding: 20, paddingBottom: 40 },
  header: { 
    marginBottom: 20, 
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  btnTema: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  txtBtnTema: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  textoOla: { 
    fontSize: 18, 
    color: CORES.textoEscuro 
  },
  textoNome: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  cardGeral: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 16,
    borderWidth: 1,
  },
  rowMeta: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subMeta: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: CORES.textoSuave, 
    letterSpacing: 0.5 
  },
  row: { 
    flexDirection: 'row', 
    marginBottom: 12
  },
  containerAnel: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  svgAnel: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  anelNumero: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  anelLegenda: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginTop: -2 
  },
  anelSubText: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginTop: 4, 
    fontWeight: '500' 
  },
  macroTitulo: { 
    fontSize: 11, 
    fontWeight: 'bold',
    color: CORES.textoEscuro, 
    marginTop: 8, 
    marginBottom: 4 
  },
  barraFundo: { 
    height: 7, 
    backgroundColor: '#F0E4D4', 
    borderRadius: 4,
    overflow: 'hidden',
    width: '100%',
    marginVertical: 2,
  },
  barraPreenchida: { 
    height: '100%', 
    minHeight: 7,
    borderRadius: 4,
  },
  miniCardInfo: { 
    flex: 1, 
    backgroundColor: '#FDF8F2', 
    padding: 10, 
    borderRadius: 16, 
    alignItems: 'center', 
    marginHorizontal: 4 
  },
  miniCardNumero: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  miniCardRotulo: { 
    fontSize: 11, 
    color: CORES.textoSuave 
  },
  botaoAcaoRapida: {
    backgroundColor: CORES.primaria,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    elevation: 2,
  },
  botaoAcaoRapidaTexto: {
    color: CORES.branco,
    fontSize: 15,
    fontWeight: 'bold',
  },
  secaoTitulo: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: CORES.textoSuave, 
    marginBottom: 12, 
    letterSpacing: 1 
  },
  cardMacroItem: { 
    width: '31%', 
    backgroundColor: CORES.branco, 
    borderRadius: 20, 
    padding: 14, 
    alignItems: 'center',
    marginBottom: 20,
  },
  pontoIndicador: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginBottom: 8 
  },
  itemMacroValor: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
  },
  itemMacroNome: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginVertical: 2 
  },
  itemMacroPorcentagem: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: CORES.textoSuave 
  },
  containerGrafico: { 
    alignItems: 'center', 
    paddingVertical: 6 
  },
  areaGraficoBarras: {
    height: 90, 
    width: '100%', 
    marginTop: 15, 
    justifyContent: 'flex-end',
  },
  linhaGraficoBarras: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-end', 
    height: '100%', 
    paddingHorizontal: 6,
  },
  colunaDia: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trilhoBarra: {
    height: 65,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  labelDiaSemana: {
    fontSize: 10,
    color: CORES.textoSuave,
    marginTop: 6,
    fontWeight: '600',
  },
  legendaGrafico: { 
    fontSize: 12, 
    color: CORES.textoSuave 
  }
});