import React, { useState } from 'react';
import { View } from 'react-native';
import * as relatorioApi from '../api/relatorioApi';
import { formatarDataAPI } from '../util/data';
import { validarPeriodo } from '../util/rotina';
import useTarefa from '../hooks/useTarefa';
import { Card, Texto, Campo, Botao } from './RotinaUI';
export default function RelatorioCard({ idUsuario, abertoInicial = false }) {
  const [aberto, setAberto] = useState(abertoInicial);
  const [periodo, setPeriodo] = useState(7);
  const [inicio, setInicio] = useState('');
  const [fim, setFim] = useState('');
  const [resumo, setResumo] = useState(null);
  const { ocupado, erro, executar } = useTarefa();
  const datas = () => {
    if (periodo === 'personalizado') return validarPeriodo(inicio, fim);
    const final = new Date(); const inicial = new Date(final);
    inicial.setDate(inicial.getDate() - periodo + 1);
    return [formatarDataAPI(inicial), formatarDataAPI(final)];
  };
  const consultar = () => executar(async atual => {
    const [a, b] = datas();
    const dados = await relatorioApi.obterDadosRelatorio(idUsuario, a, b);
    if (atual()) setResumo(dados.resumo);
  });
  const baixar = () => executar(async () => { const [a, b] = datas(); await relatorioApi.baixarRelatorioPdf(idUsuario, a, b); });
  return <Card titulo="RELATÓRIO NUTRICIONAL">
    <Botao configuracao onPress={() => setAberto(!aberto)} disabled={ocupado}>Exportar Relatório Nutricional (PDF)</Botao>
    {aberto ? <>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 12, marginBottom: 8 }}>{[7, 30, 'personalizado'].map(p => <Botao configuracao key={p} disabled={ocupado} selecionado={periodo === p} onPress={() => { setPeriodo(p); setResumo(null); }}>{p === 'personalizado' ? 'Personalizado' : `Últimos ${p} dias`}</Botao>)}</View>
      {periodo === 'personalizado' ? <><Campo label="Data inicial (DD/MM/AAAA)" value={inicio} editable={!ocupado} onChangeText={v => { setInicio(v); setResumo(null); }} placeholder="DD/MM/AAAA" maxLength={10} /><Campo label="Data final (DD/MM/AAAA)" value={fim} editable={!ocupado} onChangeText={v => { setFim(v); setResumo(null); }} placeholder="DD/MM/AAAA" maxLength={10} /></> : null}
      {erro ? <Texto erro accessibilityRole="alert">{erro}</Texto> : null}
      <Botao configuracao ocupado={ocupado} onPress={consultar}>Ver resumo do período</Botao>
      {resumo ? <Texto>{resumo.dias_no_periodo} dias · Média de {Math.round(resumo.media_calorias_dia || 0)} kcal/dia · Água: {Math.round(resumo.media_agua_dia_ml || 0)} ml/dia</Texto> : null}
      <Botao configuracao ocupado={ocupado} onPress={baixar}>Baixar PDF</Botao>
    </> : null}
  </Card>;
}
