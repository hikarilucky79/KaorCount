import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, Switch, Alert, ActivityIndicator, Platform } from 'react-native';
import { CORES } from '../constants/Cores';
import { DoorOpen, ChevronLeft, Check, Flame, Scale, Dumbbell, Info } from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as metaNutriApi from '../api/metaNutriApi';

export default function ConfiguracaoScreen({ navigation }) {
  const { usuario, logout } = useAuth();

  const [pushAtivo, setPushAtivo] = useState(true);
  const [lembreteAtivo, setLembreteAtivo] = useState(true);
  const [nivelAtividade, setNivelAtividade] = useState('moderado');
  const [objetivo, setObjetivo] = useState('manter_peso');
  const [perfilCompleto, setPerfilCompleto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [deslogando, setDeslogando] = useState(false);

  // ↓ Lista de níveis de atividade
  const niveisAtividade = [
    { id: 'sedentario', nome: 'Sedentário', descricao: 'pouco ou nenhum exercício' },
    { id: 'leve', nome: 'Levemente ativo', descricao: '1-3x por semana' },
    { id: 'moderado', nome: 'Moderado', descricao: '3-5x por semana' },
    { id: 'muito_ativo', nome: 'Muito ativo', descricao: '6-7x por semana' },
  ];

  // ↓ Lista de objetivos
  const objetivos = [
    { id: 'perder_peso', nome: 'Perder', icone: Flame },
    { id: 'manter_peso', nome: 'Manter', icone: Scale },
    { id: 'ganhar_massa', nome: 'Ganhar', icone: Dumbbell },
  ];

  // ───────────────────────────────────────────────────────────
  // ↓ Carregar dados do perfil nutricional
  // ───────────────────────────────────────────────────────────
  const carregarDados = useCallback(async () => {
    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) {
      setCarregando(false);
      return;
    }

    try {
      const perfil = await perfilNutriApi.buscarPerfil(idUsuario);
      if (perfil) {
        setPerfilCompleto(perfil);
        if (perfil.nivel_atividade) setNivelAtividade(perfil.nivel_atividade === 'intenso' ? 'muito_ativo' : perfil.nivel_atividade);
        if (perfil.objetivo_nutricional) setObjetivo(perfil.objetivo_nutricional);
      }
    } catch (error) {
      console.warn('[Config] Perfil nutricional não encontrado:', error.message);
    } finally {
      setCarregando(false);
    }
  }, [usuario]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ───────────────────────────────────────────────────────────
  // ↓ Atualizar nível de atividade via API
  // ───────────────────────────────────────────────────────────
  const alterarNivelAtividade = async (novoNivel) => {
    const nivelAnterior = nivelAtividade;
    setNivelAtividade(novoNivel);

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) return;

    try {
      await perfilNutriApi.salvarOuAtualizar(idUsuario, {
        nivel_atividade: novoNivel,
        objetivo_nutricional: objetivo,
        data_nascimento: perfilCompleto?.data_nascimento || '2000-01-01',
        genero: perfilCompleto?.genero || 'masculino',
      });
    } catch (error) {
      setNivelAtividade(nivelAnterior);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Não foi possível atualizar o nível de atividade.');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o nível de atividade.');
      }
      console.error('[Config] Erro ao atualizar atividade:', error);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Atualizar objetivo via API
  // ───────────────────────────────────────────────────────────
  const alterarObjetivo = async (novoObj) => {
    const objAnterior = objetivo;
    setObjetivo(novoObj);

    const idUsuario = usuario?.id_usuario || usuario?.id;
    if (!idUsuario) return;

    try {
      await perfilNutriApi.salvarOuAtualizar(idUsuario, {
        objetivo_nutricional: novoObj,
        nivel_atividade: nivelAtividade,
        data_nascimento: perfilCompleto?.data_nascimento || '2000-01-01',
        genero: perfilCompleto?.genero || 'masculino',
      });
    } catch (error) {
      setObjetivo(objAnterior);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Não foi possível atualizar o objetivo.');
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o objetivo.');
      }
      console.error('[Config] Erro ao atualizar objetivo:', error);
    }
  };

  // ───────────────────────────────────────────────────────────
  // ↓ Logout real: limpar token e navegar para Auth
  // ───────────────────────────────────────────────────────────
  const executarLogout = async () => {
    setDeslogando(true);
    try {
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
    } catch (error) {
      console.error('[Config] Erro ao desconectar:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.alert('Não foi possível desconectar.');
      } else {
        Alert.alert('Erro', 'Não foi possível desconectar.');
      }
      setDeslogando(false);
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      const confirmado = typeof window !== 'undefined' ? window.confirm('Tem certeza que deseja desconectar da sua conta?') : true;
      if (confirmado) {
        executarLogout();
      }
    } else {
      Alert.alert(
        'Sair da conta',
        'Tem certeza que deseja desconectar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sair',
            style: 'destructive',
            onPress: executarLogout,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CORES.fundo }}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* ↓ Cabeçalho com botão Voltar */}
        <View style={styles.headerConfig}>
          <TouchableOpacity 
            style={styles.btnVoltar} 
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Início');
              }
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ChevronLeft size={16} color={CORES.textoEscuro} />
              <Text style={styles.txtVoltar}>Voltar</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.tituloTela}>Configurações</Text>
          <View style={{ width: 60 }} />
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

        {/* ↓ Objetivo */}
        <Text style={styles.secaoTitulo}>OBJETIVO</Text>
        <View style={styles.rowObjetivos}>
          {objetivos.map((obj) => {
            const IconeComp = obj.icone;
            const ativo = objetivo === obj.id;
            return (
              <TouchableOpacity
                key={obj.id}
                style={[styles.cardObjetivo, ativo && styles.cardObjetivoAtivo]}
                onPress={() => alterarObjetivo(obj.id)}
                activeOpacity={0.7}
              >
                <IconeComp size={20} color={ativo ? CORES.primaria : CORES.textoSuave} />
                <Text style={[styles.txtObjetivo, ativo && styles.txtObjetivoAtivo]}>
                  {obj.nome}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ↓ Nível de Atividade */}
        <Text style={styles.secaoTitulo}>NÍVEL DE ATIVIDADE</Text>

        {carregando ? (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <ActivityIndicator size="small" color={CORES.primaria} />
          </View>
        ) : (
          <View style={styles.containerAtividades}>
            {niveisAtividade.map((nivel) => (
              <TouchableOpacity 
                key={nivel.id}
                style={nivelAtividade === nivel.id ? styles.boxAtividadeAtiva : styles.boxAtividadeInativa}
                onPress={() => alterarNivelAtividade(nivel.id)}
                activeOpacity={0.7}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.txtAtividadeNome, nivelAtividade === nivel.id && { color: CORES.primaria }]}>
                    {nivel.nome}
                  </Text>
                  {nivelAtividade === nivel.id ? (
                    <Check size={18} color={CORES.primaria} />
                  ) : null}
                </View>
                <Text style={styles.txtAtividadeSub}>{nivel.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ↓ Informações do App */}
        <Text style={styles.secaoTitulo}>INFORMAÇÕES</Text>
        <View style={styles.cardConfig}>
          <View style={styles.linhaInfo}>
            <Text style={styles.txtInfoLabel}>App</Text>
            <Text style={styles.txtInfoValor}>KaorCount v1.0</Text>
          </View>
          <View style={[styles.linhaInfo, { borderTopWidth: 1, borderColor: '#FDF8F2', paddingTop: 10, marginTop: 10 }]}>
            <Text style={styles.txtInfoLabel}>Banco de dados</Text>
            <Text style={styles.txtInfoValor}>18 alimentos</Text>
          </View>
          <View style={[styles.linhaInfo, { borderTopWidth: 1, borderColor: '#FDF8F2', paddingTop: 10, marginTop: 10 }]}>
            <Text style={styles.txtInfoLabel}>Sincronização</Text>
            <Text style={styles.txtInfoValor}>Nuvem / Local</Text>
          </View>
        </View>

        {/* Ação de Deslogar da Conta */}
        <Text style={styles.secaoTitulo}>CONTA</Text>
        <TouchableOpacity 
          style={[styles.botaoLogoutCard, deslogando && { opacity: 0.6 }]} 
          onPress={handleLogout}
          disabled={deslogando}
        >
          {deslogando ? (
            <ActivityIndicator color="#EB5757" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <DoorOpen color="#EB5757" size={20} style={{ marginRight: 8 }} />
              <Text style={styles.botaoLogoutTexto}>Desconectar / Sair da Conta</Text>
            </View>
          )}
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
    marginTop: 10
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
    marginBottom: 20 
  },
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
  rowObjetivos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  cardObjetivo: {
    flex: 1,
    backgroundColor: CORES.branco,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  cardObjetivoAtivo: {
    backgroundColor: '#FDF3E7',
    borderColor: CORES.primaria,
    borderWidth: 1.5,
  },
  txtObjetivo: {
    fontSize: 12,
    fontWeight: '600',
    color: CORES.textoSuave,
    marginTop: 6,
  },
  txtObjetivoAtivo: {
    color: CORES.primaria,
    fontWeight: 'bold',
  },
  containerAtividades: { marginBottom: 15 },
  boxAtividadeInativa: { 
    backgroundColor: CORES.branco, 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10,
    borderWidth: 1,
    borderColor: CORES.borda,
  },
  boxAtividadeAtiva: { 
    backgroundColor: '#FDF3E7', 
    borderRadius: 16, 
    padding: 14, 
    marginBottom: 10, 
    borderWidth: 1.5, 
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
    marginTop: 2 
  },
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txtInfoLabel: {
    fontSize: 13,
    color: CORES.textoSuave,
  },
  txtInfoValor: {
    fontSize: 13,
    fontWeight: '600',
    color: CORES.textoEscuro,
  },
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