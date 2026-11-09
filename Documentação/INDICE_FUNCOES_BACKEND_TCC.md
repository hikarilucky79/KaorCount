# Índice de funções do backend — KaorCount

Este documento descreve as funções da API e dos serviços Python em `backend/app/`.

Os identificadores são globais e permanecem iguais aos comentários no código. Funções adicionadas depois da indexação inicial recebem novos IDs ao final, sem renumerar as entradas existentes.

| Número | Função | Arquivo | O que faz |
| --- | --- | --- | --- |
| F005 | `listar_alimentos` | [backend/app/api/alimento_router.py](../backend/app/api/alimento_router.py) | Lista os alimentos cadastrados, com suporte aos filtros e limites recebidos. |
| F006 | `buscar_alimentos` | [backend/app/api/alimento_router.py](../backend/app/api/alimento_router.py) | Pesquisa alimentos do catálogo local pelos filtros e pelo termo recebidos. |
| F007 | `buscar_alimento` | [backend/app/api/alimento_router.py](../backend/app/api/alimento_router.py) | Busca um alimento específico pelo identificador. |
| F008 | `criar_alimento` | [backend/app/api/alimento_router.py](../backend/app/api/alimento_router.py) | Valida e cadastra um novo alimento. |
| F009 | `registrar` | [backend/app/api/auth_router.py](../backend/app/api/auth_router.py) | Cria uma conta de usuário após validar os dados informados. |
| F010 | `login` | [backend/app/api/auth_router.py](../backend/app/api/auth_router.py) | Autentica o usuário usando e-mail e senha. |
| F011 | `registrar_com_quiz` | [backend/app/api/auth_router.py](../backend/app/api/auth_router.py) | Cria a conta e salva as respostas do questionário de cadastro. |
| F012 | `perfil_atual` | [backend/app/api/auth_router.py](../backend/app/api/auth_router.py) | Retorna o perfil do usuário autenticado. |
| F013 | `resumo_dia` | [backend/app/api/dashboard_router.py](../backend/app/api/dashboard_router.py) | Monta o resumo nutricional do dia, incluindo consumo e metas. |
| F014 | `resumo_semana` | [backend/app/api/dashboard_router.py](../backend/app/api/dashboard_router.py) | Monta o resumo nutricional dos últimos dias da semana. |
| F015 | `resumo_mes` | [backend/app/api/dashboard_router.py](../backend/app/api/dashboard_router.py) | Monta o resumo nutricional do mês. |
| F016 | `evolucao_peso` | [backend/app/api/dashboard_router.py](../backend/app/api/dashboard_router.py) | Retorna os registros usados para acompanhar a evolução do peso. |
| F017 | `enviar_codigo` | [backend/app/api/email_verificacao_router.py](../backend/app/api/email_verificacao_router.py) | Envia ao e-mail um código de verificação. |
| F018 | `confirmar_codigo` | [backend/app/api/email_verificacao_router.py](../backend/app/api/email_verificacao_router.py) | Valida o código enviado e confirma o endereço de e-mail. |
| F019 | `status_fonte_externa` | [backend/app/api/fatsecret_router.py](../backend/app/api/fatsecret_router.py) | Informa a disponibilidade da integração com a base externa de alimentos. |
| F020 | `buscar_alimentos` | [backend/app/api/fatsecret_router.py](../backend/app/api/fatsecret_router.py) | Pesquisa a base externa FatSecret pelos termos enviados pelo aplicativo. |
| F021 | `detalhes_alimento` | [backend/app/api/fatsecret_router.py](../backend/app/api/fatsecret_router.py) | Busca os dados detalhados de um alimento na base externa. |
| F022 | `importar_alimento` | [backend/app/api/fatsecret_router.py](../backend/app/api/fatsecret_router.py) | Importa um alimento da base externa para o cadastro local. |
| F023 | `listar_historico` | [backend/app/api/historico_progresso_router.py](../backend/app/api/historico_progresso_router.py) | Lista histórico. |
| F024 | `historico_por_periodo` | [backend/app/api/historico_progresso_router.py](../backend/app/api/historico_progresso_router.py) | Lista registros de progresso dentro do período informado. |
| F025 | `buscar_historico` | [backend/app/api/historico_progresso_router.py](../backend/app/api/historico_progresso_router.py) | Busca um registro específico do histórico de progresso. |
| F026 | `criar_historico` | [backend/app/api/historico_progresso_router.py](../backend/app/api/historico_progresso_router.py) | Registra uma nova medição no histórico de progresso. |
| F027 | `atualizar_historico` | [backend/app/api/historico_progresso_router.py](../backend/app/api/historico_progresso_router.py) | Atualiza uma medição já registrada no histórico. |
| F028 | `deletar_historico` | [backend/app/api/historico_progresso_router.py](../backend/app/api/historico_progresso_router.py) | Remove uma medição do histórico de progresso. |
| F029 | `buscar_config` | [backend/app/api/lembrete_router.py](../backend/app/api/lembrete_router.py) | Obtém as configurações de lembretes do usuário. |
| F030 | `configurar_agua` | [backend/app/api/lembrete_router.py](../backend/app/api/lembrete_router.py) | Salva horários e preferências dos lembretes de água. |
| F031 | `configurar_refeicoes` | [backend/app/api/lembrete_router.py](../backend/app/api/lembrete_router.py) | Salva horários e preferências dos lembretes de refeições. |
| F032 | `ativar` | [backend/app/api/lembrete_router.py](../backend/app/api/lembrete_router.py) | Ativa os lembretes configurados para o usuário. |
| F033 | `desativar` | [backend/app/api/lembrete_router.py](../backend/app/api/lembrete_router.py) | Desativa os lembretes do usuário. |
| F034 | `listar_metas_por_usuario` | [backend/app/api/meta_nutri_router.py](../backend/app/api/meta_nutri_router.py) | Lista as metas nutricionais associadas ao usuário. |
| F035 | `meta_atual` | [backend/app/api/meta_nutri_router.py](../backend/app/api/meta_nutri_router.py) | Obtém a meta nutricional vigente para o usuário. |
| F036 | `buscar_meta` | [backend/app/api/meta_nutri_router.py](../backend/app/api/meta_nutri_router.py) | Busca uma meta nutricional pelo identificador. |
| F037 | `criar_meta` | [backend/app/api/meta_nutri_router.py](../backend/app/api/meta_nutri_router.py) | Cria uma meta nutricional para o usuário. |
| F038 | `atualizar_meta` | [backend/app/api/meta_nutri_router.py](../backend/app/api/meta_nutri_router.py) | Atualiza uma meta nutricional existente. |
| F039 | `deletar_meta` | [backend/app/api/meta_nutri_router.py](../backend/app/api/meta_nutri_router.py) | Remove uma meta nutricional. |
| F040 | `buscar_perfil` | [backend/app/api/perfil_nutri_router.py](../backend/app/api/perfil_nutri_router.py) | Obtém o perfil nutricional do usuário. |
| F041 | `criar_perfil` | [backend/app/api/perfil_nutri_router.py](../backend/app/api/perfil_nutri_router.py) | Cria o perfil nutricional com os dados informados. |
| F042 | `atualizar_perfil` | [backend/app/api/perfil_nutri_router.py](../backend/app/api/perfil_nutri_router.py) | Atualiza os dados do perfil nutricional. |
| F043 | `deletar_perfil` | [backend/app/api/perfil_nutri_router.py](../backend/app/api/perfil_nutri_router.py) | Remove o perfil nutricional do usuário. |
| F044 | `salvar_pesquisa_inicial` | [backend/app/api/pesquisa_inicial_router.py](../backend/app/api/pesquisa_inicial_router.py) | Salva ou atualiza as respostas da pesquisa inicial. |
| F045 | `salvar_quiz` | [backend/app/api/quiz_router.py](../backend/app/api/quiz_router.py) | Salva as respostas do questionário de cadastro. |
| F046 | `esqueci_a_senha` | [backend/app/api/recuperacao_senha_router.py](../backend/app/api/recuperacao_senha_router.py) | Solicita um código para iniciar a recuperação de senha. |
| F047 | `redefinir_senha` | [backend/app/api/recuperacao_senha_router.py](../backend/app/api/recuperacao_senha_router.py) | Valida o código de recuperação e grava a nova senha. |
| F048 | `listar_refeicoes` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Lista as refeições do usuário. |
| F049 | `refeicoes_por_periodo` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Lista refeições dentro do intervalo informado. |
| F050 | `refeicoes_por_dia` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Lista refeições registradas em uma data. |
| F051 | `resumo_macros_dia` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Calcula o total diário de calorias e macronutrientes. |
| F052 | `buscar_refeicao` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Busca uma refeição pelo identificador. |
| F053 | `criar_refeicao` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Registra uma nova refeição. |
| F054 | `atualizar_refeicao` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Atualiza os dados de uma refeição existente. |
| F055 | `deletar_refeicao` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Remove uma refeição registrada. |
| F056 | `listar_itens` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Lista os alimentos associados a uma refeição. |
| F057 | `adicionar_item` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Adiciona um alimento à refeição. |
| F058 | `atualizar_item` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Atualiza a quantidade ou os dados de um alimento da refeição. |
| F059 | `remover_item` | [backend/app/api/refeicao_router.py](../backend/app/api/refeicao_router.py) | Remove um alimento da refeição. |
| F060 | `listar_registros` | [backend/app/api/registro_agua_router.py](../backend/app/api/registro_agua_router.py) | Lista os registros de consumo de água. |
| F061 | `total_agua_dia` | [backend/app/api/registro_agua_router.py](../backend/app/api/registro_agua_router.py) | Calcula o volume de água registrado na data informada. |
| F062 | `registros_por_periodo` | [backend/app/api/registro_agua_router.py](../backend/app/api/registro_agua_router.py) | Lista os registros de água dentro do intervalo informado. |
| F063 | `criar_registro` | [backend/app/api/registro_agua_router.py](../backend/app/api/registro_agua_router.py) | Registra um novo consumo de água. |
| F064 | `atualizar_registro` | [backend/app/api/registro_agua_router.py](../backend/app/api/registro_agua_router.py) | Atualiza um registro de consumo de água. |
| F065 | `deletar_registro` | [backend/app/api/registro_agua_router.py](../backend/app/api/registro_agua_router.py) | Remove um registro de consumo de água. |
| F066 | `exportar_pdf` | [backend/app/api/relatorio_router.py](../backend/app/api/relatorio_router.py) | Gera e entrega o relatório nutricional em PDF. |
| F067 | `dados_relatorio` | [backend/app/api/relatorio_router.py](../backend/app/api/relatorio_router.py) | Monta os dados usados pelo relatório nutricional. |
| F068 | `limitar_geracao_por_fonte` | [backend/app/api/sugestao_router.py](../backend/app/api/sugestao_router.py) | Limita a frequência de geração de sugestões por fonte de dados. |
| F069 | `_garantir_dono` | [backend/app/api/sugestao_router.py](../backend/app/api/sugestao_router.py) | Confere se o recurso pertence ao usuário autenticado. |
| F070 | `gerar_sugestoes` | [backend/app/api/sugestao_router.py](../backend/app/api/sugestao_router.py) | Gera sugestões de refeições com base nas metas e preferências do usuário. |
| F071 | `listar_sugestoes` | [backend/app/api/sugestao_router.py](../backend/app/api/sugestao_router.py) | Lista sugestões de refeição já geradas para o usuário. |
| F072 | `aceitar` | [backend/app/api/sugestao_router.py](../backend/app/api/sugestao_router.py) | Confirma uma sugestão e registra a refeição correspondente. |
| F073 | `listar_usuarios` | [backend/app/api/usuario_router.py](../backend/app/api/usuario_router.py) | Lista os usuários cadastrados. |
| F074 | `buscar_usuario` | [backend/app/api/usuario_router.py](../backend/app/api/usuario_router.py) | Busca um usuário pelo identificador. |
| F075 | `atualizar_usuario` | [backend/app/api/usuario_router.py](../backend/app/api/usuario_router.py) | Atualiza os dados da conta do usuário. |
| F076 | `desativar_usuario` | [backend/app/api/usuario_router.py](../backend/app/api/usuario_router.py) | Desativa a conta do usuário. |
| F077 | `deletar_usuario` | [backend/app/api/usuario_router.py](../backend/app/api/usuario_router.py) | Remove a conta do usuário. |
| F078 | `versao_do_app` | [backend/app/api/versao_router.py](../backend/app/api/versao_router.py) | Retorna a versão atual do aplicativo e os requisitos de atualização. |
| F079 | `Settings.is_production` | [backend/app/core/config.py](../backend/app/core/config.py) | Verifica se a configuração ativa corresponde ao ambiente de produção. |
| F080 | `Settings.cors_origins_list` | [backend/app/core/config.py](../backend/app/core/config.py) | Converte a configuração de origens permitidas em uma lista para CORS. |
| F081 | `Settings._travar_chave_em_producao` | [backend/app/core/config.py](../backend/app/core/config.py) | Impede o uso de uma chave insegura no ambiente de produção. |
| F082 | `_ssl_do_banco` | [backend/app/core/database.py](../backend/app/core/database.py) | Define as opções TLS/SSL para a conexão com o banco. |
| F083 | `criar_engine` | [backend/app/core/database.py](../backend/app/core/database.py) | Configura a conexão e cria o mecanismo de acesso ao banco. |
| F084 | `SessionTransacional.commit` | [backend/app/core/database.py](../backend/app/core/database.py) | Confirma a transação da sessão do banco de dados. |
| F085 | `get_db` | [backend/app/core/database.py](../backend/app/core/database.py) | Abre e fornece uma sessão de banco de dados para a requisição. |
| F086 | `_error_response` | [backend/app/core/exceptions.py](../backend/app/core/exceptions.py) | Padroniza o formato JSON das respostas de erro da API. |
| F087 | `http_exception_handler` | [backend/app/core/exceptions.py](../backend/app/core/exceptions.py) | Converte erros HTTP em respostas no formato padrão da API. |
| F088 | `validation_exception_handler` | [backend/app/core/exceptions.py](../backend/app/core/exceptions.py) | Converte erros de validação de entrada em respostas compreensíveis. |
| F089 | `integrity_error_handler` | [backend/app/core/exceptions.py](../backend/app/core/exceptions.py) | Converte violações de integridade do banco em respostas de erro. |
| F090 | `data_error_handler` | [backend/app/core/exceptions.py](../backend/app/core/exceptions.py) | Converte erros de dados do banco em respostas de erro. |
| F091 | `operational_error_handler` | [backend/app/core/exceptions.py](../backend/app/core/exceptions.py) | Trata falhas operacionais na comunicação com o banco. |
| F092 | `_hash` | [backend/app/core/idempotencia.py](../backend/app/core/idempotencia.py) | Gera uma assinatura hash para comparar o conteúdo da requisição. |
| F093 | `_reservar` | [backend/app/core/idempotencia.py](../backend/app/core/idempotencia.py) | Reserva uma chave de idempotência para impedir operações duplicadas. |
| F094 | `RotaIdempotente.__init__` | [backend/app/core/idempotencia.py](../backend/app/core/idempotencia.py) | Inicializa a classe RotaIdempotente. |
| F095 | `RotaIdempotente.executar` | [backend/app/core/idempotencia.py](../backend/app/core/idempotencia.py) | Executa o endpoint com controle de idempotência e tratamento de repetição. |
| F096 | `RouterIdempotente.__init__` | [backend/app/core/idempotencia.py](../backend/app/core/idempotencia.py) | Inicializa a classe RouterIdempotente. |
| F097 | `ip_do_cliente` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Identifica o endereço IP associado à requisição do cliente. |
| F098 | `consumir` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Consome uma tentativa do limite configurado e retorna o estado restante. |
| F099 | `_segundos_ate_reiniciar` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Calcula quanto falta para a janela do limite ser reiniciada. |
| F100 | `_rejeitar` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Interrompe a requisição ao exceder o limite permitido. |
| F101 | `limitador_ip` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Cria uma dependência que limita requisições por endereço IP. |
| F102 | `_dependencia` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Verifica e aplica o limite configurado antes de executar a rota. |
| F103 | `limitador_usuario` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Cria uma dependência que limita requisições por usuário. |
| F104 | `_dependencia` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Verifica e aplica o limite configurado antes de executar a rota. |
| F105 | `guarda_cadastro` | [backend/app/core/limite.py](../backend/app/core/limite.py) | Aplica controles de segurança ao endpoint de cadastro. |
| F106 | `hash_senha` | [backend/app/core/security.py](../backend/app/core/security.py) | Gera o hash seguro da senha para armazenamento. |
| F107 | `verificar_senha` | [backend/app/core/security.py](../backend/app/core/security.py) | Compara uma senha informada com o hash armazenado. |
| F108 | `criar_token_acesso` | [backend/app/core/security.py](../backend/app/core/security.py) | Gera o token de autenticação do usuário. |
| F109 | `normalizar_email` | [backend/app/core/security.py](../backend/app/core/security.py) | Padroniza o endereço de e-mail para comparações e armazenamento. |
| F110 | `criar_token_email_verificado` | [backend/app/core/security.py](../backend/app/core/security.py) | Cria um token temporário que comprova a verificação do e-mail. |
| F111 | `exigir_email_verificado` | [backend/app/core/security.py](../backend/app/core/security.py) | Exige um token válido de confirmação de e-mail antes de continuar. |
| F112 | `decodificar_token` | [backend/app/core/security.py](../backend/app/core/security.py) | Valida e interpreta os dados do token de autenticação. |
| F113 | `garantir_proprio_usuario` | [backend/app/core/security.py](../backend/app/core/security.py) | Impede que uma conta acesse dados pertencentes a outro usuário. |
| F114 | `get_usuario_atual` | [backend/app/core/security.py](../backend/app/core/security.py) | Obtém a conta autenticada a partir do token da requisição. |
| F115 | `_normalizar` | [backend/app/core/senha.py](../backend/app/core/senha.py) | Normaliza senha. |
| F116 | `validar_forca_senha` | [backend/app/core/senha.py](../backend/app/core/senha.py) | Verifica se a senha atende aos critérios mínimos de segurança. |
| F117 | `root` | [backend/app/main.py](../backend/app/main.py) | Atende a rota raiz da API com informações básicas do serviço. |
| F118 | `download_page` | [backend/app/main.py](../backend/app/main.py) | Entrega a página pública de download do aplicativo. |
| F119 | `health` | [backend/app/main.py](../backend/app/main.py) | Informa se a API está respondendo. |
| F120 | `aplicar` | [backend/app/migrations/idempotencia.py](../backend/app/migrations/idempotencia.py) | Aplica a migração necessária para criar a estrutura de idempotência. |
| F121 | `AlimentoRepository.__init__` | [backend/app/repositories/alimento_repo.py](../backend/app/repositories/alimento_repo.py) | Inicializa a classe AlimentoRepository. |
| F122 | `AlimentoRepository.get_by_id` | [backend/app/repositories/alimento_repo.py](../backend/app/repositories/alimento_repo.py) | Busca um registro pelo identificador. |
| F123 | `AlimentoRepository.search_by_name` | [backend/app/repositories/alimento_repo.py](../backend/app/repositories/alimento_repo.py) | Busca alimentos pelo nome, com suporte a paginação. |
| F124 | `AlimentoRepository.buscar_por_origem` | [backend/app/repositories/alimento_repo.py](../backend/app/repositories/alimento_repo.py) | Busca um alimento pelo identificador da fonte de origem. |
| F125 | `BaseRepository.__init__` | [backend/app/repositories/base.py](../backend/app/repositories/base.py) | Inicializa a classe BaseRepository. |
| F126 | `BaseRepository.get` | [backend/app/repositories/base.py](../backend/app/repositories/base.py) | Busca um objeto pelo nome do campo e pelo identificador informados. |
| F127 | `BaseRepository.get_all` | [backend/app/repositories/base.py](../backend/app/repositories/base.py) | Lista registros usando os limites de paginação recebidos. |
| F128 | `BaseRepository.create` | [backend/app/repositories/base.py](../backend/app/repositories/base.py) | Cria um objeto e o adiciona à sessão do banco de dados. |
| F129 | `BaseRepository.update` | [backend/app/repositories/base.py](../backend/app/repositories/base.py) | Aplica os campos recebidos a um objeto já persistido. |
| F130 | `BaseRepository.delete` | [backend/app/repositories/base.py](../backend/app/repositories/base.py) | Remove um objeto da sessão de banco de dados. |
| F131 | `HistoricoProgressoRepository.__init__` | [backend/app/repositories/historico_progresso_repo.py](../backend/app/repositories/historico_progresso_repo.py) | Inicializa a classe HistoricoProgressoRepository. |
| F132 | `HistoricoProgressoRepository.get_by_id` | [backend/app/repositories/historico_progresso_repo.py](../backend/app/repositories/historico_progresso_repo.py) | Busca um registro pelo identificador. |
| F133 | `HistoricoProgressoRepository.get_by_usuario` | [backend/app/repositories/historico_progresso_repo.py](../backend/app/repositories/historico_progresso_repo.py) | Busca os registros associados a um usuário. |
| F134 | `HistoricoProgressoRepository.get_by_periodo` | [backend/app/repositories/historico_progresso_repo.py](../backend/app/repositories/historico_progresso_repo.py) | Busca os registros que pertencem ao período informado. |
| F135 | `HistoricoProgressoRepository.get_by_usuario_dia` | [backend/app/repositories/historico_progresso_repo.py](../backend/app/repositories/historico_progresso_repo.py) | Busca o registro do usuário correspondente a uma data. |
| F136 | `ItemRefeicaoRepository.__init__` | [backend/app/repositories/item_refeicao_repo.py](../backend/app/repositories/item_refeicao_repo.py) | Inicializa a classe ItemRefeicaoRepository. |
| F137 | `ItemRefeicaoRepository.get_by_id` | [backend/app/repositories/item_refeicao_repo.py](../backend/app/repositories/item_refeicao_repo.py) | Busca um registro pelo identificador. |
| F138 | `ItemRefeicaoRepository.get_by_refeicao` | [backend/app/repositories/item_refeicao_repo.py](../backend/app/repositories/item_refeicao_repo.py) | Lista os itens vinculados a uma refeição. |
| F139 | `MetaNutriRepository.__init__` | [backend/app/repositories/meta_nutri_repo.py](../backend/app/repositories/meta_nutri_repo.py) | Inicializa a classe MetaNutriRepository. |
| F140 | `MetaNutriRepository.get_by_id` | [backend/app/repositories/meta_nutri_repo.py](../backend/app/repositories/meta_nutri_repo.py) | Busca um registro pelo identificador. |
| F141 | `MetaNutriRepository.get_by_usuario` | [backend/app/repositories/meta_nutri_repo.py](../backend/app/repositories/meta_nutri_repo.py) | Busca os registros associados a um usuário. |
| F142 | `MetaNutriRepository.get_by_usuario_dia` | [backend/app/repositories/meta_nutri_repo.py](../backend/app/repositories/meta_nutri_repo.py) | Busca o registro do usuário correspondente a uma data. |
| F143 | `MetaNutriRepository.get_meta_atual` | [backend/app/repositories/meta_nutri_repo.py](../backend/app/repositories/meta_nutri_repo.py) | Obtém a meta nutricional vigente para o usuário. |
| F144 | `PerfilNutriRepository.__init__` | [backend/app/repositories/perfil_nutri_repo.py](../backend/app/repositories/perfil_nutri_repo.py) | Inicializa a classe PerfilNutriRepository. |
| F145 | `PerfilNutriRepository.get_by_id` | [backend/app/repositories/perfil_nutri_repo.py](../backend/app/repositories/perfil_nutri_repo.py) | Busca um registro pelo identificador. |
| F146 | `PerfilNutriRepository.get_by_usuario` | [backend/app/repositories/perfil_nutri_repo.py](../backend/app/repositories/perfil_nutri_repo.py) | Busca os registros associados a um usuário. |
| F147 | `RefeicaoRepository.__init__` | [backend/app/repositories/refeicao_repo.py](../backend/app/repositories/refeicao_repo.py) | Inicializa a classe RefeicaoRepository. |
| F148 | `RefeicaoRepository.get_by_id` | [backend/app/repositories/refeicao_repo.py](../backend/app/repositories/refeicao_repo.py) | Busca um registro pelo identificador. |
| F149 | `RefeicaoRepository.get_by_usuario` | [backend/app/repositories/refeicao_repo.py](../backend/app/repositories/refeicao_repo.py) | Busca os registros associados a um usuário. |
| F150 | `RefeicaoRepository.get_by_periodo` | [backend/app/repositories/refeicao_repo.py](../backend/app/repositories/refeicao_repo.py) | Busca os registros que pertencem ao período informado. |
| F151 | `RefeicaoRepository.get_by_dia` | [backend/app/repositories/refeicao_repo.py](../backend/app/repositories/refeicao_repo.py) | Busca as refeições do usuário em uma data específica. |
| F152 | `RegistroAguaRepository.__init__` | [backend/app/repositories/registro_agua_repo.py](../backend/app/repositories/registro_agua_repo.py) | Inicializa a classe RegistroAguaRepository. |
| F153 | `RegistroAguaRepository.get_by_id` | [backend/app/repositories/registro_agua_repo.py](../backend/app/repositories/registro_agua_repo.py) | Busca um registro pelo identificador. |
| F154 | `RegistroAguaRepository.get_by_usuario` | [backend/app/repositories/registro_agua_repo.py](../backend/app/repositories/registro_agua_repo.py) | Busca os registros associados a um usuário. |
| F155 | `RegistroAguaRepository.get_by_periodo` | [backend/app/repositories/registro_agua_repo.py](../backend/app/repositories/registro_agua_repo.py) | Busca os registros que pertencem ao período informado. |
| F156 | `RegistroAguaRepository.get_total_dia` | [backend/app/repositories/registro_agua_repo.py](../backend/app/repositories/registro_agua_repo.py) | Soma os registros de água do usuário na data informada. |
| F157 | `RegistroAguaRepository.get_totais_por_periodo` | [backend/app/repositories/registro_agua_repo.py](../backend/app/repositories/registro_agua_repo.py) | Soma o consumo de água por data dentro do período informado. |
| F158 | `UsuarioRepository.__init__` | [backend/app/repositories/usuario_repo.py](../backend/app/repositories/usuario_repo.py) | Inicializa a classe UsuarioRepository. |
| F159 | `UsuarioRepository.get_by_id` | [backend/app/repositories/usuario_repo.py](../backend/app/repositories/usuario_repo.py) | Busca um registro pelo identificador. |
| F160 | `UsuarioRepository.get_by_email` | [backend/app/repositories/usuario_repo.py](../backend/app/repositories/usuario_repo.py) | Busca a conta associada ao endereço de e-mail. |
| F161 | `UsuarioCreate._senha_forte` | [backend/app/schemas/usuario.py](../backend/app/schemas/usuario.py) | Valida a força da senha informada no esquema de entrada. |
| F162 | `SenhaRedefinirRequest._senha_forte` | [backend/app/schemas/usuario.py](../backend/app/schemas/usuario.py) | Valida a força da senha informada no esquema de entrada. |
| F163 | `AlimentoService.__init__` | [backend/app/services/alimento_service.py](../backend/app/services/alimento_service.py) | Inicializa a classe AlimentoService. |
| F164 | `AlimentoService.listar_todos` | [backend/app/services/alimento_service.py](../backend/app/services/alimento_service.py) | Lista alimentos do catálogo local com os filtros informados. |
| F165 | `AlimentoService.buscar_por_nome` | [backend/app/services/alimento_service.py](../backend/app/services/alimento_service.py) | Pesquisa o catálogo local pelo nome do alimento. |
| F166 | `AuthService.__init__` | [backend/app/services/auth_service.py](../backend/app/services/auth_service.py) | Inicializa a classe AuthService. |
| F167 | `AuthService.registrar` | [backend/app/services/auth_service.py](../backend/app/services/auth_service.py) | Cria uma conta de usuário após validar os dados informados. |
| F168 | `AuthService.login` | [backend/app/services/auth_service.py](../backend/app/services/auth_service.py) | Autentica o usuário usando e-mail e senha. |
| F169 | `BaseService.__init__` | [backend/app/services/base_service.py](../backend/app/services/base_service.py) | Inicializa a classe BaseService. |
| F170 | `BaseService._buscar_ou_404` | [backend/app/services/base_service.py](../backend/app/services/base_service.py) | Busca o registro e retorna erro HTTP 404 quando ele não existe. |
| F171 | `BaseService.buscar_por_id` | [backend/app/services/base_service.py](../backend/app/services/base_service.py) | Busca um registro pelo identificador e retorna erro 404 quando ele não existe. |
| F172 | `BaseService.criar` | [backend/app/services/base_service.py](../backend/app/services/base_service.py) | Cria um novo registro usando o repositório associado ao serviço. |
| F173 | `BaseService.atualizar` | [backend/app/services/base_service.py](../backend/app/services/base_service.py) | Atualiza um registro existente usando o repositório associado ao serviço. |
| F174 | `BaseService.deletar` | [backend/app/services/base_service.py](../backend/app/services/base_service.py) | Remove um registro usando o repositório associado ao serviço. |
| F175 | `_macros_vazios` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Cria a estrutura de totais nutricionais zerados para iniciar um cálculo. |
| F176 | `DashboardService.__init__` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Inicializa a classe DashboardService. |
| F177 | `DashboardService._meta_agua_diaria` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Obtém a meta diária de consumo de água do usuário. |
| F178 | `DashboardService._somar_item` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Acrescenta ao total os nutrientes e calorias de um item consumido. |
| F179 | `DashboardService._macros_consumidos_refeicoes` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Soma calorias e macronutrientes dos itens das refeições do dia. |
| F180 | `DashboardService._streak_dias` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Calcula a sequência de dias em que o usuário registrou refeições. |
| F181 | `DashboardService._percentual` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Calcula o percentual de uma meta já atingido. |
| F182 | `DashboardService.resumo_dia` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Monta o resumo nutricional do dia, incluindo consumo e metas. |
| F183 | `DashboardService.evolucao_peso` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Retorna os registros usados para acompanhar a evolução do peso. |
| F184 | `DashboardService._resumo_periodo` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Agrega os dados de consumo e metas para um intervalo de datas. |
| F185 | `DashboardService.resumo_semana` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Monta o resumo nutricional dos últimos dias da semana. |
| F186 | `DashboardService.resumo_mes` | [backend/app/services/dashboard_service.py](../backend/app/services/dashboard_service.py) | Monta o resumo nutricional do mês. |
| F187 | `resend_configurado` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Verifica se as credenciais necessárias para envio pelo Resend estão configuradas. |
| F188 | `smtp_configurado` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Verifica se os parâmetros de conexão SMTP estão configurados. |
| F189 | `email_configurado` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Verifica se há algum serviço de envio de e-mail disponível. |
| F190 | `_corpo_codigo` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Monta o conteúdo da mensagem de e-mail que contém o código. |
| F191 | `_enviar_resend` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Envia a mensagem usando o serviço Resend. |
| F192 | `_enviar_smtp` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Envia a mensagem usando o servidor SMTP configurado. |
| F193 | `_entregar` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Escolhe e executa o canal configurado para entregar o e-mail. |
| F194 | `_enviar_codigo` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Monta e entrega uma mensagem com o código de confirmação. |
| F195 | `enviar_codigo_verificacao` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Envia o código usado para confirmar o endereço de e-mail. |
| F196 | `enviar_codigo_recuperacao_senha` | [backend/app/services/email_service.py](../backend/app/services/email_service.py) | Envia o código usado para redefinir a senha. |
| F197 | `FatAuthService.sign_params` | [backend/app/services/fatsecret_auth_service.py](../backend/app/services/fatsecret_auth_service.py) | Cria os parâmetros e a assinatura OAuth 1.0 usados na requisição ao FatSecret. |
| F198 | `FatSecretIndisponivel.__init__` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Inicializa a classe FatSecretIndisponivel. |
| F199 | `_classificar_erro` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Classifica a falha recebida do FatSecret para tratamento adequado. |
| F200 | `fonte_externa_bloqueada` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Verifica se a integração com a fonte externa está temporariamente bloqueada. |
| F201 | `motivo_fonte_externa_bloqueada` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Retorna a causa registrada para o bloqueio da fonte externa. |
| F202 | `_bloquear_fonte_externa` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Registra um bloqueio temporário para a integração externa. |
| F203 | `_liberar_fonte_externa` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Remove o bloqueio temporário da integração externa. |
| F204 | `_as_list` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Converte uma resposta da API em uma lista previsível de itens. |
| F205 | `_float` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Converte um valor recebido em número decimal, usando um padrão quando necessário. |
| F206 | `_normalizar` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Padroniza o texto usado para comparar nomes de alimentos. |
| F207 | `_parse_food_description` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Extrai os valores nutricionais da descrição de alimento retornada pelo FatSecret. |
| F208 | `FatSecretIndisponivel._to_float` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Converte texto numérico recebido da API em número decimal. |
| F209 | `_traduzir_erro_fatsecret` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Converte códigos de falha do FatSecret em mensagens compreensíveis. |
| F210 | `FatSecretService._request` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Executa uma requisição autenticada à API do FatSecret e trata falhas. |
| F211 | `FatSecretService.buscar_alimentos` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Pesquisa alimentos na API do FatSecret e normaliza os resultados. |
| F212 | `FatSecretService.buscar_alimento_por_id` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Obtém os dados de um alimento na API do FatSecret pelo identificador. |
| F213 | `FatSecretService.importar_alimento` | [backend/app/services/fatsecret_service.py](../backend/app/services/fatsecret_service.py) | Importa um alimento da base externa para o cadastro local. |
| F214 | `HistoricoProgressoService.__init__` | [backend/app/services/historico_progresso_service.py](../backend/app/services/historico_progresso_service.py) | Inicializa a classe HistoricoProgressoService. |
| F215 | `HistoricoProgressoService.criar` | [backend/app/services/historico_progresso_service.py](../backend/app/services/historico_progresso_service.py) | Valida e registra uma medição de progresso do usuário. |
| F216 | `HistoricoProgressoService.listar_por_usuario` | [backend/app/services/historico_progresso_service.py](../backend/app/services/historico_progresso_service.py) | Lista registros associados ao usuário autenticado. |
| F217 | `HistoricoProgressoService.listar_por_periodo` | [backend/app/services/historico_progresso_service.py](../backend/app/services/historico_progresso_service.py) | Lista registros dentro do intervalo informado. |
| F218 | `LembreteService.__init__` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Inicializa a classe LembreteService. |
| F219 | `LembreteService._get_config` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Obtém ou cria as configurações de lembrete da conta. |
| F220 | `LembreteService._config_to_dict` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Converte as configurações de lembrete para o formato usado pela API. |
| F221 | `LembreteService.buscar` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Retorna as configurações de lembrete do usuário. |
| F222 | `LembreteService.atualizar_agua` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Atualiza as preferências de lembrete para consumo de água. |
| F223 | `LembreteService.atualizar_refeicao` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Atualiza as preferências de lembrete para refeições. |
| F224 | `LembreteService._set_ativo` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Altera o estado de ativação dos lembretes e salva a configuração. |
| F225 | `LembreteService.ativar` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Ativa os lembretes configurados para o usuário. |
| F226 | `LembreteService.desativar` | [backend/app/services/lembrete_service.py](../backend/app/services/lembrete_service.py) | Desativa os lembretes do usuário. |
| F227 | `MetaNutriService.__init__` | [backend/app/services/meta_nutri_service.py](../backend/app/services/meta_nutri_service.py) | Inicializa a classe MetaNutriService. |
| F228 | `MetaNutriService.criar` | [backend/app/services/meta_nutri_service.py](../backend/app/services/meta_nutri_service.py) | Cria um novo registro de meta nutricional no sistema. |
| F229 | `MetaNutriService.listar_por_usuario` | [backend/app/services/meta_nutri_service.py](../backend/app/services/meta_nutri_service.py) | Lista registros associados ao usuário autenticado. |
| F230 | `MetaNutriService.meta_atual` | [backend/app/services/meta_nutri_service.py](../backend/app/services/meta_nutri_service.py) | Obtém a meta nutricional vigente para o usuário. |
| F231 | `NutricaoService.calcular_tmb` | [backend/app/services/nutricao_service.py](../backend/app/services/nutricao_service.py) | Calcula a taxa metabólica basal pela fórmula Mifflin-St Jeor. |
| F232 | `NutricaoService.calcular_calorias_diarias` | [backend/app/services/nutricao_service.py](../backend/app/services/nutricao_service.py) | Estima as calorias diárias com base na TMB, atividade e objetivo. |
| F233 | `NutricaoService.calcular_macros` | [backend/app/services/nutricao_service.py](../backend/app/services/nutricao_service.py) | Distribui as calorias diárias entre carboidratos, proteínas e gorduras. |
| F234 | `NutricaoService.calcular_macros_item` | [backend/app/services/nutricao_service.py](../backend/app/services/nutricao_service.py) | Ajusta calorias e macronutrientes à quantidade consumida do alimento. |
| F235 | `PerfilNutriService.__init__` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Inicializa a classe PerfilNutriService. |
| F236 | `PerfilNutriService.medidas_recentes` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Obtém as medidas recentes do usuário para cálculos nutricionais. |
| F237 | `PerfilNutriService.calcular_tmb` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Calcula a taxa metabólica basal pela fórmula Mifflin-St Jeor. |
| F238 | `PerfilNutriService.buscar_por_usuario` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Obtém o perfil nutricional associado ao usuário. |
| F239 | `PerfilNutriService.criar` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Cria um novo registro de perfil nutricional no sistema. |
| F240 | `PerfilNutriService.atualizar` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Atualiza os dados de perfil nutricional existente no sistema. |
| F241 | `PerfilNutriService.deletar` | [backend/app/services/perfil_nutri_service.py](../backend/app/services/perfil_nutri_service.py) | Remove o perfil nutricional associado ao usuário. |
| F242 | `QuizService.__init__` | [backend/app/services/quiz_service.py](../backend/app/services/quiz_service.py) | Inicializa a classe QuizService. |
| F243 | `QuizService.salvar` | [backend/app/services/quiz_service.py](../backend/app/services/quiz_service.py) | Persiste as respostas do questionário inicial do usuário. |
| F244 | `_hash_codigo` | [backend/app/services/recuperacao_senha_service.py](../backend/app/services/recuperacao_senha_service.py) | Gera um hash seguro para armazenar e comparar códigos de recuperação. |
| F245 | `RecuperacaoSenhaService.__init__` | [backend/app/services/recuperacao_senha_service.py](../backend/app/services/recuperacao_senha_service.py) | Inicializa a classe RecuperacaoSenhaService. |
| F246 | `RecuperacaoSenhaService.solicitar_codigo` | [backend/app/services/recuperacao_senha_service.py](../backend/app/services/recuperacao_senha_service.py) | Gera um código temporário e envia a mensagem de recuperação de senha. |
| F247 | `RecuperacaoSenhaService.redefinir` | [backend/app/services/recuperacao_senha_service.py](../backend/app/services/recuperacao_senha_service.py) | Confirma o código recebido e altera a senha da conta. |
| F248 | `RefeicaoService.__init__` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Inicializa a classe RefeicaoService. |
| F249 | `RefeicaoService.listar_por_usuario` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Lista registros associados ao usuário autenticado. |
| F250 | `RefeicaoService.listar_por_periodo` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Lista registros dentro do intervalo informado. |
| F251 | `RefeicaoService.listar_por_dia` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Lista refeições registradas em uma data. |
| F252 | `RefeicaoService.adicionar_item` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Adiciona um alimento à refeição. |
| F253 | `RefeicaoService.listar_itens` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Lista os alimentos associados a uma refeição. |
| F254 | `RefeicaoService.atualizar_item` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Atualiza a quantidade ou os dados de um alimento da refeição. |
| F255 | `RefeicaoService.remover_item` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Remove um alimento da refeição. |
| F256 | `RefeicaoService.resumo_macros_dia` | [backend/app/services/refeicao_service.py](../backend/app/services/refeicao_service.py) | Calcula o total diário de calorias e macronutrientes. |
| F257 | `RegistroAguaService.__init__` | [backend/app/services/registro_agua_service.py](../backend/app/services/registro_agua_service.py) | Inicializa a classe RegistroAguaService. |
| F258 | `RegistroAguaService.listar_por_usuario` | [backend/app/services/registro_agua_service.py](../backend/app/services/registro_agua_service.py) | Lista registros associados ao usuário autenticado. |
| F259 | `RegistroAguaService.total_dia` | [backend/app/services/registro_agua_service.py](../backend/app/services/registro_agua_service.py) | Calcula o total de água consumido pelo usuário em uma data. |
| F260 | `RegistroAguaService.listar_por_periodo` | [backend/app/services/registro_agua_service.py](../backend/app/services/registro_agua_service.py) | Lista registros dentro do intervalo informado. |
| F261 | `RelatorioService.__init__` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Inicializa a classe RelatorioService. |
| F262 | `RelatorioService._macros_por_dia` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Agrega calorias e macronutrientes consumidos em cada dia do período. |
| F263 | `RelatorioService._agua_por_dia` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Agrega o consumo de água de cada dia do período. |
| F264 | `RelatorioService._evolucao_peso` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Organiza as medições para apresentar a evolução do peso no relatório. |
| F265 | `RelatorioService._resumo_periodo` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Calcula totais e médias do período que será exportado. |
| F266 | `RelatorioService.gerar_relatorio_pdf` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Monta o relatório nutricional e gera o arquivo PDF. |
| F267 | `RelatorioService.gerar_dados_relatorio` | [backend/app/services/relatorio_service.py](../backend/app/services/relatorio_service.py) | Produz os dados agregados usados na exportação do relatório. |
| F268 | `_normalizar` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Padroniza texto de alimento para comparação e filtragem. |
| F269 | `_CacheBusca.get` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Obtém o valor armazenado para a chave de sugestão informada. |
| F270 | `_CacheBusca.set` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Salva o valor associado à chave de sugestão informada. |
| F271 | `_CacheBusca.buscar` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Pesquisa alimentos usados na composição de sugestões. |
| F272 | `SugestaoService.__init__` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Inicializa a classe SugestaoService. |
| F273 | `SugestaoService._buscar_alimentos_fatsecret` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Obtém candidatos a alimento na API do FatSecret. |
| F274 | `SugestaoService._para_100g` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Converte os nutrientes do alimento para uma base de 100 gramas. |
| F275 | `SugestaoService._filtrar_alimentos_por_macros` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Filtra alimentos que se encaixam nos macronutrientes desejados. |
| F276 | `SugestaoService._cabe_na_refeicao` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Verifica se o item pode ser incluído sem ultrapassar os limites da refeição. |
| F277 | `SugestaoService._erro` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Monta uma resposta de erro com o código e a mensagem informados. |
| F278 | `SugestaoService._macros_da_porcao` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Calcula os nutrientes de uma porção específica do alimento. |
| F279 | `SugestaoService._totalizar` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Soma calorias e nutrientes dos itens selecionados. |
| F280 | `SugestaoService._arredondar_porcao` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Arredonda uma porção para um valor prático de exibição. |
| F281 | `SugestaoService._selecionar_combinacao_otima` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Escolhe a combinação de alimentos mais próxima das metas nutricionais. |
| F282 | `SugestaoService._refinar_porcoes` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Ajusta as porções para aproximar a combinação das metas nutricionais. |
| F283 | `SugestaoService._importar_alimento_local` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Salva no catálogo local um alimento obtido de uma fonte externa. |
| F284 | `SugestaoService.gerar_todas` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Gera sugestões de refeições para os tipos disponíveis. |
| F285 | `SugestaoService._item_sugerido` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Monta a representação de um alimento dentro da sugestão de refeição. |
| F286 | `SugestaoService._tipo_normalizado` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Padroniza o tipo de refeição para comparações internas. |
| F287 | `SugestaoService._refeicoes_equivalentes` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Verifica se dois tipos de refeição representam a mesma categoria. |
| F288 | `SugestaoService._serializar` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Converte uma sugestão e seus itens para o formato de resposta da API. |
| F289 | `SugestaoService.listar_por_usuario` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Lista sugestões já geradas para o usuário. |
| F290 | `SugestaoService.desfazer` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Desfaz a aceitação anterior da sugestão de refeição. |
| F291 | `SugestaoService.aceitar` | [backend/app/services/sugestao_service.py](../backend/app/services/sugestao_service.py) | Confirma uma sugestão e registra a refeição correspondente. |
| F292 | `_normalizar` | [backend/app/services/taco_service.py](../backend/app/services/taco_service.py) | Padroniza nomes de alimentos para busca na tabela TACO. |
| F293 | `_to_float` | [backend/app/services/taco_service.py](../backend/app/services/taco_service.py) | Converte um valor da tabela TACO em número decimal. |
| F294 | `_formatar_nome_amigavel` | [backend/app/services/taco_service.py](../backend/app/services/taco_service.py) | Formata o nome técnico do alimento para exibição. |
| F295 | `TacoService._obter_dados_taco` | [backend/app/services/taco_service.py](../backend/app/services/taco_service.py) | Carrega os dados locais da Tabela Brasileira de Composição de Alimentos (TACO). |
| F296 | `TacoService.buscar_alimentos` | [backend/app/services/taco_service.py](../backend/app/services/taco_service.py) | Pesquisa alimentos na tabela brasileira TACO. |
| F297 | `UsuarioService.__init__` | [backend/app/services/usuario_service.py](../backend/app/services/usuario_service.py) | Inicializa a classe UsuarioService. |
| F298 | `UsuarioService.criar` | [backend/app/services/usuario_service.py](../backend/app/services/usuario_service.py) | Cria um novo registro de conta do usuário no sistema. |
| F299 | `UsuarioService.listar_todos` | [backend/app/services/usuario_service.py](../backend/app/services/usuario_service.py) | Lista as contas de usuário cadastradas. |
| F300 | `UsuarioService.atualizar` | [backend/app/services/usuario_service.py](../backend/app/services/usuario_service.py) | Atualiza os dados de conta do usuário existente no sistema. |
| F301 | `UsuarioService.desativar` | [backend/app/services/usuario_service.py](../backend/app/services/usuario_service.py) | Desativa a conta do usuário sem remover seus dados. |
| F302 | `_hash_codigo` | [backend/app/services/verificacao_email_service.py](../backend/app/services/verificacao_email_service.py) | Gera um hash seguro para armazenar e comparar códigos de verificação. |
| F303 | `_rejeitar_espera` | [backend/app/services/verificacao_email_service.py](../backend/app/services/verificacao_email_service.py) | Interrompe novo envio quando o intervalo mínimo entre códigos não passou. |
| F304 | `VerificacaoEmailService.__init__` | [backend/app/services/verificacao_email_service.py](../backend/app/services/verificacao_email_service.py) | Inicializa a classe VerificacaoEmailService. |
| F305 | `VerificacaoEmailService.enviar_codigo` | [backend/app/services/verificacao_email_service.py](../backend/app/services/verificacao_email_service.py) | Envia ao e-mail um código de verificação. |
| F306 | `VerificacaoEmailService.confirmar_codigo` | [backend/app/services/verificacao_email_service.py](../backend/app/services/verificacao_email_service.py) | Valida o código enviado e marca o e-mail do usuário como confirmado. |
| F571 | `FatAuthService._encode` | [backend/app/services/fatsecret_auth_service.py](../backend/app/services/fatsecret_auth_service.py) | Codifica valores para compor os parâmetros assinados pelo OAuth 1.0. |
