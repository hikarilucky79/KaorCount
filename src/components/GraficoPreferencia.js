import React from 'react';
import { View } from 'react-native';
import useAuth from '../hooks/useAuth';
import useTarefa from '../hooks/useTarefa';
import { Card, Texto, Botao } from './RotinaUI';
export default function GraficoPreferencia() {
  const { usuario, salvarPreferencias } = useAuth();
  const periodo = usuario?.preferencias?.periodo_grafico ?? 7;
  const { ocupado, erro, executar } = useTarefa();
  const mudar = valor => executar(async () => { await salvarPreferencias({ periodo_grafico: valor }); });
  return <Card titulo="HISTÓRICO DE CALORIAS">
    <Texto>Escolha o período exibido no gráfico da tela inicial.</Texto>
    {erro ? <Texto erro accessibilityRole="alert">{erro}</Texto> : null}
    <View style={{flexDirection:'row',gap:8}}>{[7,30].map(n => <Botao configuracao key={n} selecionado={periodo === n} disabled={ocupado} onPress={() => mudar(n)}>{n} dias</Botao>)}</View>
  </Card>;
}
