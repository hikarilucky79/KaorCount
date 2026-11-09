import React, { useState, useCallback } from 'react';
import { Switch, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as lembreteApi from '../api/lembreteApi';
import useTarefa from '../hooks/useTarefa';
import useTheme from '../hooks/useTheme';
import { Card, Texto, Campo, Botao } from './RotinaUI';
// [F400] Exibe e edita os horários de lembrete de água e refeições.
export default function LembretesCard({ idUsuario }) {
  const { cores } = useTheme();
  const [config, setConfig] = useState(null);
  const [intervalo, setIntervalo] = useState(120);
  const [meta, setMeta] = useState('2500');
  const [horarios, setHorarios] = useState(['08:00', '12:00', '15:00', '19:00']);
  const [aviso, setAviso] = useState('');
  const { ocupado, erro, executar } = useTarefa();
  const carregar = useCallback(() => executar(async atual => {
    const dados = await lembreteApi.buscarConfig(idUsuario);
    if (atual()) { setConfig(dados); setIntervalo(dados.agua_intervalo_min); setMeta(String(dados.agua_meta_diaria_ml)); setHorarios(dados.refeicao_horarios || []); }
  }), [idUsuario, executar]);
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));
  // [F401] Salva as alterações feitas nos horários e opções de lembrete.
  const salvar = acao => executar(async atual => { setAviso(''); const dados = await acao(); if (atual()) { setConfig(dados); setAviso('Preferências salvas.'); } });
  return <Card titulo="LEMBRETES">
    {erro ? <Texto erro accessibilityRole="alert">{erro}</Texto> : null}
    {!config ? <Botao configuracao ocupado={ocupado} onPress={carregar}>Carregar preferências</Botao> : <>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}><Texto>Lembretes ativos</Texto><Switch accessibilityLabel="Ativar lembretes" value={config.ativo} disabled={ocupado} trackColor={{ false: cores.borda, true: cores.primaria }} onValueChange={ativo => salvar(() => ativo ? lembreteApi.ativar(idUsuario) : lembreteApi.desativar(idUsuario))} /></View>
      <Texto titulo>Água</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{[60, 90, 120, 180].map(n => <Botao configuracao key={n} disabled={ocupado} selecionado={intervalo === n} onPress={() => setIntervalo(n)}>{n} min</Botao>)}</View>
      <Campo label="Meta diária de água (ml)" keyboardType="decimal-pad" value={meta} editable={!ocupado} onChangeText={setMeta} />
      <Botao configuracao ocupado={ocupado} onPress={() => salvar(() => {
        const valor = Number(meta.replace(',', '.'));
        if (!Number.isFinite(valor) || valor < 500 || valor > 10000) throw new Error('Informe uma meta entre 500 e 10.000 ml.');
        return lembreteApi.configurarAgua(idUsuario, intervalo, valor);
      })}>Salvar água</Botao>
      <Texto titulo>Horários das refeições</Texto>
      {horarios.map((h, i) => <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><View style={{ flex: 1 }}><Campo label={`Horário ${i + 1}`} value={h} placeholder="HH:mm" maxLength={5} editable={!ocupado} onChangeText={v => setHorarios(lista => lista.map((item, j) => j === i ? v : item))} /></View><Botao configuracao disabled={ocupado} onPress={() => setHorarios(lista => lista.filter((_, j) => j !== i))}>Remover</Botao></View>)}
      <Botao configuracao disabled={ocupado} onPress={() => setHorarios(lista => [...lista, ''])}>Adicionar horário</Botao>
      <Botao configuracao ocupado={ocupado} onPress={() => salvar(() => {
        if (!horarios.length || horarios.some(h => !/^([01]\d|2[0-3]):[0-5]\d$/.test(h))) throw new Error('Informe ao menos um horário válido no formato HH:mm.');
        return lembreteApi.configurarRefeicoes(idUsuario, [...new Set(horarios)].sort());
      })}>Salvar horários</Botao>
      {aviso && !erro ? <Texto accessibilityLiveRegion="polite">{aviso}</Texto> : null}
    </>}
  </Card>;
}
