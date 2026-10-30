import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import * as sugestaoApi from '../api/sugestaoApi';
import useTarefa from '../hooks/useTarefa';
import { tipoRefeicao, refeicaoDoHorario, nomeAlimentoExibicao } from '../util/rotina';
import useTheme from '../hooks/useTheme';
import { dataDeHoje } from '../util/data';
import { prepararCelebracao } from '../util/ofensivaCelebracao';
import { Card, Texto, Botao } from './RotinaUI';
import ConfirmacaoAcaoModal from './ConfirmacaoAcaoModal';
const nomes = { cafe_manha: 'Café da manhã', almoco: 'Almoço', lanche: 'Lanche', jantar: 'Jantar', janta: 'Jantar' };
const tituloSugestao = sugestao => {
  const tipo = nomes[tipoRefeicao(sugestao.tipo_refeicao)] || 'Refeição';
  const nome = sugestao.nome.replace(/cafe_manha|almoco|lanche|jantar|janta/g, valor => nomes[valor]);
  return nome.toLowerCase().startsWith(tipo.toLowerCase()) ? nome : `${tipo} · ${nome}`;
};
export default function SugestoesCard({ idUsuario, aoAceitar }) {
  const [sugestoes, setSugestoes] = useState([]);
  const [aviso, setAviso] = useState('');
  const [confirmarDesfazer, setConfirmarDesfazer] = useState(null);
  const [agora, setAgora] = useState(() => new Date());
  const { cores, isDark } = useTheme();
  const tipoAtual = refeicaoDoHorario(agora.getHours());
  const sugestoesAtuais = sugestoes.filter(s => s.data_geracao === dataDeHoje() && tipoRefeicao(s.tipo_refeicao) === tipoAtual);
  const { ocupado, erro, executar } = useTarefa();
  const carregar = useCallback(() => executar(async atual => {
    const lista = await sugestaoApi.listarSugestoes(idUsuario);
    if (atual()) setSugestoes(lista || []);
  }), [idUsuario, executar]);
  useFocusEffect(useCallback(() => {
    carregar();
    setAgora(new Date());
    const intervalo = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(intervalo);
  }, [carregar]));
  const gerar = () => executar(async atual => {
    const lista = await sugestaoApi.gerarSugestoes(idUsuario);
    if (atual()) setSugestoes(lista || []);
  });
  const aceitar = sugestao => executar(async atual => {
    const celebracao = await prepararCelebracao(idUsuario, dataDeHoje());
    let resultado;
    try {
      resultado = await sugestaoApi.aceitarSugestao(sugestao.id_sugestao);
    } catch (erroAceitar) {
      if (erroAceitar.response?.status !== 409) throw erroAceitar;
      const lista = await sugestaoApi.listarSugestoes(idUsuario);
      if (!atual()) return;
      setSugestoes(lista || []);
      setAviso('Esta refeição já foi registrada no Diário.');
      await aoAceitar({ itens_criados: 0 });
      return;
    }
    if (!atual()) return;
    setSugestoes(lista => lista.map(s => s.id_sugestao === sugestao.id_sugestao ? resultado.sugestao : s));
    setAviso(resultado.itens_criados ? 'Refeição registrada no Diário.' : 'A sugestão não tinha alimentos disponíveis para registrar.');
    await aoAceitar(resultado, celebracao);
  });
  const desfazer = () => executar(async atual => {
    try {
      const resultado = await sugestaoApi.desfazerSugestao(confirmarDesfazer.id_sugestao);
      if (!atual()) return;
      setSugestoes(lista => lista.map(s => s.id_sugestao === confirmarDesfazer.id_sugestao ? resultado.sugestao : s));
      setConfirmarDesfazer(null);
      setAviso('Sugestão desmarcada e refeição removida do Diário.');
      await aoAceitar({ itens_criados: 0 });
    } catch (erroDesfazer) {
      if (atual()) setConfirmarDesfazer(null);
      if (erroDesfazer.response?.status === 409) throw new Error(erroDesfazer.message);
      throw erroDesfazer;
    }
  });
  return <Card>
    {erro ? <><Texto erro accessibilityRole="alert">{erro}</Texto><Botao configuracao onPress={carregar} disabled={ocupado}>Tentar carregar novamente</Botao></> : null}
    <Texto style={{ color: cores.textoSuave }}>Para agora: {nomes[tipoAtual]}</Texto>
    {!sugestoesAtuais.length && !ocupado && !erro ? <Texto>Nenhuma sugestão para esta refeição hoje. Gere opções para sua meta.</Texto> : null}
    {aviso ? <Texto accessibilityLiveRegion="polite">{aviso}</Texto> : null}
    {sugestoesAtuais.map(s => <View key={s.id_sugestao} style={{ backgroundColor: cores.fundoInput, borderColor: cores.borda, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
      <Texto titulo>{tituloSugestao(s)}</Texto>
      <Texto>{Math.round(s.calorias || 0)} kcal · P {s.proteinas || 0} g / C {s.carboidratos || 0} g / G {s.gorduras || 0} g</Texto>
      {(s.alimentos_sugeridos || []).map((a, i) => <Texto key={i}>{nomeAlimentoExibicao(a.nome, a.origem_dados || a.marca || (a.food_id?.startsWith('taco_') ? 'TACO' : ''))} · {a.quantidade_g} g</Texto>)}
      {s.aceita ? <Texto style={{ color: cores.textoSuave }}>Registrada no Diário</Texto> : null}
      <Botao configuracao style={isDark && !s.aceita ? { backgroundColor: cores.primaria, borderColor: cores.primaria } : undefined} textoStyle={isDark && !s.aceita ? { color: '#FFFFFF' } : undefined} onPress={() => s.aceita ? setConfirmarDesfazer(s) : aceitar(s)} disabled={ocupado || (!s.aceita && !s.alimentos_sugeridos?.some(a => a.id_alimento_local && a.quantidade_g > 0))}>{s.aceita ? 'Desmarcar sugestão' : !s.alimentos_sugeridos?.some(a => a.id_alimento_local && a.quantidade_g > 0) ? 'Sem alimentos disponíveis' : 'Aceitar e registrar no Diário'}</Botao>
    </View>)}
    <Botao configuracao onPress={gerar} ocupado={ocupado}>Gerar sugestões para minha meta</Botao>
    <ConfirmacaoAcaoModal IconeAcao={Trash2} visivel={!!confirmarDesfazer} cores={cores} ocupado={ocupado} titulo="Desmarcar sugestão?" mensagem="A refeição deste tipo com os mesmos alimentos e quantidades será removida do Diário. Se ela foi alterada ou houver mais de uma igual, confira os itens no Diário." rotuloConfirmar="Desmarcar" labelAcessibilidadeConfirmar="Confirmar desmarcação" labelAcessibilidadeCancelar="Cancelar desmarcação" aoConfirmar={desfazer} aoCancelar={() => setConfirmarDesfazer(null)} />
  </Card>;
}
