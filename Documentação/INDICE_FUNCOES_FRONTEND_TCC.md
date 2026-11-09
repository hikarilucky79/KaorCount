# Índice de funções do frontend — KaorCount

Este documento descreve o aplicativo React Native (`App.js` e `src/`) e o JavaScript das páginas públicas em `backend/public/`.

Os identificadores são globais e permanecem iguais aos comentários no código. Não renumere as funções ao editar este índice.

| Número | Função | Arquivo | O que faz |
| --- | --- | --- | --- |
| F001 | `AppTabs` | [App.js](../App.js) | Monta a navegação por abas e conecta as telas principais do aplicativo. |
| F002 | `NavegacaoRaiz` | [App.js](../App.js) | Configura a navegação principal entre as telas e os fluxos de autenticação. |
| F003 | `solicitarPermissaoNotificacao` | [App.js](../App.js) | Solicita ao sistema operacional permissão para exibir notificações. |
| F004 | `App` | [App.js](../App.js) | Inicializa o aplicativo e envolve as telas com os provedores e a navegação necessários. |
| F307 | `setMenuOpen` | [backend/public/index.js](../backend/public/index.js) | Abre ou fecha o menu de navegação da página pública. |
| F308 | `showUnavailable` | [backend/public/js/download.js](../backend/public/js/download.js) | Exibe uma mensagem quando a versão de download não está disponível. |
| F309 | `setMenuOpen` | [backend/public/js/index.js](../backend/public/js/index.js) | Abre ou fecha o menu de navegação da página pública. |
| F310 | `listarTodos` | [src/api/alimentoApi.js](../src/api/alimentoApi.js) | Solicita à API a lista de alimentos cadastrados. |
| F311 | `buscarPorId` | [src/api/alimentoApi.js](../src/api/alimentoApi.js) | Solicita à API o alimento associado ao identificador informado. |
| F312 | `buscarPorNome` | [src/api/alimentoApi.js](../src/api/alimentoApi.js) | Pesquisa alimentos pelo nome informado. |
| F313 | `criar` | [src/api/alimentoApi.js](../src/api/alimentoApi.js) | Cria um novo registro de alimento pela API. |
| F314 | `registrar` | [src/api/authApi.js](../src/api/authApi.js) | Envia à API os dados para criar uma conta de usuário. |
| F315 | `enviarCodigoEmail` | [src/api/authApi.js](../src/api/authApi.js) | Solicita à API o envio de um código para o endereço informado. |
| F316 | `confirmarCodigoEmail` | [src/api/authApi.js](../src/api/authApi.js) | Envia à API o código digitado para confirmar o endereço de e-mail. |
| F317 | `esqueciSenha` | [src/api/authApi.js](../src/api/authApi.js) | Solicita à API o envio de um código para recuperação da senha. |
| F318 | `redefinirSenha` | [src/api/authApi.js](../src/api/authApi.js) | Envia à API o código de recuperação e a nova senha. |
| F319 | `registrarComQuiz` | [src/api/authApi.js](../src/api/authApi.js) | Envia à API os dados da conta e as respostas do quiz em uma operação idempotente. |
| F320 | `login` | [src/api/authApi.js](../src/api/authApi.js) | Envia as credenciais à API e recebe os dados de autenticação. |
| F321 | `getPerfilAtual` | [src/api/authApi.js](../src/api/authApi.js) | Solicita à API os dados do usuário autenticado. |
| F322 | `getBaseUrl` | [src/api/client.js](../src/api/client.js) | Escolhe o endereço base da API para a plataforma atual. |
| F323 | `gerarSHA256` | [src/api/client.js](../src/api/client.js) | Calcula o hash SHA-256 usado na assinatura de requisições. |
| F324 | `rightRotate` | [src/api/client.js](../src/api/client.js) | Aplica rotação circular à direita de bits no cálculo SHA-256. |
| F325 | `resumoDia` | [src/api/dashboardApi.js](../src/api/dashboardApi.js) | Solicita à API o resumo nutricional da data selecionada. |
| F326 | `resumoSemana` | [src/api/dashboardApi.js](../src/api/dashboardApi.js) | Solicita à API o resumo nutricional da semana. |
| F327 | `resumoMes` | [src/api/dashboardApi.js](../src/api/dashboardApi.js) | Solicita à API o resumo nutricional do mês. |
| F328 | `evolucaoPeso` | [src/api/dashboardApi.js](../src/api/dashboardApi.js) | Solicita à API os registros de evolução do peso. |
| F329 | `buscarAlimentos` | [src/api/fatsecretApi.js](../src/api/fatsecretApi.js) | Solicita à API a pesquisa de alimentos na base externa FatSecret. |
| F330 | `detalhesAlimento` | [src/api/fatsecretApi.js](../src/api/fatsecretApi.js) | Solicita à API os dados detalhados de um alimento do FatSecret. |
| F331 | `importarAlimento` | [src/api/fatsecretApi.js](../src/api/fatsecretApi.js) | Solicita à API a importação local de um alimento do FatSecret. |
| F332 | `listarPorUsuario` | [src/api/historicoProgressoApi.js](../src/api/historicoProgressoApi.js) | Solicita à API as medições de progresso associadas ao usuário. |
| F333 | `criar` | [src/api/historicoProgressoApi.js](../src/api/historicoProgressoApi.js) | Cria um novo registro de histórico de progresso pela API. |
| F334 | `buscarPorId` | [src/api/historicoProgressoApi.js](../src/api/historicoProgressoApi.js) | Solicita à API a medição de progresso associada ao identificador informado. |
| F335 | `novaChaveIdempotente` | [src/api/idempotencia.js](../src/api/idempotencia.js) | Gera uma chave única para identificar uma operação idempotente. |
| F336 | `configIdempotente` | [src/api/idempotencia.js](../src/api/idempotencia.js) | Monta os cabeçalhos HTTP com a chave de idempotência. |
| F337 | `chaveDaOperacao` | [src/api/idempotencia.js](../src/api/idempotencia.js) | Obtém ou cria a chave que identifica uma operação específica. |
| F338 | `buscarConfig` | [src/api/lembreteApi.js](../src/api/lembreteApi.js) | Solicita à API as configurações de lembrete da conta. |
| F339 | `configurarAgua` | [src/api/lembreteApi.js](../src/api/lembreteApi.js) | Envia à API as preferências de lembretes de água. |
| F340 | `configurarRefeicoes` | [src/api/lembreteApi.js](../src/api/lembreteApi.js) | Envia à API as preferências de lembretes de refeições. |
| F341 | `ativar` | [src/api/lembreteApi.js](../src/api/lembreteApi.js) | Solicita à API a ativação dos lembretes. |
| F342 | `desativar` | [src/api/lembreteApi.js](../src/api/lembreteApi.js) | Solicita à API a desativação dos lembretes. |
| F343 | `listarPorUsuario` | [src/api/metaNutriApi.js](../src/api/metaNutriApi.js) | Solicita à API as metas nutricionais associadas ao usuário. |
| F344 | `metaAtual` | [src/api/metaNutriApi.js](../src/api/metaNutriApi.js) | Solicita à API a meta nutricional vigente do usuário. |
| F345 | `buscarPorId` | [src/api/metaNutriApi.js](../src/api/metaNutriApi.js) | Solicita à API a meta nutricional associada ao identificador informado. |
| F346 | `criar` | [src/api/metaNutriApi.js](../src/api/metaNutriApi.js) | Solicita à API a criação de uma meta nutricional. |
| F347 | `atualizar` | [src/api/metaNutriApi.js](../src/api/metaNutriApi.js) | Solicita à API a atualização de uma meta nutricional. |
| F348 | `deletar` | [src/api/metaNutriApi.js](../src/api/metaNutriApi.js) | Solicita à API a remoção de uma meta nutricional. |
| F349 | `buscarPerfil` | [src/api/perfilNutriApi.js](../src/api/perfilNutriApi.js) | Solicita à API os dados do perfil nutricional do usuário. |
| F350 | `criarPerfil` | [src/api/perfilNutriApi.js](../src/api/perfilNutriApi.js) | Solicita à API a criação do perfil nutricional. |
| F351 | `atualizarPerfil` | [src/api/perfilNutriApi.js](../src/api/perfilNutriApi.js) | Solicita à API a atualização do perfil nutricional. |
| F352 | `deletarPerfil` | [src/api/perfilNutriApi.js](../src/api/perfilNutriApi.js) | Solicita à API a remoção do perfil nutricional. |
| F353 | `salvarOuAtualizar` | [src/api/perfilNutriApi.js](../src/api/perfilNutriApi.js) | Cria ou atualiza pela API o perfil nutricional. |
| F354 | `salvarOuAtualizar` | [src/api/pesquisaInicialApi.js](../src/api/pesquisaInicialApi.js) | Cria ou atualiza pela API as respostas da pesquisa inicial. |
| F355 | `salvar` | [src/api/quizApi.js](../src/api/quizApi.js) | Envia à API as respostas do questionário de cadastro. |
| F356 | `listarPorDia` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Lista pela API as refeições da data selecionada. |
| F357 | `listarPorPeriodo` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API as refeições registradas dentro do período informado. |
| F358 | `resumoMacrosDia` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API o resumo diário de calorias e macronutrientes. |
| F359 | `buscarPorId` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API a refeição associada ao identificador informado. |
| F360 | `criar` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API o registro de uma nova refeição. |
| F361 | `atualizar` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API a atualização de uma refeição registrada. |
| F362 | `deletar` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API a remoção de uma refeição registrada. |
| F363 | `listarItens` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API os alimentos de uma refeição. |
| F364 | `adicionarItem` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API a inclusão de um alimento em uma refeição. |
| F365 | `atualizarItem` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API a atualização de um alimento da refeição. |
| F366 | `removerItem` | [src/api/refeicaoApi.js](../src/api/refeicaoApi.js) | Solicita à API a remoção de um alimento da refeição. |
| F367 | `listarPorUsuario` | [src/api/registroAguaApi.js](../src/api/registroAguaApi.js) | Solicita à API os registros de água associados ao usuário. |
| F368 | `totalDia` | [src/api/registroAguaApi.js](../src/api/registroAguaApi.js) | Solicita à API o total de água consumido na data informada. |
| F369 | `listarPorPeriodo` | [src/api/registroAguaApi.js](../src/api/registroAguaApi.js) | Solicita à API os registros de água dentro do período informado. |
| F370 | `criar` | [src/api/registroAguaApi.js](../src/api/registroAguaApi.js) | Solicita à API o registro de um novo consumo de água. |
| F371 | `atualizar` | [src/api/registroAguaApi.js](../src/api/registroAguaApi.js) | Solicita à API a atualização de um registro de consumo de água. |
| F372 | `deletar` | [src/api/registroAguaApi.js](../src/api/registroAguaApi.js) | Solicita à API a remoção de um registro de consumo de água. |
| F373 | `obterDadosRelatorio` | [src/api/relatorioApi.js](../src/api/relatorioApi.js) | Solicita à API os dados necessários para montar o relatório. |
| F374 | `baixarRelatorioPdf` | [src/api/relatorioApi.js](../src/api/relatorioApi.js) | Solicita à API um relatório em PDF e prepara seu download. |
| F375 | `gerarSugestoes` | [src/api/sugestaoApi.js](../src/api/sugestaoApi.js) | Solicita à API novas sugestões de refeição. |
| F376 | `listarSugestoes` | [src/api/sugestaoApi.js](../src/api/sugestaoApi.js) | Solicita à API as sugestões existentes para o usuário. |
| F377 | `aceitarSugestao` | [src/api/sugestaoApi.js](../src/api/sugestaoApi.js) | Envia à API a escolha de uma sugestão de refeição. |
| F378 | `desfazerSugestao` | [src/api/sugestaoApi.js](../src/api/sugestaoApi.js) | Solicita à API o cancelamento da sugestão aceita. |
| F379 | `listarTodos` | [src/api/usuarioApi.js](../src/api/usuarioApi.js) | Solicita à API a lista de contas de usuário. |
| F380 | `buscarPorId` | [src/api/usuarioApi.js](../src/api/usuarioApi.js) | Solicita à API a conta associada ao identificador informado. |
| F381 | `atualizar` | [src/api/usuarioApi.js](../src/api/usuarioApi.js) | Solicita à API a atualização dos dados da conta do usuário. |
| F382 | `desativar` | [src/api/usuarioApi.js](../src/api/usuarioApi.js) | Solicita à API a desativação da conta do usuário. |
| F383 | `deletar` | [src/api/usuarioApi.js](../src/api/usuarioApi.js) | Solicita à API a remoção da conta do usuário. |
| F384 | `buscarVersao` | [src/api/versaoApi.js](../src/api/versaoApi.js) | Consulta à API a versão atual e as exigências de atualização. |
| F385 | `obterTokenAutorizacao` | [src/auth/tokenBridge.js](../src/auth/tokenBridge.js) | Obtém o token de autenticação compartilhado entre módulos do aplicativo. |
| F386 | `limparSessaoGlobal` | [src/auth/tokenBridge.js](../src/auth/tokenBridge.js) | Remove os dados de sessão armazenados globalmente. |
| F387 | `AjudaCategorias` | [src/components/AjudaCategorias.js](../src/components/AjudaCategorias.js) | Monta a interface de ajuda organizada por categorias. |
| F388 | `CadastroAlimento` | [src/components/CadastroAlimento.js](../src/components/CadastroAlimento.js) | Renderiza o formulário de cadastro de um alimento. |
| F389 | `salvar` | [src/components/CadastroAlimento.js](../src/components/CadastroAlimento.js) | Valida os campos e salva o novo alimento. |
| F390 | `ConfirmacaoAcaoModal` | [src/components/ConfirmacaoAcaoModal.js](../src/components/ConfirmacaoAcaoModal.js) | Exibe uma janela que pede confirmação antes de uma ação importante. |
| F391 | `cancelar` | [src/components/ConfirmacaoAcaoModal.js](../src/components/ConfirmacaoAcaoModal.js) | Fecha a confirmação sem executar a ação solicitada. |
| F392 | `DropdownGenerico` | [src/components/DropdownGenerico.js](../src/components/DropdownGenerico.js) | Exibe uma lista suspensa reutilizável para escolher uma opção. |
| F393 | `selecionar` | [src/components/DropdownGenerico.js](../src/components/DropdownGenerico.js) | Atualiza a opção escolhida no menu suspenso. |
| F394 | `GraficoPeso` | [src/components/EvolucaoPesoCard.js](../src/components/EvolucaoPesoCard.js) | Renderiza o gráfico com os registros de evolução do peso. |
| F395 | `dataCurta` | [src/components/EvolucaoPesoCard.js](../src/components/EvolucaoPesoCard.js) | Formata uma data para o rótulo curto exibido no gráfico de peso. |
| F396 | `EvolucaoPesoCard` | [src/components/EvolucaoPesoCard.js](../src/components/EvolucaoPesoCard.js) | Exibe a evolução do peso e oferece o formulário para registrar uma nova medição. |
| F397 | `registrar` | [src/components/EvolucaoPesoCard.js](../src/components/EvolucaoPesoCard.js) | Registra uma nova medição de peso e atualiza a evolução exibida. |
| F398 | `GraficoPreferencia` | [src/components/GraficoPreferencia.js](../src/components/GraficoPreferencia.js) | Exibe controles para escolher o período mostrado no gráfico. |
| F399 | `mudar` | [src/components/GraficoPreferencia.js](../src/components/GraficoPreferencia.js) | Altera o período exibido no gráfico e salva a preferência. |
| F400 | `LembretesCard` | [src/components/LembretesCard.js](../src/components/LembretesCard.js) | Exibe e edita os horários de lembrete de água e refeições. |
| F401 | `salvar` | [src/components/LembretesCard.js](../src/components/LembretesCard.js) | Salva as alterações feitas nos horários e opções de lembrete. |
| F402 | `LoadingIndicator` | [src/components/LoadingIndicator.js](../src/components/LoadingIndicator.js) | Exibe o indicador visual enquanto uma operação está em andamento. |
| F403 | `IconeOfensiva` | [src/components/OfensivaBadge.js](../src/components/OfensivaBadge.js) | Renderiza o ícone correspondente à sequência de dias do usuário. |
| F404 | `OfensivaBadge` | [src/components/OfensivaBadge.js](../src/components/OfensivaBadge.js) | Exibe o emblema e o marco atual da sequência de dias do usuário. |
| F405 | `OfensivaCelebracao` | [src/components/OfensivaCelebracao.js](../src/components/OfensivaCelebracao.js) | Renderiza a celebração visual de um marco da sequência de uso. |
| F406 | `PrivacidadeCard` | [src/components/PrivacidadeCard.js](../src/components/PrivacidadeCard.js) | Exibe ações de exportação de dados e desativação da conta. |
| F407 | `exportar` | [src/components/PrivacidadeCard.js](../src/components/PrivacidadeCard.js) | Solicita uma cópia dos dados do usuário para exportação. |
| F408 | `desativar` | [src/components/PrivacidadeCard.js](../src/components/PrivacidadeCard.js) | Envia a solicitação para desativar a conta do usuário. |
| F409 | `RelatorioCard` | [src/components/RelatorioCard.js](../src/components/RelatorioCard.js) | Exibe os filtros de período e ações para consultar ou baixar o relatório. |
| F410 | `datas` | [src/components/RelatorioCard.js](../src/components/RelatorioCard.js) | Calcula o intervalo de datas selecionado para o relatório. |
| F411 | `consultar` | [src/components/RelatorioCard.js](../src/components/RelatorioCard.js) | Solicita o relatório do período selecionado. |
| F412 | `baixar` | [src/components/RelatorioCard.js](../src/components/RelatorioCard.js) | Faz o download do arquivo de relatório gerado. |
| F413 | `Texto` | [src/components/RotinaUI.js](../src/components/RotinaUI.js) | Renderiza texto com os estilos e cores do tema atual. |
| F414 | `Card` | [src/components/RotinaUI.js](../src/components/RotinaUI.js) | Renderiza um contêiner visual padronizado para agrupar conteúdo. |
| F415 | `Botao` | [src/components/RotinaUI.js](../src/components/RotinaUI.js) | Renderiza um botão padronizado com estados de interação. |
| F416 | `Campo` | [src/components/RotinaUI.js](../src/components/RotinaUI.js) | Renderiza um campo de formulário com estilo consistente. |
| F417 | `tituloSugestao` | [src/components/SugestoesCard.js](../src/components/SugestoesCard.js) | Determina o título da sugestão de acordo com o tipo de refeição. |
| F418 | `SugestoesCard` | [src/components/SugestoesCard.js](../src/components/SugestoesCard.js) | Exibe sugestões de refeições e ações para gerar, aceitar ou desfazer uma sugestão. |
| F419 | `gerar` | [src/components/SugestoesCard.js](../src/components/SugestoesCard.js) | Solicita novas sugestões de refeição para exibição no cartão. |
| F420 | `aceitar` | [src/components/SugestoesCard.js](../src/components/SugestoesCard.js) | Registra a sugestão de refeição escolhida pelo usuário. |
| F421 | `desfazer` | [src/components/SugestoesCard.js](../src/components/SugestoesCard.js) | Desfaz a aceitação da sugestão escolhida. |
| F422 | `AuthProvider` | [src/contexts/AuthContext.js](../src/contexts/AuthContext.js) | Compartilha estado e operações de autenticação com as telas do aplicativo. |
| F423 | `recuperarSessao` | [src/contexts/AuthContext.js](../src/contexts/AuthContext.js) | Restaura a sessão salva e verifica se o token do usuário continua válido. |
| F424 | `limparSessao` | [src/contexts/AuthContext.js](../src/contexts/AuthContext.js) | Remove tokens e dados locais da sessão atual. |
| F425 | `useAuth` | [src/contexts/AuthContext.js](../src/contexts/AuthContext.js) | Disponibiliza estado e ações reutilizáveis para autenticação. |
| F426 | `ThemeProvider` | [src/contexts/ThemeContext.js](../src/contexts/ThemeContext.js) | Compartilha o tema e as opções de aparência com os componentes. |
| F427 | `useAtualizacaoApp` | [src/hooks/useAtualizacaoApp.js](../src/hooks/useAtualizacaoApp.js) | Consulta e disponibiliza o estado de versão e atualização do aplicativo. |
| F428 | `useAuth` | [src/hooks/useAuth.js](../src/hooks/useAuth.js) | Disponibiliza os dados e as ações de autenticação para os componentes. |
| F429 | `useReduceMotion` | [src/hooks/useReduceMotion.js](../src/hooks/useReduceMotion.js) | Informa se o dispositivo ou usuário prefere reduzir animações. |
| F430 | `useResponsive` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Disponibiliza funções de escala e medidas adaptadas às dimensões da tela. |
| F431 | `scale` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Ajusta um tamanho horizontal de acordo com a largura da tela. |
| F432 | `verticalScale` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Ajusta um tamanho vertical de acordo com a altura da tela. |
| F433 | `moderateScale` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Aplica uma escala moderada a um tamanho para diferentes telas. |
| F434 | `rf` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Calcula um tamanho de fonte adaptado à largura da tela. |
| F435 | `rw` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Calcula uma medida horizontal adaptada à largura da tela. |
| F436 | `rh` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Calcula uma medida vertical adaptada à altura da tela. |
| F437 | `getContainer` | [src/hooks/useResponsive.js](../src/hooks/useResponsive.js) | Monta o estilo do contêiner de acordo com as dimensões da tela. |
| F438 | `useTarefa` | [src/hooks/useTarefa.js](../src/hooks/useTarefa.js) | Executa uma tarefa assíncrona e disponibiliza estado de carregamento e erro. |
| F439 | `useTheme` | [src/hooks/useTheme.js](../src/hooks/useTheme.js) | Disponibiliza o tema ativo para os componentes. |
| F440 | `AtualizacaoScreen` | [src/screens/AtualizacaoScreen.js](../src/screens/AtualizacaoScreen.js) | Monta a tela que informa e inicia a atualização do aplicativo. |
| F441 | `atualizar` | [src/screens/AtualizacaoScreen.js](../src/screens/AtualizacaoScreen.js) | Abre o endereço de download e inicia a atualização do aplicativo. |
| F442 | `AuthScreen` | [src/screens/AuthScreen.js](../src/screens/AuthScreen.js) | Monta a tela de login, cadastro e recuperação de senha. |
| F443 | `transicionarPara` | [src/screens/AuthScreen.js](../src/screens/AuthScreen.js) | Troca o fluxo exibido e coordena a transição visual da tela. |
| F444 | `handleLogin` | [src/screens/AuthScreen.js](../src/screens/AuthScreen.js) | Valida os campos e envia as credenciais para autenticação. |
| F445 | `handleCadastrar` | [src/screens/AuthScreen.js](../src/screens/AuthScreen.js) | Abre o fluxo de criação de uma nova conta. |
| F446 | `BotaoObjetivoAnimado` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Renderiza um botão de objetivo nutricional com animação de seleção. |
| F447 | `BotaoAtividadeAnimado` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Renderiza um botão de nível de atividade com animação de seleção. |
| F448 | `ConfiguracaoScreen` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Monta a tela de preferências da conta e do aplicativo. |
| F449 | `atualizarUnidade` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Salva a preferência de unidade de medida selecionada. |
| F450 | `alterarNivelAtividade` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Atualiza o nível de atividade física e recalcula as metas. |
| F451 | `alterarObjetivo` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Atualiza o objetivo nutricional e recalcula as metas. |
| F452 | `executarLogout` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Encerra a sessão e apaga os dados de autenticação locais. |
| F453 | `handleLogout` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Abre a confirmação para encerrar a sessão do usuário. |
| F454 | `selecionarItem` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Seleciona e abre a opção de configuração escolhida. |
| F455 | `voltar` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Retorna à tela ou seção anterior das configurações. |
| F456 | `renderDetalhe` | [src/screens/ConfiguracaoScreen.js](../src/screens/ConfiguracaoScreen.js) | Renderiza o conteúdo detalhado da opção de configuração selecionada. |
| F457 | `normalizarTexto` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Padroniza o texto de busca para ignorar caixa e acentuação. |
| F458 | `DiarioAlimentar` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Monta o diário para registrar refeições, calorias e consumo de água. |
| F459 | `calcularTotaisDoDia` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Soma calorias e nutrientes de todas as refeições da data selecionada. |
| F460 | `calcularCaloriasRefeicoes` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Soma as calorias dos itens de uma lista de refeições. |
| F461 | `mudarData` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Altera a data selecionada no diário alimentar. |
| F462 | `adicionarAgua` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Registra o volume de água informado pelo usuário. |
| F463 | `abrirModalAdicionar` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Abre o formulário para adicionar alimento ou refeição. |
| F464 | `confirmarAdicionarAlimento` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Valida e registra o alimento selecionado no diário. |
| F465 | `removerItem` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Abre a confirmação para remover um alimento do diário. |
| F466 | `confirmarRemocaoItem` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Confirma a remoção do item selecionado. |
| F467 | `cancelarRemocaoItem` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Cancela a remoção e limpa o estado de confirmação. |
| F468 | `calcularCaloriasTipo` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Soma as calorias de refeições de um tipo específico. |
| F469 | `exibirOfensiva` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Prepara e exibe a celebração da sequência registrada no diário. |
| F470 | `copiarDeOntem` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Copia para a data atual os alimentos registrados no dia anterior. |
| F471 | `renderBlocoRefeicao` | [src/screens/DiarioAlimentar.js](../src/screens/DiarioAlimentar.js) | Monta o bloco visual de uma categoria de refeição. |
| F472 | `BarraHistorico` | [src/screens/HomeScreen.js](../src/screens/HomeScreen.js) | Renderiza uma barra do gráfico que resume o consumo calórico de um dia. |
| F473 | `HomeScreen` | [src/screens/HomeScreen.js](../src/screens/HomeScreen.js) | Monta o painel diário com metas, consumo e progresso do usuário. |
| F474 | `aoAceitarSugestao` | [src/screens/HomeScreen.js](../src/screens/HomeScreen.js) | Atualiza a tela após a aceitação de uma sugestão de refeição. |
| F475 | `PerfilScreen` | [src/screens/PerfilScreen.js](../src/screens/PerfilScreen.js) | Monta a tela para visualizar e editar o perfil nutricional. |
| F476 | `classificarIMC` | [src/screens/PerfilScreen.js](../src/screens/PerfilScreen.js) | Classifica o índice de massa corporal de acordo com a faixa calculada. |
| F477 | `formatarDataInput` | [src/screens/PerfilScreen.js](../src/screens/PerfilScreen.js) | Formata a data de nascimento para o campo de edição do perfil. |
| F478 | `voltarDoEditor` | [src/screens/PerfilScreen.js](../src/screens/PerfilScreen.js) | Fecha o editor e retorna à visualização do perfil. |
| F479 | `handleSalvarPerfil` | [src/screens/PerfilScreen.js](../src/screens/PerfilScreen.js) | Valida e salva os dados alterados no perfil nutricional. |
| F480 | `NumeroAnimado` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Renderiza um valor numérico com animação respeitando a preferência de movimento reduzido. |
| F481 | `caminhoArcoRosquinha` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Calcula o caminho vetorial de um segmento do gráfico de rosca. |
| F482 | `ponto` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Calcula as coordenadas de um ponto do gráfico a partir do raio e do ângulo. |
| F483 | `CartaoOpcao` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Renderiza uma opção do questionário em formato de cartão selecionável. |
| F484 | `PilulaOpcao` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Renderiza uma opção selecionável em formato de pílula. |
| F485 | `EntradaNumerica` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Renderiza um campo numérico que limita, arredonda e formata o valor digitado. |
| F486 | `limitar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Restringe um valor aos limites mínimo e máximo informados. |
| F487 | `arredondar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Arredonda o valor numérico para a quantidade de casas decimais configurada. |
| F488 | `formatar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Formata um número para exibição no campo de entrada. |
| F489 | `aoDigitar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Interpreta a entrada numérica digitada e aplica limites e formatação. |
| F490 | `aoSair` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Confirma e formata o valor quando o campo de entrada perde o foco. |
| F491 | `QuizCadastroScreen` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta o questionário inicial e calcula a prévia do plano nutricional. |
| F492 | `validarDataNascimento` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Verifica se a data de nascimento informada é válida. |
| F493 | `dataParaISO` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Converte a data do formulário para o formato ISO usado pela API. |
| F494 | `atualizarAnoNascimento` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Atualiza o ano exibido no campo de nascimento. |
| F495 | `validarEtapa` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Valida os campos obrigatórios da etapa atual do cadastro. |
| F496 | `transicionarEtapa` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Atualiza a etapa atual do questionário e a animação de transição. |
| F497 | `avancar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Valida os dados e avança para a próxima etapa do cadastro. |
| F498 | `voltar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Retorna à etapa anterior do questionário. |
| F499 | `salvarTudo` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Envia o cadastro e as respostas do quiz para persistência. |
| F500 | `handleFinalizar` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Finaliza o questionário quando não há transição em andamento. |
| F501 | `renderCabecalhoEtapa` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta o título e a pergunta da etapa do questionário. |
| F502 | `renderGenero` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta as opções de gênero do questionário. |
| F503 | `renderUnidades` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta as opções de unidade de medida. |
| F504 | `renderNascimento` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta os campos da etapa de data de nascimento. |
| F505 | `renderAltura` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta os campos da etapa de altura. |
| F506 | `renderPeso` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta os campos da etapa de peso. |
| F507 | `renderAtividade` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta as opções de nível de atividade física. |
| F508 | `renderObjetivo` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta as opções de objetivo nutricional. |
| F509 | `renderRitmo` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta as opções de ritmo para mudança de peso. |
| F510 | `renderOrigemApp` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta a pergunta sobre como o usuário conheceu o aplicativo. |
| F511 | `renderExperienciaCalorias` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta a pergunta sobre a experiência com contagem de calorias. |
| F512 | `renderPesoObjetivo` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta os campos para definir o peso desejado. |
| F513 | `renderConclusao` | [src/screens/QuizCadastroScreen.js](../src/screens/QuizCadastroScreen.js) | Monta a tela final com o plano nutricional calculado. |
| F514 | `mensagemDoErro` | [src/screens/VerificarEmailScreen.js](../src/screens/VerificarEmailScreen.js) | Traduz erros da API em mensagens exibidas na tela de confirmação. |
| F515 | `VerificarEmailScreen` | [src/screens/VerificarEmailScreen.js](../src/screens/VerificarEmailScreen.js) | Monta a tela que recebe e valida o código de confirmação de e-mail. |
| F516 | `confirmar` | [src/screens/VerificarEmailScreen.js](../src/screens/VerificarEmailScreen.js) | Valida o código digitado e confirma o endereço de e-mail. |
| F517 | `aoDigitar` | [src/screens/VerificarEmailScreen.js](../src/screens/VerificarEmailScreen.js) | Atualiza e valida a entrada do código conforme o usuário digita. |
| F518 | `reenviar` | [src/screens/VerificarEmailScreen.js](../src/screens/VerificarEmailScreen.js) | Solicita o reenvio do código de confirmação de e-mail. |
| F519 | `salvarArquivo` | [src/util/arquivos.js](../src/util/arquivos.js) | Salva o conteúdo no dispositivo ou compartilha o arquivo gerado. |
| F520 | `formatarDataAPI` | [src/util/data.js](../src/util/data.js) | Converte uma data para o formato aceito pela API. |
| F521 | `dataDeHoje` | [src/util/data.js](../src/util/data.js) | Retorna a data atual no formato aceito pela API. |
| F522 | `normalizarUnidades` | [src/util/medidas.js](../src/util/medidas.js) | Completa e padroniza as preferências de unidade de medida. |
| F523 | `pesoParaKg` | [src/util/medidas.js](../src/util/medidas.js) | Converte o peso informado para quilogramas. |
| F524 | `pesoDeKg` | [src/util/medidas.js](../src/util/medidas.js) | Converte quilogramas para a unidade de peso escolhida. |
| F525 | `alturaParaCm` | [src/util/medidas.js](../src/util/medidas.js) | Converte a altura informada para centímetros. |
| F526 | `alturaDeCm` | [src/util/medidas.js](../src/util/medidas.js) | Converte centímetros para a unidade de altura escolhida. |
| F527 | `formatarNumero` | [src/util/medidas.js](../src/util/medidas.js) | Formata um número para exibição com vírgula decimal. |
| F528 | `formatarPeso` | [src/util/medidas.js](../src/util/medidas.js) | Formata o peso na unidade escolhida para exibição. |
| F529 | `formatarAltura` | [src/util/medidas.js](../src/util/medidas.js) | Formata a altura na unidade escolhida para exibição. |
| F530 | `formatarAgua` | [src/util/medidas.js](../src/util/medidas.js) | Formata o consumo de água na unidade escolhida para exibição. |
| F531 | `formatarValorInput` | [src/util/medidas.js](../src/util/medidas.js) | Prepara o número para ser exibido em um campo de entrada. |
| F532 | `unidadesDaConta` | [src/util/medidas.js](../src/util/medidas.js) | Obtém as preferências de unidade salvas na conta e padroniza seus valores. |
| F533 | `calcularIdade` | [src/util/nutricao.js](../src/util/nutricao.js) | Calcula a idade considerando se a pessoa já fez aniversário neste ano. |
| F534 | `calcularTMB` | [src/util/nutricao.js](../src/util/nutricao.js) | Calcula a taxa metabólica basal pela fórmula Mifflin-St Jeor. |
| F535 | `calcularCaloriasDiarias` | [src/util/nutricao.js](../src/util/nutricao.js) | Estima a meta calórica diária a partir da atividade física e do objetivo. |
| F536 | `calcularMacros` | [src/util/nutricao.js](../src/util/nutricao.js) | Calcula as metas diárias de carboidratos, proteínas e gorduras. |
| F537 | `calcularPlanoNutricional` | [src/util/nutricao.js](../src/util/nutricao.js) | Calcula TMB, calorias e macronutrientes a partir das respostas do quiz. |
| F538 | `distribuicaoCalorica` | [src/util/nutricao.js](../src/util/nutricao.js) | Calcula o percentual calórico proveniente de cada macronutriente. |
| F539 | `parseNumeroBr` | [src/util/nutricao.js](../src/util/nutricao.js) | Converte texto numérico pt-BR em número JavaScript. |
| F540 | `chave` | [src/util/ofensivaCelebracao.js](../src/util/ofensivaCelebracao.js) | Monta a chave usada para registrar a celebração de uma data. |
| F541 | `prepararCelebracao` | [src/util/ofensivaCelebracao.js](../src/util/ofensivaCelebracao.js) | Verifica se a sequência de uso atingiu um marco e prepara sua celebração. |
| F542 | `concluirCelebracao` | [src/util/ofensivaCelebracao.js](../src/util/ofensivaCelebracao.js) | Registra que a celebração preparada foi exibida ao usuário. |
| F543 | `marcarCelebracao` | [src/util/ofensivaCelebracao.js](../src/util/ofensivaCelebracao.js) | Marca a celebração como concluída para evitar repetições. |
| F544 | `carregarPeriodoGrafico` | [src/util/preferenciasGrafico.js](../src/util/preferenciasGrafico.js) | Carrega a preferência salva para o período do gráfico. |
| F545 | `salvarPeriodoGrafico` | [src/util/preferenciasGrafico.js](../src/util/preferenciasGrafico.js) | Salva a preferência de período do gráfico. |
| F546 | `scale` | [src/util/responsive.js](../src/util/responsive.js) | Ajusta um tamanho horizontal de acordo com a largura da tela. |
| F547 | `verticalScale` | [src/util/responsive.js](../src/util/responsive.js) | Ajusta um tamanho vertical de acordo com a altura da tela. |
| F548 | `moderateScale` | [src/util/responsive.js](../src/util/responsive.js) | Aplica uma escala moderada a um tamanho para diferentes telas. |
| F549 | `responsiveFontSize` | [src/util/responsive.js](../src/util/responsive.js) | Calcula um tamanho de fonte adaptável às dimensões da tela. |
| F550 | `getDeviceInfo` | [src/util/responsive.js](../src/util/responsive.js) | Classifica as dimensões da tela e retorna informações de layout do dispositivo. |
| F551 | `getContainerStyle` | [src/util/responsive.js](../src/util/responsive.js) | Calcula a largura máxima e o estilo do contêiner para a tela. |
| F552 | `marcoOfensiva` | [src/util/rotina.js](../src/util/rotina.js) | Retorna o marco de sequência correspondente ao número de dias informado. |
| F553 | `historicoPeriodo` | [src/util/rotina.js](../src/util/rotina.js) | Calcula os dias que compõem o período selecionado no histórico. |
| F554 | `dataISO` | [src/util/rotina.js](../src/util/rotina.js) | Valida e converte uma data para o formato ISO. |
| F555 | `validarPeriodo` | [src/util/rotina.js](../src/util/rotina.js) | Confere se o intervalo de datas informado é válido. |
| F556 | `validarAlimento` | [src/util/rotina.js](../src/util/rotina.js) | Valida os campos obrigatórios de um alimento. |
| F557 | `tipoRefeicao` | [src/util/rotina.js](../src/util/rotina.js) | Converte o tipo de refeição para o padrão aceito pelo aplicativo. |
| F558 | `pontosPeso` | [src/util/rotina.js](../src/util/rotina.js) | Prepara os pontos do gráfico a partir dos registros de peso. |
| F559 | `primeiraComidaDoDia` | [src/util/rotina.js](../src/util/rotina.js) | Verifica se a refeição registrada é a primeira do dia e se pode gerar celebração. |
| F560 | `refeicaoDoHorario` | [src/util/rotina.js](../src/util/rotina.js) | Escolhe a categoria de refeição correspondente ao horário. |
| F561 | `nomeAlimentoExibicao` | [src/util/rotina.js](../src/util/rotina.js) | Formata o nome do alimento para apresentação na interface. |
| F562 | `normalizar` | [src/util/senha.js](../src/util/senha.js) | Padroniza o texto da senha para verificar se contém dados pessoais. |
| F563 | `validarSenha` | [src/util/senha.js](../src/util/senha.js) | Valida a senha e verifica se ela contém dados pessoais fáceis de adivinhar. |
| F564 | `carregarUnidades` | [src/util/unidades.js](../src/util/unidades.js) | Carrega do armazenamento local as preferências de unidades. |
| F565 | `salvarUnidades` | [src/util/unidades.js](../src/util/unidades.js) | Persiste no armazenamento local as preferências de unidades. |
| F566 | `validarFormulario` | [src/util/validacoes.js](../src/util/validacoes.js) | Valida os dados recebidos pelo formulário antes do envio. |
| F567 | `partes` | [src/util/versao.js](../src/util/versao.js) | Divide a versão em componentes numéricos para comparação. |
| F568 | `compararVersoes` | [src/util/versao.js](../src/util/versao.js) | Compara duas versões semânticas do aplicativo. |
| F569 | `avaliarAtualizacao` | [src/util/versao.js](../src/util/versao.js) | Determina se a versão instalada deve ou precisa ser atualizada. |
| F570 | `resolverUrl` | [src/util/versao.js](../src/util/versao.js) | Resolve o endereço de download usando a URL base da API. |
