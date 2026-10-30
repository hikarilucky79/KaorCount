import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import * as alimentoApi from '../api/alimentoApi';
import { validarAlimento } from '../util/rotina';
import useTarefa from '../hooks/useTarefa';
import { Texto, Campo, Botao } from './RotinaUI';
const campos = { nome_alimento: 'Nome do alimento', porcao_padrao_g: 'Porção de referência (g)', calorias: 'Calorias (kcal)', proteinas: 'Proteínas (g)', carboidratos: 'Carboidratos (g)', gorduras: 'Gorduras (g)' };
export default function CadastroAlimento({ aoCriar }) {
  const [valores, setValores] = useState({ nome_alimento: '', porcao_padrao_g: '100', calorias: '', proteinas: '', carboidratos: '', gorduras: '' });
  const { ocupado, erro, executar } = useTarefa();
  const salvar = () => executar(async atual => {
    const alimento = await alimentoApi.criar(validarAlimento(valores));
    if (atual()) aoCriar(alimento);
  });
  return <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
    <Texto>Informe os nutrientes da porção de referência.</Texto>
    {Object.entries(campos).map(([campo, label]) => <Campo key={campo} label={label} value={valores[campo]} editable={!ocupado} maxLength={campo === 'nome_alimento' ? 150 : 12} keyboardType={campo === 'nome_alimento' ? 'default' : 'decimal-pad'} onChangeText={valor => setValores(v => ({ ...v, [campo]: valor }))} />)}
    {erro ? <Texto erro accessibilityRole="alert">{erro}</Texto> : null}
    <Botao style={{ alignItems: 'center', justifyContent: 'center' }} textoStyle={{ width: '100%', textAlign: 'center' }} ocupado={ocupado} onPress={salvar}>Salvar e selecionar alimento</Botao>
  </ScrollView>;
}
