import React, {useState} from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import {Coffee, CookingPot, PaperBag, Utensils, Droplet} from 'lucide-react-native';
import { CORES } from '../constants/Cores';

export default function DiarioAlimentarScreen() {
  // ↓ Criando as constantes que armazenam o dia, mês, ano e dia da semana atual.
  const hoje = new Date();

  // ↓ Atribuindo os nomes dos dias da semana e dos meses com o que retornar das constantes.
  const diasDaSemanaNome = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
  const mesesNomes = ["Jan", "Fev", "Mar", "Abr", "Maio", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]

  const diaDaSemana = diasDaSemanaNome[hoje.getDay()];
  const diaDoMes = hoje.getDate();
  const mes = mesesNomes[hoje.getMonth()];
  const ano = hoje.getFullYear();


  // ↓ Criando as constantes da contagem de água (Hidratação)
  const [agua, setAgua] = useState(1200);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        
        {/* ↓ Cabeçalho Seletor de Data */}
        <View style={styles.seletorDataContainer}>
          <TouchableOpacity style={styles.setaData}><Text style={styles.setaTexto}>‹</Text></TouchableOpacity>
          <View style={{ alignItems: 'center', }}>
            <Text style={styles.textoHoje}>Hoje</Text>
            <Text style={styles.textoDataDetalhe}>{`${diaDaSemana}, ${diaDoMes} de ${mes} de ${ano}`}</Text>
          </View>
          <TouchableOpacity style={styles.setaData}><Text style={styles.setaTexto}>›</Text></TouchableOpacity>
        </View>

        {/* ↓ Resumo Superior Expandido */}
        <View style={styles.cardResumo}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={styles.tituloResumo}>RESUMO</Text>
            <Text style={styles.caloriasResumoValor}>1112 <Text style={{fontSize:12, fontWeight:'normal'}}>kcal</Text></Text>
          </View>
          
          <Text style={styles.macroTextoDiario}>PROTEÍNA <Text style={{color: CORES.primaria}}>94/140g</Text></Text>
          <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: '67%', backgroundColor: CORES.primaria }]} /></View>

          <Text style={styles.macroTextoDiario}>CARBOS <Text style={{color: CORES.carboidrato}}>129/180g</Text></Text>
          <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: '71%', backgroundColor: CORES.carboidrato }]} /></View>

          <Text style={styles.macroTextoDiario}>GORDURA <Text style={{color: CORES.gordura}}>25/55g</Text></Text>
          <View style={styles.barraFundo}><View style={[styles.barraPreenchida, { width: '45%', backgroundColor: CORES.gordura }]} /></View>
        </View>

        {/* ↓ Bloco Café da Manhã */}
        <View style={styles.cardRefeicao}>
          <View style={styles.headerRefeicao}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Coffee size={20}/>
              <Text style={[styles.refeicaoTituloTexto, {marginLeft: 12}]}> Café da Manhã  •  <Text style={{fontWeight:'normal', fontSize:13}}>363 kcal</Text></Text>
            </View>
            <TouchableOpacity style={styles.botaoAddRefeicao}><Text style={styles.addTexto}>+</Text></TouchableOpacity>
          </View>
          
          <View style={styles.linhaAlimento}>
            <View>
              <Text style={styles.nomeAlimento}>Aveia em Flocos</Text>
              <Text style={styles.detalheAlimento}>40g  •  P6.8g  C26.4g  G2.8g</Text>
            </View>
            <Text style={styles.caloriaAlimento}>156 <Text style={styles.kcalMini}>kcal</Text></Text>
          </View>

          <View style={styles.linhaAlimento}>
            <View>
              <Text style={styles.nomeAlimento}>Iogurte Grego (0%)</Text>
              <Text style={styles.detalheAlimento}>200g  •  P20g  C7.2g  G0.8g</Text>
            </View>
            <Text style={styles.caloriaAlimento}>118 <Text style={styles.kcalMini}>kcal</Text></Text>
          </View>

          <View style={[styles.linhaAlimento, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.nomeAlimento}>Banana Prata</Text>
              <Text style={styles.detalheAlimento}>1 unid.  •  P1.1g  C23g  G0.3g</Text>
            </View>
            <Text style={styles.caloriaAlimento}>89 <Text style={styles.kcalMini}>kcal</Text></Text>
          </View>
        </View>

        {/* ↓ Bloco Almoço */}
        <View style={styles.cardRefeicao}>
          <View style={styles.headerRefeicao}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CookingPot size={20}/>
              <Text style={[styles.refeicaoTituloTexto, {marginLeft: 12}]}> Almoço  •  <Text style={{fontWeight:'normal', fontSize:13}}>575 kcal</Text></Text>
            </View>
            <TouchableOpacity style={styles.botaoAddRefeicao}><Text style={styles.addTexto}>+</Text></TouchableOpacity>
          </View>

          <View style={[styles.linhaAlimento, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.nomeAlimento}>Peito de Frango (grelhado)</Text>
              <Text style={styles.detalheAlimento}>150g  •  P46.5g  C0g  G5.4g</Text>
            </View>
            <Text style={styles.caloriaAlimento}>248 <Text style={styles.kcalMini}>kcal</Text></Text>
          </View>
        </View>

        {/* ↓ Bloco Janta*/}
        <View style={styles.cardRefeicao}>
          <View style={styles.headerRefeicao}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Utensils size={20}/>
              <Text style={[styles.refeicaoTituloTexto, {marginLeft: 12}]}> Janta •  <Text style={{fontWeight:'normal', fontSize:13}}>575 kcal</Text></Text>
            </View>
            <TouchableOpacity style={styles.botaoAddRefeicao}><Text style={styles.addTexto}>+</Text></TouchableOpacity>
          </View>

          <View style={[styles.linhaAlimento, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.nomeAlimento}>Peito de Frango (grelhado)</Text>
              <Text style={styles.detalheAlimento}>150g  •  P46.5g  C0g  G5.4g</Text>
            </View>
            <Text style={styles.caloriaAlimento}>248 <Text style={styles.kcalMini}>kcal</Text></Text>
          </View>
        </View>

        {/* ↓ Bloco Lanches*/}
        <View style={styles.cardRefeicao}>
          <View style={styles.headerRefeicao}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <PaperBag size={20}/>
              <Text style={[styles.refeicaoTituloTexto, {marginLeft: 12}]}> Lanches •  <Text style={{fontWeight:'normal', fontSize:13}}>174 kcal</Text></Text>
            </View>
            <TouchableOpacity style={styles.botaoAddRefeicao}><Text style={styles.addTexto}>+</Text></TouchableOpacity>
          </View>

          <View style={[styles.linhaAlimento, { borderBottomWidth: 0 }]}>
            <View>
              <Text style={styles.nomeAlimento}>Amêndoas (grelhado)</Text>
              <Text style={styles.detalheAlimento}>30g  •  P46.3g  C6.6g  G15g</Text>
            </View>
            <Text style={styles.caloriaAlimento}>174 <Text style={styles.kcalMini}>kcal</Text></Text>
          </View>
        </View>

        {/* ↓ Bloco Hidratação */}
        <View style={styles.cardConfig}>
          <View style={{flexDirection: 'row', alignItems: 'center' }}>
            <Droplet size={20}/>
            <Text style={[styles.tituloCardInterno], {marginLeft: 8}}> Hidratação</Text>
          </View>
          <Text style={styles.volAguaText}>{agua} <Text style={{fontSize:16, fontWeight:'normal', color:CORES.textoSuave}}>/ 2500 ml</Text></Text>
          
          <View style={styles.barraFundoAgua}>
            <View style={[styles.barraPreenchidaAgua, { width: `${Math.min((agua/2500)*100, 100)}%` }]} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 }}>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => setAgua(agua + 150)}><Text style={styles.txtBtnAgua}>+150</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => setAgua(agua + 250)}><Text style={styles.txtBtnAgua}>+250</Text></TouchableOpacity>
            <TouchableOpacity style={styles.btnQuickAgua} onPress={() => setAgua(agua + 350)}><Text style={styles.txtBtnAgua}>+350</Text></TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seletorDataContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', marginBottom: 20, 
    marginTop: 20, 
    backgroundColor: CORES.primaria, 
    borderRadius: 25, 
    paddingHorizontal: 15
    },
  setaData: { 
    width: 22, 
    height: 22, 
    borderRadius: 18, 
    backgroundColor: CORES.branco, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderVertical: 1, 
    borderColor: CORES.borda
    },
  setaTexto: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
    },
  textoHoje: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro, 
    marginTop: 10},
  textoDataDetalhe: { 
    fontSize: 12, 
    color: CORES.textoSuave, 
    marginBottom: 10 
    },
  cardResumo: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 20 },
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
    borderRadius: 24, padding: 16, 
    marginBottom: 16 
    },
  headerRefeicao: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#FDF8F2', 
    paddingBottom: 8 },
  refeicaoTituloTexto: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
    },
  botaoAddRefeicao: { 
    width: 28, 
    height: 28, 
    borderRadius: 14, 
    backgroundColor: '#FDF8F2', 
    justifyContent: 'center', 
    alignItems: 'center' 
    },
  addTexto: { 
    fontSize: 16, 
    color: CORES.primaria, 
    fontWeight: 'bold' 
    },
  linhaAlimento: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 12, 
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
    fontSize: 15, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
    },
  kcalMini: { 
    fontSize: 11, 
    fontWeight: 'normal', 
    color: CORES.textoSuave 
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
    backgroundColor: '#F0F6FF', 
    paddingVertical: 8, 
    paddingHorizontal: 16, 
    borderRadius: 12 
    },
    cardConfig: { 
    backgroundColor: CORES.branco, 
    borderRadius: 24, 
    padding: 16, 
    marginBottom: 20 },
    tituloCardInterno: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: CORES.textoEscuro 
    }
});