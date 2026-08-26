import React, { useState } from 'react';
import { StyleSheet, Image, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Alert } from 'react-native';
import { TextInputMask } from 'react-native-masked-text';
import { CORES } from '../constants/Cores';
import DropdownGenerico from '../../components/DropdownGenerico';
import { validarFormulario } from '../util/validacoes';
import { Mail, Lock, UserRound, UsersRound, CalendarDays, Ruler, VenusAndMars, Weight, SportShoe, BicepsFlexed } from 'lucide-react-native';

export default function AuthScreen({ navigation }) {
  
  // ↓ Estado para controlar qual aba está ativa.
  const [abaAtiva, setAbaAtiva] = useState('login');

  // ↓ Estados do formulário de Login.
  const [emailLogin, setEmailLogin] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');

  // ↓ Estados do formulário de Cadastro.
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [sexo, setSexo] = useState('');
  const [nivelAtividade, setNivelAtividade] = useState('');
  const [objetivo, setObjetivo] = useState('');

  const [erros, setErros] = useState({});

  // ↓ Listas para os componentes DropdownGenerico.
  const listaSexo = [
    {id: 'feminino', label: 'Feminino'},
    {id: 'masculino', label: 'Masculino'}
  ];

  const listaObjetivos = [
    { id: 'pp', label: 'Perder peso' },
    { id: 'mp', label: 'Manter peso' },
    { id: 'gm', label: 'Ganhar massa muscular' },
  ];

  const listaAtividade = [
    { id: 'sedentario', label: 'Sedentário (pouco ou nenhum exercício)' },
    { id: 'leve', label: 'Levemente ativo (1-3 dias/semana)' },
    { id: 'moderado', label: 'Moderadamente ativo (3-5 dias/semana)' },
    { id: 'intenso', label: 'Muito ativo (6-7 dias/semana)' },
  ];

  // ↓ FUNÇÕES DE AÇÃO.
  const handleLogin = () => {
    // ↓ Lógica básica de validação do login (com o Kauã os mais avançados).
    if (!emailLogin || !senhaLogin) {
      Alert.alert('Erro', 'Por favor, preencha o e-mail e a senha.');
      return;
    }
    navigation.replace('AppTabs');
  };

  const handleCadastrar = () => {
    const dadosFormulario = {
      nome,
      sobrenome,
      email,
      senha,
      dataNascimento,
      altura,
      peso,
      sexo,
      nivelAtividade,
      objetivo,
    };

    const resultado = validarFormulario(dadosFormulario);

    if (!resultado.valido) {
      setErros(resultado.erros);
      return;
    }

    setErros({});
    Alert.alert('Sucesso', 'Conta criada com sucesso!');
    navigation.replace('AppTabs');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      
      {/* ↓ CABEÇALHO */}
      <View style={{justifyContent: "center", height: 150}}>
        <Image source={require('../../assets/KaorCount.png')} style={{width: 300, height: 250}} />
      </View>
      <Text style={styles.subtituloApp}>
        Controle suas calorias e macros com facilidade
      </Text>

      {/* ↓ SELETOR DE ABAS */}
      <View style={styles.seletorContainer}>
        <TouchableOpacity 
          style={abaAtiva === 'login' ? styles.seletorAtivo : styles.seletorInativo} 
          onPress={() => { setAbaAtiva('login'); setErros({}); }}
        >
          <Text style={abaAtiva === 'login' ? styles.seletorTextoAtivo : styles.seletorTextoInativo}>Entrar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={abaAtiva === 'cadastro' ? styles.seletorAtivo : styles.seletorInativo}
          onPress={() => { setAbaAtiva('cadastro'); setErros({}); }}
        >
          <Text style={abaAtiva === 'cadastro' ? styles.seletorTextoAtivo : styles.seletorTextoInativo}>Cadastrar</Text>
        </TouchableOpacity>
      </View>

      {/* ↓ VIEW DO FORMULÁRIO) */}
      <View style={[styles.cardForm, { height: 370, width: '100%' }]}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          
          {/*  ——————————————— */}
          {/* | ABA DE LOGIN | */}
          {/* ———————————————  */}

          {abaAtiva === 'login' && (
            <View>
              <View style={styles.inputContainer}>
                <Mail color="#c4bbac" size={20} style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder="E-mail" 
                  placeholderTextColor="#9C8E81" 
                  value={emailLogin}
                  onChangeText={setEmailLogin}
                  keyboardType="email-address" 
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#c4bbac" size={20} style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Senha"
                  value={senhaLogin} 
                  onChangeText={setSenhaLogin}
                  placeholderTextColor="#9C8E81" 
                  secureTextEntry 
                />
              </View>

              <TouchableOpacity style={[styles.botaoPrincipal, { marginTop: 10 }]} onPress={handleLogin}>
                <Text style={styles.botaoPrincipalTexto}>Entrar  →</Text>
              </TouchableOpacity>

              <View style={styles.divisor} />

              <TouchableOpacity style={styles.botaoDemo} onPress={() => navigation.navigate('AppTabs')}>
                <Text style={styles.botaoDemoTexto}>Entrar com conta de demonstração</Text>
              </TouchableOpacity>
              
            </View>
          )}

          {/*  ————————————————— */}
          {/* | ABA DE CADASTRO| */}
          {/* —————————————————  */}

          {abaAtiva === 'cadastro' && (
            <View>
              <View style={styles.inputContainer}>
                <Mail color="#c4bbac" size={20} style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder="E-mail" 
                  placeholderTextColor="#9C8E81" 
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address" 
                />
              </View>
              {erros.email && <Text style={styles.textoErro}>{erros.email}</Text>}

              <View style={styles.inputContainer}>
                <Lock color="#c4bbac" size={20} style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Senha"
                  value={senha} 
                  onChangeText={setSenha}
                  placeholderTextColor="#9C8E81" 
                  secureTextEntry 
                />
              </View>
              {erros.senha && <Text style={styles.textoErro}>{erros.senha}</Text>}

              <View style={styles.inputContainer}>
                <UserRound color="#c4bbac" size={20} style={{ marginRight: 10 }} />
                <TextInput  
                  style={styles.input} 
                  placeholder="Nome" 
                  value={nome}
                  onChangeText={setNome}
                  placeholderTextColor="#9C8E81" 
                />
              </View>
              {erros.nome && <Text style={styles.textoErro}>{erros.nome}</Text>}

              <View style={styles.inputContainer}>
                <UsersRound color="#c4bbac" size={20} style={{ marginRight: 10 }} />
                <TextInput 
                  style={styles.input} 
                  placeholder="Sobrenome" 
                  value={sobrenome}
                  onChangeText={setSobrenome}
                  placeholderTextColor="#9C8E81" 
                />
              </View>
              {erros.sobrenome && <Text style={styles.textoErro}>{erros.sobrenome}</Text>}

              <View style={styles.inputContainer}>
                <CalendarDays color="#c4bbac" size={20} style={{ marginRight: 10 }} />      <TextInputMask
                  style={styles.input}
                  type={'datetime'}
                  options={{ format: 'DD/MM/YYYY' }}
                  placeholder="Data de nascimento" 
                  value={dataNascimento}
                  onChangeText={setDataNascimento}
                  placeholderTextColor="#9C8E81"
                  keyboardType="numeric"
                />
              </View>
              {erros.dataNascimento && <Text style={styles.textoErro}>{erros.dataNascimento}</Text>}

              <View style={styles.inputContainer}>
                <Ruler color="#c4bbac" size={20} style={{marginRight: 10}}/>
                <TextInput 
                  style={styles.input} 
                  placeholder="Altura (m)" 
                  value={altura}
                  onChangeText={setAltura}
                  placeholderTextColor="#9C8E81"
                  keyboardType="decimal-pad"
                />
              </View>
              {erros.altura && <Text style={styles.textoErro}>{erros.altura}</Text>}

              <View style={styles.inputContainer}>
                <Weight color="#c4bbac" size={20} style={{marginRight: 10}}/>
                <TextInput 
                  style={styles.input} 
                  placeholder="Peso (kg)" 
                  value={peso}
                  onChangeText={setPeso}
                  placeholderTextColor="#9C8E81"
                  keyboardType="decimal-pad"
                />
              </View>
              {erros.peso && <Text style={styles.textoErro}>{erros.peso}</Text>}

              <View style={styles.inputContainer}>
                <VenusAndMars color="#c4bbac" size={20} style={{marginRight: 10}}/>
                <DropdownGenerico
                  opcoes={listaSexo}
                  valorSelecionado={sexo}
                  onChange={setSexo}
                  placeholder="Sexo biológico"            
                />
              </View>
              {erros.sexo && <Text style={styles.textoErro}>{erros.sexo}</Text>}

              <View style={styles.inputContainer}>
                <SportShoe color="#c4bbac" size={20} style={{marginRight: 10}}/>
                <DropdownGenerico
                  opcoes={listaAtividade}
                  valorSelecionado={nivelAtividade}
                  onChange={setNivelAtividade}
                  placeholder="Nível de atividade"
                />
              </View>
              {erros.nivelAtividade && <Text style={styles.textoErro}>{erros.nivelAtividade}</Text>}
              
              <View style={styles.inputContainer}>
                <BicepsFlexed color="#c4bbac" size={20} style={{marginRight: 10}}/>
                <DropdownGenerico
                  opcoes={listaObjetivos}
                  valorSelecionado={objetivo}
                  onChange={setObjetivo}
                  placeholder="Objetivo principal"
                />
              </View>
              {erros.objetivo && <Text style={styles.textoErro}>{erros.objetivo}</Text>}

              <TouchableOpacity style={[styles.botaoPrincipal, { marginTop: 10 }]} onPress={handleCadastrar}>
                <Text style={styles.botaoPrincipalTexto}>Criar conta  →</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </View>

      {/* ↓ Link inferior dinâmico (baseado na aba ativa). */}
      <TouchableOpacity 
        style={{ marginTop: 20 }} 
        onPress={() => setAbaAtiva(abaAtiva === 'login' ? 'cadastro' : 'login')}
      >
        <Text style={styles.textoLinkInferior}>
          {abaAtiva === 'login' ? 'Não tem conta? ' : 'Já tem conta? '}
          <Text style={styles.linkDestaque}>
            {abaAtiva === 'login' ? 'Cadastre-se' : 'Faça login'}
          </Text>
        </Text>
      </TouchableOpacity>

    </SafeAreaView>
  );
}

// ↓ Estilos
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: CORES.fundo, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 20 
    },
  subtituloApp: { 
    fontSize: 14, 
    color: CORES.textoSuave, 
    textAlign: 'center', 
    marginBottom: 30 
    },
  seletorContainer: { 
    flexDirection: 'row',
    backgroundColor: '#EADCC9', 
    padding: 6, borderRadius: 25,
    width: '100%', 
    marginBottom: 20 
      },
  seletorAtivo: { 
    flex: 1,
    backgroundColor:
    CORES.branco, 
    paddingVertical: 12, 
    borderRadius: 20, 
    alignItems: 'center' 
    },
  seletorInativo: { 
    flex: 1, 
    paddingVertical: 12, 
    alignItems: 'center' 
    },
  seletorTextoAtivo: { 
    fontWeight: 'bold', 
    color: CORES.primaria 
    },
  seletorTextoInativo: { 
    fontWeight: '600', 
    color: CORES.textoSuave 
    },
  cardForm: { 
    backgroundColor: CORES.branco, 
    width: '100%', 
    borderRadius: 28, 
    padding: 24, 
    elevation: 3 
    },
  inputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    alignContent: 'center',
    backgroundColor: CORES.fundoInput, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: CORES.borda, 
    paddingHorizontal: 15, 
    marginBottom: 16, 
    height: 56 },
  input: { 
    flex: 1, 
    color: CORES.textoEscuro, 
    fontSize: 15 
    },
  botaoPrincipal: { 
    backgroundColor: CORES.primaria, 
    borderRadius: 20, 
    height: 56, 
    justifyContent: 'center',
    alignItems: 'center' 
    },
  botaoPrincipalTexto: { 
    color: CORES.branco, 
    fontSize: 16, 
    fontWeight: 'bold' 
    },
  botaoDemo: { 
    backgroundColor: '#EADCC9', 
    borderRadius: 20, 
    height: 50, 
    justifyContent: 'center', 
    alignItems: 'center' 
    },
  botaoDemoTexto: { 
    color: CORES.textoEscuro, 
    fontSize: 14, 
    fontWeight: '500' 
  },
  divisor: { 
    height: 1, 
    backgroundColor: '#F0E4D4', 
    marginVertical: 20 
    },
  textoLinkInferior: { 
    color: CORES.textoSuave, 
    fontSize: 14 
    },
  linkDestaque: { 
    color: CORES.primaria, 
    fontWeight: 'bold' },
  textoErro: {
    color: '#e11d48',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 10,
  },
});