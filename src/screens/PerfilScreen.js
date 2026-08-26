import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Image} from 'react-native';
import { CORES } from '../constants/Cores';
import {PencilLine, BookOpenText, Flame, Target, ChartNoAxesCombined} from 'lucide-react-native';

export default function PerfilScreen({ navigation }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* ↓ Cabeçalho do Perfil com botão de Configurações. */}
        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 20}]}>
          <Text style={styles.tituloSecaoTop}>Meu Perfil</Text>
        </View>

        {/* ↓ Bloco do Usuário. */}
        <View style={styles.cardPerfilSuperior}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.avatarLetra}><Text style={styles.textoLetra}>R</Text></View>
            <View style={{ marginLeft: 15, flex: 1 }}>
              <Text style={styles.nomePerfil}>Reginaldo Patinho</Text>
              <Text style={styles.emailPerfil}>reginaldo@email.com</Text>
              <Text style={styles.subInfoPerfil}>18 anos  •  Perder peso</Text>
            </View>
            
            <TouchableOpacity style={styles.botaoEditar}>
              <PencilLine color={CORES.primaria}size={14} style={{marginRight: 5}}/>
              <Text style={styles.textoEditar}> Editar</Text>
            </TouchableOpacity>
          </View>

          {/* ↓ rid de Medidas. */}
          <View style={[styles.row, { justifyContent: 'space-between', marginTop: 20 }]}>
            <View style={styles.blocoMedida}><Text style={styles.medidaValor}>72kg</Text><Text style={styles.medidaRotulo}>Peso</Text></View>
            <View style={styles.blocoMedida}><Text style={[styles.medidaValor, {color:'#2D9CDB'}]}>178cm</Text><Text style={styles.medidaRotulo}>Altura</Text></View>
            <View style={styles.blocoMedida}><Text style={[styles.medidaValor, {color:CORES.sucesso}]}>22.7</Text><Text style={styles.medidaRotulo}>IMC</Text></View>
          </View>
          <Text style={styles.statusImc}>Peso normal</Text>
        </View>

        {/* ↓ Seção Estatísticas. */}
        <Text style={styles.secaoTitulo}>ESTATÍSTICAS</Text>
        <View style={styles.cardEstatisticaContainer}>
          <View style={styles.rowGrid}>
            <View style={styles.miniCardEstatistica}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <BookOpenText color={CORES.primaria} size={14} style={{marginRight: 2.5}}/>
                <Text style={styles.estatisticaIcone}> Dias registrados</Text>
              </View>
              <Text style={[styles.estatisticaNumero, {color: CORES.sucesso}]}>2</Text>
            </View>
            <View style={styles.miniCardEstatistica}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Flame color={CORES.primaria} size={14} style={{marginRight: 2.5}}/>
                <Text style={styles.estatisticaIcone}>Média calórica</Text>
              </View>
              <Text style={[styles.estatisticaNumero, {color: CORES.primaria}]}>1174 kcal</Text>
            </View>
          </View>

          <View style={styles.rowGrid}>
            <View style={styles.miniCardEstatistica}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <Target color={CORES.primaria} size={14} style={{marginRight: 2.5}}/>
                <Text style={styles.estatisticaIcone}> Meta calórica</Text>
              </View>
              <Text style={[styles.estatisticaNumero, {color: '#2D9CDB'}]}>1800 kcal</Text>
            </View>
            <View style={styles.miniCardEstatistica}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <ChartNoAxesCombined color={CORES.primaria} size={14} style={{marginRight: 2.5}}/>
                <Text style={styles.estatisticaIcone}>Objetivo</Text>
              </View>
              <Text style={[styles.estatisticaNumero, {color: CORES.primaria}]}>Perder</Text>
            </View>
          </View>
        </View>

      </ScrollView>
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
    paddingVertical: 6, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center'
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
    marginHorizontal: 4 
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
  statusImc: { 
    textAlign: 'center', 
    color: CORES.sucesso, 
    fontWeight: 'bold', 
    fontSize: 13, 
    marginTop: 12 
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
    }
});