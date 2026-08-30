import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { HandMetal, ChevronRight, Utensils } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import { CORES } from '../constants/Cores';
import useAuth from '../hooks/useAuth';
import * as dashboardApi from '../api/dashboardApi';
import * as metaNutriApi from '../api/metaNutriApi';

export default function HomeScreen({ navigation }) {
  const { usuario } = useAuth();

  // ↓ Estados para dados vindos da API.
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [resumoDia, setResumoDia] = useState(null);
  const [resumoSemana, setResumoSemana] = useState(null);
  const [metaAtual, setMetaAtual] = useState(null);

  // ↓ Valores derivados do usuário
  const nomeUsuario = usuario?.nome?.split(' ')[0] || 'Usuário';

  // ↓ Metas nutricionais
  const metaCalorias = resumoDia?.macros?.meta?.calorias || metaAtual?.calorias_meta || 1800;
  const metaProteina = resumoDia?.macros?.meta?.proteinas || metaAtual?.proteina_meta_g || 140;
  const metaCarboidrato = resumoDia?.macros?.meta?.carboidratos || metaAtual?.carboidrato_meta_g || 180;
  const metaGordura = resumoDia?.macros?.meta?.gorduras || metaAtual?.gordura_meta_g || 55;

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

  // ↓ Parâmetros para a Roda de Calorias (SVG Circular Progress)
  const tamanhoAnel = 114;
  const espessuraAnel = 8;
  const raioAnel = (tamanhoAnel - espessuraAnel) / 2;
  const circunferenciaAnel = 2 * Math.PI * raioAnel;
  const progressoCalorias = metaCalorias > 0 ? Math.min(Math.max(caloriasConsumidas / metaCalorias, 0), 1) : 0;
  const offsetAnel = circunferenciaAnel * (1 - progressoCalorias);

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
      } else {
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

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView 
        contentContainerStyle={styles.containerScroll}
        refreshControl={
          <RefreshControl 
            refreshing={atualizando} 
            onRefresh={() => carregarDados(true)}
            colors={[CORES.primaria]}
            tintColor={CORES.primaria}
          />
        }
      >
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.textoOla}>Olá,</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.textoNome}>{nomeUsuario}</Text>
            <HandMetal color={CORES.textoEscuro} size={26} style={{ marginLeft: 8 }} />
          </View>
        </View>

        {/* Loading inicial */}
        {carregando && (
          <View style={{ alignItems: 'center', padding: 16 }}>
            <ActivityIndicator size="small" color={CORES.primaria} />
          </View>
        )}

        {/* Card do Resumo de Hoje (clicável -> vai para Diário) */}
        <TouchableOpacity 
          style={styles.cardGeral} 
          activeOpacity={0.85}
          onPress={() => navigation?.navigate('Diário')}
        >
          <View style={styles.rowMeta}>
            <Text style={styles.subMeta}>HOJE</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.subMeta}>Meta <Text style={{fontWeight:'bold', color: CORES.primaria}}>{metaCalorias} kcal</Text></Text>
              <ChevronRight size={14} color={CORES.textoSuave} style={{ marginLeft: 4 }} />
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
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth={espessuraAnel}
                  fill="none"
                />
                {/* Arco de progresso dinâmico */}
                {progressoCalorias > 0 && (
                  <Circle
                    cx={tamanhoAnel / 2}
                    cy={tamanhoAnel / 2}
                    r={raioAnel}
                    stroke={CORES.primaria}
                    strokeWidth={espessuraAnel}
                    strokeDasharray={`${circunferenciaAnel} ${circunferenciaAnel}`}
                    strokeDashoffset={offsetAnel}
                    strokeLinecap="round"
                    fill="none"
                    transform={`rotate(-90 ${tamanhoAnel / 2} ${tamanhoAnel / 2})`}
                  />
                )}
              </Svg>

              {/* Informações centrais */}
              <Text style={styles.anelNumero}>{caloriasConsumidas}</Text>
              <Text style={styles.anelLegenda}>kcal</Text>
              <Text style={styles.anelSubText}>{caloriasRestantes} rest.</Text>
            </View>

            {/* Barras de Macro Horizontais */}
            <View style={{ flex: 1, marginLeft: 18 }}>
              <Text style={styles.macroTitulo}>PROTEÍNA <Text style={{color: CORES.primaria}}>{proteinaConsumida}/{metaProteina}g</Text></Text>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: `${pctProteina}%`, backgroundColor: CORES.primaria }]} />
              </View>

              <Text style={styles.macroTitulo}>CARBOS <Text style={{color: CORES.carboidrato}}>{carboidratoConsumido}/{metaCarboidrato}g</Text></Text>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: `${pctCarboidrato}%`, backgroundColor: CORES.carboidrato }]} />
              </View>

              <Text style={styles.macroTitulo}>GORDURA <Text style={{color: CORES.gordura}}>{gorduraConsumida}/{metaGordura}g</Text></Text>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: `${pctGordura}%`, backgroundColor: CORES.gordura }]} />
              </View>
            </View>

          </View>

          {/* Mini Cards Inline */}
          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}>
            <View style={styles.miniCardInfo}>
              <Text style={styles.miniCardNumero}>{metaCalorias}</Text>
              <Text style={styles.miniCardRotulo}>Meta</Text>
            </View>
            <View style={styles.miniCardInfo}>
              <Text style={styles.miniCardNumero}>{caloriasConsumidas}</Text>
              <Text style={styles.miniCardRotulo}>Consumido</Text>
            </View>
            <View style={styles.miniCardInfo}>
              <Text style={styles.miniCardNumero}>{caloriasRestantes}</Text>
              <Text style={styles.miniCardRotulo}>Restante</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Botão de Atalho Rápido para o Diário */}
        <TouchableOpacity 
          style={styles.botaoAcaoRapida} 
          onPress={() => navigation?.navigate('Diário')}
          activeOpacity={0.8}
        >
          <Utensils size={18} color={CORES.branco} style={{ marginRight: 8 }} />
          <Text style={styles.botaoAcaoRapidaTexto}>Registrar no Diário Alimentar</Text>
        </TouchableOpacity>

        {/* Bloco Distribuição de Macros */}
        <Text style={styles.secaoTitulo}>DISTRIBUIÇÃO DE MACROS</Text>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={styles.cardMacroItem}>
            <View style={[styles.pontoIndicador, { backgroundColor: CORES.primaria }]} />
            <Text style={styles.itemMacroValor}>{proteinaConsumida}g</Text>
            <Text style={styles.itemMacroNome}>Proteína</Text>
            <Text style={styles.itemMacroPorcentagem}>{distProteina}%</Text>
          </View>
          <View style={styles.cardMacroItem}>
            <View style={[styles.pontoIndicador, { backgroundColor: CORES.carboidrato }]} />
            <Text style={styles.itemMacroValor}>{carboidratoConsumido}g</Text>
            <Text style={styles.itemMacroNome}>Carbos</Text>
            <Text style={styles.itemMacroPorcentagem}>{distCarboidrato}%</Text>
          </View>
          <View style={styles.cardMacroItem}>
            <View style={[styles.pontoIndicador, { backgroundColor: CORES.gordura }]} />
            <Text style={styles.itemMacroValor}>{gorduraConsumida}g</Text>
            <Text style={styles.itemMacroNome}>Gordura</Text>
            <Text style={styles.itemMacroPorcentagem}>{distGordura}%</Text>
          </View>
        </View>

        {/* Bloco Histórico Semanal */}
        <Text style={styles.secaoTitulo}>HISTÓRICO SEMANAL</Text>
        <View style={styles.cardGeral}>
          <View style={styles.containerGrafico}>
            <Text style={{color: CORES.textoSuave, fontStyle: 'italic', fontSize: 13}}> Gráfico Evolutivo (últimos 7 dias) </Text>
            
            <View style={styles.areaGraficoBarras}>
              <View style={styles.linhaGraficoBarras}>
                {diasSemana.map((item, index) => {
                  const alturaBarra = item.calorias > 0 
                    ? Math.max(Math.min((item.calorias / metaCalorias) * 100, 100), 10)
                    : 4;
                  
                  const corBarra = item.calorias > 0 ? CORES.primaria : 'rgba(255, 255, 255, 0.12)';

                  return (
                    <View key={index} style={styles.colunaDia}>
                      <View style={styles.trilhoBarra}>
                        <View 
                          style={{
                            height: `${alturaBarra}%`, 
                            width: 14, 
                            backgroundColor: corBarra, 
                            borderRadius: 4
                          }} 
                        />
                      </View>
                      <Text style={styles.labelDiaSemana}>{item.diaNome}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 14, borderTopWidth: 1, borderColor: '#F5EAE0', paddingTop: 10 }]}>
            <Text style={styles.legendaGrafico}>Meta: {metaCalorias} kcal/dia</Text>
            <Text style={styles.legendaGrafico}>Média: <Text style={{color: CORES.primaria, fontWeight:'bold'}}>{mediaSemanal} kcal</Text></Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerScroll: { padding: 20, paddingBottom: 40 },
  header: { 
    marginBottom: 20, 
    marginTop: 10
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
    marginBottom: 16 
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
    height: 6, 
    backgroundColor: '#F0E4D4', 
    borderRadius: 3 
  },
  barraPreenchida: { 
    height: '100%', 
    borderRadius: 3 
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