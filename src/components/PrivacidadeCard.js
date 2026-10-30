import React, { useState } from 'react';
import * as usuarioApi from '../api/usuarioApi';
import * as relatorioApi from '../api/relatorioApi';
import { salvarArquivo } from '../util/arquivos';
import { dataDeHoje } from '../util/data';
import useTheme from '../hooks/useTheme';
import useTarefa from '../hooks/useTarefa';
import ConfirmacaoAcaoModal from './ConfirmacaoAcaoModal';
import { Card, Texto, Botao } from './RotinaUI';
export default function PrivacidadeCard({ idUsuario, logout }) {
  const { cores } = useTheme();
  const [confirmar, setConfirmar] = useState(false);
  const { ocupado, erro, executar } = useTarefa();
  const exportar = () => executar(async atual => {
    const fim = dataDeHoje();
    const dados = await relatorioApi.obterDadosRelatorio(idUsuario, '2025-01-01', fim);
    if (atual()) await salvarArquivo(JSON.stringify(dados, null, 2), `dados_nutricionais_kaorcount_${fim}.json`, 'application/json');
  });
  const desativar = () => executar(async atual => {
    try { await usuarioApi.desativar(idUsuario); }
    finally { if (atual()) setConfirmar(false); }
    await logout();
  });
  return <Card titulo="PRIVACIDADE E DADOS">
    <Texto>Exporte seus dados nutricionais de 01/01/2025 até hoje. Este arquivo não inclui todos os dados da conta.</Texto>
    {erro ? <Texto erro accessibilityRole="alert">{erro}</Texto> : null}
    <Botao configuracao ocupado={ocupado} onPress={exportar}>Exportar meus dados nutricionais (JSON)</Botao>
    <Botao configuracao disabled={ocupado} onPress={() => setConfirmar(true)}>Desativar minha conta</Botao>
    <ConfirmacaoAcaoModal visivel={confirmar} cores={cores} ocupado={ocupado} titulo="Desativar sua conta?" mensagem="Seu acesso será desativado e a sessão encerrada. Seus dados não serão excluídos." rotuloConfirmar="Desativar" labelAcessibilidadeConfirmar="Confirmar desativação da conta" labelAcessibilidadeCancelar="Cancelar desativação" aoConfirmar={desativar} aoCancelar={() => setConfirmar(false)} />
  </Card>;
}
