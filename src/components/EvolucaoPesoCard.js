import React, { useState, useCallback } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Weight } from 'lucide-react-native';
import { BarChart } from 'react-native-gifted-charts';
import { useFocusEffect } from '@react-navigation/native';
import * as dashboardApi from '../api/dashboardApi';
import * as historicoProgressoApi from '../api/historicoProgressoApi';
import { dataDeHoje } from '../util/data';
import { formatarPeso, pesoDeKg, pesoParaKg } from '../util/medidas';
import { pontosPeso } from '../util/rotina';
import useTarefa from '../hooks/useTarefa';
import useTheme from '../hooks/useTheme';
import { Card, Texto, Botao } from './RotinaUI';
// [F394] Renderiza o gráfico com os registros de evolução do peso.
function GraficoPeso({ registros, unidade }) {
  const { cores } = useTheme();
  const [largura, setLargura] = useState(0);
  const { pontos } = pontosPeso(registros);
  if (!pontos.length) return null;
  const inicio = pontos[0], fim = pontos[pontos.length - 1];
  // [F395] Formata uma data para o rótulo curto exibido no gráfico de peso.
  const dataCurta = data => data.slice(8, 10) + '/' + data.slice(5, 7);
  const chartWidth = Math.max(1, largura - 64);
  const dados = pontos.map((p, i) => ({ value: pesoDeKg(p.peso_kg, unidade), topLabelComponent: pontos.length <= 4 || i === pontos.length - 1 ? () => <Text style={{ color: cores.textoEscuro, fontSize: 11, fontWeight: '600', textAlign: 'center', width: 65 }}>{formatarPeso(p.peso_kg, unidade)}</Text> : undefined }));
  const teto = Math.max(2, Math.ceil(Math.max(...dados.map(p => p.value)) * 1.25 / 4) * 4);
  const larguraBarra = Math.min(36, Math.max(10, chartWidth / (dados.length * 2)));
  const espaco = Math.min(12, Math.max(4, (chartWidth - 48) / Math.max(dados.length * 4, 1)));
  const larguraGrupo = larguraBarra * dados.length + espaco * Math.max(0, dados.length - 1);
  const areaBarras = Math.max(1, chartWidth - 48);
  const margemGrupo = Math.max(8, (areaBarras - larguraGrupo) / 2);
  const margemFinal = Math.max(0, margemGrupo - espaco);
  return <View onLayout={event => setLargura(event.nativeEvent.layout.width)} style={{ marginTop: 10, marginBottom: 12 }} accessibilityRole="image" accessibilityLabel={`Evolução de peso entre ${dataCurta(inicio.data)} e ${dataCurta(fim.data)}, de ${formatarPeso(inicio.peso_kg, unidade)} para ${formatarPeso(fim.peso_kg, unidade)}`}>
    {largura > 0 ? <BarChart
      data={dados}
      width={chartWidth}
      height={120}
      initialSpacing={margemGrupo}
      endSpacing={margemFinal}
      barWidth={larguraBarra}
      spacing={espaco}
      disableScroll
      noOfSections={4}
      maxValue={teto}
      stepValue={teto / 4}
      yAxisLabelWidth={48}
      formatYLabel={valor => `${Number(valor).toFixed(1).replace(/\.0$/, '').replace('.', ',')} ${unidade}`}
      yAxisTextStyle={{ color: cores.textoSuave, fontSize: 11 }}
      hideXAxisText
      rulesColor={cores.borda}
      rulesType="solid"
      yAxisThickness={0}
      xAxisColor={cores.borda}
      frontColor={cores.primaria}
      barBorderTopLeftRadius={6}
      barBorderTopRightRadius={6}
      xAxisLabelsHeight={0}
      topLabelContainerStyle={{ width: 65, marginLeft: -14 }}
      disablePress
    /> : null}
    <View style={{ marginLeft: 56 + margemGrupo, width: larguraGrupo, marginTop: 4, flexDirection: 'row', justifyContent: pontos.length > 1 ? 'space-between' : 'center' }}><Texto style={{ width: larguraBarra, textAlign: 'center', color: cores.textoSuave, fontSize: 11, marginBottom: 0 }}>{dataCurta(inicio.data)}</Texto>{pontos.length > 1 ? <Texto style={{ width: larguraBarra, textAlign: 'center', color: cores.textoSuave, fontSize: 11, marginBottom: 0 }}>{dataCurta(fim.data)}</Texto> : null}</View>
  </View>;
}
// [F396] Exibe a evolução do peso e oferece o formulário para registrar uma nova medição.
export default function EvolucaoPesoCard({ idUsuario, unidade, alturaCm, aoRegistrar }) {
  const [registros, setRegistros] = useState([]);
  const [editando, setEditando] = useState(false);
  const [peso, setPeso] = useState('');
  const [aviso, setAviso] = useState('');
  const [mostrarErro, setMostrarErro] = useState(false);
  const { cores } = useTheme();
  const salvamento = useTarefa();
  const { ocupado, erro, executar } = useTarefa();
  const carregar = useCallback(() => executar(async atual => {
    const lista = await dashboardApi.evolucaoPeso(idUsuario, 10);
    if (atual()) setRegistros([...(lista || [])].sort((a, b) => a.data.localeCompare(b.data)));
  }), [idUsuario, executar]);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  // [F397] Registra uma nova medição de peso e atualiza a evolução exibida.
  const registrar = () => {
    setMostrarErro(true);
    return salvamento.executar(async atual => {
    const valor = Number(peso.trim().replace(',', '.'));
    const kg = pesoParaKg(valor, unidade);
    if (!peso.trim() || !Number.isFinite(kg) || kg <= 0) throw new Error('Informe um peso válido maior que zero.');
    if (!alturaCm || alturaCm <= 0) throw new Error('Cadastre sua altura no perfil antes de registrar o peso.');
    const registro = await historicoProgressoApi.criar({ id_usuario: idUsuario, data_registro: dataDeHoje(), peso_atual: kg, altura_atual: alturaCm });
    if (!atual()) return;
    aoRegistrar(registro);
    setPeso('');
    setEditando(false);
    setAviso('Peso de hoje registrado.');
    await carregar();
    });
  };
  return <>
    <Card>
      {ocupado ? <Botao ocupado>Carregando</Botao> : erro ? <><Texto erro>{erro}</Texto><Botao onPress={carregar}>Tentar novamente</Botao></> : !registros.length ? <Texto>Nenhum peso registrado neste período.</Texto> : <GraficoPeso registros={registros} unidade={unidade} />}
    </Card>
    {editando ? <Card>
      <Texto style={{ color: cores.textoSuave }}>O registro de hoje será atualizado se já existir.</Texto>
      <Text style={{ color: cores.textoSuave, fontSize: 12, fontWeight: 'bold', marginTop: 10, marginBottom: 6 }}>Novo peso ({unidade})</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: cores.fundoInput, borderColor: cores.borda, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, height: 48, marginBottom: 12 }}>
        <Weight size={18} color={cores.textoSuave} style={{ marginRight: 8 }} />
        <TextInput accessibilityLabel={`Novo peso (${unidade})`} value={peso} onChangeText={setPeso} keyboardType="decimal-pad" editable={!salvamento.ocupado} placeholder="Ex.: 70,5" placeholderTextColor={cores.textoSuave} style={{ flex: 1, fontSize: 14, color: cores.textoEscuro }} />
      </View>
      {mostrarErro && salvamento.erro ? <Texto erro accessibilityRole="alert">{salvamento.erro}</Texto> : null}
      <Botao configuracao textoStyle={{ textAlign: 'center' }} ocupado={salvamento.ocupado} onPress={registrar}>Salvar peso</Botao>
      <Botao configuracao textoStyle={{ textAlign: 'center' }} disabled={salvamento.ocupado} onPress={() => setEditando(false)}>Cancelar</Botao>
    </Card> : <>
      {aviso ? <Texto accessibilityLiveRegion="polite" style={{ color: cores.textoSuave }}>{aviso}</Texto> : null}
      <Botao configuracao textoStyle={{ textAlign: 'center' }} onPress={() => { setAviso(''); setMostrarErro(false); setEditando(true); }}>Registrar novo peso</Botao>
    </>}
  </>;
}
