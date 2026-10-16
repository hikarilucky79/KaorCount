import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, ActivityIndicator, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { DoorOpen, Check, Flame, Scale, Dumbbell, Info, LockKeyhole, UserRound, Flag, BookMarked, BellRing, Ruler, Database, CircleHelp, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import useResponsive from '../hooks/useResponsive';
import * as perfilNutriApi from '../api/perfilNutriApi';
import * as metaNutriApi from '../api/metaNutriApi';
import { UNIDADES_PADRAO } from '../util/medidas';
import { carregarUnidades, salvarUnidades } from '../util/unidades';

export const ITENS_MENU_CONFIGURACAO = [
  { id: 'conta', rota: 'ConfiguracaoConta', grupo: 'CONTA', titulo: 'Conta', descricao: 'E-mail e acesso', Icone: LockKeyhole },
  { id: 'perfil', rota: 'ConfiguracaoPerfil', grupo: 'CONTA', titulo: 'Editar perfil', descricao: 'Dados pessoais, medidas e atividade', Icone: UserRound },
  { id: 'objetivos', rota: 'ConfiguracaoObjetivos', grupo: 'ROTINA', titulo: 'Meus objetivos', descricao: 'Meta e nível de atividade', Icone: Flag },
  { id: 'diario', aba: 'Diário', grupo: 'ROTINA', titulo: 'Diário & Monitor de água', descricao: 'Refeições e hidratação', Icone: BookMarked },
  { id: 'lembretes', rota: 'ConfiguracaoLembretes', grupo: 'ROTINA', titulo: 'Lembretes', descricao: 'Notificações e tema', Icone: BellRing },
  { id: 'unidades', rota: 'ConfiguracaoUnidades', grupo: 'PREFERÊNCIAS', titulo: 'Unidades', descricao: 'Peso, altura e água', Icone: Ruler },
  { id: 'pais', rota: 'ConfiguracaoPais', grupo: 'PREFERÊNCIAS', titulo: 'País da base de alimentos', descricao: 'Catálogo de alimentos', Icone: Database },
  { id: 'ajuda', rota: 'ConfiguracaoAjuda', grupo: 'SUPORTE', titulo: 'Ajuda & Perguntas frequentes', descricao: 'Orientações de uso', Icone: CircleHelp },
  { id: 'sobre', rota: 'ConfiguracaoSobre', grupo: 'SUPORTE', titulo: 'Sobre o KaorCount', descricao: 'Versão do aplicativo', Icone: Info },
];

function BotaoObjetivoAnimado({ obj, ativo, cores, onPress, rf, moderateScale }) {
  const animScale = useRef(new Animated.Value(ativo ? 1.05 : 1)).current;
  const IconeComp = obj.icone;

  useEffect(() => {
    Animated.spring(animScale, {
      toValue: ativo ? 1.05 : 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [ativo]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={obj.nome}
      accessibilityState={{ selected: ativo }}
      onPress={() => {
        Animated.sequence([
          Animated.timing(animScale, { toValue: 0.93, duration: 75, useNativeDriver: true }),
          Animated.spring(animScale, { toValue: 1.05, friction: 4, tension: 160, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      style={{ flex: 1, marginHorizontal: 2 }}
    >
      <Animated.View
        style={[
          styles.cardObjetivo,
          {
            backgroundColor: ativo ? cores.mutado : cores.branco,
            borderColor: ativo ? cores.primaria : cores.borda,
            borderWidth: ativo ? 1.5 : 1,
            transform: [{ scale: animScale }],
          },
        ]}
      >
        <IconeComp size={moderateScale ? moderateScale(20, 0.3) : 20} color={ativo ? cores.primaria : cores.textoSuave} />
        <Text style={[styles.txtObjetivo, { color: cores.textoSuave, fontSize: rf ? rf(12, 10, 14) : 12 }, ativo && [styles.txtObjetivoAtivo, { color: cores.primaria }]]}>
          {obj.nome}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function BotaoAtividadeAnimado({ nivel, ativo, cores, onPress, rf }) {
  const animScale = useRef(new Animated.Value(ativo ? 1.02 : 1)).current;

  useEffect(() => {
    Animated.spring(animScale, {
      toValue: ativo ? 1.02 : 1,
      friction: 5,
      tension: 140,
      useNativeDriver: true,
    }).start();
  }, [ativo]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${nivel.nome}: ${nivel.descricao}`}
      accessibilityState={{ selected: ativo }}
      onPress={() => {
        Animated.sequence([
          Animated.timing(animScale, { toValue: 0.96, duration: 75, useNativeDriver: true }),
          Animated.spring(animScale, { toValue: 1.02, friction: 4, tension: 160, useNativeDriver: true }),
        ]).start();
        onPress();
      }}
      style={{ marginBottom: 10 }}
    >
      <Animated.View
        style={[
          styles.boxAtividadeInativa,
          {
            backgroundColor: ativo ? cores.mutado : cores.branco,
            borderColor: ativo ? cores.primaria : cores.borda,
            borderWidth: ativo ? 1.5 : 1,
            marginBottom: 0,
            transform: [{ scale: animScale }],
          },
        ]}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.txtAtividadeNome, { color: cores.textoEscuro, fontSize: rf ? rf(14, 12, 16) : 14 }, ativo && { color: cores.primaria, fontWeight: 'bold' }]}>
            {nivel.nome}
          </Text>
          {ativo ? <Check size={18} color={cores.primaria} /> : null}
        </View>
        <Text style={[styles.txtAtividadeSub, { color: cores.textoSuave, fontSize: rf ? rf(11, 10, 13) : 11 }]}>{nivel.descricao}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function ConfiguracaoScreen({ navigation, route }) {
  const { usuario, logout } = useAuth();
  const { cores, isDark, toggleTema } = useTheme();
  const { rf, moderateScale, getContainer, maxContentWidth } = useResponsive();

  const [pushAtivo, setPushAtivo] = useState(true);
  const [lembreteAtivo, setLembreteAtivo] = useState(true);
  const [nivelAtividade, setNivelAtividade] = useState('moderado');
  const [objetivo, setObjetivo] = useState('manter_peso');
  const [perfilCompleto, setPerfilCompleto] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [deslogando, setDeslogando] = useState(false);
  const [unidades, setUnidades] = useState({ ...UNIDADES_PADRAO });
  const [carregandoUnidades, setCarregandoUnidades] = useState(false);
  const secaoSelecionada = route?.params?.secao || null;

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

  // ───────────────────────────────────────────────────────────
  // ↓ Animação de Entrada Lateral Fluida ao focar na aba (900ms Suave)
  // ───────────────────────────────────────────────────────────
  const animEntrada = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      if (secaoSelecionada === 'objetivos') carregarDados();
      if (secaoSelecionada === 'unidades') {
        setCarregandoUnidades(true);
        carregarUnidades().then(setUnidades).finally(() => setCarregandoUnidades(false));
      }
      animEntrada.setValue(0);
      Animated.timing(animEntrada, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [carregarDados, secaoSelecionada])
  );

  const atualizarUnidade = async (campo, valor) => {
    const anterior = unidades;
    const proxima = { ...anterior, [campo]: valor };
    setUnidades(proxima);
    try {
      await salvarUnidades(proxima);
    } catch {
      setUnidades(anterior);
      if (Platform.OS === 'web' && typeof window !== 'undefined') window.alert('Não foi possível salvar a unidade.');
      else Alert.alert('Erro', 'Não foi possível salvar a unidade.');
    }
  };

  const offsetSlide = Math.round(moderateScale(35, 0.3));
  const fadeConteudo = animEntrada.interpolate({ inputRange: [0, 0.6], outputRange: [0, 1] });
  const slideConteudo = animEntrada.interpolate({ inputRange: [0, 1], outputRange: [offsetSlide, 0], extrapolate: 'clamp' });

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

  const gruposMenu = ['CONTA', 'ROTINA', 'PREFERÊNCIAS', 'SUPORTE'].map((grupo) => ({
    grupo,
    itens: ITENS_MENU_CONFIGURACAO.filter((item) => item.grupo === grupo),
  })).filter(({ itens }) => itens.length > 0);
  const itemSecao = ITENS_MENU_CONFIGURACAO.find((item) => item.id === secaoSelecionada);
  const detalhe = Boolean(secaoSelecionada);
  const corTextoMenu = cores.textoEscuro;

  const selecionarItem = (item) => {
    if (item.aba) {
      navigation.navigate('AppTabs', { screen: item.aba });
      return;
    }
    navigation.push(item.rota, { secao: item.id, abrirEdicao: item.id === 'perfil' });
  };

  const voltar = () => navigation.canGoBack()
    ? navigation.goBack()
    : navigation.navigate('AppTabs', { screen: 'Perfil' });

  const renderDetalhe = () => {
    switch (secaoSelecionada) {
      case 'conta':
        return (
          <>
            <View style={[styles.detalheBloco, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
              <Text style={[styles.detalheSubtitulo, { color: cores.textoSuave }]}>E-MAIL DA CONTA</Text>
              <Text style={[styles.detalheTexto, { color: corTextoMenu }]}>{usuario?.email || 'Conta KaorCount'}</Text>
            </View>
            <TouchableOpacity
              style={[styles.acaoLogout, { backgroundColor: cores.mutado, borderColor: cores.erro }]}
              onPress={handleLogout}
              disabled={deslogando}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Sair da conta"
            >
              {deslogando ? <ActivityIndicator color={cores.erro} /> : <><DoorOpen color={cores.erro} size={20} /><Text style={[styles.botaoLogoutTexto, { color: cores.erro }]}>Sair da conta</Text></>}
            </TouchableOpacity>
          </>
        );
      case 'objetivos':
        return (
          <>
            <Text style={[styles.detalheSubtitulo, { color: cores.textoSuave }]}>OBJETIVO NUTRICIONAL</Text>
            {carregando ? <ActivityIndicator color={cores.primaria} style={{ marginVertical: 20 }} /> : (
              <View style={styles.rowObjetivos}>
                {objetivos.map((obj) => (
                  <BotaoObjetivoAnimado key={obj.id} obj={obj} ativo={objetivo === obj.id} cores={cores} onPress={() => alterarObjetivo(obj.id)} rf={rf} moderateScale={moderateScale} />
                ))}
              </View>
            )}
            <Text style={[styles.detalheSubtitulo, { color: cores.textoSuave, marginTop: 16 }]}>NÍVEL DE ATIVIDADE</Text>
            {niveisAtividade.map((nivel) => (
              <BotaoAtividadeAnimado key={nivel.id} nivel={nivel} ativo={nivelAtividade === nivel.id} cores={cores} onPress={() => alterarNivelAtividade(nivel.id)} rf={rf} />
            ))}
          </>
        );
      case 'lembretes':
        return (
          <View style={[styles.detalheBloco, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            <Text style={[styles.detalheSubtitulo, { color: cores.textoSuave }]}>NOTIFICAÇÕES</Text>
            <View style={[styles.switchRow, { borderBottomColor: cores.borda }]}>
              <View style={styles.switchTextoContainer}>
                <Text style={[styles.switchTitulo, { color: corTextoMenu }]}>Notificações push</Text>
                <Text style={[styles.switchSubtitulo, { color: cores.textoSuave }]}>Avisos e atualizações do aplicativo</Text>
              </View>
              <Switch value={pushAtivo} onValueChange={setPushAtivo} trackColor={{ false: cores.borda, true: cores.primaria }} accessibilityLabel="Notificações push" />
            </View>
            <View style={[styles.switchRow, { borderBottomColor: cores.borda }]}>
              <View style={styles.switchTextoContainer}>
                <Text style={[styles.switchTitulo, { color: corTextoMenu }]}>Lembrete de refeição</Text>
                <Text style={[styles.switchSubtitulo, { color: cores.textoSuave }]}>Lembre-se de registrar suas refeições</Text>
              </View>
              <Switch value={lembreteAtivo} onValueChange={setLembreteAtivo} trackColor={{ false: cores.borda, true: cores.primaria }} accessibilityLabel="Lembrete de refeição" />
            </View>
            <Text style={[styles.detalheSubtitulo, { color: cores.textoSuave, marginTop: 22 }]}>APARÊNCIA</Text>
            <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
              <View style={styles.switchTextoContainer}>
                <Text style={[styles.switchTitulo, { color: corTextoMenu }]}>Tema escuro</Text>
                <Text style={[styles.switchSubtitulo, { color: cores.textoSuave }]}>Altere a aparência do aplicativo</Text>
              </View>
              <Switch value={isDark} onValueChange={toggleTema} trackColor={{ false: cores.borda, true: cores.primaria }} accessibilityLabel="Tema escuro" />
            </View>
          </View>
        );
      case 'unidades':
        return (
          <>
            <View style={[styles.detalheBloco, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
              {carregandoUnidades ? <ActivityIndicator color={cores.primaria} style={{ padding: 24 }} /> : [
                { campo: 'peso', titulo: 'Peso', opcoes: [{ valor: 'kg', rotulo: 'kg', descricao: 'Quilogramas' }, { valor: 'lb', rotulo: 'lb', descricao: 'Libras' }] },
                { campo: 'altura', titulo: 'Altura', opcoes: [{ valor: 'cm', rotulo: 'cm', descricao: 'Centímetros' }, { valor: 'in', rotulo: 'in', descricao: 'Polegadas' }] },
                { campo: 'agua', titulo: 'Hidratação', opcoes: [{ valor: 'ml', rotulo: 'ml', descricao: 'Mililitros' }, { valor: 'L', rotulo: 'L', descricao: 'Litros' }, { valor: 'fl oz', rotulo: 'fl oz', descricao: 'Onças líquidas (EUA)' }] },
              ].map((grupo, indice) => (
                <View key={grupo.campo} style={{ marginTop: indice ? 20 : 0 }}>
                  <Text style={[styles.switchTitulo, { color: corTextoMenu, marginBottom: 10 }]}>{grupo.titulo}</Text>
                  <View style={styles.unidadesOpcoes}>
                    {grupo.opcoes.map((opcao) => {
                      const selecionado = unidades[grupo.campo] === opcao.valor;
                      return (
                        <TouchableOpacity
                          key={opcao.valor}
                          style={[styles.unidadeOpcao, { backgroundColor: selecionado ? cores.mutado : cores.fundo, borderColor: selecionado ? cores.primaria : cores.borda }]}
                          onPress={() => atualizarUnidade(grupo.campo, opcao.valor)}
                          activeOpacity={0.75}
                          accessibilityRole="radio"
                          accessibilityLabel={`${grupo.titulo}: ${opcao.descricao}`}
                          accessibilityState={{ checked: selecionado }}
                        >
                          <Text style={[styles.unidadeOpcaoRotulo, { color: selecionado ? cores.primaria : corTextoMenu }]}>{opcao.rotulo}</Text>
                          <Text style={[styles.unidadeOpcaoDescricao, { color: cores.textoSuave }]}>{opcao.descricao}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
            <Text style={[styles.detalheTextoSuave, { color: cores.textoSuave }]}>Os registros continuam salvos em kg, cm e ml; o KaorCount converte a exibição conforme sua preferência.</Text>
          </>
        );
      case 'pais':
        return (
          <View style={[styles.detalheBloco, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            <View style={styles.baseAlimentosLinha}>
              <View style={[styles.menuIcone, { backgroundColor: cores.mutado }]}><Database size={21} color={cores.primaria} /></View>
              <View style={styles.switchTextoContainer}>
                <Text style={[styles.switchTitulo, { color: corTextoMenu }]}>Brasil</Text>
                <Text style={[styles.switchSubtitulo, { color: cores.textoSuave }]}>Tabela Brasileira de Composição de Alimentos (TACO)</Text>
              </View>
            </View>
            <Text style={[styles.detalheTextoSuave, { color: cores.textoSuave, marginTop: 14 }]}>Esta é a base usada para consultar os alimentos cadastrados no aplicativo.</Text>
          </View>
        );
      case 'ajuda':
        return (
          <View style={[styles.detalheBloco, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            <Text style={[styles.switchTitulo, { color: corTextoMenu }]}>Como usar o KaorCount</Text>
            <Text style={[styles.detalheTextoSuave, { color: cores.textoSuave, marginTop: 8 }]}>Registre refeições e acompanhe calorias, macronutrientes e hidratação na aba Diário. Seus dados podem ser ajustados em Editar perfil e seus objetivos em Meus objetivos.</Text>
          </View>
        );
      case 'sobre':
        return (
          <View style={[styles.detalheBloco, styles.sobreBloco, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
            <View style={[styles.menuIcone, { backgroundColor: cores.mutado }]}><Info size={22} color={cores.primaria} /></View>
            <Text style={[styles.sobreTitulo, { color: corTextoMenu }]}>KaorCount</Text>
            <Text style={[styles.detalheTextoSuave, { color: cores.textoSuave }]}>Seu companheiro de nutrição</Text>
            <Text style={[styles.sobreVersao, { color: cores.primaria }]}>Versão 1.0</Text>
          </View>
        );
      default:
        return <Text style={[styles.detalheTextoSuave, { color: cores.textoSuave }]}>Esta opção não está disponível.</Text>;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.fundo }}>
      <View style={[styles.menuHeader, { borderBottomColor: cores.borda }]}>
        <TouchableOpacity
          onPress={voltar}
          accessibilityRole="button"
          accessibilityLabel={detalhe ? 'Voltar para configurações' : 'Fechar configurações'}
          style={styles.menuFechar}
        >
          {detalhe ? <ChevronLeft size={24} color={corTextoMenu} /> : <X size={23} color={corTextoMenu} />}
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={[styles.menuTitulo, { color: corTextoMenu, fontSize: rf(detalhe ? 22 : 28, 20, 32) }]}>{detalhe ? itemSecao?.titulo : 'Configurações'}</Text>
          <Text style={[styles.menuSubtitulo, { color: cores.textoSuave }]}>{detalhe ? itemSecao?.descricao : 'Sua conta, rotina e preferências em um só lugar.'}</Text>
        </View>
      </View>

      {detalhe ? (
        <ScrollView contentContainerStyle={[styles.detalheLista, getContainer(maxContentWidth)]} showsVerticalScrollIndicator={false}>
          {renderDetalhe()}
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={[styles.menuLista, getContainer(maxContentWidth)]} showsVerticalScrollIndicator={false}>
          {gruposMenu.map(({ grupo, itens }) => (
            <View key={grupo} style={styles.menuGrupo}>
              <View style={styles.menuGrupoCabecalho}>
                <Text style={[styles.menuGrupoTitulo, { color: cores.textoSuave }]}>{grupo}</Text>
                <View style={[styles.menuGrupoRegua, { backgroundColor: cores.borda }]} />
              </View>
              <View style={[styles.menuGrupoCard, { backgroundColor: cores.branco, borderColor: cores.borda }]}>
                {itens.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={styles.menuLinha}
                      onPress={() => selecionarItem(item)}
                      activeOpacity={0.75}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.titulo}. ${item.descricao}`}
                      accessibilityHint="Abre esta opção"
                    >
                      <View style={[styles.menuIcone, { backgroundColor: cores.mutado }]} importantForAccessibility="no-hide-descendants">
                        <item.Icone size={20} color={cores.primaria} strokeWidth={2} />
                      </View>
                      <View style={styles.menuTextoContainer}>
                        <Text style={[styles.menuLinhaTexto, { color: corTextoMenu, fontSize: rf(16, 15, 18) }]}>{item.titulo}</Text>
                        <Text style={[styles.menuLinhaDescricao, { color: cores.textoSuave, fontSize: rf(13, 12, 14) }]}>{item.descricao}</Text>
                      </View>
                      <ChevronRight size={19} color={cores.textoSuave} accessible={false} />
                    </TouchableOpacity>
                    {index < itens.length - 1 ? <View style={[styles.menuDivisor, { backgroundColor: cores.borda }]} /> : null}
                  </React.Fragment>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  menuHeader: {
    minHeight: 96,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  menuFechar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 14,
  },
  menuTitulo: { fontWeight: '800', letterSpacing: -0.4 },
  menuSubtitulo: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  menuLista: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    alignSelf: 'center',
  },
  menuGrupo: { marginBottom: 24 },
  menuGrupoCabecalho: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, paddingHorizontal: 2 },
  menuGrupoTitulo: { fontSize: 11, fontWeight: '800', letterSpacing: 1.1 },
  menuGrupoRegua: { flex: 1, height: StyleSheet.hairlineWidth },
  menuGrupoCard: { width: '100%', borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuLinha: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuIcone: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  menuTextoContainer: { flex: 1, minWidth: 0 },
  menuLinhaTexto: { fontWeight: '700', lineHeight: 21 },
  menuLinhaDescricao: { lineHeight: 18, marginTop: 3 },
  menuDivisor: { height: StyleSheet.hairlineWidth, marginLeft: 70 },
  detalheLista: { width: '100%', padding: 20, paddingBottom: 40, alignSelf: 'center' },
  detalheSubtitulo: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  detalheBloco: { borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 16 },
  detalheTexto: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
  detalheTextoSuave: { fontSize: 14, lineHeight: 22, marginBottom: 12 },
  unidadesOpcoes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  unidadeOpcao: { flexGrow: 1, minWidth: 105, minHeight: 58, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderRadius: 12 },
  unidadeOpcaoRotulo: { fontSize: 15, fontWeight: '700' },
  unidadeOpcaoDescricao: { fontSize: 11, lineHeight: 15, marginTop: 2, textAlign: 'center' },
  switchRow: {
    minHeight: 76,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 10,
  },
  switchTextoContainer: { flex: 1, marginRight: 12 },
  switchTitulo: { fontSize: 14, fontWeight: '700', lineHeight: 20 },
  switchSubtitulo: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  baseAlimentosLinha: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sobreBloco: { alignItems: 'center', paddingVertical: 28 },
  sobreTitulo: { fontSize: 22, fontWeight: '800', marginTop: 14 },
  sobreVersao: { fontSize: 13, fontWeight: '700', marginTop: 16 },
  acaoLogout: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  rowObjetivos: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  cardObjetivo: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  txtObjetivo: { fontSize: 12, fontWeight: '600', marginTop: 6, textAlign: 'center' },
  txtObjetivoAtivo: { fontWeight: 'bold' },
  boxAtividadeInativa: { borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1 },
  txtAtividadeNome: { fontSize: 14, fontWeight: 'bold' },
  txtAtividadeSub: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  botaoLogoutTexto: { fontWeight: 'bold', fontSize: 15 },
});
