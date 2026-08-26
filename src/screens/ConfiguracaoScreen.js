import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Switch } from 'react-native';
import { CORES } from '../constants/Cores';
import {DoorOpen} from 'lucide-react-native';

export default function ConfiguracaoScreen({ navigation }) {
  const [pushAtivo, setPushAtivo] = useState(true);
  const [lembreteAtivo, setLembreteAtivo] = useState(true);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* ↓ Cabeçalho com botão Voltar */}
        <View style={styles.headerConfig}>
          <TouchableOpacity style={styles.btnVoltar} onPress={() => navigation.goBack()}>
            <Text style={styles.txtVoltar}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.tituloTela}>Configurações</Text>
          <View style={{ width: 60 }} /> {/* ← Equilíbrio visual */}
        </View>

        {/* ↓ Bloco Notificações */}
        <Text style={styles.secaoTitulo}>PREFERÊNCIAS</Text>
        <View style={styles.cardConfig}>
          <View style={styles.linhaSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tituloItemSwitch}>Notificações push</Text>
              <Text style={styles.subItemSwitch}>Alertas de metas e lembretes</Text>
            </View>
            <Switch value={pushAtivo} onValueChange={setPushAtivo} trackColor={{ true: CORES.primaria }} />
          </View>

          <View style={[styles.linhaSwitch, { marginTop: 15, borderTopWidth: 1, borderColor: '#FDF8F2', paddingTop: 15 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.tituloItemSwitch}>Lembrete de refeição</Text>
              <Text style={styles.subItemSwitch}>Horários programados</Text>
            </View>
            <Switch value={lembreteAtivo} onValueChange={setLembreteAtivo} trackColor={{ true: CORES.primaria }} />
          </View>
        </View>

        {/* ↓ Nível de Atividade */}
        <Text style={styles.secaoTitulo}>NÍVEL DE ATIVIDADE</Text>
        <View style={styles.containerAtividades}>
          <View style={styles.boxAtividadeInativa}>
            <Text style={styles.txtAtividadeNome}>Sedentário</Text>
            <Text style={styles.txtAtividadeSub}>pouco ou nenhum exercício</Text>
          </View>
          <View style={styles.boxAtividadeInativa}>
            <Text style={styles.txtAtividadeNome}>Levemente ativo</Text>
            <Text style={styles.txtAtividadeSub}>1-3x por semana</Text>
          </View>
          <View style={styles.boxAtividadeAtiva}>
            <Text style={[styles.txtAtividadeNome, {color: CORES.primaria}]}>Moderado ✓</Text>
            <Text style={styles.txtAtividadeSub}>3-5x por semana</Text>
          </View>
          <View style={styles.boxAtividadeInativa}>
            <Text style={styles.txtAtividadeNome}>Muito ativo</Text>
            <Text style={styles.txtAtividadeSub}>6-7x por semana</Text>
          </View>
        </View>

        {/* Ação de Deslogar da Conta */}
        <Text style={styles.secaoTitulo}>CONTA</Text>
        <TouchableOpacity 
          style={styles.botaoLogoutCard} 
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Auth' }] })}
        >
          <DoorOpen color="#F05454" size={20} style={{ marginRight: 8 }} />
          <Text style={styles.botaoLogoutTexto}> Desconectar / Sair da Conta</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { 
    flexGrow: 1, 
    padding: 20,
    paddingBottom: 40 
  },
  headerConfig: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25,
    marginTop: 20
    },
  btnVoltar: { 
    backgroundColor: CORES.branco, 
    paddingVertical: 8, 
    paddingHorizontal: 14, 
    borderRadius: 12, 
    borderColor: CORES.borda, 
    borderWidth: 1 
    },
  txtVoltar: { 
    color: CORES.textoEscuro, 
    fontWeight: 'bold', 
    fontSize: 14 
    },
  tituloTela: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
    },
  cardConfig: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 20 },
  secaoTitulo: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: CORES.textoSuave, 
    marginBottom: 12, 
    letterSpacing: 1 
    },
  linhaSwitch: { 
    flexDirection: 'row', 
    alignItems: 'center' 
    },
  tituloItemSwitch: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: CORES.textoEscuro 
    },
  subItemSwitch: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginTop: 2 
    },
  containerAtividades: { marginBottom: 10 },
  boxAtividadeInativa: { 
    backgroundColor: CORES.branco, 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10 
    },
  boxAtividadeAtiva: { 
    backgroundColor: CORES.branco, 
    borderRadius: 16, padding: 14, 
    marginBottom: 10, borderWidth: 1.5, 
    borderColor: CORES.primaria 
    },
  txtAtividadeNome: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
    },
  txtAtividadeSub: { 
    fontSize: 11, 
    color: CORES.textoSuave, 
    marginTop: 2 },
  botaoLogoutCard: { 
    backgroundColor: '#FFF5F5', 
    borderColor: '#EB5757', 
    borderWidth: 1, 
    borderRadius: 20, 
    padding: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 30,
    flexDirection: 'row'
    },
  botaoLogoutTexto: { 
    color: '#EB5757', 
    fontWeight: 'bold', 
    fontSize: 15
    }
});