import React from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView } from 'react-native';
import {HandMetal} from 'lucide-react-native';
import { CORES } from '../constants/Cores';

export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView contentContainerStyle={styles.containerScroll}>
        
        <View style={styles.header}>
          <Text style={styles.textoOla}>Olá,</Text>
          {/* ↓ Aqui substituirá Reinaldo pela entrada do nome do usuário. */}
          <Text style={styles.textoNome}>Reginaldo <HandMetal/></Text> 
          
        </View>

        {/* ↓ Card do Resumo de Hoje. */}
        <View style={styles.cardGeral}>
          <View style={styles.rowMeta}>
            <Text style={styles.subMeta}>HOJE</Text>
            <Text style={styles.subMeta}>Meta <Text style={{fontWeight:'bold', color: CORES.primaria}}>1800 kcal</Text></Text>
          </View>

          <View style={[styles.row, { alignItems: 'center', marginTop: 15 }]}>

            {/* ↓ Anel de Calorias Centra.l */}
            <View style={styles.anelCalorias}>
              <Text style={styles.anelNumero}>1112</Text>
              <Text style={styles.anelLegenda}>kcal</Text>
              <Text style={styles.anelSubText}>688 rest.</Text>
            </View>

            {/* ↓ Barras de Macro Horizontais Rápidas. */}
            <View style={{ flex: 1, marginLeft: 20 }}>

              <Text style={styles.macroTitulo}>PROTEÍNA <Text style={{color: CORES.primaria}}>94/140g</Text></Text>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: '67%', backgroundColor: CORES.primaria }]} />
              </View>

              <Text style={styles.macroTitulo}>CARBOS <Text style={{color: CORES.carboidrato}}>129/180g</Text></Text>
              <View style={styles.barraFundo}>
                <View style={[styles.barraPreenchida, { width: '71%', backgroundColor: CORES.carboidrato }]} />
              </View>

              <Text style={styles.macroTitulo}>GORDURA <Text style={{color: CORES.gordura}}>25/55g</Text></Text>
              <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: '45%', backgroundColor: CORES.gordura }]} />
              </View>
            </View>

          </View>

          {/* ↓ Mini Cards Inline. */}
          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}>
            <View style={styles.miniCardInfo}>
              <Text style={styles.miniCardNumero}>1800</Text>
              <Text style={styles.miniCardRotulo}>Meta</Text>
            </View>
            <View style={styles.miniCardInfo}>
              <Text style={styles.miniCardNumero}>1112</Text>
              <Text style={styles.miniCardRotulo}>Consumido</Text>
            </View>
            <View style={styles.miniCardInfo}>
              <Text style={styles.miniCardNumero}>688</Text>
              <Text style={styles.miniCardRotulo}>Restante</Text>
            </View>
          </View>
        </View>

        {/* ↓ Bloco Distribuição de Macros. */}
        <Text style={styles.secaoTitulo}>DISTRIBUIÇÃO DE MACROS</Text>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={styles.cardMacroItem}>
            <View style={[styles.pontoIndicador, { backgroundColor: CORES.primaria }]} />
            <Text style={styles.itemMacroValor}>94g</Text>
            <Text style={styles.itemMacroNome}>Proteína</Text>
            <Text style={styles.itemMacroPorcentagem}>33%</Text>
          </View>
          <View style={styles.cardMacroItem}>
            <View style={[styles.pontoIndicador, { backgroundColor: CORES.carboidrato }]} />
            <Text style={styles.itemMacroValor}>129g</Text>
            <Text style={styles.itemMacroNome}>Carbos</Text>
            <Text style={styles.itemMacroPorcentagem}>46%</Text>
          </View>
          <View style={styles.cardMacroItem}>
            <View style={[styles.pontoIndicador, { backgroundColor: CORES.gordura }]} />
            <Text style={styles.itemMacroValor}>25g</Text>
            <Text style={styles.itemMacroNome}>Gordura</Text>
            <Text style={styles.itemMacroPorcentagem}>20%</Text>
          </View>
        </View>

        {/* ↓ Bloco Histórico Semanal Mockado (falso, só pra teste). */}
        <Text style={styles.secaoTitulo}>HISTÓRICO SEMANAL</Text>
        <View style={styles.cardGeral}>
          <View style={styles.containerGraficoFalso}>
            <Text style={{color: CORES.textoSuave, fontStyle: 'italic', fontSize: 13}}> Gráfico Evolutivo (Ter - Seg) </Text>
            <View style={{height: 60, width: '100%', borderBottomWidth: 1, borderColor: CORES.borda, marginTop: 10, justifyContent: 'flex-end'}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', paddingHorizontal: 10}}>
                {/* ↓ Barras do Mini Gráfico de Barras simulando os dias */}
                <View style={{height: '10%', width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
                <View style={{height: '15%', width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
                <View style={{height: '12%', width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
                <View style={{height: '10%', width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
                <View style={{height: '8%',  width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
                <View style={{height: '85%', width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
                <View style={{height: '75%', width: 12, backgroundColor: CORES.primaria, borderRadius: 3}} />
              </View>
            </View>
          </View>
          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 12 }]}>
            <Text style={styles.legendaGrafico}>Meta: 1800 kcal/dia</Text>
            <Text style={styles.legendaGrafico}>Média: <Text style={{color: CORES.primaria, fontWeight:'bold'}}>1174 kcal</Text></Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  containerScroll: { padding: 20 },
  header: { 
    marginBottom: 20, 
    marginTop: 20
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
    marginBottom: 20 
    },
  rowMeta: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
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
  anelCalorias: { 
    width: 110, 
    height: 110, 
    borderRadius: 55, 
    borderWidth: 8, 
    borderColor: '#EADCC9', 
    borderTopColor: CORES.primaria, 
    justifyContent: 'center', 
    alignItems: 'center' 
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
    marginBottom: 4 },
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
    alignItems: 'center' 
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
  containerGraficoFalso: { 
    alignItems: 'center', 
    paddingVertical: 10 
    },
  legendaGrafico: { 
    fontSize: 12, 
    color: CORES.textoSuave 
    }
});